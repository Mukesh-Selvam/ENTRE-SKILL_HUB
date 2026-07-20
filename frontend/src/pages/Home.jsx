import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

const steps = [
  { n: '01', title: 'Profile your skills', body: 'Log tailoring, cooking, repair, design — and set your proficiency level for smarter matches.' },
  { n: '02', title: 'Discover matched ideas', body: 'Browse startup concepts ranked by how well they fit what you already know.' },
  { n: '03', title: 'Execute the roadmap', body: 'Five structured stages from validation through marketing — with cost estimates built in.' },
  { n: '04', title: 'Connect with mentors', body: 'Book sessions with verified entrepreneurs who have built businesses like yours.' },
];

const ROADMAP_STEPS = [
  { label: 'Idea validation', done: true },
  { label: 'Skills & tools', done: true },
  { label: 'Legal & registration', done: false },
  { label: 'Cost estimation', done: false },
  { label: 'Marketing basics', done: false },
];

export default function Home() {
  const { user } = useAuth();

  return (
    <div>
      {/* Hero */}
      <section className="hero-gradient mesh-bg relative overflow-hidden">
        <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNjAiIGhlaWdodD0iNjAiIHZpZXdCb3g9IjAgMCA2MCA2MCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48ZyBmaWxsPSJub25lIiBmaWxsLXJ1bGU9ImV2ZW5vZGQiPjxnIGZpbGw9IiNmZmYiIGZpbGwtb3BhY2l0eT0iMC4wMyI+PGNpcmNsZSBjeD0iMzAiIGN5PSIzMCIgcj0iMiIvPjwvZz48L2c+PC9zdmc+')] opacity-50" />
        <div className="page-wrap relative py-20 lg:py-28 grid lg:grid-cols-2 gap-12 lg:gap-16 items-center">
          <div>
            <span className="inline-flex items-center gap-2 rounded-full bg-white/10 border border-white/20 px-4 py-1.5 text-xs font-semibold text-emerald-200 uppercase tracking-wider mb-6">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
              Skill-to-startup platform
            </span>
            <h1 className="font-display text-4xl sm:text-5xl lg:text-6xl font-bold text-white leading-[1.08] tracking-tight">
              You have the skill.
              <span className="block text-emerald-400 mt-1">We build the business.</span>
            </h1>
            <p className="mt-6 text-lg text-slate-300 max-w-lg leading-relaxed">
              EntreSkill Hub gives tailors, bakers, makers, and craftspeople a clear path from skill to sustainable micro-business — with roadmaps, budgets, and mentors.
            </p>
            <div className="mt-10 flex flex-wrap gap-4">
              <Link to="/ideas" className="btn-primary px-8 py-3 text-base shadow-lg shadow-emerald-900/30">
                Explore business ideas
              </Link>
              <Link to={user ? '/dashboard' : '/register'} className="inline-flex items-center justify-center rounded-xl border border-white/25 bg-white/10 px-8 py-3 text-base font-semibold text-white hover:bg-white/20 transition-all">
                {user ? 'Open dashboard' : 'Sign up free'}
              </Link>
            </div>
            <div className="mt-10 flex flex-wrap gap-6 text-sm text-slate-400">
              <span className="flex items-center gap-2"><svg className="w-4 h-4 text-emerald-400" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd"/></svg>Free to start</span>
              <span className="flex items-center gap-2"><svg className="w-4 h-4 text-emerald-400" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd"/></svg>5-stage roadmaps</span>
              <span className="flex items-center gap-2"><svg className="w-4 h-4 text-emerald-400" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd"/></svg>Expert mentors</span>
            </div>
          </div>

          {/* Roadmap preview card */}
          <div className="card shadow-2xl shadow-black/30 overflow-hidden border-0">
            <div className="bg-gradient-to-r from-teal-deep to-teal px-6 py-5 flex items-center justify-between">
              <div>
                <p className="text-[10px] font-semibold uppercase tracking-widest text-emerald-200/70">Live preview</p>
                <p className="font-display font-bold text-white text-lg mt-0.5">Tailoring Studio</p>
              </div>
              <span className="badge bg-white/15 text-white border border-white/20">5 stages</span>
            </div>
            <div className="divide-y divide-sand-line">
              {ROADMAP_STEPS.map((s, i) => (
                <div key={s.label} className="flex items-center gap-4 px-6 py-3.5 hover:bg-sand/30 transition-colors">
                  <div className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold shrink-0 ${s.done ? 'bg-teal text-white' : 'border-2 border-sand text-ink-soft'}`}>
                    {s.done ? '✓' : i + 1}
                  </div>
                  <span className={`text-sm flex-1 ${s.done ? 'text-ink font-medium' : 'text-ink-soft'}`}>{s.label}</span>
                  {s.done && <span className="badge-teal text-[10px]">Done</span>}
                </div>
              ))}
            </div>
            <div className="px-6 py-4 bg-sand/40 flex items-center gap-4">
              <div className="progress-track flex-1"><div className="progress-fill" style={{ width: '40%' }} /></div>
              <span className="text-xs font-semibold text-teal shrink-0">2 / 5 complete</span>
            </div>
          </div>
        </div>
      </section>

      {/* Features grid */}
      <section className="page-section page-wrap">
        <div className="text-center max-w-2xl mx-auto mb-12">
          <p className="section-label mb-3">Everything you need</p>
          <h2 className="section-heading">From skill to startup, in one platform</h2>
        </div>
        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-5">
          {[
            { title: 'Skill-matched ideas', desc: 'Recommendations weighted 80% on your skills, 20% on your interests.', to: '/ideas' },
            { title: 'Launch roadmaps', desc: 'Validation, tools, legal, costs, and marketing — nothing skipped.', to: '/ideas' },
            { title: 'Budget planner', desc: 'Customize startup costs per stage and save your capital plan.', to: '/ideas' },
            { title: 'Verified mentors', desc: 'Request guidance from entrepreneurs reviewed by our admin team.', to: '/mentors' },
          ].map((f) => (
            <Link key={f.title} to={f.to} className="card-hover card-body block">
              <div className="w-10 h-10 rounded-xl bg-teal/10 flex items-center justify-center mb-4">
                <div className="w-2 h-2 rounded-full bg-teal" />
              </div>
              <h3 className="font-display font-bold text-ink mb-2">{f.title}</h3>
              <p className="text-sm text-ink-soft leading-relaxed">{f.desc}</p>
            </Link>
          ))}
        </div>
      </section>

      {/* How it works */}
      <section className="page-section bg-ink text-white">
        <div className="page-wrap">
          <p className="section-label text-emerald-400 mb-3">How it works</p>
          <h2 className="font-display text-3xl font-bold mb-12">Four steps to your first sale</h2>
          <div className="grid md:grid-cols-4 gap-8">
            {steps.map((s) => (
              <div key={s.n} className="relative">
                <span className="font-display text-5xl font-bold text-white/10 absolute -top-2 -left-1">{s.n}</span>
                <div className="relative pt-8">
                  <h3 className="font-display font-bold text-lg mb-2 text-emerald-300">{s.title}</h3>
                  <p className="text-slate-400 text-sm leading-relaxed">{s.body}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Audience + CTA */}
      <section className="page-section page-wrap">
        <div className="grid lg:grid-cols-2 gap-12 items-center">
          <div>
            <p className="section-label mb-3">Who it's for</p>
            <h2 className="section-heading mb-4">Built for founders everyone else overlooks</h2>
            <p className="text-ink-soft leading-relaxed mb-6">
              Women running household crafts, youth with repair skills, rural makers without local mentors — EntreSkill Hub gives you the same structured launch path that business-school grads get for free.
            </p>
            <ul className="space-y-3">
              {['Women entrepreneurs scaling home-based skills', 'Rural makers without local business networks', 'First-time founders who need plain-language guidance'].map((item) => (
                <li key={item} className="flex items-start gap-3 text-sm text-ink-soft">
                  <svg className="w-5 h-5 text-teal shrink-0 mt-0.5" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd"/></svg>
                  {item}
                </li>
              ))}
            </ul>
          </div>
          <div className="card p-8 bg-gradient-to-br from-teal/5 to-teal/10 border-teal/20 text-center">
            <h3 className="font-display text-2xl font-bold text-ink mb-2">Ready to launch?</h3>
            <p className="text-ink-soft text-sm mb-6">Create your free account and get matched to business ideas in under 5 minutes.</p>
            <Link to="/ideas" className="btn-secondary px-8 py-3">
              Browse ideas first
            </Link>
            <Link to={user ? '/dashboard' : '/register'} className="btn-primary px-8 py-3">
              {user ? 'Go to dashboard' : 'Create free account'}
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
}
