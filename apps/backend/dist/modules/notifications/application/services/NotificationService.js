"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.NotificationService = void 0;
const uuid_1 = require("uuid");
const DomainError_1 = require("../../../../core/domain/errors/DomainError");
/**
 * The public API other modules call to raise a notification. This is the
 * one piece of genuine cross-module reusability in this engine: Delegation,
 * Flowchart, and CRM all call this same method rather than each rolling
 * their own notification logic.
 */
class NotificationService {
    constructor(repo) {
        this.repo = repo;
    }
    async notify(input) {
        const template = await this.repo.findTemplateByType(input.type);
        const title = input.title ?? template?.defaultTitle ?? input.type;
        const description = input.description ?? template?.defaultDescription ?? null;
        const priority = input.priority ?? template?.defaultPriority ?? "medium";
        const actionLabel = input.actionLabel ?? template?.defaultActionLabel ?? null;
        const notification = await this.repo.create({
            id: (0, uuid_1.v4)(),
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
    async listMine(assignedUserId, page, pageSize, status, isRead) {
        return this.repo.list({ page, pageSize, assignedUserId, status, isRead });
    }
    async unreadCount(assignedUserId) {
        return this.repo.countUnread(assignedUserId);
    }
    async assertOwnerOrOverride(notificationId, actorUserId, hasOverride) {
        const notification = await this.repo.findById(notificationId);
        if (!notification)
            throw new DomainError_1.NotFoundError("Notification not found.");
        if (!hasOverride && notification.assignedUserId !== actorUserId) {
            throw new DomainError_1.ForbiddenError("You can only manage your own notifications.");
        }
        return notification;
    }
    async markRead(id, actorUserId, hasOverride) {
        await this.assertOwnerOrOverride(id, actorUserId, hasOverride);
        return this.repo.markRead(id);
    }
    async markAllRead(actorUserId) {
        return this.repo.markAllRead(actorUserId);
    }
    async updateStatus(id, status, actorUserId, hasOverride) {
        await this.assertOwnerOrOverride(id, actorUserId, hasOverride);
        return this.repo.updateStatus(id, status);
    }
}
exports.NotificationService = NotificationService;
//# sourceMappingURL=NotificationService.js.map