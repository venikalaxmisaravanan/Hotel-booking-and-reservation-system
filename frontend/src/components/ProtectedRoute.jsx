import { Navigate, useLocation } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

/**
 * Wraps any page that requires a logged-in user (everything except
 * /login and /register). While the auth context is still checking
 * sessionStorage for an existing token, it renders nothing rather than
 * flashing a redirect to /login.
 */
export default function ProtectedRoute({ children }) {
  const { user, loading } = useAuth();
  const location = useLocation();

  if (loading) return null;

  if (!user) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  return children;
}
