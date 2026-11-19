import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { ShieldCheck, Menu, X } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';

const NAV_LINKS = [
  { label: 'Home',         href: '#home' },
  { label: 'How it works', href: '#how-it-works' },
  { label: 'Features',     href: '#features' },
  { label: 'Privacy',      href: '#privacy' },
  { label: 'Contact',      href: '#contact' },
];

export const LandingNavbar: React.FC = () => {
  const [open, setOpen] = useState(false);
  const { isAuthenticated } = useAuth();

  return (
    <nav className="flex items-center justify-between mb-6 md:mb-8" id="home">
      {/* Logo */}
      <Link to="/" className="flex items-center gap-2">
        <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-teal-600 text-white shadow shadow-teal-600/30">
          <ShieldCheck className="h-4 w-4" />
        </div>
        <span className="text-sm font-black text-slate-900">
          Medi<span className="text-teal-600">Vault</span>
        </span>
      </Link>

      {/* Desktop links */}
      <ul className="hidden md:flex items-center gap-6">
        {NAV_LINKS.map((l) => (
          <li key={l.label}>
            <a
              href={l.href}
              className="text-xs font-medium text-slate-500 hover:text-slate-900 transition-colors"
            >
              {l.label}
            </a>
          </li>
        ))}
      </ul>

      {/* Desktop Sign in / Open App */}
      {isAuthenticated ? (
        <Link
          to="/dashboard"
          className="hidden md:inline-flex text-xs font-semibold text-teal-700 hover:text-teal-900 transition-colors"
        >
          Open app →
        </Link>
      ) : (
        <Link
          to="/login"
          className="hidden md:inline-flex text-xs font-semibold text-teal-700 hover:text-teal-900 transition-colors"
        >
          Sign in →
        </Link>
      )}

      {/* Mobile hamburger */}
      <button
        className="md:hidden rounded-lg p-1.5 text-slate-500 hover:bg-slate-100"
        onClick={() => setOpen((v) => !v)}
        aria-label="Toggle menu"
      >
        {open ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
      </button>

      {/* Mobile drawer */}
      {open && (
        <div className="absolute top-0 left-0 right-0 z-50 bg-white rounded-b-2xl shadow-xl p-6 flex flex-col gap-4 md:hidden">
          <div className="flex items-center justify-between">
            <span className="text-sm font-black text-slate-900">
              Medi<span className="text-teal-600">Vault</span>
            </span>
            <button onClick={() => setOpen(false)} className="text-slate-400">
              <X className="h-5 w-5" />
            </button>
          </div>
          {NAV_LINKS.map((l) => (
            <a
              key={l.label}
              href={l.href}
              onClick={() => setOpen(false)}
              className="text-sm font-medium text-slate-600 hover:text-slate-900"
            >
              {l.label}
            </a>
          ))}
          {isAuthenticated ? (
            <Link
              to="/dashboard"
              onClick={() => setOpen(false)}
              className="text-sm font-semibold text-teal-700"
            >
              Open app →
            </Link>
          ) : (
            <Link
              to="/login"
              onClick={() => setOpen(false)}
              className="text-sm font-semibold text-teal-700"
            >
              Sign in →
            </Link>
          )}
        </div>
      )}
    </nav>
  );
};
