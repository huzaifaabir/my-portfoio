import { useState } from 'react';
import { Link, Navigate, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext.jsx';
import { useToast } from '../../context/ToastContext.jsx';
import { useDocumentTitle } from '../../hooks/useDocumentTitle.js';
import { errorMessage, isEmail } from '../../lib/format.js';
import { firebaseReady } from '../../firebase.js';
import { Field, Input } from '../../components/Form.jsx';
import { Spinner } from '../../components/States.jsx';

export default function Login() {
  const { login, resetPassword, me, loading } = useAuth();
  const toast = useToast();
  const navigate = useNavigate();
  const location = useLocation();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [emailError, setEmailError] = useState('');
  useDocumentTitle('Admin login');

  if (!loading && me) return <Navigate to={location.state?.from || '/admin'} replace />;

  async function submit(e) {
    e.preventDefault();
    setError('');
    if (!isEmail(email.trim())) return setEmailError('Please enter a valid email address.');
    setEmailError('');
    if (!password) return setError('Please enter your password.');
    setBusy(true);
    try {
      await login(email, password);
      navigate(location.state?.from || '/admin', { replace: true });
    } catch (err) {
      setError(errorMessage(err));
    } finally {
      setBusy(false);
    }
  }

  async function forgot() {
    setEmailError('');
    if (!isEmail(email.trim())) return setEmailError('Enter your email above first, then click "Forgot password".');
    try {
      await resetPassword(email);
      toast.success('Password reset email sent. Check your inbox.');
    } catch (err) {
      toast.error(errorMessage(err));
    }
  }

  return (
    <div className="relative flex min-h-screen items-center justify-center overflow-hidden px-5 py-16">
      <div aria-hidden="true" className="pointer-events-none absolute left-1/2 top-0 h-[480px] w-[700px] -translate-x-1/2 rounded-full opacity-25 blur-3xl" style={{ background: 'radial-gradient(closest-side,var(--color-accent-2),transparent)' }} />
      <div className="w-full max-w-md">
        <Link to="/" className="mb-8 block text-center text-sm text-muted hover:text-white">← Back to website</Link>
        <div className="card p-8 sm:p-10">
          <p className="eyebrow">Admin</p>
          <h1 className="mt-2 text-3xl font-bold">Sign in</h1>
          <p className="mt-2 text-sm text-muted">Use the email and password from your invitation.</p>

          {!firebaseReady && (
            <div role="alert" className="mt-6 rounded-xl border border-danger/40 bg-danger/10 p-4 text-sm text-red-100">
              Firebase is not configured yet. Add the <code>VITE_FIREBASE_*</code> values to <code>client/.env</code> and restart the dev server.
            </div>
          )}

          <form onSubmit={submit} noValidate className="mt-8 space-y-5">
            <Field label="Email" htmlFor="login-email" error={emailError}>
              <Input id="login-email" type="email" autoComplete="username" value={email} onChange={(e) => setEmail(e.target.value)} invalid={!!emailError} />
            </Field>
            <Field label="Password" htmlFor="login-password">
              <Input id="login-password" type="password" autoComplete="current-password" value={password} onChange={(e) => setPassword(e.target.value)} />
            </Field>
            {error && <p role="alert" className="error-text">{error}</p>}
            <button type="submit" className="btn-primary w-full" disabled={busy || !firebaseReady}>
              {busy ? <><Spinner className="h-4 w-4 border-white/40 border-t-white" /> Signing in...</> : 'Sign in'}
            </button>
            <button type="button" onClick={forgot} className="w-full text-center text-sm text-muted hover:text-white">Forgot password?</button>
          </form>
        </div>
      </div>
    </div>
  );
}
