import { useEffect, useState } from 'react';
import { api } from '../../api/client.js';
import { Spinner, EmptyState } from '../../components/Common.jsx';
import { Award, Plus, Trash2, X, Save, Loader2, BookOpen, Edit3 } from 'lucide-react';
import { useAuth } from '../../context/AuthContext.jsx';

export default function AdminExams() {
  const { user } = useAuth();
  const isPresident = user?.bodRole === 'PRESIDENT';
  const [courses, setCourses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [form, setForm] = useState(null);

  const load = () => {
    setLoading(true);
    api.listCourses().then(async (d) => {
      const withExams = await Promise.all(d.courses.map(async (c) => {
        const detail = await api.getCourse(c.slug);
        return detail.course;
      }));
      setCourses(withExams);
      setLoading(false);
    });
  };
  useEffect(load, []);

  const startEdit = async (ex) => {
    setLoading(true);
    try {
      const data = await api.getExam(ex.id);
      const examData = data.exam;
      setForm({
        id: examData.id,
        courseId: examData.courseId,
        title: examData.title,
        description: examData.description || '',
        passingScore: examData.passingScore,
        durationMins: examData.durationMins,
        questions: examData.questions.map((q) => {
          const opts = [...q.options];
          // Ensure there are at least 4 input fields for options
          while (opts.length < 4) opts.push('');
          return {
            text: q.text,
            options: opts,
            correctIndex: q.correctIndex !== undefined && q.correctIndex !== null ? q.correctIndex : 0,
          };
        }),
        saving: false,
      });
    } catch (e) {
      alert('Could not load exam for editing.');
    } finally {
      setLoading(false);
    }
  };

  const save = async (e) => {
    e.preventDefault();
    setForm((f) => ({ ...f, saving: true }));
    try {
      const payload = {
        courseId: form.courseId,
        title: form.title,
        description: form.description,
        passingScore: +form.passingScore,
        durationMins: +form.durationMins,
        questions: form.questions.map((q) => {
          const indexedOptions = q.options.map((opt, idx) => ({ opt, idx }));
          const validOptions = indexedOptions.filter((item) => item.opt.trim() !== '');
          const newCorrectIndex = validOptions.findIndex((item) => item.idx === q.correctIndex);

          return {
            text: q.text,
            options: validOptions.map((item) => item.opt),
            correctIndex: newCorrectIndex !== -1 ? newCorrectIndex : 0,
          };
        }).filter((q) => q.text && q.options.length >= 2),
      };

      if (form.id) {
        // If form has an ID, update the existing exam
        await api.updateExam(form.id, payload);
      } else {
        // Otherwise, create a new one
        await api.createExam(payload);
      }
      setForm(null);
      load();
    } catch (e) {
      alert(e.message);
      setForm((f) => ({ ...f, saving: false }));
    }
  };

  const del = async (exam) => {
    if (!confirm(`Delete exam "${exam.title}"?`)) return;
    await api.deleteExam(exam.id);
    load();
  };

  if (loading) return <Spinner label="Loading exams..." />;

  return (
    <div>
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-xl font-bold text-brand-950 flex items-center gap-2"><Award className="w-5 h-5" /> Exams</h2>
        <button
          onClick={() => setForm({ courseId: courses[0]?.id || '', title: '', description: '', passingScore: 70, durationMins: 20, questions: [{ text: '', options: ['', '', '', ''], correctIndex: 0 }], saving: false })}
          className="btn-primary text-sm"
          disabled={courses.length === 0}
        ><Plus className="w-4 h-4" /> New exam</button>
      </div>

      {courses.length === 0 && <EmptyState icon={BookOpen} title="Create a course first" description="Exams belong to courses." />}

      {form && (
        <form onSubmit={save} className="card p-5 mb-4 border-brand-200 space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="font-bold text-brand-950">{form.id ? 'Edit exam' : 'Create exam'}</h3>
            <button type="button" onClick={() => setForm(null)} className="btn-ghost p-1.5"><X className="w-4 h-4" /></button>
          </div>
          <div><label className="label">Course</label>
            <select className="input" value={form.courseId} onChange={(e) => setForm({ ...form, courseId: e.target.value })} required>
              {courses.map((c) => <option key={c.id} value={c.id}>{c.title}</option>)}
            </select>
          </div>
          <div><label className="label">Exam title</label><input className="input" required value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} /></div>
          <div><label className="label">Description</label><textarea className="input" rows={2} value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} /></div>
          <div className="grid grid-cols-2 gap-3">
            <div><label className="label">Passing score (%)</label><input type="number" className="input" value={form.passingScore} onChange={(e) => setForm({ ...form, passingScore: e.target.value })} /></div>
            <div><label className="label">Duration (min)</label><input type="number" className="input" value={form.durationMins} onChange={(e) => setForm({ ...form, durationMins: e.target.value })} /></div>
          </div>

          <div>
            <div className="flex items-center justify-between mb-2">
              <label className="label mb-0">Questions</label>
              <button type="button" onClick={() => setForm({ ...form, questions: [...form.questions, { text: '', options: ['', '', '', ''], correctIndex: 0 }] })} className="btn-secondary text-xs"><Plus className="w-3.5 h-3.5" /> Add question</button>
            </div>
            <div className="space-y-3">
              {form.questions.map((q, qi) => (
                <div key={qi} className="rounded-lg border border-slate-200 p-3 bg-slate-50/50">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-xs font-semibold text-slate-500">Question {qi + 1}</span>
                    {form.questions.length > 1 && (
                      <button type="button" onClick={() => setForm({ ...form, questions: form.questions.filter((_, i) => i !== qi) })} className="text-red-500"><Trash2 className="w-3.5 h-3.5" /></button>
                    )}
                  </div>
                  <input className="input mb-2" placeholder="Question text" required value={q.text} onChange={(e) => { const qs = [...form.questions]; qs[qi] = { ...q, text: e.target.value }; setForm({ ...form, questions: qs }); }} />
                  <div className="space-y-1.5">
                    {q.options.map((opt, oi) => (
                      <div key={oi} className="flex items-center gap-2">
                        <input type="radio" name={`correct-${qi}`} checked={q.correctIndex === oi} onChange={() => { const qs = [...form.questions]; qs[qi] = { ...q, correctIndex: oi }; setForm({ ...form, questions: qs }); }} />
                        <input className="input py-1.5 text-sm" placeholder={`Option ${String.fromCharCode(65 + oi)}`} value={opt} onChange={(e) => { const qs = [...form.questions]; qs[qi] = { ...q, options: q.options.map((o, i) => i === oi ? e.target.value : o) }; setForm({ ...form, questions: qs }); }} />
                      </div>
                    ))}
                  </div>
                  <p className="text-xs text-slate-400 mt-1">Select the radio button next to the correct option.</p>
                </div>
              ))}
            </div>
          </div>

          <button type="submit" disabled={form.saving} className="btn-primary">{form.saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />} {form.id ? 'Save changes' : 'Create exam'}</button>
        </form>
      )}

      <div className="space-y-3">
        {courses.map((c) => (
          c.exams.length > 0 && (
            <div key={c.id} className="card p-4">
              <div className="text-xs font-semibold text-brand-700 uppercase tracking-wide mb-2 flex items-center gap-1.5"><BookOpen className="w-3.5 h-3.5" /> {c.title}</div>
              <div className="space-y-2">
                {c.exams.map((ex) => (
                  <div key={ex.id} className="rounded-lg border border-slate-200 p-3 flex items-center justify-between gap-2">
                    <div>
                      <div className="text-sm font-medium text-brand-950">{ex.title}</div>
                      <div className="text-xs text-slate-500">{ex._count?.questions || ex.questions?.length || 0} questions • pass {ex.passingScore}% • {ex.durationMins} min</div>
                    </div>
                    <div className="flex items-center gap-1">
                      <button onClick={() => startEdit(ex)} className="btn-ghost p-1.5 text-brand-700 hover:bg-brand-50" title="Edit exam"><Edit3 className="w-4 h-4" /></button>
                      {isPresident && <button onClick={() => del(ex)} className="btn-ghost p-1.5 text-red-600 hover:bg-red-50" title="President only"><Trash2 className="w-4 h-4" /></button>}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )
        ))}
      </div>
    </div>
  );
}
