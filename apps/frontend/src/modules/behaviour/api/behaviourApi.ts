import { axiosInstance } from "../../../services/api/axiosInstance";

export type PeriodType = "monthly" | "yearly";

export interface ComponentScore {
  componentKey: string;
  label: string;
  rawScore: number | null;
  weightUsed: number;
}

export interface BehaviourIndexResult {
  employeeId: string;
  employeeName: string;
  overallIndex: number | null;
  components: ComponentScore[];
}

export interface BehaviourComponentRecord {
  id: string;
  componentKey: string;
  label: string;
  weight: number;
  description: string | null;
  status: "active" | "inactive";
}

export interface InsightRuleRecord {
  id: string;
  ruleKey: string;
  label: string;
  thresholdValue: number;
  enabled: boolean;
  description: string | null;
}

export interface GeneratedInsightRecord {
  id: string;
  ruleKey: string;
  severity: "info" | "warning" | "critical";
  message: string;
  entityType: string | null;
  entityId: string | null;
  generatedAt: string;
}

function periodParams(periodType: PeriodType = "monthly", periodKey?: string) {
  return { periodType, periodKey };
}

export const behaviourApi = {
  async myIndex(periodType: PeriodType = "monthly", periodKey?: string): Promise<BehaviourIndexResult> {
    return (await axiosInstance.get("/behaviour/index/me", { params: periodParams(periodType, periodKey) })).data.data;
  },

  async departmentHealth(periodType: PeriodType = "monthly") { return (await axiosInstance.get("/behaviour/health/department", { params: periodParams(periodType) })).data.data; },
  async workflowHealth(periodType: PeriodType = "monthly") { return (await axiosInstance.get("/behaviour/health/workflow", { params: periodParams(periodType) })).data.data; },
  async factoryHealth(periodType: PeriodType = "monthly") { return (await axiosInstance.get("/behaviour/health/factory", { params: periodParams(periodType) })).data.data; },
  async crmHealth(periodType: PeriodType = "monthly") { return (await axiosInstance.get("/behaviour/health/crm", { params: periodParams(periodType) })).data.data; },
  async merchantHealth(periodType: PeriodType = "monthly") { return (await axiosInstance.get("/behaviour/health/merchant", { params: periodParams(periodType) })).data.data; },
  async executiveHealth(periodType: PeriodType = "monthly") { return (await axiosInstance.get("/behaviour/health/executive", { params: periodParams(periodType) })).data.data; },

  async topPerformers(periodType: PeriodType = "monthly") { return (await axiosInstance.get("/behaviour/analytics/top-performers", { params: periodParams(periodType) })).data.data; },
  async bottomPerformers(periodType: PeriodType = "monthly") { return (await axiosInstance.get("/behaviour/analytics/bottom-performers", { params: periodParams(periodType) })).data.data; },
  async mostImproved(periodType: PeriodType = "monthly") { return (await axiosInstance.get("/behaviour/analytics/most-improved", { params: periodParams(periodType) })).data.data; },
  async mostDelayed(periodType: PeriodType = "monthly") { return (await axiosInstance.get("/behaviour/analytics/most-delayed", { params: periodParams(periodType) })).data.data; },
  async mostConsistent(periodType: PeriodType = "monthly") { return (await axiosInstance.get("/behaviour/analytics/most-consistent", { params: periodParams(periodType) })).data.data; },
  async repeatDefaulters(periodType: PeriodType = "monthly") { return (await axiosInstance.get("/behaviour/analytics/repeat-defaulters", { params: periodParams(periodType) })).data.data; },
  async repeatedDelayReasons(periodType: PeriodType = "monthly") { return (await axiosInstance.get("/behaviour/analytics/repeated-delay-reasons", { params: periodParams(periodType) })).data.data; },
  async departmentComparison(periodType: PeriodType = "monthly") { return (await axiosInstance.get("/behaviour/analytics/department-comparison", { params: periodParams(periodType) })).data.data; },
  async historicalTrend(periodType: PeriodType = "monthly", count = 6) { return (await axiosInstance.get("/behaviour/analytics/historical-trend", { params: { periodType, count } })).data.data; },

  async listComponents(): Promise<BehaviourComponentRecord[]> { return (await axiosInstance.get("/behaviour/components")).data.data; },
  async updateComponent(id: string, payload: Partial<{ weight: number; status: "active" | "inactive" }>) {
    return (await axiosInstance.patch(`/behaviour/components/${id}`, payload)).data.data as BehaviourComponentRecord;
  },

  async submitFeedback(employeeId: string, periodType: PeriodType, periodKey: string, rating: number, comments?: string) {
    return (await axiosInstance.post("/behaviour/feedback", { employeeId, periodType, periodKey, rating, comments })).data.data;
  },
  async listFeedback(employeeId: string) { return (await axiosInstance.get(`/behaviour/feedback/${employeeId}`)).data.data; },

  async listInsightRules(): Promise<InsightRuleRecord[]> { return (await axiosInstance.get("/insight-rules")).data.data; },
  async updateInsightRule(ruleKey: string, payload: Partial<{ thresholdValue: number; enabled: boolean }>) {
    return (await axiosInstance.patch(`/insight-rules/${ruleKey}`, payload)).data.data as InsightRuleRecord;
  },
  async runInsights(periodType: PeriodType = "monthly") { return (await axiosInstance.post("/behaviour/insights/run", null, { params: periodParams(periodType) })).data.data as GeneratedInsightRecord[]; },
  async listInsights(periodType: PeriodType = "monthly") { return (await axiosInstance.get("/behaviour/insights", { params: periodParams(periodType) })).data.data as GeneratedInsightRecord[]; },
  async narrativeSummary(periodType: PeriodType = "monthly") { return (await axiosInstance.get("/behaviour/insights/narrative", { params: periodParams(periodType) })).data.data.summary as string; },
};
