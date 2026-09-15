import { useEffect, useState } from 'react';
import { api } from '../../api/client.js';
import { Spinner, EmptyState, MembershipBadge } from '../../components/Common.jsx';
import { UserCheck, ShieldCheck, Loader2, Save } from 'lucide-react';

const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

function paidMonths(value) {
  if (Array.isArray(value)) return value.map(Number);
  try { return JSON.parse(value || '[]').map(Number); } catch { return []; }
}

export default function AdminMembers() {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(null);

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

  if (loading) return <Spinner label="Loading members..." />;

  return (
    <div>
      <h2 className="text-xl font-bold text-brand-950 flex items-center gap-2 mb-1"><UserCheck className="w-5 h-5" /> Membership Management</h2>
      <p className="text-sm text-slate-500 mb-4">Verify members and record their 12 monthly membership payments. A checked month means paid.</p>

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
                      <button type="button" disabled={!user.paymentDirty || busy === `${user.id}:payments`} onClick={() => savePayments(user)} className="btn-secondary text-xs disabled:opacity-50"><Save className="w-3.5 h-3.5" /> {busy === `${user.id}:payments` ? 'Saving...' : 'Save payments'}</button>
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
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
