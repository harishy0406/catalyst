import 'server-only';
import { cookies, headers } from 'next/headers';
import { redirect } from 'next/navigation';
import { SignJWT, jwtVerify } from 'jose';

/** Roles allowed into the supervisor dashboard (docs/SECURITY.md §2). */
export const SUPERVISOR_ROLES = ['supervisor', 'safety_officer', 'admin'] as const;

export type Session = {
  id: string;
  name: string;
  role: string;
  /** FastAPI backend JWT for the same user, used by the demo simulator (lib/backend.ts). */
  backendToken?: string;
};

const COOKIE = 'catalyst_sup_session';
const MAX_AGE = 60 * 60 * 12; // one shift

function secret() {
  const s = process.env.SESSION_SECRET;
  if (!s || s.length < 32) throw new Error('SESSION_SECRET must be set to 32+ chars (see .env.example)');
  return new TextEncoder().encode(s);
}

export async function createSession(user: Session) {
  const token = await new SignJWT({ name: user.name, role: user.role, ...(user.backendToken ? { bt: user.backendToken } : {}) })
    .setProtectedHeader({ alg: 'HS256' })
    .setSubject(user.id)
    .setIssuedAt()
    .setExpirationTime(`${MAX_AGE}s`)
    .sign(secret());
  // Secure whenever served over HTTPS; plain-HTTP LAN demos (http://<laptop-ip>:3100) still work.
  const https = (await headers()).get('x-forwarded-proto')?.split(',')[0].trim() === 'https';
  (await cookies()).set(COOKIE, token, {
    httpOnly: true,
    sameSite: 'lax',
    secure: https,
    path: '/',
    maxAge: MAX_AGE,
  });
}

export async function destroySession() {
  (await cookies()).delete(COOKIE);
}

export async function getSession(): Promise<Session | null> {
  const token = (await cookies()).get(COOKIE)?.value;
  if (!token) return null;
  try {
    const { payload } = await jwtVerify(token, secret());
    const role = String(payload.role);
    if (!payload.sub || !(SUPERVISOR_ROLES as readonly string[]).includes(role)) return null;
    return { id: payload.sub, name: String(payload.name), role, backendToken: typeof payload.bt === 'string' ? payload.bt : undefined };
  } catch {
    return null;
  }
}

/** Use in every page and server action — hiding UI is not a security boundary. */
export async function requireSupervisor(): Promise<Session> {
  const s = await getSession();
  if (!s) redirect('/login');
  return s;
}
