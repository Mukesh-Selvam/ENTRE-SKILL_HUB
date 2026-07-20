import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { api } from '../api/client';
import { Spinner, PageHeader } from '../components/UI';

const PROFICIENCY_CYCLE = ['beginner', 'intermediate', 'expert'];
const PROFICIENCY_LABEL = { beginner: 'Beginner', intermediate: 'Intermediate', expert: 'Expert' };

export default function Onboarding() {
  const { token } = useAuth();
  const navigate = useNavigate();
  const [skills, setSkills] = useState([]);
  const [interests, setInterests] = useState([]);
  const [selectedSkills, setSelectedSkills] = useState(new Map());
  const [selectedInterests, setSelectedInterests] = useState(new Set());
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([
      api.get('/users/skills'),
      api.get('/users/interests'),
      token ? api.get('/users/me/profile', token) : Promise.resolve(null),
    ]).then(([s, i, profile]) => {
      setSkills(s.skills);
      setInterests(i.interests);
      if (profile) {
        const skillMap = new Map(profile.skills.map((sk) => [sk.id, sk.proficiency || 'beginner']));
        setSelectedSkills(skillMap);
        setSelectedInterests(new Set(profile.interests.map((int) => int.id)));
      }
    }).finally(() => setLoading(false));
  }, [token]);

  const toggleInterest = (id) => {
    const next = new Set(selectedInterests);
    if (next.has(id)) next.delete(id);
    else next.add(id);
    setSelectedInterests(next);
  };

  const toggleSkill = (id) => {
    const next = new Map(selectedSkills);
    if (next.has(id)) {
      const current = next.get(id);
      const idx = PROFICIENCY_CYCLE.indexOf(current);
      if (idx < PROFICIENCY_CYCLE.length - 1) next.set(id, PROFICIENCY_CYCLE[idx + 1]);
      else next.delete(id);
    } else {
      next.set(id, 'beginner');
    }
    setSelectedSkills(next);
  };

  const handleSubmit = async () => {
    setError('');
    setBusy(true);
    try {
      await api.put('/users/me/profile', {
        skills: [...selectedSkills.entries()].map(([id, proficiency]) => ({ id, proficiency })),
        interest_ids: [...selectedInterests],
      }, token);
      navigate('/dashboard');
    } catch (err) {
      setError(err.message);
    } finally {
      setBusy(false);
    }
  };

  const grouped = skills.reduce((acc, s) => {
    (acc[s.category] ||= []).push(s);
    return acc;
  }, {});

  if (loading) return <Spinner label="Loading skills…" />;

  return (
    <div className="page-wrap page-section max-w-3xl">
      <PageHeader
        label="Profile setup"
        title="What can you already do?"
        subtitle="Select your skills and interests. Tap a skill again to cycle proficiency level."
      />

      <div className="space-y-8">
        {Object.entries(grouped).map(([category, items]) => (
          <div key={category} className="card card-body">
            <h2 className="section-label mb-4">{category}</h2>
            <div className="flex flex-wrap gap-2">
              {items.map((s) => {
                const prof = selectedSkills.get(s.id);
                const selected = !!prof;
                return (
                  <button
                    key={s.id} type="button"
                    onClick={() => toggleSkill(s.id)}
                    className={`px-4 py-2.5 rounded-xl text-sm font-semibold border transition-all ${
                      selected
                        ? 'bg-teal text-white border-teal shadow-sm'
                        : 'border-sand-line text-ink-soft hover:border-teal/50 hover:text-teal bg-white'
                    }`}
                  >
                    {s.name}
                    {selected && <span className="ml-1.5 text-[10px] opacity-80">· {PROFICIENCY_LABEL[prof]}</span>}
                  </button>
                );
              })}
            </div>
          </div>
        ))}

        <div className="card card-body">
          <h2 className="section-label mb-4">What matters to you?</h2>
          <div className="flex flex-wrap gap-2">
            {interests.map((i) => (
              <button
                key={i.id} type="button"
                onClick={() => toggleInterest(i.id)}
                className={`px-4 py-2.5 rounded-xl text-sm font-semibold border transition-all ${
                  selectedInterests.has(i.id)
                    ? 'bg-amber-500 text-white border-amber-500 shadow-sm'
                    : 'border-sand-line text-ink-soft hover:border-amber-400 bg-white'
                }`}
              >
                {i.name}
              </button>
            ))}
          </div>
        </div>
      </div>

      {error && (
        <div className="mt-6 rounded-xl bg-clay/10 border border-clay/20 px-4 py-3 text-clay text-sm" role="alert">{error}</div>
      )}

      <div className="mt-8 flex items-center gap-4">
        <button onClick={handleSubmit} disabled={busy || selectedSkills.size === 0} className="btn-primary px-8 py-3">
          {busy ? 'Saving…' : 'See my matches'}
        </button>
        {selectedSkills.size === 0 && (
          <p className="text-sm text-ink-soft">Pick at least one skill to continue.</p>
        )}
      </div>
    </div>
  );
}
