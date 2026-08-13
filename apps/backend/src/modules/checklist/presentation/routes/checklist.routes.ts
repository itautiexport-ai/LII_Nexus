import { Router } from "express";
import multer from "multer";
import { authMiddleware } from "../../../../shared/middlewares/auth.middleware";
import { StandaloneChecklistController } from "../controllers/StandaloneChecklistController";
import { StandaloneChecklistService } from "../../application/services/StandaloneChecklistService";

const router = Router();
const service = new StandaloneChecklistService();
const controller = new StandaloneChecklistController(service);

const upload = multer({ storage: multer.memoryStorage() });

router.post("/standalone-checklists", authMiddleware, controller.createChecklist);
router.get("/standalone-checklists", authMiddleware, controller.getAllChecklists);
router.get("/standalone-checklists/bulk-template", authMiddleware, controller.getBulkTemplate);
router.post("/standalone-checklists/bulk-upload", authMiddleware, upload.single("file"), controller.bulkUploadChecklists);
router.post("/standalone-checklists/bulk-delete", authMiddleware, controller.bulkDeleteChecklists);
router.post("/standalone-checklists/:id/complete", authMiddleware, controller.completeChecklist);
router.delete("/standalone-checklists/:id", authMiddleware, controller.deleteChecklist);

export default router;
