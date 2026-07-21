import { Router } from "express";
import { DocumentController } from "../controllers/DocumentController";
import {
  createDocumentSchema, updateDocumentSchema, addVersionSchema, reviewVersionSchema,
  setTagsSchema, addLinkSchema, createFolderSchema, createMachineSchema, createProductSchema, updateMachineSchema, updateProductSchema
} from "../../application/dto/document.dto";
import { validate } from "../../../../shared/middlewares/validate-request.middleware";
import { authMiddleware } from "../../../../shared/middlewares/auth.middleware";
import { requirePermission } from "../../../../shared/middlewares/rbac.middleware";
import { asyncHandler } from "../../../../shared/utils/asyncHandler";

const router = Router();
router.use(authMiddleware);

// Literal paths first, always before /documents/:id - the lesson this
// project has learned more times than any other single lesson.
router.get("/documents/folders", requirePermission("document.view"), asyncHandler(DocumentController.listFolders));
router.post("/documents/folders", requirePermission("document.folder.manage"), validate(createFolderSchema), asyncHandler(DocumentController.createFolder));
router.post("/documents/check-expiries", requirePermission("document.view"), asyncHandler(DocumentController.checkExpiries));
router.get("/documents/for/:entityType/:entityId", requirePermission("document.view"), asyncHandler(DocumentController.listForEntity));

router.get("/machines", asyncHandler(DocumentController.listMachines));
router.post("/machines", requirePermission("machine.manage"), validate(createMachineSchema), asyncHandler(DocumentController.createMachine));
router.patch("/machines/:id", requirePermission("machine.manage"), validate(updateMachineSchema), asyncHandler(DocumentController.updateMachine));
router.get("/products", asyncHandler(DocumentController.listProducts));
router.post("/products", requirePermission("product.manage"), validate(createProductSchema), asyncHandler(DocumentController.createProduct));
router.patch("/products/:id", requirePermission("product.manage"), validate(updateProductSchema), asyncHandler(DocumentController.updateProduct));

router.get("/documents", requirePermission("document.view"), asyncHandler(DocumentController.list));
router.post("/documents", requirePermission("document.create"), validate(createDocumentSchema), asyncHandler(DocumentController.create));
router.get("/documents/:id", requirePermission("document.view"), asyncHandler(DocumentController.getById));
router.patch("/documents/:id", requirePermission("document.update"), validate(updateDocumentSchema), asyncHandler(DocumentController.update));
router.delete("/documents/:id", requirePermission("document.delete"), asyncHandler(DocumentController.remove));

router.post("/documents/:id/versions", requirePermission("document.create"), validate(addVersionSchema), asyncHandler(DocumentController.addVersion));
router.patch("/documents/:id/versions/:versionId/review", requirePermission("document.approve"), validate(reviewVersionSchema), asyncHandler(DocumentController.reviewVersion));

router.put("/documents/:id/tags", requirePermission("document.update"), validate(setTagsSchema), asyncHandler(DocumentController.setTags));
router.post("/documents/:id/links", requirePermission("document.update"), validate(addLinkSchema), asyncHandler(DocumentController.addLink));
router.delete("/documents/:id/links/:linkId", requirePermission("document.update"), asyncHandler(DocumentController.removeLink));

export default router;
