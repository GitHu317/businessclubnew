import { useEffect, useState } from 'react';
import { api } from '../../api/client.js';
import { Spinner, EmptyState } from '../../components/Common.jsx';
import { PenLine, Check, X, Loader2, Paperclip, Trash2, ExternalLink } from 'lucide-react';
import { useAuth } from '../../context/AuthContext.jsx';

const statusStyles = {
  PENDING: 'bg-amber-50 text-amber-700 border-amber-200',
  APPROVED: 'bg-emerald-50 text-emerald-700 border-emerald-200',
  REJECTED: 'bg-red-50 text-red-700 border-red-200',
};

export default function AdminGrading() {
  const [projects, setProjects] = useState([]);
  const [loading, setLoading] = useState(true);
  const [projectGrading, setProjectGrading] = useState(null);
  const { user } = useAuth();

  const load = () => {
    setLoading(true);
    api.listCourses()
      .then(async ({ courses = [] }) => {
        const owned = courses.filter((course) => user?.role === 'ADMIN' || course.creatorId === user?.creatorProfile?.id);
        const results = await Promise.all(owned.map((course) => api.getProject(course.id).catch(() => null)));
        setProjects(results.flatMap((result) => (result?.submissions || []).map((submission) => ({ ...submission, course: result.course }))));
      })
      .finally(() => setLoading(false));
  };

  useEffect(() => { load(); }, [user]);

  if (loading) return <Spinner label="Loading project submissions..." />;
  if (projectGrading) return <ProjectGrading submission={projectGrading} onBack={() => { setProjectGrading(null); load(); }} />;

  const pending = projects.filter((item) => item.status === 'PENDING');
  const reviewed = projects.filter((item) => item.status !== 'PENDING');
  const renderSubmission = (item) => (
    <div key={item.id} className="card p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
      <div className="min-w-0">
        <div className="font-semibold text-brand-950 flex items-center gap-2"><Paperclip className="w-4 h-4" />{item.user.fullName}</div>
        <div className="text-xs text-slate-500 truncate">{item.course.title}</div>
        <span className={`inline-flex mt-2 rounded-full border px-2 py-0.5 text-[11px] font-bold ${statusStyles[item.status] || statusStyles.PENDING}`}>{item.status}</span>
        {item.feedback && <p className="mt-2 max-w-xl text-xs text-slate-600">{item.feedback}</p>}
      </div>
      <div className="flex flex-wrap gap-2 sm:flex-shrink-0">
        {item.status === 'PENDING' && <button onClick={() => setProjectGrading(item)} className="btn-primary text-sm">Review project</button>}
        <button onClick={() => setProjectGrading(item)} className="btn-secondary text-sm">View details</button>
      </div>
    </div>
  );

  return <div className="space-y-6">
    <div><h2 className="text-xl font-bold text-brand-950 flex items-center gap-2"><PenLine className="w-5 h-5" /> Project grading</h2><p className="text-sm text-slate-500">Review student projects. Exams are graded automatically.</p></div>
    <section><h3 className="font-bold text-brand-950 mb-3">Pending project submissions ({pending.length})</h3>{pending.length === 0 ? <p className="text-sm text-slate-500">No ungraded project submissions are waiting.</p> : <div className="space-y-3">{pending.map(renderSubmission)}</div>}</section>
    <section><h3 className="font-bold text-brand-950 mb-3">Reviewed projects ({reviewed.length})</h3>{reviewed.length === 0 ? <p className="text-sm text-slate-500">Approved and rejected projects will appear here.</p> : <div className="space-y-3">{reviewed.map(renderSubmission)}</div>}</section>
  </div>;
}

function ProjectGrading({ submission, onBack }) {
  const [feedback, setFeedback] = useState(submission.feedback || '');
  const [evaluation, setEvaluation] = useState('');
  const [busy, setBusy] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const isPending = submission.status === 'PENDING';

  const review = async (status) => {
    setBusy(true);
    try {
      await api.gradeProject(submission.courseId, submission.id, { status, feedback, evaluation: { review: evaluation } });
      onBack();
    } catch (error) { alert(error.message); } finally { setBusy(false); }
  };

  const remove = async () => {
    if (!window.confirm('Delete this submitted project? This cannot be undone.')) return;
    setDeleting(true);
    try { await api.deleteProject(submission.courseId, submission.id); onBack(); } catch (error) { alert(error.message); } finally { setDeleting(false); }
  };

  return <div className="space-y-4">
    <button onClick={onBack} className="text-sm text-slate-500 hover:text-brand-700">← Back to grading</button>
    <div className="card p-5">
      <div className="flex flex-wrap items-start justify-between gap-3"><div><h3 className="font-bold text-brand-950">Project review: {submission.user.fullName}</h3><p className="text-sm text-slate-500">{submission.course.title}</p></div><span className={`rounded-full border px-3 py-1 text-xs font-bold ${statusStyles[submission.status] || statusStyles.PENDING}`}>{submission.status}</span></div>
      <div className="mt-3 rounded-lg bg-purple-50 border border-purple-200 p-3 text-sm whitespace-pre-line">{submission.course.projectRequirements || 'Evaluate the work against the course project requirements.'}</div>
      {submission.projectUrl && <a className="inline-flex items-center gap-1 text-brand-700 underline text-sm mt-3" href={submission.projectUrl} target="_blank" rel="noreferrer">Open submitted project URL <ExternalLink className="w-3.5 h-3.5" /></a>}
      {submission.fileData && <a className="btn-secondary text-sm inline-flex mt-2" download={submission.fileName || 'project.zip'} href={submission.fileData}>Download ZIP file</a>}
    </div>
    {isPending && <div className="card p-5 space-y-3"><label className="label">Evaluation notes</label><textarea className="input" rows={4} value={evaluation} onChange={(e) => setEvaluation(e.target.value)} placeholder="Explain how the work met each requirement." /><label className="label">Feedback for student</label><textarea className="input" rows={4} value={feedback} onChange={(e) => setFeedback(e.target.value)} placeholder="Tell the student why the project was approved or what must be improved." /><div className="flex flex-wrap gap-2"><button disabled={busy} onClick={() => review('APPROVED')} className="btn-primary"><Check className="w-4 h-4" /> Approve and unlock exam</button><button disabled={busy} onClick={() => review('REJECTED')} className="btn-secondary text-red-700"><X className="w-4 h-4" /> Reject and send feedback</button></div></div>}
    {!isPending && <div className="card p-5"><p className="text-sm text-slate-600">This project has already been {submission.status.toLowerCase()}. The student can see the status and feedback on the course page.</p></div>}
    <button disabled={deleting} onClick={remove} className="btn-secondary text-sm text-red-700"><Trash2 className="w-4 h-4" /> {deleting ? 'Deleting...' : 'Delete submitted project'}</button>
  </div>;
}
