import { User } from "../entities/User";

export interface CreateUserData {
  id: string;
  employeeCode: string | null;
  email: string;
  passwordHash: string;
  tempPassword?: string | null;
  fullName: string;
  whatsappNumber?: string | null;
}

export interface UpdateUserData {
  email?: string;
  employeeCode?: string | null;
  fullName?: string;
  whatsappNumber?: string | null;
  status?: User["status"];
  passwordHash?: string;
}

export interface IUserRepository {
  findById(id: string): Promise<User | null>;
  findByIdentifier(identifier: string): Promise<User | null>;
  list(params: { page: number; pageSize: number; search?: string }): Promise<{ items: User[]; total: number }>;
  create(data: CreateUserData): Promise<User>;
  update(id: string, changes: UpdateUserData): Promise<User>;
  softDelete(id: string): Promise<void>;
  touchLastLogin(id: string): Promise<void>;
}
