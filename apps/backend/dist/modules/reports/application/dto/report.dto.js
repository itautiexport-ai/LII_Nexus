"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.reorderWidgetsSchema = exports.addWidgetSchema = exports.createScheduledReportSchema = exports.addFavouriteSchema = exports.saveReportSchema = exports.runReportSchema = exports.filtersSchema = void 0;
const zod_1 = require("zod");
const REPORT_TYPES = [
    "employee_performance", "department_performance", "office_performance", "factory_performance",
    "workflow_reports", "checklist_reports", "delegation_reports", "crm_reports", "sales_pipeline",
    "merchant_performance", "production_reports", "executive_reports", "daily_production_report",
    "dpr_product_report", "dpr_detailed_report",
];
exports.filtersSchema = zod_1.z.object({
    dateFrom: zod_1.z.string().optional(),
    dateTo: zod_1.z.string().optional(),
    departmentId: zod_1.z.string().uuid().optional(),
    employeeId: zod_1.z.string().uuid().optional(),
    merchantId: zod_1.z.string().uuid().optional(),
    buyerCompany: zod_1.z.string().optional(),
    customerName: zod_1.z.string().optional(),
    status: zod_1.z.string().optional(),
});
exports.runReportSchema = zod_1.z.object({
    reportType: zod_1.z.enum(REPORT_TYPES),
    filters: exports.filtersSchema.default({}),
});
exports.saveReportSchema = zod_1.z.object({
    reportType: zod_1.z.enum(REPORT_TYPES),
    name: zod_1.z.string().min(1),
    filters: exports.filtersSchema,
    chartType: zod_1.z.enum(["bar", "line", "pie", "area", "heatmap", "gauge", "treemap", "table"]).default("table"),
});
exports.addFavouriteSchema = zod_1.z.object({
    reportType: zod_1.z.enum(REPORT_TYPES),
    savedReportId: zod_1.z.string().uuid().optional().nullable(),
});
exports.createScheduledReportSchema = zod_1.z.object({
    reportType: zod_1.z.enum(REPORT_TYPES),
    name: zod_1.z.string().min(1),
    filters: exports.filtersSchema,
    frequency: zod_1.z.enum(["daily", "weekly", "monthly"]),
});
exports.addWidgetSchema = zod_1.z.object({
    reportType: zod_1.z.enum(REPORT_TYPES),
    savedReportId: zod_1.z.string().uuid().optional().nullable(),
    chartType: zod_1.z.enum(["bar", "line", "pie", "area", "heatmap", "gauge", "treemap", "table"]),
    title: zod_1.z.string().min(1),
});
exports.reorderWidgetsSchema = zod_1.z.object({
    orderedIds: zod_1.z.array(zod_1.z.string().uuid()),
});
//# sourceMappingURL=report.dto.js.map