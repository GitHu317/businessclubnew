import { useEffect, useState } from 'react';
import { useAuth } from '../../context/AuthContext.jsx';
import { api } from '../../api/client.js';
import { Spinner, EmptyState } from '../../components/Common.jsx';
import {
  BookOpen, Plus, Pencil, Trash2, X, Save, Loader2, ChevronDown, ChevronRight,
  FileText, Video, Image, FileCheck, ListChecks, ArrowUp, ArrowDown, Tag, Lock, GripVertical,
} from 'lucide-react';

export default function AdminCourses() {
  const { user } = useAuth();
  const isAdmin = user?.role === 'ADMIN';
  const isPresident = user?.bodRole === 'PRESIDENT';

  const [courses, setCourses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState(null); // course being edited or 'new'
  const [expanded, setExpanded] = useState(null);

  const load = () => {
    setLoading(true);
    api.listCourses().then((d) => setCourses(d.courses)).finally(() => setLoading(false));
  };
  useEffect(() => { load(); }, []);

  const saveCourse = async (data) => {
    if (editing === 'new') {
      await api.createCourse(data);
    } else {
      await api.updateCourse(editing.id, data);
    }
    setEditing(null);
    load();
  };

  const deleteCourse = async (c) => {
    if (!confirm(`Delete course "${c.title}"? This removes all lessons, exams, and certificates.`)) return;
    await api.deleteCourse(c.id);
    load();
  };

  if (loading) return <Spinner label="Loading courses..." />;

  return (
    <div>
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-xl font-bold text-brand-950 flex items-center gap-2"><BookOpen className="w-5 h-5" /> Courses</h2>
        <button onClick={() => setEditing('new')} className="btn-primary text-sm"><Plus className="w-4 h-4" /> New course</button>
      </div>

      {editing && <CourseForm course={editing === 'new' ? null : editing} allCourses={courses} onSave={saveCourse} onCancel={() => setEditing(null)} />}

      {!editing && courses.length === 0 && (
        <EmptyState icon={BookOpen} title="No courses yet" description="Create your first course." />
      )}

      <div className="space-y-3">
        {courses.map((c) => (
          <div key={c.id} className="card">
            <div className="p-4 flex items-center justify-between gap-3">
              <button onClick={() => setExpanded(expanded === c.id ? null : c.id)} className="flex items-center gap-2 text-left flex-1 min-w-0">
                {expanded === c.id ? <ChevronDown className="w-4 h-4 text-slate-400" /> : <ChevronRight className="w-4 h-4 text-slate-400" />}
                <div className="min-w-0">
                  <div className="font-semibold text-brand-950 truncate flex items-center gap-2">
                    {c.title}
                    {c.cardOrder > 0 && <span className="text-[10px] text-slate-400">#{c.cardOrder}</span>}
                    {c.prerequisite && <span className="text-[10px] text-amber-600 flex items-center gap-0.5"><Lock className="w-2.5 h-2.5" /> requires {c.prerequisite.title}</span>}
                  </div>
                  <div className="text-xs text-slate-500">{c.category} • {c.level} • {c._count?.lessons || 0} lessons • {c._count?.exams || 0} exams</div>
                  {c.tags && c.tags.length > 0 && (
                    <div className="flex flex-wrap gap-1 mt-1">
                      {c.tags.map((t) => <span key={t} className="text-[10px] bg-brand-50 text-brand-600 rounded px-1.5 py-0.5">#{t}</span>)}
                    </div>
                  )}
                </div>
            </button>
              
              {(isAdmin || user?.creatorProfile?.id === c.creatorId) && (
                <div className="flex gap-1">
                  <button onClick={() => setEditing(c)} className="btn-ghost p-2"><Pencil className="w-4 h-4" /></button>
                  {isPresident && <button onClick={() => deleteCourse(c)} className="btn-ghost p-2 text-red-600 hover:bg-red-50" title="President only"><Trash2 className="w-4 h-4" /></button>}
                </div>
              )}
            </div>

            {expanded === c.id && (
              <div className="border-t border-slate-100 p-4 bg-slate-50/50">
                <LessonManager courseId={c.id} slug={c.slug} />
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}

function CourseForm({ course, allCourses, onSave, onCancel }) {
  const [form, setForm] = useState({
    title: course?.title || '',
    description: course?.description || '',
    category: course?.category || 'Entrepreneurship',
    level: course?.level || 'Beginner',
    published: course?.published ?? true,
    tags: course?.tags?.join(', ') || '',
    cardOrder: course?.cardOrder ?? (allCourses.reduce((max, item) => Math.max(max, Number(item.cardOrder) || 0), 0) + 1),
    prerequisiteId: course?.prerequisiteId || '',
    thumbnailUrl: course?.thumbnailUrl || '',
  });
  const [saving, setSaving] = useState(false);


  const submit = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      const tags = form.tags.split(',').map((t) => t.trim().replace(/^#/, '')).filter(Boolean);
      await onSave({
        ...form,
        tags,
        cardOrder: +form.cardOrder,
        prerequisiteId: form.prerequisiteId || null,
      });
    } catch (e) { alert(e.message); } finally { setSaving(false); }
  };

  // Other courses (excluding self) as prerequisite options
  const prereqOptions = allCourses.filter((c) => c.id !== course?.id);

  return (
    <form onSubmit={submit} className="card p-5 mb-4 border-brand-200">
      <div className="flex items-center justify-between mb-3">
        <h3 className="font-bold text-brand-950">{course ? 'Edit course' : 'New course'}</h3>
        <button type="button" onClick={onCancel} className="btn-ghost p-1.5"><X className="w-4 h-4" /></button>
      </div>
      <div className="space-y-3">
        <div><label className="label">Title</label><input className="input" required value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} /></div>
        <div><label className="label">Description</label><textarea className="input" rows={3} required value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} /></div>
        <div>
          <label className="label">Thumbnail URL (optional)</label>
          <input className="input" placeholder="https://..." value={form.thumbnailUrl} onChange={(e) => setForm({ ...form, thumbnailUrl: e.target.value })} />
        </div>
        {form.thumbnailUrl && (
          <div className="mt-2">
            <p className="text-xs text-slate-500 mb-1">Preview:</p>
            <img src={form.thumbnailUrl} alt="Course Thumbnail" className="w-32 h-32 object-cover rounded-md border border-slate-200" />
          </div>
        )}
        <div className="grid grid-cols-2 gap-3">
          <div><label className="label">Category</label><input className="input" value={form.category} onChange={(e) => setForm({ ...form, category: e.target.value })} /></div>
          <div>
            <label className="label">Level</label>
            <select className="input" value={form.level} onChange={(e) => setForm({ ...form, level: e.target.value })}>
              <option>Beginner</option><option>Intermediate</option><option>Advanced</option>
            </select>
          </div>
        </div>
        {/* Tags (dynamic) */}
        <div>
          <label className="label flex items-center gap-1"><Tag className="w-3.5 h-3.5" /> Tags (comma-separated, e.g. business, free, marketing)</label>
          <input className="input" placeholder="business, free, marketing" value={form.tags} onChange={(e) => setForm({ ...form, tags: e.target.value })} />
          <p className="text-xs text-slate-400 mt-1">Tags auto-update the filter options on the course catalog. Use the # prefix or plain text.</p>
        </div>
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="label">Card Order (catalog position)</label>
            <input type="number" className="input" value={form.cardOrder} onChange={(e) => setForm({ ...form, cardOrder: e.target.value })} />
            <p className="text-xs text-slate-400 mt-1">Lower numbers appear first.</p>
          </div>
          <div>
            <label className="label flex items-center gap-1"><Lock className="w-3.5 h-3.5" /> Prerequisite Course (optional)</label>
            <select className="input" value={form.prerequisiteId} onChange={(e) => setForm({ ...form, prerequisiteId: e.target.value })}>
              <option value="">None (open access)</option>
              {prereqOptions.map((c) => <option key={c.id} value={c.id}>{c.title}</option>)}
            </select>
            <p className="text-xs text-slate-400 mt-1">Students must complete &amp; earn a certificate for the prerequisite before enrolling.</p>
          </div>
        </div>
        <label className="flex items-center gap-2 text-sm">
          <input type="checkbox" checked={form.published} onChange={(e) => setForm({ ...form, published: e.target.checked })} />
          Published (visible to students)
        </label>
      </div>
      <div className="flex gap-2 mt-4">
        <button type="submit" disabled={saving} className="btn-primary">{saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />} Save</button>
        <button type="button" onClick={onCancel} className="btn-secondary">Cancel</button>
      </div>
    </form>
  );
}

function LessonManager({ courseId, slug }) {
  const [course, setCourse] = useState(null);
  const [form, setForm] = useState(null);
  const [editLesson, setEditLesson] = useState(null); // lesson being edited
  const [saving, setSaving] = useState(false);

  const load = () => api.getCourse(slug).then((d) => setCourse(d.course));
  useEffect(() => { load(); }, [slug]);

  const save = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      const payload = buildLessonPayload(form);
      if (editLesson) {
        await api.updateLesson(courseId, editLesson.id, payload);
        setEditLesson(null);
      } else {
        await api.createLesson(courseId, payload);
      }
      setForm(null);
      load();
    } catch (e) { alert(e.message); } finally { setSaving(false); }
  };

  const del = async (l) => {
    if (!confirm(`Delete lesson "${l.title}"?`)) return;
    await api.deleteLesson(courseId, l.id);
    load();
  };

  const move = async (l, dir) => {
    const lessons = [...course.lessons].sort((a, b) => a.order - b.order);
    const idx = lessons.findIndex((x) => x.id === l.id);
    const swapIdx = idx + dir;
    if (swapIdx < 0 || swapIdx >= lessons.length) return;
    [lessons[idx], lessons[swapIdx]] = [lessons[swapIdx], lessons[idx]];
    await api.reorderLessons(courseId, lessons.map((x) => x.id));
    load();
  };

  if (!course) return <Spinner label="Loading lessons..." />;

  const sorted = [...course.lessons].sort((a, b) => a.order - b.order);

  const blankLesson = () => ({
    title: '', content: '', videoUrl: '', durationMins: 10, order: sorted.length + 1,
    media: [], quiz: { title: 'Quick Check', questions: [] },
  });

  const startEdit = (l) => {
    setForm({
      title: l.title,
      content: l.content || '',
      videoUrl: l.videoUrl || '',
      durationMins: l.durationMins,
      order: l.order,
      media: (l.media || []).filter((m) => String(m.type).toLowerCase() !== 'project').map((m) => ({ type: m.type, url: m.url, filename: m.filename || '', caption: m.caption || '' })),
      quiz: l.quiz ? {
        title: l.quiz.title || 'Quick Check',
        questions: (l.quiz.questions || []).map((q) => ({
          text: q.text, type: q.type || 'MCQ',
          options: q.type === 'MCQ' ? (typeof q.options === 'string' ? JSON.parse(q.options || '[]') : q.options || []) : [],
          correctIndex: q.correctIndex ?? 0,
          answer: q.answer || '',
        })),
      } : { title: 'Quick Check', questions: [] },
    });
    setEditLesson(l);
  };

  return (
    <div>
      <div className="flex items-center justify-between mb-3">
        <h4 className="font-semibold text-brand-950 text-sm flex items-center gap-1.5"><FileText className="w-4 h-4" /> Lessons ({sorted.length})</h4>
        <button onClick={() => { setEditLesson(null); setForm(blankLesson()); }} className="btn-secondary text-xs"><Plus className="w-3.5 h-3.5" /> Add lesson</button>
      </div>

      {form && (
        <LessonForm
          form={form}
          setForm={setForm}
          isEdit={!!editLesson}
          saving={saving}
          onSubmit={save}
          onCancel={() => { setForm(null); setEditLesson(null); }}
        />
      )}

      <div className="space-y-2">
        {sorted.map((l, i) => (
          <div key={l.id} className="bg-white rounded-lg border border-slate-200 p-3 flex items-center justify-between gap-2">
            <div className="flex items-center gap-2 min-w-0">
              <GripVertical className="w-4 h-4 text-slate-300 flex-shrink-0" />
              <div className="min-w-0">
                <div className="text-sm font-medium text-brand-950 truncate flex items-center gap-1.5">
                  {l.title}
                  {l.videoUrl && <Video className="w-3 h-3 text-brand-600" />}
                  {l.media?.length > 0 && <Image className="w-3 h-3 text-purple-600" />}
                  {l.quiz && <ListChecks className="w-3 h-3 text-emerald-600" />}
                </div>
                <div className="text-xs text-slate-400">{l.durationMins} min • order {l.order}</div>
              </div>
            </div>
            <div className="flex items-center gap-0.5 flex-shrink-0">
              <button onClick={() => move(l, -1)} disabled={i === 0} className="btn-ghost p-1.5 disabled:opacity-30" title="Move up"><ArrowUp className="w-3.5 h-3.5" /></button>
              <button onClick={() => move(l, 1)} disabled={i === sorted.length - 1} className="btn-ghost p-1.5 disabled:opacity-30" title="Move down"><ArrowDown className="w-3.5 h-3.5" /></button>
              <button onClick={() => startEdit(l)} className="btn-ghost p-1.5" title="Edit"><Pencil className="w-3.5 h-3.5" /></button>
              <button onClick={() => del(l)} className="btn-ghost p-1.5 text-red-600 hover:bg-red-50" title="Delete"><Trash2 className="w-3.5 h-3.5" /></button>
            </div>
          </div>
        ))}
        {sorted.length === 0 && <p className="text-sm text-slate-400">No lessons yet.</p>}
      </div>
    </div>
  );
}

/* Build the API payload from the form state */
function buildLessonPayload(form) {
  return {
    title: form.title,
    content: form.content,
    videoUrl: form.videoUrl || null,
    durationMins: +form.durationMins,
    order: +form.order,
    media: (form.media || []).filter((m) => m.url).map((m, i) => ({ ...m, order: i + 1 })),
    quiz: form.quiz && form.quiz.questions && form.quiz.questions.length
      ? {
          title: form.quiz.title || 'Quick Check',
          questions: form.quiz.questions.filter((q) => q.text).map((q) => ({
            text: q.text,
            type: q.type || 'MCQ',
            options: q.type === 'MCQ' ? (q.options || []).filter(Boolean) : [],
            correctIndex: q.type === 'MCQ' ? (q.correctIndex || 0) : undefined,
            answer: q.type !== 'MCQ' ? q.answer : undefined,
          })),
        }
      : null,
  };
}

/* ---- Rich Lesson Form with media + embedded quiz ---- */
function LessonForm({ form, setForm, isEdit, saving, onSubmit, onCancel }) {
  const addMedia = () => setForm({ ...form, media: [...form.media, { type: 'IMAGE', url: '', caption: '' }] });
  const updateMedia = (i, field, val) => setForm({ ...form, media: form.media.map((m, xi) => xi === i ? { ...m, [field]: val } : m) });
  const removeMedia = (i) => setForm({ ...form, media: form.media.filter((_, xi) => xi !== i) });
  const addQuestion = () => setForm({ ...form, quiz: { ...form.quiz, questions: [...form.quiz.questions, { text: '', type: 'MCQ', options: ['', '', '', ''], correctIndex: 0, answer: '' }] } });
  const updateQuestion = (i, field, val) => setForm({ ...form, quiz: { ...form.quiz, questions: form.quiz.questions.map((q, xi) => xi === i ? { ...q, [field]: val } : q) } });
  const updateOption = (qi, oi, val) => setForm({ ...form, quiz: { ...form.quiz, questions: form.quiz.questions.map((q, xi) => xi === qi ? { ...q, options: q.options.map((o, xoi) => xoi === oi ? val : o) } : q) } });
  const removeQuestion = (i) => setForm({ ...form, quiz: { ...form.quiz, questions: form.quiz.questions.filter((_, xi) => xi !== i) } });

  return (
    <form onSubmit={onSubmit} className="bg-white rounded-lg border border-brand-200 p-4 mb-3 space-y-4">
      <div className="flex justify-between items-center">
        <span className="font-medium text-sm flex items-center gap-1.5"><FileText className="w-4 h-4 text-brand-600" /> {isEdit ? 'Edit lesson' : 'New lesson'}</span>
        <button type="button" onClick={onCancel} className="text-slate-400"><X className="w-4 h-4" /></button>
      </div>

      {/* Basic fields */}
      <div><label className="label">Title</label><input className="input" required value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} /></div>
      <div><label className="label">Content (Markdown supported)</label><textarea className="input font-mono text-sm" rows={5} required value={form.content} onChange={(e) => setForm({ ...form, content: e.target.value })} /></div>
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        <div><label className="label">Video URL</label><input className="input" placeholder="YouTube/Vimeo/MP4 URL" value={form.videoUrl} onChange={(e) => setForm({ ...form, videoUrl: e.target.value })} /></div>
        <div><label className="label">Duration (min)</label><input type="number" className="input" value={form.durationMins} onChange={(e) => setForm({ ...form, durationMins: e.target.value })} /></div>
        <div><label className="label">Order</label><input type="number" className="input" value={form.order} onChange={(e) => setForm({ ...form, order: e.target.value })} /></div>
      </div>

      {/* Media attachments */}
      <div>
        <div className="flex items-center justify-between mb-2">
          <label className="label mb-0 flex items-center gap-1"><Image className="w-3.5 h-3.5" /> Media Attachments</label>
          <button type="button" onClick={addMedia} className="btn-secondary text-xs"><Plus className="w-3 h-3" /> Add media</button>
        </div>
        {form.media.length === 0 && <p className="text-xs text-slate-400">Add images, PDFs, or document links to this lesson.</p>}
        <div className="space-y-2">
          {form.media.map((m, i) => (
            <div key={i} className="flex gap-2 items-start rounded-lg border border-slate-200 p-2">
              <select className="input py-1.5 text-xs w-28" value={m.type} onChange={(e) => updateMedia(i, 'type', e.target.value)}>
                <option value="IMAGE">Image</option>
                <option value="PDF">PDF Doc</option>
                <option value="DOCUMENT">Document</option>
                <option value="LINK">Link</option>
              </select>
              <input className="input py-1.5 text-xs flex-1" placeholder="URL" value={m.url} onChange={(e) => updateMedia(i, 'url', e.target.value)} />
              <input className="input py-1.5 text-xs flex-1" placeholder="Caption (optional)" value={m.caption} onChange={(e) => updateMedia(i, 'caption', e.target.value)} />
              <button type="button" onClick={() => removeMedia(i)} className="text-red-500 p-1"><X className="w-3.5 h-3.5" /></button>
            </div>
          ))}
        </div>
      </div>

      {/* Embedded mini-quiz */}
      <div>
        <div className="flex items-center justify-between mb-2">
          <label className="label mb-0 flex items-center gap-1"><ListChecks className="w-3.5 h-3.5" /> Embedded Mini-Quiz</label>
          <button type="button" onClick={addQuestion} className="btn-secondary text-xs"><Plus className="w-3 h-3" /> Add question</button>
        </div>
        <input className="input py-1.5 text-sm mb-2" placeholder="Quiz title (e.g. Quick Check)" value={form.quiz.title} onChange={(e) => setForm({ ...form, quiz: { ...form.quiz, title: e.target.value } })} />
        {form.quiz.questions.length === 0 && <p className="text-xs text-slate-400">Add quick check questions that students answer inline during the lesson.</p>}
        <div className="space-y-3">
          {form.quiz.questions.map((q, qi) => (
            <div key={qi} className="rounded-lg border border-slate-200 p-3 bg-slate-50/50">
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs font-semibold text-slate-500">Question {qi + 1}</span>
                <div className="flex items-center gap-2">
                  <select className="input py-1 text-xs w-32" value={q.type} onChange={(e) => updateQuestion(qi, 'type', e.target.value)}>
                    <option value="MCQ">Multiple Choice</option>
                    <option value="TRUE_FALSE">True / False</option>
                    <option value="FILL_BLANK">Fill in the Blank</option>
                  </select>
                  <button type="button" onClick={() => removeQuestion(qi)} className="text-red-500"><Trash2 className="w-3.5 h-3.5" /></button>
                </div>
              </div>
              <input className="input mb-2 text-sm" placeholder="Question text" required={false} value={q.text} onChange={(e) => updateQuestion(qi, 'text', e.target.value)} />
              {q.type === 'MCQ' && (
                <div className="space-y-1.5">
                  <p className="text-xs text-slate-400">Select the radio button next to the correct option.</p>
                  {q.options.map((opt, oi) => (
                    <div key={oi} className="flex items-center gap-2">
                      <input 
                        type="radio" 
                        name={`miniquiz-correct-${qi}`} 
                        checked={q.correctIndex === oi} 
                        onChange={() => updateQuestion(qi, 'correctIndex', oi)} 
                      />
                      <input className="input py-1.5 text-sm" placeholder={`Option ${String.fromCharCode(65 + oi)}`} value={opt} onChange={(e) => updateOption(qi, oi, e.target.value)} />
                    </div>
                  ))}
                </div>
              )}
              {q.type === 'TRUE_FALSE' && (
                <input className="input py-1.5 text-sm" placeholder="Correct answer: true or false" value={q.answer} onChange={(e) => updateQuestion(qi, 'answer', e.target.value)} />
              )}
              {q.type === 'FILL_BLANK' && (
                <input className="input py-1.5 text-sm" placeholder="Correct answer (exact match)" value={q.answer} onChange={(e) => updateQuestion(qi, 'answer', e.target.value)} />
              )}
            </div>
          ))}
        </div>
      </div>

      <button type="submit" disabled={saving} className="btn-primary text-sm">{saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />} {isEdit ? 'Update lesson' : 'Save lesson'}</button>
    </form>
  );
}
