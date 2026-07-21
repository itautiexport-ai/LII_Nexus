"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ScoreController = void 0;
const ScoringEngineService_1 = require("../../application/services/ScoringEngineService");
const RankingService_1 = require("../../application/services/RankingService");
const MySqlKpiRepository_1 = require("../../infrastructure/repositories/MySqlKpiRepository");
const EmployeeScopeService_1 = require("../../../performance/application/services/EmployeeScopeService");
const apiResponse_1 = require("../../../../shared/utils/apiResponse");
const kpiRepo = new MySqlKpiRepository_1.MySqlKpiRepository();
const scoringEngine = new ScoringEngineService_1.ScoringEngineService(kpiRepo);
const rankingService = new RankingService_1.RankingService(scoringEngine, kpiRepo);
const scope = new EmployeeScopeService_1.EmployeeScopeService();
exports.ScoreController = {
    async getMyScore(req, res) {
        const actor = await scope.requireEmployeeForUser(req.user.sub);
        const periodType = req.query.periodType ?? "monthly";
        const periodKey = req.query.periodKey;
        return (0, apiResponse_1.ok)(res, await scoringEngine.getCompositeScore(actor.id, periodType, periodKey));
    },
    async getEmployeeScore(req, res) {
        const periodType = req.query.periodType ?? "monthly";
        const periodKey = req.query.periodKey;
        return (0, apiResponse_1.ok)(res, await scoringEngine.getCompositeScore(req.params.employeeId, periodType, periodKey));
    },
    async recordManualScore(req, res) {
        const { employeeId, kpiDefinitionId, periodType, periodKey, score } = req.body;
        // entered_by is nullable and best-effort: the route already requires
        // kpi.score.manual_entry, so an admin with no personal Employee Master
        // record can still record scores - the earlier "override-permission
        // holder with no employee link" bug taught us not to hard-require this.
        const actorEmployee = await scope.getEmployeeForUser(req.user.sub);
        return (0, apiResponse_1.ok)(res, await scoringEngine.recordManualScore(employeeId, kpiDefinitionId, periodType, periodKey, score, req.user.sub, actorEmployee?.id ?? null));
    },
    async getMyTrend(req, res) {
        const actor = await scope.requireEmployeeForUser(req.user.sub);
        const periodType = req.query.periodType ?? "monthly";
        const count = parseInt(req.query.count ?? "6", 10);
        return (0, apiResponse_1.ok)(res, await rankingService.getEmployeeTrend(actor.id, periodType, count));
    },
    async getEmployeeTrend(req, res) {
        const periodType = req.query.periodType ?? "monthly";
        const count = parseInt(req.query.count ?? "6", 10);
        return (0, apiResponse_1.ok)(res, await rankingService.getEmployeeTrend(req.params.employeeId, periodType, count));
    },
    async topPerformers(req, res) {
        const periodType = req.query.periodType ?? "monthly";
        const periodKey = req.query.periodKey;
        const limit = parseInt(req.query.limit ?? "10", 10);
        return (0, apiResponse_1.ok)(res, await rankingService.topPerformers(periodType, periodKey, limit));
    },
    async bottomPerformers(req, res) {
        const periodType = req.query.periodType ?? "monthly";
        const periodKey = req.query.periodKey;
        const limit = parseInt(req.query.limit ?? "10", 10);
        return (0, apiResponse_1.ok)(res, await rankingService.bottomPerformers(periodType, periodKey, limit));
    },
    async departmentRanking(req, res) {
        const periodType = req.query.periodType ?? "monthly";
        const periodKey = req.query.periodKey;
        return (0, apiResponse_1.ok)(res, await rankingService.departmentRanking(periodType, periodKey));
    },
};
//# sourceMappingURL=ScoreController.js.map