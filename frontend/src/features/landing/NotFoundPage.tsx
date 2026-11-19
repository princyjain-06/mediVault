import React from 'react';
import { Link } from 'react-router-dom';
import { ShieldCheck, ArrowLeft, Home } from 'lucide-react';

export const NotFoundPage: React.FC = () => {
  return (
    <div
      className="min-h-screen w-full flex items-center justify-center p-4 sm:p-6 md:p-10 font-sans"
      style={{ backgroundColor: '#C9DFE9' }}
    >
      <div className="w-full max-w-md rounded-[32px] bg-white p-8 sm:p-10 text-center shadow-2xl space-y-6">
        <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-teal-600 text-white shadow-lg shadow-teal-600/30">
          <ShieldCheck className="h-7 w-7" />
        </div>

        <div className="space-y-2">
          <p className="text-xs font-bold uppercase tracking-widest text-teal-600">404 Error</p>
          <h1 className="text-3xl font-black text-slate-900">Page not found</h1>
          <p className="text-xs sm:text-sm text-slate-500 leading-relaxed">
            The page you are looking for does not exist or has been moved.
          </p>
        </div>

        <div className="pt-2 flex flex-col sm:flex-row gap-2 justify-center">
          <Link
            to="/"
            className="inline-flex items-center justify-center gap-2 rounded-2xl bg-slate-900 px-5 py-3 text-xs font-bold text-white hover:bg-slate-700 transition-colors shadow-sm"
          >
            <Home className="h-4 w-4" />
            <span>Back to Home</span>
          </Link>
          <Link
            to="/login"
            className="inline-flex items-center justify-center gap-2 rounded-2xl border border-slate-200 bg-slate-50 px-5 py-3 text-xs font-bold text-slate-700 hover:bg-slate-100 transition-colors"
          >
            <ArrowLeft className="h-4 w-4" />
            <span>Sign In</span>
          </Link>
        </div>
      </div>
    </div>
  );
};
