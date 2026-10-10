import { Response, NextFunction } from "express";
import { AuthenticatedRequest } from "./auth.middleware";
import { ForbiddenError, UnauthorizedError } from "../../core/domain/errors/DomainError";
import { MySqlRoleRepository } from "../../modules/rbac/infrastructure/repositories/MySqlRoleRepository";
import { pool } from "../../infrastructure/database/mysql/connection";

const roleRepository = new MySqlRoleRepository();

export async function isSystemAdminUser(userId: string): Promise<boolean> {
  const [rows] = await pool.query<any[]>(`
    SELECT r.name as role_name, r.code as role_code, u.email
    FROM users u
    LEFT JOIN user_roles ur ON u.id = ur.user_id
    LEFT JOIN roles r ON ur.role_id = r.id
    WHERE u.id = ?
  `, [userId]);

  return rows.some((r: any) => 
    r.role_name === 'System Admin' || 
    r.role_name === 'Super Admin' || 
    r.role_name === 'System Administrator' ||
    r.role_code === 'system_admin' || 
    r.role_code === 'super_admin' ||
    r.email === 'admin' ||
    r.email === 'admin@liinexus.com'
  );
}

export async function isAdminUser(userId: string): Promise<boolean> {
  const [rows] = await pool.query<any[]>(`
    SELECT r.name as role_name, r.code as role_code, desig.title as designation_title, u.email
    FROM users u
    LEFT JOIN user_roles ur ON u.id = ur.user_id
    LEFT JOIN roles r ON ur.role_id = r.id
    LEFT JOIN employees e ON u.id = e.user_id AND e.deleted_at IS NULL
    LEFT JOIN designations desig ON e.designation_id = desig.id
    WHERE u.id = ?
  `, [userId]);

  return rows.some((r: any) => {
    const roleName = (r.role_name || '').toLowerCase();
    const roleCode = (r.role_code || '').toLowerCase();
    const desigTitle = (r.designation_title || '').toLowerCase();
    const email = (r.email || '').toLowerCase();

    return (
      email === 'admin' || email === 'admin@liinexus.com' ||
      roleName.includes('admin') || roleCode.includes('admin') ||
      roleName.includes('management') || roleCode.includes('management') ||
      desigTitle.includes('admin') ||
      desigTitle.includes('management') ||
      desigTitle.includes('management executive')
    );
  });
}

export function requireSystemAdmin() {
  return async (req: AuthenticatedRequest, _res: Response, next: NextFunction) => {
    if (!req.user) {
      throw new UnauthorizedError();
    }
    const isSysAdmin = await isSystemAdminUser(req.user.sub);
    if (!isSysAdmin) {
      throw new ForbiddenError("Deletion is restricted strictly to System Admin users.");
    }
    next();
  };
}

export function requirePermission(permissionKey: string) {
  return async (req: AuthenticatedRequest, _res: Response, next: NextFunction) => {
    if (!req.user) {
      throw new UnauthorizedError();
    }

    const isDeleteAction = permissionKey.toLowerCase().includes("delete") || 
                           permissionKey.toLowerCase().includes("deactivate") || 
                           req.method === "DELETE";

    if (isDeleteAction) {
      const isSysAdmin = await isSystemAdminUser(req.user.sub);
      if (!isSysAdmin) {
        throw new ForbiddenError("Deletion is restricted strictly to System Admin users.");
      }
      return next();
    }

    const isSysAdmin = await isSystemAdminUser(req.user.sub);
    const isAdmin = await isAdminUser(req.user.sub);

    if (isSysAdmin || isAdmin) {
      return next();
    }

    const permissionKeys = await roleRepository.getPermissionKeysForUser(req.user.sub);
    if (!permissionKeys.includes(permissionKey)) {
      throw new ForbiddenError(`Missing required permission: ${permissionKey}`);
    }
    next();
  };
}

export function requireAdmin() {
  return async (req: AuthenticatedRequest, _res: Response, next: NextFunction) => {
    if (!req.user) {
      throw new UnauthorizedError();
    }

    if (req.method === "DELETE") {
      const isSysAdmin = await isSystemAdminUser(req.user.sub);
      if (!isSysAdmin) {
        throw new ForbiddenError("Deletion is restricted strictly to System Admin users.");
      }
      return next();
    }

    const isAdmin = await isAdminUser(req.user.sub);
    if (!isAdmin) {
      throw new ForbiddenError("Only Admin accounts are permitted to perform this operation.");
    }
    next();
  };
}


