import { logout } from '@/app/actions';
import { NavLinks } from '@/components/NavLinks';
import { humanize } from '@/lib/domain';
import { getNavCounts } from '@/lib/queries';
import { requireSupervisor } from '@/lib/session';

export const dynamic = 'force-dynamic';

export default async function DashLayout({ children }: { children: React.ReactNode }) {
  const me = await requireSupervisor();
  const counts = await getNavCounts();

  return (
    <div className="shell">
      <aside className="sidebar">
        <div className="brand">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src="/logo-white.png" alt="CATALYST" />
          <div className="label">Supervisor Command</div>
        </div>
        <div className="hazard" />
        <NavLinks
          items={[
            { href: '/', label: 'Overview' },
            { href: '/tasks', label: 'Tasks' },
            { href: '/operators', label: 'Operators' },
            { href: '/incidents', label: 'Incidents', count: counts.incidents },
            { href: '/alerts', label: 'Safety Alerts', count: counts.alerts },
            { href: '/simulator', label: 'Demo Simulator' },
          ]}
        />
        <div className="me">
          <div>
            <strong>{me.name}</strong>
            <span className="muted small">
              {me.id} · {humanize(me.role)}
            </span>
          </div>
          <form action={logout}>
            <button className="btn ghost sm" type="submit" style={{ width: '100%' }}>
              Sign out
            </button>
          </form>
        </div>
      </aside>
      <div className="main">
        {children}
        <p className="disclaimer">
          CATALYST is a decision-support system. It does not control machines and does not replace certified safety
          systems or site procedures.
        </p>
      </div>
    </div>
  );
}
