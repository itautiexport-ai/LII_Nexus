"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ApgsController = void 0;
const ApgsService_1 = require("../../application/services/ApgsService");
const apiResponse_1 = require("../../../../shared/utils/apiResponse");
const misService = new ApgsService_1.MisService();
exports.ApgsController = {
    async getScore(req, res) {
        const { employeeId } = req.params;
        const { period = "monthly" } = req.query;
        if (!employeeId) {
            throw new Error("Employee ID is required");
        }
        const report = await misService.generateReport(employeeId, period);
        return (0, apiResponse_1.ok)(res, report);
    },
    async saveManagerEvaluation(req, res) {
        const { employeeId } = req.params;
        const { periodType, periodStart, periodEnd, qualityOfWork, technicalCompetence, leadership, discipline, teamBehaviour, initiative, costSaving, problemSolving } = req.body;
        const evaluatedBy = req.user.sub;
        await misService.saveManagerEvaluation(employeeId, evaluatedBy, periodType, periodStart, periodEnd, {
            qualityOfWork,
            technicalCompetence,
            leadership,
            discipline,
            teamBehaviour,
            initiative,
            costSaving,
            problemSolving
        });
        return (0, apiResponse_1.ok)(res, { message: "Manager evaluation saved successfully" });
    },
    async getCumulativeScores(req, res) {
        const { period = "yearly" } = req.query;
        const reports = await misService.getCumulativeScores(period);
        return (0, apiResponse_1.ok)(res, reports);
    }
};
//# sourceMappingURL=ApgsController.js.map