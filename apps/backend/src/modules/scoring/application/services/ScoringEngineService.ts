import { IKpiRepository } from "../../domain/repositories/IKpiRepository";
import { KpiDefinition, PeriodType } from "../../domain/entities/Kpi";
import { dateRangeForPeriod } from "./scoringPeriodUtils";
import { MySqlFlowchartRepository } from "../../../officeperf/infrastructure/repositories/MySqlFlowchartRepository";
import { MySqlChecklistRepository } from "../../../officeperf/infrastructure/repositories/MySqlChecklistRepository";
import { MySqlDelegationRepository } from "../../../officeperf/infrastructure/repositories/MySqlDelegationRepository";
import { MySqlProductionEntryRepository } from "../../../factory/infrastructure/repositories/MySqlProductionEntryRepository";
import { isInstanceComplete } from "../../../officeperf/domain/entities/Checklist";
import { MySqlEmployeeRepository } from "../../../organization/infrastructure/repositories/MySqlEmployeeRepository";
import { pool } from "../../../../infrastructure/database/mysql/connection";
import { ValidationError } from "../../../../core/domain/errors/DomainError";
import { AuditService } from "../../../../shared/services/AuditService";

export interface KpiScoreResult {
  kpiDefinitionId: string;
  kpiName: string;
  category: string;
  calculationType: string;
  rawScore: number | null;
  weightageUsed: number;
}

export interface CompositeScoreResult {
  employeeId: string;
  periodType: PeriodType;
  periodKey: string;
  kpiScores: KpiScoreResult[];
  overallScore: number | null;
}

export class ScoringEngineService {
  private readonly flowchartRepo = new MySqlFlowchartRepository();
  private readonly checklistRepo = new MySqlChecklistRepository();
  private readonly delegationRepo = new MySqlDelegationRepository();
  private readonly productionEntryRepo = new MySqlProductionEntryRepository();
  private readonly employeeRepo = new MySqlEmployeeRepository();

  constructor(private readonly kpiRepo: IKpiRepository) {}

