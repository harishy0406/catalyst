from pydantic import BaseModel
from typing import Optional, List, Any


class ChecklistItem(BaseModel):
    id: str
    text: str
    completed: bool


class TaskResponse(BaseModel):
    id: str
    title: str
    description: Optional[str] = None
    type: str
    zone: Optional[str] = None
    priority: str
    status: str
    assignedTo: Optional[str] = None
    machineId: Optional[str] = None
    estimatedMinutes: Optional[float] = None
    actualMinutes: Optional[float] = None
    scheduledAt: Optional[str] = None
    startedAt: Optional[str] = None
    completedAt: Optional[str] = None
    checklist: Optional[List[Any]] = None
    notes: Optional[str] = None


class TaskStartResponse(BaseModel):
    success: bool
    task: TaskResponse


class TaskCompleteRequest(BaseModel):
    actualMinutes: Optional[float] = None
    checklist: Optional[List[Any]] = None
    notes: Optional[str] = None


class TaskCompleteResponse(BaseModel):
    success: bool
    task: TaskResponse


class TaskStatusRequest(BaseModel):
    status: str
