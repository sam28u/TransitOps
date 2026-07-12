import React from 'react';
import { useTransit } from '../context/TransitContext';
import type { Role } from '../types';
import { Search, RefreshCw, Radio, Sparkles, Menu } from 'lucide-react';

export const Navbar: React.FC<{ activeTab?: string; onSelectTab?: (t: string) => void; onToggleSidebar: () => void }> = ({ onToggleSidebar }) => {
  const { currentUser, setCurrentUser, resetToDemoState } = useTransit();

  const roles: Role[] = ['Fleet Manager', 'Driver', 'Safety Officer', 'Financial Analyst'];

  const handleRoleSwitch = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const newRole = e.target.value as Role;
    if (currentUser) {
      setCurrentUser({
        ...currentUser,
        role: newRole,
        name: `${currentUser.name.split(' (')[0]} (${newRole})`
      });
    }
  };

  return (
    <header className="h-16 bg-[#131824] border-b border-[#222a3d] px-4 sm:px-6 flex items-center justify-between shrink-0 z-20">
      <div className="flex items-center gap-3">
        <button
          onClick={onToggleSidebar}
          className="lg:hidden p-2 text-slate-400 hover:text-white rounded-lg hover:bg-[#1a2130] transition-colors"
          title="Open Menu"
        >
          <Menu className="w-5 h-5" />
        </button>

        {/* Status Indicator */}
        <div className="flex items-center gap-2">
          <Radio className="w-3.5 h-3.5 text-emerald-400" />
          <span className="text-xs font-semibold text-slate-300 hidden sm:inline">
            System Live <span className="text-slate-600 mx-1.5">•</span> <span className="text-emerald-400">All Modules Synced</span>
          </span>
        </div>

        {/* Quick search input */}
        <div className="relative w-72 hidden md:block">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          <input
            type="text"
            placeholder="Quick search (⌘K)..."
            className="input !pl-10 !py-1.5 !text-xs !bg-[#0b0f17] !border-[#222a3d]"
          />
        </div>
      </div>

      <div className="flex items-center gap-4">
        {/* Persona Switcher */}
        <div className="flex items-center gap-2.5 bg-[#1a2130] px-3.5 py-1.5 rounded-lg border border-[#222a3d]">
          <Sparkles className="w-3.5 h-3.5 text-orange-400" />
          <span className="text-xs font-semibold text-slate-400 hidden sm:inline">
            Persona:
          </span>
          <select
            value={currentUser?.role || 'Fleet Manager'}
            onChange={handleRoleSwitch}
            className="bg-transparent text-xs font-bold text-orange-400 outline-none cursor-pointer pr-2 font-mono"
            title="Instant RBAC Role Switcher"
          >
            {roles.map((r) => (
              <option key={r} value={r} className="bg-[#131824] text-white py-1 font-sans">
                {r}
              </option>
            ))}
          </select>
        </div>

        <button
          onClick={resetToDemoState}
          title="Reset to Demo State"
          className="p-2 rounded-lg bg-[#1a2130] hover:bg-[#232b3e] text-slate-300 hover:text-white border border-[#222a3d] transition-colors"
        >
          <RefreshCw className="w-4 h-4" />
        </button>

        {/* User Profile Pill */}
        <div className="flex items-center gap-3 pl-4 border-l border-[#222a3d]">
          <div className="w-8 h-8 rounded-full bg-orange-500 flex items-center justify-center text-white font-bold text-xs">
            {currentUser?.name.charAt(0) || 'U'}
          </div>
          <div className="hidden lg:block text-left">
            <div className="text-xs font-bold text-white leading-tight">{currentUser?.name || 'Admin User'}</div>
            <div className="text-[11px] font-mono text-orange-400 mt-0.5">{currentUser?.role || 'Role'}</div>
          </div>
        </div>
      </div>
    </header>
  );
};
