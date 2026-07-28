"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const ReportController_1 = require("../controllers/ReportController");
const ApgsController_1 = require("../controllers/ApgsController");
const report_dto_1 = require("../../application/dto/report.dto");
const validate_request_middleware_1 = require("../../../../shared/middlewares/validate-request.middleware");
const auth_middleware_1 = require("../../../../shared/middlewares/auth.middleware");
const rbac_middleware_1 = require("../../../../shared/middlewares/rbac.middleware");
const asyncHandler_1 = require("../../../../shared/utils/asyncHandler");
const OfficeEmController_1 = require("../controllers/OfficeEmController");
const ProductionEmController_1 = require("../controllers/ProductionEmController");
const router = (0, express_1.Router)();
router.use(auth_middleware_1.authMiddleware);
// Core report running/export - literal paths, always before any :param route.
router.get("/reports/office-em-list", (0, rbac_middleware_1.requirePermission)("report.view"), (0, asyncHandler_1.asyncHandler)(OfficeEmController_1.OfficeEmController.getGapScoreList));
router.get("/reports/office-em/:employeeId", (0, rbac_middleware_1.requirePermission)("report.view"), (0, asyncHandler_1.asyncHandler)(OfficeEmController_1.OfficeEmController.getGapScore));
router.get("/reports/production-em", (0, rbac_middleware_1.requirePermission)("report.view"), (0, asyncHandler_1.asyncHandler)(ProductionEmController_1.ProductionEmController.getReport));
router.get("/reports/cumulative-scores", (0, rbac_middleware_1.requirePermission)("report.view"), (0, asyncHandler_1.asyncHandler)(ApgsController_1.ApgsController.getCumulativeScores));
router.get("/reports/apgs/:employeeId", (0, rbac_middleware_1.requirePermission)("report.view"), (0, asyncHandler_1.asyncHandler)(ApgsController_1.ApgsController.getScore));
router.post("/reports/apgs/:employeeId/manager-evaluation", (0, rbac_middleware_1.requirePermission)("report.view"), (0, asyncHandler_1.asyncHandler)(ApgsController_1.ApgsController.saveManagerEvaluation));
router.post("/reports/run", (0, rbac_middleware_1.requirePermission)("report.view"), (0, validate_request_middleware_1.validate)(report_dto_1.runReportSchema), (0, asyncHandler_1.asyncHandler)(ReportController_1.ReportController.run));
router.get("/reports/export/:reportType", (0, rbac_middleware_1.requirePermission)("report.export"), (0, asyncHandler_1.asyncHandler)(ReportController_1.ReportController.export));
// Saved reports
router.get("/reports/saved", (0, asyncHandler_1.asyncHandler)(ReportController_1.ReportController.listSavedReports));
router.post("/reports/saved", (0, validate_request_middleware_1.validate)(report_dto_1.saveReportSchema), (0, asyncHandler_1.asyncHandler)(ReportController_1.ReportController.saveReport));
router.delete("/reports/saved/:id", (0, asyncHandler_1.asyncHandler)(ReportController_1.ReportController.deleteSavedReport));
// Favourites
router.get("/reports/favourites", (0, asyncHandler_1.asyncHandler)(ReportController_1.ReportController.listFavourites));
router.post("/reports/favourites", (0, validate_request_middleware_1.validate)(report_dto_1.addFavouriteSchema), (0, asyncHandler_1.asyncHandler)(ReportController_1.ReportController.addFavourite));
router.delete("/reports/favourites/:id", (0, asyncHandler_1.asyncHandler)(ReportController_1.ReportController.removeFavourite));
// Scheduled reports - literal /run-due before /:id routes
router.get("/reports/scheduled", (0, asyncHandler_1.asyncHandler)(ReportController_1.ReportController.listScheduledReports));
router.post("/reports/scheduled", (0, rbac_middleware_1.requirePermission)("report.schedule.manage"), (0, validate_request_middleware_1.validate)(report_dto_1.createScheduledReportSchema), (0, asyncHandler_1.asyncHandler)(ReportController_1.ReportController.createScheduledReport));
router.post("/reports/scheduled/run-due", (0, rbac_middleware_1.requirePermission)("report.schedule.run"), (0, asyncHandler_1.asyncHandler)(ReportController_1.ReportController.runDueScheduledReports));
router.patch("/reports/scheduled/:id/pause", (0, asyncHandler_1.asyncHandler)(ReportController_1.ReportController.pauseScheduledReport));
router.patch("/reports/scheduled/:id/resume", (0, asyncHandler_1.asyncHandler)(ReportController_1.ReportController.resumeScheduledReport));
router.delete("/reports/scheduled/:id", (0, asyncHandler_1.asyncHandler)(ReportController_1.ReportController.deleteScheduledReport));
// Dashboard widgets
router.get("/reports/widgets", (0, asyncHandler_1.asyncHandler)(ReportController_1.ReportController.listWidgets));
router.post("/reports/widgets", (0, validate_request_middleware_1.validate)(report_dto_1.addWidgetSchema), (0, asyncHandler_1.asyncHandler)(ReportController_1.ReportController.addWidget));
router.patch("/reports/widgets/reorder", (0, validate_request_middleware_1.validate)(report_dto_1.reorderWidgetsSchema), (0, asyncHandler_1.asyncHandler)(ReportController_1.ReportController.reorderWidgets));
router.delete("/reports/widgets/:id", (0, asyncHandler_1.asyncHandler)(ReportController_1.ReportController.removeWidget));
exports.default = router;
//# sourceMappingURL=report.routes.js.map