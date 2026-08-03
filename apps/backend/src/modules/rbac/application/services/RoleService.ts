import { v4 as uuid } from "uuid";
import { IRoleRepository } from "../../domain/repositories/IRoleRepository";
import { ConflictError, NotFoundError } from "../../../../core/domain/errors/DomainError";
import { AuditService } from "../../../../shared/services/AuditService";

export class RoleService {
  constructor(private readonly roleRepository: IRoleRepository) {}

  listRoles() {
    return this.roleRepository.list();
  }

  listPermissions() {
    return this.roleRepository.listPermissions();
  }

  async getRolePermissions(roleId: string) {
    const role = await this.roleRepository.findById(roleId);
    if (!role) throw new NotFoundError("Role not found.");
    return this.roleRepository.getPermissionsForRole(roleId);
  }

  async createRole(name: string, description: string | null | undefined, actorId: string) {
    const existing = await this.roleRepository.findByName(name);
    if (existing) throw new ConflictError("A role with this name already exists.");
    const role = await this.roleRepository.create({ id: uuid(), name, description });
    await AuditService.record({ actorUserId: actorId, action: "ROLE_CREATED", entityType: "role", entityId: role.id, afterState: { name } });
    return role;
  }

  async updateRole(id: string, changes: { name?: string; description?: string | null }, actorId: string) {
    const role = await this.roleRepository.findById(id);
    if (!role) throw new NotFoundError("Role not found.");
    const updated = await this.roleRepository.update(id, changes);
    await AuditService.record({ actorUserId: actorId, action: "ROLE_UPDATED", entityType: "role", entityId: id, beforeState: role, afterState: updated });
    return updated;
  }

  async deleteRole(id: string, actorId: string) {
    const role = await this.roleRepository.findById(id);
    if (!role) throw new NotFoundError("Role not found.");
    if (role.isSystemRole) throw new ConflictError("System roles cannot be deleted.");
    await this.roleRepository.delete(id);
    await AuditService.record({ actorUserId: actorId, action: "ROLE_DELETED", entityType: "role", entityId: id });
  }

  async setRolePermissions(roleId: string, permissionIds: string[], actorId: string) {
    const role = await this.roleRepository.findById(roleId);
    if (!role) throw new NotFoundError("Role not found.");
    await this.roleRepository.setRolePermissions(roleId, permissionIds);
    await AuditService.record({
      actorUserId: actorId,
      action: "ROLE_PERMISSIONS_UPDATED",
      entityType: "role",
      entityId: roleId,
      afterState: { permissionIds },
    });
    return this.roleRepository.getPermissionsForRole(roleId);
  }

  async assignRoleToUser(userId: string, roleId: string, scopeType: string, scopeId: string, actorId: string) {
    const role = await this.roleRepository.findById(roleId);
    if (!role) throw new NotFoundError("Role not found.");
    await this.roleRepository.assignRoleToUser(userId, roleId, scopeType, scopeId);
    await AuditService.record({
      actorUserId: actorId,
      action: "USER_ROLE_ASSIGNED",
      entityType: "user",
      entityId: userId,
      afterState: { roleId, scopeType, scopeId },
    });
  }

  async removeRoleFromUser(userId: string, roleId: string, scopeType: string, scopeId: string, actorId: string) {
    await this.roleRepository.removeRoleFromUser(userId, roleId, scopeType, scopeId);
    await AuditService.record({
      actorUserId: actorId,
      action: "USER_ROLE_REMOVED",
      entityType: "user",
      entityId: userId,
      afterState: { roleId, scopeType, scopeId },
    });
  }

  getRolesForUser(userId: string) {
    return this.roleRepository.getRolesForUser(userId);
  }
}
