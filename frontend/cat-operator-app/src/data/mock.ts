/**
 * Mock data lifted from the Stitch screens. Live data now comes from the backend
 * (src/state/AppState.tsx); these values fill fields the API doesn't expose yet.
 */
import { colors } from '@/theme/tokens';

/** Seeded accounts in backend/app/seed.py (PIN = digits of the ID, e.g. OP-4412 → 4412). */
export const OPERATORS = ['OP-4412', 'OP-8821', 'SUP-101'] as const;

export const operator = {
  id: 'OP1001',
  name: 'Raj Kumar',
  firstName: 'Raj',
  level: 4,
  skill: 'Expert Operator',
  credential: 'Level 4 Certified Heavy Arm',
  shift: 'Shift B (Cab 04)',
  cab: 'Cab Cabin 04',
  operatingHours: '4,280',
  training: { done: 3, total: 5 },
  safetyEventsThisWeek: 2,
};

export const machine = {
  id: 'EXC001',
  model: 'CAT 349 Hydraulic Excavator',
  shortModel: 'CAT Hydraulic Excavator',
  cabId: 'CAB-NORTH-04',
  engineHours: '1,530.2',
  fuelPct: 82,
  fuelLitres: 420,
  fuelUsed: '2.0',
  hydraulicBar: 345,
  loadCycles: 12,
  cycleGoal: 28,
  idleMin: 30,
  firmware: 'CAT-OS V4.18.2',
};

export const site = {
  date: '24 OCT 2024',
  site: 'North Sector Pit B',
  shiftWindow: '07:00 - 15:30',
  loginShift: 'Morning (06:00 - 14:00)',
};

export type TaskStatus = 'ready' | 'in_progress' | 'paused' | 'completed' | 'queued';

export type TaskPrediction = {
  deviationMin: number;
  deviationPct: number;
  /** 'On Schedule' | 'Delayed' | 'Accelerated' */
  risk: string;
  confidenceLabel: string;
  modelType: string;
  fallback: boolean;
};

export type Task = {
  id: string;
  title: string;
  category: string;
  zone: string;
  estMin: number;
  predictedMin?: number;
  /** CatBoost estimate details from POST /tasks/{id}/estimate. */
  prediction?: TaskPrediction;
  weather: { icon: string; label: string; temp?: string };
  tier: { icon: string; label: string };
  volume?: string;
  note?: string;
  noteColor?: string;
  description: string;
  targetDepth?: string;
  payloadTruck?: string;
  safetyNote?: string;
  accent: string;
  status: TaskStatus;
  elapsedMin: number;
  /** Machine the task runs on (set by the supervisor from the operator's assigned machine). */
  machineId?: string | null;
  /** ISO timestamp from the backend, used to report actual duration on completion. */
  startedAt?: string | null;
};

export const initialTasks: Task[] = [
  {
    id: 'T001',
    title: 'Earth Excavation',
    category: 'Primary Production Run',
    zone: 'Zone B-4',
    estMin: 60,
    predictedMin: 58,
    weather: { icon: 'wb_sunny', label: 'Sunny', temp: '24°C' },
    tier: { icon: 'military_tech', label: 'Expert Tier' },
    volume: '420m³',
    description: 'Excavate the marked work zone and load material according to the site plan.',
    targetDepth: '3.50 M',
    payloadTruck: 'CAT 745 #04',
    safetyNote: 'Ensure spoil pile stands minimum 2.0m back from trench edge.',
    accent: colors.primaryContainer,
    status: 'in_progress',
    elapsedMin: 34,
  },
  {
    id: 'T002',
    title: 'Trenching',
    category: 'Utility Infrastructure',
    zone: 'Grid B-12',
    estMin: 45,
    predictedMin: 47,
    weather: { icon: 'rainy', label: 'Rainy', temp: '17°C' },
    tier: { icon: 'construction', label: 'Intermediate' },
    description: 'Excavate 1.2m depth trench along boundary grid B-12 for concrete conduits.',
    note: 'High moisture index in ditch zone B. Utilize standard 36-inch trenching bucket with rock teeth.',
    targetDepth: '1.20 M',
    payloadTruck: 'CAT 745 #02',
    safetyNote: 'Rain expected 11:30 — slick clay risk on ramp edges.',
    accent: colors.primaryContainer,
    status: 'queued',
    elapsedMin: 0,
  },
  {
    id: 'T003',
    title: 'Material Loading',
    category: 'Haulage',
    zone: 'Stockpile 2',
    estMin: 30,
    weather: { icon: 'wb_sunny', label: 'Sunny' },
    tier: { icon: 'construction', label: 'Standard' },
    description: 'Load stockpiled spoil into haul trucks per dispatch order.',
    accent: colors.tertiaryContainer,
    status: 'queued',
    elapsedMin: 0,
  },
  {
    id: 'T004',
    title: 'Grading',
    category: 'Finishing',
    zone: 'Pad C',
    estMin: 75,
    weather: { icon: 'wb_sunny', label: 'Sunny' },
    tier: { icon: 'straighten', label: 'Precision Laser' },
    description: 'Laser-guided finish grade of foundation pad C to ±10mm.',
    accent: colors.primaryContainer,
    status: 'queued',
    elapsedMin: 0,
  },
  {
    id: 'T005',
    title: 'Demolition',
    category: 'Site Clearance',
    zone: 'Structure D',
    estMin: 90,
    weather: { icon: 'wb_sunny', label: 'Sunny' },
    tier: { icon: 'construction', label: 'Heavy Hydraulic' },
    description: 'Demolish legacy retaining wall with hydraulic breaker attachment.',
    accent: colors.danger,
    status: 'queued',
    elapsedMin: 0,
  },
];

export type SafetyEvent = { time: string; title: string; detail: string; resolved: boolean };

export const initialSafetyEvents: SafetyEvent[] = [
  { time: '10:42 AM', title: 'Proximity Warning (Zone B)', detail: 'Cleared by operator', resolved: true },
  { time: '10:00 AM', title: 'Seatbelt Unfastened (Engine Idling)', detail: 'Auto-cleared on latch', resolved: true },
  { time: '09:35 AM', title: 'Proximity Warning (5.2m)', detail: 'Cleared by operator', resolved: true },
];
