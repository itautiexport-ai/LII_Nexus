import { z } from "zod";

const REPORT_TYPES = [
  "employee_performance", "department_performance", "office_performance", "factory_performance",
  "workflow_reports", "checklist_reports", "delegation_reports", "crm_reports", "sales_pipeline",
  "merchant_performance", "production_reports", "executive_reports", "daily_production_report",
  "dpr_product_report", "dpr_detailed_report",
] as const;

export const filtersSchema = z.object({
  dateFrom: z.string().optional(),
  dateTo: z.string().optional(),
  departmentId: z.string().uuid().optional(),
  employeeId: z.string().uuid().optional(),
  merchantId: z.string().uuid().optional(),
  buyerCompany: z.string().optional(),
  customerName: z.string().optional(),
  status: z.string().optional(),
});

export const runReportSchema = z.object({
  reportType: z.enum(REPORT_TYPES),
  filters: filtersSchema.default({}),
});

export const saveReportSchema = z.object({
  reportType: z.enum(REPORT_TYPES),
  name: z.string().min(1),
  filters: filtersSchema,
  chartType: z.enum(["bar", "line", "pie", "area", "heatmap", "gauge", "treemap", "table"]).default("table"),
});

export const addFavouriteSchema = z.object({
  reportType: z.enum(REPORT_TYPES),
  savedReportId: z.string().uuid().optional().nullable(),
});

export const createScheduledReportSchema = z.object({
  reportType: z.enum(REPORT_TYPES),
  name: z.string().min(1),
  filters: filtersSchema,
  frequency: z.enum(["daily", "weekly", "monthly"]),
});

export const addWidgetSchema = z.object({
  reportType: z.enum(REPORT_TYPES),
  savedReportId: z.string().uuid().optional().nullable(),
  chartType: z.enum(["bar", "line", "pie", "area", "heatmap", "gauge", "treemap", "table"]),
  title: z.string().min(1),
});

export const reorderWidgetsSchema = z.object({
  orderedIds: z.array(z.string().uuid()),
});
