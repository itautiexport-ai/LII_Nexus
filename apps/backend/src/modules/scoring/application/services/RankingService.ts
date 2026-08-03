import { ScoringEngineService } from "./ScoringEngineService";
import { PeriodType } from "../../domain/entities/Kpi";
import { MySqlEmployeeRepository } from "../../../organization/infrastructure/repositories/MySqlEmployeeRepository";
import { MySqlDepartmentRepository } from "../../../organization/infrastructure/repositories/MySqlDepartmentRepository";
import { lastNPeriodKeys } from "./scoringPeriodUtils";
import { IKpiRepository } from "../../domain/repositories/IKpiRepository";

export interface RankedEmployee {
  employeeId: string;
  employeeName: string;
  departmentName: string | null;
  overallScore: number | null;
  rank: number;
}

export class RankingService {
  private readonly employeeRepo = new MySqlEmployeeRepository();
  private readonly departmentRepo = new MySqlDepartmentRepository();

  constructor(private readonly scoringEngine: ScoringEngineService, private readonly kpiRepo: IKpiRepository) {}

  /** Recomputes every active employee's composite score for the period, then
   *  ranks them. This is O(employees) real-time recomputation, acceptable at
   *  this scale given the lack of a scheduler - see docs for the caching
   *  tradeoff at larger employee counts. */
  private async computeAllScoresForPeriod(periodType: PeriodType, periodKey: string): Promise<RankedEmployee[]> {
    const { items: employees } = await this.employeeRepo.list({ page: 1, pageSize: 1000 });
    const results: RankedEmployee[] = [];
    for (const emp of employees) {
      const result = await this.scoringEngine.computeCompositeScore(emp.id, periodType, periodKey);
      results.push({ employeeId: emp.id, employeeName: emp.fullName, departmentName: emp.departmentName, overallScore: result.overallScore, rank: 0 });
    }
    const scored = results.filter((r) => r.overallScore !== null).sort((a, b) => (b.overallScore as number) - (a.overallScore as number));
    const unscored = results.filter((r) => r.overallScore === null);
    scored.forEach((r, i) => { r.rank = i + 1; });
    return [...scored, ...unscored];
  }

  async topPerformers(periodType: PeriodType, periodKey: string, limit = 10) {
    const ranked = await this.computeAllScoresForPeriod(periodType, periodKey);
    return ranked.filter((r) => r.overallScore !== null).slice(0, limit);
  }

  async bottomPerformers(periodType: PeriodType, periodKey: string, limit = 10) {
    const ranked = await this.computeAllScoresForPeriod(periodType, periodKey);
    const scored = ranked.filter((r) => r.overallScore !== null);
    return scored.slice(-limit).reverse();
  }

  async departmentRanking(periodType: PeriodType, periodKey: string) {
    const ranked = await this.computeAllScoresForPeriod(periodType, periodKey);
    const byDept = new Map<string, { total: number; count: number }>();
    for (const r of ranked) {
      if (r.overallScore === null || !r.departmentName) continue;
      const bucket = byDept.get(r.departmentName) ?? { total: 0, count: 0 };
      bucket.total += r.overallScore;
      bucket.count += 1;
      byDept.set(r.departmentName, bucket);
    }
    const departments = Array.from(byDept.entries())
      .map(([departmentName, { total, count }]) => ({ departmentName, averageScore: Math.round((total / count) * 100) / 100, employeeCount: count }))
      .sort((a, b) => b.averageScore - a.averageScore);
    departments.forEach((d, i) => { (d as any).rank = i + 1; });
    return departments;
  }

  /** Trend data for a single employee across the last N periods, for
   *  charting. Also returns each KPI's raw score per period so the frontend
   *  can plot per-KPI trend lines, not just the composite. */
  async getEmployeeTrend(employeeId: string, periodType: PeriodType, periodCount: number) {
    const periodKeys = lastNPeriodKeys(periodType, periodCount);
    const composites = [];
    for (const key of periodKeys) {
      const result = await this.scoringEngine.getCompositeScore(employeeId, periodType, key);
      composites.push({ periodKey: key, overallScore: result.overallScore, kpiScores: result.kpiScores });
    }
    return composites;
  }
}
