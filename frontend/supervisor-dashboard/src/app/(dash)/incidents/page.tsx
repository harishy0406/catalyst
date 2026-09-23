import Link from 'next/link';
import { Badge } from '@/components/Badge';
import { PageHeader } from '@/components/PageHeader';
import { humanize, incidentStatusTone, SEVERITIES, severityTone } from '@/lib/domain';
import { dateTime, timeAgo } from '@/lib/format';
import { getIncidents } from '@/lib/queries';
import { requireSupervisor } from '@/lib/session';
import { IncidentActions } from './IncidentActions';

const STATUS_FILTERS = [
  ['active', 'Needs action'],
  ['open', 'Open'],
  ['investigating', 'Investigating'],
  ['resolved', 'Resolved'],
  ['all', 'All'],
] as const;

export default async function IncidentsPage({ searchParams }: { searchParams: Promise<Record<string, string | undefined>> }) {
  await requireSupervisor();
  const sp = await searchParams;
  const status = sp.status ?? 'active';
  const severity = sp.severity ?? '';
  const incidents = await getIncidents({
    status: status === 'all' ? undefined : status,
    severity: severity || undefined,
    operator: sp.operator,
  });

  const href = (s: string, sev: string) => {
    const q = new URLSearchParams({ status: s });
    if (sev) q.set('severity', sev);
    if (sp.operator) q.set('operator', sp.operator);
    return `/incidents?${q}`;
  };

  return (
    <>
      <PageHeader
        title="Incident Center"
        sub="Reports logged by operators from the cabin — review, investigate and close them out"
      />
      <div className="content">
        <div className="panel">
          <div className="panel-head" style={{ flexWrap: 'wrap' }}>
            <div className="filters">
              {STATUS_FILTERS.map(([s, label]) => (
                <Link key={s} href={href(s, severity)} className={`chip${status === s ? ' on' : ''}`}>{label}</Link>
              ))}
            </div>
            <div className="filters">
              <Link href={href(status, '')} className={`chip${!severity ? ' on' : ''}`}>Any severity</Link>
              {SEVERITIES.map((s) => (
                <Link key={s} href={href(status, s)} className={`chip${severity === s ? ' on' : ''}`}>{humanize(s)}</Link>
              ))}
            </div>
          </div>
          {sp.operator && (
            <div className="panel-body" style={{ paddingBottom: 0 }}>
              <span className="muted small">
                Showing reports from <b>{sp.operator}</b> ·{' '}
                <Link href={`/incidents?${new URLSearchParams(severity ? { status, severity } : { status })}`} style={{ color: 'var(--gold)' }}>clear</Link>
              </span>
            </div>
          )}
          <div>
            {incidents.length === 0 && <div className="empty">No incidents match this filter.</div>}
            {incidents.map((i) => (
              <article key={i.id} id={i.id} className={`incident ${i.status}`}>
                <div className="op-head">
                  <div className="filters" style={{ gap: 8 }}>
                    <Badge tone={severityTone(i.severity)}>{i.severity}</Badge>
                    <Badge tone={incidentStatusTone(i.status)}>{i.status}</Badge>
                    <h3>{humanize(i.incidentType)}</h3>
                    <span className="mono muted">{i.id}</span>
                  </div>
                  <span className="muted small" title={dateTime(i.reportedAt)}>{timeAgo(i.reportedAt)}</span>
                </div>
                <div>{i.description}</div>
                <div className="incident-meta">
                  <span>Reported by <b><Link href={`/operators/${i.reportedBy}`}>{i.reporterName ?? i.reportedBy}</Link></b></span>
                  <span>At <b>{dateTime(i.reportedAt)}</b></span>
                  <span>Machine <b>{i.machineId ?? '—'}</b></span>
                  <span>Task <b>{i.taskTitle ? `${i.taskTitle} (${i.taskId})` : (i.taskId ?? '—')}</b></span>
                  {i.photoCount > 0 && <span><b>{i.photoCount}</b> photo(s)</span>}
                  {i.resolvedAt && <span>Resolved <b>{dateTime(i.resolvedAt)}</b></span>}
                </div>
                {i.resolutionNotes && <div className="notes">{i.resolutionNotes}</div>}
                <IncidentActions id={i.id} status={i.status} />
              </article>
            ))}
          </div>
        </div>
      </div>
    </>
  );
}
