import Link from 'next/link';
import { notFound } from 'next/navigation';
import { acknowledgeAlert } from '@/app/actions';
import { Badge } from '@/components/Badge';
import { PageHeader } from '@/components/PageHeader';
import { SubmitButton } from '@/components/SubmitButton';
import { humanize, incidentStatusTone, severityTone, taskStatusTone } from '@/lib/domain';
import { dateTime, minutes, timeAgo } from '@/lib/format';
import {
  getAlerts, getIncidents, getLatestTelemetry, getOperatorHistory, getOperators, getOperatorTraining, getTasks,
} from '@/lib/queries';
import { requireSupervisor } from '@/lib/session';

export default async function OperatorDetailPage({ params }: { params: Promise<{ id: string }> }) {
  await requireSupervisor();
  const { id } = await params;
  const op = (await getOperators()).find((o) => o.id === id);
  if (!op) notFound();

  const [tasks, alerts, incidents, training, history, telemetry] = await Promise.all([
    getTasks({ operator: id }),
    getAlerts({ operator: id, limit: 20 }),
    getIncidents({ operator: id, limit: 20 }),
    getOperatorTraining(id),
    getOperatorHistory(id),
    op.machineId ? getLatestTelemetry(op.machineId) : Promise.resolve(null),
  ]);

  return (
    <>
      <PageHeader
        title={op.name}
        sub={`${op.id} · ${humanize(op.skillLevel)} · ${op.machineId ?? 'no machine'}${op.machineModel ? ` (${op.machineModel})` : ''}`}
        right={
          <>
            <Link href="/operators" className="btn ghost sm">← Operators</Link>
            <Link href={`/tasks?operator=${op.id}`} className="btn sm">Assign task</Link>
          </>
        }
      />
      <div className="content">
        <section className="kpis">
          <div className="kpi primary"><div className="label">Queued</div><div className="value">{op.queuedTasks}</div></div>
          <div className="kpi safe"><div className="label">Completed</div><div className="value">{op.completedTasks}</div></div>
          <div className={`kpi${op.unackedAlerts ? ' danger' : ''}`}><div className="label">Unacked alerts</div><div className="value">{op.unackedAlerts}</div></div>
          <div className={`kpi${op.openIncidents ? ' warning' : ''}`}><div className="label">Open incidents</div><div className="value">{op.openIncidents}</div></div>
          <div className="kpi"><div className="label">Avg estimate error</div><div className="value">{op.avgAbsErrorMin ?? '—'}m</div><div className="sub">{history.length} completed run(s)</div></div>
        </section>

        <div className="panel">
          <div className="panel-head">
            <h2>Task queue</h2>
            <Link href={`/tasks?operator=${op.id}`} className="btn ghost sm">Manage</Link>
          </div>
          <div className="panel-body flush table-wrap">
            <table>
              <thead><tr><th>Task</th><th>Status</th><th>Priority</th><th>Estimate</th><th>Actual</th></tr></thead>
              <tbody>
                {tasks.length === 0 && <tr><td colSpan={5} className="empty">No tasks assigned.</td></tr>}
                {tasks.map((t) => (
                  <tr key={t.id}>
                    <td><div className="title">{t.title}</div><div className="muted small">{t.id} · {humanize(t.type)} · {t.zone ?? ''}</div></td>
                    <td><Badge tone={taskStatusTone(t.status)}>{humanize(t.status)}</Badge></td>
                    <td>{humanize(t.priority)}</td>
                    <td>{minutes(t.estimatedMinutes)}</td>
                    <td>{minutes(t.actualMinutes)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        <section className="grid-2">
          <div className="panel">
            <div className="panel-head"><h2>Safety alerts</h2></div>
            <div className="list">
              {alerts.length === 0 && <div className="empty">No alerts for this operator.</div>}
              {alerts.map((a) => (
                <div key={a.id} className="list-item">
                  <Badge tone={a.acknowledged ? 'neutral' : severityTone(a.severity)}>{a.severity}</Badge>
                  <div className="grow">
                    <div>{a.message}</div>
                    <div className="muted small">{a.machineId} · {timeAgo(a.createdAt)}{a.acknowledged ? ` · acked by ${a.acknowledgedBy ?? '—'}` : ''}</div>
                  </div>
                  {!a.acknowledged && (
                    <form action={acknowledgeAlert}>
                      <input type="hidden" name="alertId" value={a.id} />
                      <SubmitButton className="btn ghost sm">Ack</SubmitButton>
                    </form>
                  )}
                </div>
              ))}
            </div>
          </div>

          <div className="panel">
            <div className="panel-head">
              <h2>Incidents reported</h2>
              <Link href={`/incidents?status=all&operator=${op.id}`} className="btn ghost sm">Open in center</Link>
            </div>
            <div className="list">
              {incidents.length === 0 && <div className="empty">No incidents reported.</div>}
              {incidents.map((i) => (
                <Link key={i.id} href={`/incidents?status=all&operator=${op.id}#${i.id}`} className="list-item">
                  <div className="grow">
                    <div className="filters" style={{ gap: 6 }}>
                      <Badge tone={severityTone(i.severity)}>{i.severity}</Badge>
                      <Badge tone={incidentStatusTone(i.status)}>{i.status}</Badge>
                      <strong>{humanize(i.incidentType)}</strong>
                    </div>
                    <div className="small" style={{ marginTop: 4 }}>{i.description}</div>
                    <div className="muted small">{dateTime(i.reportedAt)}</div>
                  </div>
                </Link>
              ))}
            </div>
          </div>
        </section>

        <section className="grid-3">
          <div className="panel">
            <div className="panel-head"><h2>Machine telemetry</h2><span className="muted small">{op.machineId ?? ''}</span></div>
            <div className="panel-body">
              {telemetry ? (
                <div className="stats" style={{ gridTemplateColumns: 'repeat(2, 1fr)' }}>
                  <div className="stat"><div className="n">{telemetry.engineRpm ?? '—'}</div><div className="l">Engine RPM</div></div>
                  <div className="stat"><div className="n" style={{ color: (telemetry.engineTemp ?? 0) > 105 ? 'var(--danger)' : undefined }}>{telemetry.engineTemp ?? '—'}°C</div><div className="l">Coolant temp</div></div>
                  <div className="stat"><div className="n" style={{ color: (telemetry.hydraulicPressure ?? 0) > 340 ? 'var(--warning)' : undefined }}>{telemetry.hydraulicPressure ?? '—'}</div><div className="l">Hydraulic bar</div></div>
                  <div className="stat"><div className="n">{telemetry.speed ?? '—'}</div><div className="l">Speed km/h</div></div>
                  <div className="stat" style={{ gridColumn: 'span 2' }}><div className="small muted">Last packet {timeAgo(telemetry.recordedAt)}</div></div>
                </div>
              ) : (
                <div className="empty">No telemetry received.</div>
              )}
            </div>
          </div>

          <div className="panel">
            <div className="panel-head"><h2>Training</h2></div>
            <div className="list">
              {training.length === 0 && <div className="empty">No modules completed yet.</div>}
              {training.map((t) => (
                <div key={t.contentId} className="list-item">
                  <div className="grow">
                    <div>{t.title ?? t.contentId}</div>
                    <div className="muted small">{t.category} · {dateTime(t.completedAt)}</div>
                  </div>
                  <Badge tone="safe">{Math.round(t.score)}%</Badge>
                </div>
              ))}
            </div>
          </div>

          <div className="panel">
            <div className="panel-head"><h2>Estimated vs actual</h2></div>
            <div className="panel-body flush table-wrap">
              <table>
                <thead><tr><th>Type</th><th>Est</th><th>Act</th><th>Err</th></tr></thead>
                <tbody>
                  {history.length === 0 && <tr><td colSpan={4} className="empty">No completed history.</td></tr>}
                  {history.map((h, idx) => (
                    <tr key={idx}>
                      <td>{humanize(h.taskType)}</td>
                      <td>{Math.round(h.estimated)}m</td>
                      <td>{Math.round(h.actual)}m</td>
                      <td style={{ color: Math.abs(h.error) > 10 ? 'var(--danger)' : undefined }}>
                        {h.error > 0 ? '+' : ''}{Math.round(h.error)}m
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
