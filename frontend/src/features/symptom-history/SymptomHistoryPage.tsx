import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  History, 
  Sparkles, 
  Calendar, 
  Eye, 
  X 
} from 'lucide-react';
import { usePatient } from '../../context/PatientContext';
import { symptomService } from '../../api/symptomService';
import { SymptomAnalysis } from '../../types';
import { formatDate, cn } from '../../lib/utils';

export const SymptomHistoryPage: React.FC = () => {
  const navigate = useNavigate();
  const { activePatient } = usePatient();
  const [history, setHistory] = useState<SymptomAnalysis[]>([]);
  const [selectedAnalysis, setSelectedAnalysis] = useState<SymptomAnalysis | null>(null);
  const [filterTier, setFilterTier] = useState<string>('all');

  useEffect(() => {
    if (activePatient) {
      symptomService.getHistoryByPatient(activePatient.id).then((data) => setHistory(data));
    }
  }, [activePatient]);

  const filteredHistory = history.filter((item) => {
    if (filterTier === 'all') return true;
    return item.triageTier === filterTier;
  });

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 dark:text-white flex items-center gap-2">
            <History className="h-6 w-6 text-teal-600 dark:text-teal-400" />
            AI Symptom Check History
          </h1>
          <p className="text-sm text-slate-500 dark:text-slate-400">
            Past AI symptom evaluations and clinical triage snapshots for {activePatient?.name}
          </p>
        </div>

        <button
          onClick={() => navigate('/symptom-checker')}
          className="flex items-center gap-2 rounded-2xl bg-teal-600 px-5 py-3 text-xs font-bold text-white shadow-md hover:bg-teal-700 self-start sm:self-auto"
        >
          <Sparkles className="h-4 w-4" /> Start New Check
        </button>
      </div>

      {/* Filter Tabs */}
      <div className="flex gap-2">
        {['all', 'urgent', 'routine', 'emergency'].map((tier) => (
          <button
            key={tier}
            onClick={() => setFilterTier(tier)}
            className={cn(
              "rounded-xl px-4 py-2 text-xs font-bold uppercase transition-all",
              filterTier === tier
                ? "bg-slate-900 text-white dark:bg-slate-100 dark:text-slate-900"
                : "bg-slate-100 text-slate-600 hover:bg-slate-200 dark:bg-slate-800 dark:text-slate-300"
            )}
          >
            {tier}
          </button>
        ))}
      </div>

      {/* History List */}
      {filteredHistory.length === 0 ? (
        <div className="rounded-2xl border border-slate-200 bg-white p-12 text-center dark:border-slate-800 dark:bg-slate-900">
          <History className="mx-auto h-12 w-12 text-slate-300" />
          <h3 className="mt-3 text-base font-bold text-slate-700 dark:text-slate-300">
            No evaluations found
          </h3>
          <p className="mt-1 text-xs text-slate-500">
            Run an AI symptom check to record clinical correlations.
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          {filteredHistory.map((item) => (
            <div
              key={item.id}
              className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm transition-all hover:border-teal-300 dark:border-slate-800 dark:bg-slate-900 space-y-4"
            >
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
                <div className="flex items-center gap-3">
                  <span
                    className={cn(
                      "rounded-lg px-2.5 py-1 text-xs font-bold uppercase",
                      item.triageTier === 'urgent'
                        ? "bg-rose-100 text-rose-700 dark:bg-rose-950 dark:text-rose-300"
                        : item.triageTier === 'emergency'
                        ? "bg-red-200 text-red-800 dark:bg-red-950 dark:text-red-200"
                        : "bg-teal-100 text-teal-700 dark:bg-teal-950 dark:text-teal-300"
                    )}
                  >
                    {item.triageTier}
                  </span>
                  <h3 className="text-base font-bold text-slate-900 dark:text-white">
                    {item.urgencyHeadline}
                  </h3>
                </div>

                <div className="flex items-center gap-3 text-xs text-slate-500">
                  <span className="flex items-center gap-1">
                    <Calendar className="h-3.5 w-3.5" />
                    {formatDate(item.checkDate)}
                  </span>
                  <button
                    onClick={() => setSelectedAnalysis(item)}
                    className="flex items-center gap-1 font-bold text-teal-600 hover:text-teal-700 dark:text-teal-400"
                  >
                    <Eye className="h-4 w-4" /> View Details
                  </button>
                </div>
              </div>

              {/* Symptoms reported pill list */}
              <div className="flex flex-wrap gap-2 pt-1">
                {item.reportedSymptoms.map((sym, idx) => (
                  <span
                    key={idx}
                    className="rounded-lg bg-slate-100 px-2.5 py-1 text-xs font-semibold text-slate-700 dark:bg-slate-800 dark:text-slate-300"
                  >
                    {sym.name} ({sym.severity})
                  </span>
                ))}
              </div>

              {/* Explanation excerpt */}
              <p className="text-xs text-slate-600 dark:text-slate-400 line-clamp-2">
                {item.urgencyExplanation}
              </p>
            </div>
          ))}
        </div>
      )}

      {/* Detail Modal */}
      {selectedAnalysis && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/70 p-4 backdrop-blur-sm overflow-y-auto">
          <div className="w-full max-w-3xl my-8 rounded-3xl bg-white p-6 shadow-2xl dark:bg-slate-900 dark:border dark:border-slate-800 space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
              <div className="flex items-center gap-2">
                <span className="rounded-lg bg-teal-100 px-2.5 py-1 text-xs font-bold uppercase text-teal-800 dark:bg-teal-950 dark:text-teal-300">
                  Triage: {selectedAnalysis.triageTier}
                </span>
                <span className="text-xs text-slate-500">
                  {formatDate(selectedAnalysis.checkDate)}
                </span>
              </div>
              <button
                onClick={() => setSelectedAnalysis(null)}
                className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <h2 className="text-xl font-bold text-slate-900 dark:text-white">
              {selectedAnalysis.urgencyHeadline}
            </h2>
            <p className="text-xs text-slate-600 dark:text-slate-400">
              {selectedAnalysis.urgencyExplanation}
            </p>

            {/* Personalized insights */}
            <div className="space-y-2">
              <h4 className="text-xs font-bold uppercase text-teal-700 dark:text-teal-400">
                Medical Records Cross-Referenced
              </h4>
              <div className="space-y-2">
                {selectedAnalysis.personalizedInsights.map((insight, idx) => (
                  <div
                    key={idx}
                    className="rounded-xl border border-teal-100 bg-teal-50/50 p-3 text-xs dark:border-teal-900/50 dark:bg-teal-950/20"
                  >
                    <strong>{insight.title}:</strong> {insight.description}
                  </div>
                ))}
              </div>
            </div>

            {/* Next steps */}
            <div className="space-y-2">
              <h4 className="text-xs font-bold uppercase text-slate-500">
                Recommended Actions
              </h4>
              <ul className="space-y-1 text-xs text-slate-700 dark:text-slate-300">
                {selectedAnalysis.recommendedNextSteps.map((step, idx) => (
                  <li key={idx}>• {step}</li>
                ))}
              </ul>
            </div>

            <div className="pt-3 border-t border-slate-100 dark:border-slate-800 flex justify-end">
              <button
                onClick={() => setSelectedAnalysis(null)}
                className="rounded-xl bg-slate-900 px-4 py-2 text-xs font-bold text-white dark:bg-slate-100 dark:text-slate-900"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
