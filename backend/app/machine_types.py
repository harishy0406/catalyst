"""
Single source of truth for the three machine types the ML models are built around, and how
task types, weather and skill map onto the categories the models were trained on.

Mirrored in frontend/supervisor-dashboard/src/lib/domain.ts and
frontend/cat-operator-app/src/data/machines.ts; keep them in sync.
"""
from typing import Dict, List, Optional

EXCAVATOR = "excavator"
BULLDOZER = "bulldozer"
WHEEL_LOADER = "wheel_loader"
MACHINE_TYPES = (EXCAVATOR, BULLDOZER, WHEEL_LOADER)

# Task types each machine can actually perform (supervisor assignment is validated against this)
TASKS_BY_MACHINE: Dict[str, List[str]] = {
    EXCAVATOR: ["trenching", "pipe_laying", "bulk_excavation", "demolition", "loading"],
    BULLDOZER: ["grading", "bulk_excavation"],
    WHEEL_LOADER: ["loading"],
}

# CatBoost task-time model categories (ml/datasets/task_time/task_time_dataset.csv)
ML_MACHINE_TYPE = {EXCAVATOR: "Excavator", BULLDOZER: "Bulldozer", WHEEL_LOADER: "Loader"}
ML_TASK_TYPE = {
    "trenching": "Trenching",
    "pipe_laying": "Trenching",
    "bulk_excavation": "Earth Excavation",
    "demolition": "Demolition",
    "loading": "Material Loading",
    "grading": "Grading",
}
ML_WEATHER = {
    "clear": "Clear", "sunny": "Clear", "cloudy": "Cloudy", "windy": "Windy",
    "rain": "Rainy", "rainy": "Rainy", "storm": "Rainy",
    "hot": "Hot", "extreme_heat": "Hot", "extreme_cold": "Cloudy",
}
ML_SKILL = {"beginner": "Beginner", "novice": "Beginner", "intermediate": "Intermediate", "expert": "Expert"}


def machine_type_of(model: Optional[str] = None, machine_id: Optional[str] = None) -> Optional[str]:
    """Machine type from its model name (preferred) or ID; None if it is none of the three."""
    for text in (model, machine_id):
        s = (text or "").lower()
        if "excavator" in s or "exc" in s or "320" in s:
            return EXCAVATOR
        if "loader" in s or "950" in s:
            return WHEEL_LOADER
        if "dozer" in s or "tractor" in s or "d6" in s:
            return BULLDOZER
    return None


def can_perform(machine_type: Optional[str], task_type: str) -> bool:
    return machine_type is not None and task_type in TASKS_BY_MACHINE.get(machine_type, [])


def maintenance_status(status: Optional[str], health_score: Optional[float]) -> str:
    """Machine row → CatBoost Machine_Maintenance_Status (Good / Due Soon / Overdue)."""
    if status == "maintenance":
        return "Overdue"
    h = health_score if health_score is not None else 90
    return "Good" if h >= 85 else "Due Soon" if h >= 70 else "Overdue"
