import { CalculationType, EmployeeCompositeScore, EmployeeKpiScore, EmployeeKpiScoreWithName, KpiCategory, KpiDefinition, KpiDepartmentWeightage, MasterStatus, PeriodType, ScoreSource } from "../entities/Kpi";

export interface IKpiRepository {
  listDefinitions(status?: MasterStatus): Promise<KpiDefinition[]>;
  findDefinitionById(id: string): Promise<KpiDefinition | null>;
  findDefinitionByName(name: string): Promise<KpiDefinition | null>;
  createDefinition(data: { id: string; name: string; category: KpiCategory; calculationType: CalculationType; defaultWeightage: number; description?: string | null }): Promise<KpiDefinition>;
  updateDefinition(id: string, changes: { name?: string; defaultWeightage?: number; description?: string | null; status?: MasterStatus }): Promise<KpiDefinition>;
  softDeleteDefinition(id: string): Promise<void>;

  setDepartmentWeightage(kpiDefinitionId: string, departmentId: string, weightage: number): Promise<void>;
  removeDepartmentWeightage(kpiDefinitionId: string, departmentId: string): Promise<void>;
  getDepartmentWeightages(kpiDefinitionId: string): Promise<KpiDepartmentWeightage[]>;
  getWeightageForDepartment(kpiDefinitionId: string, departmentId: string | null): Promise<number>;

  upsertEmployeeKpiScore(data: { employeeId: string; kpiDefinitionId: string; periodType: PeriodType; periodKey: string; rawScore: number | null; weightageUsed: number; source: ScoreSource; enteredBy?: string | null }): Promise<EmployeeKpiScore>;
  getEmployeeKpiScores(employeeId: string, periodType: PeriodType, periodKey: string): Promise<EmployeeKpiScoreWithName[]>;
  getEmployeeKpiScoreHistory(employeeId: string, kpiDefinitionId: string, periodType: PeriodType, periodKeys: string[]): Promise<EmployeeKpiScore[]>;

  upsertCompositeScore(employeeId: string, periodType: PeriodType, periodKey: string, overallScore: number | null): Promise<EmployeeCompositeScore>;
  getCompositeScore(employeeId: string, periodType: PeriodType, periodKey: string): Promise<EmployeeCompositeScore | null>;
  getCompositeScoreHistory(employeeId: string, periodType: PeriodType, periodKeys: string[]): Promise<EmployeeCompositeScore[]>;
  listCompositeScoresForPeriod(periodType: PeriodType, periodKey: string, employeeIds?: string[]): Promise<EmployeeCompositeScore[]>;
}