  /** Dispatches to the calculator matching the KPI's calculation_type.
   *  Returns null when there was nothing to evaluate (not 0) - same
   *  "excluded, not penalized" convention used by the officeperf dashboard
   *  scoring, kept consistent here. 'manual' KPIs return whatever was last
   *  recorded (or null if never recorded) rather than computing anything. */
  private async computeRawScore(kpi: KpiDefinition, employeeId: string, periodType: PeriodType, periodKey: string): Promise<number | null> {
    const { from, to } = dateRangeForPeriod(periodType, periodKey);

    switch (kpi.calculationType) {
      case "flowchart": {
        const { completed, total } = await this.flowchartRepo.countCompletedAndTotalDue(employeeId, from, to);
        return total > 0 ? Math.round((completed / total) * 10000) / 100 : null;
      }
      case "checklist": {
        const instances = await this.checklistRepo.listInstancesForEmployee(employeeId, from, to);
        if (instances.length === 0) return null;
        const completed = instances.filter((i) => isInstanceComplete(i.items)).length;
        return Math.round((completed / instances.length) * 10000) / 100;
      }
      case "delegation": {
        const { completed, total } = await this.delegationRepo.countCompletedAndTotalDue(employeeId, from, to);
        return total > 0 ? Math.round((completed / total) * 10000) / 100 : null;
      }
      case "target_achievement": {
        const entries = await this.productionEntryRepo.listForEmployee(employeeId, { from, to });
        const withTarget = entries.filter((e) => e.targetQuantity !== null && e.targetQuantity > 0);
        if (withTarget.length === 0) return null;
        const totalActual = withTarget.reduce((sum, e) => sum + e.quantityProduced, 0);
        const totalTarget = withTarget.reduce((sum, e) => sum + (e.targetQuantity as number), 0);
        return Math.round(Math.min(100, (totalActual / totalTarget) * 100) * 100) / 100;
      }
      case "quality": {
        // Attributed to the submitting supervisor's approved factory
        // production entries for the period - the only place rejection/
        // rework is actually tracked per person in this system.
        const [rows] = await pool.query<any[]>(
          `SELECT SUM(actual_qty) as total_actual, SUM(rejection_qty + rework_qty) as total_defects
           FROM factory_production_entries
           WHERE submitted_by = ? AND status = 'approved' AND entry_date BETWEEN ? AND ? AND actual_qty > 0`,
          [employeeId, from, to]
        );
        const totalActual = Number(rows[0]?.total_actual) || 0;
        if (totalActual === 0) return null;
        const totalDefects = Number(rows[0]?.total_defects) || 0;
        return Math.round(Math.max(0, 100 - (totalDefects / totalActual) * 100) * 100) / 100;
      }
      case "timeliness": {
        const [rows] = await pool.query<any[]>(
          `SELECT
             SUM(CASE WHEN DATE(submitted_at) = entry_date THEN 1 ELSE 0 END) as on_time,
             COUNT(*) as total
           FROM factory_production_entries
           WHERE submitted_by = ? AND entry_date BETWEEN ? AND ?`,
          [employeeId, from, to]
        );
        const total = Number(rows[0]?.total) || 0;
        if (total === 0) return null;
        const onTime = Number(rows[0]?.on_time) || 0;
        return Math.round((onTime / total) * 10000) / 100;
      }
      case "crm_followup_discipline": {
        const [rows] = await pool.query<any[]>(
          `SELECT SUM(CASE WHEN clf.on_time = 1 THEN 1 ELSE 0 END) as onTime, COUNT(*) as total
           FROM crm_lead_followups clf
           JOIN crm_leads cl ON cl.id = clf.lead_id
           WHERE cl.assigned_merchant_id = ? AND clf.completed_at IS NOT NULL
             AND DATE(clf.completed_at) BETWEEN ? AND ?`,
          [employeeId, from, to]
        );
        const total = Number(rows[0]?.total) || 0;
        if (total === 0) return null;
        return Math.round((Number(rows[0].onTime) / total) * 10000) / 100;
      }
      case "crm_conversion": {
        const [rows] = await pool.query<any[]>(
          `SELECT
             SUM(CASE WHEN status = 'won' THEN 1 ELSE 0 END) as won,
             SUM(CASE WHEN status = 'lost' THEN 1 ELSE 0 END) as lost
           FROM crm_leads
           WHERE assigned_merchant_id = ? AND deleted_at IS NULL AND status IN ('won','lost')
             AND updated_at BETWEEN ? AND ?`,
          [employeeId, `${from} 00:00:00`, `${to} 23:59:59`]
        );
        const won = Number(rows[0]?.won) || 0;
        const lost = Number(rows[0]?.lost) || 0;
        if (won + lost === 0) return null;
        return Math.round((won / (won + lost)) * 10000) / 100;
      }
      case "crm_pipeline_value": {
        // Average win probability across currently active leads - a real,
        // directly computable proxy for "how promising is this merchant's
        // pipeline" without needing an arbitrary external sales target.
        const [rows] = await pool.query<any[]>(
          `SELECT AVG(win_probability) as avgProb, COUNT(*) as total
           FROM crm_leads WHERE assigned_merchant_id = ? AND deleted_at IS NULL AND status = 'active' AND win_probability IS NOT NULL`,
          [employeeId]
        );
        if (!rows[0] || Number(rows[0].total) === 0) return null;
        return Math.round(Number(rows[0].avgProb) * 100) / 100;
      }
      case "crm_delay_control": {
        const [rows] = await pool.query<any[]>(
          `SELECT
             COUNT(*) as total,
             SUM(CASE WHEN next_follow_up_date IS NOT NULL AND next_follow_up_date < CURDATE() THEN 1 ELSE 0 END) as delayed_count
           FROM crm_leads WHERE assigned_merchant_id = ? AND deleted_at IS NULL AND status = 'active'`,
          [employeeId]
        );
        const total = Number(rows[0]?.total) || 0;
        if (total === 0) return null;
        const delayed = Number(rows[0].delayed_count) || 0;
        return Math.round(((total - delayed) / total) * 10000) / 100;
      }
      case "crm_data_discipline": {
        const [rows] = await pool.query<any[]>(
          `SELECT
             COUNT(*) as total,
             SUM(CASE WHEN updated_at >= DATE_SUB(NOW(), INTERVAL 14 DAY) THEN 1 ELSE 0 END) as recentlyUpdated
           FROM crm_leads WHERE assigned_merchant_id = ? AND deleted_at IS NULL`,
          [employeeId]
        );
        const total = Number(rows[0]?.total) || 0;
        if (total === 0) return null;
        return Math.round((Number(rows[0].recentlyUpdated) / total) * 10000) / 100;
      }
      case "manual": {
        const existing = await this.kpiRepo.getEmployeeKpiScores(employeeId, periodType, periodKey);
        const match = existing.find((s) => s.kpiDefinitionId === kpi.id);
        return match ? match.rawScore : null;
      }
      default:
        return null;
    }
  }

