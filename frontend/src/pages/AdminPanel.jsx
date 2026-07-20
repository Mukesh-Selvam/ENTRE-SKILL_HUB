import { useEffect, useState, useCallback } from 'react';
import { useAuth } from '../context/AuthContext';
import { api } from '../api/client';
import { Spinner, ErrorBanner } from '../components/UI';

const TABS = ['Overview', 'Users', 'Mentors', 'Business Ideas', 'Resources', 'Feedback'];

const ROADMAP_STAGES = [
  { key: 'idea_validation',    label: 'Stage 1 — Idea Validation' },
  { key: 'skills_tools',       label: 'Stage 2 — Skills & Tools' },
  { key: 'legal_registration', label: 'Stage 3 — Legal & Registration' },
  { key: 'cost_estimation',    label: 'Stage 4 — Cost Estimation' },
  { key: 'marketing_basics',   label: 'Stage 5 — Marketing Basics' },
];

const emptyStep    = (stage) => ({ stage, title: '', content: '', est_cost_min: '', est_cost_max: '' });
const defaultSteps = ()      => ROADMAP_STAGES.map((s) => emptyStep(s.key));

/* ─── helpers ─────────────────────────────────────────────────────────────── */
function timeAgo(dateStr) {
  if (!dateStr) return '';
  const d    = new Date(dateStr);
  const diff = Math.floor((Date.now() - d) / 1000);
  if (diff < 60)    return `${diff}s ago`;
  if (diff < 3600)  return `${Math.floor(diff / 60)}m ago`;
  if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`;
  return d.toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: '2-digit' });
}

function useDebounce(val, ms = 300) {
  const [dv, setDv] = useState(val);
  useEffect(() => {
    const t = setTimeout(() => setDv(val), ms);
    return () => clearTimeout(t);
  }, [val, ms]);
  return dv;
}

/* ─── UI primitives — match the site's warm paper design system ───────────── */

function StatCard({ label, value, icon }) {
  return (
    <div className="stat-card">
      <div className="flex items-center gap-2 mb-1">
        {icon && <span className="text-lg">{icon}</span>}
        <p className="text-xs font-semibold text-ink-soft uppercase tracking-wider">{label}</p>
      </div>
      <p className="stat-value text-teal">{value}</p>
    </div>
  );
}

function StatusBadge({ status }) {
  const styles = {
    active:    'bg-teal/20 text-teal-deep',
    published: 'bg-teal/20 text-teal-deep',
    approved:  'bg-teal/20 text-teal-deep',
    completed: 'bg-teal/20 text-teal-deep',
    accepted:  'bg-teal/10 text-teal-deep',
    pending:   'bg-marigold/20 text-marigold-deep',
    requested: 'bg-marigold/20 text-marigold-deep',
    open:      'bg-marigold/20 text-marigold-deep',
    draft:     'bg-sand text-ink-soft',
    reviewed:  'bg-sand text-ink-soft',
    suspended: 'bg-clay/20 text-clay',
    rejected:  'bg-clay/20 text-clay',
    declined:  'bg-clay/20 text-clay',
    resolved:  'bg-sand text-ink-soft',
  };
  return (
    <span className={`text-xs font-mono px-2 py-0.5 rounded-full ${styles[status] || 'bg-sand text-ink-soft'}`}>
      {status}
    </span>
  );
}

function SearchInput({ value, onChange, placeholder }) {
  return (
    <div className="relative flex-1">
      <svg className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-ink-soft" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
        <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
      </svg>
      <input value={value} onChange={(e) => onChange(e.target.value)} placeholder={placeholder || 'Search…'} className="input pl-10" />
    </div>
  );
}

function FilterPill({ label, active, onClick }) {
  return (
    <button onClick={onClick}
      className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${active ? 'bg-teal text-white shadow-sm' : 'bg-white border border-sand-line text-ink-soft hover:border-teal/40'}`}>
      {label}
    </button>
  );
}

