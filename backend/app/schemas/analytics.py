from pydantic import BaseModel
from typing import Optional, List, Dict, Any


class FleetSummary(BaseModel):
    totalMachines: int
    activeMachines: int
    idleMachines: int
    offlineMachines: int
    averageHealthScore: float


class TaskSummary(BaseModel):
    totalTasks: int
    completedTasks: int
    inProgressTasks: int
    pendingTasks: int
    completionRate: float


class SupervisorAnalyticsResponse(BaseModel):
    fleet: FleetSummary
    tasks: TaskSummary
    safetyAlerts: Dict[str, Any]
    activeIncidents: int
    operatorProductivity: List[Dict[str, Any]]
