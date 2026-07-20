import { useState } from 'react';
import { Link } from 'react-router-dom';
import { api } from '../api/client';
import { useAuth } from '../context/AuthContext';
import { useToast } from './Toast';

export default function Footer() {
  const { token } = useAuth();
  const { toast } = useToast();
  const [message, setMessage] = useState('');
  const [busy, setBusy] = useState(false);

  const submit = async (e) => {
    e.preventDefault();
    if (!message.trim() || busy) return;
    setBusy(true);
    try {
      await api.post('/feedback', { message: message.trim() }, token || undefined);
      setMessage('');
      toast('Thanks for your feedback!', 'success');
    } catch (err) {
      toast(err.message || 'Could not send feedback.', 'error');
    } finally {
      setBusy(false);
    }
  };

  return (
    <footer className="mt-auto bg-ink text-white">
      <div className="page-wrap py-14 grid sm:grid-cols-2 lg:grid-cols-4 gap-10">
        <div className="sm:col-span-2">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-10 h-10 rounded-xl bg-teal flex items-center justify-center font-display font-bold text-sm">ES</div>
            <span className="font-display text-xl font-bold">EntreSkill Hub</span>
          </div>
          <p className="text-slate-400 text-sm leading-relaxed max-w-sm">
            Turn practical skills into sustainable micro-businesses with structured roadmaps, mentors, and tools built for first-time founders.
          </p>
        </div>

        <div>
          <h4 className="font-semibold text-sm mb-4 text-slate-300">Platform</h4>
          <ul className="space-y-2 text-sm text-slate-400">
            <li><Link to="/ideas" className="hover:text-teal transition-colors">Business Ideas</Link></li>
            <li><Link to="/mentors" className="hover:text-teal transition-colors">Find Mentors</Link></li>
            <li><Link to="/resources" className="hover:text-teal transition-colors">Learning Resources</Link></li>
          </ul>
        </div>

        <div>
          <h4 className="font-semibold text-sm mb-4 text-slate-300">Feedback</h4>
          <form onSubmit={submit} className="space-y-2">
            <textarea
              placeholder="Tell us how we can improve…"
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              disabled={busy}
              rows={3}
              className="w-full rounded-xl bg-slate-800 border border-slate-700 px-3 py-2 text-sm text-white placeholder:text-slate-500 focus:border-teal focus:ring-1 focus:ring-teal outline-none resize-none disabled:opacity-60"
            />
            <button type="submit" disabled={busy || !message.trim()} className="btn-primary text-xs w-full">
              {busy ? 'Sending…' : 'Send feedback'}
            </button>
          </form>
        </div>
      </div>

      <div className="border-t border-slate-800">
        <div className="page-wrap py-5 flex flex-wrap justify-between gap-2 text-xs text-slate-500">
          <span>© {new Date().getFullYear()} EntreSkill Hub. All rights reserved.</span>
          <span>Built for entrepreneurs who start with skills, not capital.</span>
        </div>
      </div>
    </footer>
  );
}
