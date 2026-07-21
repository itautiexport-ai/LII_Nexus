import { BehaviourComponent, BehaviourComponentKey, EmployeeBehaviourScore, GeneratedInsight, InsightRule, InsightRuleKey, InsightSeverity, ManagerFeedback, PeriodType } from "../entities/Behaviour";

export interface IBehaviourRepository {
  listComponents(): Promise<BehaviourComponent[]>;
  findComponentByKey(key: BehaviourComponentKey): Promise<BehaviourComponent | null>;
  updateComponent(id: string, changes: { weight?: number; status?: "active" | "inactive" }): Promise<BehaviourComponent>;

  upsertEmployeeScore(data: { employeeId: string; periodType: PeriodType; periodKey: string; overallIndex: number | null; componentScores: unknown }): Promise<EmployeeBehaviourScore>;
  getEmployeeScore(employeeId: string, periodType: PeriodType, periodKey: string): Promise<EmployeeBehaviourScore | null>;
  getEmployeeScoreHistory(employeeId: string, periodType: PeriodType, periodKeys: string[]): Promise<EmployeeBehaviourScore[]>;
  listScoresForPeriod(periodType: PeriodType, periodKey: string, employeeIds?: string[]): Promise<EmployeeBehaviourScore[]>;

  upsertManagerFeedback(data: { id: string; employeeId: string; submittedBy: string | null; periodType: PeriodType; periodKey: string; rating: number; comments?: string | null }): Promise<ManagerFeedback>;
  getManagerFeedback(employeeId: string, periodType: PeriodType, periodKey: string): Promise<ManagerFeedback | null>;
  listManagerFeedbackForEmployee(employeeId: string): Promise<ManagerFeedback[]>;

  listInsightRules(): Promise<InsightRule[]>;
  updateInsightRule(ruleKey: InsightRuleKey, changes: { thresholdValue?: number; enabled?: boolean }): Promise<InsightRule>;

  recordInsight(data: { id: string; ruleKey: string; severity: InsightSeverity; message: string; entityType?: string | null; entityId?: string | null; periodType: PeriodType; periodKey: string }): Promise<void>;
  listInsights(periodType: PeriodType, periodKey: string): Promise<GeneratedInsight[]>;
}
