import { useEffect, useState, useMemo } from 'react';
import { Link } from 'react-router-dom';
import { BookOpen, Clock, Award, ArrowRight, Layers, Search, Tag, Lock, X, Star } from 'lucide-react';
import { api } from '../api/client.js';
import { useAuth } from '../context/AuthContext.jsx';
import { Spinner, EmptyState } from '../components/Common.jsx';

const levelColor = {
  Beginner: 'bg-emerald-100 text-emerald-700',
  Intermediate: 'bg-amber-100 text-amber-700',
  Advanced: 'bg-red-100 text-red-700',
};

export default function Courses() {
  const { user } = useAuth();
  const [courses, setCourses] = useState([]);
  const [allTags, setAllTags] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [activeTag, setActiveTag] = useState(null);
  const [category, setCategory] = useState('All');

  useEffect(() => {
    Promise.all([api.listCourses(), api.listCourseTags()])
      .then(([courseData, tagData]) => {
        setCourses(courseData.courses);
        setAllTags(tagData.tags || []);
      })
      .finally(() => setLoading(false));
  }, []);

  // Client-side instant search + filter (debounced feel via direct filter)
  const filtered = useMemo(() => {
    return courses.filter((c) => {
      const matchCat = category === 'All' || c.category === category;
      const parsedTags = typeof c.tags === 'string' ? JSON.parse(c.tags || '[]') : (c.tags || []);
      const matchTag = !activeTag || parsedTags.includes(activeTag);
      const q = search.toLowerCase().trim();
      const matchSearch = !q ||
        c.title.toLowerCase().includes(q) ||
        c.description.toLowerCase().includes(q);
      return matchCat && matchTag && matchSearch;
    });
  }, [courses, category, activeTag, search]);

  const categories = useMemo(() => ['All', ...Array.from(new Set(courses.map((c) => c.category)))], [courses]);

  if (loading) return <Spinner label="Loading courses…" />;

  return (
    <div>
      <section className="bg-gradient-to-br from-brand-950 to-brand-800 text-white py-14">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center gap-2 text-gold-400 text-sm mb-3">
            <BookOpen className="w-4 h-4" /> Learning Management System
          </div>
          <h1 className="text-3xl md:text-4xl font-extrabold">Business &amp; Entrepreneurship Courses</h1>
          <p className="text-slate-300 mt-3 max-w-2xl">
            Structured courses with rich-media lessons, interactive exams, and verifiable certificates.
            Enroll, learn at your own pace, and prove your skills.
          </p>

          {/* Instant search bar */}
          <div className="mt-6 relative max-w-xl">
            <Search className="w-5 h-5 text-slate-400 absolute left-3.5 top-3.5" />
            <input
              type="text"
              placeholder="Search courses by title…"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full rounded-xl bg-white/95 border border-white/20 pl-11 pr-10 py-3 text-sm text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-gold-500"
            />
            {search && (
              <button onClick={() => setSearch('')} className="absolute right-3 top-3 text-slate-400 hover:text-slate-600">
                <X className="w-5 h-5" />
              </button>
            )}
          </div>
        </div>
      </section>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Dynamic tag filters */}
        {allTags.length > 0 && (
          <div className="mb-6">
            <div className="flex items-center gap-2 text-sm text-slate-500 mb-2">
              <Tag className="w-4 h-4" /> Filter by tag:
            </div>
            <div className="flex flex-wrap gap-2">
              <button
                onClick={() => setActiveTag(null)}
                className={`px-3 py-1.5 rounded-lg text-sm font-medium transition ${
                  !activeTag ? 'bg-brand-700 text-white' : 'bg-white border border-slate-200 text-slate-600 hover:bg-slate-100'
                }`}
              >
                All tags
              </button>
              {allTags.map((tag) => (
                <button
                  key={tag}
                  onClick={() => setActiveTag(activeTag === tag ? null : tag)}
                  className={`px-3 py-1.5 rounded-lg text-sm font-medium transition ${
                    activeTag === tag ? 'bg-brand-700 text-white' : 'bg-white border border-slate-200 text-slate-600 hover:bg-slate-100'
                  }`}
                >
                  {tag}
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Category filters */}
        <div className="flex flex-wrap gap-2 mb-6">
          {categories.map((c) => (
            <button
              key={c}
              onClick={() => setCategory(c)}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition ${
                category === c ? 'bg-brand-700 text-white' : 'bg-white border border-slate-200 text-slate-600 hover:bg-slate-100'
              }`}
            >
              {c}
            </button>
          ))}
        </div>

        {/* Results count */}
        <div className="text-sm text-slate-500 mb-4">
          Showing {filtered.length} of {courses.length} course{filtered.length !== 1 ? 's' : ''}
          {activeTag && <span className="ml-1"> tagged <span className="font-semibold text-brand-700">{activeTag}</span></span>}
        </div>

        {filtered.length === 0 ? (
          <EmptyState icon={BookOpen} title="No courses match your filters" description="Try adjusting your search or filters."
            action={search || activeTag ? <button onClick={() => { setSearch(''); setActiveTag(null); setCategory('All'); }} className="btn-secondary">Clear filters</button> : null} />
        ) : (
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {filtered.map((c) => {
              const tags = typeof c.tags === 'string' ? JSON.parse(c.tags || '[]') : (c.tags || []);
              const hasPrereq = !!c.prerequisiteId;
              const avgRating = c.avgRating;
              return (
                <Link key={c.id} to={`/courses/${c.slug}`} className="card overflow-hidden group hover:shadow-lg transition flex flex-col">
                  <div className="h-40 bg-gradient-to-br from-brand-700 to-brand-950 relative flex items-center justify-center overflow-hidden">
                    {c.thumbnailUrl ? (
                      <img src={c.thumbnailUrl} alt={c.title} className="w-full h-full object-cover group-hover:scale-105 transition duration-300" />
                    ) : (
                      <BookOpen className="w-12 h-12 text-white/40" />
                    )}
                    <span className={`absolute top-3 right-3 badge ${levelColor[c.level] || 'bg-slate-100 text-slate-700'}`}>{c.level}</span>
                    <span className="absolute top-3 left-3 badge bg-white/20 text-white backdrop-blur">{c.category}</span>
                    {hasPrereq && (
                      <span className="absolute bottom-3 left-3 badge bg-amber-500/90 text-white">
                        <Lock className="w-3 h-3" /> Prerequisite
                      </span>
                    )}
                  </div>
                  <div className="p-5 flex-1 flex flex-col">
                    <h3 className="font-bold text-brand-950 text-lg leading-snug group-hover:text-brand-700 transition">{c.title}</h3>
                    <p className="text-sm text-slate-500 mt-2 line-clamp-2 flex-1">{c.description}</p>

                    {/* Tags */}
                    {tags.length > 0 && (
                      <div className="flex flex-wrap gap-1.5 mt-3">
                        {tags.slice(0, 3).map((t) => (
                          <span key={t} className="text-[11px] px-2 py-0.5 rounded bg-brand-50 text-brand-600 font-medium">{t}</span>
                        ))}
                      </div>
                    )}

                    {/* Rating */}
                    {avgRating > 0 && (
                      <div className="flex items-center gap-1 mt-3 text-sm">
                        <Star className="w-4 h-4 fill-gold-500 text-gold-500" />
                        <span className="font-semibold text-brand-950">{avgRating.toFixed(1)}</span>
                        <span className="text-slate-400">({c.reviewCount})</span>
                      </div>
                    )}

                    <div className="flex items-center gap-4 mt-4 pt-4 border-t border-slate-100 text-xs text-slate-500">
                      <span className="flex items-center gap-1"><Layers className="w-3.5 h-3.5" /> {c._count?.lessons || 0} lessons</span>
                      <span className="flex items-center gap-1"><Award className="w-3.5 h-3.5" /> {c._count?.exams || 0} exam{(c._count?.exams || 0) !== 1 ? 's' : ''}</span>
                    </div>
                    <div className="mt-4 text-brand-700 font-semibold text-sm flex items-center gap-1 group-hover:gap-2 transition-all">
                      View course <ArrowRight className="w-4 h-4" />
                    </div>
                  </div>
                </Link>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}