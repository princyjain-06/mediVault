import React from 'react';
import { Link } from 'react-router-dom';
import { ShieldCheck } from 'lucide-react';

interface LandingFooterProps {
  className?: string;
}

export const LandingFooter = React.forwardRef<HTMLElement, LandingFooterProps>(
  ({ className = '' }, ref) => {
    return (
      <footer
        ref={ref}
        className={`w-full py-12 px-6 sm:px-10 text-center font-sans ${className}`}
      >
        <div className="max-w-4xl mx-auto space-y-6">
          {/* Logo & Name */}
          <div className="flex items-center justify-center gap-2">
            <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-teal-600 text-white shadow shadow-teal-600/30">
              <ShieldCheck className="h-4 w-4" />
            </div>
            <span className="text-base font-black text-slate-800 tracking-tight">
              Medi<span className="text-teal-700">Vault</span>
            </span>
          </div>

          {/* Short Links: Privacy, Contact, Sign in */}
          <nav className="flex flex-wrap items-center justify-center gap-6 text-xs font-semibold text-slate-600">
            <a
              href="#privacy"
              className="hover:text-slate-900 transition-colors"
            >
              Privacy
            </a>
            <a
              href="#contact"
              className="hover:text-slate-900 transition-colors"
            >
              Contact
            </a>
            <Link
              to="/login"
              className="text-teal-800 hover:text-teal-950 transition-colors"
            >
              Sign in
            </Link>
          </nav>

          {/* Required Medical Disclaimer */}
          <p className="text-xs text-slate-600 max-w-lg mx-auto leading-relaxed">
            MediVault helps you organize your records. It does not replace professional medical advice.
          </p>

          {/* Copyright */}
          <p className="text-[11px] text-slate-500 pt-2">
            © {new Date().getFullYear()} MediVault. All rights reserved.
          </p>
        </div>
      </footer>
    );
  }
);

LandingFooter.displayName = 'LandingFooter';
