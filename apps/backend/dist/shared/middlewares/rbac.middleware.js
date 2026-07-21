"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.requirePermission = requirePermission;
const DomainError_1 = require("../../core/domain/errors/DomainError");
const MySqlRoleRepository_1 = require("../../modules/rbac/infrastructure/repositories/MySqlRoleRepository");
/* Live permission check against the DB rather than trusting claims baked into
   the JWT, so a permission/role change takes effect on the very next request
   instead of waiting out the access-token lifetime. Swap for a Redis-cached
   lookup once request volume makes the per-request query a bottleneck. */
const roleRepository = new MySqlRoleRepository_1.MySqlRoleRepository();
function requirePermission(permissionKey) {
    return async (req, _res, next) => {
        if (!req.user) {
            throw new DomainError_1.UnauthorizedError();
        }
        const permissionKeys = await roleRepository.getPermissionKeysForUser(req.user.sub);
        if (!permissionKeys.includes(permissionKey)) {
            throw new DomainError_1.ForbiddenError(`Missing required permission: ${permissionKey}`);
        }
        next();
    };
}
//# sourceMappingURL=rbac.middleware.js.map