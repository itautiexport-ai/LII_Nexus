export type KpiCategory = "office" | "factory" | "crm";
export type CalculationType =
  | "flowchart" | "checklist" | "delegation" | "target_achievement" | "quality" | "timeliness" | "manual"
  | "crm_followup_discipline" | "crm_conversion" | "crm_pipeline_value" | "crm_delay_control" | "crm_data_discipline";
export type MasterStatus = "active" | "inactive";
export type PeriodType = "monthly" | "yearly";
export type ScoreSource = "auto" | "manual";

export interface KpiDefinition {
  id: string;
  name: string;
  category: KpiCategory;
  calculationType: CalculationType;
  defaultWeightage: number;
  description: string | null;
  status: MasterStatus;
  createdAt: Date;
  updatedAt: Date;
  deletedAt: Date | null;
}

export interface KpiDepartmentWeightage {
  id: string;
  kpiDefinitionId: string;
  departmentId: string;
  weightage: number;
}

export interface EmployeeKpiScore {
  id: string;
  employeeId: string;
  kpiDefinitionId: string;
  periodType: PeriodType;
  periodKey: string;
  rawScore: number | null;
  weightageUsed: number;
  source: ScoreSource;
  enteredBy: string | null;
  computedAt: Date;
}

export interface EmployeeCompositeScore {
  id: string;
  employeeId: string;
  periodType: PeriodType;
  periodKey: string;
  overallScore: number | null;
  computedAt: Date;
}

export interface EmployeeKpiScoreWithName extends EmployeeKpiScore {
  kpiName: string;
  category: KpiCategory;
}
