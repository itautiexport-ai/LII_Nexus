import { Router } from "express";
import { DelegationController } from "../controllers/DelegationController";
import { createDelegatedTaskSchema, updateDelegatedTaskSchema, updateStatusSchema, escalateSchema, addFileSchema, requestExtensionSchema, respondExtensionSchema } from "../../application/dto/delegation.dto";
import { validate } from "../../../../shared/middlewares/validate-request.middleware";
import { authMiddleware } from "../../../../shared/middlewares/auth.middleware";
import { asyncHandler } from "../../../../shared/utils/asyncHandler";

const router = Router();
router.use(authMiddleware);

router.get("/delegation/tasks", asyncHandler(DelegationController.list));
router.get("/delegation/i-delegated", asyncHandler(DelegationController.listIDelegated));
router.get("/delegation/tasks/:id", asyncHandler(DelegationController.getById));
router.post("/delegation/tasks", validate(createDelegatedTaskSchema), asyncHandler(DelegationController.create));
router.patch("/delegation/tasks/:id", validate(updateDelegatedTaskSchema), asyncHandler(DelegationController.update));
router.patch("/delegation/tasks/:id/status", validate(updateStatusSchema), asyncHandler(DelegationController.updateStatus));
router.patch("/delegation/tasks/:id/escalate", validate(escalateSchema), asyncHandler(DelegationController.escalate));
router.delete("/delegation/tasks/:id", asyncHandler(DelegationController.remove));
router.post("/delegation/tasks/:id/files", validate(addFileSchema), asyncHandler(DelegationController.addFile));
router.post("/delegation/tasks/:id/whatsapp", asyncHandler(DelegationController.sendWhatsAppReminder));
router.post("/delegation/tasks/:id/extension", validate(requestExtensionSchema), asyncHandler(DelegationController.requestExtension));
router.post("/delegation/tasks/:id/extension-response", validate(respondExtensionSchema), asyncHandler(DelegationController.respondToExtension));

export default router;
