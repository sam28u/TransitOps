import { Router } from 'express';
import { getDB, saveDB } from '../db.js';
import { requireRBAC } from '../middleware/rbac.js';
import type { Vehicle, VehicleStatus } from '../../src/types.js';

const router = Router();

// GET /api/vehicles
router.get('/', requireRBAC('fleet', 'view'), (req, res) => {
  const db = getDB();
  const { status, type, region, search } = req.query;

  let filtered = [...db.vehicles];
  if (status && status !== 'All') filtered = filtered.filter((v) => v.status === status);
  if (type && type !== 'All') filtered = filtered.filter((v) => v.type === type);
  if (region && region !== 'All') filtered = filtered.filter((v) => v.region === region);
  if (search && typeof search === 'string') {
    const q = search.toLowerCase();
    filtered = filtered.filter((v) =>
      v.registrationNumber.toLowerCase().includes(q) ||
      v.nameModel.toLowerCase().includes(q)
    );
  }

  res.json({ success: true, count: filtered.length, data: filtered });
});

// GET /api/vehicles/:id
router.get('/:id', requireRBAC('fleet', 'view'), (req, res) => {
  const db = getDB();
  const vehicle = db.vehicles.find((v) => v.id === req.params.id);
  if (!vehicle) return res.status(404).json({ success: false, error: 'Vehicle not found.' });
  res.json({ success: true, data: vehicle });
});

// POST /api/vehicles
router.post('/', requireRBAC('fleet', 'create'), (req, res) => {
  const db = getDB();
  const body = req.body as Omit<Vehicle, 'id'>;

  // Check unique registration number
  const exists = db.vehicles.find((v) => v.registrationNumber.toUpperCase() === body.registrationNumber?.toUpperCase());
  if (exists) {
    return res.status(400).json({
      success: false,
      error: `Vehicle registration number '${body.registrationNumber}' already exists in fleet registry!`,
    });
  }

  const newVehicle: Vehicle = {
    id: `veh-${Date.now()}`,
    registrationNumber: body.registrationNumber || 'NEW-001',
    nameModel: body.nameModel || 'Standard Transport Vehicle',
    type: body.type || 'Van',
    maxLoadCapacity: Number(body.maxLoadCapacity) || 500,
    odometer: Number(body.odometer) || 0,
    acquisitionCost: Number(body.acquisitionCost) || 35000,
    status: (body.status as VehicleStatus) || 'Available',
    region: body.region || 'North',
    accumulatedRevenue: Number(body.accumulatedRevenue) || 0,
  };

  db.vehicles.unshift(newVehicle);
  saveDB(db);

  res.status(201).json({ success: true, data: newVehicle, message: `Vehicle '${newVehicle.registrationNumber}' registered.` });
});

// PUT /api/vehicles/:id
router.put('/:id', requireRBAC('fleet', 'edit'), (req, res) => {
  const db = getDB();
  const index = db.vehicles.findIndex((v) => v.id === req.params.id);
  if (index === -1) return res.status(404).json({ success: false, error: 'Vehicle not found.' });

  const updatedVehicle: Vehicle = {
    ...db.vehicles[index],
    ...req.body,
  };

  db.vehicles[index] = updatedVehicle;
  saveDB(db);

  res.json({ success: true, data: updatedVehicle, message: 'Vehicle details updated.' });
});

// DELETE /api/vehicles/:id
router.delete('/:id', requireRBAC('fleet', 'delete'), (req, res) => {
  const db = getDB();
  const index = db.vehicles.findIndex((v) => v.id === req.params.id);
  if (index === -1) return res.status(404).json({ success: false, error: 'Vehicle not found.' });

  const removed = db.vehicles.splice(index, 1)[0];
  saveDB(db);

  res.json({ success: true, data: removed, message: `Vehicle '${removed.registrationNumber}' removed from fleet.` });
});

export default router;
