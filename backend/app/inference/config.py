import os
from pathlib import Path
from typing import Dict, Any

# Base directories
APP_DIR = Path(__file__).resolve().parent.parent
BACKEND_DIR = APP_DIR.parent
ROOT_DIR = BACKEND_DIR.parent

# Candidate directories for model artifacts
MODEL_SEARCH_PATHS = [
    ROOT_DIR / "ml" / "models",
    BACKEND_DIR / "models",
    APP_DIR / "inference" / "models",
]


def resolve_model_path(filename: str, fallback_relative_path: str = "") -> Path:
    """
    Search for model file across standard locations to ensure container/local portability.
    """
    for search_dir in MODEL_SEARCH_PATHS:
        candidate = search_dir / filename
        if candidate.exists():
            return candidate

    if fallback_relative_path:
        fallback_candidate = ROOT_DIR / fallback_relative_path
        if fallback_candidate.exists():
            return fallback_candidate

    # Default to root ml/models/<filename>
    return ROOT_DIR / "ml" / "models" / filename


TASK_TIME_MODEL_PATH = resolve_model_path("task_time_catboost.pkl", "ml/models/task_time_catboost.pkl")
EXCAVATOR_ANOMALY_MODEL_PATH = resolve_model_path("excavator_anomaly_model.pkl", "ml/models/excavator_anomaly_model.pkl")
BULLDOZER_ANOMALY_MODEL_PATH = resolve_model_path("bulldozer_anomaly_model.pkl", "ml/models/bulldozer_anomaly_model.pkl")
LOADER_ANOMALY_MODEL_PATH = resolve_model_path("loader_anomaly_model.pkl", "ml/models/loader_anomaly_model.pkl")

# Minimum confidence threshold for surfacing anomalies
ANOMALY_CONFIDENCE_THRESHOLD = 0.60
