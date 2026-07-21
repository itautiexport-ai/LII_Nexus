"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.performanceEvaluationRouter = void 0;
const express_1 = require("express");
const auth_middleware_1 = require("../../../../shared/middlewares/auth.middleware");
const PerformanceEvaluationController_1 = require("./PerformanceEvaluationController");
const router = (0, express_1.Router)();
exports.performanceEvaluationRouter = router;
router.use(auth_middleware_1.authMiddleware);
router.post("/hod", PerformanceEvaluationController_1.createHodEvaluation);
router.get("/hod", PerformanceEvaluationController_1.getHodEvaluations);
router.post("/hr", PerformanceEvaluationController_1.createHrEvaluation);
router.get("/hr", PerformanceEvaluationController_1.getHrEvaluations);
//# sourceMappingURL=router.js.map