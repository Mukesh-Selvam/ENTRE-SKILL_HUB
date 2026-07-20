import { useEffect, useState, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { api } from '../api/client';
import { Spinner, ErrorBanner } from '../components/UI';

function formatDate(d) {
  if (!d) return '—';
  return new Date(d).toLocaleDateString('en-IN', { day: 'numeric', month: 'long', year: 'numeric' });
}

const ROLE_META = {
  user:   { label: 'Entrepreneur',   cls: 'badge-teal' },
  mentor: { label: 'Mentor',         cls: 'badge-amber' },
  admin:  { label: 'Administrator', cls: 'bg-red-100 text-red-700 badge' },
};

const PROFICIENCY_CLS = {
  beginner: 'badge-amber',
  intermediate: 'badge-teal',
  expert: 'bg-red-100 text-red-700 badge',
};

export default function Profile() {
  const { refreshUser, token } = useAuth();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [isEditing, setIsEditing] = useState(false);
  const [formName, setFormName] = useState('');
  const [formDob, setFormDob] = useState('');
  const [formPhone, setFormPhone] = useState('');
  const [formAddress, setFormAddress] = useState('');
  const [formGender, setFormGender] = useState('');
  const [formProfilePicture, setFormProfilePicture] = useState('');
  const [formGithubUrl, setFormGithubUrl] = useState('');
  const [formLinkedinUrl, setFormLinkedinUrl] = useState('');
  const [formBio, setFormBio] = useState('');
  const [formExpertise, setFormExpertise] = useState('');
  const [formExperienceYears, setFormExperienceYears] = useState('');
  const [saving, setSaving] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState('');
  const [saveError, setSaveError] = useState('');

  const fetchProfile = useCallback(() => {
    if (!token) return;
    setLoading(true);
    api.get('/users/me/full-profile', token)
      .then((d) => {
        setData(d);
        setFormName(d.user.name || '');
        setFormDob(d.user.dob ? d.user.dob.slice(0, 10) : '');
        setFormPhone(d.user.phone || '');
        setFormAddress(d.user.address || '');
        setFormGender(d.user.gender || '');
        setFormProfilePicture(d.user.profile_picture || '');
        setFormGithubUrl(d.user.github_url || '');
        setFormLinkedinUrl(d.user.linkedin_url || '');
        setFormBio(d.user.bio || '');
        setFormExpertise(d.user.expertise || '');
        setFormExperienceYears(d.user.experience_years != null ? d.user.experience_years : '');
      })
      .catch((e) => setError(e.message || 'Could not load profile.'))
      .finally(() => setLoading(false));
  }, [token]);

  useEffect(() => { fetchProfile(); }, [fetchProfile]);

  const handleSaveDetails = async (e) => {
    e.preventDefault();
    setSaving(true);
    setSaveSuccess('');
    setSaveError('');
    try {
      await api.put('/users/me/personal-details', {
        name: formName.trim() || undefined,
        dob: formDob ? new Date(formDob).toISOString() : null,
        phone: formPhone.trim() || null,
        address: formAddress.trim() || null,
        gender: formGender || null,
        profile_picture: formProfilePicture.trim() || null,
        github_url: formGithubUrl.trim() || null,
        linkedin_url: formLinkedinUrl.trim() || null,
        bio: formBio.trim() || null,
        expertise: formExpertise.trim() || null,
        experience_years: formExperienceYears !== '' ? Number(formExperienceYears) : null,
      }, token);
      setSaveSuccess('Profile updated successfully.');
      setIsEditing(false);
      fetchProfile();
      refreshUser();
    } catch (err) {
      setSaveError(err.message || 'Failed to save.');
    } finally {
      setSaving(false);
    }
  };

  if (loading) return <div className="page-wrap page-section"><Spinner label="Loading profile…" /></div>;
  if (error || !data) return <div className="page-wrap page-section"><ErrorBanner message={error || 'Profile not found.'} /></div>;

  const { user, stats, progress_breakdown, achievements } = data;
  const role = ROLE_META[user.role] || ROLE_META.user;

  return (
    <div className="page-wrap page-section">
      {saveSuccess && (
        <div className="mb-6 rounded-xl bg-teal/10 border border-teal/20 px-4 py-3 text-teal text-sm font-medium">{saveSuccess}</div>
      )}

      {/* Hero */}
      <div className="card overflow-hidden mb-8">
        <div className="h-32 bg-gradient-to-r from-teal-deep via-teal to-emerald-500" />
        <div className="px-6 pb-6 -mt-12 relative">
          <div className="flex flex-wrap items-end justify-between gap-4">
            <div className="flex items-end gap-4">
              {user.profile_picture ? (
                <img src={user.profile_picture} alt={user.name} className="w-24 h-24 rounded-2xl object-cover border-4 border-white shadow-lg" />
              ) : (
                <div className="w-24 h-24 rounded-2xl bg-gradient-to-br from-teal to-teal-deep flex items-center justify-center text-white font-display text-3xl font-bold border-4 border-white shadow-lg">
                  {user.name?.[0]?.toUpperCase()}
                </div>
              )}
              <div className="pb-1">
                <div className="flex items-center gap-2 mb-1">
                  <h1 className="font-display text-2xl font-bold text-ink">{user.name}</h1>
                  <span className={role.cls}>{role.label}</span>
                </div>
                <p className="text-sm text-ink-soft">{user.email}</p>
                {user.expertise && (
                  <p className="text-sm text-teal font-semibold mt-1">
                    {user.expertise}{user.experience_years ? ` · ${user.experience_years} yrs` : ''}
                  </p>
                )}
              </div>
            </div>
            <button onClick={() => setIsEditing(!isEditing)} className="btn-secondary text-sm">
              {isEditing ? 'Cancel' : 'Edit profile'}
            </button>
          </div>
          {user.bio && <p className="text-sm text-ink-soft mt-4 max-w-2xl leading-relaxed">{user.bio}</p>}
          <p className="text-xs text-ink-soft mt-3">Member since {formatDate(user.created_at)}</p>
        </div>
      </div>

      {isEditing && (
        <form onSubmit={handleSaveDetails} className="card card-body mb-8 space-y-4">
          <h2 className="section-heading text-lg">Edit profile</h2>
          {saveError && <p className="text-clay text-sm">{saveError}</p>}
          <div className="grid sm:grid-cols-2 gap-4">
            <div><label className="label">Display name</label><input className="input" value={formName} onChange={(e) => setFormName(e.target.value)} required /></div>
            <div><label className="label">Profile picture URL</label><input className="input" placeholder="https://…" value={formProfilePicture} onChange={(e) => setFormProfilePicture(e.target.value)} /></div>
            <div><label className="label">Date of birth</label><input type="date" className="input" value={formDob} onChange={(e) => setFormDob(e.target.value)} /></div>
            <div><label className="label">Phone</label><input className="input" value={formPhone} onChange={(e) => setFormPhone(e.target.value)} /></div>
            <div><label className="label">Gender</label>
              <select className="input" value={formGender} onChange={(e) => setFormGender(e.target.value)}>
                <option value="">Select</option>
                <option value="male">Male</option><option value="female">Female</option>
                <option value="other">Other</option><option value="prefer_not_to_say">Prefer not to say</option>
              </select>
            </div>
            <div><label className="label">Years of experience</label><input type="number" min="0" className="input" value={formExperienceYears} onChange={(e) => setFormExperienceYears(e.target.value)} /></div>
          </div>
          <div><label className="label">Address</label><input className="input" value={formAddress} onChange={(e) => setFormAddress(e.target.value)} /></div>
          <div className="grid sm:grid-cols-2 gap-4">
            <div><label className="label">GitHub</label><input className="input" value={formGithubUrl} onChange={(e) => setFormGithubUrl(e.target.value)} /></div>
            <div><label className="label">LinkedIn</label><input className="input" value={formLinkedinUrl} onChange={(e) => setFormLinkedinUrl(e.target.value)} /></div>
          </div>
          <div><label className="label">Expertise</label><input className="input" value={formExpertise} onChange={(e) => setFormExpertise(e.target.value)} /></div>
          <div><label className="label">Bio</label><textarea rows={3} className="input resize-none" value={formBio} onChange={(e) => setFormBio(e.target.value)} /></div>
          <div className="flex gap-3">
            <button type="submit" disabled={saving} className="btn-primary">{saving ? 'Saving…' : 'Save changes'}</button>
            <button type="button" onClick={() => setIsEditing(false)} className="btn-secondary">Cancel</button>
          </div>
        </form>
      )}

      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        <div className="stat-card"><span className="stat-value">{stats.roadmaps_started}</span><span className="stat-label">Roadmaps</span></div>
        <div className="stat-card"><span className="stat-value">{stats.steps_completed}</span><span className="stat-label">Steps done</span></div>
        <div className="stat-card"><span className="stat-value">{stats.bookmarks}</span><span className="stat-label">Saved ideas</span></div>
        <div className="stat-card">
          <span className="stat-value">{user.role === 'mentor' ? stats.sessions?.completed || 0 : stats.sessions?.requested || 0}</span>
          <span className="stat-label">{user.role === 'mentor' ? 'Sessions done' : 'Sessions requested'}</span>
        </div>
      </div>

      <div className="grid lg:grid-cols-2 gap-6">
        <div className="space-y-6">
          <section className="card card-body">
            <h2 className="section-heading text-base mb-4">Personal details</h2>
            <dl className="space-y-3 text-sm">
              {[['Date of birth', user.dob ? formatDate(user.dob) : '—'], ['Gender', user.gender?.replace(/_/g, ' ') || '—'], ['Phone', user.phone || '—'], ['Address', user.address || '—']].map(([k, v]) => (
                <div key={k} className="flex justify-between gap-4 border-b border-sand-line pb-2 last:border-0">
                  <dt className="text-ink-soft font-medium">{k}</dt>
                  <dd className="text-ink text-right capitalize">{v}</dd>
                </div>
              ))}
            </dl>
            {(user.github_url || user.linkedin_url) && (
              <div className="flex gap-4 mt-4 pt-4 border-t border-sand-line">
                {user.github_url && <a href={user.github_url} target="_blank" rel="noreferrer" className="text-sm text-teal font-semibold hover:underline">GitHub</a>}
                {user.linkedin_url && <a href={user.linkedin_url} target="_blank" rel="noreferrer" className="text-sm text-teal font-semibold hover:underline">LinkedIn</a>}
              </div>
            )}
          </section>

          {user.skills?.length > 0 && (
            <section className="card card-body">
              <h2 className="section-heading text-base mb-4">Skills</h2>
              <div className="flex flex-wrap gap-2">
                {user.skills.map((s) => (
                  <span key={s.id} className={`${PROFICIENCY_CLS[s.proficiency] || 'badge-slate'} text-xs`}>
                    {s.name} · {s.proficiency}
                  </span>
                ))}
              </div>
            </section>
          )}

          {user.interests?.length > 0 && (
            <section className="card card-body">
              <h2 className="section-heading text-base mb-4">Interests</h2>
              <div className="flex flex-wrap gap-2">
                {user.interests.map((i) => <span key={i.id} className="badge-amber">{i.name}</span>)}
              </div>
            </section>
          )}
        </div>

        <div className="space-y-6">
          <section className="card card-body">
            <h2 className="section-heading text-base mb-4">Achievements</h2>
            {achievements.length === 0 ? (
              <p className="text-sm text-ink-soft">Complete roadmap steps to unlock achievements.</p>
            ) : (
              <div className="space-y-3">
                {achievements.map((a) => (
                  <div key={a.id} className="flex items-center gap-3 p-3 rounded-xl bg-sand/30">
                    <span className="text-2xl">{a.icon}</span>
                    <div>
                      <p className="font-semibold text-sm">{a.label}</p>
                      <p className="text-xs text-ink-soft">{a.desc}</p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </section>

          {progress_breakdown?.length > 0 && (
            <section className="card card-body">
              <h2 className="section-heading text-base mb-4">Roadmap progress</h2>
              <div className="space-y-4">
                {progress_breakdown.map((pb) => (
                  <div key={pb.id}>
                    <div className="flex justify-between text-sm mb-1.5">
                      <span className="font-semibold truncate">{pb.idea_title}</span>
                      <span className="text-ink-soft shrink-0 ml-2">{pb.completed}/{pb.total}</span>
                    </div>
                    <div className="progress-track"><div className="progress-fill" style={{ width: `${pb.total ? (pb.completed / pb.total) * 100 : 0}%` }} /></div>
                  </div>
                ))}
              </div>
            </section>
          )}

          <section className="card card-body">
            <h2 className="section-heading text-base mb-4">Quick links</h2>
            <div className="flex flex-col gap-2">
              {[
                { to: '/dashboard', label: 'Dashboard' },
                { to: '/ideas', label: 'Browse ideas' },
                { to: '/mentors', label: 'Find mentors', show: user.role === 'user' },
                { to: '/mentor-panel', label: 'Mentor panel', show: user.role === 'mentor' },
                { to: '/admin', label: 'Admin console', show: user.role === 'admin' },
                { to: '/onboarding', label: 'Update skills' },
              ].filter((l) => l.show !== false).map((l) => (
                <Link key={l.to} to={l.to} className="text-sm font-semibold text-teal hover:underline py-1">{l.label} →</Link>
              ))}
            </div>
          </section>
        </div>
      </div>
    </div>
  );
}
