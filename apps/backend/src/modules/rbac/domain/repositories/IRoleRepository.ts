import { Permission, Role } from "../entities/Role";

export interface IRoleRepository {
  list(): Promise<Role[]>;
  findById(id: string): Promise<Role | null>;
  findByName(name: string): Promise<Role | null>;
  create(data: { id: string; name: string; description?: string | null }): Promise<Role>;
  update(id: string, changes: { name?: string; description?: string | null }): Promise<Role>;
  delete(id: string): Promise<void>;

  listPermissions(): Promise<Permission[]>;
  getPermissionsForRole(roleId: string): Promise<Permission[]>;
  setRolePermissions(roleId: string, permissionIds: string[]): Promise<void>;

  getRolesForUser(userId: string): Promise<Role[]>;
  getPermissionKeysForUser(userId: string): Promise<string[]>;
  assignRoleToUser(userId: string, roleId: string, scopeType: string, scopeId: string): Promise<void>;
  removeRoleFromUser(userId: string, roleId: string, scopeType: string, scopeId: string): Promise<void>;
}
