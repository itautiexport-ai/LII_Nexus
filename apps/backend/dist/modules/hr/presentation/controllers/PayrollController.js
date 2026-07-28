"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.PayrollController = void 0;
const apiResponse_1 = require("../../../../shared/utils/apiResponse");
const PayrollService_1 = require("../../application/services/PayrollService");
const service = new PayrollService_1.PayrollService();
exports.PayrollController = {
    async getWeeklyPayroll(req, res) {
        const startDate = req.query.startDate || "";
        const endDate = req.query.endDate || "";
        const data = await service.getWeeklyPayroll(startDate, endDate);
        return (0, apiResponse_1.ok)(res, data);
    },
    async getMonthlySalarySheet(req, res) {
        const startDate = req.query.startDate || "";
        const endDate = req.query.endDate || "";
        const data = await service.getMonthlySalarySheet(startDate, endDate);
        return (0, apiResponse_1.ok)(res, data);
    }
};
//# sourceMappingURL=PayrollController.js.map