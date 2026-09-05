import { useEffect, useState } from 'react';
import { api } from '../../api/client.js';
import { Spinner, EmptyState } from '../../components/Common.jsx';
import { PenLine, Check, X, Loader2, Clock, User } from 'lucide-react';

export default function AdminGrading() {
  const [attempts, setAttempts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [grading, setGrading] = useState(null); // attempt being graded
  const [busy, setBusy] = useState(false);

  const load = () => {
    setLoading(true);
    api.pendingGrades()
      .then((d) => setAttempts(d.attempts || []))
      .finally(() => setLoading(false));
  };
  useEffect(load, []);

  if (loading) return <Spinner label="Loading pending grades..." />;

  return (
    <div className="space-y-4">
      <div>
        <h2 className="text-xl font-bold text-brand-950 flex items-center gap-2"><PenLine className="w-5 h-5" /> Manual Grading Queue</h2>
        <p className="text-sm text-slate-500 mt-0.5">
          Exam attempts containing short-answer questions awaiting your evaluation.
          {attempts.length > 0 && <span className="text-amber-600 font-semibold"> {attempts.length} pending</span>}
        </p>
      </div>

      {attempts.length === 0 ? (
        <EmptyState icon={PenLine} title="Nothing to grade" description="Short-answer exam submissions will appear here for manual evaluation." />
      ) : grading ? (
        <GradingPanel attempt={grading} onBack={() => { setGrading(null); load(); }} busy={busy} setBusy={setBusy} />
      ) : (
        <div className="space-y-3">
          {attempts.map((a) => (
            <div key={a.id} className="card p-4 flex items-center justify-between gap-3">
              <div className="flex items-center gap-3 min-w-0">
                <div className="w-10 h-10 rounded-lg bg-amber-100 text-amber-700 flex items-center justify-center flex-shrink-0">
                  <PenLine className="w-5 h-5" />
                </div>
                <div className="min-w-0">
                  <div className="font-semibold text-brand-950 truncate flex items-center gap-1.5">
                    <User className="w-3.5 h-3.5 text-slate-400" /> {a.user?.fullName}
                  </div>
                  <div className="text-xs text-slate-500 truncate">{a.exam?.title} — {a.exam?.course?.title}</div>
                  <div className="text-[10px] text-slate-400 flex items-center gap-1 mt-0.5"><Clock className="w-2.5 h-2.5" /> Submitted {new Date(a.submittedAt).toLocaleString()}</div>
                </div>
              </div>
              <button onClick={() => setGrading(a)} className="btn-primary text-sm">Grade now</button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

function GradingPanel({ attempt, onBack, busy, setBusy }) {
  // Only short-answer questions have GradeResult rows needing manual grading
  const pendingQuestions = attempt.grades || [];
  const [grades, setGrades] = useState(
    pendingQuestions.map((g) => ({ questionId: g.questionId, awarded: g.awarded ?? 0, feedback: g.feedback || '', maxPoints: g.question?.points || 1 }))
  );

  // Find the student's answer for each pending question
  let answers = [];
  try { answers = JSON.parse(attempt.answers || '[]'); } catch { answers = []; }
  const answerMap = new Map(answers.map((a) => [a.questionId, a.value]));

  const submit = async () => {
    setBusy(true);
    try {
      await api.gradeAttempt(attempt.id, grades.map((g) => ({ questionId: g.questionId, awarded: +g.awarded, feedback: g.feedback })));
      onBack();
    } catch (err) {
      alert(err.message);
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="space-y-4">
      <button onClick={onBack} className="text-sm text-slate-500 hover:text-brand-700 flex items-center gap-1">← Back to queue</button>

      <div className="card p-5">
        <h3 className="font-bold text-brand-950">{attempt.exam?.title}</h3>
        <p className="text-xs text-slate-500">{attempt.exam?.course?.title} • Student: {attempt.user?.fullName}</p>
        <p className="text-xs text-slate-400 mt-1">Passing score: {attempt.exam?.passingScore}%</p>
      </div>

      <div className="space-y-3">
        {grades.map((g, i) => {
          const studentAnswer = answerMap.get(g.questionId) || '—';
          const question = pendingQuestions.find((pq) => pq.questionId === g.questionId)?.question;
          return (
            <div key={i} className="card p-5">
              <div className="flex items-center gap-2 mb-2">
                <span className="text-xs font-bold text-brand-700 bg-brand-50 rounded px-2 py-0.5">Q{i + 1}</span>
                <span className="text-[10px] text-slate-400">Short Answer • {g.maxPoints} pts</span>
              </div>
              <div className="text-sm font-medium text-brand-950 mb-2">{question?.text || 'Question'}</div>
              <div className="rounded-lg bg-slate-50 border border-slate-200 p-3 mb-3">
                <div className="text-[10px] font-semibold text-slate-500 uppercase mb-1">Student's Answer</div>
                <p className="text-sm text-slate-700 whitespace-pre-wrap">{studentAnswer}</p>
              </div>
              <div className="grid sm:grid-cols-[120px_1fr] gap-3">
                <div>
                  <label className="label">Points Awarded</label>
                  <input
                    type="number"
                    min="0"
                    max={g.maxPoints}
                    className="input"
                    value={g.awarded}
                    onChange={(e) => setGrades((gs) => gs.map((x, xi) => xi === i ? { ...x, awarded: e.target.value } : x))}
                  />
                  <p className="text-[10px] text-slate-400 mt-1">Max: {g.maxPoints}</p>
                </div>
                <div>
                  <label className="label">Feedback (optional)</label>
                  <textarea
                    className="input"
                    rows={2}
                    value={g.feedback}
                    onChange={(e) => setGrades((gs) => gs.map((x, xi) => xi === i ? { ...x, feedback: e.target.value } : x))}
                  />
                </div>
              </div>
            </div>
          );
        })}
      </div>

      <div className="flex gap-2">
        <button onClick={submit} disabled={busy} className="btn-primary">
          {busy ? <Loader2 className="w-4 h-4 animate-spin" /> : <Check className="w-4 h-4" />}
          Submit grades &amp; finalise
        </button>
        <button onClick={onBack} className="btn-secondary"><X className="w-4 h-4" /> Cancel</button>
      </div>
    </div>
  );
}
