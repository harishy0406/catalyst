'use server';

import { randomBytes } from 'node:crypto';
import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';
import { backendFetch, backendLogin, type SimStatus } from '@/lib/backend';
import { query } from '@/lib/db';
import { createSession, destroySession, requireSupervisor, SUPERVISOR_ROLES } from '@/lib/session';
import { canPerform, EDITABLE_TASK_STATUSES, humanize, INCIDENT_STATUSES, machineTypeOf, PRIORITIES, TASK_TYPES } from '@/lib/domain';

export type FormState = { error?: string; ok?: string } | undefined;

const str = (fd: FormData, k: string) => String(fd.get(k) ?? '').trim();
const oneOf = <T extends string>(v: string, allowed: readonly T[]): v is T => (allowed as readonly string[]).includes(v);

type MachineRow = { id: string; model: string; status: string };
const getMachine = async (id: string) =>
  (await query<MachineRow>('SELECT id, model, status FROM machines WHERE id = $1', [id]))[0] as MachineRow | undefined;
const operatorMachineId = async (operatorId: string) =>
  (await query<{ active_machine_id: string | null }>(`SELECT active_machine_id FROM users WHERE id = $1 AND role = 'operator'`, [operatorId]))[0];

// ---------- auth ----------

export async function login(_: FormState, fd: FormData): Promise<FormState> {
  const id = str(fd, 'id');
  const pin = str(fd, 'pin');
  if (!id || !pin) return { error: 'Enter your supervisor ID and PIN.' };

  const [user] = await query<{ id: string; name: string; role: string; pin_hash: string | null }>(
    'SELECT id, name, role, pin_hash FROM users WHERE LOWER(id) = LOWER($1)',
    [id],
  );
  // pin_hash holds the plain demo PIN (see backend/app/seed.py); same check as backend /auth/login.
  if (!user || !user.pin_hash || user.pin_hash !== pin) return { error: 'Invalid ID or PIN.' };
  if (!(SUPERVISOR_ROLES as readonly string[]).includes(user.role)) {
    return { error: 'This dashboard is for supervisors and safety officers. Operators use the cabin app.' };
  }
  // Same credentials against the FastAPI backend, for the demo simulator; the dashboard still works without it.
  const backendToken = await backendLogin(user.id, pin);
  await createSession({ id: user.id, name: user.name, role: user.role, backendToken });
  redirect('/');
}

export async function logout() {
  await destroySession();
  redirect('/login');
}

// ---------- tasks ----------

export async function createTask(_: FormState, fd: FormData): Promise<FormState> {
  await requireSupervisor();
  const title = str(fd, 'title');
  const type = str(fd, 'type');
  const priority = str(fd, 'priority');
  const zone = str(fd, 'zone') || null;
  const description = str(fd, 'description') || null;
  const assignedTo = str(fd, 'assignedTo') || null;
  let machineId = str(fd, 'machineId') || null;
  const estimate = Number(str(fd, 'estimatedMinutes'));

  if (!title) return { error: 'Title is required.' };
  if (!oneOf(type, TASK_TYPES)) return { error: 'Pick a valid task type.' };
  if (!oneOf(priority, PRIORITIES)) return { error: 'Pick a valid priority.' };
  if (!Number.isFinite(estimate) || estimate <= 0 || estimate > 24 * 60) return { error: 'Estimate must be 1–1440 minutes.' };

  // An assigned task always runs on the operator's bound machine, so the operator app, the task-time
  // model and the anomaly model all see the same machine.
  if (assignedTo) {
    const op = await operatorMachineId(assignedTo);
    if (!op) return { error: 'That operator no longer exists.' };
    if (!op.active_machine_id) return { error: `${assignedTo} has no machine assigned yet.` };
    machineId = op.active_machine_id;
  }
  if (!machineId) return { error: 'Pick the machine for this task.' };
  const machine = await getMachine(machineId);
  const machineType = machineTypeOf(machine?.model, machine?.id);
  if (!machine || !machineType) return { error: 'Tasks can only run on an excavator, bulldozer or wheel loader.' };
  if (machine.status === 'maintenance' || machine.status === 'offline') return { error: `${machine.id} is ${machine.status}.` };
  if (!canPerform(machineType, type)) return { error: `A ${humanize(machineType)} can't do ${humanize(type)}.` };

  const checklist = str(fd, 'checklist')
    .split('\n')
    .map((l) => l.trim())
    .filter(Boolean)
    .map((text, i) => ({ id: `c${i + 1}`, text, completed: false }));

  const id = `T-${randomBytes(3).toString('hex').toUpperCase()}`;
  await query(
    `INSERT INTO tasks (id, title, description, type, zone, priority, status, assigned_to, machine_id,
                        estimated_minutes, scheduled_at, checklist)
     VALUES ($1, $2, $3, $4, $5, $6, 'pending', $7, $8, $9, NOW(), $10::jsonb)`,
    [id, title, description, type, zone, priority, assignedTo, machineId, estimate, JSON.stringify(checklist)],
  );
  revalidatePath('/', 'layout');
  return { ok: `Task ${id} created${assignedTo ? ` and assigned to ${assignedTo}` : ''}.` };
}

