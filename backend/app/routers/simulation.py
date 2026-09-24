"""
Live demo stream: pushes synthetic readings through the real POST /telemetry pipeline (safety rules,
ML anomaly detection, alerts, auto-incidents), so the operator app and supervisor dashboard react
exactly as they would to a real machine. Rows are tagged source='simulation'.

State lives in this process, which is fine for the single Render instance.
"""
import asyncio
import logging
import time
from collections import deque
from datetime import datetime
from typing import Any, Deque, Dict, Literal, Optional

from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel, Field

from app.database import execute_query
from app.dependencies import get_current_user
from app.machine_types import machine_type_of
from app.routers.telemetry import ingest_telemetry
from app.schemas.telemetry import TelemetryIngestRequest
from app.simulation import TIMELINES, build_reading, build_trigger, phase_at, timeline_length, trigger_options

logger = logging.getLogger("catalyst.simulation")

router = APIRouter(prefix="/simulation", tags=["simulation"])

SUPERVISOR_ROLES = ("supervisor", "safety_officer", "admin")
# Hard wall-clock cap so a forgotten stream doesn't keep writing to the shared DB
MAX_SECONDS = 300


class StartRequest(BaseModel):
    scenario: Literal["safety_crisis", "machine_fault", "normal"] = "safety_crisis"
    interval_seconds: float = Field(3.0, ge=1.0, le=30.0)
    machine_id: str = "CAT-320-01"


class TriggerRequest(BaseModel):
    # "seatbelt" | "proximity" | "normal" | "anomaly:<id>" (see GET /simulation/status → triggers)
    event: str
    machine_id: Optional[str] = None


class _State:
    running = False
    scenario: Optional[str] = None
    machine_id: Optional[str] = None
    machine_type: Optional[str] = None
    operator_id: Optional[str] = None
    interval = 3.0
    tick = 0
    phase: Optional[str] = None
    started_at: Optional[float] = None
    started_iso: Optional[str] = None
    stop_reason: Optional[str] = None
    task: Optional[asyncio.Task] = None
    last_ml: Optional[Dict[str, Any]] = None
    events: Deque[Dict[str, Any]] = deque(maxlen=25)


state = _State()


def require_supervisor(user: Dict[str, Any] = Depends(get_current_user)) -> Dict[str, Any]:
    if user.get("role") not in SUPERVISOR_ROLES:
        raise HTTPException(status_code=403, detail="Only supervisors can control the demo stream")
    return user


def _resolve_machine(machine_id: str) -> tuple:
    rows = execute_query("SELECT id, model FROM machines WHERE id = %s", (machine_id,))
    if not rows:
        raise HTTPException(status_code=404, detail="Machine not found")
    mtype = machine_type_of(rows[0]["model"], rows[0]["id"])
    if not mtype:
        raise HTTPException(status_code=400, detail="The simulator supports excavators, bulldozers and wheel loaders only")
    ops = execute_query("SELECT id FROM users WHERE active_machine_id = %s AND role = 'operator' LIMIT 1", (machine_id,))
    return mtype, (ops[0]["id"] if ops else None)


def _log(kind: str, **data: Any):
    state.events.appendleft({"at": datetime.utcnow().isoformat(), "tick": state.tick, "phase": state.phase, "kind": kind, **data})


def _record(result: Any):
    """Keeps the interesting outcome of a reading for the dashboard's event feed."""
    for a in result.alertsTriggered:
        _log("alert", id=a["id"], severity=a["severity"], message=a["message"])
    for i in result.incidentsCreated:
        _log("incident", id=i["id"], message=i["description"])
    ml = result.mlPrediction
    if ml:
        state.last_ml = ml


async def _ingest(reading: TelemetryIngestRequest):
    # The DB layer is synchronous; run it off the event loop so the API stays responsive
    result = await asyncio.to_thread(ingest_telemetry, reading)
    _record(result)
    return result


