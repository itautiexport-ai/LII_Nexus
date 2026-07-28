"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ReportController = void 0;
const ReportingService_1 = require("../../application/services/ReportingService");
const ReportExportService_1 = require("../../application/services/ReportExportService");
const ReportMetaService_1 = require("../../application/services/ReportMetaService");
const ScheduledReportRunnerService_1 = require("../../application/services/ScheduledReportRunnerService");
const MySqlReportMetaRepository_1 = require("../../infrastructure/repositories/MySqlReportMetaRepository");
const MySqlRoleRepository_1 = require("../../../rbac/infrastructure/repositories/MySqlRoleRepository");
const apiResponse_1 = require("../../../../shared/utils/apiResponse");
const DomainError_1 = require("../../../../core/domain/errors/DomainError");
const metaRepo = new MySqlReportMetaRepository_1.MySqlReportMetaRepository();
const reportingService = new ReportingService_1.ReportingService();
const exportService = new ReportExportService_1.ReportExportService();
const metaService = new ReportMetaService_1.ReportMetaService(metaRepo);
const runnerService = new ScheduledReportRunnerService_1.ScheduledReportRunnerService(metaRepo, reportingService);
const roleRepo = new MySqlRoleRepository_1.MySqlRoleRepository();
async function hasPermission(userId, key) {
    const keys = await roleRepo.getPermissionKeysForUser(userId);
    return keys.includes(key);
}
exports.ReportController = {
    async run(req, res) {
        const report = await reportingService.run(req.body.reportType, req.body.filters ?? {});
        return (0, apiResponse_1.ok)(res, report);
    },
    async export(req, res) {
        const reportType = req.params.reportType;
        const format = req.query.format ?? "xlsx";
        const filters = req.query.filters ? JSON.parse(req.query.filters) : {};
        const report = await reportingService.run(reportType, filters);
        if (format === "xlsx") {
            res.setHeader("Content-Type", "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet");
            res.setHeader("Content-Disposition", `attachment; filename=${reportType}.xlsx`);
            return res.send(await exportService.toExcelBuffer(report));
        }
        if (format === "csv") {
            res.setHeader("Content-Type", "text/csv");
            res.setHeader("Content-Disposition", `attachment; filename=${reportType}.csv`);
            return res.send(exportService.toCsvBuffer(report));
        }
        if (format === "pdf") {
            res.setHeader("Content-Type", "application/pdf");
            res.setHeader("Content-Disposition", `attachment; filename=${reportType}.pdf`);
            return res.send(await exportService.toPdfBuffer(report));
        }
        throw new DomainError_1.ValidationError(`Unsupported export format "${format}". Use xlsx, csv, or pdf.`);
    },
    async saveReport(req, res) {
        const { reportType, name, filters, chartType } = req.body;
        return (0, apiResponse_1.created)(res, await metaService.saveReport(req.user.sub, reportType, name, filters, chartType));
    },
    async listSavedReports(req, res) {
        return (0, apiResponse_1.ok)(res, await metaService.listSavedReports(req.user.sub));
    },
    async deleteSavedReport(req, res) {
        await metaService.deleteSavedReport(req.params.id, req.user.sub);
        return (0, apiResponse_1.ok)(res, { message: "Saved report deleted." });
    },
    async addFavourite(req, res) {
        await metaService.addFavourite(req.user.sub, req.body.reportType, req.body.savedReportId ?? null);
        return (0, apiResponse_1.created)(res, { message: "Added to favourites." });
    },
    async removeFavourite(req, res) {
        await metaService.removeFavourite(req.params.id, req.user.sub);
        return (0, apiResponse_1.ok)(res, { message: "Removed from favourites." });
    },
    async listFavourites(req, res) {
        return (0, apiResponse_1.ok)(res, await metaService.listFavourites(req.user.sub));
    },
    async createScheduledReport(req, res) {
        const { reportType, name, filters, frequency } = req.body;
        return (0, apiResponse_1.created)(res, await metaService.createScheduledReport(req.user.sub, reportType, name, filters, frequency));
    },
    async listScheduledReports(req, res) {
        const override = await hasPermission(req.user.sub, "report.schedule.manage");
        return (0, apiResponse_1.ok)(res, await metaService.listScheduledReports(req.user.sub, override));
    },
    async pauseScheduledReport(req, res) {
        await metaService.pauseResumeScheduledReport(req.params.id, "paused", req.user.sub);
        return (0, apiResponse_1.ok)(res, { message: "Paused." });
    },
    async resumeScheduledReport(req, res) {
        await metaService.pauseResumeScheduledReport(req.params.id, "active", req.user.sub);
        return (0, apiResponse_1.ok)(res, { message: "Resumed." });
    },
    async deleteScheduledReport(req, res) {
        await metaService.deleteScheduledReport(req.params.id, req.user.sub);
        return (0, apiResponse_1.ok)(res, { message: "Deleted." });
    },
    async runDueScheduledReports(_req, res) {
        return (0, apiResponse_1.ok)(res, await runnerService.runDueReports());
    },
    async addWidget(req, res) {
        const { reportType, savedReportId, chartType, title } = req.body;
        return (0, apiResponse_1.created)(res, await metaService.addWidget(req.user.sub, reportType, savedReportId ?? null, chartType, title));
    },
    async listWidgets(req, res) {
        return (0, apiResponse_1.ok)(res, await metaService.listWidgets(req.user.sub));
    },
    async removeWidget(req, res) {
        await metaService.removeWidget(req.params.id, req.user.sub);
        return (0, apiResponse_1.ok)(res, { message: "Widget removed." });
    },
    async reorderWidgets(req, res) {
        await metaService.reorderWidgets(req.user.sub, req.body.orderedIds);
        return (0, apiResponse_1.ok)(res, { message: "Reordered." });
    },
};
//# sourceMappingURL=ReportController.js.map