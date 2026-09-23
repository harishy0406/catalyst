import 'server-only';
import { query } from './db';

// Timestamps are cast to text in SQL so everything handed to components is plain JSON.
const ts = (col: string, as = col) => `to_char(${col} AT TIME ZONE 'UTC', 'YYYY-MM-DD"T"HH24:MI:SS"Z"') AS ${as}`;

export type Operator = {
  id: string;
  name: string;
  skillLevel: string | null;
  machineId: string | null;
  machineModel: string | null;
  activeTaskId: string | null;
  activeTaskTitle: string | null;
  activeTaskStatus: string | null;
  activeTaskStartedAt: string | null;
  queuedTasks: number;
  completedTasks: number;
  unackedAlerts: number;
  openIncidents: number;
  trainingsCompleted: number;
  avgAbsErrorMin: number | null;
};

export async function getOperators(): Promise<Operator[]> {
  return query<Operator>(`
    SELECT u.id, u.name, u.skill_level AS "skillLevel", u.active_machine_id AS "machineId",
           m.model AS "machineModel",
           at.id AS "activeTaskId", at.title AS "activeTaskTitle", at.status AS "activeTaskStatus",
           ${ts('at.started_at', '"activeTaskStartedAt"')},
           (SELECT COUNT(*)::int FROM tasks t WHERE t.assigned_to = u.id AND t.status IN ('pending','ready')) AS "queuedTasks",
           (SELECT COUNT(*)::int FROM tasks t WHERE t.assigned_to = u.id AND t.status = 'completed') AS "completedTasks",
           (SELECT COUNT(*)::int FROM alerts a WHERE a.operator_id = u.id AND a.acknowledged = FALSE) AS "unackedAlerts",
           (SELECT COUNT(*)::int FROM incidents i WHERE i.reported_by = u.id AND i.status <> 'resolved') AS "openIncidents",
           (SELECT COUNT(*)::int FROM operator_training ot WHERE ot.operator_id = u.id) AS "trainingsCompleted",
           (SELECT ROUND(AVG(ABS(h.error_minutes))::numeric, 1)::float FROM task_history h WHERE h.operator_id = u.id) AS "avgAbsErrorMin"
    FROM users u
    LEFT JOIN machines m ON m.id = u.active_machine_id
    LEFT JOIN LATERAL (
      SELECT id, title, status, started_at FROM tasks t
      WHERE t.assigned_to = u.id AND t.status IN ('in_progress','paused')
      ORDER BY t.started_at DESC NULLS LAST LIMIT 1
    ) at ON TRUE
    WHERE u.role = 'operator'
    ORDER BY u.name`);
}

export type OperatorBasic = { id: string; name: string; skillLevel: string | null; machineId: string | null };

export async function getOperatorOptions(): Promise<OperatorBasic[]> {
  return query<OperatorBasic>(
    `SELECT id, name, skill_level AS "skillLevel", active_machine_id AS "machineId"
     FROM users WHERE role = 'operator' ORDER BY name`,
  );
}

export type Machine = { id: string; model: string; status: string; operatingHours: number; healthScore: number };

export async function getMachines(): Promise<Machine[]> {
  return query<Machine>(
    `SELECT id, model, status, operating_hours AS "operatingHours", health_score AS "healthScore"
     FROM machines ORDER BY id`,
  );
}

export type Task = {
  id: string;
  title: string;
  description: string | null;
  type: string;
  zone: string | null;
  priority: string;
  status: string;
  assignedTo: string | null;
  assigneeName: string | null;
  machineId: string | null;
  estimatedMinutes: number | null;
  actualMinutes: number | null;
  scheduledAt: string | null;
  startedAt: string | null;
  completedAt: string | null;
  checklistTotal: number;
  checklistDone: number;
  notes: string | null;
};

const TASK_SELECT = `
  SELECT t.id, t.title, t.description, t.type, t.zone, t.priority, t.status,
         t.assigned_to AS "assignedTo", u.name AS "assigneeName", t.machine_id AS "machineId",
         t.estimated_minutes AS "estimatedMinutes", t.actual_minutes AS "actualMinutes",
         ${ts('t.scheduled_at', '"scheduledAt"')}, ${ts('t.started_at', '"startedAt"')},
         ${ts('t.completed_at', '"completedAt"')},
         COALESCE(jsonb_array_length(t.checklist), 0) AS "checklistTotal",
         (SELECT COUNT(*)::int FROM jsonb_array_elements(COALESCE(t.checklist, '[]'::jsonb)) c
            WHERE (c->>'completed')::boolean) AS "checklistDone",
         t.notes
  FROM tasks t LEFT JOIN users u ON u.id = t.assigned_to`;

