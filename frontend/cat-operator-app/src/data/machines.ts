/**
 * The three machine types the ML models are built around (backend/app/machine_types.py),
 * the seeded machines (backend/app/seed.py) and the payloads for ml/models/*_anomaly_model.pkl.
 */
import { ImageSourcePropType } from 'react-native';

import { AnomalyModel, ApiAnomalyRequest, ApiTelemetry } from '@/api/client';

export type Scenario = { id: string; label: string; icon: string; telemetry: Record<string, number> };

export type FleetMachine = {
  id: string;
  model: string;
  shortModel: string;
  kind: string;
  image: ImageSourcePropType;
  /** Image aspect ratio (the PNGs are transparent, sized for the hero panel). */
  aspect: number;
  anomalyModel: AnomalyModel;
  /** Task context sent with every anomaly request. Values must be categories the model was trained on. */
  context: Record<string, string>;
  /**
   * Median readings of the "Normal" class in ml/datasets/anomaly. The backend fills missing features
   * with the same values; sending them keeps results correct on backends deployed before that fix.
   */
  baseline: Record<string, number>;
  /** Test inputs checked against the models, for demoing each anomaly class. */
  scenarios: Scenario[];
};

const MACHINE_CONTEXT = { operator_experience_years: 7.7, machine_hours: 5200, maintenance_due_days: 30, previous_anomaly_count_1hr: 0 };

