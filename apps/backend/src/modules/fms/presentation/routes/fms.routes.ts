import { Router } from "express";
import { FmsManagerController } from "../controllers/FmsManagerController";
import { FmsManagerService } from "../../application/services/FmsManagerService";
import { authMiddleware } from "../../../../shared/middlewares/auth.middleware";
const { pool } = require("../../../../infrastructure/database/mysql/connection");

const router = Router();
const service = new FmsManagerService(pool);
const controller = new FmsManagerController(service);

router.post("/fms", authMiddleware, controller.createFms);
router.get("/fms", authMiddleware, controller.getAllFms);
router.delete("/fms/:id", authMiddleware, controller.deleteFms);

router.post("/fms/:fmsId/steps", authMiddleware, controller.addStep);
router.get("/fms/:fmsId/steps", authMiddleware, controller.getSteps);
router.delete("/fms/steps/:stepId", authMiddleware, controller.deleteStep);

export default router;
