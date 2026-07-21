import { axiosInstance } from "../../../services/api/axiosInstance";

export type KpiCategory = "office" | "factory";
export type CalculationType = "flowchart" | "checklist" | "delegation" | "target_achievement" | "quality" | "timeliness" | "manual";
export type PeriodType = "monthly" | "yearly";

export interface KpiDefinitionRecord {
  id: string;
  name: string;
  category: KpiCategory;
  calculationType: CalculationType;
  defaultWeightage: number;
  description: string | null;
  status: "active" | "inactive";
}

export interface KpiScoreDetail {
  kpiDefinitionId: string;
  kpiName: string;
  category: KpiCategory;
  calculationType: CalculationType;
  rawScore: number | null;
  weightageUsed: number;
}

export interface CompositeScoreResult {
  employeeId: string;
  periodType: PeriodType;
  periodKey: string;
  kpiScores: KpiScoreDetail[];
  overallScore: number | null;
}

export interface TrendPoint {
  periodKey: string;
  overallScore: number | null;
  kpiScores: KpiScoreDetail[];
}

export interface RankedEmployee {
  employeeId: string;
  employeeName: string;
  departmentName: string | null;
  overallScore: number | null;
  rank: number;
}

export interface DepartmentRankingRow {
  departmentName: string;
  averageScore: number;
  employeeCount: number;
  rank: number;
}

export const scoringApi = {
  async listKpis(): Promise<KpiDefinitionRecord[]> {
    const res = await axiosInstance.get("/kpi-definitions");
    return res.data.data;
  },
  async createKpi(payload: { name: string; category: KpiCategory; calculationType: CalculationType; defaultWeightage: number; description?: string }) {
    const res = await axiosInstance.post("/kpi-definitions", payload);
    return res.data.data as KpiDefinitionRecord;
  },
  async updateKpi(id: string, payload: Partial<{ name: string; defaultWeightage: number; description: string | null; status: "active" | "inactive" }>) {
    const res = await axiosInstance.patch(`/kpi-definitions/${id}`, payload);
    return res.data.data as KpiDefinitionRecord;
  },
  async deleteKpi(id: string) {
    await axiosInstance.delete(`/kpi-definitions/${id}`);
  },
  async setDepartmentWeightage(kpiId: string, departmentId: string, weightage: number) {
    const res = await axiosInstance.put(`/kpi-definitions/${kpiId}/department-weightage`, { departmentId, weightage });
    return res.data.data;
  },

  async myScore(periodType: PeriodType, periodKey: string): Promise<CompositeScoreResult> {
    const res = await axiosInstance.get("/scores/me", { params: { periodType, periodKey } });
    return res.data.data;
  },
  async myTrend(periodType: PeriodType, count = 6): Promise<TrendPoint[]> {
    const res = await axiosInstance.get("/scores/me/trend", { params: { periodType, count } });
    return res.data.data;
  },
  async recordManualScore(payload: { employeeId: string; kpiDefinitionId: string; periodType: PeriodType; periodKey: string; score: number }) {
    const res = await axiosInstance.post("/scores/manual-entry", payload);
    return res.data.data as CompositeScoreResult;
  },
  async topPerformers(periodType: PeriodType, periodKey: string, limit = 10): Promise<RankedEmployee[]> {
    const res = await axiosInstance.get("/scores/rankings/top-performers", { params: { periodType, periodKey, limit } });
    return res.data.data;
  },
  async bottomPerformers(periodType: PeriodType, periodKey: string, limit = 10): Promise<RankedEmployee[]> {
    const res = await axiosInstance.get("/scores/rankings/bottom-performers", { params: { periodType, periodKey, limit } });
    return res.data.data;
  },
  async departmentRanking(periodType: PeriodType, periodKey: string): Promise<DepartmentRankingRow[]> {
    const res = await axiosInstance.get("/scores/rankings/departments", { params: { periodType, periodKey } });
    return res.data.data;
  },
};
