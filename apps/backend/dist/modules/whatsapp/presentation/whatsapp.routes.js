"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const WhatsAppController_1 = require("./controllers/WhatsAppController");
const auth_middleware_1 = require("../../../shared/middlewares/auth.middleware");
const asyncHandler_1 = require("../../../shared/utils/asyncHandler");
const router = (0, express_1.Router)();
router.use(auth_middleware_1.authMiddleware);
router.get("/whatsapp/status", (0, asyncHandler_1.asyncHandler)(WhatsAppController_1.WhatsAppController.getStatus));
router.post("/whatsapp/logout", (0, asyncHandler_1.asyncHandler)(WhatsAppController_1.WhatsAppController.logout));
exports.default = router;
//# sourceMappingURL=whatsapp.routes.js.map