  /**
   * Computes (or recomputes) every active KPI's score for an employee/period,
   * resolves the employee's department-specific weight override where one
   * exists, and produces the automatically weighted composite - renormalized
   * over only the KPIs that had something to evaluate, same convention as
   * the officeperf dashboard score. Persists everything (upsert) so this
   * doubles as both "compute" and "get latest" - there is no separate manual
   * aggregation step anywhere; the composite is always system-computed.
   */
  async computeCompositeScore(employeeId: string, periodType: PeriodType, periodKey: string): Promise<CompositeScoreResult> {
    const employee = await this.employeeRepo.findById(employeeId);
    if (!employee) throw new ValidationError("Employee not found.");

    const kpis = await this.kpiRepo.listDefinitions("active");
    const kpiScores: KpiScoreResult[] = [];

    for (const kpi of kpis) {
      const weightage = await this.kpiRepo.getWeightageForDepartment(kpi.id, employee.departmentId);
      let rawScore: number | null;

      if (kpi.calculationType === "manual") {
        // Manual KPIs are never recomputed here - whatever was last entered
        // via the manual-entry endpoint stands until someone re-enters it.
        const existing = await this.kpiRepo.getEmployeeKpiScores(employeeId, periodType, periodKey);
        const match = existing.find((s) => s.kpiDefinitionId === kpi.id);
        rawScore = match ? match.rawScore : null;
        if (match) {
          await this.kpiRepo.upsertEmployeeKpiScore({ employeeId, kpiDefinitionId: kpi.id, periodType, periodKey, rawScore, weightageUsed: weightage, source: "manual", enteredBy: match.enteredBy });
        }
      } else {
        rawScore = await this.computeRawScore(kpi, employeeId, periodType, periodKey);
        await this.kpiRepo.upsertEmployeeKpiScore({ employeeId, kpiDefinitionId: kpi.id, periodType, periodKey, rawScore, weightageUsed: weightage, source: "auto" });
      }

      kpiScores.push({ kpiDefinitionId: kpi.id, kpiName: kpi.name, category: kpi.category, calculationType: kpi.calculationType, rawScore, weightageUsed: weightage });
    }

    const present = kpiScores.filter((k) => k.rawScore !== null) as (KpiScoreResult & { rawScore: number })[];
    const totalWeight = present.reduce((sum, k) => sum + k.weightageUsed, 0);
    const overallScore = totalWeight > 0
      ? Math.round((present.reduce((sum, k) => sum + k.rawScore * k.weightageUsed, 0) / totalWeight) * 100) / 100
      : null;

    await this.kpiRepo.upsertCompositeScore(employeeId, periodType, periodKey, overallScore);

    return { employeeId, periodType, periodKey, kpiScores, overallScore };
  }

  async getCompositeScore(employeeId: string, periodType: PeriodType, periodKey: string): Promise<CompositeScoreResult> {
    // Always recompute on read (no scheduler in this stack, and the
    // underlying activity data changes daily) - see docs for the caching
    // tradeoff this implies at scale.
    return this.computeCompositeScore(employeeId, periodType, periodKey);
  }

  async recordManualScore(employeeId: string, kpiDefinitionId: string, periodType: PeriodType, periodKey: string, score: number, actorUserId: string, actorEmployeeId: string | null) {
    const kpi = await this.kpiRepo.findDefinitionById(kpiDefinitionId);
    if (!kpi) throw new ValidationError("KPI definition not found.");
    if (kpi.calculationType !== "manual") {
      throw new ValidationError(`"${kpi.name}" is auto-calculated and cannot be manually overridden. Only KPIs with calculation type "manual" accept manual entry.`);
    }
    const employee = await this.employeeRepo.findById(employeeId);
    if (!employee) throw new ValidationError("Employee not found.");
    const weightage = await this.kpiRepo.getWeightageForDepartment(kpiDefinitionId, employee.departmentId);

    const result = await this.kpiRepo.upsertEmployeeKpiScore({
      employeeId, kpiDefinitionId, periodType, periodKey, rawScore: score, weightageUsed: weightage, source: "manual", enteredBy: actorEmployeeId,
    });

    await AuditService.record({
      actorUserId,
      action: "KPI_MANUAL_SCORE_RECORDED",
      entityType: "employee_kpi_score",
      entityId: result.id,
      afterState: { employeeId, kpiDefinitionId, periodType, periodKey, score },
    });

    // Recompute the composite immediately so the manual entry is reflected
    // without waiting for the next read-triggered recompute.
    return this.computeCompositeScore(employeeId, periodType, periodKey);
  }
}
