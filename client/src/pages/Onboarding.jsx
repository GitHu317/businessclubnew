import { useState } from 'react';
import { useNavigate, Navigate } from 'react-router-dom';
import { GraduationCap, User, Heart, Building2, Target, AlertCircle, Loader2, Sparkles, ArrowRight, ArrowLeft, CheckCircle2 } from 'lucide-react';
import { useAuth } from '../context/AuthContext.jsx';

const HEARD_ABOUT_OPTIONS = [
  'A friend or classmate',
  'Social media (Telegram, Instagram, Facebook)',
  'University announcement or flyer',
  'A professor or faculty member',
  'Google search',
  'Other',
];

const steps = [
  {
    id: 'fullName',
    title: "Let's get acquainted",
    question: "What is your full name?",
    placeholder: "Your full name",
    field: 'fullName',
    icon: User,
    type: 'text',
  },
  {
    id: 'heardAbout',
    title: "Curious minds!",
    question: "How did you hear about us?",
    field: 'heardAbout',
    icon: Heart,
    type: 'select',
    options: HEARD_ABOUT_OPTIONS,
  },
  {
    id: 'institution',
    title: "Your background",
    question: "Which school or institution are you attending?",
    placeholder: "e.g. Kotebe University of Education",
    field: 'institution',
    icon: Building2,
    type: 'text',
  },
  {
    id: 'usageGoals',
    title: "Almost done!",
    question: "What are your primary goals for using this platform?",
    placeholder: "e.g. I want to learn entrepreneurship skills, earn certificates, and connect with other students…",
    field: 'usageGoals',
    icon: Target,
    type: 'textarea',
  },
];

