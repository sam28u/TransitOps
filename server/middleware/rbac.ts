import type { Request, Response, NextFunction } from 'express';
import { getDB } from '../db.js';
import type { Role } from '../../src/types.js';

export interface AuthenticatedRequest extends Request {
  userRole?: Role;
}

export const requireRBAC = (moduleName: string, permission: 'view' | 'create' | 'edit' | 'delete') => {
  return (req: AuthenticatedRequest, res: Response, next: NextFunction): void => {
    const roleHeader = (req.headers['x-user-role'] || req.headers['authorization'] || 'Fleet Manager') as Role;
    req.userRole = roleHeader;

    // Fleet Manager is super admin by default, or check exact matrix
    const db = getDB();
    const rolePermissions = db.rbacMatrix[roleHeader] || db.rbacMatrix['Fleet Manager'] || {};
    const modulePermissions = rolePermissions[moduleName] || { view: true, create: true, edit: true, delete: true };

    if (!modulePermissions[permission]) {
      res.status(403).json({
        success: false,
        error: `RBAC Violation: Role '${roleHeader}' is denied '${permission.toUpperCase()}' access on module '${moduleName}'.`,
        role: roleHeader,
        module: moduleName,
        permissionDenied: permission,
      });
      return;
    }

    next();
  };
};
