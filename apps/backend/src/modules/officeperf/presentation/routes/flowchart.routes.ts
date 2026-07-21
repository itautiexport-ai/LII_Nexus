import { Router } from "express";
import { FlowchartController } from "../controllers/FlowchartController";
import { createRunSchema, assignTaskSchema, updateTaskStatusSchema } from "../../application/dto/flowchart.dto";
import { validate } from "../../../../shared/middlewares/validate-request.middleware";
import { authMiddleware } from "../../../../shared/middlewares/auth.middleware";
import { requirePermission } from "../../../../shared/middlewares/rbac.middleware";
import { asyncHandler } from "../../../../shared/utils/asyncHandler";

const router = Router();
router.use(authMiddleware);

router.get("/flowchart/my-tasks", asyncHandler(FlowchartController.listMyTasks));
router.get("/flowchart/runs", requirePermission("flowchart.run.view"), asyncHandler(FlowchartController.listRuns));
router.get("/flowchart/runs/:id", requirePermission("flowchart.run.view"), asyncHandler(FlowchartController.getRunDetail));
router.post("/flowchart/runs", requirePermission("flowchart.run.create"), validate(createRunSchema), asyncHandler(FlowchartController.startRun));

// Task assignment/status - fine-grained authorization (manager-of / assignee)
// enforced in the service, not a flat permission - see FlowchartService.
router.patch("/flowchart/tasks/:taskId/assign", validate(assignTaskSchema), asyncHandler(FlowchartController.assignTask));
router.patch("/flowchart/tasks/:taskId/status", validate(updateTaskStatusSchema), asyncHandler(FlowchartController.updateTaskStatus));

export default router;
