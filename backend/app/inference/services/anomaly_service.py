import logging
import pandas as pd
from typing import Dict, Any, List, Optional
from datetime import datetime

from app.inference.registry import model_registry
from app.machine_types import machine_type_of

logger = logging.getLogger("catalyst.ml.anomaly")

# Human-readable messages per model prediction
EXCAVATOR_MESSAGES = {
    "Normal": "No unusual machine behavior detected.",
    "Excessive_Idling": "Excessive idling detected. Machine has remained idle with engine running.",
    "Hydraulic_Stress": "Hydraulic stress detected. Main pump circuit is operating under continuous peak pressure.",
    "Engine_Overheating": "Engine overheating detected. Coolant temperature is exceeding safe thermal thresholds.",
    "Aggressive_Boom_Movement": "Aggressive boom movement detected. Rapid cycling intensity is stressing cylinders.",
    "Excessive_Swing_Speed": "Excessive swing speed detected. High centrifugal slewing is stressing the swing bearing.",
    "Bucket_Overloading": "Bucket overloading detected. Payload mass exceeds safe structural limits.",
    "Abnormal_Vibration": "Abnormal vibration detected. Excessive harmonic frequencies detected on machine chassis.",
    "Low_Excavation_Productivity": "Low excavation productivity detected. Reduced cycle efficiency observed."
}

BULLDOZER_MESSAGES = {
    "Normal": "No unusual machine behavior detected.",
    "Blade_Overloading": "Blade overloading detected. Excessive material resistance against blade face.",
    "Engine_Overheating": "Engine overheating detected. High powertrain load causing thermal elevation.",
    "Excessive_Dozing_Depth": "Excessive dozing depth detected. Blade cut depth exceeds structural grade limits.",
    "Excessive_Idling": "Excessive idling detected. Track engine operating with zero ground speed.",
    "Hydraulic_Stress": "Hydraulic stress detected. Blade lift/tilt circuit backpressure spike observed.",
    "Poor_Grading_Performance": "Poor grading performance detected. Excessive surface deviation observed.",
    "Track_Slip": "Track slip detected. Grousers spinning without forward machine traction.",
    "Uneven_Track_Speed": "Uneven track speed detected. Left and right final drive speed divergence."
}

LOADER_MESSAGES = {
    "Normal": "No unusual machine behavior detected.",
    "Aggressive_Acceleration": "Aggressive acceleration detected. High throttle jump under heavy bucket payload.",
    "Bucket_Overloading": "Bucket overloading detected. Tipping load limit approached.",
    "Excessive_Idling": "Excessive idling detected. Loader running idle during truck wait time.",
    "Excessive_Tire_Slip": "Excessive tire slip detected. Wheel spin against stockpile causing tire degradation.",
    "Harsh_Braking": "Harsh braking detected. High deceleration forces stressing service brake discs.",
    "Hydraulic_Stress": "Hydraulic stress detected. Bucket curl circuit relief pressure active.",
    "Inefficient_Loading_Cycle": "Inefficient loading cycle detected. Long V-pattern cycle times observed.",
    "Transmission_Overheating": "Transmission overheating detected. Torque converter slip generating excess heat."
}

RECOMMENDED_ACTIONS = {
    "Engine_Overheating": "Throttle back to low idle for 3 minutes to cool. Inspect radiator core for dust blockage.",
    "Hydraulic_Stress": "Relieve hydraulic joystick demand. Check hydraulic fluid level and return filter condition.",
    "Excessive_Idling": "Engage Automatic Engine Speed Control (AEC) or shut down engine during truck delays.",
    "Aggressive_Boom_Movement": "Smooth joystick metering; avoid hitting cylinder end-stops at high velocity.",
    "Excessive_Swing_Speed": "Reduce slewing acceleration to maintain swing gear mesh lubrication.",
    "Bucket_Overloading": "Reduce bucket heap to match hauler capacity and prevent front axle strain.",
    "Abnormal_Vibration": "Check track sag/tension, engine vibration mounts, and ground compaction.",
    "Blade_Overloading": "Raise blade slightly to reduce drag force and prevent torque converter stall.",
    "Track_Slip": "Ease throttle to allow track grousers to grip without chewing ground.",
    "Excessive_Dozing_Depth": "Adjust blade pitch to take shallower, more consistent cuts.",
    "Uneven_Track_Speed": "Inspect steering clutch and brake pressures for track motor bias.",
    "Poor_Grading_Performance": "Re-calibrate 2D Grade Control laser bench reference.",
    "Aggressive_Acceleration": "Gradually modulate accelerator to prolong driveline and universal joint life.",
    "Excessive_Tire_Slip": "Shift to 1st gear and reduce throttle when penetrating stockpile face.",
    "Harsh_Braking": "Utilize transmission retarder/neutralizer pedal rather than slamming service brakes.",
    "Inefficient_Loading_Cycle": "Tighten V-pattern approach angle to 45–60 degrees and spot trucks closer.",
    "Transmission_Overheating": "Downshift to maintain converter lockup and inspect oil cooler airflow.",
    "Normal": "Continue standard operations. All systems functioning within optimal specifications."
}


