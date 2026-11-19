import React, { createContext, useContext, useState, useEffect } from 'react';
import { Patient } from '../types';
import { patientService } from '../api/patientService';
import { useAuth } from './AuthContext';

interface PatientContextType {
  activePatient: Patient | null;
  allPatients: Patient[];
  setActivePatientId: (id: string) => void;
  isLoading: boolean;
  refreshPatient: () => Promise<void>;
  isProfileComplete: boolean;
}

const PatientContext = createContext<PatientContextType | undefined>(undefined);

export const PatientProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { user } = useAuth();
  const [allPatients, setAllPatients] = useState<Patient[]>([]);
  const [activePatientId, setActivePatientIdState] = useState<string>(() => {
    return localStorage.getItem('mediVault_active_patient_id') || 'pat-001';
  });
  const [isLoading, setIsLoading] = useState<boolean>(true);

  const [isProfileComplete, setIsProfileComplete] = useState<boolean>(true);

  const loadPatients = async () => {
    try {
      setIsLoading(true);
      const list = await patientService.getPatients();
      setAllPatients(list);

      // Check current user's profile completeness via /api/patients/me if authenticated
      if (user) {
        try {
          const profile = await patientService.getMyProfile();
          setIsProfileComplete(profile.profileComplete);
        } catch {
          // If profile fetch fails or in mock, fallback based on active patient fields
        }

        const match = list.find(
          (p) =>
            p.email?.toLowerCase() === user.email?.toLowerCase() ||
            p.name?.toLowerCase() === user.name?.toLowerCase()
        );
        if (match) {
          setActivePatientIdState(match.id);
          localStorage.setItem('mediVault_active_patient_id', match.id);
        }
      }
    } catch (err) {
      console.error('Failed to load patients', err);
    } finally {
      setIsLoading(false);
    }
  };

  // Re-fetch patients whenever auth user changes (e.g. signup or login)
  useEffect(() => {
    loadPatients();
  }, [user?.id, user?.email]);

  // When user signs in or patients load, match patient profile to current authenticated user
  useEffect(() => {
    if (user && allPatients.length > 0) {
      const match = allPatients.find(
        (p) =>
          p.email?.toLowerCase() === user.email?.toLowerCase() ||
          p.name?.toLowerCase() === user.name?.toLowerCase()
      );
      if (match) {
        setActivePatientIdState(match.id);
        localStorage.setItem('mediVault_active_patient_id', match.id);
      }
    }
  }, [user, allPatients]);

  const setActivePatientId = (id: string) => {
    setActivePatientIdState(id);
    localStorage.setItem('mediVault_active_patient_id', id);
  };

  const activePatient = React.useMemo(() => {
    if (user) {
      const userMatch = allPatients.find(
        (p) =>
          p.id === activePatientId ||
          p.email?.toLowerCase() === user.email?.toLowerCase() ||
          p.name?.toLowerCase() === user.name?.toLowerCase()
      );
      if (userMatch) return userMatch;

      // If user is logged in but hasn't arrived in allPatients yet, provide a fallback user profile
      return {
        id: user.id || 'pat-user',
        name: user.name || 'User',
        age: 28,
        gender: 'Other' as const,
        bloodGroup: 'O+' as const,
        abhaId: '91-0000-0000-0000',
        avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80',
        email: user.email,
        phone: '',
        emergencyContact: { name: '', relationship: '', phone: '' },
        chronicConditions: [],
        allergies: [],
        currentMedications: [],
        vitalsHistory: [],
        recentRecords: [],
      };
    }
    return allPatients.find((p) => p.id === activePatientId) || allPatients[0] || null;
  }, [allPatients, activePatientId, user]);

  const refreshPatient = async () => {
    await loadPatients();
  };

  return (
    <PatientContext.Provider
      value={{
        activePatient,
        allPatients,
        setActivePatientId,
        isLoading,
        refreshPatient,
        isProfileComplete,
      }}
    >
      {children}
    </PatientContext.Provider>
  );
};

export function usePatient() {
  const context = useContext(PatientContext);
  if (!context) {
    throw new Error('usePatient must be used within a PatientProvider');
  }
  return context;
}
