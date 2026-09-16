import { Response, NextFunction } from "express";
import { AuthenticatedRequest } from "./auth.middleware";
import { ForbiddenError, UnauthorizedError } from "../../core/domain/errors/DomainError";
import { MySqlRoleRepository } from "../../modules/rbac/infrastructure/repositories/MySqlRoleRepository";

/* Live permission check against the DB rather than trusting claims baked into
   the JWT, so a permission/role change takes effect on the very next request
   instead of waiting out the access-token lifetime. Swap for a Redis-cached
   lookup once request volume makes the per-request query a bottleneck. */
const roleRepository = new MySqlRoleRepository();

export function requirePermission(permissionKey: string) {
  return async (req: AuthenticatedRequest, _res: Response, next: NextFunction) => {
    if (!req.user) {
      throw new UnauthorizedError();
    }
    const permissionKeys = await roleRepository.getPermissionKeysForUser(req.user.sub);
    if (!permissionKeys.includes(permissionKey)) {
      throw new ForbiddenError(`Missing required permission: ${permissionKey}`);
    }
    next();
  };
}

import { pool } from "../../infrastructure/database/mysql/connection";

export function requireAdmin() {
  return async (req: AuthenticatedRequest, _res: Response, next: NextFunction) => {
    if (!req.user) {
      throw new UnauthorizedError();
    }
    const [rows] = await pool.query<any[]>(`
      SELECT r.name as role_name
      FROM users u
      LEFT JOIN user_roles ur ON u.id = ur.user_id
      LEFT JOIN roles r ON ur.role_id = r.id
      WHERE u.id = ?
    `, [req.user.sub]);

    const isAdmin = rows.some((r: any) =>
      r.role_name === 'System Admin' || r.role_name === 'Super Admin' || r.role_name === 'Admin'
    );
    if (!isAdmin) {
      throw new ForbiddenError("Only Admin accounts are permitted to perform deletion.");
    }
    next();
  };
}
