import { Router } from "express";
import { authMiddleware } from "../../../../shared/middlewares/auth.middleware";
import { 
  createHodEvaluation, 
  getHodEvaluations, 
  createHrEvaluation, 
  getHrEvaluations,
  dispatchEvaluation,
  getEvaluationList
} from "./PerformanceEvaluationController";

const router = Router();

router.use(authMiddleware);

router.get("/list", getEvaluationList);
router.post("/hod", createHodEvaluation);
router.get("/hod", getHodEvaluations);

router.post("/hr", createHrEvaluation);
router.get("/hr", getHrEvaluations);

router.post("/dispatch/:employeeId", dispatchEvaluation);

export { router as performanceEvaluationRouter };
