import { Router } from "express";
import { GoalController } from "../controllers/GoalController";
import { ReviewController } from "../controllers/ReviewController";
import { createGoalSchema, updateGoalSchema, logProgressSchema } from "../../application/dto/goal.dto";
import { initiateReviewSchema, submitSelfAssessmentSchema, submitManagerAssessmentSchema } from "../../application/dto/review.dto";
import { validate } from "../../../../shared/middlewares/validate-request.middleware";
import { authMiddleware } from "../../../../shared/middlewares/auth.middleware";
import { asyncHandler } from "../../../../shared/utils/asyncHandler";

const router = Router();
router.use(authMiddleware);

// Goals - fine-grained authorization (self / manager / HR override) is
// enforced inside GoalService via EmployeeScopeService, not by a flat
// requirePermission() here, since "can I act on this?" depends on *whose*
// goal it is, not just which permissions the caller holds.
router.get("/employees/:employeeId/goals", asyncHandler(GoalController.listForEmployee));
router.post("/goals", validate(createGoalSchema), asyncHandler(GoalController.create));
router.patch("/goals/:id", validate(updateGoalSchema), asyncHandler(GoalController.update));
router.delete("/goals/:id", asyncHandler(GoalController.remove));
router.post("/goals/:id/progress", validate(logProgressSchema), asyncHandler(GoalController.logProgress));
router.get("/goals/:id/progress", asyncHandler(GoalController.progressHistory));

// Reviews
router.get("/reviews/mine", asyncHandler(ReviewController.listMine));
router.get("/reviews/i-manage", asyncHandler(ReviewController.listIManage));
router.get("/employees/:employeeId/reviews", asyncHandler(ReviewController.listForEmployee));
router.get("/reviews/:id", asyncHandler(ReviewController.getById));
router.post("/reviews", validate(initiateReviewSchema), asyncHandler(ReviewController.initiate));
router.patch("/reviews/:id/self", validate(submitSelfAssessmentSchema), asyncHandler(ReviewController.submitSelf));
router.patch("/reviews/:id/manager", validate(submitManagerAssessmentSchema), asyncHandler(ReviewController.submitManager));

export default router;