export const FLEET: FleetMachine[] = [
  {
    id: 'CAT-320-01',
    model: 'CAT 320 Hydraulic Excavator',
    shortModel: 'CAT Hydraulic Excavator',
    kind: 'Excavator',
    image: require('../../assets/images/machines/excavator.png'),
    aspect: 666 / 375,
    anomalyModel: 'excavator',
    context: { task_type: 'Excavation', soil_type: 'Medium', ground_condition: 'Dry' },
    baseline: {
      engine_rpm: 1800,
      engine_temperature_c: 82,
      hydraulic_pressure_bar: 270,
      hydraulic_oil_temperature_c: 62,
      fuel_rate_lph: 20,
      fuel_level_pct: 63,
      machine_speed_kmh: 2.8,
      idle_duration_min: 2.7,
      boom_movement_rate: 0.7,
      arm_movement_rate: 0.7,
      bucket_movement_rate: 0.6,
      swing_speed_rpm: 8,
      bucket_cycles_per_min: 3,
      excavation_depth_m: 2.5,
      bucket_load_pct: 70,
      vibration_level: 1.2,
      slope_deg: 4,
      ambient_temperature_c: 30,
    },
    scenarios: [
      { id: 'overheat', label: 'Engine Overheat', icon: 'device_thermostat', telemetry: { engine_temperature_c: 104, hydraulic_oil_temperature_c: 87, engine_rpm: 2200 } },
      { id: 'hydraulic', label: 'Hydraulic Stress', icon: 'compress', telemetry: { hydraulic_pressure_bar: 335, hydraulic_oil_temperature_c: 82, bucket_load_pct: 94, boom_movement_rate: 1.3 } },
      { id: 'idle', label: 'Excess Idling', icon: 'hourglass_empty', telemetry: { engine_rpm: 850, machine_speed_kmh: 0, idle_duration_min: 32, bucket_cycles_per_min: 0.2 } },
      { id: 'boom', label: 'Aggressive Boom', icon: 'open_with', telemetry: { boom_movement_rate: 1.5, arm_movement_rate: 1.5, bucket_movement_rate: 1.5 } },
      { id: 'swing', label: 'Swing Overspeed', icon: 'sync', telemetry: { swing_speed_rpm: 20, machine_speed_kmh: 5.5 } },
      { id: 'overload', label: 'Bucket Overload', icon: 'fitness_center', telemetry: { hydraulic_pressure_bar: 335, bucket_load_pct: 105, fuel_rate_lph: 25.4 } },
      { id: 'vibration', label: 'Vibration', icon: 'vibration', telemetry: { vibration_level: 5.5 } },
      { id: 'lowprod', label: 'Low Productivity', icon: 'trending_down', telemetry: { engine_rpm: 2077, bucket_cycles_per_min: 0.7, fuel_rate_lph: 23 } },
    ],
  },
  {
    id: 'CAT-950-02',
    model: 'CAT 950M Wheel Loader',
    shortModel: 'CAT Wheel Loader',
    kind: 'Wheel Loader',
    image: require('../../assets/images/machines/loader.png'),
    aspect: 664 / 376,
    anomalyModel: 'loader',
    context: { task_type: 'Loading', material_type: 'Gravel', ground_condition: 'Dry' },
    baseline: {
      engine_rpm: 1750,
      engine_temperature_c: 82,
      transmission_temperature_c: 78,
      hydraulic_pressure_bar: 255,
      hydraulic_oil_temperature_c: 61,
      fuel_rate_lph: 18.5,
      fuel_level_pct: 62,
      vehicle_speed_kmh: 9,
      machine_speed_kmh: 9,
      idle_duration_min: 2.7,
      bucket_load_pct: 72,
      vibration_level: 1.3,
      slope_deg: 3,
      ambient_temperature_c: 30,
    },
    scenarios: [
      { id: 'transmission', label: 'Transmission Heat', icon: 'device_thermostat', telemetry: { transmission_temperature_c: 110, engine_rpm: 2150 } },
      { id: 'hydraulic', label: 'Hydraulic Stress', icon: 'compress', telemetry: { hydraulic_pressure_bar: 344, hydraulic_oil_temperature_c: 88, bucket_load_pct: 100 } },
      { id: 'idle', label: 'Excess Idling', icon: 'hourglass_empty', telemetry: { engine_rpm: 818, vehicle_speed_kmh: 0.1, machine_speed_kmh: 0.1, idle_duration_min: 31.5, loading_cycles_per_hour: 4.9 } },
      { id: 'overload', label: 'Bucket Overload', icon: 'fitness_center', telemetry: { hydraulic_pressure_bar: 333, bucket_load_pct: 106, bucket_fill_ratio_pct: 109 } },
      { id: 'tireslip', label: 'Tire Slip', icon: 'swap_horiz', telemetry: { tire_slip_pct: 26, bucket_load_pct: 95, vehicle_speed_kmh: 5.5, machine_speed_kmh: 5.5 } },
      { id: 'accel', label: 'Harsh Acceleration', icon: 'speed', telemetry: { acceleration_mps2: 4, engine_rpm: 2255, vehicle_speed_kmh: 19.5, machine_speed_kmh: 19.5 } },
      { id: 'braking', label: 'Harsh Braking', icon: 'report', telemetry: { braking_intensity: 3, vehicle_speed_kmh: 17, machine_speed_kmh: 17 } },
      { id: 'cycle', label: 'Slow Load Cycle', icon: 'timer', telemetry: { cycle_time_sec: 90, loading_cycles_per_hour: 12, fuel_rate_lph: 24.8 } },
    ],
  },
  {
    id: 'CAT-D6-03',
    model: 'CAT D6 Track-Type Tractor',
    shortModel: 'CAT Dozer',
    kind: 'Bulldozer',
    image: require('../../assets/images/machines/bulldozer.png'),
    aspect: 577 / 433,
    anomalyModel: 'bulldozer',
    context: { task_type: 'Dozing', soil_type: 'Medium', ground_condition: 'Dry' },
    baseline: {
      engine_rpm: 1750,
      engine_temperature_c: 82,
      hydraulic_pressure_bar: 250,
      hydraulic_oil_temperature_c: 60,
      fuel_rate_lph: 18.5,
      fuel_level_pct: 62,
      vehicle_speed_kmh: 6,
      machine_speed_kmh: 6,
      idle_duration_min: 2.8,
      blade_load_pct: 70,
      blade_angle_deg: 8,
      blade_height_m: 0.5,
      drawbar_load_pct: 65,
      traction_force_kn: 110,
      track_slip_pct: 5,
      vibration_level: 1.4,
      slope_deg: 4,
      ambient_temperature_c: 30,
    },
    scenarios: [
      { id: 'overheat', label: 'Engine Overheat', icon: 'device_thermostat', telemetry: { engine_temperature_c: 104, engine_rpm: 2200 } },
      { id: 'hydraulic', label: 'Hydraulic Stress', icon: 'compress', telemetry: { hydraulic_pressure_bar: 343, hydraulic_oil_temperature_c: 87, blade_load_pct: 99 } },
      { id: 'idle', label: 'Excess Idling', icon: 'hourglass_empty', telemetry: { engine_rpm: 820, vehicle_speed_kmh: 0.1, machine_speed_kmh: 0.1, idle_duration_min: 31.5 } },
      { id: 'blade', label: 'Blade Overload', icon: 'fitness_center', telemetry: { blade_load_pct: 108, drawbar_load_pct: 103, traction_force_kn: 165 } },
      { id: 'slip', label: 'Track Slip', icon: 'swap_horiz', telemetry: { track_slip_pct: 30.5 } },
      { id: 'uneven', label: 'Uneven Tracks', icon: 'compare_arrows', telemetry: { track_speed_left_kmh: 3.5, track_speed_right_kmh: 11.6, track_slip_pct: 18 } },
      { id: 'depth', label: 'Cut Too Deep', icon: 'vertical_align_bottom', telemetry: { dozing_depth_m: 1.2, blade_load_pct: 97, drawbar_load_pct: 98 } },
      { id: 'grade', label: 'Grading Error', icon: 'straighten', telemetry: { grading_accuracy_error_cm: 10.4, vehicle_speed_kmh: 3.5, machine_speed_kmh: 3.5, blade_angle_deg: 6.7 } },
    ],
  },
];

