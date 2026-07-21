"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const NotificationController_1 = require("../controllers/NotificationController");
const notification_dto_1 = require("../../application/dto/notification.dto");
const zod_1 = require("zod");
const validate_request_middleware_1 = require("../../../../shared/middlewares/validate-request.middleware");
const auth_middleware_1 = require("../../../../shared/middlewares/auth.middleware");
const rbac_middleware_1 = require("../../../../shared/middlewares/rbac.middleware");
const asyncHandler_1 = require("../../../../shared/utils/asyncHandler");
const updateStatusSchema = zod_1.z.object({ status: zod_1.z.enum(["pending", "actioned", "dismissed"]) });
const router = (0, express_1.Router)();
router.use(auth_middleware_1.authMiddleware);
// Literal paths registered before /notifications/:id, per this project's
// established route-ordering lesson (hit twice already in other modules).
router.get("/notifications/unread-count", (0, asyncHandler_1.asyncHandler)(NotificationController_1.NotificationController.unreadCount));
router.patch("/notifications/mark-all-read", (0, asyncHandler_1.asyncHandler)(NotificationController_1.NotificationController.markAllRead));
router.post("/notifications/run-escalation-check", (0, rbac_middleware_1.requirePermission)("notification.escalation.run"), (0, asyncHandler_1.asyncHandler)(NotificationController_1.NotificationController.runEscalationCheck));
router.get("/notification-templates", (0, rbac_middleware_1.requirePermission)("notification.template.view"), (0, asyncHandler_1.asyncHandler)(NotificationController_1.NotificationController.listTemplates));
router.patch("/notification-templates/:id", (0, rbac_middleware_1.requirePermission)("notification.template.update"), (0, validate_request_middleware_1.validate)(notification_dto_1.updateTemplateSchema), (0, asyncHandler_1.asyncHandler)(NotificationController_1.NotificationController.updateTemplate));
router.get("/escalation-rules", (0, rbac_middleware_1.requirePermission)("notification.rule.view"), (0, asyncHandler_1.asyncHandler)(NotificationController_1.NotificationController.listEscalationRules));
router.patch("/escalation-rules/:level", (0, rbac_middleware_1.requirePermission)("notification.rule.manage"), (0, validate_request_middleware_1.validate)(notification_dto_1.updateEscalationRuleSchema), (0, asyncHandler_1.asyncHandler)(NotificationController_1.NotificationController.updateEscalationRule));
router.get("/notifications", (0, asyncHandler_1.asyncHandler)(NotificationController_1.NotificationController.listMine));
router.patch("/notifications/:id/read", (0, asyncHandler_1.asyncHandler)(NotificationController_1.NotificationController.markRead));
router.patch("/notifications/:id/status", (0, validate_request_middleware_1.validate)(updateStatusSchema), (0, asyncHandler_1.asyncHandler)(NotificationController_1.NotificationController.updateStatus));
exports.default = router;
//# sourceMappingURL=notification.routes.js.map