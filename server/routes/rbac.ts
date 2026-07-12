import { Router } from 'express';
import { getDB, saveDB } from '../db.js';
import { requireRBAC } from '../middleware/rbac.js';
import type { Role } from '../../src/types.js';

const router = Router();

// GET /api/rbac
router.get('/', (req, res) => {
  const db = getDB();
  res.json({ success: true, data: db.rbacMatrix });
});

// PUT /api/rbac
router.put('/', requireRBAC('settings', 'edit'), (req, res) => {
  const { role, module, permission, value } = req.body;
  const db = getDB();

  const targetRole = role as Role;
  if (!db.rbacMatrix[targetRole]) {
    return res.status(404).json({ success: false, error: `Role '${role}' not found in matrix.` });
  }

  const roleCopy = { ...(db.rbacMatrix[targetRole] || {}) };
  const modCopy = { ...(roleCopy[module] || { view: true, create: false, edit: false, delete: false }) };
  modCopy[permission as 'view' | 'create' | 'edit' | 'delete'] = Boolean(value);
  roleCopy[module] = modCopy;
  db.rbacMatrix[targetRole] = roleCopy;

  saveDB(db);

  res.json({ success: true, data: db.rbacMatrix, message: `RBAC rule updated for ${targetRole} (${module}.${permission} -> ${value}).` });
});

export default router;
