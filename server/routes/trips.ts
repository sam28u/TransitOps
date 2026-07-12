import { Router } from 'express';
import { getDB, saveDB } from '../db.js';
import { requireRBAC } from '../middleware/rbac.js';
import type { Trip, TripStatus, VehicleStatus, DriverStatus } from '../../src/types.js';

const router = Router();

// GET /api/trips
router.get('/', requireRBAC('trips', 'view'), (req, res) => {
  const db = getDB();
  const { status, search } = req.query;

  let filtered = [...db.trips];
  if (status && status !== 'All') filtered = filtered.filter((t) => t.status === status);
  if (search && typeof search === 'string') {
    const q = search.toLowerCase();
    filtered = filtered.filter((t) =>
      t.tripCode.toLowerCase().includes(q) ||
      t.destination.toLowerCase().includes(q) ||
      t.source.toLowerCase().includes(q)
    );
  }

  res.json({ success: true, count: filtered.length, data: filtered });
});

// POST /api/trips (Create / Dispatch Trip with strict Business Rules Enforcement)
router.post('/', requireRBAC('trips', 'create'), (req, res) => {
  const db = getDB();
  const { source, destination, vehicleId, driverId, cargoWeight, plannedDistance, initialStage } = req.body;

  const targetStage: TripStatus = initialStage || 'Dispatched';

  // Find vehicle & driver
  const vehicle = db.vehicles.find((v) => v.id === vehicleId);
  const driver = db.drivers.find((d) => d.id === driverId);

  if (!vehicle) {
    return res.status(404).json({ success: false, error: 'Selected vehicle not found in fleet registry.' });
  }
  if (!driver) {
    return res.status(404).json({ success: false, error: 'Selected driver not found in driver pool.' });
  }

  // BUSINESS RULE 1: Check Vehicle Availability
  if (vehicle.status !== 'Available') {
    return res.status(400).json({
      success: false,
      error: `Business Rule Blocked: Vehicle '${vehicle.registrationNumber}' is currently '${vehicle.status}'. Cannot dispatch!`,
      ruleViolated: 'VEHICLE_UNAVAILABLE',
    });
  }

  // BUSINESS RULE 2: Check Cargo Capacity Check
  const weight = Number(cargoWeight) || 0;
  if (weight > vehicle.maxLoadCapacity) {
    return res.status(400).json({
      success: false,
      error: `Business Rule Blocked: Cargo weight (${weight} kg) exceeds maximum capacity of ${vehicle.registrationNumber} (${vehicle.maxLoadCapacity} kg).`,
      ruleViolated: 'CARGO_OVERLOAD',
    });
  }

  // BUSINESS RULE 3: Check Driver Availability
  if (driver.status !== 'Available') {
    return res.status(400).json({
      success: false,
      error: `Business Rule Blocked: Driver '${driver.name}' is currently '${driver.status}'. Cannot assign to new trip!`,
      ruleViolated: 'DRIVER_UNAVAILABLE',
    });
  }

  // BUSINESS RULE 4: Check Driver License Expiry Date vs Today
  const todayStr = new Date().toISOString().split('T')[0];
  if (driver.licenseExpiryDate < todayStr) {
    return res.status(400).json({
      success: false,
      error: `Compliance Rule Blocked: Driver '${driver.name}' has an EXPIRED driver license (${driver.licenseExpiryDate}). Safety lockout enforced!`,
      ruleViolated: 'LICENSE_EXPIRED',
    });
  }

  const id = `trp-${Date.now()}`;
  const tripCode = `TRP-2026-${Math.floor(100 + Math.random() * 900)}`;
  const now = new Date().toISOString().replace('T', ' ').substring(0, 16);

  const newTrip: Trip = {
    id,
    tripCode,
    source: source || 'Warehouse Hub',
    destination: destination || 'Customer Distribution Center',
    vehicleId,
    driverId,
    cargoWeight: weight,
    plannedDistance: Number(plannedDistance) || 100,
    status: targetStage,
    createdAt: now,
    dispatchedAt: targetStage === 'Dispatched' ? now : undefined,
  };

  db.trips.unshift(newTrip);

  // AUTOMATIC SYNC: If Dispatched, set vehicle and driver status to 'On Trip'
  if (targetStage === 'Dispatched') {
    const vIdx = db.vehicles.findIndex((v) => v.id === vehicleId);
    if (vIdx !== -1) db.vehicles[vIdx].status = 'On Trip';

    const dIdx = db.drivers.findIndex((d) => d.id === driverId);
    if (dIdx !== -1) db.drivers[dIdx].status = 'On Trip';
  }

  saveDB(db);

  res.status(201).json({
    success: true,
    data: newTrip,
    message: targetStage === 'Dispatched'
      ? `Trip '${tripCode}' dispatched! Vehicle '${vehicle.registrationNumber}' and Driver '${driver.name}' synchronized to 'On Trip'.`
      : `Trip '${tripCode}' created in Draft state.`,
  });
});

