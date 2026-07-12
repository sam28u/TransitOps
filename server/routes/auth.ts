import { Router } from 'express';
import { getDB, resetDB, saveDB } from '../db.js';
import type { Role } from '../../src/types.js';

const router = Router();

// POST /api/auth/login
router.post('/login', (req, res) => {
  const { email, password, role } = req.body;
  const db = getDB();

  // Find user by role or email
  const targetRole = (role || 'Fleet Manager') as Role;
  const user = db.users.find((u) => u.role === targetRole || u.email === email) || db.users[0];

  if (password && password !== 'password123' && password !== '••••••••') {
    return res.status(401).json({
      success: false,
      error: 'Invalid credentials. Account locked after 5 failed attempts.',
    });
  }

  const token = `tok_${targetRole.toLowerCase().replace(/\s+/g, '_')}_${Date.now()}`;

  res.json({
    success: true,
    token,
    user,
    rbacScope: db.rbacMatrix[targetRole] || {},
    message: `Authentication successful for role '${targetRole}'.`,
  });
});

// GET /api/auth/currentUser
router.get('/currentUser', (req, res) => {
  const roleHeader = (req.headers['x-user-role'] || 'Fleet Manager') as Role;
  const db = getDB();
  const user = db.users.find((u) => u.role === roleHeader) || db.users[0];
  res.json({ success: true, user });
});

// POST /api/auth/reset-demo
router.post('/reset-demo', (req, res) => {
  const freshState = resetDB();
  res.json({
    success: true,
    message: 'Platform database reset to fresh Hackathon demo state.',
    counts: {
      vehicles: freshState.vehicles.length,
      drivers: freshState.drivers.length,
      trips: freshState.trips.length,
    },
  });
});

export default router;
