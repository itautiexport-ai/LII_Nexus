"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const ProductionPlanningController_1 = require("../controllers/ProductionPlanningController");
const productionPlanning_dto_1 = require("../../application/dto/productionPlanning.dto");
const validate_request_middleware_1 = require("../../../../shared/middlewares/validate-request.middleware");
const auth_middleware_1 = require("../../../../shared/middlewares/auth.middleware");
const asyncHandler_1 = require("../../../../shared/utils/asyncHandler");
const multer_1 = __importDefault(require("multer"));
const path_1 = __importDefault(require("path"));
const storage = multer_1.default.diskStorage({
    destination: function (req, file, cb) {
        cb(null, 'uploads/');
    },
    filename: function (req, file, cb) {
        const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
        cb(null, file.fieldname + '-' + uniqueSuffix + path_1.default.extname(file.originalname));
    }
});
const upload = (0, multer_1.default)({ storage: storage });
const router = (0, express_1.Router)();
router.use(auth_middleware_1.authMiddleware);
// --- Production Planning ---
router.post("/manufacturing/production-planning", upload.single('file'), 
// Since we use FormData, we might need a custom validation or just rely on manual parsing, but validate() works on req.body if it's parsed.
// Actually, fields in multipart form data are strings, so validate might fail if totalCbm is expected to be number. 
// We'll let the controller handle it or convert types before validation.
// For now, we will keep validate. We may need to tweak the controller to cast it.
(0, validate_request_middleware_1.validate)(productionPlanning_dto_1.createProductionPlanningSchema), (0, asyncHandler_1.asyncHandler)(ProductionPlanningController_1.ProductionPlanningController.createRecord));
router.get("/manufacturing/production-planning", (0, asyncHandler_1.asyncHandler)(ProductionPlanningController_1.ProductionPlanningController.getRecords));
router.delete("/manufacturing/production-planning/:id", (0, asyncHandler_1.asyncHandler)(ProductionPlanningController_1.ProductionPlanningController.deleteRecord));
router.patch("/manufacturing/production-planning/:id/cbm-split", (0, asyncHandler_1.asyncHandler)(ProductionPlanningController_1.ProductionPlanningController.updateCbmSplit));
router.patch("/manufacturing/production-planning/:id/process-cbm", (0, asyncHandler_1.asyncHandler)(ProductionPlanningController_1.ProductionPlanningController.updateProcessCbm));
exports.default = router;
//# sourceMappingURL=manufacturing.routes.js.map