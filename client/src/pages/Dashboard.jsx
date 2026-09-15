import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import {
  LayoutDashboard, BookOpen, Award, Gamepad2, CheckCircle2,
  Clock, ShieldCheck, ArrowRight, Trophy, Zap, Star, Sparkles, Lock, Flame, Target, Compass
} from 'lucide-react';
import { api } from '../api/client.js';
import { useAuth } from '../context/AuthContext.jsx';
import { Spinner, MembershipBadge } from '../components/Common.jsx';

/* ---- Gamification helpers ---- */
const xpForNextLevel = (level) => level * 100;
const xpForCurrentLevel = (level) => (level - 1) * 100;

function GamificationPanel({ gdata }) {
  if (!gdata) return null;
  const { xp, level, badges = [], collectibles = [], allBadges = [] } = gdata;
  const currentLevelFloor = xpForCurrentLevel(level);
  const nextLevelFloor = xpForNextLevel(level);
  const xpIntoLevel = xp - currentLevelFloor;
  const xpForLevelSpan = nextLevelFloor - currentLevelFloor;
  const pct = Math.min(100, Math.round((xpIntoLevel / xpForLevelSpan) * 100));
  const xpToNext = Math.max(0, nextLevelFloor - xp);

  // Guarantee exactly 8 elite showcase badge slots for a striking trophy cabinet
  const fallbackBadges = [
    { id: 'b1', name: 'First Step', description: 'Complete your first onboarding milestone', xpRequired: 50 },
    { id: 'b2', name: 'Innovator', description: 'Enroll in dynamic club courses', xpRequired: 150 },
    { id: 'b3', name: 'Exam Master', description: 'Ace certification examinations', xpRequired: 300 },
    { id: 'b4', name: 'Networker', description: 'Join live business simulations', xpRequired: 200 },
    { id: 'b5', name: 'Credential Pro', description: 'Earn verifiable club credentials', xpRequired: 500 },
    { id: 'b6', name: 'Strategist', description: 'Master case challenge frameworks', xpRequired: 750 },
    { id: 'b7', name: 'Elite Leader', description: 'Achieve advanced club standing', xpRequired: 1000 },
    { id: 'b8', name: 'Club Legend', description: 'Reach the pinnacle of entrepreneurship', xpRequired: 2000 },
  ];

  const showcaseBadges = (allBadges && allBadges.length > 0 ? allBadges : fallbackBadges).slice(0, 8);
  // Ensure we always have 8 slots by padding with fallbacks if necessary
  while (showcaseBadges.length < 8) {
    showcaseBadges.push(fallbackBadges[showcaseBadges.length]);
  }

  const earnedCount = showcaseBadges.filter((b, idx) => badges.some((ub) => ub.id === b.id) || idx < Math.floor(xp / 250)).length;

  return (
    <div className="card p-7 relative overflow-hidden border border-brand-200/60 shadow-2xl bg-gradient-to-br from-white via-slate-50/80 to-brand-950/[0.04] backdrop-blur-xl">
      {/* Dynamic ambient background glow */}
      <div className="absolute -top-28 -right-28 w-56 h-56 bg-gradient-to-br from-gold-400/20 to-amber-600/10 rounded-full blur-3xl pointer-events-none animate-pulse" />
      <div className="absolute -bottom-28 -left-28 w-56 h-56 bg-gradient-to-tr from-brand-600/10 to-indigo-600/10 rounded-full blur-3xl pointer-events-none" />

      {/* Level + XP header */}
      <div className="flex items-center gap-4 mb-6 relative z-10">
        <div className="relative w-18 h-18 rounded-3xl bg-gradient-to-br from-brand-900 via-brand-950 to-slate-900 text-white flex items-center justify-center shadow-xl shadow-brand-950/30 ring-4 ring-gold-500/20">
          <Zap className="w-8 h-8 text-gold-400 animate-bounce" />
          <span className="absolute -bottom-2 -right-2 bg-gradient-to-r from-amber-400 to-gold-500 text-brand-950 text-xs font-black rounded-full w-7 h-7 flex items-center justify-center border-2 border-white shadow-md">
            {level}
          </span>
        </div>
        <div className="flex-1">
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-black text-brand-950 tracking-tight flex items-center gap-2">
              Level {level} Elite <Sparkles className="w-4 h-4 text-gold-500 fill-gold-400" />
            </h2>
            <span className="text-xs font-black px-3 py-1 rounded-full bg-gradient-to-r from-gold-500/10 to-amber-500/20 text-gold-800 border border-gold-500/30 shadow-xs">
              {xp.toLocaleString()} XP
            </span>
          </div>
          <p className="text-xs text-slate-500 font-medium mt-0.5">Climb the leaderboard & unlock elite status</p>
        </div>
      </div>

      {/* XP progress bar */}
      <div className="mb-7 relative z-10 bg-white/90 backdrop-blur-md p-4.5 rounded-2xl border border-slate-200/80 shadow-sm">
        <div className="flex justify-between text-xs font-bold text-slate-600 mb-2">
          <span className="text-brand-950">Rank {level}</span>
          <span className="text-gold-600">{xpIntoLevel} / {xpForLevelSpan} XP</span>
          <span className="text-slate-400">Rank {level + 1}</span>
        </div>
        <div className="h-3.5 w-full bg-slate-100 rounded-full overflow-hidden p-0.5 border border-slate-200/60 shadow-inner">
          <div 
            className="h-full bg-gradient-to-r from-brand-700 via-amber-500 to-gold-400 rounded-full transition-all duration-1000 ease-out shadow-md" 
            style={{ width: `${pct}%` }} 
          />
        </div>
        <div className="flex justify-between items-center mt-2.5 text-[11px] text-slate-500 font-semibold">
          <span className="flex items-center gap-1 text-slate-400"><Target className="w-3.5 h-3.5 text-brand-600" /> Next milestone</span>
          <span className="text-brand-800 font-bold bg-brand-50 px-2 py-0.5 rounded-md border border-brand-100">{xpToNext} XP to Rank {level + 1}</span>
        </div>
      </div>

      {/* 8 Badges Showcase Cabinet */}
      <div className="mb-6 relative z-10">
        <div className="flex items-center justify-between mb-3.5">
          <h3 className="text-sm font-black text-brand-950 flex items-center gap-2 uppercase tracking-wider">
            <Trophy className="w-4 h-4 text-gold-600" /> Trophy Cabinet 
            <span className="text-xs font-bold text-gold-700 bg-gold-500/10 px-2 py-0.5 rounded-md border border-gold-500/20">({earnedCount}/8 Unlocked)</span>
          </h3>
          <span className="text-[10px] font-black uppercase tracking-widest text-brand-700 bg-brand-50 px-2.5 py-1 rounded-full border border-brand-200/60 shadow-xs">Showcase</span>
        </div>
        <div className="grid grid-cols-4 gap-3">
          {showcaseBadges.map((b, idx) => {
            const earned = badges.some((ub) => ub.id === b.id) || idx < Math.min(earnedCount, 8);
            return (
              <div
                key={b.id || idx}
                title={`${b.name} — ${b.description} (${b.xpRequired || 100} XP)`}
                className={`group relative flex flex-col items-center text-center p-3 rounded-2xl border transition-all duration-300 hover:-translate-y-1 hover:shadow-lg ${
                  earned 
                    ? 'border-gold-500/60 bg-gradient-to-b from-gold-500/15 via-amber-500/5 to-white shadow-md shadow-gold-500/20 ring-1 ring-gold-500/30' 
                    : 'border-slate-200/80 bg-white/60 opacity-60 hover:opacity-100 hover:border-slate-300'
                }`}
              >
                <div className={`w-11 h-11 rounded-2xl flex items-center justify-center mb-2 transition-transform duration-300 group-hover:scale-110 shadow-sm ${
                  earned 
                    ? 'bg-gradient-to-br from-amber-400 via-gold-500 to-amber-600 text-brand-950 shadow-gold-500/40 ring-2 ring-white' 
                    : 'bg-slate-100 text-slate-400 border border-slate-200'
                }`}>
                  {earned ? <Trophy className="w-5 h-5 fill-brand-950/10 drop-shadow-sm" /> : <Lock className="w-4 h-4" />}
                </div>
                <span className="text-[11px] font-bold text-brand-950 truncate w-full tracking-tight">{b.name}</span>
                <span className="text-[9px] font-semibold text-slate-400 truncate w-full mt-0.5">{b.xpRequired || 100} XP</span>
              </div>
            );
          })}
        </div>
      </div>

      {/* Collectibles */}
      <div className="relative z-10 pt-4 border-t border-slate-200/60">
        <h3 className="text-sm font-black text-brand-950 flex items-center gap-2 mb-3 uppercase tracking-wider">
          <Star className="w-4 h-4 text-purple-600 fill-purple-200" /> Rare Collectibles ({collectibles.length})
        </h3>
        {collectibles.length === 0 ? (
          <div className="bg-gradient-to-r from-purple-50/80 to-indigo-50/80 border border-purple-200/80 rounded-2xl p-4 text-center shadow-inner">
            <p className="text-xs text-purple-900 font-semibold">Complete milestone events & challenges to collect rare digital club artifacts.</p>
          </div>
        ) : (
          <div className="flex flex-wrap gap-2.5">
            {collectibles.map((c) => (
              <div key={c.id} title={`${c.name} (${c.rarity}) — ${c.description}`} className="flex items-center gap-2 rounded-xl bg-gradient-to-r from-purple-50 via-indigo-50 to-white border border-purple-200/80 px-3.5 py-2 shadow-xs hover:shadow-md transition">
                <span className="text-base animate-bounce">{c.icon || '🎁'}</span>
                <span className="text-xs font-black text-purple-950">{c.name}</span>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

export default function Dashboard() {
  const { user } = useAuth();
  const [data, setData] = useState(null);
  const [gdata, setGdata] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    Promise.all([
      api.dashboard().catch((e) => { setError(e.message); return null; }),
      api.myGamification().catch(() => null),
    ]).then(([d, g]) => {
      setData(d);
      setGdata(g);
      setLoading(false);
    });
  }, []);

  if (loading) return <Spinner label="Loading your elite dashboard..." />;
  if (error || !data) return <div className="max-w-5xl mx-auto px-4 py-10"><div className="card p-6 text-red-700">{error || 'Could not load dashboard.'}</div></div>;

  const { stats, enrollments, certificates, gameRegistrations } = data;

  const statCards = [
    { label: 'Enrolled courses', value: stats.enrolledCourses, icon: BookOpen, color: 'bg-gradient-to-br from-brand-50 to-brand-100/80 text-brand-700 border-brand-200/80' },
    { label: 'Completed courses', value: stats.completedCourses, icon: CheckCircle2, color: 'bg-gradient-to-br from-emerald-50 to-teal-100/80 text-emerald-700 border-emerald-200/80' },
    { label: 'Verified certificates', value: stats.certificatesEarned, icon: Award, color: 'bg-gradient-to-br from-amber-50 to-gold-100/80 text-gold-700 border-gold-200/80' },
    { label: 'Games joined', value: stats.gamesRegistered, icon: Gamepad2, color: 'bg-gradient-to-br from-purple-50 to-indigo-100/80 text-purple-700 border-purple-200/80' },
  ];

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
      {/* Header Banner */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-6 mb-10 bg-gradient-to-r from-brand-950 via-brand-900 to-slate-900 text-white p-8 md:p-10 rounded-3xl shadow-2xl relative overflow-hidden border border-brand-800">
        <div className="absolute -right-16 -bottom-16 w-80 h-80 bg-gold-500/15 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute top-0 right-1/4 w-60 h-60 bg-brand-600/20 rounded-full blur-3xl pointer-events-none" />
        
        <div className="relative z-10">
          <div className="flex items-center gap-2 text-xs font-black uppercase tracking-widest text-gold-400 mb-2">
            <LayoutDashboard className="w-4 h-4" /> Member Command Center
          </div>
          <h1 className="text-3xl md:text-5xl font-black tracking-tight text-white">Welcome back, {user.fullName.split(' ')[0]}! 🚀</h1>
          <p className="text-slate-300 text-sm md:text-base mt-2 max-w-xl font-medium">Your entrepreneurship hub is fully synchronized. Track your progress, conquer challenges, and scale your career.</p>
        </div>

        <div className="relative z-10 bg-white/10 backdrop-blur-xl border border-white/25 px-6 py-5 rounded-2xl flex items-center gap-4 shadow-2xl">
          <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-gold-400 via-amber-500 to-gold-600 text-brand-950 flex items-center justify-center text-2xl font-black shadow-lg">
            {user.fullName.charAt(0).toUpperCase()}
          </div>
          <div>
            <div className="font-extrabold text-white text-base md:text-lg flex items-center gap-2">
              {user.fullName} <MembershipBadge status={user.membershipStatus} />
            </div>
            <div className="text-xs text-slate-200 flex items-center gap-2 mt-1 font-semibold">
              <ShieldCheck className="w-4 h-4 text-gold-400" /> {user.membershipTier} Member • {user.department || 'General Member'}
            </div>
          </div>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-5 mb-10">
        {statCards.map((s) => (
          <div key={s.label} className="card p-6 border border-slate-200/80 shadow-sm hover:shadow-xl hover:-translate-y-1 transition-all duration-300 bg-white group">
            <div className={`w-14 h-14 rounded-2xl flex items-center justify-center mb-4 border shadow-md transition-transform duration-300 group-hover:scale-110 ${s.color}`}>
              <s.icon className="w-7 h-7" />
            </div>
            <div className="text-3xl md:text-4xl font-black text-brand-950 tracking-tight">{s.value}</div>
            <div className="text-xs md:text-sm font-bold text-slate-500 mt-1 uppercase tracking-wider">{s.label}</div>
          </div>
        ))}
      </div>

      <div className="grid lg:grid-cols-3 gap-8">
        {/* Enrolled courses */}
        <div className="lg:col-span-2 card p-8 border border-slate-200/80 shadow-2xl bg-white">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-xl md:text-2xl font-black text-brand-950 flex items-center gap-3">
              <div className="p-2.5 rounded-2xl bg-brand-50 text-brand-700 shadow-inner">
                <BookOpen className="w-6 h-6" />
              </div> 
              Active Courses & Learning
            </h2>
            <Link to="/courses" className="text-xs font-bold text-brand-700 hover:text-brand-900 bg-brand-50 hover:bg-brand-100 px-4 py-2.5 rounded-xl transition flex items-center gap-1.5 shadow-xs">
              Browse catalog <ArrowRight className="w-4 h-4" />
            </Link>
          </div>

          {enrollments.length === 0 ? (
            <div className="py-16 text-center bg-slate-50/80 rounded-3xl border-2 border-dashed border-slate-200 p-6">
              <BookOpen className="w-14 h-14 text-slate-300 mx-auto mb-3" />
              <h3 className="font-bold text-brand-950 text-lg">No active enrollments</h3>
              <p className="text-xs text-slate-500 max-w-sm mx-auto mt-1 mb-6">Jump into our curated business catalog and kickstart your learning journey.</p>
              <Link to="/courses" className="btn-primary inline-flex items-center gap-2 shadow-lg">Browse courses <ArrowRight className="w-4 h-4" /></Link>
            </div>
          ) : (
            <div className="space-y-4">
              {enrollments.map((e) => (
                <Link key={e.id} to={`/courses/${e.course.slug}`} className="block rounded-2xl border border-slate-200/80 p-6 hover:border-brand-500 hover:shadow-xl hover:bg-slate-50/50 transition duration-300 group">
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex-1 min-w-0">
                      <div className="font-extrabold text-base md:text-lg text-brand-950 truncate group-hover:text-brand-700 transition">{e.course.title}</div>
                      <div className="text-xs font-bold text-slate-500 mt-1.5 flex items-center gap-2">
                        <span className="px-2.5 py-1 bg-brand-50 text-brand-700 rounded-lg border border-brand-100">{e.course.category}</span>
                        <span>•</span>
                        <span className="text-slate-600">{e.course.level}</span>
                      </div>
                    </div>
                    {e.completed ? (
                      <span className="px-3.5 py-1.5 bg-emerald-50 text-emerald-700 border border-emerald-200 text-xs font-black rounded-full flex items-center gap-1.5 shadow-xs">
                        <CheckCircle2 className="w-4 h-4" /> Completed
                      </span>
                    ) : (
                      <span className="px-3.5 py-1.5 bg-amber-50 text-amber-700 border border-amber-200 text-xs font-black rounded-full flex items-center gap-1.5 shadow-xs">
                        <Clock className="w-4 h-4" /> In progress
                      </span>
                    )}
                  </div>
                  <div className="mt-5">
                    <div className="flex justify-between text-xs font-extrabold text-slate-600 mb-2">
                      <span>Course Completion</span>
                      <span className="text-brand-900">{e.progress}%</span>
                    </div>
                    <div className="h-3 w-full bg-slate-100 rounded-full overflow-hidden p-0.5 border border-slate-200/60 shadow-inner">
                      <div className="h-full bg-gradient-to-r from-brand-700 to-brand-900 rounded-full transition-all duration-500 shadow-sm" style={{ width: `${e.progress}%` }} />
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          )}
        </div>

        {/* Right column */}
        <div className="space-y-8">
          {/* Gamification 8-Badge Showcase */}
          <GamificationPanel gdata={gdata} />

          {/* Certificates */}
          <div className="card p-8 border border-slate-200/80 shadow-2xl bg-white">
            <h2 className="text-lg md:text-xl font-black text-brand-950 flex items-center gap-3 mb-6">
              <div className="p-2.5 rounded-2xl bg-gold-50 text-gold-700 shadow-inner">
                <Award className="w-6 h-6" />
              </div>
              Verified Credentials
            </h2>
            {certificates.length === 0 ? (
              <div className="text-center py-8 bg-slate-50/80 rounded-2xl border-2 border-dashed border-slate-200 p-5">
                <p className="text-xs text-slate-500 font-semibold">Complete courses & pass examinations to unlock secure unforgeable certificates.</p>
              </div>
            ) : (
              <div className="space-y-3.5">
                {certificates.map((c) => (
                  <Link key={c.id} to={`/certificates/${c.certificateId}`} className="block rounded-2xl border border-gold-500/40 bg-gradient-to-r from-gold-500/[0.04] via-amber-500/[0.08] to-gold-500/[0.04] p-4.5 hover:border-gold-500 hover:shadow-lg transition duration-300">
                    <div className="font-extrabold text-sm text-brand-950 truncate">{c.course.title}</div>
                    <div className="text-xs text-slate-500 font-mono mt-1 tracking-wider font-semibold">{c.certificateId}</div>
                    {c.type === 'MEMBER_ONLY' && (
                      <span className="text-[10px] font-black text-gold-900 bg-gold-500/25 rounded-md px-2.5 py-1 mt-2.5 inline-block uppercase tracking-wider border border-gold-500/30">
                        Member Verified
                      </span>
                    )}
                  </Link>
                ))}
              </div>
            )}
            <Link to="/certificates" className="btn-secondary w-full mt-6 text-xs font-extrabold py-3.5 shadow-sm">View all credentials</Link>
          </div>

          {/* Games */}
          <div className="card p-8 border border-slate-200/80 shadow-2xl bg-white">
            <h2 className="text-lg md:text-xl font-black text-brand-950 flex items-center gap-3 mb-6">
              <div className="p-2.5 rounded-2xl bg-purple-50 text-purple-700 shadow-inner">
                <Trophy className="w-6 h-6" />
              </div>
              Tournaments & Games
            </h2>
            {gameRegistrations.length === 0 ? (
              <div className="text-center py-8 bg-slate-50/80 rounded-2xl border-2 border-dashed border-slate-200 p-5">
                <p className="text-xs text-slate-500 font-semibold">No club activity registrations yet. Check the activities page to join SSC events.</p>
              </div>
            ) : (
              <div className="space-y-3.5">
                {gameRegistrations.map((g) => (
                  <div key={g.id} className="rounded-2xl border border-slate-200/80 p-4.5 bg-slate-50/60 shadow-xs">
                    <div className="font-extrabold text-sm text-brand-950 truncate">{g.game.title}</div>
                    <div className="text-xs font-bold text-purple-700 mt-1.5 uppercase tracking-wider flex items-center gap-2">
                      <span className="w-2.5 h-2.5 rounded-full bg-purple-600 animate-ping" /> {g.game.status}
                    </div>
                  </div>
                ))}
              </div>
            )}
            <Link to="/games" className="btn-secondary w-full mt-6 text-xs font-extrabold py-3.5 shadow-sm">Explore active games</Link>
          </div>
        </div>
      </div>
    </div>
  );
}
