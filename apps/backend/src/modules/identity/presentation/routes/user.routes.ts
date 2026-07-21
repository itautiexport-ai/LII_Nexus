import { Router } from "express";
import { UserController } from "../controllers/UserController";
import { createUserSchema, updateUserSchema } from "../../application/dto/user.dto";
import { validate } from "../../../../shared/middlewares/validate-request.middleware";
import { authMiddleware } from "../../../../shared/middlewares/auth.middleware";
import { requirePermission } from "../../../../shared/middlewares/rbac.middleware";
import { asyncHandler } from "../../../../shared/utils/asyncHandler";

const router = Router();

router.use(authMiddleware);

router.get("/", requirePermission("identity.user.view"), asyncHandler(UserController.list));
router.get("/:id", requirePermission("identity.user.view"), asyncHandler(UserController.getById));
router.post("/", requirePermission("identity.user.create"), validate(createUserSchema), asyncHandler(UserController.create));
router.patch("/:id", requirePermission("identity.user.update"), validate(updateUserSchema), asyncHandler(UserController.update));
router.delete("/:id", requirePermission("identity.user.deactivate"), asyncHandler(UserController.deactivate));

export default router;