// PUT /api/trips/:id/dispatch
router.put('/:id/dispatch', requireRBAC('trips', 'edit'), (req, res) => {
  const db = getDB();
  const tripIndex = db.trips.findIndex((t) => t.id === req.params.id);
  if (tripIndex === -1) return res.status(404).json({ success: false, error: 'Trip not found.' });

  const trip = db.trips[tripIndex];
  const vehicle = db.vehicles.find((v) => v.id === trip.vehicleId);
  const driver = db.drivers.find((d) => d.id === trip.driverId);

  if (vehicle && vehicle.status !== 'Available') {
    return res.status(400).json({ success: false, error: `Vehicle '${vehicle.registrationNumber}' is currently ${vehicle.status}.` });
  }
  if (driver && driver.status !== 'Available') {
    return res.status(400).json({ success: false, error: `Driver '${driver.name}' is currently ${driver.status}.` });
  }

  const now = new Date().toISOString().replace('T', ' ').substring(0, 16);
  db.trips[tripIndex].status = 'Dispatched';
  db.trips[tripIndex].dispatchedAt = now;

  if (vehicle) {
    const vIdx = db.vehicles.findIndex((v) => v.id === vehicle.id);
    if (vIdx !== -1) db.vehicles[vIdx].status = 'On Trip';
  }
  if (driver) {
    const dIdx = db.drivers.findIndex((d) => d.id === driver.id);
    if (dIdx !== -1) db.drivers[dIdx].status = 'On Trip';
  }

  saveDB(db);

  res.json({ success: true, data: db.trips[tripIndex], message: `Trip '${trip.tripCode}' dispatched successfully.` });
});

// PUT /api/trips/:id/complete
router.put('/:id/complete', requireRBAC('trips', 'edit'), (req, res) => {
  const db = getDB();
  const tripIndex = db.trips.findIndex((t) => t.id === req.params.id);
  if (tripIndex === -1) return res.status(404).json({ success: false, error: 'Trip not found.' });

  const trip = db.trips[tripIndex];
  const { finalOdometer, fuelConsumed } = req.body;
  const now = new Date().toISOString().replace('T', ' ').substring(0, 16);

  const vehicle = db.vehicles.find((v) => v.id === trip.vehicleId);
  const driver = db.drivers.find((d) => d.id === trip.driverId);

  const odometerReading = Number(finalOdometer) || (vehicle ? vehicle.odometer + trip.plannedDistance : 0);
  const consumedFuel = Number(fuelConsumed) || 0;
  const revenue = Math.round(trip.cargoWeight * 0.12 + trip.plannedDistance * 2.5);

  db.trips[tripIndex] = {
    ...trip,
    status: 'Completed',
    completedAt: now,
    finalOdometer: odometerReading,
    fuelConsumed: consumedFuel,
    revenueGenerated: revenue,
  };

  // Restore vehicle & driver to Available, update odometer and revenue
  if (vehicle) {
    const vIdx = db.vehicles.findIndex((v) => v.id === vehicle.id);
    if (vIdx !== -1) {
      db.vehicles[vIdx].status = 'Available';
      db.vehicles[vIdx].odometer = Math.max(db.vehicles[vIdx].odometer, odometerReading);
      db.vehicles[vIdx].accumulatedRevenue = (db.vehicles[vIdx].accumulatedRevenue || 0) + revenue;
    }

    // Auto-log fuel consumption if entered
    if (consumedFuel > 0) {
      const fuelCost = Math.round(consumedFuel * 1.4 * 100) / 100;
      db.fuelLogs.unshift({
        id: `fuel-${Date.now()}`,
        vehicleId: vehicle.id,
        liters: consumedFuel,
        cost: fuelCost,
        date: now.split(' ')[0],
        odometerReading,
        stationName: 'Trip Completion Auto-Refill',
      });
    }
  }

  if (driver) {
    const dIdx = db.drivers.findIndex((d) => d.id === driver.id);
    if (dIdx !== -1) db.drivers[dIdx].status = 'Available';
  }

  saveDB(db);

  res.json({
    success: true,
    data: db.trips[tripIndex],
    message: `Trip '${trip.tripCode}' completed! Revenue: $${revenue}. Resources restored to 'Available'.`,
  });
});

// PUT /api/trips/:id/cancel
router.put('/:id/cancel', requireRBAC('trips', 'edit'), (req, res) => {
  const db = getDB();
  const tripIndex = db.trips.findIndex((t) => t.id === req.params.id);
  if (tripIndex === -1) return res.status(404).json({ success: false, error: 'Trip not found.' });

  const trip = db.trips[tripIndex];
  db.trips[tripIndex].status = 'Cancelled';

  if (trip.status === 'Dispatched') {
    if (trip.vehicleId) {
      const vIdx = db.vehicles.findIndex((v) => v.id === trip.vehicleId);
      if (vIdx !== -1) db.vehicles[vIdx].status = 'Available';
    }
    if (trip.driverId) {
      const dIdx = db.drivers.findIndex((d) => d.id === trip.driverId);
      if (dIdx !== -1) db.drivers[dIdx].status = 'Available';
    }
  }

  saveDB(db);

  res.json({ success: true, data: db.trips[tripIndex], message: `Trip '${trip.tripCode}' cancelled. Resources released.` });
});

export default router;
