import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { ThemeProvider } from './context/ThemeContext';
import { PatientProvider } from './context/PatientContext';
import { AuthProvider, useAuth } from './context/AuthContext';
import { AppLayout } from './components/layout/AppLayout';

// Features
import { DashboardPage } from './features/dashboard/DashboardPage';
import { SymptomCheckerPage } from './features/symptom-checker/SymptomCheckerPage';
import { SymptomHistoryPage } from './features/symptom-history/SymptomHistoryPage';
import { RecordsPage } from './features/records/RecordsPage';
import { AppointmentsPage } from './features/appointments/AppointmentsPage';
import { FamilyPage } from './features/family/FamilyPage';
import { SettingsPage } from './features/settings/SettingsPage';
import { AuthPage } from './features/auth/AuthPage';
import { LandingPage } from './features/landing/LandingPage';
import { NotFoundPage } from './features/landing/NotFoundPage';

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      refetchOnWindowFocus: false,
      staleTime: 1000 * 60 * 5,
    },
  },
});

/** Protects private app pages from unauthenticated visits */
function RequireAuth({ children }: { children: React.ReactNode }) {
  const { isAuthenticated } = useAuth();
  return isAuthenticated ? <>{children}</> : <Navigate to="/login" replace />;
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <ThemeProvider>
        <AuthProvider>
          <PatientProvider>
            <BrowserRouter>
              <Routes>
                {/* 
                  PART 2: Root "/" ALWAYS displays the LandingPage.
                  Never auto-redirects. Shows "Open app" if already authenticated.
                */}
                <Route path="/" element={<LandingPage />} />
                <Route path="/landing" element={<Navigate to="/" replace />} />

                {/* Explicit Auth Routes */}
                <Route path="/login" element={<AuthPage defaultMode="signin" />} />
                <Route path="/signup" element={<AuthPage defaultMode="signup" />} />
                <Route path="/auth/login" element={<Navigate to="/login" replace />} />

                {/* Main Application Routes (Protected) */}
                <Route
                  element={
                    <RequireAuth>
                      <AppLayout />
                    </RequireAuth>
                  }
                >
                  <Route path="/dashboard" element={<DashboardPage />} />
                  <Route path="/app" element={<Navigate to="/dashboard" replace />} />
                  <Route path="/symptom-checker" element={<SymptomCheckerPage />} />
                  <Route path="/symptom-history" element={<SymptomHistoryPage />} />
                  <Route path="/records" element={<RecordsPage />} />
                  <Route path="/appointments" element={<AppointmentsPage />} />
                  <Route path="/family" element={<FamilyPage />} />
                  <Route path="/settings" element={<SettingsPage />} />
                </Route>

                {/* Catch-all 404 for unknown addresses with link back to "/" */}
                <Route path="*" element={<NotFoundPage />} />
              </Routes>
            </BrowserRouter>
          </PatientProvider>
        </AuthProvider>
      </ThemeProvider>
    </QueryClientProvider>
  );
}

export default App;
