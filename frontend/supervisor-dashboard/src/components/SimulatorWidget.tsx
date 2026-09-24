'use client';

import { useCallback, useEffect, useRef, useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import { simStart, simStop, simTrigger, type SimResult } from '@/app/actions';
import type { SimStatus } from '@/lib/backend';
import { humanize, machineTypeOf } from '@/lib/domain';
import { Badge } from './Badge';

const SCENARIOS = [
  { id: 'safety_crisis', label: 'Safety crisis', hint: 'Seatbelt → proximity → auto-incident → AI fault (~100 s)' },
  { id: 'machine_fault', label: 'Machine fault', hint: 'Normal → gradual drift into an AI-detected fault (~50 s)' },
  { id: 'normal', label: 'Normal stream', hint: 'Healthy readings only (3 min)' },
];

const PHASES: Record<string, string> = {
  normal: 'Normal operation',
  seatbelt: 'Seatbelt violation',
  proximity: 'Proximity hazard',
  incident: 'Hazard unacknowledged',
  ml_drift: 'Machine drifting',
  hold: 'AI fault active',
};

type Machine = { id: string; model: string; status: string };

/**
 * Drives the backend's demo stream (/simulation). Readings go through the real telemetry pipeline,
 * so alerts, incidents and AI predictions show up on this dashboard and in the operator app.
 */
export function SimulatorWidget({ machines }: { machines: Machine[] }) {
  const router = useRouter();
  const fleet = machines.filter((m) => machineTypeOf(m.model, m.id));
  const [machineId, setMachineId] = useState(fleet[0]?.id ?? '');
  const [scenario, setScenario] = useState(SCENARIOS[0].id);
  const [status, setStatus] = useState<SimStatus | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();
  const lastEvents = useRef(0);
  const machineRef = useRef(machineId);

  const apply = useCallback(
    (res: SimResult) => {
      if (res.error) setError(res.error);
      if (!res.status) return;
      setError(null);
      setStatus(res.status);
      // New alert/incident → refresh the rest of the overview right away
      if (res.status.events.length !== lastEvents.current) {
        lastEvents.current = res.status.events.length;
        router.refresh();
      }
    },
    [router],
  );

  const running = !!status?.running;

  // Trigger buttons depend on the selected machine's type: re-poll when it changes
  const [pollKey, setPollKey] = useState(0);
  useEffect(() => {
    machineRef.current = machineId;
    setPollKey((k) => k + 1);
  }, [machineId]);

  useEffect(() => {
    let alive = true;
    let inFlight = false;
    const poll = async () => {
      if (inFlight || document.visibilityState !== 'visible') return;
      inFlight = true;
      try {
        const res: SimResult = await (await fetch(`/api/sim/status?machine=${encodeURIComponent(machineRef.current)}`, { cache: 'no-store' })).json();
        if (alive) apply(res);
      } catch {
        // transient network error; next poll retries
      } finally {
        inFlight = false;
      }
    };
    poll();
    const id = setInterval(poll, running ? 2000 : 8000);
    return () => {
      alive = false;
      clearInterval(id);
    };
  }, [apply, running, pollKey]);

  // Follow the machine the stream is running on (e.g. started from another tab)
  useEffect(() => {
    if (status?.running && status.machineId) setMachineId(status.machineId);
  }, [status?.running, status?.machineId]);

  const act = (fn: () => Promise<SimResult>) => startTransition(async () => apply(await fn()));

  const progress = status?.elapsedSeconds != null && status.durationSeconds ? Math.min(1, status.elapsedSeconds / status.durationSeconds) : 0;
  const ml = status?.lastPrediction;
  const machine = fleet.find((m) => m.id === machineId);

  return (
    <div className="panel sim">
      <div className="panel-head">
        <h2>Demo Simulator</h2>
        {running ? (
          <Badge tone="safe">
            Live stream · tick #{status?.tick} · {PHASES[status?.phase ?? ''] ?? 'Starting'}
          </Badge>
        ) : (
          <Badge tone="neutral">Stream stopped{status?.stopReason === 'finished' ? ' · scenario finished' : ''}</Badge>
        )}
      </div>
      <div className="panel-body sim-body">
        <div className="sim-controls">
          <label className="field">
            <span className="label">Machine</span>
            <select value={machineId} onChange={(e) => setMachineId(e.target.value)} disabled={running}>
              {fleet.map((m) => (
                <option key={m.id} value={m.id}>
                  {m.id} · {humanize(machineTypeOf(m.model, m.id))}
                </option>
              ))}
            </select>
          </label>
          <div className="field">
            <span className="label">Scenario</span>
            <div className="filters">
              {SCENARIOS.map((s) => (
                <button
                  key={s.id}
                  type="button"
                  className={`chip${scenario === s.id ? ' on' : ''}`}
                  onClick={() => setScenario(s.id)}
                  disabled={running}
                  title={s.hint}
                >
                  {s.label}
                </button>
              ))}
            </div>
          </div>
          <div className="sim-actions">
            {running ? (
              <button type="button" className="btn danger" onClick={() => act(simStop)} disabled={pending}>
                ■ Stop stream
              </button>
            ) : (
              <button type="button" className="btn" onClick={() => act(() => simStart(scenario, machineId))} disabled={pending || !machineId}>
                ▶ Start live demo
              </button>
            )}
          </div>
        </div>

        {running && (
          <div className="sim-progress" title={`${status?.elapsedSeconds ?? 0}s of ${status?.durationSeconds}s`}>
            <div className="progress">
              <span style={{ width: `${progress * 100}%` }} />
            </div>
            <span className="muted small">
              {Math.round(status?.elapsedSeconds ?? 0)}s / {status?.durationSeconds}s · {SCENARIOS.find((s) => s.id === status?.scenario)?.hint}
            </span>
          </div>
        )}

        <div className="sim-triggers">
          <span className="label">Instant triggers{machine ? ` · ${machine.id}` : ''}</span>
          <div className="filters">
            {(status?.triggers ?? []).map((t) => (
              <button
                key={t.id}
                type="button"
                className={`btn sm ${t.id.startsWith('anomaly:') ? 'ghost' : 'danger'}`}
                onClick={() => act(() => simTrigger(t.id, machineId))}
                disabled={pending}
              >
                {t.id === 'seatbelt' ? '⚠ ' : t.id === 'proximity' ? '🚨 ' : ''}
                {t.label}
              </button>
            ))}
          </div>
        </div>

        <div className="sim-feed">
          <div className="sim-ml">
            <span className="label">Latest AI verdict</span>
            {ml ? (
              <Badge tone={ml.isAnomaly ? 'danger' : 'safe'}>
                {humanize(ml.prediction)} · {ml.confidencePercent}%
              </Badge>
            ) : (
              <span className="muted small">No readings yet</span>
            )}
          </div>
          <ul className="sim-events">
            {(status?.events ?? []).filter((e) => e.kind !== 'start').slice(0, 6).map((e) => (
              <li key={`${e.at}-${e.kind}-${e.id ?? e.message}`}>
                <span className="mono muted small">{new Date(e.at + 'Z').toLocaleTimeString([], { hour12: false })}</span>
                <Badge tone={e.kind === 'incident' ? 'warning' : e.kind === 'alert' ? (e.severity === 'critical' ? 'danger' : 'warning') : 'neutral'}>
                  {e.kind}
                </Badge>
                <span className="small">{e.message}</span>
              </li>
            ))}
          </ul>
        </div>

        {error && <div className="notice error">{error}</div>}
        <p className="disclaimer">Simulated feed: readings are synthetic and tagged source = simulation in the database.</p>
      </div>
    </div>
  );
}
