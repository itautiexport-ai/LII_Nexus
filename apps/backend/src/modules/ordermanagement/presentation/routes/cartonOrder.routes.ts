import { Router } from "express";
import { CartonOrderController } from "../controllers/CartonOrderController";
import { CartonOrderService } from "../../application/services/CartonOrderService";
import { pool } from "../../../../infrastructure/database/mysql/connection";
import { authMiddleware } from "../../../../shared/middlewares/auth.middleware";

const router = Router();
const service = new CartonOrderService(pool);
const controller = new CartonOrderController(service);

router.post("/carton-orders", authMiddleware as any, controller.create);
router.get("/carton-orders", authMiddleware as any, controller.getAll);

export default router;
