import { DashboardWidget, ReportFilters, ReportType, SavedReport, ScheduledReport } from "../entities/Report";
import { ChartType } from "../entities/Report";

export interface IReportMetaRepository {
  createSavedReport(data: { id: string; userId: string; reportType: ReportType; name: string; filters: ReportFilters; chartType: ChartType }): Promise<SavedReport>;
  listSavedReports(userId: string): Promise<SavedReport[]>;
  findSavedReportById(id: string): Promise<SavedReport | null>;
  deleteSavedReport(id: string): Promise<void>;

  addFavourite(data: { id: string; userId: string; reportType: ReportType; savedReportId: string | null }): Promise<void>;
  removeFavourite(id: string, userId: string): Promise<void>;
  listFavourites(userId: string): Promise<{ id: string; reportType: ReportType; savedReportId: string | null }[]>;

  createScheduledReport(data: { id: string; userId: string; reportType: ReportType; name: string; filters: ReportFilters; frequency: "daily" | "weekly" | "monthly"; nextDueAt: Date }): Promise<ScheduledReport>;
  listScheduledReports(userId?: string): Promise<ScheduledReport[]>;
  updateScheduledReportStatus(id: string, status: "active" | "paused"): Promise<void>;
  deleteScheduledReport(id: string): Promise<void>;
  listDueScheduledReports(): Promise<ScheduledReport[]>;
  markScheduledReportRun(id: string, nextDueAt: Date): Promise<void>;
  recordRunHistory(data: { id: string; scheduledReportId: string | null; reportType: ReportType; runBy: string | null; rowCount: number }): Promise<void>;

  createWidget(data: { id: string; userId: string; reportType: ReportType; savedReportId: string | null; chartType: ChartType; title: string; sortOrder: number }): Promise<DashboardWidget>;
  listWidgets(userId: string): Promise<DashboardWidget[]>;
  deleteWidget(id: string, userId: string): Promise<void>;
  reorderWidgets(userId: string, orderedIds: string[]): Promise<void>;
}
