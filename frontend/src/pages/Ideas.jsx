import { useEffect, useState, useCallback } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { api } from '../api/client';
import { ErrorBanner, EmptyState, SkeletonGrid, PageHeader, IconLightbulb } from '../components/UI';
import SignInPrompt from '../components/SignInPrompt';
import { registerPath } from '../utils/authRedirect';

function IdeaCard({ idea }) {
  return (
    <Link to={`/ideas/${idea.id}`} className="card-hover card-body group block h-full">
      <div className="flex items-start justify-between gap-3 mb-3">
        <h3 className="font-display text-lg font-bold text-ink group-hover:text-teal transition-colors leading-snug">
          {idea.title}
        </h3>
        {typeof idea.match_score === 'number' && (
          <span className="badge-amber shrink-0">{idea.match_score}%</span>
        )}
      </div>
      {idea.status === 'draft' && <span className="badge-amber mb-2">Draft</span>}
      <p className="text-sm text-ink-soft line-clamp-3 leading-relaxed">{idea.summary}</p>
      {idea.match_reason && (
        <p className="text-xs text-teal bg-teal/5 border border-teal/10 px-3 py-2 rounded-xl mt-3 font-medium">{idea.match_reason}</p>
      )}
      <div className="flex flex-wrap gap-1.5 mt-4 pt-4 border-t border-sand-line">
        {idea.skills?.map((s) => (
          <span key={s.id} className="badge-teal text-[10px]">{s.name}</span>
        ))}
      </div>
    </Link>
  );
}

const TABS = [
  { id: 'all', label: 'All ideas' },
  { id: 'recommended', label: 'Best for you' },
  { id: 'generator', label: 'Generator' },
];

