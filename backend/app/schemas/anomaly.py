from pydantic import BaseModel
from typing import Optional, List, Dict, Any


class MachineInsightsResponse(BaseModel):
    machineId: str
    healthScore: int
    anomalies: List[Dict[str, Any]]
    recommendations: List[Dict[str, Any]]
    lastTelemetry: Optional[Dict[str, Any]] = None


class MachineResponse(BaseModel):
    id: str
    model: str
    # excavator | bulldozer | wheel_loader (None if the model name matches none of them)
    type: Optional[str] = None
    serialNumber: Optional[str] = None
    status: str
    operatingHours: float
    healthScore: int
    taskTypes: List[str] = []
