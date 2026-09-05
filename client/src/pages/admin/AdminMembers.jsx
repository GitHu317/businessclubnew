import { useEffect, useState } from 'react';
import { api } from '../../api/client.js';
import { Spinner, EmptyState, MembershipBadge } from '../../components/Common.jsx';
import { UserCheck, ShieldCheck, Loader2 } from 'lucide-react';

export default function AdminMembers() {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(null);

  useEffect(() => {
    api.adminUsers()
      .then((d) => setUsers(d.users || []))
      .catch(() => setUsers([]))
      .finally(() => setLoading(false));
  }, []);

  const setStatus = async (u, status) => {
    setBusy(u.id);
    try {
      await api.updateMembership({ userId: u.id, status });
      setUsers((us) => us.map((x) => (x.id === u.id ? { ...x, membershipStatus: status } : x)));
    } catch (e) { alert(e.message); } finally { setBusy(null); }
  };

  if (loading) return <Spinner label="Loading members..." />;

  return (
    <div>
      <h2 className="text-xl font-bold text-brand-950 flex items-center gap-2 mb-1"><UserCheck className="w-5 h-5" /> Membership Management</h2>
      <p className="text-sm text-slate-500 mb-4">Verify and manage member status across the club.</p>

      {users.length === 0 ? (
        <EmptyState icon={UserCheck} title="No members to manage yet" description="As members sign up, they'll appear here for verification." />
      ) : (
        <div className="card overflow-hidden">
          <table className="w-full text-sm">
            <thead className="bg-slate-50 border-b border-slate-200">
              <tr className="text-left text-xs text-slate-500 uppercase tracking-wide">
                <th className="px-4 py-3">Member</th>
                <th className="px-4 py-3 hidden sm:table-cell">Department</th>
                <th className="px-4 py-3">Status</th>
                <th className="px-4 py-3 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {users.map((u) => (
                <tr key={u.id} className="hover:bg-slate-50/50">
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-2.5">
                      <div className="w-8 h-8 rounded-full bg-brand-700 text-white flex items-center justify-center text-xs font-bold flex-shrink-0">
                        {u.fullName.charAt(0).toUpperCase()}
                      </div>
                      <div className="min-w-0">
                        <div className="font-medium text-brand-950 truncate">{u.fullName} {u.role === 'ADMIN' && <span className="text-xs text-brand-600">• Admin</span>}</div>
                        <div className="text-xs text-slate-400 truncate">{u.email}</div>
                      </div>
                    </div>
                  </td>
                  <td className="px-4 py-3 hidden sm:table-cell text-slate-600">{u.department || '—'}</td>
                  <td className="px-4 py-3"><MembershipBadge status={u.membershipStatus} /></td>
                  <td className="px-4 py-3">
                    <div className="flex gap-1.5 justify-end">
                      {busy === u.id ? <Loader2 className="w-4 h-4 animate-spin text-brand-600" /> : (
                        <>
                          <button onClick={() => setStatus(u, 'ACTIVE')} className="px-2.5 py-1 rounded text-xs font-medium bg-emerald-50 text-emerald-700 hover:bg-emerald-100 transition">Activate</button>
                          <button onClick={() => setStatus(u, 'VERIFIED')} className="px-2.5 py-1 rounded text-xs font-medium bg-brand-50 text-brand-700 hover:bg-brand-100 transition flex items-center gap-1"><ShieldCheck className="w-3 h-3" /> Verify</button>
                          <button onClick={() => setStatus(u, 'PENDING')} className="px-2.5 py-1 rounded text-xs font-medium bg-amber-50 text-amber-700 hover:bg-amber-100 transition">Pending</button>
                        </>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
