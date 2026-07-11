import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext.jsx';

function getFriendlyLoginError(serverError, statusCode) {
  const msg = (serverError || '').toLowerCase();

  if (statusCode === 401 || msg.includes('invalid email or password')) {
    return {
      text: "Hmm, that combination doesn't match our records. Double-check your email and password and give it another go.",
      action: { label: 'Create an account instead', to: '/register' },
    };
  }

  if (statusCode === 400 || msg.includes('required')) {
    return {
      text: 'Please fill in both your email and password to continue.',
      action: null,
    };
  }

  if (statusCode >= 500) {
    return {
      text: "Something went wrong on our end — it's not you, it's us. Please try again in a moment.",
      action: null,
    };
  }

  if (msg.includes('network') || msg.includes('econnrefused')) {
    return {
      text: "Can't reach the server right now. Check your internet connection and try again.",
      action: null,
    };
  }

  return {
    text: serverError || "Something unexpected happened. Let's try that again.",
    action: null,
  };
}

export default function Login() {
  const { login } = useAuth();
  const navigate = useNavigate();
  const [form, setForm] = useState({ email: '', password: '' });
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e) {
    e.preventDefault();
    setError(null);

    // Client-side validation with specific messages
    if (!form.email.trim()) {
      setError({ text: "We'll need your email address to find your account.", action: null });
      return;
    }

    if (!form.password) {
      setError({ text: 'Enter your password to unlock your encrypted conversations.', action: null });
      return;
    }

    setLoading(true);
    try {
      await login(form);
      navigate('/chat');
    } catch (err) {
      const serverMsg = err.response?.data?.error;
      const status = err.response?.status;
      setError(getFriendlyLoginError(serverMsg, status));
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="auth-page">
      <form className="auth-card" onSubmit={handleSubmit}>
        <div className="auth-brand">
          <div className="auth-brand-icon">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <rect x="3" y="11" width="18" height="11" rx="2" ry="2" />
              <path d="M7 11V7a5 5 0 0 1 10 0v4" />
            </svg>
          </div>
          <h1>Welcome back</h1>
        </div>

        <div className="auth-field">
          <svg className="auth-field-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <rect x="2" y="4" width="20" height="16" rx="2" />
            <path d="m22 7-8.97 5.7a1.94 1.94 0 0 1-2.06 0L2 7" />
          </svg>
          <input
            id="login-email"
            type="email"
            placeholder="Email"
            value={form.email}
            onChange={(e) => setForm({ ...form, email: e.target.value })}
            required
          />
        </div>

        <div className="auth-field">
          <svg className="auth-field-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <rect x="3" y="11" width="18" height="11" rx="2" ry="2" />
            <path d="M7 11V7a5 5 0 0 1 10 0v4" />
          </svg>
          <input
            id="login-password"
            type="password"
            placeholder="Password"
            value={form.password}
            onChange={(e) => setForm({ ...form, password: e.target.value })}
            required
          />
        </div>

        {error && (
          <div className="auth-error">
            <span>{error.text}</span>
            {error.action && (
              <Link to={error.action.to} className="auth-error-action">
                {error.action.label}
              </Link>
            )}
          </div>
        )}

        <button type="submit" disabled={loading}>
          {loading ? 'Logging in…' : 'Log in'}
        </button>

        <p>
          Need an account? <Link to="/register">Register</Link>
        </p>
      </form>
    </div>
  );
}
