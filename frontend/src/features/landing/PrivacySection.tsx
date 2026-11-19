import React from 'react';
import { Lock, Trash2 } from 'lucide-react';

export const PrivacySection: React.FC = () => {
  return (
    <section id="privacy" className="mt-14 pt-10 border-t border-slate-100">
      <div className="rounded-2xl bg-teal-50/60 border border-teal-100 p-6 md:p-8 flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
        <div className="space-y-2 max-w-xl">
          <div className="flex items-center gap-2 text-teal-800">
            <Lock className="h-4 w-4" />
            <h3 className="text-sm font-bold uppercase tracking-wider">
              Privacy First & Patient Owned
            </h3>
          </div>
          <p className="text-xs md:text-sm text-slate-700 leading-relaxed">
            Your records are private to you alone. MediVault enforces end-to-end access boundaries:
            no third-party data sharing, and you have complete control to export or permanently delete your health records anytime.
          </p>
        </div>

        <div className="flex items-center gap-2 text-xs font-semibold text-teal-800 bg-white/80 px-4 py-2.5 rounded-xl border border-teal-200 shadow-sm shrink-0">
          <Trash2 className="h-4 w-4 text-rose-500" />
          <span>Delete your data anytime with one click</span>
        </div>
      </div>
    </section>
  );
};
