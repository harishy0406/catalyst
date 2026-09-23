import Link from 'next/link';
import { acknowledgeAlert } from '@/app/actions';
import { Badge } from '@/components/Badge';
import { PageHeader } from '@/components/PageHeader';
import { SubmitButton } from '@/components/SubmitButton';
import { severityTone } from '@/lib/domain';
import { dateTime, timeAgo } from '@/lib/format';
import { getAlerts } from '@/lib/queries';
import { requireSupervisor } from '@/lib/session';

export default async function AlertsPage({ searchParams }: { searchParams: Promise<Record<string, string | undefined>> }) {
  await requireSupervisor();
  const sp = await searchParams;
  const unacked = sp.show !== 'all';
  const alerts = await getAlerts({ unacked, limit: 200 });

  return (
    <>
      <PageHeader title="Safety Alerts" sub="Raised by the safety rule engine from live machine telemetry" />
      <div className="content">
        <div className="panel">
          <div className="panel-head">
            <div className="filters">
              <Link href="/alerts" className={`chip${unacked ? ' on' : ''}`}>Unacknowledged</Link>
              <Link href="/alerts?show=all" className={`chip${!unacked ? ' on' : ''}`}>All (latest 200)</Link>
            </div>
          </div>
          <div className="panel-body flush table-wrap">
            <table>
              <thead>
                <tr>
                  <th>Severity</th>
                  <th>Alert</th>
                  <th>Machine</th>
                  <th>Operator</th>
                  <th>Raised</th>
                  <th>Acknowledgement</th>
                </tr>
              </thead>
              <tbody>
                {alerts.length === 0 && (
                  <tr>
                    <td colSpan={6} className="empty">{unacked ? 'Nothing waiting — all alerts acknowledged.' : 'No alerts yet.'}</td>
                  </tr>
                )}
                {alerts.map((a) => (
                  <tr key={a.id}>
                    <td><Badge tone={severityTone(a.severity)}>{a.severity}</Badge></td>
                    <td>
                      <div>{a.message}</div>
                      <div className="muted small mono">{a.ruleId ?? ''}</div>
                    </td>
                    <td className="mono">{a.machineId}</td>
                    <td>
                      {a.operatorId ? <Link href={`/operators/${a.operatorId}`}>{a.operatorName ?? a.operatorId}</Link> : '—'}
                    </td>
                    <td className="small" title={dateTime(a.createdAt)}>{timeAgo(a.createdAt)}</td>
                    <td>
                      {a.acknowledged ? (
                        <span className="small muted">
                          <Badge tone="safe">Acked</Badge> {a.acknowledgedBy ?? ''} · {timeAgo(a.acknowledgedAt)}
                        </span>
                      ) : (
                        <form action={acknowledgeAlert}>
                          <input type="hidden" name="alertId" value={a.id} />
                          <SubmitButton className="btn sm">Acknowledge</SubmitButton>
                        </form>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </>
  );
}
