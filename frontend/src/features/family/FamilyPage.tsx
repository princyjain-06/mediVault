import React from 'react';
import { Users, ShieldCheck, UserPlus, ArrowRight } from 'lucide-react';
import { usePatient } from '../../context/PatientContext';

export const FamilyPage: React.FC = () => {
  const { setActivePatientId, activePatient } = usePatient();

  const familyMembers = [
    {
      name: 'Rajesh Sharma',
      relation: 'Self',
      age: 54,
      patientId: 'pat-001',
      abha: '91-4589-2044-1182',
      status: 'Active',
      conditions: 'Hypertension, Diabetes',
      avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&auto=format&fit=crop&q=80',
    },
    {
      name: 'Priya Patel',
      relation: 'Daughter / Family Member',
      age: 29,
      patientId: 'pat-002',
      abha: '91-8842-1920-7741',
      status: 'Active',
      conditions: 'Asthma, Rhinitis',
      avatar: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=150&auto=format&fit=crop&q=80',
    },
    {
      name: 'Sunita Sharma',
      relation: 'Spouse',
      age: 51,
      patientId: 'pat-001', // links to family unit
      abha: '91-7712-4019-3329',
      status: 'Synced via ABHA',
      conditions: 'Thyroid',
      avatar: 'https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=150&auto=format&fit=crop&q=80',
    },
  ];

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 dark:text-white flex items-center gap-2">
            <Users className="h-7 w-7 text-teal-600 dark:text-teal-400" />
            Family Health Vault
          </h1>
          <p className="text-sm text-slate-500 dark:text-slate-400">
            Manage medical records and AI screenings for your entire household
          </p>
        </div>

        <button
          onClick={() => alert('Family Member ABHA link feature: Enter 14-digit ABHA number or Aadhaar OTP to sync dependent.')}
          className="flex items-center gap-2 rounded-2xl bg-teal-600 px-5 py-3 text-sm font-bold text-white shadow-lg shadow-teal-600/30 hover:bg-teal-700 self-start sm:self-auto"
        >
          <UserPlus className="h-4 w-4" /> Link Dependent ABHA
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {familyMembers.map((member, idx) => {
          const isActive = activePatient?.name === member.name;
          return (
            <div
              key={idx}
              className={`rounded-2xl border p-5 shadow-sm transition-all dark:bg-slate-900 ${
                isActive
                  ? 'border-teal-500 bg-teal-50/30 ring-2 ring-teal-500/30 dark:border-teal-500'
                  : 'border-slate-200 bg-white dark:border-slate-800'
              }`}
            >
              <div className="flex items-center gap-3">
                <img
                  src={member.avatar}
                  alt={member.name}
                  className="h-12 w-12 rounded-full object-cover ring-2 ring-teal-500/30"
                />
                <div>
                  <h3 className="text-base font-bold text-slate-900 dark:text-white">
                    {member.name}
                  </h3>
                  <p className="text-xs text-teal-600 dark:text-teal-400 font-medium">
                    {member.relation} • {member.age} yrs
                  </p>
                </div>
              </div>

              <div className="mt-4 rounded-xl bg-slate-50 p-3 text-xs dark:bg-slate-800/60 space-y-1">
                <p className="text-slate-500">
                  <span className="font-semibold text-slate-700 dark:text-slate-300">ABHA:</span> {member.abha}
                </p>
                <p className="text-slate-500">
                  <span className="font-semibold text-slate-700 dark:text-slate-300">Conditions:</span> {member.conditions}
                </p>
              </div>

              <div className="mt-4 pt-3 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between">
                <span className="text-[11px] font-semibold text-emerald-600 flex items-center gap-1">
                  <ShieldCheck className="h-3.5 w-3.5" /> {member.status}
                </span>

                {member.patientId && !isActive && (
                  <button
                    onClick={() => setActivePatientId(member.patientId)}
                    className="flex items-center gap-1 text-xs font-bold text-teal-600 hover:text-teal-700 dark:text-teal-400"
                  >
                    Switch Profile <ArrowRight className="h-3.5 w-3.5" />
                  </button>
                )}
                {isActive && (
                  <span className="text-xs font-bold text-teal-700 dark:text-teal-300">
                    Currently Active
                  </span>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
