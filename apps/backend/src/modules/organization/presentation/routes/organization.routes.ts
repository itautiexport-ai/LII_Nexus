import { Router } from "express";
import { DepartmentController } from "../controllers/DepartmentController";
import { DesignationController } from "../controllers/DesignationController";
import { EmployeeController } from "../controllers/EmployeeController";
import { createDepartmentSchema, updateDepartmentSchema } from "../../application/dto/department.dto";
import { createDesignationSchema, updateDesignationSchema } from "../../application/dto/designation.dto";
import { createEmployeeSchema, updateEmployeeSchema } from "../../application/dto/employee.dto";
import { validate } from "../../../../shared/middlewares/validate-request.middleware";
import { authMiddleware } from "../../../../shared/middlewares/auth.middleware";
import { requirePermission } from "../../../../shared/middlewares/rbac.middleware";
import { asyncHandler } from "../../../../shared/utils/asyncHandler";

const router = Router();
router.use(authMiddleware);

// Department Master
router.get("/departments", requirePermission("organization.department.view"), asyncHandler(DepartmentController.list));
router.post("/departments", requirePermission("organization.department.create"), validate(createDepartmentSchema), asyncHandler(DepartmentController.create));
router.patch("/departments/:id", requirePermission("organization.department.update"), validate(updateDepartmentSchema), asyncHandler(DepartmentController.update));
router.delete("/departments/:id", requirePermission("organization.department.delete"), asyncHandler(DepartmentController.remove));

// Designation Master
router.get("/designations", requirePermission("organization.designation.view"), asyncHandler(DesignationController.list));
router.post("/designations", requirePermission("organization.designation.create"), validate(createDesignationSchema), asyncHandler(DesignationController.create));
router.patch("/designations/:id", requirePermission("organization.designation.update"), validate(updateDesignationSchema), asyncHandler(DesignationController.update));
router.delete("/designations/:id", requirePermission("organization.designation.delete"), asyncHandler(DesignationController.remove));

// Employee Master
router.get("/employees/me", asyncHandler(EmployeeController.me));
router.get("/employees/my-direct-reports", asyncHandler(EmployeeController.myDirectReports));
router.get("/employees", requirePermission("organization.employee.view"), asyncHandler(EmployeeController.list));
router.get("/employees/:id", requirePermission("organization.employee.view"), asyncHandler(EmployeeController.getById));
router.post("/employees", requirePermission("organization.employee.create"), validate(createEmployeeSchema), asyncHandler(EmployeeController.create));
router.patch("/employees/:id", requirePermission("organization.employee.update"), validate(updateEmployeeSchema), asyncHandler(EmployeeController.update));
router.delete("/employees/:id", requirePermission("organization.employee.delete"), asyncHandler(EmployeeController.remove));

export default router;
