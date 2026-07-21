import { Router } from "express";
import multer from "multer";
import { LeadController } from "../controllers/LeadController";
import { CrmDashboardController } from "../controllers/CrmDashboardController";
import { createLeadSchema, updateLeadSchema, assignLeadSchema, logFollowupSchema, addFileSchema } from "../../application/dto/lead.dto";
import { validate } from "../../../../shared/middlewares/validate-request.middleware";
import { authMiddleware } from "../../../../shared/middlewares/auth.middleware";
import { requirePermission } from "../../../../shared/middlewares/rbac.middleware";
import { asyncHandler } from "../../../../shared/utils/asyncHandler";
import { ComplaintController } from "../controllers/ComplaintController";

const upload = multer({ storage: multer.memoryStorage(), limits: { fileSize: 5 * 1024 * 1024 } });

const router = Router();
router.use(authMiddleware);

// Dashboards - all literal paths, gated behind crm.dashboard.view, registered
// before /leads/:id so nothing here can ever collide with a lead ID param.
router.get("/crm/dashboards/ceo", requirePermission("crm.dashboard.view"), asyncHandler(CrmDashboardController.ceo));
router.get("/crm/dashboards/merchants", requirePermission("crm.dashboard.view"), asyncHandler(CrmDashboardController.merchants));
router.get("/crm/dashboards/lead-source", requirePermission("crm.dashboard.view"), asyncHandler(CrmDashboardController.leadSource));
router.get("/crm/dashboards/export-vs-domestic", requirePermission("crm.dashboard.view"), asyncHandler(CrmDashboardController.exportVsDomestic));
router.get("/crm/dashboards/follow-up-delay", requirePermission("crm.dashboard.view"), asyncHandler(CrmDashboardController.followUpDelay));
router.get("/crm/dashboards/forecast-pipeline", requirePermission("crm.dashboard.view"), asyncHandler(CrmDashboardController.forecastPipeline));
router.get("/crm/dashboards/won-lost", requirePermission("crm.dashboard.view"), asyncHandler(CrmDashboardController.wonLostAnalysis));

// Merchant metrics - self-service first, then override path
router.get("/crm/merchant-metrics/me", asyncHandler(CrmDashboardController.myMerchantMetrics));
router.get("/crm/merchant-metrics/:merchantId", requirePermission("crm.dashboard.view"), asyncHandler(CrmDashboardController.merchantMetricsById));

// Import/export - literal paths before /leads/:id
router.post("/crm/leads/import", requirePermission("crm.lead.import"), upload.single("file"), asyncHandler(LeadController.importExcel));
router.get("/crm/leads/export", requirePermission("crm.lead.export"), asyncHandler(LeadController.exportExcel));

// Leads CRUD
router.get("/crm/leads", asyncHandler(LeadController.list));
router.post("/crm/leads", requirePermission("crm.lead.create"), validate(createLeadSchema), asyncHandler(LeadController.create));
router.get("/crm/leads/:id", asyncHandler(LeadController.getById));
router.patch("/crm/leads/:id", validate(updateLeadSchema), asyncHandler(LeadController.update));
router.patch("/crm/leads/:id/assign", requirePermission("crm.lead.assign"), validate(assignLeadSchema), asyncHandler(LeadController.assign));
router.delete("/crm/leads/:id", requirePermission("crm.lead.delete"), asyncHandler(LeadController.remove));
router.post("/crm/leads/:id/followups", validate(logFollowupSchema), asyncHandler(LeadController.logFollowup));
router.post("/crm/leads/:id/files", validate(addFileSchema), asyncHandler(LeadController.addFile));

// Quotations
import { QuotationController } from "../controllers/QuotationController";
import { QuotationService } from "../../application/services/QuotationService";
import { MySqlCrmRepository } from "../../infrastructure/repositories/MySqlCrmRepository";
import { createQuotationSchema, createQuotationQuoteSchema } from "../../application/dto/quotation.dto";

const crmRepo = new MySqlCrmRepository();
const quotationService = new QuotationService(crmRepo);
const quotationController = new QuotationController(quotationService);

router.get("/crm/quotations", asyncHandler(quotationController.listQuotations.bind(quotationController)));
router.post("/crm/quotations", validate(createQuotationSchema), asyncHandler(quotationController.createQuotation.bind(quotationController)));
router.patch("/crm/quotations/:id/status", asyncHandler(quotationController.updateStatus.bind(quotationController)));
router.get("/crm/quotations/:id/quotes", asyncHandler(quotationController.listQuotes.bind(quotationController)));
router.post("/crm/quotations/:id/quotes", validate(createQuotationQuoteSchema), asyncHandler(quotationController.addQuote.bind(quotationController)));

import complaintRoutes from "./complaint.routes";
router.use("/crm/complaints", complaintRoutes);

export default router;
