from bulldozer_predictor import predict_bulldozer


machine_input = {

    "machine_type": "bulldozer",

    "context": {
        "machine_id": "BD-1024",
        "operator_id": "OP-204",
        "timestamp": "2026-09-23T16:30:00",

        "task_type": "dozing",
        "soil_type": "clay",
        "ground_condition": "wet"
    },

    "telemetry": {

        "engine_rpm": 1800,
        "engine_temperature_c": 82,

        "hydraulic_pressure_bar": 240,
        "hydraulic_oil_temperature_c": 70,

        "fuel_rate_lph": 18.0,
        "fuel_level_pct": 62,

        "vehicle_speed_kmh": 5.5,
        "idle_duration_min": 0,

        "blade_load_pct": 70,
        "blade_angle_deg": 6,
        "blade_height_m": 0.4,

        "drawbar_load_pct": 65,
        "traction_force_kn": 70,

        "track_speed_left_kmh": 5.2,
        "track_speed_right_kmh": 5.1,
        "track_slip_pct": 4,

        "dozing_depth_m": 0.3,
        "grading_accuracy_error_cm": 3,

        "vibration_level": 1.7,

        "slope_deg": 3,
        "ambient_temperature_c": 31
    },

    "machine_context": {

        "operator_experience_years": 5,
        "machine_hours": 4200,
        "maintenance_due_days": 18,
        "previous_anomaly_count_1hr": 0
    }
}


result = predict_bulldozer(machine_input)

print(result)