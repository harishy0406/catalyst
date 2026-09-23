from pydantic import BaseModel
from typing import Optional, List, Any


class TrainingContentResponse(BaseModel):
    id: str
    title: str
    category: str
    durationMinutes: int
    format: str
    url: Optional[str] = None
    content: Optional[str] = None


class RecommendationItem(BaseModel):
    contentId: str
    title: str
    category: str
    durationMinutes: int
    format: str
    reason: str
    urgency: str  # 'high', 'medium', 'low'


class TrainingRecommendationsResponse(BaseModel):
    operatorId: str
    skillLevel: str
    recommendations: List[RecommendationItem]


class TrainingCompleteResponse(BaseModel):
    success: bool
    operatorId: str
    contentId: str
    completedAt: str
