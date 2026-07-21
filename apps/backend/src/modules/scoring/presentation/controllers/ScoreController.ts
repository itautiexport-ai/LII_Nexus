import { Response } from "express";
import { ScoringEngineService } from "../../application/services/ScoringEngineService";
import { RankingService } from "../../application/services/RankingService";
import { MySqlKpiRepository } from "../../infrastructure/repositories/MySqlKpiRepository";
import { EmployeeScopeService } from "../../../performance/application/services/EmployeeScopeService";
import { ok } from "../../../../shared/utils/apiResponse";
import { AuthenticatedRequest } from "../../../../shared/middlewares/auth.middleware";
import { PeriodType } from "../../domain/entities/Kpi";

const kpiRepo = new MySqlKpiRepository();
const scoringEngine = new ScoringEngineService(kpiRepo);
const rankingService = new RankingService(scoringEngine, kpiRepo);
const scope = new EmployeeScopeService();

export const ScoreController = {
  async getMyScore(req: AuthenticatedRequest, res: Response) {
    const actor = await scope.requireEmployeeForUser(req.user!.sub);
    const periodType = (req.query.periodType as PeriodType) ?? "monthly";
    const periodKey = req.query.periodKey as string;
    return ok(res, await scoringEngine.getCompositeScore(actor.id, periodType, periodKey));
  },

  async getEmployeeScore(req: AuthenticatedRequest, res: Response) {
    const periodType = (req.query.periodType as PeriodType) ?? "monthly";
    const periodKey = req.query.periodKey as string;
    return ok(res, await scoringEngine.getCompositeScore(req.params.employeeId, periodType, periodKey));
  },

  async recordManualScore(req: AuthenticatedRequest, res: Response) {
    const { employeeId, kpiDefinitionId, periodType, periodKey, score } = req.body;
    // entered_by is nullable and best-effort: the route already requires
    // kpi.score.manual_entry, so an admin with no personal Employee Master
    // record can still record scores - the earlier "override-permission
    // holder with no employee link" bug taught us not to hard-require this.
    const actorEmployee = await scope.getEmployeeForUser(req.user!.sub);
    return ok(res, await scoringEngine.recordManualScore(employeeId, kpiDefinitionId, periodType, periodKey, score, req.user!.sub, actorEmployee?.id ?? null));
  },

  async getMyTrend(req: AuthenticatedRequest, res: Response) {
    const actor = await scope.requireEmployeeForUser(req.user!.sub);
    const periodType = (req.query.periodType as PeriodType) ?? "monthly";
    const count = parseInt((req.query.count as string) ?? "6", 10);
    return ok(res, await rankingService.getEmployeeTrend(actor.id, periodType, count));
  },

  async getEmployeeTrend(req: AuthenticatedRequest, res: Response) {
    const periodType = (req.query.periodType as PeriodType) ?? "monthly";
    const count = parseInt((req.query.count as string) ?? "6", 10);
    return ok(res, await rankingService.getEmployeeTrend(req.params.employeeId, periodType, count));
  },

  async topPerformers(req: AuthenticatedRequest, res: Response) {
    const periodType = (req.query.periodType as PeriodType) ?? "monthly";
    const periodKey = req.query.periodKey as string;
    const limit = parseInt((req.query.limit as string) ?? "10", 10);
    return ok(res, await rankingService.topPerformers(periodType, periodKey, limit));
  },

  async bottomPerformers(req: AuthenticatedRequest, res: Response) {
    const periodType = (req.query.periodType as PeriodType) ?? "monthly";
    const periodKey = req.query.periodKey as string;
    const limit = parseInt((req.query.limit as string) ?? "10", 10);
    return ok(res, await rankingService.bottomPerformers(periodType, periodKey, limit));
  },

  async departmentRanking(req: AuthenticatedRequest, res: Response) {
    const periodType = (req.query.periodType as PeriodType) ?? "monthly";
    const periodKey = req.query.periodKey as string;
    return ok(res, await rankingService.departmentRanking(periodType, periodKey));
  },
};
