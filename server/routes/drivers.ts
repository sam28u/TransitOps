import { Router } from 'express';
import { getDB, saveDB } from '../db.js';
import { requireRBAC } from '../middleware/rbac.js';
import type { Driver, DriverStatus } from '../../src/types.js';

const router = Router();

// GET /api/drivers
router.get('/', requireRBAC('drivers', 'view'), (req, res) => {
  const db = getDB();
  const { status, region, search } = req.query;

  let filtered = [...db.drivers];
  if (status && status !== 'All') filtered = filtered.filter((d) => d.status === status);
  if (region && region !== 'All') filtered = filtered.filter((d) => d.region === region);
  if (search && typeof search === 'string') {
    const q = search.toLowerCase();
    filtered = filtered.filter((d) =>
      d.name.toLowerCase().includes(q) ||
      d.licenseNumber.toLowerCase().includes(q)
    );
  }

  res.json({ success: true, count: filtered.length, data: filtered });
});

// GET /api/drivers/:id
router.get('/:id', requireRBAC('drivers', 'view'), (req, res) => {
  const db = getDB();
  const driver = db.drivers.find((d) => d.id === req.params.id);
  if (!driver) return res.status(404).json({ success: false, error: 'Driver not found.' });
  res.json({ success: true, data: driver });
});

// POST /api/drivers
router.post('/', requireRBAC('drivers', 'create'), (req, res) => {
  const db = getDB();
  const body = req.body as Omit<Driver, 'id'>;

  // Check unique license number
  const exists = db.drivers.find((d) => d.licenseNumber.toUpperCase() === body.licenseNumber?.toUpperCase());
  if (exists) {
    return res.status(400).json({
      success: false,
      error: `Driver with license number '${body.licenseNumber}' already exists in driver pool!`,
    });
  }

  const newDriver: Driver = {
    id: `drv-${Date.now()}`,
    name: body.name || 'New Driver',
    licenseNumber: body.licenseNumber || `DL-${Math.floor(100000 + Math.random() * 900000)}`,
    licenseCategory: body.licenseCategory || 'Light Commercial (B)',
    licenseExpiryDate: body.licenseExpiryDate || '2028-12-31',
    contactNumber: body.contactNumber || '+1 (555) 000-0000',
    safetyScore: Number(body.safetyScore) || 95,
    status: (body.status as DriverStatus) || 'Available',
    assignedVehicleId: body.assignedVehicleId,
    region: body.region || 'North',
  };

  db.drivers.unshift(newDriver);
  saveDB(db);

  res.status(201).json({ success: true, data: newDriver, message: `Driver '${newDriver.name}' onboarded successfully.` });
});

// PUT /api/drivers/:id
router.put('/:id', requireRBAC('drivers', 'edit'), (req, res) => {
  const db = getDB();
  const index = db.drivers.findIndex((d) => d.id === req.params.id);
  if (index === -1) return res.status(404).json({ success: false, error: 'Driver not found.' });

  const updatedDriver: Driver = {
    ...db.drivers[index],
    ...req.body,
  };

  db.drivers[index] = updatedDriver;
  saveDB(db);

  res.json({ success: true, data: updatedDriver, message: 'Driver profile updated.' });
});

// DELETE /api/drivers/:id
router.delete('/:id', requireRBAC('drivers', 'delete'), (req, res) => {
  const db = getDB();
  const index = db.drivers.findIndex((d) => d.id === req.params.id);
  if (index === -1) return res.status(404).json({ success: false, error: 'Driver not found.' });

  const removed = db.drivers.splice(index, 1)[0];
  saveDB(db);

  res.json({ success: true, data: removed, message: `Driver '${removed.name}' removed from active pool.` });
});

export default router;
