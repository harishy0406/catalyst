import { createContext, ReactNode, useCallback, useContext, useEffect, useMemo, useRef, useState } from 'react';
import { Alert, ImageSourcePropType } from 'react-native';

import {
  api,
  ApiAlert,
  ApiIncident,
  ApiInsights,
  ApiOperator,
  ApiRecommendation,
  ApiTask,
  ApiTaskEstimate,
  ApiTrainingContent,
  setAuthToken,
} from '@/api/client';
import { fleetMachine } from '@/data/machines';
import { machine as mockMachine, operator as mockOperator, SafetyEvent, Task, TaskStatus } from '@/data/mock';
import { colors } from '@/theme/tokens';

type Incident = { id: string; type: string; severity: string; description: string; time: string };
type Operator = typeof mockOperator & { role: string; skillLevel: string };
type Machine = typeof mockMachine & { healthScore: number | null; insights: ApiInsights | null };
export type TrainingModule = {
  id: string;
  area: string;
  title: string;
  description: string;
  minutes: number;
  completed: boolean;
  tag: { label: string; icon: string; tone: 'primary' | 'danger' | 'safe' };
  image: ImageSourcePropType;
};

type AppState = {
  signedIn: boolean;
  operatorId: string;
  operator: Operator;
  machine: Machine;
  signIn: (id: string, pin: string) => Promise<void>;
  signOut: () => void;
  refresh: () => Promise<void>;
  tasks: Task[];
  setTaskStatus: (id: string, status: TaskStatus) => Promise<void>;
  alertActive: boolean;
  activeAlert: ApiAlert | null;
  acknowledgeAlert: () => Promise<void>;
  safetyEvents: SafetyEvent[];
  incidents: Incident[];
  submitIncident: (i: Omit<Incident, 'id' | 'time'>) => Promise<Incident>;
  trainingModules: TrainingModule[];
  training: { done: number; total: number };
  completeTraining: (id: string) => Promise<void>;
};

const Ctx = createContext<AppState | null>(null);

const POLL_MS = 10_000;

// ─── Backend → UI mapping ──────────────────────────────────────────────────────

const SKILL: Record<string, { level: number; label: string }> = {
  beginner: { level: 1, label: 'Trainee Operator' },
  novice: { level: 1, label: 'Trainee Operator' },
  intermediate: { level: 3, label: 'Certified Operator' },
  expert: { level: 4, label: 'Expert Operator' },
};

const TASK_META: Record<string, { category: string; tier: Task['tier']; accent: string }> = {
  trenching: { category: 'Utility Infrastructure', tier: { icon: 'construction', label: 'Intermediate' }, accent: colors.primaryContainer },
  loading: { category: 'Haulage', tier: { icon: 'construction', label: 'Standard' }, accent: colors.tertiaryContainer },
  grading: { category: 'Finishing', tier: { icon: 'straighten', label: 'Precision Laser' }, accent: colors.primaryContainer },
  pipe_laying: { category: 'Utility Infrastructure', tier: { icon: 'plumbing', label: 'Precision' }, accent: colors.primaryContainer },
  bulk_excavation: { category: 'Primary Production Run', tier: { icon: 'military_tech', label: 'Heavy Duty' }, accent: colors.primaryContainer },
  demolition: { category: 'Site Clearance', tier: { icon: 'construction', label: 'Heavy Hydraulic' }, accent: colors.danger },
};

const TRAINING_IMAGES: Record<string, ImageSourcePropType> = {
  safety: require('../../assets/images/training-seatbelt.jpg'),
  eco: require('../../assets/images/training-proximity.jpg'),
  default: require('../../assets/images/training-excavation.jpg'),
};

const hhmm = (iso: string, h12 = false) =>
  new Date(iso).toLocaleTimeString(h12 ? 'en-US' : 'en-GB', { hour: '2-digit', minute: '2-digit', hour12: h12 });

const humanize = (s: string) => s.replace(/_/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase());

const minutesSince = (iso: string | null) => (iso ? Math.max(0, Math.round((Date.now() - Date.parse(iso)) / 60000)) : 0);

function toOperator(o: ApiOperator): Operator {
  const skill = SKILL[o.skillLevel] ?? SKILL.intermediate;
  return {
    ...mockOperator,
    id: o.id,
    name: o.name,
    firstName: o.name.split(' ')[0],
    level: skill.level,
    skill: skill.label,
    role: o.role,
    skillLevel: o.skillLevel,
  };
}

function toStatus(s: string): TaskStatus {
  if (s === 'in_progress' || s === 'paused' || s === 'completed' || s === 'ready') return s;
  return 'queued'; // backend 'pending'
}

