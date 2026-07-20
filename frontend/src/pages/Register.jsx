import { useState } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { getRedirectPath, loginPath } from '../utils/authRedirect';

export default function Register() {
  const { register } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const redirectTo = getRedirectPath(location, '/onboarding');
  const [role, setRole] = useState('user');
  const [form, setForm] = useState({ name: '', email: '', password: '', bio: '', expertise: '', experience_years: '' });
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setBusy(true);
    try {
      const payload = { ...form, role };
      if (role !== 'mentor') {
        delete payload.bio; delete payload.expertise; delete payload.experience_years;
      } else {
        payload.experience_years = form.experience_years ? Number(form.experience_years) : undefined;
      }
      await register(payload);
      navigate(redirectTo === '/dashboard' ? (role === 'mentor' ? '/dashboard' : '/onboarding') : redirectTo, { replace: true });
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
          <h2 className="font-display text-3xl font-bold leading-tight">Start building your<br />micro-business today</h2>
          <p className="text-slate-400 mt-4 max-w-sm leading-relaxed">Join thousands of skill-holders turning what they know into income.</p>
        </div>
        <ul className="space-y-3 text-sm text-slate-400">
          <li className="flex items-center gap-2"><span className="text-emerald-400">✓</span> Personalized idea matches</li>
          <li className="flex items-center gap-2"><span className="text-emerald-400">✓</span> Step-by-step launch roadmaps</li>
          <li className="flex items-center gap-2"><span className="text-emerald-400">✓</span> Access to verified mentors</li>
        </ul>
      </div>

      <div className="auth-form-wrap">
        <div className="w-full max-w-md">
          <h1 className="page-title text-2xl sm:text-3xl mb-1">Create account</h1>
          <p className="text-ink-soft text-sm mb-6">Free forever. No credit card required.</p>

          <div className="flex gap-1 p-1 bg-sand/60 rounded-xl mb-6">
            {['user', 'mentor'].map((r) => (
              <button key={r} type="button" onClick={() => setRole(r)}
                className={`flex-1 px-3 py-2 rounded-lg text-xs sm:text-sm font-semibold transition-all ${role === r ? 'bg-white text-ink shadow-sm' : 'text-ink-soft hover:text-ink'}`}>
                {r === 'user' ? 'Entrepreneur' : 'Mentor'}
              </button>
            ))}
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="label" htmlFor="name">Full name</label>
              <input id="name" required className="input" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />
            </div>
            <div>
              <label className="label" htmlFor="email">Email</label>
              <input id="email" type="email" required autoComplete="email" className="input"
                value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} />
            </div>
            <div>
              <label className="label" htmlFor="password">Password</label>
              <input id="password" type="password" required minLength={8} autoComplete="new-password" className="input"
                value={form.password} onChange={(e) => setForm({ ...form, password: e.target.value })} />
              <p className="text-xs text-ink-soft mt-1.5">Minimum 8 characters with at least one number.</p>
            </div>

            {role === 'mentor' && (
              <div className="space-y-4 pt-2 border-t border-sand-line">
                <div>
                  <label className="label" htmlFor="expertise">Expertise area</label>
                  <input id="expertise" placeholder="e.g. Tailoring & Retail" className="input"
                    value={form.expertise} onChange={(e) => setForm({ ...form, expertise: e.target.value })} />
                </div>
                <div>
                  <label className="label" htmlFor="years">Years of experience</label>
                  <input id="years" type="number" min="0" className="input"
                    value={form.experience_years} onChange={(e) => setForm({ ...form, experience_years: e.target.value })} />
                </div>
                <div>
                  <label className="label" htmlFor="bio">Bio</label>
                  <textarea id="bio" rows={3} className="input resize-none"
                    value={form.bio} onChange={(e) => setForm({ ...form, bio: e.target.value })} />
                </div>
                <p className="text-xs text-amber-700 bg-amber-50 border border-amber-200 rounded-xl px-3 py-2">
                  Mentor accounts are reviewed before appearing in the public directory.
                </p>
              </div>
            )}

            {error && (
              <div className="rounded-xl bg-clay/10 border border-clay/20 px-4 py-3 text-clay text-sm" role="alert">{error}</div>
            )}

            <button type="submit" disabled={busy} className="btn-primary w-full py-3">
              {busy ? 'Creating account…' : 'Create free account'}
            </button>
          </form>

          <p className="mt-6 text-sm text-ink-soft text-center">
            Already registered? <Link to={loginPath(redirectTo)} className="text-teal font-semibold hover:underline">Sign in</Link>
          </p>
          <p className="mt-4 text-center">
            <Link to="/ideas" className="text-sm text-ink-soft hover:text-teal">Browse ideas without an account →</Link>
          </p>
        </div>
      </div>
    </div>
  );
}
