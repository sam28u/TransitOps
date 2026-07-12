import React, { useState } from 'react';
import { useTransit } from '../context/TransitContext';
import type { MaintenanceStatus } from '../types';
import { Wrench, Plus } from 'lucide-react';

export const MaintenanceView: React.FC = () => {
  const { maintenanceLogs, vehicles, addMaintenanceLog, closeMaintenanceLog, rbacMatrix, currentUser } = useTransit();
  const currentRole = currentUser?.role || 'Fleet Manager';
  const canCreate = rbacMatrix[currentRole]?.maintenance?.create ?? true;

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [vehicleId, setVehicleId] = useState(vehicles[0]?.id || '');
  const [description, setDescription] = useState('Comprehensive 15,000km Engine Service & Inspection');
  const [cost, setCost] = useState<number>(450);
  const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
  const [status, setStatus] = useState<MaintenanceStatus>('In Progress');
  const [provider, setProvider] = useState('TransitOps Authorized Care');

  const handleOpenAdd = () => {
    if (!canCreate) {
      alert(`Role '${currentRole}' is not permitted to create maintenance logs.`);
      return;
    }
    const availVeh = vehicles.find((v) => v.status !== 'Retired');
    if (availVeh) setVehicleId(availVeh.id);
    setDescription('Comprehensive 15,000km Engine Service & Inspection');
    setCost(450);
    setDate(new Date().toISOString().split('T')[0]);
    setStatus('In Progress');
    setProvider('TransitOps Authorized Care');
    setIsModalOpen(true);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!vehicleId || !description.trim()) return;

    addMaintenanceLog({
      vehicleId,
      serviceDescription: description.trim(),
      cost,
      date,
      status,
      provider: provider.trim(),
    });
    setIsModalOpen(false);
  };

  return (
    <div className="space-y-6">
      {/* Top Header matching Screenshot 5 */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-white tracking-tight">Maintenance Workflow & Logs</h2>
          <p className="text-xs text-gray-400 mt-0.5">Automated workshop lockout sync and maintenance cost tracking</p>
        </div>

        <button
          onClick={handleOpenAdd}
          disabled={!canCreate}
          className={`btn btn-primary !py-2 !px-4 text-xs font-bold shadow-lg shadow-orange-500/25 ${!canCreate ? 'opacity-50 cursor-not-allowed' : ''}`}
        >
          <Plus className="w-4 h-4" />
          <span>+ Log Service</span>
        </button>
      </div>

      {/* Note callout matching exact amber/orange text in Screenshot 5 */}
      <div className="p-3.5 rounded-xl bg-amber-500/10 border border-amber-500/30 flex items-center gap-3 text-xs text-amber-300">
        <Wrench className="w-4 h-4 text-amber-400 shrink-0" />
        <div>
          <strong className="text-white font-semibold">Mandatory Status Transition Enforced:</strong> Adding a vehicle to an active "Maintenance Log" automatically switches its status to <span className="text-orange-400 font-bold underline">In Shop</span>, removing it from the Driver's dispatch selection pool. Closing maintenance automatically restores the vehicle to <span className="text-emerald-400 font-bold underline">Available</span> (unless retired).
        </div>
      </div>

      {/* Table matching Screenshot 5 */}
      <div className="card !p-0 overflow-hidden">
        <div className="table-container !border-none">
          <table className="table">
            <thead>
              <tr>
                <th>Service Code</th>
                <th>Assigned Vehicle</th>
                <th>Service Description</th>
                <th>Workshop / Provider</th>
                <th>Cost ($)</th>
                <th>Date Logged</th>
                <th>Status</th>
                <th className="text-right">Actions</th>
              </tr>
            </thead>
            <tbody>
              {maintenanceLogs.length === 0 ? (
                <tr>
                  <td colSpan={8} className="text-center py-8 text-gray-500 text-xs">No maintenance records logged yet.</td>
                </tr>
              ) : (
                maintenanceLogs.map((m) => {
                  const veh = vehicles.find((v) => v.id === m.vehicleId);
                  return (
                    <tr key={m.id} className="hover:bg-[#21262d]">
                      <td className="font-mono font-bold text-orange-400 text-xs">{m.serviceCode}</td>
                      <td>
                        <div className="text-xs font-bold text-white">{veh?.registrationNumber || m.vehicleId}</div>
                        <div className="text-[10px] text-gray-400">{veh?.nameModel} ({veh?.status})</div>
                      </td>
                      <td className="text-gray-200 text-xs font-medium max-w-[240px]">{m.serviceDescription}</td>
                      <td className="text-gray-400 text-xs">{m.provider}</td>
                      <td className="font-mono text-amber-400 text-xs font-semibold">${m.cost.toLocaleString()}</td>
                      <td className="font-mono text-gray-400 text-xs">{m.date}</td>
                      <td>
                        <span className={`badge ${
                          m.status === 'In Progress' ? 'badge-orange' :
                          m.status === 'Completed' ? 'badge-green' : 'badge-blue'
                        }`}>
                          {m.status}
                        </span>
                      </td>
                      <td className="text-right">
                        {m.status !== 'Completed' ? (
                          <button
                            onClick={() => closeMaintenanceLog(m.id)}
                            className="btn btn-secondary !p-1.5 !px-3 text-xs text-emerald-400 border-emerald-500/30 hover:bg-emerald-500/10 font-bold"
                            title="Close service and restore vehicle status to Available"
                          >
                            Close Service
                          </button>
                        ) : (
                          <span className="text-[11px] text-gray-500 font-medium">Closed</span>
                        )}
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modal: Log Service */}
      {isModalOpen && (
        <div className="modal-overlay">
          <div className="modal-content !p-6 space-y-5">
            <div className="flex items-center justify-between border-b border-[#30363d] pb-4">
              <div className="flex items-center gap-2">
                <Wrench className="w-5 h-5 text-orange-400" />
                <h3 className="font-bold text-lg text-white">Log Vehicle Maintenance & Service</h3>
              </div>
              <button onClick={() => setIsModalOpen(false)} className="text-gray-400 hover:text-white text-sm font-bold px-2 py-1">✕</button>
            </div>

            <p className="text-xs text-gray-400">
              Selecting <strong>In Progress</strong> or <strong>Scheduled</strong> will immediately change the selected vehicle's status to <span className="text-orange-400 font-semibold">In Shop</span> and hide it from trip dispatches.
            </p>

            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-gray-300 mb-1">Select Vehicle *</label>
                  <select
                    value={vehicleId}
                    onChange={(e) => setVehicleId(e.target.value)}
                    className="select font-mono"
                  >
                    {vehicles.map((v) => (
                      <option key={v.id} value={v.id} className="bg-[#161b22] text-white">
                        {v.registrationNumber} - {v.nameModel} [{v.status}]
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-semibold text-gray-300 mb-1">Service Status *</label>
                  <select
                    value={status}
                    onChange={(e) => setStatus(e.target.value as MaintenanceStatus)}
                    className="select"
                  >
                    <option value="In Progress">In Progress (Auto Lock to In Shop)</option>
                    <option value="Scheduled">Scheduled (Auto Lock to In Shop)</option>
                    <option value="Completed">Completed (Immediate Record)</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-300 mb-1">Service Description *</label>
                <input
                  type="text"
                  required
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="e.g. Synthetic Oil Change & Filter Replacement"
                  className="input"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-gray-300 mb-1">Estimated / Actual Cost ($) *</label>
                  <input
                    type="number"
                    required
                    min={0}
                    value={cost}
                    onChange={(e) => setCost(Number(e.target.value))}
                    className="input font-mono font-bold"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-gray-300 mb-1">Service Date *</label>
                  <input
                    type="date"
                    required
                    value={date}
                    onChange={(e) => setDate(e.target.value)}
                    className="input font-mono"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-300 mb-1">Workshop / Provider Name *</label>
                <input
                  type="text"
                  required
                  value={provider}
                  onChange={(e) => setProvider(e.target.value)}
                  placeholder="e.g. Scania Authorized Service Center"
                  className="input"
                />
              </div>

              <div className="flex items-center justify-end gap-3 pt-4 border-t border-[#30363d]">
                <button type="button" onClick={() => setIsModalOpen(false)} className="btn btn-secondary !py-2 text-xs">
                  Cancel
                </button>
                <button type="submit" className="btn btn-primary !py-2 !px-6 text-xs font-bold">
                  Confirm & Log Service
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
