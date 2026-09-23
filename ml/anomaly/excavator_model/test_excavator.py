from excavator_predictor import predict_excavator
machine_input = {

    "machine_type": "excavator",

    "context": {
        "machine_id": "EXC-1024",
        "operator_id": "OP-204",
        "timestamp": "2026-09-23T16:30:00",

        "task_type": "excavation",
        "soil_type": "clay",
        "ground_condition": "wet"
    },

    "telemetry": {

        "engine_rpm": 1850,
        "engine_temperature_c": 82,

        "hydraulic_pressure_bar": 245,
        "hydraulic_oil_temperature_c": 71,

        "fuel_rate_lph": 14.2,
        "fuel_level_pct": 63,

        "machine_speed_kmh": 2.4,
        "idle_duration_min": 0,

        "boom_movement_rate": 32,
        "arm_movement_rate": 28,
        "bucket_movement_rate": 25,

        "swing_speed_rpm": 7,

        "bucket_cycles_per_min": 8,
        "excavation_depth_m": 2.1,
        "bucket_load_pct": 68,

        "vibration_level": 1.8,

        "slope_deg": 4,
        "ambient_temperature_c": 31
    },

    "machine_context": {

        "operator_experience_years": 5,
        "machine_hours": 4200,
        "maintenance_due_days": 18,
        "previous_anomaly_count_1hr": 0
    }
}
result = predict_excavator(machine_input)

print(result)