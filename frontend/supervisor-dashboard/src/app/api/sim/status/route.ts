import { NextResponse } from 'next/server';
import { backendFetch, type SimStatus } from '@/lib/backend';
import { getSession } from '@/lib/session';

// Polled every few seconds by SimulatorWidget. A route handler rather than a server action,
// because Next.js runs server actions one at a time and polling would queue up Start/Stop clicks.
// Route handlers aren't cached by default, and this one reads cookies anyway.

const machineQuery = (req: Request) => {
  const id = new URL(req.url).searchParams.get('machine');
  return id ? `?machine_id=${encodeURIComponent(id)}` : '';
};

export async function GET(req: Request) {
  const sup = await getSession();
  if (!sup) return NextResponse.json({ error: 'Signed out' }, { status: 401 });
  if (!sup.backendToken) {
    return NextResponse.json({ error: 'Not connected to the backend. Sign out and back in to use the simulator.' });
  }
  try {
    return NextResponse.json({ status: await backendFetch<SimStatus>(sup.backendToken, `/simulation/status${machineQuery(req)}`) });
  } catch (e) {
    return NextResponse.json({ error: e instanceof Error ? e.message : String(e) });
  }
}
