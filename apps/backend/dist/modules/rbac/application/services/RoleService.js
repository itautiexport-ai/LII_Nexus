"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.RoleService = void 0;
const uuid_1 = require("uuid");
const DomainError_1 = require("../../../../core/domain/errors/DomainError");
const AuditService_1 = require("../../../../shared/services/AuditService");
class RoleService {
    constructor(roleRepository) {
        this.roleRepository = roleRepository;
    }
    listRoles() {
        return this.roleRepository.list();
    }
    listPermissions() {
        return this.roleRepository.listPermissions();
    }
    async getRolePermissions(roleId) {
        const role = await this.roleRepository.findById(roleId);
        if (!role)
            throw new DomainError_1.NotFoundError("Role not found.");
        return this.roleRepository.getPermissionsForRole(roleId);
    }
    async createRole(name, description, actorId) {
        const existing = await this.roleRepository.findByName(name);
        if (existing)
            throw new DomainError_1.ConflictError("A role with this name already exists.");
        const role = await this.roleRepository.create({ id: (0, uuid_1.v4)(), name, description });
        await AuditService_1.AuditService.record({ actorUserId: actorId, action: "ROLE_CREATED", entityType: "role", entityId: role.id, afterState: { name } });
        return role;
    }
    async updateRole(id, changes, actorId) {
        const role = await this.roleRepository.findById(id);
        if (!role)
            throw new DomainError_1.NotFoundError("Role not found.");
        const updated = await this.roleRepository.update(id, changes);
        await AuditService_1.AuditService.record({ actorUserId: actorId, action: "ROLE_UPDATED", entityType: "role", entityId: id, beforeState: role, afterState: updated });
        return updated;
    }
    async deleteRole(id, actorId) {
        const role = await this.roleRepository.findById(id);
        if (!role)
            throw new DomainError_1.NotFoundError("Role not found.");
        if (role.isSystemRole)
            throw new DomainError_1.ConflictError("System roles cannot be deleted.");
        await this.roleRepository.delete(id);
        await AuditService_1.AuditService.record({ actorUserId: actorId, action: "ROLE_DELETED", entityType: "role", entityId: id });
    }
    async setRolePermissions(roleId, permissionIds, actorId) {
        const role = await this.roleRepository.findById(roleId);
        if (!role)
            throw new DomainError_1.NotFoundError("Role not found.");
        await this.roleRepository.setRolePermissions(roleId, permissionIds);
        await AuditService_1.AuditService.record({
            actorUserId: actorId,
            action: "ROLE_PERMISSIONS_UPDATED",
            entityType: "role",
            entityId: roleId,
            afterState: { permissionIds },
        });
        return this.roleRepository.getPermissionsForRole(roleId);
    }
    async assignRoleToUser(userId, roleId, scopeType, scopeId, actorId) {
        const role = await this.roleRepository.findById(roleId);
        if (!role)
            throw new DomainError_1.NotFoundError("Role not found.");
        await this.roleRepository.assignRoleToUser(userId, roleId, scopeType, scopeId);
        await AuditService_1.AuditService.record({
            actorUserId: actorId,
            action: "USER_ROLE_ASSIGNED",
            entityType: "user",
            entityId: userId,
            afterState: { roleId, scopeType, scopeId },
        });
    }
    async removeRoleFromUser(userId, roleId, scopeType, scopeId, actorId) {
        await this.roleRepository.removeRoleFromUser(userId, roleId, scopeType, scopeId);
        await AuditService_1.AuditService.record({
            actorUserId: actorId,
            action: "USER_ROLE_REMOVED",
            entityType: "user",
            entityId: userId,
            afterState: { roleId, scopeType, scopeId },
        });
    }
    getRolesForUser(userId) {
        return this.roleRepository.getRolesForUser(userId);
    }
}
exports.RoleService = RoleService;
//# sourceMappingURL=RoleService.js.map