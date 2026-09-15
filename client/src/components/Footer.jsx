import { Link } from 'react-router-dom';
import { GraduationCap, Mail, MapPin, Code, AtSign, Link2 } from 'lucide-react';

export default function Footer() {
  return (
    <footer className="bg-brand-950 text-slate-300 mt-16">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
          <div className="md:col-span-2">
            <div className="flex items-center gap-2.5 mb-3">
              <div className="w-10 h-10 rounded-lg bg-brand-700 flex items-center justify-center text-white">
                <GraduationCap className="w-6 h-6" />
              </div>
              <div>
                <div className="text-base font-bold text-white">Business Club</div>
                <div className="text-xs text-slate-400">Kotebe University of Education | Science Shared Campus</div>
              </div>
            </div>
            <p className="text-sm text-slate-400 max-w-md leading-relaxed">
              Supporting SSC students through education, practical club activities, and a thriving
              community. Learn, connect, and earn verifiable certificates.
            </p>
          </div>

          <div>
            <h4 className="text-sm font-semibold text-white mb-3">Explore</h4>
            <ul className="space-y-2 text-sm">
              <li><Link to="/courses" className="hover:text-white transition">Courses</Link></li>
              <li><Link to="/games" className="hover:text-white transition">Business Games</Link></li>
              <li><Link to="/board-members" className="hover:text-white transition">Board Members</Link></li>
              <li><Link to="/verify" className="hover:text-white transition">Verify a Certificate</Link></li>
            </ul>
          </div>

          <div>
            <h4 className="text-sm font-semibold text-white mb-3">Contact</h4>
            <ul className="space-y-2 text-sm">
              <li className="flex items-center gap-2"><Mail className="w-4 h-4" /> businessclub@kue.edu.et</li>
              <li className="flex items-center gap-2"><MapPin className="w-4 h-4" /> Addis Ababa, Ethiopia</li>
            </ul>
            <div className="flex gap-3 mt-4">
              <a href="#" className="w-9 h-9 rounded-lg bg-brand-900 hover:bg-brand-800 flex items-center justify-center transition"><AtSign className="w-4 h-4" /></a>
              <a href="#" className="w-9 h-9 rounded-lg bg-brand-900 hover:bg-brand-800 flex items-center justify-center transition"><Link2 className="w-4 h-4" /></a>
              <a href="#" className="w-9 h-9 rounded-lg bg-brand-900 hover:bg-brand-800 flex items-center justify-center transition"><Code className="w-4 h-4" /></a>
            </div>
          </div>
        </div>

        <div className="border-t border-brand-900 mt-10 pt-6 flex flex-col sm:flex-row justify-between gap-2 text-xs text-slate-500">
          <p>© {new Date().getFullYear()} Business Club at Kotebe University of Education. All rights reserved.</p>
          <p>Built for students, by students.</p>
        </div>
      </div>
    </footer>
  );
}
