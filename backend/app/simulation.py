"""
Synthetic telemetry for the live demo stream (routers/simulation.py).

Readings start from the "Normal" median profile each anomaly model was trained on, with small noise,
and follow a scripted timeline. The ML drift phase slides gradually from normal into an anomaly
profile, so the model's confidence climbs over several readings instead of jumping.
"""
import random
from typing import Dict, List, Optional, Tuple

from app.inference.services.anomaly_service import NORMAL_PROFILE
from app.machine_types import BULLDOZER, EXCAVATOR, WHEEL_LOADER
from app.schemas.telemetry import TelemetryIngestRequest

# (phase, start second, end second). The stream stops itself after the last phase.
TIMELINES: Dict[str, List[Tuple[str, int, int]]] = {
    # ~40 s: the seatbelt alert (t=3) is unacknowledged for 20 s by the incident phase, so it auto-escalates
    "safety_crisis": [
        ("normal", 0, 3),
        ("seatbelt", 3, 9),
        ("proximity", 9, 18),
        ("incident", 18, 24),
        ("ml_drift", 24, 36),
        ("hold", 36, 40),
    ],
    "machine_fault": [("normal", 0, 10), ("ml_drift", 10, 40), ("hold", 40, 50)],
    "normal": [("normal", 0, 180)],
}

# Ground speed while working normally vs. travelling fast (seatbelt phase), km/h
SPEEDS = {EXCAVATOR: (2.8, 4.5), WHEEL_LOADER: (9.0, 14.0), BULLDOZER: (6.0, 9.0)}

# Where the ML drift phase ends up, per machine type (checked against the models)
DRIFT_TARGET = {
    EXCAVATOR: {"engine_temperature_c": 104, "hydraulic_oil_temperature_c": 87, "engine_rpm": 2200},
    WHEEL_LOADER: {"transmission_temperature_c": 110, "engine_rpm": 2150},
    BULLDOZER: {"engine_temperature_c": 104, "engine_rpm": 2200},
}

# One-shot anomaly injections for the dashboard's trigger buttons (same profiles as the operator
# app's test scenarios in frontend/cat-operator-app/src/data/machines.ts)
ANOMALY_TRIGGERS: Dict[str, List[Tuple[str, str, Dict[str, float]]]] = {
    EXCAVATOR: [
        ("overheat", "Engine Overheat", {"engine_temperature_c": 104, "hydraulic_oil_temperature_c": 87, "engine_rpm": 2200}),
        ("hydraulic", "Hydraulic Stress", {"hydraulic_pressure_bar": 335, "hydraulic_oil_temperature_c": 82, "bucket_load_pct": 94, "boom_movement_rate": 1.3}),
        ("idle", "Excess Idling", {"engine_rpm": 850, "machine_speed_kmh": 0, "idle_duration_min": 32, "bucket_cycles_per_min": 0.2}),
        ("boom", "Aggressive Boom", {"boom_movement_rate": 1.5, "arm_movement_rate": 1.5, "bucket_movement_rate": 1.5}),
        ("swing", "Swing Overspeed", {"swing_speed_rpm": 20, "machine_speed_kmh": 5.5}),
        ("overload", "Bucket Overload", {"hydraulic_pressure_bar": 335, "bucket_load_pct": 105, "fuel_rate_lph": 25.4}),
        ("vibration", "Vibration", {"vibration_level": 5.5}),
        ("lowprod", "Low Productivity", {"engine_rpm": 2077, "bucket_cycles_per_min": 0.7, "fuel_rate_lph": 23}),
    ],
    WHEEL_LOADER: [
        ("transmission", "Transmission Heat", {"transmission_temperature_c": 110, "engine_rpm": 2150}),
        ("hydraulic", "Hydraulic Stress", {"hydraulic_pressure_bar": 344, "hydraulic_oil_temperature_c": 88, "bucket_load_pct": 100}),
        ("idle", "Excess Idling", {"engine_rpm": 818, "vehicle_speed_kmh": 0.1, "idle_duration_min": 31.5, "loading_cycles_per_hour": 4.9}),
        ("overload", "Bucket Overload", {"hydraulic_pressure_bar": 333, "bucket_load_pct": 106, "bucket_fill_ratio_pct": 109}),
        ("tireslip", "Tire Slip", {"tire_slip_pct": 26, "bucket_load_pct": 95, "vehicle_speed_kmh": 5.5}),
        ("accel", "Harsh Acceleration", {"acceleration_mps2": 4, "engine_rpm": 2255, "vehicle_speed_kmh": 19.5}),
        ("braking", "Harsh Braking", {"braking_intensity": 3, "vehicle_speed_kmh": 17}),
        ("cycle", "Slow Load Cycle", {"cycle_time_sec": 90, "loading_cycles_per_hour": 12, "fuel_rate_lph": 24.8}),
    ],
    BULLDOZER: [
        ("overheat", "Engine Overheat", {"engine_temperature_c": 104, "engine_rpm": 2200}),
        ("hydraulic", "Hydraulic Stress", {"hydraulic_pressure_bar": 343, "hydraulic_oil_temperature_c": 87, "blade_load_pct": 99}),
        ("idle", "Excess Idling", {"engine_rpm": 820, "vehicle_speed_kmh": 0.1, "idle_duration_min": 31.5}),
        ("blade", "Blade Overload", {"blade_load_pct": 108, "drawbar_load_pct": 103, "traction_force_kn": 165}),
        ("slip", "Track Slip", {"track_slip_pct": 30.5}),
        ("uneven", "Uneven Tracks", {"track_speed_left_kmh": 3.5, "track_speed_right_kmh": 11.6, "track_slip_pct": 18}),
        ("depth", "Cut Too Deep", {"dozing_depth_m": 1.2, "blade_load_pct": 97, "drawbar_load_pct": 98}),
        ("grade", "Grading Error", {"grading_accuracy_error_cm": 10.4, "vehicle_speed_kmh": 3.5, "blade_angle_deg": 6.7}),
    ],
}

