import joblib
import pandas as pd
from datetime import datetime


# ============================================================
# LOAD MODEL
# ============================================================

MODEL_PATH = "excavator_anomaly_model.pkl"

model_artifact = joblib.load(MODEL_PATH)

model = model_artifact["model"]
EXPECTED_FEATURES = model_artifact["features"]
CLASSES = model_artifact["classes"]


# ============================================================
# INPUT TRANSFORMATION
# ============================================================

def transform_input(machine_input):
    """
    Converts backend-friendly input format into the
    exact feature format expected by the ML model.
    """

    context = machine_input.get("context", {})
    telemetry = machine_input.get("telemetry", {})
    machine_context = machine_input.get("machine_context", {})

    model_input = {

        # Context
        "task_type": context.get("task_type"),
        "soil_type": context.get("soil_type"),
        "ground_condition": context.get("ground_condition"),

        # Engine
        "engine_rpm": telemetry.get("engine_rpm"),
        "engine_temperature_c": telemetry.get("engine_temperature_c"),

        # Hydraulic
        "hydraulic_pressure_bar":
            telemetry.get("hydraulic_pressure_bar"),

        "hydraulic_oil_temperature_c":
            telemetry.get("hydraulic_oil_temperature_c"),

        # Fuel
        "fuel_rate_lph":
            telemetry.get("fuel_rate_lph"),

        "fuel_level_pct":
            telemetry.get("fuel_level_pct"),

        # Movement
        "machine_speed_kmh":
            telemetry.get("machine_speed_kmh"),

        "idle_duration_min":
            telemetry.get("idle_duration_min"),

        "boom_movement_rate":
            telemetry.get("boom_movement_rate"),

        "arm_movement_rate":
            telemetry.get("arm_movement_rate"),

        "bucket_movement_rate":
            telemetry.get("bucket_movement_rate"),

        "swing_speed_rpm":
            telemetry.get("swing_speed_rpm"),

        # Excavation
        "bucket_cycles_per_min":
            telemetry.get("bucket_cycles_per_min"),

        "excavation_depth_m":
            telemetry.get("excavation_depth_m"),

        "bucket_load_pct":
            telemetry.get("bucket_load_pct"),

        # Environment / condition
        "vibration_level":
            telemetry.get("vibration_level"),

        "slope_deg":
            telemetry.get("slope_deg"),

        "ambient_temperature_c":
            telemetry.get("ambient_temperature_c"),

        # Machine/operator context
        "operator_experience_years":
            machine_context.get("operator_experience_years"),

        "machine_hours":
            machine_context.get("machine_hours"),

        "maintenance_due_days":
            machine_context.get("maintenance_due_days"),

        "previous_anomaly_count_1hr":
            machine_context.get("previous_anomaly_count_1hr")
    }

    # Convert into DataFrame
    df = pd.DataFrame([model_input])

    # Guarantee exact column order
    df = df[EXPECTED_FEATURES]

    return df


# ============================================================
# PREDICTION
# ============================================================


def predict_excavator(machine_input):

    # Transform input
    model_input = transform_input(machine_input)

    # Prediction
    prediction = model.predict(model_input)[0]

    # Probabilities
    probabilities = model.predict_proba(model_input)[0]

    # Confidence
    confidence = float(max(probabilities))

    # Probability for each class
    class_probabilities = {
        class_name: round(float(prob), 4)
        for class_name, prob in zip(CLASSES, probabilities)
    }

    # Determine anomaly status
    is_anomaly = prediction != "Normal"

    # Human-readable messages
    messages = {
        "Normal":
            "No unusual machine behavior detected.",

        "Excessive_Idling":
            "Excessive idling detected. The excavator has remained idle for an unusually long duration.",

        "Hydraulic_Stress":
            "Hydraulic stress detected. The machine is showing an unusual hydraulic operating pattern.",

        "Engine_Overheating":
            "Engine overheating detected. The engine temperature and operating conditions indicate abnormal behavior.",

        "Aggressive_Boom_Movement":
            "Aggressive boom movement detected. The boom is being operated with unusually high movement intensity.",

        "Excessive_Swing_Speed":
            "Excessive swing speed detected. The excavator is operating with unusually high swing speed.",

        "Bucket_Overloading":
            "Bucket overloading detected. The bucket load appears unusually high.",

        "Abnormal_Vibration":
            "Abnormal vibration detected. The machine is showing an unusual vibration pattern.",

        "Low_Excavation_Productivity":
            "Low excavation productivity detected. The current operating pattern indicates reduced excavation efficiency."
    }

    message = messages.get(
        prediction,
        "Unusual machine behavior detected."
    )

    # Machine/context information
    context = machine_input.get("context", {})

    result = {
        "machine_type": "excavator",

        "machine_id": context.get("machine_id"),
        "operator_id": context.get("operator_id"),
        "timestamp": context.get("timestamp"),

        # True / False
        "is_anomaly": is_anomaly,

        # Actual ML prediction
        "prediction": prediction,

        # Human-readable explanation
        "message": message,

        # Confidence
        "confidence": round(confidence, 4),

        "confidence_percent":
            round(confidence * 100, 2),

        # Probability for every class
        "class_probabilities":
            class_probabilities
    }

    return result

