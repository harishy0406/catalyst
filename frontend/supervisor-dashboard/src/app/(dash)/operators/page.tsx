import Link from 'next/link';
import { Badge } from '@/components/Badge';
import { PageHeader } from '@/components/PageHeader';
import { humanize } from '@/lib/domain';
import { minutes, minutesSince } from '@/lib/format';
import { getOperators, getTasks } from '@/lib/queries';
import { requireSupervisor } from '@/lib/session';

const initials = (n: string) => n.split(' ').map((p) => p[0]).slice(0, 2).join('');

export default async function OperatorsPage() {
  await requireSupervisor();
  const [operators, active] = await Promise.all([getOperators(), getTasks({ status: 'active' })]);
  const estByTask = new Map(active.map((t) => [t.id, t.estimatedMinutes]));

  return (
    <>
      <PageHeader title="Operators" sub={`${operators.length} operators on site`} />
      <div className="content">
        <div className="op-cards">
          {operators.map((op) => {
            const est = op.activeTaskId ? estByTask.get(op.activeTaskId) ?? null : null;
            const el = minutesSince(op.activeTaskStartedAt);
            const pct = est && el != null ? Math.min(100, (el / est) * 100) : 0;
            const over = est != null && el != null && el > est;
            return (
              <Link key={op.id} href={`/operators/${op.id}`} className="panel op-card">
                <div className="op-head">
                  <div style={{ display: 'flex', gap: 12, alignItems: 'center' }}>
                    <div className="avatar">{initials(op.name)}</div>
                    <div>
                      <h3>{op.name}</h3>
                      <div className="muted small">{op.id} · {humanize(op.skillLevel)}</div>
                    </div>
                  </div>
                  {op.unackedAlerts ? <Badge tone="danger">{op.unackedAlerts} alert(s)</Badge> : <Badge tone="safe">Safe</Badge>}
                </div>
                <div className="small muted">
                  Machine: <b style={{ color: 'var(--on-surface)' }}>{op.machineId ?? '—'}</b> {op.machineModel ? `· ${op.machineModel}` : ''}
                </div>
                <div className={`current${op.activeTaskTitle ? '' : ' idle'}`}>
                  {op.activeTaskTitle ? (
                    <>
                      <div className="label" style={{ color: 'var(--gold)' }}>
                        {op.activeTaskStatus === 'paused' ? 'Paused' : 'Working on'}
                      </div>
                      <div style={{ fontWeight: 600, margin: '2px 0 8px' }}>{op.activeTaskTitle}</div>
                      <div className={`progress${over ? ' over' : ''}`}><span style={{ width: `${pct}%` }} /></div>
                      <div className="small muted" style={{ marginTop: 4 }}>
                        {minutes(el)} elapsed of {minutes(est)} est{over ? ' — over estimate' : ''}
                      </div>
                    </>
                  ) : (
                    <span className="muted">No active task</span>
                  )}
                </div>
                <div className="stats">
                  <div className="stat"><div className="n">{op.queuedTasks}</div><div className="l">Queued</div></div>
                  <div className="stat"><div className="n">{op.completedTasks}</div><div className="l">Done</div></div>
                  <div className="stat">
                    <div className="n" style={{ color: op.openIncidents ? 'var(--danger)' : undefined }}>{op.openIncidents}</div>
                    <div className="l">Incidents</div>
                  </div>
                  <div className="stat"><div className="n">{op.trainingsCompleted}</div><div className="l">Training</div></div>
                </div>
              </Link>
            );
          })}
        </div>
      </div>
    </>
  );
}
