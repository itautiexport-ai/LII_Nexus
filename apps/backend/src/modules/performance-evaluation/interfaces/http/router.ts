import { Router } from "express";
import { authMiddleware } from "../../../../shared/middlewares/auth.middleware";
import { 
  createHodEvaluation, 
  getHodEvaluations, 
  createHrEvaluation, 
  getHrEvaluations 
} from "./PerformanceEvaluationController";

const router = Router();

router.use(authMiddleware);

router.post("/hod", createHodEvaluation);
router.get("/hod", getHodEvaluations);

router.post("/hr", createHrEvaluation);
router.get("/hr", getHrEvaluations);

export { router as performanceEvaluationRouter };
