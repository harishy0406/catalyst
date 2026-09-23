from fastapi import APIRouter, HTTPException, Depends
from typing import List, Dict, Any, Optional
import uuid
import json
from datetime import datetime

from app.database import execute_query
from app.dependencies import get_current_user
from app.schemas.incidents import IncidentCreate, IncidentUpdate, IncidentResponse

router = APIRouter(prefix="/incidents", tags=["incidents"])


def format_incident_row(r: Dict[str, Any]) -> IncidentResponse:
    photos_val = r.get("photos")
    if isinstance(photos_val, str):
        try:
            photos_val = json.loads(photos_val)
        except Exception:
            photos_val = []

    return IncidentResponse(
        id=r["id"],
        incidentType=r["incident_type"],
        description=r["description"],
        severity=r["severity"],
        status=r["status"],
        reportedBy=r["reported_by"],
        reportedAt=r["reported_at"].isoformat() if r.get("reported_at") else datetime.utcnow().isoformat(),
        machineId=r.get("machine_id"),
        taskId=r.get("task_id"),
        photos=photos_val or [],
        resolutionNotes=r.get("resolution_notes"),
        resolvedAt=r["resolved_at"].isoformat() if r.get("resolved_at") else None
    )


@router.get("", response_model=List[IncidentResponse])
def get_incidents(
    status: Optional[str] = None,
    machineId: Optional[str] = None,
    current_user: Dict[str, Any] = Depends(get_current_user)
):
    query = "SELECT * FROM incidents WHERE 1=1"
    params = []

    if status:
        query += " AND status = %s"
        params.append(status)
    if machineId:
        query += " AND machine_id = %s"
        params.append(machineId)

    query += " ORDER BY reported_at DESC"
    rows = execute_query(query, tuple(params) if params else None)
    return [format_incident_row(r) for r in rows]


@router.get("/{incident_id}", response_model=IncidentResponse)
def get_incident(incident_id: str, current_user: Dict[str, Any] = Depends(get_current_user)):
    rows = execute_query("SELECT * FROM incidents WHERE id = %s", (incident_id,))
    if not rows:
        raise HTTPException(status_code=404, detail="Incident not found")
    return format_incident_row(rows[0])


@router.post("", response_model=IncidentResponse)
def create_incident(req: IncidentCreate, current_user: Dict[str, Any] = Depends(get_current_user)):
    if not req.description.strip():
        raise HTTPException(status_code=400, detail="Incident description is required")

    incident_id = f"INC-{uuid.uuid4().hex[:6].upper()}"
    photos_json = json.dumps(req.photos) if req.photos else "[]"

    execute_query(
        """INSERT INTO incidents
           (id, incident_type, description, severity, status, reported_by,
            reported_at, machine_id, task_id, photos)
           VALUES (%s, %s, %s, %s, 'open', %s, NOW(), %s, %s, %s)""",
        (
            incident_id,
            req.incidentType,
            req.description,
            req.severity,
            current_user["id"],
            req.machineId,
            req.taskId,
            photos_json
        )
    )

    rows = execute_query("SELECT * FROM incidents WHERE id = %s", (incident_id,))
    return format_incident_row(rows[0])


@router.patch("/{incident_id}", response_model=IncidentResponse)
def update_incident(
    incident_id: str,
    req: IncidentUpdate,
    current_user: Dict[str, Any] = Depends(get_current_user)
):
    rows = execute_query("SELECT * FROM incidents WHERE id = %s", (incident_id,))
    if not rows:
        raise HTTPException(status_code=404, detail="Incident not found")

    new_status = req.status or rows[0]["status"]
    notes = req.resolutionNotes or rows[0].get("resolution_notes")

    if new_status == "resolved":
        execute_query(
            """UPDATE incidents
               SET status = %s, resolution_notes = %s, resolved_at = NOW()
               WHERE id = %s""",
            (new_status, notes, incident_id)
        )
    else:
        execute_query(
            """UPDATE incidents
               SET status = %s, resolution_notes = %s
               WHERE id = %s""",
            (new_status, notes, incident_id)
        )

    updated = execute_query("SELECT * FROM incidents WHERE id = %s", (incident_id,))
    return format_incident_row(updated[0])
