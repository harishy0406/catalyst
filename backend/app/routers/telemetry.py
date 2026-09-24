from fastapi import APIRouter, Depends
from typing import Dict, Any, List, Optional
import json
import uuid
from datetime import datetime

from app.database import execute_query
from app.dependencies import get_current_user
from app.schemas.telemetry import TelemetryIngestRequest, TelemetryResponse
from app.inference.services.anomaly_service import anomaly_service
import logging

logger = logging.getLogger("catalyst.telemetry")

router = APIRouter(prefix="/telemetry", tags=["telemetry"])

# Built-in cab safety rules (in addition to the configurable rows in safety_rules)
SEATBELT_MIN_SPEED_KMH = 2.0
PROXIMITY_WARNING_M = 5.0
PROXIMITY_CRITICAL_M = 3.0
# A critical alert left unacknowledged this long is escalated to an incident for the supervisor
INCIDENT_AFTER_SECONDS = 20

INCIDENT_TYPES = {
    "RULE-SEATBELT": "seatbelt_violation",
    "RULE-PROXIMITY-CRIT": "proximity_hazard",
}


def _now() -> str:
    return datetime.utcnow().isoformat()


def raise_alert(
    machine_id: str, operator_id: Optional[str], rule_id: str, severity: str, message: str, source: str
) -> Optional[Dict[str, Any]]:
    """Creates an alert unless the same rule already has an unacknowledged one on this machine,
    so a condition that persists across readings produces one alert, not one per reading."""
    open_alert = execute_query(
        "SELECT id FROM alerts WHERE machine_id = %s AND rule_id = %s AND acknowledged = FALSE LIMIT 1",
        (machine_id, rule_id),
    )
    if open_alert:
        return None
    alert_id = f"ALT-{uuid.uuid4().hex[:6].upper()}"
    execute_query(
        """INSERT INTO alerts (id, machine_id, operator_id, rule_id, severity, message, source, created_at)
           VALUES (%s, %s, %s, %s, %s, %s, %s, NOW())""",
        (alert_id, machine_id, operator_id, rule_id, severity, message, source),
    )
    return {"id": alert_id, "machineId": machine_id, "severity": severity, "message": message, "ruleId": rule_id, "createdAt": _now()}


def escalate_unacknowledged(machine_id: str, source: str) -> List[Dict[str, Any]]:
    """One incident per critical alert that has sat unacknowledged for INCIDENT_AFTER_SECONDS."""
    stale = execute_query(
        """SELECT a.id, a.operator_id, a.rule_id, a.message,
                  EXTRACT(EPOCH FROM (NOW() - a.created_at))::int AS age
           FROM alerts a
           WHERE a.machine_id = %s AND a.acknowledged = FALSE AND a.severity = 'critical'
             AND a.created_at < NOW() - make_interval(secs => %s)
             AND NOT EXISTS (SELECT 1 FROM incidents i WHERE i.alert_id = a.id)""",
        (machine_id, INCIDENT_AFTER_SECONDS),
    )
    created = []
    for a in stale:
        inc_id = f"INC-{uuid.uuid4().hex[:4].upper()}"
        inc_type = INCIDENT_TYPES.get(a["rule_id"] or "", "machine_fault" if (a["rule_id"] or "").startswith("ML-") else "safety_violation")
        description = f"Auto-logged: {a['message']} Alert {a['id']} was not acknowledged for {a['age']}s."
        execute_query(
            """INSERT INTO incidents (id, incident_type, description, severity, status, reported_by, machine_id, alert_id, source, reported_at)
               VALUES (%s, %s, %s, 'high', 'open', %s, %s, %s, %s, NOW())""",
            (inc_id, inc_type, description, a["operator_id"] or "SYSTEM", machine_id, a["id"], source),
        )
        created.append({"id": inc_id, "incidentType": inc_type, "alertId": a["id"], "description": description})
    return created


