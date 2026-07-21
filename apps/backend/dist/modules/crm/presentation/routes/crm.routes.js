"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const multer_1 = __importDefault(require("multer"));
const LeadController_1 = require("../controllers/LeadController");
const CrmDashboardController_1 = require("../controllers/CrmDashboardController");
const lead_dto_1 = require("../../application/dto/lead.dto");
const validate_request_middleware_1 = require("../../../../shared/middlewares/validate-request.middleware");
const auth_middleware_1 = require("../../../../shared/middlewares/auth.middleware");
const rbac_middleware_1 = require("../../../../shared/middlewares/rbac.middleware");
const asyncHandler_1 = require("../../../../shared/utils/asyncHandler");
const upload = (0, multer_1.default)({ storage: multer_1.default.memoryStorage(), limits: { fileSize: 5 * 1024 * 1024 } });
const router = (0, express_1.Router)();
router.use(auth_middleware_1.authMiddleware);
// Dashboards - all literal paths, gated behind crm.dashboard.view, registered
// before /leads/:id so nothing here can ever collide with a lead ID param.
router.get("/crm/dashboards/ceo", (0, rbac_middleware_1.requirePermission)("crm.dashboard.view"), (0, asyncHandler_1.asyncHandler)(CrmDashboardController_1.CrmDashboardController.ceo));
router.get("/crm/dashboards/merchants", (0, rbac_middleware_1.requirePermission)("crm.dashboard.view"), (0, asyncHandler_1.asyncHandler)(CrmDashboardController_1.CrmDashboardController.merchants));
router.get("/crm/dashboards/lead-source", (0, rbac_middleware_1.requirePermission)("crm.dashboard.view"), (0, asyncHandler_1.asyncHandler)(CrmDashboardController_1.CrmDashboardController.leadSource));
router.get("/crm/dashboards/export-vs-domestic", (0, rbac_middleware_1.requirePermission)("crm.dashboard.view"), (0, asyncHandler_1.asyncHandler)(CrmDashboardController_1.CrmDashboardController.exportVsDomestic));
router.get("/crm/dashboards/follow-up-delay", (0, rbac_middleware_1.requirePermission)("crm.dashboard.view"), (0, asyncHandler_1.asyncHandler)(CrmDashboardController_1.CrmDashboardController.followUpDelay));
router.get("/crm/dashboards/forecast-pipeline", (0, rbac_middleware_1.requirePermission)("crm.dashboard.view"), (0, asyncHandler_1.asyncHandler)(CrmDashboardController_1.CrmDashboardController.forecastPipeline));
router.get("/crm/dashboards/won-lost", (0, rbac_middleware_1.requirePermission)("crm.dashboard.view"), (0, asyncHandler_1.asyncHandler)(CrmDashboardController_1.CrmDashboardController.wonLostAnalysis));
// Merchant metrics - self-service first, then override path
router.get("/crm/merchant-metrics/me", (0, asyncHandler_1.asyncHandler)(CrmDashboardController_1.CrmDashboardController.myMerchantMetrics));
router.get("/crm/merchant-metrics/:merchantId", (0, rbac_middleware_1.requirePermission)("crm.dashboard.view"), (0, asyncHandler_1.asyncHandler)(CrmDashboardController_1.CrmDashboardController.merchantMetricsById));
// Import/export - literal paths before /leads/:id
router.post("/crm/leads/import", (0, rbac_middleware_1.requirePermission)("crm.lead.import"), upload.single("file"), (0, asyncHandler_1.asyncHandler)(LeadController_1.LeadController.importExcel));
router.get("/crm/leads/export", (0, rbac_middleware_1.requirePermission)("crm.lead.export"), (0, asyncHandler_1.asyncHandler)(LeadController_1.LeadController.exportExcel));
// Leads CRUD
router.get("/crm/leads", (0, asyncHandler_1.asyncHandler)(LeadController_1.LeadController.list));
router.post("/crm/leads", (0, rbac_middleware_1.requirePermission)("crm.lead.create"), (0, validate_request_middleware_1.validate)(lead_dto_1.createLeadSchema), (0, asyncHandler_1.asyncHandler)(LeadController_1.LeadController.create));
router.get("/crm/leads/:id", (0, asyncHandler_1.asyncHandler)(LeadController_1.LeadController.getById));
router.patch("/crm/leads/:id", (0, validate_request_middleware_1.validate)(lead_dto_1.updateLeadSchema), (0, asyncHandler_1.asyncHandler)(LeadController_1.LeadController.update));
router.patch("/crm/leads/:id/assign", (0, rbac_middleware_1.requirePermission)("crm.lead.assign"), (0, validate_request_middleware_1.validate)(lead_dto_1.assignLeadSchema), (0, asyncHandler_1.asyncHandler)(LeadController_1.LeadController.assign));
router.delete("/crm/leads/:id", (0, rbac_middleware_1.requirePermission)("crm.lead.delete"), (0, asyncHandler_1.asyncHandler)(LeadController_1.LeadController.remove));
router.post("/crm/leads/:id/followups", (0, validate_request_middleware_1.validate)(lead_dto_1.logFollowupSchema), (0, asyncHandler_1.asyncHandler)(LeadController_1.LeadController.logFollowup));
router.post("/crm/leads/:id/files", (0, validate_request_middleware_1.validate)(lead_dto_1.addFileSchema), (0, asyncHandler_1.asyncHandler)(LeadController_1.LeadController.addFile));
// Quotations
const QuotationController_1 = require("../controllers/QuotationController");
const QuotationService_1 = require("../../application/services/QuotationService");
const MySqlCrmRepository_1 = require("../../infrastructure/repositories/MySqlCrmRepository");
const quotation_dto_1 = require("../../application/dto/quotation.dto");
const crmRepo = new MySqlCrmRepository_1.MySqlCrmRepository();
const quotationService = new QuotationService_1.QuotationService(crmRepo);
const quotationController = new QuotationController_1.QuotationController(quotationService);
router.get("/crm/quotations", (0, asyncHandler_1.asyncHandler)(quotationController.listQuotations.bind(quotationController)));
router.post("/crm/quotations", (0, validate_request_middleware_1.validate)(quotation_dto_1.createQuotationSchema), (0, asyncHandler_1.asyncHandler)(quotationController.createQuotation.bind(quotationController)));
router.patch("/crm/quotations/:id/status", (0, asyncHandler_1.asyncHandler)(quotationController.updateStatus.bind(quotationController)));
router.get("/crm/quotations/:id/quotes", (0, asyncHandler_1.asyncHandler)(quotationController.listQuotes.bind(quotationController)));
router.post("/crm/quotations/:id/quotes", (0, validate_request_middleware_1.validate)(quotation_dto_1.createQuotationQuoteSchema), (0, asyncHandler_1.asyncHandler)(quotationController.addQuote.bind(quotationController)));
const complaint_routes_1 = __importDefault(require("./complaint.routes"));
router.use("/crm/complaints", complaint_routes_1.default);
exports.default = router;
//# sourceMappingURL=crm.routes.js.map