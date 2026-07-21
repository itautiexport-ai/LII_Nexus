import { DprEntry, DprEntryWithContext } from "../entities/DprEntry";

export interface CreateDprEntryData {
  id: string;
  entryDate: string;
  shiftId: string;
  factoryDepartmentId: string;
  supervisorId: string;
  hodId?: string | null;
  totalTarget: number;
  uom: string;
  totalAchievement: number;
  totalRework: number;
  totalOperator: number;
  totalHelper: number;
  totalContractor: number;
  manpowerDepartmentId?: string | null;
  submittedBy: string;
  items: CreateDprItemData[];
}

export interface CreateDprItemData {
  id: string;
  aliasName?: string | null;
  productCode?: string | null;
  woodType?: string | null;
  orderQty: number;
  okQty: number;
  reworkQty: number;
  uom: string;
  qtyAsPerUom?: number | null;
  sortOrder: number;
}

export interface UpdateDprEntryData {
  entryDate?: string;
  shiftId?: string;
  factoryDepartmentId?: string;
  supervisorId?: string;
  hodId?: string | null;
  totalTarget?: number;
  uom?: string;
  totalOperator?: number;
  totalHelper?: number;
  totalContractor?: number;
  manpowerDepartmentId?: string | null;
  items?: CreateDprItemData[];
}

export interface ListDprEntriesParams {
  page: number;
  pageSize: number;
  entryDate?: string;
  factoryDepartmentId?: string;
}

export interface IDprEntryRepository {
  list(params: ListDprEntriesParams): Promise<{ items: DprEntryWithContext[]; total: number }>;
  findById(id: string): Promise<DprEntry | null>;
  getWithContext(id: string): Promise<DprEntryWithContext | null>;
  create(data: CreateDprEntryData): Promise<DprEntry>;
  update(id: string, changes: UpdateDprEntryData): Promise<DprEntry>;
  softDelete(id: string): Promise<void>;
}
