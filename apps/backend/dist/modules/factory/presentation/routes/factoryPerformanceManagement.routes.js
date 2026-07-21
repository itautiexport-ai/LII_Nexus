"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const ContractorController_1 = require("../controllers/ContractorController");
const FactoryProductionEntryController_1 = require("../controllers/FactoryProductionEntryController");
const contractor_dto_1 = require("../../application/dto/contractor.dto");
const factoryProductionEntry_dto_1 = require("../../application/dto/factoryProductionEntry.dto");
const validate_request_middleware_1 = require("../../../../shared/middlewares/validate-request.middleware");
const auth_middleware_1 = require("../../../../shared/middlewares/auth.middleware");
const rbac_middleware_1 = require("../../../../shared/middlewares/rbac.middleware");
const asyncHandler_1 = require("../../../../shared/utils/asyncHandler");
const router = (0, express_1.Router)();
router.use(auth_middleware_1.authMiddleware);
// Contractor / Team Master
router.get("/contractors", (0, rbac_middleware_1.requirePermission)("contractor.view"), (0, asyncHandler_1.asyncHandler)(ContractorController_1.ContractorController.list));
router.post("/contractors", (0, rbac_middleware_1.requirePermission)("contractor.create"), (0, validate_request_middleware_1.validate)(contractor_dto_1.createContractorSchema), (0, asyncHandler_1.asyncHandler)(ContractorController_1.ContractorController.create));
router.patch("/contractors/:id", (0, rbac_middleware_1.requirePermission)("contractor.update"), (0, validate_request_middleware_1.validate)(contractor_dto_1.updateContractorSchema), (0, asyncHandler_1.asyncHandler)(ContractorController_1.ContractorController.update));
router.delete("/contractors/:id", (0, rbac_middleware_1.requirePermission)("contractor.delete"), (0, asyncHandler_1.asyncHandler)(ContractorController_1.ContractorController.remove));
// Factory Production Entries - literal /reject, /approve, /files routes
// registered before the generic /:id route, deliberately, per this
// project's prior route-ordering bug.
router.get("/factory-entries", (0, rbac_middleware_1.requirePermission)("factoryentry.view"), (0, asyncHandler_1.asyncHandler)(FactoryProductionEntryController_1.FactoryProductionEntryController.list));
router.post("/factory-entries", (0, rbac_middleware_1.requirePermission)("factoryentry.create"), (0, validate_request_middleware_1.validate)(factoryProductionEntry_dto_1.createEntrySchema), (0, asyncHandler_1.asyncHandler)(FactoryProductionEntryController_1.FactoryProductionEntryController.create));
router.get("/factory-entries/:id", (0, rbac_middleware_1.requirePermission)("factoryentry.view"), (0, asyncHandler_1.asyncHandler)(FactoryProductionEntryController_1.FactoryProductionEntryController.getById));
router.patch("/factory-entries/:id", (0, validate_request_middleware_1.validate)(factoryProductionEntry_dto_1.updateEntrySchema), (0, asyncHandler_1.asyncHandler)(FactoryProductionEntryController_1.FactoryProductionEntryController.update));
router.patch("/factory-entries/:id/approve", (0, rbac_middleware_1.requirePermission)("factoryentry.approve"), (0, asyncHandler_1.asyncHandler)(FactoryProductionEntryController_1.FactoryProductionEntryController.approve));
router.patch("/factory-entries/:id/reject", (0, rbac_middleware_1.requirePermission)("factoryentry.approve"), (0, validate_request_middleware_1.validate)(factoryProductionEntry_dto_1.rejectEntrySchema), (0, asyncHandler_1.asyncHandler)(FactoryProductionEntryController_1.FactoryProductionEntryController.reject));
router.delete("/factory-entries/:id", (0, rbac_middleware_1.requirePermission)("factoryentry.delete"), (0, asyncHandler_1.asyncHandler)(FactoryProductionEntryController_1.FactoryProductionEntryController.remove));
router.post("/factory-entries/:id/files", (0, validate_request_middleware_1.validate)(factoryProductionEntry_dto_1.addFileSchema), (0, asyncHandler_1.asyncHandler)(FactoryProductionEntryController_1.FactoryProductionEntryController.addFile));
exports.default = router;
//# sourceMappingURL=factoryPerformanceManagement.routes.js.map