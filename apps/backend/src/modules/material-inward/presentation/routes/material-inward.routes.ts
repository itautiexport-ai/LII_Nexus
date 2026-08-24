import { Router } from "express";
import multer from "multer";
import path from "path";
import { v4 as uuid } from "uuid";
import { MaterialInwardController, createMaterialInwardSchema, updateMaterialInwardSchema } from "../controllers/MaterialInwardController";
import { authMiddleware } from "../../../../shared/middlewares/auth.middleware";
import { requirePermission } from "../../../../shared/middlewares/rbac.middleware";
import { validate } from "../../../../shared/middlewares/validate-request.middleware";
import { asyncHandler } from "../../../../shared/utils/asyncHandler";

const storage = multer.diskStorage({
  destination: (_req, _file, cb) => {
    cb(null, "uploads/");
  },
  filename: (_req, file, cb) => {
    const uniqueSuffix = uuid();
    const ext = path.extname(file.originalname);
    cb(null, `material-${uniqueSuffix}${ext}`);
  },
});

const upload = multer({
  storage,
  limits: { fileSize: 10 * 1024 * 1024 } // 10MB limit
});

const router = Router();

router.use(authMiddleware);

router.post(
  "/material-inwards/upload-photo",
  requirePermission("material_inward.create"),
  upload.single("photo"),
  async (req: any, res: any) => {
    if (!req.file) {
      return res.status(400).json({ success: false, message: "No file uploaded." });
    }
    const fileUrl = `${req.protocol}://${req.get("host")}/uploads/${req.file.filename}`;
    return res.json({ success: true, data: { fileUrl } });
  }
);

router.post(
  "/material-inwards",
  requirePermission("material_inward.create"),
  validate(createMaterialInwardSchema),
  asyncHandler(MaterialInwardController.create)
);

router.get(
  "/material-inwards",
  requirePermission("material_inward.view"),
  asyncHandler(MaterialInwardController.list)
);

router.get(
  "/material-inwards/:id",
  requirePermission("material_inward.view"),
  asyncHandler(MaterialInwardController.getById)
);

router.put(
  "/material-inwards/:id",
  requirePermission("material_inward.update"),
  validate(updateMaterialInwardSchema),
  asyncHandler(MaterialInwardController.update)
);

router.delete(
  "/material-inwards/:id",
  requirePermission("material_inward.delete"),
  asyncHandler(MaterialInwardController.remove)
);

export default router;
