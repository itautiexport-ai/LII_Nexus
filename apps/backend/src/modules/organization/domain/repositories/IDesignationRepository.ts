import { Designation } from "../entities/Designation";

export interface IDesignationRepository {
  list(): Promise<Designation[]>;
  findById(id: string): Promise<Designation | null>;
  findByTitle(title: string): Promise<Designation | null>;
  create(data: { id: string; title: string; description?: string | null }): Promise<Designation>;
  update(id: string, changes: { title?: string; description?: string | null }): Promise<Designation>;
  softDelete(id: string): Promise<void>;
}
