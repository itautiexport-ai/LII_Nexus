import { Router } from "express";
import { KraController } from "../application/controllers/KraController";
import { authMiddleware } from "../../../shared/middlewares/auth.middleware";

export const kraRouter = Router();

kraRouter.use(authMiddleware);

kraRouter.get("/", KraController.list);
kraRouter.post("/", KraController.create);
kraRouter.delete("/:id", KraController.remove);
