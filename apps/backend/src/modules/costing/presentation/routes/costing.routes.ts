import { Router } from "express";
import { CostingController } from "../controllers/CostingController";
import { authMiddleware } from "../../../../shared/middlewares/auth.middleware";
import { asyncHandler } from "../../../../shared/utils/asyncHandler";
import costingImageRoutes from "./costingImage.routes";

const router = Router();
const controller = new CostingController();

router.use(authMiddleware);
router.use(costingImageRoutes);
router.get('/approval-authorities', asyncHandler(controller.getApprovalAuthorities));

router.get("/summary", asyncHandler(controller.getSummary));
router.get("/estimations", asyncHandler(controller.getAllEstimations));
router.get("/estimations/:id", asyncHandler(controller.getEstimationById));
router.post("/estimations", asyncHandler(controller.createEstimation));
router.put("/estimations/:id", asyncHandler(controller.updateEstimation));
router.delete("/estimations/:id", asyncHandler(controller.deleteEstimation));

router.get("/rates", asyncHandler(controller.getAllRates));
router.post("/rates", asyncHandler(controller.saveRate));
router.delete("/rates/:id", asyncHandler(controller.deleteRate));
router.post("/calculate-cft", asyncHandler(controller.calculateCft));

// Costing Dashboard Metrics
router.get("/dashboard-metrics", asyncHandler(controller.getDashboardMetrics));

// Costing Requests (Bunches & Items)
router.get("/requests/next-codes", asyncHandler(controller.getNextCodes));
router.post("/requests/bunch", asyncHandler(controller.createRequestBunch));
router.get("/requests/bunches", asyncHandler(controller.listBunches));
router.get("/requests/bunches/:id", asyncHandler(controller.getBunchById));
router.get("/requests/items", asyncHandler(controller.listRequestItems));
router.get("/requests/items/:id", asyncHandler(controller.getRequestItemById));
router.patch("/requests/items/:id/stage", asyncHandler(controller.updateRequestItemStage));

// Costing Tracker
router.get("/tracker", asyncHandler(controller.getTrackerData));

export default router;
