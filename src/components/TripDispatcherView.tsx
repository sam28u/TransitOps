import React, { useState } from 'react';
import { useTransit } from '../context/TransitContext';
import type { Trip, TripStatus } from '../types';
import {
  Plus, Navigation, CheckCircle2, XCircle, AlertCircle,
  ArrowRight, Play, CheckCircle, ShieldCheck
} from 'lucide-react';

export const TripDispatcherView: React.FC = () => {
  const {
    trips, vehicles, drivers, createTrip, dispatchTrip, completeTrip, cancelTrip,
    runExampleWorkflowStep, rbacMatrix, currentUser
  } = useTransit();
  const currentRole = currentUser?.role || 'Driver';
  const canCreate = rbacMatrix[currentRole]?.trips?.create ?? true;

  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [isCompleteModalOpen, setIsCompleteModalOpen] = useState(false);
  const [selectedTripForComplete, setSelectedTripForComplete] = useState<Trip | null>(null);

  // Create Form State
  const [source, setSource] = useState('Warehouse Depot (North)');
  const [destination, setDestination] = useState('Downtown Retail Hub');
  const [vehicleId, setVehicleId] = useState(vehicles[0]?.id || '');
  const [driverId, setDriverId] = useState(drivers[0]?.id || '');
  const [cargoWeight, setCargoWeight] = useState<number>(450);
  const [plannedDistance, setPlannedDistance] = useState<number>(120);
  const [initialStatus, setInitialStatus] = useState<TripStatus>('Dispatched');
  const [formError, setFormError] = useState('');

  // Complete Form State
  const [finalOdometer, setFinalOdometer] = useState<number>(0);
  const [fuelConsumed, setFuelConsumed] = useState<number>(18);
  const [completeError, setCompleteError] = useState('');

  // Workflow Test Harness State
  const [stepOutput, setStepOutput] = useState<{ stepTitle: string; result: string; success: boolean } | null>(null);

  const selectedVehicle = vehicles.find((v) => v.id === vehicleId);
  const selectedDriver = drivers.find((d) => d.id === driverId);

  // Real-time validation checks for the UI card matching Screenshot 4
  const isWeightValid = selectedVehicle ? cargoWeight <= selectedVehicle.maxLoadCapacity : true;
  const isVehicleAvailable = selectedVehicle ? selectedVehicle.status === 'Available' : true;
  const isDriverAvailable = selectedDriver ? selectedDriver.status === 'Available' : true;
  const todayStr = new Date().toISOString().split('T')[0];
  const isDriverLicenseValid = selectedDriver ? selectedDriver.licenseExpiryDate >= todayStr : true;
  const isDriverNotSuspended = selectedDriver ? selectedDriver.status !== 'Suspended' : true;

  const canDispatchRealtime = isWeightValid && isVehicleAvailable && isDriverAvailable && isDriverLicenseValid && isDriverNotSuspended;

  const handleOpenCreateModal = () => {
    if (!canCreate) {
      alert(`Role '${currentRole}' is not permitted to create trips.`);
      return;
    }
    const availableVeh = vehicles.find((v) => v.status === 'Available');
    const availableDrv = drivers.find((d) => d.status === 'Available' && d.licenseExpiryDate >= todayStr);
    if (availableVeh) setVehicleId(availableVeh.id);
    if (availableDrv) setDriverId(availableDrv.id);
    setSource('Warehouse Depot (North)');
    setDestination('Downtown Retail Hub');
    setCargoWeight(450);
    setPlannedDistance(120);
    setInitialStatus('Dispatched');
    setFormError('');
    setIsCreateModalOpen(true);
  };

  const handleCreateSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setFormError('');

    if (!source.trim() || !destination.trim()) {
      setFormError('Source and Destination are required.');
      return;
    }

    if (cargoWeight <= 0 || plannedDistance <= 0) {
      setFormError('Cargo weight and planned distance must be positive.');
      return;
    }

    const result = createTrip({
      source: source.trim(),
      destination: destination.trim(),
      vehicleId,
      driverId,
      cargoWeight,
      plannedDistance,
    }, initialStatus);

    if (result.success) {
      setIsCreateModalOpen(false);
    } else {
      setFormError(result.error || 'Failed to create trip due to validation error.');
    }
  };

  const handleOpenCompleteModal = (t: Trip) => {
    const veh = vehicles.find((v) => v.id === t.vehicleId);
    setSelectedTripForComplete(t);
    setFinalOdometer((veh?.odometer || 0) + t.plannedDistance);
    setFuelConsumed(Math.round(t.plannedDistance / 7));
    setCompleteError('');
    setIsCompleteModalOpen(true);
  };

  const handleCompleteSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedTripForComplete) return;
    const res = completeTrip(selectedTripForComplete.id, finalOdometer, fuelConsumed);
    if (res.success) {
      setIsCompleteModalOpen(false);
    } else {
      setCompleteError(res.error || 'Failed to complete trip.');
    }
  };

  const handleRunWorkflow = (step: number) => {
    const res = runExampleWorkflowStep(step);
    setStepOutput(res);
  };

  return (
    <div className="space-y-6">
      {/* Top Bar matching Screenshot 4 */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-white tracking-tight">Trip Dispatcher & Lifecycle</h2>
          <p className="text-xs text-gray-400 mt-0.5">Enforcing cargo capacities, driver license compliance, and automatic vehicle status sync</p>
        </div>

        <button
          onClick={handleOpenCreateModal}
          disabled={!canCreate}
          className={`btn btn-primary !py-2 !px-5 text-xs font-bold shadow-lg shadow-orange-500/25 ${!canCreate ? 'opacity-50 cursor-not-allowed' : ''}`}
        >
          <Plus className="w-4 h-4" />
          <span>+ Create & Dispatch Trip</span>
        </button>
      </div>

      {/* Visual Stepper Lifecycle Bar matching exact 4-stage pipeline in Screenshot 4 */}
      <div className="card !p-5 bg-[#131824] border border-[#222a3d]">
        <div className="text-xs font-bold text-slate-300 uppercase tracking-wider mb-4 flex items-center justify-between">
          <span className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-orange-400"></span>
            <span>Trip Lifecycle Pipeline</span>
          </span>
          <span className="text-orange-400 font-mono font-semibold">Draft → Dispatched → Completed → Cancelled</span>
        </div>
        <div className="stepper-container !my-4">
          <div className="stepper-line"></div>
          <div className="stepper-step active">
            <div className="stepper-circle">1</div>
            <span className="text-xs font-bold text-white mt-2">Draft</span>
            <span className="text-[10px] text-slate-400 font-medium">Route & Cargo setup</span>
          </div>
          <div className="stepper-step active">
            <div className="stepper-circle">2</div>
            <span className="text-xs font-bold text-orange-400 mt-2">Dispatched</span>
            <span className="text-[10px] text-slate-400 font-medium">Auto On Trip status</span>
          </div>
          <div className="stepper-step completed">
            <div className="stepper-circle">3</div>
            <span className="text-xs font-bold text-emerald-400 mt-2">Completed</span>
            <span className="text-[10px] text-slate-400 font-medium">Auto Available status</span>
          </div>
          <div className="stepper-step cancelled">
            <div className="stepper-circle">4</div>
            <span className="text-xs font-bold text-red-400 mt-2">Cancelled</span>
            <span className="text-[10px] text-slate-400 font-medium">Restores to pool</span>
          </div>
        </div>
      </div>

      {/* Mandatory Example Workflow Harness Card (Section 5 verification right inside UI) */}
      <div className="card !p-6 border-[#222a3d] bg-[#131824] space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between border-b border-[#222a3d] pb-4 gap-3">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-[#1a2130] text-orange-400">
              <ShieldCheck className="w-5 h-5 shrink-0" />
            </div>
            <div>
              <h3 className="font-bold text-base text-white tracking-tight">Interactive Section 5 Workflow Verification Harness</h3>
              <p className="text-xs text-slate-400 mt-0.5">Automated hackathon review bench: test and verify all 9 lifecycle steps</p>
            </div>
          </div>
          <button
            onClick={() => {
              for (let s = 1; s <= 9; s++) {
                if (s !== 4 && s !== 7) handleRunWorkflow(s);
              }
            }}
            className="btn btn-primary !px-4 !py-2 !text-xs font-semibold flex items-center gap-2"
          >
            <Play className="w-3.5 h-3.5 fill-current" />
            <span>Run All 9 Steps</span>
          </button>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-2.5">
          <button onClick={() => handleRunWorkflow(1)} className="btn btn-secondary !py-2 text-[11px] font-mono justify-start text-left">
            <span>Step 1: Reg Van-05</span>
          </button>
          <button onClick={() => handleRunWorkflow(2)} className="btn btn-secondary !py-2 text-[11px] font-mono justify-start text-left">
            <span>Step 2: Reg Driver Alex</span>
          </button>
          <button onClick={() => handleRunWorkflow(3)} className="btn btn-secondary !py-2 text-[11px] font-mono justify-start text-left text-orange-400">
            <span>Step 3-4: 450≤500kg</span>
          </button>
          <button onClick={() => handleRunWorkflow(5)} className="btn btn-secondary !py-2 text-[11px] font-mono justify-start text-left text-blue-400">
            <span>Step 5: Verify On Trip</span>
          </button>
          <button onClick={() => handleRunWorkflow(6)} className="btn btn-secondary !py-2 text-[11px] font-mono justify-start text-left text-emerald-400">
            <span>Step 6-7: Complete Trip</span>
          </button>
          <button onClick={() => handleRunWorkflow(8)} className="btn btn-secondary !py-2 text-[11px] font-mono justify-start text-left text-amber-400">
            <span>Step 8-9: Maint Lockout</span>
          </button>
        </div>

        {stepOutput && (
          <div className={`p-4 rounded-lg border text-xs flex items-start gap-3 ${
            stepOutput.success
              ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-300'
              : 'bg-red-500/10 border-red-500/30 text-red-300'
          }`}>
            {stepOutput.success ? <CheckCircle className="w-4 h-4 shrink-0 text-emerald-400 mt-0.5" /> : <AlertCircle className="w-4 h-4 shrink-0 text-red-400 mt-0.5" />}
            <div className="leading-relaxed">
              <strong className="text-white font-bold">{stepOutput.stepTitle}: </strong>
              <span>{stepOutput.result}</span>
            </div>
          </div>
        )}
      </div>

      {/* Trips Table */}
      <div className="card !p-0 overflow-hidden">
        <div className="p-4 border-b border-[#30363d] flex items-center justify-between">
          <h3 className="font-bold text-base text-white">All Active & Historical Trips</h3>
          <span className="text-xs font-mono text-gray-400">Total: {trips.length}</span>
        </div>
        <div className="table-container !border-none">
          <table className="table">
            <thead>
              <tr>
                <th>Trip Code</th>
                <th>Route / Destination</th>
                <th>Assigned Vehicle</th>
                <th>Assigned Driver</th>
                <th>Cargo / Distance</th>
                <th>Status</th>
                <th className="text-right">Actions</th>
              </tr>
            </thead>
            <tbody>
              {trips.length === 0 ? (
                <tr>
                  <td colSpan={7} className="text-center py-8 text-gray-500 text-xs">No trips created yet.</td>
                </tr>
              ) : (
                trips.map((t) => {
                  const veh = vehicles.find((v) => v.id === t.vehicleId);
                  const drv = drivers.find((d) => d.id === t.driverId);
                  return (
                    <tr key={t.id} className="hover:bg-[#21262d]">
                      <td className="font-mono font-bold text-orange-400 text-xs">{t.tripCode}</td>
                      <td>
                        <div className="text-xs font-semibold text-white">{t.source}</div>
                        <div className="text-[11px] text-gray-400 flex items-center gap-1 mt-0.5">
                          <ArrowRight className="w-3 h-3 text-orange-400" />
                          <span>{t.destination}</span>
                        </div>
                      </td>
                      <td>
                        <div className="text-xs font-semibold text-white">{veh?.registrationNumber || t.vehicleId}</div>
                        <div className="text-[10px] text-gray-400">{veh?.nameModel} ({veh?.maxLoadCapacity} kg max)</div>
                      </td>
                      <td>
                        <div className="text-xs font-semibold text-white">{drv?.name || t.driverId}</div>
                        <div className="text-[10px] font-mono text-gray-400">{drv?.licenseNumber}</div>
                      </td>
                      <td>
                        <div className="font-mono text-xs text-gray-200 font-semibold">{t.cargoWeight} kg</div>
                        <div className="font-mono text-[11px] text-gray-400">{t.plannedDistance} km</div>
                      </td>
                      <td>
                        <span className={`badge ${
                          t.status === 'Dispatched' ? 'badge-blue' :
                          t.status === 'Completed' ? 'badge-green' :
                          t.status === 'Cancelled' ? 'badge-red' : 'badge-orange'
                        }`}>
                          {t.status}
                        </span>
                      </td>
                      <td className="text-right space-x-2">
                        {t.status === 'Draft' && (
                          <>
                            <button
                              onClick={() => dispatchTrip(t.id)}
                              className="btn btn-primary !p-1.5 !px-3 text-xs font-bold"
                              title="Dispatch trip and change vehicle/driver to On Trip"
                            >
                              Dispatch
                            </button>
                            <button
                              onClick={() => cancelTrip(t.id)}
                              className="btn btn-danger !p-1.5 !px-2.5 text-xs"
                              title="Cancel draft"
                            >
                              Cancel
                            </button>
                          </>
                        )}

                        {t.status === 'Dispatched' && (
                          <>
                            <button
                              onClick={() => handleOpenCompleteModal(t)}
                              className="btn btn-secondary !p-1.5 !px-3 text-xs text-emerald-400 border-emerald-500/30 hover:bg-emerald-500/10 font-bold"
                              title="Complete trip and restore vehicle/driver to Available"
                            >
                              Complete
                            </button>
                            <button
                              onClick={() => cancelTrip(t.id)}
                              className="btn btn-danger !p-1.5 !px-2.5 text-xs"
                              title="Cancel and restore status to Available"
                            >
                              Cancel
                            </button>
                          </>
                        )}

                        {(t.status === 'Completed' || t.status === 'Cancelled') && (
                          <span className="text-[11px] text-gray-500 font-medium">Archived</span>
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

      {/* Modal: Create & Dispatch Trip matching capacity checks in Screenshot 4 */}
      {isCreateModalOpen && (
        <div className="modal-overlay">
          <div className="modal-content !p-6 space-y-5">
            <div className="flex items-center justify-between border-b border-[#30363d] pb-4">
              <div className="flex items-center gap-2">
                <Navigation className="w-5 h-5 text-orange-400" />
                <h3 className="font-bold text-lg text-white">Create & Dispatch New Trip</h3>
              </div>
              <button onClick={() => setIsCreateModalOpen(false)} className="text-gray-400 hover:text-white text-sm font-bold px-2 py-1">✕</button>
            </div>

            {formError && (
              <div className="p-3 rounded-lg bg-red-500/15 border border-red-500/30 text-red-400 text-xs flex items-center gap-2">
                <AlertCircle className="w-4 h-4 shrink-0" />
                <span>{formError}</span>
              </div>
            )}

            <form onSubmit={handleCreateSubmit} className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-gray-300 mb-1">Source Depot / Warehouse *</label>
                  <input
                    type="text"
                    required
                    value={source}
                    onChange={(e) => setSource(e.target.value)}
                    placeholder="e.g. Warehouse Depot (North)"
                    className="input"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-gray-300 mb-1">Destination Hub / Customer *</label>
                  <input
                    type="text"
                    required
                    value={destination}
                    onChange={(e) => setDestination(e.target.value)}
                    placeholder="e.g. Downtown Retail Hub"
                    className="input"
                  />
                </div>
              </div>

              {/* Vehicle & Driver Dropdowns */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-gray-300 mb-1">Select Vehicle (Only Available) *</label>
                  <select
                    value={vehicleId}
                    onChange={(e) => setVehicleId(e.target.value)}
                    className="select font-mono"
                  >
                    {vehicles.map((v) => (
                      <option
                        key={v.id}
                        value={v.id}
                        disabled={v.status !== 'Available'}
                        className="bg-[#161b22] text-white"
                      >
                        {v.registrationNumber} - {v.nameModel} ({v.maxLoadCapacity} kg max) [{v.status}]
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-semibold text-gray-300 mb-1">Select Driver (Only Valid & Available) *</label>
                  <select
                    value={driverId}
                    onChange={(e) => setDriverId(e.target.value)}
                    className="select"
                  >
                    {drivers.map((d) => {
                      const expired = d.licenseExpiryDate < todayStr;
                      const suspended = d.status === 'Suspended';
                      const notAvail = d.status !== 'Available';
                      const disabled = expired || suspended || notAvail;
                      return (
                        <option
                          key={d.id}
                          value={d.id}
                          disabled={disabled}
                          className="bg-[#161b22] text-white"
                        >
                          {d.name} ({d.licenseCategory}) [{d.status}{expired ? ' - EXPIRED' : ''}]
                        </option>
                      );
                    })}
                  </select>
                </div>
              </div>

              {/* Weight & Distance Inputs */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-gray-300 mb-1">Cargo Weight (kg) *</label>
                  <input
                    type="number"
                    required
                    min={1}
                    value={cargoWeight}
                    onChange={(e) => setCargoWeight(Number(e.target.value))}
                    className="input font-mono font-bold"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-gray-300 mb-1">Planned Distance (km) *</label>
                  <input
                    type="number"
                    required
                    min={1}
                    value={plannedDistance}
                    onChange={(e) => setPlannedDistance(Number(e.target.value))}
                    className="input font-mono"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-gray-300 mb-1">Initial Stage</label>
                  <select
                    value={initialStatus}
                    onChange={(e) => setInitialStatus(e.target.value as TripStatus)}
                    className="select"
                  >
                    <option value="Dispatched">Dispatched (Auto On Trip)</option>
                    <option value="Draft">Draft (Pending Review)</option>
                  </select>
                </div>
              </div>

              {/* Real-time validation verification callout matching Screenshot 4 */}
              <div className={`p-3.5 rounded-xl border text-xs flex items-center justify-between ${
                canDispatchRealtime
                  ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-300'
                  : 'bg-red-500/15 border-red-500/40 text-red-300'
              }`}>
                <div className="flex items-center gap-2">
                  {canDispatchRealtime ? <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" /> : <XCircle className="w-4 h-4 text-red-400 shrink-0" />}
                  <div>
                    {selectedVehicle ? (
                      cargoWeight <= selectedVehicle.maxLoadCapacity ? (
                        <span>Valid! Cargo Weight <strong>{cargoWeight} kg ≤ {selectedVehicle.maxLoadCapacity} kg</strong> max capacity of {selectedVehicle.registrationNumber}.</span>
                      ) : (
                        <span><strong className="text-white font-bold">Rule Exceeded!</strong> Cargo Weight ({cargoWeight} kg) exceeds {selectedVehicle.registrationNumber} max capacity ({selectedVehicle.maxLoadCapacity} kg)!</span>
                      )
                    ) : (
                      <span>Select an available vehicle.</span>
                    )}
                  </div>
                </div>
                <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${canDispatchRealtime ? 'bg-emerald-500/20 text-emerald-300' : 'bg-red-500/20 text-red-300'}`}>
                  {canDispatchRealtime ? 'READY FOR DISPATCH' : 'DISPATCH BLOCKED'}
                </span>
              </div>

              <div className="flex items-center justify-end gap-3 pt-4 border-t border-[#30363d]">
                <button type="button" onClick={() => setIsCreateModalOpen(false)} className="btn btn-secondary !py-2 text-xs">
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={!canDispatchRealtime}
                  className={`btn btn-primary !py-2 !px-6 text-xs font-bold ${!canDispatchRealtime ? 'opacity-50 cursor-not-allowed' : ''}`}
                >
                  Confirm & Dispatch
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal: Complete Trip (enter final odometer and fuel consumed) */}
      {isCompleteModalOpen && selectedTripForComplete && (
        <div className="modal-overlay">
          <div className="modal-content !p-6 space-y-5">
            <div className="flex items-center justify-between border-b border-[#30363d] pb-4">
              <div className="flex items-center gap-2">
                <CheckCircle className="w-5 h-5 text-emerald-400" />
                <h3 className="font-bold text-lg text-white">Complete Trip ({selectedTripForComplete.tripCode})</h3>
              </div>
              <button onClick={() => setIsCompleteModalOpen(false)} className="text-gray-400 hover:text-white text-sm font-bold px-2 py-1">✕</button>
            </div>

            <p className="text-xs text-gray-400">
              Entering the final odometer and fuel consumed will automatically restore BOTH the assigned Vehicle and Driver to <strong>Available</strong> status and record the fuel log.
            </p>

            {completeError && (
              <div className="p-3 rounded-lg bg-red-500/15 border border-red-500/30 text-red-400 text-xs flex items-center gap-2">
                <AlertCircle className="w-4 h-4 shrink-0" />
                <span>{completeError}</span>
              </div>
            )}

            <form onSubmit={handleCompleteSubmit} className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-gray-300 mb-1">Final Odometer Reading (km) *</label>
                  <input
                    type="number"
                    required
                    value={finalOdometer}
                    onChange={(e) => setFinalOdometer(Number(e.target.value))}
                    className="input font-mono font-bold"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-gray-300 mb-1">Fuel Consumed on Trip (Liters) *</label>
                  <input
                    type="number"
                    required
                    min={0}
                    step="0.1"
                    value={fuelConsumed}
                    onChange={(e) => setFuelConsumed(Number(e.target.value))}
                    className="input font-mono"
                  />
                </div>
              </div>

              <div className="flex items-center justify-end gap-3 pt-4 border-t border-[#30363d]">
                <button type="button" onClick={() => setIsCompleteModalOpen(false)} className="btn btn-secondary !py-2 text-xs">
                  Cancel
                </button>
                <button type="submit" className="btn btn-primary !py-2 !px-6 text-xs font-bold !bg-emerald-600 hover:!bg-emerald-500">
                  Complete & Restore Status
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
