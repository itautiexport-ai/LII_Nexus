import { Router } from "express";
import { OrderInHandController } from "../controllers/OrderInHandController";
import { authMiddleware } from "../../../../shared/middlewares/auth.middleware";

export const orderInHandRoutes = Router();
const controller = new OrderInHandController();

orderInHandRoutes.use(authMiddleware);

orderInHandRoutes.get("/", controller.getAll);
orderInHandRoutes.get("/:id", controller.getById);
orderInHandRoutes.post("/", controller.create);
orderInHandRoutes.put("/:id", controller.update);
orderInHandRoutes.delete("/:id", controller.delete);
