import Link from 'next/link';
import { acknowledgeAlert } from '@/app/actions';
import { Badge } from '@/components/Badge';
import { PageHeader } from '@/components/PageHeader';
import { SubmitButton } from '@/components/SubmitButton';
import { humanize, incidentStatusTone, severityTone } from '@/lib/domain';
import { minutes, minutesSince, timeAgo } from '@/lib/format';
import { getAlerts, getIncidents, getMachines, getOperators, getOverview, getTasks } from '@/lib/queries';
import { requireSupervisor } from '@/lib/session';

export default async function OverviewPage() {
  await requireSupervisor();
  const [ov, operators, incidents, alerts, machines, active] = await Promise.all([
    getOverview(),
    getOperators(),
    getIncidents({ status: 'active', limit: 5 }),
    getAlerts({ unacked: true, limit: 5 }),
    getMachines(),
    getTasks({ status: 'active' }),
  ]);
  const estByTask = new Map(active.map((t) => [t.id, t.estimatedMinutes]));

  return (
    <>
      <PageHeader title="Shift Overview" sub="Live view of your crew, fleet and safety events" />
      <div className="content">
        <section className="kpis">
          <Link href="/tasks?status=active" className="kpi primary">
            <div className="label">Active tasks</div>
            <div className="value">{ov.activeTasks}</div>
            <div className="sub">in progress or paused</div>
          </Link>
          <Link href="/tasks?status=queued" className={`kpi${ov.unassignedTasks ? ' warning' : ''}`}>
            <div className="label">Queued</div>
            <div className="value">{ov.queuedTasks}</div>
            <div className="sub">{ov.unassignedTasks} unassigned</div>
          </Link>
          <Link href="/tasks?status=completed" className="kpi safe">
            <div className="label">Completed today</div>
            <div className="value">{ov.completedToday}</div>
            <div className="sub">of {ov.totalTasks} total tasks</div>
          </Link>
          <Link href="/incidents?status=active" className={`kpi${ov.openIncidents ? ' danger' : ' safe'}`}>
            <div className="label">Open incidents</div>
            <div className="value">{ov.openIncidents}</div>
            <div className="sub">{ov.criticalIncidents} high / critical</div>
          </Link>
          <Link href="/alerts" className={`kpi${ov.criticalAlerts ? ' danger' : ov.unackedAlerts ? ' warning' : ' safe'}`}>
            <div className="label">Unacked alerts</div>
            <div className="value">{ov.unackedAlerts}</div>
            <div className="sub">{ov.criticalAlerts} critical</div>
          </Link>
          <div className={`kpi${(ov.avgHealth ?? 100) < 80 ? ' warning' : ' safe'}`}>
            <div className="label">Fleet health</div>
            <div className="value">{ov.avgHealth ?? '—'}%</div>
            <div className="sub">{ov.machinesDown} machine(s) down</div>
          </div>
          <div className="kpi">
            <div className="label">Estimate accuracy</div>
            <div className="value">{ov.mae ?? '—'}m</div>
            <div className="sub">
              MAE · RMSE {ov.rmse ?? '—'}m · n={ov.historyCount}
            </div>
          </div>
        </section>

        <section className="grid-2">
          <div className="panel">
            <div className="panel-head">
              <h2>Crew status</h2>
              <Link href="/operators" className="btn ghost sm">All operators</Link>
            </div>
            <div className="panel-body flush table-wrap">
              <table>
                <thead>
                  <tr>
                    <th>Operator</th>
                    <th>Current task</th>
                    <th>Queue</th>
                    <th>Safety</th>
                  </tr>
                </thead>
                <tbody>
                  {operators.map((op) => {
                    const est = op.activeTaskId ? estByTask.get(op.activeTaskId) : null;
                    const el = minutesSince(op.activeTaskStartedAt);
                    const over = est != null && el != null && el > est;
                    return (
                      <tr key={op.id}>
                        <td>
                          <Link href={`/operators/${op.id}`} className="title">{op.name}</Link>
                          <div className="muted small">{op.id} · {op.machineId ?? 'no machine'}</div>
                        </td>
                        <td>
                          {op.activeTaskTitle ? (
                            <>
                              <div>{op.activeTaskTitle}</div>
                              <div className="small" style={{ color: over ? 'var(--danger)' : 'var(--muted)' }}>
                                {op.activeTaskStatus === 'paused' ? 'Paused · ' : ''}
                                {minutes(el)} / est {minutes(est)}
                                {over ? ' · over estimate' : ''}
                              </div>
                            </>
                          ) : (
                            <span className="muted">Idle</span>
                          )}
                        </td>
                        <td>{op.queuedTasks}</td>
                        <td>
                          {op.unackedAlerts ? (
                            <Badge tone="danger">{op.unackedAlerts} alert{op.unackedAlerts > 1 ? 's' : ''}</Badge>
                          ) : (
                            <Badge tone="safe">Clear</Badge>
                          )}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>

          <div className="panel">
            <div className="panel-head">
              <h2>Incident reports</h2>
              <Link href="/incidents" className="btn ghost sm">Incident center</Link>
            </div>
            <div className="list">
              {incidents.length === 0 && <div className="empty">No open incidents.</div>}
              {incidents.map((i) => (
                <Link key={i.id} href={`/incidents#${i.id}`} className="list-item">
                  <div className="grow">
                    <div className="filters" style={{ gap: 6 }}>
                      <Badge tone={severityTone(i.severity)}>{i.severity}</Badge>
                      <Badge tone={incidentStatusTone(i.status)}>{i.status}</Badge>
                      <strong>{humanize(i.incidentType)}</strong>
                    </div>
                    <div className="small" style={{ marginTop: 6 }}>{i.description}</div>
                    <div className="muted small" style={{ marginTop: 4 }}>
                      {i.reporterName ?? i.reportedBy} · {i.machineId ?? '—'} · {timeAgo(i.reportedAt)}
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          </div>
        </section>

        <section className="grid-2">
          <div className="panel">
            <div className="panel-head">
              <h2>Unacknowledged safety alerts</h2>
              <Link href="/alerts" className="btn ghost sm">All alerts</Link>
            </div>
            <div className="list">
              {alerts.length === 0 && <div className="empty">All alerts acknowledged.</div>}
              {alerts.map((a) => (
                <div key={a.id} className="list-item">
                  <Badge tone={severityTone(a.severity)}>{a.severity}</Badge>
                  <div className="grow">
                    <div>{a.message}</div>
                    <div className="muted small">
                      {a.machineId} · {a.operatorName ?? a.operatorId ?? '—'} · {timeAgo(a.createdAt)}
                    </div>
                  </div>
                  <form action={acknowledgeAlert}>
                    <input type="hidden" name="alertId" value={a.id} />
                    <SubmitButton className="btn ghost sm">Ack</SubmitButton>
                  </form>
                </div>
              ))}
            </div>
          </div>

          <div className="panel">
            <div className="panel-head">
              <h2>Fleet</h2>
            </div>
            <div className="panel-body flush table-wrap">
              <table>
                <thead>
                  <tr>
                    <th>Machine</th>
                    <th>Status</th>
                    <th>Hours</th>
                    <th>Health</th>
                  </tr>
                </thead>
                <tbody>
                  {machines.map((m) => (
                    <tr key={m.id}>
                      <td>
                        <div className="title">{m.id}</div>
                        <div className="muted small">{m.model}</div>
                      </td>
                      <td>
                        <Badge tone={m.status === 'active' ? 'safe' : m.status === 'maintenance' ? 'warning' : 'neutral'}>
                          {m.status}
                        </Badge>
                      </td>
                      <td className="mono">{Math.round(m.operatingHours).toLocaleString()}</td>
                      <td style={{ minWidth: 120 }}>
                        <div className="small">{m.healthScore}%</div>
                        <div className={`progress${m.healthScore < 80 ? ' over' : ''}`}>
                          <span style={{ width: `${m.healthScore}%` }} />
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </section>
      </div>
    </>
  );
}
