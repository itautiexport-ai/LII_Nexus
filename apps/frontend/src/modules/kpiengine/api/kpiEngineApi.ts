import { axiosInstance } from "../../../services/api/axiosInstance";

export type KpiCategory = "office" | "factory" | "crm" | "purchase" | "quality" | "hr";
export type KpiFrequency = "daily" | "weekly" | "monthly" | "quarterly" | "yearly";
export type MasterStatus = "active" | "inactive";
export type TrafficLight = "red" | "amber" | "green";

export const CATEGORY_LABELS: Record<KpiCategory, string> = {
  office: "Office", factory: "Factory", crm: "CRM", purchase: "Purchase", quality: "Quality", hr: "HR",
};

export interface KpiDefinitionRecord {
  id: string;
  name: string;
  category: KpiCategory;
  formula: string;
  weightage: number;
  frequency: KpiFrequency;
  responsibleEmployeeId: string | null;
  departmentId: string | null;
  greenThreshold: number;
  amberThreshold: number;
  status: MasterStatus;
}

export interface KpiEntryRecord {
  id: string;
  periodKey: string;
  target: number;
  actual: number;
  computedScore: number | null;
  trafficLight: TrafficLight | null;
}

export interface ScoreBreakdownItem {
  kpiId: string;
  kpiName: string;
  periodKey: string;
  score: number | null;
  trafficLight: string | null;
  weightageUsed: number;
}

export interface ScoreResult {
  overallScore: number | null;
  kpiCount: number;
  scoredCount: number;
  breakdown: ScoreBreakdownItem[];
}

export interface DashboardData {
  totalActiveKpis: number;
  trafficLightCounts: { red: number; amber: number; green: number; notEntered: number };
  pendingEntry: { id: string; name: string; category: string; periodKey: string }[];
  companyScore: number | null;
}

export const kpiEngineApi = {
  async listDefinitions(params: Record<string, string | undefined> = {}): Promise<KpiDefinitionRecord[]> {
    return (await axiosInstance.get("/kpi-engine/definitions", { params })).data.data;
  },
  async getDefinition(id: string): Promise<KpiDefinitionRecord> { return (await axiosInstance.get(`/kpi-engine/definitions/${id}`)).data.data; },
  async createDefinition(payload: Partial<KpiDefinitionRecord>) { return (await axiosInstance.post("/kpi-engine/definitions", payload)).data.data as KpiDefinitionRecord; },
  async updateDefinition(id: string, payload: Partial<KpiDefinitionRecord>) { return (await axiosInstance.patch(`/kpi-engine/definitions/${id}`, payload)).data.data as KpiDefinitionRecord; },
  async deleteDefinition(id: string) { await axiosInstance.delete(`/kpi-engine/definitions/${id}`); },
  async validateFormula(formula: string) { return (await axiosInstance.post("/kpi-engine/validate-formula", { formula })).data.data as { valid: boolean; sampleScoreWithTarget100Actual90: number }; },

  async recordEntry(id: string, target: number, actual: number, periodKey?: string) {
    return (await axiosInstance.post(`/kpi-engine/definitions/${id}/entries`, { target, actual, periodKey })).data.data as KpiEntryRecord;
  },
  async getHistory(id: string, count = 12): Promise<KpiEntryRecord[]> {
    return (await axiosInstance.get(`/kpi-engine/definitions/${id}/history`, { params: { count } })).data.data;
  },

  async myScore(): Promise<ScoreResult> { return (await axiosInstance.get("/kpi-engine/scores/me")).data.data; },
  async employeeScore(employeeId: string): Promise<ScoreResult> { return (await axiosInstance.get(`/kpi-engine/scores/employees/${employeeId}`)).data.data; },
  async departmentScore(departmentId: string): Promise<ScoreResult> { return (await axiosInstance.get(`/kpi-engine/scores/departments/${departmentId}`)).data.data; },
  async companyScore(): Promise<ScoreResult> { return (await axiosInstance.get("/kpi-engine/scores/company")).data.data; },

  async dashboard(): Promise<DashboardData> { return (await axiosInstance.get("/kpi-engine/dashboard")).data.data; },
};
