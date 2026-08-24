import { MaterialInwardRecord } from "../entities/MaterialInward";

export interface IMaterialInwardRepository {
  create(data: Omit<MaterialInwardRecord, "createdAt" | "updatedAt" | "deletedAt">): Promise<MaterialInwardRecord>;
  list(): Promise<MaterialInwardRecord[]>;
  getById(id: string): Promise<MaterialInwardRecord | null>;
  update(id: string, data: Partial<Omit<MaterialInwardRecord, "id" | "inwardNo" | "createdAt" | "updatedAt" | "deletedAt">>): Promise<MaterialInwardRecord>;
  remove(id: string): Promise<void>;
  getLastInwardNumber(): Promise<string | null>;
}