function toTask(t: ApiTask, est?: ApiTaskEstimate): Task {
  const meta = TASK_META[t.type] ?? { category: humanize(t.type), tier: { icon: 'construction', label: 'Standard' }, accent: colors.primaryContainer };
  const status = toStatus(t.status);
  return {
    id: t.id,
    title: t.title,
    category: meta.category,
    zone: t.zone ?? '—',
    estMin: Math.round(t.estimatedMinutes ?? 45),
    predictedMin: est ? Math.round(est.predictedMinutes) : undefined,
    prediction: est && {
      deviationMin: est.deviationMinutes,
      deviationPct: est.deviationPercent,
      risk: est.riskAssessment,
      confidenceLabel: est.confidenceLabel,
      modelType: est.modelType,
      fallback: est.fallbackUsed,
    },
    weather: { icon: 'wb_sunny', label: 'Clear' },
    tier: meta.tier,
    description: t.description ?? '',
    note: t.notes ?? undefined,
    accent: meta.accent,
    status,
    elapsedMin:
      status === 'completed'
        ? Math.round(t.actualMinutes ?? 0)
        : status === 'in_progress' || status === 'paused'
          ? minutesSince(t.startedAt)
          : 0,
    startedAt: t.startedAt,
  };
}

/** Active work first (in progress / paused), then the queue, completed last. */
const TASK_ORDER: Record<TaskStatus, number> = { in_progress: 0, paused: 1, ready: 2, queued: 3, completed: 4 };
const sortTasks = (ts: Task[]) => [...ts].sort((a, b) => TASK_ORDER[a.status] - TASK_ORDER[b.status] || a.id.localeCompare(b.id));

function toIncident(i: ApiIncident): Incident {
  return {
    id: i.id,
    type: humanize(i.incidentType),
    severity: i.severity.toUpperCase(),
    description: i.description,
    time: hhmm(i.reportedAt),
  };
}

function toSafetyEvent(a: ApiAlert): SafetyEvent {
  return {
    time: hhmm(a.createdAt, true),
    title: a.message,
    detail: a.acknowledged ? `Acknowledged by ${a.acknowledgedBy ?? 'operator'}` : `${a.severity.toUpperCase()} • awaiting acknowledgement`,
    resolved: a.acknowledged,
  };
}

function toModule(c: ApiTrainingContent, rec: ApiRecommendation | undefined): TrainingModule {
  const cat = c.category.toLowerCase();
  const completed = !rec;
  const tag: TrainingModule['tag'] = completed
    ? { label: 'Completed', icon: 'check_circle', tone: 'safe' }
    : rec.urgency === 'high'
      ? { label: 'Priority', icon: 'warning', tone: 'danger' }
      : rec.urgency === 'medium'
        ? { label: '★ Recommended', icon: 'star', tone: 'primary' }
        : { label: 'Elective', icon: 'update', tone: 'safe' };
  return {
    id: c.id,
    area: c.category,
    title: c.title,
    description: rec?.reason ? `${c.content ?? ''}\n${rec.reason}`.trim() : (c.content ?? ''),
    minutes: c.durationMinutes,
    completed,
    tag,
    image: TRAINING_IMAGES[cat] ?? TRAINING_IMAGES.default,
  };
}

const reportError = (e: unknown) => Alert.alert('Sync failed', e instanceof Error ? e.message : String(e));

// ─── Provider ──────────────────────────────────────────────────────────────────

