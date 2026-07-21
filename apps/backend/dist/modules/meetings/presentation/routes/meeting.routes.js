"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const MeetingController_1 = require("../controllers/MeetingController");
const meeting_dto_1 = require("../../application/dto/meeting.dto");
const validate_request_middleware_1 = require("../../../../shared/middlewares/validate-request.middleware");
const auth_middleware_1 = require("../../../../shared/middlewares/auth.middleware");
const rbac_middleware_1 = require("../../../../shared/middlewares/rbac.middleware");
const asyncHandler_1 = require("../../../../shared/utils/asyncHandler");
const router = (0, express_1.Router)();
router.use(auth_middleware_1.authMiddleware);
// Literal paths first - dashboard and action-list endpoints registered
// before /meetings/:id, the lesson this project has learned more than once.
router.get("/meetings/dashboard", (0, rbac_middleware_1.requirePermission)("meeting.view"), (0, asyncHandler_1.asyncHandler)(MeetingController_1.MeetingController.dashboard));
router.get("/meetings/actions/pending", (0, rbac_middleware_1.requirePermission)("meeting.view"), (0, asyncHandler_1.asyncHandler)(MeetingController_1.MeetingController.listPendingActions));
router.get("/meetings/actions/completed", (0, rbac_middleware_1.requirePermission)("meeting.view"), (0, asyncHandler_1.asyncHandler)(MeetingController_1.MeetingController.listCompletedActions));
router.get("/meetings", (0, rbac_middleware_1.requirePermission)("meeting.view"), (0, asyncHandler_1.asyncHandler)(MeetingController_1.MeetingController.list));
router.post("/meetings", (0, rbac_middleware_1.requirePermission)("meeting.create"), (0, validate_request_middleware_1.validate)(meeting_dto_1.createMeetingSchema), (0, asyncHandler_1.asyncHandler)(MeetingController_1.MeetingController.create));
router.get("/meetings/:id", (0, rbac_middleware_1.requirePermission)("meeting.view"), (0, asyncHandler_1.asyncHandler)(MeetingController_1.MeetingController.getById));
router.patch("/meetings/:id", (0, rbac_middleware_1.requirePermission)("meeting.update"), (0, validate_request_middleware_1.validate)(meeting_dto_1.updateMeetingSchema), (0, asyncHandler_1.asyncHandler)(MeetingController_1.MeetingController.update));
router.delete("/meetings/:id", (0, rbac_middleware_1.requirePermission)("meeting.delete"), (0, asyncHandler_1.asyncHandler)(MeetingController_1.MeetingController.remove));
router.put("/meetings/:id/review-sections", (0, rbac_middleware_1.requirePermission)("meeting.update"), (0, validate_request_middleware_1.validate)(meeting_dto_1.setReviewSectionSchema), (0, asyncHandler_1.asyncHandler)(MeetingController_1.MeetingController.setReviewSection));
router.post("/meetings/:id/decisions", (0, rbac_middleware_1.requirePermission)("meeting.update"), (0, validate_request_middleware_1.validate)(meeting_dto_1.addDecisionSchema), (0, asyncHandler_1.asyncHandler)(MeetingController_1.MeetingController.addDecision));
router.post("/meetings/:id/attachments", (0, rbac_middleware_1.requirePermission)("meeting.update"), (0, validate_request_middleware_1.validate)(meeting_dto_1.addAttachmentSchema), (0, asyncHandler_1.asyncHandler)(MeetingController_1.MeetingController.addAttachment));
router.post("/meetings/:id/actions", (0, rbac_middleware_1.requirePermission)("meeting.update"), (0, validate_request_middleware_1.validate)(meeting_dto_1.createActionSchema), (0, asyncHandler_1.asyncHandler)(MeetingController_1.MeetingController.createAction));
router.get("/meetings/:id/mom", (0, rbac_middleware_1.requirePermission)("meeting.view"), (0, asyncHandler_1.asyncHandler)(MeetingController_1.MeetingController.getMom));
router.get("/meetings/:id/mom/export", (0, rbac_middleware_1.requirePermission)("meeting.mom.export"), (0, asyncHandler_1.asyncHandler)(MeetingController_1.MeetingController.exportMomPdf));
exports.default = router;
//# sourceMappingURL=meeting.routes.js.map