export default function Onboarding() {
  const { user, completeOnboarding } = useAuth();
  const navigate = useNavigate();
  const [currentStep, setCurrentStep] = useState(0);
  const [form, setForm] = useState({
    fullName: user?.fullName || '',
    heardAbout: '',
    institution: '',
    usageGoals: '',
  });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  // Already onboarded — no need to show the form.
  if (user?.hasOnboarded) {
    return <Navigate to="/dashboard" replace />;
  }

  const step = steps[currentStep];
  const IconComponent = step.icon;
  const progressPercentage = ((currentStep + 1) / steps.length) * 100;

  const handleNext = async (e) => {
    e.preventDefault();
    setError('');

    // Validate current step
    const val = form[step.field];
    if (!val || (typeof val === 'string' && !val.trim())) {
      setError('Please answer this question before continuing.');
      return;
    }

    if (currentStep < steps.length - 1) {
      setCurrentStep(currentStep + 1);
    } else {
      setLoading(true);
      try {
        await completeOnboarding(form);
        navigate('/dashboard', { replace: true });
      } catch (err) {
        setError(err.message || 'Could not save your answers. Please try again.');
        setLoading(false);
      }
    }
  };

  return (
    <div className="min-h-[calc(100vh-4rem)] flex items-center justify-center py-12 px-4 bg-gradient-to-br from-slate-50 to-brand-50">
      <div className="w-full max-w-xl">
        <div className="text-center mb-6">
          <div className="w-16 h-16 rounded-2xl bg-brand-700 text-white flex items-center justify-center mx-auto mb-3 shadow-lg">
            <Sparkles className="w-8 h-8" />
          </div>
          <h1 className="text-2xl md:text-3xl font-bold text-brand-950">Welcome to the Business Club! 🎉</h1>
          <p className="text-sm text-slate-500 mt-2 max-w-lg mx-auto">
            We're thrilled to have you here. Let's set up your profile one easy question at a time.
          </p>
        </div>

        <div className="card p-6 md:p-8 relative overflow-hidden">
          {/* Top Progress Bar */}
          <div className="absolute top-0 left-0 right-0 h-1.5 bg-slate-100">
            <div 
              className="h-full bg-amber-500 transition-all duration-300 ease-out" 
              style={{ width: `${progressPercentage}%` }}
            />
          </div>

          {/* Step Indicator & Back Button */}
          <div className="flex items-center justify-between mb-6 pt-2">
            <div className="flex items-center gap-2 text-brand-700 font-semibold text-xs uppercase tracking-wider">
              Step {currentStep + 1} of {steps.length}
            </div>
            {currentStep > 0 && (
              <button 
                type="button" 
                onClick={() => { setError(''); setCurrentStep(currentStep - 1); }}
                className="text-xs text-slate-400 hover:text-slate-600 flex items-center gap-1 transition"
              >
                <ArrowLeft className="w-3.5 h-3.5" /> Back
              </button>
            )}
          </div>

          {error && (
            <div className="mb-4 flex items-start gap-2 rounded-lg bg-red-50 border border-red-200 p-3 text-sm text-red-700">
              <AlertCircle className="w-5 h-5 flex-shrink-0 mt-0.5" />
              <span>{error}</span>
            </div>
          )}

          {/* Question Header */}
          <div className="mb-6">
            <div className="w-12 h-12 rounded-xl bg-brand-50 text-brand-700 flex items-center justify-center mb-3">
              <IconComponent className="w-6 h-6" />
            </div>
            <span className="text-xs font-semibold uppercase tracking-wider text-slate-400">{step.title}</span>
            <h2 className="text-xl md:text-2xl font-bold text-brand-950 mt-1">{step.question}</h2>
          </div>

          <form onSubmit={handleNext} className="space-y-6">
            {step.type === 'text' && (
              <div>
                <input
                  autoFocus
                  type="text"
                  required
                  placeholder={step.placeholder}
                  value={form[step.field]}
                  onChange={(e) => setForm({ ...form, [step.field]: e.target.value })}
                  className="input text-base py-3.5"
                />
              </div>
            )}

            {step.type === 'select' && (
              <div className="space-y-2.5">
                {step.options.map((option) => {
                  const isSelected = form[step.field] === option;
                  return (
                    <button
                      key={option}
                      type="button"
                      onClick={() => setForm({ ...form, [step.field]: option })}
                      className={`w-full text-left px-4 py-3.5 rounded-xl border text-sm font-medium transition flex items-center justify-between ${
                        isSelected 
                          ? 'border-brand-600 bg-brand-50/60 text-brand-950 ring-1 ring-brand-600' 
                          : 'border-slate-200 bg-white text-slate-700 hover:border-slate-300 hover:bg-slate-50'
                      }`}
                    >
                      <span>{option}</span>
                      <div className={`w-5 h-5 rounded-full border flex items-center justify-center ${isSelected ? 'border-brand-600 bg-brand-600 text-white' : 'border-slate-300'}`}>
                        {isSelected && <CheckCircle2 className="w-3.5 h-3.5" />}
                      </div>
                    </button>
                  );
                })}
              </div>
            )}

            {step.type === 'textarea' && (
              <div>
                <textarea
                  autoFocus
                  className="input text-base py-3"
                  rows={4}
                  placeholder={step.placeholder}
                  required
                  value={form[step.field]}
                  onChange={(e) => setForm({ ...form, [step.field]: e.target.value })}
                />
                <p className="text-xs text-slate-400 mt-1.5">This helps us recommend the right courses and activities for you.</p>
              </div>
            )}

            {/* Action Button */}
            <div className="pt-2 flex items-center justify-end">
              <button
                type="submit"
                disabled={loading}
                className="btn-primary w-full sm:w-auto px-6 py-3.5 text-base flex items-center justify-center gap-2 shadow-lg shadow-brand-900/10"
              >
                {loading ? (
                  <>
                    <Loader2 className="w-5 h-5 animate-spin" /> Saving…
                  </>
                ) : currentStep === steps.length - 1 ? (
                  <>Get started <CheckCircle2 className="w-5 h-5" /></>
                ) : (
                  <>Continue <ArrowRight className="w-5 h-5" /></>
                )}
              </button>
            </div>
          </form>
        </div>

        <p className="text-center text-xs text-slate-400 mt-4">
          You'll earn <span className="font-semibold text-amber-600">bonus XP</span> for completing your profile! ⚡
        </p>
      </div>
    </div>
  );
}