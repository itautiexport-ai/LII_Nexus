import { Response } from "express";
import { BehaviourIndexService } from "../../application/services/BehaviourIndexService";
import { HealthService } from "../../application/services/HealthService";
import { AnalyticsService } from "../../application/services/AnalyticsService";
import { InsightsEngineService } from "../../application/services/InsightsEngineService";
import { ManagerFeedbackService } from "../../application/services/ManagerFeedbackService";
import { BehaviourComponentService } from "../../application/services/BehaviourComponentService";
import { InsightRuleService } from "../../application/services/InsightRuleService";
import { MySqlBehaviourRepository } from "../../infrastructure/repositories/MySqlBehaviourRepository";
import { EmployeeScopeService } from "../../../performance/application/services/EmployeeScopeService";
import { MySqlRoleRepository } from "../../../rbac/infrastructure/repositories/MySqlRoleRepository";
import { ok } from "../../../../shared/utils/apiResponse";
import { AuthenticatedRequest } from "../../../../shared/middlewares/auth.middleware";
import { PeriodType } from "../../domain/entities/Behaviour";
import { periodKeyForNow } from "../../application/services/periodUtils";

const repo = new MySqlBehaviourRepository();
const scope = new EmployeeScopeService();
const behaviourIndexService = new BehaviourIndexService(repo);
const healthService = new HealthService(behaviourIndexService);
const analyticsService = new AnalyticsService(behaviourIndexService, repo);
const insightsEngine = new InsightsEngineService(repo, analyticsService, healthService);
const feedbackService = new ManagerFeedbackService(repo, scope);
const componentService = new BehaviourComponentService(repo);
const ruleService = new InsightRuleService(repo);
const roleRepo = new MySqlRoleRepository();

async function hasPermission(userId: string, key: string): Promise<boolean> {
  const keys = await roleRepo.getPermissionKeysForUser(userId);
  return keys.includes(key);
}

function periodOf(req: AuthenticatedRequest): { periodType: PeriodType; periodKey: string } {
  const periodType = (req.query.periodType as PeriodType) ?? "monthly";
  const periodKey = (req.query.periodKey as string) ?? periodKeyForNow(periodType);
  return { periodType, periodKey };
}

