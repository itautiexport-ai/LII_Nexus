"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.masterDataRoutes = void 0;
const express_1 = require("express");
const multer_1 = __importDefault(require("multer"));
const MasterDataController_1 = require("../controllers/MasterDataController");
const ModuleWeightController_1 = require("../controllers/ModuleWeightController");
const MasterDataService_1 = require("../../application/services/MasterDataService");
const MySqlMasterDataRepository_1 = require("../../infrastructure/repositories/MySqlMasterDataRepository");
const auth_middleware_1 = require("../../../../shared/middlewares/auth.middleware");
const asyncHandler_1 = require("../../../../shared/utils/asyncHandler");
const router = (0, express_1.Router)();
exports.masterDataRoutes = router;
const upload = (0, multer_1.default)({ storage: multer_1.default.memoryStorage() });
const repository = new MySqlMasterDataRepository_1.MySqlMasterDataRepository();
const service = new MasterDataService_1.MasterDataService(repository);
const controller = new MasterDataController_1.MasterDataController(service);
router.use(auth_middleware_1.authMiddleware);
// Wood Types
router.get("/wood-types", (0, asyncHandler_1.asyncHandler)(controller.getWoodTypes.bind(controller)));
router.post("/wood-types", (0, asyncHandler_1.asyncHandler)(controller.createWoodType.bind(controller)));
router.put("/wood-types/:id", (0, asyncHandler_1.asyncHandler)(controller.updateWoodType.bind(controller)));
router.delete("/wood-types/:id", (0, asyncHandler_1.asyncHandler)(controller.deleteWoodType.bind(controller)));
// Priorities
router.get("/priorities", (0, asyncHandler_1.asyncHandler)(controller.getPriorities.bind(controller)));
router.post("/priorities", (0, asyncHandler_1.asyncHandler)(controller.createPriority.bind(controller)));
router.put("/priorities/:id", (0, asyncHandler_1.asyncHandler)(controller.updatePriority.bind(controller)));
router.delete("/priorities/:id", (0, asyncHandler_1.asyncHandler)(controller.deletePriority.bind(controller)));
// Buyers
router.post("/buyers/import", upload.single("file"), (0, asyncHandler_1.asyncHandler)(controller.importBuyers.bind(controller)));
router.get("/buyers", (0, asyncHandler_1.asyncHandler)(controller.getBuyers.bind(controller)));
router.post("/buyers", (0, asyncHandler_1.asyncHandler)(controller.createBuyer.bind(controller)));
router.put("/buyers/:id", (0, asyncHandler_1.asyncHandler)(controller.updateBuyer.bind(controller)));
router.delete("/buyers/:id", (0, asyncHandler_1.asyncHandler)(controller.deleteBuyer.bind(controller)));
// UOMs
router.get("/uoms", (0, asyncHandler_1.asyncHandler)(controller.getUoms.bind(controller)));
router.post("/uoms", (0, asyncHandler_1.asyncHandler)(controller.createUom.bind(controller)));
router.put("/uoms/:id", (0, asyncHandler_1.asyncHandler)(controller.updateUom.bind(controller)));
router.delete("/uoms/:id", (0, asyncHandler_1.asyncHandler)(controller.deleteUom.bind(controller)));
// Module Weights
router.get("/module-weights", (0, asyncHandler_1.asyncHandler)(ModuleWeightController_1.ModuleWeightController.getWeights));
router.put("/module-weights", (0, asyncHandler_1.asyncHandler)(ModuleWeightController_1.ModuleWeightController.updateWeights));
// HODs
router.get("/hods", (0, asyncHandler_1.asyncHandler)(controller.getHods.bind(controller)));
router.post("/hods", (0, asyncHandler_1.asyncHandler)(controller.createHod.bind(controller)));
router.put("/hods/:id", (0, asyncHandler_1.asyncHandler)(controller.updateHod.bind(controller)));
router.delete("/hods/:id", (0, asyncHandler_1.asyncHandler)(controller.deleteHod.bind(controller)));
// Merchants
router.get("/merchants", (0, asyncHandler_1.asyncHandler)(controller.getMerchants.bind(controller)));
router.post("/merchants", (0, asyncHandler_1.asyncHandler)(controller.createMerchant.bind(controller)));
router.put("/merchants/:id", (0, asyncHandler_1.asyncHandler)(controller.updateMerchant.bind(controller)));
router.delete("/merchants/:id", (0, asyncHandler_1.asyncHandler)(controller.deleteMerchant.bind(controller)));
//# sourceMappingURL=masterDataRoutes.js.map