@router.post("", response_model=TelemetryResponse)
def ingest_telemetry(req: TelemetryIngestRequest):
    telemetry_id = f"TEL-{uuid.uuid4().hex[:8].upper()}"
    source = req.source or "live"

    execute_query(
        """INSERT INTO telemetry
           (id, machine_id, operator_id, engine_rpm, fuel_rate, hydraulic_pressure, engine_temp, speed, odometer,
            latitude, longitude, seatbelt_fastened, proximity_m, features, source, recorded_at)
           VALUES (%s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, NOW())""",
        (
            telemetry_id, req.machineId, req.operatorId, req.engineRpm, req.fuelRate, req.hydraulicPressure,
            req.engineTemp, req.speed, req.odometer, req.latitude, req.longitude,
            req.seatbeltFastened, req.proximityM, json.dumps(req.features) if req.features else None, source,
        ),
    )

    alerts_triggered: List[Dict[str, Any]] = []
    anomalies_detected: List[Dict[str, Any]] = []

    def alert(rule_id: str, severity: str, message: str):
        a = raise_alert(req.machineId, req.operatorId, rule_id, severity, message, source)
        if a:
            alerts_triggered.append(a)

    # Configurable threshold rules
    for rule in execute_query("SELECT * FROM safety_rules WHERE is_active = TRUE"):
        r_type = rule["rule_type"].lower()
        thresh = float(rule["threshold"])
        val = {
            "engine_temp": req.engineTemp, "coolant_temp": req.engineTemp,
            "hydraulic_pressure": req.hydraulicPressure, "pressure": req.hydraulicPressure,
            "speed": req.speed, "overspeed": req.speed,
            "engine_rpm": req.engineRpm, "rpm": req.engineRpm,
            "fuel_rate": req.fuelRate,
        }.get(r_type)
        if val is None:
            continue
        triggered = {
            "gt": val > thresh, "lt": val < thresh, "gte": val >= thresh, "lte": val <= thresh, "eq": val == thresh,
        }.get(rule["comparison"], False)
        if triggered:
            alert(rule["id"], rule["severity"], f"Safety Rule Violated: {rule['rule_type']} value {val} exceeded threshold {thresh}")

    # Cab safety: seatbelt and proximity sensors
    if req.seatbeltFastened is False and (req.speed or 0) > SEATBELT_MIN_SPEED_KMH:
        alert("RULE-SEATBELT", "critical", f"Seatbelt unbuckled while moving at {req.speed:.0f} km/h. Stop and fasten seatbelt.")
    if req.proximityM is not None:
        if req.proximityM < PROXIMITY_CRITICAL_M:
            alert("RULE-PROXIMITY-CRIT", "critical", f"Person or obstacle {req.proximityM:.1f} m from machine. Stop all movement.")
        elif req.proximityM < PROXIMITY_WARNING_M:
            alert("RULE-PROXIMITY-WARN", "warning", f"Object within warning zone: {req.proximityM:.1f} m. Slow down and check surroundings.")

    # Heuristic anomaly check: engine running with 0 speed and high RPM
    if (req.speed is not None and req.speed == 0) and (req.engineRpm is not None and req.engineRpm > 800):
        anomalies_detected.append({
            "type": "excessive_idling",
            "severity": "warning",
            "description": f"Machine {req.machineId} idling at {req.engineRpm} RPM with zero ground speed",
            "detectedAt": _now(),
        })

    # Machine Learning Anomaly Detection (Random Forest multi-class model)
    ml_pred: Optional[Dict[str, Any]] = None
    try:
        m_rows = execute_query("SELECT model, operating_hours FROM machines WHERE id = %s", (req.machineId,))
        m = m_rows[0] if m_rows else {}
        ml_pred = anomaly_service.predict({
            "machine_type": str(m.get("model") or ""),
            "context": {"machine_id": req.machineId, "operator_id": req.operatorId, "timestamp": _now()},
            # Extra model features (e.g. swing speed, track slip) first; CAN readings fill the rest.
            # Anything still missing is filled with the model's normal profile by the service.
            "telemetry": {
                **(req.features or {}),
                "engine_rpm": req.engineRpm,
                "engine_temp": req.engineTemp,
                "hydraulic_pressure": req.hydraulicPressure,
                "fuel_rate": req.fuelRate,
                "speed": req.speed,
            },
            "machine_context": {"machine_hours": m.get("operating_hours")},
        })

        if ml_pred.get("isAnomaly"):
            pred = ml_pred.get("prediction", "anomaly")
            sev = "critical" if any(w in pred for w in ["Overheating", "Stress"]) else "warning"
            anomalies_detected.append({
                "type": pred,
                "severity": sev,
                "description": ml_pred.get("message", "AI detected unusual behavior"),
                "recommendedAction": ml_pred.get("recommendedAction"),
                "confidence": ml_pred.get("confidence"),
                "detectedAt": _now(),
            })
            alert(f"ML-{pred}", sev, f"[AI Alert] {ml_pred.get('message')} - Action: {ml_pred.get('recommendedAction')}")
    except Exception as ml_err:
        logger.error(f"[Telemetry] ML Anomaly evaluation error: {ml_err}")

    incidents_created = escalate_unacknowledged(req.machineId, source)

    return TelemetryResponse(
        success=True,
        telemetryId=telemetry_id,
        alertsTriggered=alerts_triggered,
        anomaliesDetected=anomalies_detected,
        incidentsCreated=incidents_created,
        mlPrediction={k: ml_pred[k] for k in ("prediction", "isAnomaly", "confidencePercent")} if ml_pred else None,
    )


def format_telemetry_row(r: Dict[str, Any]) -> Dict[str, Any]:
    num = lambda k: float(r[k]) if r.get(k) is not None else None  # noqa: E731
    return {
        "id": r["id"],
        "engineRpm": num("engine_rpm"),
        "fuelRate": num("fuel_rate"),
        "hydraulicPressure": num("hydraulic_pressure"),
        "engineTemp": num("engine_temp"),
        "speed": num("speed"),
        "odometer": num("odometer"),
        "latitude": num("latitude"),
        "longitude": num("longitude"),
        "seatbeltFastened": r.get("seatbelt_fastened"),
        "proximityM": num("proximity_m"),
        "features": r.get("features"),
        "source": r.get("source") or "live",
        "recordedAt": r["recorded_at"].isoformat() if r.get("recorded_at") else None,
    }


@router.get("/{machine_id}")
def get_latest_telemetry(machine_id: str, current_user: Dict[str, Any] = Depends(get_current_user)):
    rows = execute_query(
        "SELECT * FROM telemetry WHERE machine_id = %s ORDER BY recorded_at DESC LIMIT 1",
        (machine_id,)
    )
    return {"machineId": machine_id, "telemetry": format_telemetry_row(rows[0]) if rows else None}