export const BehaviourController = {
  async myIndex(req: AuthenticatedRequest, res: Response) {
    const actor = await scope.requireEmployeeForUser(req.user!.sub);
    const { periodType, periodKey } = periodOf(req);
    return ok(res, await behaviourIndexService.getIndex(actor.id, periodType, periodKey));
  },
  async employeeIndex(req: AuthenticatedRequest, res: Response) {
    const { periodType, periodKey } = periodOf(req);
    return ok(res, await behaviourIndexService.getIndex(req.params.employeeId, periodType, periodKey));
  },

  async listComponents(_req: AuthenticatedRequest, res: Response) {
    return ok(res, await componentService.list());
  },
  async updateComponent(req: AuthenticatedRequest, res: Response) {
    return ok(res, await componentService.update(req.params.id, req.body, req.user!.sub));
  },

  async submitFeedback(req: AuthenticatedRequest, res: Response) {
    const override = await hasPermission(req.user!.sub, "behaviour.feedback.submit");
    const { employeeId, periodType, periodKey, rating, comments } = req.body;
    return ok(res, await feedbackService.submit(employeeId, periodType, periodKey, rating, comments, req.user!.sub, override));
  },
  async listFeedback(req: AuthenticatedRequest, res: Response) {
    const override = await hasPermission(req.user!.sub, "behaviour.feedback.view");
    return ok(res, await feedbackService.listForEmployee(req.params.employeeId, req.user!.sub, override));
  },

  async departmentHealth(req: AuthenticatedRequest, res: Response) {
    const { periodType, periodKey } = periodOf(req);
    return ok(res, await healthService.departmentHealth(periodType, periodKey));
  },
  async workflowHealth(req: AuthenticatedRequest, res: Response) {
    const { periodType, periodKey } = periodOf(req);
    return ok(res, await healthService.workflowHealth(periodType, periodKey));
  },
  async factoryHealth(req: AuthenticatedRequest, res: Response) {
    const { periodType, periodKey } = periodOf(req);
    return ok(res, await healthService.factoryHealth(periodType, periodKey));
  },
  async crmHealth(req: AuthenticatedRequest, res: Response) {
    const { periodType, periodKey } = periodOf(req);
    return ok(res, await healthService.crmHealth(periodType, periodKey));
  },
  async merchantHealth(req: AuthenticatedRequest, res: Response) {
    const { periodType, periodKey } = periodOf(req);
    return ok(res, await healthService.merchantHealth(periodType, periodKey));
  },
  async executiveHealth(req: AuthenticatedRequest, res: Response) {
    const { periodType, periodKey } = periodOf(req);
    return ok(res, await healthService.executiveHealth(periodType, periodKey));
  },

  async topPerformers(req: AuthenticatedRequest, res: Response) {
    const { periodType, periodKey } = periodOf(req);
    return ok(res, await analyticsService.topPerformers(periodType, periodKey));
  },
  async bottomPerformers(req: AuthenticatedRequest, res: Response) {
    const { periodType, periodKey } = periodOf(req);
    return ok(res, await analyticsService.bottomPerformers(periodType, periodKey));
  },
  async mostImproved(req: AuthenticatedRequest, res: Response) {
    const { periodType, periodKey } = periodOf(req);
    return ok(res, await analyticsService.mostImproved(periodType, periodKey));
  },
  async mostDelayed(req: AuthenticatedRequest, res: Response) {
    const { periodType, periodKey } = periodOf(req);
    return ok(res, await analyticsService.mostDelayed(periodType, periodKey));
  },
  async mostConsistent(req: AuthenticatedRequest, res: Response) {
    const { periodType, periodKey } = periodOf(req);
    return ok(res, await analyticsService.mostConsistent(periodType, periodKey));
  },
  async repeatDefaulters(req: AuthenticatedRequest, res: Response) {
    const { periodType, periodKey } = periodOf(req);
    return ok(res, await analyticsService.repeatDefaulters(periodType, periodKey));
  },
  async repeatedDelayReasons(req: AuthenticatedRequest, res: Response) {
    const { periodType, periodKey } = periodOf(req);
    return ok(res, await analyticsService.repeatedDelayReasons(periodType, periodKey));
  },
  async departmentComparison(req: AuthenticatedRequest, res: Response) {
    const { periodType, periodKey } = periodOf(req);
    return ok(res, await analyticsService.departmentComparison(periodType, periodKey));
  },
  async historicalTrend(req: AuthenticatedRequest, res: Response) {
    const periodType = (req.query.periodType as PeriodType) ?? "monthly";
    const count = parseInt((req.query.count as string) ?? "6", 10);
    return ok(res, await analyticsService.historicalTrend(periodType, count));
  },

  async listInsightRules(_req: AuthenticatedRequest, res: Response) {
    return ok(res, await ruleService.list());
  },
  async updateInsightRule(req: AuthenticatedRequest, res: Response) {
    return ok(res, await ruleService.update(req.params.ruleKey as any, req.body, req.user!.sub));
  },
  async runInsights(req: AuthenticatedRequest, res: Response) {
    const { periodType, periodKey } = periodOf(req);
    return ok(res, await insightsEngine.runInsights(periodType, periodKey));
  },
  async listInsights(req: AuthenticatedRequest, res: Response) {
    const { periodType, periodKey } = periodOf(req);
    return ok(res, await insightsEngine.listInsights(periodType, periodKey));
  },
  async narrativeSummary(req: AuthenticatedRequest, res: Response) {
    const { periodType, periodKey } = periodOf(req);
    return ok(res, { summary: await insightsEngine.generateNarrativeSummary(periodType, periodKey) });
  },
};
