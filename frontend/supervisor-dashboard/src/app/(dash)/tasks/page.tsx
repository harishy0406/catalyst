import Link from 'next/link';
import { assignTask, deleteTask, setTaskPriority } from '@/app/actions';
import { AutoSubmitSelect } from '@/components/AutoSubmitSelect';
import { Badge } from '@/components/Badge';
import { PageHeader } from '@/components/PageHeader';
import { SubmitButton } from '@/components/SubmitButton';
import { EDITABLE_TASK_STATUSES, humanize, PRIORITIES, taskStatusTone } from '@/lib/domain';
import { minutes, minutesSince, timeAgo } from '@/lib/format';
import { getMachines, getOperatorOptions, getTasks } from '@/lib/queries';
import { requireSupervisor } from '@/lib/session';
import { NewTaskForm } from './NewTaskForm';

const STATUS_FILTERS = [
  ['', 'All'],
  ['active', 'Active'],
  ['queued', 'Queued'],
  ['completed', 'Completed'],
] as const;

export default async function TasksPage({ searchParams }: { searchParams: Promise<Record<string, string | undefined>> }) {
  await requireSupervisor();
  const sp = await searchParams;
  const status = sp.status ?? '';
  const operator = sp.operator ?? '';

  const [tasks, operators, machines] = await Promise.all([
    getTasks({ status: status || undefined, operator: operator || undefined }),
    getOperatorOptions(),
    getMachines(),
  ]);

  const href = (s: string, o: string) => {
    const q = new URLSearchParams();
    if (s) q.set('status', s);
    if (o) q.set('operator', o);
    const qs = q.toString();
    return qs ? `/tasks?${qs}` : '/tasks';
  };

  return (
    <>
      <PageHeader title="Task Assignment" sub="Create work orders and assign them to operators’ cabin apps" />
      <div className="content">
        <details className="panel" open={tasks.length === 0 || undefined}>
          <summary className="panel-head">
            <h2>+ Assign a new task</h2>
            <span className="muted small">Click to expand</span>
          </summary>
          <div className="panel-body">
            <NewTaskForm operators={operators} machines={machines} defaultOperator={operator && operator !== 'unassigned' ? operator : undefined} />
          </div>
        </details>

        <div className="panel">
          <div className="panel-head" style={{ flexWrap: 'wrap' }}>
            <div className="filters">
              {STATUS_FILTERS.map(([s, label]) => (
                <Link key={s} href={href(s, operator)} className={`chip${status === s ? ' on' : ''}`}>
                  {label}
                </Link>
              ))}
            </div>
            <div className="filters">
              <Link href={href(status, '')} className={`chip${!operator ? ' on' : ''}`}>Everyone</Link>
              {operators.map((o) => (
                <Link key={o.id} href={href(status, o.id)} className={`chip${operator === o.id ? ' on' : ''}`}>
                  {o.name.split(' ')[0]}
                </Link>
              ))}
              <Link href={href(status, 'unassigned')} className={`chip${operator === 'unassigned' ? ' on' : ''}`}>
                Unassigned
              </Link>
            </div>
          </div>
          <div className="panel-body flush table-wrap">
            <table>
              <thead>
                <tr>
                  <th>Task</th>
                  <th>Status</th>
                  <th>Priority</th>
                  <th>Operator</th>
                  <th>Time</th>
                  <th>Checklist</th>
                  <th />
                </tr>
              </thead>
              <tbody>
                {tasks.length === 0 && (
                  <tr>
                    <td colSpan={7} className="empty">No tasks match this filter.</td>
                  </tr>
                )}
                {tasks.map((t) => {
                  const editable = EDITABLE_TASK_STATUSES.includes(t.status);
                  const elapsed = t.status === 'completed' ? t.actualMinutes : minutesSince(t.startedAt);
                  const est = t.estimatedMinutes;
                  const over = elapsed != null && est != null && elapsed > est;
                  return (
                    <tr key={t.id}>
                      <td style={{ maxWidth: 340 }}>
                        <div className="title">{t.title}</div>
                        <div className="muted small">
                          <span className="mono">{t.id}</span> · {humanize(t.type)} · {t.zone ?? 'no zone'}
                        </div>
                      </td>
                      <td>
                        <Badge tone={taskStatusTone(t.status)}>{humanize(t.status)}</Badge>
                        {t.startedAt && t.status !== 'completed' && (
                          <div className="muted small">started {timeAgo(t.startedAt)}</div>
                        )}
                      </td>
                      <td>
                        {t.status === 'completed' ? (
                          humanize(t.priority)
                        ) : (
                          <form action={setTaskPriority}>
                            <input type="hidden" name="taskId" value={t.id} />
                            <AutoSubmitSelect name="priority" defaultValue={t.priority} ariaLabel={`Priority of ${t.title}`}>
                              {PRIORITIES.map((p) => (
                                <option key={p} value={p}>{humanize(p)}</option>
                              ))}
                            </AutoSubmitSelect>
                          </form>
                        )}
                      </td>
                      <td>
                        {editable ? (
                          <form action={assignTask}>
                            <input type="hidden" name="taskId" value={t.id} />
                            <AutoSubmitSelect name="operatorId" defaultValue={t.assignedTo ?? ''} ariaLabel={`Operator for ${t.title}`}>
                              <option value="">Unassigned</option>
                              {operators.map((o) => (
                                <option key={o.id} value={o.id}>{o.name}</option>
                              ))}
                            </AutoSubmitSelect>
                          </form>
                        ) : (
                          <>
                            <div>{t.assigneeName ?? 'Unassigned'}</div>
                            <div className="muted small">{t.machineId ?? ''}</div>
                          </>
                        )}
                      </td>
                      <td className="small" style={{ whiteSpace: 'nowrap' }}>
                        {elapsed != null ? (
                          <span style={{ color: over ? 'var(--danger)' : undefined }}>
                            {minutes(elapsed)} / {minutes(est)}
                          </span>
                        ) : (
                          <>est {minutes(est)}</>
                        )}
                        {t.status === 'completed' && est != null && t.actualMinutes != null && (
                          <div className="muted">
                            error {t.actualMinutes - est > 0 ? '+' : ''}
                            {Math.round(t.actualMinutes - est)}m
                          </div>
                        )}
                      </td>
                      <td className="small">
                        {t.checklistTotal ? `${t.checklistDone}/${t.checklistTotal}` : '—'}
                      </td>
                      <td>
                        {editable && (
                          <form action={deleteTask}>
                            <input type="hidden" name="taskId" value={t.id} />
                            <SubmitButton className="btn danger sm" confirm={`Delete task ${t.id} “${t.title}”?`}>
                              Delete
                            </SubmitButton>
                          </form>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
        <p className="hint">
          Only tasks that have not started can be reassigned or deleted, so an operator is never pulled off work in
          progress. Unassigned tasks appear in every operator’s queue.
        </p>
      </div>
    </>
  );
}
