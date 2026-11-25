import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  History, 
  Sparkles, 
  Calendar, 
  Eye, 
  X, 
  ShieldAlert, 
  CheckCircle2, 
  HelpCircle, 
  PhoneCall,
  Loader2,
  FileText
} from 'lucide-react';
import { usePatient } from '../../context/PatientContext';
import { symptomService } from '../../api/symptomService';
import { SymptomCheckSummaryItem, SymptomCheckApiResponse } from '../../types';
import { formatDate, cn } from '../../lib/utils';

export const SymptomHistoryPage: React.FC = () => {
  const navigate = useNavigate();
  const { activePatient } = usePatient();
  const [history, setHistory] = useState<SymptomCheckSummaryItem[]>([]);
  const [selectedCheck, setSelectedCheck] = useState<SymptomCheckApiResponse | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [loadingDetailsId, setLoadingDetailsId] = useState<string | null>(null);
  const [filterTier, setFilterTier] = useState<string>('all');

  useEffect(() => {
    loadHistory();
  }, [activePatient?.id]);

  const loadHistory = async () => {
    setIsLoading(true);
    try {
      const data = await symptomService.getPastChecks();
      setHistory(data);
    } catch (err) {
      console.error('Failed to load past symptom checks', err);
    } finally {
      setIsLoading(false);
    }
  };

  const handleOpenDetails = async (id: string) => {
    setLoadingDetailsId(id);
    try {
      const details = await symptomService.getCheckById(id);
      setSelectedCheck(details);
    } catch (err) {
      console.error('Failed to load check details', err);
      alert('Could not load details for this symptom check.');
    } finally {
      setLoadingDetailsId(null);
    }
  };

  const filteredHistory = history.filter((item) => {
    if (filterTier === 'all') return true;
    return item.urgency === filterTier;
  });

  const getUrgencyBadge = (urgency: string) => {
    switch (urgency) {
      case 'EMERGENCY':
        return (
          <span className="rounded-lg bg-rose-100 px-2.5 py-1 text-xs font-extrabold uppercase text-rose-800 dark:bg-rose-950 dark:text-rose-300">
            Emergency
          </span>
        );
      case 'SEE_DOCTOR':
        return (
          <span className="rounded-lg bg-amber-100 px-2.5 py-1 text-xs font-extrabold uppercase text-amber-800 dark:bg-amber-950 dark:text-amber-300">
            See Doctor
          </span>
        );
      case 'SELF_CARE':
      default:
        return (
          <span className="rounded-lg bg-emerald-100 px-2.5 py-1 text-xs font-extrabold uppercase text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300">
            Self Care
          </span>
        );
    }
  };

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
            Past clinical triage assessments and health records cross-references for {activePatient?.name}
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
      <div className="flex flex-wrap gap-2">
        {[
          { id: 'all', label: 'All Checks' },
          { id: 'EMERGENCY', label: 'Emergency' },
          { id: 'SEE_DOCTOR', label: 'See Doctor' },
          { id: 'SELF_CARE', label: 'Self Care' },
        ].map((tier) => (
          <button
            key={tier.id}
            onClick={() => setFilterTier(tier.id)}
            className={cn(
              "rounded-xl px-4 py-2 text-xs font-bold transition-all",
              filterTier === tier.id
                ? "bg-slate-900 text-white dark:bg-slate-100 dark:text-slate-900 shadow-sm"
                : "bg-slate-100 text-slate-600 hover:bg-slate-200 dark:bg-slate-800 dark:text-slate-300"
            )}
          >
            {tier.label}
          </button>
        ))}
      </div>

      {/* History List */}
      {isLoading ? (
        <div className="flex flex-col items-center justify-center py-20 text-center">
          <Loader2 className="h-8 w-8 animate-spin text-teal-600" />
          <p className="mt-3 text-xs text-slate-500">Loading your past symptom evaluations...</p>
        </div>
      ) : filteredHistory.length === 0 ? (
        <div className="rounded-2xl border border-slate-200 bg-white p-12 text-center dark:border-slate-800 dark:bg-slate-900">
          <History className="mx-auto h-12 w-12 text-slate-300" />
          <h3 className="mt-3 text-base font-bold text-slate-700 dark:text-slate-300">
            No evaluations found
          </h3>
          <p className="mt-1 text-xs text-slate-500">
            Run an AI symptom check to record clinical correlations and safety triages.
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          {filteredHistory.map((item) => (
            <div
              key={item.id}
              className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm transition-all hover:border-teal-300 dark:border-slate-800 dark:bg-slate-900 space-y-3"
            >
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
                <div className="flex items-center gap-3">
                  {getUrgencyBadge(item.urgency)}
                  <h3 className="text-base font-bold text-slate-900 dark:text-white">
                    {item.topCause || item.symptoms || 'Symptom Evaluation'}
                  </h3>
                </div>

                <div className="flex items-center gap-3 text-xs text-slate-500">
                  <span className="flex items-center gap-1">
                    <Calendar className="h-3.5 w-3.5" />
                    {formatDate(item.createdAt)}
                  </span>
                  <button
                    onClick={() => handleOpenDetails(item.id)}
                    disabled={loadingDetailsId === item.id}
                    className="flex items-center gap-1 font-bold text-teal-600 hover:text-teal-700 dark:text-teal-400 disabled:opacity-50"
                  >
                    {loadingDetailsId === item.id ? (
                      <Loader2 className="h-3.5 w-3.5 animate-spin" />
                    ) : (
                      <Eye className="h-4 w-4" />
                    )}
                    View Details
                  </button>
                </div>
              </div>

              {/* Symptoms reported pill list */}
              <div className="flex flex-wrap gap-2 pt-1">
                {item.symptoms && (
                  <span className="rounded-lg bg-slate-100 px-2.5 py-1 text-xs font-medium text-slate-700 dark:bg-slate-800 dark:text-slate-300">
                    &ldquo;{item.symptoms}&rdquo;
                  </span>
                )}
                {item.selectedSymptoms?.map((sym, idx) => (
                  <span
                    key={idx}
                    className="rounded-lg bg-teal-50 px-2.5 py-1 text-xs font-semibold text-teal-700 dark:bg-teal-950/50 dark:text-teal-300"
                  >
                    {sym}
                  </span>
                ))}
                {item.safetyRuleApplied && (
                  <span className="rounded-lg bg-rose-50 px-2.5 py-1 text-xs font-bold text-rose-700 dark:bg-rose-950/40 dark:text-rose-300 flex items-center gap-1">
                    <ShieldAlert className="h-3 w-3" /> Safety Override
                  </span>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Detail Modal */}
      {selectedCheck && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/70 p-4 backdrop-blur-sm overflow-y-auto">
          <div className="w-full max-w-3xl my-8 rounded-3xl bg-white p-6 shadow-2xl dark:bg-slate-900 dark:border dark:border-slate-800 space-y-5 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
              <div className="flex items-center gap-2">
                {getUrgencyBadge(selectedCheck.urgency)}
                <span className="text-xs text-slate-500">
                  {formatDate(selectedCheck.createdAt)}
                </span>
              </div>
              <button
                onClick={() => setSelectedCheck(null)}
                className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            {/* Emergency Banner */}
            {selectedCheck.urgency === 'EMERGENCY' && (
              <div className="rounded-2xl border border-rose-300 bg-rose-50 p-4 text-rose-900 dark:border-rose-900 dark:bg-rose-950/50 dark:text-rose-200">
                <div className="flex items-start gap-3">
                  <PhoneCall className="h-5 w-5 text-rose-600 mt-0.5 shrink-0" />
                  <div>
                    <h4 className="text-sm font-extrabold uppercase tracking-wide">
                      Urgent Emergency Attention Required
                    </h4>
                    <p className="mt-1 text-xs">
                      Call 112 or go to the nearest emergency department now.
                    </p>
                  </div>
                </div>
              </div>
            )}

            <div>
              <h2 className="text-xl font-bold text-slate-900 dark:text-white">
                {selectedCheck.summary}
              </h2>
              <p className="mt-1 text-xs leading-relaxed text-slate-600 dark:text-slate-400">
                {selectedCheck.urgencyReason}
              </p>
            </div>

            {/* Possible Causes */}
            {selectedCheck.possibleCauses?.length > 0 && (
              <div className="space-y-2">
                <h4 className="text-xs font-bold uppercase text-slate-700 dark:text-slate-300 flex items-center gap-1.5">
                  <FileText className="h-4 w-4 text-teal-600" /> Possible Causes
                </h4>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  {selectedCheck.possibleCauses.map((cause, idx) => (
                    <div
                      key={idx}
                      className="rounded-xl border border-slate-200 bg-slate-50/60 p-3 text-xs dark:border-slate-800 dark:bg-slate-800/40"
                    >
                      <div className="flex items-center justify-between">
                        <strong className="text-slate-900 dark:text-white">{cause.name}</strong>
                        <span className={cn(
                          "rounded px-1.5 py-0.5 text-[10px] font-bold uppercase",
                          cause.likelihood === 'HIGH' ? "bg-rose-100 text-rose-700" :
                          cause.likelihood === 'MEDIUM' ? "bg-amber-100 text-amber-700" : "bg-slate-200 text-slate-700"
                        )}>
                          {cause.likelihood}
                        </span>
                      </div>
                      <p className="mt-1 text-slate-600 dark:text-slate-400">{cause.reason}</p>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Medical Records Cross-Referenced */}
            {selectedCheck.historyLinks?.length > 0 && (
              <div className="space-y-2">
                <h4 className="text-xs font-bold uppercase text-teal-700 dark:text-teal-400">
                  Medical Records Cross-Referenced
                </h4>
                <div className="space-y-2">
                  {selectedCheck.historyLinks.map((item, idx) => (
                    <div
                      key={idx}
                      className="rounded-xl border border-teal-100 bg-teal-50/50 p-3 text-xs dark:border-teal-900/50 dark:bg-teal-950/20 text-slate-700 dark:text-slate-300"
                    >
                      {item.text}
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Medicine Warnings */}
            {selectedCheck.medicineWarnings?.length > 0 && (
              <div className="space-y-2">
                <h4 className="text-xs font-bold uppercase text-rose-700 dark:text-rose-400 flex items-center gap-1.5">
                  <ShieldAlert className="h-4 w-4" /> Medication Alerts &amp; Contraindications
                </h4>
                <div className="space-y-2">
                  {selectedCheck.medicineWarnings.map((warn, idx) => (
                    <div
                      key={idx}
                      className="rounded-xl border border-rose-200 bg-rose-50/60 p-3 text-xs dark:border-rose-900/40 dark:bg-rose-950/20 text-rose-900 dark:text-rose-200"
                    >
                      {warn.text}
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Next steps */}
            {selectedCheck.nextSteps?.length > 0 && (
              <div className="space-y-2">
                <h4 className="text-xs font-bold uppercase text-slate-700 dark:text-slate-300 flex items-center gap-1.5">
                  <CheckCircle2 className="h-4 w-4 text-teal-600" /> Recommended Actions
                </h4>
                <ul className="space-y-1.5 text-xs text-slate-700 dark:text-slate-300">
                  {selectedCheck.nextSteps.map((step, idx) => (
                    <li key={idx} className="flex items-start gap-2">
                      <span className="mt-1 h-1.5 w-1.5 rounded-full bg-teal-600 shrink-0" />
                      <span>{step}</span>
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {/* Home Care */}
            {selectedCheck.homeCare?.length > 0 && (
              <div className="space-y-2">
                <h4 className="text-xs font-bold uppercase text-slate-700 dark:text-slate-300 flex items-center gap-1.5">
                  <CheckCircle2 className="h-4 w-4 text-emerald-600" /> Home Care &amp; Self Management
                </h4>
                <ul className="space-y-1.5 text-xs text-slate-700 dark:text-slate-300">
                  {selectedCheck.homeCare.map((item, idx) => (
                    <li key={idx} className="flex items-start gap-2">
                      <span className="mt-1 h-1.5 w-1.5 rounded-full bg-emerald-500 shrink-0" />
                      <span>{item}</span>
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {/* Questions for doctor */}
            {selectedCheck.questionsForDoctor?.length > 0 && (
              <div className="space-y-2">
                <h4 className="text-xs font-bold uppercase text-slate-700 dark:text-slate-300 flex items-center gap-1.5">
                  <HelpCircle className="h-4 w-4 text-blue-600" /> Questions for Your Doctor
                </h4>
                <ul className="space-y-1.5 text-xs text-slate-700 dark:text-slate-300">
                  {selectedCheck.questionsForDoctor.map((q, idx) => (
                    <li key={idx} className="flex items-start gap-2">
                      <span className="mt-1 h-1.5 w-1.5 rounded-full bg-blue-500 shrink-0" />
                      <span>{q}</span>
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {/* Disclaimer */}
            <p className="text-[11px] text-slate-400 italic pt-2 border-t border-slate-100 dark:border-slate-800">
              {selectedCheck.disclaimer}
            </p>

            <div className="flex justify-end pt-2">
              <button
                onClick={() => setSelectedCheck(null)}
                className="rounded-xl bg-slate-900 px-5 py-2 text-xs font-bold text-white dark:bg-slate-100 dark:text-slate-900"
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
