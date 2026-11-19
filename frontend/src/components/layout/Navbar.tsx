import React from 'react';
import { Link } from 'react-router-dom';
import { 
  ShieldCheck, 
  Moon, 
  Sun, 
  Bell, 
  Menu, 
  UserCheck, 
  CheckCircle2
} from 'lucide-react';
import { useTheme } from '../../context/ThemeContext';
import { usePatient } from '../../context/PatientContext';

interface NavbarProps {
  onToggleSidebar: () => void;
}

export const Navbar: React.FC<NavbarProps> = ({ onToggleSidebar }) => {
  const { theme, toggleTheme } = useTheme();
  const { activePatient, allPatients, setActivePatientId } = usePatient();

  return (
    <header className="sticky top-0 z-30 flex h-16 w-full items-center justify-between border-b border-slate-200 bg-white/95 px-4 backdrop-blur dark:border-slate-800 dark:bg-slate-900/95 sm:px-6">
      <div className="flex items-center gap-3">
        <button
          onClick={onToggleSidebar}
          className="rounded-lg p-2 text-slate-600 hover:bg-slate-100 hover:text-slate-900 focus:outline-none dark:text-slate-300 dark:hover:bg-slate-800 dark:hover:text-white md:hidden"
          aria-label="Toggle navigation menu"
        >
          <Menu className="h-5 w-5" />
        </button>

        {/* Brand */}
        <Link to="/dashboard" className="flex items-center gap-2 hover:opacity-90 transition-opacity">
          <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-teal-600 text-white shadow-md shadow-teal-600/20 dark:bg-teal-500">
            <ShieldCheck className="h-5 w-5" />
          </div>
          <span className="text-xl font-bold tracking-tight text-slate-900 dark:text-white">
            Medi<span className="text-teal-600 dark:text-teal-400">Vault</span>
          </span>
          <span className="hidden rounded-full bg-teal-50 px-2.5 py-0.5 text-xs font-medium text-teal-700 ring-1 ring-inset ring-teal-600/20 dark:bg-teal-950/50 dark:text-teal-300 sm:inline-flex items-center gap-1">
            <CheckCircle2 className="h-3 w-3 text-teal-600 dark:text-teal-400" /> ABHA Sync
          </span>
        </Link>
      </div>

      {/* Patient Switcher & Actions */}
      <div className="flex items-center gap-3 sm:gap-4">
        {/* Active Patient Switcher */}
        <div className="flex items-center gap-2 rounded-xl border border-slate-200 bg-slate-50 p-1.5 dark:border-slate-700 dark:bg-slate-800/80">
          <UserCheck className="h-4 w-4 text-teal-600 dark:text-teal-400 hidden sm:block ml-1" />
          <span className="text-xs font-medium text-slate-500 dark:text-slate-400 hidden md:inline">
            Active Profile:
          </span>
          <select
            value={activePatient?.id || ''}
            onChange={(e) => setActivePatientId(e.target.value)}
            className="rounded-lg border-0 bg-transparent py-1 pl-1 pr-6 text-xs sm:text-sm font-semibold text-slate-900 focus:ring-0 dark:text-white cursor-pointer"
          >
            {allPatients.map((p) => (
              <option key={p.id} value={p.id} className="dark:bg-slate-900 dark:text-white">
                {p.name} ({p.age}y, {p.gender[0]}) • {p.bloodGroup}
              </option>
            ))}
          </select>
        </div>

        {/* Theme Toggle */}
        <button
          onClick={toggleTheme}
          className="rounded-xl border border-slate-200 p-2 text-slate-600 hover:bg-slate-100 hover:text-slate-900 dark:border-slate-700 dark:text-slate-300 dark:hover:bg-slate-800 dark:hover:text-white transition-colors"
          title={`Switch to ${theme === 'light' ? 'Dark' : 'Light'} Mode`}
        >
          {theme === 'light' ? <Moon className="h-4 w-4" /> : <Sun className="h-4 w-4" />}
        </button>

        {/* Notifications */}
        <button 
          className="relative rounded-xl border border-slate-200 p-2 text-slate-600 hover:bg-slate-100 hover:text-slate-900 dark:border-slate-700 dark:text-slate-300 dark:hover:bg-slate-800 dark:hover:text-white transition-colors"
          title="Notifications"
        >
          <Bell className="h-4 w-4" />
          <span className="absolute -top-1 -right-1 flex h-4 w-4 items-center justify-center rounded-full bg-teal-600 text-[10px] font-bold text-white">
            2
          </span>
        </button>

        {/* Avatar */}
        {activePatient && (
          <div className="flex items-center gap-2 pl-1">
            <img
              src={activePatient.avatar}
              alt={activePatient.name}
              className="h-8 w-8 rounded-full object-cover ring-2 ring-teal-500/30"
            />
            <div className="hidden lg:block text-left text-xs leading-tight">
              <p className="font-semibold text-slate-900 dark:text-white truncate max-w-[120px]">
                {activePatient.name}
              </p>
              <p className="text-[11px] text-slate-500 dark:text-slate-400">
                ABHA {activePatient.bloodGroup}
              </p>
            </div>
          </div>
        )}
      </div>
    </header>
  );
};
