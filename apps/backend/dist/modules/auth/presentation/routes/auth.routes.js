"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const AuthController_1 = require("../controllers/AuthController");
const validate_request_middleware_1 = require("../../../../shared/middlewares/validate-request.middleware");
const auth_middleware_1 = require("../../../../shared/middlewares/auth.middleware");
const asyncHandler_1 = require("../../../../shared/utils/asyncHandler");
const router = (0, express_1.Router)();
router.post("/login", (0, validate_request_middleware_1.validate)(AuthController_1.loginSchema), (0, asyncHandler_1.asyncHandler)(AuthController_1.AuthController.login));
router.post("/refresh", (0, asyncHandler_1.asyncHandler)(AuthController_1.AuthController.refresh));
router.get("/me", auth_middleware_1.authMiddleware, (0, asyncHandler_1.asyncHandler)(AuthController_1.AuthController.me));
router.post("/logout", (0, asyncHandler_1.asyncHandler)(AuthController_1.AuthController.logout));
exports.default = router;
//# sourceMappingURL=auth.routes.js.map