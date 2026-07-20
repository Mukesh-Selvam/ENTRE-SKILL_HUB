import { useEffect, useState, useCallback } from 'react';
import { api } from '../api/client';
import { Spinner, ErrorBanner, EmptyState, PageHeader } from '../components/UI';

const TYPE_META = {
  video:     { label: 'Video',     color: 'bg-violet-100 text-violet-700' },
  article:   { label: 'Article',   color: 'bg-blue-100 text-blue-700' },
  checklist: { label: 'Checklist', color: 'bg-emerald-100 text-emerald-700' },
};

export default function Resources() {
  const [resources, setResources] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const load = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const d = await api.get('/resources');
      setResources(d.resources);
    } catch (err) {
      setError(err.message || 'Could not load resources.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { load(); }, [load]);

  return (
    <div className="page-wrap page-section max-w-3xl">
      <PageHeader
        label="Learning"
        title="Resources & guides"
        subtitle="Practical, mentor-curated content to help you launch and grow."
      />

      {loading ? (
        <Spinner label="Loading resources…" />
      ) : error ? (
        <ErrorBanner message={error} onRetry={load} />
      ) : resources.length === 0 ? (
        <EmptyState title="No resources yet" body="Guides and checklists will appear here as mentors contribute content." />
      ) : (
        <div className="grid gap-4">
          {resources.map((r) => {
            const meta = TYPE_META[r.type] || TYPE_META.article;
            return (
              <div key={r.id} className="card-hover card-body flex gap-4">
                <div className={`w-12 h-12 rounded-xl flex items-center justify-center shrink-0 text-xs font-bold uppercase ${meta.color}`}>
                  {r.type?.slice(0, 3)}
                </div>
                <div className="flex-1 min-w-0">
                  <span className={`badge text-[10px] ${meta.color}`}>{meta.label}</span>
                  <h3 className="font-display font-bold text-lg mt-1">{r.title}</h3>
                  {r.body && <p className="text-sm text-ink-soft mt-2 leading-relaxed">{r.body}</p>}
                  {r.url && (
                    <a href={r.url} target="_blank" rel="noreferrer" className="inline-flex items-center gap-1 text-sm text-teal font-semibold mt-3 hover:underline">
                      Open resource
                      <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2"><path strokeLinecap="round" strokeLinejoin="round" d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14"/></svg>
                    </a>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
