import { Router } from "express";
import { DprEntryController } from "../controllers/DprEntryController";
import { createDprEntrySchema, updateDprEntrySchema } from "../../application/dto/dprEntry.dto";
import { validate } from "../../../../shared/middlewares/validate-request.middleware";
import { authMiddleware } from "../../../../shared/middlewares/auth.middleware";
import { requirePermission } from "../../../../shared/middlewares/rbac.middleware";
import { asyncHandler } from "../../../../shared/utils/asyncHandler";

const router = Router();
router.use(authMiddleware);

router.get("/dpr-entries", requirePermission("dpr.view"), asyncHandler(DprEntryController.list));
router.post("/dpr-entries", requirePermission("dpr.create"), validate(createDprEntrySchema), asyncHandler(DprEntryController.create));
router.get("/dpr-entries/:id", requirePermission("dpr.view"), asyncHandler(DprEntryController.getById));
router.patch("/dpr-entries/:id", requirePermission("dpr.update"), validate(updateDprEntrySchema), asyncHandler(DprEntryController.update));
router.delete("/dpr-entries/:id", requirePermission("dpr.delete"), asyncHandler(DprEntryController.remove));

export default router;
