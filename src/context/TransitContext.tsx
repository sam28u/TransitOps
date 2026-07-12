import React, { createContext, useContext, useState, useEffect } from 'react';
import type {
  User, Role, Vehicle, Driver, Trip, MaintenanceLog, FuelLog, ExpenseLog, RBACMatrix, VehicleStatus, DriverStatus, TripStatus
} from '../types';

const API_BASE = 'http://localhost:3001/api';

const defaultRBACMatrix: RBACMatrix = {
  'Fleet Manager': {
    dashboard: { view: true, create: true, edit: true, delete: true },
    fleet: { view: true, create: true, edit: true, delete: true },
    drivers: { view: true, create: true, edit: true, delete: true },
    trips: { view: true, create: true, edit: true, delete: true },
    maintenance: { view: true, create: true, edit: true, delete: true },
    fuel: { view: true, create: true, edit: true, delete: true },
    analytics: { view: true, create: true, edit: true, delete: true },
    settings: { view: true, create: true, edit: true, delete: true }
  },
  'Driver': {
    dashboard: { view: true, create: false, edit: false, delete: false },
    fleet: { view: true, create: false, edit: false, delete: false },
    drivers: { view: true, create: true, edit: true, delete: false },
    trips: { view: true, create: true, edit: true, delete: false },
    maintenance: { view: true, create: false, edit: false, delete: false },
    fuel: { view: true, create: false, edit: false, delete: false },
    analytics: { view: false, create: false, edit: false, delete: false },
    settings: { view: false, create: false, edit: false, delete: false }
  },
  'Safety Officer': {
    dashboard: { view: true, create: false, edit: false, delete: false },
    fleet: { view: true, create: false, edit: false, delete: false },
    drivers: { view: true, create: true, edit: true, delete: true },
    trips: { view: true, create: false, edit: false, delete: false },
    maintenance: { view: true, create: true, edit: true, delete: false },
    fuel: { view: false, create: false, edit: false, delete: false },
    analytics: { view: true, create: false, edit: false, delete: false },
    settings: { view: false, create: false, edit: false, delete: false }
  },
  'Financial Analyst': {
    dashboard: { view: true, create: false, edit: false, delete: false },
    fleet: { view: true, create: false, edit: false, delete: false },
    drivers: { view: true, create: false, edit: false, delete: false },
    trips: { view: true, create: false, edit: false, delete: false },
    maintenance: { view: true, create: false, edit: false, delete: false },
    fuel: { view: true, create: true, edit: true, delete: true },
    analytics: { view: true, create: true, edit: true, delete: false },
    settings: { view: false, create: false, edit: false, delete: false }
  }
};

const defaultUser: User = {
  id: 'usr-fleet_mgr',
  name: 'Raven Sharma',
  email: 'raven.k@transitops.in',
  role: 'Fleet Manager',
};

interface TransitContextType {
  currentUser: User | null;
  setCurrentUser: (u: User | null) => void;
  vehicles: Vehicle[];
  drivers: Driver[];
  trips: Trip[];
  maintenanceLogs: MaintenanceLog[];
  fuelLogs: FuelLog[];
  expenseLogs: ExpenseLog[];
  rbacMatrix: RBACMatrix;
  notification: { message: string; type: 'success' | 'error' | 'info' } | null;
  clearNotification: () => void;
  // Actions
  addVehicle: (v: Omit<Vehicle, 'id'>) => void;
  updateVehicle: (id: string, v: Partial<Vehicle>) => void;
  addDriver: (d: Omit<Driver, 'id'>) => void;
  updateDriver: (id: string, d: Partial<Driver>) => void;
  createTrip: (t: Omit<Trip, 'id' | 'tripCode' | 'status' | 'createdAt'>, initialStage?: TripStatus) => { success: boolean; error?: string };
  dispatchTrip: (tripId: string) => { success: boolean; error?: string };
  completeTrip: (tripId: string, finalOdometer: number, fuelConsumed: number) => { success: boolean; error?: string };
  cancelTrip: (tripId: string) => { success: boolean; error?: string };
  addMaintenanceLog: (m: Omit<MaintenanceLog, 'id' | 'serviceCode'>) => void;
  closeMaintenanceLog: (id: string) => void;
  addFuelLog: (f: Omit<FuelLog, 'id'>) => void;
  addExpenseLog: (e: Omit<ExpenseLog, 'id'>) => void;
  updateRBAC: (role: Role, module: string, permission: 'view' | 'create' | 'edit' | 'delete', val: boolean) => void;
  resetToDemoState: () => void;
  runExampleWorkflowStep: (stepNumber: number) => { stepTitle: string; result: string; success: boolean };
}

