from fastapi import APIRouter, HTTPException, Depends
from typing import Dict, Any, List
from datetime import datetime

from app.database import execute_query
from app.dependencies import get_current_user
from app.schemas.anomaly import MachineInsightsResponse

router = APIRouter(prefix="/machines", tags=["machines"])


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
        last_tel = {
            "id": t["id"],
            "engineRpm": float(t["engine_rpm"]) if t.get("engine_rpm") is not None else None,
            "fuelRate": float(t["fuel_rate"]) if t.get("fuel_rate") is not None else None,
            "hydraulicPressure": float(t["hydraulic_pressure"]) if t.get("hydraulic_pressure") is not None else None,
            "engineTemp": float(t["engine_temp"]) if t.get("engine_temp") is not None else None,
            "speed": float(t["speed"]) if t.get("speed") is not None else None,
            "recordedAt": t["recorded_at"].isoformat() if t.get("recorded_at") else None
        }

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
