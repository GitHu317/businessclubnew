import { useState, useEffect } from 'react';
import { api } from '../api/client.js';
import { useAuth } from '../context/AuthContext.jsx';
import { Spinner } from '../components/Common.jsx';
import { GraduationCap, Send, CheckCircle2, AlertCircle, Phone, Building, Image as ImageIcon, Globe, Briefcase, FileText, BookOpen } from 'lucide-react';

export default function InstructorApplication() {
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [existingApp, setExistingApp] = useState(null);
  const [successMsg, setSuccessMsg] = useState('');
  const [errorMsg, setErrorMsg] = useState('');

  const [form, setForm] = useState({
    fullName: user?.fullName || '',
    email: user?.email || '',
    phone: user?.phone || '',
    department: user?.department || '',
    photoUrl: user?.avatar || user?.photo || '',
    qualifications: '',
    experience: '',
    proposedCourse: '',
    website: '',
    bio: '',
    expertise: ''
  });

  useEffect(() => {
    // Fetch only the current logged-in user's application
    api.myInstructorApplication()
      .then((res) => {
        const myApp = res.application;
        if (myApp) {
          setExistingApp(myApp);
          
          // Parse expertise safely in case it is a stringified array
          let parsedExpertise = '';
          try {
            parsedExpertise = Array.isArray(myApp.expertise) 
              ? myApp.expertise.join(', ') 
              : JSON.parse(myApp.expertise).join(', ');
          } catch {
            parsedExpertise = myApp.expertise || '';
          }

          setForm({
            fullName: myApp.fullName || user?.fullName || '',
            email: myApp.email || user?.email || '',
            phone: myApp.phone || user?.phone || '',
            department: myApp.department || user?.department || '',
            photoUrl: myApp.photoUrl || user?.avatar || '',
            qualifications: myApp.qualifications || '',
            experience: myApp.experience || '',
            proposedCourse: myApp.proposedCourse || '',
            website: myApp.website || '',
            bio: myApp.bio || '',
            expertise: parsedExpertise
          });
        }
      })
      .catch((err) => console.error("Error loading application:", err))
      .finally(() => setLoading(false));
  }, [user]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setErrorMsg('');
    setSuccessMsg('');
    setSubmitting(true);

    try {
      const payload = {
        ...form,
        expertise: form.expertise.split(',').map(s => s.trim()).filter(Boolean)
      };
      
      await api.applyInstructor(payload);
      setSuccessMsg('Your instructor application has been submitted successfully!');
      
      // Refresh the specific user application status
      const res = await api.myInstructorApplication();
      if (res.application) setExistingApp(res.application);
      
    } catch (err) {
      setErrorMsg(err.message || 'Failed to submit application.');
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) return <Spinner label="Loading application status..." />;

  return (
    <div className="max-w-3xl mx-auto py-8 px-4 space-y-6">
      <div className="card p-6 sm:p-8 space-y-6">
        <div className="flex items-center gap-3 border-b border-slate-100 pb-5">
          <div className="w-12 h-12 rounded-xl bg-brand-50 text-brand-700 flex items-center justify-center font-bold">
            <GraduationCap className="w-6 h-6" />
          </div>
          <div>
            <h1 className="text-xl font-bold text-brand-950">Become an Instructor</h1>
            <p className="text-sm text-slate-500">Apply to create and teach professional courses on the Business Club platform.</p>
          </div>
        </div>

        {existingApp && (
          <div className={`p-4 rounded-xl flex items-start gap-3 ${
            existingApp.status === 'APPROVED' ? 'bg-emerald-50 text-emerald-800 border border-emerald-200' :
            existingApp.status === 'REJECTED' ? 'bg-red-50 text-red-800 border border-red-200' :
            'bg-amber-50 text-amber-800 border border-amber-200'
          }`}>
            {existingApp.status === 'APPROVED' ? <CheckCircle2 className="w-5 h-5 flex-shrink-0 text-emerald-600 mt-0.5" /> :
             existingApp.status === 'REJECTED' ? <AlertCircle className="w-5 h-5 flex-shrink-0 text-red-600 mt-0.5" /> :
             <GraduationCap className="w-5 h-5 flex-shrink-0 text-amber-600 mt-0.5" />}
            <div className="text-sm space-y-1">
              <span className="font-bold block">Application Status: {existingApp.status}</span>
              {existingApp.status === 'PENDING' && <p>Your application is currently under review by the Board of Directors.</p>}
              {existingApp.status === 'APPROVED' && <p>Congratulations! Your instructor application has been approved. You can now access course creation tools in your dashboard.</p>}
              {existingApp.status === 'REJECTED' && <p>Your application was not approved at this time. {existingApp.adminNote && `Reason: ${existingApp.adminNote}`}</p>}
            </div>
          </div>
        )}

        {successMsg && (
          <div className="p-4 rounded-xl bg-emerald-50 text-emerald-800 text-sm flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-600 flex-shrink-0" />
            <span>{successMsg}</span>
          </div>
        )}

        {errorMsg && (
          <div className="p-4 rounded-xl bg-red-50 text-red-800 text-sm flex items-center gap-2">
            <AlertCircle className="w-4 h-4 text-red-600 flex-shrink-0" />
            <span>{errorMsg}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wide mb-1">Full Name</label>
              <input
                type="text"
                required
                value={form.fullName}
                onChange={(e) => setForm({ ...form, fullName: e.target.value })}
                className="input text-sm w-full"
                placeholder="Enter your full name"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wide mb-1">Email Address</label>
              <input
                type="email"
                required
                value={form.email}
                onChange={(e) => setForm({ ...form, email: e.target.value })}
                className="input text-sm w-full"
                placeholder="Enter your email"
              />
            </div>
          </div>

          <div className="grid sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wide mb-1 flex items-center gap-1">
                <Phone className="w-3.5 h-3.5" /> Phone Number
              </label>
              <input
                type="text"
                required
                value={form.phone}
                onChange={(e) => setForm({ ...form, phone: e.target.value })}
                className="input text-sm w-full"
                placeholder="e.g. +251 912 345 678"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wide mb-1 flex items-center gap-1">
                <Building className="w-3.5 h-3.5" /> Department / Major
              </label>
              <input
                type="text"
                required
                value={form.department}
                onChange={(e) => setForm({ ...form, department: e.target.value })}
                className="input text-sm w-full"
                placeholder="e.g. Business Administration, Computer Science"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wide mb-1 flex items-center gap-1">
              <ImageIcon className="w-3.5 h-3.5" /> Applicant Photo Attachment (Image URL)
            </label>
            <input
              type="url"
              required
              value={form.photoUrl}
              onChange={(e) => setForm({ ...form, photoUrl: e.target.value })}
              className="input text-sm w-full"
              placeholder="https://example.com/your-photo.jpg"
            />
            <span className="text-[11px] text-slate-400 mt-1 block">Provide a direct link to a professional photo or avatar image.</span>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wide mb-1 flex items-center gap-1">
              <Briefcase className="w-3.5 h-3.5" /> Qualifications & Credentials
            </label>
            <textarea
              required
              rows={3}
              value={form.qualifications}
              onChange={(e) => setForm({ ...form, qualifications: e.target.value })}
              className="input text-sm w-full"
              placeholder="List your degrees, certifications, or relevant credentials..."
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wide mb-1 flex items-center gap-1">
              <FileText className="w-3.5 h-3.5" /> Teaching or Professional Experience
            </label>
            <textarea
              required
              rows={3}
              value={form.experience}
              onChange={(e) => setForm({ ...form, experience: e.target.value })}
              className="input text-sm w-full"
              placeholder="Describe your background in teaching, mentoring, or industry experience..."
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wide mb-1 flex items-center gap-1">
              <BookOpen className="w-3.5 h-3.5" /> Proposed Course Title & Summary
            </label>
            <textarea
              required
              rows={3}
              value={form.proposedCourse}
              onChange={(e) => setForm({ ...form, proposedCourse: e.target.value })}
              className="input text-sm w-full"
              placeholder="What course or courses do you plan to teach? Give a brief outline..."
            />
          </div>

          <div className="grid sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wide mb-1 flex items-center gap-1">
                <Globe className="w-3.5 h-3.5" /> Certificate / Portfolio Link
              </label>
              <input
                type="url"
                value={form.website}
                onChange={(e) => setForm({ ...form, website: e.target.value })}
                className="input text-sm w-full"
                placeholder="https://linkedin.com/in/yourprofile"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wide mb-1">Expertise / Skills (comma separated)</label>
              <input
                type="text"
                value={form.expertise}
                onChange={(e) => setForm({ ...form, expertise: e.target.value })}
                className="input text-sm w-full"
                placeholder="Leadership, Finance, Marketing, Python"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wide mb-1">Short Biography</label>
            <textarea
              rows={3}
              value={form.bio}
              onChange={(e) => setForm({ ...form, bio: e.target.value })}
              className="input text-sm w-full"
              placeholder="Tell us a little bit about yourself and your passion for teaching..."
            />
          </div>

          <div className="pt-2">
            <button
              type="submit"
              disabled={submitting}
              className="btn-primary w-full py-2.5 flex items-center justify-center gap-2 text-sm font-bold"
            >
              {submitting ? 'Submitting Application...' : <><Send className="w-4 h-4" /> Submit Instructor Application</>}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}