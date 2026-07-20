import { useState } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { isNavActive } from '../utils/format';
import { loginPath } from '../utils/authRedirect';
import logo from './assets/logo.svg';

function UserAvatar({ user }) {
  const [imgError, setImgError] = useState(false);
  const initial = user.name?.[0]?.toUpperCase() || '?';

  if (user.profile_picture && !imgError) {
    return (
      <img
        src={user.profile_picture}
        alt={user.name}
        className="w-9 h-9 rounded-full object-cover ring-2 ring-white shadow-sm"
        onError={() => setImgError(true)}
      />
    );
  }

  return (
    <span className="w-9 h-9 rounded-full bg-gradient-to-br from-teal to-teal-deep flex items-center justify-center text-white font-bold text-sm shadow-sm">
      {initial}
    </span>
  );
}

export default function Navbar() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [open, setOpen] = useState(false);

  const handleLogout = () => { logout(); setOpen(false); navigate('/'); };
  const close = () => setOpen(false);

  const links = [
    { to: '/ideas', label: 'Ideas' },
    { to: '/mentors', label: 'Mentors' },
    { to: '/resources', label: 'Learning' },
    ...(user ? [{ to: '/dashboard', label: 'Dashboard' }] : [{ to: loginPath('/dashboard'), label: 'Dashboard' }]),
    ...(user?.role === 'mentor' ? [{ to: '/mentor-panel', label: 'Mentor Panel' }] : []),
    ...(user?.role === 'admin' ? [{ to: '/admin', label: 'Admin' }] : []),
  ];

  const navClass = (to) =>
    isNavActive(location.pathname, to)
      ? 'bg-teal/10 text-teal-deep font-semibold'
      : 'text-ink-soft hover:text-ink hover:bg-sand/50';

  return (
    <header className="sticky top-0 z-50 glass-nav">
      <div className="page-wrap py-3 flex items-center justify-between gap-4">

        <Link to="/" onClick={close} className="flex items-center gap-3 shrink-0 group">
          <img src={logo} alt="EntreSkill Hub" className="w-10 h-10 rounded-xl object-cover" />
          <div className="hidden sm:block">
            <span className="font-display text-lg font-bold tracking-tight text-ink block leading-tight">EntreSkill</span>
            <span className="text-[10px] font-semibold uppercase tracking-widest text-teal">Hub</span>
          </div>
        </Link>

        <nav className="hidden lg:flex items-center gap-1 bg-sand/40 rounded-xl p-1">
          {links.map(l => (
            <Link key={l.to} to={l.to} className={`px-4 py-2 rounded-lg text-sm transition-all ${navClass(l.to)}`}>
              {l.label}
            </Link>
          ))}
        </nav>

        <div className="hidden lg:flex items-center gap-3">
          {user ? (
            <>
              <Link to="/profile" className="flex items-center gap-2.5 pl-2 pr-3 py-1.5 rounded-xl hover:bg-sand/50 transition-colors">
                <UserAvatar user={user} />
                <span className="text-sm font-medium text-ink max-w-[100px] truncate">{user.name.split(' ')[0]}</span>
              </Link>
              <button onClick={handleLogout} className="btn-ghost text-sm">Log out</button>
            </>
          ) : (
            <>
              <Link to="/login" className="btn-ghost text-sm">Log in</Link>
              <Link to="/register" className="btn-primary text-sm">Get started free</Link>
            </>
          )}
        </div>

        <button
          className="lg:hidden p-2 rounded-lg text-ink hover:bg-sand/60"
          onClick={() => setOpen(!open)}
          aria-label="Toggle menu"
        >
          <svg width="22" height="22" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
            {open
              ? <><path d="M6 18L18 6"/><path d="M6 6l12 12"/></>
              : <><path d="M4 6h16"/><path d="M4 12h16"/><path d="M4 18h16"/></>}
          </svg>
        </button>
      </div>

      {open && (
        <div className="lg:hidden border-t border-sand-line bg-white px-4 py-4 space-y-3">
          <nav className="flex flex-col gap-1">
            {links.map(l => (
              <Link key={l.to} to={l.to} onClick={close}
                className={`px-4 py-3 rounded-xl text-sm font-medium ${navClass(l.to)}`}>
                {l.label}
              </Link>
            ))}
          </nav>
          <div className="border-t border-sand-line pt-3 flex flex-col gap-2">
            {user ? (
              <button onClick={handleLogout} className="btn-danger w-full">Log out</button>
            ) : (
              <>
                <Link to="/login" onClick={close} className="btn-secondary w-full text-center">Log in</Link>
                <Link to="/register" onClick={close} className="btn-primary w-full text-center">Get started</Link>
              </>
            )}
          </div>
        </div>
      )}
    </header>
  );
}