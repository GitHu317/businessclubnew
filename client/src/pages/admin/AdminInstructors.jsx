import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { api } from '../../api/client.js';
import { Spinner, EmptyState } from '../../components/Common.jsx';
import { GraduationCap, ShieldCheck, BookOpen, Mail, Award } from 'lucide-react';

export default function AdminInstructors() {
  const [profiles, setProfiles] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.listInstructors()
      .then((d) => setProfiles(d.profiles || []))
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <Spinner label="Loading instructors..." />;

  return (
    <div className="space-y-4">
      <div>
        <h2 className="text-xl font-bold text-brand-950 flex items-center gap-2"><GraduationCap className="w-5 h-5" /> Instructors &amp; Course Creators</h2>
        <p className="text-sm text-slate-500 mt-0.5">Approved course creators and their published course counts.</p>
      </div>

      {profiles.length === 0 ? (
        <EmptyState icon={GraduationCap} title="No instructors yet" description="Approved instructor applications will create creator profiles here." />
      ) : (
        <div className="grid sm:grid-cols-2 gap-4">
          {profiles.map((p) => {
            let expertise = [];
            try { expertise = JSON.parse(p.expertise || '[]'); } catch { expertise = []; }
            return (
              <div key={p.id} className="card p-5">
                <div className="flex items-start gap-3">
                  <div className="w-12 h-12 rounded-full bg-brand-700 text-white flex items-center justify-center text-lg font-bold flex-shrink-0">
                    {p.fullName?.charAt(0).toUpperCase() || '?'}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <h3 className="font-bold text-brand-950 truncate">{p.fullName}</h3>
                      {p.approved && (
                        <span className="text-[10px] font-bold text-emerald-600 bg-emerald-50 rounded px-1.5 py-0.5 flex items-center gap-0.5"><ShieldCheck className="w-3 h-3" /> Approved</span>
                      )}
                    </div>
                    <p className="text-xs text-slate-500">{p.headline || 'Course Creator'}</p>
                    {p.user?.email && (
                      <p className="text-xs text-slate-400 flex items-center gap-1 mt-0.5"><Mail className="w-3 h-3" /> {p.user.email}</p>
                    )}
                  </div>
                </div>

                {p.bio && <p className="text-sm text-slate-600 mt-3 line-clamp-3">{p.bio}</p>}

                {expertise.length > 0 && (
                  <div className="flex flex-wrap gap-1.5 mt-3">
                    {expertise.slice(0, 5).map((e, i) => (
                      <span key={i} className="text-[10px] bg-brand-50 text-brand-700 rounded-full px-2 py-0.5">{e}</span>
                    ))}
                  </div>
                )}

                <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between">
                  <span className="text-xs text-slate-500 flex items-center gap-1.5">
                    <BookOpen className="w-3.5 h-3.5" /> {p._count?.courses || 0} course(s)
                  </span>
                  <Link to={`/instructors/${p.id}`} className="text-xs text-brand-700 font-semibold hover:underline flex items-center gap-1">
                    <Award className="w-3.5 h-3.5" /> View public profile
                  </Link>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
