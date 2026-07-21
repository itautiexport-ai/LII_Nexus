"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const DocumentController_1 = require("../controllers/DocumentController");
const document_dto_1 = require("../../application/dto/document.dto");
const validate_request_middleware_1 = require("../../../../shared/middlewares/validate-request.middleware");
const auth_middleware_1 = require("../../../../shared/middlewares/auth.middleware");
const rbac_middleware_1 = require("../../../../shared/middlewares/rbac.middleware");
const asyncHandler_1 = require("../../../../shared/utils/asyncHandler");
const router = (0, express_1.Router)();
router.use(auth_middleware_1.authMiddleware);
// Literal paths first, always before /documents/:id - the lesson this
// project has learned more times than any other single lesson.
router.get("/documents/folders", (0, rbac_middleware_1.requirePermission)("document.view"), (0, asyncHandler_1.asyncHandler)(DocumentController_1.DocumentController.listFolders));
router.post("/documents/folders", (0, rbac_middleware_1.requirePermission)("document.folder.manage"), (0, validate_request_middleware_1.validate)(document_dto_1.createFolderSchema), (0, asyncHandler_1.asyncHandler)(DocumentController_1.DocumentController.createFolder));
router.post("/documents/check-expiries", (0, rbac_middleware_1.requirePermission)("document.view"), (0, asyncHandler_1.asyncHandler)(DocumentController_1.DocumentController.checkExpiries));
router.get("/documents/for/:entityType/:entityId", (0, rbac_middleware_1.requirePermission)("document.view"), (0, asyncHandler_1.asyncHandler)(DocumentController_1.DocumentController.listForEntity));
router.get("/machines", (0, asyncHandler_1.asyncHandler)(DocumentController_1.DocumentController.listMachines));
router.post("/machines", (0, rbac_middleware_1.requirePermission)("machine.manage"), (0, validate_request_middleware_1.validate)(document_dto_1.createMachineSchema), (0, asyncHandler_1.asyncHandler)(DocumentController_1.DocumentController.createMachine));
router.patch("/machines/:id", (0, rbac_middleware_1.requirePermission)("machine.manage"), (0, validate_request_middleware_1.validate)(document_dto_1.updateMachineSchema), (0, asyncHandler_1.asyncHandler)(DocumentController_1.DocumentController.updateMachine));
router.get("/products", (0, asyncHandler_1.asyncHandler)(DocumentController_1.DocumentController.listProducts));
router.post("/products", (0, rbac_middleware_1.requirePermission)("product.manage"), (0, validate_request_middleware_1.validate)(document_dto_1.createProductSchema), (0, asyncHandler_1.asyncHandler)(DocumentController_1.DocumentController.createProduct));
router.patch("/products/:id", (0, rbac_middleware_1.requirePermission)("product.manage"), (0, validate_request_middleware_1.validate)(document_dto_1.updateProductSchema), (0, asyncHandler_1.asyncHandler)(DocumentController_1.DocumentController.updateProduct));
router.get("/documents", (0, rbac_middleware_1.requirePermission)("document.view"), (0, asyncHandler_1.asyncHandler)(DocumentController_1.DocumentController.list));
router.post("/documents", (0, rbac_middleware_1.requirePermission)("document.create"), (0, validate_request_middleware_1.validate)(document_dto_1.createDocumentSchema), (0, asyncHandler_1.asyncHandler)(DocumentController_1.DocumentController.create));
router.get("/documents/:id", (0, rbac_middleware_1.requirePermission)("document.view"), (0, asyncHandler_1.asyncHandler)(DocumentController_1.DocumentController.getById));
router.patch("/documents/:id", (0, rbac_middleware_1.requirePermission)("document.update"), (0, validate_request_middleware_1.validate)(document_dto_1.updateDocumentSchema), (0, asyncHandler_1.asyncHandler)(DocumentController_1.DocumentController.update));
router.delete("/documents/:id", (0, rbac_middleware_1.requirePermission)("document.delete"), (0, asyncHandler_1.asyncHandler)(DocumentController_1.DocumentController.remove));
router.post("/documents/:id/versions", (0, rbac_middleware_1.requirePermission)("document.create"), (0, validate_request_middleware_1.validate)(document_dto_1.addVersionSchema), (0, asyncHandler_1.asyncHandler)(DocumentController_1.DocumentController.addVersion));
router.patch("/documents/:id/versions/:versionId/review", (0, rbac_middleware_1.requirePermission)("document.approve"), (0, validate_request_middleware_1.validate)(document_dto_1.reviewVersionSchema), (0, asyncHandler_1.asyncHandler)(DocumentController_1.DocumentController.reviewVersion));
router.put("/documents/:id/tags", (0, rbac_middleware_1.requirePermission)("document.update"), (0, validate_request_middleware_1.validate)(document_dto_1.setTagsSchema), (0, asyncHandler_1.asyncHandler)(DocumentController_1.DocumentController.setTags));
router.post("/documents/:id/links", (0, rbac_middleware_1.requirePermission)("document.update"), (0, validate_request_middleware_1.validate)(document_dto_1.addLinkSchema), (0, asyncHandler_1.asyncHandler)(DocumentController_1.DocumentController.addLink));
router.delete("/documents/:id/links/:linkId", (0, rbac_middleware_1.requirePermission)("document.update"), (0, asyncHandler_1.asyncHandler)(DocumentController_1.DocumentController.removeLink));
exports.default = router;
//# sourceMappingURL=document.routes.js.map