import { useEffect, useState } from 'react';
import { api } from '../../api/client.js';
import { Spinner, EmptyState, MembershipBadge } from '../../components/Common.jsx';
import { UserCheck, ShieldCheck, Loader2, Save, Eye, Trash2, X, LogIn, BookOpen, Activity } from 'lucide-react';
import { useAuth } from '../../context/AuthContext.jsx';

const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

function paidMonths(value) {
  if (Array.isArray(value)) return value.map(Number);
  try { return JSON.parse(value || '[]').map(Number); } catch { return []; }
}

export default function AdminMembers() {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(null);
  const [details, setDetails] = useState(null);
  const [detailsLoading, setDetailsLoading] = useState(null);
  const { user: currentUser } = useAuth();
  const isPresident = currentUser?.bodRole === 'PRESIDENT';

  useEffect(() => {
    api.adminUsers()
      .then((d) => setUsers((d.users || []).map((user) => ({ ...user, paymentDraft: paidMonths(user.monthlyPayments) }))))
      .catch(() => setUsers([]))
      .finally(() => setLoading(false));
  }, []);

  const setStatus = async (user, status) => {
    setBusy(`${user.id}:status`);
    try {
      await api.updateMembership({ userId: user.id, status });
      setUsers((current) => current.map((item) => item.id === user.id ? { ...item, membershipStatus: status } : item));
    } catch (error) { alert(error.message); } finally { setBusy(null); }
  };

  const toggleMonth = (userId, month) => {
    setUsers((current) => current.map((user) => {
      if (user.id !== userId) return user;
      const currentMonths = paidMonths(user.paymentDraft);
      const nextMonths = currentMonths.includes(month) ? currentMonths.filter((item) => item !== month) : [...currentMonths, month].sort((a, b) => a - b);
      return { ...user, paymentDraft: nextMonths, paymentDirty: true };
    }));
  };

  const savePayments = async (user) => {
    setBusy(`${user.id}:payments`);
    try {
      await api.updateMembershipPayments({ userId: user.id, months: paidMonths(user.paymentDraft) });
      setUsers((current) => current.map((item) => item.id === user.id ? { ...item, paymentDirty: false } : item));
    } catch (error) { alert(error.message); } finally { setBusy(null); }
  };

  const showDetails = async (user) => {
    setDetailsLoading(user.id);
    try { const data = await api.adminUserDetails(user.id); setDetails(data.user); } catch (error) { alert(error.message); } finally { setDetailsLoading(null); }
  };

  const deleteMember = async (user) => {
    if (!isPresident || user.role === 'ADMIN') return;
    if (!confirm(`Delete member "${user.fullName}"? This permanently removes their account and related records.`)) return;
    setBusy(`${user.id}:delete`);
    try { await api.deleteAdminUser(user.id); setUsers((current) => current.filter((item) => item.id !== user.id)); if (details?.id === user.id) setDetails(null); } catch (error) { alert(error.message); } finally { setBusy(null); }
  };

  if (loading) return <Spinner label="Loading members..." />;

  return (
    <div>
      <h2 className="text-xl font-bold text-brand-950 flex items-center gap-2 mb-1"><UserCheck className="w-5 h-5" /> Membership Management</h2>
      <p className="text-sm text-slate-500 mb-4">View member details, verify members, and record their 12 monthly membership payments. A checked month means paid.</p>

      {users.length === 0 ? (
        <EmptyState icon={UserCheck} title="No members to manage yet" description="As members sign up, they'll appear here for verification." />
      ) : (
        <div className="space-y-3">
          {users.map((user) => {
            const displayName = user.title || user.fullName;
            const months = paidMonths(user.paymentDraft);
            return (
              <div key={user.id} className="card p-4">
                <div className="flex flex-col lg:flex-row lg:items-start gap-4">
                  <div className="flex items-start gap-2.5 min-w-0 lg:w-64">
                    <div className="w-9 h-9 rounded-full bg-brand-700 text-white flex items-center justify-center text-xs font-bold flex-shrink-0">{displayName.charAt(0).toUpperCase()}</div>
                    <div className="min-w-0">
                      <div className="font-medium text-brand-950 truncate">{displayName} {user.role === 'ADMIN' && <span className="text-xs text-brand-600">• Admin</span>}</div>
                      {user.title && <div className="text-xs text-slate-500">{user.fullName}</div>}
                      <div className="text-xs text-slate-400 truncate">{user.email}</div>
                      <div className="mt-1"><MembershipBadge status={user.membershipStatus} /></div>
                    </div>
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="text-xs font-semibold text-slate-500 mb-2">Monthly payments</div>
                    <div className="grid grid-cols-4 sm:grid-cols-6 md:grid-cols-12 gap-1.5">
                      {MONTHS.map((month, index) => {
                        const monthNumber = index + 1;
                        const checked = months.includes(monthNumber);
                        return <label key={month} className={`flex flex-col items-center gap-1 rounded-md border px-1 py-1.5 text-[10px] cursor-pointer ${checked ? 'border-emerald-300 bg-emerald-50 text-emerald-700' : 'border-slate-200 bg-white text-slate-500'}`}><input type="checkbox" checked={checked} onChange={() => toggleMonth(user.id, monthNumber)} className="accent-emerald-600" />{month}</label>;
                      })}
                    </div>
                    <div className="flex items-center justify-between mt-2">
                      <span className="text-xs text-slate-400">{months.length}/12 months paid</span>
                      <div className="flex gap-2">
                        <button type="button" disabled={detailsLoading === user.id} onClick={() => showDetails(user)} className="btn-ghost text-xs"><Eye className="w-3.5 h-3.5" /> {detailsLoading === user.id ? 'Loading...' : 'Details'}</button>
                        <button type="button" disabled={!user.paymentDirty || busy === `${user.id}:payments`} onClick={() => savePayments(user)} className="btn-secondary text-xs disabled:opacity-50"><Save className="w-3.5 h-3.5" /> {busy === `${user.id}:payments` ? 'Saving...' : 'Save payments'}</button>
                      </div>
                    </div>
                  </div>
                  <div className="flex flex-wrap gap-1.5 lg:w-56 lg:justify-end">
                    {busy === `${user.id}:status` ? <Loader2 className="w-4 h-4 animate-spin text-brand-600" /> : <>
                      <button type="button" onClick={() => setStatus(user, 'ACTIVE')} className="px-2.5 py-1 rounded text-xs font-medium bg-emerald-50 text-emerald-700 hover:bg-emerald-100 transition">Activate</button>
                      <button type="button" onClick={() => setStatus(user, 'VERIFIED')} className="px-2.5 py-1 rounded text-xs font-medium bg-brand-50 text-brand-700 hover:bg-brand-100 transition flex items-center gap-1"><ShieldCheck className="w-3 h-3" /> Verify</button>
                      <button type="button" onClick={() => setStatus(user, 'PENDING')} className="px-2.5 py-1 rounded text-xs font-medium bg-amber-50 text-amber-700 hover:bg-amber-100 transition">Pending</button>
                    </>}
                  </div>
                </div>
                {isPresident && user.role !== 'ADMIN' && <div className="mt-3 pt-3 border-t border-slate-100 flex justify-end"><button type="button" disabled={busy === `${user.id}:delete`} onClick={() => deleteMember(user)} className="btn-ghost text-xs text-red-600 hover:bg-red-50"><Trash2 className="w-3.5 h-3.5" /> {busy === `${user.id}:delete` ? 'Deleting...' : 'Delete member'}</button></div>}
              </div>
            );
          })}
        </div>
      )}
      {details && <MemberDetails details={details} onClose={() => setDetails(null)} />}
    </div>
  );
}

