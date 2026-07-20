import { useEffect, useState, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { api } from '../api/client';
import { Spinner, ErrorBanner, EmptyState, PageHeader, IconRoadmap, IconTarget, IconUsers } from '../components/UI';

const STATUS_STYLES = {
  requested: 'badge-amber',
  accepted: 'badge-teal',
  completed: 'badge-slate',
  declined: 'bg-red-100 text-red-700 badge',
};

export default function Dashboard() {
  const { user, token } = useAuth();
  const [progress, setProgress] = useState([]);
  const [bookmarks, setBookmarks] = useState([]);
  const [recommendations, setRecommendations] = useState([]);
  const [sessions, setSessions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const load = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const [p, b, r, s] = await Promise.all([
        api.get('/progress', token),
        api.get('/users/me/bookmarks', token),
        api.get('/business-ideas/recommendations/for-me', token),
        api.get('/mentors/me/requests', token),
      ]);
      setProgress(p.progress);
      setBookmarks(b.bookmarks);
      setRecommendations(r.recommendations.slice(0, 3));
      setSessions(s.sessions || []);
    } catch (err) {
      setError(err.message || 'Could not load your dashboard.');
    } finally {
      setLoading(false);
    }
  }, [token]);

  useEffect(() => { load(); }, [load]);

  if (loading) return <Spinner label="Loading dashboard…" />;
  if (error) return (
    <div className="page-wrap page-section"><ErrorBanner message={error} onRetry={load} /></div>
  );

  const totalSteps = progress.reduce((a, p) => a + p.completed_steps, 0);

  return (
    <div className="page-wrap page-section">
      <PageHeader
        label="Dashboard"
        title={`Welcome back, ${user.name.split(' ')[0]}`}
        subtitle="Track your roadmaps, recommendations, and mentor sessions."
        action={
          <Link to="/ideas" className="btn-primary">Browse ideas</Link>
        }
      />

      {/* Stats row */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-10">
        <div className="stat-card">
          <span className="stat-value">{progress.length}</span>
          <span className="stat-label">Active roadmaps</span>
        </div>
        <div className="stat-card">
          <span className="stat-value">{totalSteps}</span>
          <span className="stat-label">Steps completed</span>
        </div>
        <div className="stat-card">
          <span className="stat-value">{bookmarks.length}</span>
          <span className="stat-label">Saved ideas</span>
        </div>
        <div className="stat-card">
          <span className="stat-value">{sessions.length}</span>
          <span className="stat-label">Mentor sessions</span>
        </div>
      </div>

      <div className="grid lg:grid-cols-3 gap-6">
        {/* Main column */}
        <div className="lg:col-span-2 space-y-6">
          <section>
            <div className="flex items-center justify-between mb-4">
              <h2 className="section-heading text-lg">In progress</h2>
              <Link to="/ideas" className="text-sm text-teal font-semibold hover:underline">View all</Link>
            </div>
            {progress.length === 0 ? (
              <EmptyState
                icon={<IconRoadmap />}
                title="No roadmaps started"
                body="Save a business idea or start checking off steps to track progress here."
                action={<Link to="/ideas" className="btn-primary text-sm">Browse ideas</Link>}
              />
            ) : (
              <div className="grid sm:grid-cols-2 gap-4">
                {progress.map((p) => (
                  <Link key={p.roadmap_id} to={`/ideas/${p.idea_id}`} className="card-hover card-body group">
                    <h3 className="font-display font-bold text-ink group-hover:text-teal transition-colors">{p.idea_title}</h3>
                    <div className="progress-track mt-4">
                      <div className="progress-fill" style={{ width: `${(p.completed_steps / p.total_steps) * 100}%` }} />
                    </div>
                    <p className="text-xs text-ink-soft mt-2 font-medium">{p.completed_steps} of {p.total_steps} steps</p>
                  </Link>
                ))}
              </div>
            )}
          </section>

          <section>
            <h2 className="section-heading text-lg mb-4">Mentor sessions</h2>
            {sessions.length === 0 ? (
              <EmptyState
                icon={<IconUsers />}
                title="No sessions yet"
                body="Connect with a verified mentor for guidance on scaling and marketing."
                action={<Link to="/mentors" className="btn-secondary text-sm">Find mentors</Link>}
              />
            ) : (
              <div className="space-y-3">
                {sessions.map((s) => (
                  <div key={s.id} className="card card-body flex items-center justify-between gap-4">
                    <div>
                      <p className="font-semibold text-sm">Session with <span className="text-teal">{s.mentor_name || 'Mentor'}</span></p>
                      {s.topic && <p className="text-xs text-ink-soft mt-1">Topic: {s.topic}</p>}
                    </div>
                    <span className={STATUS_STYLES[s.status] || 'badge-slate'}>{s.status}</span>
                  </div>
                ))}
              </div>
            )}
          </section>
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          <section className="card card-body">
            <h2 className="section-heading text-base mb-4">Recommended</h2>
            {recommendations.length === 0 ? (
              <EmptyState
                icon={<IconTarget />}
                title="No matches yet"
                body="Set up your skills profile to get personalized recommendations."
                action={<Link to="/onboarding" className="text-teal text-sm font-semibold">Set up profile →</Link>}
              />
            ) : (
              <div className="space-y-3">
                {recommendations.map((idea) => (
                  <Link key={idea.id} to={`/ideas/${idea.id}`} className="block p-3 rounded-xl hover:bg-sand/50 transition-colors group">
                    <span className="badge-amber text-[10px]">{idea.match_score}% match</span>
                    <p className="font-semibold text-sm mt-1 group-hover:text-teal transition-colors">{idea.title}</p>
                  </Link>
                ))}
              </div>
            )}
          </section>

          <section className="card card-body">
            <h2 className="section-heading text-base mb-4">Saved ideas</h2>
            {bookmarks.length === 0 ? (
              <p className="text-sm text-ink-soft">Nothing saved yet. Tap Save on any idea to bookmark it.</p>
            ) : (
              <div className="space-y-2">
                {bookmarks.map((b) => (
                  <Link key={b.id} to={`/ideas/${b.id}`} className="block text-sm font-medium text-ink hover:text-teal py-1.5 transition-colors">{b.title}</Link>
                ))}
              </div>
            )}
          </section>

          <div className="card card-body bg-teal/5 border-teal/20">
            <h3 className="font-display font-bold text-sm mb-2">Quick actions</h3>
            <div className="flex flex-col gap-2">
              <Link to="/onboarding" className="text-sm text-teal font-semibold hover:underline">Update skills →</Link>
              <Link to="/mentors" className="text-sm text-teal font-semibold hover:underline">Find a mentor →</Link>
              <Link to="/profile" className="text-sm text-teal font-semibold hover:underline">View profile →</Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
