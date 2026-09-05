import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import {
  GraduationCap, BookOpen, Award, Gamepad2, Users, ShieldCheck,
  ArrowRight, Sparkles, TrendingUp, Trophy, CheckCircle2, Building2,
} from 'lucide-react';
import { api } from '../api/client.js';

export default function Home() {
  const [stats, setStats] = useState({ courses: 0, members: 0, games: 0 });
  const [announcements, setAnnouncements] = useState([]);

  useEffect(() => {
    Promise.all([api.listCourses(), api.listAnnouncements(), api.listGames()])
      .then(([c, a, g]) => {
        setStats({ courses: c.courses.length, members: 6, games: g.games.length });
        setAnnouncements(a.announcements.slice(0, 3));
      })
      .catch(() => {});
  }, []);

  const features = [
    {
      icon: BookOpen,
      title: 'Learn',
      desc: 'Access business and entrepreneurship courses with structured lessons, designed for the Ethiopian academic context.',
      color: 'bg-brand-50 text-brand-700',
    },
    {
      icon: Award,
      title: 'Earn Certificates',
      desc: 'Pass exams and receive unforgeable certificates with unique IDs, verifiable by anyone through a public link.',
      color: 'bg-gold-500/20 text-gold-600',
    },
    {
      icon: Gamepad2,
      title: 'Compete',
      desc: 'Join business simulations, case challenges, and pitch nights that put your skills to the test in real time.',
      color: 'bg-emerald-50 text-emerald-700',
    },
    {
      icon: Users,
      title: 'Connect',
      desc: 'Meet our board, network with fellow members across the Education and Science Shared campuses.',
      color: 'bg-purple-50 text-purple-700',
    },
  ];

  return (
    <div>
      {/* Hero */}
      <section className="relative overflow-hidden bg-gradient-to-br from-brand-950 via-brand-900 to-brand-800 text-white">
        <div className="absolute inset-0 opacity-10" style={{
          backgroundImage: 'radial-gradient(circle at 20% 30%, white 1px, transparent 1px), radial-gradient(circle at 80% 70%, white 1px, transparent 1px)',
          backgroundSize: '60px 60px',
        }} />
        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20 md:py-28">
          <div className="grid lg:grid-cols-2 gap-12 items-center">
            <div>
              <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-white/10 text-sm mb-5 backdrop-blur">
                <Sparkles className="w-4 h-4 text-gold-400" />
                <span>Science Shared Campus • Addis Ababa</span>
              </div>
              <h1 className="text-4xl md:text-5xl lg:text-6xl font-extrabold leading-tight tracking-tight">
                Build the business skills that <span className="text-gold-400">move Ethiopia forward.</span>
              </h1>
              <p className="mt-6 text-lg text-slate-300 max-w-xl leading-relaxed">
                The Business Club at Kotebe University of Education is a student-led community for future
                entrepreneurs. Learn from structured courses, compete in business simulations, and earn
                verifiable certificates — all in one platform.
              </p>
              <div className="mt-8 flex flex-wrap gap-3">
                <Link to="/signup" className="btn-gold text-base px-6 py-3">
                  Become a Member <ArrowRight className="w-5 h-5" />
                </Link>
                <Link to="/courses" className="btn bg-white/10 text-white border border-white/20 hover:bg-white/20 text-base px-6 py-3">
                  Explore Courses
                </Link>
              </div>
              <div className="mt-10 flex gap-8">
                <div>
                  <div className="text-3xl font-bold text-gold-400">{stats.courses}+</div>
                  <div className="text-sm text-slate-400">Courses</div>
                </div>
                <div>
                  <div className="text-3xl font-bold text-gold-400">{stats.members}</div>
                  <div className="text-sm text-slate-400">Board Members</div>
                </div>
                <div>
                  <div className="text-3xl font-bold text-gold-400">{stats.games}</div>
                  <div className="text-sm text-slate-400">Active Games</div>
                </div>
              </div>
            </div>

            <div className="hidden lg:block">
              <div className="relative">
                <div className="card bg-white/95 backdrop-blur p-6 rounded-2xl rotate-2">
                  <div className="flex items-center gap-3 mb-4">
                    <div className="w-12 h-12 rounded-xl bg-brand-700 text-white flex items-center justify-center">
                      <Trophy className="w-6 h-6" />
                    </div>
                    <div>
                      <div className="font-bold text-brand-950">Campus Startup Simulation</div>
                      <div className="text-xs text-slate-500">League now open for registration</div>
                    </div>
                  </div>
                  <div className="space-y-3">
                    <div className="flex items-center gap-2 text-sm text-slate-600">
                      <CheckCircle2 className="w-4 h-4 text-emerald-600" /> Weekly team decisions
                    </div>
                    <div className="flex items-center gap-2 text-sm text-slate-600">
                      <CheckCircle2 className="w-4 h-4 text-emerald-600" /> Virtual capital of 50,000 ETB
                    </div>
                    <div className="flex items-center gap-2 text-sm text-slate-600">
                      <CheckCircle2 className="w-4 h-4 text-emerald-600" /> Ranked by cumulative profit
                    </div>
                  </div>
                  <Link to="/games" className="btn-primary w-full mt-5">Join a Game</Link>
                </div>
                <div className="card bg-white/95 backdrop-blur p-5 rounded-2xl -rotate-3 -mt-6 ml-12 relative">
                  <div className="flex items-center gap-3">
                    <ShieldCheck className="w-8 h-8 text-gold-600" />
                    <div>
                      <div className="font-bold text-brand-950 text-sm">Verifiable Certificates</div>
                      <div className="text-xs text-slate-500">Unique ID + public verification</div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Features */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        <div className="text-center mb-12">
          <h2 className="section-title">Everything you need to grow as an entrepreneur</h2>
          <p className="text-slate-500 mt-3 max-w-2xl mx-auto">
            One platform for learning, competing, and proving your skills with credentials anyone can trust.
          </p>
        </div>
        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {features.map((f) => (
            <div key={f.title} className="card p-6 hover:shadow-lg transition group">
              <div className={`w-12 h-12 rounded-xl flex items-center justify-center mb-4 ${f.color} group-hover:scale-110 transition`}>
                <f.icon className="w-6 h-6" />
              </div>
              <h3 className="font-bold text-brand-950 text-lg">{f.title}</h3>
              <p className="text-sm text-slate-500 mt-2 leading-relaxed">{f.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Membership tiers */}
      <section className="bg-white border-y border-slate-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
          <div className="text-center mb-12">
            <h2 className="section-title">Membership tiers</h2>
            <p className="text-slate-500 mt-3">Every member starts as Pending and is verified by the board.</p>
          </div>
          <div className="grid md:grid-cols-3 gap-6 max-w-4xl mx-auto">
            {[
              { name: 'Pending', desc: 'Newly registered. Awaiting board verification.', icon: ShieldCheck, color: 'amber' },
              { name: 'Active', desc: 'Verified member with full access to courses and games.', icon: TrendingUp, color: 'emerald' },
              { name: 'Verified', desc: 'Recognised contributor eligible for premium programs and honors.', icon: Award, color: 'brand' },
            ].map((t) => (
              <div key={t.name} className="card p-6 text-center">
                <div className={`w-14 h-14 rounded-2xl mx-auto mb-4 flex items-center justify-center bg-${t.color}-100 text-${t.color}-700`}>
                  <t.icon className="w-7 h-7" />
                </div>
                <h3 className="font-bold text-brand-950">{t.name}</h3>
                <p className="text-sm text-slate-500 mt-2">{t.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Announcements */}
      {announcements.length > 0 && (
        <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
          <div className="flex items-end justify-between mb-8">
            <div>
              <h2 className="section-title">Latest announcements</h2>
              <p className="text-slate-500 mt-2">What's happening at the club right now.</p>
            </div>
            <Building2 className="w-10 h-10 text-brand-200" />
          </div>
          <div className="grid md:grid-cols-3 gap-6">
            {announcements.map((a) => (
              <div key={a.id} className="card p-6">
                {a.pinned && <span className="badge-verified mb-3 inline-flex">Pinned</span>}
                <h3 className="font-bold text-brand-950">{a.title}</h3>
                <p className="text-sm text-slate-500 mt-2 line-clamp-4">{a.content}</p>
                <span className="text-xs text-slate-400 mt-3 block">{new Date(a.createdAt).toLocaleDateString()}</span>
              </div>
            ))}
          </div>
        </section>
      )}

      {/* CTA */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pb-16">
        <div className="rounded-2xl bg-gradient-to-r from-brand-800 to-brand-950 p-10 md:p-14 text-center text-white relative overflow-hidden">
          <GraduationCap className="w-16 h-16 text-gold-400/30 absolute -top-2 -right-2" />
          <h2 className="text-3xl md:text-4xl font-extrabold">Ready to start your journey?</h2>
          <p className="text-slate-300 mt-4 max-w-xl mx-auto">
            Join the Business Club today, enroll in your first course, and take the first step toward building something real.
          </p>
          <Link to="/signup" className="btn-gold text-base px-7 py-3 mt-7 inline-flex">
            Sign up free <ArrowRight className="w-5 h-5" />
          </Link>
        </div>
      </section>
    </div>
  );
}
