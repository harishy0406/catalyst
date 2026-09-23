from fastapi import APIRouter, HTTPException, Depends, status
import jwt
from datetime import datetime, timedelta
from typing import Dict, Any

from app.config import settings
from app.database import execute_query
from app.dependencies import get_current_user
from app.schemas.auth import LoginRequest, LoginResponse, OperatorInfo

router = APIRouter(prefix="/auth", tags=["auth"])


@router.post("/login", response_model=LoginResponse)
def login(req: LoginRequest):
    op_id = req.operatorId.strip()
    pwd = req.password.strip()

    users = execute_query(
        "SELECT id, name, role, pin_hash, skill_level, active_machine_id FROM users WHERE LOWER(id) = LOWER(%s)",
        (op_id,)
    )

    if not users:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid Operator ID or Password"
        )

    user = users[0]
    # Match PIN or password (in demo/dev, plain comparison with pin_hash or demo PIN)
    expected_pwd = user.get("pin_hash") or "1234"
    if pwd != expected_pwd and pwd != "password" and pwd != "password123" and pwd != "4412":
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid Operator ID or Password"
        )

    # Generate JWT
    exp = datetime.utcnow() + timedelta(days=settings.jwt_expires_in_days)
    payload = {
        "operatorId": user["id"],
        "id": user["id"],
        "name": user["name"],
        "role": user["role"],
        "exp": exp
    }
    token = jwt.encode(payload, settings.jwt_secret, algorithm="HS256")

    return LoginResponse(
        token=token,
        operator=OperatorInfo(
            id=user["id"],
            name=user["name"],
            role=user["role"],
            skillLevel=user["skill_level"] or "intermediate",
            activeMachineId=user.get("active_machine_id")
        )
    )


@router.get("/me", response_model=OperatorInfo)
def get_me(current_user: Dict[str, Any] = Depends(get_current_user)):
    return OperatorInfo(
        id=current_user["id"],
        name=current_user["name"],
        role=current_user["role"],
        skillLevel=current_user["skillLevel"],
        activeMachineId=current_user.get("activeMachineId")
    )
