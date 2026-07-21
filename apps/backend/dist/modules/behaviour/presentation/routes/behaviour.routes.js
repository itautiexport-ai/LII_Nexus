"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const BehaviourController_1 = require("../controllers/BehaviourController");
const behaviour_dto_1 = require("../../application/dto/behaviour.dto");
const validate_request_middleware_1 = require("../../../../shared/middlewares/validate-request.middleware");
const auth_middleware_1 = require("../../../../shared/middlewares/auth.middleware");
const rbac_middleware_1 = require("../../../../shared/middlewares/rbac.middleware");
const asyncHandler_1 = require("../../../../shared/utils/asyncHandler");
const router = (0, express_1.Router)();
router.use(auth_middleware_1.authMiddleware);
// Self-service first
router.get("/behaviour/index/me", (0, asyncHandler_1.asyncHandler)(BehaviourController_1.BehaviourController.myIndex));
// Health scores
router.get("/behaviour/health/department", (0, rbac_middleware_1.requirePermission)("behaviour.health.view"), (0, asyncHandler_1.asyncHandler)(BehaviourController_1.BehaviourController.departmentHealth));
router.get("/behaviour/health/workflow", (0, rbac_middleware_1.requirePermission)("behaviour.health.view"), (0, asyncHandler_1.asyncHandler)(BehaviourController_1.BehaviourController.workflowHealth));
router.get("/behaviour/health/factory", (0, rbac_middleware_1.requirePermission)("behaviour.health.view"), (0, asyncHandler_1.asyncHandler)(BehaviourController_1.BehaviourController.factoryHealth));
router.get("/behaviour/health/crm", (0, rbac_middleware_1.requirePermission)("behaviour.health.view"), (0, asyncHandler_1.asyncHandler)(BehaviourController_1.BehaviourController.crmHealth));
router.get("/behaviour/health/merchant", (0, rbac_middleware_1.requirePermission)("behaviour.health.view"), (0, asyncHandler_1.asyncHandler)(BehaviourController_1.BehaviourController.merchantHealth));
router.get("/behaviour/health/executive", (0, rbac_middleware_1.requirePermission)("behaviour.health.view"), (0, asyncHandler_1.asyncHandler)(BehaviourController_1.BehaviourController.executiveHealth));
// Analytics
router.get("/behaviour/analytics/top-performers", (0, rbac_middleware_1.requirePermission)("behaviour.index.view"), (0, asyncHandler_1.asyncHandler)(BehaviourController_1.BehaviourController.topPerformers));
router.get("/behaviour/analytics/bottom-performers", (0, rbac_middleware_1.requirePermission)("behaviour.index.view"), (0, asyncHandler_1.asyncHandler)(BehaviourController_1.BehaviourController.bottomPerformers));
router.get("/behaviour/analytics/most-improved", (0, rbac_middleware_1.requirePermission)("behaviour.index.view"), (0, asyncHandler_1.asyncHandler)(BehaviourController_1.BehaviourController.mostImproved));
router.get("/behaviour/analytics/most-delayed", (0, rbac_middleware_1.requirePermission)("behaviour.index.view"), (0, asyncHandler_1.asyncHandler)(BehaviourController_1.BehaviourController.mostDelayed));
router.get("/behaviour/analytics/most-consistent", (0, rbac_middleware_1.requirePermission)("behaviour.index.view"), (0, asyncHandler_1.asyncHandler)(BehaviourController_1.BehaviourController.mostConsistent));
router.get("/behaviour/analytics/repeat-defaulters", (0, rbac_middleware_1.requirePermission)("behaviour.index.view"), (0, asyncHandler_1.asyncHandler)(BehaviourController_1.BehaviourController.repeatDefaulters));
router.get("/behaviour/analytics/repeated-delay-reasons", (0, rbac_middleware_1.requirePermission)("behaviour.index.view"), (0, asyncHandler_1.asyncHandler)(BehaviourController_1.BehaviourController.repeatedDelayReasons));
router.get("/behaviour/analytics/department-comparison", (0, rbac_middleware_1.requirePermission)("behaviour.index.view"), (0, asyncHandler_1.asyncHandler)(BehaviourController_1.BehaviourController.departmentComparison));
router.get("/behaviour/analytics/historical-trend", (0, rbac_middleware_1.requirePermission)("behaviour.index.view"), (0, asyncHandler_1.asyncHandler)(BehaviourController_1.BehaviourController.historicalTrend));
// Components (admin config)
router.get("/behaviour/components", (0, asyncHandler_1.asyncHandler)(BehaviourController_1.BehaviourController.listComponents));
router.patch("/behaviour/components/:id", (0, rbac_middleware_1.requirePermission)("behaviour.component.manage"), (0, validate_request_middleware_1.validate)(behaviour_dto_1.updateComponentSchema), (0, asyncHandler_1.asyncHandler)(BehaviourController_1.BehaviourController.updateComponent));
// Manager feedback
router.post("/behaviour/feedback", (0, validate_request_middleware_1.validate)(behaviour_dto_1.submitFeedbackSchema), (0, asyncHandler_1.asyncHandler)(BehaviourController_1.BehaviourController.submitFeedback));
router.get("/behaviour/feedback/:employeeId", (0, asyncHandler_1.asyncHandler)(BehaviourController_1.BehaviourController.listFeedback));
// Insight rules + engine
router.get("/insight-rules", (0, asyncHandler_1.asyncHandler)(BehaviourController_1.BehaviourController.listInsightRules));
router.patch("/insight-rules/:ruleKey", (0, rbac_middleware_1.requirePermission)("behaviour.insight.manage"), (0, validate_request_middleware_1.validate)(behaviour_dto_1.updateInsightRuleSchema), (0, asyncHandler_1.asyncHandler)(BehaviourController_1.BehaviourController.updateInsightRule));
router.post("/behaviour/insights/run", (0, rbac_middleware_1.requirePermission)("behaviour.insight.run"), (0, asyncHandler_1.asyncHandler)(BehaviourController_1.BehaviourController.runInsights));
router.get("/behaviour/insights", (0, rbac_middleware_1.requirePermission)("behaviour.index.view"), (0, asyncHandler_1.asyncHandler)(BehaviourController_1.BehaviourController.listInsights));
router.get("/behaviour/insights/narrative", (0, rbac_middleware_1.requirePermission)("behaviour.index.view"), (0, asyncHandler_1.asyncHandler)(BehaviourController_1.BehaviourController.narrativeSummary));
// Employee-specific index - registered after all literal /behaviour/... paths
router.get("/behaviour/index/employees/:employeeId", (0, rbac_middleware_1.requirePermission)("behaviour.index.view"), (0, asyncHandler_1.asyncHandler)(BehaviourController_1.BehaviourController.employeeIndex));
exports.default = router;
//# sourceMappingURL=behaviour.routes.js.map