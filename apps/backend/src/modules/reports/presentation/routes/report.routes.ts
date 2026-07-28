import { Router } from "express";
import { ReportController } from "../controllers/ReportController";
import { ApgsController } from "../controllers/ApgsController";
import { runReportSchema, saveReportSchema, addFavouriteSchema, createScheduledReportSchema, addWidgetSchema, reorderWidgetsSchema } from "../../application/dto/report.dto";
import { validate } from "../../../../shared/middlewares/validate-request.middleware";
import { authMiddleware } from "../../../../shared/middlewares/auth.middleware";
import { requirePermission } from "../../../../shared/middlewares/rbac.middleware";
import { asyncHandler } from "../../../../shared/utils/asyncHandler";

import { OfficeEmController } from "../controllers/OfficeEmController";
import { ProductionEmController } from "../controllers/ProductionEmController";

const router = Router();
router.use(authMiddleware);

// Core report running/export - literal paths, always before any :param route.
router.get("/reports/office-em-list", requirePermission("report.view"), asyncHandler(OfficeEmController.getGapScoreList));
router.get("/reports/office-em/:employeeId", requirePermission("report.view"), asyncHandler(OfficeEmController.getGapScore));
router.get("/reports/production-em", requirePermission("report.view"), asyncHandler(ProductionEmController.getReport));
router.get("/reports/cumulative-scores", requirePermission("report.view"), asyncHandler(ApgsController.getCumulativeScores));
router.get("/reports/apgs/:employeeId", requirePermission("report.view"), asyncHandler(ApgsController.getScore));
router.post("/reports/apgs/:employeeId/manager-evaluation", requirePermission("report.view"), asyncHandler(ApgsController.saveManagerEvaluation));
router.post("/reports/run", requirePermission("report.view"), validate(runReportSchema), asyncHandler(ReportController.run));
router.get("/reports/export/:reportType", requirePermission("report.export"), asyncHandler(ReportController.export));

// Saved reports
router.get("/reports/saved", asyncHandler(ReportController.listSavedReports));
router.post("/reports/saved", validate(saveReportSchema), asyncHandler(ReportController.saveReport));
router.delete("/reports/saved/:id", asyncHandler(ReportController.deleteSavedReport));

// Favourites
router.get("/reports/favourites", asyncHandler(ReportController.listFavourites));
router.post("/reports/favourites", validate(addFavouriteSchema), asyncHandler(ReportController.addFavourite));
router.delete("/reports/favourites/:id", asyncHandler(ReportController.removeFavourite));

// Scheduled reports - literal /run-due before /:id routes
router.get("/reports/scheduled", asyncHandler(ReportController.listScheduledReports));
router.post("/reports/scheduled", requirePermission("report.schedule.manage"), validate(createScheduledReportSchema), asyncHandler(ReportController.createScheduledReport));
router.post("/reports/scheduled/run-due", requirePermission("report.schedule.run"), asyncHandler(ReportController.runDueScheduledReports));
router.patch("/reports/scheduled/:id/pause", asyncHandler(ReportController.pauseScheduledReport));
router.patch("/reports/scheduled/:id/resume", asyncHandler(ReportController.resumeScheduledReport));
router.delete("/reports/scheduled/:id", asyncHandler(ReportController.deleteScheduledReport));

// Dashboard widgets
router.get("/reports/widgets", asyncHandler(ReportController.listWidgets));
router.post("/reports/widgets", validate(addWidgetSchema), asyncHandler(ReportController.addWidget));
router.patch("/reports/widgets/reorder", validate(reorderWidgetsSchema), asyncHandler(ReportController.reorderWidgets));
router.delete("/reports/widgets/:id", asyncHandler(ReportController.removeWidget));

export default router;
