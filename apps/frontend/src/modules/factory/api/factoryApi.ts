import { axiosInstance } from "../../../services/api/axiosInstance";

export interface DirectReport {
  id: string;
  employeeCode: string;
  fullName: string;
}

export interface ProductionEntryRecord {
  id: string;
  employeeId: string;
  employeeName: string;
  employeeCode: string;
  lineId: string;
  lineName: string;
  shiftId: string;
  shiftName: string;
  entryDate: string;
  quantityProduced: number;
  targetQuantity: number | null;
  notes: string | null;
  achievementPercentage: number | null;
}

export interface LineShiftSummary {
  lineId: string;
  shiftId: string;
  entryDate: string;
  totalProduced: number;
  totalTarget: number | null;
  achievementPercentage: number | null;
  entries: ProductionEntryRecord[];
}

export const factoryApi = {
  async myDirectReports(): Promise<DirectReport[]> {
    const res = await axiosInstance.get("/employees/my-direct-reports");
    return res.data.data;
  },
  async getSummary(lineId: string, shiftId: string, date: string): Promise<LineShiftSummary> {
    const res = await axiosInstance.get("/production-entries/summary", { params: { lineId, shiftId, date } });
    return res.data.data;
  },
  async createEntry(payload: {
    employeeId: string; lineId: string; shiftId: string; entryDate: string;
    quantityProduced: number; targetQuantity?: number | null; notes?: string;
  }) {
    const res = await axiosInstance.post("/production-entries", payload);
    return res.data.data as ProductionEntryRecord;
  },
  async updateEntry(id: string, payload: Partial<{ quantityProduced: number; targetQuantity: number | null; notes: string | null }>) {
    const res = await axiosInstance.patch(`/production-entries/${id}`, payload);
    return res.data.data as ProductionEntryRecord;
  },
  async removeEntry(id: string) {
    await axiosInstance.delete(`/production-entries/${id}`);
  },
};
