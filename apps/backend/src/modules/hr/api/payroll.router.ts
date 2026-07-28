import { Router, Request, Response } from "express";
import { authMiddleware } from "../../../shared/middlewares/auth.middleware";
import { PayrollService } from "../application/services/PayrollService";
import { ok } from "../../../shared/utils/apiResponse";

export const payrollRouter = Router();
const payrollService = new PayrollService();

// Save weekly payroll
payrollRouter.post("/weekly", authMiddleware, async (req: Request, res: Response) => {
  try {
    const { data, weekStartDate, weekEndDate } = req.body;
    
    if (!data || !Array.isArray(data)) {
      return res.status(400).json({ success: false, error: { message: "Invalid or missing 'data'" } });
    }
    if (!weekStartDate || !weekEndDate) {
      return res.status(400).json({ success: false, error: { message: "Missing 'weekStartDate' or 'weekEndDate'" } });
    }

    await payrollService.saveDepartmentWeeklyPayroll(data, weekStartDate, weekEndDate);
    
    return ok(res, { message: "Weekly payroll saved successfully" });
  } catch (error: any) {
    console.error("Error saving weekly payroll:", error);
    return res.status(500).json({ success: false, error: { message: error.message } });
  }
});

// Get monthly payroll
payrollRouter.get("/monthly/:year/:month", authMiddleware, async (req: Request, res: Response) => {
  try {
    const { year, month } = req.params;
    
    if (!year || !month) {
      return res.status(400).json({ success: false, error: { message: "Missing year or month" } });
    }

    const data = await payrollService.getDepartmentMonthlyPayroll(Number(month), Number(year));
    
    return ok(res, data);
  } catch (error: any) {
    console.error("Error fetching monthly payroll:", error);
    return res.status(500).json({ success: false, error: { message: error.message } });
  }
});
