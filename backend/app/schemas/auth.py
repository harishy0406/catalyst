from pydantic import BaseModel
from typing import Optional


class LoginRequest(BaseModel):
    operatorId: str
    password: str


class OperatorInfo(BaseModel):
    id: str
    name: str
    role: str
    skillLevel: str
    activeMachineId: Optional[str] = None


class LoginResponse(BaseModel):
    token: str
    operator: OperatorInfo
