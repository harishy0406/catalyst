from fastapi import APIRouter, HTTPException, Depends
from typing import List, Dict, Any, Optional
import uuid
from datetime import datetime

from app.database import execute_query
from app.dependencies import get_current_user
from app.schemas.safety import SafetyRuleCreate, SafetyRuleResponse, AlertResponse, AlertAckResponse

router = APIRouter(prefix="/safety", tags=["safety"])


@router.get("/alerts", response_model=List[AlertResponse])
def get_alerts(
    machineId: Optional[str] = None,
    unacknowledgedOnly: bool = False,
    current_user: Dict[str, Any] = Depends(get_current_user)
):
    query = "SELECT * FROM alerts WHERE 1=1"
    params = []

    if machineId:
        query += " AND machine_id = %s"
        params.append(machineId)
    if unacknowledgedOnly:
        query += " AND acknowledged = FALSE"

    query += " ORDER BY created_at DESC LIMIT 50"
    rows = execute_query(query, tuple(params) if params else None)

    return [
        AlertResponse(
            id=r["id"],
            machineId=r["machine_id"],
            operatorId=r.get("operator_id"),
            ruleId=r.get("rule_id"),
            severity=r["severity"],
            message=r["message"],
            acknowledged=bool(r.get("acknowledged", False)),
            acknowledgedAt=r["acknowledged_at"].isoformat() if r.get("acknowledged_at") else None,
            acknowledgedBy=r.get("acknowledged_by"),
            createdAt=r["created_at"].isoformat() if r.get("created_at") else datetime.utcnow().isoformat()
        )
        for r in rows
    ]


@router.post("/alerts/{alert_id}/ack", response_model=AlertAckResponse)
def acknowledge_alert(alert_id: str, current_user: Dict[str, Any] = Depends(get_current_user)):
    rows = execute_query("SELECT * FROM alerts WHERE id = %s", (alert_id,))
    if not rows:
        raise HTTPException(status_code=404, detail="Alert not found")

    execute_query(
        """UPDATE alerts
           SET acknowledged = TRUE,
               acknowledged_at = NOW(),
               acknowledged_by = %s
           WHERE id = %s""",
        (current_user["id"], alert_id)
    )

    return AlertAckResponse(
        success=True,
        alertId=alert_id,
        acknowledgedAt=datetime.utcnow().isoformat()
    )


@router.get("/rules", response_model=List[SafetyRuleResponse])
def get_safety_rules(current_user: Dict[str, Any] = Depends(get_current_user)):
    rows = execute_query("SELECT * FROM safety_rules ORDER BY id ASC")
    return [
        SafetyRuleResponse(
            id=r["id"],
            ruleType=r["rule_type"],
            threshold=float(r["threshold"]),
            comparison=r["comparison"],
            durationSeconds=r.get("duration_seconds") or 0,
            severity=r["severity"],
            action=r.get("action") or "alert",
            isActive=bool(r.get("is_active", True))
        )
        for r in rows
    ]


@router.post("/rules", response_model=SafetyRuleResponse)
def create_or_update_rule(req: SafetyRuleCreate, current_user: Dict[str, Any] = Depends(get_current_user)):
    rule_id = f"RULE-{uuid.uuid4().hex[:6].upper()}"

    execute_query(
        """INSERT INTO safety_rules
           (id, rule_type, threshold, comparison, duration_seconds, severity, action, is_active)
           VALUES (%s, %s, %s, %s, %s, %s, %s, TRUE)""",
        (
            rule_id,
            req.ruleType,
            req.threshold,
            req.comparison,
            req.durationSeconds,
            req.severity,
            req.action
        )
    )

    rows = execute_query("SELECT * FROM safety_rules WHERE id = %s", (rule_id,))
    r = rows[0]
    return SafetyRuleResponse(
        id=r["id"],
        ruleType=r["rule_type"],
        threshold=float(r["threshold"]),
        comparison=r["comparison"],
        durationSeconds=r.get("duration_seconds") or 0,
        severity=r["severity"],
        action=r.get("action") or "alert",
        isActive=bool(r.get("is_active", True))
    )
