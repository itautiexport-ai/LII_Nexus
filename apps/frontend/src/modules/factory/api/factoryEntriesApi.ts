import { axiosInstance } from "../../../services/api/axiosInstance";
export type ProductionMethod = "MANUAL" | "MACHINE" | "MANUAL_AND_MACHINE";

export type EntryApprovalStatus = "submitted" | "approved" | "rejected";

export interface EntryFileRecord {
  id: string;
  kind: "photo" | "attachment";
  fileName: string;
  fileUrl: string;
}

export interface FactoryEntryRecord {
  id: string;
  entryDate: string;
  departmentName: string;
  shiftName: string;
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
  supervisorName: string;
  contractorName: string | null;
  remarks: string | null;
  status: EntryApprovalStatus;
  rejectionReason: string | null;
  reviewedByName: string | null;
  files: EntryFileRecord[];
}

export const factoryEntriesApi = {
  async list(params: { forWork?: boolean; status?: string; factoryDepartmentId?: string } = {}) {
    const res = await axiosInstance.get("/factory-entries", { params: { page: 1, pageSize: 50, ...params } });
    return { items: res.data.data as FactoryEntryRecord[], totalItems: res.data.meta.totalItems as number };
  },
  async create(payload: {
    entryDate: string; shiftId: string; factoryDepartmentId: string; orderReference?: string;
    productionMethod: ProductionMethod; skuCode?: string; componentName?: string;
    targetQty?: number; actualQty?: number; targetCbm?: number; actualCbm?: number;
    targetLabourHours?: number; actualLabourHours?: number;
    delayMinutes?: number; delayReason?: string; rejectionQty?: number; reworkQty?: number;
    supervisorId: string; contractorId?: string; remarks?: string;
  }) {
    const res = await axiosInstance.post("/factory-entries", payload);
    return res.data.data;
  },
  async approve(id: string) {
    const res = await axiosInstance.patch(`/factory-entries/${id}/approve`);
    return res.data.data;
  },
  async reject(id: string, reason: string) {
    const res = await axiosInstance.patch(`/factory-entries/${id}/reject`, { reason });
    return res.data.data;
  },
  async addFile(id: string, kind: "photo" | "attachment", fileName: string, fileUrl: string) {
    const res = await axiosInstance.post(`/factory-entries/${id}/files`, { kind, fileName, fileUrl });
    return res.data.data;
  },
};
