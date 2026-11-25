import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  Sparkles, 
  Search, 
  Plus, 
  ShieldCheck, 
  CheckCircle2, 
  AlertTriangle, 
  ArrowRight, 
  ArrowLeft, 
  RefreshCw, 
  AlertOctagon, 
  FileText, 
  Activity, 
  HeartPulse, 
  Printer, 
  PhoneCall,
  Clock,
  ExternalLink,
  ChevronRight,
  Info
} from 'lucide-react';
import { usePatient } from '../../context/PatientContext';
import { symptomService } from '../../api/symptomService';
import { 
  SymptomOption, 
  ReportedSymptom, 
  SymptomCheckApiResponse,
  SymptomCheckSummaryItem,
  DurationUnitType,
  SymptomOnsetType
} from '../../types';
import { cn } from '../../lib/utils';

export const SymptomCheckerPage: React.FC = () => {
  const navigate = useNavigate();
  const { activePatient } = usePatient();

  const [catalog, setCatalog] = useState<SymptomOption[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('All');
  
  // Wizard state: 1: Symptoms, 2: Severity, Duration & Onset, 3: History & Consent, 4: Results
  const [step, setStep] = useState<1 | 2 | 3 | 4>(1);
  const [reportedSymptoms, setReportedSymptoms] = useState<ReportedSymptom[]>([]);
  const [selectedTriggers, setSelectedTriggers] = useState<string[]>([]);
  const [additionalNotes, setAdditionalNotes] = useState('');
  const [overallSeverity, setOverallSeverity] = useState<number>(5);
  const [durationValue, setDurationValue] = useState<number>(2);
  const [durationUnit, setDurationUnit] = useState<DurationUnitType>('DAYS');
  const [onset, setOnset] = useState<SymptomOnsetType>('GRADUAL');
  const [bodyArea, setBodyArea] = useState<string>('General');

  // Mandatory consent checkbox (unchecked by default)
  const [consentGiven, setConsentGiven] = useState(false);

  // Analysis & past checks state
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [analysisError, setAnalysisError] = useState<string | null>(null);
  const [analysisResult, setAnalysisResult] = useState<SymptomCheckApiResponse | null>(null);
  const [pastChecks, setPastChecks] = useState<SymptomCheckSummaryItem[]>([]);
  const [showPastChecks, setShowPastChecks] = useState(false);

  useEffect(() => {
    symptomService.getSymptomsCatalog().then((data) => setCatalog(data));
    loadPastChecks();
  }, []);

  const loadPastChecks = async () => {
    try {
      const list = await symptomService.getPastChecks();
      setPastChecks(list);
    } catch (err) {
      console.warn('Failed to load past checks:', err);
    }
  };

  const handleOpenPastCheck = async (id: string) => {
    try {
      setIsAnalyzing(true);
      const full = await symptomService.getCheckById(id);
      setAnalysisResult(full);
      setStep(4);
      setShowPastChecks(false);
    } catch (err: any) {
      alert(err?.response?.data?.error || 'Could not load saved check.');
    } finally {
      setIsAnalyzing(false);
    }
  };

  const toggleSymptomSelection = (option: SymptomOption) => {
    const existingIndex = reportedSymptoms.findIndex((s) => s.symptomId === option.id);
    if (existingIndex > -1) {
      setReportedSymptoms((prev) => prev.filter((s) => s.symptomId !== option.id));
    } else {
      setReportedSymptoms((prev) => [
        ...prev,
        {
          symptomId: option.id,
          name: option.name,
          severity: 'moderate',
          duration: '1 day',
          onset: 'gradual',
          bodyLocation: option.category,
        },
      ]);
      setBodyArea(option.category);
    }
  };

  const removeSymptom = (index: number) => {
    setReportedSymptoms((prev) => prev.filter((_, i) => i !== index));
  };

  const addCustomSymptom = () => {
    if (!searchTerm.trim()) return;
    const newSym: ReportedSymptom = {
      symptomId: `custom-${Date.now()}`,
      name: searchTerm.trim(),
      severity: 'moderate',
      duration: '1 day',
      onset: 'gradual',
    };
    setReportedSymptoms((prev) => [...prev, newSym]);
    setSearchTerm('');
  };

  const toggleTrigger = (trigger: string) => {
    setSelectedTriggers((prev) =>
      prev.includes(trigger) ? prev.filter((t) => t !== trigger) : [...prev, trigger]
    );
  };

  const handleRunAnalysis = async () => {
    if (!consentGiven) return;
    if (reportedSymptoms.length === 0 && !additionalNotes.trim()) return;

    setIsAnalyzing(true);
    setAnalysisError(null);

    const selectedChipNames = reportedSymptoms.map((s) => s.name);
    let symptomText = additionalNotes.trim();
    if (selectedTriggers.length > 0) {
      symptomText = (symptomText ? symptomText + ". " : "") + "Suspected triggers: " + selectedTriggers.join(", ");
    }

    try {
      const result = await symptomService.runSymptomCheck({
        symptoms: symptomText || undefined,
        selectedSymptoms: selectedChipNames,
        bodyArea: bodyArea || 'General',
        severity: overallSeverity,
        durationValue: durationValue,
        durationUnit: durationUnit,
        onset: onset,
      });

      setAnalysisResult(result);
      setStep(4);
      loadPastChecks();
    } catch (err: any) {
      const msg = err?.response?.data?.error || err?.message || 'Failed to complete analysis. Please try again.';
      setAnalysisError(msg);
    } finally {
      setIsAnalyzing(false);
    }
  };

  const categories = ['All', 'Neurological', 'Respiratory', 'Cardiovascular', 'Gastrointestinal', 'Musculoskeletal', 'General'];

  const commonQuickPicks = [
    'Throbbing Headache',
    'Shortness of Breath (Dyspnea)',
    'Chest Tightness / Discomfort',
    'Fever & Chills',
    'Wheezing & Persistent Cough',
    'Acid Reflux & Heartburn',
    'Joint Pain & Morning Stiffness',
    'Lower Back Pain & Muscle Spasm',
    'Fatigue & Muscle Aches',
    'Dizziness / Lightheadedness',
  ];

  const filteredCatalog = catalog.filter((item) => {
    const matchesCat = selectedCategory === 'All' || item.category === selectedCategory;
    const matchesQuery = item.name.toLowerCase().includes(searchTerm.toLowerCase());
    return matchesCat && matchesQuery;
  });

  const availableTriggers = [
    'Stress / Work Pressure',
    'Cold Weather / AC',
    'Physical Exertion',
    'Missed Medication',
    'Allergen Exposure (Dust/Pollen)',
    'Lack of Sleep',
    'Heavy or Salty Meal',
    'Dehydration',
  ];

  if (!activePatient) return null;

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="rounded-full bg-teal-100 px-3 py-0.5 text-xs font-bold text-teal-800 dark:bg-teal-950 dark:text-teal-300 flex items-center gap-1">
              <Sparkles className="h-3.5 w-3.5" /> AI Medical History Engine
            </span>
            <span className="text-xs text-slate-400">
              Evaluating for {activePatient.name}
            </span>
          </div>
          <h1 className="mt-1 text-2xl sm:text-3xl font-extrabold text-slate-900 dark:text-white">
            Personalized Symptom Check
          </h1>
          <p className="text-sm text-slate-600 dark:text-slate-400">
            Intelligently correlates your symptoms with your chronic conditions, past lab records, and current prescriptions.
          </p>
        </div>

        <div className="flex items-center gap-3">
          {pastChecks.length > 0 && (
            <button
              onClick={() => setShowPastChecks(!showPastChecks)}
              className="flex items-center gap-1.5 rounded-2xl border border-slate-200 bg-white px-4 py-2 text-xs font-bold text-slate-700 hover:bg-slate-50 dark:border-slate-800 dark:bg-slate-900 dark:text-slate-300 shadow-sm"
            >
              <Clock className="h-3.5 w-3.5 text-teal-600" />
              <span>Past Checks ({pastChecks.length})</span>
            </button>
          )}

          {step < 4 && (
            <div className="flex items-center gap-2 rounded-2xl border border-slate-200 bg-white p-2 dark:border-slate-800 dark:bg-slate-900 shadow-sm">
              {[1, 2, 3].map((s) => (
                <div
                  key={s}
                  className={cn(
                    "flex h-8 w-8 items-center justify-center rounded-xl text-xs font-bold transition-all",
                    step === s
                      ? "bg-teal-600 text-white shadow-md shadow-teal-600/30"
                      : step > s
                      ? "bg-teal-100 text-teal-800 dark:bg-teal-950 dark:text-teal-300"
                      : "bg-slate-100 text-slate-400 dark:bg-slate-800"
                  )}
                >
                  {s}
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Past checks drawer */}
      {showPastChecks && (
        <div className="rounded-2xl border border-teal-100 bg-teal-50/40 p-4 dark:border-teal-900/40 dark:bg-slate-900/80 space-y-3">
          <div className="flex items-center justify-between">
            <h3 className="text-xs font-bold uppercase tracking-wider text-teal-800 dark:text-teal-300 flex items-center gap-1.5">
              <Clock className="h-3.5 w-3.5" /> Saved Symptom Checks
            </h3>
            <button
              onClick={() => setShowPastChecks(false)}
              className="text-xs text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
            >
              Close
            </button>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
            {pastChecks.map((item) => (
              <button
                key={item.id}
                onClick={() => handleOpenPastCheck(item.id)}
                className="flex items-start justify-between rounded-xl border border-slate-200 bg-white p-3 text-left hover:border-teal-500 dark:border-slate-800 dark:bg-slate-900 transition-all shadow-sm group"
              >
                <div>
                  <div className="flex items-center gap-1.5">
                    <span
                      className={cn(
                        "rounded-full px-2 py-0.5 text-[10px] font-bold uppercase",
                        item.urgency === 'EMERGENCY'
                          ? "bg-rose-100 text-rose-700 dark:bg-rose-950 dark:text-rose-300"
                          : item.urgency === 'SEE_DOCTOR'
                          ? "bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300"
                          : "bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300"
                      )}
                    >
                      {item.urgency.replace('_', ' ')}
                    </span>
                    <span className="text-[11px] text-slate-400">
                      {new Date(item.createdAt).toLocaleDateString()}
                    </span>
                  </div>
                  <p className="mt-1 text-xs font-semibold text-slate-900 dark:text-white line-clamp-1">
                    {item.selectedSymptoms?.length > 0
                      ? item.selectedSymptoms.join(', ')
                      : item.symptoms || 'Symptom Check'}
                  </p>
                  {item.topCause && (
                    <p className="text-[11px] text-teal-600 dark:text-teal-400 line-clamp-1">
                      Top match: {item.topCause}
                    </p>
                  )}
                </div>
                <ChevronRight className="h-4 w-4 text-slate-400 group-hover:text-teal-600 shrink-0 mt-1" />
              </button>
            ))}
          </div>
        </div>
      )}

      {analysisError && (
        <div className="rounded-xl border border-rose-200 bg-rose-50 p-4 text-xs font-semibold text-rose-700 dark:border-rose-900 dark:bg-rose-950/40 dark:text-rose-300 flex items-center justify-between">
          <span>{analysisError}</span>
          <button onClick={() => setAnalysisError(null)} className="underline text-[11px]">Dismiss</button>
        </div>
      )}

      {/* STEP 1: Symptom Selection */}
      {step === 1 && (
        <div className="space-y-6">
          {/* Quick Pick Chips */}
          <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm dark:border-slate-800 dark:bg-slate-900 space-y-3">
            <h2 className="text-xs font-bold uppercase tracking-wider text-slate-500">
              Quick Pick Frequent Symptoms
            </h2>
            <div className="flex flex-wrap gap-2">
              {commonQuickPicks.map((pick) => {
                const isSelected = reportedSymptoms.some((s) => s.name === pick);
                return (
                  <button
                    key={pick}
                    type="button"
                    onClick={() => {
                      const match = catalog.find((c) => c.name === pick);
                      if (match) {
                        toggleSymptomSelection(match);
                      } else {
                        if (isSelected) {
                          setReportedSymptoms((prev) => prev.filter((s) => s.name !== pick));
                        } else {
                          setReportedSymptoms((prev) => [
                            ...prev,
                            {
                              symptomId: `quick-${pick}`,
                              name: pick,
                              severity: 'moderate',
                              duration: '1 day',
                              onset: 'gradual',
                            },
                          ]);
                        }
                      }
                    }}
                    className={cn(
                      "rounded-xl px-3.5 py-2 text-xs font-semibold transition-all",
                      isSelected
                        ? "bg-teal-600 text-white shadow-md shadow-teal-600/30"
                        : "bg-slate-100 text-slate-700 hover:bg-slate-200 dark:bg-slate-800 dark:text-slate-300"
                    )}
                  >
                    {pick} {isSelected && '✓'}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Search & Custom Symptoms */}
          <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm dark:border-slate-800 dark:bg-slate-900 space-y-4">
            <div className="flex flex-col sm:flex-row gap-2">
              <div className="relative flex-1">
                <Search className="absolute left-3.5 top-3 h-4 w-4 text-slate-400" />
                <input
                  type="text"
                  placeholder="Search 30+ symptoms or type a custom sensation..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      e.preventDefault();
                      addCustomSymptom();
                    }
                  }}
                  className="w-full rounded-xl border border-slate-200 bg-slate-50 pl-10 pr-4 py-2.5 text-xs text-slate-900 focus:border-teal-500 focus:bg-white focus:outline-none dark:border-slate-700 dark:bg-slate-800 dark:text-white"
                />
              </div>
              <button
                type="button"
                onClick={addCustomSymptom}
                disabled={!searchTerm.trim()}
                className="flex items-center justify-center gap-1 rounded-xl bg-teal-600 px-4 py-2.5 text-xs font-bold text-white hover:bg-teal-700 disabled:opacity-50"
              >
                <Plus className="h-4 w-4" /> Add
              </button>
            </div>

            {/* Selected Chips Basket */}
            {reportedSymptoms.length > 0 && (
              <div className="space-y-2 pt-2">
                <span className="text-xs font-bold text-teal-800 dark:text-teal-300">
                  Selected Symptoms ({reportedSymptoms.length}):
                </span>
                <div className="flex flex-wrap gap-2">
                  {reportedSymptoms.map((sym, idx) => (
                    <span
                      key={sym.symptomId}
                      className="inline-flex items-center gap-1.5 rounded-xl bg-teal-50 border border-teal-200 px-3 py-1.5 text-xs font-semibold text-teal-900 dark:bg-teal-950 dark:border-teal-800 dark:text-teal-200"
                    >
                      {sym.name}
                      <button
                        type="button"
                        onClick={() => removeSymptom(idx)}
                        className="text-teal-600 hover:text-rose-600 dark:text-teal-400 font-bold ml-1"
                      >
                        ×
                      </button>
                    </span>
                  ))}
                </div>
              </div>
            )}

            {/* Category pills */}
            <div className="flex flex-wrap gap-1.5 pt-2 border-t border-slate-100 dark:border-slate-800">
              {categories.map((cat) => (
                <button
                  key={cat}
                  onClick={() => setSelectedCategory(cat)}
                  className={cn(
                    "rounded-lg px-2.5 py-1 text-[11px] font-medium transition-all",
                    selectedCategory === cat
                      ? "bg-slate-900 text-white dark:bg-white dark:text-slate-900"
                      : "text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800"
                  )}
                >
                  {cat}
                </button>
              ))}
            </div>

            {/* Symptom Catalog Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3 max-h-80 overflow-y-auto pr-1">
              {filteredCatalog.map((item) => {
                const active = reportedSymptoms.some((s) => s.name === item.name);
                return (
                  <button
                    key={item.id}
                    type="button"
                    onClick={() => toggleSymptomSelection(item)}
                    className={cn(
                      "flex flex-col rounded-xl border p-3 text-left transition-all",
                      active
                        ? "border-teal-500 bg-teal-50/60 dark:bg-teal-950/40"
                        : "border-slate-100 bg-slate-50/50 hover:border-slate-300 dark:border-slate-800 dark:bg-slate-800/40"
                    )}
                  >
                    <span className="text-xs font-bold text-slate-900 dark:text-white">
                      {item.name}
                    </span>
                    <span className="mt-0.5 text-[11px] text-slate-500 line-clamp-1">
                      {item.description}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>

          <div className="flex justify-end pt-2">
            <button
              disabled={reportedSymptoms.length === 0}
              onClick={() => setStep(2)}
              className="flex items-center gap-2 rounded-2xl bg-teal-600 px-6 py-3.5 text-sm font-bold text-white shadow-lg shadow-teal-600/30 hover:bg-teal-700 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <span>Next: Severity & Duration</span>
              <ArrowRight className="h-4 w-4" />
            </button>
          </div>
        </div>
      )}

      {/* STEP 2: Severity, Duration & Triggers */}
      {step === 2 && (
        <div className="space-y-6">
          <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm dark:border-slate-800 dark:bg-slate-900 space-y-6">
            <h2 className="text-base font-bold text-slate-900 dark:text-white">
              Symptom Severity, Timing & Context
            </h2>

            {/* Severity 1-10 Slider */}
            <div className="space-y-2 rounded-xl border border-slate-100 bg-slate-50 p-4 dark:border-slate-800 dark:bg-slate-800/40">
              <div className="flex items-center justify-between">
                <label className="text-xs font-bold uppercase text-slate-700 dark:text-slate-300">
                  Overall Severity Level (1 to 10)
                </label>
                <span className={cn(
                  "rounded-full px-2.5 py-0.5 text-xs font-extrabold",
                  overallSeverity >= 8
                    ? "bg-rose-100 text-rose-700 dark:bg-rose-950 dark:text-rose-300"
                    : overallSeverity >= 5
                    ? "bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300"
                    : "bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300"
                )}>
                  {overallSeverity} / 10 {overallSeverity >= 8 ? '(Severe)' : overallSeverity >= 5 ? '(Moderate)' : '(Mild)'}
                </span>
              </div>
              <input
                type="range"
                min="1"
                max="10"
                value={overallSeverity}
                onChange={(e) => setOverallSeverity(parseInt(e.target.value, 10))}
                className="w-full accent-teal-600 cursor-pointer"
              />
              <div className="flex justify-between text-[10px] text-slate-400">
                <span>1 - Barely noticeable</span>
                <span>5 - Moderate discomfort</span>
                <span>10 - Extreme / Unbearable</span>
              </div>
            </div>

            {/* Duration & Onset Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div>
                <label className="text-xs font-medium text-slate-500">Duration Value</label>
                <input
                  type="number"
                  min="1"
                  max="365"
                  value={durationValue}
                  onChange={(e) => setDurationValue(Math.max(1, parseInt(e.target.value || '1', 10)))}
                  className="mt-1 w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs font-medium text-slate-900 dark:border-slate-700 dark:bg-slate-800 dark:text-white"
                />
              </div>

              <div>
                <label className="text-xs font-medium text-slate-500">Duration Unit</label>
                <select
                  value={durationUnit}
                  onChange={(e) => setDurationUnit(e.target.value as DurationUnitType)}
                  className="mt-1 w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs font-medium text-slate-900 dark:border-slate-700 dark:bg-slate-800 dark:text-white"
                >
                  <option value="HOURS">Hours</option>
                  <option value="DAYS">Days</option>
                  <option value="WEEKS">Weeks</option>
                  <option value="MONTHS">Months</option>
                </select>
              </div>

              <div>
                <label className="text-xs font-medium text-slate-500">Manner of Onset</label>
                <select
                  value={onset}
                  onChange={(e) => setOnset(e.target.value as SymptomOnsetType)}
                  className="mt-1 w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs font-medium text-slate-900 dark:border-slate-700 dark:bg-slate-800 dark:text-white"
                >
                  <option value="GRADUAL">Gradual / Over time</option>
                  <option value="SUDDEN">Sudden / Acute immediate</option>
                </select>
              </div>
            </div>

            {/* Triggers Selector */}
            <div className="space-y-3 pt-2">
              <label className="text-xs font-bold uppercase tracking-wider text-slate-500">
                Suspected Triggers or Circumstances
              </label>
              <div className="flex flex-wrap gap-2">
                {availableTriggers.map((trig) => {
                  const active = selectedTriggers.includes(trig);
                  return (
                    <button
                      key={trig}
                      type="button"
                      onClick={() => toggleTrigger(trig)}
                      className={cn(
                        "rounded-xl px-3 py-2 text-xs font-semibold transition-all",
                        active
                          ? "bg-teal-600 text-white shadow-sm"
                          : "bg-slate-100 text-slate-600 hover:bg-slate-200 dark:bg-slate-800 dark:text-slate-300"
                      )}
                    >
                      {trig}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Free-text description */}
            <div className="space-y-2">
              <label className="text-xs font-bold uppercase tracking-wider text-slate-500">
                Detailed Description / Sensations (Optional, 3-1000 characters)
              </label>
              <textarea
                rows={3}
                placeholder="E.g., Feeling dizzy when standing up, throbbing sensation behind the right eye, took 1 paracetamol with slight relief..."
                value={additionalNotes}
                onChange={(e) => setAdditionalNotes(e.target.value)}
                className="w-full rounded-xl border border-slate-200 bg-slate-50 p-3 text-xs text-slate-900 focus:border-teal-500 focus:bg-white focus:outline-none dark:border-slate-700 dark:bg-slate-800 dark:text-white"
              />
            </div>
          </div>

          <div className="flex justify-between pt-2">
            <button
              onClick={() => setStep(1)}
              className="flex items-center gap-2 rounded-2xl border border-slate-200 bg-white px-5 py-3 text-sm font-bold text-slate-700 hover:bg-slate-50 dark:border-slate-800 dark:bg-slate-900 dark:text-slate-300"
            >
              <ArrowLeft className="h-4 w-4" /> Back
            </button>
            <button
              onClick={() => setStep(3)}
              className="flex items-center gap-2 rounded-2xl bg-teal-600 px-6 py-3 text-sm font-bold text-white shadow-lg shadow-teal-600/30 hover:bg-teal-700"
            >
              <span>Next: History Review & Consent</span>
              <ArrowRight className="h-4 w-4" />
            </button>
          </div>
        </div>
      )}

      {/* STEP 3: Review & Mandatory Consent */}
      {step === 3 && (
        <div className="space-y-6">
          <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm dark:border-slate-800 dark:bg-slate-900 space-y-6">
            <div>
              <h2 className="text-lg font-bold text-slate-900 dark:text-white flex items-center gap-2">
                <Sparkles className="h-5 w-5 text-teal-600 dark:text-teal-400" />
                Medical History Integration Preview
              </h2>
              <p className="text-xs text-slate-500">
                MediVault will cross-reference your stored records with your symptoms:
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="rounded-xl border border-slate-100 bg-slate-50 p-4 dark:border-slate-800 dark:bg-slate-800/40">
                <span className="text-xs font-bold uppercase text-slate-500">Patient Profile</span>
                <p className="mt-1 text-xs font-semibold text-slate-800 dark:text-slate-200">
                  {activePatient.name} • {activePatient.gender} • Blood Group: {activePatient.bloodGroup || 'Not set'}
                </p>
              </div>

              <div className="rounded-xl border border-slate-100 bg-slate-50 p-4 dark:border-slate-800 dark:bg-slate-800/40">
                <span className="text-xs font-bold uppercase text-slate-500">Reporting</span>
                <p className="mt-1 text-xs font-semibold text-slate-800 dark:text-slate-200">
                  {reportedSymptoms.length} symptom(s) • Severity {overallSeverity}/10 • Duration: {durationValue} {durationUnit.toLowerCase()}
                </p>
              </div>

              <div className="rounded-xl border border-teal-100 bg-teal-50/40 p-4 dark:border-teal-950/40 dark:bg-teal-950/20">
                <span className="text-xs font-bold uppercase text-teal-700 dark:text-teal-400">Security</span>
                <p className="mt-1 text-xs font-semibold text-teal-800 dark:text-teal-300">
                  ABDM Privacy Sandbox • Encrypted Identity
                </p>
              </div>
            </div>

            {/* MANDATORY CONSENT CHECKBOX (unchecked by default) */}
            <label className="flex items-start gap-3 p-4 rounded-xl border border-teal-200 bg-teal-50/50 dark:border-teal-900 dark:bg-slate-800/60 cursor-pointer">
              <input
                type="checkbox"
                checked={consentGiven}
                onChange={(e) => setConsentGiven(e.target.checked)}
                className="mt-0.5 h-4 w-4 rounded border-slate-300 text-teal-600 focus:ring-teal-500"
              />
              <span className="text-xs font-medium text-slate-700 dark:text-slate-300 leading-relaxed">
                <strong>I agree that MediVault may use my stored health records to analyse my symptoms.</strong> I understand that this feature is an informational tool and does not provide a medical diagnosis or replace a doctor's care.
              </span>
            </label>
          </div>

          <div className="flex justify-between pt-2">
            <button
              onClick={() => setStep(2)}
              className="flex items-center gap-2 rounded-2xl border border-slate-200 bg-white px-5 py-3 text-sm font-bold text-slate-700 hover:bg-slate-50 dark:border-slate-800 dark:bg-slate-900 dark:text-slate-300"
            >
              <ArrowLeft className="h-4 w-4" /> Back
            </button>
            <button
              disabled={!consentGiven || isAnalyzing}
              onClick={handleRunAnalysis}
              className="flex items-center gap-2 rounded-2xl bg-gradient-to-r from-teal-600 to-cyan-600 px-7 py-3.5 text-sm font-bold text-white shadow-xl shadow-teal-600/30 hover:opacity-95 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <Sparkles className="h-4 w-4" />
              <span>Analyse My Symptoms</span>
            </button>
          </div>
        </div>
      )}

      {/* LOADING OVERLAY */}
      {isAnalyzing && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/70 backdrop-blur-md">
          <div className="mx-4 max-w-md rounded-3xl border border-teal-500/30 bg-slate-900 p-8 text-center text-white shadow-2xl space-y-4">
            <div className="relative mx-auto flex h-20 w-20 items-center justify-center">
              <div className="absolute inset-0 animate-ping rounded-full bg-teal-500/20" />
              <div className="h-16 w-16 animate-spin rounded-full border-4 border-teal-500 border-t-transparent" />
              <Sparkles className="h-8 w-8 text-teal-400 absolute" />
            </div>

            <h3 className="text-lg font-bold">Personalized Symptom Analysis</h3>
            <p className="text-xs text-teal-200/90 font-medium">
              Checking your lab results, medicines and allergies...
            </p>

            <div className="flex items-center justify-center gap-1.5 text-[11px] text-slate-400">
              <ShieldCheck className="h-3.5 w-3.5 text-teal-400" />
              <span>Zero-knowledge evaluation for {activePatient.name}</span>
            </div>
          </div>
        </div>
      )}

      {/* STEP 4: AI ANALYSIS RESULTS */}
      {step === 4 && analysisResult && (
        <div className="space-y-6">
          {/* Urgency Banner */}
          <div
            className={cn(
              "rounded-3xl p-6 sm:p-8 shadow-xl border text-white transition-all",
              analysisResult.urgency === 'EMERGENCY'
                ? "bg-gradient-to-r from-red-700 via-rose-800 to-red-900 border-red-500"
                : analysisResult.urgency === 'SEE_DOCTOR'
                ? "bg-gradient-to-r from-amber-600 via-amber-700 to-orange-700 border-amber-500"
                : "bg-gradient-to-r from-emerald-600 via-teal-700 to-emerald-800 border-emerald-500"
            )}
          >
            <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
              <div className="space-y-2">
                <div className="inline-flex items-center gap-1.5 rounded-full bg-white/20 px-3 py-1 text-xs font-bold uppercase tracking-wider backdrop-blur-md">
                  <AlertOctagon className="h-3.5 w-3.5" />
                  {analysisResult.urgency === 'EMERGENCY'
                    ? 'Emergency Triage'
                    : analysisResult.urgency === 'SEE_DOCTOR'
                    ? 'See a Doctor Soon'
                    : 'Self-Care Monitoring'}
                </div>

                <h2 className="text-2xl sm:text-3xl font-extrabold tracking-tight">
                  {analysisResult.urgency === 'EMERGENCY'
                    ? 'Immediate Emergency Attention Recommended'
                    : analysisResult.urgency === 'SEE_DOCTOR'
                    ? 'Clinical Assessment Recommended'
                    : 'Manageable with Self-Care & Observation'}
                </h2>

                <p className="text-sm text-white/95 max-w-3xl leading-relaxed">
                  {analysisResult.urgencyReason}
                </p>

                {analysisResult.urgency === 'EMERGENCY' && (
                  <div className="mt-3 flex items-center gap-2 rounded-xl bg-white/25 px-4 py-2.5 text-sm font-extrabold text-white backdrop-blur-md w-fit">
                    <PhoneCall className="h-4 w-4 text-white animate-bounce" />
                    <span>In India, dial 112 immediately or visit the nearest emergency room.</span>
                  </div>
                )}
              </div>

              <div className="flex flex-wrap md:flex-col gap-2 shrink-0">
                <button
                  onClick={() => window.print()}
                  className="flex items-center gap-2 rounded-xl bg-white/20 px-4 py-2.5 text-xs font-bold text-white hover:bg-white/30 backdrop-blur-sm"
                >
                  <Printer className="h-3.5 w-3.5" />
                  Print / Share
                </button>
              </div>
            </div>
          </div>

          {/* AI Unavailable Note */}
          {!analysisResult.aiAvailable && (
            <div className="rounded-xl border border-amber-200 bg-amber-50 p-3 text-xs text-amber-800 dark:border-amber-900/40 dark:bg-amber-950/20 dark:text-amber-300 flex items-center gap-2">
              <Info className="h-4 w-4 shrink-0" />
              <span>Personalised AI reasoning is currently offline. Recommendations are based on standard clinical triage guidelines.</span>
            </div>
          )}

          {/* Clinical Summary */}
          <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm dark:border-slate-800 dark:bg-slate-900 space-y-2">
            <h3 className="text-sm font-bold uppercase tracking-wider text-slate-500">
              Clinical Assessment Summary
            </h3>
            <p className="text-sm text-slate-800 dark:text-slate-200 leading-relaxed font-medium">
              {analysisResult.summary}
            </p>
          </div>

          {/* "Based on your history" */}
          {analysisResult.historyLinks && analysisResult.historyLinks.length > 0 && (
            <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm dark:border-slate-800 dark:bg-slate-900 space-y-4">
              <div className="flex items-center gap-2 pb-2 border-b border-slate-100 dark:border-slate-800">
                <Sparkles className="h-5 w-5 text-teal-600 dark:text-teal-400" />
                <h3 className="text-base font-bold text-slate-900 dark:text-white">
                  Based on Your Medical History
                </h3>
              </div>

              <div className="space-y-3">
                {analysisResult.historyLinks.map((link, idx) => (
                  <div
                    key={idx}
                    className="rounded-xl border border-teal-100 bg-teal-50/40 p-4 dark:border-teal-900/40 dark:bg-teal-950/20 space-y-2"
                  >
                    <p className="text-xs text-slate-800 dark:text-slate-200 leading-relaxed">
                      {link.text}
                    </p>
                    {link.sources && link.sources.length > 0 && (
                      <div className="flex flex-wrap gap-1.5 pt-1">
                        {link.sources.map((src) => (
                          <button
                            key={src.refId}
                            onClick={() => {
                              if (src.documentId) {
                                window.open(`/api/patients/me/documents/${src.documentId}/file`, '_blank');
                              } else {
                                navigate('/records');
                              }
                            }}
                            className="inline-flex items-center gap-1 rounded-lg bg-teal-100 px-2 py-0.5 text-[11px] font-bold text-teal-800 hover:bg-teal-200 dark:bg-teal-900 dark:text-teal-200 transition-colors"
                            title="Click to view originating source document"
                          >
                            <span>[{src.refId}] {src.label}</span>
                            <ExternalLink className="h-2.5 w-2.5" />
                          </button>
                        ))}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Medicine & Allergy Warnings */}
          {analysisResult.medicineWarnings && analysisResult.medicineWarnings.length > 0 && (
            <div className="rounded-2xl border border-rose-200 bg-rose-50/50 p-6 shadow-sm dark:border-rose-950/50 dark:bg-rose-950/20 space-y-3">
              <div className="flex items-center gap-2 text-rose-800 dark:text-rose-300 font-bold text-sm">
                <AlertTriangle className="h-5 w-5 text-rose-600" />
                <span>Medication & Allergy Warnings</span>
              </div>
              <div className="space-y-2">
                {analysisResult.medicineWarnings.map((w, idx) => (
                  <div
                    key={idx}
                    className="rounded-xl border border-rose-200 bg-white p-3.5 shadow-sm dark:border-rose-900 dark:bg-slate-900 space-y-1.5"
                  >
                    <p className="text-xs text-slate-700 dark:text-slate-300 leading-relaxed">
                      {w.text}
                    </p>
                    {w.sources && w.sources.length > 0 && (
                      <div className="flex flex-wrap gap-1">
                        {w.sources.map((src) => (
                          <span
                            key={src.refId}
                            className="rounded bg-rose-100 px-1.5 py-0.5 text-[10px] font-bold text-rose-800 dark:bg-rose-950 dark:text-rose-300"
                          >
                            [{src.refId}] {src.label}
                          </span>
                        ))}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Possible Causes */}
          {analysisResult.possibleCauses && analysisResult.possibleCauses.length > 0 && (
            <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm dark:border-slate-800 dark:bg-slate-900 space-y-4">
              <h3 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
                <Activity className="h-5 w-5 text-teal-600 dark:text-teal-400" />
                Possible Causes (Ranked)
              </h3>
              <div className="space-y-3">
                {analysisResult.possibleCauses.map((cause, idx) => (
                  <div
                    key={idx}
                    className="rounded-xl border border-slate-100 bg-slate-50/80 p-4 dark:border-slate-800 dark:bg-slate-800/40 space-y-1.5"
                  >
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-bold text-slate-900 dark:text-white">
                        {cause.name}
                      </span>
                      <span
                        className={cn(
                          "rounded-full px-2 py-0.5 text-[10px] font-black uppercase",
                          cause.likelihood === 'HIGH'
                            ? "bg-rose-100 text-rose-700 dark:bg-rose-950 dark:text-rose-300"
                            : cause.likelihood === 'LOW'
                            ? "bg-slate-100 text-slate-600 dark:bg-slate-700 dark:text-slate-300"
                            : "bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300"
                        )}
                      >
                        {cause.likelihood} Likelihood
                      </span>
                    </div>
                    {cause.reason && (
                      <p className="text-xs text-slate-600 dark:text-slate-300">
                        {cause.reason}
                      </p>
                    )}
                    {cause.sources && cause.sources.length > 0 && (
                      <div className="flex flex-wrap gap-1 pt-1">
                        {cause.sources.map((s) => (
                          <span
                            key={s.refId}
                            className="rounded bg-teal-50 px-1.5 py-0.5 text-[10px] font-semibold text-teal-700 dark:bg-teal-950 dark:text-teal-300"
                          >
                            [{s.refId}] {s.label}
                          </span>
                        ))}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Next Steps & Home Care Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Recommended Next Steps */}
            {analysisResult.nextSteps && analysisResult.nextSteps.length > 0 && (
              <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm dark:border-slate-800 dark:bg-slate-900 space-y-3">
                <h3 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2">
                  <CheckCircle2 className="h-4 w-4 text-teal-600" />
                  Recommended Next Steps
                </h3>
                <ul className="space-y-2 text-xs text-slate-700 dark:text-slate-300">
                  {analysisResult.nextSteps.map((stepItem, idx) => (
                    <li key={idx} className="flex items-start gap-2">
                      <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-teal-100 text-[11px] font-bold text-teal-800 dark:bg-teal-950 dark:text-teal-300">
                        {idx + 1}
                      </span>
                      <span className="mt-0.5">{stepItem}</span>
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {/* Home Care */}
            {analysisResult.homeCare && analysisResult.homeCare.length > 0 && (
              <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm dark:border-slate-800 dark:bg-slate-900 space-y-3">
                <h3 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2">
                  <HeartPulse className="h-4 w-4 text-cyan-600" />
                  Home Care & Relief
                </h3>
                <ul className="space-y-2 text-xs text-slate-700 dark:text-slate-300">
                  {analysisResult.homeCare.map((tip, idx) => (
                    <li key={idx} className="flex items-start gap-2">
                      <span className="mt-1 h-1.5 w-1.5 rounded-full bg-cyan-500 shrink-0" />
                      <span>{tip}</span>
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </div>

          {/* Warning Signs & Questions for Doctor Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {analysisResult.warningSigns && analysisResult.warningSigns.length > 0 && (
              <div className="rounded-2xl border border-amber-200 bg-amber-50/60 p-6 shadow-sm dark:border-amber-950/60 dark:bg-amber-950/20 space-y-3">
                <h3 className="text-sm font-bold text-amber-900 dark:text-amber-200 flex items-center gap-2">
                  <AlertTriangle className="h-4 w-4 text-amber-600" />
                  Warning Signs to Watch Out For
                </h3>
                <ul className="space-y-1.5 text-xs text-amber-900 dark:text-amber-300">
                  {analysisResult.warningSigns.map((w, idx) => (
                    <li key={idx} className="flex items-start gap-2">
                      <span className="text-amber-600 font-bold shrink-0">⚠️</span>
                      <span>{w}</span>
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {analysisResult.questionsForDoctor && analysisResult.questionsForDoctor.length > 0 && (
              <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm dark:border-slate-800 dark:bg-slate-900 space-y-3">
                <h3 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2">
                  <FileText className="h-4 w-4 text-teal-600" />
                  Questions to Ask Your Doctor
                </h3>
                <ul className="space-y-1.5 text-xs text-slate-700 dark:text-slate-300">
                  {analysisResult.questionsForDoctor.map((q, idx) => (
                    <li key={idx} className="flex items-start gap-2">
                      <span className="text-teal-600 font-bold shrink-0">•</span>
                      <span>{q}</span>
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </div>

          {/* Mandatory Disclaimer */}
          <div className="rounded-2xl border border-slate-300 bg-slate-100/90 p-4 dark:border-slate-700 dark:bg-slate-800/60 text-xs text-slate-600 dark:text-slate-400">
            <strong>Mandatory Medical Notice:</strong> {analysisResult.disclaimer}
          </div>

          {/* Actions */}
          <div className="flex flex-col sm:flex-row items-center justify-between gap-4 pt-2">
            <button
              onClick={() => {
                setStep(1);
                setAnalysisResult(null);
                setConsentGiven(false);
              }}
              className="flex items-center gap-2 rounded-2xl border border-slate-200 bg-white px-5 py-3 text-sm font-bold text-slate-700 hover:bg-slate-50 dark:border-slate-800 dark:bg-slate-900 dark:text-slate-300"
            >
              <RefreshCw className="h-4 w-4" /> Start New Check
            </button>

            <div className="flex items-center gap-3">
              <button
                onClick={() => navigate('/records')}
                className="rounded-2xl border border-slate-200 bg-white px-5 py-3 text-sm font-bold text-slate-700 hover:bg-slate-50 dark:border-slate-800 dark:bg-slate-900 dark:text-slate-300"
              >
                View My Vault Records
              </button>
              <button
                onClick={() => navigate('/appointments')}
                className="rounded-2xl bg-teal-600 px-6 py-3 text-sm font-bold text-white shadow-lg shadow-teal-600/30 hover:bg-teal-700"
              >
                Book Doctor Consultation
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
