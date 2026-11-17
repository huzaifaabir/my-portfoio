import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext.jsx';
import { PageLoader } from './States.jsx';
import { useToast } from '../context/ToastContext.jsx';

// Admin area: must be logged in AND be a staff member in the database
export function RequireStaff({ children }) {
  const { firebaseUser, me, meError, loading, logout } = useAuth();
  const location = useLocation();
  if (loading) return <PageLoader label="Checking your access..." />;
  if (!firebaseUser) return <Navigate to="/admin/login" replace state={{ from: location.pathname }} />;
  if (!me) return <AccessDenied message={meError || 'This account does not have admin access.'} onLogout={logout} />;
  return children;
}

// Shows a page only when the staff member has a given permission (e.g. manageUsers)
export function RequirePermission({ permission, children }) {
  const { can } = useAuth();
  if (!can(permission)) return <AccessDenied message="You do not have permission to open this page." />;
  return children;
}

function AccessDenied({ message, onLogout }) {
  const toast = useToast();
  return (
    <div className="flex min-h-[60vh] flex-col items-center justify-center gap-4 px-6 text-center">
      <p className="text-5xl">🔒</p>
      <h1 className="text-2xl font-bold">Access denied</h1>
      <p role="alert" className="max-w-md text-muted">{message}</p>
      <div className="mt-2 flex gap-3">
        <a href="/" className="btn-ghost btn-sm">Back to website</a>
        {onLogout && (
          <button className="btn-primary btn-sm" onClick={() => onLogout().catch(() => toast.error('Could not log out.'))}>Log out</button>
        )}
      </div>
    </div>
  );
}
