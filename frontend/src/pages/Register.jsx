import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { BedDouble } from "lucide-react";
import { useAuth } from "../context/AuthContext";

const initialForm = { full_name: "", email: "", username: "", password: "", confirm_password: "" };

export default function Register() {
  const { register } = useAuth();
  const navigate = useNavigate();

  const [form, setForm] = useState(initialForm);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  function updateField(field, value) {
    setForm((prev) => ({ ...prev, [field]: value }));
  }

  async function handleSubmit(e) {
    e.preventDefault();
    setError("");
    setSubmitting(true);
    try {
      await register(form);
      setSuccess(true);
      setTimeout(() => navigate("/login"), 1200);
    } catch (err) {
      setError(err.message);
    } finally {
      setSubmitting(false);
    }
  }

  const fields = [
    { key: "full_name", label: "Full Name", type: "text", autoComplete: "name" },
    { key: "email", label: "Email", type: "email", autoComplete: "email" },
    { key: "username", label: "Username", type: "text", autoComplete: "username" },
    { key: "password", label: "Password", type: "password", autoComplete: "new-password" },
    { key: "confirm_password", label: "Confirm Password", type: "password", autoComplete: "new-password" },
  ];

  return (
    <div className="flex min-h-screen items-center justify-center bg-surface px-md py-lg">
      <div className="w-full max-w-sm rounded-lg border border-outline-variant bg-surface-container-lowest p-lg shadow-level1">
        <div className="mb-lg flex flex-col items-center text-center">
          <div className="mb-md flex h-12 w-12 items-center justify-center rounded-md bg-primary text-on-primary">
            <BedDouble size={26} />
          </div>
          <h1 className="text-headline-md">Create Account</h1>
          <p className="text-body-sm text-on-surface-variant">Luxor PMS Guest Registration</p>
        </div>

        {success ? (
          <p className="rounded-md bg-status-available-bg px-md py-sm text-center text-body-md text-status-available">
            Registration successful. Redirecting to login...
          </p>
        ) : (
          <form onSubmit={handleSubmit} className="flex flex-col gap-md">
            {fields.map(({ key, label, type, autoComplete }) => (
              <div key={key}>
                <label className="mb-1 block text-label-caps text-on-surface-variant">{label}</label>
                <input
                  type={type}
                  className="w-full rounded-md border border-outline-variant px-md py-sm text-body-md outline-none focus:border-primary"
                  value={form[key]}
                  onChange={(e) => updateField(key, e.target.value)}
                  autoComplete={autoComplete}
                  required
                />
              </div>
            ))}

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
              {submitting ? "Creating account..." : "Register"}
            </button>
          </form>
        )}

        <p className="mt-lg text-center text-body-sm text-on-surface-variant">
          Already have an account?{" "}
          <Link to="/login" className="text-primary hover:underline">
            Login
          </Link>
        </p>
      </div>
    </div>
  );
}
