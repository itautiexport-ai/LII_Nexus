import { Router } from "express";
import multer from "multer";
import fs from "fs";
import path from "path";
import { v4 as uuid } from "uuid";
import { MasterDataController } from "../controllers/MasterDataController";
import { ModuleWeightController } from "../controllers/ModuleWeightController";
import { PptMasterDataController } from "../controllers/PptMasterDataController";
import { MasterDataService } from "../../application/services/MasterDataService";
import { PptMasterDataService } from "../../application/services/PptMasterDataService";
import { MySqlMasterDataRepository } from "../../infrastructure/repositories/MySqlMasterDataRepository";
import { authMiddleware } from "../../../../shared/middlewares/auth.middleware";
import { asyncHandler } from "../../../../shared/utils/asyncHandler";

const router = Router();
const upload = multer({ storage: multer.memoryStorage() });

const uploadsDir = path.join(__dirname, "../../../../../uploads");
if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir, { recursive: true });
}

const coverStorage = multer.diskStorage({
  destination: (_req, _file, cb) => {
    cb(null, uploadsDir);
  },
  filename: (_req, file, cb) => {
    const uniqueSuffix = uuid();
    const ext = path.extname(file.originalname);
    cb(null, `cover-${uniqueSuffix}${ext}`);
  },
});

const uploadCover = multer({
  storage: coverStorage,
  limits: { fileSize: 35 * 1024 * 1024 },
});

const repository = new MySqlMasterDataRepository();
const service = new MasterDataService(repository);
const controller = new MasterDataController(service);

const pptService = new PptMasterDataService();
const pptController = new PptMasterDataController(pptService);

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

// QC Names
router.get("/qc-names", asyncHandler(controller.getQcNames.bind(controller)));
router.post("/qc-names", asyncHandler(controller.createQcName.bind(controller)));
router.put("/qc-names/:id", asyncHandler(controller.updateQcName.bind(controller)));
router.delete("/qc-names/:id", asyncHandler(controller.deleteQcName.bind(controller)));

// Merchants
router.get("/merchants", asyncHandler(controller.getMerchants.bind(controller)));
router.post("/merchants", asyncHandler(controller.createMerchant.bind(controller)));
router.put("/merchants/:id", asyncHandler(controller.updateMerchant.bind(controller)));
router.delete("/merchants/:id", asyncHandler(controller.deleteMerchant.bind(controller)));

// Finish Codes
router.get("/finish-codes", asyncHandler(controller.getFinishCodes.bind(controller)));
router.post("/finish-codes", asyncHandler(controller.createFinishCode.bind(controller)));
router.put("/finish-codes/:id", asyncHandler(controller.updateFinishCode.bind(controller)));
router.delete("/finish-codes/:id", asyncHandler(controller.deleteFinishCode.bind(controller)));

// ==========================================
// PPT Master Themes
// ==========================================
router.get("/ppt-themes", asyncHandler(pptController.getThemes.bind(pptController)));
router.post("/ppt-themes", asyncHandler(pptController.createTheme.bind(pptController)));
router.put("/ppt-themes/:id", asyncHandler(pptController.updateTheme.bind(pptController)));
router.delete("/ppt-themes/:id", asyncHandler(pptController.deleteTheme.bind(pptController)));

// ==========================================
// PPT Master Front Pages / Cover Slide Templates
// ==========================================
router.get("/ppt-front-pages", asyncHandler(pptController.getFrontPages.bind(pptController)));
router.post("/ppt-front-pages", uploadCover.single("image"), asyncHandler(pptController.createFrontPage.bind(pptController)));
router.put("/ppt-front-pages/:id", uploadCover.single("image"), asyncHandler(pptController.updateFrontPage.bind(pptController)));
router.delete("/ppt-front-pages/:id", asyncHandler(pptController.deleteFrontPage.bind(pptController)));

export { router as masterDataRoutes };

