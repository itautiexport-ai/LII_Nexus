import { Response } from "express";
import { ReportingService } from "../../application/services/ReportingService";
import { ReportExportService } from "../../application/services/ReportExportService";
import { ReportMetaService } from "../../application/services/ReportMetaService";
import { ScheduledReportRunnerService } from "../../application/services/ScheduledReportRunnerService";
import { MySqlReportMetaRepository } from "../../infrastructure/repositories/MySqlReportMetaRepository";
import { MySqlRoleRepository } from "../../../rbac/infrastructure/repositories/MySqlRoleRepository";
import { ok, created } from "../../../../shared/utils/apiResponse";
import { AuthenticatedRequest } from "../../../../shared/middlewares/auth.middleware";
import { ReportType } from "../../domain/entities/Report";
import { ValidationError } from "../../../../core/domain/errors/DomainError";

const metaRepo = new MySqlReportMetaRepository();
const reportingService = new ReportingService();
const exportService = new ReportExportService();
const metaService = new ReportMetaService(metaRepo);
const runnerService = new ScheduledReportRunnerService(metaRepo, reportingService);
const roleRepo = new MySqlRoleRepository();

async function hasPermission(userId: string, key: string): Promise<boolean> {
  const keys = await roleRepo.getPermissionKeysForUser(userId);
  return keys.includes(key);
}

export const ReportController = {
  async run(req: AuthenticatedRequest, res: Response) {
    const report = await reportingService.run(req.body.reportType, req.body.filters ?? {});
    return ok(res, report);
  },

  async export(req: AuthenticatedRequest, res: Response) {
    const reportType = req.params.reportType as ReportType;
    const format = (req.query.format as string) ?? "xlsx";
    const filters = req.query.filters ? JSON.parse(req.query.filters as string) : {};
    const report = await reportingService.run(reportType, filters);

    if (format === "xlsx") {
      res.setHeader("Content-Type", "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet");
      res.setHeader("Content-Disposition", `attachment; filename=${reportType}.xlsx`);
      return res.send(exportService.toExcelBuffer(report));
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
    throw new ValidationError(`Unsupported export format "${format}". Use xlsx, csv, or pdf.`);
  },

  async saveReport(req: AuthenticatedRequest, res: Response) {
    const { reportType, name, filters, chartType } = req.body;
    return created(res, await metaService.saveReport(req.user!.sub, reportType, name, filters, chartType));
  },
  async listSavedReports(req: AuthenticatedRequest, res: Response) {
    return ok(res, await metaService.listSavedReports(req.user!.sub));
  },
  async deleteSavedReport(req: AuthenticatedRequest, res: Response) {
    await metaService.deleteSavedReport(req.params.id, req.user!.sub);
    return ok(res, { message: "Saved report deleted." });
  },

  async addFavourite(req: AuthenticatedRequest, res: Response) {
    await metaService.addFavourite(req.user!.sub, req.body.reportType, req.body.savedReportId ?? null);
    return created(res, { message: "Added to favourites." });
  },
  async removeFavourite(req: AuthenticatedRequest, res: Response) {
    await metaService.removeFavourite(req.params.id, req.user!.sub);
    return ok(res, { message: "Removed from favourites." });
  },
  async listFavourites(req: AuthenticatedRequest, res: Response) {
    return ok(res, await metaService.listFavourites(req.user!.sub));
  },

  async createScheduledReport(req: AuthenticatedRequest, res: Response) {
    const { reportType, name, filters, frequency } = req.body;
    return created(res, await metaService.createScheduledReport(req.user!.sub, reportType, name, filters, frequency));
  },
  async listScheduledReports(req: AuthenticatedRequest, res: Response) {
    const override = await hasPermission(req.user!.sub, "report.schedule.manage");
    return ok(res, await metaService.listScheduledReports(req.user!.sub, override));
  },
  async pauseScheduledReport(req: AuthenticatedRequest, res: Response) {
    await metaService.pauseResumeScheduledReport(req.params.id, "paused", req.user!.sub);
    return ok(res, { message: "Paused." });
  },
  async resumeScheduledReport(req: AuthenticatedRequest, res: Response) {
    await metaService.pauseResumeScheduledReport(req.params.id, "active", req.user!.sub);
    return ok(res, { message: "Resumed." });
  },
  async deleteScheduledReport(req: AuthenticatedRequest, res: Response) {
    await metaService.deleteScheduledReport(req.params.id, req.user!.sub);
    return ok(res, { message: "Deleted." });
  },
  async runDueScheduledReports(_req: AuthenticatedRequest, res: Response) {
    return ok(res, await runnerService.runDueReports());
  },

  async addWidget(req: AuthenticatedRequest, res: Response) {
    const { reportType, savedReportId, chartType, title } = req.body;
    return created(res, await metaService.addWidget(req.user!.sub, reportType, savedReportId ?? null, chartType, title));
  },
  async listWidgets(req: AuthenticatedRequest, res: Response) {
    return ok(res, await metaService.listWidgets(req.user!.sub));
  },
  async removeWidget(req: AuthenticatedRequest, res: Response) {
    await metaService.removeWidget(req.params.id, req.user!.sub);
    return ok(res, { message: "Widget removed." });
  },
  async reorderWidgets(req: AuthenticatedRequest, res: Response) {
    await metaService.reorderWidgets(req.user!.sub, req.body.orderedIds);
    return ok(res, { message: "Reordered." });
  },
};
