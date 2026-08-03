import { Router } from "express";
import multer from "multer";
import { MasterDataController } from "../controllers/MasterDataController";
import { ModuleWeightController } from "../controllers/ModuleWeightController";
import { MasterDataService } from "../../application/services/MasterDataService";
import { MySqlMasterDataRepository } from "../../infrastructure/repositories/MySqlMasterDataRepository";
import { authMiddleware } from "../../../../shared/middlewares/auth.middleware";
import { asyncHandler } from "../../../../shared/utils/asyncHandler";

const router = Router();
const upload = multer({ storage: multer.memoryStorage() });
const repository = new MySqlMasterDataRepository();
const service = new MasterDataService(repository);
const controller = new MasterDataController(service);

router.use(authMiddleware as any);

// Wood Types
router.get("/wood-types", asyncHandler(controller.getWoodTypes.bind(controller)));
router.post("/wood-types", asyncHandler(controller.createWoodType.bind(controller)));
router.put("/wood-types/:id", asyncHandler(controller.updateWoodType.bind(controller)));
router.delete("/wood-types/:id", asyncHandler(controller.deleteWoodType.bind(controller)));

// Priorities
router.get("/priorities", asyncHandler(controller.getPriorities.bind(controller)));
router.post("/priorities", asyncHandler(controller.createPriority.bind(controller)));
router.put("/priorities/:id", asyncHandler(controller.updatePriority.bind(controller)));
router.delete("/priorities/:id", asyncHandler(controller.deletePriority.bind(controller)));

// Buyers
router.post("/buyers/import", upload.single("file"), asyncHandler(controller.importBuyers.bind(controller)));
router.get("/buyers", asyncHandler(controller.getBuyers.bind(controller)));
router.post("/buyers", asyncHandler(controller.createBuyer.bind(controller)));
router.put("/buyers/:id", asyncHandler(controller.updateBuyer.bind(controller)));
router.delete("/buyers/:id", asyncHandler(controller.deleteBuyer.bind(controller)));

// UOMs
router.get("/uoms", asyncHandler(controller.getUoms.bind(controller)));
router.post("/uoms", asyncHandler(controller.createUom.bind(controller)));
router.put("/uoms/:id", asyncHandler(controller.updateUom.bind(controller)));
router.delete("/uoms/:id", asyncHandler(controller.deleteUom.bind(controller)));

// Module Weights
router.get("/module-weights", asyncHandler(ModuleWeightController.getWeights));
router.put("/module-weights", asyncHandler(ModuleWeightController.updateWeights));

// HODs
router.get("/hods", asyncHandler(controller.getHods.bind(controller)));
router.post("/hods", asyncHandler(controller.createHod.bind(controller)));
router.put("/hods/:id", asyncHandler(controller.updateHod.bind(controller)));
router.delete("/hods/:id", asyncHandler(controller.deleteHod.bind(controller)));

// Merchants
router.get("/merchants", asyncHandler(controller.getMerchants.bind(controller)));
router.post("/merchants", asyncHandler(controller.createMerchant.bind(controller)));
router.put("/merchants/:id", asyncHandler(controller.updateMerchant.bind(controller)));
router.delete("/merchants/:id", asyncHandler(controller.deleteMerchant.bind(controller)));

export { router as masterDataRoutes };
