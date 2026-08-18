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

export function requireAnyPermission(permissionKeys: string[]) {
  return async (req: AuthenticatedRequest, _res: Response, next: NextFunction) => {
    if (!req.user) {
      throw new UnauthorizedError();
    }
    const userKeys = await roleRepository.getPermissionKeysForUser(req.user.sub);
    const hasAny = permissionKeys.some(key => userKeys.includes(key));
    if (!hasAny) {
      throw new ForbiddenError(`Missing one of required permissions: ${permissionKeys.join(", ")}`);
    }
    next();
  };
}
