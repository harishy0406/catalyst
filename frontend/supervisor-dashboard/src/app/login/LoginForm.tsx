'use client';

import { useActionState } from 'react';
import { login } from '@/app/actions';
import { SubmitButton } from '@/components/SubmitButton';

export function LoginForm() {
  const [state, action] = useActionState(login, undefined);
  return (
    <form action={action} style={{ display: 'grid', gap: 14 }}>
      <label className="field">
        <span className="label">Supervisor ID</span>
        <input name="id" placeholder="SUP-101" autoComplete="username" required autoFocus />
      </label>
      <label className="field">
        <span className="label">PIN</span>
        <input name="pin" type="password" inputMode="numeric" autoComplete="current-password" required />
      </label>
      {state?.error && <div className="notice error">{state.error}</div>}
      <SubmitButton pendingLabel="Signing in…">Sign in</SubmitButton>
    </form>
  );
}
