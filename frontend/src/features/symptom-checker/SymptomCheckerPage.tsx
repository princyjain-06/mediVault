import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  Sparkles, 
  Search, 
  Plus, 
  Trash2, 
  ShieldCheck, 
  CheckCircle2, 
  AlertTriangle, 
  ArrowRight, 
  ArrowLeft, 
  RefreshCw, 
  Bookmark, 
  AlertOctagon, 
  FileText, 
  Activity, 
  HeartPulse, 
  Printer, 
  Check 
} from 'lucide-react';
import { usePatient } from '../../context/PatientContext';
import { symptomService } from '../../api/symptomService';
import { 
  SymptomOption, 
  ReportedSymptom, 
  SymptomAnalysis 
} from '../../types';
import { cn } from '../../lib/utils';

export const SymptomCheckerPage: React.FC = () => {
  const navigate = useNavigate();
  const { activePatient } = usePatient();

  const [catalog, setCatalog] = useState<SymptomOption[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('All');
  
  // Form state
  const [step, setStep] = useState<1 | 2 | 3 | 4>(1); // 1: Symptoms, 2: Duration/Onset, 3: Review & Consent, 4: Results
  const [reportedSymptoms, setReportedSymptoms] = useState<ReportedSymptom[]>([]);
  const [selectedTriggers, setSelectedTriggers] = useState<string[]>([]);
  const [additionalNotes, setAdditionalNotes] = useState('');
  const [consentGiven, setConsentGiven] = useState(true);

  // Analysis state
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [analyzingMessageIndex, setAnalyzingMessageIndex] = useState(0);
  const [analysisResult, setAnalysisResult] = useState<SymptomAnalysis | null>(null);
  const [savedSuccess, setSavedSuccess] = useState(false);

  const analyzingMessages = [
    'Connecting to Zero-Knowledge Medical Vault...',
    `Factoring in ${activePatient?.name}'s chronic conditions (${activePatient?.chronicConditions.map((c) => c.name).join(', ')})...`,
    `Cross-referencing active medications (${activePatient?.currentMedications.map((m) => m.name).join(', ')})...`,
    `Scanning documented allergies for contraindications...`,
    'Synthesizing clinical triage recommendations...',
  ];

  useEffect(() => {
    symptomService.getSymptomsCatalog().then((data) => setCatalog(data));
  }, []);

  useEffect(() => {
    let interval: NodeJS.Timeout;
    if (isAnalyzing) {
      interval = setInterval(() => {
        setAnalyzingMessageIndex((prev) => (prev + 1) % analyzingMessages.length);
      }, 700);
    }
    return () => clearInterval(interval);
  }, [isAnalyzing, analyzingMessages.length]);

  // Pre-populate with typical symptoms based on active patient to give the user quick testing ease
  useEffect(() => {
    if (activePatient?.id === 'pat-001' && reportedSymptoms.length === 0) {
      setReportedSymptoms([
        {
          symptomId: 'sym-1',
          name: 'Throbbing Headache',
          severity: 'moderate',
          duration: '1 day',
          onset: 'gradual',
          bodyLocation: 'Temples & Back of head',
          notes: 'Dull ache that turns pulsing in afternoon',
        },
      ]);
      setSelectedTriggers(['Stress', 'Elevated BP']);
    } else if (activePatient?.id === 'pat-002' && reportedSymptoms.length === 0) {
      setReportedSymptoms([
        {
          symptomId: 'sym-4',
          name: 'Wheezing & Persistent Cough',
          severity: 'moderate',
          duration: '2 days',
          onset: 'gradual',
          bodyLocation: 'Chest / Airway',
          notes: 'Expiratory whistling especially at bedtime',
        },
      ]);
      setSelectedTriggers(['Cold air', 'Dust mites']);
    }
  }, [activePatient?.id]);

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
    }
  };

  const updateSymptom = (index: number, updates: Partial<ReportedSymptom>) => {
    setReportedSymptoms((prev) => {
      const copy = [...prev];
      copy[index] = { ...copy[index], ...updates };
      return copy;
    });
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
    if (!activePatient || reportedSymptoms.length === 0) return;
    setIsAnalyzing(true);
    setSavedSuccess(false);

    try {
      const result = await symptomService.analyzeSymptoms({
        patientId: activePatient.id,
        symptoms: reportedSymptoms,
        additionalNotes,
        triggers: selectedTriggers,
        consentGiven: true,
      });
      setAnalysisResult(result);
      setStep(4);
    } catch (err) {
      console.error('Error analyzing symptoms:', err);
    } finally {
      setIsAnalyzing(false);
    }
  };

  const handleShare = () => {
    window.print();
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

        {/* Multi-step progress indicator */}
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
                {step > s ? <Check className="h-4 w-4" /> : s}
              </div>
            ))}
            <span className="px-2 text-xs font-semibold text-slate-500">
              Step {step} of 3
            </span>
          </div>
        )}
      </div>

      {/* STEP 1: Select & Search Symptoms */}
      {step === 1 && (
        <div className="space-y-6">
          {/* Active reported symptoms tray */}
          <div className="rounded-2xl border border-teal-200 bg-teal-50/40 p-5 dark:border-teal-900/50 dark:bg-teal-950/20">
            <div className="flex items-center justify-between pb-3 border-b border-teal-100 dark:border-teal-900/40">
              <div className="flex items-center gap-2">
                <HeartPulse className="h-5 w-5 text-teal-600 dark:text-teal-400" />
                <h2 className="text-sm font-bold text-slate-900 dark:text-white">
                  Reported Symptoms ({reportedSymptoms.length})
                </h2>
              </div>
              <span className="text-xs text-slate-500">
                Select from below or type custom symptoms
              </span>
            </div>

            {reportedSymptoms.length === 0 ? (
              <div className="py-8 text-center text-xs text-slate-500">
                No symptoms added yet. Click any symptom below or search to add.
              </div>
            ) : (
              <div className="mt-4 space-y-3">
                {reportedSymptoms.map((sym, idx) => (
                  <div
                    key={sym.symptomId}
                    className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 rounded-xl border border-white bg-white p-4 shadow-sm dark:border-slate-800 dark:bg-slate-900"
                  >
                    <div className="flex items-center gap-3">
                      <span className="flex h-6 w-6 items-center justify-center rounded-full bg-teal-100 text-xs font-bold text-teal-700 dark:bg-teal-950 dark:text-teal-300">
                        {idx + 1}
                      </span>
                      <div>
                        <h3 className="text-sm font-bold text-slate-900 dark:text-white">
                          {sym.name}
                        </h3>
                        {sym.notes && (
                          <p className="text-xs text-slate-500">{sym.notes}</p>
                        )}
                      </div>
                    </div>

                    <div className="flex items-center gap-2 flex-wrap">
                      {/* Severity Selector */}
                      <div className="flex rounded-lg border border-slate-200 bg-slate-50 p-0.5 text-xs dark:border-slate-700 dark:bg-slate-800">
                        {(['mild', 'moderate', 'severe'] as const).map((sev) => (
                          <button
                            key={sev}
                            type="button"
                            onClick={() => updateSymptom(idx, { severity: sev })}
                            className={cn(
                              "rounded-md px-2.5 py-1 font-semibold capitalize transition-all",
                              sym.severity === sev
                                ? sev === 'severe'
                                  ? "bg-rose-600 text-white shadow-sm"
                                  : sev === 'moderate'
                                  ? "bg-amber-500 text-white shadow-sm"
                                  : "bg-teal-600 text-white shadow-sm"
                                : "text-slate-600 dark:text-slate-400"
                            )}
                          >
                            {sev}
                          </button>
                        ))}
                      </div>

                      <button
                        type="button"
                        onClick={() => removeSymptom(idx)}
                        className="rounded-lg p-1.5 text-slate-400 hover:bg-rose-50 hover:text-rose-600 dark:hover:bg-rose-950/40"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Search & Filter Catalog */}
          <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm dark:border-slate-800 dark:bg-slate-900 space-y-4">
            <div className="flex flex-col sm:flex-row gap-3">
              <div className="relative flex-1">
                <Search className="absolute left-3.5 top-3 h-4 w-4 text-slate-400" />
                <input
                  type="text"
                  placeholder="Search symptoms (e.g., headache, wheezing, chest pain)..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') addCustomSymptom();
                  }}
                  className="w-full rounded-xl border border-slate-200 bg-slate-50 pl-10 pr-4 py-2.5 text-sm text-slate-900 focus:border-teal-500 focus:bg-white focus:outline-none dark:border-slate-700 dark:bg-slate-800 dark:text-white"
                />
              </div>

              {searchTerm.trim() && (
                <button
                  onClick={addCustomSymptom}
                  className="flex items-center gap-1.5 rounded-xl bg-teal-600 px-4 py-2.5 text-xs font-bold text-white hover:bg-teal-700"
                >
                  <Plus className="h-4 w-4" /> Add "{searchTerm}"
                </button>
              )}
            </div>

            {/* Category filter pills */}
            <div className="flex flex-wrap items-center justify-between gap-2 pt-1 border-t border-slate-100 dark:border-slate-800">
              <div className="flex flex-wrap gap-1.5">
                {categories.map((cat) => (
                  <button
                    key={cat}
                    onClick={() => setSelectedCategory(cat)}
                    className={cn(
                      "rounded-xl px-3 py-1.5 text-xs font-semibold transition-all",
                      selectedCategory === cat
                        ? "bg-slate-900 text-white dark:bg-slate-100 dark:text-slate-900"
                        : "bg-slate-100 text-slate-600 hover:bg-slate-200 dark:bg-slate-800 dark:text-slate-300"
                    )}
                  >
                    {cat}
                  </button>
                ))}
              </div>
              <span className="text-xs text-slate-400 font-medium">
                {filteredCatalog.length} symptoms available
              </span>
            </div>

            {/* Quick Common Symptoms */}
            {selectedCategory === 'All' && !searchTerm && (
              <div className="space-y-1.5 pt-1">
                <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500">
                  Quick Picks (Most Common)
                </span>
                <div className="flex flex-wrap gap-1.5">
                  {commonQuickPicks.map((symName) => {
                    const match = catalog.find((c) => c.name === symName);
                    const isSelected = reportedSymptoms.some((s) => s.name === symName);
                    if (!match) return null;
                    return (
                      <button
                        key={symName}
                        type="button"
                        onClick={() => toggleSymptomSelection(match)}
                        className={cn(
                          "rounded-lg px-2.5 py-1 text-xs font-medium border transition-all",
                          isSelected
                            ? "bg-teal-600 text-white border-teal-600 shadow-sm"
                            : "bg-slate-50 text-slate-700 border-slate-200 hover:border-teal-400 hover:bg-teal-50 dark:bg-slate-800 dark:border-slate-700 dark:text-slate-300"
                        )}
                      >
                        {isSelected ? '✓ ' : '+ '}
                        {symName}
                      </button>
                    );
                  })}
                </div>
              </div>
            )}

            {/* Symptoms Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3 pt-2">
              {filteredCatalog.map((item) => {
                const isSelected = reportedSymptoms.some((s) => s.symptomId === item.id);
                return (
                  <button
                    key={item.id}
                    onClick={() => toggleSymptomSelection(item)}
                    type="button"
                    className={cn(
                      "flex flex-col items-start p-3.5 rounded-xl border text-left transition-all",
                      isSelected
                        ? "border-teal-500 bg-teal-50/80 ring-2 ring-teal-500/30 dark:border-teal-500 dark:bg-teal-950/40"
                        : "border-slate-200 bg-white hover:border-slate-300 dark:border-slate-800 dark:bg-slate-900/60"
                    )}
                  >
                    <div className="flex w-full items-center justify-between">
                      <span className="text-xs font-bold uppercase text-teal-700 dark:text-teal-400">
                        {item.category}
                      </span>
                      {isSelected ? (
                        <CheckCircle2 className="h-4 w-4 text-teal-600 dark:text-teal-400" />
                      ) : (
                        <Plus className="h-4 w-4 text-slate-400" />
                      )}
                    </div>
                    <span className="mt-1 font-bold text-sm text-slate-900 dark:text-white">
                      {item.name}
                    </span>
                    <span className="mt-0.5 text-xs text-slate-500 dark:text-slate-400 line-clamp-2">
                      {item.description}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Action bottom bar */}
          <div className="flex justify-end pt-2">
            <button
              disabled={reportedSymptoms.length === 0}
              onClick={() => setStep(2)}
              className="flex items-center gap-2 rounded-2xl bg-teal-600 px-6 py-3.5 text-sm font-bold text-white shadow-lg shadow-teal-600/30 hover:bg-teal-700 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <span>Next: Duration & Triggers</span>
              <ArrowRight className="h-4 w-4" />
            </button>
          </div>
        </div>
      )}

      {/* STEP 2: Duration, Onset & Triggers */}
      {step === 2 && (
        <div className="space-y-6">
          <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm dark:border-slate-800 dark:bg-slate-900 space-y-6">
            <h2 className="text-base font-bold text-slate-900 dark:text-white">
              Symptom Timing & Aggravating Factors
            </h2>

            {/* Individual symptoms duration / onset inputs */}
            <div className="space-y-4">
              {reportedSymptoms.map((sym, idx) => (
                <div 
                  key={sym.symptomId} 
                  className="rounded-xl border border-slate-100 bg-slate-50 p-4 dark:border-slate-800 dark:bg-slate-800/40 space-y-3"
                >
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-bold text-slate-900 dark:text-white">
                      {sym.name}
                    </span>
                    <span className="text-xs font-semibold uppercase text-teal-600 dark:text-teal-400">
                      Severity: {sym.severity}
                    </span>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="text-xs font-medium text-slate-500">Duration</label>
                      <select
                        value={sym.duration}
                        onChange={(e) => updateSymptom(idx, { duration: e.target.value })}
                        className="mt-1 w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs font-medium text-slate-900 dark:border-slate-700 dark:bg-slate-800 dark:text-white"
                      >
                        <option value="Less than 2 hours">Less than 2 hours</option>
                        <option value="6 to 12 hours">6 to 12 hours</option>
                        <option value="1 day">1 day</option>
                        <option value="2 to 3 days">2 to 3 days</option>
                        <option value="1 to 2 weeks">1 to 2 weeks</option>
                        <option value="Over a month (Chronic)">Over a month (Chronic)</option>
                      </select>
                    </div>

                    <div>
                      <label className="text-xs font-medium text-slate-500">Onset Manner</label>
                      <select
                        value={sym.onset}
                        onChange={(e) => updateSymptom(idx, { onset: e.target.value as 'gradual' | 'sudden' })}
                        className="mt-1 w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs font-medium text-slate-900 dark:border-slate-700 dark:bg-slate-800 dark:text-white"
                      >
                        <option value="gradual">Gradual / Developed over time</option>
                        <option value="sudden">Sudden / Immediate acute onset</option>
                      </select>
                    </div>
                  </div>
                </div>
              ))}
            </div>

            {/* Triggers Selector */}
            <div className="space-y-3 pt-2">
              <label className="text-xs font-bold uppercase tracking-wider text-slate-500">
                Suspected Triggers or Aggravating Circumstances
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

            {/* Additional contextual notes */}
            <div className="space-y-2">
              <label className="text-xs font-bold uppercase tracking-wider text-slate-500">
                Any other symptoms or subjective sensations?
              </label>
              <textarea
                rows={3}
                placeholder="E.g., Took 1 dose of paracetamol with mild relief, or feeling dizzy when bending forward..."
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
              <span>Next: Medical History Review</span>
              <ArrowRight className="h-4 w-4" />
            </button>
          </div>
        </div>
      )}

      {/* STEP 3: Review Medical History & Consent */}
      {step === 3 && (
        <div className="space-y-6">
          {/* Medical Context Preview */}
          <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm dark:border-slate-800 dark:bg-slate-900 space-y-6">
            <div>
              <h2 className="text-lg font-bold text-slate-900 dark:text-white flex items-center gap-2">
                <Sparkles className="h-5 w-5 text-teal-600 dark:text-teal-400" />
                Medical History Integration Preview
              </h2>
              <p className="text-xs text-slate-500">
                MediVault AI will automatically cross-reference these active parameters from {activePatient.name}’s vault:
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="rounded-xl border border-slate-100 bg-slate-50 p-4 dark:border-slate-800 dark:bg-slate-800/40">
                <span className="text-xs font-bold uppercase text-slate-500">Chronic Diagnoses</span>
                <ul className="mt-2 space-y-1 text-xs font-semibold text-slate-800 dark:text-slate-200">
                  {activePatient.chronicConditions.map((c) => (
                    <li key={c.id}>• {c.name}</li>
                  ))}
                </ul>
              </div>

              <div className="rounded-xl border border-slate-100 bg-slate-50 p-4 dark:border-slate-800 dark:bg-slate-800/40">
                <span className="text-xs font-bold uppercase text-slate-500">Current Medications</span>
                <ul className="mt-2 space-y-1 text-xs font-semibold text-slate-800 dark:text-slate-200">
                  {activePatient.currentMedications.map((m) => (
                    <li key={m.id}>• {m.name} ({m.dosage})</li>
                  ))}
                </ul>
              </div>

              <div className="rounded-xl border border-rose-100 bg-rose-50/40 p-4 dark:border-rose-950/40 dark:bg-rose-950/20">
                <span className="text-xs font-bold uppercase text-rose-700 dark:text-rose-400">Documented Allergies</span>
                <ul className="mt-2 space-y-1 text-xs font-semibold text-rose-800 dark:text-rose-300">
                  {activePatient.allergies.map((a) => (
                    <li key={a.id}>• {a.allergen} ({a.reaction})</li>
                  ))}
                </ul>
              </div>
            </div>

            {/* Encryption & Trust Notice */}
            <div className="rounded-xl border border-teal-100 bg-teal-50/60 p-4 dark:border-teal-900/40 dark:bg-teal-950/20 flex items-start gap-3">
              <ShieldCheck className="h-5 w-5 text-teal-600 dark:text-teal-400 shrink-0 mt-0.5" />
              <div className="text-xs">
                <h4 className="font-bold text-teal-900 dark:text-teal-200">
                  Zero-Knowledge Vault Encryption
                </h4>
                <p className="mt-0.5 text-slate-600 dark:text-slate-400 leading-relaxed">
                  Your symptoms and records are evaluated in an isolated secure sandbox conforming to Ayushman Bharat Digital Mission (ABDM) guidelines. Data is never sold or used for public training.
                </p>
              </div>
            </div>

            {/* Mandatory Consent Checkbox */}
            <label className="flex items-start gap-3 p-3 rounded-xl border border-slate-200 bg-slate-50/80 dark:border-slate-700 dark:bg-slate-800/50 cursor-pointer">
              <input
                type="checkbox"
                checked={consentGiven}
                onChange={(e) => setConsentGiven(e.target.checked)}
                className="mt-1 h-4 w-4 rounded border-slate-300 text-teal-600 focus:ring-teal-500"
              />
              <span className="text-xs text-slate-600 dark:text-slate-300">
                <strong>Medical Informational Consent:</strong> I understand that MediVault AI is an educational screening aid and clinical triage tool, not a doctor. It does not provide definitive medical diagnoses or prescribe controlled medications. In a medical emergency, I will contact emergency services immediately.
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
              <Sparkles className="h-4 w-4 animate-spin" />
              <span>Run AI Medical History Analysis</span>
            </button>
          </div>
        </div>
      )}

      {/* LOADING OVERLAY */}
      {isAnalyzing && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/70 backdrop-blur-md">
          <div className="mx-4 max-w-md rounded-3xl border border-teal-500/30 bg-slate-900 p-8 text-center text-white shadow-2xl">
            <div className="relative mx-auto flex h-20 w-20 items-center justify-center">
              <div className="absolute inset-0 animate-ping rounded-full bg-teal-500/20" />
              <div className="h-16 w-16 animate-spin rounded-full border-4 border-teal-500 border-t-transparent" />
              <Sparkles className="h-8 w-8 text-teal-400 absolute" />
            </div>

            <h3 className="mt-6 text-lg font-bold">Synthesizing Medical Records</h3>
            <p className="mt-2 min-h-[48px] text-xs text-teal-200/80 transition-all duration-300">
              {analyzingMessages[analyzingMessageIndex]}
            </p>

            <div className="mt-4 flex items-center justify-center gap-1.5 text-[11px] text-slate-400">
              <ShieldCheck className="h-3.5 w-3.5 text-teal-400" />
              <span>ABDM Encrypted Session • Patient #{activePatient.id}</span>
            </div>
          </div>
        </div>
      )}

      {/* STEP 4: AI ANALYSIS RESULTS */}
      {step === 4 && analysisResult && (
        <div className="space-y-6">
          {/* Triage Banner */}
          <div
            className={cn(
              "rounded-3xl p-6 sm:p-8 shadow-xl border text-white transition-all",
              analysisResult.triageTier === 'urgent'
                ? "bg-gradient-to-r from-rose-600 via-rose-700 to-amber-700 border-rose-500"
                : analysisResult.triageTier === 'emergency'
                ? "bg-gradient-to-r from-red-700 to-rose-900 border-red-500"
                : "bg-gradient-to-r from-teal-600 via-teal-700 to-emerald-700 border-teal-500"
            )}
          >
            <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
              <div className="space-y-2">
                <div className="inline-flex items-center gap-1.5 rounded-full bg-white/20 px-3 py-1 text-xs font-bold uppercase tracking-wider backdrop-blur-md">
                  <AlertOctagon className="h-3.5 w-3.5" />
                  Triage Tier: {analysisResult.triageTier}
                </div>
                <h2 className="text-2xl sm:text-3xl font-extrabold tracking-tight">
                  {analysisResult.urgencyHeadline}
                </h2>
                <p className="text-sm text-white/90 max-w-3xl leading-relaxed">
                  {analysisResult.urgencyExplanation}
                </p>
              </div>

              <div className="flex flex-wrap md:flex-col gap-2 shrink-0">
                <button
                  onClick={() => {
                    setSavedSuccess(true);
                  }}
                  className="flex items-center gap-2 rounded-xl bg-white px-4 py-2.5 text-xs font-bold text-slate-900 shadow-md hover:bg-slate-100"
                >
                  <Bookmark className="h-3.5 w-3.5 text-teal-600" />
                  {savedSuccess ? 'Saved in Records' : 'Save to My Records'}
                </button>
                <button
                  onClick={handleShare}
                  className="flex items-center gap-2 rounded-xl bg-white/20 px-4 py-2.5 text-xs font-bold text-white hover:bg-white/30 backdrop-blur-sm"
                >
                  <Printer className="h-3.5 w-3.5" />
                  Print / Share with Doctor
                </button>
              </div>
            </div>
          </div>

          {/* Personalized Insights Linked to Records */}
          <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm dark:border-slate-800 dark:bg-slate-900 space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
              <div className="flex items-center gap-2">
                <Sparkles className="h-5 w-5 text-teal-600 dark:text-teal-400" />
                <h3 className="text-base font-bold text-slate-900 dark:text-white">
                  Personalized Insights (Cross-Referenced with Records)
                </h3>
              </div>
              <span className="text-xs text-slate-500">
                Patient: {analysisResult.patientName}
              </span>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {analysisResult.personalizedInsights.map((insight, idx) => (
                <div
                  key={idx}
                  className="rounded-xl border border-teal-100 bg-teal-50/40 p-4 dark:border-teal-900/40 dark:bg-teal-950/20 space-y-2"
                >
                  <div className="flex items-center justify-between">
                    <h4 className="text-sm font-bold text-teal-900 dark:text-teal-200">
                      {insight.title}
                    </h4>
                    <span className="rounded-full bg-teal-200/70 px-2 py-0.5 text-[10px] font-bold text-teal-800 dark:bg-teal-900 dark:text-teal-300 uppercase">
                      {insight.relevance}
                    </span>
                  </div>
                  <p className="text-xs text-slate-700 dark:text-slate-300 leading-relaxed">
                    {insight.description}
                  </p>
                  {insight.linkedRecordTitle && (
                    <div className="pt-2 border-t border-teal-100 dark:border-teal-900/40 flex items-center justify-between">
                      <span className="text-[11px] text-teal-700 dark:text-teal-400 font-medium flex items-center gap-1">
                        <FileText className="h-3 w-3" /> Linked Record: {insight.linkedRecordTitle}
                      </span>
                      <button
                        onClick={() => navigate('/records')}
                        className="text-[11px] font-bold text-teal-800 hover:underline dark:text-teal-300"
                      >
                        Open Record
                      </button>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>

          {/* Contraindications & Allergy Warnings */}
          {analysisResult.interactionAlerts.length > 0 && (
            <div className="rounded-2xl border border-rose-200 bg-rose-50/50 p-6 shadow-sm dark:border-rose-950/50 dark:bg-rose-950/20 space-y-3">
              <div className="flex items-center gap-2 text-rose-800 dark:text-rose-300 font-bold text-sm">
                <AlertTriangle className="h-5 w-5 text-rose-600" />
                <span>Medication & Allergy Interaction Warnings</span>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3 pt-1">
                {analysisResult.interactionAlerts.map((alert, idx) => (
                  <div
                    key={idx}
                    className="rounded-xl border border-rose-200 bg-white p-3.5 shadow-sm dark:border-rose-900 dark:bg-slate-900"
                  >
                    <div className="flex items-center justify-between">
                      <h4 className="text-xs font-bold text-rose-800 dark:text-rose-300">
                        {alert.title}
                      </h4>
                      <span className="rounded-full bg-rose-100 px-2 py-0.5 text-[10px] font-black uppercase text-rose-700 dark:bg-rose-950 dark:text-rose-300">
                        {alert.severity}
                      </span>
                    </div>
                    <p className="mt-1 text-xs text-slate-600 dark:text-slate-300">
                      {alert.description}
                    </p>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Possible Causes & Differential Probabilities */}
          <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm dark:border-slate-800 dark:bg-slate-900 space-y-4">
            <h3 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
              <Activity className="h-5 w-5 text-teal-600 dark:text-teal-400" />
              Possible Differential Causes (Ranked)
            </h3>
            <div className="space-y-4">
              {analysisResult.possibleCauses.map((cause, idx) => (
                <div
                  key={idx}
                  className="rounded-xl border border-slate-100 bg-slate-50/80 p-4 dark:border-slate-800 dark:bg-slate-800/40 space-y-2"
                >
                  <div className="flex items-center justify-between">
                    <div>
                      <h4 className="text-sm font-bold text-slate-900 dark:text-white">
                        {cause.name}
                      </h4>
                      <p className="text-xs text-slate-500">
                        Recommended Specialist: {cause.recommendedSpecialist}
                      </p>
                    </div>
                    <span className="text-sm font-extrabold text-teal-600 dark:text-teal-400">
                      {cause.probability}% Match
                    </span>
                  </div>

                  {/* Probability Bar */}
                  <div className="h-2 w-full rounded-full bg-slate-200 dark:bg-slate-700 overflow-hidden">
                    <div
                      className="h-full rounded-full bg-teal-500 transition-all duration-500"
                      style={{ width: `${cause.probability}%` }}
                    />
                  </div>
                  <p className="text-xs text-slate-600 dark:text-slate-300">
                    {cause.description}
                  </p>
                </div>
              ))}
            </div>
          </div>

          {/* Next Steps & Home Care */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Recommended Next Steps */}
            <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm dark:border-slate-800 dark:bg-slate-900 space-y-3">
              <h3 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2">
                <CheckCircle2 className="h-4 w-4 text-teal-600" />
                Recommended Clinical Next Steps
              </h3>
              <ul className="space-y-2 text-xs text-slate-700 dark:text-slate-300">
                {analysisResult.recommendedNextSteps.map((stepItem, idx) => (
                  <li key={idx} className="flex items-start gap-2">
                    <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-teal-100 text-[11px] font-bold text-teal-800 dark:bg-teal-950 dark:text-teal-300">
                      {idx + 1}
                    </span>
                    <span className="mt-0.5">{stepItem}</span>
                  </li>
                ))}
              </ul>
            </div>

            {/* Home Care & Relief */}
            <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm dark:border-slate-800 dark:bg-slate-900 space-y-3">
              <h3 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2">
                <HeartPulse className="h-4 w-4 text-cyan-600" />
                Evidence-Based Home Care Tips
              </h3>
              <ul className="space-y-2 text-xs text-slate-700 dark:text-slate-300">
                {analysisResult.homeCareTips.map((tip, idx) => (
                  <li key={idx} className="flex items-start gap-2">
                    <span className="mt-1 h-1.5 w-1.5 rounded-full bg-cyan-500 shrink-0" />
                    <span>{tip}</span>
                  </li>
                ))}
              </ul>
            </div>
          </div>

          {/* Red Flags / Emergency Warnings */}
          <div className="rounded-2xl border border-amber-200 bg-amber-50/60 p-6 shadow-sm dark:border-amber-950/60 dark:bg-amber-950/20 space-y-3">
            <h3 className="text-sm font-bold text-amber-900 dark:text-amber-200 flex items-center gap-2">
              <AlertTriangle className="h-4 w-4 text-amber-600" />
              Critical Red Flags: Seek Immediate Emergency Care If:
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs text-amber-800 dark:text-amber-300">
              {analysisResult.redFlags.map((flag, idx) => (
                <div key={idx} className="flex items-start gap-2">
                  <span className="text-amber-600 font-bold shrink-0">⚠️</span>
                  <span>{flag}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Mandatory Visible Medical Disclaimer */}
          <div className="rounded-2xl border border-slate-300 bg-slate-100/80 p-4 dark:border-slate-700 dark:bg-slate-800/60 text-xs text-slate-600 dark:text-slate-400">
            <strong>Mandatory Medical Notice:</strong> {analysisResult.disclaimer}
          </div>

          {/* Action Footer */}
          <div className="flex flex-col sm:flex-row items-center justify-between gap-4 pt-2">
            <button
              onClick={() => {
                setStep(1);
                setAnalysisResult(null);
              }}
              className="flex items-center gap-2 rounded-2xl border border-slate-200 bg-white px-5 py-3 text-sm font-bold text-slate-700 hover:bg-slate-50 dark:border-slate-800 dark:bg-slate-900 dark:text-slate-300"
            >
              <RefreshCw className="h-4 w-4" /> Start New Check
            </button>

            <div className="flex items-center gap-3">
              <button
                onClick={() => navigate('/symptom-history')}
                className="rounded-2xl border border-slate-200 bg-white px-5 py-3 text-sm font-bold text-slate-700 hover:bg-slate-50 dark:border-slate-800 dark:bg-slate-900 dark:text-slate-300"
              >
                View Past Checks
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
