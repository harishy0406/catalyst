from pydantic import BaseModel
from typing import Optional, List, Dict, Any


class TelemetryIngestRequest(BaseModel):
    machineId: str
    operatorId: Optional[str] = None
    engineRpm: Optional[float] = None
    fuelRate: Optional[float] = None
    hydraulicPressure: Optional[float] = None
    engineTemp: Optional[float] = None
    speed: Optional[float] = None
    odometer: Optional[float] = None
    latitude: Optional[float] = None
    longitude: Optional[float] = None
    timestamp: Optional[str] = None
    # Cab safety sensors
    seatbeltFastened: Optional[bool] = None
    proximityM: Optional[float] = None
    # Extra anomaly-model features beyond the 5 CAN readings, e.g. {"swing_speed_rpm": 20}
    features: Optional[Dict[str, float]] = None
    # 'live' or 'simulation' (demo stream rows are tagged so they can be filtered or cleaned up)
    source: Optional[str] = "live"


class AlertItem(BaseModel):
    id: str
    machineId: str
    severity: str
    message: str
    ruleId: Optional[str] = None
    createdAt: str


class AnomalyItem(BaseModel):
    type: str
    severity: str
    description: str
    detectedAt: str


class TelemetryResponse(BaseModel):
    success: bool
    telemetryId: str
    alertsTriggered: List[Dict[str, Any]] = []
    anomaliesDetected: List[Dict[str, Any]] = []
    incidentsCreated: List[Dict[str, Any]] = []
    mlPrediction: Optional[Dict[str, Any]] = None
