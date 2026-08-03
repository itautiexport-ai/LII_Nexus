import { ProductionEntry, ProductionEntryWithRelations } from "../entities/ProductionEntry";

export interface CreateProductionEntryData {
  id: string;
  employeeId: string;
  lineId: string;
  shiftId: string;
  entryDate: string;
  quantityProduced: number;
  targetQuantity?: number | null;
  notes?: string | null;
  recordedBy: string;
}

export interface UpdateProductionEntryData {
  quantityProduced?: number;
  targetQuantity?: number | null;
  notes?: string | null;
}

export interface IProductionEntryRepository {
  findById(id: string): Promise<ProductionEntry | null>;
  findExisting(employeeId: string, lineId: string, shiftId: string, entryDate: string): Promise<ProductionEntry | null>;
  listForEmployee(employeeId: string, params?: { from?: string; to?: string }): Promise<ProductionEntryWithRelations[]>;
  listForLineShiftDate(lineId: string, shiftId: string, entryDate: string): Promise<ProductionEntryWithRelations[]>;
  create(data: CreateProductionEntryData): Promise<ProductionEntry>;
  update(id: string, changes: UpdateProductionEntryData): Promise<ProductionEntry>;
  softDelete(id: string): Promise<void>;
}
