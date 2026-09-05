import { useEffect, useState } from 'react';
import { Users, Mail, Link2, AtSign, Camera, Crown, Briefcase } from 'lucide-react';
import { api } from '../api/client.js';
import { Spinner, EmptyState } from '../components/Common.jsx';

function Avatar({ name, photoUrl }) {
  if (photoUrl) {
    return <img src={photoUrl} alt={name} className="w-full h-full object-cover" />;
  }
  const initials = name.split(' ').map((n) => n[0]).slice(0, 2).join('').toUpperCase();
  return (
    <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-brand-600 to-brand-900 text-white text-3xl font-bold">
      {initials}
    </div>
  );
}

export default function BoardMembers() {
  const [members, setMembers] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.listBoardMembers()
      .then((d) => setMembers(d.members))
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <Spinner label="Loading board members..." />;

  return (
    <div>
      {/* Header */}
      <section className="bg-gradient-to-br from-brand-950 to-brand-800 text-white py-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center gap-2 text-gold-400 text-sm mb-3">
            <Users className="w-4 h-4" /> Our Leadership
          </div>
          <h1 className="text-3xl md:text-4xl font-extrabold">Meet the Board Members</h1>
          <p className="text-slate-300 mt-3 max-w-2xl">
            The Business Club is led by a dedicated team of six student leaders who run our programs,
            courses, games, and partnerships across the Kotebe University of Education and Science Shared Campus.
          </p>
        </div>
      </section>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        {members.length === 0 ? (
          <EmptyState icon={Users} title="No board members yet" description="Check back soon." />
        ) : (
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {members.map((m, i) => (
              <div key={m.id} className="card overflow-hidden group hover:shadow-lg transition">
                {/* Photo */}
                <div className="relative h-56 bg-slate-100 overflow-hidden">
                  <Avatar name={m.fullName} photoUrl={m.photoUrl} />
                  {m.order === 1 && (
                    <div className="absolute top-3 right-3 bg-gold-500 text-brand-950 px-2.5 py-1 rounded-full text-xs font-bold flex items-center gap-1 shadow">
                      <Crown className="w-3 h-3" /> President
                    </div>
                  )}
                  <div className="absolute bottom-0 inset-x-0 bg-gradient-to-t from-black/60 to-transparent p-4">
                    <div className="text-white font-bold text-lg">{m.fullName}</div>
                  </div>
                </div>
                {/* Body */}
                <div className="p-5">
                  <div className="flex items-center gap-1.5 text-brand-700 font-semibold text-sm mb-2">
                    <Briefcase className="w-4 h-4" /> {m.title}
                  </div>
                  <p className="text-sm text-slate-600 leading-relaxed line-clamp-4">{m.bio}</p>
                  {/* Socials */}
                  <div className="flex items-center gap-2 mt-4 pt-4 border-t border-slate-100">
                    {m.email && (
                      <a href={`mailto:${m.email}`} className="w-8 h-8 rounded-lg bg-slate-100 hover:bg-brand-100 text-slate-600 hover:text-brand-700 flex items-center justify-center transition" title="Email">
                        <Mail className="w-4 h-4" />
                      </a>
                    )}
                    {m.linkedin && (
                      <a href={m.linkedin} target="_blank" rel="noreferrer" className="w-8 h-8 rounded-lg bg-slate-100 hover:bg-brand-100 text-slate-600 hover:text-brand-700 flex items-center justify-center transition" title="LinkedIn">
                        <Link2 className="w-4 h-4" />
                      </a>
                    )}
                    {m.twitter && (
                      <a href={m.twitter} target="_blank" rel="noreferrer" className="w-8 h-8 rounded-lg bg-slate-100 hover:bg-brand-100 text-slate-600 hover:text-brand-700 flex items-center justify-center transition" title="Twitter">
                        <AtSign className="w-4 h-4" />
                      </a>
                    )}
                    {m.instagram && (
                      <a href={m.instagram} target="_blank" rel="noreferrer" className="w-8 h-8 rounded-lg bg-slate-100 hover:bg-brand-100 text-slate-600 hover:text-brand-700 flex items-center justify-center transition" title="Instagram">
                        <Camera className="w-4 h-4" />
                      </a>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
