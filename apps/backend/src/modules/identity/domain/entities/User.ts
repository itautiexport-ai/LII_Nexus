export type UserStatus = "active" | "suspended" | "inactive";

export interface User {
  id: string;
  employeeCode: string | null;
  email: string;
  passwordHash: string;
  tempPassword?: string | null;
  fullName: string;
  whatsappNumber?: string | null;
  avatarUrl?: string | null;
  status: UserStatus;
  lastLoginAt: Date | null;
  createdAt: Date;
  updatedAt: Date;
  deletedAt: Date | null;
}

/** Safe shape returned to clients - never includes passwordHash. */
export interface UserPublic {
  id: string;
  employeeCode: string | null;
  email: string;
  tempPassword?: string | null;
  fullName: string;
  whatsappNumber?: string | null;
  avatarUrl?: string | null;
  status: UserStatus;
  lastLoginAt: Date | null;
  createdAt: Date;
  roles: string[];
  department?: string | null;
  departmentId?: string | null;
  designation?: string | null;
  designationId?: string | null;
  hodId?: string | null;
  hodName?: string | null;
  managerId?: string | null;
}

export function toPublicUser(
  user: User, 
  roles: string[] = [], 
  extra: { department?: string | null; departmentId?: string | null; designation?: string | null; designationId?: string | null; hodId?: string | null; hodName?: string | null; managerId?: string | null } = {}
): UserPublic {
  return {
    id: user.id,
    employeeCode: user.employeeCode,
    email: user.email,
    tempPassword: user.tempPassword,
    fullName: user.fullName,
    whatsappNumber: user.whatsappNumber,
    avatarUrl: user.avatarUrl,
    status: user.status,
    lastLoginAt: user.lastLoginAt,
    createdAt: user.createdAt,
    roles,
    department: extra.department ?? null,
    departmentId: extra.departmentId ?? null,
    designation: extra.designation ?? null,
    designationId: extra.designationId ?? null,
    hodId: extra.hodId ?? null,
    hodName: extra.hodName ?? null,
    managerId: extra.managerId ?? null,
  };
}
