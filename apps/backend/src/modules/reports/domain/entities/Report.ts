export type ReportType =
  | "employee_performance" | "department_performance" | "office_performance" | "factory_performance"
  | "workflow_reports" | "checklist_reports" | "delegation_reports" | "crm_reports" | "sales_pipeline"
  | "merchant_performance" | "production_reports" | "executive_reports" | "daily_production_report" | "dpr_product_report" | "dpr_detailed_report";


export type ChartType = "bar" | "line" | "pie" | "area" | "heatmap" | "gauge" | "treemap" | "table";

export interface ReportFilters {
  dateFrom?: string;
  dateTo?: string;
  departmentId?: string;
  employeeId?: string;
  merchantId?: string;
  buyerCompany?: string;
  customerName?: string;
  status?: string;
}

export interface ReportSummaryStat {
  label: string;
  value: string | number;
}

export interface ChartPoint {
  name: string;
  value: number;
}

/** One uniform shape returned by every report builder, regardless of report
 *  type - this is what makes a single export pipeline (Excel/CSV/PDF) and a
 *  single frontend table+chart renderer work generically across all 12
 *  report types, instead of 12 bespoke shapes needing 12 bespoke renderers. */
export interface ReportResult {
  reportType: ReportType;
  title: string;
  generatedAt: string;
  filters: ReportFilters;
  summary: ReportSummaryStat[];
  columns: string[];
  rows: (string | number | null)[][];
  chartSeries: ChartPoint[];
}

export interface SavedReport {
  id: string;
  userId: string;
  reportType: ReportType;
  name: string;
  filters: ReportFilters;
  chartType: ChartType;
  createdAt: Date;
}

export interface ScheduledReport {
  id: string;
  userId: string;
  reportType: ReportType;
  name: string;
  filters: ReportFilters;
  frequency: "daily" | "weekly" | "monthly";
  status: "active" | "paused";
  lastRunAt: Date | null;
  nextDueAt: Date;
}

export interface DashboardWidget {
  id: string;
  userId: string;
  reportType: ReportType;
  savedReportId: string | null;
  chartType: ChartType;
  title: string;
  sortOrder: number;
}
