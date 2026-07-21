import { v4 as uuid } from "uuid";
import { INotificationRepository } from "../../domain/repositories/INotificationRepository";
import { NotificationModule, NotificationPriority, NotificationStatus, NotificationType } from "../../domain/entities/Notification";
import { ForbiddenError, NotFoundError } from "../../../../core/domain/errors/DomainError";

export interface NotifyInput {
  type: NotificationType;
  module: NotificationModule;
  referenceType?: string;
  referenceId?: string;
  assignedUserId: string;
  createdBy?: string | null;
  title?: string;
  description?: string;
  dueDate?: string;
  priority?: NotificationPriority;
  actionLabel?: string;
  actionUrl?: string;
  /** Additional channels to simulate delivery on, beyond the always-real
   *  in_app channel. None of these are actually integrated in this system
   *  yet (see notification_deliveries.delivery_status = 'simulated'). */
  additionalChannels?: ("email" | "whatsapp" | "sms" | "push")[];
}

/**
 * The public API other modules call to raise a notification. This is the
 * one piece of genuine cross-module reusability in this engine: Delegation,
 * Flowchart, and CRM all call this same method rather than each rolling
 * their own notification logic.
 */
export class NotificationService {
  constructor(private readonly repo: INotificationRepository) {}

  async notify(input: NotifyInput) {
    const template = await this.repo.findTemplateByType(input.type);
    const title = input.title ?? template?.defaultTitle ?? input.type;
    const description = input.description ?? template?.defaultDescription ?? null;
    const priority = input.priority ?? template?.defaultPriority ?? "medium";
    const actionLabel = input.actionLabel ?? template?.defaultActionLabel ?? null;

    const notification = await this.repo.create({
      id: uuid(),
      notificationType: input.type,
      module: input.module,
      referenceType: input.referenceType ?? null,
      referenceId: input.referenceId ?? null,
      title,
      description,
      priority,
      assignedUserId: input.assignedUserId,
      createdBy: input.createdBy ?? null,
      dueDate: input.dueDate ?? null,
      actionLabel,
      actionUrl: input.actionUrl ?? null,
    });

    // in_app is always genuinely "delivered" (it's just a row visible to
    // the bell/center); anything else requested is honestly recorded as
    // simulated, since no real email/WhatsApp/SMS/push integration exists.
    await this.repo.recordDelivery(notification.id, "in_app", "delivered");
    for (const channel of input.additionalChannels ?? []) {
      await this.repo.recordDelivery(notification.id, channel, "simulated");
    }

    return notification;
  }

  async listMine(assignedUserId: string, page: number, pageSize: number, status?: NotificationStatus, isRead?: boolean) {
    return this.repo.list({ page, pageSize, assignedUserId, status, isRead });
  }

  async unreadCount(assignedUserId: string) {
    return this.repo.countUnread(assignedUserId);
  }

  private async assertOwnerOrOverride(notificationId: string, actorUserId: string, hasOverride: boolean) {
    const notification = await this.repo.findById(notificationId);
    if (!notification) throw new NotFoundError("Notification not found.");
    if (!hasOverride && notification.assignedUserId !== actorUserId) {
      throw new ForbiddenError("You can only manage your own notifications.");
    }
    return notification;
  }

  async markRead(id: string, actorUserId: string, hasOverride: boolean) {
    await this.assertOwnerOrOverride(id, actorUserId, hasOverride);
    return this.repo.markRead(id);
  }

  async markAllRead(actorUserId: string) {
    return this.repo.markAllRead(actorUserId);
  }

  async updateStatus(id: string, status: NotificationStatus, actorUserId: string, hasOverride: boolean) {
    await this.assertOwnerOrOverride(id, actorUserId, hasOverride);
    return this.repo.updateStatus(id, status);
  }
}
