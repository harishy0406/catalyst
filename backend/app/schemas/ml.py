from pydantic import BaseModel
from typing import Optional, Dict, Any


class MLPredictRequest(BaseModel):
    taskType: str
    weatherCondition: str = "clear"
    operatorSkill: str = "intermediate"
    machineAgeYears: float = 2.0
    baseTime: Optional[float] = None


class MLPredictResponse(BaseModel):
    predictedMinutes: float
    confidence: float
    modelType: str
    factors: Dict[str, float]
    maeTargetMet: bool


class MLMetricsResponse(BaseModel):
    mae: float
    rmse: float
    targetMae: float = 7.6
    targetRmse: float = 9.23
    sampleCount: int
    modelStatus: str


class MLTrainResponse(BaseModel):
    success: bool
    samplesTrained: int
    metrics: Dict[str, float]
