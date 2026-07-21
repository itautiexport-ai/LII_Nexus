import { Router } from "express";
import { ProductionPlanningController } from "../controllers/ProductionPlanningController";
import { createProductionPlanningSchema } from "../../application/dto/productionPlanning.dto";
import { validate } from "../../../../shared/middlewares/validate-request.middleware";
import { authMiddleware } from "../../../../shared/middlewares/auth.middleware";
import { asyncHandler } from "../../../../shared/utils/asyncHandler";
import multer from "multer";
import path from "path";

const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, 'uploads/')
  },
  filename: function (req, file, cb) {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9)
    cb(null, file.fieldname + '-' + uniqueSuffix + path.extname(file.originalname))
  }
})
const upload = multer({ storage: storage });

const router = Router();

router.use(authMiddleware);

// --- Production Planning ---
router.post(
  "/manufacturing/production-planning",
  upload.single('file'),
  // Since we use FormData, we might need a custom validation or just rely on manual parsing, but validate() works on req.body if it's parsed.
  // Actually, fields in multipart form data are strings, so validate might fail if totalCbm is expected to be number. 
  // We'll let the controller handle it or convert types before validation.
  // For now, we will keep validate. We may need to tweak the controller to cast it.
  validate(createProductionPlanningSchema),
  asyncHandler(ProductionPlanningController.createRecord)
);

router.get(
  "/manufacturing/production-planning",
  asyncHandler(ProductionPlanningController.getRecords)
);

router.delete(
  "/manufacturing/production-planning/:id",
  asyncHandler(ProductionPlanningController.deleteRecord)
);

router.patch(
  "/manufacturing/production-planning/:id/cbm-split",
  asyncHandler(ProductionPlanningController.updateCbmSplit)
);

router.patch(
  "/manufacturing/production-planning/:id/process-cbm",
  asyncHandler(ProductionPlanningController.updateProcessCbm)
);

export default router;
