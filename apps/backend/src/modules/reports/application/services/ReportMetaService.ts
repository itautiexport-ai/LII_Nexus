import { v4 as uuid } from "uuid";
import { IReportMetaRepository } from "../../domain/repositories/IReportMetaRepository";
import { ChartType, ReportFilters, ReportType } from "../../domain/entities/Report";
import { NotFoundError, ForbiddenError } from "../../../../core/domain/errors/DomainError";
import { AuditService } from "../../../../shared/services/AuditService";

function nextDueDate(frequency: "daily" | "weekly" | "monthly", from: Date = new Date()): Date {
  const next = new Date(from);
  if (frequency === "daily") next.setDate(next.getDate() + 1);
  else if (frequency === "weekly") next.setDate(next.getDate() + 7);
  else next.setMonth(next.getMonth() + 1);
  return next;
}

export class ReportMetaService {
  constructor(private readonly repo: IReportMetaRepository) {}

  async saveReport(userId: string, reportType: ReportType, name: string, filters: ReportFilters, chartType: ChartType) {
    const saved = await this.repo.createSavedReport({ id: uuid(), userId, reportType, name, filters, chartType });
    await AuditService.record({ actorUserId: userId, action: "REPORT_SAVED", entityType: "saved_report", entityId: saved.id, afterState: { reportType, name } });
    return saved;
  }

  listSavedReports(userId: string) {
    return this.repo.listSavedReports(userId);
  }

  async deleteSavedReport(id: string, userId: string) {
    const existing = await this.repo.findSavedReportById(id);
    if (!existing) throw new NotFoundError("Saved report not found.");
    if (existing.userId !== userId) throw new ForbiddenError("You can only delete your own saved reports.");
    await this.repo.deleteSavedReport(id);
  }

  async addFavourite(userId: string, reportType: ReportType, savedReportId: string | null) {
    await this.repo.addFavourite({ id: uuid(), userId, reportType, savedReportId });
  }

  async removeFavourite(id: string, userId: string) {
    await this.repo.removeFavourite(id, userId);
  }

  listFavourites(userId: string) {
    return this.repo.listFavourites(userId);
  }

  async createScheduledReport(userId: string, reportType: ReportType, name: string, filters: ReportFilters, frequency: "daily" | "weekly" | "monthly") {
    const scheduled = await this.repo.createScheduledReport({ id: uuid(), userId, reportType, name, filters, frequency, nextDueAt: nextDueDate(frequency) });
    await AuditService.record({ actorUserId: userId, action: "SCHEDULED_REPORT_CREATED", entityType: "scheduled_report", entityId: scheduled.id, afterState: { reportType, frequency } });
    return scheduled;
  }

  listScheduledReports(userId: string, hasOverride: boolean) {
    return this.repo.listScheduledReports(hasOverride ? undefined : userId);
  }

  async pauseResumeScheduledReport(id: string, status: "active" | "paused", userId: string) {
    await this.repo.updateScheduledReportStatus(id, status);
    await AuditService.record({ actorUserId: userId, action: "SCHEDULED_REPORT_STATUS_CHANGED", entityType: "scheduled_report", entityId: id, afterState: { status } });
  }

  async deleteScheduledReport(id: string, userId: string) {
    await this.repo.deleteScheduledReport(id);
    await AuditService.record({ actorUserId: userId, action: "SCHEDULED_REPORT_DELETED", entityType: "scheduled_report", entityId: id });
  }

  async addWidget(userId: string, reportType: ReportType, savedReportId: string | null, chartType: ChartType, title: string) {
    const existing = await this.repo.listWidgets(userId);
    const widget = await this.repo.createWidget({ id: uuid(), userId, reportType, savedReportId, chartType, title, sortOrder: existing.length });
    return widget;
  }

  listWidgets(userId: string) {
    return this.repo.listWidgets(userId);
  }

  async removeWidget(id: string, userId: string) {
    await this.repo.deleteWidget(id, userId);
  }

  async reorderWidgets(userId: string, orderedIds: string[]) {
    await this.repo.reorderWidgets(userId, orderedIds);
  }

  nextDueDateFor(frequency: "daily" | "weekly" | "monthly") {
    return nextDueDate(frequency);
  }
}