/** Catalog entry for a seeded machine ID; undefined for anything else. */
export const fleetMachine = (id: string | null | undefined) => FLEET.find((m) => m.id === id);

/** Maps the live CAN-bus reading onto the model's feature names (speed feeds both speed features). */
function liveFeatures(t: ApiTelemetry | null | undefined): Record<string, number> {
  if (!t) return {};
  // Extra model features streamed with the reading (e.g. transmission temp) come first
  const out: Record<string, number> = { ...(t.features ?? {}) };
  if (t.engineRpm != null) out.engine_rpm = t.engineRpm;
  if (t.engineTemp != null) out.engine_temperature_c = t.engineTemp;
  if (t.hydraulicPressure != null) out.hydraulic_pressure_bar = t.hydraulicPressure;
  if (t.fuelRate != null) out.fuel_rate_lph = t.fuelRate;
  if (t.speed != null) out.machine_speed_kmh = out.vehicle_speed_kmh = t.speed;
  return out;
}

/** Baseline overlaid with either the live reading or a test scenario (scenarios ignore live data). */
export function anomalyRequest(
  m: FleetMachine,
  opts: { operatorId?: string; live?: ApiTelemetry | null; scenario?: Scenario | null },
): ApiAnomalyRequest {
  return {
    machine_type: m.anomalyModel === 'loader' ? 'wheel_loader' : m.anomalyModel,
    context: { machine_id: m.id, operator_id: opts.operatorId, timestamp: new Date().toISOString(), ...m.context },
    telemetry: { ...m.baseline, ...(opts.scenario ? opts.scenario.telemetry : liveFeatures(opts.live)) },
    machine_context: MACHINE_CONTEXT,
  };
}

/** "Engine_Overheating" → "Engine Overheating". */
export const anomalyLabel = (s: string) => s.replace(/_/g, ' ');
