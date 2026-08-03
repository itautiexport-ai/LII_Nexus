import { Department } from "../entities/Department";

export interface IDepartmentRepository {
  list(): Promise<Department[]>;
  findById(id: string): Promise<Department | null>;
  findByName(name: string): Promise<Department | null>;
  create(data: { id: string; name: string; code?: string | null; description?: string | null }): Promise<Department>;
  update(id: string, changes: { name?: string; code?: string | null; description?: string | null }): Promise<Department>;
  softDelete(id: string): Promise<void>;
}
