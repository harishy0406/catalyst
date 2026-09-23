import logging
import pandas as pd
from typing import Dict, Any, List, Optional
from datetime import datetime

from app.inference.registry import model_registry

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


class AnomalyService:
    """
    Unified multi-machine predictive anomaly detection service.
    Supports Excavator, Bulldozer, and Wheel Loader models.
    """

    @staticmethod
    def _normalize_machine_type(raw_type: str, model_id: str = "") -> str:
        s = f"{raw_type} {model_id}".lower()
        if "excavator" in s or "320" in s or "exc" in s:
            return "excavator"
        elif "dozer" in s or "d6" in s or "bulldozer" in s:
            return "bulldozer"
        elif "loader" in s or "950" in s:
            return "wheel_loader"
        return "excavator"

    def predict(self, machine_input: Dict[str, Any]) -> Dict[str, Any]:
        raw_mtype = machine_input.get("machine_type") or machine_input.get("machineType") or "excavator"
        context = machine_input.get("context", {})
        mid = context.get("machine_id") or machine_input.get("machine_id") or machine_input.get("machineId") or ""
        mtype = self._normalize_machine_type(raw_mtype, mid)

        if mtype == "excavator":
            return self.predict_excavator(machine_input)
        elif mtype == "bulldozer":
            return self.predict_bulldozer(machine_input)
        elif mtype == "wheel_loader":
            return self.predict_loader(machine_input)
        else:
            return self.predict_excavator(machine_input)

    def predict_excavator(self, machine_input: Dict[str, Any]) -> Dict[str, Any]:
        artifact = model_registry.get_excavator_model()
        if not artifact or "model" not in artifact:
            return self._build_mock_response("excavator", machine_input)

        model = artifact["model"]
        features = artifact["features"]
        classes = artifact["classes"]

        context = machine_input.get("context", {})
        tel = machine_input.get("telemetry", {})
        m_ctx = machine_input.get("machine_context", {})

        row = {
            "task_type": context.get("task_type", "excavation"),
            "soil_type": context.get("soil_type", "clay"),
            "ground_condition": context.get("ground_condition", "normal"),
            "engine_rpm": tel.get("engine_rpm", 1750),
            "engine_temperature_c": tel.get("engine_temperature_c") or tel.get("engine_temp", 88),
            "hydraulic_pressure_bar": tel.get("hydraulic_pressure_bar") or tel.get("hydraulic_pressure", 260),
            "hydraulic_oil_temperature_c": tel.get("hydraulic_oil_temperature_c", 72),
            "fuel_rate_lph": tel.get("fuel_rate_lph") or tel.get("fuel_rate", 16.5),
            "fuel_level_pct": tel.get("fuel_level_pct", 70),
            "machine_speed_kmh": tel.get("machine_speed_kmh") or tel.get("speed", 2.0),
            "idle_duration_min": tel.get("idle_duration_min", 0),
            "boom_movement_rate": tel.get("boom_movement_rate", 24),
            "arm_movement_rate": tel.get("arm_movement_rate", 22),
            "bucket_movement_rate": tel.get("bucket_movement_rate", 20),
            "swing_speed_rpm": tel.get("swing_speed_rpm", 6),
            "bucket_cycles_per_min": tel.get("bucket_cycles_per_min", 6),
            "excavation_depth_m": tel.get("excavation_depth_m", 1.8),
            "bucket_load_pct": tel.get("bucket_load_pct", 65),
            "vibration_level": tel.get("vibration_level", 1.5),
            "slope_deg": tel.get("slope_deg", 2),
            "ambient_temperature_c": tel.get("ambient_temperature_c", 25),
            "operator_experience_years": m_ctx.get("operator_experience_years", 4),
            "machine_hours": m_ctx.get("machine_hours", 2500),
            "maintenance_due_days": m_ctx.get("maintenance_due_days", 20),
            "previous_anomaly_count_1hr": m_ctx.get("previous_anomaly_count_1hr", 0),
        }

        df = pd.DataFrame([[row.get(f) for f in features]], columns=features)
        pred = str(model.predict(df)[0])
        probs = model.predict_proba(df)[0]
        confidence = float(max(probs))
        class_probs = {c: round(float(p), 4) for c, p in zip(classes, probs)}

        is_anomaly = (pred != "Normal")
        message = EXCAVATOR_MESSAGES.get(pred, "Unusual machine behavior detected.")
        action = RECOMMENDED_ACTIONS.get(pred, "Inspect machine systems.")

        return {
            "machineType": "excavator",
            "machineId": context.get("machine_id", "CAT-320-01"),
            "operatorId": context.get("operator_id"),
            "isAnomaly": is_anomaly,
            "prediction": pred,
            "message": message,
            "recommendedAction": action,
            "confidence": round(confidence, 4),
            "confidencePercent": round(confidence * 100, 1),
            "classProbabilities": class_probs,
            "timestamp": context.get("timestamp") or datetime.utcnow().isoformat()
        }

    def predict_bulldozer(self, machine_input: Dict[str, Any]) -> Dict[str, Any]:
        artifact = model_registry.get_bulldozer_model()
        if not artifact or "model" not in artifact:
            return self._build_mock_response("bulldozer", machine_input)

        model = artifact["model"]
        features = artifact["features"]
        classes = artifact["classes"]

        context = machine_input.get("context", {})
        tel = machine_input.get("telemetry", {})
        m_ctx = machine_input.get("machine_context", {})

        row = {
            "task_type": context.get("task_type", "dozing"),
            "soil_type": context.get("soil_type", "gravel"),
            "ground_condition": context.get("ground_condition", "normal"),
            "engine_rpm": tel.get("engine_rpm", 1900),
            "engine_temperature_c": tel.get("engine_temperature_c") or tel.get("engine_temp", 90),
            "hydraulic_pressure_bar": tel.get("hydraulic_pressure_bar") or tel.get("hydraulic_pressure", 240),
            "hydraulic_oil_temperature_c": tel.get("hydraulic_oil_temperature_c", 75),
            "fuel_rate_lph": tel.get("fuel_rate_lph") or tel.get("fuel_rate", 22.0),
            "fuel_level_pct": tel.get("fuel_level_pct", 65),
            "vehicle_speed_kmh": tel.get("vehicle_speed_kmh") or tel.get("speed", 3.5),
            "idle_duration_min": tel.get("idle_duration_min", 0),
            "blade_load_pct": tel.get("blade_load_pct", 70),
            "blade_angle_deg": tel.get("blade_angle_deg", 10),
            "blade_height_m": tel.get("blade_height_m", 0.1),
            "drawbar_load_pct": tel.get("drawbar_load_pct", 60),
            "traction_force_kn": tel.get("traction_force_kn", 120),
            "left_track_speed_kmh": tel.get("left_track_speed_kmh", 3.5),
            "right_track_speed_kmh": tel.get("right_track_speed_kmh", 3.5),
            "track_slip_pct": tel.get("track_slip_pct", 5),
            "vibration_level": tel.get("vibration_level", 2.0),
            "slope_deg": tel.get("slope_deg", 5),
            "ambient_temperature_c": tel.get("ambient_temperature_c", 26),
            "operator_experience_years": m_ctx.get("operator_experience_years", 6),
            "machine_hours": m_ctx.get("machine_hours", 3400),
            "maintenance_due_days": m_ctx.get("maintenance_due_days", 14),
            "previous_anomaly_count_1hr": m_ctx.get("previous_anomaly_count_1hr", 0),
        }

        df = pd.DataFrame([[row.get(f) for f in features]], columns=features)
        pred = str(model.predict(df)[0])
        probs = model.predict_proba(df)[0]
        confidence = float(max(probs))
        class_probs = {c: round(float(p), 4) for c, p in zip(classes, probs)}

        is_anomaly = (pred != "Normal")
        message = BULLDOZER_MESSAGES.get(pred, "Unusual bulldozer behavior detected.")
        action = RECOMMENDED_ACTIONS.get(pred, "Inspect bulldozer powertrain.")

        return {
            "machineType": "bulldozer",
            "machineId": context.get("machine_id", "CAT-D6-03"),
            "operatorId": context.get("operator_id"),
            "isAnomaly": is_anomaly,
            "prediction": pred,
            "message": message,
            "recommendedAction": action,
            "confidence": round(confidence, 4),
            "confidencePercent": round(confidence * 100, 1),
            "classProbabilities": class_probs,
            "timestamp": context.get("timestamp") or datetime.utcnow().isoformat()
        }

    def predict_loader(self, machine_input: Dict[str, Any]) -> Dict[str, Any]:
        artifact = model_registry.get_loader_model()
        if not artifact or "model" not in artifact:
            return self._build_mock_response("wheel_loader", machine_input)

        model = artifact["model"]
        features = artifact["features"]
        classes = artifact["classes"]

        context = machine_input.get("context", {})
        tel = machine_input.get("telemetry", {})
        m_ctx = machine_input.get("machine_context", {})

        row = {
            "task_type": context.get("task_type", "loading"),
            "material_type": context.get("material_type", "aggregate"),
            "ground_condition": context.get("ground_condition", "normal"),
            "engine_rpm": tel.get("engine_rpm", 1650),
            "engine_temperature_c": tel.get("engine_temperature_c") or tel.get("engine_temp", 85),
            "transmission_temperature_c": tel.get("transmission_temperature_c", 78),
            "hydraulic_pressure_bar": tel.get("hydraulic_pressure_bar") or tel.get("hydraulic_pressure", 250),
            "hydraulic_oil_temperature_c": tel.get("hydraulic_oil_temperature_c", 70),
            "fuel_rate_lph": tel.get("fuel_rate_lph") or tel.get("fuel_rate", 14.5),
            "fuel_level_pct": tel.get("fuel_level_pct", 75),
            "vehicle_speed_kmh": tel.get("vehicle_speed_kmh") or tel.get("speed", 6.5),
            "idle_duration_min": tel.get("idle_duration_min", 0),
            "bucket_load_pct": tel.get("bucket_load_pct", 70),
            "bucket_fill_ratio_pct": tel.get("bucket_fill_ratio_pct", 85),
            "lift_height_m": tel.get("lift_height_m", 2.2),
            "forward_speed_kmh": tel.get("forward_speed_kmh", 5.0),
            "reverse_speed_kmh": tel.get("reverse_speed_kmh", 4.0),
            "acceleration_m_s2": tel.get("acceleration_m_s2", 1.2),
            "braking_intensity": tel.get("braking_intensity", 0.4),
            "front_tire_slip_pct": tel.get("front_tire_slip_pct", 4),
            "rear_tire_slip_pct": tel.get("rear_tire_slip_pct", 3),
            "steering_angle_deg": tel.get("steering_angle_deg", 12),
            "cycle_time_sec": tel.get("cycle_time_sec", 32),
            "ambient_temperature_c": tel.get("ambient_temperature_c", 25),
            "slope_deg": tel.get("slope_deg", 1),
            "operator_experience_years": m_ctx.get("operator_experience_years", 5),
            "machine_hours": m_ctx.get("machine_hours", 2150),
            "maintenance_due_days": m_ctx.get("maintenance_due_days", 22),
            "previous_anomaly_count_1hr": m_ctx.get("previous_anomaly_count_1hr", 0),
        }

        df = pd.DataFrame([[row.get(f) for f in features]], columns=features)
        pred = str(model.predict(df)[0])
        probs = model.predict_proba(df)[0]
        confidence = float(max(probs))
        class_probs = {c: round(float(p), 4) for c, p in zip(classes, probs)}

        is_anomaly = (pred != "Normal")
        message = LOADER_MESSAGES.get(pred, "Unusual loader behavior detected.")
        action = RECOMMENDED_ACTIONS.get(pred, "Inspect loader hydraulics and driveline.")

        return {
            "machineType": "wheel_loader",
            "machineId": context.get("machine_id", "CAT-950-02"),
            "operatorId": context.get("operator_id"),
            "isAnomaly": is_anomaly,
            "prediction": pred,
            "message": message,
            "recommendedAction": action,
            "confidence": round(confidence, 4),
            "confidencePercent": round(confidence * 100, 1),
            "classProbabilities": class_probs,
            "timestamp": context.get("timestamp") or datetime.utcnow().isoformat()
        }

    def _build_mock_response(self, mtype: str, machine_input: Dict[str, Any]) -> Dict[str, Any]:
        context = machine_input.get("context", {})
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
