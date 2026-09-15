import { useEffect, useState } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import {
  Award, Clock, ArrowLeft, ArrowRight, CheckCircle2, XCircle, Loader2,
  AlertCircle, Trophy, RotateCcw, PenLine, HelpCircle, Type,
} from 'lucide-react';
import { api } from '../api/client.js';
import { Spinner } from '../components/Common.jsx';

export default function ExamPage() {
  const { slug, examId } = useParams();
  const navigate = useNavigate();
  const [exam, setExam] = useState(null);
  const [loading, setLoading] = useState(true);
  const [answers, setAnswers] = useState({});
  const [current, setCurrent] = useState(0);
  const [submitting, setSubmitting] = useState(false);
  const [result, setResult] = useState(null);

  useEffect(() => {
    api.getExam(examId)
      .then((d) => setExam(d.exam))
      .finally(() => setLoading(false));
  }, [examId]);

  const setAnswer = (qId, value) => {
    setAnswers((a) => ({ ...a, [qId]: value }));
  };

  // A question is "answered" based on its type
  const isAnswered = (q) => {
    const a = answers[q.id];
    if (a === undefined || a === null) return false;
    if (typeof a === 'string') return a.trim().length > 0;
    return true;
  };

  const allAnswered = exam ? exam.questions.every(isAnswered) : false;
  const answeredCount = exam ? exam.questions.filter(isAnswered).length : 0;

 const submit = async () => {
    if (!allAnswered) return;
    setSubmitting(true);
    try {
      const payload = exam.questions.map((q) => ({
        questionId: q.id,
        value: answers[q.id],
      }));
      const r = await api.submitExam(examId, payload);
      setResult(r);
    } catch (e) {
      alert(e.message);
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) return <Spinner label="Loading exam…" />;
  if (!exam) return <div className="max-w-3xl mx-auto p-8"><p>Exam not found.</p></div>;

  // ---- Result view ----
  if (result) {
    const passed = result.attempt.passed;
    return (
      <div className="max-w-3xl mx-auto px-4 py-12">
        <div className={`card p-8 text-center ${passed ? 'border-emerald-300 bg-emerald-50/50' : 'border-red-300 bg-red-50/50'}`}>
          <div className={`w-20 h-20 rounded-full mx-auto flex items-center justify-center mb-4 ${passed ? 'bg-emerald-100 text-emerald-600' : 'bg-red-100 text-red-600'}`}>
            {passed ? <Trophy className="w-10 h-10" /> : <XCircle className="w-10 h-10" />}
          </div>
          <h1 className="text-2xl font-bold text-brand-950">
            {passed ? 'Congratulations, you passed! 🎉' : 'Not quite there yet'}
          </h1>
          <p className="text-slate-600 mt-2">
            You scored <span className="font-bold text-brand-950 text-lg">{result.attempt.score}%</span>
            {' '}(passing mark: {exam.passingScore}%)
          </p>

          {passed && result.certificate && (
            <div className="mt-6 rounded-xl border border-gold-500/40 bg-white p-5">
              <div className="flex items-center justify-center gap-2 text-gold-600 font-bold mb-2">
                <Award className="w-5 h-5" /> Certificate of Completion issued
              </div>
              <div className="font-mono text-sm text-brand-950 bg-gold-500/10 rounded-lg py-2 px-3 inline-block">
                {result.certificate.certificateId}
              </div>
              <div className="mt-4 flex flex-col sm:flex-row gap-2 justify-center">
                <Link to={`/certificates/${result.certificate.certificateId}`} className="btn-primary">
                  <Award className="w-4 h-4" /> View certificate
                </Link>
                <Link to="/dashboard" className="btn-secondary">Go to dashboard</Link>
              </div>
            </div>
          )}

          {!passed && (
            <div className="mt-6">
              <button onClick={() => { setResult(null); setAnswers({}); setCurrent(0); }} className="btn-primary">
                <RotateCcw className="w-4 h-4" /> Retake exam
              </button>
            </div>
          )}

          {/* Detailed results */}
          {(
            <div className="mt-8 text-left">
              <h3 className="font-bold text-brand-950 mb-3">Review your answers</h3>
              <div className="space-y-3">
                {exam.questions.map((q, i) => {
                  const r = result.detailedResults?.find((d) => d.questionId === q.id);
                  if (q.type === 'SHORT_ANSWER') {
                    return (
                      <div key={q.id} className="rounded-lg border border-slate-200 bg-white p-4">
                        <div className="flex items-start gap-2">
                          <PenLine className="w-5 h-5 text-slate-400 flex-shrink-0 mt-0.5" />
                          <div className="flex-1">
                            <div className="font-medium text-brand-950 text-sm">{i + 1}. {q.text}</div>
                            <div className="text-sm text-slate-600 mt-1">Your answer: "{answers[q.id]}"</div>
                            <div className="text-xs text-slate-500 mt-1">Automatically graded</div>
                          </div>
                        </div>
                      </div>
                    );
                  }
                  const isCorrect = r?.isCorrect;
                  return (
                    <div key={q.id} className="rounded-lg border border-slate-200 bg-white p-4">
                      <div className="flex items-start gap-2">
                        {isCorrect ? <CheckCircle2 className="w-5 h-5 text-emerald-600 flex-shrink-0 mt-0.5" /> : <XCircle className="w-5 h-5 text-red-500 flex-shrink-0 mt-0.5" />}
                        <div className="flex-1">
                          <div className="font-medium text-brand-950 text-sm">{i + 1}. {q.text}</div>
                          <div className="mt-2">
                            {q.type === 'MCQ' && q.options?.map((opt, idx) => {
                              const isCorrectOption = idx === r?.answer;
                              const isUserAnswer = idx === answers[q.id];
                              return (
                                <div key={idx} className={`text-sm px-2 py-1 rounded ${
                                  isCorrectOption ? 'bg-emerald-50 text-emerald-800 font-medium' :
                                  isUserAnswer ? 'bg-red-50 text-red-700' : 'text-slate-600'
                                }`}>
                                  {String.fromCharCode(65 + idx)}. {opt}
                                  {isCorrectOption && <span className="ml-1">✓</span>}
                                  {isUserAnswer && !isCorrectOption && <span className="ml-1">✗ your answer</span>}
                                </div>
                              );
                            })}
                            {(q.type === 'TRUE_FALSE' || q.type === 'FILL_BLANK') && (
                              <div className="text-sm space-y-1">
                                <div className="text-slate-600">Your answer: <span className={isCorrect ? 'text-emerald-700 font-medium' : 'text-red-700'}>"{answers[q.id]}"</span></div>
                                {!isCorrect && <div className="text-emerald-700">Correct answer: "{r?.answer}"</div>}
                              </div>
                            )}
                          </div>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </div>
      </div>
    );
  }

  // ---- Exam taking view ----
  const q = exam.questions[current];
  const total = exam.questions.length;
  const typeLabel = { MCQ: 'Multiple Choice', TRUE_FALSE: 'True / False', FILL_BLANK: 'Fill in the Blank', SHORT_ANSWER: 'Short Answer' };
  const typeIcon = { MCQ: HelpCircle, TRUE_FALSE: CheckCircle2, FILL_BLANK: Type, SHORT_ANSWER: PenLine };
  const TypeIcon = typeIcon[q.type] || HelpCircle;

  return (
    <div className="max-w-3xl mx-auto px-4 py-10">
      <Link to={`/courses/${slug}`} className="inline-flex items-center gap-1 text-slate-500 hover:text-brand-700 text-sm mb-4">
        <ArrowLeft className="w-4 h-4" /> Back to course
      </Link>

      <div className="card p-6 md:p-8">
        <div className="flex items-center justify-between mb-2">
          <h1 className="text-xl font-bold text-brand-950">{exam.title}</h1>
          <span className="badge-verified flex items-center gap-1"><Clock className="w-3 h-3" /> {exam.durationMins} min</span>
        </div>
        <p className="text-sm text-slate-500 mb-6">{exam.description}</p>

        {/* Progress */}
        <div className="flex items-center justify-between mb-2 text-sm">
          <span className="font-medium text-brand-950">Question {current + 1} of {total}</span>
          <span className="text-slate-500">{answeredCount}/{total} answered</span>
        </div>
        <div className="progress-bar mb-6"><div className="progress-fill" style={{ width: `${((current + 1) / total) * 100}%` }} /></div>

        {/* Question */}
        <div className="mb-6">
          <div className="flex items-center gap-2 mb-3">
            <span className="badge bg-brand-50 text-brand-700"><TypeIcon className="w-3 h-3" /> {typeLabel[q.type]}</span>
            {q.points > 1 && <span className="text-xs text-slate-400">{q.points} points</span>}
          </div>
          <h2 className="text-lg font-semibold text-brand-950 mb-4">{q.text}</h2>

          {/* MCQ */}
          {q.type === 'MCQ' && (
            <div className="space-y-2.5">
              {q.options.map((opt, idx) => {
                const selected = answers[q.id] === idx;
                return (
                  <button
                    key={idx}
                    onClick={() => setAnswer(q.id, idx)}
                    className={`w-full text-left flex items-center gap-3 p-4 rounded-lg border-2 transition ${
                      selected ? 'border-brand-600 bg-brand-50' : 'border-slate-200 hover:border-brand-300 hover:bg-slate-50'
                    }`}
                  >
                    <div className={`w-7 h-7 rounded-full flex items-center justify-center text-sm font-bold flex-shrink-0 ${
                      selected ? 'bg-brand-600 text-white' : 'bg-slate-100 text-slate-500'
                    }`}>{String.fromCharCode(65 + idx)}</div>
                    <span className={`text-sm ${selected ? 'text-brand-900 font-medium' : 'text-slate-700'}`}>{opt}</span>
                  </button>
                );
              })}
            </div>
          )}

          {/* True / False */}
          {q.type === 'TRUE_FALSE' && (
            <div className="grid grid-cols-2 gap-3">
              {['True', 'False'].map((opt) => {
                const selected = answers[q.id] === opt;
                return (
                  <button
                    key={opt}
                    onClick={() => setAnswer(q.id, opt)}
                    className={`p-6 rounded-lg border-2 text-center font-semibold text-lg transition ${
                      selected ? 'border-brand-600 bg-brand-50 text-brand-900' : 'border-slate-200 hover:border-brand-300 hover:bg-slate-50 text-slate-700'
                    }`}
                  >
                    {opt}
                  </button>
                );
              })}
            </div>
          )}

          {/* Fill in the Blank */}
          {q.type === 'FILL_BLANK' && (
            <div>
              <input
                type="text"
                className="input"
                placeholder="Type your answer…"
                value={answers[q.id] || ''}
                onChange={(e) => setAnswer(q.id, e.target.value)}
                autoFocus
              />
              <p className="text-xs text-slate-400 mt-2">Tip: spelling and spacing matter — write your answer exactly as expected.</p>
            </div>
          )}

          {/* Short Answer */}
          {q.type === 'SHORT_ANSWER' && (
            <div>
              <textarea
                className="input"
                rows={5}
                placeholder="Write your detailed answer…"
                value={answers[q.id] || ''}
                onChange={(e) => setAnswer(q.id, e.target.value)}
              />
              <p className="text-xs text-amber-600 mt-2 flex items-center gap-1">
                <AlertCircle className="w-3.5 h-3.5" /> This question is graded automatically after submission.
              </p>
            </div>
          )}
        </div>

        {/* Nav */}
        <div className="flex items-center justify-between pt-4 border-t border-slate-100">
          <button onClick={() => setCurrent((c) => Math.max(0, c - 1))} disabled={current === 0} className="btn-ghost">
            <ArrowLeft className="w-4 h-4" /> Previous
          </button>

          {/* Question dots */}
          <div className="hidden sm:flex gap-1.5">
            {exam.questions.map((qq, i) => (
              <button
                key={qq.id}
                onClick={() => setCurrent(i)}
                className={`h-2.5 rounded-full transition ${
                  i === current ? 'bg-brand-700 w-6' :
                  isAnswered(qq) ? 'bg-emerald-500' : 'bg-slate-300'
                }`}
              />
            ))}
          </div>

          {current < total - 1 ? (
            <button onClick={() => setCurrent((c) => Math.min(total - 1, c + 1))} className="btn-primary">
              Next <ArrowRight className="w-4 h-4" />
            </button>
          ) : (
            <button onClick={submit} disabled={!allAnswered || submitting} className="btn-gold">
              {submitting ? <Loader2 className="w-4 h-4 animate-spin" /> : <CheckCircle2 className="w-4 h-4" />}
              {submitting ? 'Submitting…' : 'Submit exam'}
            </button>
          )}
        </div>

        {!allAnswered && current === total - 1 && (
          <p className="text-xs text-amber-600 mt-3 flex items-center gap-1 justify-center">
            <AlertCircle className="w-3.5 h-3.5" /> Answer all {total - answeredCount} remaining question(s) to submit.
          </p>
        )}
      </div>
    </div>
  );
}