// Active work first, then the queue by priority, completed last.
const TASK_ORDER = `
  ORDER BY CASE t.status WHEN 'in_progress' THEN 0 WHEN 'paused' THEN 1 WHEN 'ready' THEN 2
                         WHEN 'pending' THEN 3 WHEN 'completed' THEN 5 ELSE 4 END,
           CASE t.priority WHEN 'high' THEN 0 WHEN 'medium' THEN 1 ELSE 2 END,
           t.scheduled_at, t.id`;

export async function getTasks(f: { status?: string; operator?: string } = {}): Promise<Task[]> {
  const where: string[] = [];
  const params: unknown[] = [];
  if (f.status === 'active') where.push(`t.status IN ('in_progress','paused')`);
  else if (f.status === 'queued') where.push(`t.status IN ('pending','ready')`);
  else if (f.status) {
    params.push(f.status);
    where.push(`t.status = $${params.length}`);
  }
  if (f.operator === 'unassigned') where.push('t.assigned_to IS NULL');
  else if (f.operator) {
    params.push(f.operator);
    where.push(`t.assigned_to = $${params.length}`);
  }
  return query<Task>(`${TASK_SELECT} ${where.length ? 'WHERE ' + where.join(' AND ') : ''} ${TASK_ORDER}`, params);
}

export type Incident = {
  id: string;
  incidentType: string;
  description: string;
  severity: string;
  status: string;
  reportedBy: string;
  reporterName: string | null;
  reportedAt: string;
  machineId: string | null;
  taskId: string | null;
  taskTitle: string | null;
  photoCount: number;
  resolutionNotes: string | null;
  resolvedAt: string | null;
};

export async function getIncidents(f: { status?: string; severity?: string; operator?: string; limit?: number } = {}): Promise<Incident[]> {
  const where: string[] = [];
  const params: unknown[] = [];
  if (f.status === 'active') where.push(`i.status <> 'resolved'`);
  else if (f.status) {
    params.push(f.status);
    where.push(`i.status = $${params.length}`);
  }
  if (f.severity) {
    params.push(f.severity);
    where.push(`LOWER(i.severity) = $${params.length}`);
  }
  if (f.operator) {
    params.push(f.operator);
    where.push(`i.reported_by = $${params.length}`);
  }
  params.push(f.limit ?? 200);
  return query<Incident>(
    `SELECT i.id, i.incident_type AS "incidentType", i.description, LOWER(i.severity) AS severity, i.status,
            i.reported_by AS "reportedBy", u.name AS "reporterName", ${ts('i.reported_at', '"reportedAt"')},
            i.machine_id AS "machineId", i.task_id AS "taskId", t.title AS "taskTitle",
            COALESCE(jsonb_array_length(i.photos), 0) AS "photoCount",
            i.resolution_notes AS "resolutionNotes", ${ts('i.resolved_at', '"resolvedAt"')}
     FROM incidents i
     LEFT JOIN users u ON u.id = i.reported_by
     LEFT JOIN tasks t ON t.id = i.task_id
     ${where.length ? 'WHERE ' + where.join(' AND ') : ''}
     ORDER BY CASE i.status WHEN 'open' THEN 0 WHEN 'investigating' THEN 1 ELSE 2 END,
              CASE LOWER(i.severity) WHEN 'critical' THEN 0 WHEN 'high' THEN 1 WHEN 'medium' THEN 2 ELSE 3 END,
              i.reported_at DESC
     LIMIT $${params.length}`,
    params,
  );
}

export type Alert = {
  id: string;
  machineId: string;
  operatorId: string | null;
  operatorName: string | null;
  ruleId: string | null;
  severity: string;
  message: string;
  acknowledged: boolean;
  acknowledgedAt: string | null;
  acknowledgedBy: string | null;
  createdAt: string;
};

export async function getAlerts(f: { unacked?: boolean; operator?: string; limit?: number } = {}): Promise<Alert[]> {
  const where: string[] = [];
  const params: unknown[] = [];
  if (f.unacked) where.push('a.acknowledged = FALSE');
  if (f.operator) {
    params.push(f.operator);
    where.push(`a.operator_id = $${params.length}`);
  }
  params.push(f.limit ?? 100);
  return query<Alert>(
    `SELECT a.id, a.machine_id AS "machineId", a.operator_id AS "operatorId", u.name AS "operatorName",
            a.rule_id AS "ruleId", a.severity, a.message, a.acknowledged,
            ${ts('a.acknowledged_at', '"acknowledgedAt"')}, a.acknowledged_by AS "acknowledgedBy",
            ${ts('a.created_at', '"createdAt"')}
     FROM alerts a LEFT JOIN users u ON u.id = a.operator_id
     ${where.length ? 'WHERE ' + where.join(' AND ') : ''}
     ORDER BY a.acknowledged, a.created_at DESC
     LIMIT $${params.length}`,
    params,
  );
}

