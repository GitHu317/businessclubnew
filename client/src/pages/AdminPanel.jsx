import { useState } from 'react';
import { Routes, Route, NavLink, Navigate } from 'react-router-dom';
import {
  Shield, BookOpen, Award, Users, Gamepad2, LayoutDashboard, Megaphone, UserCheck, ScrollText,
  BarChart3, MessageSquare, GraduationCap, HelpCircle, Star, Trophy,
} from 'lucide-react';
import { useAuth } from '../context/AuthContext.jsx';
import AdminCourses from './admin/AdminCourses.jsx';
import AdminExams from './admin/AdminExams.jsx';
import AdminBoard from './admin/AdminBoard.jsx';
import AdminGames from './admin/AdminGames.jsx';
import AdminGameRegistrations from './admin/AdminGameRegistrations.jsx';
import AdminMembers from './admin/AdminMembers.jsx';
import AdminAnnouncements from './admin/AdminAnnouncements.jsx';
import AdminActivity from './admin/AdminActivity.jsx';
import AdminAnalytics from './admin/AdminAnalytics.jsx';
import AdminChat from './admin/AdminChat.jsx';
import AdminApplications from './admin/AdminApplications.jsx';
import AdminScreening from './admin/AdminScreening.jsx';
import AdminFAQ from './admin/AdminFAQ.jsx';
import AdminInstructors from './admin/AdminInstructors.jsx';
import AdminReviews from './admin/AdminReviews.jsx';

// Base tabs visible to every BOD / admin account.
const baseTabs = [
  { to: '/admin', end: true, label: 'Overview', icon: LayoutDashboard },
  { to: '/admin/analytics', label: 'Analytics', icon: BarChart3 },
  { to: '/admin/courses', label: 'Courses', icon: BookOpen },
  { to: '/admin/exams', label: 'Exams', icon: Award },
  { to: '/admin/games', label: 'Business Games', icon: Gamepad2 },
  { to: '/admin/game-registrations', label: 'Game Registrations', icon: UserCheck },
  { to: '/admin/members', label: 'Membership', icon: UserCheck },
  { to: '/admin/screening', label: 'Screening', icon: UserCheck },
  { to: '/admin/applications', label: 'Applications', icon: GraduationCap },
  { to: '/admin/instructors', label: 'Instructors', icon: Trophy },
  { to: '/admin/reviews', label: 'Reviews', icon: Star },
  { to: '/admin/chat', label: 'Board Chat', icon: MessageSquare },
  { to: '/admin/faq', label: 'FAQ', icon: HelpCircle },
  { to: '/admin/announcements', label: 'Announcements', icon: Megaphone },
];

// Tabs restricted to the President only (Task 3 RBAC + Task 4 audit trail).
const presidentTabs = [
  { to: '/admin/board', label: 'Board Members', icon: Users },
  { to: '/admin/activity', label: 'Activity Log', icon: ScrollText },
];

