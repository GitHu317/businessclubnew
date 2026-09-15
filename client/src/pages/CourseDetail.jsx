import { useEffect, useState } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import {
  BookOpen, ArrowLeft, ArrowRight, Clock, Award, CheckCircle2, Circle,
  Lock, PlayCircle, FileText, Loader2, Star, Image as ImageIcon, Paperclip,
  HelpCircle, CheckCircle, XCircle, User as UserIcon, Link2, ChevronRight,
} from 'lucide-react';
import { api } from '../api/client.js';
import { useAuth } from '../context/AuthContext.jsx';
import { Spinner, EmptyState } from '../components/Common.jsx';

export default function CourseDetail() {
  const { slug } = useParams();
  const { user } = useAuth();
  const navigate = useNavigate();
  const [course, setCourse] = useState(null);
  const [loading, setLoading] = useState(true);
  const [enrolled, setEnrolled] = useState(null);
  const [enrollStatus, setEnrollStatus] = useState(null);
  const [activeLesson, setActiveLesson] = useState(null);
  const [completing, setCompleting] = useState(false);
  const [enrolling, setEnrolling] = useState(false);
  const [progressMap, setProgressMap] = useState({});
  const [quizAnswers, setQuizAnswers] = useState({});
  const [quizSubmitted, setQuizSubmitted] = useState(false);
  const [quizResults, setQuizResults] = useState(null);
  const [reviewForm, setReviewForm] = useState({ rating: 5, comment: '' });
  const [reviewSubmitting, setReviewSubmitting] = useState(false);
  const [reviews, setReviews] = useState([]);
  const [selectedImage, setSelectedImage] = useState(null);
  const [instructorModalOpen, setInstructorModalOpen] = useState(false);
  const [project, setProject] = useState(null);
  const [projectUrl, setProjectUrl] = useState('');
  const [projectFile, setProjectFile] = useState(null);
  const [projectSubmitting, setProjectSubmitting] = useState(false);

  useEffect(() => {
    setLoading(true);
    api.getCourse(slug)
      .then((d) => {
        setCourse(d.course);
        setReviews(d.course.reviews || []);
        if (d.course.lessons?.length) setActiveLesson(d.course.lessons[0]);
        if (user && d.course.projectRequired) api.getProject(d.course.id).then((projectData) => setProject(projectData.submission)).catch(() => {});
      })
      .finally(() => setLoading(false));

    if (user) {
      api.enrollmentStatus(slug).then((d) => {
        setEnrollStatus(d);
        if (d.enrollment) {
          setEnrolled(d.enrollment);
          const map = {};
          d.enrollment.lessonProgress?.forEach((lp) => { map[lp.lessonId] = lp.completed; });
          setProgressMap(map);
        }
      }).catch(() => {});
    }
  }, [slug, user]);

  const submitProject = async (event) => {
    event.preventDefault();
    if (!course || (!projectUrl && !projectFile)) return;
    setProjectSubmitting(true);
    try {
      let fileData = null;
      if (projectFile) fileData = await new Promise((resolve, reject) => { const reader = new FileReader(); reader.onload = () => resolve(reader.result); reader.onerror = reject; reader.readAsDataURL(projectFile); });
      const result = await api.submitProject(course.id, { projectUrl: projectUrl || null, fileName: projectFile?.name || null, fileData });
      setProject(result.submission); setProjectUrl(''); setProjectFile(null); alert('Project submitted for instructor review.');
    } catch (error) { alert(error.message); } finally { setProjectSubmitting(false); }
  };

  const hasPrereq = course?.prerequisiteId;
  const prereqLocked = hasPrereq && enrollStatus && !enrollStatus.hasPrerequisiteCertificate;

  const handleEnroll = async () => {
    if (!user) { navigate('/login', { state: { from: `/courses/${slug}` } }); return; }
    setEnrolling(true);
    try {
      const d = await api.enroll(slug);
      setEnrolled(d.enrollment);
      setEnrollStatus((s) => ({ ...s, enrollment: d.enrollment }));
    } catch (e) {
      if (e.status === 403 && e.payload?.prerequisiteTitle) {
        alert(`This course requires you to first complete "${e.payload.prerequisiteTitle}" and earn its certificate.`);
      } else {
        alert(e.message);
      }
    } finally {
      setEnrolling(false);
    }
  };

  const handleComplete = async () => {
    if (!activeLesson) return;
    setCompleting(true);
    try {
      const d = await api.completeLesson(slug, activeLesson.id);
      setProgressMap((m) => ({ ...m, [activeLesson.id]: true }));
      setEnrolled(d.enrollment);
    } catch (e) {
      alert(e.message);
    } finally {
      setCompleting(false);
    }
  };

  const submitReview = async (e) => {
    e.preventDefault();
    setReviewSubmitting(true);
    try {
      const d = await api.submitReview(slug, reviewForm);
      setReviews(d.reviews || reviews);
      setReviewForm({ rating: 5, comment: '' });
      const fresh = await api.getCourse(slug);
      setCourse(fresh.course);
    } catch (err) {
      alert(err.message);
    } finally {
      setReviewSubmitting(false);
    }
  };

  if (loading) return <Spinner label="Loading course…" />;
  if (!course) return <EmptyState icon={BookOpen} title="Course not found" />;

  const totalLessons = course.lessons?.length || 0;
  const completedLessons = Object.values(progressMap).filter(Boolean).length;
  const pct = totalLessons > 0 ? Math.round((completedLessons / totalLessons) * 100) : 0;
  const tags = typeof course.tags === 'string' ? JSON.parse(course.tags || '[]') : (course.tags || []);

  const instructorImg = course.creator?.image || course.creator?.avatarUrl || course.creator?.avatar || course.creator?.photo;

  return (
    <div>
      {/* Header */}
      <section className="bg-gradient-to-br from-brand-950 to-brand-800 text-white py-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <Link to="/courses" className="inline-flex items-center gap-1 text-slate-300 hover:text-white text-sm mb-4">
            <ArrowLeft className="w-4 h-4" /> Back to courses
          </Link>
          <div className="flex items-center gap-2 text-gold-400 text-sm mb-2">
            <BookOpen className="w-4 h-4" /> {course.category}
          </div>
          <h1 className="text-3xl md:text-4xl font-extrabold">{course.title}</h1>
          <p className="text-slate-300 mt-3 max-w-3xl">{course.description}</p>
          <div className="flex flex-wrap gap-4 mt-5 text-sm">
            <span className="flex items-center gap-1.5"><Clock className="w-4 h-4 text-gold-400" /> {course.level}</span>
            <span className="flex items-center gap-1.5"><BookOpen className="w-4 h-4 text-gold-400" /> {totalLessons} lessons</span>
            <span className="flex items-center gap-1.5"><Award className="w-4 h-4 text-gold-400" /> {course.exams?.length || 0} exam{(course.exams?.length || 0) !== 1 ? 's' : ''}</span>
            {course.avgRating > 0 && (
              <span className="flex items-center gap-1.5"><Star className="w-4 h-4 fill-gold-400 text-gold-400" /> {course.avgRating.toFixed(1)} ({course.reviewCount} review{(course.reviewCount || 0) !== 1 ? 's' : ''})</span>
            )}
          </div>
          {tags.length > 0 && (
            <div className="flex flex-wrap gap-2 mt-4">
              {tags.map((t) => (
                <Link key={t} to={`/courses?tag=${encodeURIComponent(t)}`} className="badge bg-white/10 text-white hover:bg-white/20 transition">{t}</Link>
              ))}
            </div>
          )}
        </div>
      </section>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {prereqLocked && (
          <div className="card p-5 mb-6 border-amber-300 bg-amber-50/50 flex items-center gap-4">
            <Lock className="w-8 h-8 text-amber-600 flex-shrink-0" />
            <div className="flex-1">
              <div className="font-semibold text-brand-950">Prerequisite required</div>
              <div className="text-sm text-slate-600">
                You must complete and earn a certificate for{' '}
                <Link to={`/courses/${course.prerequisite?.slug}`} className="text-brand-700 font-semibold underline">
                  {course.prerequisite?.title || 'the prerequisite course'}
                </Link>{' '}
                before enrolling in this course.
              </div>
            </div>
            <Link to={`/courses/${course.prerequisite?.slug}`} className="btn-secondary text-sm flex-shrink-0">
              Go to prerequisite <ArrowRight className="w-4 h-4" />
            </Link>
          </div>
        )}

        {!enrolled && !prereqLocked && (
          <div className="card p-5 mb-6 flex flex-col sm:flex-row items-center justify-between gap-4 bg-brand-50/50 border-brand-200">
            <div className="flex items-center gap-3">
              <Lock className="w-6 h-6 text-brand-700" />
              <div>
                <div className="font-semibold text-brand-950">Enroll to track your progress and take exams</div>
                <div className="text-sm text-slate-500">Free for all Business Club members.</div>
              </div>
            </div>
            <button onClick={handleEnroll} disabled={enrolling} className="btn-primary">
              {enrolling ? <Loader2 className="w-4 h-4 animate-spin" /> : <BookOpen className="w-4 h-4" />}
              {enrolling ? 'Enrolling…' : 'Enroll now'}
            </button>
          </div>
        )}

        {enrolled && (
          <div className="card p-5 mb-6">
            <div className="flex justify-between items-center mb-2">
              <span className="font-semibold text-brand-950 text-sm">Your progress</span>
              <span className="text-sm text-slate-500">{completedLessons}/{totalLessons} lessons • {pct}%</span>
            </div>
            <div className="progress-bar"><div className="progress-fill" style={{ width: `${pct}%` }} /></div>
          </div>
        )}

        <div className="grid lg:grid-cols-3 gap-6">
          <div className="lg:col-span-1">
            <div className="card p-4 sticky top-20">
              <h3 className="font-bold text-brand-950 mb-3 flex items-center gap-2">
                <BookOpen className="w-4 h-4 text-brand-700" /> Lessons
              </h3>
              <div className="space-y-1">
                {course.lessons?.map((l, i) => {
                  const done = progressMap[l.id];
                  const isActive = activeLesson?.id === l.id;
                  const hasVideo = l.videoUrl && l.videoType !== 'none';
                  const hasMedia = l.media?.length > 0;
                  const hasQuiz = l.quiz?.questions?.length > 0;
                  return (
                    <button
                      key={l.id}
                      onClick={() => { setActiveLesson(l); setQuizSubmitted(false); setQuizResults(null); setQuizAnswers({}); }}
                      className={`w-full text-left flex items-start gap-2.5 p-3 rounded-lg transition ${
                        isActive ? 'bg-brand-50 border border-brand-200' : 'hover:bg-slate-50 border border-transparent'
                      }`}
                    >
                      {done ? <CheckCircle2 className="w-5 h-5 text-emerald-600 flex-shrink-0 mt-0.5" /> : <Circle className="w-5 h-5 text-slate-300 flex-shrink-0 mt-0.5" />}
                      <div className="flex-1 min-w-0">
                        <div className={`text-sm font-medium ${isActive ? 'text-brand-800' : 'text-slate-700'}`}>{l.title}</div>
                        <div className="text-xs text-slate-400 flex items-center gap-1 mt-0.5">
                          <Clock className="w-3 h-3" /> {l.durationMins} min
                          {hasVideo && <PlayCircle className="w-3 h-3 ml-1" />}
                          {hasMedia && <ImageIcon className="w-3 h-3 ml-0.5" />}
                          {hasQuiz && <HelpCircle className="w-3 h-3 ml-0.5" />}
                        </div>
                      </div>
                    </button>
                  );
                })}
                {(!course.lessons || course.lessons.length === 0) && (
                  <p className="text-sm text-slate-400 p-2">No lessons yet.</p>
                )}
              </div>
            </div>
          </div>

          <div className="lg:col-span-2 space-y-6">
            {activeLesson ? (
              <div className="card p-6 md:p-8">
                <div className="flex items-center gap-2 text-brand-700 text-sm font-medium mb-2">
                  <PlayCircle className="w-4 h-4" /> Now viewing
                </div>
                <h2 className="text-2xl font-bold text-brand-950 mb-4">{activeLesson.title}</h2>

                {activeLesson.videoUrl && activeLesson.videoType !== 'none' && (
                  <div className="mb-5 rounded-lg overflow-hidden bg-black aspect-video">
                    {activeLesson.videoType === 'mp4' ? (
                      <video src={activeLesson.videoUrl} controls className="w-full h-full" />
                    ) : (
                      <iframe
                        src={getYouTubeEmbedUrl(activeLesson.videoUrl)}
                        className="w-full h-full"
                        title={activeLesson.title}
                        allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                        allowFullScreen
                      />
                    )}
                  </div>
                )}

                {activeLesson.content && (
                  <div className="prose prose-slate max-w-none mb-5">
                    <p className="text-slate-700 leading-relaxed whitespace-pre-line">{activeLesson.content}</p>
                  </div>
                )}

                {activeLesson.media?.filter((m) => m.type === 'image').length > 0 && (
                  <div className="mb-5">
                    <h4 className="text-sm font-semibold text-brand-950 mb-3 flex items-center gap-1.5">
                      <ImageIcon className="w-4 h-4 text-brand-600" /> Images (Click to expand)
                    </h4>
                    <div className="grid sm:grid-cols-2 gap-3">
                      {activeLesson.media.filter((m) => m.type === 'image').map((m) => (
                        <div
                          key={m.id}
                          onClick={() => setSelectedImage(m)}
                          className="rounded-lg overflow-hidden border border-slate-200 cursor-pointer group relative bg-slate-50"
                        >
                          <img src={m.url} alt={m.caption || m.filename} className="w-full h-48 object-cover group-hover:scale-105 transition duration-300" loading="lazy" />
                          {m.caption && <p className="text-xs text-slate-600 p-2 bg-white border-t border-slate-100 truncate">{m.caption}</p>}
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {activeLesson.media?.filter((m) => m.type === 'document').length > 0 && (
                  <div className="mb-5">
                    <h4 className="text-sm font-semibold text-brand-950 mb-3 flex items-center gap-1.5">
                      <Paperclip className="w-4 h-4 text-brand-600" /> Documents
                    </h4>
                    <div className="space-y-2">
                      {activeLesson.media.filter((m) => m.type === 'document').map((m) => (
                        <a key={m.id} href={m.url} target="_blank" rel="noopener noreferrer"
                          className="flex items-center gap-3 rounded-lg border border-slate-200 p-3 hover:bg-brand-50/40 transition">
                          <FileText className="w-5 h-5 text-brand-600 flex-shrink-0" />
                          <div className="flex-1 min-w-0">
                            <div className="text-sm font-medium text-brand-950 truncate">{m.filename || 'Document'}</div>
                            {m.caption && <div className="text-xs text-slate-400 truncate">{m.caption}</div>}
                          </div>
                          <ArrowRight className="w-4 h-4 text-slate-400" />
                        </a>
                      ))}
                    </div>
                  </div>
                )}

                {activeLesson.quiz?.questions?.length > 0 && (
                  <LessonQuiz
                    quiz={activeLesson.quiz}
                    answers={quizAnswers}
                    setAnswers={setQuizAnswers}
                    submitted={quizSubmitted}
                    setSubmitted={setQuizSubmitted}
                    results={quizResults}
                    setResults={setQuizResults}
                    enrolled={!!enrolled}
                  />
                )}

                <div className="mt-8 pt-6 border-t border-slate-100 flex flex-col sm:flex-row gap-3 items-center justify-between">
                  <span className="text-sm text-slate-500 flex items-center gap-1">
                    <Clock className="w-4 h-4" /> {activeLesson.durationMins} minutes
                  </span>
                  {enrolled ? (
                    <button
                      onClick={handleComplete}
                      disabled={completing || progressMap[activeLesson.id]}
                      className={progressMap[activeLesson.id] ? 'btn-secondary cursor-default' : 'btn-primary'}
                    >
                      {completing ? <Loader2 className="w-4 h-4 animate-spin" /> : <CheckCircle2 className="w-4 h-4" />}
                      {progressMap[activeLesson.id] ? 'Completed' : 'Mark as complete'}
                    </button>
                  ) : (
                    <span className="text-sm text-slate-400 flex items-center gap-1"><Lock className="w-4 h-4" /> Enroll to track progress</span>
                  )}
                </div>
              </div>
            ) : (
              <EmptyState icon={FileText} title="No lessons yet" description="Lessons will appear here once published." />
            )}

            {course.projectRequired && enrolled && (
              <div className="card p-6 border-purple-200 bg-purple-50/40">
                <h3 className="font-bold text-brand-950 flex items-center gap-2 mb-2"><Paperclip className="w-5 h-5 text-purple-700" /> Required project</h3>
                <p className="text-sm text-slate-600 whitespace-pre-line mb-4">{course.projectRequirements || 'Submit your project for instructor review before taking the final exam.'}</p>
                {project && <div className={`rounded-lg p-3 text-sm mb-3 ${project.status === 'APPROVED' ? 'bg-emerald-50 text-emerald-700' : project.status === 'REJECTED' ? 'bg-red-50 text-red-700' : 'bg-amber-50 text-amber-700'}`}><strong>{project.status}</strong>{project.feedback && <div className="mt-1">{project.feedback}</div>}</div>}
                <form onSubmit={submitProject} className="space-y-2"><input className="input" type="url" placeholder="Project URL (https://...)" value={projectUrl} onChange={(e) => setProjectUrl(e.target.value)} /><div className="text-xs text-slate-500 text-center">or upload a ZIP file (max 5 MB)</div><input className="input" type="file" accept=".zip" onChange={(e) => setProjectFile(e.target.files?.[0] || null)} /><button className="btn-primary text-sm" disabled={projectSubmitting}>{projectSubmitting ? <Loader2 className="w-4 h-4 animate-spin" /> : <Paperclip className="w-4 h-4" />} Submit project</button></form>
              </div>
            )}

            {course.exams?.length > 0 && (
              <div className="card p-6">
                <h3 className="font-bold text-brand-950 flex items-center gap-2 mb-4">
                  <Award className="w-5 h-5 text-gold-600" /> Course Exams
                </h3>
                <div className="space-y-3">
                  {course.exams.map((ex) => (
                    <div key={ex.id} className="rounded-lg border border-slate-200 p-4 flex items-center justify-between gap-3">
                      <div>
                        <div className="font-semibold text-brand-950">{ex.title}</div>
                        <div className="text-xs text-slate-500 mt-0.5">
                          {ex._count?.questions || ex.questions?.length || 0} questions • Pass {ex.passingScore}% • {ex.durationMins} min
                        </div>
                      </div>
                      {enrolled && (!course.projectRequired || project?.status === 'APPROVED') && enrolled.completed ? (
                        <button onClick={() => navigate(`/courses/${slug}/exams/${ex.id}`)} className="btn-primary text-sm">
                          Take exam <ArrowRight className="w-4 h-4" />
                        </button>
                      ) : (
                        <span className="text-xs text-slate-400 flex items-center gap-1"><Lock className="w-3.5 h-3.5" /> {!enrolled ? 'Enroll first' : course.projectRequired && project?.status !== 'APPROVED' ? 'Project approval required' : 'Complete all lessons first'}</span>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}

            <div className="card p-6">
              <h3 className="font-bold text-brand-950 flex items-center gap-2 mb-4">
                <Star className="w-5 h-5 text-gold-600" /> Testimonials
                {course.avgRating > 0 && (
                  <span className="text-sm font-normal text-slate-500">
                    • {course.avgRating.toFixed(1)} average from {course.reviewCount} review{(course.reviewCount || 0) !== 1 ? 's' : ''}
                  </span>
                )}
              </h3>

              {reviews.length > 0 ? (
                <div className="space-y-3 mb-4">
                  {reviews.map((r) => (
                    <div key={r.id} className="rounded-lg border border-slate-200 p-4">
                      <div className="flex items-center gap-3 mb-2">
                        <div className="w-9 h-9 rounded-full bg-brand-700 text-white flex items-center justify-center text-sm font-bold flex-shrink-0">
                          {r.user?.fullName?.charAt(0).toUpperCase()}
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="font-medium text-brand-950 text-sm truncate">{r.user?.fullName || 'Anonymous'}</div>
                          <div className="text-xs text-slate-400">{new Date(r.createdAt).toLocaleDateString()}</div>
                        </div>
                        <div className="flex gap-0.5">
                          {[1, 2, 3, 4, 5].map((n) => (
                            <Star key={n} className={`w-4 h-4 ${n <= r.rating ? 'fill-gold-500 text-gold-500' : 'text-slate-300'}`} />
                          ))}
                        </div>
                      </div>
                      {r.comment && <p className="text-sm text-slate-600 leading-relaxed">{r.comment}</p>}
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-sm text-slate-400 mb-4">No reviews yet. Be the first to share your experience!</p>
              )}

              {enrolled?.completed && (
                <form onSubmit={submitReview} className="border-t border-slate-100 pt-4">
                  <h4 className="text-sm font-semibold text-brand-950 mb-3">Write a review</h4>
                  <div className="flex items-center gap-2 mb-3">
                    <span className="text-sm text-slate-500">Your rating:</span>
                    {[1, 2, 3, 4, 5].map((n) => (
                      <button key={n} type="button" onClick={() => setReviewForm({ ...reviewForm, rating: n })}>
                        <Star className={`w-6 h-6 transition ${n <= reviewForm.rating ? 'fill-gold-500 text-gold-500' : 'text-slate-300 hover:text-gold-400'}`} />
                      </button>
                    ))}
                  </div>
                  <textarea
                    className="input"
                    rows={3}
                    placeholder="Share your thoughts about this course…"
                    value={reviewForm.comment}
                    onChange={(e) => setReviewForm({ ...reviewForm, comment: e.target.value })}
                  />
                  <button type="submit" disabled={reviewSubmitting} className="btn-primary text-sm mt-2">
                    {reviewSubmitting ? <Loader2 className="w-4 h-4 animate-spin" /> : <Star className="w-4 h-4" />}
                    Submit review
                  </button>
                </form>
              )}
            </div>

            {course.creator && (
              <div className="card p-6">
                <h3 className="font-bold text-brand-950 flex items-center gap-2 mb-4">
                  <UserIcon className="w-5 h-5 text-brand-700" /> Your Instructor
                </h3>
                <div
                  onClick={() => setInstructorModalOpen(true)}
                  className="flex items-center gap-4 group hover:bg-brand-50/40 rounded-lg p-3 -m-3 transition cursor-pointer"
                >
                  <div className="w-16 h-16 rounded-2xl bg-brand-700 text-white flex items-center justify-center text-2xl font-bold flex-shrink-0 overflow-hidden">
                    {instructorImg ? (
                      <img
                        src={instructorImg}
                        alt={course.creator.fullName}
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      course.creator.fullName?.charAt(0).toUpperCase()
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="font-bold text-brand-950 group-hover:text-brand-700 transition">{course.creator.fullName}</div>
                    {course.creator.headline && <div className="text-sm text-gold-600">{course.creator.headline}</div>}
                    {course.creator.bio && <div className="text-sm text-slate-500 mt-1 line-clamp-2">{course.creator.bio}</div>}
                    <div className="text-sm text-brand-600 font-medium mt-1 flex items-center gap-1">
                      View full profile <ChevronRight className="w-4 h-4" />
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Image Popup / Lightbox Modal */}
      {selectedImage && (
        <div 
          className="fixed inset-0 z-50 bg-black/80 flex items-center justify-center p-4 backdrop-blur-sm"
          onClick={() => setSelectedImage(null)}
        >
          <div 
            className="relative max-w-4xl w-full max-h-[90vh] bg-white rounded-xl overflow-hidden shadow-2xl flex flex-col"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between p-4 border-b border-slate-100 bg-slate-50">
              <span className="font-semibold text-brand-950 text-sm truncate">
                {selectedImage.filename || 'Image Preview'}
              </span>
              <button 
                onClick={() => setSelectedImage(null)}
                className="text-slate-400 hover:text-slate-700 transition p-1 rounded-full hover:bg-slate-200"
              >
                <XCircle className="w-6 h-6" />
              </button>
            </div>
            <div className="p-4 flex-1 overflow-auto flex items-center justify-center bg-black/5">
              <img 
                src={selectedImage.url} 
                alt={selectedImage.caption || selectedImage.filename} 
                className="max-h-[70vh] w-auto object-contain rounded-lg shadow-md" 
              />
            </div>
            {selectedImage.caption && (
              <div className="p-4 bg-white text-sm text-slate-600 border-t border-slate-100 text-center">
                {selectedImage.caption}
              </div>
            )}
          </div>
        </div>
      )}

      {/* Instructor Profile Modal Popup */}
      {instructorModalOpen && course.creator && (
        <div 
          className="fixed inset-0 z-50 bg-black/80 flex items-center justify-center p-4 backdrop-blur-sm"
          onClick={() => setInstructorModalOpen(false)}
        >
          <div 
            className="relative max-w-xl w-full bg-white rounded-2xl overflow-hidden shadow-2xl flex flex-col p-6 md:p-8 animate-in fade-in zoom-in-95 duration-200"
            onClick={(e) => e.stopPropagation()}
          >
            <button 
              onClick={() => setInstructorModalOpen(false)}
              className="absolute top-4 right-4 text-slate-400 hover:text-slate-700 transition p-1 rounded-full hover:bg-slate-100"
            >
              <XCircle className="w-6 h-6" />
            </button>

            <div className="flex items-center gap-4 mb-6">
              <div className="w-20 h-20 rounded-2xl bg-brand-700 text-white flex items-center justify-center text-3xl font-bold flex-shrink-0 overflow-hidden shadow-md">
                {instructorImg ? (
                  <img
                    src={instructorImg}
                    alt={course.creator.fullName}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  course.creator.fullName?.charAt(0).toUpperCase()
                )}
              </div>
              <div className="min-w-0">
                <h3 className="text-xl font-bold text-brand-950 truncate">{course.creator.fullName}</h3>
                {course.creator.headline && <p className="text-sm font-medium text-gold-600 mt-0.5">{course.creator.headline}</p>}
              </div>
            </div>

            {course.creator.bio ? (
              <div className="space-y-2 mb-6">
                <h4 className="text-xs font-semibold text-slate-400 uppercase tracking-wider">About</h4>
                <p className="text-sm text-slate-600 leading-relaxed whitespace-pre-line max-h-60 overflow-y-auto pr-1">
                  {course.creator.bio}
                </p>
              </div>
            ) : (
              <p className="text-sm text-slate-400 italic mb-6">No biography provided.</p>
            )}

            <div className="pt-4 border-t border-slate-100 flex items-center justify-between">
              <Link 
                to={`/instructors/${course.creator.id}`}
                onClick={() => setInstructorModalOpen(false)}
                className="text-sm font-semibold text-brand-700 hover:text-brand-800 inline-flex items-center gap-1 transition"
              >
                View full public page <ArrowRight className="w-4 h-4" />
              </Link>
              <button 
                onClick={() => setInstructorModalOpen(false)}
                className="btn-secondary text-sm px-4 py-2"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function LessonQuiz({ quiz, answers, setAnswers, submitted, setSubmitted, results, setResults, enrolled }) {
  if (!enrolled) {
    return (
      <div className="mb-5 rounded-lg border border-slate-200 bg-slate-50/50 p-4">
        <h4 className="text-sm font-semibold text-brand-950 flex items-center gap-1.5 mb-1">
          <HelpCircle className="w-4 h-4 text-brand-600" /> Mini-Quiz: {quiz.title}
        </h4>
        <p className="text-xs text-slate-400 flex items-center gap-1"><Lock className="w-3 h-3" /> Enroll to take this quiz.</p>
      </div>
    );
  }

  const normalizeQuizAnswer = (value) => String(value ?? '')
    .trim()
    .toLowerCase()
    .replace(/[.,!?;:]/g, '')
    .replace(/\s+/g, ' ');

  const checkQuiz = () => {
    let correct = 0;
    const detail = quiz.questions.map((q) => {
      const ans = answers[q.id];
      const optionsArr = typeof q.options === 'string' ? JSON.parse(q.options || '[]') : (q.options || []);
      let isCorrect = false;

      if (q.type === 'MCQ') {
        const numAns = Number(ans);
        const numCI = q.correctIndex !== undefined && q.correctIndex !== null ? Number(q.correctIndex) : NaN;
        
        if (!isNaN(numCI)) {
          isCorrect = numAns === numCI;
        } else if (q.answer !== undefined && q.answer !== null) {
          if (!isNaN(Number(q.answer))) {
            isCorrect = numAns === Number(q.answer);
          } else {
            isCorrect = optionsArr[numAns] === q.answer || String(optionsArr[numAns]).trim().toLowerCase() === String(q.answer).trim().toLowerCase();
          }
        }
      } else if (q.type === 'TRUE_FALSE') {
        isCorrect = normalizeQuizAnswer(ans) === normalizeQuizAnswer(q.answer);
      } else if (q.type === 'FILL_BLANK') {
        const acceptedAnswers = Array.isArray(q.answer) ? q.answer : String(q.answer || '').split('|');
        isCorrect = acceptedAnswers.some((accepted) => normalizeQuizAnswer(ans) === normalizeQuizAnswer(accepted));
      }

      if (isCorrect) correct++;
      return { questionId: q.id, isCorrect };
    });
    setResults(detail);
    setSubmitted(true);
    return { correct, total: quiz.questions.length };
  };

  return (
    <div className="mb-5 rounded-lg border border-brand-200 bg-brand-50/30 p-4">
      <h4 className="text-sm font-semibold text-brand-950 flex items-center gap-1.5 mb-3">
        <HelpCircle className="w-4 h-4 text-brand-600" /> Mini-Quiz: {quiz.title}
      </h4>
      <div className="space-y-4">
        {quiz.questions.map((q, qi) => {
          const optionsArr = typeof q.options === 'string' ? JSON.parse(q.options || '[]') : (q.options || []);
          const res = results?.find((r) => r.questionId === q.id);
          
          let correctText = q.answer;
          if (q.type === 'MCQ') {
            const numCI = q.correctIndex !== undefined && q.correctIndex !== null ? Number(q.correctIndex) : NaN;
            if (!isNaN(numCI) && optionsArr[numCI]) {
              correctText = optionsArr[numCI];
            } else if (q.answer !== undefined && !isNaN(Number(q.answer)) && optionsArr[Number(q.answer)]) {
              correctText = optionsArr[Number(q.answer)];
            } else if (q.answer) {
              correctText = q.answer;
            } else {
              correctText = optionsArr[0] || 'See course materials';
            }
          }

          const numCI = q.correctIndex !== undefined && q.correctIndex !== null ? Number(q.correctIndex) : (!isNaN(Number(q.answer)) ? Number(q.answer) : -1);

          return (
            <div key={q.id}>
              <p className="text-sm font-medium text-brand-950 mb-2">{qi + 1}. {q.text}</p>
              {q.type === 'MCQ' && (
                <div className="space-y-1.5">
                  {optionsArr.map((opt, idx) => {
                    const selected = answers[q.id] === idx;
                    const showCorrect = submitted && (idx === numCI || opt === q.answer);
                    const showWrong = submitted && selected && !showCorrect;
                    return (
                      <button
                        key={idx}
                        type="button"
                        disabled={submitted}
                        onClick={() => setAnswers((a) => ({ ...a, [q.id]: idx }))}
                        className={`w-full text-left flex items-center gap-2 p-2.5 rounded-lg border text-sm transition ${
                          showCorrect ? 'border-emerald-400 bg-emerald-50' :
                          showWrong ? 'border-red-400 bg-red-50' :
                          selected ? 'border-brand-500 bg-brand-50' : 'border-slate-200 hover:border-brand-300'
                        }`}
                      >
                        <span className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold flex-shrink-0 ${
                          showCorrect ? 'bg-emerald-500 text-white' :
                          showWrong ? 'bg-red-500 text-white' :
                          selected ? 'bg-brand-600 text-white' : 'bg-slate-100 text-slate-500'
                        }`}>{String.fromCharCode(65 + idx)}</span>
                        {opt}
                        {showCorrect && <CheckCircle className="w-4 h-4 text-emerald-600 ml-auto" />}
                        {showWrong && <XCircle className="w-4 h-4 text-red-500 ml-auto" />}
                      </button>
                    );
                  })}
                </div>
              )}
              {q.type === 'TRUE_FALSE' && (
                <div className="flex gap-2">
                  {['True', 'False'].map((opt) => {
                    const selected = answers[q.id] === opt;
                    const isCorrect = submitted && normalizeQuizAnswer(opt) === normalizeQuizAnswer(q.answer);
                    const showWrong = submitted && selected && !isCorrect;
                    return (
                      <button
                        key={opt}
                        type="button"
                        disabled={submitted}
                        onClick={() => setAnswers((a) => ({ ...a, [q.id]: opt }))}
                        className={`flex-1 p-2.5 rounded-lg border text-sm font-medium transition ${
                          isCorrect ? 'border-emerald-400 bg-emerald-50 text-emerald-700' :
                          showWrong ? 'border-red-400 bg-red-50 text-red-700' :
                          selected ? 'border-brand-500 bg-brand-50 text-brand-700' : 'border-slate-200 hover:border-brand-300'
                        }`}
                      >
                        {opt}
                      </button>
                    );
                  })}
                </div>
              )}
              {q.type === 'FILL_BLANK' && (
                <input
                  type="text"
                  disabled={submitted}
                  value={answers[q.id] || ''}
                  onChange={(e) => setAnswers((a) => ({ ...a, [q.id]: e.target.value }))}
                  placeholder="Type your answer…"
                  className={`input ${submitted ? (res?.isCorrect ? 'border-emerald-400' : 'border-red-400') : ''}`}
                />
              )}
              {submitted && res && (
                <p className={`text-xs mt-1.5 ${res.isCorrect ? 'text-emerald-600' : 'text-red-500'}`}>
                  {res.isCorrect ? '✓ Correct' : `✗ Incorrect${correctText ? ` — Correct answer: ${correctText}` : ''}`}
                </p>
              )}
            </div>
          );
        })}
      </div>
      {!submitted ? (
        <button type="button" onClick={checkQuiz} className="btn-primary text-sm mt-4">
          <CheckCircle className="w-4 h-4" /> Check answers
        </button>
      ) : (
        <div className="mt-3 flex items-center justify-between">
          <span className="text-sm font-semibold text-brand-950">
            Score: {results?.filter((r) => r.isCorrect).length}/{quiz.questions.length}
          </span>
          <button type="button" onClick={() => { setSubmitted(false); setResults(null); setAnswers({}); }} className="btn-ghost text-sm">
            Try again
          </button>
        </div>
      )}
    </div>
  );
}

function getYouTubeEmbedUrl(url) {
  if (!url) return '';
  if (url.includes('/embed/')) return url;
  let videoId = '';
  if (url.includes('youtu.be/')) {
    videoId = url.split('youtu.be/')[1]?.split('?')[0];
  } else if (url.includes('watch?v=')) {
    const match = url.match(/[?&]v=([^&#]+)/);
    if (match) videoId = match[1];
  }
  return videoId ? `https://www.youtube.com/embed/${videoId}` : url;
}
