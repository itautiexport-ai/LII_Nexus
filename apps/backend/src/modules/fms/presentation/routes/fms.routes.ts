import { Router } from "express";
import { FmsManagerController } from "../controllers/FmsManagerController";
import { FmsManagerService } from "../../application/services/FmsManagerService";
import { FmsExecutionService } from "../../application/services/FmsExecutionService";
import { FmsExecutionController } from "../controllers/FmsExecutionController";
import { authMiddleware } from "../../../../shared/middlewares/auth.middleware";
const { pool } = require("../../../../infrastructure/database/mysql/connection");

const router = Router();
const service = new FmsManagerService(pool);
const controller = new FmsManagerController(service);

const execService = new FmsExecutionService(pool);
const execController = new FmsExecutionController(execService);

router.post("/fms", authMiddleware, controller.createFms);
router.get("/fms", authMiddleware, controller.getAllFms);
router.get("/fms-global-steps", authMiddleware, controller.getAllStepsGlobal);
router.put("/fms/:id", authMiddleware, controller.updateFms);
router.delete("/fms/:id", authMiddleware, controller.deleteFms);

router.post("/fms/:fmsId/steps", authMiddleware, controller.addStep);
router.get("/fms/:fmsId/steps", authMiddleware, controller.getSteps);
router.put("/fms/steps/:stepId", authMiddleware, controller.updateStep);
router.delete("/fms/steps/:stepId", authMiddleware, controller.deleteStep);

// Execution Routes
router.post("/fms/:fmsManagerId/start", authMiddleware, execController.startInstance);
router.get("/fms/:fmsManagerId/instances", authMiddleware, execController.getInstances);
router.delete("/fms/instances/:instanceId", authMiddleware, execController.deleteInstance);
router.get("/fms-tasks/me", authMiddleware, execController.getMyTasks);
router.post("/fms-tasks/:instanceStepId/complete", authMiddleware, execController.completeTask);

export default router;
