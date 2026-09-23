from fastapi import APIRouter, Depends
from typing import Dict, Any

from app.dependencies import get_current_user
from app.ml.estimator import estimator_instance
from app.schemas.ml import (
    MLPredictRequest,
    MLPredictResponse,
    MLMetricsResponse,
    MLTrainResponse,
)

router = APIRouter(prefix="/ml", tags=["machine_learning"])


@router.post("/predict", response_model=MLPredictResponse)
def predict_task_duration(req: MLPredictRequest, current_user: Dict[str, Any] = Depends(get_current_user)):
    res = estimator_instance.predict(
        task_type=req.taskType,
        weather=req.weatherCondition,
        operator_skill=req.operatorSkill,
        machine_age=req.machineAgeYears,
        base_time_override=req.baseTime
    )

    return MLPredictResponse(
        predictedMinutes=res["predictedMinutes"],
        confidence=res["confidenceScore"],
        modelType=res["modelType"],
        factors=res["factors"],
        maeTargetMet=res.get("maeTargetMet", True)
    )


@router.post("/train", response_model=MLTrainResponse)
def train_model(current_user: Dict[str, Any] = Depends(get_current_user)):
    res = estimator_instance.train_ml_model()
    return MLTrainResponse(
        success=res.get("success", False),
        samplesTrained=res.get("samplesTrained", 0),
        metrics=res.get("metrics", {"mae": 0.0, "rmse": 0.0})
    )


@router.get("/metrics", response_model=MLMetricsResponse)
def get_ml_metrics(current_user: Dict[str, Any] = Depends(get_current_user)):
    metrics = estimator_instance.compute_accuracy_metrics()
    return MLMetricsResponse(
        mae=metrics["mae"],
        rmse=metrics["rmse"],
        targetMae=metrics["targetMae"],
        targetRmse=metrics["targetRmse"],
        sampleCount=metrics["sampleCount"],
        modelStatus=metrics["modelStatus"]
    )


@router.get("/status")
def get_ml_status(current_user: Dict[str, Any] = Depends(get_current_user)):
    metrics = estimator_instance.compute_accuracy_metrics()
    return {
        "status": "ready",
        "algorithm": "RandomForestRegressor + Transparent Factor Heuristic",
        "trained": estimator_instance.is_trained,
        "sampleCount": metrics["sampleCount"],
        "benchmarkTargetMAE": 7.6,
        "benchmarkTargetRMSE": 9.23,
        "currentMAE": metrics["mae"],
        "currentRMSE": metrics["rmse"]
    }
