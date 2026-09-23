import type { CSSProperties } from 'react';

/**
 * Small server-rendered bar charts for the overview (plain HTML/CSS, no chart library).
 * Every mark carries a hover tooltip (data-tip) and a text label, so colour is never the only cue.
 */

export type Series = { key: string; label: string; color: string };

function Legend({ series, totals }: { series: Series[]; totals?: Record<string, number> }) {
  return (
    <div className="chart-legend">
      {series.map((s) => (
        <span key={s.key}>
          <i style={{ background: s.color }} />
          {s.label}
          {totals && <b>{totals[s.key] ?? 0}</b>}
        </span>
      ))}
    </div>
  );
}

const bar = (pct: number, color: string): CSSProperties => ({ width: `${pct}%`, background: color });

/** One horizontal bar split into parts — e.g. the task pipeline by status. */
export function PartsBar({ series, values, unit }: { series: Series[]; values: Record<string, number>; unit: string }) {
  const total = series.reduce((n, s) => n + (values[s.key] ?? 0), 0);
  return (
    <div className="chart">
      {total === 0 ? (
        <div className="chart-empty">No {unit} yet.</div>
      ) : (
        <div className="parts">
          {series.map((s) => {
            const v = values[s.key] ?? 0;
            if (!v) return null;
            return (
              <span key={s.key} className="tip" data-tip={`${s.label}: ${v} ${unit}`} style={bar((v / total) * 100, s.color)} />
            );
          })}
        </div>
      )}
      <Legend series={series} totals={values} />
    </div>
  );
}

/** Rows of side-by-side bars on one shared scale — e.g. estimated vs actual minutes per task type. */
export function GroupedRows({
  series,
  rows,
  format = String,
  empty,
}: {
  series: Series[];
  rows: { label: string; note?: string; values: Record<string, number> }[];
  format?: (v: number) => string;
  empty: string;
}) {
  const max = Math.max(1, ...rows.flatMap((r) => series.map((s) => r.values[s.key] ?? 0)));
  return (
    <div className="chart">
      <Legend series={series} />
      {rows.length === 0 && <div className="chart-empty">{empty}</div>}
      <div className="rows">
        {rows.map((r) => (
          <div key={r.label} className="row">
            <div className="row-label">
              {r.label}
              {r.note && <span className="muted"> · {r.note}</span>}
            </div>
            <div className="row-bars">
              {series.map((s) => {
                const v = r.values[s.key] ?? 0;
                return (
                  <div key={s.key} className="track tip" data-tip={`${r.label} · ${s.label}: ${format(v)}`}>
                    <span style={bar((v / max) * 100, s.color)} />
                    <em>{format(v)}</em>
                  </div>
                );
              })}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

/** Rows of stacked bars on one shared scale — e.g. alerts per operator by severity. */
export function StackedRows({
  series,
  rows,
  empty,
}: {
  series: Series[];
  rows: { label: string; href?: string; values: Record<string, number> }[];
  empty: string;
}) {
  const totals = rows.map((r) => series.reduce((n, s) => n + (r.values[s.key] ?? 0), 0));
  const max = Math.max(1, ...totals);
  return (
    <div className="chart">
      <Legend series={series} />
      {totals.every((t) => t === 0) && <div className="chart-empty">{empty}</div>}
      <div className="rows">
        {rows.map((r, i) => (
          <div key={r.label} className="row">
            <div className="row-label">{r.href ? <a href={r.href}>{r.label}</a> : r.label}</div>
            <div className="track stacked">
              {series.map((s) => {
                const v = r.values[s.key] ?? 0;
                if (!v) return null;
                return <span key={s.key} className="tip" data-tip={`${r.label} · ${s.label}: ${v}`} style={bar((v / max) * 100, s.color)} />;
              })}
              <em>{totals[i]}</em>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
