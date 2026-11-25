import React, { useState, useEffect } from 'react';
import { 
  Settings, 
  ShieldCheck, 
  Key, 
  Server, 
  Smartphone, 
  Save, 
  Check,
  AlertCircle
} from 'lucide-react';
import { usePatient } from '../../context/PatientContext';
import { useTheme } from '../../context/ThemeContext';
import { patientService } from '../../api/patientService';
import { emergencyContactService } from '../../api/emergencyContactService';
import { USE_MOCK, API_BASE_URL } from '../../api/client';
import { BloodGroup } from '../../types';
import { EmergencyContact } from '../../types/emergencyContact';
import { AllergiesConditionsSection } from './AllergiesConditionsSection';

export const SettingsPage: React.FC = () => {
  const { refreshPatient } = usePatient();
  const { theme, toggleTheme } = useTheme();

  // Patient profile form state
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [dateOfBirth, setDateOfBirth] = useState('');
  const [gender, setGender] = useState('');
  const [bloodGroup, setBloodGroup] = useState<BloodGroup | ''>('');
  const [phone, setPhone] = useState('');
  const [abhaId, setAbhaId] = useState('');

  // Primary emergency contact state
  const [primaryContactId, setPrimaryContactId] = useState<string | null>(null);
  const [emergencyName, setEmergencyName] = useState('');
  const [emergencyRelationship, setEmergencyRelationship] = useState('');
  const [emergencyPhone, setEmergencyPhone] = useState('');

  // UI state
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // Load profile and primary emergency contact from backend
  const loadData = async () => {
    try {
      setIsLoading(true);
      const [profile, contacts] = await Promise.all([
        patientService.getMyProfile(),
        emergencyContactService.getContacts().catch(() => [] as EmergencyContact[])
      ]);

      setName(profile.name || '');
      setEmail(profile.email || '');
      setDateOfBirth(profile.dateOfBirth || '');
      setGender(profile.gender ? profile.gender.toUpperCase() : '');
      setBloodGroup((profile.bloodGroup as BloodGroup) || '');
      setPhone(profile.phone || '');
      setAbhaId(profile.abhaId || '');

      // Load primary contact from dedicated emergency contacts endpoint
      const primary = contacts.find((c) => c.isPrimary) || contacts[0];
      if (primary) {
        setPrimaryContactId(primary.id || null);
        setEmergencyName(primary.name || '');
        setEmergencyRelationship(primary.relationship || '');
        setEmergencyPhone(primary.phone || '');
      } else if (profile.emergencyContact) {
        setPrimaryContactId(profile.emergencyContact.id || null);
        setEmergencyName(profile.emergencyContact.name || '');
        setEmergencyRelationship(profile.emergencyContact.relationship || '');
        setEmergencyPhone(profile.emergencyContact.phone || '');
      } else {
        setPrimaryContactId(null);
        setEmergencyName('');
        setEmergencyRelationship('');
        setEmergencyPhone('');
      }
    } catch (err: any) {
      console.error('Failed to load profile or contacts:', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);
    setSaveSuccess(false);

    // Profile field validation
    if (!name.trim()) {
      setErrorMessage('Name is required');
      return;
    }

    let cleanUserPhone = phone.replace(/[\s\-\(\)\+]/g, '').trim();
    if (cleanUserPhone.length === 12 && cleanUserPhone.startsWith('91')) {
      cleanUserPhone = cleanUserPhone.substring(2);
    }
    if (cleanUserPhone && cleanUserPhone.length !== 10) {
      setErrorMessage('Phone number must be exactly 10 digits');
      return;
    }

    // Emergency contact validation rule:
    // If all three fields are empty, skip contact API call and save profile without error.
    // If ANY contact field is filled, require name and 10-digit phone.
    const hasAnyEmergencyField = !!(emergencyName.trim() || emergencyRelationship.trim() || emergencyPhone.trim());
    let cleanEmPhone = '';

    if (hasAnyEmergencyField) {
      if (!emergencyName.trim()) {
        setErrorMessage('Emergency contact name is required when specifying an emergency contact');
        return;
      }

      cleanEmPhone = emergencyPhone.replace(/[\s\-\(\)\+]/g, '').trim();
      // Handle optional leading 91
      if (cleanEmPhone.length === 12 && cleanEmPhone.startsWith('91')) {
        cleanEmPhone = cleanEmPhone.substring(2);
      }
      if (!cleanEmPhone || cleanEmPhone.length !== 10) {
        setErrorMessage('Emergency contact phone must be exactly 10 digits');
        return;
      }

      if (emergencyRelationship.trim().length > 30) {
        setErrorMessage('Relationship must not exceed 30 characters');
        return;
      }
    }

    try {
      setIsSubmitting(true);

      const emContactObj = hasAnyEmergencyField ? {
        id: primaryContactId || undefined,
        name: emergencyName.trim(),
        relationship: emergencyRelationship.trim() || undefined,
        phone: cleanEmPhone,
        isPrimary: true,
      } : undefined;

      // 1. Save Patient Profile
      await patientService.updateMyProfile({
        name: name.trim(),
        dateOfBirth: dateOfBirth || undefined,
        gender: gender || undefined,
        bloodGroup: bloodGroup || undefined,
        phone: cleanUserPhone || undefined,
        abhaId: abhaId.trim() || undefined,
        emergencyContact: emContactObj,
      });

      // 2. Sync Dedicated Emergency Contact Endpoint
      if (hasAnyEmergencyField) {
        const contactPayload = {
          name: emergencyName.trim(),
          relationship: emergencyRelationship.trim() || undefined,
          phone: cleanEmPhone,
          isPrimary: true,
        };

        if (primaryContactId) {
          await emergencyContactService.updateContact(primaryContactId, contactPayload);
        } else {
          const created = await emergencyContactService.createContact(contactPayload);
          setPrimaryContactId(created.id || null);
        }
      } else if (primaryContactId) {
        // Contact was cleared by user - delete from database
        try {
          await emergencyContactService.deleteContact(primaryContactId);
          setPrimaryContactId(null);
        } catch (delErr) {
          console.warn('Could not delete cleared contact', delErr);
        }
      }

      setSaveSuccess(true);
      await refreshPatient(); // sync profile complete & state across dashboard
      await loadData(); // reload fresh values from backend to show stored data
      setTimeout(() => setSaveSuccess(false), 3000);
    } catch (err: any) {
      console.error('Failed to save profile or contact:', err);
      const backendErr = err.response?.data?.error || err.message || 'Failed to update profile. Please check inputs.';
      setErrorMessage(backendErr);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 dark:text-white flex items-center gap-2">
          <Settings className="h-7 w-7 text-teal-600 dark:text-teal-400" />
          Settings & Profile Architecture
        </h1>
        <p className="text-sm text-slate-500 dark:text-slate-400">
          Manage your personal clinical profile, emergency contacts, and vault security
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column: Profile & Emergency Form */}
        <div className="lg:col-span-2 space-y-6">
          <form onSubmit={handleSave} className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm dark:border-slate-800 dark:bg-slate-900 space-y-4">
            <h2 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
              <ShieldCheck className="h-5 w-5 text-teal-600" />
              Patient Health Profile
            </h2>

            {/* Error Message Alert */}
            {errorMessage && (
              <div className="flex items-center gap-2 rounded-xl border border-rose-200 bg-rose-50 p-3 text-xs font-semibold text-rose-700 dark:border-rose-900/40 dark:bg-rose-950/30 dark:text-rose-300">
                <AlertCircle className="h-4 w-4 shrink-0" />
                <span>{errorMessage}</span>
              </div>
            )}

            {/* Success Alert */}
            {saveSuccess && (
              <div className="flex items-center gap-2 rounded-xl border border-emerald-200 bg-emerald-50 p-3 text-xs font-semibold text-emerald-700 dark:border-emerald-900/40 dark:bg-emerald-950/30 dark:text-emerald-300">
                <Check className="h-4 w-4 shrink-0" />
                <span>Profile saved and updated successfully!</span>
              </div>
            )}

            {isLoading ? (
              <div className="py-12 text-center text-xs text-slate-400">
                Loading profile details...
              </div>
            ) : (
              <>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {/* Full Name */}
                  <div>
                    <label className="text-xs font-semibold text-slate-600 dark:text-slate-400">
                      Full Legal Name *
                    </label>
                    <input
                      type="text"
                      required
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      placeholder="e.g. Rajesh Sharma"
                      className="mt-1 w-full rounded-xl border border-slate-200 bg-slate-50 p-2.5 text-xs text-slate-900 dark:border-slate-700 dark:bg-slate-800 dark:text-white"
                    />
                  </div>

                  {/* Email Address (Read-only) */}
                  <div>
                    <label className="text-xs font-semibold text-slate-600 dark:text-slate-400">
                      Email Address (Account ID)
                    </label>
                    <input
                      type="email"
                      readOnly
                      value={email}
                      className="mt-1 w-full rounded-xl border border-slate-200 bg-slate-100 p-2.5 text-xs text-slate-500 dark:border-slate-700 dark:bg-slate-800/80 dark:text-slate-400 cursor-not-allowed"
                    />
                  </div>

                  {/* Date of Birth */}
                  <div>
                    <label className="text-xs font-semibold text-slate-600 dark:text-slate-400">
                      Date of Birth
                    </label>
                    <input
                      type="date"
                      value={dateOfBirth}
                      max={new Date().toISOString().split('T')[0]}
                      onChange={(e) => setDateOfBirth(e.target.value)}
                      className="mt-1 w-full rounded-xl border border-slate-200 bg-slate-50 p-2.5 text-xs text-slate-900 dark:border-slate-700 dark:bg-slate-800 dark:text-white"
                    />
                  </div>

                  {/* Gender */}
                  <div>
                    <label className="text-xs font-semibold text-slate-600 dark:text-slate-400">
                      Gender
                    </label>
                    <select
                      value={gender}
                      onChange={(e) => setGender(e.target.value)}
                      className="mt-1 w-full rounded-xl border border-slate-200 bg-slate-50 p-2.5 text-xs text-slate-900 dark:border-slate-700 dark:bg-slate-800 dark:text-white"
                    >
                      <option value="">Select Gender</option>
                      <option value="MALE">Male</option>
                      <option value="FEMALE">Female</option>
                      <option value="OTHER">Other</option>
                    </select>
                  </div>

                  {/* Blood Group */}
                  <div>
                    <label className="text-xs font-semibold text-slate-600 dark:text-slate-400">
                      Blood Group
                    </label>
                    <select
                      value={bloodGroup}
                      onChange={(e) => setBloodGroup(e.target.value as BloodGroup)}
                      className="mt-1 w-full rounded-xl border border-slate-200 bg-slate-50 p-2.5 text-xs text-slate-900 dark:border-slate-700 dark:bg-slate-800 dark:text-white"
                    >
                      <option value="">Select Blood Group</option>
                      <option value="A+">A+</option>
                      <option value="A-">A-</option>
                      <option value="B+">B+</option>
                      <option value="B-">B-</option>
                      <option value="AB+">AB+</option>
                      <option value="AB-">AB-</option>
                      <option value="O+">O+</option>
                      <option value="O-">O-</option>
                    </select>
                  </div>

                  {/* Phone Number */}
                  <div>
                    <label className="text-xs font-semibold text-slate-600 dark:text-slate-400">
                      Phone Number
                    </label>
                    <input
                      type="tel"
                      value={phone}
                      onChange={(e) => setPhone(e.target.value)}
                      placeholder="e.g. 98201 44521"
                      className="mt-1 w-full rounded-xl border border-slate-200 bg-slate-50 p-2.5 text-xs text-slate-900 dark:border-slate-700 dark:bg-slate-800 dark:text-white"
                    />
                    <p className="mt-1 text-[11px] text-slate-400 dark:text-slate-500">
                      10-digit mobile number
                    </p>
                  </div>

                  {/* ABHA Health ID */}
                  <div className="sm:col-span-2">
                    <label className="text-xs font-semibold text-slate-600 dark:text-slate-400">
                      ABHA Health ID (Ayushman Bharat Digital Health)
                    </label>
                    <input
                      type="text"
                      value={abhaId}
                      onChange={(e) => setAbhaId(e.target.value)}
                      placeholder="e.g. 91-4589-2044-1182"
                      className="mt-1 w-full rounded-xl border border-slate-200 bg-slate-50 p-2.5 text-xs font-mono text-slate-900 dark:border-slate-700 dark:bg-slate-800 dark:text-white"
                    />
                  </div>
                </div>

                {/* Emergency Contact Section */}
                <div className="pt-4 border-t border-slate-100 dark:border-slate-800">
                  <div className="flex items-center justify-between mb-2">
                    <h3 className="text-xs font-bold uppercase tracking-wider text-slate-500">
                      Primary Emergency Contact
                    </h3>
                    <span className="text-[10px] text-slate-400">
                      Optional — leave blank if none
                    </span>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                    <div>
                      <label className="text-[11px] text-slate-500">Contact Name</label>
                      <input
                        type="text"
                        value={emergencyName}
                        onChange={(e) => setEmergencyName(e.target.value)}
                        placeholder="e.g. Sunita Sharma"
                        className="mt-1 w-full rounded-xl border border-slate-200 bg-slate-50 p-2 text-xs text-slate-900 dark:border-slate-700 dark:bg-slate-800 dark:text-white"
                      />
                    </div>
                    <div>
                      <label className="text-[11px] text-slate-500">Relationship (max 30 chars)</label>
                      <input
                        type="text"
                        maxLength={30}
                        value={emergencyRelationship}
                        onChange={(e) => setEmergencyRelationship(e.target.value)}
                        placeholder="e.g. Spouse, Parent"
                        className="mt-1 w-full rounded-xl border border-slate-200 bg-slate-50 p-2 text-xs text-slate-900 dark:border-slate-700 dark:bg-slate-800 dark:text-white"
                      />
                    </div>
                    <div>
                      <label className="text-[11px] text-slate-500">Emergency Phone</label>
                      <input
                        type="tel"
                        value={emergencyPhone}
                        onChange={(e) => setEmergencyPhone(e.target.value)}
                        placeholder="e.g. 91315 52787"
                        className="mt-1 w-full rounded-xl border border-slate-200 bg-slate-50 p-2 text-xs text-slate-900 dark:border-slate-700 dark:bg-slate-800 dark:text-white"
                      />
                      <p className="mt-1 text-[11px] text-slate-400 dark:text-slate-500">
                        10-digit mobile number
                      </p>
                    </div>
                  </div>
                </div>

                {/* Save Button */}
                <div className="flex justify-end pt-3">
                  <button
                    type="submit"
                    disabled={isSubmitting}
                    className="flex items-center gap-1.5 rounded-xl bg-teal-600 px-6 py-2.5 text-xs font-bold text-white shadow-md hover:bg-teal-700 transition-all disabled:opacity-50"
                  >
                    {isSubmitting ? (
                      <span>Saving...</span>
                    ) : saveSuccess ? (
                      <>
                        <Check className="h-4 w-4" /> Profile Saved
                      </>
                    ) : (
                      <>
                        <Save className="h-4 w-4" /> Save profile
                      </>
                    )}
                  </button>
                </div>
              </>
            )}
          </form>

          {/* Spring Boot API Bridge Info */}
          <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm dark:border-slate-800 dark:bg-slate-900 space-y-4">
            <h2 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
              <Server className="h-5 w-5 text-indigo-600" />
              Spring Boot REST API Connector Configuration
            </h2>
            <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed">
              Profile updates and emergency contact operations communicate directly with your Spring Boot backend via <code>/api/patients/me</code> and <code>/api/patients/me/emergency-contacts</code> with Bearer JWT tokens attached.
            </p>

            <div className="rounded-xl bg-slate-900 p-4 font-mono text-xs text-slate-200 space-y-1">
              <div className="text-teal-400 font-semibold"># Environment Configuration (.env)</div>
              <div>VITE_USE_MOCK={USE_MOCK ? 'true' : 'false'}</div>
              <div>VITE_API_BASE_URL={API_BASE_URL}</div>
              <div className="text-slate-500 mt-2"># Active Emergency Contact Endpoints:</div>
              <div className="text-slate-400">GET    /api/patients/me/emergency-contacts</div>
              <div className="text-slate-400">POST   /api/patients/me/emergency-contacts</div>
              <div className="text-slate-400">PUT    /api/patients/me/emergency-contacts/{'{id}'}</div>
              <div className="text-slate-400">DELETE /api/patients/me/emergency-contacts/{'{id}'}</div>
            </div>
          </div>
        </div>

        {/* Right Column: Security & Encryption */}
        <div className="space-y-6">
          <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm dark:border-slate-800 dark:bg-slate-900 space-y-4">
            <h2 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
              <Key className="h-5 w-5 text-amber-500" />
              Cryptographic Keys
            </h2>
            <p className="text-xs text-slate-500">
              Zero-knowledge client-derived encryption key status
            </p>

            <div className="rounded-xl border border-teal-100 bg-teal-50/50 p-4 dark:border-teal-900/40 dark:bg-teal-950/20 space-y-2">
              <div className="flex items-center justify-between text-xs">
                <span className="font-bold text-teal-800 dark:text-teal-300">Vault Cipher:</span>
                <span className="font-mono text-[11px] text-teal-700 dark:text-teal-400">AES-GCM 256</span>
              </div>
              <div className="flex items-center justify-between text-xs">
                <span className="font-bold text-teal-800 dark:text-teal-300">Key Derivation:</span>
                <span className="font-mono text-[11px] text-teal-700 dark:text-teal-400">PBKDF2 (SHA-256)</span>
              </div>
              <div className="flex items-center justify-between text-xs">
                <span className="font-bold text-teal-800 dark:text-teal-300">ABHA Consent Manager:</span>
                <span className="font-semibold text-emerald-600 dark:text-emerald-400">Approved & Active</span>
              </div>
            </div>

            <button
              onClick={() => alert('Simulated key backup downloaded: vault-master-key-backup.json')}
              className="w-full rounded-xl border border-slate-200 bg-slate-50 py-2.5 text-xs font-bold text-slate-700 hover:bg-slate-100 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-300"
            >
              Backup Encrypted Vault Keys
            </button>
          </div>

          <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm dark:border-slate-800 dark:bg-slate-900 space-y-4">
            <h2 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
              <Smartphone className="h-5 w-5 text-teal-600" />
              Theme & Appearance
            </h2>
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs font-bold text-slate-800 dark:text-slate-200">Dark Mode</p>
                <p className="text-[11px] text-slate-500">Toggle dark medical theme</p>
              </div>
              <button
                onClick={toggleTheme}
                className="rounded-xl border border-slate-200 bg-slate-50 px-3 py-1.5 text-xs font-bold text-slate-700 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-300"
              >
                {theme === 'dark' ? 'Dark Active' : 'Light Active'}
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* My Allergies & My Conditions */}
      <AllergiesConditionsSection />
    </div>
  );
};
