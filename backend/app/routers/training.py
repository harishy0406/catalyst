from fastapi import APIRouter, HTTPException, Depends
from typing import List, Dict, Any, Optional
from datetime import datetime

from app.database import execute_query
from app.dependencies import get_current_user
from app.schemas.training import (
    TrainingContentResponse,
    RecommendationItem,
    TrainingRecommendationsResponse,
    TrainingCompleteResponse
)

router = APIRouter(prefix="/training", tags=["training"])


@router.get("/content", response_model=List[TrainingContentResponse])
def get_training_content(current_user: Dict[str, Any] = Depends(get_current_user)):
    rows = execute_query("SELECT * FROM training_content ORDER BY duration_minutes ASC")
    return [
        TrainingContentResponse(
            id=r["id"],
            title=r["title"],
            category=r["category"],
            durationMinutes=int(r["duration_minutes"]),
            format=r["format"],
            url=r.get("url"),
            content=r.get("content")
        )
        for r in rows
    ]


@router.get("/recommendations", response_model=TrainingRecommendationsResponse)
def get_training_recommendations(current_user: Dict[str, Any] = Depends(get_current_user)):
    user_id = current_user["id"]
    skill_level = current_user.get("skillLevel", "intermediate")

    # Fetch completed modules for this operator
    completed_rows = execute_query(
        "SELECT content_id FROM operator_training WHERE operator_id = %s",
        (user_id,)
    )
    completed_ids = {r["content_id"] for r in completed_rows}

    # Fetch available content
    all_content = execute_query("SELECT * FROM training_content")

    # Contextual recommendation logic:
    # 1. Check if operator had recent safety alerts
    recent_alerts = execute_query(
        "SELECT rule_id FROM alerts WHERE operator_id = %s ORDER BY created_at DESC LIMIT 5",
        (user_id,)
    )
    has_temp_alert = any("TEMP" in str(a.get("rule_id", "")).upper() for a in recent_alerts)

    recommendations: List[RecommendationItem] = []
    for c in all_content:
        cid = c["id"]
        if cid in completed_ids:
            continue

        cat = c["category"].lower()
        reason = "Recommended for continuous operator advancement"
        urgency = "low"

        if "safety" in cat:
            reason = "Standard OSHA/CAT compliance refresher"
            urgency = "medium"
        elif "eco" in cat or "efficiency" in cat:
            reason = "Targeted to reduce idle fuel burn and cycle times"
            urgency = "medium"
        elif "hydraulic" in cat and has_temp_alert:
            reason = "Triggered by recent hydraulic and engine alert telemetry"
            urgency = "high"

        if skill_level in ["novice", "beginner"] and "basics" in c["title"].lower():
            reason = "Core fundamental module tailored to current skill level"
            urgency = "high"

        recommendations.append(
            RecommendationItem(
                contentId=cid,
                title=c["title"],
                category=c["category"],
                durationMinutes=int(c["duration_minutes"]),
                format=c["format"],
                reason=reason,
                urgency=urgency
            )
        )

    # Sort high urgency first
    urgency_order = {"high": 0, "medium": 1, "low": 2}
    recommendations.sort(key=lambda x: urgency_order.get(x.urgency, 3))

    return TrainingRecommendationsResponse(
        operatorId=user_id,
        skillLevel=skill_level,
        recommendations=recommendations
    )


@router.post("/{content_id}/complete", response_model=TrainingCompleteResponse)
def complete_training(content_id: str, current_user: Dict[str, Any] = Depends(get_current_user)):
    user_id = current_user["id"]

    # Check content exists
    rows = execute_query("SELECT id FROM training_content WHERE id = %s", (content_id,))
    if not rows:
        raise HTTPException(status_code=404, detail="Training content not found")

    # Insert or update completion
    execute_query(
        """INSERT INTO operator_training (operator_id, content_id, completed_at, score)
           VALUES (%s, %s, NOW(), 100)
           ON CONFLICT (operator_id, content_id) DO UPDATE SET completed_at = NOW()""",
        (user_id, content_id)
    )

    return TrainingCompleteResponse(
        success=True,
        operatorId=user_id,
        contentId=content_id,
        completedAt=datetime.utcnow().isoformat()
    )
