import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { GraduationCap, User, Mail, Lock, AlertCircle, UserPlus, IdCard, Building2, Loader2 } from 'lucide-react';
import { useAuth } from '../context/AuthContext.jsx';
import { signInWithGoogle, firebaseEnabled } from '../firebase.js';

export default function Signup() {
  const { signup, googleAuth } = useAuth();
  const navigate = useNavigate();
  const [form, setForm] = useState({ fullName: '', email: '', password: '', studentId: '', department: '' });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);

  const submit = async (e) => {
    e.preventDefault();
    setError('');
    if (form.password.length < 6) {
      setError('Password must be at least 6 characters.');
      return;
    }
    setLoading(true);
    try {
      await signup(form);
      navigate('/onboarding', { replace: true });
    } catch (err) {
      setError(err.message || 'Signup failed.');
    } finally {
      setLoading(false);
    }
  };

  const handleGoogle = async () => {
    setError('');
    setGoogleLoading(true);
    try {
      const idToken = await signInWithGoogle();
      const { isNewUser } = await googleAuth(idToken);
      navigate(isNewUser ? '/onboarding' : '/dashboard', { replace: true });
    } catch (err) {
      setError(err.message || 'Google sign-up failed.');
    } finally {
      setGoogleLoading(false);
    }
  };

  return (
    <div className="min-h-[calc(100vh-4rem)] flex items-center justify-center py-12 px-4 bg-gradient-to-br from-slate-50 to-brand-50">
      <div className="w-full max-w-md">
        <div className="text-center mb-6">
          <div className="w-14 h-14 rounded-2xl bg-brand-700 text-white flex items-center justify-center mx-auto mb-3 shadow-lg">
            <GraduationCap className="w-7 h-7" />
          </div>
          <h1 className="text-2xl font-bold text-brand-950">Join the Business Club</h1>
          <p className="text-sm text-slate-500 mt-1">Create your member account to get started</p>
        </div>

        <div className="card p-6 md:p-8">
          {error && (
            <div className="mb-4 flex items-start gap-2 rounded-lg bg-red-50 border border-red-200 p-3 text-sm text-red-700">
              <AlertCircle className="w-5 h-5 flex-shrink-0 mt-0.5" />
              <span>{error}</span>
            </div>
          )}

          {/* Google Sign-In */}
          <div className="mb-4">
            <button
              type="button"
              onClick={handleGoogle}
              disabled={googleLoading || !firebaseEnabled}
              className="btn-secondary w-full"
              title={!firebaseEnabled ? 'Google Sign-In is not configured yet.' : ''}
            >
              {googleLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : (
                <svg className="w-4 h-4" viewBox="0 0 24 24" aria-hidden="true">
                  <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                  <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                  <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
                  <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
                </svg>
              )}
              {googleLoading ? 'Signing up…' : 'Sign up with Google'}
            </button>
          </div>

          <div className="relative my-4">
            <div className="absolute inset-0 flex items-center"><div className="w-full border-t border-slate-200" /></div>
            <div className="relative flex justify-center text-xs"><span className="bg-white px-2 text-slate-400">or sign up with email</span></div>
          </div>

          <form onSubmit={submit} className="space-y-4">
            <div>
              <label className="label">Full name</label>
              <div className="relative">
                <User className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
                <input className="input pl-9" placeholder="Hanna Bekele" required
                  value={form.fullName} onChange={(e) => setForm({ ...form, fullName: e.target.value })} />
              </div>
            </div>
            <div>
              <label className="label">Email address</label>
              <div className="relative">
                <Mail className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
                <input type="email" className="input pl-9" placeholder="you@kue.edu.et" required
                  value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="label">Student ID <span className="text-slate-400 font-normal">(optional)</span></label>
                <div className="relative">
                  <IdCard className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
                  <input className="input pl-9" placeholder="KUE-2024-…"
                    value={form.studentId} onChange={(e) => setForm({ ...form, studentId: e.target.value })} />
                </div>
              </div>
              <div>
                <label className="label">Department <span className="text-slate-400 font-normal">(optional)</span></label>
                <div className="relative">
                  <Building2 className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
                  <input className="input pl-9" placeholder="Business Ed."
                    value={form.department} onChange={(e) => setForm({ ...form, department: e.target.value })} />
                </div>
              </div>
            </div>
            <div>
              <label className="label">Password</label>
              <div className="relative">
                <Lock className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
                <input type="password" className="input pl-9" placeholder="At least 6 characters" required
                  value={form.password} onChange={(e) => setForm({ ...form, password: e.target.value })} />
              </div>
            </div>
            <button type="submit" disabled={loading} className="btn-primary w-full">
              <UserPlus className="w-4 h-4" /> {loading ? 'Creating account…' : 'Create account'}
            </button>
          </form>
          <p className="text-xs text-slate-500 mt-4 text-center">
            By signing up, your membership starts as <span className="font-semibold text-amber-700">Pending</span> until verified by the board.
          </p>
        </div>

        <p className="text-center text-sm text-slate-500 mt-5">
          Already a member?{' '}
          <Link to="/login" className="text-brand-700 font-semibold hover:underline">Sign in</Link>
        </p>
      </div>
    </div>
  );
}
