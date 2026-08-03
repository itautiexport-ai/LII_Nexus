export type EmployeeStatus = "active" | "inactive";

export interface Employee {
  id: string;
  employeeCode: string;
  fullName: string;
  email: string | null;
  phone: string | null;
  departmentId: string | null;
  designationId: string | null;
  managerId: string | null;
  userId: string | null;
  shiftId: string | null;
  dateOfJoining: string | null;
  birthday: string | null;
  anniversary: string | null;
  status: EmployeeStatus;
  salary: number;
  createdAt: Date;
  updatedAt: Date;
  deletedAt: Date | null;
}

/** Denormalized shape returned to clients so the UI doesn't need N follow-up lookups. */
export interface EmployeeWithRelations extends Employee {
  departmentName: string | null;
  designationTitle: string | null;
  managerName: string | null;
  shiftName: string | null;
}
