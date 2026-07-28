import { Router } from "express";
import { UserController } from "../controllers/UserController";
import { createUserSchema, updateUserSchema } from "../../application/dto/user.dto";
import { validate } from "../../../../shared/middlewares/validate-request.middleware";
import { authMiddleware } from "../../../../shared/middlewares/auth.middleware";
import { requirePermission } from "../../../../shared/middlewares/rbac.middleware";
import { asyncHandler } from "../../../../shared/utils/asyncHandler";
import multer from "multer";
import path from "path";
import fs from "fs";
import { pool } from "../../../../infrastructure/database/mysql/connection";

const router = Router();
router.use(authMiddleware);

// Multer setup for avatar uploads
const avatarStorage = multer.diskStorage({
  destination: (_req, _file, cb) => {
    const dir = path.join(__dirname, "../../../../../uploads/avatars");
    if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
    cb(null, dir);
  },
  filename: (_req, file, cb) => {
    const ext = path.extname(file.originalname);
    cb(null, `${Date.now()}-${Math.random().toString(36).slice(2)}${ext}`);
  },
});
const uploadAvatar = multer({ storage: avatarStorage, limits: { fileSize: 5 * 1024 * 1024 } });

router.get("/", requirePermission("identity.user.view"), asyncHandler(UserController.list));
router.get("/:id", requirePermission("identity.user.view"), asyncHandler(UserController.getById));
router.post("/", requirePermission("identity.user.create"), validate(createUserSchema), asyncHandler(UserController.create));
router.patch("/:id", requirePermission("identity.user.update"), validate(updateUserSchema), asyncHandler(UserController.update));
router.delete("/:id", requirePermission("identity.user.deactivate"), asyncHandler(UserController.deactivate));

// Avatar upload – any authenticated user can upload (or admin for others)
router.post("/:id/avatar", uploadAvatar.single("avatar"), asyncHandler(async (req: any, res) => {
  if (!req.file) {
    res.status(400).json({ error: "No file uploaded" });
    return;
  }
  const avatarUrl = `/uploads/avatars/${req.file.filename}`;
  await pool.query("UPDATE users SET avatar_url = ? WHERE id = ?", [avatarUrl, req.params.id]);
  res.json({ data: { avatarUrl } });
}));

export default router;

