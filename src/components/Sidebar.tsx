import React from 'react';
import { useTransit } from '../context/TransitContext';
import {
  LayoutDashboard, Truck, Users, MapPin, Wrench, Fuel, BarChart3, Settings, Lock, ShieldCheck, LogOut, X
} from 'lucide-react';

interface SidebarProps {
  activeTab: string;
  onSelectTab: (tab: string) => void;
  onLogout: () => void;
  isOpen: boolean;
  onClose: () => void;
}

export const Sidebar: React.FC<SidebarProps> = ({ activeTab, onSelectTab, onLogout, isOpen, onClose }) => {
  const { currentUser, rbacMatrix } = useTransit();
  const currentRole = currentUser?.role || 'Fleet Manager';
  const rolePermissions = rbacMatrix[currentRole] || {};

  const navItems = [
    { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { id: 'fleet', label: 'Fleet Registry', icon: Truck },
    { id: 'drivers', label: 'Drivers & Safety', icon: Users },
    { id: 'trips', label: 'Trip Dispatcher', icon: MapPin },
    { id: 'maintenance', label: 'Maintenance', icon: Wrench },
    { id: 'fuel', label: 'Fuel & Expenses', icon: Fuel },
    { id: 'analytics', label: 'Reports & Insights', icon: BarChart3 },
    { id: 'settings', label: 'Settings & RBAC', icon: Settings },
  ];

  return (
    <aside className={`fixed inset-y-0 left-0 w-64 bg-[#0b0f17] border-r border-[#222a3d] flex flex-col justify-between shrink-0 select-none z-40 transform transition-transform duration-300 ease-in-out lg:relative lg:translate-x-0 ${
      isOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'
    }`}>
      <div>
        {/* Brand Header */}
        <div className="p-5 border-b border-[#222a3d] flex items-center justify-between">
          <div className="flex items-center gap-3.5">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-orange-600 to-orange-400 flex items-center justify-center text-white shrink-0 shadow-md shadow-orange-500/20">
              <Truck className="w-5 h-5 stroke-[2.5]" />
            </div>
            <div className="overflow-hidden">
              <div className="flex items-center gap-1.5">
                <h1 className="font-bold text-base text-white tracking-tight leading-none">TransitOps</h1>
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" title="System Live"></span>
              </div>
              <p className="text-[11px] text-slate-400 font-medium mt-1">Smart Transport Hub</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="lg:hidden p-1.5 text-slate-400 hover:text-white rounded-lg hover:bg-[#131824] transition-colors"
            title="Close Menu"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Navigation List */}
        <nav className="p-4 space-y-1">
          <div className="px-3 py-2 text-[10px] font-bold uppercase text-slate-500 tracking-wider">
            Operations Menu
          </div>
          {navItems.map((item) => {
            const Icon = item.icon;
            const hasViewPerm = rolePermissions[item.id]?.view ?? true;
            const isActive = activeTab === item.id;

            return (
              <button
                key={item.id}
                onClick={() => {
                  if (!hasViewPerm) {
                    alert(`RBAC Security Alert: Role '${currentRole}' does not have View permissions for ${item.label}. Switch role to Fleet Manager or check Settings & RBAC.`);
                    return;
                  }
                  onSelectTab(item.id);
                }}
                className={`w-full flex items-center justify-between px-3.5 py-2.5 rounded-lg text-xs font-medium transition-colors ${
                  isActive
                    ? 'bg-[#1a2130] text-orange-400 font-semibold'
                    : hasViewPerm
                    ? 'text-slate-300 hover:bg-[#131824] hover:text-white'
                    : 'text-slate-600 cursor-not-allowed opacity-60'
                }`}
              >
                <div className="flex items-center gap-3">
                  <Icon className={`w-4 h-4 ${isActive ? 'text-orange-400' : hasViewPerm ? 'text-slate-400' : 'text-slate-600'}`} />
                  <span>{item.label}</span>
                </div>
                {!hasViewPerm && <Lock className="w-3.5 h-3.5 text-red-400/80 shrink-0" />}
              </button>
            );
          })}
        </nav>
      </div>

      {/* Footer Role Info Card */}
      <div className="p-4 border-t border-[#222a3d] bg-[#131824]/50">
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center gap-1.5 text-[11px] font-semibold text-slate-300">
            <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
            <span>RBAC Active</span>
          </div>
          <span className="text-[10px] bg-orange-500/15 text-orange-400 px-2 py-0.5 rounded font-mono font-medium">
            8 Hrs Hack
          </span>
        </div>
        <p className="text-[11px] text-slate-400 leading-relaxed">
          Enforcing rules for <span className="text-white font-medium">{currentRole}</span>.
        </p>
        <button
          onClick={onLogout}
          className="mt-3.5 w-full py-2 rounded-lg bg-red-500/10 hover:bg-red-500/20 text-red-400 text-xs font-medium border border-red-500/20 transition-colors flex items-center justify-center gap-2"
        >
          <LogOut className="w-3.5 h-3.5" />
          <span>Sign Out</span>
        </button>
      </div>
    </aside>
  );
};