# Model feature → telemetry column for the 5 CAN-bus readings; everything else goes in `features`
CAN_FIELDS = {
    "engine_rpm": "engineRpm",
    "engine_temperature_c": "engineTemp",
    "hydraulic_pressure_bar": "hydraulicPressure",
    "fuel_rate_lph": "fuelRate",
}
SPEED_FEATURES = ("machine_speed_kmh", "vehicle_speed_kmh")
# Features that stay fixed during the stream (context the model expects, not sensor noise)
STATIC_FEATURES = {"operator_experience_years", "machine_hours", "maintenance_due_days", "previous_anomaly_count_1hr"}


def phase_at(scenario: str, elapsed: float) -> Optional[Tuple[str, float]]:
    """Current phase and progress through it (0..1), or None once the timeline is over."""
    for name, start, end in TIMELINES[scenario]:
        if start <= elapsed < end:
            return name, (elapsed - start) / (end - start)
    return None


def timeline_length(scenario: str) -> int:
    return TIMELINES[scenario][-1][2]


def _noisy(v: float, pct: float = 0.015) -> float:
    return round(v * (1 + random.uniform(-pct, pct)), 2)


def _reading(
    machine_id: str, operator_id: Optional[str], mtype: str, values: Dict[str, float],
    speed: float, seatbelt: bool, proximity: float,
) -> TelemetryIngestRequest:
    can = {CAN_FIELDS[k]: v for k, v in values.items() if k in CAN_FIELDS}
    features = {k: v for k, v in values.items() if k not in CAN_FIELDS and k not in SPEED_FEATURES and k not in STATIC_FEATURES}
    return TelemetryIngestRequest(
        machineId=machine_id,
        operatorId=operator_id,
        speed=round(speed, 1),
        seatbeltFastened=seatbelt,
        proximityM=round(proximity, 1),
        features=features,
        source="simulation",
        **can,
    )


def build_reading(
    mtype: str, machine_id: str, operator_id: Optional[str], phase: str, progress: float,
) -> TelemetryIngestRequest:
    normal = {k: _noisy(v) for k, v in NORMAL_PROFILE[mtype].items()}
    work_speed, fast_speed = SPEEDS[mtype]
    speed, seatbelt, proximity = _noisy(work_speed, 0.1), True, _noisy(15, 0.05)

    if phase == "seatbelt":
        speed, seatbelt = _noisy(fast_speed, 0.05), False
    elif phase == "proximity":
        # Obstacle closes in: 12 m → 4 m → 1.8 m, machine slowing down
        proximity = 12 - (12 - 1.8) * min(1.0, progress * 1.25)
        speed = max(0.5, work_speed * (1 - progress))
    elif phase == "incident":
        proximity, speed = 1.8, 0.0
    elif phase in ("ml_drift", "hold"):
        # Linear drift from normal to the anomaly profile over the first 80% of the phase
        t = 1.0 if phase == "hold" else min(1.0, progress / 0.8)
        for k, target in DRIFT_TARGET[mtype].items():
            normal[k] = round(normal[k] + (target - normal[k]) * t, 2)

    return _reading(machine_id, operator_id, mtype, normal, speed, seatbelt, proximity)


def build_trigger(
    mtype: str, machine_id: str, operator_id: Optional[str], event: str,
) -> Optional[TelemetryIngestRequest]:
    """Single injected reading for a dashboard trigger button; None if the event is unknown."""
    if event == "seatbelt":
        return build_reading(mtype, machine_id, operator_id, "seatbelt", 0.5)
    if event == "proximity":
        return build_reading(mtype, machine_id, operator_id, "incident", 0)
    if event == "normal":
        return build_reading(mtype, machine_id, operator_id, "normal", 0)
    if event.startswith("anomaly:"):
        profile = next((p for i, _, p in ANOMALY_TRIGGERS[mtype] if i == event.split(":", 1)[1]), None)
        if profile is None:
            return None
        values = {**{k: _noisy(v) for k, v in NORMAL_PROFILE[mtype].items()}, **profile}
        speed = next((values[k] for k in SPEED_FEATURES if k in profile), SPEEDS[mtype][0])
        return _reading(machine_id, operator_id, mtype, values, speed, True, 15)
    return None


def trigger_options(mtype: str) -> List[Dict[str, str]]:
    return [
        {"id": "seatbelt", "label": "Seatbelt Alert"},
        {"id": "proximity", "label": "Proximity Hazard"},
        *({"id": f"anomaly:{i}", "label": label} for i, label, _ in ANOMALY_TRIGGERS[mtype]),
    ]
