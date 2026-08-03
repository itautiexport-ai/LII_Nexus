import { EntryApprovalStatus, EntryFileKind, FactoryProductionEntry, FactoryProductionEntryWithContext } from "../entities/FactoryProductionEntry";
import { ProductionMethod } from "../entities/FactoryDepartment";

export interface CreateEntryData {
  id: string;
  entryDate: string;
  shiftId: string;
  factoryDepartmentId: string;
  orderReference?: string | null;
  productionMethod: ProductionMethod;
  skuCode?: string | null;
  componentName?: string | null;
  targetQty?: number | null;
  actualQty?: number | null;
  targetCbm?: number | null;
  actualCbm?: number | null;
  targetLabourHours?: number | null;
  actualLabourHours?: number | null;
  delayMinutes?: number;
  delayReason?: string | null;
  rejectionQty?: number;
  reworkQty?: number;
  supervisorId: string;
  contractorId?: string | null;
  remarks?: string | null;
  submittedBy: string;
}

export interface UpdateEntryData {
  orderReference?: string | null;
  targetQty?: number | null;
  actualQty?: number | null;
  targetCbm?: number | null;
  actualCbm?: number | null;
  targetLabourHours?: number | null;
  actualLabourHours?: number | null;
  delayMinutes?: number;
  delayReason?: string | null;
  rejectionQty?: number;
  reworkQty?: number;
  contractorId?: string | null;
  remarks?: string | null;
}

export interface ListEntriesParams {
  page: number;
  pageSize: number;
  factoryDepartmentId?: string;
  status?: EntryApprovalStatus;
  from?: string;
  to?: string;
}

export interface IFactoryProductionEntryRepository {
  list(params: ListEntriesParams): Promise<{ items: FactoryProductionEntryWithContext[]; total: number }>;
  findById(id: string): Promise<FactoryProductionEntry | null>;
  getWithContext(id: string): Promise<FactoryProductionEntryWithContext | null>;
  create(data: CreateEntryData): Promise<FactoryProductionEntry>;
  update(id: string, changes: UpdateEntryData): Promise<FactoryProductionEntry>;
  approve(id: string, reviewedBy: string): Promise<FactoryProductionEntry>;
  reject(id: string, reviewedBy: string, reason: string): Promise<FactoryProductionEntry>;
  softDelete(id: string): Promise<void>;
  addFile(entryId: string, kind: EntryFileKind, fileName: string, fileUrl: string, uploadedBy: string): Promise<void>;
}
