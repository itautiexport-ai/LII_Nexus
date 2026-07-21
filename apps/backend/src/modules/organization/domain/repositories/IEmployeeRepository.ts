import { Employee, EmployeeWithRelations } from "../entities/Employee";

export interface CreateEmployeeData {
  id: string;
  employeeCode: string;
  fullName: string;
  email?: string | null;
  phone?: string | null;
  departmentId?: string | null;
  designationId?: string | null;
  managerId?: string | null;
  userId?: string | null;
  shiftId?: string | null;
  dateOfJoining?: string | null;
  birthday?: string | null;
  anniversary?: string | null;
}

export interface UpdateEmployeeData {
  employeeCode?: string;
  fullName?: string;
  email?: string | null;
  phone?: string | null;
  departmentId?: string | null;
  designationId?: string | null;
  managerId?: string | null;
  userId?: string | null;
  shiftId?: string | null;
  dateOfJoining?: string | null;
  birthday?: string | null;
  anniversary?: string | null;
  status?: Employee["status"];
}

export interface IEmployeeRepository {
  list(params: { page: number; pageSize: number; search?: string; departmentId?: string }): Promise<{ items: EmployeeWithRelations[]; total: number }>;
  findById(id: string): Promise<Employee | null>;
  findByEmployeeCode(employeeCode: string): Promise<Employee | null>;
  findByUserId(userId: string): Promise<Employee | null>;
  checkHodExists(id: string): Promise<boolean>;
  listDirectReports(managerId: string): Promise<Employee[]>;
  create(data: CreateEmployeeData): Promise<Employee>;
  update(id: string, changes: UpdateEmployeeData): Promise<Employee>;
  softDelete(id: string): Promise<void>;
}
