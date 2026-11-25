import React, { useState, useEffect } from 'react';
import { 
  Sparkles, 
  X, 
  Download, 
  Printer, 
  FileText, 
  AlertTriangle, 
  CheckCircle2, 
  Pill, 
  Activity, 
  ShieldAlert, 
  Calendar,
  Loader2
} from 'lucide-react';
import { recordsService } from '../../api/recordsService';
import { PatientRecordSummary } from '../../types';

interface RecordSummaryModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const RecordSummaryModal: React.FC<RecordSummaryModalProps> = ({ isOpen, onClose }) => {
  const [summary, setSummary] = useState<PatientRecordSummary | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isDownloadingPdf, setIsDownloadingPdf] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (isOpen) {
      loadSummary();
    } else {
      setSummary(null);
      setError(null);
    }
  }, [isOpen]);

  const loadSummary = async () => {
    setIsLoading(true);
    setError(null);
    try {
      const data = await recordsService.getRecordsSummary();
      setSummary(data);
    } catch (err: any) {
      console.error('Failed to generate summary', err);
      setError(err?.response?.data?.message || err?.message || 'Could not synthesize medical records summary.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleDownloadPdf = async () => {
    setIsDownloadingPdf(true);
    try {
      await recordsService.downloadRecordsSummaryPdf();
    } catch (err: any) {
      console.error('Failed to download PDF', err);
      alert('Could not download PDF summary. Please try again.');
    } finally {
      setIsDownloadingPdf(false);
    }
  };

  const handlePrint = () => {
    window.print();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/70 p-4 backdrop-blur-sm overflow-y-auto">
      <div className="relative w-full max-w-4xl my-8 rounded-3xl bg-white shadow-2xl dark:bg-slate-900 dark:border dark:border-slate-800 flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-slate-100 dark:border-slate-800 shrink-0">
          <div className="flex items-center gap-3">
            <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-indigo-50 text-indigo-600 dark:bg-indigo-950/50 dark:text-indigo-400">
              <Sparkles className="h-6 w-6" />
            </div>
            <div>
              <h2 className="text-xl font-extrabold text-slate-900 dark:text-white flex items-center gap-2">
                Longitudinal Health Summary
                <span className="rounded-full bg-indigo-100 px-2.5 py-0.5 text-[10px] font-bold text-indigo-800 dark:bg-indigo-950 dark:text-indigo-300">
                  1-2 Pages
                </span>
              </h2>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Synthesized across all patient documents, laboratory reports, prescriptions and recorded vitals
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {summary && (
              <>
                <button
                  onClick={handleDownloadPdf}
                  disabled={isDownloadingPdf}
                  className="flex items-center gap-1.5 rounded-xl bg-teal-600 px-3.5 py-2 text-xs font-bold text-white shadow-sm hover:bg-teal-700 disabled:opacity-50 transition-all"
                >
                  {isDownloadingPdf ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <Download className="h-4 w-4" />
                  )}
                  Download PDF
                </button>
                <button
                  onClick={handlePrint}
                  className="flex items-center gap-1.5 rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs font-bold text-slate-700 hover:bg-slate-50 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200 dark:hover:bg-slate-700 transition-all"
                >
                  <Printer className="h-4 w-4" />
                  Print
                </button>
              </>
            )}
            <button
              onClick={onClose}
              className="rounded-xl p-2 text-slate-400 hover:bg-slate-100 hover:text-slate-700 dark:hover:bg-slate-800 dark:hover:text-slate-200"
            >
              <X className="h-5 w-5" />
            </button>
          </div>
        </div>

        {/* Content Area */}
        <div className="p-6 overflow-y-auto space-y-6">
          {isLoading && (
            <div className="flex flex-col items-center justify-center py-20 text-center space-y-4">
              <div className="relative flex h-16 w-16 items-center justify-center rounded-3xl bg-indigo-50 text-indigo-600 dark:bg-indigo-950/40">
                <Sparkles className="h-8 w-8 animate-pulse text-indigo-600 dark:text-indigo-400" />
              </div>
              <div>
                <h3 className="text-base font-bold text-slate-900 dark:text-white">
                  Synthesizing Records with Gemini AI...
                </h3>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 max-w-sm">
                  Correlating longitudinal lab results, active medications, chronic conditions and clinical history into a structured summary.
                </p>
              </div>
            </div>
          )}

          {error && (
            <div className="rounded-2xl border border-rose-200 bg-rose-50 p-6 text-center dark:border-rose-900/50 dark:bg-rose-950/20">
              <AlertTriangle className="mx-auto h-8 w-8 text-rose-500 mb-2" />
              <h4 className="text-sm font-bold text-rose-800 dark:text-rose-300">
                Failed to generate summary
              </h4>
              <p className="text-xs text-rose-600 dark:text-rose-400 mt-1">
                {error}
              </p>
              <button
                onClick={loadSummary}
                className="mt-4 rounded-xl bg-rose-600 px-4 py-2 text-xs font-bold text-white hover:bg-rose-700"
              >
                Try Again
              </button>
            </div>
          )}

          {!isLoading && summary && (
            <div className="space-y-6">
              {/* Patient Banner */}
              <div className="flex flex-wrap items-center justify-between gap-4 rounded-2xl bg-slate-50 p-4 border border-slate-200/80 dark:bg-slate-800/50 dark:border-slate-800 text-xs">
                <div>
                  <span className="text-slate-500">Patient: </span>
                  <strong className="text-slate-900 dark:text-white text-sm">{summary.patientName}</strong>
                  <span className="mx-2 text-slate-300">|</span>
                  <span className="text-slate-500">Demographics: </span>
                  <strong className="text-slate-800 dark:text-slate-200">{summary.ageAndGender}</strong>
                  <span className="mx-2 text-slate-300">|</span>
                  <span className="text-slate-500">Blood Group: </span>
                  <strong className="text-slate-800 dark:text-slate-200">{summary.bloodGroup}</strong>
                </div>
                <div className="flex items-center gap-2 text-slate-500">
                  <Calendar className="h-3.5 w-3.5" />
                  <span>{summary.generatedDate}</span>
                  <span className="rounded-md bg-teal-100 px-2 py-0.5 text-[10px] font-bold text-teal-800 dark:bg-teal-950 dark:text-teal-300">
                    {summary.totalDocumentsAnalyzed} docs analyzed
                  </span>
                </div>
              </div>

              {/* Executive Summary */}
              <div className="rounded-2xl border border-indigo-100 bg-indigo-50/40 p-5 dark:border-indigo-900/40 dark:bg-indigo-950/20">
                <h4 className="text-xs font-bold uppercase tracking-wider text-indigo-700 dark:text-indigo-400 flex items-center gap-1.5 mb-2.5">
                  <FileText className="h-4 w-4" /> Executive Clinical Narrative
                </h4>
                <p className="text-xs leading-relaxed text-slate-700 dark:text-slate-300 whitespace-pre-line">
                  {summary.executiveSummary}
                </p>
              </div>

              {/* 2-Column Grid */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Chronic Conditions */}
                <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm dark:border-slate-800 dark:bg-slate-900/50">
                  <h4 className="text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300 flex items-center gap-1.5 mb-3">
                    <Activity className="h-4 w-4 text-teal-600" /> Active & Diagnosed Conditions
                  </h4>
                  <ul className="space-y-2 text-xs">
                    {summary.chronicConditions.map((cond, idx) => (
                      <li key={idx} className="flex items-start gap-2 text-slate-700 dark:text-slate-300">
                        <span className="mt-1 h-1.5 w-1.5 rounded-full bg-teal-500 shrink-0" />
                        <span>{cond}</span>
                      </li>
                    ))}
                  </ul>
                </div>

                {/* Active Medications */}
                <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm dark:border-slate-800 dark:bg-slate-900/50">
                  <h4 className="text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300 flex items-center gap-1.5 mb-3">
                    <Pill className="h-4 w-4 text-blue-600" /> Current Medications
                  </h4>
                  <ul className="space-y-2 text-xs">
                    {summary.activeMedications.map((med, idx) => (
                      <li key={idx} className="flex items-start gap-2 text-slate-700 dark:text-slate-300">
                        <span className="mt-1 h-1.5 w-1.5 rounded-full bg-blue-500 shrink-0" />
                        <span>{med}</span>
                      </li>
                    ))}
                  </ul>
                </div>

                {/* Lab Findings */}
                <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm dark:border-slate-800 dark:bg-slate-900/50">
                  <h4 className="text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300 flex items-center gap-1.5 mb-3">
                    <Activity className="h-4 w-4 text-amber-600" /> Key Laboratory Findings & Trends
                  </h4>
                  <ul className="space-y-2 text-xs">
                    {summary.notableLabFindings.map((lab, idx) => (
                      <li key={idx} className="flex items-start gap-2 text-slate-700 dark:text-slate-300">
                        <span className="mt-1 h-1.5 w-1.5 rounded-full bg-amber-500 shrink-0" />
                        <span>{lab}</span>
                      </li>
                    ))}
                  </ul>
                </div>

                {/* Critical Allergies */}
                <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm dark:border-slate-800 dark:bg-slate-900/50">
                  <h4 className="text-xs font-bold uppercase tracking-wider text-rose-700 dark:text-rose-400 flex items-center gap-1.5 mb-3">
                    <ShieldAlert className="h-4 w-4 text-rose-600" /> Allergies & Clinical Alerts
                  </h4>
                  <ul className="space-y-2 text-xs">
                    {summary.criticalAllergies.map((alg, idx) => (
                      <li key={idx} className="flex items-start gap-2 text-slate-700 dark:text-slate-300">
                        <span className="mt-1 h-1.5 w-1.5 rounded-full bg-rose-500 shrink-0" />
                        <span>{alg}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              </div>

              {/* Recommendations */}
              <div className="rounded-2xl border border-teal-100 bg-teal-50/40 p-5 dark:border-teal-900/40 dark:bg-teal-950/20">
                <h4 className="text-xs font-bold uppercase tracking-wider text-teal-800 dark:text-teal-400 flex items-center gap-1.5 mb-2.5">
                  <CheckCircle2 className="h-4 w-4 text-teal-600" /> Preventive Recommendations & Follow-Up
                </h4>
                <ul className="space-y-1.5 text-xs text-slate-700 dark:text-slate-300">
                  {summary.clinicalRecommendations.map((rec, idx) => (
                    <li key={idx} className="flex items-start gap-2">
                      <span className="mt-1 h-1.5 w-1.5 rounded-full bg-teal-600 shrink-0" />
                      <span>{rec}</span>
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between p-4 px-6 border-t border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/30 rounded-b-3xl">
          <p className="text-[11px] text-slate-400">
            MediVault Confidential Medical Summary. Formatted for 1-2 pages clinical review.
          </p>
          <div className="flex items-center gap-2">
            {summary && (
              <button
                onClick={handleDownloadPdf}
                disabled={isDownloadingPdf}
                className="flex items-center gap-1.5 rounded-xl bg-teal-600 px-4 py-2 text-xs font-bold text-white hover:bg-teal-700 disabled:opacity-50 transition-all shadow-sm"
              >
                {isDownloadingPdf ? (
                  <Loader2 className="h-3.5 w-3.5 animate-spin" />
                ) : (
                  <Download className="h-3.5 w-3.5" />
                )}
                Download PDF (1-2 Pages)
              </button>
            )}
            <button
              onClick={onClose}
              className="rounded-xl border border-slate-200 bg-white px-4 py-2 text-xs font-bold text-slate-700 hover:bg-slate-50 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200"
            >
              Close
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