export default function Ideas() {
  const { user, token } = useAuth();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [ideas, setIdeas] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [activeTab, setActiveTab] = useState(searchParams.get('tab') || (user ? 'recommended' : 'all'));
  const [prompt, setPrompt] = useState('');
  const [generating, setGenerating] = useState(false);
  const [genStep, setGenStep] = useState(0);
  const [genError, setGenError] = useState('');
  const [search, setSearch] = useState('');

  const load = useCallback(async () => {
    if (activeTab === 'generator') return;
    if (activeTab === 'recommended' && !user) {
      setLoading(false);
      return;
    }
    setLoading(true);
    setError('');
    try {
      if (activeTab === 'recommended' && user) {
        const data = await api.get('/business-ideas/recommendations/for-me', token);
        setIdeas(data.recommendations);
      } else {
        const data = await api.get('/business-ideas');
        setIdeas(data.ideas);
      }
    } catch (err) {
      setError(err.message || 'Could not load business ideas.');
    } finally {
      setLoading(false);
    }
  }, [activeTab, user, token]);

  useEffect(() => { load(); }, [load]);

  useEffect(() => {
    const tab = searchParams.get('tab');
    if (tab && TABS.some((t) => t.id === tab)) setActiveTab(tab);
  }, [searchParams]);

  const handleGenerate = async (e) => {
    e.preventDefault();
    if (!user) {
      navigate(registerPath('/ideas?tab=generator'));
      return;
    }
    if (!prompt.trim() || prompt.trim().length < 5) {
      setGenError('Please provide a descriptive prompt (at least 5 characters).');
      return;
    }
    setGenError('');
    setGenerating(true);
    setGenStep(1);
    const timer1 = setTimeout(() => setGenStep(2), 1200);
    const timer2 = setTimeout(() => setGenStep(3), 2400);
    try {
      const res = await api.post('/business-ideas/generate', { prompt: prompt.trim() }, token);
      clearTimeout(timer1);
      clearTimeout(timer2);
      setGenStep(4);
      setTimeout(() => { setGenerating(false); navigate(`/ideas/${res.id}`); }, 1000);
    } catch (err) {
      clearTimeout(timer1);
      clearTimeout(timer2);
      setGenerating(false);
      setGenError(err.message || 'Failed to generate startup plan.');
    }
  };

  const filtered = ideas.filter((idea) => {
    if (!search.trim()) return true;
    const q = search.toLowerCase();
    return idea.title?.toLowerCase().includes(q) || idea.summary?.toLowerCase().includes(q) ||
      idea.category?.toLowerCase().includes(q) || idea.skills?.some((s) => s.name?.toLowerCase().includes(q));
  });

  return (
    <div className="page-wrap page-section">
      <PageHeader
        label="Business Ideas"
        title="Find your next venture"
        subtitle="Browse all ideas for free. Sign in for personalized matches, progress tracking, and the idea generator."
      />

      <div className="flex flex-wrap items-center gap-3 mb-8">
        <div className="flex gap-1 p-1 bg-sand/50 rounded-xl">
          {TABS.map((t) => (
            <button key={t.id} onClick={() => setActiveTab(t.id)}
              className={`px-4 py-2 rounded-lg text-sm font-semibold transition-all ${activeTab === t.id ? 'bg-white text-ink shadow-sm' : 'text-ink-soft hover:text-ink'}`}>
              {t.label}
              {(t.id === 'recommended' || t.id === 'generator') && !user && (
                <span className="ml-1.5 text-[10px] font-semibold uppercase tracking-wide text-ink-soft/70">Account</span>
              )}
            </button>
          ))}
        </div>
        {activeTab === 'all' && (
          <input type="search" placeholder="Search ideas…" value={search} onChange={(e) => setSearch(e.target.value)}
            className="input max-w-xs ml-auto" />
        )}
      </div>

      {activeTab === 'recommended' && !user ? (
        <SignInPrompt
          title="Personalized matches need an account"
          body="Tell us your skills once, and we'll rank every business idea by how well it fits you."
          redirectTo="/ideas?tab=recommended"
        />
      ) : activeTab === 'generator' ? (
        !user ? (
          <div className="max-w-xl mx-auto space-y-6">
            <SignInPrompt
              title="Generate a custom startup plan"
              body="Describe your skills and we'll build a tailored business concept with a full 5-stage roadmap."
              redirectTo="/ideas?tab=generator"
            />
            <div className="card card-body opacity-80 pointer-events-none select-none">
              <label className="label">Preview — describe your skills</label>
              <textarea rows={3} disabled placeholder="e.g. Baking, tailoring, gardening…" className="input resize-none" />
            </div>
          </div>
        ) : (
          <div className="max-w-xl mx-auto card card-body p-8">
            <div className="text-center mb-8">
              <div className="w-14 h-14 rounded-2xl bg-teal/10 flex items-center justify-center mx-auto mb-4 text-teal">
                <IconLightbulb />
              </div>
              <h2 className="font-display text-xl font-bold">Startup Idea Generator</h2>
              <p className="text-sm text-ink-soft mt-2 leading-relaxed">
                Describe your skills. We'll build a business concept and 5-stage roadmap.
              </p>
            </div>
            {generating ? (
              <div className="py-10 text-center space-y-4">
                <svg className="w-10 h-10 animate-spin text-teal mx-auto" viewBox="0 0 24 24" fill="none">
                  <circle className="opacity-20" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="3" />
                  <path className="opacity-80" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                </svg>
                <p className="text-sm text-teal font-semibold">
                  {genStep === 1 && 'Analyzing your profile…'}
                  {genStep === 2 && 'Building roadmap tasks…'}
                  {genStep === 3 && 'Calculating launch costs…'}
                  {genStep === 4 && 'Ready! Redirecting…'}
                </p>
              </div>
            ) : (
              <form onSubmit={handleGenerate} className="space-y-4">
                {genError && <div className="rounded-xl bg-clay/10 border border-clay/20 px-4 py-3 text-clay text-sm">{genError}</div>}
                <div>
                  <label className="label" htmlFor="prompt-input">Describe your skills & interests</label>
                  <textarea id="prompt-input" required rows={4} value={prompt} onChange={(e) => setPrompt(e.target.value)}
                    placeholder="e.g. Baking sourdough bread, tailoring dresses…" className="input resize-none" />
                </div>
                <button type="submit" className="btn-primary w-full py-3">Generate startup plan</button>
              </form>
            )}
          </div>
        )
      ) : loading ? (
        <SkeletonGrid count={6} cols={2} lines={3} />
      ) : error ? (
        <ErrorBanner message={error} onRetry={load} />
      ) : filtered.length === 0 ? (
        <EmptyState
          icon={<IconLightbulb />}
          title={search ? 'No matching ideas' : 'No ideas yet'}
          body={search ? 'Try a different search.' : activeTab === 'recommended' ? 'Complete onboarding to get personalized matches.' : 'No published ideas yet.'}
          action={!search && activeTab === 'recommended' && user ? <Link to="/onboarding" className="btn-primary text-sm">Update profile</Link> : null}
        />
      ) : (
        <div className="grid md:grid-cols-2 gap-5">
          {filtered.map((idea) => <IdeaCard key={idea.id} idea={idea} />)}
        </div>
      )}
    </div>
  );
}
