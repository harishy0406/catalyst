import { redirect } from 'next/navigation';
import { getSession } from '@/lib/session';
import { LoginForm } from './LoginForm';

export default async function LoginPage() {
  if (await getSession()) redirect('/');
  return (
    <div className="login-wrap">
      <div className="panel login-card">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src="/logo-white.png" alt="CATALYST" />
        <div>
          <h1>Supervisor Command</h1>
          <p className="muted small">Sign in with your supervisor or safety-officer ID.</p>
        </div>
        <LoginForm />
      </div>
    </div>
  );
}
