import { Router } from 'express';
import { getDB, saveDB } from '../db.js';
import { requireRBAC } from '../middleware/rbac.js';
import type { MaintenanceLog, VehicleStatus } from '../../src/types.js';

const router = Router();

// GET /api/maintenance
router.get('/', requireRBAC('maintenance', 'view'), (req, res) => {
  const db = getDB();
  const { status } = req.query;

  let filtered = [...db.maintenanceLogs];
  if (status && status !== 'All') filtered = filtered.filter((m) => m.status === status);

  res.json({ success: true, count: filtered.length, data: filtered });
});

// POST /api/maintenance (Log service & enforce Workshop Lockout)
router.post('/', requireRBAC('maintenance', 'create'), (req, res) => {
  const db = getDB();
  const body = req.body as Omit<MaintenanceLog, 'id' | 'serviceCode'>;

  const vehicle = db.vehicles.find((v) => v.id === body.vehicleId);
  if (!vehicle) {
    return res.status(404).json({ success: false, error: 'Vehicle not found in fleet registry.' });
  }

  const id = `mnt-${Date.now()}`;
  const serviceCode = `MNT-2026-${Math.floor(200 + Math.random() * 800)}`;
  const status = body.status || 'In Progress';

  const newLog: MaintenanceLog = {
    id,
    serviceCode,
    vehicleId: body.vehicleId,
    serviceDescription: body.serviceDescription || 'Routine Service & Inspection',
    cost: Number(body.cost) || 250,
    date: body.date || new Date().toISOString().split('T')[0],
    status,
    provider: body.provider || 'TransitOps Authorized Workshop',
  };

  db.maintenanceLogs.unshift(newLog);

  // AUTOMATIC WORKSHOP LOCKOUT: If In Progress or Scheduled, switch Vehicle to In Shop
  if (status === 'In Progress' || status === 'Scheduled') {
    const vIdx = db.vehicles.findIndex((v) => v.id === body.vehicleId);
    if (vIdx !== -1) {
      db.vehicles[vIdx].status = 'In Shop';
    }
  }

  saveDB(db);

  res.status(201).json({
    success: true,
    data: newLog,
    message: `Service order '${serviceCode}' logged. Vehicle '${vehicle.registrationNumber}' automatically locked inside Workshop ('In Shop')!`,
  });
});

// PUT /api/maintenance/:id/close
router.put('/:id/close', requireRBAC('maintenance', 'edit'), (req, res) => {
  const db = getDB();
  const logIndex = db.maintenanceLogs.findIndex((m) => m.id === req.params.id);
  if (logIndex === -1) return res.status(404).json({ success: false, error: 'Maintenance order not found.' });

  const log = db.maintenanceLogs[logIndex];
  db.maintenanceLogs[logIndex].status = 'Completed';

  // Restore vehicle to Available (if not retired and no other active maintenance)
  const vehicle = db.vehicles.find((v) => v.id === log.vehicleId);
  if (vehicle && vehicle.status !== 'Retired') {
    const hasOtherActive = db.maintenanceLogs.some(
      (m) => m.vehicleId === log.vehicleId && m.id !== log.id && (m.status === 'In Progress' || m.status === 'Scheduled')
    );
    if (!hasOtherActive) {
      const vIdx = db.vehicles.findIndex((v) => v.id === vehicle.id);
      if (vIdx !== -1) db.vehicles[vIdx].status = 'Available';
    }
  }

  saveDB(db);

  res.json({
    success: true,
    data: db.maintenanceLogs[logIndex],
    message: `Service order '${log.serviceCode}' completed. Vehicle restored to 'Available'.`,
  });
});

export default router;
