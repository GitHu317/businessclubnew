import { useEffect, useState } from 'react';
import { api } from '../../api/client.js';
import { Spinner, EmptyState, ErrorState } from '../../components/Common.jsx';
import { Users, Plus, Pencil, Trash2, X, Save, Loader2 } from 'lucide-react';

export default function AdminBoard() {
  const [members, setMembers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [form, setForm] = useState(null);
  const [pageError, setPageError] = useState('');

  const load = () => {
    setLoading(true);
    api.listBoardMembers().then((d) => setMembers(d.members)).catch((err) => setPageError(err.message || 'Could not load board members.')).finally(() => setLoading(false));
  };
  useEffect(load, []);

  const save = async (e) => {
    e.preventDefault();
    setForm((f) => ({ ...f, saving: true }));
    setPageError('');
    try {
      if (form.id) {
        await api.updateBoardMember(form.id, { fullName: form.fullName, title: form.title, bio: form.bio, photoUrl: form.photoUrl, email: form.email, linkedin: form.linkedin, twitter: form.twitter, instagram: form.instagram, order: +form.order });
      } else {
        await api.createBoardMember({ fullName: form.fullName, title: form.title, bio: form.bio, photoUrl: form.photoUrl, email: form.email, linkedin: form.linkedin, twitter: form.twitter, instagram: form.instagram, order: +form.order });
      }
      setForm(null);
      load();
    } catch (err) {
      // 403 = President-only action denied (Task 3 RBAC backend guard).
      setPageError(err.status === 403
        ? 'Only the President can manage Board Members.'
        : (err.message || 'Could not save board member.'));
      setForm((f) => ({ ...f, saving: false }));
    }
  };

  const del = async (m) => {
    if (!confirm(`Remove ${m.fullName} from the board?`)) return;
    setPageError('');
    try {
      await api.deleteBoardMember(m.id);
      load();
    } catch (err) {
      setPageError(err.status === 403
        ? 'Only the President can manage Board Members.'
        : (err.message || 'Could not delete board member.'));
    }
  };

  if (loading) return <Spinner label="Loading board members..." />;

  return (
    <div>
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-xl font-bold text-brand-950 flex items-center gap-2"><Users className="w-5 h-5" /> Board Members ({members.length})</h2>
        <button onClick={() => setForm({ fullName: '', title: '', bio: '', photoUrl: '', email: '', linkedin: '', twitter: '', instagram: '', order: members.length + 1 })} className="btn-primary text-sm"><Plus className="w-4 h-4" /> Add member</button>
      </div>

      {pageError && <ErrorState message={pageError} />}

      {form && (
        <form onSubmit={save} className="card p-5 mb-4 border-brand-200 space-y-3">
          <div className="flex items-center justify-between">
            <h3 className="font-bold text-brand-950">{form.id ? 'Edit member' : 'New board member'}</h3>
            <button type="button" onClick={() => setForm(null)} className="btn-ghost p-1.5"><X className="w-4 h-4" /></button>
          </div>
          <div className="grid sm:grid-cols-2 gap-3">
            <div><label className="label">Full name</label><input className="input" required value={form.fullName} onChange={(e) => setForm({ ...form, fullName: e.target.value })} /></div>
            <div><label className="label">Official title</label><input className="input" required value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} /></div>
          </div>
          <div><label className="label">Short bio</label><textarea className="input" rows={3} required value={form.bio} onChange={(e) => setForm({ ...form, bio: e.target.value })} /></div>
          <div><label className="label">Photo URL <span className="text-slate-400 font-normal">(optional — leave blank for initials avatar)</span></label><input className="input" placeholder="https://..." value={form.photoUrl} onChange={(e) => setForm({ ...form, photoUrl: e.target.value })} /></div>
          <div className="grid sm:grid-cols-2 gap-3">
            <div><label className="label">Email</label><input className="input" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} /></div>
            <div><label className="label">Display order</label><input type="number" className="input" value={form.order} onChange={(e) => setForm({ ...form, order: e.target.value })} /></div>
          </div>
          <div className="grid sm:grid-cols-3 gap-3">
            <div><label className="label">LinkedIn URL</label><input className="input" value={form.linkedin} onChange={(e) => setForm({ ...form, linkedin: e.target.value })} /></div>
            <div><label className="label">Twitter URL</label><input className="input" value={form.twitter} onChange={(e) => setForm({ ...form, twitter: e.target.value })} /></div>
            <div><label className="label">Instagram URL</label><input className="input" value={form.instagram} onChange={(e) => setForm({ ...form, instagram: e.target.value })} /></div>
          </div>
          <button type="submit" disabled={form.saving} className="btn-primary">{form.saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />} Save member</button>
        </form>
      )}

      {members.length === 0 && <EmptyState icon={Users} title="No board members" description="Add the 6 board members of the club." />}

      <div className="space-y-2">
        {members.map((m) => (
          <div key={m.id} className="card p-3 flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-brand-700 text-white flex items-center justify-center font-bold flex-shrink-0">
              {m.fullName.charAt(0).toUpperCase()}
            </div>
            <div className="flex-1 min-w-0">
              <div className="font-semibold text-brand-950 text-sm">{m.fullName}</div>
              <div className="text-xs text-slate-500">{m.title} • order {m.order}</div>
            </div>
            <button onClick={() => setForm({ ...m, id: m.id })} className="btn-ghost p-2"><Pencil className="w-4 h-4" /></button>
            <button onClick={() => del(m)} className="btn-ghost p-2 text-red-600 hover:bg-red-50"><Trash2 className="w-4 h-4" /></button>
          </div>
        ))}
      </div>
    </div>
  );
}
