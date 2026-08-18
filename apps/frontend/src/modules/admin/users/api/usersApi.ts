import { axiosInstance } from "../../../../services/api/axiosInstance";

export interface UserRecord {
  id: string;
  employeeCode: string | null;
  email: string;
  tempPassword?: string | null;
  fullName: string;
  whatsappNumber?: string | null;
  avatarUrl?: string | null;
  status: "active" | "suspended" | "inactive";
  roles: string[];
  department?: string | null;
  departmentId?: string | null;
}

export const usersApi = {
  async list(search = ""): Promise<UserRecord[]> {
    const res = await axiosInstance.get("/users", { params: { search, page: 1, pageSize: 100000 } });
    return res.data.data;
  },
  async listPaginated(page = 1, pageSize = 100000, search = ""): Promise<{ data: UserRecord[], meta: any }> {
    const res = await axiosInstance.get("/users", { params: { search, page, pageSize } });
    return { data: res.data.data, meta: res.data.meta };
  },
  async create(payload: {
    email: string;
    password: string;
    fullName: string;
    whatsappNumber?: string | null;
    employeeCode?: string | null;
    designationId?: string | null;
    departmentId?: string | null;
    shiftId?: string | null;
    roles?: string[];
  }) {
    const res = await axiosInstance.post("/users", payload);
    return res.data.data as UserRecord;
  },
  async update(id: string, payload: Partial<{ fullName: string; whatsappNumber: string | null; status: string; employeeCode: string | null; departmentId: string | null; email: string; avatarUrl: string | null }>) {
    const res = await axiosInstance.patch(`/users/${id}`, payload);
    return res.data.data as UserRecord;
  },
  async uploadAvatar(id: string, file: File): Promise<string> {
    const formData = new FormData();
    formData.append("avatar", file);
    const res = await axiosInstance.post(`/users/${id}/avatar`, formData, {
      headers: { "Content-Type": "multipart/form-data" },
    });
    return res.data.data.avatarUrl as string;
  },
  async deactivate(id: string) {
    await axiosInstance.delete(`/users/${id}`);
  },
};

