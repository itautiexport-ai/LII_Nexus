import { Router } from "express";
import { SecurityCustomController } from "../application/controllers/SecurityCustomController";
import { authMiddleware } from "../../../shared/middlewares/auth.middleware";

export const securityCustomRouter = Router();

securityCustomRouter.use(authMiddleware);

// Security Night Form
securityCustomRouter.get("/night-form", SecurityCustomController.getNightForms);
securityCustomRouter.post("/night-form", SecurityCustomController.createNightForm);
securityCustomRouter.delete("/night-form/:id", SecurityCustomController.deleteNightForm);

// Visitor Entry
securityCustomRouter.get("/visitor-entry", SecurityCustomController.getVisitorEntries);
securityCustomRouter.post("/visitor-entry", SecurityCustomController.createVisitorEntry);
securityCustomRouter.patch("/visitor-entry/:id/checkout", SecurityCustomController.checkOutVisitorEntry);
securityCustomRouter.delete("/visitor-entry/:id", SecurityCustomController.deleteVisitorEntry);
