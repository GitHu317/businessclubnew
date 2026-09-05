import { useEffect, useState } from 'react';
import { api } from '../../api/client.js';
import { Spinner, ErrorState } from '../../components/Common.jsx';
import {
  BarChart3, Users, BookOpen, Award, TrendingUp, ShieldCheck, Clock, Star,
} from 'lucide-react';

/* Lightweight inline bar/line chart components (no external chart lib). */

function BarChart({ data, labelKey, valueKey, color = 'bg-brand-600', height = 180 }) {
  if (!data || data.length === 0) return <p className="text-sm text-slate-400">No data yet.</p>;
  const max = Math.max(...data.map((d) => d[valueKey]), 1);
  return (
    <div className="space-y-2" style={{ minHeight: height }}>
      {data.map((d, i) => {
        const pct = Math.round((d[valueKey] / max) * 100);
        return (
          <div key={i} className="flex items-center gap-3">
            <div className="w-32 sm:w-40 text-xs text-slate-600 truncate text-right">{d[labelKey]}</div>
            <div className="flex-1 bg-slate-100 rounded-full h-6 relative overflow-hidden">
              <div className={`${color} h-full rounded-full transition-all duration-500 flex items-center justify-end pr-2`} style={{ width: `${Math.max(pct, 3)}%` }}>
                <span className="text-[10px] font-bold text-white">{d[valueKey]}</span>
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}

function LineChart({ series }) {
  if (!series || series.length === 0) return <p className="text-sm text-slate-400">No registrations yet.</p>;
  // Build cumulative + per-day totals
  const points = series.map((s, i) => ({ ...s, cumulative: series.slice(0, i + 1).reduce((a, b) => a + b.total, 0) }));
  const maxTotal = Math.max(...points.map((p) => p.total), 1);
  const maxCum = Math.max(...points.map((p) => p.cumulative), 1);
  const W = 100; // percentage-based
  return (
    <div>
      {/* cumulative line (using bars as sparkline) */}
      <div className="flex items-end gap-0.5 h-32 mb-2">
        {points.map((p, i) => {
          const h = Math.round((p.cumulative / maxCum) * 100);
          return (
            <div key={i} className="flex-1 bg-gradient-to-t from-brand-700 to-brand-400 rounded-t transition-all" style={{ height: `${Math.max(h, 2)}%` }} title={`${p.date}: ${p.cumulative} cumulative`} />
          );
        })}
      </div>
      <div className="flex justify-between text-[10px] text-slate-400">
        <span>{points[0]?.date}</span>
        <span>{points[points.length - 1]?.date}</span>
      </div>
      <p className="text-xs text-slate-500 mt-1">Cumulative user registrations over time ({points[points.length - 1]?.cumulative || 0} total)</p>
    </div>
  );
}

function DonutStat({ label, value, total, color }) {
  const pct = total > 0 ? Math.round((value / total) * 100) : 0;
  return (
    <div className="flex items-center gap-3">
      <div className="relative w-12 h-12">
        <svg className="w-12 h-12 -rotate-90" viewBox="0 0 36 36">
          <circle cx="18" cy="18" r="15.9" fill="none" stroke="#e2e8f0" strokeWidth="4" />
          <circle cx="18" cy="18" r="15.9" fill="none" stroke="currentColor" strokeWidth="4" strokeDasharray={`${pct} ${100 - pct}`} className={color} />
        </svg>
        <span className="absolute inset-0 flex items-center justify-center text-xs font-bold text-brand-950">{pct}%</span>
      </div>
      <div>
        <div className="text-sm font-bold text-brand-950">{value}</div>
        <div className="text-xs text-slate-500">{label}</div>
      </div>
    </div>
  );
}

export default function AdminAnalytics() {
  const [overview, setOverview] = useState(null);
  const [registrations, setRegistrations] = useState(null);
  const [enrollments, setEnrollments] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    Promise.all([
      api.analyticsOverview().catch((e) => { setError(e.message); return null; }),
      api.analyticsRegistrations().catch(() => null),
      api.analyticsEnrollmentsByCourse().catch(() => null),
    ]).then(([o, r, e]) => {
      setOverview(o);
      setRegistrations(r);
      setEnrollments(e);
      setLoading(false);
    });
  }, []);

  if (loading) return <Spinner label="Loading analytics..." />;
  if (error || !overview) return <ErrorState message={error || 'Could not load analytics.'} />;

  const { totals, membership, certificates } = overview;
  const memberTotal = membership.pending + membership.active + membership.verified;

  const statCards = [
    { label: 'Total Users', value: totals.users, icon: Users, color: 'bg-brand-50 text-brand-700' },
    { label: 'Courses', value: totals.courses, icon: BookOpen, color: 'bg-emerald-50 text-emerald-700' },
    { label: 'Enrollments', value: totals.enrollments, icon: TrendingUp, color: 'bg-purple-50 text-purple-700' },
    { label: 'Certificates', value: totals.certificates, icon: Award, color: 'bg-gold-500/20 text-gold-600' },
  ];

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-xl font-bold text-brand-950 flex items-center gap-2"><BarChart3 className="w-5 h-5" /> Analytics Dashboard</h2>
        <p className="text-sm text-slate-500 mt-0.5">Real-time platform metrics and trends.</p>
      </div>

      {/* Top stat cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {statCards.map((s) => (
          <div key={s.label} className="card p-5">
            <div className={`w-10 h-10 rounded-lg flex items-center justify-center mb-3 ${s.color}`}>
              <s.icon className="w-5 h-5" />
            </div>
            <div className="text-3xl font-bold text-brand-950">{s.value}</div>
            <div className="text-sm text-slate-500">{s.label}</div>
          </div>
        ))}
      </div>

      <div className="grid lg:grid-cols-2 gap-6">
        {/* Registrations over time */}
        <div className="card p-6">
          <h3 className="font-bold text-brand-950 flex items-center gap-2 mb-4">
            <TrendingUp className="w-4 h-4 text-brand-700" /> User Registrations Over Time
          </h3>
          <LineChart series={registrations?.series || []} />
        </div>

        {/* Membership breakdown */}
        <div className="card p-6">
          <h3 className="font-bold text-brand-950 flex items-center gap-2 mb-4">
            <ShieldCheck className="w-4 h-4 text-brand-700" /> Verified vs Pending Members
          </h3>
          <div className="space-y-4">
            <DonutStat label="Verified" value={membership.verified} total={memberTotal} color="text-emerald-500" />
            <DonutStat label="Active" value={membership.active} total={memberTotal} color="text-brand-600" />
            <DonutStat label="Pending" value={membership.pending} total={memberTotal} color="text-amber-500" />
          </div>
          <div className="mt-4 pt-4 border-t border-slate-100 grid grid-cols-3 gap-2 text-center">
            <div><div className="text-lg font-bold text-emerald-600 flex items-center justify-center gap-1"><ShieldCheck className="w-4 h-4" />{membership.verified}</div><div className="text-[10px] text-slate-400 uppercase">Verified</div></div>
            <div><div className="text-lg font-bold text-brand-600">{membership.active}</div><div className="text-[10px] text-slate-400 uppercase">Active</div></div>
            <div><div className="text-lg font-bold text-amber-600 flex items-center justify-center gap-1"><Clock className="w-4 h-4" />{membership.pending}</div><div className="text-[10px] text-slate-400 uppercase">Pending</div></div>
          </div>
        </div>

        {/* Enrollments by course */}
        <div className="card p-6 lg:col-span-2">
          <h3 className="font-bold text-brand-950 flex items-center gap-2 mb-4">
            <BookOpen className="w-4 h-4 text-brand-700" /> Enrollments by Course
          </h3>
          <BarChart
            data={enrollments?.data?.slice(0, 10) || []}
            labelKey="title"
            valueKey="enrollments"
            color="bg-gradient-to-r from-brand-500 to-brand-700"
          />
        </div>

        {/* Certificate breakdown */}
        <div className="card p-6 lg:col-span-2">
          <h3 className="font-bold text-brand-950 flex items-center gap-2 mb-4">
            <Award className="w-4 h-4 text-gold-600" /> Certificate Distribution
          </h3>
          <div className="grid grid-cols-2 gap-4">
            <div className="rounded-lg border border-brand-200 bg-brand-50 p-4 text-center">
              <div className="text-3xl font-bold text-brand-800">{certificates.professional}</div>
              <div className="text-xs text-slate-500 mt-1 flex items-center justify-center gap-1"><Award className="w-3 h-3" /> Professional</div>
            </div>
            <div className="rounded-lg border border-gold-500/30 bg-gold-500/5 p-4 text-center">
              <div className="text-3xl font-bold text-gold-700 flex items-center justify-center gap-1.5"><Star className="w-5 h-5" />{certificates.memberOnly}</div>
              <div className="text-xs text-slate-500 mt-1">Member Only</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
