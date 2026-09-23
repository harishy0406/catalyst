from fastapi import APIRouter, Depends
from typing import Dict, Any

from app.dependencies import get_current_user
from app.inference.registry import model_registry
from app.inference.services.task_time_service import task_time_service
from app.inference.services.anomaly_service import anomaly_service
from app.inference.estimator import estimator_instance
from app.schemas.ml import (
    TaskTimePredictRequest,
    TaskTimePredictResponse,
    AnomalyPredictRequest,
    AnomalyPredictResponse,
    MLPredictRequest,
    MLPredictResponse,
    MLMetricsResponse,
    MLTrainResponse,
)

router = APIRouter(prefix="/ml", tags=["machine_learning"])


# -------------------------------------------------------------
# TASK TIME ESTIMATION (CATBOOST REGRESSOR)
# -------------------------------------------------------------

@router.post("/task-time/predict", response_model=TaskTimePredictResponse)
def predict_task_time(
    req: TaskTimePredictRequest,
    current_user: Dict[str, Any] = Depends(get_current_user)
):
    """
    Estimate construction task duration using CatBoost Regressor (R² = 0.92).
    Evaluates machine characteristics, operator fatigue/skill, material volume,
    weather, visibility, and site ground conditions.
    """
    input_data = req.model_dump()
    result = task_time_service.predict(input_data)
    return TaskTimePredictResponse(**result)


# -------------------------------------------------------------
# MULTI-MACHINE ANOMALY DETECTION (RANDOM FOREST)
# -------------------------------------------------------------

@router.post("/anomaly/predict", response_model=AnomalyPredictResponse)
def predict_anomaly(
    req: AnomalyPredictRequest,
    current_user: Dict[str, Any] = Depends(get_current_user)
):
    """
    Detect mechanical and operational anomalies across Excavator, Bulldozer,
    and Wheel Loader fleets using multi-class Random Forest models.
    """
    input_data = req.model_dump()
    result = anomaly_service.predict(input_data)
    return AnomalyPredictResponse(**result)


@router.post("/anomaly/excavator", response_model=AnomalyPredictResponse)
def predict_excavator_anomaly(
    req: AnomalyPredictRequest,
    current_user: Dict[str, Any] = Depends(get_current_user)
):
    """
    Dedicated anomaly inference for Excavator telemetry (boom/arm/bucket rates,
    swing speed, hydraulic stress, excessive idling, overheating).
    """
    input_data = req.model_dump()
    result = anomaly_service.predict_excavator(input_data)
    return AnomalyPredictResponse(**result)


@router.post("/anomaly/bulldozer", response_model=AnomalyPredictResponse)
def predict_bulldozer_anomaly(
    req: AnomalyPredictRequest,
    current_user: Dict[str, Any] = Depends(get_current_user)
):
    """
    Dedicated anomaly inference for Bulldozer telemetry (blade load, blade angle,
    drawbar load, track slip, uneven track speed, hydraulic stress).
    """
    input_data = req.model_dump()
    result = anomaly_service.predict_bulldozer(input_data)
    return AnomalyPredictResponse(**result)


@router.post("/anomaly/loader", response_model=AnomalyPredictResponse)
def predict_loader_anomaly(
    req: AnomalyPredictRequest,
    current_user: Dict[str, Any] = Depends(get_current_user)
):
    """
    Dedicated anomaly inference for Wheel Loader telemetry (bucket load, lift height,
    tire slip, harsh braking, cycle time, transmission overheating).
    """
    input_data = req.model_dump()
    result = anomaly_service.predict_loader(input_data)
    return AnomalyPredictResponse(**result)


# -------------------------------------------------------------
# MODEL HEALTH & STATUS
# -------------------------------------------------------------

@router.get("/status")
def get_ml_status(current_user: Dict[str, Any] = Depends(get_current_user)):
    """
    Query runtime status, memory cache, and active frameworks for all
    ML models (CatBoost and Scikit-Learn models).
    """
    registry_status = model_registry.get_status()
    legacy_metrics = estimator_instance.compute_accuracy_metrics()
    return {
        "status": "ready",
        "models": registry_status,
        "legacyEstimator": {
            "algorithm": "RandomForestRegressor + Transparent Factor Heuristic",
            "trained": estimator_instance.is_trained,
            "sampleCount": legacy_metrics["sampleCount"],
            "benchmarkTargetMAE": 7.6,
            "benchmarkTargetRMSE": 9.23,
            "currentMAE": legacy_metrics["mae"],
            "currentRMSE": legacy_metrics["rmse"]
        }
    }


# -------------------------------------------------------------
# LEGACY / BACKWARD COMPATIBLE ENDPOINTS
# -------------------------------------------------------------

@router.post("/predict", response_model=MLPredictResponse)
def predict_task_duration_legacy(
    req: MLPredictRequest,
    current_user: Dict[str, Any] = Depends(get_current_user)
):
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
def train_model_legacy(current_user: Dict[str, Any] = Depends(get_current_user)):
    res = estimator_instance.train_ml_model()
    return MLTrainResponse(
        success=res.get("success", False),
        samplesTrained=res.get("samplesTrained", 0),
        metrics=res.get("metrics", {"mae": 0.0, "rmse": 0.0})
    )


@router.get("/metrics", response_model=MLMetricsResponse)
def get_ml_metrics_legacy(current_user: Dict[str, Any] = Depends(get_current_user)):
    metrics = estimator_instance.compute_accuracy_metrics()
    return MLMetricsResponse(
        mae=metrics["mae"],
        rmse=metrics["rmse"],
        targetMae=metrics["targetMae"],
        targetRmse=metrics["targetRmse"],
        sampleCount=metrics["sampleCount"],
        modelStatus=metrics["modelStatus"]
    )
