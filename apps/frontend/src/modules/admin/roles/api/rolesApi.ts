import { axiosInstance } from "../../../../services/api/axiosInstance";

export interface RoleRecord {
  id: string;
  name: string;
  description: string | null;
  isSystemRole: boolean;
}

export interface PermissionRecord {
  id: string;
  key: string;
  module: string;
  description: string | null;
}

export const rolesApi = {
  async list(): Promise<RoleRecord[]> {
    const res = await axiosInstance.get("/roles");
    return res.data.data;
  },
  async create(name: string, description?: string) {
    const res = await axiosInstance.post("/roles", { name, description });
    return res.data.data as RoleRecord;
  },
  async remove(id: string) {
    await axiosInstance.delete(`/roles/${id}`);
  },
  async getPermissions(roleId: string): Promise<PermissionRecord[]> {
    const res = await axiosInstance.get(`/roles/${roleId}/permissions`);
    return res.data.data;
  },
  async setPermissions(roleId: string, permissionIds: string[]) {
    const res = await axiosInstance.put(`/roles/${roleId}/permissions`, { permissionIds });
    return res.data.data as PermissionRecord[];
  },
  async assignToUser(userId: string, roleId: string) {
    await axiosInstance.post(`/users/${userId}/roles`, { roleId, scopeType: "global", scopeId: "" });
  },
  async removeFromUser(userId: string, roleId: string) {
    await axiosInstance.delete(`/users/${userId}/roles`, { data: { roleId, scopeType: "global", scopeId: "" } });
  },
};

export const permissionsApi = {
  async list(): Promise<PermissionRecord[]> {
    const res = await axiosInstance.get("/permissions");
    return res.data.data;
  },
};
