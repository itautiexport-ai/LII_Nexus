import { Router } from "express";
import { WorkflowController } from "../controllers/WorkflowController";
import { createWorkflowSchema, updateWorkflowMetaSchema, updateStatusSchema, stageSchema, reorderStagesSchema } from "../../application/dto/workflow.dto";
import { validate } from "../../../../shared/middlewares/validate-request.middleware";
import { authMiddleware } from "../../../../shared/middlewares/auth.middleware";
import { requirePermission } from "../../../../shared/middlewares/rbac.middleware";
import { asyncHandler } from "../../../../shared/utils/asyncHandler";

const router = Router();
router.use(authMiddleware);

router.get("/workflows", requirePermission("workflow.view"), asyncHandler(WorkflowController.list));
router.get("/workflows/:id", requirePermission("workflow.view"), asyncHandler(WorkflowController.getById));
router.post("/workflows", requirePermission("workflow.create"), validate(createWorkflowSchema), asyncHandler(WorkflowController.create));
router.patch("/workflows/:id", requirePermission("workflow.update"), validate(updateWorkflowMetaSchema), asyncHandler(WorkflowController.updateMeta));
router.patch("/workflows/:id/status", requirePermission("workflow.publish"), validate(updateStatusSchema), asyncHandler(WorkflowController.updateStatus));
router.delete("/workflows/:id", requirePermission("workflow.delete"), asyncHandler(WorkflowController.remove));

router.post("/workflows/:id/stages", requirePermission("workflow.update"), validate(stageSchema), asyncHandler(WorkflowController.addStage));
router.patch("/workflows/:id/stages/reorder", requirePermission("workflow.update"), validate(reorderStagesSchema), asyncHandler(WorkflowController.reorderStages));
router.patch("/workflows/:id/stages/:stageId", requirePermission("workflow.update"), validate(stageSchema), asyncHandler(WorkflowController.updateStage));
router.delete("/workflows/:id/stages/:stageId", requirePermission("workflow.update"), asyncHandler(WorkflowController.removeStage));

export default router;