# Median readings of the "Normal" class in ml/datasets/anomaly/*_dataset_50k.csv. Used for any
# feature the caller doesn't send, so a partial reading (e.g. the 5 CAN-bus values from /telemetry)
# is scored against a normal machine rather than against out-of-range placeholders.
NORMAL_PROFILE: Dict[str, Dict[str, float]] = {
    "excavator": {
        "engine_rpm": 1800.1, "engine_temperature_c": 82.0, "hydraulic_pressure_bar": 269.8,
        "hydraulic_oil_temperature_c": 62.0, "fuel_rate_lph": 20.02, "fuel_level_pct": 62.6,
        "machine_speed_kmh": 2.8, "idle_duration_min": 2.79, "boom_movement_rate": 0.72,
        "arm_movement_rate": 0.68, "bucket_movement_rate": 0.65, "swing_speed_rpm": 8.0,
        "bucket_cycles_per_min": 3.0, "excavation_depth_m": 2.51, "bucket_load_pct": 70.0,
        "vibration_level": 1.2, "slope_deg": 4.01, "ambient_temperature_c": 30.0,
        "operator_experience_years": 7.7, "machine_hours": 5238.1, "maintenance_due_days": 30.0,
        "previous_anomaly_count_1hr": 0.0,
    },
    "bulldozer": {
        "engine_rpm": 1751.0, "engine_temperature_c": 82.0, "hydraulic_pressure_bar": 250.1,
        "hydraulic_oil_temperature_c": 60.0, "fuel_rate_lph": 18.5, "fuel_level_pct": 62.5,
        "vehicle_speed_kmh": 6.01, "idle_duration_min": 2.75, "blade_load_pct": 69.9,
        "blade_angle_deg": 8.0, "blade_height_m": 0.5, "drawbar_load_pct": 65.1,
        "traction_force_kn": 110.0, "track_speed_left_kmh": 6.01, "track_speed_right_kmh": 6.0,
        "track_slip_pct": 4.99, "dozing_depth_m": 0.35, "grading_accuracy_error_cm": 2.5,
        "vibration_level": 1.4, "slope_deg": 4.04, "ambient_temperature_c": 30.0,
        "operator_experience_years": 7.7, "machine_hours": 5203.0, "maintenance_due_days": 30.0,
        "previous_anomaly_count_1hr": 0.0,
    },
    "wheel_loader": {
        "engine_rpm": 1749.6, "engine_temperature_c": 82.0, "transmission_temperature_c": 78.0,
        "hydraulic_pressure_bar": 255.1, "hydraulic_oil_temperature_c": 60.9, "fuel_rate_lph": 18.54,
        "fuel_level_pct": 62.7, "vehicle_speed_kmh": 8.98, "idle_duration_min": 2.73,
        "bucket_load_pct": 72.0, "bucket_fill_ratio_pct": 78.0, "lift_height_m": 2.5,
        "forward_speed_kmh": 8.0, "reverse_speed_kmh": 6.01, "acceleration_mps2": 1.2,
        "braking_intensity": 0.9, "loading_cycles_per_hour": 28.0, "cycle_time_sec": 38.0,
        "tire_slip_pct": 5.01, "vibration_level": 1.3, "slope_deg": 2.99, "ambient_temperature_c": 30.0,
        "operator_experience_years": 7.8, "machine_hours": 5227.1, "maintenance_due_days": 30.0,
        "previous_anomaly_count_1hr": 0.0,
    },
}

# Categorical values the models were trained on; the first one is the default
CATEGORIES: Dict[str, Dict[str, List[str]]] = {
    "excavator": {
        "task_type": ["Excavation", "Digging", "Loading", "Trenching"],
        "soil_type": ["Medium", "Hard", "Rocky", "Soft"],
        "ground_condition": ["Dry", "Damp", "Loose", "Wet"],
    },
    "bulldozer": {
        "task_type": ["Dozing", "Grading", "Leveling", "Ripping"],
        "soil_type": ["Medium", "Hard", "Rocky", "Soft"],
        "ground_condition": ["Dry", "Damp", "Loose", "Wet"],
    },
    "wheel_loader": {
        "task_type": ["Loading", "Hauling", "Material_Handling", "Stockpiling"],
        "material_type": ["Gravel", "Coal", "Rock", "Sand", "Soil"],
        "ground_condition": ["Dry", "Damp", "Loose", "Wet"],
    },
}

# Other names callers use for a model feature (CAN-bus names from /telemetry, older API fields)
ALIASES: Dict[str, List[str]] = {
    "engine_temperature_c": ["engine_temp"],
    "hydraulic_pressure_bar": ["hydraulic_pressure"],
    "fuel_rate_lph": ["fuel_rate"],
    "machine_speed_kmh": ["speed", "vehicle_speed_kmh"],
    "vehicle_speed_kmh": ["speed", "machine_speed_kmh"],
    "track_speed_left_kmh": ["left_track_speed_kmh"],
    "track_speed_right_kmh": ["right_track_speed_kmh"],
    "acceleration_mps2": ["acceleration_m_s2"],
    "tire_slip_pct": ["front_tire_slip_pct", "rear_tire_slip_pct"],
}

