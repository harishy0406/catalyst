from fastapi import APIRouter, HTTPException, Depends, status
from typing import List, Dict, Any, Optional
import json
from datetime import datetime

from app.database import execute_query
from app.dependencies import get_current_user
from app.schemas.tasks import (
    TaskResponse,
    TaskStartResponse,
    TaskCompleteRequest,
    TaskCompleteResponse,
    TaskStatusRequest,
)

router = APIRouter(prefix="/tasks", tags=["tasks"])


def format_task_row(row: Dict[str, Any]) -> TaskResponse:
    checklist_val = row.get("checklist")
    if isinstance(checklist_val, str):
        try:
            checklist_val = json.loads(checklist_val)
        except Exception:
            checklist_val = []

    return TaskResponse(
        id=str(row["id"]),
        title=row.get("title", ""),
        description=row.get("description"),
        type=row.get("type", "general"),
        zone=row.get("zone"),
        priority=row.get("priority", "medium"),
        status=row.get("status", "pending"),
        assignedTo=row.get("assigned_to"),
        machineId=row.get("machine_id"),
        estimatedMinutes=float(row["estimated_minutes"]) if row.get("estimated_minutes") is not None else None,
        actualMinutes=float(row["actual_minutes"]) if row.get("actual_minutes") is not None else None,
        scheduledAt=row["scheduled_at"].isoformat() if row.get("scheduled_at") else None,
        startedAt=row["started_at"].isoformat() if row.get("started_at") else None,
        completedAt=row["completed_at"].isoformat() if row.get("completed_at") else None,
        checklist=checklist_val,
        notes=row.get("notes")
    )


@router.get("/today", response_model=List[TaskResponse])
def get_today_tasks(current_user: Dict[str, Any] = Depends(get_current_user)):
    user_id = current_user["id"]
    role = current_user.get("role", "operator")

    if role == "supervisor":
        rows = execute_query("SELECT * FROM tasks ORDER BY priority DESC, id ASC")
    else:
        rows = execute_query(
            "SELECT * FROM tasks WHERE assigned_to = %s OR assigned_to IS NULL ORDER BY priority DESC, id ASC",
            (user_id,)
        )

    return [format_task_row(r) for r in rows]


@router.get("/{task_id}", response_model=TaskResponse)
def get_task(task_id: str, current_user: Dict[str, Any] = Depends(get_current_user)):
    rows = execute_query("SELECT * FROM tasks WHERE id = %s", (task_id,))
    if not rows:
        raise HTTPException(status_code=404, detail="Task not found")
    return format_task_row(rows[0])


@router.post("/{task_id}/start", response_model=TaskStartResponse)
def start_task(task_id: str, current_user: Dict[str, Any] = Depends(get_current_user)):
    rows = execute_query("SELECT * FROM tasks WHERE id = %s", (task_id,))
    if not rows:
        raise HTTPException(status_code=404, detail="Task not found")

    execute_query(
        "UPDATE tasks SET status = 'in_progress', started_at = NOW() WHERE id = %s",
        (task_id,)
    )

    updated = execute_query("SELECT * FROM tasks WHERE id = %s", (task_id,))
    return TaskStartResponse(success=True, task=format_task_row(updated[0]))


@router.post("/{task_id}/complete", response_model=TaskCompleteResponse)
def complete_task(
    task_id: str,
    req: TaskCompleteRequest,
    current_user: Dict[str, Any] = Depends(get_current_user)
):
    rows = execute_query("SELECT * FROM tasks WHERE id = %s", (task_id,))
    if not rows:
        raise HTTPException(status_code=404, detail="Task not found")

    task = rows[0]
    estimated = float(task.get("estimated_minutes") or 45.0)
    actual = req.actualMinutes if req.actualMinutes is not None else estimated
    error_minutes = actual - estimated

    checklist_json = json.dumps(req.checklist) if req.checklist is not None else None

    # Update task
    execute_query(
        """UPDATE tasks
           SET status = 'completed',
               completed_at = NOW(),
               actual_minutes = %s,
               notes = COALESCE(%s, notes),
               checklist = COALESCE(%s, checklist)
           WHERE id = %s""",
        (actual, req.notes, checklist_json, task_id)
    )

    # Record into task_history for ML training & metrics
    execute_query(
        """INSERT INTO task_history
           (task_id, task_type, operator_id, machine_id, estimated_minutes, actual_minutes,
            error_minutes, weather_condition, operator_skill, machine_age_years)
           VALUES (%s, %s, %s, %s, %s, %s, %s, %s, %s, %s)""",
        (
            task_id,
            task.get("type", "general"),
            current_user["id"],
            task.get("machine_id", "CAT-320-01"),
            estimated,
            actual,
            error_minutes,
            "clear",
            current_user.get("skillLevel", "intermediate"),
            2.0
        )
    )

    updated = execute_query("SELECT * FROM tasks WHERE id = %s", (task_id,))
    return TaskCompleteResponse(success=True, task=format_task_row(updated[0]))


@router.post("/{task_id}/status")
def update_task_status(
    task_id: str,
    req: TaskStatusRequest,
    current_user: Dict[str, Any] = Depends(get_current_user)
):
    rows = execute_query("SELECT * FROM tasks WHERE id = %s", (task_id,))
    if not rows:
        raise HTTPException(status_code=404, detail="Task not found")

    execute_query("UPDATE tasks SET status = %s WHERE id = %s", (req.status, task_id))
    updated = execute_query("SELECT * FROM tasks WHERE id = %s", (task_id,))
    return {"success": True, "task": format_task_row(updated[0])}
