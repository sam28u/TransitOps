import { Router } from 'express';
import { getDB, saveDB } from '../db.js';
import { requireRBAC } from '../middleware/rbac.js';
import type { FuelLog, ExpenseLog } from '../../src/types.js';

const router = Router();

// GET /api/expenses
router.get('/', requireRBAC('fuel', 'view'), (req, res) => {
  const db = getDB();
  res.json({
    success: true,
    data: {
      fuelLogs: db.fuelLogs,
      expenseLogs: db.expenseLogs,
      summary: {
        totalFuelCost: db.fuelLogs.reduce((acc, f) => acc + f.cost, 0),
        totalOperationalExpense: db.expenseLogs.reduce((acc, e) => acc + e.amount, 0),
      },
    },
  });
});

// POST /api/expenses/fuel
router.post('/fuel', requireRBAC('fuel', 'create'), (req, res) => {
  const db = getDB();
  const body = req.body as Omit<FuelLog, 'id'>;

  const vehicle = db.vehicles.find((v) => v.id === body.vehicleId);
  if (!vehicle) return res.status(404).json({ success: false, error: 'Vehicle not found.' });

  const newFuelLog: FuelLog = {
    id: `fuel-${Date.now()}`,
    vehicleId: body.vehicleId,
    liters: Number(body.liters) || 50,
    cost: Number(body.cost) || 75,
    date: body.date || new Date().toISOString().split('T')[0],
    odometerReading: Number(body.odometerReading) || vehicle.odometer,
    stationName: body.stationName || 'TransitOps Authorized Fuel Depot',
  };

  db.fuelLogs.unshift(newFuelLog);
  saveDB(db);

  res.status(201).json({ success: true, data: newFuelLog, message: `Fuel refill (${newFuelLog.liters}L) logged.` });
});

// POST /api/expenses/operational
router.post('/operational', requireRBAC('fuel', 'create'), (req, res) => {
  const db = getDB();
  const body = req.body as Omit<ExpenseLog, 'id'>;

  const newExpenseLog: ExpenseLog = {
    id: `exp-${Date.now()}`,
    category: body.category || 'Repair',
    description: body.description || 'General operational maintenance expense',
    amount: Number(body.amount) || 150,
    date: body.date || new Date().toISOString().split('T')[0],
    vehicleId: body.vehicleId,
  };

  db.expenseLogs.unshift(newExpenseLog);
  saveDB(db);

  res.status(201).json({ success: true, data: newExpenseLog, message: `Operational expense ($${newExpenseLog.amount}) logged.` });
});

// DELETE /api/expenses/:type/:id
router.delete('/:type/:id', requireRBAC('fuel', 'delete'), (req, res) => {
  const db = getDB();
  const { type, id } = req.params;

  if (type === 'fuel') {
    const idx = db.fuelLogs.findIndex((f) => f.id === id);
    if (idx === -1) return res.status(404).json({ success: false, error: 'Fuel log not found.' });
    const removed = db.fuelLogs.splice(idx, 1)[0];
    saveDB(db);
    return res.json({ success: true, data: removed, message: 'Fuel log deleted.' });
  } else {
    const idx = db.expenseLogs.findIndex((e) => e.id === id);
    if (idx === -1) return res.status(404).json({ success: false, error: 'Expense log not found.' });
    const removed = db.expenseLogs.splice(idx, 1)[0];
    saveDB(db);
    return res.json({ success: true, data: removed, message: 'Expense log deleted.' });
  }
});

export default router;
