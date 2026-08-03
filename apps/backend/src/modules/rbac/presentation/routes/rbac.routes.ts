import { Router } from "express";
import { RoleController } from "../controllers/RoleController";
import { createRoleSchema, updateRoleSchema, setRolePermissionsSchema, assignRoleSchema } from "../../application/dto/role.dto";
import { validate } from "../../../../shared/middlewares/validate-request.middleware";
import { authMiddleware } from "../../../../shared/middlewares/auth.middleware";
import { requirePermission } from "../../../../shared/middlewares/rbac.middleware";
import { asyncHandler } from "../../../../shared/utils/asyncHandler";

const router = Router();
router.use(authMiddleware);

// Roles
router.get("/roles", requirePermission("rbac.role.view"), asyncHandler(RoleController.listRoles));
router.post("/roles", requirePermission("rbac.role.create"), validate(createRoleSchema), asyncHandler(RoleController.createRole));
router.patch("/roles/:id", requirePermission("rbac.role.update"), validate(updateRoleSchema), asyncHandler(RoleController.updateRole));
router.delete("/roles/:id", requirePermission("rbac.role.delete"), asyncHandler(RoleController.deleteRole));

// Role <-> Permissions
router.get("/roles/:id/permissions", requirePermission("rbac.role.view"), asyncHandler(RoleController.getRolePermissions));
router.put(
  "/roles/:id/permissions",
  requirePermission("rbac.role.update"),
  validate(setRolePermissionsSchema),
  asyncHandler(RoleController.setRolePermissions)
);

// Current user's effective permissions (no special permission required - self lookup)
router.get("/me/permissions", asyncHandler(RoleController.getMyPermissions));

// Permissions (read-only catalog)
router.get("/permissions", requirePermission("rbac.permission.view"), asyncHandler(RoleController.listPermissions));

// User <-> Roles
router.get("/users/:userId/roles", requirePermission("rbac.role.view"), asyncHandler(RoleController.getRolesForUser));
router.post(
  "/users/:userId/roles",
  requirePermission("rbac.userrole.assign"),
  validate(assignRoleSchema),
  asyncHandler(RoleController.assignRoleToUser)
);
router.delete(
  "/users/:userId/roles",
  requirePermission("rbac.userrole.assign"),
  validate(assignRoleSchema),
  asyncHandler(RoleController.removeRoleFromUser)
);

export default router;
