"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const UrlController_1 = require("../controllers/UrlController");
const auth_middleware_1 = require("../../../../shared/middlewares/auth.middleware");
const validate_request_middleware_1 = require("../../../../shared/middlewares/validate-request.middleware");
const asyncHandler_1 = require("../../../../shared/utils/asyncHandler");
const router = (0, express_1.Router)();
router.use(auth_middleware_1.authMiddleware);
router.post("/important-urls", (0, validate_request_middleware_1.validate)(UrlController_1.createUrlSchema), (0, asyncHandler_1.asyncHandler)(UrlController_1.UrlController.create));
router.get("/important-urls", (0, asyncHandler_1.asyncHandler)(UrlController_1.UrlController.list));
router.delete("/important-urls/:id", (0, asyncHandler_1.asyncHandler)(UrlController_1.UrlController.remove));
exports.default = router;
//# sourceMappingURL=url.routes.js.map