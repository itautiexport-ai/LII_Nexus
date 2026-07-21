"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const FlowchartController_1 = require("../controllers/FlowchartController");
const flowchart_dto_1 = require("../../application/dto/flowchart.dto");
const validate_request_middleware_1 = require("../../../../shared/middlewares/validate-request.middleware");
const auth_middleware_1 = require("../../../../shared/middlewares/auth.middleware");
const rbac_middleware_1 = require("../../../../shared/middlewares/rbac.middleware");
const asyncHandler_1 = require("../../../../shared/utils/asyncHandler");
const router = (0, express_1.Router)();
router.use(auth_middleware_1.authMiddleware);
router.get("/flowchart/my-tasks", (0, asyncHandler_1.asyncHandler)(FlowchartController_1.FlowchartController.listMyTasks));
router.get("/flowchart/runs", (0, rbac_middleware_1.requirePermission)("flowchart.run.view"), (0, asyncHandler_1.asyncHandler)(FlowchartController_1.FlowchartController.listRuns));
router.get("/flowchart/runs/:id", (0, rbac_middleware_1.requirePermission)("flowchart.run.view"), (0, asyncHandler_1.asyncHandler)(FlowchartController_1.FlowchartController.getRunDetail));
router.post("/flowchart/runs", (0, rbac_middleware_1.requirePermission)("flowchart.run.create"), (0, validate_request_middleware_1.validate)(flowchart_dto_1.createRunSchema), (0, asyncHandler_1.asyncHandler)(FlowchartController_1.FlowchartController.startRun));
// Task assignment/status - fine-grained authorization (manager-of / assignee)
// enforced in the service, not a flat permission - see FlowchartService.
router.patch("/flowchart/tasks/:taskId/assign", (0, validate_request_middleware_1.validate)(flowchart_dto_1.assignTaskSchema), (0, asyncHandler_1.asyncHandler)(FlowchartController_1.FlowchartController.assignTask));
router.patch("/flowchart/tasks/:taskId/status", (0, validate_request_middleware_1.validate)(flowchart_dto_1.updateTaskStatusSchema), (0, asyncHandler_1.asyncHandler)(FlowchartController_1.FlowchartController.updateTaskStatus));
exports.default = router;
//# sourceMappingURL=flowchart.routes.js.map