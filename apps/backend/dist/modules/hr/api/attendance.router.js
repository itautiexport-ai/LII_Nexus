"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.attendanceRouter = exports.bulkAttendanceSchema = void 0;
const express_1 = require("express");
const AttendanceController_1 = require("../presentation/controllers/AttendanceController");
const PayrollController_1 = require("../presentation/controllers/PayrollController");
const validate_request_middleware_1 = require("../../../shared/middlewares/validate-request.middleware");
const auth_middleware_1 = require("../../../shared/middlewares/auth.middleware");
const rbac_middleware_1 = require("../../../shared/middlewares/rbac.middleware");
const asyncHandler_1 = require("../../../shared/utils/asyncHandler");
const zod_1 = require("zod");
const router = (0, express_1.Router)();
router.use(auth_middleware_1.authMiddleware);
exports.bulkAttendanceSchema = zod_1.z.object({
    records: zod_1.z.array(zod_1.z.object({
        employeeCode: zod_1.z.string().min(1),
        date: zod_1.z.string(), // YYYY-MM-DD
        status: zod_1.z.enum(['Present', 'Absent', 'Half Day', 'Leave', 'Holiday']),
        otHours: zod_1.z.number().optional()
    }))
});
router.post("/attendance/bulk", (0, rbac_middleware_1.requirePermission)("hr.manage"), (0, validate_request_middleware_1.validate)(exports.bulkAttendanceSchema), (0, asyncHandler_1.asyncHandler)(AttendanceController_1.AttendanceController.saveBulk));
router.get("/payroll/weekly", (0, asyncHandler_1.asyncHandler)(PayrollController_1.PayrollController.getWeeklyPayroll));
router.get("/payroll/monthly-sheet", (0, asyncHandler_1.asyncHandler)(PayrollController_1.PayrollController.getMonthlySalarySheet));
exports.attendanceRouter = router;
//# sourceMappingURL=attendance.router.js.map