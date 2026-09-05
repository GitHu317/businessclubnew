import { useEffect, useState } from 'react';
import { api } from '../../api/client.js';
import { Spinner, EmptyState } from '../../components/Common.jsx';
import { Gamepad2, Plus, Pencil, Trash2, X, Save, Loader2 } from 'lucide-react';

export default function AdminGames() {
  const [games, setGames] = useState([]);
  const [loading, setLoading] = useState(true);
  const [form, setForm] = useState(null);

  const load = () => {
    setLoading(true);
    api.listGames().then((d) => setGames(d.games)).finally(() => setLoading(false));
  };
  useEffect(load, []);

  const save = async (e) => {
    e.preventDefault();
    setForm((f) => ({ ...f, saving: true }));
    try {
      const data = {
        title: form.title, description: form.description, type: form.type,
        rules: form.rules, schedule: form.schedule, status: form.status,
        registrationOpen: form.registrationOpen, announcement: form.announcement,
        startDate: form.startDate || null, endDate: form.endDate || null,
      };
      if (form.id) await api.updateGame(form.id, data);
      else await api.createGame(data);
      setForm(null);
      load();
    } catch (e) { alert(e.message); setForm((f) => ({ ...f, saving: false })); }
  };

  const del = async (g) => {
    if (!confirm(`Delete game "${g.title}"?`)) return;
    await api.deleteGame(g.id);
    load();
  };

  if (loading) return <Spinner label="Loading games..." />;

  return (
    <div>
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-xl font-bold text-brand-950 flex items-center gap-2"><Gamepad2 className="w-5 h-5" /> Business Games ({games.length})</h2>
        <button onClick={() => setForm({ title: '', description: '', type: 'SIMULATION', rules: '', schedule: '', status: 'UPCOMING', registrationOpen: true, announcement: '', startDate: '', endDate: '' })} className="btn-primary text-sm"><Plus className="w-4 h-4" /> New game</button>
      </div>

      {form && (
        <form onSubmit={save} className="card p-5 mb-4 border-brand-200 space-y-3">
          <div className="flex items-center justify-between">
            <h3 className="font-bold text-brand-950">{form.id ? 'Edit game' : 'New business game'}</h3>
            <button type="button" onClick={() => setForm(null)} className="btn-ghost p-1.5"><X className="w-4 h-4" /></button>
          </div>
          <div><label className="label">Title</label><input className="input" required value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} /></div>
          <div><label className="label">Description</label><textarea className="input" rows={2} required value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} /></div>
          <div className="grid sm:grid-cols-2 gap-3">
            <div><label className="label">Type</label>
              <select className="input" value={form.type} onChange={(e) => setForm({ ...form, type: e.target.value })}>
                <option value="SIMULATION">Simulation</option><option value="COMPETITION">Competition</option><option value="CASE_CHALLENGE">Case Challenge</option>
              </select>
            </div>
            <div><label className="label">Status</label>
              <select className="input" value={form.status} onChange={(e) => setForm({ ...form, status: e.target.value })}>
                <option value="UPCOMING">Upcoming</option><option value="ONGOING">Ongoing</option><option value="COMPLETED">Completed</option>
              </select>
            </div>
          </div>
          <div><label className="label">Schedule</label><input className="input" required value={form.schedule} onChange={(e) => setForm({ ...form, schedule: e.target.value })} /></div>
          <div><label className="label">Rules</label><textarea className="input" rows={4} required value={form.rules} onChange={(e) => setForm({ ...form, rules: e.target.value })} /></div>
          <div><label className="label">Announcement <span className="text-slate-400 font-normal">(optional)</span></label><input className="input" value={form.announcement} onChange={(e) => setForm({ ...form, announcement: e.target.value })} /></div>
          <div className="grid sm:grid-cols-2 gap-3">
            <div><label className="label">Start date <span className="text-slate-400 font-normal">(optional)</span></label><input type="datetime-local" className="input" value={form.startDate} onChange={(e) => setForm({ ...form, startDate: e.target.value })} /></div>
            <div><label className="label">End date <span className="text-slate-400 font-normal">(optional)</span></label><input type="datetime-local" className="input" value={form.endDate} onChange={(e) => setForm({ ...form, endDate: e.target.value })} /></div>
          </div>
          <label className="flex items-center gap-2 text-sm">
            <input type="checkbox" checked={form.registrationOpen} onChange={(e) => setForm({ ...form, registrationOpen: e.target.checked })} /> Registration open
          </label>
          <button type="submit" disabled={form.saving} className="btn-primary">{form.saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />} Save game</button>
        </form>
      )}

      <div className="space-y-2">
        {games.map((g) => (
          <div key={g.id} className="card p-3 flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-purple-50 text-purple-700 flex items-center justify-center flex-shrink-0"><Gamepad2 className="w-5 h-5" /></div>
            <div className="flex-1 min-w-0">
              <div className="font-semibold text-brand-950 text-sm truncate">{g.title}</div>
              <div className="text-xs text-slate-500">{g.type.replace('_', ' ')} • {g.status} • {g.registrationOpen ? 'Open' : 'Closed'}</div>
            </div>
            <button onClick={() => setForm({ ...g, id: g.id, startDate: g.startDate ? g.startDate.slice(0, 16) : '', endDate: g.endDate ? g.endDate.slice(0, 16) : '' })} className="btn-ghost p-2"><Pencil className="w-4 h-4" /></button>
            <button onClick={() => del(g)} className="btn-ghost p-2 text-red-600 hover:bg-red-50"><Trash2 className="w-4 h-4" /></button>
          </div>
        ))}
        {games.length === 0 && <EmptyState icon={Gamepad2} title="No games yet" description="Schedule your first business game." />}
      </div>
    </div>
  );
}