/* ─── User detail side drawer ──────────────────────────────────────────────── */
function UserDetailDrawer({ userId, token, onClose, onStatusChange }) {
  const [data, setData]       = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!userId) return;
    setLoading(true);
    api.get(`/admin/users/${userId}/details`, token)
      .then(setData)
      .catch(() => setData(null))
      .finally(() => setLoading(false));
  }, [userId, token]);

  return (
    <div
      className="fixed inset-0 bg-ink/40 z-50 flex justify-end"
      onClick={onClose}
    >
      <div
        className="w-[460px] max-w-full h-full overflow-y-auto bg-paper border-l border-sand-line p-7 flex flex-col gap-5"
        onClick={e => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between">
          <h2 className="font-display text-xl font-semibold">User Profile</h2>
          <button onClick={onClose} className="text-ink-soft hover:text-ink text-lg transition-colors">✕</button>
        </div>

        {loading ? (
          <p className="text-ink-soft text-sm">Loading profile…</p>
        ) : !data ? (
          <p className="text-clay text-sm">Failed to load profile.</p>
        ) : (
          <>
            {/* Identity card */}
            <div className="border border-sand-line rounded-xl p-4 bg-paper-dim">
              <div className="flex items-start justify-between gap-3">
                <div>
                  {/* Avatar */}
                  {data.user.profile_picture ? (
                    <img src={data.user.profile_picture} alt={data.user.name} className="w-12 h-12 rounded-full object-cover mb-3 border border-sand-line" />
                  ) : (
                    <div className="w-12 h-12 rounded-full bg-teal/20 flex items-center justify-center text-teal-deep font-bold text-lg mb-3 font-mono">
                      {data.user.name?.[0]?.toUpperCase()}
                    </div>
                  )}
                  <p className="font-semibold text-lg">{data.user.name}</p>
                  <p className="text-sm text-ink-soft">{data.user.email}</p>
                  <p className="text-xs font-mono text-ink-soft mt-1">
                    Joined {data.user.created_at
                      ? new Date(data.user.created_at).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })
                      : '—'}
                  </p>
                </div>
                <StatusBadge status={data.user.status} />
              </div>
            </div>

            {/* Personal Details */}
            <div className="border border-sand-line rounded-xl p-4 bg-paper-dim flex flex-col gap-2">
              <p className="text-xs font-mono text-ink-soft uppercase tracking-widest mb-1">Personal Details</p>
              <div className="flex flex-col gap-2 text-xs">
                <div><span className="font-semibold text-ink">Date of Birth:</span> {data.user.dob ? new Date(data.user.dob).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' }) : '—'}</div>
                <div><span className="font-semibold text-ink">Gender:</span> <span className="capitalize">{data.user.gender ? data.user.gender.replace(/_/g, ' ') : '—'}</span></div>
                <div><span className="font-semibold text-ink">Phone:</span> {data.user.phone || '—'}</div>
                <div><span className="font-semibold text-ink">Address:</span> {data.user.address || '—'}</div>
                {(data.user.github_url || data.user.linkedin_url) && (
                  <div className="flex gap-3 mt-1">
                    {data.user.github_url && <a href={data.user.github_url} target="_blank" rel="noreferrer" className="text-teal font-semibold underline">GitHub</a>}
                    {data.user.linkedin_url && <a href={data.user.linkedin_url} target="_blank" rel="noreferrer" className="text-teal font-semibold underline">LinkedIn</a>}
                  </div>
                )}
              </div>
            </div>

            {/* Stats grid */}
            <div className="grid grid-cols-2 gap-3">
              {[
                { label: 'Roadmaps started',    value: data.stats.roadmaps_started,            icon: '🗺️' },
                { label: 'Steps completed',     value: data.stats.steps_completed,             icon: '✅' },
                { label: 'Total steps tracked', value: data.stats.total_steps_tracked,         icon: '📊' },
                { label: 'Sessions requested',  value: data.stats.mentor_sessions_requested,   icon: '🤝' },
              ].map(s => (
                <div key={s.label} className="border border-sand-line rounded-xl p-3 bg-paper-dim text-center">
                  <p className="text-xl mb-1">{s.icon}</p>
                  <p className="font-mono text-2xl font-semibold text-teal-deep">{s.value}</p>
                  <p className="text-xs text-ink-soft mt-1">{s.label}</p>
                </div>
              ))}
            </div>

            {/* Skills */}
            {data.user.skills?.length > 0 && (
              <div>
                <p className="text-xs font-mono text-ink-soft uppercase tracking-widest mb-2">Skills</p>
                <div className="flex flex-wrap gap-2">
                  {data.user.skills.map((s, i) => (
                    <span key={i} className="text-xs px-3 py-1 rounded-full border border-teal/30 bg-teal/10 text-teal-deep font-medium">
                      {s.skill?.name || s.skill} · {s.proficiency}
                    </span>
                  ))}
                </div>
              </div>
            )}

            {/* Interests */}
            {data.user.interests?.length > 0 && (
              <div>
                <p className="text-xs font-mono text-ink-soft uppercase tracking-widest mb-2">Interests</p>
                <div className="flex flex-wrap gap-2">
                  {data.user.interests.map((interest, i) => (
                    <span key={i} className="text-xs px-3 py-1 rounded-full border border-marigold/30 bg-marigold/10 text-marigold-deep font-medium">
                      {interest.name || interest}
                    </span>
                  ))}
                </div>
              </div>
            )}

            {/* Progress breakdown */}
            {data.progress_breakdown?.length > 0 && (
              <div>
                <p className="text-xs font-mono text-ink-soft uppercase tracking-widest mb-3">Roadmap Progress</p>
                <div className="flex flex-col gap-3">
                  {data.progress_breakdown.map((pb, i) => {
                    const pct = pb.total > 0 ? Math.round((pb.completed / pb.total) * 100) : 0;
                    return (
                      <div key={i} className="border border-sand-line rounded-xl p-3 bg-paper-dim">
                        <div className="flex justify-between mb-2">
                          <p className="text-sm font-medium truncate">{pb.idea_title}</p>
                          <p className="text-xs font-mono text-ink-soft shrink-0 ml-2">{pb.completed}/{pb.total}</p>
                        </div>
                        <div className="w-full h-1.5 rounded-full bg-sand overflow-hidden">
                          <div
                            className="h-full bg-teal rounded-full transition-all"
                            style={{ width: `${pct}%` }}
                          />
                        </div>
                        <p className="text-xs font-mono text-ink-soft mt-1">{pct}% complete</p>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {/* Actions */}
            <div className="flex gap-2 pt-2 border-t border-sand-line">
              {data.user.status !== 'suspended' ? (
                <button
                  onClick={() => { onStatusChange(data.user.id, 'suspended'); onClose(); }}
                  className="text-sm border border-clay text-clay px-4 py-1.5 rounded-full hover:bg-clay hover:text-paper transition-colors"
                >
                  Suspend user
                </button>
              ) : (
                <button
                  onClick={() => { onStatusChange(data.user.id, 'active'); onClose(); }}
                  className="text-sm border border-teal text-teal px-4 py-1.5 rounded-full hover:bg-teal hover:text-paper transition-colors"
                >
                  Reactivate user
                </button>
              )}
            </div>
          </>
        )}
      </div>
    </div>
  );
}

/* ─── Mentor detail side drawer ────────────────────────────────────────────── */
function MentorDetailDrawer({ mentorId, token, onClose, onStatusChange }) {
  const [data, setData]       = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!mentorId) return;
    setLoading(true);
    api.get(`/admin/mentors/${mentorId}/details`, token)
      .then(setData)
      .catch(() => setData(null))
      .finally(() => setLoading(false));
  }, [mentorId, token]);

  return (
    <div
      className="fixed inset-0 bg-ink/40 z-50 flex justify-end"
      onClick={onClose}
    >
      <div
        className="w-[480px] max-w-full h-full overflow-y-auto bg-paper border-l border-sand-line p-7 flex flex-col gap-5"
        onClick={e => e.stopPropagation()}
      >
        <div className="flex items-center justify-between">
          <h2 className="font-display text-xl font-semibold">Mentor Profile</h2>
          <button onClick={onClose} className="text-ink-soft hover:text-ink text-lg transition-colors">✕</button>
        </div>

        {loading ? (
          <p className="text-ink-soft text-sm">Loading mentor data…</p>
        ) : !data ? (
          <p className="text-clay text-sm">Failed to load mentor profile.</p>
        ) : (
          <>
            {/* Identity */}
            <div className="border border-sand-line rounded-xl p-4 bg-paper-dim">
              <div className="flex items-start justify-between gap-3 mb-3">
                <div>
                  {data.mentor.profile_picture ? (
                    <img src={data.mentor.profile_picture} alt={data.mentor.name} className="w-12 h-12 rounded-full object-cover mb-3 border border-sand-line" />
                  ) : (
                    <div className="w-12 h-12 rounded-full bg-marigold/20 flex items-center justify-center text-marigold-deep font-bold text-lg mb-3 font-mono">
                      {data.mentor.name?.[0]?.toUpperCase()}
                    </div>
                  )}
                  <p className="font-semibold text-lg">{data.mentor.name}</p>
                  <p className="text-sm text-ink-soft">{data.mentor.email}</p>
                </div>
                <StatusBadge status={data.mentor.status} />
              </div>
              <div className="flex flex-wrap gap-2">
                {data.mentor.expertise && (
                  <span className="text-xs px-3 py-1 rounded-full border border-teal/30 bg-teal/10 text-teal-deep font-medium">
                    🎯 {data.mentor.expertise}
                  </span>
                )}
                {data.mentor.experience_years && (
                  <span className="text-xs px-3 py-1 rounded-full border border-sand-line bg-sand text-ink-soft font-mono">
                    {data.mentor.experience_years} yrs exp
                  </span>
                )}
              </div>
              {data.mentor.bio && (
                <p className="text-sm text-ink-soft mt-3 leading-relaxed">{data.mentor.bio}</p>
              )}
            </div>

            {/* Personal Details */}
            <div className="border border-sand-line rounded-xl p-4 bg-paper-dim flex flex-col gap-2">
              <p className="text-xs font-mono text-ink-soft uppercase tracking-widest mb-1">Personal Details</p>
              <div className="flex flex-col gap-2 text-xs">
                <div><span className="font-semibold text-ink">Date of Birth:</span> {data.mentor.dob ? new Date(data.mentor.dob).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' }) : '—'}</div>
                <div><span className="font-semibold text-ink">Gender:</span> <span className="capitalize">{data.mentor.gender ? data.mentor.gender.replace(/_/g, ' ') : '—'}</span></div>
                <div><span className="font-semibold text-ink">Phone:</span> {data.mentor.phone || '—'}</div>
                <div><span className="font-semibold text-ink">Address:</span> {data.mentor.address || '—'}</div>
                {(data.mentor.github_url || data.mentor.linkedin_url) && (
                  <div className="flex gap-3 mt-1">
                    {data.mentor.github_url && <a href={data.mentor.github_url} target="_blank" rel="noreferrer" className="text-teal font-semibold underline">GitHub</a>}
                    {data.mentor.linkedin_url && <a href={data.mentor.linkedin_url} target="_blank" rel="noreferrer" className="text-teal font-semibold underline">LinkedIn</a>}
                  </div>
                )}
              </div>
            </div>

            {/* Session breakdown */}
            <div>
              <p className="text-xs font-mono text-ink-soft uppercase tracking-widest mb-3">Session Breakdown</p>
              <div className="grid grid-cols-2 gap-3">
                {[
                  { label: 'Requested', value: data.session_breakdown.requested, cls: 'text-marigold-deep' },
                  { label: 'Accepted',  value: data.session_breakdown.accepted,  cls: 'text-teal-deep' },
                  { label: 'Completed', value: data.session_breakdown.completed, cls: 'text-teal-deep' },
                  { label: 'Declined',  value: data.session_breakdown.declined,  cls: 'text-clay' },
                ].map(s => (
                  <div key={s.label} className="border border-sand-line rounded-xl p-3 bg-paper-dim text-center">
                    <p className={`font-mono text-2xl font-semibold ${s.cls}`}>{s.value}</p>
                    <p className="text-xs text-ink-soft mt-1">{s.label}</p>
                  </div>
                ))}
              </div>
            </div>

            {/* Resources submitted */}
            <div className="border border-sand-line rounded-xl p-4 bg-paper-dim flex items-center gap-4">
              <span className="text-2xl">📚</span>
              <div>
                <p className="font-mono text-2xl font-semibold text-teal-deep">{data.resources_submitted}</p>
                <p className="text-xs text-ink-soft">Learning resources submitted</p>
              </div>
            </div>

            {/* Recent sessions */}
            {data.recent_sessions?.length > 0 && (
              <div>
                <p className="text-xs font-mono text-ink-soft uppercase tracking-widest mb-3">Recent Sessions</p>
                <div className="flex flex-col gap-2">
                  {data.recent_sessions.slice(0, 8).map((s, i) => (
                    <div key={i} className="border border-sand-line rounded-xl p-3 bg-paper-dim flex items-center justify-between gap-3">
                      <div className="overflow-hidden">
                        <p className="text-sm font-medium truncate">{s.mentee_name}</p>
                        <p className="text-xs text-ink-soft truncate">{s.topic || 'General session'}</p>
                      </div>
                      <div className="flex flex-col items-end gap-1 shrink-0">
                        <StatusBadge status={s.status} />
                        <p className="text-xs font-mono text-ink-soft">{timeAgo(s.created_at)}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Actions */}
            <div className="flex gap-2 pt-2 border-t border-sand-line">
              {data.mentor.status !== 'active' && (
                <button
                  onClick={() => { onStatusChange(data.mentor.id, 'active'); onClose(); }}
                  className="text-sm border border-teal text-teal px-4 py-1.5 rounded-full hover:bg-teal hover:text-paper transition-colors"
                >
                  Verify mentor
                </button>
              )}
              {data.mentor.status !== 'suspended' && (
                <button
                  onClick={() => { onStatusChange(data.mentor.id, 'suspended'); onClose(); }}
                  className="text-sm border border-clay text-clay px-4 py-1.5 rounded-full hover:bg-clay hover:text-paper transition-colors"
                >
                  Suspend
                </button>
              )}
            </div>
          </>
        )}
      </div>
    </div>
  );
}

/* ─── Activity Feed ────────────────────────────────────────────────────────── */
function ActivityFeed({ token }) {
  const [events, setEvents]   = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.get('/admin/activity', token)
      .then(r => setEvents(r.events || []))
      .catch(() => setEvents([]))
      .finally(() => setLoading(false));
  }, [token]);

  if (loading) return <p className="text-ink-soft text-sm">Loading activity…</p>;
  if (!events.length) return <p className="text-ink-soft text-sm">No recent activity.</p>;

  return (
    <div className="flex flex-col gap-2">
      {events.map((ev, i) => (
        <div key={i} className="flex items-start gap-3 p-3 border border-sand-line rounded-xl bg-paper-dim">
          <span className="text-lg shrink-0 mt-0.5">{ev.icon}</span>
          <div className="flex-1 overflow-hidden">
            <p className="text-sm text-ink leading-snug">{ev.label}</p>
            {ev.status && <StatusBadge status={ev.status} />}
          </div>
          <p className="text-xs font-mono text-ink-soft shrink-0 mt-0.5">{timeAgo(ev.time)}</p>
        </div>
      ))}
    </div>
  );
}

/* ─── Main AdminPanel ────────────────────────────────────────────────────────── */
export default function AdminPanel() {
  const { token } = useAuth();
  const [tab, setTab]         = useState('Overview');
  const [stats, setStats]     = useState(null);
  const [users, setUsers]     = useState([]);
  const [mentors, setMentors] = useState([]);
  const [ideas, setIdeas]     = useState([]);
  const [resources, setResources] = useState([]);
  const [feedback, setFeedback]   = useState([]);
  const [loading, setLoading]     = useState(true);
  const [error, setError]         = useState('');

  const [availableSkills, setAvailableSkills] = useState([]);

  // Detail drawers
  const [selectedUser,   setSelectedUser]   = useState(null);
  const [selectedMentor, setSelectedMentor] = useState(null);

  // Search / filter
  const [userSearch,   setUserSearch]   = useState('');
  const [userStatus,   setUserStatus]   = useState('');
  const [mentorSearch, setMentorSearch] = useState('');
  const [mentorStatus, setMentorStatus] = useState('');

  const dUserSearch   = useDebounce(userSearch);
  const dMentorSearch = useDebounce(mentorSearch);

  // Idea form
  const [showCreateForm, setShowCreateForm]   = useState(false);
  const [formTitle,      setFormTitle]        = useState('');
  const [formSummary,    setFormSummary]      = useState('');
  const [formCategory,   setFormCategory]     = useState('');
  const [formLowInvestment, setFormLowInvestment] = useState(true);
  const [formSkillIds,   setFormSkillIds]     = useState([]);
  const [formSteps,      setFormSteps]        = useState(defaultSteps());
  const [formSubmitting, setFormSubmitting]   = useState(false);
  const [formError,      setFormError]        = useState('');
  const [formSuccess,    setFormSuccess]      = useState('');

  const refresh = useCallback(async () => {
    setLoading(true); setError('');
    try {
      const [s, i, r, f, sk] = await Promise.all([
        api.get('/admin/stats', token),
        api.get('/admin/business-ideas', token),
        api.get('/admin/resources/pending', token),
        api.get('/admin/feedback', token),
        api.get('/users/skills'),
      ]);
      setStats(s); setIdeas(i.ideas); setResources(r.resources); setFeedback(f.feedback); setAvailableSkills(sk.skills);
    } catch (err) {
      setError(err.message || 'Could not load admin panel.');
    } finally { setLoading(false); }
  }, [token]);

  const fetchUsers = useCallback(async () => {
    try {
      const params = new URLSearchParams({ role: 'user' });
      if (dUserSearch) params.set('search', dUserSearch);
      if (userStatus)  params.set('status', userStatus);
      const u = await api.get(`/admin/users?${params}`, token);
      setUsers(u.users);
    } catch {}
  }, [token, dUserSearch, userStatus]);

  const fetchMentors = useCallback(async () => {
    try {
      const params = new URLSearchParams({ role: 'mentor' });
      if (dMentorSearch) params.set('search', dMentorSearch);
      if (mentorStatus)  params.set('status', mentorStatus);
      const m = await api.get(`/admin/users?${params}`, token);
      setMentors(m.users);
    } catch {}
  }, [token, dMentorSearch, mentorStatus]);

  useEffect(() => { refresh(); },                          [refresh]);
  useEffect(() => { if (tab === 'Users')   fetchUsers();   }, [tab, fetchUsers]);
  useEffect(() => { if (tab === 'Mentors') fetchMentors(); }, [tab, fetchMentors]);

  const updateUserStatus  = async (id, status) => { await api.put(`/admin/users/${id}/status`, { status }, token); refresh(); fetchUsers(); fetchMentors(); };
  const setIdeaStatus     = async (id, status) => { await api.put(`/admin/business-ideas/${id}/status`, { status }, token); refresh(); };
  const setResourceStatus = async (id, status) => { await api.put(`/admin/resources/${id}/status`, { status }, token); refresh(); };
  const setFeedbackStatus = async (id, status) => { await api.put(`/admin/feedback/${id}/status`, { status }, token); refresh(); };

  const toggleSkill = (id) => setFormSkillIds(p => p.includes(id) ? p.filter(s => s !== id) : [...p, id]);
  const updateStep  = (i, field, val) => setFormSteps(p => p.map((s, idx) => idx === i ? { ...s, [field]: val } : s));
  const resetForm   = () => { setFormTitle(''); setFormSummary(''); setFormCategory(''); setFormLowInvestment(true); setFormSkillIds([]); setFormSteps(defaultSteps()); setFormError(''); setFormSuccess(''); };

  const handleCreateIdea = async (e) => {
    e.preventDefault(); setFormError(''); setFormSuccess('');
    if (!formTitle.trim()) { setFormError('Title is required.'); return; }
    setFormSubmitting(true);
    try {
      const { id: ideaId } = await api.post('/admin/business-ideas', {
        title: formTitle.trim(), summary: formSummary.trim() || null,
        category: formCategory.trim() || null, low_investment: formLowInvestment, skill_ids: formSkillIds,
      }, token);
      const filledSteps = formSteps.filter(s => s.title.trim() && s.content.trim());
      if (filledSteps.length > 0) {
        await api.post(`/admin/business-ideas/${ideaId}/roadmap`, {
          title: `${formTitle.trim()} — Roadmap`,
          steps: filledSteps.map(s => ({ stage: s.stage, title: s.title.trim(), content: s.content.trim(),
            est_cost_min: s.est_cost_min !== '' ? Number(s.est_cost_min) : null,
            est_cost_max: s.est_cost_max !== '' ? Number(s.est_cost_max) : null })),
        }, token);
      }
      setFormSuccess(`"${formTitle.trim()}" created. You can publish it from the list.`);
      resetForm(); setShowCreateForm(false); await refresh();
    } catch (err) {
      setFormError(err.message || 'Something went wrong.');
    } finally { setFormSubmitting(false); }
  };

  const inputCls = 'input';
  const labelCls = 'label text-xs uppercase tracking-wider text-ink-soft';

  return (
    <div className="page-wrap page-section">
      {selectedUser   && <UserDetailDrawer   userId={selectedUser}   token={token} onClose={() => setSelectedUser(null)}   onStatusChange={updateUserStatus} />}
      {selectedMentor && <MentorDetailDrawer mentorId={selectedMentor} token={token} onClose={() => setSelectedMentor(null)} onStatusChange={updateUserStatus} />}

      <div className="mb-8">
        <p className="section-label mb-2">Administration</p>
        <h1 className="page-title">Admin Console</h1>
        <p className="page-subtitle">Manage users, mentors, content, and monitor platform activity.</p>
      </div>

      <div className="flex gap-2 mb-10 border-b border-sand-line pb-4 overflow-x-auto">
        {TABS.map(t => (
          <button key={t} onClick={() => setTab(t)}
            className={`px-4 py-2 rounded-xl text-sm font-semibold transition-all shrink-0 ${
              tab === t ? 'bg-teal text-white shadow-sm' : 'text-ink-soft hover:bg-sand/50 hover:text-ink'
            }`}>
            {t}
          </button>
        ))}
      </div>

      {loading ? <Spinner label="Loading admin data…" /> : error ? <ErrorBanner message={error} onRetry={refresh} /> : (
        <>
          {/* ── Overview ── */}
          {tab === 'Overview' && stats && (
            <div className="flex flex-col gap-8">
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                <StatCard label="Registered users"      value={stats.totalUsers}     icon="👤" />
                <StatCard label="Active mentors"        value={stats.totalMentors}   icon="🎓" />
                <StatCard label="Pending mentors"       value={stats.pendingMentors} icon="⏳" />
                <StatCard label="Published ideas"       value={stats.publishedIdeas} icon="💡" />
                <StatCard label="Steps completed"       value={stats.completedSteps} icon="✅" />
                <StatCard label="Mentor sessions"       value={stats.totalSessions}  icon="🤝" />
                <StatCard label="Open feedback"         value={stats.openFeedback}   icon="💬" />
              </div>

              <div>
                <h2 className="section-heading text-lg mb-4">Live activity feed</h2>
                <ActivityFeed token={token} />
              </div>
            </div>
          )}

          {/* ── Users ── */}
          {tab === 'Users' && (
            <div>
              {/* Controls */}
              <div className="flex flex-wrap gap-3 mb-5 items-center">
                <SearchInput value={userSearch} onChange={setUserSearch} placeholder="Search by name or email…" />
                <div className="flex gap-2">
                  {['', 'active', 'suspended'].map(s => (
                    <FilterPill key={s} label={s || 'All'} active={userStatus === s} onClick={() => setUserStatus(s)} />
                  ))}
                </div>
              </div>
              {users.length === 0 && <p className="text-ink-soft text-sm">No users found.</p>}
              <div className="grid gap-2">
                {users.map(u => (
                  <div key={u.id} className="border border-sand-line rounded-xl p-4 bg-paper-dim flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                    <div className="flex items-center gap-3 min-w-0">
                      {/* Avatar */}
                      <div className="w-9 h-9 rounded-full bg-teal/20 flex items-center justify-center text-teal-deep font-bold font-mono shrink-0">
                        {u.name?.[0]?.toUpperCase()}
                      </div>
                      <div className="overflow-hidden">
                        <p className="font-medium truncate">{u.name}</p>
                        <p className="text-xs text-ink-soft truncate">{u.email}</p>
                        <p className="text-xs font-mono text-ink-soft mt-0.5">
                          Joined {u.created_at ? new Date(u.created_at).toLocaleDateString('en-IN', { day:'numeric', month:'short', year:'2-digit' }) : '—'}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2 shrink-0 flex-wrap">
                      <StatusBadge status={u.status} />
                      <button onClick={() => setSelectedUser(u.id)}
                        className="text-xs border border-teal text-teal px-3 py-1 rounded-full hover:bg-teal hover:text-paper transition-colors">
                        View profile
                      </button>
                      {u.status !== 'suspended'
                        ? <button onClick={() => updateUserStatus(u.id, 'suspended')} className="text-xs border border-clay text-clay px-3 py-1 rounded-full hover:bg-clay hover:text-paper transition-colors">Suspend</button>
                        : <button onClick={() => updateUserStatus(u.id, 'active')}    className="text-xs border border-teal text-teal px-3 py-1 rounded-full hover:bg-teal hover:text-paper transition-colors">Reactivate</button>}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* ── Mentors ── */}
          {tab === 'Mentors' && (
            <div>
              <div className="flex flex-wrap gap-3 mb-5 items-center">
                <SearchInput value={mentorSearch} onChange={setMentorSearch} placeholder="Search by name or expertise…" />
                <div className="flex gap-2">
                  {['', 'active', 'pending', 'suspended'].map(s => (
                    <FilterPill key={s} label={s || 'All'} active={mentorStatus === s} onClick={() => setMentorStatus(s)} />
                  ))}
                </div>
              </div>
              {mentors.length === 0 && <p className="text-ink-soft text-sm">No mentors found.</p>}
              <div className="grid gap-2">
                {mentors.map(m => (
                  <div key={m.id} className="border border-sand-line rounded-xl p-4 bg-paper-dim flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                    <div className="flex items-center gap-3 min-w-0">
                      <div className="w-9 h-9 rounded-full bg-marigold/20 flex items-center justify-center text-marigold-deep font-bold font-mono shrink-0">
                        {m.name?.[0]?.toUpperCase()}
                      </div>
                      <div className="overflow-hidden">
                        <p className="font-medium truncate">{m.name}</p>
                        <p className="text-xs text-ink-soft truncate">{m.email}</p>
                        {m.expertise && (
                          <p className="text-xs font-mono text-teal-deep mt-0.5">🎯 {m.expertise}{m.experience_years ? ` · ${m.experience_years} yrs` : ''}</p>
                        )}
                      </div>
                    </div>
                    <div className="flex items-center gap-2 shrink-0 flex-wrap">
                      <StatusBadge status={m.status} />
                      <button onClick={() => setSelectedMentor(m.id)}
                        className="text-xs border border-teal text-teal px-3 py-1 rounded-full hover:bg-teal hover:text-paper transition-colors">
                        View profile
                      </button>
                      {m.status !== 'active'    && <button onClick={() => updateUserStatus(m.id, 'active')}    className="text-xs border border-teal text-teal px-3 py-1 rounded-full hover:bg-teal hover:text-paper transition-colors">Verify</button>}
                      {m.status !== 'suspended' && <button onClick={() => updateUserStatus(m.id, 'suspended')} className="text-xs border border-clay text-clay px-3 py-1 rounded-full hover:bg-clay hover:text-paper transition-colors">Suspend</button>}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* ── Business Ideas ── */}
          {tab === 'Business Ideas' && (
            <div>
              {formSuccess && (
                <div className="mb-4 border border-teal/30 bg-teal/5 rounded-xl px-4 py-3 text-sm text-teal-deep font-medium">{formSuccess}</div>
              )}
              <div className="mb-6">
                <button
                  id="admin-create-idea-btn"
                  onClick={() => { setShowCreateForm(v => !v); setFormError(''); setFormSuccess(''); }}
                  className="px-5 py-2 rounded-full bg-teal text-paper text-sm font-medium hover:bg-teal-deep transition-colors"
                >
                  {showCreateForm ? '✕ Cancel' : '+ New business idea'}
                </button>
              </div>

              {showCreateForm && (
                <form onSubmit={handleCreateIdea} id="admin-create-idea-form"
                  className="mb-8 border border-sand-line rounded-2xl p-6 bg-paper-dim space-y-6">
                  <h2 className="font-display text-xl font-semibold">New business idea</h2>
                  {formError && <p className="text-sm text-clay bg-clay/10 border border-clay/20 px-4 py-2 rounded-lg">{formError}</p>}
                  <div className="grid sm:grid-cols-2 gap-4">
                    <div>
                      <label className={labelCls} htmlFor="form-title">Title *</label>
                      <input id="form-title" required value={formTitle} onChange={e => setFormTitle(e.target.value)}
                        placeholder="e.g. Custom Tailoring Studio" className={inputCls} />
                    </div>
                    <div>
                      <label className={labelCls} htmlFor="form-category">Category</label>
                      <input id="form-category" value={formCategory} onChange={e => setFormCategory(e.target.value)}
                        placeholder="e.g. Craft, Food, Digital" className={inputCls} />
                    </div>
                  </div>
                  <div>
                    <label className={labelCls} htmlFor="form-summary">Summary</label>
                    <textarea id="form-summary" rows={3} value={formSummary} onChange={e => setFormSummary(e.target.value)}
                      placeholder="Brief description…" className={`${inputCls} resize-none`} />
                  </div>
                  <div className="flex items-center gap-3">
                    <input type="checkbox" id="form-low-investment" checked={formLowInvestment}
                      onChange={e => setFormLowInvestment(e.target.checked)} className="w-4 h-4 accent-teal" />
                    <label htmlFor="form-low-investment" className="text-sm font-medium">Low-investment startup</label>
                  </div>
                  <div>
                    <p className={labelCls}>Required skills</p>
                    <div className="flex flex-wrap gap-2">
                      {availableSkills.map(s => (
                        <button type="button" key={s.id} id={`skill-toggle-${s.id}`} onClick={() => toggleSkill(s.id)}
                          className={`text-xs px-3 py-1 rounded-full border transition-colors font-medium ${
                            formSkillIds.includes(s.id)
                              ? 'bg-teal text-paper border-teal'
                              : 'border-sand-line text-ink-soft hover:border-teal hover:text-teal'
                          }`}>{s.name}</button>
                      ))}
                    </div>
                  </div>
                  <div>
                    <p className={labelCls}>Roadmap steps</p>
                    <div className="space-y-4">
                      {ROADMAP_STAGES.map((stage, i) => (
                        <div key={stage.key} className="border border-sand-line rounded-xl p-4 space-y-3 bg-paper">
                          <p className="text-xs font-mono text-teal-deep font-semibold">{stage.label}</p>
                          <div className="grid sm:grid-cols-2 gap-3">
                            <div>
                              <label className={labelCls} htmlFor={`step-title-${i}`}>Step title</label>
                              <input id={`step-title-${i}`} value={formSteps[i].title} onChange={e => updateStep(i, 'title', e.target.value)}
                                placeholder="e.g. Validate local demand" className={inputCls} />
                            </div>
                            <div className="grid grid-cols-2 gap-2">
                              <div>
                                <label className={labelCls}>Min cost (₹)</label>
                                <input type="number" min="0" value={formSteps[i].est_cost_min} onChange={e => updateStep(i, 'est_cost_min', e.target.value)}
                                  placeholder="0" className={inputCls} />
                              </div>
                              <div>
                                <label className={labelCls}>Max cost (₹)</label>
                                <input type="number" min="0" value={formSteps[i].est_cost_max} onChange={e => updateStep(i, 'est_cost_max', e.target.value)}
                                  placeholder="0" className={inputCls} />
                              </div>
                            </div>
                          </div>
                          <textarea rows={3} value={formSteps[i].content} onChange={e => updateStep(i, 'content', e.target.value)}
                            placeholder="Instructions for this stage…" className={`${inputCls} resize-none`} />
                        </div>
                      ))}
                    </div>
                  </div>
                  <div className="flex gap-3 pt-2">
                    <button type="submit" id="admin-create-idea-submit" disabled={formSubmitting}
                      className="px-6 py-2 rounded-full bg-teal text-paper text-sm font-medium hover:bg-teal-deep transition-colors disabled:opacity-50">
                      {formSubmitting ? 'Creating…' : 'Create as draft'}
                    </button>
                    <button type="button" onClick={() => { setShowCreateForm(false); resetForm(); }}
                      className="px-6 py-2 rounded-full border border-sand-line text-sm font-medium text-ink-soft hover:border-ink hover:text-ink transition-colors">
                      Cancel
                    </button>
                  </div>
                </form>
              )}

              <div className="grid gap-2">
                {ideas.length === 0 && <p className="text-ink-soft text-sm">No business ideas yet.</p>}
                {ideas.map(idea => (
                  <div key={idea.id} className="border border-sand-line rounded-xl p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                    <div>
                      <p className="font-medium">{idea.title}</p>
                      <p className="text-xs text-ink-soft font-mono">{idea.category || 'No category'}</p>
                    </div>
                    <div className="flex items-center gap-2 shrink-0">
                      <StatusBadge status={idea.status} />
                      {idea.status === 'draft'
                        ? <button onClick={() => setIdeaStatus(idea.id, 'published')} className="text-sm border border-teal text-teal px-3 py-1 rounded-full hover:bg-teal hover:text-paper transition-colors">Publish</button>
                        : <button onClick={() => setIdeaStatus(idea.id, 'draft')}     className="text-sm border border-ink/20 px-3 py-1 rounded-full hover:border-clay hover:text-clay transition-colors">Unpublish</button>}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* ── Resources ── */}
          {tab === 'Resources' && (
            <div className="grid gap-2">
              {resources.length === 0 && <p className="text-ink-soft text-sm">No resources awaiting approval.</p>}
              {resources.map(r => (
                <div key={r.id} className="border border-sand-line rounded-xl p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                  <div>
                    <p className="font-medium">{r.title} <span className="text-xs font-mono text-ink-soft">({r.type})</span></p>
                    {r.body && <p className="text-sm text-ink-soft mt-1">{r.body}</p>}
                  </div>
                  <div className="flex gap-2 shrink-0">
                    <button onClick={() => setResourceStatus(r.id, 'approved')} className="text-sm border border-teal text-teal px-3 py-1 rounded-full hover:bg-teal hover:text-paper transition-colors">Approve</button>
                    <button onClick={() => setResourceStatus(r.id, 'rejected')} className="text-sm border border-clay text-clay px-3 py-1 rounded-full hover:bg-clay hover:text-paper transition-colors">Reject</button>
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* ── Feedback ── */}
          {tab === 'Feedback' && (
            <div className="grid gap-2">
              {feedback.length === 0 && <p className="text-ink-soft text-sm">No feedback submitted yet.</p>}
              {feedback.map(f => (
                <div key={f.id} className="border border-sand-line rounded-xl p-4 flex items-start justify-between gap-4">
                  <div>
                    <p className="font-medium">{f.subject || 'General feedback'}</p>
                    {f.message && <p className="text-sm text-ink-soft mt-1">{f.message}</p>}
                  </div>
                  <div className="flex items-center gap-2 shrink-0">
                    <StatusBadge status={f.status} />
                    <select value={f.status} onChange={e => setFeedbackStatus(f.id, e.target.value)}
                      className="text-sm border border-sand-line rounded-lg px-2 py-1 bg-white outline-none">
                      <option value="open">Open</option>
                      <option value="reviewed">Reviewed</option>
                      <option value="resolved">Resolved</option>
                    </select>
                  </div>
                </div>
              ))}
            </div>
          )}
        </>
      )}
    </div>
  );
}
