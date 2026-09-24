import 'server-only';

/**
 * Server-side client for the FastAPI backend. The dashboard reads and writes Postgres directly
 * (lib/db.ts); the backend is only needed for things that live there, like the demo simulator.
 */
export const BACKEND_URL = (process.env.BACKEND_URL ?? 'https://catalyst-api-wn32.onrender.com').replace(/\/$/, '');

/** Backend JWT for this user, or undefined if the backend is unreachable or rejects the login. */
export async function backendLogin(id: string, pin: string): Promise<string | undefined> {
  try {
    const res = await fetch(`${BACKEND_URL}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ operatorId: id, password: pin }),
      cache: 'no-store',
      // Render's free tier can take ~a minute to wake; don't hold up dashboard login for it
      signal: AbortSignal.timeout(15_000),
    });
    if (!res.ok) return undefined;
    return (await res.json()).token as string;
  } catch {
    return undefined;
  }
}

export async function backendFetch<T>(token: string, path: string, body?: unknown): Promise<T> {
  const res = await fetch(`${BACKEND_URL}${path}`, {
    method: body === undefined ? 'GET' : 'POST',
    headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
    body: body === undefined ? undefined : JSON.stringify(body),
    cache: 'no-store',
    signal: AbortSignal.timeout(30_000),
  });
  const data = await res.json().catch(() => null);
  if (!res.ok) throw new Error(data?.detail ?? `Backend request failed (${res.status})`);
  return data as T;
}

export type SimEvent = { at: string; tick: number; phase: string | null; kind: string; id?: string; severity?: string; message?: string };

export type SimStatus = {
  running: boolean;
  scenario: string | null;
  machineId: string | null;
  operatorId: string | null;
  intervalSeconds: number;
  tick: number;
  phase: string | null;
  elapsedSeconds: number | null;
  durationSeconds: number | null;
  stopReason: string | null;
  lastPrediction: { prediction: string; isAnomaly: boolean; confidencePercent: number } | null;
  events: SimEvent[];
  scenarios: string[];
  triggers: { id: string; label: string }[];
};
