import { useEffect, useState } from 'react';
import { api } from '../../api/client.js';
import { Spinner, ErrorState } from '../../components/Common.jsx';
import { BarChart3, Users, BookOpen, Award, TrendingUp, ShieldCheck, Clock, Star, Activity } from 'lucide-react';

function StatCard({ label, value, icon: Icon, tone }) {
  return <div className="card p-4 flex items-center gap-3"><div className={`w-10 h-10 rounded-xl flex items-center justify-center ${tone}`}><Icon className="w-5 h-5" /></div><div className="min-w-0"><div className="text-2xl font-bold text-brand-950">{value}</div><div className="text-xs text-slate-500 truncate">{label}</div></div></div>;
}

function MiniLineChart({ points, color }) {
  const max = Math.max(...(points || []).map((p) => p.value), 1);
  const coords = (points || []).map((p, i) => `${(i / Math.max(points.length - 1, 1)) * 100},${36 - (p.value / max) * 30}`).join(' ');
  return <div><svg viewBox="0 0 100 40" preserveAspectRatio="none" className="w-full h-24 overflow-visible"><path d="M 0 36 H 100" stroke="#e2e8f0" strokeWidth="0.7" fill="none" /><polyline points={coords} fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />{(points || []).map((p, i) => <circle key={p.date} cx={(i / Math.max(points.length - 1, 1)) * 100} cy={36 - (p.value / max) * 30} r="1.5" fill={color} />)}</svg><div className="flex justify-between text-[10px] text-slate-400"><span>{points?.[0]?.date?.slice(5) || ''}</span><span>{points?.[points.length - 1]?.date?.slice(5) || ''}</span></div></div>;
}

function BarChart({ data, valueKey, labelKey, color }) {
  if (!data?.length) return <p className="text-sm text-slate-400">No data yet.</p>;
  const max = Math.max(...data.map((d) => d[valueKey]), 1);
  return <div className="space-y-2">{data.slice(0, 8).map((item) => <div key={item[labelKey]} className="flex items-center gap-3"><span className="w-32 text-xs text-slate-600 truncate text-right">{item[labelKey]}</span><div className="flex-1 h-5 bg-slate-100 rounded-full overflow-hidden"><div className={`${color} h-full rounded-full text-[10px] text-white font-bold text-right pr-2 pt-0.5`} style={{ width: `${Math.max((item[valueKey] / max) * 100, 4)}%` }}>{item[valueKey]}</div></div></div>)}</div>;
}

export default function AdminAnalytics() {
  const [overview, setOverview] = useState(null); const [enrollments, setEnrollments] = useState(null); const [logins, setLogins] = useState(null); const [loading, setLoading] = useState(true); const [error, setError] = useState('');
  useEffect(() => { Promise.all([api.analyticsOverview(), api.analyticsEnrollmentsByCourse(), api.analyticsLoginFrequency()]).then(([overviewData, enrollmentData, loginData]) => { setOverview(overviewData); setEnrollments(enrollmentData); setLogins(loginData); }).catch((e) => setError(e.message)).finally(() => setLoading(false)); }, []);
  if (loading) return <Spinner label="Loading analytics..." />;
  if (error || !overview) return <ErrorState message={error || 'Could not load analytics.'} />;
  const { totals, membership, certificates, engagement = {}, courses = {}, exams = {}, games = {} } = overview;
  const cards = [
    ['Total users', totals.users, Users, 'bg-brand-50 text-brand-700'], ['Courses', totals.courses, BookOpen, 'bg-emerald-50 text-emerald-700'], ['Enrollments', totals.enrollments, TrendingUp, 'bg-purple-50 text-purple-700'], ['Certificates', totals.certificates, Award, 'bg-amber-50 text-amber-700'], ['Exam attempts', exams.attempts || 0, Clock, 'bg-orange-50 text-orange-700'], ['Game registrations', games.registrations || 0, Star, 'bg-indigo-50 text-indigo-700'], ['Active members', membership.active, Activity, 'bg-cyan-50 text-cyan-700'], ['Sign-ins', engagement.loginEvents || 0, ShieldCheck, 'bg-rose-50 text-rose-700'],
  ];
  const colors = ['#0f766e', '#2563eb', '#7c3aed', '#db2777', '#ea580c', '#0891b2'];
  return <div className="space-y-5">
    <div><h2 className="text-xl font-bold text-brand-950 flex items-center gap-2"><BarChart3 className="w-5 h-5" /> Analytics dashboard</h2><p className="text-sm text-slate-500 mt-0.5">A compact view of platform health and member engagement.</p></div>
    <div className="grid grid-cols-2 md:grid-cols-4 xl:grid-cols-8 gap-3">{cards.map(([label, value, icon, tone]) => <StatCard key={label} label={label} value={value} icon={icon} tone={tone} />)}</div>
    <section className="card p-5"><div className="flex items-center justify-between mb-4"><div><h3 className="font-bold text-brand-950">Member login frequency</h3><p className="text-xs text-slate-500">Daily sign-ins for the six most active members over the last 14 days.</p></div><Activity className="w-5 h-5 text-brand-600" /></div>{logins?.members?.length ? <div className="grid md:grid-cols-2 xl:grid-cols-3 gap-4">{logins.members.map((member, i) => <div key={member.userId} className="rounded-xl border border-slate-100 bg-slate-50/60 p-3"><div className="flex items-center justify-between mb-1"><span className="font-semibold text-sm text-brand-950 truncate">{member.name}</span><span className="text-xs font-bold text-slate-500">{member.total} total</span></div><MiniLineChart points={member.points} color={colors[i % colors.length]} /></div>)}</div> : <p className="text-sm text-slate-400 py-6">No login activity recorded yet.</p>}</section>
    <div className="grid lg:grid-cols-2 gap-5"><div className="card p-5"><h3 className="font-bold text-brand-950 mb-4">Enrollments by course</h3><BarChart data={enrollments?.data || []} labelKey="title" valueKey="enrollments" color="bg-gradient-to-r from-brand-500 to-brand-700" /></div><div className="card p-5"><h3 className="font-bold text-brand-950 mb-4">Course completion rates</h3><BarChart data={(courses.data || []).map((item) => ({ ...item, rate: item.enrollments ? Math.round((item.completed / item.enrollments) * 100) : 0 }))} labelKey="title" valueKey="rate" color="bg-gradient-to-r from-emerald-500 to-teal-700" /></div><div className="card p-5"><h3 className="font-bold text-brand-950 mb-4">Membership snapshot</h3><div className="grid grid-cols-3 gap-3 text-center">{[['Verified', membership.verified, 'text-emerald-600'], ['Active', membership.active, 'text-brand-700'], ['Pending', membership.pending, 'text-amber-600']].map(([label, value, tone]) => <div key={label} className="rounded-xl bg-slate-50 p-4"><div className={`text-2xl font-bold ${tone}`}>{value}</div><div className="text-xs text-slate-500">{label}</div></div>)}</div></div><div className="card p-5"><h3 className="font-bold text-brand-950 mb-4">Certificates and exams</h3><div className="grid grid-cols-2 gap-3 text-center"><div className="rounded-xl bg-brand-50 p-4"><div className="text-2xl font-bold text-brand-800">{certificates.professional}</div><div className="text-xs text-slate-500">Professional certificates</div></div><div className="rounded-xl bg-amber-50 p-4"><div className="text-2xl font-bold text-amber-800">{exams.averageScore || 0}%</div><div className="text-xs text-slate-500">Average exam score</div></div></div></div></div>
  </div>;
}
