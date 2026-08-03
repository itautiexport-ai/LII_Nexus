import { INotificationRepository } from "../../domain/repositories/INotificationRepository";
import { NotificationPriority } from "../../domain/entities/Notification";
import { NotFoundError } from "../../../../core/domain/errors/DomainError";
import { AuditService } from "../../../../shared/services/AuditService";

export class TemplateService {
  constructor(private readonly repo: INotificationRepository) {}

  list() {
    return this.repo.listTemplates();
  }

  async update(id: string, changes: { defaultTitle?: string; defaultDescription?: string | null; defaultPriority?: NotificationPriority; defaultActionLabel?: string | null; status?: "active" | "inactive" }, actorId: string) {
    const existing = await this.repo.listTemplates();
    if (!existing.some((t) => t.id === id)) throw new NotFoundError("Notification template not found.");
    const updated = await this.repo.updateTemplate(id, changes);
    await AuditService.record({ actorUserId: actorId, action: "NOTIFICATION_TEMPLATE_UPDATED", entityType: "notification_template", entityId: id, afterState: changes });
    return updated;
  }
}
