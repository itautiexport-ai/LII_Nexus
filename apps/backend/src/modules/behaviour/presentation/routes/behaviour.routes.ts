import { Router } from "express";
import { BehaviourController } from "../controllers/BehaviourController";
import { updateComponentSchema, submitFeedbackSchema, updateInsightRuleSchema } from "../../application/dto/behaviour.dto";
import { validate } from "../../../../shared/middlewares/validate-request.middleware";
import { authMiddleware } from "../../../../shared/middlewares/auth.middleware";
import { requirePermission } from "../../../../shared/middlewares/rbac.middleware";
import { asyncHandler } from "../../../../shared/utils/asyncHandler";

const router = Router();
router.use(authMiddleware);

// Self-service first
router.get("/behaviour/index/me", asyncHandler(BehaviourController.myIndex));

// Health scores
router.get("/behaviour/health/department", requirePermission("behaviour.health.view"), asyncHandler(BehaviourController.departmentHealth));
router.get("/behaviour/health/workflow", requirePermission("behaviour.health.view"), asyncHandler(BehaviourController.workflowHealth));
router.get("/behaviour/health/factory", requirePermission("behaviour.health.view"), asyncHandler(BehaviourController.factoryHealth));
router.get("/behaviour/health/crm", requirePermission("behaviour.health.view"), asyncHandler(BehaviourController.crmHealth));
router.get("/behaviour/health/merchant", requirePermission("behaviour.health.view"), asyncHandler(BehaviourController.merchantHealth));
router.get("/behaviour/health/executive", requirePermission("behaviour.health.view"), asyncHandler(BehaviourController.executiveHealth));

// Analytics
router.get("/behaviour/analytics/top-performers", requirePermission("behaviour.index.view"), asyncHandler(BehaviourController.topPerformers));
router.get("/behaviour/analytics/bottom-performers", requirePermission("behaviour.index.view"), asyncHandler(BehaviourController.bottomPerformers));
router.get("/behaviour/analytics/most-improved", requirePermission("behaviour.index.view"), asyncHandler(BehaviourController.mostImproved));
router.get("/behaviour/analytics/most-delayed", requirePermission("behaviour.index.view"), asyncHandler(BehaviourController.mostDelayed));
router.get("/behaviour/analytics/most-consistent", requirePermission("behaviour.index.view"), asyncHandler(BehaviourController.mostConsistent));
router.get("/behaviour/analytics/repeat-defaulters", requirePermission("behaviour.index.view"), asyncHandler(BehaviourController.repeatDefaulters));
router.get("/behaviour/analytics/repeated-delay-reasons", requirePermission("behaviour.index.view"), asyncHandler(BehaviourController.repeatedDelayReasons));
router.get("/behaviour/analytics/department-comparison", requirePermission("behaviour.index.view"), asyncHandler(BehaviourController.departmentComparison));
router.get("/behaviour/analytics/historical-trend", requirePermission("behaviour.index.view"), asyncHandler(BehaviourController.historicalTrend));

// Components (admin config)
router.get("/behaviour/components", asyncHandler(BehaviourController.listComponents));
router.patch("/behaviour/components/:id", requirePermission("behaviour.component.manage"), validate(updateComponentSchema), asyncHandler(BehaviourController.updateComponent));

// Manager feedback
router.post("/behaviour/feedback", validate(submitFeedbackSchema), asyncHandler(BehaviourController.submitFeedback));
router.get("/behaviour/feedback/:employeeId", asyncHandler(BehaviourController.listFeedback));

// Insight rules + engine
router.get("/insight-rules", asyncHandler(BehaviourController.listInsightRules));
router.patch("/insight-rules/:ruleKey", requirePermission("behaviour.insight.manage"), validate(updateInsightRuleSchema), asyncHandler(BehaviourController.updateInsightRule));
router.post("/behaviour/insights/run", requirePermission("behaviour.insight.run"), asyncHandler(BehaviourController.runInsights));
router.get("/behaviour/insights", requirePermission("behaviour.index.view"), asyncHandler(BehaviourController.listInsights));
router.get("/behaviour/insights/narrative", requirePermission("behaviour.index.view"), asyncHandler(BehaviourController.narrativeSummary));

// Employee-specific index - registered after all literal /behaviour/... paths
router.get("/behaviour/index/employees/:employeeId", requirePermission("behaviour.index.view"), asyncHandler(BehaviourController.employeeIndex));

export default router;
