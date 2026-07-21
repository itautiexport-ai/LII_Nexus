"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ReportMetaService = void 0;
const uuid_1 = require("uuid");
const DomainError_1 = require("../../../../core/domain/errors/DomainError");
const AuditService_1 = require("../../../../shared/services/AuditService");
function nextDueDate(frequency, from = new Date()) {
    const next = new Date(from);
    if (frequency === "daily")
        next.setDate(next.getDate() + 1);
    else if (frequency === "weekly")
        next.setDate(next.getDate() + 7);
    else
        next.setMonth(next.getMonth() + 1);
    return next;
}
class ReportMetaService {
    constructor(repo) {
        this.repo = repo;
    }
    async saveReport(userId, reportType, name, filters, chartType) {
        const saved = await this.repo.createSavedReport({ id: (0, uuid_1.v4)(), userId, reportType, name, filters, chartType });
        await AuditService_1.AuditService.record({ actorUserId: userId, action: "REPORT_SAVED", entityType: "saved_report", entityId: saved.id, afterState: { reportType, name } });
        return saved;
    }
    listSavedReports(userId) {
        return this.repo.listSavedReports(userId);
    }
    async deleteSavedReport(id, userId) {
        const existing = await this.repo.findSavedReportById(id);
        if (!existing)
            throw new DomainError_1.NotFoundError("Saved report not found.");
        if (existing.userId !== userId)
            throw new DomainError_1.ForbiddenError("You can only delete your own saved reports.");
        await this.repo.deleteSavedReport(id);
    }
    async addFavourite(userId, reportType, savedReportId) {
        await this.repo.addFavourite({ id: (0, uuid_1.v4)(), userId, reportType, savedReportId });
    }
    async removeFavourite(id, userId) {
        await this.repo.removeFavourite(id, userId);
    }
    listFavourites(userId) {
        return this.repo.listFavourites(userId);
    }
    async createScheduledReport(userId, reportType, name, filters, frequency) {
        const scheduled = await this.repo.createScheduledReport({ id: (0, uuid_1.v4)(), userId, reportType, name, filters, frequency, nextDueAt: nextDueDate(frequency) });
        await AuditService_1.AuditService.record({ actorUserId: userId, action: "SCHEDULED_REPORT_CREATED", entityType: "scheduled_report", entityId: scheduled.id, afterState: { reportType, frequency } });
        return scheduled;
    }
    listScheduledReports(userId, hasOverride) {
        return this.repo.listScheduledReports(hasOverride ? undefined : userId);
    }
    async pauseResumeScheduledReport(id, status, userId) {
        await this.repo.updateScheduledReportStatus(id, status);
        await AuditService_1.AuditService.record({ actorUserId: userId, action: "SCHEDULED_REPORT_STATUS_CHANGED", entityType: "scheduled_report", entityId: id, afterState: { status } });
    }
    async deleteScheduledReport(id, userId) {
        await this.repo.deleteScheduledReport(id);
        await AuditService_1.AuditService.record({ actorUserId: userId, action: "SCHEDULED_REPORT_DELETED", entityType: "scheduled_report", entityId: id });
    }
    async addWidget(userId, reportType, savedReportId, chartType, title) {
        const existing = await this.repo.listWidgets(userId);
        const widget = await this.repo.createWidget({ id: (0, uuid_1.v4)(), userId, reportType, savedReportId, chartType, title, sortOrder: existing.length });
        return widget;
    }
    listWidgets(userId) {
        return this.repo.listWidgets(userId);
    }
    async removeWidget(id, userId) {
        await this.repo.deleteWidget(id, userId);
    }
    async reorderWidgets(userId, orderedIds) {
        await this.repo.reorderWidgets(userId, orderedIds);
    }
    nextDueDateFor(frequency) {
        return nextDueDate(frequency);
    }
}
exports.ReportMetaService = ReportMetaService;
//# sourceMappingURL=ReportMetaService.js.map