"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.KpiEngineController = void 0;
const KpiEngineDefinitionService_1 = require("../../application/services/KpiEngineDefinitionService");
const KpiEntryService_1 = require("../../application/services/KpiEntryService");
const KpiEngineScoreService_1 = require("../../application/services/KpiEngineScoreService");
const KpiFormulaEvaluator_1 = require("../../application/services/KpiFormulaEvaluator");
const MySqlKpiEngineRepository_1 = require("../../infrastructure/repositories/MySqlKpiEngineRepository");
const EmployeeScopeService_1 = require("../../../performance/application/services/EmployeeScopeService");
const apiResponse_1 = require("../../../../shared/utils/apiResponse");
const kpiPeriodUtils_1 = require("../../application/services/kpiPeriodUtils");
const repo = new MySqlKpiEngineRepository_1.MySqlKpiEngineRepository();
const scope = new EmployeeScopeService_1.EmployeeScopeService();
const definitionService = new KpiEngineDefinitionService_1.KpiEngineDefinitionService(repo);
const entryService = new KpiEntryService_1.KpiEntryService(repo, scope);
const scoreService = new KpiEngineScoreService_1.KpiEngineScoreService(repo);
exports.KpiEngineController = {
    async listDefinitions(req, res) {
        return (0, apiResponse_1.ok)(res, await definitionService.list({
            category: req.query.category,
            departmentId: req.query.departmentId,
            responsibleEmployeeId: req.query.responsibleEmployeeId,
            status: req.query.status,
        }));
    },
    async getDefinition(req, res) {
        return (0, apiResponse_1.ok)(res, await definitionService.getById(req.params.id));
    },
    async createDefinition(req, res) {
        return (0, apiResponse_1.created)(res, await definitionService.create(req.body, req.user.sub));
    },
    async updateDefinition(req, res) {
        return (0, apiResponse_1.ok)(res, await definitionService.update(req.params.id, req.body, req.user.sub));
    },
    async removeDefinition(req, res) {
        await definitionService.remove(req.params.id, req.user.sub);
        return (0, apiResponse_1.ok)(res, { message: "KPI definition deleted." });
    },
    async validateFormula(req, res) {
        KpiFormulaEvaluator_1.KpiFormulaEvaluator.validate(req.body.formula);
        const sampleScore = KpiFormulaEvaluator_1.KpiFormulaEvaluator.evaluate(req.body.formula, 100, 90);
        return (0, apiResponse_1.ok)(res, { valid: true, sampleScoreWithTarget100Actual90: sampleScore });
    },
    async recordEntry(req, res) {
        const { periodKey, target, actual } = req.body;
        return (0, apiResponse_1.created)(res, await entryService.recordEntry(req.params.id, periodKey, target, actual, req.user.sub));
    },
    async getHistory(req, res) {
        const definition = await definitionService.getById(req.params.id);
        const count = parseInt(req.query.count ?? "6", 10);
        const periodKeys = (0, kpiPeriodUtils_1.lastNPeriodKeys)(definition.frequency, count);
        return (0, apiResponse_1.ok)(res, await entryService.getHistory(req.params.id, periodKeys));
    },
    async employeeScore(req, res) {
        const employeeId = req.params.employeeId;
        return (0, apiResponse_1.ok)(res, await scoreService.employeeScore(employeeId));
    },
    async myScore(req, res) {
        const employee = await scope.requireEmployeeForUser(req.user.sub);
        return (0, apiResponse_1.ok)(res, await scoreService.employeeScore(employee.id));
    },
    async departmentScore(req, res) {
        return (0, apiResponse_1.ok)(res, await scoreService.departmentScore(req.params.departmentId));
    },
    async companyScore(_req, res) {
        return (0, apiResponse_1.ok)(res, await scoreService.companyScore());
    },
    async dashboard(_req, res) {
        const definitions = await definitionService.list({ status: "active" });
        const counts = { red: 0, amber: 0, green: 0, notEntered: 0 };
        const pendingEntry = [];
        for (const def of definitions) {
            const periodKey = (0, kpiPeriodUtils_1.currentPeriodKey)(def.frequency);
            const entry = await repo.getEntry(def.id, periodKey);
            if (!entry || entry.trafficLight === null) {
                counts.notEntered++;
                pendingEntry.push({ id: def.id, name: def.name, category: def.category, periodKey });
            }
            else {
                counts[entry.trafficLight]++;
            }
        }
        const companyScore = await scoreService.companyScore();
        return (0, apiResponse_1.ok)(res, { totalActiveKpis: definitions.length, trafficLightCounts: counts, pendingEntry, companyScore: companyScore.overallScore });
    },
};
//# sourceMappingURL=KpiEngineController.js.map