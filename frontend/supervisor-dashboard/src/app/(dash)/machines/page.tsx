import Link from 'next/link';
import { Badge } from '@/components/Badge';
import { PageHeader } from '@/components/PageHeader';
import { humanize, machinePhoto, machineStatusTone, machineTypeOf, TASKS_BY_MACHINE } from '@/lib/domain';
import { getMachines, getOperatorOptions, getTasks } from '@/lib/queries';
import { requireSupervisor } from '@/lib/session';

export default async function MachinesPage() {
  await requireSupervisor();
  const [machines, operators, active] = await Promise.all([
    getMachines(),
    getOperatorOptions(),
    getTasks({ status: 'active' }),
  ]);

  return (
    <>
      <PageHeader title="Machines" sub={`${machines.length} machines in the fleet`} />
      <div className="content">
        <div className="op-cards">
          {machines.map((m) => {
            const type = machineTypeOf(m.model, m.id);
            const photo = machinePhoto(type);
            const op = operators.find((o) => o.machineId === m.id);
            const task = active.find((t) => t.machineId === m.id);
            const health = m.healthScore;
            const healthColor = health < 60 ? 'var(--danger)' : health < 80 ? 'var(--warning)' : 'var(--safe)';
            return (
              <div key={m.id} className="panel op-card">
                <div className="machine-photo">
                  {photo ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={photo} alt={m.model} />
                  ) : (
                    <span className="muted">No photo</span>
                  )}
                </div>
                <div className="op-head">
                  <div>
                    <h3>{m.model}</h3>
                    <div className="muted small">
                      <span className="mono">{m.id}</span> · {type ? humanize(type) : 'Unknown type'}
                    </div>
                  </div>
                  <Badge tone={machineStatusTone(m.status)}>{humanize(m.status)}</Badge>
                </div>
                <div>
                  <div className="small muted" style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4 }}>
                    <span>Health</span>
                    <b style={{ color: healthColor }}>{health}%</b>
                  </div>
                  <div className="progress">
                    <span style={{ width: `${health}%`, background: healthColor }} />
                  </div>
                </div>
                <div className="small muted">
                  Operator:{' '}
                  {op ? (
                    <Link href={`/operators/${op.id}`} style={{ color: 'var(--on-surface)', fontWeight: 700 }}>
                      {op.name}
                    </Link>
                  ) : (
                    <b style={{ color: 'var(--on-surface)' }}>—</b>
                  )}
                  {' · '}
                  {Math.round(m.operatingHours).toLocaleString()} operating hrs
                </div>
                <div className={`current${task ? '' : ' idle'}`}>
                  {task ? (
                    <>
                      <div className="label" style={{ color: 'var(--gold)' }}>
                        {task.status === 'paused' ? 'Paused' : 'Working on'}
                      </div>
                      <div style={{ fontWeight: 600 }}>{task.title}</div>
                    </>
                  ) : (
                    <span className="muted">Idle</span>
                  )}
                </div>
                {type && (
                  <div>
                    <div className="label" style={{ marginBottom: 6 }}>Can perform</div>
                    <div className="chips">
                      {TASKS_BY_MACHINE[type].map((t) => (
                        <span key={t} className="tag">{humanize(t)}</span>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>
    </>
  );
}
