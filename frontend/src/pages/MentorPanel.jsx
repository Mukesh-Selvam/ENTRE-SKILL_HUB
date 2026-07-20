import { useEffect, useState, useCallback } from 'react';
import { useAuth } from '../context/AuthContext';
import { api } from '../api/client';
import { useToast } from '../components/Toast';
import { Spinner, ErrorBanner, EmptyState, PageHeader } from '../components/UI';

const STATUS_STYLES = {
  requested: 'badge-amber',
  accepted: 'badge-teal',
  completed: 'badge-slate',
  declined: 'bg-red-100 text-red-700 badge',
};

export default function MentorPanel() {
  const { token } = useAuth();
  const { toast } = useToast();
  const [sessions, setSessions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [resourceForm, setResourceForm] = useState({ title: '', type: 'article', url: '', body: '' });
  const [resourceMsg, setResourceMsg] = useState('');
  const [submittingResource, setSubmittingResource] = useState(false);

  const loadSessions = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const d = await api.get('/mentors/me/sessions', token);
      setSessions(d.sessions);
    } catch (err) {
      setError(err.message || 'Could not load sessions.');
    } finally {
      setLoading(false);
    }
  }, [token]);

  useEffect(() => { loadSessions(); }, [loadSessions]);

  const updateStatus = async (id, status) => {
    try {
      await api.put(`/mentors/me/sessions/${id}`, { status }, token);
      const d = await api.get('/mentors/me/sessions', token);
      setSessions(d.sessions);
      toast('Session updated.', 'success');
    } catch (err) {
      toast(err.message || 'Could not update status.', 'error');
    }
  };

  const submitResource = async (e) => {
    e.preventDefault();
    setResourceMsg('');
    setSubmittingResource(true);
    try {
      const res = await api.post('/resources', resourceForm, token);
      setResourceMsg(res.status === 'approved' ? 'Resource published!' : 'Submitted — awaiting admin approval.');
      setResourceForm({ title: '', type: 'article', url: '', body: '' });
    } catch (err) {
      setResourceMsg(err.message || 'Failed to submit.');
    } finally {
      setSubmittingResource(false);
    }
  };

  return (
    <div className="page-wrap page-section max-w-4xl">
      <PageHeader label="Mentor" title="Mentor panel" subtitle="Manage session requests and share learning resources." />

      <section className="mb-12">
        <h2 className="section-heading text-lg mb-4">Session requests</h2>
        {loading ? (
          <Spinner label="Loading sessions…" />
        ) : error ? (
          <ErrorBanner message={error} onRetry={loadSessions} />
        ) : sessions.length === 0 ? (
          <EmptyState title="No requests yet" body="When mentees request advice, they'll appear here." />
        ) : (
          <div className="space-y-3">
            {sessions.map((s) => (
              <div key={s.id} className="card card-body flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                  <p className="font-semibold">{s.mentee_name} {s.topic && <span className="text-ink-soft font-normal">— {s.topic}</span>}</p>
                  <p className="text-sm text-ink-soft mt-1">{s.message}</p>
                  <span className={`inline-block mt-2 ${STATUS_STYLES[s.status] || 'badge-slate'}`}>{s.status}</span>
                </div>
                <div className="flex gap-2 shrink-0">
                  {s.status === 'requested' && (
                    <>
                      <button onClick={() => updateStatus(s.id, 'accepted')} className="btn-primary text-sm">Accept</button>
                      <button onClick={() => updateStatus(s.id, 'declined')} className="btn-danger text-sm">Decline</button>
                    </>
                  )}
                  {s.status === 'accepted' && (
                    <button onClick={() => updateStatus(s.id, 'completed')} className="btn-secondary text-sm">Mark complete</button>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </section>

      <section className="card card-body max-w-lg">
        <h2 className="section-heading text-lg mb-4">Upload a resource</h2>
        <form onSubmit={submitResource} className="space-y-4">
          <div>
            <label className="label">Title</label>
            <input required value={resourceForm.title} onChange={(e) => setResourceForm({ ...resourceForm, title: e.target.value })} className="input" />
          </div>
          <div>
            <label className="label">Type</label>
            <select value={resourceForm.type} onChange={(e) => setResourceForm({ ...resourceForm, type: e.target.value })} className="input">
              <option value="article">Article</option>
              <option value="video">Video</option>
              <option value="checklist">Checklist</option>
            </select>
          </div>
          <div>
            <label className="label">URL (optional)</label>
            <input value={resourceForm.url} onChange={(e) => setResourceForm({ ...resourceForm, url: e.target.value })} className="input" />
          </div>
          <div>
            <label className="label">Description</label>
            <textarea rows={3} value={resourceForm.body} onChange={(e) => setResourceForm({ ...resourceForm, body: e.target.value })} className="input resize-none" />
          </div>
          <button type="submit" disabled={submittingResource} className="btn-primary">{submittingResource ? 'Submitting…' : 'Submit resource'}</button>
          {resourceMsg && <p className="text-sm font-medium text-teal">{resourceMsg}</p>}
        </form>
      </section>
    </div>
  );
}
