import { useEffect, useState } from 'react';
import { api } from '../../api/client.js';
import { Spinner, EmptyState } from '../../components/Common.jsx';
import { Star, Trash2, Eye, EyeOff, MessageSquare } from 'lucide-react';

function StarRow({ rating }) {
  return (
    <div className="flex items-center gap-0.5">
      {[1, 2, 3, 4, 5].map((n) => (
        <Star key={n} className={`w-3.5 h-3.5 ${n <= rating ? 'text-gold-500 fill-gold-500' : 'text-slate-300'}`} />
      ))}
    </div>
  );
}

export default function AdminReviews() {
  const [reviews, setReviews] = useState([]);
  const [loading, setLoading] = useState(true);

  const load = () => {
    setLoading(true);
    api.allReviews().then((d) => setReviews(d.reviews || [])).finally(() => setLoading(false));
  };
  useEffect(load, []);

  const moderate = async (r, published) => {
    try {
      await api.moderateReview(r.id, published);
      setReviews((rs) => rs.map((x) => (x.id === r.id ? { ...x, published } : x)));
    } catch (err) { alert(err.message); }
  };

  const del = async (r) => {
    if (!confirm('Delete this review permanently?')) return;
    try {
      await api.deleteReview(r.id);
      setReviews((rs) => rs.filter((x) => x.id !== r.id));
    } catch (err) { alert(err.message); }
  };

  if (loading) return <Spinner label="Loading reviews..." />;

  return (
    <div className="space-y-4">
      <div>
        <h2 className="text-xl font-bold text-brand-950 flex items-center gap-2"><MessageSquare className="w-5 h-5" /> Review Moderation</h2>
        <p className="text-sm text-slate-500 mt-0.5">Approve, hide, or delete course reviews and testimonials.</p>
      </div>

      {reviews.length === 0 ? (
        <EmptyState icon={MessageSquare} title="No reviews yet" description="Course reviews submitted by students will appear here." />
      ) : (
        <div className="space-y-3">
          {reviews.map((r) => (
            <div key={r.id} className="card p-4">
              <div className="flex items-start justify-between gap-3">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <div className="w-7 h-7 rounded-full bg-brand-700 text-white flex items-center justify-center text-xs font-bold">{r.user?.fullName?.charAt(0).toUpperCase()}</div>
                    <span className="font-semibold text-sm text-brand-950">{r.user?.fullName}</span>
                    <StarRow rating={r.rating} />
                    {r.published ? (
                      <span className="text-[10px] font-bold text-emerald-600 bg-emerald-50 rounded px-1.5 py-0.5 flex items-center gap-0.5"><Eye className="w-2.5 h-2.5" /> Published</span>
                    ) : (
                      <span className="text-[10px] font-bold text-amber-600 bg-amber-50 rounded px-1.5 py-0.5 flex items-center gap-0.5"><EyeOff className="w-2.5 h-2.5" /> Hidden</span>
                    )}
                  </div>
                  <p className="text-xs text-slate-400 mb-2">{r.course?.title} • {new Date(r.createdAt).toLocaleDateString()}</p>
                  {r.comment && <p className="text-sm text-slate-700">{r.comment}</p>}
                </div>
                <div className="flex gap-1 flex-shrink-0">
                  {r.published ? (
                    <button onClick={() => moderate(r, false)} className="btn-ghost p-2 text-amber-600 hover:bg-amber-50" title="Hide"><EyeOff className="w-4 h-4" /></button>
                  ) : (
                    <button onClick={() => moderate(r, true)} className="btn-ghost p-2 text-emerald-600 hover:bg-emerald-50" title="Publish"><Eye className="w-4 h-4" /></button>
                  )}
                  <button onClick={() => del(r)} className="btn-ghost p-2 text-red-600 hover:bg-red-50" title="Delete"><Trash2 className="w-4 h-4" /></button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
