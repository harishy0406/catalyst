from loader_predictor import predict_loader

machine_input = {

    "machine_type": "wheel_loader",

    "context": {
        "machine_id": "WL-1024",
        "operator_id": "OP-204",
        "timestamp": "2026-09-23T16:30:00",

        "task_type": "loading",
        "material_type": "sand",
        "ground_condition": "dry"
    },

    "telemetry": {

        "engine_rpm": 1800,
        "engine_temperature_c": 82,
        "transmission_temperature_c": 76,

        "hydraulic_pressure_bar": 240,
        "hydraulic_oil_temperature_c": 70,

        "fuel_rate_lph": 16.5,
        "fuel_level_pct": 62,

        "vehicle_speed_kmh": 8.5,
        "idle_duration_min": 2,

        "bucket_load_pct": 72,
        "bucket_fill_ratio_pct": 80,
        "lift_height_m": 3.2,

        "forward_speed_kmh": 8.5,
        "reverse_speed_kmh": 4.0,

        "acceleration_mps2": 1.2,
        "braking_intensity": 0.3,

        "loading_cycles_per_hour": 22,
        "cycle_time_sec": 165,

        "tire_slip_pct": 4,

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

result = predict_loader(machine_input)

print(result)