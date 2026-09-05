import { Navigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext.jsx';

export function ProtectedRoute({ children, adminOnly = false, adminOrInstructor = false, presidentOnly = false }) {
  const { user, loading } = useAuth();
  if (loading) {
    return (
      <div className="min-h-[60vh] flex items-center justify-center">
        <div className="animate-spin rounded-full h-10 w-10 border-4 border-brand-200 border-t-brand-700" />
      </div>
    );
  }
  if (!user) return <Navigate to="/login" replace />;
  if (adminOnly && user.role !== 'ADMIN') return <Navigate to="/dashboard" replace />;
  
  if (adminOrInstructor && user.role !== 'ADMIN' && !user.creatorProfile?.approved) {
    return <Navigate to="/dashboard" replace />;
  }

  // Task 3 RBAC: only the President (bodRole === 'PRESIDENT') may access
  // President-only routes such as Board Members management.
  if (presidentOnly && user.bodRole !== 'PRESIDENT') return <Navigate to="/admin" replace />;
  return children;
}

export function MembershipBadge({ status }) {
  const cls = {
    PENDING: 'badge-pending',
    ACTIVE: 'badge-active',
    VERIFIED: 'badge-verified',
  }[status] || 'badge-pending';
  const labels = { PENDING: 'Pending', ACTIVE: 'Active', VERIFIED: 'Verified' };
  return <span className={cls}>{labels[status] || status}</span>;
}

export function Spinner({ label }) {
  return (
    <div className="min-h-[50vh] flex flex-col items-center justify-center gap-3">
      <div className="animate-spin rounded-full h-10 w-10 border-4 border-brand-200 border-t-brand-700" />
      {label && <p className="text-sm text-slate-500">{label}</p>}
    </div>
  );
}

export function EmptyState({ icon: Icon, title, description, action }) {
  return (
    <div className="card p-10 text-center">
      {Icon && <Icon className="w-12 h-12 mx-auto text-slate-300 mb-3" />}
      <h3 className="text-lg font-semibold text-slate-800">{title}</h3>
      {description && <p className="text-sm text-slate-500 mt-1 max-w-sm mx-auto">{description}</p>}
      {action && <div className="mt-4">{action}</div>}
    </div>
  );
}

export function ErrorState({ message }) {
  return (
    <div className="card p-8 text-center border-red-200 bg-red-50">
      <p className="text-red-700 font-medium">{message || 'Something went wrong.'}</p>
    </div>
  );
}
