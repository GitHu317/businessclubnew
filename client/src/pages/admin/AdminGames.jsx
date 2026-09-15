import { useEffect, useState } from 'react';
import { api } from '../../api/client.js';
import { Spinner, EmptyState } from '../../components/Common.jsx';
import { Gamepad2, Plus, Pencil, Trash2, X, Save, Loader2, ChevronDown, ChevronUp, Download, Mail, Calendar } from 'lucide-react';

function exportRegistrationsPdf(game, registrations) {
  const popup = window.open('', '_blank', 'noopener,noreferrer');
  if (!popup) {
    alert('Please allow pop-ups to export the registration list as a PDF.');
    return;
  }
  const rows = registrations.map((registration, index) => `
    <tr>
      <td>${index + 1}</td>
      <td>${escapeHtml(registration.user.fullName)}</td>
      <td>${escapeHtml(registration.user.email)}</td>
      <td>${escapeHtml(registration.user.studentId || '—')}</td>
      <td>${escapeHtml(registration.user.department || '—')}</td>
      <td>${new Date(registration.registeredAt).toLocaleDateString()}</td>
    </tr>`).join('');
  popup.document.write(`<!doctype html><html><head><title>${escapeHtml(game.title)} registrations</title><style>
    body{font-family:Arial,sans-serif;color:#172554;padding:28px}h1{margin:0 0 6px;font-size:22px}p{color:#64748b;margin:0 0 20px}table{border-collapse:collapse;width:100%;font-size:12px}th,td{border:1px solid #cbd5e1;padding:8px;text-align:left}th{background:#e2e8f0;color:#172554} @media print{button{display:none}}
  </style></head><body><h1>${escapeHtml(game.title)} — Registered Students</h1><p>${registrations.length} registered student${registrations.length === 1 ? '' : 's'} • Exported ${new Date().toLocaleDateString()}</p><table><thead><tr><th>#</th><th>Name</th><th>Email</th><th>Student ID</th><th>Department</th><th>Registered</th></tr></thead><tbody>${rows || '<tr><td colspan="6">No registered students.</td></tr>'}</tbody></table><script>window.onload=function(){window.print();}</script></body></html>`);
  popup.document.close();
}

function escapeHtml(value) {
  return String(value).replace(/[&<>'"]/g, (character) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', "'": '&#39;', '"': '&quot;' }[character]));
}

