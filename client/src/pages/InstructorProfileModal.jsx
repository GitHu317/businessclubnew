import { useEffect, useState } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { X, Award, BookOpen, Mail, Briefcase, ArrowRight, Star, Loader2 } from 'lucide-react';
import { api } from '../api/client.js';
import { Spinner, EmptyState } from '../components/Common.jsx';

export default function InstructorProfileModal() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    api.getInstructor(id)
      .then((d) => setProfile(d.profile))
      .catch((e) => setError(e.message || 'Could not load instructor profile.'))
      .finally(() => setLoading(false));
  }, [id]);

  const close = () => navigate(-1);

  if (loading) return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4" onClick={close}>
      <Spinner label="Loading profile…" />
    </div>
  );

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 overflow-y-auto" onClick={close}>
      <div
        className="card w-full max-w-2xl my-3 sm:my-8 max-h-[calc(100vh-1.5rem)] sm:max-h-[90vh] overflow-y-auto"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header banner */}
        <div className="relative bg-gradient-to-br from-amber-100 via-orange-50 to-rose-100 p-4 sm:p-6 text-orange-950">
          <button onClick={close} className="absolute top-3 right-3 p-2 rounded-lg hover:bg-orange-900/10 transition" aria-label="Close">
            <X className="w-5 h-5" />
          </button>
          <div className="flex flex-col sm:flex-row items-start gap-4">
            <div className="w-20 h-20 rounded-2xl bg-white/70 border-2 border-orange-400 shadow-lg flex items-center justify-center text-3xl font-bold flex-shrink-0 overflow-hidden">
              {profile.avatarUrl ? <img src={profile.avatarUrl} alt={`${profile.fullName} profile`} className="w-full h-full object-cover" /> : profile.fullName?.charAt(0).toUpperCase()}
            </div>
            <div className="pt-1">
              <h2 className="text-xl sm:text-2xl font-bold break-words">{profile.fullName}</h2>
              {profile.headline && <p className="text-orange-700 text-sm mt-1">{profile.headline}</p>}
              <div className="flex items-center gap-2 mt-2">
                <span className="badge bg-white/70 text-orange-800 ring-1 ring-orange-200">
                  <Award className="w-3 h-3" /> Verified Instructor
                </span>
              </div>
            </div>
          </div>
        </div>

        <div className="p-6 space-y-6">
          {error && <EmptyState icon={Mail} title="Profile unavailable" description={error} />}

          {!error && (
            <>
              {/* Bio */}
              {profile.bio && (
                <div>
                  <h3 className="text-sm font-semibold text-slate-400 uppercase tracking-wide mb-2">About</h3>
                  <p className="text-slate-700 leading-relaxed text-sm whitespace-pre-line">{profile.bio}</p>
                </div>
              )}

              {/* Expertise */}
              {profile.expertise?.length > 0 && (
                <div>
                  <h3 className="text-sm font-semibold text-slate-400 uppercase tracking-wide mb-2 flex items-center gap-1.5">
                    <Briefcase className="w-4 h-4" /> Expertise
                  </h3>
                  <div className="flex flex-wrap gap-2">
                    {profile.expertise.map((exp, i) => (
                      <span key={i} className="badge bg-brand-50 text-brand-700">{exp}</span>
                    ))}
                  </div>
                </div>
              )}

              {/* Credentials */}
              {profile.credentials && (
                <div>
                  <h3 className="text-sm font-semibold text-slate-400 uppercase tracking-wide mb-2 flex items-center gap-1.5">
                    <Award className="w-4 h-4" /> Credentials
                  </h3>
                  <p className="text-slate-700 text-sm whitespace-pre-line">{profile.credentials}</p>
                </div>
              )}

              {/* Courses by this instructor */}
              <div>
                <h3 className="text-sm font-semibold text-slate-400 uppercase tracking-wide mb-3 flex items-center gap-1.5">
                  <BookOpen className="w-4 h-4" /> Courses ({profile.courses?.length || 0})
                </h3>
                {profile.courses?.length > 0 ? (
                  <div className="space-y-2">
                    {profile.courses.map((c) => (
                      <Link
                        key={c.id}
                        to={`/courses/${c.slug}`}
                        onClick={close}
                        className="flex items-center justify-between gap-3 rounded-lg border border-slate-200 p-3 hover:border-brand-300 hover:bg-brand-50/40 transition"
                      >
                        <div className="min-w-0">
                          <div className="font-semibold text-brand-950 text-sm truncate">{c.title}</div>
                          <div className="text-xs text-slate-500 mt-0.5">{c.category} • {c.level}</div>
                        </div>
                        <ArrowRight className="w-4 h-4 text-brand-600 flex-shrink-0" />
                      </Link>
                    ))}
                  </div>
                ) : (
                  <p className="text-sm text-slate-400">No courses published yet.</p>
                )}
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
