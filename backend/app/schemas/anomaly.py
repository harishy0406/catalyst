from pydantic import BaseModel
from typing import Optional, List, Dict, Any


class MachineInsightsResponse(BaseModel):
    machineId: str
    healthScore: int
    anomalies: List[Dict[str, Any]]
    recommendations: List[Dict[str, Any]]
    lastTelemetry: Optional[Dict[str, Any]] = None
