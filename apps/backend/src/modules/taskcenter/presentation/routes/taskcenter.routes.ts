import { Router } from "express";
import { authMiddleware } from "../../../../shared/middlewares/auth.middleware";
import { TaskCenterController } from "../controllers/TaskCenterController";
import { TaskCenterService } from "../../application/services/TaskCenterService";

const router = Router();
const service = new TaskCenterService();
const controller = new TaskCenterController(service);

router.get("/stats", authMiddleware, controller.getDashboardStats);

export default router;
