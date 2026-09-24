import Link from 'next/link';
import { Badge } from '@/components/Badge';
import { PageHeader } from '@/components/PageHeader';
import { SimulatorWidget } from '@/components/SimulatorWidget';
import { humanize, incidentStatusTone, severityTone } from '@/lib/domain';
import { timeAgo } from '@/lib/format';
import { getAlerts, getIncidents, getMachines } from '@/lib/queries';
import { requireSupervisor } from '@/lib/session';

export default async function SimulatorPage() {
  await requireSupervisor();
  const [machines, alerts, incidents] = await Promise.all([
    getMachines(),
    getAlerts({ unacked: true, limit: 8 }),
    getIncidents({ status: 'active', limit: 5 }),
  ]);

  return (
    <>
      <PageHeader title="Demo Simulator" sub="Stream synthetic readings through the real telemetry pipeline" />
      <div className="content">
        <SimulatorWidget machines={machines} />

        {/* What the stream produces — refreshed by the widget whenever a new event lands */}
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
                </div>
              ))}
            </div>
          </div>

          <div className="panel">
            <div className="panel-head">
              <h2>Open incidents</h2>
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
      </div>
    </>
  );
}
