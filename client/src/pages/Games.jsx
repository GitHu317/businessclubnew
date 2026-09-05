import { useEffect, useState } from 'react';
import {
  Gamepad2, Calendar, Trophy, Users, Clock, CheckCircle2, Lock,
  Megaphone, BookOpen, Target, ArrowRight, Loader2, Sparkles,
} from 'lucide-react';
import { api } from '../api/client.js';
import { useAuth } from '../context/AuthContext.jsx';
import { Spinner, EmptyState } from '../components/Common.jsx';

const statusColor = {
  UPCOMING: 'badge-pending',
  ONGOING: 'badge-active',
  COMPLETED: 'badge bg-slate-200 text-slate-700',
};

const typeIcon = {
  SIMULATION: Gamepad2,
  COMPETITION: Trophy,
  CASE_CHALLENGE: BookOpen,
};

export default function Games() {
  const { user } = useAuth();
  const [games, setGames] = useState([]);
  const [loading, setLoading] = useState(true);
  const [registered, setRegistered] = useState(new Set());
  const [busy, setBusy] = useState(null);

  useEffect(() => {
    api.listGames().then((d) => setGames(d.games)).finally(() => setLoading(false));
    if (user) {
      api.dashboard().then((data) => {
        setRegistered(new Set(data.gameRegistrations.map((g) => g.gameId)));
      }).catch(() => {});
    }
  }, [user]);

  const register = async (g) => {
    if (!user) {
      window.location.href = '/login';
      return;
    }
    setBusy(g.id);
    try {
      await api.registerGame(g.id);
      setRegistered((s) => new Set(s).add(g.id));
    } catch (e) {
      alert(e.message);
    } finally {
      setBusy(null);
    }
  };

  if (loading) return <Spinner label="Loading business games..." />;

  return (
    <div>
      <section className="bg-gradient-to-br from-brand-950 to-brand-800 text-white py-14">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center gap-2 text-gold-400 text-sm mb-3">
            <Gamepad2 className="w-4 h-4" /> Club Activities
          </div>
          <h1 className="text-3xl md:text-4xl font-extrabold">Business Games &amp; Competitions</h1>
          <p className="text-slate-300 mt-3 max-w-2xl">
            Put your skills to the test. Join simulations, case challenges, and pitch nights.
            View schedules, read the rules, and register — all in one place.
          </p>
        </div>
      </section>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
        {games.length === 0 ? (
          <EmptyState icon={Gamepad2} title="No games scheduled" description="Check back soon for new competitions." />
        ) : (
          <div className="grid lg:grid-cols-2 gap-6">
            {games.map((g) => {
              const Icon = typeIcon[g.type] || Target;
              const isRegistered = registered.has(g.id);
              return (
                <div key={g.id} className="card overflow-hidden flex flex-col">
                  {/* Header */}
                  <div className="bg-gradient-to-r from-brand-800 to-brand-950 p-5 text-white">
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex items-center gap-3">
                        <div className="w-11 h-11 rounded-xl bg-white/10 flex items-center justify-center">
                          <Icon className="w-6 h-6 text-gold-400" />
                        </div>
                        <div>
                          <h3 className="font-bold text-lg leading-tight">{g.title}</h3>
                          <p className="text-xs text-slate-300 mt-0.5">{g.type.replace('_', ' ')}</p>
                        </div>
                      </div>
                      <span className={statusColor[g.status] || 'badge-pending'}>{g.status}</span>
                    </div>
                  </div>

                  <div className="p-5 flex-1 flex flex-col">
                    <p className="text-sm text-slate-600 leading-relaxed">{g.description}</p>

                    {/* Schedule */}
                    <div className="mt-4 rounded-lg bg-brand-50/60 border border-brand-100 p-3">
                      <div className="flex items-center gap-2 text-xs font-semibold text-brand-700 uppercase tracking-wide mb-1">
                        <Calendar className="w-3.5 h-3.5" /> Schedule
                      </div>
                      <p className="text-sm text-slate-700">{g.schedule}</p>
                      {g.startDate && (
                        <p className="text-xs text-slate-500 mt-1">
                          {new Date(g.startDate).toLocaleDateString()} — {g.endDate ? new Date(g.endDate).toLocaleDateString() : 'TBD'}
                        </p>
                      )}
                    </div>

                    {/* Announcement */}
                    {g.announcement && (
                      <div className="mt-3 rounded-lg bg-amber-50 border border-amber-200 p-3 flex items-start gap-2">
                        <Megaphone className="w-4 h-4 text-amber-600 flex-shrink-0 mt-0.5" />
                        <p className="text-sm text-amber-800">{g.announcement}</p>
                      </div>
                    )}

                    {/* Rules */}
                    <details className="mt-3 group">
                      <summary className="cursor-pointer text-sm font-semibold text-brand-700 flex items-center gap-1.5 list-none">
                        <BookOpen className="w-4 h-4" /> Simulation rules & scoring
                        <span className="ml-auto text-xs text-slate-400 group-open:hidden">show</span>
                        <span className="ml-auto text-xs text-slate-400 hidden group-open:inline">hide</span>
                      </summary>
                      <div className="mt-2 rounded-lg bg-slate-50 border border-slate-200 p-3 text-sm text-slate-600 whitespace-pre-line">
                        {g.rules}
                      </div>
                    </details>

                    {/* Register */}
                    <div className="mt-auto pt-5">
                      {isRegistered ? (
                        <div className="rounded-lg bg-emerald-50 border border-emerald-200 p-3 flex items-center gap-2 text-emerald-700 text-sm font-medium">
                          <CheckCircle2 className="w-5 h-5" /> You're registered for this game
                        </div>
                      ) : g.registrationOpen ? (
                        <button onClick={() => register(g)} disabled={busy === g.id} className="btn-primary w-full">
                          {busy === g.id ? <Loader2 className="w-4 h-4 animate-spin" /> : <Trophy className="w-4 h-4" />}
                          {busy === g.id ? 'Registering...' : 'Register now'}
                        </button>
                      ) : (
                        <div className="rounded-lg bg-slate-100 border border-slate-200 p-3 flex items-center gap-2 text-slate-500 text-sm font-medium">
                          <Lock className="w-5 h-5" /> Registration closed
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* Info banner */}
        <div className="mt-10 card p-6 bg-gradient-to-r from-brand-50 to-gold-500/5 border-brand-100">
          <div className="flex items-start gap-4">
            <div className="w-12 h-12 rounded-xl bg-gold-500/20 text-gold-600 flex items-center justify-center flex-shrink-0">
              <Sparkles className="w-6 h-6" />
            </div>
            <div>
              <h3 className="font-bold text-brand-950">Why compete?</h3>
              <p className="text-sm text-slate-600 mt-1 max-w-2xl">
                Business games give you hands-on experience making real decisions under pressure — pricing, hiring,
                budgeting, and pitching. Top performers earn recognition from the board and mentorship opportunities
                with local entrepreneurs.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