export default function AdminGames() {
  const [games, setGames] = useState([]);
  const [loading, setLoading] = useState(true);
  const [form, setForm] = useState(null);
  const [expandedGameId, setExpandedGameId] = useState(null);
  const [registrations, setRegistrations] = useState({});
  const [loadingRegistrations, setLoadingRegistrations] = useState({});
  const [registrationErrors, setRegistrationErrors] = useState({});

  const load = () => {
    setLoading(true);
    api.listGames().then((d) => setGames(d.games)).finally(() => setLoading(false));
  };
  useEffect(load, []);

  const toggleRegistrations = async (game) => {
    if (expandedGameId === game.id) {
      setExpandedGameId(null);
      return;
    }
    setExpandedGameId(game.id);
    if (registrations[game.id]) return;
    setLoadingRegistrations((state) => ({ ...state, [game.id]: true }));
    setRegistrationErrors((state) => ({ ...state, [game.id]: '' }));
    try {
      const data = await api.gameRegistrations(game.id);
      setRegistrations((state) => ({ ...state, [game.id]: data.registrations || [] }));
    } catch (error) {
      setRegistrationErrors((state) => ({ ...state, [game.id]: error.message }));
    } finally {
      setLoadingRegistrations((state) => ({ ...state, [game.id]: false }));
    }
  };

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
            <div><label className="label">Type</label><select className="input" value={form.type} onChange={(e) => setForm({ ...form, type: e.target.value })}><option value="SIMULATION">Simulation</option><option value="COMPETITION">Competition</option><option value="CASE_CHALLENGE">Case Challenge</option></select></div>
            <div><label className="label">Status</label><select className="input" value={form.status} onChange={(e) => setForm({ ...form, status: e.target.value })}><option value="UPCOMING">Upcoming</option><option value="ONGOING">Ongoing</option><option value="COMPLETED">Completed</option></select></div>
          </div>
          <div><label className="label">Schedule</label><input className="input" required value={form.schedule} onChange={(e) => setForm({ ...form, schedule: e.target.value })} /></div>
          <div><label className="label">Rules</label><textarea className="input" rows={4} required value={form.rules} onChange={(e) => setForm({ ...form, rules: e.target.value })} /></div>
          <div><label className="label">Announcement <span className="text-slate-400 font-normal">(optional)</span></label><input className="input" value={form.announcement} onChange={(e) => setForm({ ...form, announcement: e.target.value })} /></div>
          <div className="grid sm:grid-cols-2 gap-3">
            <div><label className="label">Start date <span className="text-slate-400 font-normal">(optional)</span></label><input type="datetime-local" className="input" value={form.startDate} onChange={(e) => setForm({ ...form, startDate: e.target.value })} /></div>
            <div><label className="label">End date <span className="text-slate-400 font-normal">(optional)</span></label><input type="datetime-local" className="input" value={form.endDate} onChange={(e) => setForm({ ...form, endDate: e.target.value })} /></div>
          </div>
          <label className="flex items-center gap-2 text-sm"><input type="checkbox" checked={form.registrationOpen} onChange={(e) => setForm({ ...form, registrationOpen: e.target.checked })} /> Registration open</label>
          <button type="submit" disabled={form.saving} className="btn-primary">{form.saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />} Save game</button>
        </form>
      )}

      <div className="space-y-3">
        {games.map((g) => {
          const isExpanded = expandedGameId === g.id;
          const gameRegistrations = registrations[g.id] || [];
          return (
            <div key={g.id} className="card overflow-hidden">
              <div className="p-3 flex items-center gap-3">
                <div className="w-10 h-10 rounded-lg bg-purple-50 text-purple-700 flex items-center justify-center flex-shrink-0"><Gamepad2 className="w-5 h-5" /></div>
                <div className="flex-1 min-w-0"><div className="font-semibold text-brand-950 text-sm truncate">{g.title}</div><div className="text-xs text-slate-500">{g.type.replace('_', ' ')} • {g.status} • {g.registrationOpen ? 'Open' : 'Closed'}</div></div>
                <button type="button" onClick={() => toggleRegistrations(g)} className="btn-secondary text-xs" aria-expanded={isExpanded}>{isExpanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />} Registered students</button>
                <button type="button" onClick={() => setForm({ ...g, id: g.id, startDate: g.startDate ? g.startDate.slice(0, 16) : '', endDate: g.endDate ? g.endDate.slice(0, 16) : '' })} className="btn-ghost p-2"><Pencil className="w-4 h-4" /></button>
                <button type="button" onClick={() => del(g)} className="btn-ghost p-2 text-red-600 hover:bg-red-50"><Trash2 className="w-4 h-4" /></button>
              </div>
              {isExpanded && <div className="border-t border-slate-100 bg-slate-50/60 p-4">
                {loadingRegistrations[g.id] ? <Spinner label="Loading registered students..." /> : registrationErrors[g.id] ? <p className="text-sm text-red-600">{registrationErrors[g.id]}</p> : <>
                  <div className="flex items-center justify-between gap-3 mb-3"><p className="text-sm font-semibold text-brand-950">{gameRegistrations.length} registered student{gameRegistrations.length === 1 ? '' : 's'}</p><button type="button" className="btn-primary text-xs" onClick={() => exportRegistrationsPdf(g, gameRegistrations)}><Download className="w-4 h-4" /> Export PDF</button></div>
                  {gameRegistrations.length === 0 ? <p className="text-sm text-slate-500 py-3">No students have registered for this game yet.</p> : <div className="overflow-x-auto rounded-lg border border-slate-200 bg-white"><table className="w-full text-left text-sm"><thead className="bg-slate-100 text-xs uppercase text-slate-500"><tr><th className="px-3 py-2">#</th><th className="px-3 py-2">Name</th><th className="px-3 py-2">Email</th><th className="px-3 py-2">Student ID</th><th className="px-3 py-2">Department</th><th className="px-3 py-2">Registered</th></tr></thead><tbody className="divide-y divide-slate-100">{gameRegistrations.map((registration, index) => <tr key={registration.id}><td className="px-3 py-2 text-slate-500">{index + 1}</td><td className="px-3 py-2 font-medium text-brand-950">{registration.user.fullName}</td><td className="px-3 py-2"><span className="inline-flex items-center gap-1"><Mail className="w-3 h-3 text-slate-400" />{registration.user.email}</span></td><td className="px-3 py-2">{registration.user.studentId || '—'}</td><td className="px-3 py-2">{registration.user.department || '—'}</td><td className="px-3 py-2 whitespace-nowrap"><span className="inline-flex items-center gap-1"><Calendar className="w-3 h-3 text-slate-400" />{new Date(registration.registeredAt).toLocaleDateString()}</span></td></tr>)}</tbody></table></div>}
                </>}
              </div>}
            </div>
          );
        })}
        {games.length === 0 && <EmptyState icon={Gamepad2} title="No games yet" description="Schedule your first business game." />}
      </div>
    </div>
  );
}
