import { v4 as uuid } from "uuid";
import { IReportMetaRepository } from "../../domain/repositories/IReportMetaRepository";
import { ReportingService } from "./ReportingService";
import { NotificationService } from "../../../notifications/application/services/NotificationService";
import { MySqlNotificationRepository } from "../../../notifications/infrastructure/repositories/MySqlNotificationRepository";

const notificationService = new NotificationService(new MySqlNotificationRepository());

function nextDueDate(frequency: "daily" | "weekly" | "monthly", from: Date = new Date()): Date {
  const next = new Date(from);
  if (frequency === "daily") next.setDate(next.getDate() + 1);
  else if (frequency === "weekly") next.setDate(next.getDate() + 7);
  else next.setMonth(next.getMonth() + 1);
  return next;
}

/**
 * On-demand "scheduler" - there is no cron/job runner in this stack, the
 * same documented tradeoff as checklist generation, KPI scoring, and
 * notification escalation. Calling runDueReports() generates and records a
 * run for every scheduled report whose next-due time has passed, exactly as
 * a real scheduled job would, and raises a real in-app notification for the
 * report's owner via the Notification Engine - another genuine cross-module
 * reuse, not a fifth parallel notification mechanism.
 */
export class ScheduledReportRunnerService {
  constructor(private readonly metaRepo: IReportMetaRepository, private readonly reportingService: ReportingService) {}

  async runDueReports() {
    const due = await this.metaRepo.listDueScheduledReports();
    const results = [];

    for (const scheduled of due) {
      const report = await this.reportingService.run(scheduled.reportType, scheduled.filters);
      await this.metaRepo.recordRunHistory({
        id: uuid(), scheduledReportId: scheduled.id, reportType: scheduled.reportType, runBy: null, rowCount: report.rows.length,
      });
      await this.metaRepo.markScheduledReportRun(scheduled.id, nextDueDate(scheduled.frequency));

      await notificationService.notify({
        type: "executive_meeting_reminder",
        module: "general",
        referenceType: "scheduled_report",
        referenceId: scheduled.id,
        assignedUserId: scheduled.userId,
        title: `Scheduled Report Ready: ${scheduled.name}`,
        description: `Your ${scheduled.frequency} "${report.title}" is ready — ${report.rows.length} row(s).`,
        actionUrl: `/admin/reports?type=${scheduled.reportType}`,
      });

      results.push({ scheduledReportId: scheduled.id, reportType: scheduled.reportType, rowCount: report.rows.length });
    }

    return results;
  }
}
