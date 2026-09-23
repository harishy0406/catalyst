from pydantic import BaseModel, Field
from typing import Optional, Dict, Any, List


# -------------------------------------------------------------
# TASK TIME ESTIMATION SCHEMAS
# -------------------------------------------------------------

class TaskTimePredictRequest(BaseModel):
    # Core Task & Machine Parameters
    taskType: Optional[str] = Field("Trenching", description="Task type (Trenching, Loading, Grading, etc.)")
    machineType: Optional[str] = Field("Excavator", description="Machine type (Excavator, Bulldozer, Wheel Loader)")
    estimatedMinutes: Optional[float] = Field(60.0, description="Baseline planned duration in minutes")

    # Environmental & Operational Modifiers
    weatherCondition: Optional[str] = Field("Clear", description="Weather (Clear, Rain, Sunny, Cloudy)")
    operatorSkill: Optional[str] = Field("Intermediate", description="Operator skill (Beginner, Intermediate, Expert)")
    machineAgeYears: Optional[float] = Field(2.0, description="Machine age in years")
    operatorFatigueLevel: Optional[float] = Field(2.0, description="Fatigue level on 1-5 scale")
    taskVolume: Optional[float] = Field(120.0, description="Work volume in cubic meters / units")
    loadWeightTons: Optional[float] = Field(10.0, description="Payload weight in metric tons")
    travelDistanceMeters: Optional[float] = Field(45.0, description="Haul/travel distance in meters")
    siteTerrain: Optional[str] = Field("Flat", description="Terrain type (Flat, Slope, Rough, Rocky)")
    siteCondition: Optional[str] = Field("Normal", description="Condition (Normal, Wet, Muddy, Dry)")
    temperatureC: Optional[float] = Field(24.0, description="Ambient temperature in °C")
    humidityPercent: Optional[float] = Field(50.0, description="Relative humidity %")
    visibility: Optional[str] = Field("Good", description="Visibility condition (Good, Moderate, Poor)")
    shiftTime: Optional[str] = Field("Morning", description="Shift (Morning, Afternoon, Night)")
    machineMaintenanceStatus: Optional[str] = Field("Good", description="Maintenance state (Good, Fair, Poor)")


class TaskTimePredictResponse(BaseModel):
    predictedMinutes: float
    estimatedBaselineMinutes: float
    deviationMinutes: float
    deviationPercent: float
    confidenceScore: float
    confidenceLabel: str
    modelType: str
    featuresUsed: Dict[str, Any]
    riskAssessment: str
    fallbackUsed: bool


# Backward compatibility aliases
class MLPredictRequest(BaseModel):
    taskType: str
    weatherCondition: str = "clear"
    operatorSkill: str = "intermediate"
    machineAgeYears: float = 2.0
    baseTime: Optional[float] = None


class MLPredictResponse(BaseModel):
    predictedMinutes: float
    confidence: float
    modelType: str
    factors: Dict[str, float]
    maeTargetMet: bool


class MLMetricsResponse(BaseModel):
    mae: float
    rmse: float
    targetMae: float = 7.6
    targetRmse: float = 9.23
    sampleCount: int
    modelStatus: str


class MLTrainResponse(BaseModel):
    success: bool
    samplesTrained: int
    metrics: Dict[str, float]


# -------------------------------------------------------------
# ANOMALY DETECTION SCHEMAS
# -------------------------------------------------------------

class AnomalyContext(BaseModel):
    machine_id: Optional[str] = "CAT-320-01"
    operator_id: Optional[str] = "OP-4412"
    timestamp: Optional[str] = None
    task_type: Optional[str] = "excavation"
    soil_type: Optional[str] = "clay"
    ground_condition: Optional[str] = "normal"
    material_type: Optional[str] = "aggregate"


class AnomalyTelemetry(BaseModel):
    engine_rpm: Optional[float] = 1750.0
    engine_temperature_c: Optional[float] = 88.0
    hydraulic_pressure_bar: Optional[float] = 260.0
    hydraulic_oil_temperature_c: Optional[float] = 72.0
    transmission_temperature_c: Optional[float] = 78.0
    fuel_rate_lph: Optional[float] = 16.5
    fuel_level_pct: Optional[float] = 70.0
    machine_speed_kmh: Optional[float] = 2.0
    vehicle_speed_kmh: Optional[float] = 2.0
    idle_duration_min: Optional[float] = 0.0
    boom_movement_rate: Optional[float] = 24.0
    arm_movement_rate: Optional[float] = 22.0
    bucket_movement_rate: Optional[float] = 20.0
    swing_speed_rpm: Optional[float] = 6.0
    bucket_cycles_per_min: Optional[float] = 6.0
    excavation_depth_m: Optional[float] = 1.8
    bucket_load_pct: Optional[float] = 65.0
    blade_load_pct: Optional[float] = 60.0
    blade_angle_deg: Optional[float] = 10.0
    blade_height_m: Optional[float] = 0.1
    drawbar_load_pct: Optional[float] = 50.0
    traction_force_kn: Optional[float] = 100.0
    track_slip_pct: Optional[float] = 5.0
    vibration_level: Optional[float] = 1.5
    slope_deg: Optional[float] = 2.0
    ambient_temperature_c: Optional[float] = 25.0


class AnomalyMachineContext(BaseModel):
    operator_experience_years: Optional[float] = 5.0
    machine_hours: Optional[float] = 3000.0
    maintenance_due_days: Optional[float] = 18.0
    previous_anomaly_count_1hr: Optional[float] = 0.0


class AnomalyPredictRequest(BaseModel):
    machine_type: Optional[str] = Field("excavator", description="excavator, bulldozer, or wheel_loader")
    context: Optional[AnomalyContext] = Field(default_factory=AnomalyContext)
    telemetry: Optional[AnomalyTelemetry] = Field(default_factory=AnomalyTelemetry)
    machine_context: Optional[AnomalyMachineContext] = Field(default_factory=AnomalyMachineContext)


class AnomalyPredictResponse(BaseModel):
    machineType: str
    machineId: str
    operatorId: Optional[str] = None
    isAnomaly: bool
    prediction: str
    message: str
    recommendedAction: str
    confidence: float
    confidencePercent: float
    classProbabilities: Dict[str, float]
    timestamp: Optional[str] = None
