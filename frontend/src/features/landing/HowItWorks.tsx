import React from 'react';
import { UploadCloud, CheckCircle2, TrendingUp } from 'lucide-react';

const STEPS = [
  {
    step: '01',
    title: 'Upload a report',
    desc: 'Securely add lab results, imaging scans, prescriptions, or discharge summaries in PDF or image format.',
    icon: UploadCloud,
  },
  {
    step: '02',
    title: 'Confirm key details',
    desc: 'Verify simple metrics like test dates, diagnostic values, and provider names in a clean overview.',
    icon: CheckCircle2,
  },
  {
    step: '03',
    title: 'See trends over time',
    desc: 'Observe how vital markers and blood metrics evolve across months and years with intuitive visuals.',
    icon: TrendingUp,
  },
];

export const HowItWorks: React.FC = () => {
  return (
    <section id="how-it-works" className="mt-14 pt-10 border-t border-slate-100">
      <div className="text-center max-w-xl mx-auto mb-10">
        <p className="text-xs font-semibold tracking-wider text-teal-600 uppercase mb-2">
          Simple & Clear
        </p>
        <h2 className="text-2xl md:text-3xl font-extrabold text-slate-900">
          How MediVault Works
        </h2>
        <p className="mt-2 text-xs md:text-sm text-slate-500">
          Three simple steps to keep your health data structured and organized.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {STEPS.map((s) => {
          const Icon = s.icon;
          return (
            <div
              key={s.step}
              className="rounded-2xl border border-slate-100 bg-slate-50/60 p-6 flex flex-col justify-between hover:bg-slate-50 transition-colors"
            >
              <div>
                <div className="flex items-center justify-between mb-4">
                  <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-teal-100 text-teal-700">
                    <Icon className="h-5 w-5" />
                  </div>
                  <span className="text-xs font-bold text-slate-400">{s.step}</span>
                </div>
                <h3 className="text-sm font-bold text-slate-900 mb-2">{s.title}</h3>
                <p className="text-xs text-slate-500 leading-relaxed">{s.desc}</p>
              </div>
            </div>
          );
        })}
      </div>
    </section>
  );
};
