import React, { useEffect, useState } from 'react';
import { Plus, Pencil, Trash2, Check, X, AlertTriangle, HeartPulse } from 'lucide-react';
import {
  BackendAllergy,
  BackendCondition,
  AllergySeverityLevel,
  ConditionStatusLevel,
} from '../../types';
import { profileRecordsService } from '../../api/profileRecordsService';

export const AllergiesConditionsSection: React.FC = () => {
  const [allergies, setAllergies] = useState<BackendAllergy[]>([]);
  const [conditions, setConditions] = useState<BackendCondition[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Allergy form
  const [allergen, setAllergen] = useState('');
  const [reaction, setReaction] = useState('');
  const [allergySeverity, setAllergySeverity] = useState<AllergySeverityLevel>('MODERATE');
  const [editingAllergyId, setEditingAllergyId] = useState<string | null>(null);

  // Condition form
  const [condName, setCondName] = useState('');
  const [condStatus, setCondStatus] = useState<ConditionStatusLevel>('ACTIVE');
  const [condDate, setCondDate] = useState('');
  const [editingConditionId, setEditingConditionId] = useState<string | null>(null);

  const loadAll = async () => {
    try {
      setLoading(true);
      setError(null);
      const [aList, cList] = await Promise.all([
        profileRecordsService.getAllergies(),
        profileRecordsService.getConditions(),
      ]);
      setAllergies(aList);
      setConditions(cList);
    } catch (err: any) {
      setError(err?.response?.data?.error || 'Could not load allergies and conditions.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadAll();
  }, []);

  const handleSaveAllergy = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!allergen.trim()) return;
    setError(null);
    try {
      const payload = {
        allergen: allergen.trim(),
        reaction: reaction.trim() || undefined,
        severity: allergySeverity,
      };
      if (editingAllergyId) {
        const updated = await profileRecordsService.updateAllergy(editingAllergyId, payload);
        setAllergies((prev) => prev.map((a) => (a.id === editingAllergyId ? updated : a)));
      } else {
        const created = await profileRecordsService.createAllergy(payload);
        setAllergies((prev) => [created, ...prev]);
      }
      setAllergen('');
      setReaction('');
      setAllergySeverity('MODERATE');
      setEditingAllergyId(null);
    } catch (err: any) {
      setError(err?.response?.data?.error || 'Failed to save allergy.');
    }
  };

  const handleDeleteAllergy = async (id: string) => {
    try {
      await profileRecordsService.deleteAllergy(id);
      setAllergies((prev) => prev.filter((a) => a.id !== id));
    } catch (err: any) {
      setError(err?.response?.data?.error || 'Failed to delete allergy.');
    }
  };

  const handleSaveCondition = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!condName.trim()) return;
    setError(null);
    try {
      const payload = {
        name: condName.trim(),
        status: condStatus,
        diagnosedDate: condDate || null,
      };
      if (editingConditionId) {
        const updated = await profileRecordsService.updateCondition(editingConditionId, payload);
        setConditions((prev) => prev.map((c) => (c.id === editingConditionId ? updated : c)));
      } else {
        const created = await profileRecordsService.createCondition(payload);
        setConditions((prev) => [created, ...prev]);
      }
      setCondName('');
      setCondStatus('ACTIVE');
      setCondDate('');
      setEditingConditionId(null);
    } catch (err: any) {
      setError(err?.response?.data?.error || 'Failed to save condition.');
    }
  };

  const handleDeleteCondition = async (id: string) => {
    try {
      await profileRecordsService.deleteCondition(id);
      setConditions((prev) => prev.filter((c) => c.id !== id));
    } catch (err: any) {
      setError(err?.response?.data?.error || 'Failed to delete condition.');
    }
  };

  return (
    <div className="space-y-6">
      {error && (
        <div className="rounded-xl border border-rose-200 bg-rose-50 px-4 py-2.5 text-xs font-semibold text-rose-700 dark:border-rose-900/50 dark:bg-rose-950/30 dark:text-rose-300">
          {error}
        </div>
      )}

      {/* My Allergies */}
      <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm dark:border-slate-800 dark:bg-slate-900 space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
            <AlertTriangle className="h-5 w-5 text-rose-500" />
            My Allergies
          </h2>
          <span className="text-[11px] font-medium text-slate-400">Used during symptom safety checks</span>
        </div>

        <form onSubmit={handleSaveAllergy} className="grid grid-cols-1 sm:grid-cols-4 gap-2">
          <input
            type="text"
            placeholder="Allergen (e.g. Penicillin)"
            value={allergen}
            onChange={(e) => setAllergen(e.target.value)}
            required
            className="rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-xs text-slate-900 dark:border-slate-700 dark:bg-slate-800 dark:text-white"
          />
          <input
            type="text"
            placeholder="Reaction (e.g. Rash)"
            value={reaction}
            onChange={(e) => setReaction(e.target.value)}
            className="rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-xs text-slate-900 dark:border-slate-700 dark:bg-slate-800 dark:text-white"
          />
          <select
            value={allergySeverity}
            onChange={(e) => setAllergySeverity(e.target.value as AllergySeverityLevel)}
            className="rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-xs text-slate-900 dark:border-slate-700 dark:bg-slate-800 dark:text-white"
          >
            <option value="MILD">Mild</option>
            <option value="MODERATE">Moderate</option>
            <option value="SEVERE">Severe</option>
            <option value="UNKNOWN">Unknown</option>
          </select>
          <div className="flex gap-1.5">
            <button
              type="submit"
              className="flex-1 flex items-center justify-center gap-1 rounded-xl bg-teal-600 px-3 py-2 text-xs font-bold text-white hover:bg-teal-700"
            >
              {editingAllergyId ? <Check className="h-3.5 w-3.5" /> : <Plus className="h-3.5 w-3.5" />}
              {editingAllergyId ? 'Update' : 'Add'}
            </button>
            {editingAllergyId && (
              <button
                type="button"
                onClick={() => {
                  setEditingAllergyId(null);
                  setAllergen('');
                  setReaction('');
                  setAllergySeverity('MODERATE');
                }}
                className="rounded-xl border border-slate-200 px-2.5 py-2 text-xs text-slate-500 hover:bg-slate-100 dark:border-slate-700"
              >
                <X className="h-3.5 w-3.5" />
              </button>
            )}
          </div>
        </form>

        {loading ? (
          <p className="text-xs text-slate-400">Loading allergies...</p>
        ) : allergies.length === 0 ? (
          <p className="text-xs text-slate-400 italic">No allergies recorded yet.</p>
        ) : (
          <div className="space-y-2">
            {allergies.map((a) => (
              <div
                key={a.id}
                className="flex items-center justify-between rounded-xl border border-slate-100 bg-slate-50 px-3 py-2 text-xs dark:border-slate-800 dark:bg-slate-800/50"
              >
                <div>
                  <span className="font-bold text-slate-900 dark:text-white">{a.allergen}</span>
                  <span className="ml-2 rounded-full bg-rose-100 px-2 py-0.5 text-[10px] font-bold text-rose-700 dark:bg-rose-950 dark:text-rose-300">
                    {a.severity}
                  </span>
                  {a.reaction && <span className="ml-2 text-slate-500">— {a.reaction}</span>}
                  <span className="ml-2 text-[10px] text-slate-400">({a.source})</span>
                </div>
                <div className="flex items-center gap-1">
                  <button
                    type="button"
                    onClick={() => {
                      setEditingAllergyId(a.id);
                      setAllergen(a.allergen);
                      setReaction(a.reaction || '');
                      setAllergySeverity(a.severity);
                    }}
                    className="p-1 text-slate-400 hover:text-teal-600"
                    title="Edit"
                  >
                    <Pencil className="h-3.5 w-3.5" />
                  </button>
                  <button
                    type="button"
                    onClick={() => handleDeleteAllergy(a.id)}
                    className="p-1 text-slate-400 hover:text-rose-600"
                    title="Delete"
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* My Conditions */}
      <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm dark:border-slate-800 dark:bg-slate-900 space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
            <HeartPulse className="h-5 w-5 text-teal-600" />
            My Conditions
          </h2>
          <span className="text-[11px] font-medium text-slate-400">Chronic & past diagnoses</span>
        </div>

        <form onSubmit={handleSaveCondition} className="grid grid-cols-1 sm:grid-cols-4 gap-2">
          <input
            type="text"
            placeholder="Condition (e.g. Asthma)"
            value={condName}
            onChange={(e) => setCondName(e.target.value)}
            required
            className="rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-xs text-slate-900 dark:border-slate-700 dark:bg-slate-800 dark:text-white"
          />
          <select
            value={condStatus}
            onChange={(e) => setCondStatus(e.target.value as ConditionStatusLevel)}
            className="rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-xs text-slate-900 dark:border-slate-700 dark:bg-slate-800 dark:text-white"
          >
            <option value="ACTIVE">Active</option>
            <option value="RESOLVED">Resolved</option>
            <option value="UNKNOWN">Unknown</option>
          </select>
          <input
            type="date"
            value={condDate}
            onChange={(e) => setCondDate(e.target.value)}
            className="rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-xs text-slate-900 dark:border-slate-700 dark:bg-slate-800 dark:text-white"
          />
          <div className="flex gap-1.5">
            <button
              type="submit"
              className="flex-1 flex items-center justify-center gap-1 rounded-xl bg-teal-600 px-3 py-2 text-xs font-bold text-white hover:bg-teal-700"
            >
              {editingConditionId ? <Check className="h-3.5 w-3.5" /> : <Plus className="h-3.5 w-3.5" />}
              {editingConditionId ? 'Update' : 'Add'}
            </button>
            {editingConditionId && (
              <button
                type="button"
                onClick={() => {
                  setEditingConditionId(null);
                  setCondName('');
                  setCondStatus('ACTIVE');
                  setCondDate('');
                }}
                className="rounded-xl border border-slate-200 px-2.5 py-2 text-xs text-slate-500 hover:bg-slate-100 dark:border-slate-700"
              >
                <X className="h-3.5 w-3.5" />
              </button>
            )}
          </div>
        </form>

        {loading ? (
          <p className="text-xs text-slate-400">Loading conditions...</p>
        ) : conditions.length === 0 ? (
          <p className="text-xs text-slate-400 italic">No conditions recorded yet.</p>
        ) : (
          <div className="space-y-2">
            {conditions.map((c) => (
              <div
                key={c.id}
                className="flex items-center justify-between rounded-xl border border-slate-100 bg-slate-50 px-3 py-2 text-xs dark:border-slate-800 dark:bg-slate-800/50"
              >
                <div>
                  <span className="font-bold text-slate-900 dark:text-white">{c.name}</span>
                  <span className="ml-2 rounded-full bg-teal-100 px-2 py-0.5 text-[10px] font-bold text-teal-800 dark:bg-teal-950 dark:text-teal-300">
                    {c.status}
                  </span>
                  {c.diagnosedDate && <span className="ml-2 text-slate-500">({c.diagnosedDate})</span>}
                  <span className="ml-2 text-[10px] text-slate-400">({c.source})</span>
                </div>
                <div className="flex items-center gap-1">
                  <button
                    type="button"
                    onClick={() => {
                      setEditingConditionId(c.id);
                      setCondName(c.name);
                      setCondStatus(c.status);
                      setCondDate(c.diagnosedDate || '');
                    }}
                    className="p-1 text-slate-400 hover:text-teal-600"
                    title="Edit"
                  >
                    <Pencil className="h-3.5 w-3.5" />
                  </button>
                  <button
                    type="button"
                    onClick={() => handleDeleteCondition(c.id)}
                    className="p-1 text-slate-400 hover:text-rose-600"
                    title="Delete"
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};
