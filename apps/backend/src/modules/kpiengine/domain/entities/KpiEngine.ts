export type KpiCategory = "office" | "factory" | "crm" | "purchase" | "quality" | "hr";
export type KpiFrequency = "daily" | "weekly" | "monthly" | "quarterly" | "yearly";
export type MasterStatus = "active" | "inactive";
export type TrafficLight = "red" | "amber" | "green";

export interface KpiEngineDefinition {
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

export interface KpiEngineEntry {
  id: string;
  kpiDefinitionId: string;
  periodKey: string;
  target: number;
  actual: number;
  computedScore: number | null;
  trafficLight: TrafficLight | null;
  weightageUsed: number;
  enteredBy: string | null;
  enteredAt: Date;
}

export interface KpiEngineEntryWithDefinition extends KpiEngineEntry {
  kpiName: string;
  category: KpiCategory;
}
