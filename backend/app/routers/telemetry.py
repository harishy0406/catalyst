from fastapi import APIRouter, HTTPException, Depends
from typing import Dict, Any, List, Optional
import uuid
from datetime import datetime

from app.database import execute_query
from app.dependencies import get_current_user
from app.schemas.telemetry import TelemetryIngestRequest, TelemetryResponse

router = APIRouter(prefix="/telemetry", tags=["telemetry"])


@router.post("", response_model=TelemetryResponse)
def ingest_telemetry(req: TelemetryIngestRequest):
    telemetry_id = f"TEL-{uuid.uuid4().hex[:8].upper()}"

    # Ingest record
    execute_query(
        """INSERT INTO telemetry
           (id, machine_id, operator_id, engine_rpm, fuel_rate, hydraulic_pressure,
            engine_temp, speed, odometer, latitude, longitude, recorded_at)
           VALUES (%s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, NOW())""",
        (
            telemetry_id,
            req.machineId,
            req.operatorId,
            req.engineRpm,
            req.fuelRate,
            req.hydraulicPressure,
            req.engineTemp,
            req.speed,
            req.odometer,
            req.latitude,
            req.longitude
        )
    )

    # Evaluate active safety rules
    rules = execute_query("SELECT * FROM safety_rules WHERE is_active = TRUE")
    alerts_triggered = []
    anomalies_detected = []

    for rule in rules:
        r_type = rule["rule_type"].lower()
        thresh = float(rule["threshold"])
        comp = rule["comparison"]
        val = None

        if r_type in ["engine_temp", "coolant_temp"] and req.engineTemp is not None:
            val = req.engineTemp
        elif r_type in ["hydraulic_pressure", "pressure"] and req.hydraulicPressure is not None:
            val = req.hydraulicPressure
        elif r_type in ["speed", "overspeed"] and req.speed is not None:
            val = req.speed
        elif r_type in ["engine_rpm", "rpm"] and req.engineRpm is not None:
            val = req.engineRpm
        elif r_type == "fuel_rate" and req.fuelRate is not None:
            val = req.fuelRate

        triggered = False
        if val is not None:
            if comp == "gt" and val > thresh:
                triggered = True
            elif comp == "lt" and val < thresh:
                triggered = True
            elif comp == "gte" and val >= thresh:
                triggered = True
            elif comp == "lte" and val <= thresh:
                triggered = True
            elif comp == "eq" and val == thresh:
                triggered = True

        if triggered:
            alert_id = f"ALT-{uuid.uuid4().hex[:6].upper()}"
            msg = f"Safety Rule Violated: {rule['rule_type']} value {val} exceeded threshold {thresh}"
            execute_query(
                """INSERT INTO alerts (id, machine_id, operator_id, rule_id, severity, message, created_at)
                   VALUES (%s, %s, %s, %s, %s, %s, NOW())""",
                (alert_id, req.machineId, req.operatorId, rule["id"], rule["severity"], msg)
            )
            alerts_triggered.append({
                "id": alert_id,
                "machineId": req.machineId,
                "severity": rule["severity"],
                "message": msg,
                "ruleId": rule["id"],
                "createdAt": datetime.utcnow().isoformat()
            })

    # Anomaly checks (e.g. engine running with 0 speed and high fuel = excessive idle)
    if (req.speed is not None and req.speed == 0) and (req.engineRpm is not None and req.engineRpm > 800):
        anomalies_detected.append({
            "type": "excessive_idling",
            "severity": "warning",
            "description": f"Machine {req.machineId} idling at {req.engineRpm} RPM with zero ground speed",
            "detectedAt": datetime.utcnow().isoformat()
        })

    return TelemetryResponse(
        success=True,
        telemetryId=telemetry_id,
        alertsTriggered=alerts_triggered,
        anomaliesDetected=anomalies_detected
    )


@router.get("/{machine_id}")
def get_latest_telemetry(machine_id: str, current_user: Dict[str, Any] = Depends(get_current_user)):
    rows = execute_query(
        "SELECT * FROM telemetry WHERE machine_id = %s ORDER BY recorded_at DESC LIMIT 1",
        (machine_id,)
    )
    if not rows:
        return {"machineId": machine_id, "telemetry": None}

    r = rows[0]
    return {
        "machineId": machine_id,
        "telemetry": {
            "id": r["id"],
            "engineRpm": float(r["engine_rpm"]) if r.get("engine_rpm") is not None else None,
            "fuelRate": float(r["fuel_rate"]) if r.get("fuel_rate") is not None else None,
            "hydraulicPressure": float(r["hydraulic_pressure"]) if r.get("hydraulic_pressure") is not None else None,
            "engineTemp": float(r["engine_temp"]) if r.get("engine_temp") is not None else None,
            "speed": float(r["speed"]) if r.get("speed") is not None else None,
            "odometer": float(r["odometer"]) if r.get("odometer") is not None else None,
            "latitude": float(r["latitude"]) if r.get("latitude") is not None else None,
            "longitude": float(r["longitude"]) if r.get("longitude") is not None else None,
            "recordedAt": r["recorded_at"].isoformat() if r.get("recorded_at") else None
        }
    }
