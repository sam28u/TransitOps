import React, { useState } from 'react';
import { useTransit } from '../context/TransitContext';
import type { Region, Vehicle, VehicleType } from '../types';
import { Truck, Plus, Search, MapPin, Wrench, AlertTriangle, Edit2 } from 'lucide-react';

export const FleetRegistryView: React.FC = () => {
  const { vehicles, addVehicle, updateVehicle, rbacMatrix, currentUser } = useTransit();
  const currentRole = currentUser?.role || 'Fleet Manager';
  const canCreate = rbacMatrix[currentRole]?.fleet?.create ?? true;
  const canEdit = rbacMatrix[currentRole]?.fleet?.edit ?? true;

  const [localSearch, setLocalSearch] = useState('');
  const [filterType, setFilterType] = useState<string>('All');
  const [filterRegion, setFilterRegion] = useState<string>('All');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);

  // Form State
  const [regNum, setRegNum] = useState('');
  const [modelName, setModelName] = useState('');
  const [vehType, setVehType] = useState<VehicleType>('Van');
  const [maxCapacity, setMaxCapacity] = useState<number>(500);
  const [odometer, setOdometer] = useState<number>(10000);
  const [acquisitionCost, setAcquisitionCost] = useState<number>(45000);
  const [region, setRegion] = useState<Region>('North');
  const [formError, setFormError] = useState('');

  const filteredVehicles = vehicles.filter((v) => {
    if (filterType !== 'All' && v.type !== filterType) return false;
    if (filterRegion !== 'All' && v.region !== filterRegion) return false;
    if (localSearch) {
      const q = localSearch.toLowerCase();
      if (!v.registrationNumber.toLowerCase().includes(q) && !v.nameModel.toLowerCase().includes(q)) return false;
    }
    return true;
  });

  const handleOpenAdd = () => {
    if (!canCreate) {
      alert(`Role '${currentRole}' is not permitted to create vehicles.`);
      return;
    }
    setEditingId(null);
    setRegNum(`VAN-${Math.floor(10 + Math.random() * 89)}`);
    setModelName('Ford Transit Custom Cargo');
    setVehType('Van');
    setMaxCapacity(500);
    setOdometer(14200);
    setAcquisitionCost(45000);
    setRegion('North');
    setFormError('');
    setIsModalOpen(true);
  };

  const handleOpenEdit = (v: Vehicle) => {
    if (!canEdit) {
      alert(`Role '${currentRole}' is not permitted to edit vehicles.`);
      return;
    }
    setEditingId(v.id);
    setRegNum(v.registrationNumber);
    setModelName(v.nameModel);
    setVehType(v.type);
    setMaxCapacity(v.maxLoadCapacity);
    setOdometer(v.odometer);
    setAcquisitionCost(v.acquisitionCost);
    setRegion(v.region);
    setFormError('');
    setIsModalOpen(true);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!regNum.trim() || !modelName.trim()) {
      setFormError('Registration Number and Model Name are required.');
      return;
    }
    if (maxCapacity <= 0 || odometer < 0 || acquisitionCost <= 0) {
      setFormError('Capacity, Odometer, and Acquisition Cost must be valid positive numbers.');
      return;
    }

    if (editingId) {
      updateVehicle(editingId, {
        registrationNumber: regNum.trim(),
        nameModel: modelName.trim(),
        type: vehType,
        maxLoadCapacity: maxCapacity,
        odometer,
        acquisitionCost,
        region,
      });
      setIsModalOpen(false);
    } else {
      addVehicle({
        registrationNumber: regNum.trim(),
        nameModel: modelName.trim(),
        type: vehType,
        maxLoadCapacity: maxCapacity,
        odometer,
        acquisitionCost,
        status: 'Available',
        region,
        accumulatedRevenue: 0,
      });
      setIsModalOpen(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Top Bar matching Screenshot 2 */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-white tracking-tight">Fleet Asset Registry</h2>
          <p className="text-xs text-gray-400 mt-0.5">Manage vehicles, check load capacities, odometer readings, and status synchronizations</p>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          <div className="flex items-center gap-2 bg-[#161b22] p-1.5 rounded-xl border border-[#30363d]">
            <select
              value={filterType}
              onChange={(e) => setFilterType(e.target.value)}
              className="bg-[#21262d] text-xs font-medium text-gray-200 px-2.5 py-1.5 rounded-lg border border-[#30363d] outline-none"
            >
              <option value="All">All Types</option>
              <option value="Truck">Truck</option>
              <option value="Van">Van</option>
              <option value="Refrigerated Truck">Refrigerated Truck</option>
              <option value="Trailer">Trailer</option>
              <option value="Pickup">Pickup</option>
              <option value="Bike">Bike</option>
            </select>

            <select
              value={filterRegion}
              onChange={(e) => setFilterRegion(e.target.value)}
              className="bg-[#21262d] text-xs font-medium text-gray-200 px-2.5 py-1.5 rounded-lg border border-[#30363d] outline-none"
            >
              <option value="All">All Regions</option>
              <option value="North">North</option>
              <option value="South">South</option>
              <option value="East">East</option>
              <option value="West">West</option>
            </select>
          </div>

          <div className="relative w-56">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input
              type="text"
              placeholder="Search registration or model..."
              value={localSearch}
              onChange={(e) => setLocalSearch(e.target.value)}
              className="input !pl-9 !py-1.5 !text-xs"
            />
          </div>

          <button
            onClick={handleOpenAdd}
            disabled={!canCreate}
            className={`btn btn-primary !py-2 !px-4 text-xs font-bold shadow-lg shadow-orange-500/25 ${!canCreate ? 'opacity-50 cursor-not-allowed' : ''}`}
          >
            <Plus className="w-4 h-4" />
            <span>+ Add Vehicle</span>
          </button>
        </div>
      </div>

      {/* Note callout matching exact amber/orange text below header in Screenshot 2 */}
      <div className="p-3.5 rounded-xl bg-amber-500/10 border border-amber-500/30 flex items-center gap-3 text-xs text-amber-300">
        <AlertTriangle className="w-4 h-4 text-amber-400 shrink-0" />
        <div>
          <strong className="text-white font-semibold">Automatic Status Sync Active:</strong> Vehicles assigned to an active trip change to <span className="text-orange-400 font-bold underline">On Trip</span>. Vehicles sent to workshop change to <span className="text-orange-400 font-bold underline">In Shop</span>. Only <span className="text-emerald-400 font-bold underline">Available</span> vehicles appear in the Driver Dispatcher!
        </div>
      </div>

      {/* Table matching Screenshot 2 */}
      <div className="card !p-0 overflow-hidden">
        <div className="table-container !border-none">
          <table className="table">
            <thead>
              <tr>
                <th>Registration No.</th>
                <th>Model Name</th>
                <th>Type</th>
                <th>Max Load Capacity</th>
                <th>Current Odometer</th>
                <th>Region</th>
                <th>Status</th>
                <th className="text-right">Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredVehicles.length === 0 ? (
                <tr>
                  <td colSpan={8} className="text-center py-8 text-gray-500 text-xs">No fleet vehicles match your filter criteria.</td>
                </tr>
              ) : (
                filteredVehicles.map((v) => (
                  <tr key={v.id} className="hover:bg-[#21262d]">
                    <td className="font-mono font-bold text-orange-400 text-xs">{v.registrationNumber}</td>
                    <td className="font-semibold text-white text-xs">{v.nameModel}</td>
                    <td>
                      <span className="badge badge-purple">{v.type}</span>
                    </td>
                    <td className="font-mono text-gray-200 text-xs font-semibold">{v.maxLoadCapacity.toLocaleString()} kg</td>
                    <td className="font-mono text-gray-300 text-xs">{v.odometer.toLocaleString()} km</td>
                    <td>
                      <span className="inline-flex items-center gap-1 text-xs text-gray-300">
                        <MapPin className="w-3 h-3 text-gray-500" />
                        {v.region}
                      </span>
                    </td>
                    <td>
                      <span className={`badge ${
                        v.status === 'Available' ? 'badge-green' :
                        v.status === 'On Trip' ? 'badge-blue' :
                        v.status === 'In Shop' ? 'badge-orange' : 'badge-red'
                      }`}>
                        {v.status}
                      </span>
                    </td>
                    <td className="text-right space-x-2">
                      <button
                        onClick={() => handleOpenEdit(v)}
                        disabled={!canEdit}
                        title="Edit Vehicle"
                        className="btn btn-secondary !p-1.5 text-gray-300 hover:text-white"
                      >
                        <Edit2 className="w-3.5 h-3.5" />
                      </button>
                      {v.status === 'Available' && (
                        <button
                          onClick={() => updateVehicle(v.id, { status: 'In Shop' })}
                          className="btn btn-secondary !p-1.5 text-[11px] text-orange-400 border-orange-500/30"
                          title="Send to Workshop (In Shop)"
                        >
                          <Wrench className="w-3.5 h-3.5" />
                        </button>
                      )}
                      {v.status === 'In Shop' && (
                        <button
                          onClick={() => updateVehicle(v.id, { status: 'Available' })}
                          className="btn btn-secondary !p-1.5 text-[11px] text-emerald-400 border-emerald-500/30"
                          title="Return to Available"
                        >
                          ✓ Ready
                        </button>
                      )}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Vehicle Add/Edit Modal */}
      {isModalOpen && (
        <div className="modal-overlay">
          <div className="modal-content !p-6 space-y-5">
            <div className="flex items-center justify-between border-b border-[#30363d] pb-4">
              <div className="flex items-center gap-2">
                <Truck className="w-5 h-5 text-orange-400" />
                <h3 className="font-bold text-lg text-white">
                  {editingId ? `Edit Vehicle (${regNum})` : 'Add New Fleet Vehicle'}
                </h3>
              </div>
              <button
                onClick={() => setIsModalOpen(false)}
                className="text-gray-400 hover:text-white text-sm font-bold px-2 py-1"
              >
                ✕
              </button>
            </div>

            {formError && (
              <div className="p-3 rounded-lg bg-red-500/15 border border-red-500/30 text-red-400 text-xs flex items-center gap-2">
                <AlertTriangle className="w-4 h-4 shrink-0" />
                <span>{formError}</span>
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-gray-300 mb-1">Registration No. *</label>
                  <input
                    type="text"
                    required
                    value={regNum}
                    onChange={(e) => setRegNum(e.target.value)}
                    placeholder="e.g. VAN-05 or TRK-102"
                    className="input font-mono uppercase"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-gray-300 mb-1">Model Name *</label>
                  <input
                    type="text"
                    required
                    value={modelName}
                    onChange={(e) => setModelName(e.target.value)}
                    placeholder="e.g. Ford Transit Custom Cargo"
                    className="input"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-gray-300 mb-1">Vehicle Type *</label>
                  <select
                    value={vehType}
                    onChange={(e) => setVehType(e.target.value as VehicleType)}
                    className="select"
                  >
                    <option value="Van">Van (Light Commercial)</option>
                    <option value="Truck">Truck (Heavy Duty)</option>
                    <option value="Refrigerated Truck">Refrigerated Truck (Cold Chain)</option>
                    <option value="Trailer">Trailer</option>
                    <option value="Pickup">Pickup</option>
                    <option value="Bike">Bike / Express Delivery</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-semibold text-gray-300 mb-1">Region Assignment *</label>
                  <select
                    value={region}
                    onChange={(e) => setRegion(e.target.value as Region)}
                    className="select"
                  >
                    <option value="North">North Region</option>
                    <option value="South">South Region</option>
                    <option value="East">East Region</option>
                    <option value="West">West Region</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-gray-300 mb-1">Max Load Capacity (kg) *</label>
                  <input
                    type="number"
                    required
                    min={1}
                    value={maxCapacity}
                    onChange={(e) => setMaxCapacity(Number(e.target.value))}
                    className="input font-mono font-bold text-orange-400"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-gray-300 mb-1">Current Odometer (km) *</label>
                  <input
                    type="number"
                    required
                    min={0}
                    value={odometer}
                    onChange={(e) => setOdometer(Number(e.target.value))}
                    className="input font-mono"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-gray-300 mb-1">Acquisition Cost ($) *</label>
                  <input
                    type="number"
                    required
                    min={1}
                    value={acquisitionCost}
                    onChange={(e) => setAcquisitionCost(Number(e.target.value))}
                    className="input font-mono"
                  />
                </div>
              </div>

              <div className="flex items-center justify-end gap-3 pt-4 border-t border-[#30363d]">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="btn btn-secondary !py-2 text-xs"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="btn btn-primary !py-2 !px-6 text-xs font-bold"
                >
                  {editingId ? 'Save Vehicle Changes' : 'Register Vehicle'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
