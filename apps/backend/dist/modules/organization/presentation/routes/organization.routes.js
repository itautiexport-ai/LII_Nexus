"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const DepartmentController_1 = require("../controllers/DepartmentController");
const DesignationController_1 = require("../controllers/DesignationController");
const EmployeeController_1 = require("../controllers/EmployeeController");
const department_dto_1 = require("../../application/dto/department.dto");
const designation_dto_1 = require("../../application/dto/designation.dto");
const employee_dto_1 = require("../../application/dto/employee.dto");
const validate_request_middleware_1 = require("../../../../shared/middlewares/validate-request.middleware");
const auth_middleware_1 = require("../../../../shared/middlewares/auth.middleware");
const rbac_middleware_1 = require("../../../../shared/middlewares/rbac.middleware");
const asyncHandler_1 = require("../../../../shared/utils/asyncHandler");
const router = (0, express_1.Router)();
router.use(auth_middleware_1.authMiddleware);
// Department Master
router.get("/departments", (0, rbac_middleware_1.requirePermission)("organization.department.view"), (0, asyncHandler_1.asyncHandler)(DepartmentController_1.DepartmentController.list));
router.post("/departments", (0, rbac_middleware_1.requirePermission)("organization.department.create"), (0, validate_request_middleware_1.validate)(department_dto_1.createDepartmentSchema), (0, asyncHandler_1.asyncHandler)(DepartmentController_1.DepartmentController.create));
router.patch("/departments/:id", (0, rbac_middleware_1.requirePermission)("organization.department.update"), (0, validate_request_middleware_1.validate)(department_dto_1.updateDepartmentSchema), (0, asyncHandler_1.asyncHandler)(DepartmentController_1.DepartmentController.update));
router.delete("/departments/:id", (0, rbac_middleware_1.requirePermission)("organization.department.delete"), (0, asyncHandler_1.asyncHandler)(DepartmentController_1.DepartmentController.remove));
// Designation Master
router.get("/designations", (0, rbac_middleware_1.requirePermission)("organization.designation.view"), (0, asyncHandler_1.asyncHandler)(DesignationController_1.DesignationController.list));
router.post("/designations", (0, rbac_middleware_1.requirePermission)("organization.designation.create"), (0, validate_request_middleware_1.validate)(designation_dto_1.createDesignationSchema), (0, asyncHandler_1.asyncHandler)(DesignationController_1.DesignationController.create));
router.patch("/designations/:id", (0, rbac_middleware_1.requirePermission)("organization.designation.update"), (0, validate_request_middleware_1.validate)(designation_dto_1.updateDesignationSchema), (0, asyncHandler_1.asyncHandler)(DesignationController_1.DesignationController.update));
router.delete("/designations/:id", (0, rbac_middleware_1.requirePermission)("organization.designation.delete"), (0, asyncHandler_1.asyncHandler)(DesignationController_1.DesignationController.remove));
// Employee Master
router.get("/employees/me", (0, asyncHandler_1.asyncHandler)(EmployeeController_1.EmployeeController.me));
router.get("/employees/my-direct-reports", (0, asyncHandler_1.asyncHandler)(EmployeeController_1.EmployeeController.myDirectReports));
router.get("/employees", (0, rbac_middleware_1.requirePermission)("organization.employee.view"), (0, asyncHandler_1.asyncHandler)(EmployeeController_1.EmployeeController.list));
router.get("/employees/:id", (0, rbac_middleware_1.requirePermission)("organization.employee.view"), (0, asyncHandler_1.asyncHandler)(EmployeeController_1.EmployeeController.getById));
router.post("/employees", (0, rbac_middleware_1.requirePermission)("organization.employee.create"), (0, validate_request_middleware_1.validate)(employee_dto_1.createEmployeeSchema), (0, asyncHandler_1.asyncHandler)(EmployeeController_1.EmployeeController.create));
router.patch("/employees/:id", (0, rbac_middleware_1.requirePermission)("organization.employee.update"), (0, validate_request_middleware_1.validate)(employee_dto_1.updateEmployeeSchema), (0, asyncHandler_1.asyncHandler)(EmployeeController_1.EmployeeController.update));
router.delete("/employees/:id", (0, rbac_middleware_1.requirePermission)("organization.employee.delete"), (0, asyncHandler_1.asyncHandler)(EmployeeController_1.EmployeeController.remove));
exports.default = router;
//# sourceMappingURL=organization.routes.js.map