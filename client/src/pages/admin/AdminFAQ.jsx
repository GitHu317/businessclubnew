import { useEffect, useState } from 'react';
import { api } from '../../api/client.js';
import { Spinner, EmptyState } from '../../components/Common.jsx';
import { HelpCircle, Plus, Pencil, Trash2, X, Save, Loader2, Search } from 'lucide-react';

export default function AdminFAQ() {
  const [faqs, setFaqs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState(null); // faq object or 'new'
  const [search, setSearch] = useState('');

  const load = () => {
    setLoading(true);
    api.listFAQ().then((d) => setFaqs(d.faqs || [])).finally(() => setLoading(false));
  };
  useEffect(() => { load(); }, []);

  const save = async (data) => {
    try {
      if (editing === 'new') {
        await api.createFAQ(data);
      } else {
        await api.updateFAQ(editing.id, data);
      }
      setEditing(null);
      load();
    } catch (err) {
      alert(err.message);
    }
  };

  const del = async (f) => {
    if (!confirm(`Delete FAQ "${f.question}"?`)) return;
    try {
      await api.deleteFAQ(f.id);
      load();
    } catch (err) { alert(err.message); }
  };

  if (loading) return <Spinner label="Loading FAQ..." />;

  const filtered = search
    ? faqs.filter((f) => f.question?.toLowerCase().includes(search.toLowerCase()) || f.answer?.toLowerCase().includes(search.toLowerCase()))
    : faqs;

  const categories = [...new Set(faqs.map((f) => f.category).filter(Boolean))];

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h2 className="text-xl font-bold text-brand-950 flex items-center gap-2"><HelpCircle className="w-5 h-5" /> FAQ Management</h2>
          <p className="text-sm text-slate-500 mt-0.5">Manage the dynamic FAQ section visible to all users.</p>
        </div>
        <button onClick={() => setEditing('new')} className="btn-primary text-sm"><Plus className="w-4 h-4" /> New FAQ</button>
      </div>

      {editing && <FAQForm faq={editing === 'new' ? null : editing} categories={categories} onSave={save} onCancel={() => setEditing(null)} />}

      {!editing && (
        <>
          <div className="relative">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
            <input type="text" placeholder="Search FAQ..." value={search} onChange={(e) => setSearch(e.target.value)} className="input pl-9" />
          </div>

          {filtered.length === 0 ? (
            <EmptyState icon={HelpCircle} title="No FAQ entries" description="Create your first FAQ entry." />
          ) : (
            <div className="space-y-2">
              {filtered.map((f) => (
                <div key={f.id} className="card p-4">
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        {f.category && <span className="text-[10px] font-bold text-brand-700 bg-brand-50 rounded px-1.5 py-0.5">{f.category}</span>}
                        <span className="text-[10px] text-slate-400">Order: {f.order}</span>
                      </div>
                      <div className="font-semibold text-brand-950 text-sm">{f.question}</div>
                      <p className="text-sm text-slate-600 mt-1 line-clamp-2">{f.answer}</p>
                    </div>
                    <div className="flex gap-1 flex-shrink-0">
                      <button onClick={() => setEditing(f)} className="btn-ghost p-2"><Pencil className="w-4 h-4" /></button>
                      <button onClick={() => del(f)} className="btn-ghost p-2 text-red-600 hover:bg-red-50"><Trash2 className="w-4 h-4" /></button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </>
      )}
    </div>
  );
}

function FAQForm({ faq, categories, onSave, onCancel }) {
  const [form, setForm] = useState({
    question: faq?.question || '',
    answer: faq?.answer || '',
    category: faq?.category || '',
    order: faq?.order || 0,
  });
  const [saving, setSaving] = useState(false);

  const submit = async (e) => {
    e.preventDefault();
    setSaving(true);
    try { await onSave(form); } catch (e) { alert(e.message); } finally { setSaving(false); }
  };

  return (
    <form onSubmit={submit} className="card p-5 mb-4 border-brand-200 space-y-3">
      <div className="flex items-center justify-between">
        <h3 className="font-bold text-brand-950">{faq ? 'Edit FAQ' : 'New FAQ'}</h3>
        <button type="button" onClick={onCancel} className="btn-ghost p-1.5"><X className="w-4 h-4" /></button>
      </div>
      <div><label className="label">Question</label><input className="input" required value={form.question} onChange={(e) => setForm({ ...form, question: e.target.value })} /></div>
      <div><label className="label">Answer</label><textarea className="input" rows={4} required value={form.answer} onChange={(e) => setForm({ ...form, answer: e.target.value })} /></div>
      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="label">Category</label>
          <input className="input" list="faq-categories" value={form.category} onChange={(e) => setForm({ ...form, category: e.target.value })} placeholder="e.g. General, Courses" />
          <datalist id="faq-categories">
            {categories.map((c) => <option key={c} value={c} />)}
          </datalist>
        </div>
        <div><label className="label">Display Order</label><input type="number" className="input" value={form.order} onChange={(e) => setForm({ ...form, order: +e.target.value })} /></div>
      </div>
      <div className="flex gap-2">
        <button type="submit" disabled={saving} className="btn-primary">{saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />} Save</button>
        <button type="button" onClick={onCancel} className="btn-secondary">Cancel</button>
      </div>
    </form>
  );
}
