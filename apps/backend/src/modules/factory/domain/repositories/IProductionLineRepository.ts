import { ProductionLine } from "../entities/ProductionLine";

export interface IProductionLineRepository {
  list(): Promise<ProductionLine[]>;
  findById(id: string): Promise<ProductionLine | null>;
  findByName(name: string): Promise<ProductionLine | null>;
  create(data: { id: string; name: string; code?: string | null; description?: string | null }): Promise<ProductionLine>;
  update(id: string, changes: { name?: string; code?: string | null; description?: string | null }): Promise<ProductionLine>;
  softDelete(id: string): Promise<void>;
}
