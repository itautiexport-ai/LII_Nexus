"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.BehaviourController = void 0;
const BehaviourIndexService_1 = require("../../application/services/BehaviourIndexService");
const HealthService_1 = require("../../application/services/HealthService");
const AnalyticsService_1 = require("../../application/services/AnalyticsService");
const InsightsEngineService_1 = require("../../application/services/InsightsEngineService");
const ManagerFeedbackService_1 = require("../../application/services/ManagerFeedbackService");
const BehaviourComponentService_1 = require("../../application/services/BehaviourComponentService");
const InsightRuleService_1 = require("../../application/services/InsightRuleService");
const MySqlBehaviourRepository_1 = require("../../infrastructure/repositories/MySqlBehaviourRepository");
const EmployeeScopeService_1 = require("../../../performance/application/services/EmployeeScopeService");
const MySqlRoleRepository_1 = require("../../../rbac/infrastructure/repositories/MySqlRoleRepository");
const apiResponse_1 = require("../../../../shared/utils/apiResponse");
const periodUtils_1 = require("../../application/services/periodUtils");
const repo = new MySqlBehaviourRepository_1.MySqlBehaviourRepository();
const scope = new EmployeeScopeService_1.EmployeeScopeService();
const behaviourIndexService = new BehaviourIndexService_1.BehaviourIndexService(repo);
const healthService = new HealthService_1.HealthService(behaviourIndexService);
const analyticsService = new AnalyticsService_1.AnalyticsService(behaviourIndexService, repo);
const insightsEngine = new InsightsEngineService_1.InsightsEngineService(repo, analyticsService, healthService);
const feedbackService = new ManagerFeedbackService_1.ManagerFeedbackService(repo, scope);
const componentService = new BehaviourComponentService_1.BehaviourComponentService(repo);
const ruleService = new InsightRuleService_1.InsightRuleService(repo);
const roleRepo = new MySqlRoleRepository_1.MySqlRoleRepository();
async function hasPermission(userId, key) {
    const keys = await roleRepo.getPermissionKeysForUser(userId);
    return keys.includes(key);
}
function periodOf(req) {
    const periodType = req.query.periodType ?? "monthly";
    const periodKey = req.query.periodKey ?? (0, periodUtils_1.periodKeyForNow)(periodType);
    return { periodType, periodKey };
}
exports.BehaviourController = {
    async myIndex(req, res) {
        const actor = await scope.requireEmployeeForUser(req.user.sub);
        const { periodType, periodKey } = periodOf(req);
        return (0, apiResponse_1.ok)(res, await behaviourIndexService.getIndex(actor.id, periodType, periodKey));
    },
    async employeeIndex(req, res) {
        const { periodType, periodKey } = periodOf(req);
        return (0, apiResponse_1.ok)(res, await behaviourIndexService.getIndex(req.params.employeeId, periodType, periodKey));
    },
    async listComponents(_req, res) {
        return (0, apiResponse_1.ok)(res, await componentService.list());
    },
    async updateComponent(req, res) {
        return (0, apiResponse_1.ok)(res, await componentService.update(req.params.id, req.body, req.user.sub));
    },
    async submitFeedback(req, res) {
        const override = await hasPermission(req.user.sub, "behaviour.feedback.submit");
        const { employeeId, periodType, periodKey, rating, comments } = req.body;
        return (0, apiResponse_1.ok)(res, await feedbackService.submit(employeeId, periodType, periodKey, rating, comments, req.user.sub, override));
    },
    async listFeedback(req, res) {
        const override = await hasPermission(req.user.sub, "behaviour.feedback.view");
        return (0, apiResponse_1.ok)(res, await feedbackService.listForEmployee(req.params.employeeId, req.user.sub, override));
    },
    async departmentHealth(req, res) {
        const { periodType, periodKey } = periodOf(req);
        return (0, apiResponse_1.ok)(res, await healthService.departmentHealth(periodType, periodKey));
    },
    async workflowHealth(req, res) {
        const { periodType, periodKey } = periodOf(req);
        return (0, apiResponse_1.ok)(res, await healthService.workflowHealth(periodType, periodKey));
    },
    async factoryHealth(req, res) {
        const { periodType, periodKey } = periodOf(req);
        return (0, apiResponse_1.ok)(res, await healthService.factoryHealth(periodType, periodKey));
    },
    async crmHealth(req, res) {
        const { periodType, periodKey } = periodOf(req);
        return (0, apiResponse_1.ok)(res, await healthService.crmHealth(periodType, periodKey));
    },
    async merchantHealth(req, res) {
        const { periodType, periodKey } = periodOf(req);
        return (0, apiResponse_1.ok)(res, await healthService.merchantHealth(periodType, periodKey));
    },
    async executiveHealth(req, res) {
        const { periodType, periodKey } = periodOf(req);
        return (0, apiResponse_1.ok)(res, await healthService.executiveHealth(periodType, periodKey));
    },
    async topPerformers(req, res) {
        const { periodType, periodKey } = periodOf(req);
        return (0, apiResponse_1.ok)(res, await analyticsService.topPerformers(periodType, periodKey));
    },
    async bottomPerformers(req, res) {
        const { periodType, periodKey } = periodOf(req);
        return (0, apiResponse_1.ok)(res, await analyticsService.bottomPerformers(periodType, periodKey));
    },
    async mostImproved(req, res) {
        const { periodType, periodKey } = periodOf(req);
        return (0, apiResponse_1.ok)(res, await analyticsService.mostImproved(periodType, periodKey));
    },
    async mostDelayed(req, res) {
        const { periodType, periodKey } = periodOf(req);
        return (0, apiResponse_1.ok)(res, await analyticsService.mostDelayed(periodType, periodKey));
    },
    async mostConsistent(req, res) {
        const { periodType, periodKey } = periodOf(req);
        return (0, apiResponse_1.ok)(res, await analyticsService.mostConsistent(periodType, periodKey));
    },
    async repeatDefaulters(req, res) {
        const { periodType, periodKey } = periodOf(req);
        return (0, apiResponse_1.ok)(res, await analyticsService.repeatDefaulters(periodType, periodKey));
    },
    async repeatedDelayReasons(req, res) {
        const { periodType, periodKey } = periodOf(req);
        return (0, apiResponse_1.ok)(res, await analyticsService.repeatedDelayReasons(periodType, periodKey));
    },
    async departmentComparison(req, res) {
        const { periodType, periodKey } = periodOf(req);
        return (0, apiResponse_1.ok)(res, await analyticsService.departmentComparison(periodType, periodKey));
    },
    async historicalTrend(req, res) {
        const periodType = req.query.periodType ?? "monthly";
        const count = parseInt(req.query.count ?? "6", 10);
        return (0, apiResponse_1.ok)(res, await analyticsService.historicalTrend(periodType, count));
    },
    async listInsightRules(_req, res) {
        return (0, apiResponse_1.ok)(res, await ruleService.list());
    },
    async updateInsightRule(req, res) {
        return (0, apiResponse_1.ok)(res, await ruleService.update(req.params.ruleKey, req.body, req.user.sub));
    },
    async runInsights(req, res) {
        const { periodType, periodKey } = periodOf(req);
        return (0, apiResponse_1.ok)(res, await insightsEngine.runInsights(periodType, periodKey));
    },
    async listInsights(req, res) {
        const { periodType, periodKey } = periodOf(req);
        return (0, apiResponse_1.ok)(res, await insightsEngine.listInsights(periodType, periodKey));
    },
    async narrativeSummary(req, res) {
        const { periodType, periodKey } = periodOf(req);
        return (0, apiResponse_1.ok)(res, { summary: await insightsEngine.generateNarrativeSummary(periodType, periodKey) });
    },
};
//# sourceMappingURL=BehaviourController.js.map