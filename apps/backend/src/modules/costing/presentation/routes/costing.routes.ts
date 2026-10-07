import { Router } from "express";
import { CostingController } from "../controllers/CostingController";
import { authMiddleware } from "../../../../shared/middlewares/auth.middleware";
import { asyncHandler } from "../../../../shared/utils/asyncHandler";

const router = Router();
const controller = new CostingController();

router.use(authMiddleware);

router.get("/summary", asyncHandler(controller.getSummary));
router.get("/estimations", asyncHandler(controller.getAllEstimations));
router.get("/estimations/:id", asyncHandler(controller.getEstimationById));
router.post("/estimations", asyncHandler(controller.createEstimation));
router.put("/estimations/:id", asyncHandler(controller.updateEstimation));
router.delete("/estimations/:id", asyncHandler(controller.deleteEstimation));

router.get("/rates", asyncHandler(controller.getAllRates));
router.post("/rates", asyncHandler(controller.saveRate));
router.delete("/rates/:id", asyncHandler(controller.deleteRate));

export default router;
