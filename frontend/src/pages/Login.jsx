import { useState } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { getRedirectPath, registerPath } from '../utils/authRedirect';

export default function Login() {
  const { login } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const redirectTo = getRedirectPath(location);
  const [form, setForm] = useState({ email: '', password: '' });
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setBusy(true);
    try {
      await login(form.email, form.password);
      navigate(redirectTo, { replace: true });
    } catch (err) {
      setError(err.message);
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="auth-panel">
      <div className="auth-brand">
        <div>
          <div className="w-12 h-12 rounded-2xl bg-white/10 border border-white/20 flex items-center justify-center font-display font-bold text-lg mb-8">ES</div>
          <h2 className="font-display text-3xl font-bold leading-tight">Welcome back to<br />EntreSkill Hub</h2>
          <p className="text-slate-400 mt-4 max-w-sm leading-relaxed">Pick up where you left off on your startup roadmap.</p>
        </div>
        <p className="text-slate-500 text-xs">Trusted by aspiring entrepreneurs across India</p>
      </div>

      <div className="auth-form-wrap">
        <div className="w-full max-w-md">
          <h1 className="page-title text-2xl sm:text-3xl mb-1">Sign in</h1>
          {redirectTo !== '/dashboard' ? (
            <p className="text-xs text-teal font-medium mb-6 bg-teal/10 border border-teal/20 rounded-lg px-3 py-2">
              After signing in you'll go to <span className="font-semibold">{redirectTo}</span>
            </p>
          ) : (
            <p className="text-ink-soft text-sm mb-8">Access your dashboard, saved ideas, and progress.</p>
          )}

          <form onSubmit={handleSubmit} className="space-y-5">
            <div>
              <label className="label" htmlFor="email">Email address</label>
              <input id="email" type="email" required autoComplete="email" className="input"
                value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} />
            </div>
            <div>
              <label className="label" htmlFor="password">Password</label>
              <input id="password" type="password" required autoComplete="current-password" className="input"
                value={form.password} onChange={(e) => setForm({ ...form, password: e.target.value })} />
            </div>

            {error && (
              <div className="rounded-xl bg-clay/10 border border-clay/20 px-4 py-3 text-clay text-sm" role="alert">{error}</div>
            )}

            <button type="submit" disabled={busy} className="btn-primary w-full py-3">
              {busy ? 'Signing in…' : 'Sign in'}
            </button>
          </form>

          <p className="mt-6 text-sm text-ink-soft text-center">
            Don't have an account?{' '}
            <Link to={registerPath(redirectTo)} className="text-teal font-semibold hover:underline">Create one free</Link>
          </p>

          <p className="mt-4 text-center">
            <Link to="/ideas" className="text-sm text-ink-soft hover:text-teal">Continue browsing without signing in →</Link>
          </p>
        </div>
      </div>
    </div>
  );
}
