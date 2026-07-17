import { Navigate } from 'react-router-dom';
import { useAdminAuth } from '../hooks/useAdminAuth';

export default function ProtectedRoute({ children }) {
  const { isAuthenticated, loading } = useAdminAuth();

  // Avoid redirecting to /login before we've confirmed whether the
  // httpOnly session cookie is still valid (e.g. on a hard page refresh).
  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-ivory">
        <p className="text-sm text-stone-400">Checking session…</p>
      </div>
    );
  }

  if (!isAuthenticated) {
    return <Navigate to="/admin/login" replace />;
  }

  return children;
}