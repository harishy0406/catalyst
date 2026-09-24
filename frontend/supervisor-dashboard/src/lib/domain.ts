/**
 * Domain constants shared by server and client code.
 * Values mirror the backend (backend/app/seed.py, backend/app/ml/estimator.py)
 * and the operator app (frontend/cat-operator-app/src/state/AppState.tsx).
 */

export const TASK_TYPES = ['trenching', 'loading', 'grading', 'pipe_laying', 'bulk_excavation', 'demolition'] as const;
export const PRIORITIES = ['high', 'medium', 'low'] as const;

/**
 * The three machine types the ML models are built around, and the task types each can perform.
 * Mirrors backend/app/machine_types.py — keep them in sync.
 */
export const MACHINE_TYPES = ['excavator', 'bulldozer', 'wheel_loader'] as const;
export type MachineType = (typeof MACHINE_TYPES)[number];

export const TASKS_BY_MACHINE: Record<MachineType, readonly string[]> = {
  excavator: ['trenching', 'pipe_laying', 'bulk_excavation', 'demolition', 'loading'],
  bulldozer: ['grading', 'bulk_excavation'],
  wheel_loader: ['loading'],
};

/** Machine type from its model name (preferred) or ID; null if it is none of the three. */
export function machineTypeOf(model: string | null | undefined, id?: string | null): MachineType | null {
  for (const text of [model, id]) {
    const s = (text ?? '').toLowerCase();
    if (s.includes('excavator') || s.includes('exc') || s.includes('320')) return 'excavator';
    if (s.includes('loader') || s.includes('950')) return 'wheel_loader';
    if (s.includes('dozer') || s.includes('tractor') || s.includes('d6')) return 'bulldozer';
  }
  return null;
}

export const canPerform = (type: MachineType | null, taskType: string) => type !== null && TASKS_BY_MACHINE[type].includes(taskType);

/** The operator app understands these; anything else is shown to the operator as "queued". */
export const TASK_STATUSES = ['pending', 'ready', 'in_progress', 'paused', 'completed'] as const;
/** Only tasks that have not started can be reassigned or deleted. */
export const EDITABLE_TASK_STATUSES = ['pending', 'ready'];

/** Backend analytics treat anything other than 'resolved' as an active incident. */
export const INCIDENT_STATUSES = ['open', 'investigating', 'resolved'] as const;
export const SEVERITIES = ['critical', 'high', 'medium', 'low'] as const;

export const WEATHER = ['clear', 'cloudy', 'rainy', 'storm', 'extreme_heat', 'extreme_cold'] as const;

// Same factors as the backend's Phase 1 heuristic (estimator.py → formula_predict).
const BASE_TIMES: Record<string, number> = {
  trenching: 60, loading: 45, grading: 30, pipe_laying: 35, bulk_excavation: 90,
};
const WEATHER_FACTORS: Record<string, number> = {
  sunny: 1.0, clear: 1.0, cloudy: 1.05, rain: 1.15, rainy: 1.2, storm: 1.35, extreme_cold: 1.3, extreme_heat: 1.25,
};
const SKILL_FACTORS: Record<string, number> = { expert: 0.95, intermediate: 1.0, novice: 1.25, beginner: 1.25 };

export function estimateMinutes(taskType: string, weather: string, skill: string | null | undefined): number {
  const base = BASE_TIMES[taskType] ?? 45;
  const w = WEATHER_FACTORS[weather] ?? 1;
  const s = SKILL_FACTORS[(skill ?? 'intermediate').toLowerCase()] ?? 1;
  return Math.round(base * w * s);
}

export const humanize = (s: string | null | undefined) =>
  (s ?? '').replace(/_/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase());

export type Tone = 'danger' | 'warning' | 'safe' | 'info' | 'neutral' | 'primary';

export function severityTone(s: string): Tone {
  switch (s.toLowerCase()) {
    case 'critical':
    case 'high':
      return 'danger';
    case 'medium':
    case 'warning':
      return 'warning';
    case 'low':
    case 'info':
      return 'info';
    default:
      return 'neutral';
  }
}

export function taskStatusTone(s: string): Tone {
  switch (s) {
    case 'in_progress':
      return 'primary';
    case 'paused':
      return 'warning';
    case 'completed':
      return 'safe';
    case 'ready':
      return 'info';
    default:
      return 'neutral';
  }
}

export function incidentStatusTone(s: string): Tone {
  return s === 'resolved' ? 'safe' : s === 'investigating' ? 'warning' : 'danger';
}
