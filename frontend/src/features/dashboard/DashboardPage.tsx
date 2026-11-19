import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  Sparkles, 
  Activity, 
  Heart, 
  Droplet, 
  Pill, 
  FileText, 
  Lock, 
  ArrowRight,
  TrendingUp,
  ChevronRight,
  ShieldAlert,
  Eye,
  X,
  AlertCircle
} from 'lucide-react';
import { 
  ResponsiveContainer, 
  AreaChart, 
  Area, 
  XAxis, 
  YAxis, 
  Tooltip, 
  CartesianGrid 
} from 'recharts';
import { usePatient } from '../../context/PatientContext';
import { MedicalRecord } from '../../types';
import { formatDate } from '../../lib/utils';

export const DashboardPage: React.FC = () => {
  const navigate = useNavigate();
  const { activePatient, isLoading, isProfileComplete } = usePatient();
  const [selectedRecord, setSelectedRecord] = useState<MedicalRecord | null>(null);

  if (isLoading || !activePatient) {
    return (
      <div className="flex h-96 items-center justify-center">
        <div className="flex flex-col items-center gap-3">
          <div className="h-8 w-8 animate-spin rounded-full border-4 border-teal-500 border-t-transparent" />
          <p className="text-sm text-slate-500">Decrypting patient vault...</p>
        </div>
      </div>
    );
  }

  // Format vitals for Recharts
  const vitalsChartData = (activePatient.vitalsHistory || []).map((v) => ({
    date: v.date.split('-').slice(1).join('/'),
    systolic: v.bloodPressureSys,
    diastolic: v.bloodPressureDia,
    sugar: v.bloodSugar,
    heartRate: v.heartRate,
    weight: v.weight,
  }));

  const latestVitals = activePatient.vitalsHistory && activePatient.vitalsHistory.length > 0 
    ? activePatient.vitalsHistory[activePatient.vitalsHistory.length - 1]
    : null;

  return (
    <div className="space-y-6">
      {/* Profile Incomplete Banner */}
      {!isProfileComplete && (
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 rounded-2xl border border-amber-200 bg-amber-50/90 p-4 shadow-sm dark:border-amber-900/50 dark:bg-amber-950/30">
          <div className="flex items-start sm:items-center gap-3">
            <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-amber-100 text-amber-800 dark:bg-amber-900/60 dark:text-amber-200">
              <AlertCircle className="h-5 w-5" />
            </div>
            <div>
              <h2 className="text-sm font-bold text-amber-900 dark:text-amber-200">
                Incomplete Health Profile
              </h2>
              <p className="text-xs text-amber-800/90 dark:text-amber-300/80">
                Complete your health profile (date of birth, gender, blood group) so MediVault can give more accurate guidance.
              </p>
            </div>
          </div>
          <button
            onClick={() => navigate('/settings')}
            className="inline-flex shrink-0 items-center gap-1.5 self-start sm:self-auto rounded-xl bg-amber-600 px-4 py-2 text-xs font-bold text-white shadow-sm hover:bg-amber-700 transition-colors"
          >
            <span>Complete Profile</span>
            <ArrowRight className="h-3.5 w-3.5" />
          </button>
        </div>
      )}

      {/* Top Welcome & AI Quick Banner */}
      <div className="relative overflow-hidden rounded-3xl bg-gradient-to-r from-teal-600 via-teal-700 to-cyan-800 p-6 sm:p-8 text-white shadow-xl">
        <div className="relative z-10 flex flex-col md:flex-row md:items-center md:justify-between gap-6">
          <div className="max-w-2xl space-y-2">
            <div className="inline-flex items-center gap-2 rounded-full bg-white/15 px-3 py-1 text-xs font-medium backdrop-blur-md">
              <span className="flex h-2 w-2 rounded-full bg-emerald-400 animate-pulse" />
              Vault Active • ABHA #{activePatient.abhaId}
            </div>
            <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight">
              Welcome back, {activePatient.name}
            </h1>
            <p className="text-sm sm:text-base text-teal-100/90 leading-relaxed">
              Your health records are synchronized and encrypted with AES-256. 
              {activePatient.chronicConditions.length > 0 && (
                <span> Tracking {activePatient.chronicConditions.length} chronic conditions and {activePatient.currentMedications.length} active prescriptions.</span>
              )}
            </p>
          </div>

          <div className="shrink-0">
            <button
              onClick={() => navigate('/symptom-checker')}
              className="group flex items-center gap-3 rounded-2xl bg-white px-5 py-3.5 text-sm font-bold text-teal-800 shadow-lg shadow-teal-900/20 hover:bg-teal-50 hover:shadow-xl transition-all"
            >
              <div className="flex h-7 w-7 items-center justify-center rounded-xl bg-teal-100 text-teal-700 group-hover:scale-110 transition-transform">
                <Sparkles className="h-4 w-4" />
              </div>
              <span>Report Symptoms / AI Check</span>
              <ArrowRight className="h-4 w-4 group-hover:translate-x-1 transition-transform" />
            </button>
          </div>
        </div>

        {/* Decorative background glow circles */}
        <div className="absolute -right-16 -top-16 h-64 w-64 rounded-full bg-cyan-400/20 blur-3xl pointer-events-none" />
        <div className="absolute -left-16 -bottom-16 h-64 w-64 rounded-full bg-teal-400/20 blur-3xl pointer-events-none" />
      </div>

      {/* Patient Health Summary Card */}
      <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm dark:border-slate-800 dark:bg-slate-900">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between pb-4 border-b border-slate-100 dark:border-slate-800 gap-2">
          <div>
            <h2 className="text-lg font-bold text-slate-900 dark:text-white flex items-center gap-2">
              <Activity className="h-5 w-5 text-teal-600 dark:text-teal-400" />
              Medical Profile Summary
            </h2>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              Verified clinical baseline used to evaluate drug conflicts and symptom checks
            </p>
          </div>
          <div className="flex items-center gap-2">
            <span className="rounded-lg bg-teal-50 px-2.5 py-1 text-xs font-semibold text-teal-700 dark:bg-teal-950/50 dark:text-teal-300">
              Blood: {activePatient.bloodGroup || 'Not specified'}
            </span>
            <span className="rounded-lg bg-slate-100 px-2.5 py-1 text-xs font-semibold text-slate-700 dark:bg-slate-800 dark:text-slate-300">
              {activePatient.age ? `${activePatient.age} Years` : 'Age N/A'} • {activePatient.gender}
            </span>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 pt-5">
          {/* Chronic Conditions */}
          <div className="space-y-3">
            <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
              <Activity className="h-4 w-4 text-blue-500" />
              Chronic Conditions ({activePatient.chronicConditions?.length || 0})
            </div>
            <div className="space-y-2">
              {(activePatient.chronicConditions || []).length === 0 ? (
                <div className="rounded-xl border border-dashed border-slate-200 p-4 text-center text-xs text-slate-400 dark:border-slate-800">
                  No chronic conditions logged
                </div>
              ) : (
                activePatient.chronicConditions.map((cond) => (
                  <div 
                    key={cond.id} 
                    className="rounded-xl border border-slate-100 bg-slate-50/70 p-3 dark:border-slate-800/80 dark:bg-slate-800/40"
                  >
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-semibold text-slate-800 dark:text-slate-200">
                        {cond.name}
                      </span>
                      <span className="rounded-full bg-blue-100 px-2 py-0.5 text-[10px] font-bold text-blue-700 dark:bg-blue-950 dark:text-blue-300">
                        {cond.status}
                      </span>
                    </div>
                    {cond.notes && (
                      <p className="mt-1 text-xs text-slate-500 dark:text-slate-400 line-clamp-1">
                        {cond.notes}
                      </p>
                    )}
                  </div>
                ))
              )}
            </div>
          </div>

          {/* Current Medications */}
          <div className="space-y-3">
            <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
              <Pill className="h-4 w-4 text-emerald-500" />
              Active Medications ({activePatient.currentMedications?.length || 0})
            </div>
            <div className="space-y-2">
              {(activePatient.currentMedications || []).length === 0 ? (
                <div className="rounded-xl border border-dashed border-slate-200 p-4 text-center text-xs text-slate-400 dark:border-slate-800">
                  No active prescriptions
                </div>
              ) : (
                activePatient.currentMedications.map((med) => (
                  <div 
                    key={med.id} 
                    className="rounded-xl border border-slate-100 bg-slate-50/70 p-3 dark:border-slate-800/80 dark:bg-slate-800/40"
                  >
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-semibold text-slate-800 dark:text-slate-200">
                        {med.name}
                      </span>
                      <span className="text-xs font-bold text-teal-700 dark:text-teal-400">
                        {med.dosage}
                      </span>
                    </div>
                    <p className="mt-0.5 text-xs text-slate-500 dark:text-slate-400">
                      {med.frequency} • {med.purpose}
                    </p>
                  </div>
                ))
              )}
            </div>
          </div>

          {/* Allergies & Red Flags */}
          <div className="space-y-3">
            <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
              <ShieldAlert className="h-4 w-4 text-rose-500" />
              Documented Allergies ({activePatient.allergies?.length || 0})
            </div>
            <div className="space-y-2">
              {(activePatient.allergies || []).length === 0 ? (
                <div className="rounded-xl border border-dashed border-slate-200 p-4 text-center text-xs text-slate-400 dark:border-slate-800">
                  No known allergies documented
                </div>
              ) : (
                activePatient.allergies.map((allergy) => (
                  <div 
                    key={allergy.id} 
                    className="rounded-xl border border-rose-100 bg-rose-50/50 p-3 dark:border-rose-950/40 dark:bg-rose-950/20"
                  >
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-bold text-rose-800 dark:text-rose-300">
                        {allergy.allergen}
                      </span>
                      <span className="rounded-full bg-rose-200/80 px-2 py-0.5 text-[10px] font-extrabold uppercase text-rose-800 dark:bg-rose-900 dark:text-rose-200">
                        {allergy.severity}
                      </span>
                    </div>
                    <p className="mt-1 text-xs text-rose-700/90 dark:text-rose-300/80">
                      Reaction: {allergy.reaction}
                    </p>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Vitals Overview & Mini-Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Latest Metric Cards */}
        <div className="space-y-4 lg:col-span-1">
          <div className="flex items-center justify-between">
            <h2 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
              <Heart className="h-4 w-4 text-rose-500" />
              Latest Vitals Snapshot
            </h2>
            {latestVitals && (
              <span className="text-xs text-slate-500">
                Logged {formatDate(latestVitals.date)}
              </span>
            )}
          </div>

          {latestVitals ? (
            <div className="grid grid-cols-2 gap-3">
              {/* Blood Pressure */}
              <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm dark:border-slate-800 dark:bg-slate-900">
                <div className="flex items-center justify-between text-slate-500 dark:text-slate-400">
                  <span className="text-xs font-semibold">Blood Pressure</span>
                  <Heart className="h-4 w-4 text-rose-500" />
                </div>
                <div className="mt-2 flex items-baseline gap-1">
                  <span className="text-2xl font-black text-slate-900 dark:text-white">
                    {latestVitals.bloodPressureSys}/{latestVitals.bloodPressureDia}
                  </span>
                  <span className="text-[11px] font-medium text-slate-500">mmHg</span>
                </div>
                <p className="mt-1 text-[11px] text-teal-600 dark:text-teal-400 flex items-center gap-0.5">
                  <TrendingUp className="h-3 w-3" /> Monitored monthly
                </p>
              </div>

              {/* Blood Sugar */}
              <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm dark:border-slate-800 dark:bg-slate-900">
                <div className="flex items-center justify-between text-slate-500 dark:text-slate-400">
                  <span className="text-xs font-semibold">Blood Sugar</span>
                  <Droplet className="h-4 w-4 text-amber-500" />
                </div>
                <div className="mt-2 flex items-baseline gap-1">
                  <span className="text-2xl font-black text-slate-900 dark:text-white">
                    {latestVitals.bloodSugar}
                  </span>
                  <span className="text-[11px] font-medium text-slate-500">mg/dL</span>
                </div>
                <p className="mt-1 text-[11px] text-slate-500 flex items-center gap-0.5">
                  Fasting reading
                </p>
              </div>

              {/* Heart Rate */}
              <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm dark:border-slate-800 dark:bg-slate-900">
                <div className="flex items-center justify-between text-slate-500 dark:text-slate-400">
                  <span className="text-xs font-semibold">Resting HR</span>
                  <Activity className="h-4 w-4 text-teal-500" />
                </div>
                <div className="mt-2 flex items-baseline gap-1">
                  <span className="text-2xl font-black text-slate-900 dark:text-white">
                    {latestVitals.heartRate}
                  </span>
                  <span className="text-[11px] font-medium text-slate-500">bpm</span>
                </div>
                <p className="mt-1 text-[11px] text-emerald-600 dark:text-emerald-400">
                  Normal sinus rhythm
                </p>
              </div>

              {/* SpO2 Oxygen */}
              <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm dark:border-slate-800 dark:bg-slate-900">
                <div className="flex items-center justify-between text-slate-500 dark:text-slate-400">
                  <span className="text-xs font-semibold">Oxygen (SpO2)</span>
                  <Sparkles className="h-4 w-4 text-cyan-500" />
                </div>
                <div className="mt-2 flex items-baseline gap-1">
                  <span className="text-2xl font-black text-slate-900 dark:text-white">
                    {latestVitals.oxygenLevel}%
                  </span>
                  <span className="text-[11px] font-medium text-slate-500">sat</span>
                </div>
                <p className="mt-1 text-[11px] text-emerald-600 dark:text-emerald-400">
                  Adequate oxygenation
                </p>
              </div>
            </div>
          ) : (
            <div className="rounded-2xl border border-dashed border-slate-200 bg-white p-8 text-center text-slate-400 dark:border-slate-800 dark:bg-slate-900">
              <Heart className="mx-auto h-8 w-8 text-slate-300 dark:text-slate-600 mb-2" />
              <p className="text-sm font-medium">No vitals logged yet</p>
              <p className="text-xs text-slate-400 mt-1">Connect your smart monitor or log manual readings.</p>
            </div>
          )}
        </div>

        {/* 6-Month Trend Chart */}
        <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm dark:border-slate-800 dark:bg-slate-900 lg:col-span-2 flex flex-col">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between pb-3 border-b border-slate-100 dark:border-slate-800 gap-1">
            <div>
              <h3 className="text-sm font-bold text-slate-900 dark:text-white">
                Vitals Trends (Past 6 Months)
              </h3>
              <p className="text-xs text-slate-500">Systolic & Diastolic Blood Pressure progression</p>
            </div>
            <div className="flex items-center gap-4 text-xs font-medium">
              <span className="flex items-center gap-1.5">
                <span className="h-2.5 w-2.5 rounded-full bg-teal-500" /> Systolic (mmHg)
              </span>
              <span className="flex items-center gap-1.5">
                <span className="h-2.5 w-2.5 rounded-full bg-cyan-400" /> Diastolic (mmHg)
              </span>
            </div>
          </div>

          <div className="mt-4 h-56 w-full">
            {vitalsChartData.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={vitalsChartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                  <defs>
                    <linearGradient id="sysGradient" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#0d9488" stopOpacity={0.3} />
                      <stop offset="95%" stopColor="#0d9488" stopOpacity={0} />
                    </linearGradient>
                    <linearGradient id="diaGradient" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#06b6d4" stopOpacity={0.2} />
                      <stop offset="95%" stopColor="#06b6d4" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} opacity={0.2} />
                  <XAxis dataKey="date" tickLine={false} tick={{ fontSize: 11 }} />
                  <YAxis domain={[60, 160]} tickLine={false} tick={{ fontSize: 11 }} />
                  <Tooltip 
                    contentStyle={{
                      backgroundColor: 'rgba(15, 23, 42, 0.9)',
                      borderRadius: '12px',
                      color: '#fff',
                      border: 'none',
                      fontSize: '12px',
                    }}
                  />
                  <Area 
                    type="monotone" 
                    dataKey="systolic" 
                    stroke="#0d9488" 
                    strokeWidth={2.5} 
                    fillOpacity={1} 
                    fill="url(#sysGradient)" 
                    name="Systolic"
                  />
                  <Area 
                    type="monotone" 
                    dataKey="diastolic" 
                    stroke="#06b6d4" 
                    strokeWidth={2} 
                    fillOpacity={1} 
                    fill="url(#diaGradient)" 
                    name="Diastolic"
                  />
                </AreaChart>
              </ResponsiveContainer>
            ) : (
              <div className="flex h-full items-center justify-center text-xs text-slate-400">
                Log regular readings to visualize blood pressure & glucose trends over time.
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Recent Medical Records */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-lg font-bold text-slate-900 dark:text-white flex items-center gap-2">
              <FileText className="h-5 w-5 text-teal-600 dark:text-teal-400" />
              Encrypted Medical Records Vault
            </h2>
            <p className="text-xs text-slate-500">
              Directly cross-referenced by MediVault AI during clinical triage
            </p>
          </div>
          <button
            onClick={() => navigate('/records')}
            className="flex items-center gap-1 text-xs font-semibold text-teal-600 hover:text-teal-700 dark:text-teal-400"
          >
            <span>View All ({activePatient.recentRecords.length})</span>
            <ChevronRight className="h-4 w-4" />
          </button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {(activePatient.recentRecords || []).length === 0 ? (
            <div className="col-span-full rounded-2xl border border-dashed border-slate-200 bg-white p-8 text-center text-slate-400 dark:border-slate-800 dark:bg-slate-900">
              <FileText className="mx-auto h-8 w-8 text-slate-300 dark:text-slate-600 mb-2" />
              <p className="text-sm font-medium">No medical records uploaded yet</p>
              <p className="text-xs text-slate-400 mt-1">Upload lab reports, discharge summaries or prescriptions in Records.</p>
            </div>
          ) : (
            activePatient.recentRecords.slice(0, 4).map((record) => (
            <div
              key={record.id}
              className="group flex flex-col justify-between rounded-2xl border border-slate-200 bg-white p-5 shadow-sm hover:border-teal-300 hover:shadow-md transition-all dark:border-slate-800 dark:bg-slate-900"
            >
              <div>
                <div className="flex items-center justify-between gap-2">
                  <span className="rounded-lg bg-teal-50 px-2 py-0.5 text-xs font-semibold uppercase text-teal-700 dark:bg-teal-950 dark:text-teal-300">
                    {record.category}
                  </span>
                  <div className="flex items-center gap-1 text-xs text-slate-400">
                    <Lock className="h-3 w-3 text-emerald-500" />
                    <span>AES-256</span>
                  </div>
                </div>

                <h3 className="mt-3 text-base font-bold text-slate-900 dark:text-white group-hover:text-teal-600 dark:group-hover:text-teal-400 transition-colors">
                  {record.title}
                </h3>
                <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
                  {record.facility} • {record.doctor} • {formatDate(record.date)}
                </p>

                <p className="mt-2.5 text-xs text-slate-600 dark:text-slate-300 line-clamp-2">
                  {record.summary}
                </p>

                {/* AI Key Findings preview */}
                {record.aiKeyFindings && record.aiKeyFindings.length > 0 && (
                  <div className="mt-3 rounded-xl bg-slate-50 p-2.5 dark:bg-slate-800/60 text-xs">
                    <span className="font-semibold text-teal-700 dark:text-teal-400 flex items-center gap-1">
                      <Sparkles className="h-3 w-3" /> AI Key Finding:
                    </span>
                    <p className="mt-0.5 text-[11px] text-slate-600 dark:text-slate-300 line-clamp-1">
                      {record.aiKeyFindings[0]}
                    </p>
                  </div>
                )}
              </div>

              <div className="mt-4 pt-3 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between">
                <div className="flex flex-wrap gap-1">
                  {(record.tags || []).map((tag) => (
                    <span 
                      key={tag}
                      className="rounded-md bg-slate-100 px-2 py-0.5 text-[10px] font-medium text-slate-600 dark:bg-slate-800 dark:text-slate-400"
                    >
                      #{tag}
                    </span>
                  ))}
                </div>
                <button
                  onClick={() => setSelectedRecord(record)}
                  className="inline-flex items-center gap-1 text-xs font-semibold text-teal-600 hover:text-teal-700 dark:text-teal-400"
                >
                  <Eye className="h-3.5 w-3.5" /> View
                </button>
              </div>
            </div>
          ))
          )}
        </div>
      </div>

      {/* Record Detail Modal */}
      {selectedRecord && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 p-4 backdrop-blur-sm">
          <div className="w-full max-w-2xl rounded-3xl bg-white p-6 shadow-2xl dark:bg-slate-900 dark:border dark:border-slate-800">
            <div className="flex items-center justify-between border-b border-slate-100 pb-4 dark:border-slate-800">
              <div className="flex items-center gap-2">
                <span className="rounded-lg bg-teal-100 px-2.5 py-1 text-xs font-bold uppercase text-teal-800 dark:bg-teal-950 dark:text-teal-300">
                  {selectedRecord.category}
                </span>
                <span className="text-xs text-slate-400">
                  {formatDate(selectedRecord.date)}
                </span>
              </div>
              <button
                onClick={() => setSelectedRecord(null)}
                className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="mt-4 space-y-4">
              <h3 className="text-xl font-bold text-slate-900 dark:text-white">
                {selectedRecord.title}
              </h3>
              <p className="text-xs text-slate-500">
                Issued by {selectedRecord.doctor} at {selectedRecord.facility}
              </p>

              <div className="rounded-2xl bg-slate-50 p-4 dark:bg-slate-800/50">
                <h4 className="text-xs font-bold uppercase tracking-wider text-slate-500">
                  Clinical Summary
                </h4>
                <p className="mt-1 text-sm text-slate-700 dark:text-slate-300">
                  {selectedRecord.summary}
                </p>
              </div>

              <div className="rounded-2xl border border-teal-100 bg-teal-50/50 p-4 dark:border-teal-900/40 dark:bg-teal-950/20">
                <h4 className="text-xs font-bold uppercase tracking-wider text-teal-700 dark:text-teal-400 flex items-center gap-1.5">
                  <Sparkles className="h-4 w-4" /> MediVault AI Extracted Key Findings
                </h4>
                <ul className="mt-2 space-y-1.5 text-xs text-slate-700 dark:text-slate-300">
                  {selectedRecord.aiKeyFindings.map((finding, idx) => (
                    <li key={idx} className="flex items-start gap-2">
                      <span className="mt-1 h-1.5 w-1.5 rounded-full bg-teal-500 shrink-0" />
                      <span>{finding}</span>
                    </li>
                  ))}
                </ul>
              </div>

              <div className="flex items-center justify-between pt-2">
                <div className="flex items-center gap-1.5 text-xs text-emerald-600 dark:text-emerald-400">
                  <Lock className="h-4 w-4" /> End-to-end encrypted storage
                </div>
                <button
                  onClick={() => setSelectedRecord(null)}
                  className="rounded-xl bg-slate-900 px-4 py-2 text-xs font-bold text-white dark:bg-slate-100 dark:text-slate-900"
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
