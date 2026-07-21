import { axiosInstance } from "../../../services/api/axiosInstance";

export interface DprItemRecord {
  id?: string;
  aliasName?: string | null;
  productCode?: string | null;
  woodType?: string | null;
  orderQty: number;
  okQty: number;
  reworkQty: number;
  uom: string;
  qtyAsPerUom?: number | null;
}

export interface DprEntryRecord {
  id: string;
  entryDate: string;
  shiftId: string;
  shiftName: string;
  factoryDepartmentId: string;
  departmentName: string;
  supervisorId: string;
  supervisorName: string;
  totalTarget: number;
  uom: string;
  totalAchievement: number;
  totalRework: number;
  totalOperator: number;
  totalHelper: number;
  totalContractor: number;
  manpowerDepartmentId: string | null;
  manpowerDepartmentName: string | null;
  submittedBy: string;
  items: DprItemRecord[];
}

export const dprApi = {
  async list(params: { entryDate?: string; factoryDepartmentId?: string } = {}) {
    const res = await axiosInstance.get("/dpr-entries", { params: { page: 1, pageSize: 50, ...params } });
    return { items: res.data.data as DprEntryRecord[], totalItems: res.data.meta.totalItems as number };
  },

  async create(payload: {
    entryDate: string;
    shiftId: string;
    factoryDepartmentId: string;
    supervisorId: string;
    hodId: string | null;
    totalTarget: number;
    uom: string;
    totalAchievement?: number;
    totalRework?: number;
    totalOperator: number;
    totalHelper: number;
    totalContractor: number;
    manpowerDepartmentId?: string | null;
    items: DprItemRecord[];
  }) {
    const res = await axiosInstance.post("/dpr-entries", payload);
    return res.data.data as DprEntryRecord;
  },

  async remove(id: string) {
    await axiosInstance.delete(`/dpr-entries/${id}`);
  },
};
