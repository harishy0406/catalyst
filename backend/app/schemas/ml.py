from pydantic import BaseModel, ConfigDict, Field
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

# Every field is optional and defaults to None: the anomaly service fills anything missing with the
# "Normal" median for that machine type (see NORMAL_PROFILE in anomaly_service.py). Extra keys are
# accepted so callers can send any feature a model uses (e.g. braking_intensity for the loader).

class AnomalyContext(BaseModel):
    model_config = ConfigDict(extra="allow")
    machine_id: Optional[str] = None
    operator_id: Optional[str] = None
    timestamp: Optional[str] = None
    task_type: Optional[str] = None
    soil_type: Optional[str] = None
    ground_condition: Optional[str] = None
    material_type: Optional[str] = None


class AnomalyTelemetry(BaseModel):
    model_config = ConfigDict(extra="allow")
    engine_rpm: Optional[float] = None
    engine_temperature_c: Optional[float] = None
    hydraulic_pressure_bar: Optional[float] = None
    hydraulic_oil_temperature_c: Optional[float] = None
    transmission_temperature_c: Optional[float] = None
    fuel_rate_lph: Optional[float] = None
    fuel_level_pct: Optional[float] = None
    machine_speed_kmh: Optional[float] = None
    vehicle_speed_kmh: Optional[float] = None
    idle_duration_min: Optional[float] = None
    boom_movement_rate: Optional[float] = None
    arm_movement_rate: Optional[float] = None
    bucket_movement_rate: Optional[float] = None
    swing_speed_rpm: Optional[float] = None
    bucket_cycles_per_min: Optional[float] = None
    excavation_depth_m: Optional[float] = None
    bucket_load_pct: Optional[float] = None
    blade_load_pct: Optional[float] = None
    blade_angle_deg: Optional[float] = None
    blade_height_m: Optional[float] = None
    drawbar_load_pct: Optional[float] = None
    traction_force_kn: Optional[float] = None
    track_slip_pct: Optional[float] = None
    vibration_level: Optional[float] = None
    slope_deg: Optional[float] = None
    ambient_temperature_c: Optional[float] = None


class AnomalyMachineContext(BaseModel):
    model_config = ConfigDict(extra="allow")
    operator_experience_years: Optional[float] = None
    machine_hours: Optional[float] = None
    maintenance_due_days: Optional[float] = None
    previous_anomaly_count_1hr: Optional[float] = None


class AnomalyPredictRequest(BaseModel):
    machine_type: Optional[str] = Field(None, description="excavator, bulldozer, or wheel_loader")
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
