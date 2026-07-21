import { pool } from "../../../../infrastructure/database/mysql/connection";
import { IDocumentRepository } from "../../domain/repositories/IDocumentRepository";
import { NotificationService } from "../../../notifications/application/services/NotificationService";

/**
 * On-demand expiry check - the same honest pattern as every other
 * "scheduled" feature in this project (checklist generation, KPI scoring,
 * notification escalation, scheduled reports): there is no cron job here.
 * Calling checkExpiries() finds documents expiring within the window and
 * raises a real notification for each document's owner via the existing
 * Notification Engine, reusing that infrastructure rather than building a
 * fifth parallel alerting mechanism.
 */
export class ExpiryAlertService {
  constructor(private readonly repo: IDocumentRepository, private readonly notificationService: NotificationService) {}

  async checkExpiries(withinDays = 30) {
    const expiring = await this.repo.listExpiringDocuments(withinDays);
    const results = [];

    for (const doc of expiring) {
      if (!doc.ownerId) continue;
      const [userRows] = await pool.query<any[]>("SELECT user_id FROM employees WHERE id = ?", [doc.ownerId]);
      const userId = userRows[0]?.user_id;
      if (!userId) continue;

      const isPastDue = doc.expiryDate !== null && new Date(doc.expiryDate) < new Date(new Date().toDateString());
      await this.notificationService.notify({
        type: "executive_meeting_reminder",
        module: "general",
        referenceType: "document",
        referenceId: doc.id,
        assignedUserId: userId,
        title: `Document ${isPastDue ? "Expired" : "Expiring Soon"}: ${doc.title}`,
        description: `"${doc.title}" ${isPastDue ? "expired on" : "expires on"} ${doc.expiryDate}.`,
        priority: isPastDue ? "urgent" : "high",
        dueDate: doc.expiryDate ?? undefined,
        actionUrl: `/admin/documents/${doc.id}`,
      });
      results.push({ documentId: doc.id, title: doc.title, expiryDate: doc.expiryDate, isPastDue });
    }

    return results;
  }
}
