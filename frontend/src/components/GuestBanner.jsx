import { Link, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { registerPath } from '../utils/authRedirect';

const PUBLIC_PREFIXES = ['/', '/ideas', '/mentors', '/resources', '/login', '/register'];

export default function GuestBanner() {
  const { user, loading } = useAuth();
  const location = useLocation();

  if (loading || user) return null;

  const isPublic = PUBLIC_PREFIXES.some((p) =>
    p === '/' ? location.pathname === '/' : location.pathname === p || location.pathname.startsWith(`${p}/`)
  );
  if (!isPublic) return null;

  return (
    <div className="bg-teal/10 border-b border-teal/20">
      <div className="page-wrap py-2.5 flex flex-wrap items-center justify-between gap-3 text-sm">
        <p className="text-teal-deep font-medium">
          Browse free — sign up to save progress, get skill matches &amp; use the budget planner.
        </p>
        <div className="flex gap-2 shrink-0">
          <Link to="/ideas" className="text-teal font-semibold hover:underline hidden sm:inline">Explore ideas</Link>
          <Link to={registerPath(location.pathname)} className="btn-primary text-xs py-1.5 px-4">
            Sign up free
          </Link>
        </div>
      </div>
    </div>
  );
}
