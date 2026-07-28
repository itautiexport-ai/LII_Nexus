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
}

export function toPublicUser(user: User, roles: string[] = []): UserPublic {
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
  };
}
