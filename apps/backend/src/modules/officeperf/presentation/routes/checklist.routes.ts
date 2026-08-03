import { Router } from "express";
import { ChecklistController } from "../controllers/ChecklistController";
import { createTemplateSchema, updateTemplateSchema, setItemCheckedSchema } from "../../application/dto/checklist.dto";
import { validate } from "../../../../shared/middlewares/validate-request.middleware";
import { authMiddleware } from "../../../../shared/middlewares/auth.middleware";
import { requirePermission } from "../../../../shared/middlewares/rbac.middleware";
import { asyncHandler } from "../../../../shared/utils/asyncHandler";

const router = Router();
router.use(authMiddleware);

router.get("/checklists/my-checklists", asyncHandler(ChecklistController.getMyChecklists));
router.get("/checklists/templates", requirePermission("checklist.template.view"), asyncHandler(ChecklistController.listTemplates));
router.get("/checklists/templates/:id", requirePermission("checklist.template.view"), asyncHandler(ChecklistController.getTemplateDetail));
router.post("/checklists/templates", requirePermission("checklist.template.create"), validate(createTemplateSchema), asyncHandler(ChecklistController.createTemplate));
router.patch("/checklists/templates/:id", requirePermission("checklist.template.update"), validate(updateTemplateSchema), asyncHandler(ChecklistController.updateTemplate));
router.delete("/checklists/templates/:id", requirePermission("checklist.template.delete"), asyncHandler(ChecklistController.deleteTemplate));

router.patch("/checklists/instances/:instanceId/items/:itemId", validate(setItemCheckedSchema), asyncHandler(ChecklistController.setItemChecked));

export default router;
