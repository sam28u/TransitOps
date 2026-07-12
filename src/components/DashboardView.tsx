import React, { useState } from 'react';
import { useTransit } from '../context/TransitContext';
import {
  Truck, CheckCircle, Wrench, Navigation, Clock, UserCheck, Percent,
  Filter, ArrowUpRight, Plus, Search, Sparkles, Activity
} from 'lucide-react';

export const DashboardView: React.FC<{ onNavigate: (tab: string) => void }> = ({ onNavigate }) => {
  const { vehicles, drivers, trips } = useTransit();

  const [filterType, setFilterType] = useState<string>('All');
  const [filterStatus, setFilterStatus] = useState<string>('All');
  const [filterRegion, setFilterRegion] = useState<string>('All');
  const [localSearch, setLocalSearch] = useState<string>('');

  const filteredVehicles = vehicles.filter((v) => {
    if (filterType !== 'All' && v.type !== filterType) return false;
    if (filterStatus !== 'All' && v.status !== filterStatus) return false;
    if (filterRegion !== 'All' && v.region !== filterRegion) return false;
    if (localSearch) {
      const q = localSearch.toLowerCase();
      if (!v.registrationNumber.toLowerCase().includes(q) && !v.nameModel.toLowerCase().includes(q)) return false;
    }
    return true;
  });

  const totalVehiclesCount = vehicles.length;
  const activeVehicles = vehicles.filter((v) => v.status !== 'Retired');
  const availableVehicles = vehicles.filter((v) => v.status === 'Available');
  const maintenanceVehicles = vehicles.filter((v) => v.status === 'In Shop');
  const activeTrips = trips.filter((t) => t.status === 'Dispatched');
  const pendingTrips = trips.filter((t) => t.status === 'Draft');
  const driversOnDuty = drivers.filter((d) => d.status === 'Available' || d.status === 'On Trip');

  const vehiclesOnTrip = vehicles.filter((v) => v.status === 'On Trip');
  const fleetUtilization = activeVehicles.length > 0
    ? Math.round((vehiclesOnTrip.length / activeVehicles.length) * 100)
    : 0;

  const statusCounts = {
    Available: vehicles.filter(v => v.status === 'Available').length,
    'On Trip': vehicles.filter(v => v.status === 'On Trip').length,
    'In Shop': vehicles.filter(v => v.status === 'In Shop').length,
    Retired: vehicles.filter(v => v.status === 'Retired').length,
  };

  const recentTrips = trips.slice(0, 5);

  return (
    <div className="space-y-6">
      {/* Title & Top Filter Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-[#131824] p-5 rounded-xl border border-[#222a3d]">
        <div>
          <div className="flex items-center gap-2.5">
            <h2 className="text-xl font-bold text-white tracking-tight">Fleet Operations Dashboard</h2>
            <span className="badge badge-orange !px-2.5 !py-0.5 !text-[11px]">Live</span>
          </div>
          <p className="text-xs text-slate-400 mt-1">Real-time telemetry across {filteredVehicles.length} assets and active dispatches</p>
        </div>

        {/* Filters Pool */}
        <div className="flex flex-wrap items-center gap-2.5 bg-[#0b0f17] p-2 rounded-lg border border-[#222a3d]">
          <div className="flex items-center gap-1.5 px-2 text-xs text-slate-400 font-semibold">
            <Filter className="w-3.5 h-3.5 text-orange-400" />
            <span>Filters:</span>
          </div>

          <div className="relative w-44">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-400" />
            <input
              type="text"
              placeholder="Search registration..."
              value={localSearch}
              onChange={(e) => setLocalSearch(e.target.value)}
              className="input !pl-9 !py-1.5 !text-xs !bg-[#131824] !border-[#222a3d]"
            />
          </div>

          <select
            value={filterType}
            onChange={(e) => setFilterType(e.target.value)}
            className="bg-[#131824] text-xs font-medium text-slate-200 px-3 py-1.5 rounded-md border border-[#222a3d] outline-none cursor-pointer hover:border-[#333f57] transition-colors"
          >
            <option value="All">All Types</option>
            <option value="Van">Van</option>
            <option value="Truck">Truck</option>
            <option value="Refrigerated Truck">Refrigerated Truck</option>
            <option value="Trailer">Trailer</option>
            <option value="Pickup">Pickup</option>
            <option value="Bike">Bike</option>
          </select>

          <select
            value={filterStatus}
            onChange={(e) => setFilterStatus(e.target.value)}
            className="bg-[#131824] text-xs font-medium text-slate-200 px-3 py-1.5 rounded-md border border-[#222a3d] outline-none cursor-pointer hover:border-[#333f57] transition-colors"
          >
            <option value="All">All Statuses</option>
            <option value="Available">Available</option>
            <option value="On Trip">On Trip</option>
            <option value="In Shop">In Shop</option>
            <option value="Retired">Retired</option>
          </select>

          <select
            value={filterRegion}
            onChange={(e) => setFilterRegion(e.target.value)}
            className="bg-[#131824] text-xs font-medium text-slate-200 px-3 py-1.5 rounded-md border border-[#222a3d] outline-none cursor-pointer hover:border-[#333f57] transition-colors"
          >
            <option value="All">All Regions</option>
            <option value="North">North</option>
            <option value="South">South</option>
            <option value="East">East</option>
            <option value="West">West</option>
          </select>
        </div>
      </div>

      {/* KPI Cards Row */}
      <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-7 gap-4">
        <div className="card !p-4 flex flex-col justify-between">
          <div className="flex items-center justify-between text-slate-400">
            <span className="text-[11px] font-semibold uppercase tracking-wider">Active Fleet</span>
            <div className="p-1.5 rounded-md bg-[#1a2130] text-orange-400">
              <Truck className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-4 flex items-baseline justify-between">
            <span className="text-2xl font-bold text-white font-mono">{activeVehicles.length}</span>
            <span className="text-[11px] text-slate-400">Pool: {totalVehiclesCount}</span>
          </div>
        </div>

        <div className="card !p-4 flex flex-col justify-between">
          <div className="flex items-center justify-between text-slate-400">
            <span className="text-[11px] font-semibold uppercase tracking-wider">Available</span>
            <div className="p-1.5 rounded-md bg-[#1a2130] text-emerald-400">
              <CheckCircle className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-4 flex items-baseline justify-between">
            <span className="text-2xl font-bold text-white font-mono">{availableVehicles.length}</span>
            <span className="text-[11px] text-emerald-400 font-semibold">Ready</span>
          </div>
        </div>

        <div className="card !p-4 flex flex-col justify-between">
          <div className="flex items-center justify-between text-slate-400">
            <span className="text-[11px] font-semibold uppercase tracking-wider">In Shop</span>
            <div className="p-1.5 rounded-md bg-[#1a2130] text-amber-400">
              <Wrench className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-4 flex items-baseline justify-between">
            <span className="text-2xl font-bold text-white font-mono">{maintenanceVehicles.length}</span>
            <span className="text-[11px] text-amber-400 font-semibold">Workshop</span>
          </div>
        </div>

        <div className="card !p-4 flex flex-col justify-between">
          <div className="flex items-center justify-between text-slate-400">
            <span className="text-[11px] font-semibold uppercase tracking-wider">On Trip</span>
            <div className="p-1.5 rounded-md bg-[#1a2130] text-blue-400">
              <Navigation className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-4 flex items-baseline justify-between">
            <span className="text-2xl font-bold text-white font-mono">{activeTrips.length}</span>
            <span className="text-[11px] text-blue-400 font-semibold">Dispatched</span>
          </div>
        </div>

        <div className="card !p-4 flex flex-col justify-between">
          <div className="flex items-center justify-between text-slate-400">
            <span className="text-[11px] font-semibold uppercase tracking-wider">Draft Trips</span>
            <div className="p-1.5 rounded-md bg-[#1a2130] text-purple-400">
              <Clock className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-4 flex items-baseline justify-between">
            <span className="text-2xl font-bold text-white font-mono">{pendingTrips.length}</span>
            <span className="text-[11px] text-purple-400 font-semibold">Pending</span>
          </div>
        </div>

        <div className="card !p-4 flex flex-col justify-between">
          <div className="flex items-center justify-between text-slate-400">
            <span className="text-[11px] font-semibold uppercase tracking-wider">Drivers Duty</span>
            <div className="p-1.5 rounded-md bg-[#1a2130] text-cyan-400">
              <UserCheck className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-4 flex items-baseline justify-between">
            <span className="text-2xl font-bold text-white font-mono">{driversOnDuty.length}</span>
            <span className="text-[11px] text-slate-400 font-medium">/ {drivers.length} total</span>
          </div>
        </div>

        <div className="card !p-4 flex flex-col justify-between bg-[#1a2130] border-orange-500/30">
          <div className="flex items-center justify-between text-slate-300">
            <span className="text-[11px] font-bold uppercase tracking-wider text-orange-400">Utilization</span>
            <div className="p-1.5 rounded-md bg-orange-500/20 text-orange-400">
              <Percent className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-4 flex items-baseline justify-between">
            <span className="text-2xl font-bold text-white font-mono">{fleetUtilization}%</span>
            <span className="text-[11px] text-orange-400 font-semibold">Optimal</span>
          </div>
        </div>
      </div>

      {/* Main Content Grid */}
      <div className="dashboard-grid">
        {/* Left: Recent Trips Table */}
        <div className="card space-y-4">
          <div className="flex items-center justify-between border-b border-[#222a3d] pb-4">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-[#1a2130] text-blue-400">
                <Activity className="w-4 h-4" />
              </div>
              <div>
                <h3 className="font-bold text-base text-white tracking-tight">Active Dispatches & Recent Trips</h3>
                <p className="text-xs text-slate-400">Latest transport telemetry and lifecycle updates</p>
              </div>
            </div>
            <button
              onClick={() => onNavigate('trips')}
              className="btn btn-secondary !px-3.5 !py-1.5 !text-xs flex items-center gap-1.5 text-orange-400 hover:text-orange-300 font-semibold"
            >
              <span>Dispatch Center</span>
              <ArrowUpRight className="w-3.5 h-3.5" />
            </button>
          </div>

          <div className="table-container !border-none">
            <table className="table">
              <thead>
                <tr>
                  <th>Trip Code</th>
                  <th>Vehicle</th>
                  <th>Route / Destination</th>
                  <th>Cargo Load</th>
                  <th>Status</th>
                </tr>
              </thead>
              <tbody>
                {recentTrips.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="text-center py-8 text-slate-500 text-xs">No recent trips found.</td>
                  </tr>
                ) : (
                  recentTrips.map((t) => {
                    const vehicle = vehicles.find((v) => v.id === t.vehicleId);
                    return (
                      <tr key={t.id} className="cursor-pointer" onClick={() => onNavigate('trips')}>
                        <td className="font-mono font-semibold text-orange-400 text-xs">{t.tripCode}</td>
                        <td className="font-semibold text-white text-xs">{vehicle?.registrationNumber || t.vehicleId}</td>
                        <td className="text-slate-300 truncate max-w-[180px] font-medium text-xs">{t.destination}</td>
                        <td className="font-mono text-slate-400 text-xs">{t.cargoWeight} kg</td>
                        <td>
                          <span className={`badge ${
                            t.status === 'Dispatched' ? 'badge-blue' :
                            t.status === 'Completed' ? 'badge-green' :
                            t.status === 'Cancelled' ? 'badge-red' : 'badge-orange'
                          }`}>
                            {t.status}
                          </span>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Right: Vehicle Status & Actions */}
        <div className="space-y-6">
          <div className="card space-y-4">
            <div className="border-b border-[#222a3d] pb-4 flex items-center justify-between">
              <div>
                <h3 className="font-bold text-base text-white tracking-tight">Fleet Status Breakdown</h3>
                <p className="text-xs text-slate-400">Asset distribution across {totalVehiclesCount} total vehicles</p>
              </div>
              <Sparkles className="w-4 h-4 text-orange-400" />
            </div>

            <div className="space-y-4 pt-1">
              <div>
                <div className="flex justify-between text-xs font-semibold mb-1.5">
                  <span className="text-emerald-400 flex items-center gap-2">
                    <span className="w-2 h-2 rounded-full bg-emerald-400"></span> Available Pool
                  </span>
                  <span className="text-white font-mono">{statusCounts.Available} / {totalVehiclesCount}</span>
                </div>
                <div className="progress-bar-bg">
                  <div className="progress-bar-fill bg-emerald-500" style={{ width: `${(statusCounts.Available / totalVehiclesCount) * 100}%` }}></div>
                </div>
              </div>

              <div>
                <div className="flex justify-between text-xs font-semibold mb-1.5">
                  <span className="text-blue-400 flex items-center gap-2">
                    <span className="w-2 h-2 rounded-full bg-blue-400"></span> Dispatched On Trip
                  </span>
                  <span className="text-white font-mono">{statusCounts['On Trip']} / {totalVehiclesCount}</span>
                </div>
                <div className="progress-bar-bg">
                  <div className="progress-bar-fill bg-blue-500" style={{ width: `${(statusCounts['On Trip'] / totalVehiclesCount) * 100}%` }}></div>
                </div>
              </div>

              <div>
                <div className="flex justify-between text-xs font-semibold mb-1.5">
                  <span className="text-amber-400 flex items-center gap-2">
                    <span className="w-2 h-2 rounded-full bg-amber-400"></span> In Workshop (Locked)
                  </span>
                  <span className="text-white font-mono">{statusCounts['In Shop']} / {totalVehiclesCount}</span>
                </div>
                <div className="progress-bar-bg">
                  <div className="progress-bar-fill bg-amber-500" style={{ width: `${(statusCounts['In Shop'] / totalVehiclesCount) * 100}%` }}></div>
                </div>
              </div>

              <div>
                <div className="flex justify-between text-xs font-semibold mb-1.5">
                  <span className="text-red-400 flex items-center gap-2">
                    <span className="w-2 h-2 rounded-full bg-red-400"></span> Retired Assets
                  </span>
                  <span className="text-white font-mono">{statusCounts.Retired} / {totalVehiclesCount}</span>
                </div>
                <div className="progress-bar-bg">
                  <div className="progress-bar-fill bg-red-500" style={{ width: `${(statusCounts.Retired / totalVehiclesCount) * 100}%` }}></div>
                </div>
              </div>
            </div>
          </div>

          <div className="card bg-[#1a2130] border border-[#232b3e] space-y-3">
            <div className="flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-orange-400 shrink-0" />
              <h4 className="font-bold text-sm text-white">Quick Actions & Workflow</h4>
            </div>
            <p className="text-xs text-slate-300 leading-relaxed">Create a new dispatch or step through automated verification rules.</p>
            <div className="flex gap-2.5 pt-1">
              <button
                onClick={() => onNavigate('trips')}
                className="btn btn-primary flex-1 !py-2.5 text-xs font-semibold"
              >
                <Plus className="w-4 h-4" />
                <span>Dispatch Trip</span>
              </button>
              <button
                onClick={() => onNavigate('fleet')}
                className="btn btn-secondary flex-1 !py-2.5 text-xs font-semibold"
              >
                <span>+ Register Vehicle</span>
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
