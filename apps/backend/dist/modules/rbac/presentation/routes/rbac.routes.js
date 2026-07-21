"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const RoleController_1 = require("../controllers/RoleController");
const role_dto_1 = require("../../application/dto/role.dto");
const validate_request_middleware_1 = require("../../../../shared/middlewares/validate-request.middleware");
const auth_middleware_1 = require("../../../../shared/middlewares/auth.middleware");
const rbac_middleware_1 = require("../../../../shared/middlewares/rbac.middleware");
const asyncHandler_1 = require("../../../../shared/utils/asyncHandler");
const router = (0, express_1.Router)();
router.use(auth_middleware_1.authMiddleware);
// Roles
router.get("/roles", (0, rbac_middleware_1.requirePermission)("rbac.role.view"), (0, asyncHandler_1.asyncHandler)(RoleController_1.RoleController.listRoles));
router.post("/roles", (0, rbac_middleware_1.requirePermission)("rbac.role.create"), (0, validate_request_middleware_1.validate)(role_dto_1.createRoleSchema), (0, asyncHandler_1.asyncHandler)(RoleController_1.RoleController.createRole));
router.patch("/roles/:id", (0, rbac_middleware_1.requirePermission)("rbac.role.update"), (0, validate_request_middleware_1.validate)(role_dto_1.updateRoleSchema), (0, asyncHandler_1.asyncHandler)(RoleController_1.RoleController.updateRole));
router.delete("/roles/:id", (0, rbac_middleware_1.requirePermission)("rbac.role.delete"), (0, asyncHandler_1.asyncHandler)(RoleController_1.RoleController.deleteRole));
// Role <-> Permissions
router.get("/roles/:id/permissions", (0, rbac_middleware_1.requirePermission)("rbac.role.view"), (0, asyncHandler_1.asyncHandler)(RoleController_1.RoleController.getRolePermissions));
router.put("/roles/:id/permissions", (0, rbac_middleware_1.requirePermission)("rbac.role.update"), (0, validate_request_middleware_1.validate)(role_dto_1.setRolePermissionsSchema), (0, asyncHandler_1.asyncHandler)(RoleController_1.RoleController.setRolePermissions));
// Current user's effective permissions (no special permission required - self lookup)
router.get("/me/permissions", (0, asyncHandler_1.asyncHandler)(RoleController_1.RoleController.getMyPermissions));
// Permissions (read-only catalog)
router.get("/permissions", (0, rbac_middleware_1.requirePermission)("rbac.permission.view"), (0, asyncHandler_1.asyncHandler)(RoleController_1.RoleController.listPermissions));
// User <-> Roles
router.get("/users/:userId/roles", (0, rbac_middleware_1.requirePermission)("rbac.role.view"), (0, asyncHandler_1.asyncHandler)(RoleController_1.RoleController.getRolesForUser));
router.post("/users/:userId/roles", (0, rbac_middleware_1.requirePermission)("rbac.userrole.assign"), (0, validate_request_middleware_1.validate)(role_dto_1.assignRoleSchema), (0, asyncHandler_1.asyncHandler)(RoleController_1.RoleController.assignRoleToUser));
router.delete("/users/:userId/roles", (0, rbac_middleware_1.requirePermission)("rbac.userrole.assign"), (0, validate_request_middleware_1.validate)(role_dto_1.assignRoleSchema), (0, asyncHandler_1.asyncHandler)(RoleController_1.RoleController.removeRoleFromUser));
exports.default = router;
//# sourceMappingURL=rbac.routes.js.map