import { Router } from "express";
import { authMiddleware } from "../../../../shared/middlewares/auth.middleware";
import { StandaloneChecklistController } from "../controllers/StandaloneChecklistController";
import { StandaloneChecklistService } from "../../application/services/StandaloneChecklistService";
import multer from "multer";
import path from "path";
import { v4 as uuidv4 } from "uuid";

const router = Router();
const service = new StandaloneChecklistService();
const controller = new StandaloneChecklistController(service);

// Multer Storage configuration for checklist attachments
const storage = multer.diskStorage({
  destination: (_req, _file, cb) => cb(null, "uploads/"),
  filename: (_req, file, cb) => cb(null, `checklist-${uuidv4()}${path.extname(file.originalname)}`)
});
const upload = multer({ storage, limits: { fileSize: 10 * 1024 * 1024 } });

router.post("/standalone-checklists", authMiddleware, controller.createChecklist);
router.get("/standalone-checklists/my-dashboard", authMiddleware, controller.getMyDashboard);
router.get("/standalone-checklists", authMiddleware, controller.getAllChecklists);
router.delete("/standalone-checklists/:id", authMiddleware, controller.deleteChecklist);
router.post("/standalone-checklists/:id/complete", authMiddleware, controller.completeChecklist);

router.post("/standalone-checklists/upload-attachment", authMiddleware, upload.single("file"), (req, res) => {
  if (!req.file) {
    return res.status(400).json({ success: false, message: "No file uploaded" });
  }
  const fileUrl = `/uploads/${req.file.filename}`;
  res.json({ success: true, data: { fileUrl } });
});

export default router;
