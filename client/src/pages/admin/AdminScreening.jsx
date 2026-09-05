import { useEffect, useState } from 'react';
import { api } from '../../api/client.js';
import { Spinner, EmptyState, MembershipBadge } from '../../components/Common.jsx';
import { UserCheck, Search, ShieldCheck, Eye, Loader2, GraduationCap, Globe, Target, MessageSquare } from 'lucide-react';

export default function AdminScreening() {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [busy, setBusy] = useState(null);
  const [selected, setSelected] = useState(null);

  useEffect(() => {
    api.registrationScreening()
      .then((d) => setUsers(d.users || []))
      .catch(() => setUsers([]))
      .finally(() => setLoading(false));
  }, []);

  const setStatus = async (u, status) => {
    setBusy(u.id);
    try {
      await api.updateMembership({ userId: u.id, status });
      setUsers((us) => us.map((x) => (x.id === u.id ? { ...x, membershipStatus: status } : x)));
      setSelected((s) => (s && s.id === u.id ? { ...s, membershipStatus: status } : s));
    } catch (e) { alert(e.message); } finally { setBusy(null); }
  };

  if (loading) return <Spinner label="Loading registrations..." />;

  const filtered = search
    ? users.filter((u) =>
        u.fullName?.toLowerCase().includes(search.toLowerCase()) ||
        u.email?.toLowerCase().includes(search.toLowerCase()) ||
        u.institution?.toLowerCase().includes(search.toLowerCase())
      )
    : users;

  const pendingCount = users.filter((u) => u.membershipStatus === 'PENDING').length;

  return (
    <div className="space-y-4">
      <div>
        <h2 className="text-xl font-bold text-brand-950 flex items-center gap-2"><UserCheck className="w-5 h-5" /> Registration Screening</h2>
        <p className="text-sm text-slate-500 mt-0.5">Review new signers and their onboarding answers. {pendingCount > 0 && <span className="text-amber-600 font-semibold">{pendingCount} pending review</span>}</p>
      </div>

      {/* Search */}
      <div className="relative">
        <Search className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
        <input
          type="text"
          placeholder="Search by name, email, or institution..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="input pl-9"
        />
      </div>

      {filtered.length === 0 ? (
        <EmptyState icon={UserCheck} title="No registrations found" description="New member sign-ups will appear here for screening." />
      ) : (
        <div className="card overflow-hidden">
          <table className="w-full text-sm">
            <thead className="bg-slate-50 border-b border-slate-200">
              <tr className="text-left text-xs text-slate-500 uppercase tracking-wide">
                <th className="px-4 py-3">Member</th>
                <th className="px-4 py-3 hidden md:table-cell">Institution</th>
                <th className="px-4 py-3">Status</th>
                <th className="px-4 py-3 hidden sm:table-cell">Onboarded</th>
                <th className="px-4 py-3 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filtered.map((u) => (
                <tr key={u.id} className="hover:bg-slate-50/50">
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-2.5">
                      <div className="w-8 h-8 rounded-full bg-brand-700 text-white flex items-center justify-center text-xs font-bold flex-shrink-0">
                        {u.fullName?.charAt(0).toUpperCase()}
                      </div>
                      <div className="min-w-0">
                        <div className="font-medium text-brand-950 truncate flex items-center gap-1.5">
                          {u.fullName}
                          {u.googleId && <span title="Signed in with Google" className="text-[9px] bg-blue-100 text-blue-600 px-1 rounded">Google</span>}
                        </div>
                        <div className="text-xs text-slate-400 truncate">{u.email}</div>
                      </div>
                    </div>
                  </td>
                  <td className="px-4 py-3 hidden md:table-cell text-slate-600">{u.institution || u.department || '—'}</td>
                  <td className="px-4 py-3"><MembershipBadge status={u.membershipStatus} /></td>
                  <td className="px-4 py-3 hidden sm:table-cell">
                    {u.hasOnboarded ? (
                      <span className="text-xs text-emerald-600 flex items-center gap-1"><ShieldCheck className="w-3 h-3" /> Yes</span>
                    ) : (
                      <span className="text-xs text-amber-600">Pending</span>
                    )}
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex gap-1.5 justify-end">
                      <button onClick={() => setSelected(u)} className="px-2.5 py-1 rounded text-xs font-medium bg-brand-50 text-brand-700 hover:bg-brand-100 transition flex items-center gap-1"><Eye className="w-3 h-3" /> Review</button>
                      {busy === u.id ? <Loader2 className="w-4 h-4 animate-spin text-brand-600" /> : (
                        <button onClick={() => setStatus(u, 'VERIFIED')} className="px-2.5 py-1 rounded text-xs font-medium bg-emerald-50 text-emerald-700 hover:bg-emerald-100 transition flex items-center gap-1"><ShieldCheck className="w-3 h-3" /> Verify</button>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Onboarding detail modal */}
      {selected && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4" onClick={() => setSelected(null)}>
          <div className="bg-white rounded-xl max-w-lg w-full max-h-[85vh] overflow-y-auto p-6" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-start justify-between mb-4">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-full bg-brand-700 text-white flex items-center justify-center text-lg font-bold">{selected.fullName?.charAt(0).toUpperCase()}</div>
                <div>
                  <h3 className="font-bold text-brand-950">{selected.fullName}</h3>
                  <p className="text-xs text-slate-500">{selected.email}</p>
                </div>
              </div>
              <button onClick={() => setSelected(null)} className="text-slate-400 hover:text-slate-600 text-xl">✕</button>
            </div>

            <div className="space-y-3">
              <div className="flex items-center gap-2">
                <MembershipBadge status={selected.membershipStatus} />
                <span className="text-xs text-slate-400">Joined {new Date(selected.joinedAt).toLocaleDateString()}</span>
              </div>

              {selected.studentId && (
                <div className="rounded-lg bg-slate-50 p-3">
                  <div className="text-xs font-semibold text-slate-500 uppercase flex items-center gap-1"><GraduationCap className="w-3 h-3" /> Student ID</div>
                  <p className="text-sm text-slate-700 mt-0.5">{selected.studentId}</p>
                </div>
              )}
              {selected.department && (
                <div className="rounded-lg bg-slate-50 p-3">
                  <div className="text-xs font-semibold text-slate-500 uppercase flex items-center gap-1"><GraduationCap className="w-3 h-3" /> Department</div>
                  <p className="text-sm text-slate-700 mt-0.5">{selected.department}</p>
                </div>
              )}
              {selected.institution && (
                <div className="rounded-lg bg-slate-50 p-3">
                  <div className="text-xs font-semibold text-slate-500 uppercase flex items-center gap-1"><Globe className="w-3 h-3" /> Institution</div>
                  <p className="text-sm text-slate-700 mt-0.5">{selected.institution}</p>
                </div>
              )}
              {selected.heardAbout && (
                <div className="rounded-lg bg-slate-50 p-3">
                  <div className="text-xs font-semibold text-slate-500 uppercase flex items-center gap-1"><MessageSquare className="w-3 h-3" /> How they heard about us</div>
                  <p className="text-sm text-slate-700 mt-0.5">{selected.heardAbout}</p>
                </div>
              )}
              {selected.usageGoals && (
                <div className="rounded-lg bg-slate-50 p-3">
                  <div className="text-xs font-semibold text-slate-500 uppercase flex items-center gap-1"><Target className="w-3 h-3" /> Usage Goals</div>
                  <p className="text-sm text-slate-700 mt-0.5 whitespace-pre-wrap">{selected.usageGoals}</p>
                </div>
              )}

              {/* Quick status actions */}
              <div className="flex gap-2 pt-2">
                <button onClick={() => setStatus(selected, 'VERIFIED')} className="btn-primary text-sm flex-1 flex items-center justify-center gap-1"><ShieldCheck className="w-4 h-4" /> Verify</button>
                <button onClick={() => setStatus(selected, 'ACTIVE')} className="btn-secondary text-sm flex-1">Activate</button>
                <button onClick={() => setStatus(selected, 'PENDING')} className="btn-secondary text-sm flex-1">Pending</button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