MESSAGES = {"excavator": EXCAVATOR_MESSAGES, "bulldozer": BULLDOZER_MESSAGES, "wheel_loader": LOADER_MESSAGES}
DEFAULT_IDS = {"excavator": "CAT-320-01", "bulldozer": "CAT-D6-03", "wheel_loader": "CAT-950-02"}


def _first(*sources: Dict[str, Any], keys: List[str]) -> Optional[float]:
    """First non-None value (0 is a valid reading, so no `or` chaining)."""
    for src in sources:
        for k in keys:
            v = src.get(k)
            if v is not None:
                return float(v)
    return None


def _category(value: Any, allowed: List[str]) -> str:
    key = str(value or "").strip().lower().replace(" ", "_")
    return next((c for c in allowed if c.lower() == key), allowed[0])


class AnomalyService:
    """
    Unified multi-machine predictive anomaly detection service.
    Supports Excavator, Bulldozer, and Wheel Loader models.
    """

    @staticmethod
    def _normalize_machine_type(raw_type: str, model_id: str = "") -> str:
        # Explicit type wins; the machine ID is only a fallback (e.g. "wheel_loader" + "CAT-320-01" → loader)
        return machine_type_of(raw_type) or machine_type_of(None, model_id) or "excavator"

    def predict(self, machine_input: Dict[str, Any]) -> Dict[str, Any]:
        raw_mtype = machine_input.get("machine_type") or machine_input.get("machineType") or ""
        context = machine_input.get("context") or {}
        mid = context.get("machine_id") or machine_input.get("machine_id") or machine_input.get("machineId") or ""
        return self._predict(self._normalize_machine_type(raw_mtype, mid), machine_input)

    def predict_excavator(self, machine_input: Dict[str, Any]) -> Dict[str, Any]:
        return self._predict("excavator", machine_input)

    def predict_bulldozer(self, machine_input: Dict[str, Any]) -> Dict[str, Any]:
        return self._predict("bulldozer", machine_input)

    def predict_loader(self, machine_input: Dict[str, Any]) -> Dict[str, Any]:
        return self._predict("wheel_loader", machine_input)

    def _predict(self, mtype: str, machine_input: Dict[str, Any]) -> Dict[str, Any]:
        artifact = {
            "excavator": model_registry.get_excavator_model,
            "bulldozer": model_registry.get_bulldozer_model,
            "wheel_loader": model_registry.get_loader_model,
        }[mtype]()
        if not artifact or "model" not in artifact:
            return self._build_mock_response(mtype, machine_input)

        context = machine_input.get("context") or {}
        tel = machine_input.get("telemetry") or {}
        m_ctx = machine_input.get("machine_context") or {}
        cats = CATEGORIES[mtype]
        normal = NORMAL_PROFILE[mtype]

        row: Dict[str, Any] = {}
        for f in artifact["features"]:
            if f in cats:
                row[f] = _category(context.get(f), cats[f])
            else:
                v = _first(tel, m_ctx, keys=[f, *ALIASES.get(f, [])])
                row[f] = v if v is not None else normal.get(f, 0.0)

        df = pd.DataFrame([[row[f] for f in artifact["features"]]], columns=artifact["features"])
        model = artifact["model"]
        pred = str(model.predict(df)[0])
        probs = model.predict_proba(df)[0]
        confidence = float(max(probs))

        return {
            "machineType": mtype,
            "machineId": context.get("machine_id") or DEFAULT_IDS[mtype],
            "operatorId": context.get("operator_id"),
            "isAnomaly": pred != "Normal",
            "prediction": pred,
            "message": MESSAGES[mtype].get(pred, "Unusual machine behavior detected."),
            "recommendedAction": RECOMMENDED_ACTIONS.get(pred, "Inspect machine systems."),
            "confidence": round(confidence, 4),
            "confidencePercent": round(confidence * 100, 1),
            "classProbabilities": {c: round(float(p), 4) for c, p in zip(artifact["classes"], probs)},
            "timestamp": context.get("timestamp") or datetime.utcnow().isoformat(),
        }

    def _build_mock_response(self, mtype: str, machine_input: Dict[str, Any]) -> Dict[str, Any]:
        context = machine_input.get("context") or {}
        return {
            "machineType": mtype,
            "machineId": context.get("machine_id", "UNKNOWN"),
            "operatorId": context.get("operator_id"),
            "isAnomaly": False,
            "prediction": "Normal",
            "message": "Model not loaded; default normal behavior assumed.",
            "recommendedAction": "Standard preventive maintenance.",
            "confidence": 0.99,
            "confidencePercent": 99.0,
            "classProbabilities": {"Normal": 1.0},
            "timestamp": datetime.utcnow().isoformat()
        }


anomaly_service = AnomalyService()
