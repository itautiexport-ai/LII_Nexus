import { Router } from "express";
import { NotificationController } from "../controllers/NotificationController";
import { updateTemplateSchema, updateEscalationRuleSchema } from "../../application/dto/notification.dto";
import { z } from "zod";
import { validate } from "../../../../shared/middlewares/validate-request.middleware";
import { authMiddleware } from "../../../../shared/middlewares/auth.middleware";
import { requirePermission } from "../../../../shared/middlewares/rbac.middleware";
import { asyncHandler } from "../../../../shared/utils/asyncHandler";

const updateStatusSchema = z.object({ status: z.enum(["pending", "actioned", "dismissed"]) });

const router = Router();
router.use(authMiddleware);

// Literal paths registered before /notifications/:id, per this project's
// established route-ordering lesson (hit twice already in other modules).
router.get("/notifications/unread-count", asyncHandler(NotificationController.unreadCount));
router.patch("/notifications/mark-all-read", asyncHandler(NotificationController.markAllRead));
router.post("/notifications/run-escalation-check", requirePermission("notification.escalation.run"), asyncHandler(NotificationController.runEscalationCheck));

router.get("/notification-templates", requirePermission("notification.template.view"), asyncHandler(NotificationController.listTemplates));
router.patch("/notification-templates/:id", requirePermission("notification.template.update"), validate(updateTemplateSchema), asyncHandler(NotificationController.updateTemplate));

router.get("/escalation-rules", requirePermission("notification.rule.view"), asyncHandler(NotificationController.listEscalationRules));
router.patch("/escalation-rules/:level", requirePermission("notification.rule.manage"), validate(updateEscalationRuleSchema), asyncHandler(NotificationController.updateEscalationRule));

router.get("/notifications", asyncHandler(NotificationController.listMine));
router.patch("/notifications/:id/read", asyncHandler(NotificationController.markRead));
router.patch("/notifications/:id/status", validate(updateStatusSchema), asyncHandler(NotificationController.updateStatus));

export default router;
