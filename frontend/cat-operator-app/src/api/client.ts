/**
 * Thin fetch wrapper for the CATALYST FastAPI backend (backend/app/main.py).
 *
 * Base URL, in order:
 *  1. EXPO_PUBLIC_API_URL (set it for APK builds, e.g. http://192.168.1.20:3000)
 *  2. The Metro dev-server host on port 3000 — works in Expo Go on the same Wi-Fi
 *  3. The browser's hostname on web
 */
import Constants from 'expo-constants';
import { Platform } from 'react-native';

const API_PORT = 3000;

function resolveBaseUrl() {
  const fromEnv = process.env.EXPO_PUBLIC_API_URL;
  if (fromEnv) return fromEnv.replace(/\/$/, '');
  if (Platform.OS === 'web' && typeof window !== 'undefined') {
    return `${window.location.protocol}//${window.location.hostname}:${API_PORT}`;
  }
  const host = Constants.expoConfig?.hostUri?.split(':')[0];
  return `http://${host ?? 'localhost'}:${API_PORT}`;
}

export const API_URL = resolveBaseUrl();

export class ApiError extends Error {
  constructor(
    message: string,
    public status: number,
  ) {
    super(message);
  }
}

let authToken: string | null = null;
export const setAuthToken = (t: string | null) => {
  authToken = t;
};

async function request<T>(method: string, path: string, body?: unknown): Promise<T> {
  let res: Response;
  try {
    res = await fetch(`${API_URL}${path}`, {
      method,
      headers: {
        'Content-Type': 'application/json',
        ...(authToken ? { Authorization: `Bearer ${authToken}` } : {}),
      },
      body: body === undefined ? undefined : JSON.stringify(body),
    });
  } catch {
    throw new ApiError(`Backend unreachable at ${API_URL}`, 0);
  }
  const data = await res.json().catch(() => null);
  if (!res.ok) throw new ApiError(data?.detail ?? `Request failed (${res.status})`, res.status);
  return data as T;
}

// ─── Response shapes (mirror backend/app/schemas) ──────────────────────────────

export type ApiOperator = {
  id: string;
  name: string;
  role: string;
  skillLevel: string;
  activeMachineId: string | null;
};

export type ApiTask = {
  id: string;
  title: string;
  description: string | null;
  type: string;
  zone: string | null;
  priority: string;
  status: string;
  machineId: string | null;
  estimatedMinutes: number | null;
  actualMinutes: number | null;
  startedAt: string | null;
  completedAt: string | null;
  notes: string | null;
};

export type ApiAlert = {
  id: string;
  machineId: string;
  ruleId: string | null;
  severity: string;
  message: string;
  acknowledged: boolean;
  acknowledgedBy: string | null;
  createdAt: string;
};

export type ApiIncident = {
  id: string;
  incidentType: string;
  description: string;
  severity: string;
  status: string;
  reportedAt: string;
};

export type ApiTrainingContent = {
  id: string;
  title: string;
  category: string;
  durationMinutes: number;
  format: string;
  content: string | null;
};

export type ApiRecommendation = { contentId: string; reason: string; urgency: 'high' | 'medium' | 'low' };

export type ApiTelemetry = {
  engineRpm: number | null;
  fuelRate: number | null;
  hydraulicPressure: number | null;
  engineTemp: number | null;
  speed: number | null;
  recordedAt: string | null;
};

export type ApiInsights = {
  machineId: string;
  healthScore: number;
  anomalies: { component: string; severity: string; metric: string; value: string; description: string }[];
  recommendations: { action: string; priority: string; reason: string }[];
  lastTelemetry: ApiTelemetry | null;
};

// ─── Endpoints ─────────────────────────────────────────────────────────────────

export const api = {
  health: () => request<{ status: string; database: string; mlModelStatus: string }>('GET', '/health'),

  login: (operatorId: string, password: string) =>
    request<{ token: string; operator: ApiOperator }>('POST', '/auth/login', { operatorId, password }),

  tasksToday: () => request<ApiTask[]>('GET', '/tasks/today'),
  startTask: (id: string) => request<{ task: ApiTask }>('POST', `/tasks/${id}/start`),
  completeTask: (id: string, actualMinutes?: number) =>
    request<{ task: ApiTask }>('POST', `/tasks/${id}/complete`, { actualMinutes }),
  setTaskStatus: (id: string, status: string) => request<{ task: ApiTask }>('POST', `/tasks/${id}/status`, { status }),

  predict: (taskType: string, operatorSkill: string, baseTime?: number) =>
    request<{ predictedMinutes: number; confidence: number; modelType: string }>('POST', '/ml/predict', {
      taskType,
      operatorSkill,
      baseTime,
    }),

  alerts: () => request<ApiAlert[]>('GET', '/safety/alerts'),
  ackAlert: (id: string) => request<{ success: boolean }>('POST', `/safety/alerts/${id}/ack`),

  incidents: () => request<ApiIncident[]>('GET', '/incidents'),
  createIncident: (body: { incidentType: string; description: string; severity: string; machineId?: string }) =>
    request<ApiIncident>('POST', '/incidents', body),

  trainingContent: () => request<ApiTrainingContent[]>('GET', '/training/content'),
  trainingRecommendations: () => request<{ recommendations: ApiRecommendation[] }>('GET', '/training/recommendations'),
  completeTraining: (id: string) => request<{ success: boolean }>('POST', `/training/${id}/complete`),

  insights: (machineId: string) => request<ApiInsights>('GET', `/machines/${machineId}/insights`),
};
