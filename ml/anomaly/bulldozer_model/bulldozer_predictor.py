import joblib
import pandas as pd
from datetime import datetime


# ============================================================
# LOAD MODEL
# ============================================================

MODEL_PATH = "bulldozer_anomaly_model.pkl"

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

        # ----------------------------------------------------
        # Context
        # ----------------------------------------------------

        "task_type":
            context.get("task_type"),

        "soil_type":
            context.get("soil_type"),

        "ground_condition":
            context.get("ground_condition"),


        # ----------------------------------------------------
        # Engine
        # ----------------------------------------------------

        "engine_rpm":
            telemetry.get("engine_rpm"),

        "engine_temperature_c":
            telemetry.get("engine_temperature_c"),


        # ----------------------------------------------------
        # Hydraulic
        # ----------------------------------------------------

        "hydraulic_pressure_bar":
            telemetry.get("hydraulic_pressure_bar"),

        "hydraulic_oil_temperature_c":
            telemetry.get("hydraulic_oil_temperature_c"),


        # ----------------------------------------------------
        # Fuel
        # ----------------------------------------------------

        "fuel_rate_lph":
            telemetry.get("fuel_rate_lph"),

        "fuel_level_pct":
            telemetry.get("fuel_level_pct"),


        # ----------------------------------------------------
        # Movement
        # ----------------------------------------------------

        "vehicle_speed_kmh":
            telemetry.get("vehicle_speed_kmh"),

        "idle_duration_min":
            telemetry.get("idle_duration_min"),


        # ----------------------------------------------------
        # Blade
        # ----------------------------------------------------

        "blade_load_pct":
            telemetry.get("blade_load_pct"),

        "blade_angle_deg":
            telemetry.get("blade_angle_deg"),

        "blade_height_m":
            telemetry.get("blade_height_m"),


        # ----------------------------------------------------
        # Traction / Load
        # ----------------------------------------------------

        "drawbar_load_pct":
            telemetry.get("drawbar_load_pct"),

        "traction_force_kn":
            telemetry.get("traction_force_kn"),


        # ----------------------------------------------------
        # Tracks
        # ----------------------------------------------------

        "track_speed_left_kmh":
            telemetry.get("track_speed_left_kmh"),

        "track_speed_right_kmh":
            telemetry.get("track_speed_right_kmh"),

        "track_slip_pct":
            telemetry.get("track_slip_pct"),


        # ----------------------------------------------------
        # Dozing / Grading
        # ----------------------------------------------------

        "dozing_depth_m":
            telemetry.get("dozing_depth_m"),

        "grading_accuracy_error_cm":
            telemetry.get("grading_accuracy_error_cm"),


        # ----------------------------------------------------
        # Environment / Condition
        # ----------------------------------------------------

        "vibration_level":
            telemetry.get("vibration_level"),

        "slope_deg":
            telemetry.get("slope_deg"),

        "ambient_temperature_c":
            telemetry.get("ambient_temperature_c"),


        # ----------------------------------------------------
        # Machine / Operator Context
        # ----------------------------------------------------

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

def predict_bulldozer(machine_input):

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


    # ========================================================
    # HUMAN-READABLE MESSAGES
    # ========================================================

    messages = {

        "Normal":
            "No unusual machine behavior detected.",


        "Excessive_Idling":
            "Excessive idling detected. The bulldozer has remained idle for an unusually long duration.",


        "Blade_Overloading":
            "Blade overloading detected. The blade load appears unusually high.",


        "Engine_Overheating":
            "Engine overheating detected. The engine temperature and operating conditions indicate abnormal behavior.",


        "Hydraulic_Stress":
            "Hydraulic stress detected. The machine is showing an unusual hydraulic operating pattern.",


        "Excessive_Dozing_Depth":
            "Excessive dozing depth detected. The bulldozer is operating at an unusually deep dozing level.",


        "Uneven_Track_Speed":
            "Uneven track speed detected. The left and right tracks are operating at an unusual speed difference.",


        "Track_Slip":
            "Track slip detected. The bulldozer is experiencing unusually high track slip.",


        "Poor_Grading_Performance":
            "Poor grading performance detected. The current operating pattern indicates reduced grading accuracy."
    }


    message = messages.get(
        prediction,
        "Unusual machine behavior detected."
    )


    # ========================================================
    # MACHINE / CONTEXT INFORMATION
    # ========================================================

    context = machine_input.get("context", {})


    result = {

        "machine_type":
            "bulldozer",


        "machine_id":
            context.get("machine_id"),


        "operator_id":
            context.get("operator_id"),


        "timestamp":
            context.get("timestamp"),


        # True / False
        "is_anomaly":
            is_anomaly,


        # Actual ML prediction
        "prediction":
            prediction,


        # Human-readable explanation
        "message":
            message,


        # Confidence
        "confidence":
            round(confidence, 4),


        "confidence_percent":
            round(confidence * 100, 2),


        # Probability for every class
        "class_probabilities":
            class_probabilities
    }


    return result