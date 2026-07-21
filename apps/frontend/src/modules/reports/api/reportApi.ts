import { axiosInstance } from "../../../services/api/axiosInstance";

export type ReportType =
  | "employee_performance" | "department_performance" | "office_performance" | "factory_performance"
  | "workflow_reports" | "checklist_reports" | "delegation_reports" | "crm_reports" | "sales_pipeline"
  | "merchant_performance" | "production_reports" | "executive_reports" | "daily_production_report"
  | "dpr_product_report" | "dpr_detailed_report";

export type ChartType = "bar" | "line" | "pie" | "area" | "heatmap" | "gauge" | "treemap" | "table";

export const REPORT_TYPE_LABELS: Record<ReportType, string> = {
  employee_performance: "Employee Performance",
  department_performance: "Department Performance",
  office_performance: "Office Performance",
  factory_performance: "Factory Performance",
  workflow_reports: "Workflow Reports",
  checklist_reports: "Checklist Reports",
  delegation_reports: "Delegation Reports",
  crm_reports: "CRM Reports",
  sales_pipeline: "Sales Pipeline",
  merchant_performance: "Merchant Performance",
  production_reports: "Production Reports",
  executive_reports: "Executive Reports",
  daily_production_report: "Daily Production Summary",
  dpr_product_report: "Daily Production Report",
  dpr_detailed_report: "Detailed Production Report",
};

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

export interface ReportResult {
  reportType: ReportType;
  title: string;
  generatedAt: string;
  filters: ReportFilters;
  summary: { label: string; value: string | number }[];
  columns: string[];
  rows: (string | number | null)[][];
  chartSeries: { name: string; value: number }[];
}

export interface SavedReportRecord {
  id: string;
  reportType: ReportType;
  name: string;
  filters: ReportFilters;
  chartType: ChartType;
  createdAt: string;
}

export interface ScheduledReportRecord {
  id: string;
  reportType: ReportType;
  name: string;
  filters: ReportFilters;
  frequency: "daily" | "weekly" | "monthly";
  status: "active" | "paused";
  lastRunAt: string | null;
  nextDueAt: string;
}

export interface DashboardWidgetRecord {
  id: string;
  reportType: ReportType;
  savedReportId: string | null;
  chartType: ChartType;
  title: string;
  sortOrder: number;
}

export const reportApi = {
  async run(reportType: ReportType, filters: ReportFilters): Promise<ReportResult> {
    const res = await axiosInstance.post("/reports/run", { reportType, filters });
    return res.data.data;
  },
  exportUrl(reportType: ReportType, format: "xlsx" | "csv" | "pdf", filters: ReportFilters) {
    const base = axiosInstance.defaults.baseURL ?? "";
    return `${base}/reports/export/${reportType}?format=${format}&filters=${encodeURIComponent(JSON.stringify(filters))}`;
  },
  async downloadExport(reportType: ReportType, format: "xlsx" | "csv" | "pdf", filters: ReportFilters, fileName: string) {
    const mimeTypes: Record<string, string> = {
      xlsx: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
      csv: "text/csv",
      pdf: "application/pdf",
    };
    const res = await axiosInstance.get(`/reports/export/${reportType}`, {
      params: { format, filters: JSON.stringify(filters) },
      responseType: "arraybuffer",
    });
    const blob = new Blob([res.data], { type: mimeTypes[format] ?? "application/octet-stream" });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = fileName;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    window.URL.revokeObjectURL(url);
  },

  async listSaved(): Promise<SavedReportRecord[]> { return (await axiosInstance.get("/reports/saved")).data.data; },
  async save(reportType: ReportType, name: string, filters: ReportFilters, chartType: ChartType) {
    return (await axiosInstance.post("/reports/saved", { reportType, name, filters, chartType })).data.data as SavedReportRecord;
  },
  async deleteSaved(id: string) { await axiosInstance.delete(`/reports/saved/${id}`); },

  async listFavourites(): Promise<{ id: string; reportType: ReportType; savedReportId: string | null }[]> {
    return (await axiosInstance.get("/reports/favourites")).data.data;
  },
  async addFavourite(reportType: ReportType, savedReportId?: string | null) {
    return (await axiosInstance.post("/reports/favourites", { reportType, savedReportId })).data.data;
  },
  async removeFavourite(id: string) { await axiosInstance.delete(`/reports/favourites/${id}`); },

  async listScheduled(): Promise<ScheduledReportRecord[]> { return (await axiosInstance.get("/reports/scheduled")).data.data; },
  async createScheduled(reportType: ReportType, name: string, filters: ReportFilters, frequency: "daily" | "weekly" | "monthly") {
    return (await axiosInstance.post("/reports/scheduled", { reportType, name, filters, frequency })).data.data as ScheduledReportRecord;
  },
  async pauseScheduled(id: string) { await axiosInstance.patch(`/reports/scheduled/${id}/pause`); },
  async resumeScheduled(id: string) { await axiosInstance.patch(`/reports/scheduled/${id}/resume`); },
  async deleteScheduled(id: string) { await axiosInstance.delete(`/reports/scheduled/${id}`); },
  async runDueScheduled() { return (await axiosInstance.post("/reports/scheduled/run-due")).data.data; },

  async listWidgets(): Promise<DashboardWidgetRecord[]> { return (await axiosInstance.get("/reports/widgets")).data.data; },
  async addWidget(reportType: ReportType, chartType: ChartType, title: string, savedReportId?: string | null) {
    return (await axiosInstance.post("/reports/widgets", { reportType, chartType, title, savedReportId })).data.data as DashboardWidgetRecord;
  },
  async removeWidget(id: string) { await axiosInstance.delete(`/reports/widgets/${id}`); },
  async reorderWidgets(orderedIds: string[]) { await axiosInstance.patch("/reports/widgets/reorder", { orderedIds }); },
};
