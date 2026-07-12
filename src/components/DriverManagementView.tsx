import React, { useState } from 'react';
import { useTransit } from '../context/TransitContext';
import type { Driver, DriverStatus, LicenseCategory, Region } from '../types';
import { Users, Plus, Search, AlertCircle, MapPin, CheckCircle, ShieldAlert } from 'lucide-react';

export const DriverManagementView: React.FC = () => {
  const { drivers, addDriver, updateDriver, rbacMatrix, currentUser } = useTransit();
  const currentRole = currentUser?.role || 'Safety Officer';
  const canCreate = rbacMatrix[currentRole]?.drivers?.create ?? true;
  const canEdit = rbacMatrix[currentRole]?.drivers?.edit ?? true;

  const [localSearch, setLocalSearch] = useState('');
  const [filterStatus, setFilterStatus] = useState<string>('All');
  const [filterRegion, setFilterRegion] = useState<string>('All');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);

  // Form State
  const [name, setName] = useState('');
  const [licenseNumber, setLicenseNumber] = useState('');
  const [licenseCategory, setLicenseCategory] = useState<LicenseCategory>('Light Commercial (B)');
  const [licenseExpiryDate, setLicenseExpiryDate] = useState('2028-06-15');
  const [contactNumber, setContactNumber] = useState('+1 (555) 019-2834');
  const [safetyScore, setSafetyScore] = useState<number>(95);
  const [status, setStatus] = useState<DriverStatus>('Available');
  const [region, setRegion] = useState<Region>('North');
  const [formError, setFormError] = useState('');

  const todayStr = new Date().toISOString().split('T')[0];

  const filteredDrivers = drivers.filter((d) => {
    if (filterStatus !== 'All' && d.status !== filterStatus) return false;
    if (filterRegion !== 'All' && d.region !== filterRegion) return false;
    if (localSearch) {
      const q = localSearch.toLowerCase();
      if (!d.name.toLowerCase().includes(q) && !d.licenseNumber.toLowerCase().includes(q)) return false;
    }
    return true;
  });

  const handleOpenAdd = () => {
    if (!canCreate) {
      alert(`Role '${currentRole}' is not permitted to create driver profiles.`);
      return;
    }
    setEditingId(null);
    setName('Alex Rivera');
    setLicenseNumber(`DL-${Math.floor(100000 + Math.random() * 899999)}`);
    setLicenseCategory('Light Commercial (B)');
    setLicenseExpiryDate('2028-10-15');
    setContactNumber('+1 (555) 234-5678');
    setSafetyScore(98);
    setStatus('Available');
    setRegion('North');
    setFormError('');
    setIsModalOpen(true);
  };

  const handleOpenEdit = (d: Driver) => {
    if (!canEdit) {
      alert(`Role '${currentRole}' is not permitted to edit drivers.`);
      return;
    }
    setEditingId(d.id);
    setName(d.name);
    setLicenseNumber(d.licenseNumber);
    setLicenseCategory(d.licenseCategory);
    setLicenseExpiryDate(d.licenseExpiryDate);
    setContactNumber(d.contactNumber);
    setSafetyScore(d.safetyScore);
    setStatus(d.status);
    setRegion(d.region);
    setFormError('');
    setIsModalOpen(true);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || !licenseNumber.trim()) {
      setFormError('Driver Name and License Number are required.');
      return;
    }
    if (safetyScore < 0 || safetyScore > 100) {
      setFormError('Safety Score must be between 0 and 100.');
      return;
    }

    if (editingId) {
      updateDriver(editingId, {
        name: name.trim(),
        licenseNumber: licenseNumber.trim(),
        licenseCategory,
        licenseExpiryDate,
        contactNumber: contactNumber.trim(),
        safetyScore,
        status,
        region,
      });
      setIsModalOpen(false);
    } else {
      addDriver({
        name: name.trim(),
        licenseNumber: licenseNumber.trim(),
        licenseCategory,
        licenseExpiryDate,
        contactNumber: contactNumber.trim(),
        safetyScore,
        status,
        region,
      });
      setIsModalOpen(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Top Bar matching Screenshot 3 */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-white tracking-tight">Driver & Safety Management</h2>
          <p className="text-xs text-gray-400 mt-0.5">Onboard drivers, track license validity, compliance scores, and status availability</p>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          <div className="flex items-center gap-2 bg-[#161b22] p-1.5 rounded-xl border border-[#30363d]">
            <select
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value)}
              className="bg-[#21262d] text-xs font-medium text-gray-200 px-2.5 py-1.5 rounded-lg border border-[#30363d] outline-none"
            >
              <option value="All">All Statuses</option>
              <option value="Available">Available</option>
              <option value="On Trip">On Trip</option>
              <option value="Off Duty">Off Duty</option>
              <option value="Suspended">Suspended</option>
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
              placeholder="Search driver or license..."
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
            <span>+ Onboard Driver</span>
          </button>
        </div>
      </div>

      {/* Compliance banner matching exact golden highlight in Screenshot 3 */}
      <div className="p-3.5 rounded-xl bg-orange-500/10 border border-orange-500/30 flex items-center gap-3 text-xs text-orange-300">
        <ShieldAlert className="w-4 h-4 text-orange-400 shrink-0" />
        <div>
          <strong className="text-white font-semibold">Safety & Compliance Rule Enforced:</strong> Drivers with an <span className="text-red-400 font-bold underline">EXPIRED License</span> or <span className="text-red-400 font-bold underline">Suspended Status</span> are automatically BLOCKED from being assigned to any trip dispatch!
        </div>
      </div>

      {/* Table matching Screenshot 3 */}
      <div className="card !p-0 overflow-hidden">
        <div className="table-container !border-none">
          <table className="table">
            <thead>
              <tr>
                <th>Driver Name</th>
                <th>License Number</th>
                <th>Category</th>
                <th>License Expiry Date</th>
                <th>Safety Score</th>
                <th>Contact</th>
                <th>Status</th>
                <th className="text-right">Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredDrivers.length === 0 ? (
                <tr>
                  <td colSpan={8} className="text-center py-8 text-gray-500 text-xs">No driver profiles found.</td>
                </tr>
              ) : (
                filteredDrivers.map((d) => {
                  const isExpired = d.licenseExpiryDate < todayStr;
                  return (
                    <tr key={d.id} className="hover:bg-[#21262d]">
                      <td>
                        <div className="flex items-center gap-2.5">
                          <div className="w-7 h-7 rounded-full bg-gradient-to-br from-[#30363d] to-[#21262d] flex items-center justify-center text-xs font-bold text-gray-300 border border-[#30363d]">
                            {d.name.charAt(0)}
                          </div>
                          <div>
                            <div className="text-xs font-bold text-white">{d.name}</div>
                            <div className="text-[10px] text-gray-400 flex items-center gap-1 mt-0.5">
                              <MapPin className="w-3 h-3 text-gray-500 shrink-0" />
                              <span>{d.region} Region</span>
                            </div>
                          </div>
                        </div>
                      </td>
                      <td className="font-mono font-bold text-orange-400 text-xs">{d.licenseNumber}</td>
                      <td className="text-xs text-gray-200">{d.licenseCategory}</td>
                      <td>
                        <div className="flex items-center gap-1.5 font-mono text-xs">
                          <span className={isExpired ? 'text-red-400 font-bold underline' : 'text-gray-300'}>
                            {d.licenseExpiryDate}
                          </span>
                          {isExpired && (
                            <span className="badge badge-red !px-1.5 !py-0 !text-[10px]" title="Expired License! Dispatch Blocked">
                              EXPIRED
                            </span>
                          )}
                        </div>
                      </td>
                      <td>
                        <div className="flex items-center gap-2">
                          <span className={`font-mono text-xs font-bold ${
                            d.safetyScore >= 90 ? 'text-emerald-400' :
                            d.safetyScore >= 75 ? 'text-amber-400' : 'text-red-400'
                          }`}>
                            {d.safetyScore}/100
                          </span>
                          {d.safetyScore >= 90 && <CheckCircle className="w-3.5 h-3.5 text-emerald-400 shrink-0" />}
                        </div>
                      </td>
                      <td className="font-mono text-gray-400 text-xs">{d.contactNumber}</td>
                      <td>
                        <span className={`badge ${
                          d.status === 'Available' ? 'badge-green' :
                          d.status === 'On Trip' ? 'badge-blue' :
                          d.status === 'Suspended' ? 'badge-red' : 'badge-orange'
                        }`}>
                          {d.status}
                        </span>
                      </td>
                      <td className="text-right space-x-2">
                        <button
                          onClick={() => handleOpenEdit(d)}
                          disabled={!canEdit}
                          className="btn btn-secondary !p-1.5 !px-3 text-xs"
                          title="Edit Driver Profile"
                        >
                          Edit Profile
                        </button>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modal Add/Edit Driver */}
      {isModalOpen && (
        <div className="modal-overlay">
          <div className="modal-content !p-6 space-y-5">
            <div className="flex items-center justify-between border-b border-[#30363d] pb-4">
              <div className="flex items-center gap-2">
                <Users className="w-5 h-5 text-orange-400" />
                <h3 className="font-bold text-lg text-white">
                  {editingId ? `Edit Driver Profile (${name})` : 'Onboard New Driver Profile'}
                </h3>
              </div>
              <button onClick={() => setIsModalOpen(false)} className="text-gray-400 hover:text-white text-sm font-bold px-2 py-1">✕</button>
            </div>

            {formError && (
              <div className="p-3 rounded-lg bg-red-500/15 border border-red-500/30 text-red-400 text-xs flex items-center gap-2">
                <AlertCircle className="w-4 h-4 shrink-0" />
                <span>{formError}</span>
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-gray-300 mb-1">Driver Full Name *</label>
                  <input
                    type="text"
                    required
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="e.g. Alex Rivera"
                    className="input"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-gray-300 mb-1">License Number *</label>
                  <input
                    type="text"
                    required
                    value={licenseNumber}
                    onChange={(e) => setLicenseNumber(e.target.value)}
                    placeholder="e.g. DL-998822"
                    className="input font-mono uppercase"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-gray-300 mb-1">License Category *</label>
                  <select
                    value={licenseCategory}
                    onChange={(e) => setLicenseCategory(e.target.value as LicenseCategory)}
                    className="select"
                  >
                    <option value="Light Commercial (B)">Light Commercial (B)</option>
                    <option value="Heavy Goods (C)">Heavy Goods (C)</option>
                    <option value="Hazardous (ADR)">Hazardous (ADR)</option>
                    <option value="Universal (All)">Universal (All Categories)</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-semibold text-gray-300 mb-1">License Expiry Date (YYYY-MM-DD) *</label>
                  <input
                    type="date"
                    required
                    value={licenseExpiryDate}
                    onChange={(e) => setLicenseExpiryDate(e.target.value)}
                    className="input font-mono"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-gray-300 mb-1">Safety Score (0-100) *</label>
                  <input
                    type="number"
                    required
                    min={0}
                    max={100}
                    value={safetyScore}
                    onChange={(e) => setSafetyScore(Number(e.target.value))}
                    className="input font-mono font-bold text-emerald-400"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-gray-300 mb-1">Status *</label>
                  <select
                    value={status}
                    onChange={(e) => setStatus(e.target.value as DriverStatus)}
                    className="select"
                  >
                    <option value="Available">Available</option>
                    <option value="On Trip">On Trip</option>
                    <option value="Off Duty">Off Duty</option>
                    <option value="Suspended">Suspended</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-semibold text-gray-300 mb-1">Assigned Region *</label>
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

              <div>
                <label className="block text-xs font-semibold text-gray-300 mb-1">Contact Phone Number *</label>
                <input
                  type="text"
                  required
                  value={contactNumber}
                  onChange={(e) => setContactNumber(e.target.value)}
                  placeholder="e.g. +1 (555) 234-5678"
                  className="input font-mono"
                />
              </div>

              <div className="flex items-center justify-end gap-3 pt-4 border-t border-[#30363d]">
                <button type="button" onClick={() => setIsModalOpen(false)} className="btn btn-secondary !py-2 text-xs">
                  Cancel
                </button>
                <button type="submit" className="btn btn-primary !py-2 !px-6 text-xs font-bold">
                  {editingId ? 'Save Driver Changes' : 'Onboard Driver'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
