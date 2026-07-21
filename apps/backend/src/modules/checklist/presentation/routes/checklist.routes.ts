import { Router } from "express";
import { authMiddleware } from "../../../../shared/middlewares/auth.middleware";
import { StandaloneChecklistController } from "../controllers/StandaloneChecklistController";
import { StandaloneChecklistService } from "../../application/services/StandaloneChecklistService";

const router = Router();
const service = new StandaloneChecklistService();
const controller = new StandaloneChecklistController(service);

router.post("/standalone-checklists", authMiddleware, controller.createChecklist);
router.get("/standalone-checklists", authMiddleware, controller.getAllChecklists);
router.delete("/standalone-checklists/:id", authMiddleware, controller.deleteChecklist);

export default router;
