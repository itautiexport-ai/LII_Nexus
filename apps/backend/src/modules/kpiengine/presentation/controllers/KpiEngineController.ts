import { Response } from "express";
import { KpiEngineDefinitionService } from "../../application/services/KpiEngineDefinitionService";
import { KpiEntryService } from "../../application/services/KpiEntryService";
import { KpiEngineScoreService } from "../../application/services/KpiEngineScoreService";
import { KpiFormulaEvaluator } from "../../application/services/KpiFormulaEvaluator";
import { MySqlKpiEngineRepository } from "../../infrastructure/repositories/MySqlKpiEngineRepository";
import { EmployeeScopeService } from "../../../performance/application/services/EmployeeScopeService";
import { ok, created } from "../../../../shared/utils/apiResponse";
import { AuthenticatedRequest } from "../../../../shared/middlewares/auth.middleware";
import { KpiCategory, MasterStatus } from "../../domain/entities/KpiEngine";
import { currentPeriodKey, lastNPeriodKeys } from "../../application/services/kpiPeriodUtils";

const repo = new MySqlKpiEngineRepository();
const scope = new EmployeeScopeService();
const definitionService = new KpiEngineDefinitionService(repo);
const entryService = new KpiEntryService(repo, scope);
const scoreService = new KpiEngineScoreService(repo);

export const KpiEngineController = {
  async listDefinitions(req: AuthenticatedRequest, res: Response) {
    return ok(res, await definitionService.list({
      category: req.query.category as KpiCategory | undefined,
      departmentId: req.query.departmentId as string | undefined,
      responsibleEmployeeId: req.query.responsibleEmployeeId as string | undefined,
      status: req.query.status as MasterStatus | undefined,
    }));
  },
  async getDefinition(req: AuthenticatedRequest, res: Response) {
    return ok(res, await definitionService.getById(req.params.id));
  },
  async createDefinition(req: AuthenticatedRequest, res: Response) {
    return created(res, await definitionService.create(req.body, req.user!.sub));
  },
  async updateDefinition(req: AuthenticatedRequest, res: Response) {
    return ok(res, await definitionService.update(req.params.id, req.body, req.user!.sub));
  },
  async removeDefinition(req: AuthenticatedRequest, res: Response) {
    await definitionService.remove(req.params.id, req.user!.sub);
    return ok(res, { message: "KPI definition deleted." });
  },
  async validateFormula(req: AuthenticatedRequest, res: Response) {
    KpiFormulaEvaluator.validate(req.body.formula);
    const sampleScore = KpiFormulaEvaluator.evaluate(req.body.formula, 100, 90);
    return ok(res, { valid: true, sampleScoreWithTarget100Actual90: sampleScore });
  },

  async recordEntry(req: AuthenticatedRequest, res: Response) {
    const { periodKey, target, actual } = req.body;
    return created(res, await entryService.recordEntry(req.params.id, periodKey, target, actual, req.user!.sub));
  },
  async getHistory(req: AuthenticatedRequest, res: Response) {
    const definition = await definitionService.getById(req.params.id);
    const count = parseInt((req.query.count as string) ?? "6", 10);
    const periodKeys = lastNPeriodKeys(definition.frequency, count);
    return ok(res, await entryService.getHistory(req.params.id, periodKeys));
  },

  async employeeScore(req: AuthenticatedRequest, res: Response) {
    const employeeId = req.params.employeeId;
    return ok(res, await scoreService.employeeScore(employeeId));
  },
  async myScore(req: AuthenticatedRequest, res: Response) {
    const employee = await scope.requireEmployeeForUser(req.user!.sub);
    return ok(res, await scoreService.employeeScore(employee.id));
  },
  async departmentScore(req: AuthenticatedRequest, res: Response) {
    return ok(res, await scoreService.departmentScore(req.params.departmentId));
  },
  async companyScore(_req: AuthenticatedRequest, res: Response) {
    return ok(res, await scoreService.companyScore());
  },

  async dashboard(_req: AuthenticatedRequest, res: Response) {
    const definitions = await definitionService.list({ status: "active" });
    const counts = { red: 0, amber: 0, green: 0, notEntered: 0 };
    const pendingEntry: { id: string; name: string; category: string; periodKey: string }[] = [];

    for (const def of definitions) {
      const periodKey = currentPeriodKey(def.frequency);
      const entry = await repo.getEntry(def.id, periodKey);
      if (!entry || entry.trafficLight === null) {
        counts.notEntered++;
        pendingEntry.push({ id: def.id, name: def.name, category: def.category, periodKey });
      } else {
        counts[entry.trafficLight]++;
      }
    }

    const companyScore = await scoreService.companyScore();
    return ok(res, { totalActiveKpis: definitions.length, trafficLightCounts: counts, pendingEntry, companyScore: companyScore.overallScore });
  },
};
