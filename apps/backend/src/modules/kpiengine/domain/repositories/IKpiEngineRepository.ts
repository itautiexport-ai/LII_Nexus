import { KpiCategory, KpiEngineDefinition, KpiEngineEntry, KpiEngineEntryWithDefinition, KpiFrequency, MasterStatus, TrafficLight } from "../entities/KpiEngine";

export interface CreateKpiDefinitionData {
  id: string;
  name: string;
  category: KpiCategory;
  formula: string;
  weightage: number;
  frequency: KpiFrequency;
  responsibleEmployeeId?: string | null;
  departmentId?: string | null;
  greenThreshold?: number;
  amberThreshold?: number;
}

export interface IKpiEngineRepository {
  listDefinitions(params: { category?: KpiCategory; departmentId?: string; responsibleEmployeeId?: string; status?: MasterStatus }): Promise<KpiEngineDefinition[]>;
  findDefinitionById(id: string): Promise<KpiEngineDefinition | null>;
  createDefinition(data: CreateKpiDefinitionData): Promise<KpiEngineDefinition>;
  updateDefinition(id: string, changes: Partial<{ name: string; formula: string; weightage: number; frequency: KpiFrequency; responsibleEmployeeId: string | null; departmentId: string | null; greenThreshold: number; amberThreshold: number; status: MasterStatus }>): Promise<KpiEngineDefinition>;
  softDeleteDefinition(id: string): Promise<void>;

  upsertEntry(data: { id: string; kpiDefinitionId: string; periodKey: string; target: number; actual: number; computedScore: number | null; trafficLight: TrafficLight | null; weightageUsed: number; enteredBy: string | null }): Promise<KpiEngineEntry>;
  getEntry(kpiDefinitionId: string, periodKey: string): Promise<KpiEngineEntry | null>;
  listEntriesForDefinition(kpiDefinitionId: string, periodKeys?: string[]): Promise<KpiEngineEntry[]>;
  listEntriesForPeriod(periodKey: string, filters: { category?: KpiCategory; departmentId?: string; responsibleEmployeeId?: string }): Promise<KpiEngineEntryWithDefinition[]>;
}
