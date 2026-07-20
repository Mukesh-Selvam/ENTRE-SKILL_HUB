import { useEffect, useState, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { api } from '../api/client';
import { Spinner, ErrorBanner, EmptyState, PageHeader, IconUsers } from '../components/UI';
import SignInPrompt from '../components/SignInPrompt';
import { loginPath } from '../utils/authRedirect';

function RequestForm({ mentor, token }) {
  const [topic, setTopic] = useState('');
  const [message, setMessage] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [sent, setSent] = useState(false);

  const submit = async (e) => {
    e.preventDefault();
    if (!message.trim()) { setError('Please describe what you need help with.'); return; }
    setError('');
    setBusy(true);
    try {
      await api.post(`/mentors/${mentor.id}/sessions`, { topic, message }, token);
      setSent(true);
    } catch (err) {
      setError(err.message || 'Could not send request.');
    } finally {
      setBusy(false);
    }
  };

  if (sent) {
    return (
      <div className="mt-4 pt-4 border-t border-sand-line flex items-center gap-2 text-teal text-sm font-semibold">
        <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd"/></svg>
        Request sent — {mentor.name} will follow up soon.
      </div>
    );
  }

  return (
    <form onSubmit={submit} className="mt-4 pt-4 border-t border-sand-line space-y-3">
      <input placeholder="Topic (e.g. Pricing my products)" value={topic} onChange={(e) => setTopic(e.target.value)} className="input" />
      <textarea placeholder="What would you like help with?" required minLength={5} rows={3} value={message} onChange={(e) => setMessage(e.target.value)} className="input resize-none" />
      {error && <p className="text-clay text-xs">{error}</p>}
      <button type="submit" disabled={busy} className="btn-primary text-sm">{busy ? 'Sending…' : 'Send request'}</button>
    </form>
  );
}

export default function Mentors() {
  const { user, token } = useAuth();
  const [mentors, setMentors] = useState([]);
  const [openId, setOpenId] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [search, setSearch] = useState('');

  const load = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const d = await api.get('/mentors');
      setMentors(d.mentors);
    } catch (err) {
      setError(err.message || 'Could not load mentors.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { load(); }, [load]);

  const filtered = mentors.filter((m) => {
    if (!search.trim()) return true;
    const q = search.toLowerCase();
    return m.name?.toLowerCase().includes(q) || m.expertise?.toLowerCase().includes(q) || m.bio?.toLowerCase().includes(q);
  });

  return (
    <div className="page-wrap page-section max-w-4xl">
      <PageHeader
        label="Mentors"
        title="Learn from those who've done it"
        subtitle="Verified entrepreneurs ready to guide you through scaling, pricing, and regulations."
      />

      {loading ? (
        <Spinner label="Loading mentors…" />
      ) : error ? (
        <ErrorBanner message={error} onRetry={load} />
      ) : mentors.length === 0 ? (
        <EmptyState icon={<IconUsers />} title="No mentors yet" body="Our first cohort is being verified. Check back soon." />
      ) : (
        <>
          <input type="search" placeholder="Search by name or expertise…" value={search} onChange={(e) => setSearch(e.target.value)} className="input max-w-md mb-6" />
          {filtered.length === 0 ? (
            <p className="text-ink-soft text-sm card card-body text-center py-10">No mentors match your search.</p>
          ) : (
            <div className="grid gap-4">
              {filtered.map((m) => (
                <div key={m.id} className="card card-body">
                  <div className="flex items-start gap-4">
                    <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-teal to-teal-deep flex items-center justify-center text-white font-bold shrink-0">
                      {m.name?.[0]?.toUpperCase()}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex flex-wrap items-start justify-between gap-3">
                        <div>
                          <h3 className="font-display font-bold text-lg text-ink">{m.name}</h3>
                          <p className="text-sm text-teal font-medium mt-0.5">
                            {m.expertise}{m.experience_years ? ` · ${m.experience_years} yrs exp.` : ''}
                          </p>
                        </div>
                        {user && user.role === 'user' && openId !== m.id && (
                          <button onClick={() => setOpenId(m.id)} className="btn-secondary text-sm shrink-0">Request session</button>
                        )}
                        {!user && (
                          <Link to={loginPath('/mentors')} className="btn-secondary text-sm shrink-0">Sign in to request</Link>
                        )}
                      </div>
                      <p className="text-sm text-ink-soft mt-3 leading-relaxed">{m.bio}</p>
                    </div>
                  </div>
                  {openId === m.id && <RequestForm mentor={m} token={token} />}
                </div>
              ))}
            </div>
          )}
        </>
      )}

      {!user && (
        <div className="mt-8">
          <SignInPrompt
            title="Connect with mentors"
            body="Create a free account to request one-on-one sessions with verified entrepreneurs."
            redirectTo="/mentors"
          />
        </div>
      )}
    </div>
  );
}
