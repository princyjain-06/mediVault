import React from 'react';
import { NavLink } from 'react-router-dom';
import { 
  LayoutDashboard, 
  Stethoscope, 
  History, 
  FolderLock, 
  Calendar, 
  Users, 
  Settings, 
  ShieldCheck, 
  Sparkles,
  ExternalLink,
  X
} from 'lucide-react';
import { cn } from '../../lib/utils';

interface SidebarProps {
  isOpen: boolean;
  onClose: () => void;
}

export const Sidebar: React.FC<SidebarProps> = ({ isOpen, onClose }) => {
  const navItems = [
    {
      label: 'Dashboard',
      to: '/dashboard',
      icon: LayoutDashboard,
      badge: null,
    },
    {
      label: 'AI Symptom Checker',
      to: '/symptom-checker',
      icon: Stethoscope,
      badge: 'AI Core',
      highlight: true,
    },
    {
      label: 'Symptom History',
      to: '/symptom-history',
      icon: History,
      badge: null,
    },
    {
      label: 'Records Vault',
      to: '/records',
      icon: FolderLock,
      badge: null,
    },
    {
      label: 'Appointments',
      to: '/appointments',
      icon: Calendar,
      badge: '3',
    },
    {
      label: 'Family Vault',
      to: '/family',
      icon: Users,
      badge: null,
    },
    {
      label: 'Settings & Security',
      to: '/settings',
      icon: Settings,
      badge: null,
    },
  ];

  return (
    <>
      {/* Mobile backdrop */}
      {isOpen && (
        <div 
          onClick={onClose}
          className="fixed inset-0 z-40 bg-slate-900/50 backdrop-blur-sm md:hidden"
        />
      )}

      <aside
        className={cn(
          "fixed top-0 bottom-0 left-0 z-50 flex w-64 flex-col border-r border-slate-200 bg-white transition-transform duration-300 ease-in-out dark:border-slate-800 dark:bg-slate-900 md:static md:translate-x-0",
          isOpen ? "translate-x-0" : "-translate-x-full"
        )}
      >
        {/* Mobile Header */}
        <div className="flex h-16 items-center justify-between px-6 border-b border-slate-100 dark:border-slate-800 md:hidden">
          <div className="flex items-center gap-2">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-teal-600 text-white">
              <ShieldCheck className="h-4 w-4" />
            </div>
            <span className="font-bold text-slate-900 dark:text-white">MediVault</span>
          </div>
          <button
            onClick={onClose}
            className="rounded-lg p-1.5 text-slate-500 hover:bg-slate-100 dark:text-slate-400 dark:hover:bg-slate-800"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Navigation list */}
        <div className="flex-1 overflow-y-auto px-4 py-6">
          <div className="mb-2 px-3 text-xs font-semibold uppercase tracking-wider text-slate-400 dark:text-slate-500">
            Health Management
          </div>
          <nav className="space-y-1.5">
            {navItems.map((item) => {
              const Icon = item.icon;
              return (
                <NavLink
                  key={item.to}
                  to={item.to}
                  onClick={() => onClose()}
                  className={({ isActive }) =>
                    cn(
                      "group flex items-center justify-between rounded-xl px-3.5 py-2.5 text-sm font-medium transition-all",
                      isActive
                        ? "bg-teal-50 text-teal-700 shadow-sm dark:bg-teal-950/60 dark:text-teal-300 font-semibold"
                        : "text-slate-600 hover:bg-slate-100 hover:text-slate-900 dark:text-slate-400 dark:hover:bg-slate-800/80 dark:hover:text-slate-200",
                      item.highlight && !isActive && "text-teal-700 dark:text-teal-400 font-semibold bg-teal-50/40 dark:bg-teal-950/30"
                    )
                  }
                >
                  <div className="flex items-center gap-3">
                    <Icon className="h-4 w-4 shrink-0 transition-transform group-hover:scale-110" />
                    <span>{item.label}</span>
                  </div>
                  {item.badge && (
                    <span className={cn(
                      "rounded-full px-2 py-0.5 text-[11px] font-semibold",
                      item.highlight 
                        ? "bg-teal-600 text-white flex items-center gap-1 shadow-sm"
                        : "bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-300"
                    )}>
                      {item.highlight && <Sparkles className="h-2.5 w-2.5" />}
                      {item.badge}
                    </span>
                  )}
                </NavLink>
              );
            })}
          </nav>
        </div>

        {/* Security & Vault Badge Footer */}
        <div className="p-4 border-t border-slate-100 dark:border-slate-800">
          <div className="rounded-xl border border-teal-100 bg-teal-50/60 p-3.5 dark:border-teal-900/40 dark:bg-teal-950/20">
            <div className="flex items-center gap-2 text-teal-800 dark:text-teal-300 font-semibold text-xs">
              <ShieldCheck className="h-4 w-4 text-teal-600 dark:text-teal-400" />
              <span>Zero-Knowledge Vault</span>
            </div>
            <p className="mt-1 text-[11px] text-slate-600 dark:text-slate-400 leading-relaxed">
              256-bit AES client encrypted. Linked with Ayushman Bharat (ABHA).
            </p>
            <a
              href="https://abdm.gov.in"
              target="_blank"
              rel="noreferrer"
              className="mt-2 inline-flex items-center gap-1 text-[11px] font-medium text-teal-700 hover:text-teal-800 dark:text-teal-400"
            >
              Verify ABHA Protocol <ExternalLink className="h-3 w-3" />
            </a>
          </div>
        </div>
      </aside>
    </>
  );
};
