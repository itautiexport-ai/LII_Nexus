import { ProductionMethod } from "./FactoryDepartment";

export type EntryApprovalStatus = "submitted" | "approved" | "rejected";
export type EntryFileKind = "photo" | "attachment";

export interface FactoryProductionEntry {
  id: string;
  entryDate: string;
  shiftId: string;
  factoryDepartmentId: string;
  orderReference: string | null;
  productionMethod: ProductionMethod;
  skuCode: string | null;
  componentName: string | null;
  targetQty: number | null;
  actualQty: number | null;
  targetCbm: number | null;
  actualCbm: number | null;
  targetLabourHours: number | null;
  actualLabourHours: number | null;
  delayMinutes: number;
  delayReason: string | null;
  rejectionQty: number;
  reworkQty: number;
  supervisorId: string;
  contractorId: string | null;
  remarks: string | null;
  status: EntryApprovalStatus;
  submittedBy: string;
  submittedAt: Date;
  reviewedBy: string | null;
  reviewedAt: Date | null;
  rejectionReason: string | null;
  createdAt: Date;
  updatedAt: Date;
  deletedAt: Date | null;
}

export interface EntryFile {
  id: string;
  entryId: string;
  kind: EntryFileKind;
  fileName: string;
  fileUrl: string;
  uploadedBy: string;
  uploadedAt: Date;
}

export interface FactoryProductionEntryWithContext extends FactoryProductionEntry {
  departmentName: string;
  shiftName: string;
  supervisorName: string;
  contractorName: string | null;
  reviewedByName: string | null;
  files: EntryFile[];
}
