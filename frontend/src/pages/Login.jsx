import { useState } from "react";
import { useLocation, useNavigate, Link } from "react-router-dom";
import { BedDouble, User, Lock, Eye, EyeOff } from "lucide-react";
import { useAuth } from "../context/AuthContext";

export default function Login() {
  const { login } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const from = location.state?.from?.pathname || "/";

  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);

  async function handleSubmit(e) {
    e.preventDefault();
    setError("");
    setSubmitting(true);
    try {
      await login(username, password);
      navigate(from, { replace: true });
    } catch (err) {
      setError(err.message);
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-surface px-md">
      <div className="w-full max-w-sm rounded-lg border border-outline-variant bg-surface-container-lowest p-lg shadow-level1">
        <div className="mb-lg flex flex-col items-center text-center">
          <div className="mb-md flex h-12 w-12 items-center justify-center rounded-md bg-primary text-on-primary">
            <BedDouble size={26} />
          </div>
          <h1 className="text-headline-md">Luxor PMS</h1>
          <p className="text-body-sm text-on-surface-variant">Admin Terminal v2.4</p>
        </div>

        <form onSubmit={handleSubmit} className="flex flex-col gap-md">
          <div>
            <label className="mb-1 block text-label-caps text-on-surface-variant">Username</label>
            <div className="flex items-center gap-2 rounded-md border border-outline-variant px-md py-sm focus-within:border-primary">
              <User size={16} className="text-on-surface-variant" />
              <input
                className="w-full bg-transparent text-body-md outline-none"
                placeholder="Enter your ID"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                autoComplete="username"
                required
              />
            </div>
          </div>

          <div>
            <div className="mb-1 flex items-center justify-between">
              <label className="text-label-caps text-on-surface-variant">Password</label>
              <button type="button" className="text-body-sm text-primary hover:underline">
                Forgot?
              </button>
            </div>
            <div className="flex items-center gap-2 rounded-md border border-outline-variant px-md py-sm focus-within:border-primary">
              <Lock size={16} className="text-on-surface-variant" />
              <input
                type={showPassword ? "text" : "password"}
                className="w-full bg-transparent text-body-md outline-none"
                placeholder="Enter your password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                autoComplete="current-password"
                required
              />
              <button type="button" onClick={() => setShowPassword((s) => !s)}>
                {showPassword ? (
                  <EyeOff size={16} className="text-on-surface-variant" />
                ) : (
                  <Eye size={16} className="text-on-surface-variant" />
                )}
              </button>
            </div>
          </div>

          {error && (
            <p className="rounded-md bg-error-container px-md py-sm text-body-sm text-on-error-container">
              {error}
            </p>
          )}

          <button
            type="submit"
            disabled={submitting}
            className="mt-xs rounded-md bg-primary py-sm text-body-md font-medium text-on-primary hover:opacity-90 disabled:opacity-60"
          >
            {submitting ? "Logging in..." : "Login →"}
          </button>
        </form>

        <p className="mt-lg text-center text-body-sm text-on-surface-variant">
          No account?{" "}
          <Link to="/register" className="text-primary hover:underline">
            Register
          </Link>
        </p>

        <div className="mt-md border-t border-outline-variant pt-md text-center">
          <p className="text-label-caps text-on-surface-variant">Secure Environment</p>
          <p className="mt-1 text-body-sm text-outline">
            Authorized use only. Session activities are monitored and logged for security compliance.
          </p>
        </div>
      </div>
    </div>
  );
}
