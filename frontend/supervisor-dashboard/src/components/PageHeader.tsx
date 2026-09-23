import type { ReactNode } from 'react';
import { AutoRefresh } from './AutoRefresh';

export function PageHeader({ title, sub, right }: { title: string; sub?: ReactNode; right?: ReactNode }) {
  return (
    <header className="topbar">
      <div>
        <h1>{title}</h1>
        {sub && <div className="muted small">{sub}</div>}
      </div>
      <div className="filters">
        {right}
        <AutoRefresh />
      </div>
    </header>
  );
}
