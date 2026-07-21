"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const UserController_1 = require("../controllers/UserController");
const user_dto_1 = require("../../application/dto/user.dto");
const validate_request_middleware_1 = require("../../../../shared/middlewares/validate-request.middleware");
const auth_middleware_1 = require("../../../../shared/middlewares/auth.middleware");
const rbac_middleware_1 = require("../../../../shared/middlewares/rbac.middleware");
const asyncHandler_1 = require("../../../../shared/utils/asyncHandler");
const router = (0, express_1.Router)();
router.use(auth_middleware_1.authMiddleware);
router.get("/", (0, rbac_middleware_1.requirePermission)("identity.user.view"), (0, asyncHandler_1.asyncHandler)(UserController_1.UserController.list));
router.get("/:id", (0, rbac_middleware_1.requirePermission)("identity.user.view"), (0, asyncHandler_1.asyncHandler)(UserController_1.UserController.getById));
router.post("/", (0, rbac_middleware_1.requirePermission)("identity.user.create"), (0, validate_request_middleware_1.validate)(user_dto_1.createUserSchema), (0, asyncHandler_1.asyncHandler)(UserController_1.UserController.create));
router.patch("/:id", (0, rbac_middleware_1.requirePermission)("identity.user.update"), (0, validate_request_middleware_1.validate)(user_dto_1.updateUserSchema), (0, asyncHandler_1.asyncHandler)(UserController_1.UserController.update));
router.delete("/:id", (0, rbac_middleware_1.requirePermission)("identity.user.deactivate"), (0, asyncHandler_1.asyncHandler)(UserController_1.UserController.deactivate));
exports.default = router;
//# sourceMappingURL=user.routes.js.map