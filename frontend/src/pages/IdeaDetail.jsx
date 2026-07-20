import { useEffect, useState, useCallback, useRef } from 'react';
import { useParams, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { api } from '../api/client';
import SignInPrompt from '../components/SignInPrompt';
import { loginPath } from '../utils/authRedirect';
import { Spinner, ErrorBanner, EmptyState } from '../components/UI';
import { renderMarkdown } from '../utils/format';

const STAGE_LABELS = {
  idea_validation: 'Idea validation',
  skills_tools: 'Skills & tools',
  legal_registration: 'Legal & registration',
  cost_estimation: 'Cost estimation',
  marketing_basics: 'Marketing basics',
};

function money(n) {
  if (n === null || n === undefined) return null;
  return `₹${n.toLocaleString('en-IN')}`;
}

export default function IdeaDetail() {
  const { id } = useParams();
  const { user, token } = useAuth();
  const [idea, setIdea] = useState(null);
  const [roadmap, setRoadmap] = useState(null);
  const [progressSteps, setProgressSteps] = useState({});
  const [bookmarked, setBookmarked] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [bookmarkBusy, setBookmarkBusy] = useState(false);

  // AI Chat Panel States
  const [chatOpen, setChatOpen] = useState(false);
  const [messages, setMessages] = useState([
    { role: 'assistant', text: 'Hello! I am your Startup Advisor. Ask me about naming, marketing, or budgeting for this business plan!' }
  ]);
  const [inputVal, setInputVal] = useState('');
  const [chatBusy, setChatBusy] = useState(false);
  const chatEndRef = useRef(null);

  // Interactive Capital Calculator States
  const [customCosts, setCustomCosts] = useState({}); // step_id -> override cost value
  const [customItems, setCustomItems] = useState([]); // [{ id, label, cost }]
  const [newItemLabel, setNewItemLabel] = useState('');
  const [newItemCost, setNewItemCost] = useState('');
  const [budgetSaved, setBudgetSaved] = useState(false);
  const saveTimer = useRef(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const data = await api.get(`/business-ideas/${id}`);
      setIdea(data.idea);
      setRoadmap(data.roadmap);

      if (user && data.roadmap) {
        const [p, bookmarks] = await Promise.all([
          api.get(`/progress/roadmap/${data.roadmap.id}`, token),
          api.get('/users/me/bookmarks', token),
        ]);
        const map = {};
        p.steps.forEach((s) => { map[s.id] = !!s.completed; });
        setProgressSteps(map);
        setBookmarked(bookmarks.bookmarks.some((b) => b.id === id));

        const defaultCustomCosts = {};
        data.roadmap.steps.forEach((step) => {
          defaultCustomCosts[step.id] = step.est_cost_max || step.est_cost_min || 0;
        });

        try {
          const budgetRes = await api.get(`/users/me/budget/${id}`, token);
          if (budgetRes.budget) {
            setCustomCosts({ ...defaultCustomCosts, ...budgetRes.budget.step_costs });
            setCustomItems(budgetRes.budget.custom_items || []);
          } else {
            setCustomCosts(defaultCustomCosts);
          }
        } catch {
          setCustomCosts(defaultCustomCosts);
        }
      }
    } catch (err) {
      setError(err.message || 'Could not load this idea. Please try again.');
    } finally {
      setLoading(false);
    }
  }, [id, user, token]);

  useEffect(() => { load(); }, [load]);

  // Auto-save budget when costs change
  useEffect(() => {
    if (!user || !token || !roadmap || Object.keys(customCosts).length === 0) return;

    if (saveTimer.current) clearTimeout(saveTimer.current);
    saveTimer.current = setTimeout(async () => {
      try {
        await api.put(`/users/me/budget/${id}`, {
          step_costs: customCosts,
          custom_items: customItems,
        }, token);
        setBudgetSaved(true);
        setTimeout(() => setBudgetSaved(false), 2000);
      } catch { /* silent — user can retry by editing */ }
    }, 800);

    return () => { if (saveTimer.current) clearTimeout(saveTimer.current); };
  }, [customCosts, customItems, user, token, id, roadmap]);

  useEffect(() => {
    if (chatEndRef.current) {
      chatEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages]);

  const toggleStep = async (stepId) => {
    const next = !progressSteps[stepId];
    setProgressSteps((prev) => ({ ...prev, [stepId]: next }));
    try {
      await api.put(`/progress/step/${stepId}`, { completed: next }, token);
    } catch {
      setProgressSteps((prev) => ({ ...prev, [stepId]: !next }));
    }
  };

  const toggleBookmark = async () => {
    if (bookmarkBusy) return;
    setBookmarkBusy(true);
    const prev = bookmarked;
    setBookmarked(!bookmarked);
    try {
      if (prev) {
        await api.del(`/users/me/bookmarks/${id}`, token);
      } else {
        await api.post(`/users/me/bookmarks/${id}`, {}, token);
      }
    } catch {
      setBookmarked(prev);
    } finally {
      setBookmarkBusy(false);
    }
  };

  // AI Chat submission
  const handleSendChat = async (textToSend) => {
    const text = textToSend || inputVal;
    if (!text.trim() || chatBusy) return;

    if (!textToSend) setInputVal('');

    setMessages((prev) => [...prev, { role: 'user', text }]);
    setChatBusy(true);

    try {
      const res = await api.post(`/business-ideas/${id}/ai-coach`, { message: text.trim() }, token);
      setMessages((prev) => [...prev, { role: 'assistant', text: res.response }]);
    } catch (err) {
      setMessages((prev) => [...prev, { role: 'assistant', text: err.message || 'Apologies, my server coach is temporarily offline. Please try again.' }]);
    } finally {
      setChatBusy(false);
    }
  };

  // Budget management
  const handleCostOverride = (stepId, value) => {
    setCustomCosts((prev) => ({ ...prev, [stepId]: Number(value) || 0 }));
  };

  const handleAddBudgetLine = (e) => {
    e.preventDefault();
    if (!newItemLabel.trim() || newItemCost === '') return;
    const item = {
      id: Date.now().toString(),
      label: newItemLabel.trim(),
      cost: Number(newItemCost) || 0,
    };
    setCustomItems((prev) => [...prev, item]);
    setNewItemLabel('');
    setNewItemCost('');
  };

  const handleRemoveBudgetLine = (itemId) => {
    setCustomItems((prev) => prev.filter((i) => i.id !== itemId));
  };

  if (loading) return <Spinner label="Loading roadmap…" />;

  if (error) return (
    <div className="page-wrap page-section"><ErrorBanner message={error} onRetry={load} /></div>
  );

  if (!idea) return (
    <div className="page-wrap page-section text-center py-20">
      <h1 className="page-title text-2xl mb-2">Idea not found</h1>
      <p className="text-ink-soft text-sm mb-6">This idea may have been unpublished.</p>
      <Link to="/ideas" className="btn-primary text-sm">Back to ideas</Link>
    </div>
  );

  const completedCount = roadmap ? roadmap.steps.filter((s) => progressSteps[s.id]).length : 0;
  const totalSteps = roadmap?.steps.length || 0;

  // Compute live budget sum
  const baseStepsCost = Object.values(customCosts).reduce((a, b) => a + b, 0);
  const customLinesCost = customItems.reduce((a, b) => a + b.cost, 0);
  const totalCapitalRequired = baseStepsCost + customLinesCost;
  const guestEstimate = roadmap
    ? roadmap.steps.reduce((sum, s) => sum + (s.est_cost_max || s.est_cost_min || 0), 0)
    : 0;

  return (
    <div className="page-wrap page-section">
      <div className="grid lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 space-y-8">
          {/* Header */}
          <div className="card card-body">
            <div className="flex flex-wrap items-start justify-between gap-4">
              <div>
                <span className="badge-teal mb-3">{idea.category}</span>
                <h1 className="page-title text-2xl sm:text-3xl">{idea.title}</h1>
                {idea.status === 'draft' && (
                  <p className="badge-amber mt-2">Pending admin review — only you can see this</p>
                )}
                <p className="text-ink-soft mt-3 leading-relaxed max-w-2xl">{idea.summary}</p>
              </div>
              {user ? (
                <button onClick={toggleBookmark} disabled={bookmarkBusy}
                  className={`btn-secondary text-sm shrink-0 ${bookmarked ? '!bg-amber-500 !text-white !border-amber-500' : ''}`}>
                  {bookmarked ? 'Saved' : 'Save idea'}
                </button>
              ) : (
                <Link to={loginPath(`/ideas/${id}`)} className="btn-secondary text-sm shrink-0">
                  Sign in to save
                </Link>
              )}
            </div>
            <div className="flex flex-wrap gap-2 mt-4 pt-4 border-t border-sand-line">
              {idea.skills.map((s) => (
                <span key={s.id} className="badge-teal">{s.name}</span>
              ))}
            </div>
            {user && totalSteps > 0 && (
              <div className="mt-6 flex items-center gap-4">
                <div className="progress-track flex-1"><div className="progress-fill" style={{ width: `${(completedCount / totalSteps) * 100}%` }} /></div>
                <span className="text-sm font-semibold text-ink-soft whitespace-nowrap">{completedCount}/{totalSteps} done</span>
              </div>
            )}
            {!user && totalSteps > 0 && (
              <p className="mt-4 text-xs text-ink-soft bg-sand/40 rounded-lg px-3 py-2">
                Preview mode — <Link to={loginPath(`/ideas/${id}`)} className="text-teal font-semibold hover:underline">sign in</Link> to track progress on this roadmap.
              </p>
            )}
          </div>

          {/* Roadmap */}
          <section>
            <h2 className="section-heading mb-6">Launch roadmap</h2>
            {roadmap ? (
              <div className="relative space-y-4">
                <div className="absolute left-5 top-3 bottom-3 w-0.5 bg-sand-line" aria-hidden="true" />
                <ol className="space-y-4">
                  {roadmap.steps.map((step) => (
                    <li key={step.id} className="relative pl-14">
                      <div className={`absolute left-0 top-0 w-10 h-10 rounded-xl flex items-center justify-center text-sm font-bold shadow-sm ${
                        progressSteps[step.id] ? 'bg-teal text-white' : 'bg-white border border-sand-line text-ink-soft'
                      }`}>
                        {progressSteps[step.id] ? '✓' : step.step_order}
                      </div>
                      <div className="card card-body">
                        <span className="text-[10px] font-semibold uppercase tracking-wider text-amber-600">{STAGE_LABELS[step.stage]}</span>
                        <h3 className="font-display font-bold text-lg mt-1 mb-2">{step.title}</h3>
                        <p className="text-sm text-ink-soft leading-relaxed">{step.content}</p>
                        {(step.est_cost_min !== null || step.est_cost_max !== null) && (
                          <p className="text-xs text-ink-soft mt-3 font-medium">
                            Est. cost: {money(step.est_cost_min) || '₹0'} – {money(step.est_cost_max)}
                          </p>
                        )}
                        {user && (
                          <label className="flex items-center gap-2.5 mt-4 text-sm font-semibold cursor-pointer select-none text-teal">
                            <input type="checkbox" checked={!!progressSteps[step.id]} onChange={() => toggleStep(step.id)} className="w-4 h-4 rounded accent-teal" />
                            Mark complete
                          </label>
                        )}
                      </div>
                    </li>
                  ))}
                </ol>
              </div>
            ) : (
              <EmptyState title="Roadmap coming soon" body="The admin team is building this roadmap." />
            )}
          </section>
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          {user && roadmap && (
            <div className="card card-body space-y-4 sticky top-24">
              <div className="flex items-start justify-between gap-2 border-b border-sand-line pb-3">
                <div>
                  <h3 className="font-display font-bold">Budget planner</h3>
                  <p className="text-xs text-ink-soft mt-0.5">Customize costs — auto-saved</p>
                </div>
                {budgetSaved && <span className="badge-teal text-[10px]">Saved</span>}
              </div>
              <div className="space-y-2.5">
                {roadmap.steps.map((step) => (
                  <div key={step.id} className="flex items-center justify-between gap-2 text-xs">
                    <span className="truncate flex-1 font-medium text-ink-soft">{step.title}</span>
                    <input type="number" min="0" value={customCosts[step.id] || 0} onChange={(e) => handleCostOverride(step.id, e.target.value)}
                      className="input w-24 py-1.5 text-right text-xs" />
                  </div>
                ))}
                {customItems.map((item) => (
                  <div key={item.id} className="flex items-center justify-between gap-2 text-xs text-teal">
                    <span className="truncate flex-1 font-medium">{item.label}</span>
                    <div className="flex items-center gap-2">
                      <span className="font-semibold">₹{item.cost}</span>
                      <button type="button" onClick={() => handleRemoveBudgetLine(item.id)} className="text-clay hover:font-bold">×</button>
                    </div>
                  </div>
                ))}
              </div>
              <form onSubmit={handleAddBudgetLine} className="grid grid-cols-5 gap-2 pt-2 border-t border-sand-line">
                <input placeholder="Item name" required value={newItemLabel} onChange={(e) => setNewItemLabel(e.target.value)} className="input col-span-3 py-1.5 text-xs" />
                <input type="number" min="0" placeholder="₹" required value={newItemCost} onChange={(e) => setNewItemCost(e.target.value)} className="input col-span-2 py-1.5 text-xs text-right" />
                <button type="submit" className="col-span-5 btn-secondary text-xs py-2">+ Add line item</button>
              </form>
              <div className="flex items-center justify-between pt-3 border-t border-sand-line bg-teal/5 -mx-2 px-4 py-3 rounded-xl">
                <span className="text-xs font-bold uppercase tracking-wider text-ink-soft">Total capital</span>
                <span className="font-display text-xl font-bold text-teal">₹{totalCapitalRequired.toLocaleString('en-IN')}</span>
              </div>
            </div>
          )}

          {user && (
            <div className="card overflow-hidden sticky top-24">
              <button onClick={() => setChatOpen(!chatOpen)} className="w-full bg-gradient-to-r from-teal to-teal-deep text-white px-5 py-4 flex items-center justify-between hover:opacity-95 transition-opacity">
                <div>
                  <span className="font-display font-bold text-sm block">Startup Advisor</span>
                  <span className="text-[10px] opacity-75">Template-based guidance</span>
                </div>
                <span className="text-xs">{chatOpen ? '▲' : '▼'}</span>
              </button>
              {chatOpen && (
                <div className="p-4 space-y-4 bg-sand/20">
                  <div className="overflow-y-auto space-y-3 max-h-56 text-sm" role="log" aria-live="polite">
                    {messages.map((msg, i) => (
                      <div key={i} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                        <div className={`max-w-[90%] rounded-xl px-3 py-2.5 leading-relaxed ${
                          msg.role === 'user' ? 'bg-teal text-white' : 'bg-white border border-sand-line text-ink shadow-sm'
                        }`}>
                          {msg.role === 'assistant' ? renderMarkdown(msg.text) : msg.text}
                        </div>
                      </div>
                    ))}
                    {chatBusy && <div className="text-xs text-ink-soft animate-pulse px-2">Thinking…</div>}
                    <div ref={chatEndRef} />
                  </div>
                  <div className="flex flex-wrap gap-1.5">
                    {['Suggest names', 'Marketing tips', 'Cut costs'].map((chip) => (
                      <button key={chip} type="button" onClick={() => handleSendChat(chip)} disabled={chatBusy}
                        className="text-[10px] bg-white border border-sand-line rounded-lg px-2.5 py-1 font-medium hover:border-teal hover:text-teal transition-colors">
                        {chip}
                      </button>
                    ))}
                  </div>
                  <form onSubmit={(e) => { e.preventDefault(); handleSendChat(); }} className="flex gap-2">
                    <input required disabled={chatBusy} value={inputVal} onChange={(e) => setInputVal(e.target.value)} placeholder="Ask for advice…" className="input flex-1 py-2 text-xs" />
                    <button type="submit" disabled={chatBusy || !inputVal.trim()} className="btn-primary px-4 py-2 text-xs">Send</button>
                  </form>
                </div>
              )}
            </div>
          )}

          {!user && roadmap && (
            <div className="card card-body sticky top-24 space-y-3">
              <h3 className="font-display font-bold">Estimated startup cost</h3>
              <p className="font-display text-2xl font-bold text-teal">₹{guestEstimate.toLocaleString('en-IN')}</p>
              <p className="text-xs text-ink-soft leading-relaxed">
                Sum of roadmap stage estimates. Sign in to customize costs and save your budget plan.
              </p>
              <ul className="text-xs text-ink-soft space-y-1 pt-2 border-t border-sand-line">
                {roadmap.steps.map((step) => (
                  <li key={step.id} className="flex justify-between gap-2">
                    <span className="truncate">{step.title}</span>
                    <span className="shrink-0 font-medium">₹{(step.est_cost_max || step.est_cost_min || 0).toLocaleString('en-IN')}</span>
                  </li>
                ))}
              </ul>
            </div>
          )}

          {!user && (
            <SignInPrompt
              title="Unlock full tools"
              body="Sign in for the interactive budget planner, startup advisor chat, and progress tracking."
              redirectTo={`/ideas/${id}`}
            />
          )}
        </div>
      </div>
    </div>
  );
}