async def _run():
    try:
        while state.running:
            # The timeline advances per reading (tick × interval), not by wall clock, so a slow DB
            # round-trip stretches the demo instead of skipping story beats
            timeline_s = state.tick * state.interval
            current = phase_at(state.scenario, timeline_s)
            if current is None or time.monotonic() - (state.started_at or 0) > MAX_SECONDS:
                state.stop_reason = "finished"
                break
            state.phase, progress = current
            state.tick += 1
            try:
                await _ingest(build_reading(state.machine_type, state.machine_id, state.operator_id, state.phase, progress))
            except Exception as e:  # keep streaming through a transient DB error
                logger.error(f"[Simulation] tick {state.tick} failed: {e}")
                _log("error", message=str(e))
            await asyncio.sleep(state.interval)
    finally:
        state.running = False
        state.phase = None


@router.post("/start")
async def start(req: StartRequest, _: Dict[str, Any] = Depends(require_supervisor)):
    mtype, operator_id = await asyncio.to_thread(_resolve_machine, req.machine_id)
    await _cancel()
    state.running = True
    state.scenario = req.scenario
    state.machine_id = req.machine_id
    state.machine_type = mtype
    state.operator_id = operator_id
    state.interval = req.interval_seconds
    state.tick = 0
    state.phase = None
    state.last_ml = None
    state.started_at = time.monotonic()
    state.started_iso = datetime.utcnow().isoformat()
    state.stop_reason = None
    state.events.clear()
    _log("start", message=f"{req.scenario} on {req.machine_id}")
    state.task = asyncio.create_task(_run())
    return snapshot()


async def _cancel():
    state.running = False
    if state.task and not state.task.done():
        state.task.cancel()
        try:
            await state.task
        except asyncio.CancelledError:
            pass
    state.task = None


@router.post("/stop")
async def stop(_: Dict[str, Any] = Depends(require_supervisor)):
    was_running = state.running
    await _cancel()
    if was_running:
        state.stop_reason = "stopped"
        _log("stop", message="Stopped by supervisor")
    return snapshot()


@router.post("/trigger-event")
async def trigger_event(req: TriggerRequest, _: Dict[str, Any] = Depends(require_supervisor)):
    machine_id = req.machine_id or state.machine_id or "CAT-320-01"
    mtype, operator_id = await asyncio.to_thread(_resolve_machine, machine_id)
    reading = build_trigger(mtype, machine_id, operator_id, req.event)
    if reading is None:
        raise HTTPException(status_code=400, detail=f"Unknown event '{req.event}'")
    result = await _ingest(reading)
    _log("trigger", message=req.event)
    return {"telemetryId": result.telemetryId, "alerts": result.alertsTriggered, "ml": result.mlPrediction, "status": snapshot()}


def snapshot(for_machine: Optional[str] = None) -> Dict[str, Any]:
    elapsed = state.tick * state.interval if state.running else None
    # Trigger buttons follow the machine picked in the dashboard, else the streamed one
    mtype = machine_type_of(None, for_machine) if for_machine else None
    mtype = mtype or state.machine_type or machine_type_of(None, state.machine_id or "CAT-320-01")
    return {
        "running": state.running,
        "scenario": state.scenario,
        "machineId": state.machine_id,
        "operatorId": state.operator_id,
        "intervalSeconds": state.interval,
        "tick": state.tick,
        "phase": state.phase,
        "elapsedSeconds": round(elapsed, 1) if elapsed is not None else None,
        "durationSeconds": timeline_length(state.scenario) if state.scenario else None,
        "startedAt": state.started_iso,
        "stopReason": state.stop_reason,
        "lastPrediction": state.last_ml,
        "events": list(state.events),
        "scenarios": list(TIMELINES.keys()),
        "triggers": trigger_options(mtype),
    }


@router.get("/status")
def status(machine_id: Optional[str] = None, user: Dict[str, Any] = Depends(get_current_user)):
    """Readable by any signed-in user: the operator app polls faster and shows a badge while it runs."""
    s = snapshot(machine_id)
    # True when the stream is feeding this operator's own machine
    s["forMe"] = s["running"] and s["machineId"] == user.get("activeMachineId")
    return s
