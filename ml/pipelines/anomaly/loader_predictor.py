import joblib
import pandas as pd


# ============================================================
# LOAD MODEL
# ============================================================

MODEL_PATH = "loader_anomaly_model.pkl"

model_data = joblib.load(MODEL_PATH)

model = model_data["model"]

EXPECTED_FEATURES = model_data["features"]

CLASSES = model_data["classes"]


# ============================================================
# INPUT TRANSFORMATION
# ============================================================

def transform_input(machine_input):
    """
    Converts backend-friendly loader input into the exact
    feature format expected by the trained ML model.
    """

    context = machine_input.get("context", {})
    telemetry = machine_input.get("telemetry", {})
    machine_context = machine_input.get("machine_context", {})

    model_input = {

        # ----------------------------------------------------
        # Operating Context
        # ----------------------------------------------------

        "task_type":
            context.get("task_type"),

        "material_type":
            context.get("material_type"),

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
        # Transmission
        # ----------------------------------------------------

        "transmission_temperature_c":
            telemetry.get("transmission_temperature_c"),


        # ----------------------------------------------------
        # Hydraulic System
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
        # Machine Movement
        # ----------------------------------------------------

        "vehicle_speed_kmh":
            telemetry.get("vehicle_speed_kmh"),

        "idle_duration_min":
            telemetry.get("idle_duration_min"),


        # ----------------------------------------------------
        # Bucket / Loading
        # ----------------------------------------------------

        "bucket_load_pct":
            telemetry.get("bucket_load_pct"),

        "bucket_fill_ratio_pct":
            telemetry.get("bucket_fill_ratio_pct"),

        "lift_height_m":
            telemetry.get("lift_height_m"),


        # ----------------------------------------------------
        # Driving Behaviour
        # ----------------------------------------------------

        "forward_speed_kmh":
            telemetry.get("forward_speed_kmh"),

        "reverse_speed_kmh":
            telemetry.get("reverse_speed_kmh"),

        "acceleration_mps2":
            telemetry.get("acceleration_mps2"),

        "braking_intensity":
            telemetry.get("braking_intensity"),


        # ----------------------------------------------------
        # Loading Cycle
        # ----------------------------------------------------

        "loading_cycles_per_hour":
            telemetry.get("loading_cycles_per_hour"),

        "cycle_time_sec":
            telemetry.get("cycle_time_sec"),


        # ----------------------------------------------------
        # Tires / Machine Condition
        # ----------------------------------------------------

        "tire_slip_pct":
            telemetry.get("tire_slip_pct"),

        "vibration_level":
            telemetry.get("vibration_level"),


        # ----------------------------------------------------
        # Environment
        # ----------------------------------------------------

        "slope_deg":
            telemetry.get("slope_deg"),

        "ambient_temperature_c":
            telemetry.get("ambient_temperature_c"),


        # ----------------------------------------------------
        # Operator / Machine Context
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


    # Convert dictionary into DataFrame
    df = pd.DataFrame([model_input])


    # IMPORTANT:
    # Keep exactly the same feature order used during training.
    df = df[EXPECTED_FEATURES]


    return df


# ============================================================
# PREDICTION
# ============================================================

def predict_loader(machine_input):

    # Transform backend input
    model_input = transform_input(machine_input)


    # --------------------------------------------------------
    # MODEL PREDICTION
    # --------------------------------------------------------

    prediction = model.predict(model_input)[0]


    # Probability of every class
    probabilities = model.predict_proba(model_input)[0]


    # Confidence
    confidence = float(max(probabilities))


    # --------------------------------------------------------
    # ANOMALY STATUS
    # --------------------------------------------------------

    is_anomaly = prediction != "Normal"


    # --------------------------------------------------------
    # HUMAN-READABLE MESSAGES
    # --------------------------------------------------------

    messages = {

        "Normal":
            "No unusual machine behavior detected.",

        "Excessive_Idling":
            "Excessive idling detected. The wheel loader has remained idle for an unusually long duration.",

        "Bucket_Overloading":
            "Bucket overloading detected. The bucket load appears unusually high.",

        "Excessive_Tire_Slip":
            "Excessive tire slip detected. The wheel loader is experiencing unusually high tire slip.",

        "Aggressive_Acceleration":
            "Aggressive acceleration detected. The wheel loader is accelerating more aggressively than expected.",

        "Harsh_Braking":
            "Harsh braking detected. The wheel loader is experiencing unusually high braking intensity.",

        "Transmission_Overheating":
            "Transmission overheating detected. The transmission temperature indicates an unusual operating condition.",

        "Hydraulic_Stress":
            "Hydraulic stress detected. The machine is showing an unusual hydraulic operating pattern.",

        "Inefficient_Loading_Cycle":
            "Inefficient loading cycle detected. The current loading pattern indicates reduced operating efficiency."
    }


    message = messages.get(
        prediction,
        "Unusual machine behavior detected."
    )


    # --------------------------------------------------------
    # CLASS PROBABILITIES
    # --------------------------------------------------------

    class_probabilities = {

        class_name: round(float(prob), 4)

        for class_name, prob in zip(
            CLASSES,
            probabilities
        )
    }


    # --------------------------------------------------------
    # MACHINE / OPERATOR CONTEXT
    # --------------------------------------------------------

    context = machine_input.get("context", {})


    # --------------------------------------------------------
    # FINAL RESULT
    # --------------------------------------------------------

    result = {

        "machine_type":
            "wheel_loader",

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


        # Human-readable message
        "message":
            message,


        # Confidence between 0 and 1
        "confidence":
            round(confidence, 4),


        # Confidence as percentage
        "confidence_percent":
            round(confidence * 100, 2),


        # Probability of every class
        "class_probabilities":
            class_probabilities
    }


    return result

