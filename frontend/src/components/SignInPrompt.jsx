import { Link } from 'react-router-dom';
import { loginPath, registerPath } from '../utils/authRedirect';

/**
 * Inline prompt when a feature needs an account — does NOT redirect automatically.
 */
export default function SignInPrompt({ title = 'Sign in to unlock this feature', body, redirectTo = '/dashboard' }) {
  return (
    <div className="card card-body text-center bg-gradient-to-br from-teal/5 to-teal/10 border-teal/20 py-10">
      <div className="w-12 h-12 rounded-2xl bg-teal/15 flex items-center justify-center mx-auto mb-4">
        <svg className="w-6 h-6 text-teal" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="1.5">
          <path strokeLinecap="round" strokeLinejoin="round" d="M16.5 10.5V6.75a4.5 4.5 0 10-9 0V10.5M4.5 10.5h15m-15 0a3 3 0 00-3 3v6.75a3 3 0 003 3h15a3 3 0 003-3v-6.75a3 3 0 00-3-3m-15 0h15" />
        </svg>
      </div>
      <h3 className="font-display font-bold text-lg text-ink mb-2">{title}</h3>
      <p className="text-sm text-ink-soft max-w-sm mx-auto mb-6 leading-relaxed">
        {body || 'Create a free account to save progress, get personalized matches, and use the budget planner.'}
      </p>
      <div className="flex flex-wrap justify-center gap-3">
        <Link to={loginPath(redirectTo)} className="btn-primary">Sign in</Link>
        <Link to={registerPath(redirectTo)} className="btn-secondary">Create free account</Link>
      </div>
    </div>
  );
}
