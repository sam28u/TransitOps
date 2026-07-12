import React, { useState } from 'react';
import { useTransit } from '../context/TransitContext';
import {
  Truck, CheckCircle, Navigation, UserCheck, Percent,
  Filter, Plus, Search, Sparkles, Activity, AlertTriangle,
  ShieldAlert, ShieldCheck, Map, ArrowRight, ArrowUpRight
} from 'lucide-react';

export const DashboardView: React.FC<{ onNavigate: (tab: string) => void }> = ({ onNavigate }) => {
  const { vehicles, drivers, trips, maintenanceLogs } = useTransit();

  const [filterType, setFilterType] = useState<string>('All');
  const [filterStatus, setFilterStatus] = useState<string>('All');
  const [filterRegion, setFilterRegion] = useState<string>('All');
  const [localSearch, setLocalSearch] = useState<string>('');

  const filteredTrips = trips.filter((t) => {
    const vehicle = vehicles.find((v) => v.id === t.vehicleId);
    if (!vehicle) return false;

    if (filterType !== 'All' && vehicle.type !== filterType) return false;
    if (filterStatus !== 'All' && t.status !== filterStatus) return false;
    if (filterRegion !== 'All' && vehicle.region !== filterRegion) return false;

    if (localSearch) {
      const q = localSearch.toLowerCase();
      if (
        !t.tripCode.toLowerCase().includes(q) &&
        !vehicle.registrationNumber.toLowerCase().includes(q) &&
        !t.source.toLowerCase().includes(q) &&
        !t.destination.toLowerCase().includes(q)
      ) {
        return false;
      }
    }
    return true;
  });

  // KPI Calculations
  const totalVehiclesCount = vehicles.length;
  const activeVehicles = vehicles.filter((v) => v.status !== 'Retired');
  const availableVehicles = vehicles.filter((v) => v.status === 'Available');
  const maintenanceVehicles = vehicles.filter((v) => v.status === 'In Shop');
  const activeTrips = trips.filter((t) => t.status === 'Dispatched');
  const completedTripsCount = trips.filter((t) => t.status === 'Completed').length;
  const pendingTrips = trips.filter((t) => t.status === 'Draft');
  const driversOnDuty = drivers.filter((d) => d.status === 'Available' || d.status === 'On Trip');

  const vehiclesOnTrip = vehicles.filter((v) => v.status === 'On Trip');
  const fleetUtilization = activeVehicles.length > 0
    ? Math.round((vehiclesOnTrip.length / activeVehicles.length) * 100)
    : 0;

  // Live Compliance & Alert checks
  const alerts: Array<{ id: string; type: 'warning' | 'danger' | 'info'; title: string; message: string; tag?: string }> = [];

  // Check driver licenses expiring soon
  const today = new Date();
  drivers.forEach(d => {
    const expiry = new Date(d.licenseExpiryDate);
    const diffTime = expiry.getTime() - today.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    
    if (diffDays < 0) {
      alerts.push({
        id: `alert-lic-exp-${d.id}`,
        type: 'danger',
        title: 'Expired License',
        message: `Driver ${d.name} license is EXPIRED. Cannot assign to trips!`,
        tag: 'Safety Compliance'
      });
    } else if (diffDays <= 30) {
      alerts.push({
        id: `alert-lic-exp-${d.id}`,
        type: 'warning',
        title: 'License Expiring Soon',
        message: `Driver ${d.name} license expires in ${diffDays} days (${d.licenseExpiryDate}).`,
        tag: 'Safety Compliance'
      });
    }

    if (d.safetyScore < 85) {
      alerts.push({
        id: `alert-safety-${d.id}`,
        type: 'warning',
        title: 'Low Safety Score Alert',
        message: `Driver ${d.name} safety score is low (${d.safetyScore}/100). Needs coaching.`,
        tag: 'Safety'
      });
    }
  });

  // Check critical maintenance logs
  maintenanceLogs.filter(m => m.status === 'In Progress').forEach(m => {
    const vehicle = vehicles.find(v => v.id === m.vehicleId);
    alerts.push({
      id: `alert-maint-${m.id}`,
      type: 'info',
      title: 'Vehicle in Workshop',
      message: `${vehicle?.registrationNumber || 'Vehicle'} is undergoing ${m.serviceDescription}.`,
      tag: 'Workshop'
    });
  });

  const recentTrips = filteredTrips.slice(0, 5);

  return (
    <div className="space-y-6">
      {/* Title & Top Filter Bar */}
      <div className="flex flex-col xl:flex-row xl:items-center justify-between gap-4 bg-gradient-to-r from-[#131824] to-[#181f2e] p-5 rounded-xl border border-[#222a3d] shadow-lg shadow-black/20">
        <div>
          <div className="flex items-center gap-2.5">
            <h2 className="text-xl font-extrabold text-white tracking-tight">Fleet Operations Dashboard</h2>
            <span className="badge badge-orange !px-2.5 !py-0.5 !text-[11px] font-mono animate-pulse">Live Feed</span>
          </div>
          <p className="text-xs text-slate-400 mt-1">Real-time telemetry across {totalVehiclesCount} assets and active dispatches</p>
        </div>

        {/* Filters Pool */}
        <div className="flex flex-wrap items-center gap-2.5 bg-[#0b0f17]/80 p-2 rounded-xl border border-[#222a3d]">
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
              className="input !pl-9 !py-1.5 !text-xs !bg-[#131824] !border-[#222a3d] focus:!border-orange-500"
            />
          </div>

          <select
            value={filterType}
            onChange={(e) => setFilterType(e.target.value)}
            className="bg-[#131824] text-xs font-semibold text-slate-300 px-3 py-1.5 rounded-lg border border-[#222a3d] outline-none cursor-pointer hover:border-[#333f57] hover:bg-[#1a2130] transition-colors"
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
            className="bg-[#131824] text-xs font-semibold text-slate-300 px-3 py-1.5 rounded-lg border border-[#222a3d] outline-none cursor-pointer hover:border-[#333f57] hover:bg-[#1a2130] transition-colors"
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
            className="bg-[#131824] text-xs font-semibold text-slate-300 px-3 py-1.5 rounded-lg border border-[#222a3d] outline-none cursor-pointer hover:border-[#333f57] hover:bg-[#1a2130] transition-colors"
          >
            <option value="All">All Regions</option>
            <option value="North">North</option>
            <option value="South">South</option>
            <option value="East">East</option>
            <option value="West">West</option>
          </select>
        </div>
      </div>

      {/* Modern Enriched KPI Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Card 1: Active Fleet */}
        <div className="card-interactive bg-gradient-to-br from-[#131824] to-[#162032] border border-[#222a3d] p-5 flex flex-col justify-between relative overflow-hidden group">
          <div className="absolute right-0 top-0 translate-x-3 -translate-y-3 w-24 h-24 bg-orange-500/5 rounded-full blur-xl group-hover:bg-orange-500/10 transition-all duration-300"></div>
          <div className="flex items-center justify-between text-slate-400 z-10">
            <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400">Active Fleet Pool</span>
            <div className="p-2 rounded-lg bg-[#1a2130] text-orange-400 group-hover:scale-110 transition-transform duration-300">
              <Truck className="w-4.5 h-4.5" />
            </div>
          </div>
          <div className="mt-5 flex items-baseline justify-between z-10">
            <div>
              <span className="text-3xl font-extrabold text-white font-mono leading-none">{activeVehicles.length}</span>
              <span className="text-xs text-slate-400 ml-1.5">/ {totalVehiclesCount} registered</span>
            </div>
            <span className="text-[11px] bg-orange-500/10 text-orange-400 px-2 py-0.5 rounded font-mono font-semibold">Active</span>
          </div>
        </div>

        {/* Card 2: Active Dispatches */}
        <div className="card-interactive bg-gradient-to-br from-[#131824] to-[#12222a] border border-[#222a3d] p-5 flex flex-col justify-between relative overflow-hidden group">
          <div className="absolute right-0 top-0 translate-x-3 -translate-y-3 w-24 h-24 bg-blue-500/5 rounded-full blur-xl group-hover:bg-blue-500/10 transition-all duration-300"></div>
          <div className="flex items-center justify-between text-slate-400 z-10">
            <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400">Active Dispatches</span>
            <div className="p-2 rounded-lg bg-[#1a2130] text-blue-400 group-hover:scale-110 transition-transform duration-300">
              <Navigation className="w-4.5 h-4.5" />
            </div>
          </div>
          <div className="mt-5 flex items-baseline justify-between z-10">
            <div>
              <span className="text-3xl font-extrabold text-white font-mono leading-none">{activeTrips.length}</span>
              <span className="text-xs text-slate-400 ml-1.5">on road</span>
            </div>
            <span className="text-[11px] bg-blue-500/10 text-blue-400 px-2 py-0.5 rounded font-mono font-semibold">Dispatched</span>
          </div>
        </div>

        {/* Card 3: Utilization */}
        <div className="card-interactive bg-gradient-to-br from-[#131824] to-[#162423] border border-[#222a3d] p-5 flex flex-col justify-between relative overflow-hidden group">
          <div className="absolute right-0 top-0 translate-x-3 -translate-y-3 w-24 h-24 bg-emerald-500/5 rounded-full blur-xl group-hover:bg-emerald-500/10 transition-all duration-300"></div>
          <div className="flex items-center justify-between text-slate-400 z-10">
            <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400">Fleet Utilization</span>
            <div className="p-2 rounded-lg bg-[#1a2130] text-emerald-400 group-hover:scale-110 transition-transform duration-300">
              <Percent className="w-4.5 h-4.5" />
            </div>
          </div>
          <div className="mt-5 z-10">
            <div className="flex items-baseline justify-between mb-2">
              <span className="text-3xl font-extrabold text-white font-mono leading-none">{fleetUtilization}%</span>
              <span className="text-[10px] text-emerald-400 font-bold flex items-center gap-0.5">
                <CheckCircle className="w-3 h-3" /> Optimal
              </span>
            </div>
            <div className="progress-bar-bg !h-1.5">
              <div className="progress-bar-fill bg-emerald-500" style={{ width: `${fleetUtilization}%` }}></div>
            </div>
          </div>
        </div>

        {/* Card 4: Compliance Duty */}
        <div className="card-interactive bg-gradient-to-br from-[#131824] to-[#221626] border border-[#222a3d] p-5 flex flex-col justify-between relative overflow-hidden group">
          <div className="absolute right-0 top-0 translate-x-3 -translate-y-3 w-24 h-24 bg-purple-500/5 rounded-full blur-xl group-hover:bg-purple-500/10 transition-all duration-300"></div>
          <div className="flex items-center justify-between text-slate-400 z-10">
            <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400">Operators Duty Status</span>
            <div className="p-2 rounded-lg bg-[#1a2130] text-purple-400 group-hover:scale-110 transition-transform duration-300">
              <UserCheck className="w-4.5 h-4.5" />
            </div>
          </div>
          <div className="mt-5 flex items-baseline justify-between z-10">
            <div>
              <span className="text-3xl font-extrabold text-white font-mono leading-none">{driversOnDuty.length}</span>
              <span className="text-xs text-slate-400 ml-1.5">/ {drivers.length} active</span>
            </div>
            <span className="text-[11px] bg-purple-500/10 text-purple-400 px-2 py-0.5 rounded font-mono font-semibold">Ready</span>
          </div>
        </div>
      </div>

      {/* Mini status pills bar (non-crowded row) */}
      <div className="flex flex-wrap items-center gap-3 bg-[#131824]/60 p-3 rounded-xl border border-[#222a3d] text-xs">
        <span className="text-slate-400 font-bold uppercase tracking-wider text-[10px] px-2 border-r border-[#222a3d]">Status Details</span>
        
        <div className="flex items-center gap-1.5 px-3 py-1 bg-[#0b0f17] rounded-lg border border-[#222a3d]">
          <span className="w-2 h-2 rounded-full bg-emerald-400"></span>
          <span className="text-slate-300 font-mono"><strong className="text-white">{availableVehicles.length}</strong> Available Vehicles</span>
        </div>

        <div className="flex items-center gap-1.5 px-3 py-1 bg-[#0b0f17] rounded-lg border border-[#222a3d]">
          <span className="w-2 h-2 rounded-full bg-amber-400"></span>
          <span className="text-slate-300 font-mono"><strong className="text-white">{maintenanceVehicles.length}</strong> In Workshop</span>
        </div>

        <div className="flex items-center gap-1.5 px-3 py-1 bg-[#0b0f17] rounded-lg border border-[#222a3d]">
          <span className="w-2 h-2 rounded-full bg-purple-400"></span>
          <span className="text-slate-300 font-mono"><strong className="text-white">{pendingTrips.length}</strong> Pending Drafts</span>
        </div>

        <div className="flex items-center gap-1.5 px-3 py-1 bg-[#0b0f17] rounded-lg border border-[#222a3d]">
          <span className="w-2 h-2 rounded-full bg-cyan-400"></span>
          <span className="text-slate-300 font-mono"><strong className="text-white">{completedTripsCount}</strong> Completed Jobs</span>
        </div>
      </div>

      {/* Enriched Dashboard Grid Layout */}
      <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
        {/* Left Section: Active Trips & CSS Live Map (Col-span 2) */}
        <div className="xl:col-span-2 space-y-6">
          {/* Active Dispatches */}
          <div className="card space-y-4 shadow-lg shadow-black/10">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-[#222a3d] pb-4">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-[#1a2130] text-blue-400">
                  <Activity className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="font-bold text-base text-white tracking-tight">Active Dispatches & Transit Telemetry</h3>
                  <p className="text-xs text-slate-400">Real-time transport routes, loading status, and milestones</p>
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
                    <th>Destination & Route Progress</th>
                    <th>Cargo Load</th>
                    <th>Status</th>
                  </tr>
                </thead>
                <tbody>
                  {recentTrips.length === 0 ? (
                    <tr>
                      <td colSpan={5} className="text-center py-10 text-slate-500 text-xs">No active or recent trips registered. Go to Dispatch Center to dispatch a trip.</td>
                    </tr>
                  ) : (
                    recentTrips.map((t) => {
                      const vehicle = vehicles.find((v) => v.id === t.vehicleId);
                      
                      // Simulated distance progress percentage based on planned distance
                      const progressPct = t.status === 'Completed' ? 100 : t.status === 'Dispatched' ? 60 : 0;

                      return (
                        <tr key={t.id} className="hover:bg-[#181f2e]/40 transition-colors cursor-pointer" onClick={() => onNavigate('trips')}>
                          <td className="align-middle">
                            <span className="font-mono font-bold text-orange-400 text-xs">{t.tripCode}</span>
                            <span className="block text-[10px] text-slate-500 font-mono mt-0.5">{t.createdAt.split(' ')[0]}</span>
                          </td>
                          <td className="align-middle">
                            <div className="font-bold text-white text-xs">{vehicle?.registrationNumber || t.vehicleId}</div>
                            <div className="text-[10px] text-slate-400 truncate max-w-[120px]">{vehicle?.nameModel}</div>
                          </td>
                          <td className="align-middle py-3 min-w-[200px]">
                            <div className="flex items-center justify-between text-xs mb-1.5">
                              <span className="text-slate-400 font-medium truncate max-w-[130px]">{t.source}</span>
                              <ArrowRight className="w-3 h-3 text-slate-600" />
                              <span className="text-slate-200 font-semibold truncate max-w-[130px]">{t.destination}</span>
                            </div>
                            
                            {/* Visual Transit Progress Bar */}
                            <div className="relative">
                              <div className="progress-bar-bg !h-1.5">
                                <div 
                                  className={`progress-bar-fill ${
                                    t.status === 'Completed' ? 'bg-emerald-500' :
                                    t.status === 'Cancelled' ? 'bg-red-500' : 'bg-gradient-to-r from-blue-500 to-indigo-400'
                                  }`} 
                                  style={{ width: `${progressPct}%` }}
                                ></div>
                              </div>
                              {/* Indicator Dots */}
                              <div className="absolute top-1/2 -translate-y-1/2 left-0 w-2.5 h-2.5 rounded-full bg-emerald-500 border-2 border-[#131824]"></div>
                              <div className={`absolute top-1/2 -translate-y-1/2 right-0 w-2.5 h-2.5 rounded-full border-2 border-[#131824] ${t.status === 'Completed' ? 'bg-emerald-500' : 'bg-slate-700'}`}></div>
                              {t.status === 'Dispatched' && (
                                <div 
                                  className="absolute top-1/2 -translate-y-1/2 w-3 h-3 rounded-full bg-blue-400 border-2 border-[#131824] shadow-md shadow-blue-500/50 animate-ping"
                                  style={{ left: `calc(${progressPct}% - 6px)` }}
                                ></div>
                              )}
                            </div>
                          </td>
                          <td className="align-middle">
                            <span className="font-mono text-slate-300 font-semibold text-xs">{t.cargoWeight} kg</span>
                            <span className="block text-[10px] text-slate-500 font-mono">Capacity: {vehicle?.maxLoadCapacity || 0} kg</span>
                          </td>
                          <td className="align-middle">
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

          {/* Interactive CSS Live Radar/Transit Tracking mock panel */}
          <div className="card space-y-4 bg-gradient-to-br from-[#131824] to-[#0c121e]">
            <div className="border-b border-[#222a3d] pb-4 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-[#1a2130] text-emerald-400">
                  <Map className="w-4 h-4" />
                </div>
                <div>
                  <h4 className="font-bold text-base text-white tracking-tight">Active Route Map & Live Radar</h4>
                  <p className="text-xs text-slate-400">Live operational tracking visualizer of dispatch corridors</p>
                </div>
              </div>
              <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-emerald-500/10 text-emerald-400 text-xs font-mono font-bold">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-ping"></span> Live Radar
              </span>
            </div>

            {/* Simulated Map Widget */}
            <div className="h-64 relative bg-[#070b12] rounded-xl border border-[#222a3d] overflow-hidden flex items-center justify-center">
              {/* Map grid lines */}
              <div className="absolute inset-0 bg-[linear-gradient(to_right,#131926_1px,transparent_1px),linear-gradient(to_bottom,#131926_1px,transparent_1px)] bg-[size:32px_32px] opacity-40"></div>
              
              {/* Radar circles */}
              <div className="absolute w-44 h-44 border border-blue-500/10 rounded-full animate-pulse"></div>
              <div className="absolute w-80 h-80 border border-blue-500/5 rounded-full"></div>
              
              {/* Regional hubs and corridors */}
              {/* North Hub */}
              <div className="absolute top-10 left-1/2 -translate-x-1/2 flex flex-col items-center">
                <div className="w-3 h-3 bg-orange-500 rounded-full shadow-md shadow-orange-500/50"></div>
                <span className="text-[10px] text-slate-400 mt-1 font-mono">North Hub</span>
              </div>
              
              {/* West Hub */}
              <div className="absolute top-1/2 -translate-y-1/2 left-10 flex flex-col items-center">
                <div className="w-3 h-3 bg-blue-500 rounded-full shadow-md shadow-blue-500/50"></div>
                <span className="text-[10px] text-slate-400 mt-1 font-mono">West Terminal</span>
              </div>

              {/* South Hub */}
              <div className="absolute bottom-10 left-1/3 flex flex-col items-center">
                <div className="w-3 h-3 bg-emerald-500 rounded-full shadow-md shadow-emerald-500/50"></div>
                <span className="text-[10px] text-slate-400 mt-1 font-mono">South Hub</span>
              </div>

              {/* East Hub */}
              <div className="absolute top-1/3 right-14 flex flex-col items-center">
                <div className="w-3 h-3 bg-purple-500 rounded-full shadow-md shadow-purple-500/50"></div>
                <span className="text-[10px] text-slate-400 mt-1 font-mono">East Logistics Center</span>
              </div>

              {/* Active transit lanes (corridors) */}
              <svg className="absolute inset-0 w-full h-full pointer-events-none opacity-40" xmlns="http://www.w3.org/2000/svg">
                {/* Lane 1: West -> North */}
                <path d="M 60,128 Q 150,110 380,48" fill="none" stroke="#22d3ee" strokeWidth="2" strokeDasharray="6,4" />
                {/* Lane 2: North -> East */}
                <path d="M 380,48 Q 450,120 545,96" fill="none" stroke="#fb923c" strokeWidth="2" strokeDasharray="6,4" />
                {/* Lane 3: South -> West */}
                <path d="M 250,225 Q 120,200 60,128" fill="none" stroke="#34d399" strokeWidth="2" strokeDasharray="6,4" />
              </svg>

              {/* Simulated active vehicles (blips) */}
              {activeTrips.length > 0 ? (
                <>
                  <div className="absolute top-[80px] left-[220px] group cursor-pointer flex items-center gap-2 bg-[#131824]/90 p-1.5 rounded-lg border border-blue-500/30 shadow-md">
                    <span className="w-2.5 h-2.5 rounded-full bg-blue-400 animate-ping absolute"></span>
                    <span className="w-2.5 h-2.5 rounded-full bg-blue-500 relative"></span>
                    <div className="text-[9px] font-mono leading-none">
                      <span className="text-blue-400 font-bold block">TRP-2026-101</span>
                      <span className="text-slate-400">TRK-102 • 60 km/h</span>
                    </div>
                  </div>
                  <div className="absolute bottom-[90px] right-[180px] group cursor-pointer flex items-center gap-2 bg-[#131824]/90 p-1.5 rounded-lg border border-orange-500/30 shadow-md">
                    <span className="w-2.5 h-2.5 rounded-full bg-orange-400 animate-ping absolute"></span>
                    <span className="w-2.5 h-2.5 rounded-full bg-orange-500 relative"></span>
                    <div className="text-[9px] font-mono leading-none">
                      <span className="text-orange-400 font-bold block">TRP-2026-103</span>
                      <span className="text-slate-400">VAN-05 • 48 km/h</span>
                    </div>
                  </div>
                </>
              ) : (
                <div className="text-slate-500 text-xs font-mono text-center max-w-sm px-6 bg-[#131824]/60 py-3 rounded-lg border border-[#222a3d]">
                  <Sparkles className="w-4 h-4 text-orange-400 mx-auto mb-1.5" />
                  No dispatches active on radar. Dispatch vehicles to monitor live telemetry.
                </div>
              )}

              <div className="absolute bottom-3 left-3 bg-[#131824]/80 px-2 py-1 rounded border border-[#222a3d] text-[10px] text-slate-400 font-mono">
                Corridors: 3 Active | Base Ops: 4 regions
              </div>
            </div>
          </div>
        </div>

        {/* Right Section: Alert & Compliance Center, Fleet breakdown & Quick Actions */}
        <div className="space-y-6">
          {/* Alerts & Safety Compliance Feed */}
          <div className="card space-y-4 border-l-4 border-l-orange-500/80 bg-gradient-to-b from-[#131824] to-[#121622] shadow-lg shadow-black/10">
            <div className="border-b border-[#222a3d] pb-3 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <ShieldAlert className="w-4 h-4 text-orange-400" />
                <h3 className="font-bold text-sm text-white tracking-tight">Compliance & Operations Feed</h3>
              </div>
              {alerts.length > 0 && (
                <span className="text-[10px] bg-red-500/10 text-red-400 font-bold font-mono px-2 py-0.5 rounded-full">
                  {alerts.length} alerts
                </span>
              )}
            </div>

            <div className="space-y-3 max-h-72 overflow-y-auto pr-1">
              {alerts.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-8 text-center bg-[#0b0f17]/50 rounded-lg border border-dashed border-[#222a3d] p-4 text-slate-500 text-xs">
                  <ShieldCheck className="w-8 h-8 text-emerald-400/80 mb-2" />
                  <p className="font-semibold text-white">All Clear & Compliant</p>
                  <p className="text-[10px] text-slate-500 mt-0.5">No expired licenses or active safety warnings logged.</p>
                </div>
              ) : (
                alerts.map((alert, idx) => (
                  <div 
                    key={alert.id || idx} 
                    className={`p-3 rounded-lg border text-xs space-y-1.5 transition-all hover:translate-x-1 ${
                      alert.type === 'danger' ? 'bg-red-500/5 border-red-500/20 text-red-300' :
                      alert.type === 'warning' ? 'bg-amber-500/5 border-amber-500/20 text-amber-300' :
                      'bg-blue-500/5 border-blue-500/20 text-blue-300'
                    }`}
                  >
                    <div className="flex items-center justify-between font-bold">
                      <span className="flex items-center gap-1.5 uppercase tracking-wider text-[10px]">
                        <AlertTriangle className={`w-3.5 h-3.5 ${
                          alert.type === 'danger' ? 'text-red-400' :
                          alert.type === 'warning' ? 'text-amber-400' : 'text-blue-400'
                        }`} />
                        {alert.title}
                      </span>
                      {alert.tag && (
                        <span className="text-[9px] font-mono px-1.5 py-0.5 rounded bg-slate-800 text-slate-400">
                          {alert.tag}
                        </span>
                      )}
                    </div>
                    <p className="text-slate-300 leading-normal font-medium">{alert.message}</p>
                  </div>
                ))
              )}
            </div>
          </div>

          {/* Fleet Status Breakdown */}
          <div className="card space-y-4 shadow-lg shadow-black/10">
            <div className="border-b border-[#222a3d] pb-4 flex items-center justify-between">
              <div>
                <h3 className="font-bold text-sm text-white tracking-tight">Fleet Status Breakdown</h3>
                <p className="text-[11px] text-slate-400">Asset distribution across {totalVehiclesCount} total vehicles</p>
              </div>
              <Sparkles className="w-4 h-4 text-orange-400" />
            </div>

            <div className="space-y-4 pt-1">
              <div>
                <div className="flex justify-between text-xs font-semibold mb-1.5">
                  <span className="text-emerald-400 flex items-center gap-2">
                    <span className="w-2 h-2 rounded-full bg-emerald-400"></span> Available Pool
                  </span>
                  <span className="text-white font-mono">{availableVehicles.length} / {totalVehiclesCount}</span>
                </div>
                <div className="progress-bar-bg">
                  <div className="progress-bar-fill bg-emerald-500" style={{ width: `${(availableVehicles.length / totalVehiclesCount) * 100}%` }}></div>
                </div>
              </div>

              <div>
                <div className="flex justify-between text-xs font-semibold mb-1.5">
                  <span className="text-blue-400 flex items-center gap-2">
                    <span className="w-2 h-2 rounded-full bg-blue-400"></span> Dispatched On Trip
                  </span>
                  <span className="text-white font-mono">{vehiclesOnTrip.length} / {totalVehiclesCount}</span>
                </div>
                <div className="progress-bar-bg">
                  <div className="progress-bar-fill bg-blue-500" style={{ width: `${(vehiclesOnTrip.length / totalVehiclesCount) * 100}%` }}></div>
                </div>
              </div>

              <div>
                <div className="flex justify-between text-xs font-semibold mb-1.5">
                  <span className="text-amber-400 flex items-center gap-2">
                    <span className="w-2 h-2 rounded-full bg-amber-400"></span> In Workshop (Locked)
                  </span>
                  <span className="text-white font-mono">{maintenanceVehicles.length} / {totalVehiclesCount}</span>
                </div>
                <div className="progress-bar-bg">
                  <div className="progress-bar-fill bg-amber-500" style={{ width: `${(maintenanceVehicles.length / totalVehiclesCount) * 100}%` }}></div>
                </div>
              </div>

              <div>
                <div className="flex justify-between text-xs font-semibold mb-1.5">
                  <span className="text-red-400 flex items-center gap-2">
                    <span className="w-2 h-2 rounded-full bg-red-400"></span> Retired Assets
                  </span>
                  <span className="text-white font-mono">{vehicles.filter(v => v.status === 'Retired').length} / {totalVehiclesCount}</span>
                </div>
                <div className="progress-bar-bg">
                  <div className="progress-bar-fill bg-red-500" style={{ width: `${(vehicles.filter(v => v.status === 'Retired').length / totalVehiclesCount) * 100}%` }}></div>
                </div>
              </div>
            </div>
          </div>

          {/* Quick Actions Panel */}
          <div className="card bg-[#1a2130] border border-[#232b3e] space-y-3.5 shadow-lg shadow-black/10">
            <div className="flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-orange-400 shrink-0" />
              <h4 className="font-bold text-sm text-white">Quick Actions & Workflow</h4>
            </div>
            <p className="text-xs text-slate-300 leading-relaxed">Create a new dispatch, register a vehicle, or step through automated verification rules.</p>
            <div className="flex flex-col gap-2 pt-1">
              <button
                onClick={() => onNavigate('trips')}
                className="btn btn-primary w-full !py-2.5 text-xs font-semibold flex items-center justify-center gap-2 shadow-lg shadow-orange-500/20"
              >
                <Plus className="w-4 h-4" />
                <span>Create New Dispatch</span>
              </button>
              
              <div className="flex gap-2">
                <button
                  onClick={() => onNavigate('fleet')}
                  className="btn btn-secondary flex-1 !py-2.5 text-xs font-semibold"
                >
                  <span>Register Vehicle</span>
                </button>
                <button
                  onClick={() => onNavigate('drivers')}
                  className="btn btn-secondary flex-1 !py-2.5 text-xs font-semibold"
                >
                  <span>Add Driver</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
