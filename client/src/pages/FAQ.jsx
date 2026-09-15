import { useEffect, useState } from 'react';
import { HelpCircle, ChevronDown, Search, Loader2, Plus, Pencil, Trash2, X, Save } from 'lucide-react';
import { api } from '../api/client.js';
import { useAuth } from '../context/AuthContext.jsx';
import { Spinner, EmptyState } from '../components/Common.jsx';

export default function FAQ() {
  const { user } = useAuth();
  const isAdmin = user?.role === 'ADMIN';
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [open, setOpen] = useState(null);
  const [search, setSearch] = useState('');
  const [activeCat, setActiveCat] = useState('All');
  const [editing, setEditing] = useState(null); // null | 'new' | faq object

  const load = () => {
    setLoading(true);
    api.listFAQ()
      .then((d) => setItems(d.faqs))
      .finally(() => setLoading(false));
  };
  useEffect(() => { load(); }, []);

  const categories = ['All', ...Array.from(new Set(items.map((f) => f.category).filter(Boolean)))];

  const filtered = items.filter((f) => {
    const matchCat = activeCat === 'All' || f.category === activeCat;
    const q = search.toLowerCase();
    const matchSearch = !search ||
      f.question.toLowerCase().includes(q) ||
      f.answer.toLowerCase().includes(q);
    return matchCat && matchSearch;
  });

  const saveFaq = async (data) => {
    try {
      if (editing === 'new') {
        await api.createFAQ(data);
      } else {
        await api.updateFAQ(editing.id, data);
      }
      setEditing(null);
      load();
    } catch (e) {
      alert(e.message);
    }
  };

  const deleteFaq = async (f) => {
    if (!confirm(`Delete FAQ "${f.question}"?`)) return;
    await api.deleteFAQ(f.id);
    load();
  };

  if (loading) return <Spinner label="Loading FAQ…" />;

  return (
    <div>
      <section className="bg-gradient-to-br from-brand-950 to-brand-800 text-white py-14">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <div className="flex items-center justify-center gap-2 text-gold-400 text-sm mb-3">
            <HelpCircle className="w-4 h-4" /> Help Center
          </div>
          <h1 className="text-3xl md:text-4xl font-extrabold">Frequently Asked Questions</h1>
          <p className="text-slate-300 mt-3 max-w-2xl mx-auto">
            Everything you need to know about Business Club membership, courses, certificates, and gamification.
          </p>
        </div>
      </section>

      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
        {/* Search + admin controls */}
        <div className="flex flex-col sm:flex-row gap-3 mb-6">
          <div className="relative flex-1">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
            <input
              type="text"
              placeholder="Search questions…"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="input pl-9"
            />
          </div>
          {isAdmin && (
            <button onClick={() => setEditing('new')} className="btn-primary">
              <Plus className="w-4 h-4" /> Add FAQ
            </button>
          )}
        </div>

        {/* Category filters */}
        {categories.length > 1 && (
          <div className="flex flex-wrap gap-2 mb-6">
            {categories.map((c) => (
              <button
                key={c}
                onClick={() => setActiveCat(c)}
                className={`px-3.5 py-1.5 rounded-lg text-sm font-medium transition ${
                  activeCat === c ? 'bg-brand-700 text-white' : 'bg-white border border-slate-200 text-slate-600 hover:bg-slate-100'
                }`}
              >
                {c}
              </button>
            ))}
          </div>
        )}

        {/* Admin edit form */}
        {editing && (
          <FAQForm faq={editing === 'new' ? null : editing} onSave={saveFaq} onCancel={() => setEditing(null)} />
        )}

        {/* FAQ items */}
        {filtered.length === 0 ? (
          <EmptyState icon={HelpCircle} title="No questions found" description={search ? 'Try a different search term.' : 'FAQs will appear here once added.'} />
        ) : (
          <div className="space-y-3">
            {filtered.map((f) => (
              <div key={f.id} className="card overflow-hidden">
                <div className="flex items-center gap-3">
                  <button
                    onClick={() => setOpen(open === f.id ? null : f.id)}
                    className="flex-1 flex items-center justify-between gap-3 p-4 text-left hover:bg-slate-50/50 transition"
                  >
                    <div className="flex items-center gap-3 min-w-0">
                      {f.category && (
                        <span className="badge bg-brand-50 text-brand-700 flex-shrink-0">{f.category}</span>
                      )}
                      <span className="font-semibold text-brand-950 text-sm md:text-base truncate">{f.question}</span>
                    </div>
                    <ChevronDown className={`w-5 h-5 text-slate-400 flex-shrink-0 transition-transform ${open === f.id ? 'rotate-180' : ''}`} />
                  </button>
                  {isAdmin && (
                    <div className="flex gap-1 pr-2">
                      <button onClick={() => setEditing(f)} className="btn-ghost p-1.5"><Pencil className="w-4 h-4" /></button>
                      <button onClick={() => deleteFaq(f)} className="btn-ghost p-1.5 text-red-600 hover:bg-red-50"><Trash2 className="w-4 h-4" /></button>
                    </div>
                  )}
                </div>
                {open === f.id && (
                  <div className="px-4 pb-4 pt-1 text-sm text-slate-600 leading-relaxed whitespace-pre-line border-t border-slate-100">
                    {f.answer}
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

function FAQForm({ faq, onSave, onCancel }) {
  const [form, setForm] = useState({
    question: faq?.question || '',
    answer: faq?.answer || '',
    category: faq?.category || 'General',
    order: faq?.order ?? 0,
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
        <div><label className="label">Category</label><input className="input" value={form.category} onChange={(e) => setForm({ ...form, category: e.target.value })} /></div>
        <div><label className="label">Display order</label><input type="number" className="input" value={form.order} onChange={(e) => setForm({ ...form, order: +e.target.value })} /></div>
      </div>
      <button type="submit" disabled={saving} className="btn-primary">{saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />} Save</button>
    </form>
  );
}
