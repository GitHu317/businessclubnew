import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext.jsx';
import Navbar from './components/Navbar.jsx';
import Footer from './components/Footer.jsx';
import { ProtectedRoute } from './components/Common.jsx';

import Home from './pages/Home.jsx';
import Login from './pages/Login.jsx';
import Signup from './pages/Signup.jsx';
import Onboarding from './pages/Onboarding.jsx';
import Dashboard from './pages/Dashboard.jsx';
import BoardMembers from './pages/BoardMembers.jsx';
import Courses from './pages/Courses.jsx';
import CourseDetail from './pages/CourseDetail.jsx';
import ExamPage from './pages/ExamPage.jsx';
import Certificates from './pages/Certificates.jsx';
import Verify from './pages/Verify.jsx';
import Games from './pages/Games.jsx';
import FAQ from './pages/FAQ.jsx';
import InstructorApplication from './pages/InstructorApplication.jsx';
import InstructorProfileModal from './pages/InstructorProfileModal.jsx';
import AdminPanel from './pages/AdminPanel.jsx';
import NotFound from './pages/NotFound.jsx';

export default function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <div className="min-h-screen flex flex-col">
          <Navbar />
          <main className="flex-1">
            <Routes>
              <Route path="/" element={<Home />} />
              <Route path="/login" element={<Login />} />
              <Route path="/signup" element={<Signup />} />
              <Route path="/board-members" element={<BoardMembers />} />
              <Route path="/courses" element={<Courses />} />
              <Route path="/courses/:slug" element={<CourseDetail />} />
              <Route path="/games" element={<Games />} />
              <Route path="/faq" element={<FAQ />} />
              <Route path="/verify" element={<Verify />} />
              <Route path="/verify/:id" element={<Verify />} />
              <Route path="/instructors/:id" element={<InstructorProfileModal />} />
              <Route path="/onboarding" element={<ProtectedRoute><Onboarding /></ProtectedRoute>} />
              <Route path="/dashboard" element={<ProtectedRoute><Dashboard /></ProtectedRoute>} />
              <Route path="/become-instructor" element={<ProtectedRoute><InstructorApplication /></ProtectedRoute>} />
              <Route path="/courses/:slug/exams/:examId" element={<ProtectedRoute><ExamPage /></ProtectedRoute>} />
              <Route path="/certificates" element={<ProtectedRoute><Certificates /></ProtectedRoute>} />
              <Route path="/certificates/:id" element={<ProtectedRoute><Certificates /></ProtectedRoute>} />
              <Route path="/admin/*" element={<ProtectedRoute adminOrInstructor><AdminPanel /></ProtectedRoute>} />
              <Route path="*" element={<NotFound />} />
            </Routes>
          </main>
          <Footer />
        </div>
      </BrowserRouter>
    </AuthProvider>
  );
}