export default function AdminPanel() {
  const [mobileNav, setMobileNav] = useState(false);
  const { user } = useAuth();
  const isAdmin = user?.role === 'ADMIN';
  const isPresident = user?.bodRole === 'PRESIDENT';
  const isInstructorOnly = !isAdmin && !user?.bodRole && user?.creatorProfile?.approved;

  let tabs = isPresident
    ? [...baseTabs.slice(0, 5), ...presidentTabs, ...baseTabs.slice(5)]
    : baseTabs;

  if (isInstructorOnly) {
    tabs = baseTabs.filter((t) =>
      ['/admin', '/admin/courses', '/admin/exams', '/admin/reviews'].includes(t.to)
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="flex items-center gap-2 mb-6">
        <div className="w-10 h-10 rounded-lg bg-brand-900 text-gold-400 flex items-center justify-center">
          <Shield className="w-5 h-5" />
        </div>
        <div>
          <h1 className="text-2xl font-bold text-brand-950">Admin Panel</h1>
          <p className="text-sm text-slate-500">
            Manage the Business Club platform
            {isPresident ? ' · President view' : ' · BOD Member view'}
          </p>
        </div>
      </div>

      <div className="grid lg:grid-cols-[220px_1fr] gap-6">
        {/* Sidebar */}
        <aside>
          <button
            className="lg:hidden btn-secondary w-full mb-3 justify-start"
            onClick={() => setMobileNav((v) => !v)}
          >
            Navigation {mobileNav ? '▲' : '▼'}
          </button>
          <nav className={`card p-2 max-h-[80vh] overflow-y-auto ${mobileNav ? 'block' : 'hidden lg:block'}`}>
            {tabs.map((t) => (
              <NavLink
                key={t.to}
                to={t.to}
                end={t.end}
                onClick={() => setMobileNav(false)}
                className={({ isActive }) =>
                  `flex items-center gap-2.5 px-3 py-2.5 rounded-lg text-sm font-medium transition ${
                    isActive ? 'bg-brand-700 text-white' : 'text-slate-600 hover:bg-slate-100'
                  }`
                }
              >
                <t.icon className="w-4 h-4" />
                {t.label}
              </NavLink>
            ))}
          </nav>
        </aside>

     {/* Content */}
        <section>
          <Routes>
            <Route index element={<AdminOverview tabs={tabs} isPresident={isPresident} />} />
            <Route path="courses" element={<AdminCourses />} />
            <Route path="exams" element={<AdminExams />} />
            <Route path="reviews" element={<AdminReviews />} />

            {/* Protected routes for admins/BOD only */}
            <Route path="analytics" element={!isInstructorOnly ? <AdminAnalytics /> : <Navigate to="/admin/courses" replace />} />
            <Route path="games" element={!isInstructorOnly ? <AdminGames /> : <Navigate to="/admin/courses" replace />} />
            <Route path="game-registrations" element={!isInstructorOnly ? <AdminGameRegistrations /> : <Navigate to="/admin/courses" replace />} />
            <Route path="members" element={!isInstructorOnly ? <AdminMembers /> : <Navigate to="/admin/courses" replace />} />
            <Route path="screening" element={!isInstructorOnly ? <AdminScreening /> : <Navigate to="/admin/courses" replace />} />
            <Route path="applications" element={!isInstructorOnly ? <AdminApplications /> : <Navigate to="/admin/courses" replace />} />
            <Route path="instructors" element={!isInstructorOnly ? <AdminInstructors /> : <Navigate to="/admin/courses" replace />} />
            <Route path="chat" element={!isInstructorOnly ? <AdminChat /> : <Navigate to="/admin/courses" replace />} />
            <Route path="faq" element={!isInstructorOnly ? <AdminFAQ /> : <Navigate to="/admin/courses" replace />} />
            <Route path="announcements" element={!isInstructorOnly ? <AdminAnnouncements /> : <Navigate to="/admin/courses" replace />} />

            {/* President-only routes */}
            <Route path="board" element={isPresident ? <AdminBoard /> : <Navigate to="/admin" replace />} />
            <Route path="activity" element={isPresident ? <AdminActivity /> : <Navigate to="/admin" replace />} />
            <Route path="*" element={<Navigate to="/admin" replace />} />
          </Routes>
        </section>
      </div>
    </div>
  );
}

function AdminOverview({ tabs, isPresident }) {
  return (
    <div className="space-y-6">
      <div className="card p-6">
        <h2 className="text-lg font-bold text-brand-950 mb-2">Welcome to the Admin Panel</h2>
        <p className="text-sm text-slate-600">
          From here you can manage courses and lessons, create multi-type exams, schedule business games,
          verify member memberships, review instructor applications, moderate reviews, manage the FAQ,
          and chat with the Board.
          {isPresident
            ? ' As President you also manage Board Member profiles and review the BOD activity audit trail (with Delete Log access).'
            : ' Board Member management and the activity audit trail are reserved for the President.'}
        </p>
      </div>
      <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {tabs.slice(1).map((t) => (
          <NavLink key={t.to} to={t.to} className="card p-5 hover:shadow-lg transition flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-brand-50 text-brand-700 flex items-center justify-center">
              <t.icon className="w-5 h-5" />
            </div>
            <div>
              <div className="font-semibold text-brand-950">{t.label}</div>
              <div className="text-xs text-slate-500">Manage {t.label.toLowerCase()}</div>
            </div>
          </NavLink>
        ))}
      </div>
    </div>
  );
}
