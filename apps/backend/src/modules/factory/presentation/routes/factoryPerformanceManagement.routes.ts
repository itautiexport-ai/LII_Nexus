import { Router } from "express";
import { ContractorController } from "../controllers/ContractorController";
import { FactoryProductionEntryController } from "../controllers/FactoryProductionEntryController";
import { createContractorSchema, updateContractorSchema } from "../../application/dto/contractor.dto";
import { createEntrySchema, updateEntrySchema, rejectEntrySchema, addFileSchema } from "../../application/dto/factoryProductionEntry.dto";
import { validate } from "../../../../shared/middlewares/validate-request.middleware";
import { authMiddleware } from "../../../../shared/middlewares/auth.middleware";
import { requirePermission } from "../../../../shared/middlewares/rbac.middleware";
import { asyncHandler } from "../../../../shared/utils/asyncHandler";

const router = Router();
router.use(authMiddleware);

// Contractor / Team Master
router.get("/contractors", requirePermission("contractor.view"), asyncHandler(ContractorController.list));
router.post("/contractors", requirePermission("contractor.create"), validate(createContractorSchema), asyncHandler(ContractorController.create));
router.patch("/contractors/:id", requirePermission("contractor.update"), validate(updateContractorSchema), asyncHandler(ContractorController.update));
router.delete("/contractors/:id", requirePermission("contractor.delete"), asyncHandler(ContractorController.remove));

// Factory Production Entries - literal /reject, /approve, /files routes
// registered before the generic /:id route, deliberately, per this
// project's prior route-ordering bug.
router.get("/factory-entries", requirePermission("factoryentry.view"), asyncHandler(FactoryProductionEntryController.list));
router.post("/factory-entries", requirePermission("factoryentry.create"), validate(createEntrySchema), asyncHandler(FactoryProductionEntryController.create));
router.get("/factory-entries/:id", requirePermission("factoryentry.view"), asyncHandler(FactoryProductionEntryController.getById));
router.patch("/factory-entries/:id", validate(updateEntrySchema), asyncHandler(FactoryProductionEntryController.update));
router.patch("/factory-entries/:id/approve", requirePermission("factoryentry.approve"), asyncHandler(FactoryProductionEntryController.approve));
router.patch("/factory-entries/:id/reject", requirePermission("factoryentry.approve"), validate(rejectEntrySchema), asyncHandler(FactoryProductionEntryController.reject));
router.delete("/factory-entries/:id", requirePermission("factoryentry.delete"), asyncHandler(FactoryProductionEntryController.remove));
router.post("/factory-entries/:id/files", validate(addFileSchema), asyncHandler(FactoryProductionEntryController.addFile));

export default router;
