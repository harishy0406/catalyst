import logging
import joblib
from typing import Dict, Any, Optional
from pathlib import Path

from app.inference.config import (
    TASK_TIME_MODEL_PATH,
    EXCAVATOR_ANOMALY_MODEL_PATH,
    BULLDOZER_ANOMALY_MODEL_PATH,
    LOADER_ANOMALY_MODEL_PATH,
)

logger = logging.getLogger("catalyst.ml.registry")


class ModelRegistry:
    """
    Centralized, thread-safe Machine Learning model registry.
    Loads and caches CatBoost and Scikit-Learn models in memory.
    """
    _instance: Optional["ModelRegistry"] = None

    def __new__(cls):
        if cls._instance is None:
            cls._instance = super(ModelRegistry, cls).__new__(cls)
            cls._instance._initialized = False
        return cls._instance

    def __init__(self):
        if self._initialized:
            return
        self._initialized = True
        self.task_time_artifact: Optional[Dict[str, Any]] = None
        self.excavator_artifact: Optional[Dict[str, Any]] = None
        self.bulldozer_artifact: Optional[Dict[str, Any]] = None
        self.loader_artifact: Optional[Dict[str, Any]] = None
        self.load_all()

    def _safe_load_joblib(self, path: Path, model_name: str) -> Optional[Dict[str, Any]]:
        if not path.exists():
            logger.warning(f"[ML Registry] {model_name} artifact not found at {path}")
            return None
        try:
            artifact = joblib.load(path)
            logger.info(f"[ML Registry] Successfully loaded {model_name} from {path}")
            return artifact
        except Exception as e:
            logger.error(f"[ML Registry] Failed to load {model_name} from {path}: {e}")
            return None

    def load_all(self):
        logger.info("[ML Registry] Initializing all Machine Learning models...")
        self.task_time_artifact = self._safe_load_joblib(TASK_TIME_MODEL_PATH, "Task Time (CatBoost)")
        self.excavator_artifact = self._safe_load_joblib(EXCAVATOR_ANOMALY_MODEL_PATH, "Excavator Anomaly")
        self.bulldozer_artifact = self._safe_load_joblib(BULLDOZER_ANOMALY_MODEL_PATH, "Bulldozer Anomaly")
        self.loader_artifact = self._safe_load_joblib(LOADER_ANOMALY_MODEL_PATH, "Wheel Loader Anomaly")

    def get_task_time_model(self) -> Optional[Dict[str, Any]]:
        if self.task_time_artifact is None:
            self.task_time_artifact = self._safe_load_joblib(TASK_TIME_MODEL_PATH, "Task Time (CatBoost)")
        return self.task_time_artifact

    def get_excavator_model(self) -> Optional[Dict[str, Any]]:
        if self.excavator_artifact is None:
            self.excavator_artifact = self._safe_load_joblib(EXCAVATOR_ANOMALY_MODEL_PATH, "Excavator Anomaly")
        return self.excavator_artifact

    def get_bulldozer_model(self) -> Optional[Dict[str, Any]]:
        if self.bulldozer_artifact is None:
            self.bulldozer_artifact = self._safe_load_joblib(BULLDOZER_ANOMALY_MODEL_PATH, "Bulldozer Anomaly")
        return self.bulldozer_artifact

    def get_loader_model(self) -> Optional[Dict[str, Any]]:
        if self.loader_artifact is None:
            self.loader_artifact = self._safe_load_joblib(LOADER_ANOMALY_MODEL_PATH, "Wheel Loader Anomaly")
        return self.loader_artifact

    def get_status(self) -> Dict[str, Any]:
        return {
            "taskTimeModel": {
                "loaded": self.task_time_artifact is not None,
                "path": str(TASK_TIME_MODEL_PATH),
                "featuresCount": len(self.task_time_artifact.get("features", [])) if self.task_time_artifact else 0,
                "framework": "CatBoost"
            },
            "excavatorModel": {
                "loaded": self.excavator_artifact is not None,
                "path": str(EXCAVATOR_ANOMALY_MODEL_PATH),
                "classes": self.excavator_artifact.get("classes", []) if self.excavator_artifact else [],
                "framework": "Scikit-Learn (Random Forest)"
            },
            "bulldozerModel": {
                "loaded": self.bulldozer_artifact is not None,
                "path": str(BULLDOZER_ANOMALY_MODEL_PATH),
                "classes": self.bulldozer_artifact.get("classes", []) if self.bulldozer_artifact else [],
                "framework": "Scikit-Learn (Random Forest)"
            },
            "loaderModel": {
                "loaded": self.loader_artifact is not None,
                "path": str(LOADER_ANOMALY_MODEL_PATH),
                "classes": self.loader_artifact.get("classes", []) if self.loader_artifact else [],
                "framework": "Scikit-Learn (Random Forest)"
            }
        }


model_registry = ModelRegistry()
