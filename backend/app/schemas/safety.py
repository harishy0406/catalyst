from pydantic import BaseModel
from typing import Optional, List, Any


class SafetyRuleCreate(BaseModel):
    ruleType: str
    threshold: float
    comparison: str  # 'gt', 'lt', 'eq'
    durationSeconds: int = 0
    severity: str = "warning"
    action: str = "alert"


class SafetyRuleResponse(BaseModel):
    id: str
    ruleType: str
    threshold: float
    comparison: str
    durationSeconds: int
    severity: str
    action: str
    isActive: bool


class AlertResponse(BaseModel):
    id: str
    machineId: str
    operatorId: Optional[str] = None
    ruleId: Optional[str] = None
    severity: str
    message: str
    acknowledged: bool
    acknowledgedAt: Optional[str] = None
    acknowledgedBy: Optional[str] = None
    createdAt: str


class AlertAckResponse(BaseModel):
    success: bool
    alertId: str
    acknowledgedAt: str
