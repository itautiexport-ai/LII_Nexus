import { axiosInstance } from "../../../../../services/api/axiosInstance";

export interface EmployeeRecord {
  id: string;
  employeeCode: string;
  fullName: string;
  email: string | null;
  phone: string | null;
  departmentId: string | null;
  designationId: string | null;
  managerId: string | null;
  userId: string | null;
  departmentName: string | null;
  designationTitle: string | null;
  managerName: string | null;
  dateOfJoining: string | null;
  birthday: string | null;
  anniversary: string | null;
  status: "active" | "inactive";
  salary: number;
}

export const employeesApi = {
  async getMe(): Promise<EmployeeRecord | null> {
    const res = await axiosInstance.get("/employees/me");
    return res.data.data;
  },
  async list(search = ""): Promise<EmployeeRecord[]> {
    const res = await axiosInstance.get("/employees", { params: { search, page: 1, pageSize: 1000 } });
    return res.data.data;
  },
  async listForDropdown(search = ""): Promise<{ id: string; employeeCode: string; fullName: string; departmentName: string; designationTitle: string }[]> {
    const res = await axiosInstance.get("/employees/lookup", { params: { search } });
    const items = res.data.data;
    return items.filter((emp: any) => {
      const title = emp.designationTitle?.toLowerCase() || "";
      return !title.includes("director") && !title.includes("admin");
    });
  },
  async create(payload: {
    employeeCode: string; fullName: string; email?: string; phone?: string;
    departmentId?: string | null; designationId?: string | null; managerId?: string | null; dateOfJoining?: string;
    birthday?: string; anniversary?: string; salary?: number;
  }) {
    const res = await axiosInstance.post("/employees", payload);
    return res.data.data as EmployeeRecord;
  },
  async update(id: string, payload: Partial<{
    employeeCode: string; fullName: string; email: string | null; phone: string | null;
    departmentId: string | null; designationId: string | null; managerId: string | null; userId: string | null;
    dateOfJoining: string | null; birthday: string | null; anniversary: string | null; status: string; salary: number;
  }>) {
    const res = await axiosInstance.patch(`/employees/${id}`, payload);
    return res.data.data as EmployeeRecord;
  },
  async remove(id: string) {
    await axiosInstance.delete(`/employees/${id}`);
  },
};
