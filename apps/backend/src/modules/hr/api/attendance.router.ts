import { Router } from "express";
import { AttendanceController } from "../presentation/controllers/AttendanceController";
import { PayrollController } from "../presentation/controllers/PayrollController";
import { validate } from "../../../shared/middlewares/validate-request.middleware";
import { authMiddleware } from "../../../shared/middlewares/auth.middleware";
import { requirePermission } from "../../../shared/middlewares/rbac.middleware";
import { asyncHandler } from "../../../shared/utils/asyncHandler";
import { z } from "zod";

const router = Router();
router.use(authMiddleware);

export const bulkAttendanceSchema = z.object({
  records: z.array(z.object({
    employeeCode: z.string().min(1),
    date: z.string(), // YYYY-MM-DD
    status: z.enum(['Present', 'Absent', 'Half Day', 'Leave', 'Holiday']),
    otHours: z.number().optional()
  }))
});

router.post("/attendance/bulk", requirePermission("hr.manage"), validate(bulkAttendanceSchema), asyncHandler(AttendanceController.saveBulk));

router.get("/payroll/weekly", asyncHandler(PayrollController.getWeeklyPayroll));
router.get("/payroll/monthly-sheet", asyncHandler(PayrollController.getMonthlySalarySheet));

export const attendanceRouter = router;
