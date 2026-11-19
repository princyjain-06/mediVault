import React, { useState } from 'react';
import { useNavigate, useSearchParams, Link } from 'react-router-dom';
import { ShieldCheck, Mail, Lock, User, Eye, EyeOff, ArrowRight } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';

type Mode = 'signin' | 'signup';

interface AuthPageProps {
  defaultMode?: Mode;
}

export const AuthPage: React.FC<AuthPageProps> = ({ defaultMode }) => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { login, signup } = useAuth();

  const [mode, setMode] = useState<Mode>(() => {
    if (defaultMode) return defaultMode;
    return searchParams.get('mode') === 'signup' ? 'signup' : 'signin';
  });

  // Shared fields
  const [email, setEmail]       = useState('');
  const [password, setPassword] = useState('');
  const [showPw, setShowPw]     = useState(false);

  // Sign-up only
  const [name, setName]               = useState('');
  const [confirmPw, setConfirmPw]     = useState('');
  const [showConfirm, setShowConfirm] = useState(false);

  const [error, setError]     = useState('');
  const [loading, setLoading] = useState(false);

  const switchMode = (m: Mode) => {
    setMode(m);
    setError('');
    setEmail('');
    setPassword('');
    setName('');
    setConfirmPw('');
  };

  const validate = (): string => {
    if (mode === 'signup' && !name.trim())        return 'Full name is required.';
    if (!email.trim())                             return 'Email is required.';
    if (!/\S+@\S+\.\S+/.test(email))              return 'Enter a valid email address.';
    if (!password)                                 return 'Password is required.';
    if (mode === 'signup' && password.length < 8)  return 'Password must be at least 8 characters.';
    if (mode === 'signup' && password !== confirmPw) return 'Passwords do not match.';
    return '';
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const validationError = validate();
    if (validationError) { setError(validationError); return; }

    setLoading(true);
    setError('');

    try {
      if (mode === 'signin') {
        await login(email, password);
      } else {
        await signup(name.trim(), email, password);
      }
      navigate('/dashboard');
    } catch (err: any) {
      const msg: string =
        err?.response?.data?.error || err?.message || 'Something went wrong. Please try again.';

      if (err?.response?.status === 404 || err?.code === 'ERR_NETWORK') {
        setError('Cannot connect to the backend server. Please make sure your Spring Boot backend is running on http://localhost:8080.');
      } else if (msg.toLowerCase().includes('already exists')) {
        setError('An account with this email already exists. Try signing in.');
      } else if (msg.toLowerCase().includes('incorrect password')) {
        setError('Incorrect password. Please try again.');
      } else if (msg.toLowerCase().includes('no account')) {
        setError('No account found with that email. Please sign up first.');
      } else {
        setError(msg);
      }
    } finally {
      setLoading(false);
    }
  };

  const inputClass =
    'w-full rounded-xl border border-slate-200 bg-slate-50 py-2.5 pl-10 pr-4 text-xs text-slate-900 ' +
    'focus:border-teal-500 focus:bg-white focus:outline-none ' +
    'dark:border-slate-700 dark:bg-slate-800 dark:text-white dark:focus:border-teal-400';
  const iconClass  = 'absolute left-3.5 top-3 h-4 w-4 text-slate-400';
  const labelClass = 'text-xs font-semibold text-slate-700 dark:text-slate-300';

  return (
    <div className="flex min-h-screen items-center justify-center bg-slate-50 p-4 dark:bg-slate-950">
      <div className="w-full max-w-md rounded-3xl border border-slate-200 bg-white p-8 shadow-xl dark:border-slate-800 dark:bg-slate-900 space-y-6">

        {/* Brand */}
        <Link to="/" className="flex flex-col items-center text-center group cursor-pointer">
          <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-teal-600 text-white shadow-lg shadow-teal-600/30 group-hover:scale-105 transition-transform">
            <ShieldCheck className="h-6 w-6" />
          </div>
          <h1 className="mt-4 text-2xl font-black text-slate-900 dark:text-white">
            Medi<span className="text-teal-600 dark:text-teal-400">Vault</span>
          </h1>
          <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
            Your secure personal health record
          </p>
        </Link>

        {/* Tab switcher */}
        <div className="flex rounded-xl bg-slate-100 p-1 dark:bg-slate-800">
          {(['signin', 'signup'] as Mode[]).map((m) => (
            <button
              key={m}
              type="button"
              onClick={() => switchMode(m)}
              className={`flex-1 rounded-lg py-2 text-xs font-bold transition-all ${
                mode === m
                  ? 'bg-white text-teal-700 shadow dark:bg-slate-700 dark:text-teal-300'
                  : 'text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-200'
              }`}
            >
              {m === 'signin' ? 'Sign In' : 'Sign Up'}
            </button>
          ))}
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="space-y-4" noValidate>

          {/* Full name — sign-up only */}
          {mode === 'signup' && (
            <div>
              <label className={labelClass}>Full Name</label>
              <div className="relative mt-1">
                <User className={iconClass} />
                <input
                  type="text"
                  placeholder="e.g. Rajesh Sharma"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className={inputClass}
                  autoComplete="name"
                />
              </div>
            </div>
          )}

          {/* Email */}
          <div>
            <label className={labelClass}>Email</label>
            <div className="relative mt-1">
              <Mail className={iconClass} />
              <input
                type="email"
                placeholder="you@example.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className={inputClass}
                autoComplete="email"
              />
            </div>
          </div>

          {/* Password */}
          <div>
            <label className={labelClass}>Password</label>
            <div className="relative mt-1">
              <Lock className={iconClass} />
              <input
                type={showPw ? 'text' : 'password'}
                placeholder={mode === 'signup' ? 'At least 8 characters' : 'Your password'}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className={`${inputClass} pr-10`}
                autoComplete={mode === 'signup' ? 'new-password' : 'current-password'}
              />
              <button
                type="button"
                onClick={() => setShowPw((v) => !v)}
                className="absolute right-3 top-2.5 text-slate-400 hover:text-slate-600"
                tabIndex={-1}
              >
                {showPw ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
              </button>
            </div>
          </div>

          {/* Confirm password — sign-up only */}
          {mode === 'signup' && (
            <div>
              <label className={labelClass}>Confirm Password</label>
              <div className="relative mt-1">
                <Lock className={iconClass} />
                <input
                  type={showConfirm ? 'text' : 'password'}
                  placeholder="Repeat your password"
                  value={confirmPw}
                  onChange={(e) => setConfirmPw(e.target.value)}
                  className={`${inputClass} pr-10`}
                  autoComplete="new-password"
                />
                <button
                  type="button"
                  onClick={() => setShowConfirm((v) => !v)}
                  className="absolute right-3 top-2.5 text-slate-400 hover:text-slate-600"
                  tabIndex={-1}
                >
                  {showConfirm ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
            </div>
          )}

          {/* Error banner */}
          {error && (
            <div className="rounded-xl bg-rose-50 px-4 py-3 text-xs font-medium text-rose-700 dark:bg-rose-950/40 dark:text-rose-400">
              {error}
            </div>
          )}

          {/* Submit */}
          <button
            type="submit"
            disabled={loading}
            className="flex w-full items-center justify-center gap-2 rounded-2xl bg-teal-600 py-3 text-xs font-bold text-white shadow-lg shadow-teal-600/30 hover:bg-teal-700 disabled:opacity-50 transition-colors"
          >
            <span>
              {loading
                ? mode === 'signin' ? 'Signing in…' : 'Creating account…'
                : mode === 'signin' ? 'Sign In' : 'Create Account'}
            </span>
            <ArrowRight className="h-4 w-4" />
          </button>
        </form>

        {/* Demo Accounts Quick-Select */}
        {mode === 'signin' && (
          <div className="pt-2 border-t border-slate-100 dark:border-slate-800 space-y-2">
            <p className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider text-center">
              Or Try Demo Profiles
            </p>
            <div className="grid grid-cols-3 gap-1.5">
              {[
                { name: 'Rajesh', email: 'rajesh.sharma@example.com' },
                { name: 'Priya', email: 'priya.patel@example.com' },
                { name: 'Vikram', email: 'vikram.malhotra@example.com' },
              ].map((acc) => (
                <button
                  key={acc.email}
                  type="button"
                  onClick={() => {
                    setEmail(acc.email);
                    setPassword('Password@123');
                    setError('');
                  }}
                  className="rounded-xl border border-slate-200 bg-slate-50 px-2 py-1.5 text-[11px] font-semibold text-slate-700 hover:border-teal-500 hover:bg-teal-50 hover:text-teal-800 transition-colors dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200"
                >
                  {acc.name}
                </button>
              ))}
            </div>
            <p className="text-[10px] text-slate-400 text-center">
              Password: <code className="font-mono text-slate-600 dark:text-slate-300">Password@123</code>
            </p>
          </div>
        )}

        <p className="text-center text-[11px] text-slate-400">
          Protected by Ayushman Bharat Digital Mission (ABDM) standards.
        </p>
      </div>
    </div>
  );
};
