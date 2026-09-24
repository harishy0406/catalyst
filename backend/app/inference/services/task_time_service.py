import logging
import pandas as pd
from typing import Dict, Any, Optional
from app.inference.registry import model_registry
from app.inference.estimator import estimator_instance
from app.machine_types import ML_MACHINE_TYPE, ML_SKILL, ML_TASK_TYPE, ML_WEATHER, machine_type_of

logger = logging.getLogger("catalyst.ml.task_time")

class TaskTimeService:
    """
    Production inference service for construction task completion time estimation.
    Backing model: CatBoost Regressor trained on 2,000 multi-machine tasks.
    """

    @staticmethod
    def predict(input_data: Dict[str, Any]) -> Dict[str, Any]:
        artifact = model_registry.get_task_time_model()

        # Extract or infer inputs
        # Map app values (e.g. "pipe_laying", "CAT 320 Hydraulic Excavator") onto trained categories;
        # unknown categories silently skew CatBoost's output
        task_type_raw = str(input_data.get("Task_Type") or input_data.get("taskType") or "Trenching").strip()
        task_key = task_type_raw.lower().replace(" ", "_")
        task_type_title = ML_TASK_TYPE.get(task_key, task_type_raw.replace("_", " ").title())

        machine_raw = str(input_data.get("Machine_Type") or input_data.get("machineType") or "Excavator").strip()
        mtype = machine_type_of(machine_raw)
        machine_type_raw = ML_MACHINE_TYPE[mtype] if mtype else machine_raw.title()

        est_time = float(
            input_data.get("Estimated_Time_min") or
            input_data.get("estimatedMinutes") or
            input_data.get("baseTime") or
            60.0
        )

        weather_in = str(input_data.get("Weather") or input_data.get("weatherCondition") or "Clear").strip()
        weather_raw = ML_WEATHER.get(weather_in.lower(), weather_in.title())
        skill_in = str(input_data.get("Operator_Skill") or input_data.get("operatorSkill") or "Intermediate").strip()
        skill_raw = ML_SKILL.get(skill_in.lower(), skill_in.title())
        age = float(input_data.get("Machine_Age_yrs") or input_data.get("machineAgeYears") or 2.0)

        # If CatBoost artifact is present, execute gradient-boosted regression
        if artifact and "model" in artifact:
            try:
                features = artifact["features"]

                row = {
                    "Machine_Type": machine_type_raw,
                    "Machine_Age_yrs": age,
                    "Machine_Maintenance_Status": str(
                        input_data.get("Machine_Maintenance_Status") or input_data.get("machineMaintenanceStatus") or "Good"
                    ),
                    "Operator_Skill": skill_raw,
                    "Operator_Fatigue_Level": float(input_data.get("Operator_Fatigue_Level", 2.0)),
                    "Task_Type": task_type_title,
                    "Task_Volume": float(input_data.get("Task_Volume", 120.0)),
                    "Load_Weight_tons": float(input_data.get("Load_Weight_tons", 10.0)),
                    "Travel_Distance_m": float(input_data.get("Travel_Distance_m", 45.0)),
                    "Site_Terrain": str(input_data.get("Site_Terrain", "Flat")).title(),
                    "Site_Condition": str(input_data.get("Site_Condition", "Normal")).title(),
                    "Weather": weather_raw,
                    "Temperature_C": float(input_data.get("Temperature_C", 24.0)),
                    "Humidity_Percent": float(input_data.get("Humidity_Percent", 50.0)),
                    "Visibility": str(input_data.get("Visibility", "Good")).title(),
                    "Shift_Time": str(input_data.get("Shift_Time", "Morning")).title(),
                    "Estimated_Time_min": est_time,
                }

                # Construct 1-row DataFrame aligned with training columns
                df = pd.DataFrame([[row.get(f) for f in features]], columns=features)
                pred_minutes = float(artifact["model"].predict(df)[0])
                pred_minutes = max(5.0, round(pred_minutes, 1))

                deviation_min = round(pred_minutes - est_time, 1)
                deviation_pct = round((deviation_min / est_time) * 100, 1) if est_time > 0 else 0.0

                return {
                    "predictedMinutes": pred_minutes,
                    "estimatedBaselineMinutes": est_time,
                    "deviationMinutes": deviation_min,
                    "deviationPercent": deviation_pct,
                    "confidenceScore": 0.92,
                    "confidenceLabel": "High (CatBoost R²=0.92)",
                    "modelType": "catboost_regressor",
                    "featuresUsed": {
                        "machineType": machine_type_raw,
                        "taskType": task_type_title,
                        "operatorSkill": skill_raw,
                        "weather": weather_raw,
                        "machineAgeYears": age,
                    },
                    "riskAssessment": "Delayed" if deviation_pct > 15 else "On Schedule" if deviation_pct >= -10 else "Accelerated",
                    "fallbackUsed": False,
                }
            except Exception as e:
                logger.error(f"[TaskTimeService] CatBoost prediction failed: {e}. Falling back to formula estimator.")

        # Graceful fallback to formula/Random Forest
        fallback_res = estimator_instance.predict(
            task_type=task_type_raw,
            weather=weather_raw,
            operator_skill=skill_raw,
            machine_age=age,
            base_time_override=est_time
        )

        pred_minutes = float(fallback_res["predictedMinutes"])
        deviation_min = round(pred_minutes - est_time, 1)
        deviation_pct = round((deviation_min / est_time) * 100, 1) if est_time > 0 else 0.0

        return {
            "predictedMinutes": pred_minutes,
            "estimatedBaselineMinutes": est_time,
            "deviationMinutes": deviation_min,
            "deviationPercent": deviation_pct,
            "confidenceScore": fallback_res.get("confidenceScore", 0.65),
            "confidenceLabel": fallback_res.get("confidenceLabel", "Standard"),
            "modelType": fallback_res.get("modelType", "heuristic_formula"),
            "featuresUsed": {
                "machineType": machine_type_raw,
                "taskType": task_type_title,
                "operatorSkill": skill_raw,
                "weather": weather_raw,
                "machineAgeYears": age,
            },
            "riskAssessment": "Delayed" if deviation_pct > 15 else "On Schedule",
            "fallbackUsed": True,
        }


task_time_service = TaskTimeService()
