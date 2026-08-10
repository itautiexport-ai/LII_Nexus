import { Router } from "express";
import { ExportController } from "../controllers/ExportController";
import { ExportService } from "../../application/services/ExportService";
import { authMiddleware } from "../../../../shared/middlewares/auth.middleware";
import { requirePermission } from "../../../../shared/middlewares/rbac.middleware";
import { asyncHandler } from "../../../../shared/utils/asyncHandler";

const router = Router();
const exportService = new ExportService();
const exportController = new ExportController(exportService);

router.use(authMiddleware);

router.get("/export", requirePermission("data_export.download"), asyncHandler(exportController.downloadExport));

export default router;