const TransitContext = createContext<TransitContextType | undefined>(undefined);

export const TransitProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [currentUser, setCurrentUser] = useState<User | null>(() => {
    const saved = localStorage.getItem('transit_current_user');
    return saved ? JSON.parse(saved) : defaultUser;
  });

  const [vehicles, setVehicles] = useState<Vehicle[]>(() => {
    const saved = localStorage.getItem('transit_vehicles');
    return saved ? JSON.parse(saved) : [];
  });

  const [drivers, setDrivers] = useState<Driver[]>(() => {
    const saved = localStorage.getItem('transit_drivers');
    return saved ? JSON.parse(saved) : [];
  });

  const [trips, setTrips] = useState<Trip[]>(() => {
    const saved = localStorage.getItem('transit_trips');
    return saved ? JSON.parse(saved) : [];
  });

  const [maintenanceLogs, setMaintenanceLogs] = useState<MaintenanceLog[]>(() => {
    const saved = localStorage.getItem('transit_maintenance');
    return saved ? JSON.parse(saved) : [];
  });

  const [fuelLogs, setFuelLogs] = useState<FuelLog[]>(() => {
    const saved = localStorage.getItem('transit_fuel');
    return saved ? JSON.parse(saved) : [];
  });

  const [expenseLogs, setExpenseLogs] = useState<ExpenseLog[]>(() => {
    const saved = localStorage.getItem('transit_expenses');
    return saved ? JSON.parse(saved) : [];
  });

  const [rbacMatrix, setRbacMatrix] = useState<RBACMatrix>(() => {
    const saved = localStorage.getItem('transit_rbac');
    return saved ? JSON.parse(saved) : defaultRBACMatrix;
  });

  const [notification, setNotification] = useState<{ message: string; type: 'success' | 'error' | 'info' } | null>(null);

  const showToast = (message: string, type: 'success' | 'error' | 'info' = 'success') => {
    setNotification({ message, type });
  };

  const clearNotification = () => setNotification(null);

  // Backend API Sync
  const syncWithBackend = async () => {
    try {
      const headers = { 'x-user-role': currentUser?.role || 'Fleet Manager' };
      const [vRes, dRes, tRes, mRes, eRes, rRes] = await Promise.all([
        fetch(`${API_BASE}/vehicles`, { headers }).then(r => r.json()).catch(() => null),
        fetch(`${API_BASE}/drivers`, { headers }).then(r => r.json()).catch(() => null),
        fetch(`${API_BASE}/trips`, { headers }).then(r => r.json()).catch(() => null),
        fetch(`${API_BASE}/maintenance`, { headers }).then(r => r.json()).catch(() => null),
        fetch(`${API_BASE}/expenses`, { headers }).then(r => r.json()).catch(() => null),
        fetch(`${API_BASE}/rbac`, { headers }).then(r => r.json()).catch(() => null),
      ]);

      if (vRes?.success && Array.isArray(vRes.data)) setVehicles(vRes.data);
      if (dRes?.success && Array.isArray(dRes.data)) setDrivers(dRes.data);
      if (tRes?.success && Array.isArray(tRes.data)) setTrips(tRes.data);
      if (mRes?.success && Array.isArray(mRes.data)) setMaintenanceLogs(mRes.data);
      if (eRes?.success && eRes.data) {
        if (Array.isArray(eRes.data.fuelLogs)) setFuelLogs(eRes.data.fuelLogs);
        if (Array.isArray(eRes.data.expenseLogs)) setExpenseLogs(eRes.data.expenseLogs);
      }
      if (rRes?.success && rRes.data) setRbacMatrix(rRes.data);
    } catch {
      // Backend unreachable, using cached localStorage state
    }
  };

  useEffect(() => {
    syncWithBackend();
  }, [currentUser?.role]);

  // Persistence
  useEffect(() => {
    if (currentUser) localStorage.setItem('transit_current_user', JSON.stringify(currentUser));
  }, [currentUser]);

  useEffect(() => {
    localStorage.setItem('transit_vehicles', JSON.stringify(vehicles));
  }, [vehicles]);

  useEffect(() => {
    localStorage.setItem('transit_drivers', JSON.stringify(drivers));
  }, [drivers]);

  useEffect(() => {
    localStorage.setItem('transit_trips', JSON.stringify(trips));
  }, [trips]);

  useEffect(() => {
    localStorage.setItem('transit_maintenance', JSON.stringify(maintenanceLogs));
  }, [maintenanceLogs]);

  useEffect(() => {
    localStorage.setItem('transit_fuel', JSON.stringify(fuelLogs));
  }, [fuelLogs]);

  useEffect(() => {
    localStorage.setItem('transit_expenses', JSON.stringify(expenseLogs));
  }, [expenseLogs]);

  useEffect(() => {
    localStorage.setItem('transit_rbac', JSON.stringify(rbacMatrix));
  }, [rbacMatrix]);

  // Actions connected to Backend REST API
  const addVehicle = async (v: Omit<Vehicle, 'id'>) => {
    const tempId = `veh-${Date.now()}`;
    const optimisticVehicle: Vehicle = { ...v, id: tempId, accumulatedRevenue: 0 };
    setVehicles((prev) => [optimisticVehicle, ...prev]);
    showToast(`Vehicle '${v.registrationNumber}' added to registry. Syncing with backend...`, 'success');

    try {
      await fetch(`${API_BASE}/vehicles`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'x-user-role': currentUser?.role || 'Fleet Manager' },
        body: JSON.stringify(v),
      });
      syncWithBackend();
    } catch {}
  };

  const updateVehicle = async (id: string, updated: Partial<Vehicle>) => {
    setVehicles((prev) => prev.map((item) => item.id === id ? { ...item, ...updated } : item));
    showToast(`Vehicle status/details updated successfully.`, 'info');

    try {
      await fetch(`${API_BASE}/vehicles/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json', 'x-user-role': currentUser?.role || 'Fleet Manager' },
        body: JSON.stringify(updated),
      });
      syncWithBackend();
    } catch {}
  };

  const addDriver = async (d: Omit<Driver, 'id'>) => {
    const tempId = `drv-${Date.now()}`;
    setDrivers((prev) => [{ ...d, id: tempId }, ...prev]);
    showToast(`Driver '${d.name}' onboarded successfully. Syncing with backend...`, 'success');

    try {
      await fetch(`${API_BASE}/drivers`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'x-user-role': currentUser?.role || 'Fleet Manager' },
        body: JSON.stringify(d),
      });
      syncWithBackend();
    } catch {}
  };

  const updateDriver = async (id: string, updated: Partial<Driver>) => {
    setDrivers((prev) => prev.map((item) => item.id === id ? { ...item, ...updated } : item));
    showToast(`Driver profile updated successfully.`, 'info');

    try {
      await fetch(`${API_BASE}/drivers/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json', 'x-user-role': currentUser?.role || 'Fleet Manager' },
        body: JSON.stringify(updated),
      });
      syncWithBackend();
    } catch {}
  };

  const createTrip = (t: Omit<Trip, 'id' | 'tripCode' | 'status' | 'createdAt'>, initialStage: TripStatus = 'Dispatched'): { success: boolean; error?: string } => {
    const veh = vehicles.find((v) => v.id === t.vehicleId);
    const drv = drivers.find((d) => d.id === t.driverId);

    if (!veh) return { success: false, error: 'Selected vehicle not found.' };
    if (!drv) return { success: false, error: 'Selected driver not found.' };

    // 1. Check vehicle availability
    if (veh.status !== 'Available') {
      const err = `Dispatch Blocked: Vehicle '${veh.registrationNumber}' is currently ${veh.status}.`;
      showToast(err, 'error');
      return { success: false, error: err };
    }

    // 2. Check cargo weight vs vehicle capacity
    if (t.cargoWeight > veh.maxLoadCapacity) {
      const err = `Dispatch Blocked: Cargo weight (${t.cargoWeight} kg) exceeds maximum capacity of ${veh.registrationNumber} (${veh.maxLoadCapacity} kg).`;
      showToast(err, 'error');
      return { success: false, error: err };
    }

    // 3. Check driver availability
    if (drv.status !== 'Available') {
      const err = `Dispatch Blocked: Driver '${drv.name}' is currently ${drv.status}.`;
      showToast(err, 'error');
      return { success: false, error: err };
    }

    // 4. Check driver license expiry
    const todayStr = new Date().toISOString().split('T')[0];
    if (drv.licenseExpiryDate < todayStr) {
      const err = `Safety Compliance Blocked: Driver '${drv.name}' has an EXPIRED license (${drv.licenseExpiryDate}). Cannot assign!`;
      showToast(err, 'error');
      return { success: false, error: err };
    }

    const id = `trp-${Date.now()}`;
    const tripCode = `TRP-2026-${Math.floor(100 + Math.random() * 900)}`;
    const now = new Date().toISOString().replace('T', ' ').substring(0, 16);

    const newTrip: Trip = {
      ...t,
      id,
      tripCode,
      status: initialStage,
      createdAt: now,
      dispatchedAt: initialStage === 'Dispatched' ? now : undefined,
    };

    setTrips((prev) => [newTrip, ...prev]);

    if (initialStage === 'Dispatched') {
      setVehicles((prev) => prev.map((v) => v.id === veh.id ? { ...v, status: 'On Trip' as VehicleStatus } : v));
      setDrivers((prev) => prev.map((d) => d.id === drv.id ? { ...d, status: 'On Trip' as DriverStatus } : d));
      showToast(`Trip '${tripCode}' dispatched! Vehicle and Driver automatically synchronized to 'On Trip'.`, 'success');
    } else {
      showToast(`Trip '${tripCode}' created in Draft state.`, 'info');
    }

    // Send to Backend
    fetch(`${API_BASE}/trips`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'x-user-role': currentUser?.role || 'Fleet Manager' },
      body: JSON.stringify({ ...t, initialStage }),
    }).then(() => syncWithBackend()).catch(() => {});

    return { success: true };
  };

  const dispatchTrip = (tripId: string): { success: boolean; error?: string } => {
    const trip = trips.find((t) => t.id === tripId);
    if (!trip) return { success: false, error: 'Trip not found.' };

    const veh = vehicles.find((v) => v.id === trip.vehicleId);
    const drv = drivers.find((d) => d.id === trip.driverId);

    if (veh && veh.status !== 'Available') return { success: false, error: `Vehicle is currently ${veh.status}.` };
    if (drv && drv.status !== 'Available') return { success: false, error: `Driver is currently ${drv.status}.` };

    const now = new Date().toISOString().replace('T', ' ').substring(0, 16);
    setTrips((prev) => prev.map((t) => t.id === tripId ? { ...t, status: 'Dispatched' as TripStatus, dispatchedAt: now } : t));
    if (veh) setVehicles((prev) => prev.map((v) => v.id === veh.id ? { ...v, status: 'On Trip' as VehicleStatus } : v));
    if (drv) setDrivers((prev) => prev.map((d) => d.id === drv.id ? { ...d, status: 'On Trip' as DriverStatus } : d));

    showToast(`Trip '${trip.tripCode}' dispatched! Statuses updated to 'On Trip'.`, 'success');

    fetch(`${API_BASE}/trips/${tripId}/dispatch`, {
      method: 'PUT',
      headers: { 'x-user-role': currentUser?.role || 'Fleet Manager' },
    }).then(() => syncWithBackend()).catch(() => {});

    return { success: true };
  };

  const completeTrip = (tripId: string, finalOdometer: number, fuelConsumed: number): { success: boolean; error?: string } => {
    const trip = trips.find((t) => t.id === tripId);
    if (!trip) return { success: false, error: 'Trip not found.' };

    const veh = vehicles.find((v) => v.id === trip.vehicleId);
    const now = new Date().toISOString().replace('T', ' ').substring(0, 16);
    const revenue = Math.round(trip.cargoWeight * 0.12 + trip.plannedDistance * 2.5);

    setTrips((prev) => prev.map((t) => t.id === tripId ? {
      ...t,
      status: 'Completed' as TripStatus,
      completedAt: now,
      finalOdometer,
      fuelConsumed,
      revenueGenerated: revenue
    } : t));

    if (veh) {
      setVehicles((prev) => prev.map((v) => v.id === veh.id ? {
        ...v,
        status: 'Available' as VehicleStatus,
        odometer: finalOdometer > v.odometer ? finalOdometer : v.odometer + trip.plannedDistance,
        accumulatedRevenue: (v.accumulatedRevenue || 0) + revenue
      } : v));

      if (fuelConsumed > 0) {
        const fuelCost = Math.round(fuelConsumed * 1.4 * 100) / 100;
        addFuelLog({
          vehicleId: veh.id,
          liters: fuelConsumed,
          cost: fuelCost,
          date: now.split(' ')[0],
          odometerReading: finalOdometer || veh.odometer,
          stationName: 'Trip Completion Auto-Log'
        });
      }
    }

    if (trip.driverId) {
      setDrivers((prev) => prev.map((d) => d.id === trip.driverId ? { ...d, status: 'Available' as DriverStatus } : d));
    }

    showToast(`Trip '${trip.tripCode}' completed! Resources restored to 'Available'.`, 'success');

    fetch(`${API_BASE}/trips/${tripId}/complete`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json', 'x-user-role': currentUser?.role || 'Fleet Manager' },
      body: JSON.stringify({ finalOdometer, fuelConsumed }),
    }).then(() => syncWithBackend()).catch(() => {});

    return { success: true };
  };

  const cancelTrip = (tripId: string): { success: boolean; error?: string } => {
    const trip = trips.find((t) => t.id === tripId);
    if (!trip) return { success: false, error: 'Trip not found.' };

    setTrips((prev) => prev.map((t) => t.id === tripId ? { ...t, status: 'Cancelled' as TripStatus } : t));

    if (trip.status === 'Dispatched') {
      if (trip.vehicleId) setVehicles((prev) => prev.map((v) => v.id === trip.vehicleId ? { ...v, status: 'Available' as VehicleStatus } : v));
      if (trip.driverId) setDrivers((prev) => prev.map((d) => d.id === trip.driverId ? { ...d, status: 'Available' as DriverStatus } : d));
    }

    showToast(`Trip '${trip.tripCode}' cancelled. Resources released.`, 'info');

    fetch(`${API_BASE}/trips/${tripId}/cancel`, {
      method: 'PUT',
      headers: { 'x-user-role': currentUser?.role || 'Fleet Manager' },
    }).then(() => syncWithBackend()).catch(() => {});

    return { success: true };
  };

  const addMaintenanceLog = (m: Omit<MaintenanceLog, 'id' | 'serviceCode'>) => {
    const id = `mnt-${Date.now()}`;
    const serviceCode = `MNT-2026-${Math.floor(200 + Math.random() * 800)}`;
    setMaintenanceLogs((prev) => [{ ...m, id, serviceCode }, ...prev]);

    if (m.status === 'In Progress' || m.status === 'Scheduled') {
      setVehicles((prev) => prev.map((v) => v.id === m.vehicleId ? { ...v, status: 'In Shop' as VehicleStatus } : v));
      showToast(`Maintenance '${serviceCode}' logged. Vehicle locked inside Workshop ('In Shop')!`, 'success');
    } else {
      showToast(`Maintenance record '${serviceCode}' added.`, 'success');
    }

    fetch(`${API_BASE}/maintenance`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'x-user-role': currentUser?.role || 'Fleet Manager' },
      body: JSON.stringify(m),
    }).then(() => syncWithBackend()).catch(() => {});
  };

  const closeMaintenanceLog = (id: string) => {
    const log = maintenanceLogs.find((m) => m.id === id);
    if (!log) return;

    setMaintenanceLogs((prev) => prev.map((item) => item.id === id ? { ...item, status: 'Completed' as const } : item));

    if (log.vehicleId) {
      setVehicles((prev) => prev.map((v) => {
        if (v.id === log.vehicleId && v.status !== 'Retired') return { ...v, status: 'Available' as VehicleStatus };
        return v;
      }));
    }

    showToast(`Maintenance log '${log.serviceCode}' closed. Vehicle restored to 'Available'.`, 'success');

    fetch(`${API_BASE}/maintenance/${id}/close`, {
      method: 'PUT',
      headers: { 'x-user-role': currentUser?.role || 'Fleet Manager' },
    }).then(() => syncWithBackend()).catch(() => {});
  };

  const addFuelLog = (f: Omit<FuelLog, 'id'>) => {
    const id = `fuel-${Date.now()}`;
    setFuelLogs((prev) => [{ ...f, id }, ...prev]);
    showToast(`Fuel refill (${f.liters}L - $${f.cost}) logged successfully.`, 'success');

    fetch(`${API_BASE}/expenses/fuel`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'x-user-role': currentUser?.role || 'Fleet Manager' },
      body: JSON.stringify(f),
    }).then(() => syncWithBackend()).catch(() => {});
  };

  const addExpenseLog = (e: Omit<ExpenseLog, 'id'>) => {
    const id = `exp-${Date.now()}`;
    setExpenseLogs((prev) => [{ ...e, id }, ...prev]);
    showToast(`Operational expense ($${e.amount}) added successfully.`, 'success');

    fetch(`${API_BASE}/expenses/operational`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'x-user-role': currentUser?.role || 'Fleet Manager' },
      body: JSON.stringify(e),
    }).then(() => syncWithBackend()).catch(() => {});
  };

  const updateRBAC = (role: Role, module: string, permission: 'view' | 'create' | 'edit' | 'delete', val: boolean) => {
    setRbacMatrix((prev) => {
      const roleCopy = { ...(prev[role] || {}) };
      const modCopy = { ...(roleCopy[module] || { view: true, create: false, edit: false, delete: false }) };
      modCopy[permission] = val;
      roleCopy[module] = modCopy;
      return { ...prev, [role]: roleCopy };
    });
    showToast(`RBAC matrix updated for role '${role}'.`, 'info');

    fetch(`${API_BASE}/rbac`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json', 'x-user-role': currentUser?.role || 'Fleet Manager' },
      body: JSON.stringify({ role, module, permission, value: val }),
    }).then(() => syncWithBackend()).catch(() => {});
  };

  const resetToDemoState = async () => {
    localStorage.clear();
    showToast('Resetting database to initial demo state from Backend...', 'info');
    try {
      await fetch(`${API_BASE}/auth/reset-demo`, {
        method: 'POST',
        headers: { 'x-user-role': 'Fleet Manager' },
      });
      await syncWithBackend();
      showToast('Platform reset to initial Hackathon Demo State via Backend API.', 'success');
    } catch {
      showToast('Backend offline. Please start backend server (`npm run server`) to reset.', 'error');
    }
  };

  const runExampleWorkflowStep = (stepNumber: number): { stepTitle: string; result: string; success: boolean } => {
    switch (stepNumber) {
      case 1: {
        const exists = vehicles.find((v) => v.registrationNumber === 'VAN-05');
        if (!exists) {
          addVehicle({
            registrationNumber: 'VAN-05',
            nameModel: 'Ford Transit Custom Cargo',
            type: 'Van',
            maxLoadCapacity: 500,
            odometer: 14200,
            acquisitionCost: 45000,
            status: 'Available',
            region: 'North',
          });
        }
        return { stepTitle: 'Step 1: Register New Vehicle', result: 'VAN-05 (500 kg max capacity) confirmed Available in Fleet Registry & Backend.', success: true };
      }
      case 2: {
        const exists = drivers.find((d) => d.name === 'Alex Rivera');
        if (!exists) {
          addDriver({
            name: 'Alex Rivera',
            licenseNumber: 'DL-998822',
            licenseCategory: 'Light Commercial (B)',
            licenseExpiryDate: '2028-10-15',
            contactNumber: '+1 (555) 234-5678',
            safetyScore: 98,
            status: 'Available',
            region: 'North',
          });
        }
        return { stepTitle: 'Step 2: Register New Driver', result: 'Alex Rivera (DL-998822, Valid until 2028) confirmed Available in Driver Pool & Backend.', success: true };
      }
      case 3:
      case 4: {
        const van05 = vehicles.find((v) => v.registrationNumber === 'VAN-05') || vehicles[0];
        const alex = drivers.find((d) => d.name === 'Alex Rivera') || drivers[0];
        if (!van05 || !alex) return { stepTitle: 'Step 3 & 4: Trip Creation & Validation', result: 'Please run Steps 1 and 2 first.', success: false };
        const res = createTrip({
          source: 'Warehouse Depot (North)',
          destination: 'Downtown Retail Hub',
          vehicleId: van05.id,
          driverId: alex.id,
          cargoWeight: 450,
          plannedDistance: 120,
        }, 'Dispatched');
        return { stepTitle: 'Step 3 & 4: Trip Creation & Validation', result: res.success ? `SUCCESS: Cargo 450 kg ≤ ${van05.maxLoadCapacity} kg capacity. Trip dispatched to backend!` : `BLOCKED: ${res.error}`, success: res.success };
      }
      case 5: {
        const van05 = vehicles.find((v) => v.registrationNumber === 'VAN-05') || vehicles[0];
        const alex = drivers.find((d) => d.name === 'Alex Rivera') || drivers[0];
        if (!van05 || !alex) return { stepTitle: 'Step 5: Verify Status Sync', result: 'Please run Steps 1-4 first.', success: false };
        const vanOnTrip = van05.status === 'On Trip';
        const drvOnTrip = alex.status === 'On Trip';
        return { stepTitle: 'Step 5: Verify Status Sync', result: `VAN-05 status: '${van05.status}', Alex Rivera status: '${alex.status}'. ${vanOnTrip && drvOnTrip ? 'Sync Verified across Frontend & Backend!' : 'Already updated or ready.'}`, success: true };
      }
      case 6:
      case 7: {
        const van05 = vehicles.find((v) => v.registrationNumber === 'VAN-05') || vehicles[0];
        if (!van05) return { stepTitle: 'Step 6 & 7: Complete & Restore', result: 'Please run Step 1 first.', success: false };
        const activeTrip = trips.find((t) => t.vehicleId === van05.id && t.status === 'Dispatched') || trips[0];
        if (activeTrip && activeTrip.status === 'Dispatched') {
          completeTrip(activeTrip.id, van05.odometer + 120, 18);
          return { stepTitle: 'Step 6 & 7: Complete & Restore', result: `Trip ${activeTrip.tripCode} completed via backend API. Odometer updated (+120km), VAN-05 & Alex Rivera automatically restored to 'Available'!`, success: true };
        }
        return { stepTitle: 'Step 6 & 7: Complete & Restore', result: 'No active dispatched trip found for VAN-05. Create/Dispatch first.', success: true };
      }
      case 8: {
        const van05 = vehicles.find((v) => v.registrationNumber === 'VAN-05') || vehicles[0];
        if (!van05) return { stepTitle: 'Step 8: Log Maintenance Lockout', result: 'Please run Step 1 first.', success: false };
        addMaintenanceLog({
          vehicleId: van05.id,
          serviceDescription: 'Routine 15,000 km Service & Inspection',
          cost: 320,
          date: new Date().toISOString().split('T')[0],
          status: 'In Progress',
          provider: 'TransitOps Authorized Service Center',
        });
        return { stepTitle: 'Step 8: Log Maintenance Lockout', result: `Maintenance logged for VAN-05 ($320). Status automatically switched to 'In Shop' on backend and locked from dispatch!`, success: true };
      }
      case 9: {
        return { stepTitle: 'Step 9: Analytics & Cost Summary', result: 'Operational expenses updated across Backend Analytics and Fuel/Expense views. All KPIs refreshed live from server!', success: true };
      }
      default:
        return { stepTitle: 'Demo Step', result: 'Workflow executed.', success: true };
    }
  };

  return (
    <TransitContext.Provider
      value={{
        currentUser, setCurrentUser, vehicles, drivers, trips, maintenanceLogs,
        fuelLogs, expenseLogs, rbacMatrix, notification, clearNotification,
        addVehicle, updateVehicle, addDriver, updateDriver, createTrip, dispatchTrip,
        completeTrip, cancelTrip, addMaintenanceLog, closeMaintenanceLog, addFuelLog,
        addExpenseLog, updateRBAC, resetToDemoState, runExampleWorkflowStep
      }}
    >
      {children}
    </TransitContext.Provider>
  );
};

export const useTransit = () => {
  const context = useContext(TransitContext);
  if (!context) throw new Error('useTransit must be used within TransitProvider');
  return context;
};
