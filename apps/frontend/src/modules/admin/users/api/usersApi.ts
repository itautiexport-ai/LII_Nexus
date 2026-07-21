import { axiosInstance } from "../../../../services/api/axiosInstance";

export interface UserRecord {
  id: string;
  employeeCode: string | null;
  email: string;
  tempPassword?: string | null;
  fullName: string;
  whatsappNumber?: string | null;
  status: "active" | "suspended" | "inactive";
  roles: string[];
}

export const usersApi = {
  async list(search = ""): Promise<UserRecord[]> {
    const res = await axiosInstance.get("/users", { params: { search, page: 1, pageSize: 50 } });
    return res.data.data;
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
  async update(id: string, payload: Partial<{ fullName: string; whatsappNumber: string | null; status: string; employeeCode: string | null }>) {
    const res = await axiosInstance.patch(`/users/${id}`, payload);
    return res.data.data as UserRecord;
  },
  async deactivate(id: string) {
    await axiosInstance.delete(`/users/${id}`);
  },
};
