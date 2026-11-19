import React from 'react';
import { Link } from 'react-router-dom';
import { ArrowRight } from 'lucide-react';
import { BlobVisual } from './BlobVisual';
import { AnimatedWord } from './AnimatedWord';
import { useAuth } from '../../context/AuthContext';

export const HeroSection: React.FC = () => {
  const { isAuthenticated } = useAuth();

  return (
    <div className="flex flex-col-reverse md:flex-row md:items-center gap-8 md:gap-12 py-6 md:py-10">

      {/* LEFT — Blob panel */}
      <div
        className="w-full md:w-[46%] rounded-3xl flex items-center justify-center py-10 md:py-14 min-h-[280px] md:min-h-[380px]"
        style={{ background: 'linear-gradient(145deg, #f0f7fa 0%, #daeef6 100%)' }}
      >
        <BlobVisual />
      </div>

      {/* RIGHT — Copy */}
      <div className="w-full md:w-[54%] flex flex-col gap-6 md:gap-8 md:pl-4">

        <div>
          <p className="text-xs font-semibold tracking-widest text-teal-600 uppercase mb-3">
            Personal health records
          </p>
          <h1 className="text-4xl md:text-5xl font-black leading-tight text-slate-900">
            — Your health history.
            <br />
            <AnimatedWord />
          </h1>
        </div>

        <p className="text-sm md:text-base text-slate-500 leading-relaxed max-w-sm">
          Upload your medical reports in one secure place and see how your health changes over time.
        </p>

        <div className="flex flex-wrap gap-3">
          {isAuthenticated ? (
            <>
              <Link
                to="/dashboard"
                className="inline-flex items-center gap-2 rounded-2xl bg-slate-900 px-6 py-3 text-sm font-bold text-white hover:bg-slate-700 transition-colors shadow-md"
              >
                <span>Open app</span>
                <ArrowRight className="h-4 w-4" />
              </Link>
              <Link
                to="/login"
                className="inline-flex items-center gap-2 rounded-2xl border-2 border-slate-200 bg-white px-6 py-3 text-sm font-bold text-slate-700 hover:border-slate-400 transition-colors"
              >
                Sign in
              </Link>
            </>
          ) : (
            <>
              <Link
                to="/signup"
                className="inline-flex items-center gap-2 rounded-2xl bg-slate-900 px-6 py-3 text-sm font-bold text-white hover:bg-slate-700 transition-colors shadow-md"
              >
                Get started
              </Link>
              <Link
                to="/login"
                className="inline-flex items-center gap-2 rounded-2xl border-2 border-slate-200 bg-white px-6 py-3 text-sm font-bold text-slate-700 hover:border-slate-400 transition-colors"
              >
                Sign in
              </Link>
            </>
          )}
        </div>
      </div>
    </div>
  );
};
