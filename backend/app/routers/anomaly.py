from fastapi import APIRouter, HTTPException, Depends
from typing import Dict, Any, List
from datetime import datetime

from app.database import execute_query
from app.dependencies import get_current_user
from app.schemas.anomaly import MachineInsightsResponse, MachineResponse
from app.machine_types import machine_type_of, TASKS_BY_MACHINE
from app.routers.telemetry import format_telemetry_row
from app.inference.services.anomaly_service import anomaly_service
import logging

logger = logging.getLogger("catalyst.anomaly")

router = APIRouter(prefix="/machines", tags=["machines"])


@router.get("/{machine_id}", response_model=MachineResponse)
def get_machine(machine_id: str, current_user: Dict[str, Any] = Depends(get_current_user)):
    rows = execute_query("SELECT * FROM machines WHERE id = %s", (machine_id,))
    if not rows:
        raise HTTPException(status_code=404, detail="Machine not found")
    m = rows[0]
    mtype = machine_type_of(m.get("model"), m["id"])
    return MachineResponse(
        id=m["id"],
        model=m["model"],
        type=mtype,
        serialNumber=m.get("serial_number"),
        status=m.get("status") or "active",
        operatingHours=float(m.get("operating_hours") or 0),
        healthScore=int(m.get("health_score") or 0),
        taskTypes=TASKS_BY_MACHINE.get(mtype, []) if mtype else [],
    )


@router.get("/{machine_id}/insights", response_model=MachineInsightsResponse)
def get_machine_insights(machine_id: str, current_user: Dict[str, Any] = Depends(get_current_user)):
    # Check machine exists
    machines = execute_query("SELECT * FROM machines WHERE id = %s", (machine_id,))
    if not machines:
        raise HTTPException(status_code=404, detail="Machine not found")

    m = machines[0]
    base_health = int(m.get("health_score") or 92)

    # Get recent telemetry
    telemetry_rows = execute_query(
        "SELECT * FROM telemetry WHERE machine_id = %s ORDER BY recorded_at DESC LIMIT 1",
        (machine_id,)
    )

    last_tel = None
    anomalies: List[Dict[str, Any]] = []
    recommendations: List[Dict[str, Any]] = []

    if telemetry_rows:
        t = telemetry_rows[0]
        last_tel = format_telemetry_row(t)

        # Check telemetry thresholds
        if t.get("engine_temp") and float(t["engine_temp"]) > 100:
            anomalies.append({
                "component": "Cooling System",
                "severity": "critical" if float(t["engine_temp"]) > 105 else "warning",
                "metric": "Engine Temperature",
                "value": f"{t['engine_temp']} °C",
                "description": "Operating above normal thermal operating range (80-95 °C)"
            })
            recommendations.append({
                "action": "Inspect Radiator & Coolant Level",
                "priority": "high",
                "reason": "Elevated coolant temperature detected during active excavation."
            })
            base_health -= 15

        if t.get("hydraulic_pressure") and float(t["hydraulic_pressure"]) > 320:
            anomalies.append({
                "component": "Hydraulic Circuit",
                "severity": "warning",
                "metric": "Main Pump Pressure",
                "value": f"{t['hydraulic_pressure']} bar",
                "description": "Transient pressure spike near relief valve limit (350 bar)"
            })
            recommendations.append({
                "action": "Check Hydraulic Return Filter",
                "priority": "medium",
                "reason": "Intermittent circuit backpressure spike observed."
            })
            base_health -= 8

        # AI Predictive Fleet Anomaly Evaluation (Random Forest multi-class model)
        try:
            mtype = str(m.get("model") or "excavator").lower()
            ml_pred = anomaly_service.predict({
                "machine_type": mtype,
                "context": {
                    "machine_id": machine_id,
                    "operator_id": m.get("assigned_operator_id"),
                    "task_type": "excavation" if "exc" in mtype else "dozing" if "doz" in mtype else "loading",
                    "timestamp": t["recorded_at"].isoformat() if t.get("recorded_at") else datetime.utcnow().isoformat()
                },
                "telemetry": {
                    # Missing readings are filled with the model's normal profile by the service
                    **(t.get("features") or {}),
                    "engine_rpm": t.get("engine_rpm"),
                    "engine_temp": t.get("engine_temp"),
                    "hydraulic_pressure": t.get("hydraulic_pressure"),
                    "fuel_rate": t.get("fuel_rate"),
                    "speed": t.get("speed"),
                },
                "machine_context": {
                    "machine_hours": float(m.get("operating_hours") or 2500),
                }
            })

            if ml_pred.get("isAnomaly"):
                anomalies.append({
                    "component": "AI Predictive Fleet Diagnostics",
                    "severity": "critical" if any(w in ml_pred["prediction"] for w in ["Overheating", "Stress"]) else "warning",
                    "metric": ml_pred["prediction"],
                    "value": f"{ml_pred['confidencePercent']}% confidence",
                    "description": ml_pred["message"]
                })
                recommendations.append({
                    "action": ml_pred["recommendedAction"],
                    "priority": "high" if any(w in ml_pred["prediction"] for w in ["Overheating", "Stress"]) else "medium",
                    "reason": f"AI model flagged {ml_pred['prediction']} with {ml_pred['confidencePercent']}% confidence."
                })
                base_health -= 15
        except Exception as e:
            logger.error(f"[Insights] ML Anomaly evaluation error: {e}")

    # Check unresolved alerts
    active_alerts = execute_query(
        "SELECT * FROM alerts WHERE machine_id = %s AND acknowledged = FALSE",
        (machine_id,)
    )
    for a in active_alerts:
        anomalies.append({
            "component": "Safety / Operator System",
            "severity": a["severity"],
            "metric": "Unacknowledged Alert",
            "value": a["id"],
            "description": a["message"]
        })
        base_health -= 5

    # Always ensure baseline recommendation
    if not recommendations:
        recommendations.append({
            "action": "Normal Operating Condition",
            "priority": "low",
            "reason": "All major engine, transmission, and hydraulic systems within normal specifications."
        })

    health_score = max(20, min(100, base_health))

    return MachineInsightsResponse(
        machineId=machine_id,
        healthScore=health_score,
        anomalies=anomalies,
        recommendations=recommendations,
        lastTelemetry=last_tel
    )
