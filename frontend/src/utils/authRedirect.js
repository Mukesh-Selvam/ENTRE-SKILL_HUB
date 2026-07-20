/** Where to send the user after login/register */
export function getRedirectPath(location, fallback = '/dashboard') {
  const fromState = location.state?.from;
  if (typeof fromState === 'string' && fromState.startsWith('/')) return fromState;
  if (fromState?.pathname) return fromState.pathname + (fromState.search || '');
  const q = new URLSearchParams(location.search).get('redirect');
  if (q && q.startsWith('/')) return q;
  return fallback;
}

/** Build login URL preserving intended destination */
export function loginPath(redirectTo) {
  if (!redirectTo || redirectTo === '/login' || redirectTo === '/register') return '/login';
  return `/login?redirect=${encodeURIComponent(redirectTo)}`;
}

/** Build register URL preserving intended destination */
export function registerPath(redirectTo) {
  if (!redirectTo || redirectTo === '/login' || redirectTo === '/register') return '/register';
  return `/register?redirect=${encodeURIComponent(redirectTo)}`;
}
