import { Shift } from "../entities/Shift";

export interface IShiftRepository {
  list(): Promise<Shift[]>;
  findById(id: string): Promise<Shift | null>;
  findByName(name: string): Promise<Shift | null>;
  create(data: { id: string; name: string; startTime?: string | null; endTime?: string | null }): Promise<Shift>;
  update(id: string, changes: { name?: string; startTime?: string | null; endTime?: string | null }): Promise<Shift>;
  softDelete(id: string): Promise<void>;
}
