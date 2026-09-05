import { useEffect, useState } from 'react';
import { api } from '../../api/client.js';
import { Spinner, EmptyState } from '../../components/Common.jsx';
import { Megaphone, Plus, Trash2, X, Save, Loader2, Pin } from 'lucide-react';

export default function AdminAnnouncements() {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [form, setForm] = useState(null);

  const load = () => {
    setLoading(true);
    api.listAnnouncements().then((d) => setItems(d.announcements)).finally(() => setLoading(false));
  };
  useEffect(load, []);

  const save = async (e) => {
    e.preventDefault();
    setForm((f) => ({ ...f, saving: true }));
    try {
      await api.createAnnouncement({ title: form.title, content: form.content, category: form.category, pinned: form.pinned });
      setForm(null);
      load();
    } catch (e) { alert(e.message); setForm((f) => ({ ...f, saving: false })); }
  };

  const del = async (a) => {
    if (!confirm('Delete this announcement?')) return;
    await api.deleteAnnouncement(a.id);
    load();
  };

  if (loading) return <Spinner label="Loading announcements..." />;

  return (
    <div>
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-xl font-bold text-brand-950 flex items-center gap-2"><Megaphone className="w-5 h-5" /> Announcements ({items.length})</h2>
        <button onClick={() => setForm({ title: '', content: '', category: 'GENERAL', pinned: false })} className="btn-primary text-sm"><Plus className="w-4 h-4" /> New announcement</button>
      </div>

      {form && (
        <form onSubmit={save} className="card p-5 mb-4 border-brand-200 space-y-3">
          <div className="flex items-center justify-between">
            <h3 className="font-bold text-brand-950">New announcement</h3>
            <button type="button" onClick={() => setForm(null)} className="btn-ghost p-1.5"><X className="w-4 h-4" /></button>
          </div>
          <div><label className="label">Title</label><input className="input" required value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} /></div>
          <div><label className="label">Content</label><textarea className="input" rows={3} required value={form.content} onChange={(e) => setForm({ ...form, content: e.target.value })} /></div>
          <div className="grid sm:grid-cols-2 gap-3">
            <div><label className="label">Category</label>
              <select className="input" value={form.category} onChange={(e) => setForm({ ...form, category: e.target.value })}>
                <option value="GENERAL">General</option><option value="EVENT">Event</option><option value="GAME">Game</option><option value="COURSE">Course</option>
              </select>
            </div>
            <label className="flex items-end gap-2 text-sm pb-2">
              <input type="checkbox" checked={form.pinned} onChange={(e) => setForm({ ...form, pinned: e.target.checked })} /> Pin to top
            </label>
          </div>
          <button type="submit" disabled={form.saving} className="btn-primary">{form.saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />} Publish</button>
        </form>
      )}

      <div className="space-y-2">
        {items.map((a) => (
          <div key={a.id} className="card p-4 flex items-start justify-between gap-3">
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2">
                {a.pinned && <Pin className="w-3.5 h-3.5 text-brand-600" />}
                <h3 className="font-semibold text-brand-950 text-sm">{a.title}</h3>
                <span className="badge bg-slate-100 text-slate-600">{a.category}</span>
              </div>
              <p className="text-sm text-slate-500 mt-1 line-clamp-2">{a.content}</p>
              <p className="text-xs text-slate-400 mt-1">{new Date(a.createdAt).toLocaleString()}</p>
            </div>
            <button onClick={() => del(a)} className="btn-ghost p-2 text-red-600 hover:bg-red-50 flex-shrink-0"><Trash2 className="w-4 h-4" /></button>
          </div>
        ))}
        {items.length === 0 && <EmptyState icon={Megaphone} title="No announcements" description="Publish your first announcement." />}
      </div>
    </div>
  );
}
