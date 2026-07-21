import { Router } from "express";
import { MeetingController } from "../controllers/MeetingController";
import { createMeetingSchema, updateMeetingSchema, setReviewSectionSchema, addDecisionSchema, createActionSchema, addAttachmentSchema } from "../../application/dto/meeting.dto";
import { validate } from "../../../../shared/middlewares/validate-request.middleware";
import { authMiddleware } from "../../../../shared/middlewares/auth.middleware";
import { requirePermission } from "../../../../shared/middlewares/rbac.middleware";
import { asyncHandler } from "../../../../shared/utils/asyncHandler";

const router = Router();
router.use(authMiddleware);

// Literal paths first - dashboard and action-list endpoints registered
// before /meetings/:id, the lesson this project has learned more than once.
router.get("/meetings/dashboard", requirePermission("meeting.view"), asyncHandler(MeetingController.dashboard));
router.get("/meetings/actions/pending", requirePermission("meeting.view"), asyncHandler(MeetingController.listPendingActions));
router.get("/meetings/actions/completed", requirePermission("meeting.view"), asyncHandler(MeetingController.listCompletedActions));

router.get("/meetings", requirePermission("meeting.view"), asyncHandler(MeetingController.list));
router.post("/meetings", requirePermission("meeting.create"), validate(createMeetingSchema), asyncHandler(MeetingController.create));
router.get("/meetings/:id", requirePermission("meeting.view"), asyncHandler(MeetingController.getById));
router.patch("/meetings/:id", requirePermission("meeting.update"), validate(updateMeetingSchema), asyncHandler(MeetingController.update));
router.delete("/meetings/:id", requirePermission("meeting.delete"), asyncHandler(MeetingController.remove));

router.put("/meetings/:id/review-sections", requirePermission("meeting.update"), validate(setReviewSectionSchema), asyncHandler(MeetingController.setReviewSection));
router.post("/meetings/:id/decisions", requirePermission("meeting.update"), validate(addDecisionSchema), asyncHandler(MeetingController.addDecision));
router.post("/meetings/:id/attachments", requirePermission("meeting.update"), validate(addAttachmentSchema), asyncHandler(MeetingController.addAttachment));
router.post("/meetings/:id/actions", requirePermission("meeting.update"), validate(createActionSchema), asyncHandler(MeetingController.createAction));

router.get("/meetings/:id/mom", requirePermission("meeting.view"), asyncHandler(MeetingController.getMom));
router.get("/meetings/:id/mom/export", requirePermission("meeting.mom.export"), asyncHandler(MeetingController.exportMomPdf));

export default router;