export async function assignTask(fd: FormData) {
  await requireSupervisor();
  const taskId = str(fd, 'taskId');
  const operatorId = str(fd, 'operatorId') || null;

  let machineId: string | null = null;
  if (operatorId) {
    const op = await operatorMachineId(operatorId);
    if (!op?.active_machine_id) return;
    machineId = op.active_machine_id;
    // The task moves to the new operator's machine, which must be able to do it (the UI disables the rest)
    const [task] = await query<{ type: string }>('SELECT type FROM tasks WHERE id = $1', [taskId]);
    const machine = await getMachine(machineId);
    if (!task || !canPerform(machineTypeOf(machine?.model, machine?.id), task.type)) return;
  }
  // Only reassign work that has not started, so an operator mid-task is never pulled off it.
  await query(
    `UPDATE tasks SET assigned_to = $2, machine_id = COALESCE($3, machine_id)
     WHERE id = $1 AND status = ANY($4)`,
    [taskId, operatorId, machineId, EDITABLE_TASK_STATUSES],
  );
  revalidatePath('/', 'layout');
}

export async function setTaskPriority(fd: FormData) {
  await requireSupervisor();
  const priority = str(fd, 'priority');
  if (!oneOf(priority, PRIORITIES)) return;
  await query(`UPDATE tasks SET priority = $2 WHERE id = $1 AND status <> 'completed'`, [str(fd, 'taskId'), priority]);
  revalidatePath('/', 'layout');
}

export async function deleteTask(fd: FormData) {
  await requireSupervisor();
  await query(`DELETE FROM tasks WHERE id = $1 AND status = ANY($2)`, [str(fd, 'taskId'), EDITABLE_TASK_STATUSES]);
  revalidatePath('/', 'layout');
}

// ---------- incidents ----------

export async function updateIncident(_: FormState, fd: FormData): Promise<FormState> {
  const sup = await requireSupervisor();
  const id = str(fd, 'incidentId');
  const status = str(fd, 'status');
  const notes = str(fd, 'resolutionNotes');
  if (!oneOf(status, INCIDENT_STATUSES)) return { error: 'Invalid status.' };
  if (status === 'resolved' && !notes) return { error: 'Add resolution notes before resolving.' };

  // Notes are stamped with who wrote them so the record keeps an audit trail (docs/SECURITY.md §6).
  const stamped = notes ? `[${sup.id} · ${new Date().toISOString().slice(0, 16).replace('T', ' ')} UTC] ${notes}` : null;
  const rows = await query(
    `UPDATE incidents
     SET status = $2::text,
         resolution_notes = CASE WHEN $3::text IS NULL THEN resolution_notes
                                 WHEN resolution_notes IS NULL OR resolution_notes = '' THEN $3
                                 ELSE resolution_notes || E'\\n' || $3 END,
         resolved_at = CASE WHEN $2::text = 'resolved' THEN COALESCE(resolved_at, NOW()) ELSE NULL END
     WHERE id = $1 RETURNING id`,
    [id, status, stamped],
  );
  if (!rows.length) return { error: 'Incident not found.' };
  revalidatePath('/', 'layout');
  return { ok: `Incident ${id} marked ${status}.` };
}

// ---------- safety alerts ----------

export async function acknowledgeAlert(fd: FormData) {
  const sup = await requireSupervisor();
  await query(
    `UPDATE alerts SET acknowledged = TRUE, acknowledged_at = NOW(), acknowledged_by = $2
     WHERE id = $1 AND acknowledged = FALSE`,
    [str(fd, 'alertId'), sup.id],
  );
  revalidatePath('/', 'layout');
}

// ---------- demo simulator (FastAPI /simulation) ----------

export type SimResult = { status?: SimStatus; error?: string };

async function sim(path: string, body?: unknown): Promise<SimResult> {
  const sup = await requireSupervisor();
  if (!sup.backendToken) return { error: 'Not connected to the backend. Sign out and back in to use the simulator.' };
  try {
    const res = await backendFetch<SimStatus | { status: SimStatus }>(sup.backendToken, path, body);
    return { status: 'status' in res ? res.status : res };
  } catch (e) {
    return { error: e instanceof Error ? e.message : String(e) };
  }
}

export async function simStart(scenario: string, machineId: string): Promise<SimResult> {
  return sim('/simulation/start', { scenario, machine_id: machineId, interval_seconds: 3 });
}

export async function simStop(): Promise<SimResult> {
  return sim('/simulation/stop', {});
}

export async function simTrigger(event: string, machineId: string): Promise<SimResult> {
  const res = await sim('/simulation/trigger-event', { event, machine_id: machineId });
  revalidatePath('/', 'layout');
  return res;
}
