"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.payrollRouter = void 0;
const express_1 = require("express");
const auth_middleware_1 = require("../../../shared/middlewares/auth.middleware");
const PayrollService_1 = require("../application/services/PayrollService");
const apiResponse_1 = require("../../../shared/utils/apiResponse");
exports.payrollRouter = (0, express_1.Router)();
const payrollService = new PayrollService_1.PayrollService();
// Save weekly payroll
exports.payrollRouter.post("/weekly", auth_middleware_1.authMiddleware, async (req, res) => {
    try {
        const { data, weekStartDate, weekEndDate } = req.body;
        if (!data || !Array.isArray(data)) {
            return res.status(400).json({ success: false, error: { message: "Invalid or missing 'data'" } });
        }
        if (!weekStartDate || !weekEndDate) {
            return res.status(400).json({ success: false, error: { message: "Missing 'weekStartDate' or 'weekEndDate'" } });
        }
        await payrollService.saveDepartmentWeeklyPayroll(data, weekStartDate, weekEndDate);
        return (0, apiResponse_1.ok)(res, { message: "Weekly payroll saved successfully" });
    }
    catch (error) {
        console.error("Error saving weekly payroll:", error);
        return res.status(500).json({ success: false, error: { message: error.message } });
    }
});
// Get monthly payroll
exports.payrollRouter.get("/monthly/:year/:month", auth_middleware_1.authMiddleware, async (req, res) => {
    try {
        const { year, month } = req.params;
        if (!year || !month) {
            return res.status(400).json({ success: false, error: { message: "Missing year or month" } });
        }
        const data = await payrollService.getDepartmentMonthlyPayroll(Number(month), Number(year));
        return (0, apiResponse_1.ok)(res, data);
    }
    catch (error) {
        console.error("Error fetching monthly payroll:", error);
        return res.status(500).json({ success: false, error: { message: error.message } });
    }
});
//# sourceMappingURL=payroll.router.js.map