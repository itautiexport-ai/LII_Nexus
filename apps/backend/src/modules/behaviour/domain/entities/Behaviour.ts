export type BehaviourComponentKey =
  | "on_time_completion" | "delay_frequency" | "average_delay" | "task_consistency"
  | "checklist_discipline" | "delegation_discipline" | "followup_discipline" | "crm_discipline"
  | "attendance_impact" | "improvement_trend" | "manager_feedback";

export type PeriodType = "monthly" | "yearly";
export type InsightSeverity = "info" | "warning" | "critical";
export type InsightRuleKey =
  | "productivity_drop" | "merchant_followups_missed" | "department_declining"
  | "consistency_improved" | "repeat_defaulter" | "delay_spike";

export interface BehaviourComponent {
  id: string;
  componentKey: BehaviourComponentKey;
  label: string;
  weight: number;
  description: string | null;
  status: "active" | "inactive";
}

export interface ComponentScore {
  componentKey: BehaviourComponentKey;
  label: string;
  rawScore: number | null;
  weightUsed: number;
}

export interface EmployeeBehaviourScore {
  id: string;
  employeeId: string;
  periodType: PeriodType;
  periodKey: string;
  overallIndex: number | null;
  componentScores: ComponentScore[];
  computedAt: Date;
}

export interface ManagerFeedback {
  id: string;
  employeeId: string;
  submittedBy: string | null;
  periodType: PeriodType;
  periodKey: string;
  rating: number;
  comments: string | null;
  createdAt: Date;
  updatedAt: Date;
}

export interface InsightRule {
  id: string;
  ruleKey: InsightRuleKey;
  label: string;
  thresholdValue: number;
  enabled: boolean;
  description: string | null;
}

export interface GeneratedInsight {
  id: string;
  ruleKey: string;
  severity: InsightSeverity;
  message: string;
  entityType: string | null;
  entityId: string | null;
  periodType: PeriodType;
  periodKey: string;
  generatedAt: Date;
}
