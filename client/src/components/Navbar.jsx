import { Link, NavLink, useNavigate } from 'react-router-dom';
import { useState } from 'react';
import {
  GraduationCap, Menu, X, LayoutDashboard, Users, BookOpen, Gamepad2,
  LogIn, LogOut, Shield, Award, Home, ChevronDown, HelpCircle, GraduationCap as TeachIcon,
} from 'lucide-react';
import { useAuth } from '../context/AuthContext.jsx';

const navItems = [
  { to: '/', label: 'Home', icon: Home, end: true },
  { to: '/courses', label: 'Courses', icon: BookOpen },
  { to: '/games', label: 'Business Games', icon: Gamepad2 },
  { to: '/board-members', label: 'Board Members', icon: Users },
  { to: '/faq', label: 'FAQ', icon: HelpCircle },
  { to: '/verify', label: 'Verify Certificate', icon: Award },
];

export default function Navbar() {
  const { user, logout } = useAuth();
  const [open, setOpen] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    setMenuOpen(false);
    setOpen(false);
    navigate('/');
  };

  return (
    <header className="sticky top-0 z-50 bg-white/90 backdrop-blur border-b border-slate-200">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Logo */}
          <Link to="/" className="flex items-center gap-2.5 group">
            <div className="w-10 h-10 rounded-lg bg-brand-700 flex items-center justify-center text-white shadow-sm group-hover:bg-brand-800 transition">
              <GraduationCap className="w-6 h-6" />
            </div>
            <div className="leading-tight hidden sm:block">
              <div className="text-sm font-bold text-brand-950">Business Club</div>
              <div className="text-[11px] text-slate-500">Kotebe University of Education</div>
            </div>
          </Link>

          {/* Desktop nav */}
          <nav className="hidden lg:flex items-center gap-1">
            {navItems.map((item) => (
              <NavLink
                key={item.to}
                to={item.to}
                end={item.end}
                className={({ isActive }) =>
                  `px-3 py-2 rounded-lg text-sm font-medium transition flex items-center gap-1.5 ${
                    isActive ? 'bg-brand-50 text-brand-700' : 'text-slate-600 hover:bg-slate-100'
                  }`
                }
              >
                <item.icon className="w-4 h-4" />
                {item.label}
              </NavLink>
            ))}
          </nav>

          {/* Auth area */}
          <div className="hidden lg:flex items-center gap-2">
            {user ? (
              <div className="relative">
                <button
                  onClick={() => setMenuOpen((v) => !v)}
                  className="flex items-center gap-2 px-3 py-2 rounded-lg hover:bg-slate-100 transition"
                >
                  <div className="w-8 h-8 rounded-full bg-brand-700 text-white flex items-center justify-center text-sm font-semibold">
                    {user.fullName.charAt(0).toUpperCase()}
                  </div>
                  <span className="text-sm font-medium text-slate-700 max-w-[120px] truncate">
                    {user.fullName.split(' ')[0]}
                  </span>
                  <ChevronDown className="w-4 h-4 text-slate-400" />
                </button>
                {menuOpen && (
                  <>
                    <div className="fixed inset-0 z-10" onClick={() => setMenuOpen(false)} />
                    <div className="absolute right-0 mt-2 w-56 card p-1.5 z-20">
                      <Link
                        to="/dashboard"
                        onClick={() => setMenuOpen(false)}
                        className="flex items-center gap-2 px-3 py-2 rounded-lg text-sm text-slate-700 hover:bg-slate-100"
                      >
                        <LayoutDashboard className="w-4 h-4" /> Dashboard
                      </Link>
                      <Link
                        to="/certificates"
                        onClick={() => setMenuOpen(false)}
                        className="flex items-center gap-2 px-3 py-2 rounded-lg text-sm text-slate-700 hover:bg-slate-100"
                      >
                        <Award className="w-4 h-4" /> My Certificates
                      </Link>
                      <Link
                        to="/become-instructor"
                        onClick={() => setMenuOpen(false)}
                        className="flex items-center gap-2 px-3 py-2 rounded-lg text-sm text-slate-700 hover:bg-slate-100"
                      >
                        <TeachIcon className="w-4 h-4" /> Become an Instructor
                      </Link>
                  {(user.role === 'ADMIN' || user.creatorProfile?.approved) && (
                        <Link
                          to={user.role === 'ADMIN' ? '/admin' : '/admin/courses'}
                          onClick={() => setMenuOpen(false)}
                          className="flex items-center gap-2 px-3 py-2 rounded-lg text-sm text-brand-700 hover:bg-brand-50"
                        >
                          <Shield className="w-4 h-4" /> {user.role === 'ADMIN' ? 'Admin Panel' : 'Instructor Studio'}
                        </Link>
                      )}
                      <hr className="my-1.5 border-slate-100" />
                      <button
                        onClick={handleLogout}
                        className="flex items-center gap-2 px-3 py-2 rounded-lg text-sm text-red-600 hover:bg-red-50 w-full"
                      >
                        <LogOut className="w-4 h-4" /> Sign out
                      </button>
                    </div>
                  </>
                )}
              </div>
            ) : (
              <>
                <Link to="/login" className="btn-ghost">
                  <LogIn className="w-4 h-4" /> Sign in
                </Link>
                <Link to="/signup" className="btn-primary">
                  Join the Club
                </Link>
              </>
            )}
          </div>

          {/* Mobile toggle */}
          <button
            className="lg:hidden p-2 rounded-lg hover:bg-slate-100"
            onClick={() => setOpen((v) => !v)}
            aria-label="Toggle menu"
          >
            {open ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
          </button>
        </div>
      </div>

      {/* Mobile menu */}
      {open && (
        <div className="lg:hidden border-t border-slate-200 bg-white">
          <nav className="px-4 py-3 space-y-1">
            {navItems.map((item) => (
              <NavLink
                key={item.to}
                to={item.to}
                end={item.end}
                onClick={() => setOpen(false)}
                className={({ isActive }) =>
                  `flex items-center gap-2.5 px-3 py-2.5 rounded-lg text-sm font-medium ${
                    isActive ? 'bg-brand-50 text-brand-700' : 'text-slate-700 hover:bg-slate-100'
                  }`
                }
              >
                <item.icon className="w-5 h-5" />
                {item.label}
              </NavLink>
            ))}
            <hr className="my-2 border-slate-100" />
            {user ? (
              <>
                <Link to="/dashboard" onClick={() => setOpen(false)} className="flex items-center gap-2.5 px-3 py-2.5 rounded-lg text-sm text-slate-700 hover:bg-slate-100">
                  <LayoutDashboard className="w-5 h-5" /> Dashboard
                </Link>
                <Link to="/certificates" onClick={() => setOpen(false)} className="flex items-center gap-2.5 px-3 py-2.5 rounded-lg text-sm text-slate-700 hover:bg-slate-100">
                  <Award className="w-5 h-5" /> My Certificates
                </Link>
                <Link to="/become-instructor" onClick={() => setOpen(false)} className="flex items-center gap-2.5 px-3 py-2.5 rounded-lg text-sm text-slate-700 hover:bg-slate-100">
                  <TeachIcon className="w-5 h-5" /> Become an Instructor
                </Link>
               {(user.role === 'ADMIN' || user.creatorProfile?.approved) && (
                  <Link to={user.role === 'ADMIN' ? '/admin' : '/admin/courses'} onClick={() => setOpen(false)} className="flex items-center gap-2.5 px-3 py-2.5 rounded-lg text-sm text-brand-700 hover:bg-brand-50">
                    <Shield className="w-5 h-5" /> {user.role === 'ADMIN' ? 'Admin Panel' : 'Instructor Studio'}
                  </Link>
                )}
                <button onClick={handleLogout} className="flex items-center gap-2.5 px-3 py-2.5 rounded-lg text-sm text-red-600 hover:bg-red-50 w-full">
                  <LogOut className="w-5 h-5" /> Sign out
                </button>
              </>
            ) : (
              <div className="flex flex-col gap-2 pt-2">
                <Link to="/login" onClick={() => setOpen(false)} className="btn-secondary w-full">Sign in</Link>
                <Link to="/signup" onClick={() => setOpen(false)} className="btn-primary w-full">Join the Club</Link>
              </div>
            )}
          </nav>
        </div>
      )}
    </header>
  );
}
