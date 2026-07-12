import React, { useState } from 'react';
import { useTransit } from '../context/TransitContext';
import { Fuel, DollarSign, Plus, Calculator } from 'lucide-react';

export const FuelExpenseView: React.FC = () => {
  const {
    fuelLogs, expenseLogs, maintenanceLogs, vehicles, addFuelLog, addExpenseLog,
    rbacMatrix, currentUser
  } = useTransit();
  const currentRole = currentUser?.role || 'Financial Analyst';
  const canCreate = rbacMatrix[currentRole]?.fuel?.create ?? true;

  const [activeTab, setActiveTab] = useState<'fuel' | 'expenses' | 'summary'>('fuel');
  const [isFuelModalOpen, setIsFuelModalOpen] = useState(false);
  const [isExpenseModalOpen, setIsExpenseModalOpen] = useState(false);

  // Fuel Form
  const [fuelVehId, setFuelVehId] = useState(vehicles[0]?.id || '');
  const [liters, setLiters] = useState<number>(50);
  const [fuelCost, setFuelCost] = useState<number>(70);
  const [fuelDate, setFuelDate] = useState(new Date().toISOString().split('T')[0]);
  const [odometer, setOdometer] = useState<number>(vehicles[0]?.odometer || 15000);
  const [station, setStation] = useState('Shell Interstate Depot');

  // Expense Form
  const [expVehId, setExpVehId] = useState(vehicles[0]?.id || '');
  const [category, setCategory] = useState<'Tolls' | 'Insurance' | 'Repairs' | 'Cleaning' | 'Registration' | 'Other'>('Tolls');
  const [expAmount, setExpAmount] = useState<number>(45);
  const [expDate, setExpDate] = useState(new Date().toISOString().split('T')[0]);
  const [description, setDescription] = useState('Highway Turnpike Toll Charges');

  const handleOpenFuelModal = () => {
    if (!canCreate) {
      alert(`Role '${currentRole}' is not permitted to log fuel.`);
      return;
    }
    const veh = vehicles.find((v) => v.id === fuelVehId) || vehicles[0];
    if (veh) setOdometer(veh.odometer);
    setIsFuelModalOpen(true);
  };

  const handleOpenExpenseModal = () => {
    if (!canCreate) {
      alert(`Role '${currentRole}' is not permitted to log expenses.`);
      return;
    }
    setIsExpenseModalOpen(true);
  };

  const handleFuelSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!fuelVehId) return;
    addFuelLog({
      vehicleId: fuelVehId,
      liters,
      cost: fuelCost,
      date: fuelDate,
      odometerReading: odometer,
      stationName: station.trim(),
    });
    setIsFuelModalOpen(false);
  };

  const handleExpenseSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!expVehId || !description.trim()) return;
    addExpenseLog({
      vehicleId: expVehId,
      category,
      amount: expAmount,
      date: expDate,
      description: description.trim(),
    });
    setIsExpenseModalOpen(false);
  };

  // Compute Total Operational Cost per vehicle
  const totalFleetFuelCost = fuelLogs.reduce((acc, f) => acc + f.cost, 0);
  const totalFleetMaintCost = maintenanceLogs.reduce((acc, m) => acc + m.cost, 0);
  const totalFleetOtherCost = expenseLogs.reduce((acc, e) => acc + e.amount, 0);
  const totalFleetOperationalCost = totalFleetFuelCost + totalFleetMaintCost + totalFleetOtherCost;

  return (
    <div className="space-y-6">
      {/* Top Bar matching Screenshot 6 */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-white tracking-tight">Fuel & Expense Management</h2>
          <p className="text-xs text-gray-400 mt-0.5">Automated computation of Total Operational Cost (Fuel + Maintenance + Expenses)</p>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          <button
            onClick={handleOpenFuelModal}
            disabled={!canCreate}
            className={`btn btn-primary !py-2 !px-4 text-xs font-bold shadow-lg shadow-orange-500/25 ${!canCreate ? 'opacity-50 cursor-not-allowed' : ''}`}
          >
            <Plus className="w-4 h-4" />
            <span>+ Log Fuel</span>
          </button>

          <button
            onClick={handleOpenExpenseModal}
            disabled={!canCreate}
            className={`btn btn-secondary !py-2 !px-4 text-xs font-bold text-orange-400 border-orange-500/30 hover:bg-orange-500/10 ${!canCreate ? 'opacity-50 cursor-not-allowed' : ''}`}
          >
            <Plus className="w-4 h-4" />
            <span>+ Add Expense</span>
          </button>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex items-center gap-2 border-b border-[#30363d] pb-2">
        <button
          onClick={() => setActiveTab('fuel')}
          className={`px-4 py-2 rounded-lg text-xs font-bold transition-all flex items-center gap-2 ${
            activeTab === 'fuel'
              ? 'bg-orange-500 text-white shadow-md shadow-orange-500/20'
              : 'text-gray-400 hover:text-white hover:bg-[#161b22]'
          }`}
        >
          <Fuel className="w-4 h-4" />
          <span>Fuel Logs ({fuelLogs.length})</span>
        </button>

        <button
          onClick={() => setActiveTab('expenses')}
          className={`px-4 py-2 rounded-lg text-xs font-bold transition-all flex items-center gap-2 ${
            activeTab === 'expenses'
              ? 'bg-orange-500 text-white shadow-md shadow-orange-500/20'
              : 'text-gray-400 hover:text-white hover:bg-[#161b22]'
          }`}
        >
          <DollarSign className="w-4 h-4" />
          <span>Other Expenses ({expenseLogs.length})</span>
        </button>

        <button
          onClick={() => setActiveTab('summary')}
          className={`px-4 py-2 rounded-lg text-xs font-bold transition-all flex items-center gap-2 ${
            activeTab === 'summary'
              ? 'bg-orange-500 text-white shadow-md shadow-orange-500/20'
              : 'text-gray-400 hover:text-white hover:bg-[#161b22]'
          }`}
        >
          <Calculator className="w-4 h-4" />
          <span>Operational Cost Summary per Vehicle</span>
        </button>
      </div>

      {/* Tab Contents */}
      {activeTab === 'fuel' && (
        <div className="card !p-0 overflow-hidden">
          <div className="table-container !border-none">
            <table className="table">
              <thead>
                <tr>
                  <th>Vehicle</th>
                  <th>Date</th>
                  <th>Liters</th>
                  <th>Total Cost ($)</th>
                  <th>Cost per Liter ($/L)</th>
                  <th>Odometer Reading</th>
                  <th>Station / Notes</th>
                </tr>
              </thead>
              <tbody>
                {fuelLogs.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="text-center py-8 text-gray-500 text-xs">No fuel records found.</td>
                  </tr>
                ) : (
                  fuelLogs.map((f) => {
                    const veh = vehicles.find((v) => v.id === f.vehicleId);
                    return (
                      <tr key={f.id} className="hover:bg-[#21262d]">
                        <td className="font-bold text-white text-xs">{veh?.registrationNumber || f.vehicleId}</td>
                        <td className="font-mono text-gray-400 text-xs">{f.date}</td>
                        <td className="font-mono text-gray-200 text-xs font-semibold">{f.liters.toFixed(1)} L</td>
                        <td className="font-mono text-orange-400 text-xs font-bold">${f.cost.toFixed(2)}</td>
                        <td className="font-mono text-gray-400 text-xs">${(f.cost / (f.liters || 1)).toFixed(2)}/L</td>
                        <td className="font-mono text-gray-300 text-xs">{f.odometerReading.toLocaleString()} km</td>
                        <td className="text-gray-400 text-xs">{f.stationName || 'N/A'}</td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {activeTab === 'expenses' && (
        <div className="card !p-0 overflow-hidden">
          <div className="table-container !border-none">
            <table className="table">
              <thead>
                <tr>
                  <th>Vehicle</th>
                  <th>Date</th>
                  <th>Category</th>
                  <th>Amount ($)</th>
                  <th>Description</th>
                </tr>
              </thead>
              <tbody>
                {expenseLogs.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="text-center py-8 text-gray-500 text-xs">No expense records found.</td>
                  </tr>
                ) : (
                  expenseLogs.map((e) => {
                    const veh = vehicles.find((v) => v.id === e.vehicleId);
                    return (
                      <tr key={e.id} className="hover:bg-[#21262d]">
                        <td className="font-bold text-white text-xs">{veh?.registrationNumber || e.vehicleId}</td>
                        <td className="font-mono text-gray-400 text-xs">{e.date}</td>
                        <td>
                          <span className="badge badge-blue">{e.category}</span>
                        </td>
                        <td className="font-mono text-orange-400 text-xs font-bold">${e.amount.toFixed(2)}</td>
                        <td className="text-gray-300 text-xs">{e.description}</td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {activeTab === 'summary' && (
        <div className="space-y-4">
          <div className="card !p-0 overflow-hidden">
            <div className="p-4 border-b border-[#30363d]">
              <h3 className="font-bold text-base text-white">Automated Operational Cost Breakdown per Vehicle</h3>
              <p className="text-xs text-gray-400">Exact formula computed across all fuel logs, workshop maintenance orders, and miscellaneous tolls/repairs</p>
            </div>
            <div className="table-container !border-none">
              <table className="table">
                <thead>
                  <tr>
                    <th>Registration No.</th>
                    <th>Model</th>
                    <th>Fuel Cost ($)</th>
                    <th>Maintenance ($)</th>
                    <th>Other Expenses ($)</th>
                    <th className="text-right">Total Operational Cost ($)</th>
                  </tr>
                </thead>
                <tbody>
                  {vehicles.map((v) => {
                    const vehFuel = fuelLogs.filter((f) => f.vehicleId === v.id).reduce((s, f) => s + f.cost, 0);
                    const vehMaint = maintenanceLogs.filter((m) => m.vehicleId === v.id).reduce((s, m) => s + m.cost, 0);
                    const vehOther = expenseLogs.filter((e) => e.vehicleId === v.id).reduce((s, e) => s + e.amount, 0);
                    const totalVehCost = vehFuel + vehMaint + vehOther;

                    return (
                      <tr key={v.id} className="hover:bg-[#21262d]">
                        <td className="font-mono font-bold text-orange-400 text-xs">{v.registrationNumber}</td>
                        <td className="font-semibold text-white text-xs">{v.nameModel}</td>
                        <td className="font-mono text-gray-300 text-xs">${vehFuel.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</td>
                        <td className="font-mono text-amber-400 text-xs font-medium">${vehMaint.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</td>
                        <td className="font-mono text-blue-400 text-xs">${vehOther.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</td>
                        <td className="font-mono font-bold text-emerald-400 text-sm text-right">
                          ${totalVehCost.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* Golden summary block matching exact bottom callout in Screenshot 6 */}
      <div className="p-4 rounded-xl bg-gradient-to-r from-orange-500/20 via-[#161b22] to-emerald-500/10 border border-orange-500/40 flex flex-col sm:flex-row items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <Calculator className="w-6 h-6 text-orange-400 shrink-0" />
          <div>
            <h4 className="text-sm font-bold text-white uppercase tracking-wider font-mono">
              TOTAL OPERATIONAL COST (FLEET) = FUEL + MAINT + EXPENSES
            </h4>
            <p className="text-xs text-gray-300">
              Fuel: <strong className="text-orange-400 font-mono">${totalFleetFuelCost.toFixed(2)}</strong> + Maintenance: <strong className="text-amber-400 font-mono">${totalFleetMaintCost.toLocaleString()}</strong> + Other: <strong className="text-blue-400 font-mono">${totalFleetOtherCost.toFixed(2)}</strong>
            </p>
          </div>
        </div>
        <div className="text-right bg-[#0d1117] px-5 py-2.5 rounded-xl border border-orange-500/40 shadow-inner">
          <span className="text-xs text-gray-400 uppercase font-bold block">Grand Operational Total</span>
          <span className="text-2xl font-mono font-bold text-orange-400">
            ${totalFleetOperationalCost.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
          </span>
        </div>
      </div>

      {/* Modal: Log Fuel */}
      {isFuelModalOpen && (
        <div className="modal-overlay">
          <div className="modal-content !p-6 space-y-5">
            <div className="flex items-center justify-between border-b border-[#30363d] pb-4">
              <div className="flex items-center gap-2">
                <Fuel className="w-5 h-5 text-orange-400" />
                <h3 className="font-bold text-lg text-white">Log Vehicle Fuel Refill</h3>
              </div>
              <button onClick={() => setIsFuelModalOpen(false)} className="text-gray-400 hover:text-white text-sm font-bold px-2 py-1">✕</button>
            </div>

            <form onSubmit={handleFuelSubmit} className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-gray-300 mb-1">Select Vehicle *</label>
                  <select
                    value={fuelVehId}
                    onChange={(e) => {
                      setFuelVehId(e.target.value);
                      const v = vehicles.find((item) => item.id === e.target.value);
                      if (v) setOdometer(v.odometer);
                    }}
                    className="select font-mono"
                  >
                    {vehicles.map((v) => (
                      <option key={v.id} value={v.id} className="bg-[#161b22] text-white">
                        {v.registrationNumber} - {v.nameModel}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-semibold text-gray-300 mb-1">Refill Date *</label>
                  <input
                    type="date"
                    required
                    value={fuelDate}
                    onChange={(e) => setFuelDate(e.target.value)}
                    className="input font-mono"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-gray-300 mb-1">Liters Refilled *</label>
                  <input
                    type="number"
                    required
                    step="0.1"
                    min={0.1}
                    value={liters}
                    onChange={(e) => setLiters(Number(e.target.value))}
                    className="input font-mono font-bold"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-gray-300 mb-1">Total Cost ($) *</label>
                  <input
                    type="number"
                    required
                    step="0.01"
                    min={0.01}
                    value={fuelCost}
                    onChange={(e) => setFuelCost(Number(e.target.value))}
                    className="input font-mono font-bold text-orange-400"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-gray-300 mb-1">Odometer Reading (km) *</label>
                  <input
                    type="number"
                    required
                    min={0}
                    value={odometer}
                    onChange={(e) => setOdometer(Number(e.target.value))}
                    className="input font-mono"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-300 mb-1">Station / Vendor Name</label>
                <input
                  type="text"
                  value={station}
                  onChange={(e) => setStation(e.target.value)}
                  placeholder="e.g. Shell Interstate Plaza"
                  className="input"
                />
              </div>

              <div className="flex items-center justify-end gap-3 pt-4 border-t border-[#30363d]">
                <button type="button" onClick={() => setIsFuelModalOpen(false)} className="btn btn-secondary !py-2 text-xs">
                  Cancel
                </button>
                <button type="submit" className="btn btn-primary !py-2 !px-6 text-xs font-bold">
                  Save Fuel Log
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal: Add Expense */}
      {isExpenseModalOpen && (
        <div className="modal-overlay">
          <div className="modal-content !p-6 space-y-5">
            <div className="flex items-center justify-between border-b border-[#30363d] pb-4">
              <div className="flex items-center gap-2">
                <DollarSign className="w-5 h-5 text-orange-400" />
                <h3 className="font-bold text-lg text-white">Add Operational Expense</h3>
              </div>
              <button onClick={() => setIsExpenseModalOpen(false)} className="text-gray-400 hover:text-white text-sm font-bold px-2 py-1">✕</button>
            </div>

            <form onSubmit={handleExpenseSubmit} className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-gray-300 mb-1">Select Vehicle *</label>
                  <select
                    value={expVehId}
                    onChange={(e) => setExpVehId(e.target.value)}
                    className="select font-mono"
                  >
                    {vehicles.map((v) => (
                      <option key={v.id} value={v.id} className="bg-[#161b22] text-white">
                        {v.registrationNumber} - {v.nameModel}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-semibold text-gray-300 mb-1">Expense Category *</label>
                  <select
                    value={category}
                    onChange={(e) => setCategory(e.target.value as any)}
                    className="select"
                  >
                    <option value="Tolls">Tolls & Turnpike</option>
                    <option value="Insurance">Insurance & Liability</option>
                    <option value="Repairs">Miscellaneous Repairs</option>
                    <option value="Cleaning">Fleet Washing & Sanitization</option>
                    <option value="Registration">Permit & Tax Renewal</option>
                    <option value="Other">Other Operational Charge</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-gray-300 mb-1">Expense Amount ($) *</label>
                  <input
                    type="number"
                    required
                    step="0.01"
                    min={0.01}
                    value={expAmount}
                    onChange={(e) => setExpAmount(Number(e.target.value))}
                    className="input font-mono font-bold text-orange-400"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-gray-300 mb-1">Date *</label>
                  <input
                    type="date"
                    required
                    value={expDate}
                    onChange={(e) => setExpDate(e.target.value)}
                    className="input font-mono"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-300 mb-1">Description / Notes *</label>
                <input
                  type="text"
                  required
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="e.g. Interstate E-ZPass Toll charges"
                  className="input"
                />
              </div>

              <div className="flex items-center justify-end gap-3 pt-4 border-t border-[#30363d]">
                <button type="button" onClick={() => setIsExpenseModalOpen(false)} className="btn btn-secondary !py-2 text-xs">
                  Cancel
                </button>
                <button type="submit" className="btn btn-primary !py-2 !px-6 text-xs font-bold">
                  Save Expense
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
