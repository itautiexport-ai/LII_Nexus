"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.OfficeEmController = void 0;
const OfficeEmService_1 = require("../../application/services/OfficeEmService");
const apiResponse_1 = require("../../../../shared/utils/apiResponse");
exports.OfficeEmController = {
    async getGapScore(req, res) {
        const { employeeId } = req.params;
        const { period = "monthly" } = req.query;
        const report = await OfficeEmService_1.officeEmService.generateGapScoreReport(employeeId, period);
        return (0, apiResponse_1.ok)(res, report);
    },
    async getGapScoreList(req, res) {
        const { period = "monthly" } = req.query;
        const reportList = await OfficeEmService_1.officeEmService.generateGapScoreList(period);
        return (0, apiResponse_1.ok)(res, reportList);
    }
};
//# sourceMappingURL=OfficeEmController.js.map