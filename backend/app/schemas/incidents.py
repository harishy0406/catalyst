from pydantic import BaseModel
from typing import Optional, List, Any


class IncidentCreate(BaseModel):
    incidentType: str
    description: str
    severity: str = "medium"
    machineId: Optional[str] = None
    taskId: Optional[str] = None
    photos: Optional[List[str]] = []


class IncidentUpdate(BaseModel):
    status: Optional[str] = None
    resolutionNotes: Optional[str] = None


class IncidentResponse(BaseModel):
    id: str
    incidentType: str
    description: str
    severity: str
    status: str
    reportedBy: str
    reportedAt: str
    machineId: Optional[str] = None
    taskId: Optional[str] = None
    photos: Optional[List[str]] = []
    resolutionNotes: Optional[str] = None
    resolvedAt: Optional[str] = None
