"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const GoalController_1 = require("../controllers/GoalController");
const ReviewController_1 = require("../controllers/ReviewController");
const goal_dto_1 = require("../../application/dto/goal.dto");
const review_dto_1 = require("../../application/dto/review.dto");
const validate_request_middleware_1 = require("../../../../shared/middlewares/validate-request.middleware");
const auth_middleware_1 = require("../../../../shared/middlewares/auth.middleware");
const asyncHandler_1 = require("../../../../shared/utils/asyncHandler");
const router = (0, express_1.Router)();
router.use(auth_middleware_1.authMiddleware);
// Goals - fine-grained authorization (self / manager / HR override) is
// enforced inside GoalService via EmployeeScopeService, not by a flat
// requirePermission() here, since "can I act on this?" depends on *whose*
// goal it is, not just which permissions the caller holds.
router.get("/employees/:employeeId/goals", (0, asyncHandler_1.asyncHandler)(GoalController_1.GoalController.listForEmployee));
router.post("/goals", (0, validate_request_middleware_1.validate)(goal_dto_1.createGoalSchema), (0, asyncHandler_1.asyncHandler)(GoalController_1.GoalController.create));
router.patch("/goals/:id", (0, validate_request_middleware_1.validate)(goal_dto_1.updateGoalSchema), (0, asyncHandler_1.asyncHandler)(GoalController_1.GoalController.update));
router.delete("/goals/:id", (0, asyncHandler_1.asyncHandler)(GoalController_1.GoalController.remove));
router.post("/goals/:id/progress", (0, validate_request_middleware_1.validate)(goal_dto_1.logProgressSchema), (0, asyncHandler_1.asyncHandler)(GoalController_1.GoalController.logProgress));
router.get("/goals/:id/progress", (0, asyncHandler_1.asyncHandler)(GoalController_1.GoalController.progressHistory));
// Reviews
router.get("/reviews/mine", (0, asyncHandler_1.asyncHandler)(ReviewController_1.ReviewController.listMine));
router.get("/reviews/i-manage", (0, asyncHandler_1.asyncHandler)(ReviewController_1.ReviewController.listIManage));
router.get("/employees/:employeeId/reviews", (0, asyncHandler_1.asyncHandler)(ReviewController_1.ReviewController.listForEmployee));
router.get("/reviews/:id", (0, asyncHandler_1.asyncHandler)(ReviewController_1.ReviewController.getById));
router.post("/reviews", (0, validate_request_middleware_1.validate)(review_dto_1.initiateReviewSchema), (0, asyncHandler_1.asyncHandler)(ReviewController_1.ReviewController.initiate));
router.patch("/reviews/:id/self", (0, validate_request_middleware_1.validate)(review_dto_1.submitSelfAssessmentSchema), (0, asyncHandler_1.asyncHandler)(ReviewController_1.ReviewController.submitSelf));
router.patch("/reviews/:id/manager", (0, validate_request_middleware_1.validate)(review_dto_1.submitManagerAssessmentSchema), (0, asyncHandler_1.asyncHandler)(ReviewController_1.ReviewController.submitManager));
exports.default = router;
//# sourceMappingURL=performance.routes.js.map