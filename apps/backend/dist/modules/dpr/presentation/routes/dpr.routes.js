"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const DprEntryController_1 = require("../controllers/DprEntryController");
const dprEntry_dto_1 = require("../../application/dto/dprEntry.dto");
const validate_request_middleware_1 = require("../../../../shared/middlewares/validate-request.middleware");
const auth_middleware_1 = require("../../../../shared/middlewares/auth.middleware");
const rbac_middleware_1 = require("../../../../shared/middlewares/rbac.middleware");
const asyncHandler_1 = require("../../../../shared/utils/asyncHandler");
const router = (0, express_1.Router)();
router.use(auth_middleware_1.authMiddleware);
router.get("/dpr-entries", (0, rbac_middleware_1.requirePermission)("dpr.view"), (0, asyncHandler_1.asyncHandler)(DprEntryController_1.DprEntryController.list));
router.post("/dpr-entries", (0, rbac_middleware_1.requirePermission)("dpr.create"), (0, validate_request_middleware_1.validate)(dprEntry_dto_1.createDprEntrySchema), (0, asyncHandler_1.asyncHandler)(DprEntryController_1.DprEntryController.create));
router.get("/dpr-entries/:id", (0, rbac_middleware_1.requirePermission)("dpr.view"), (0, asyncHandler_1.asyncHandler)(DprEntryController_1.DprEntryController.getById));
router.patch("/dpr-entries/:id", (0, rbac_middleware_1.requirePermission)("dpr.update"), (0, validate_request_middleware_1.validate)(dprEntry_dto_1.updateDprEntrySchema), (0, asyncHandler_1.asyncHandler)(DprEntryController_1.DprEntryController.update));
router.delete("/dpr-entries/:id", (0, rbac_middleware_1.requirePermission)("dpr.delete"), (0, asyncHandler_1.asyncHandler)(DprEntryController_1.DprEntryController.remove));
exports.default = router;
//# sourceMappingURL=dpr.routes.js.map