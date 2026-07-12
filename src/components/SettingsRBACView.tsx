import React, { useState } from 'react';
import { useTransit } from '../context/TransitContext';
import type { Role } from '../types';
import { ShieldCheck, Save, RefreshCw, Settings as SettingsIcon } from 'lucide-react';

export const SettingsRBACView: React.FC = () => {
  const { rbacMatrix, updateRBAC, resetToDemoState } = useTransit();

  const [sysName, setSysName] = useState('TransitOps Transport Operations Hub');
  const [currency, setCurrency] = useState('USD ($)');
  const [distanceUnit, setDistanceUnit] = useState('Kilometers (km)');
  const [savedMessage, setSavedMessage] = useState(false);

  const roles: Role[] = ['Fleet Manager', 'Driver', 'Safety Officer', 'Financial Analyst'];
  const modules = [
    { id: 'dashboard', label: 'Dashboard & KPIs' },
    { id: 'fleet', label: 'Vehicle Registry (CRUD)' },
    { id: 'drivers', label: 'Driver Management (CRUD)' },
    { id: 'trips', label: 'Trip Dispatcher & Validation' },
    { id: 'maintenance', label: 'Maintenance Workflows' },
    { id: 'fuel', label: 'Fuel & Expense Logging' },
    { id: 'analytics', label: 'Reports, ROI & Exports' },
    { id: 'settings', label: 'Settings & Security RBAC' },
  ];

  const handleSaveGeneral = (e: React.FormEvent) => {
    e.preventDefault();
    setSavedMessage(true);
    setTimeout(() => setSavedMessage(false), 3000);
  };

  return (
    <div className="space-y-6">
      {/* Top Header matching Screenshot 8 */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-white tracking-tight">Settings & RBAC Management</h2>
          <p className="text-xs text-gray-400 mt-0.5">Role-Based Access Control matrix and system-wide operational preferences</p>
        </div>

        <button
          onClick={resetToDemoState}
          className="btn btn-secondary !py-2 !px-4 text-xs font-bold text-amber-400 border-amber-500/30 hover:bg-amber-500/10 flex items-center gap-2"
        >
          <RefreshCw className="w-4 h-4" />
          <span>Reset All Demo Data & RBAC</span>
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Panel: General Settings matching Screenshot 8 */}
        <div className="lg:col-span-4 space-y-6">
          <div className="card space-y-4">
            <div className="border-b border-[#30363d] pb-3">
              <h3 className="font-bold text-base text-white flex items-center gap-2">
                <SettingsIcon className="w-4 h-4 text-orange-400" />
                <span>General Settings</span>
              </h3>
              <p className="text-xs text-gray-400">Core application environment parameters</p>
            </div>

            <form onSubmit={handleSaveGeneral} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-gray-300 mb-1.5">System Name</label>
                <input
                  type="text"
                  value={sysName}
                  onChange={(e) => setSysName(e.target.value)}
                  className="input"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-300 mb-1.5">Currency Format</label>
                <select
                  value={currency}
                  onChange={(e) => setCurrency(e.target.value)}
                  className="select"
                >
                  <option value="USD ($)">USD ($ - US Dollar)</option>
                  <option value="EUR (€)">EUR (€ - Euro)</option>
                  <option value="GBP (£)">GBP (£ - British Pound)</option>
                  <option value="INR (₹)">INR (₹ - Indian Rupee)</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-300 mb-1.5">Distance & Weight Unit</label>
                <select
                  value={distanceUnit}
                  onChange={(e) => setDistanceUnit(e.target.value)}
                  className="select"
                >
                  <option value="Kilometers (km)">Metric: Kilometers (km) & Kilograms (kg)</option>
                  <option value="Miles (mi)">Imperial: Miles (mi) & Pounds (lb)</option>
                </select>
              </div>

              <button
                type="submit"
                className="btn btn-primary w-full py-2.5 text-xs font-bold shadow-lg shadow-orange-500/25 !bg-blue-600 hover:!bg-blue-500"
              >
                <Save className="w-4 h-4" />
                <span>Save Changes</span>
              </button>

              {savedMessage && (
                <div className="p-2 rounded bg-emerald-500/20 text-emerald-300 text-xs text-center font-bold">
                  ✓ General settings saved successfully!
                </div>
              )}
            </form>
          </div>

          <div className="card !p-4 bg-gradient-to-br from-[#161b22] to-orange-500/10 border-orange-500/30">
            <h4 className="font-bold text-xs text-white uppercase tracking-wider text-orange-400 mb-1">Security & Audit Compliance</h4>
            <p className="text-[11px] text-gray-400 leading-relaxed">
              Every action across TransitOps is authenticated and validated against the active RBAC matrix. Role switches in the header trigger real-time UI locks across modules.
            </p>
          </div>
        </div>

        {/* Right Panel: Role Access Matrix (RBAC) matching exact Screenshot 8 layout */}
        <div className="lg:col-span-8 card !p-0 overflow-hidden flex flex-col justify-between">
          <div className="p-4 border-b border-[#30363d] flex items-center justify-between">
            <div>
              <h3 className="font-bold text-base text-white flex items-center gap-2">
                <ShieldCheck className="w-5 h-5 text-emerald-400" />
                <span>Role Access Matrix (RBAC Overview)</span>
              </h3>
              <p className="text-xs text-gray-400">Click checkboxes to dynamically grant or revoke specific role permissions</p>
            </div>
            <span className="badge badge-blue">Interactive RBAC</span>
          </div>

          {/* Table matching Screenshot 8 columns: Role, View, Create, Edit, Delete, Audit Log */}
          <div className="table-container !border-none">
            <table className="table">
              <thead>
                <tr>
                  <th>Target User Role</th>
                  <th className="text-center">View</th>
                  <th className="text-center">Create</th>
                  <th className="text-center">Edit</th>
                  <th className="text-center">Delete</th>
                  <th className="text-center">Audit Log</th>
                </tr>
              </thead>
              <tbody>
                {roles.map((r) => {
                  // Summarize role across modules
                  const rolePerms = rbacMatrix[r] || {};
                  const createAll = Object.values(rolePerms).some((p) => p.create);
                  const editAll = Object.values(rolePerms).some((p) => p.edit);
                  const deleteAll = Object.values(rolePerms).some((p) => p.delete);

                  return (
                    <tr key={r} className="hover:bg-[#21262d]">
                      <td className="font-bold text-white text-xs flex items-center gap-2">
                        <span className={`w-2 h-2 rounded-full ${
                          r === 'Fleet Manager' ? 'bg-orange-400' :
                          r === 'Driver' ? 'bg-blue-400' :
                          r === 'Safety Officer' ? 'bg-emerald-400' : 'bg-amber-400'
                        }`}></span>
                        <span>{r}</span>
                      </td>
                      <td className="text-center">
                        <span className="inline-flex items-center justify-center w-6 h-6 rounded bg-[#21262d] text-emerald-400 font-bold text-xs">
                          {rolePerms.dashboard?.view ? '✓' : '—'}
                        </span>
                      </td>
                      <td className="text-center">
                        <span className={`inline-flex items-center justify-center w-6 h-6 rounded font-bold text-xs ${
                          createAll ? 'bg-emerald-500/15 text-emerald-400' : 'bg-[#21262d] text-gray-600'
                        }`}>
                          {createAll ? '✓' : '—'}
                        </span>
                      </td>
                      <td className="text-center">
                        <span className={`inline-flex items-center justify-center w-6 h-6 rounded font-bold text-xs ${
                          editAll ? 'bg-emerald-500/15 text-emerald-400' : 'bg-[#21262d] text-gray-600'
                        }`}>
                          {editAll ? '✓' : '—'}
                        </span>
                      </td>
                      <td className="text-center">
                        <span className={`inline-flex items-center justify-center w-6 h-6 rounded font-bold text-xs ${
                          deleteAll ? 'bg-red-500/15 text-red-400' : 'bg-[#21262d] text-gray-600'
                        }`}>
                          {deleteAll ? '✓' : '—'}
                        </span>
                      </td>
                      <td className="text-center">
                        <span className="inline-flex items-center justify-center w-6 h-6 rounded bg-emerald-500/15 text-emerald-400 font-bold text-xs">
                          ✓
                        </span>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          {/* Granular Module Permission Customizer */}
          <div className="p-4 border-t border-[#30363d] bg-[#161b22]/50">
            <h4 className="font-bold text-xs text-white uppercase tracking-wider mb-3">Granular Module Permissions Customizer</h4>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 max-h-64 overflow-y-auto pr-1">
              {roles.map((r) => (
                <div key={r} className="p-3 rounded-lg bg-[#0d1117] border border-[#30363d] space-y-2">
                  <div className="flex items-center justify-between font-bold text-xs text-orange-400 border-b border-[#30363d] pb-1.5">
                    <span>{r}</span>
                    <span className="text-[10px] text-gray-500 font-normal">Granular Access</span>
                  </div>
                  <div className="space-y-1.5">
                    {modules.map((m) => {
                      const hasView = rbacMatrix[r]?.[m.id]?.view ?? true;
                      const hasCreate = rbacMatrix[r]?.[m.id]?.create ?? false;
                      return (
                        <div key={m.id} className="flex items-center justify-between text-[11px] text-gray-300">
                          <span className="truncate max-w-[150px]">{m.label}</span>
                          <div className="flex items-center gap-1.5">
                            <label className="flex items-center gap-1 cursor-pointer" title="View Permission">
                              <input
                                type="checkbox"
                                checked={hasView}
                                onChange={(e) => updateRBAC(r, m.id, 'view', e.target.checked)}
                                className="w-3 h-3 rounded bg-[#21262d] border-gray-600 text-orange-500"
                              />
                              <span className="text-[10px] text-gray-400">View</span>
                            </label>
                            <label className="flex items-center gap-1 cursor-pointer" title="Create Permission">
                              <input
                                type="checkbox"
                                checked={hasCreate}
                                onChange={(e) => updateRBAC(r, m.id, 'create', e.target.checked)}
                                className="w-3 h-3 rounded bg-[#21262d] border-gray-600 text-emerald-500"
                              />
                              <span className="text-[10px] text-gray-400">Create</span>
                            </label>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              ))}
            </div>
          </div>

        </div>
      </div>
    </div>
  );
};
