import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Eye, EyeOff, Shield } from 'lucide-react';
import { useAuth } from '../context/AuthContext.jsx';
import ThemeToggle from '../components/ThemeToggle.jsx';

export default function Login() {
  const { login } = useAuth();
  const navigate = useNavigate();
  const [form, setForm] = useState({ email: '', password: '' });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [forgotPasswordClicked, setForgotPasswordClicked] = useState(false);

  async function handleSubmit(e) {
    e.preventDefault();
    setError('');
    setForgotPasswordClicked(false);
    setLoading(true);
    try {
      await login(form);
      navigate('/chat');
    } catch (err) {
      setError(err.response?.data?.error || 'Invalid credentials or connection failure.');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="auth-page">
      <div className="auth-page-topbar">
        <ThemeToggle />
      </div>

      <form className="auth-card" onSubmit={handleSubmit}>
        <div className="auth-brand">
          <Link to="/" className="auth-brand-home" aria-label="QuantumChat home">
            <span className="auth-brand-icon">
              <Shield size={22} strokeWidth={2} aria-hidden="true" />
            </span>
          </Link>
          <p className="auth-brand-name">QuantumChat</p>
          <h1>Welcome back</h1>
          <p className="auth-subtitle">Sign in to decrypt your conversations.</p>
        </div>

        <label className="auth-label" htmlFor="login-email">
          Email address
        </label>
        <div className="auth-field">
          <svg className="auth-field-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
            <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z" />
            <polyline points="22,6 12,13 2,6" />
          </svg>
          <input
            id="login-email"
            type="email"
            placeholder="name@example.com"
            value={form.email}
            onChange={(e) => setForm({ ...form, email: e.target.value })}
            required
            autoComplete="email"
          />
        </div>

        <div className="auth-label-row">
          <label className="auth-label" htmlFor="login-password">
            Password
          </label>
          <button
            type="button"
            className="auth-text-btn"
            onClick={() => setForgotPasswordClicked((v) => !v)}
          >
            Forgot password?
          </button>
        </div>
        <div className="auth-field">
          <svg className="auth-field-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
            <rect x="3" y="11" width="18" height="11" rx="2" ry="2" />
            <path d="M7 11V7a5 5 0 0 1 10 0v4" />
          </svg>
          <input
            id="login-password"
            type={showPassword ? 'text' : 'password'}
            placeholder="Your password"
            value={form.password}
            onChange={(e) => setForm({ ...form, password: e.target.value })}
            required
            autoComplete="current-password"
          />
          <button
            type="button"
            className="auth-password-toggle"
            onClick={() => setShowPassword((v) => !v)}
            aria-label={showPassword ? 'Hide password' : 'Show password'}
          >
            {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
          </button>
        </div>

        {forgotPasswordClicked && (
          <div className="auth-notice" role="note">
            <strong>Account recovery</strong>
            <p>
              QuantumChat uses end-to-end encryption. Passwords cannot be reset by the server. To read your
              history on a new device, import your saved <code>keys.txt</code> file after signing in.
            </p>
          </div>
        )}

        {error && <div className="auth-error">{error}</div>}

        <button type="submit" className="auth-submit" disabled={loading}>
          {loading ? 'Signing in…' : 'Sign in'}
        </button>

        <p>
          Don&apos;t have an account? <Link to="/register">Create one</Link>
        </p>
      </form>
    </div>
  );
}