export type Overview = {
  activeTasks: number;
  queuedTasks: number;
  unassignedTasks: number;
  completedToday: number;
  totalTasks: number;
  openIncidents: number;
  criticalIncidents: number;
  unackedAlerts: number;
  criticalAlerts: number;
  avgHealth: number | null;
  machinesDown: number;
  mae: number | null;
  rmse: number | null;
  historyCount: number;
};

export async function getOverview(): Promise<Overview> {
  const [row] = await query<Overview>(`
    SELECT
      (SELECT COUNT(*)::int FROM tasks WHERE status IN ('in_progress','paused')) AS "activeTasks",
      (SELECT COUNT(*)::int FROM tasks WHERE status IN ('pending','ready')) AS "queuedTasks",
      (SELECT COUNT(*)::int FROM tasks WHERE assigned_to IS NULL AND status <> 'completed') AS "unassignedTasks",
      (SELECT COUNT(*)::int FROM tasks WHERE status = 'completed' AND completed_at >= date_trunc('day', NOW())) AS "completedToday",
      (SELECT COUNT(*)::int FROM tasks) AS "totalTasks",
      (SELECT COUNT(*)::int FROM incidents WHERE status <> 'resolved') AS "openIncidents",
      (SELECT COUNT(*)::int FROM incidents WHERE status <> 'resolved' AND LOWER(severity) IN ('critical','high')) AS "criticalIncidents",
      (SELECT COUNT(*)::int FROM alerts WHERE acknowledged = FALSE) AS "unackedAlerts",
      (SELECT COUNT(*)::int FROM alerts WHERE acknowledged = FALSE AND severity = 'critical') AS "criticalAlerts",
      (SELECT ROUND(AVG(health_score))::int FROM machines) AS "avgHealth",
      (SELECT COUNT(*)::int FROM machines WHERE status IN ('maintenance','offline')) AS "machinesDown",
      (SELECT ROUND(AVG(ABS(error_minutes))::numeric, 2)::float FROM task_history) AS mae,
      (SELECT ROUND(SQRT(AVG(error_minutes * error_minutes))::numeric, 2)::float FROM task_history) AS rmse,
      (SELECT COUNT(*)::int FROM task_history) AS "historyCount"`);
  return row;
}

export async function getNavCounts(): Promise<{ incidents: number; alerts: number }> {
  const [row] = await query<{ incidents: number; alerts: number }>(`
    SELECT (SELECT COUNT(*)::int FROM incidents WHERE status = 'open') AS incidents,
           (SELECT COUNT(*)::int FROM alerts WHERE acknowledged = FALSE) AS alerts`);
  return row;
}

export type TrainingRecord = { contentId: string; title: string; category: string; completedAt: string; score: number };

export async function getOperatorTraining(operatorId: string): Promise<TrainingRecord[]> {
  return query<TrainingRecord>(
    `SELECT ot.content_id AS "contentId", tc.title, tc.category, ${ts('ot.completed_at', '"completedAt"')}, ot.score
     FROM operator_training ot LEFT JOIN training_content tc ON tc.id = ot.content_id
     WHERE ot.operator_id = $1 ORDER BY ot.completed_at DESC`,
    [operatorId],
  );
}

export type Telemetry = {
  engineRpm: number | null;
  fuelRate: number | null;
  hydraulicPressure: number | null;
  engineTemp: number | null;
  speed: number | null;
  recordedAt: string;
};

export async function getLatestTelemetry(machineId: string): Promise<Telemetry | null> {
  const rows = await query<Telemetry>(
    `SELECT engine_rpm AS "engineRpm", fuel_rate AS "fuelRate", hydraulic_pressure AS "hydraulicPressure",
            engine_temp AS "engineTemp", speed, ${ts('recorded_at', '"recordedAt"')}
     FROM telemetry WHERE machine_id = $1 ORDER BY recorded_at DESC LIMIT 1`,
    [machineId],
  );
  return rows[0] ?? null;
}

export type HistoryRow = { taskId: string | null; taskType: string; estimated: number; actual: number; error: number; completedAt: string };

export async function getOperatorHistory(operatorId: string): Promise<HistoryRow[]> {
  return query<HistoryRow>(
    `SELECT task_id AS "taskId", task_type AS "taskType", estimated_minutes AS estimated,
            actual_minutes AS actual, error_minutes AS error, ${ts('completed_at', '"completedAt"')}
     FROM task_history WHERE operator_id = $1 ORDER BY completed_at DESC LIMIT 20`,
    [operatorId],
  );
}