function MemberDetails({ details, onClose }) {
  const completedCourses = details.enrollments.filter((enrollment) => enrollment.completed);
  return <div className="fixed inset-0 z-50 bg-brand-950/50 p-4 flex items-center justify-center" role="dialog" aria-modal="true">
    <div className="bg-white rounded-2xl shadow-2xl w-full max-w-3xl max-h-[90vh] overflow-y-auto">
      <div className="sticky top-0 bg-white border-b border-slate-100 p-5 flex items-start justify-between gap-3">
        <div><h3 className="text-xl font-bold text-brand-950">{details.title || details.fullName}</h3><p className="text-sm text-slate-500">{details.email} • {details.department || 'No department'}</p></div>
        <button type="button" className="btn-ghost p-1.5" onClick={onClose} aria-label="Close details"><X className="w-5 h-5" /></button>
      </div>
      <div className="p-5 space-y-5">
        <div className="grid sm:grid-cols-3 gap-3">
          <Summary icon={LogIn} label="Sign-ins" value={details.usage.signIns} />
          <Summary icon={Activity} label="Active days" value={details.usage.activeDays} />
          <Summary icon={BookOpen} label="Courses completed" value={completedCourses.length} />
        </div>
        <div className="rounded-lg bg-slate-50 border border-slate-200 p-4 text-sm text-slate-600"><strong className="text-brand-950">Sign-in method:</strong> {details.authProvider === 'GOOGLE' ? 'Google sign-in button' : 'Email and password form'}<br /><strong className="text-brand-950">Last activity:</strong> {details.usage.lastSeenAt ? new Date(details.usage.lastSeenAt).toLocaleString() : 'No recorded activity'}<br /><strong className="text-brand-950">Joined:</strong> {new Date(details.joinedAt).toLocaleDateString()}</div>
        <section><h4 className="font-semibold text-brand-950 mb-2">Welcome questionnaire</h4><div className="grid sm:grid-cols-2 gap-2 text-sm"><p><span className="text-slate-500">How they heard about SSC:</span> {details.heardAbout || 'Not answered'}</p><p><span className="text-slate-500">Institution:</span> {details.institution || 'Not answered'}</p><p className="sm:col-span-2"><span className="text-slate-500">Goals:</span> {details.usageGoals || 'Not answered'}</p></div></section>
        <section><h4 className="font-semibold text-brand-950 mb-2">Courses and progress</h4>{details.enrollments.length === 0 ? <p className="text-sm text-slate-500">No course enrollments.</p> : <div className="space-y-2">{details.enrollments.map((enrollment) => <div key={enrollment.course.slug} className="border border-slate-200 rounded-lg p-3 flex items-center justify-between gap-3"><div><div className="font-medium text-brand-950">{enrollment.course.title}</div><div className="text-xs text-slate-500">{enrollment.lessonProgress.length} completed lesson{enrollment.lessonProgress.length === 1 ? '' : 's'}</div></div><span className={`text-xs font-semibold ${enrollment.completed ? 'text-emerald-700' : 'text-slate-500'}`}>{enrollment.completed ? 'Completed' : `${Math.round(enrollment.progress || 0)}%`}</span></div>)}</div>}</section>
      </div>
    </div>
  </div>;
}

function Summary({ icon: Icon, label, value }) { return <div className="rounded-lg border border-slate-200 p-3 flex items-center gap-2"><Icon className="w-4 h-4 text-brand-600" /><div><div className="text-lg font-bold text-brand-950">{value}</div><div className="text-xs text-slate-500">{label}</div></div></div>; }