/** Session store backed by the FastAPI backend (see src/api/client.ts). */
export function AppStateProvider({ children }: { children: ReactNode }) {
  const [apiOperator, setApiOperator] = useState<ApiOperator | null>(null);
  const [tasks, setTasks] = useState<Task[]>([]);
  const [alerts, setAlerts] = useState<ApiAlert[]>([]);
  const [incidents, setIncidents] = useState<Incident[]>([]);
  const [content, setContent] = useState<ApiTrainingContent[]>([]);
  const [recs, setRecs] = useState<ApiRecommendation[]>([]);
  const [insights, setInsights] = useState<ApiInsights | null>(null);
  const predictions = useRef<Record<string, ApiTaskEstimate>>({});
  const taskRows = useRef<ApiTask[]>([]);

  const operator = useMemo(() => (apiOperator ? toOperator(apiOperator) : { ...mockOperator, role: 'operator', skillLevel: 'expert' }), [apiOperator]);
  const machineId = apiOperator?.activeMachineId ?? mockMachine.id;

  const loadTasks = useCallback(async () => {
    const rows = await api.tasksToday();
    taskRows.current = rows;
    // Always renders the newest rows, so a late estimate can't roll back a status change
    const render = () => setTasks(sortTasks(taskRows.current.map((t) => toTask(t, predictions.current[t.id]))));
    render();
    // CatBoost duration estimate per task (backend reads machine + operator skill), cached for the session.
    // Not awaited: each estimate does DB lookups, so tasks show first and the forecasts fill in.
    const missing = rows.filter((t) => predictions.current[t.id] === undefined);
    if (missing.length === 0) return;
    Promise.all(
      missing.map((t) =>
        api
          .estimateTask(t.id)
          .then((p) => (predictions.current[t.id] = p))
          .catch(() => undefined),
      ),
    ).then(render);
  }, []);

  const loadLive = useCallback(async (mid: string) => {
    const [a, ins] = await Promise.all([api.alerts(), api.insights(mid).catch(() => null)]);
    setAlerts(a);
    setInsights(ins);
  }, []);

  const loadAll = useCallback(
    async (op: ApiOperator) => {
      const mid = op.activeMachineId ?? mockMachine.id;
      const [inc, tc, tr] = await Promise.all([api.incidents(), api.trainingContent(), api.trainingRecommendations(), loadTasks(), loadLive(mid)]);
      setIncidents(inc.map(toIncident));
      setContent(tc);
      setRecs(tr.recommendations);
    },
    [loadTasks, loadLive],
  );

  const signIn = useCallback(
    async (id: string, pin: string) => {
      const res = await api.login(id, pin);
      setAuthToken(res.token);
      predictions.current = {};
      setApiOperator(res.operator);
      await loadAll(res.operator).catch(reportError);
    },
    [loadAll],
  );

  const signOut = useCallback(() => {
    setAuthToken(null);
    setApiOperator(null);
    taskRows.current = [];
    setTasks([]);
    setAlerts([]);
    setIncidents([]);
    setInsights(null);
  }, []);

  const refresh = useCallback(async () => {
    if (apiOperator) await loadAll(apiOperator).catch(reportError);
  }, [apiOperator, loadAll]);

  // Poll alerts + machine insights so telemetry-triggered alerts show up live
  useEffect(() => {
    if (!apiOperator) return;
    const id = setInterval(() => loadLive(machineId).catch(() => undefined), POLL_MS);
    return () => clearInterval(id);
  }, [apiOperator, machineId, loadLive]);

  const setTaskStatus = useCallback(
    async (id: string, status: TaskStatus) => {
      const current = tasks.find((t) => t.id === id);
      try {
        if (status === 'in_progress' && current?.status !== 'paused') await api.startTask(id);
        else if (status === 'completed') {
          const startedAt = current?.startedAt;
          await api.completeTask(id, startedAt ? Math.max(1, minutesSince(startedAt)) : undefined);
        } else await api.setTaskStatus(id, status);
        await loadTasks();
      } catch (e) {
        reportError(e);
      }
    },
    [tasks, loadTasks],
  );

  const activeAlerts = useMemo(() => alerts.filter((a) => !a.acknowledged), [alerts]);

  const acknowledgeAlert = useCallback(async () => {
    try {
      await Promise.all(activeAlerts.map((a) => api.ackAlert(a.id)));
      await loadLive(machineId);
    } catch (e) {
      reportError(e);
    }
  }, [activeAlerts, loadLive, machineId]);

  const submitIncident = useCallback(
    async (i: Omit<Incident, 'id' | 'time'>) => {
      const created = await api.createIncident({
        incidentType: i.type.toLowerCase().replace(/\s+/g, '_'),
        description: i.description,
        severity: i.severity.toLowerCase(),
        machineId,
      });
      const mapped = toIncident(created);
      setIncidents((list) => [mapped, ...list]);
      return mapped;
    },
    [machineId],
  );

  const completeTraining = useCallback(async (id: string) => {
    try {
      await api.completeTraining(id);
      const tr = await api.trainingRecommendations();
      setRecs(tr.recommendations);
    } catch (e) {
      reportError(e);
    }
  }, []);

  const machine = useMemo<Machine>(() => {
    const tel = insights?.lastTelemetry;
    return {
      ...mockMachine,
      model: fleetMachine(machineId).model,
      shortModel: fleetMachine(machineId).shortModel,
      id: machineId,
      hydraulicBar: tel?.hydraulicPressure != null ? Math.round(tel.hydraulicPressure) : mockMachine.hydraulicBar,
      healthScore: insights?.healthScore ?? null,
      insights,
    };
  }, [machineId, insights]);

  const trainingModules = useMemo(() => {
    const byId = new Map(recs.map((r) => [r.contentId, r]));
    return content.map((c) => toModule(c, byId.get(c.id)));
  }, [content, recs]);

  const value = useMemo<AppState>(
    () => ({
      signedIn: apiOperator !== null,
      operatorId: operator.id,
      operator,
      machine,
      signIn,
      signOut,
      refresh,
      tasks,
      setTaskStatus,
      alertActive: activeAlerts.length > 0,
      activeAlert: activeAlerts[0] ?? null,
      acknowledgeAlert,
      safetyEvents: alerts.map(toSafetyEvent),
      incidents,
      submitIncident,
      trainingModules,
      training: { done: trainingModules.filter((m) => m.completed).length, total: trainingModules.length },
      completeTraining,
    }),
    [
      apiOperator,
      operator,
      machine,
      signIn,
      signOut,
      refresh,
      tasks,
      setTaskStatus,
      activeAlerts,
      acknowledgeAlert,
      alerts,
      incidents,
      submitIncident,
      trainingModules,
      completeTraining,
    ],
  );

  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}

export function useApp() {
  const v = useContext(Ctx);
  if (!v) throw new Error('useApp must be used inside <AppStateProvider>');
  return v;
}
