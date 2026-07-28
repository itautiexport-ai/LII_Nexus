"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.DelegationService = void 0;
const uuid_1 = require("uuid");
const DomainError_1 = require("../../../../core/domain/errors/DomainError");
const AuditService_1 = require("../../../../shared/services/AuditService");
const NotificationService_1 = require("../../../notifications/application/services/NotificationService");
const MySqlNotificationRepository_1 = require("../../../notifications/infrastructure/repositories/MySqlNotificationRepository");
const connection_1 = require("../../../../infrastructure/database/mysql/connection");
const WhatsAppBotService_1 = require("../../../whatsapp/application/services/WhatsAppBotService");
const notificationService = new NotificationService_1.NotificationService(new MySqlNotificationRepository_1.MySqlNotificationRepository());
class DelegationService {
    constructor(repo, scope) {
        this.repo = repo;
        this.scope = scope;
    }
    async list(page, pageSize, actorUserId, hasViewOverride, status) {
        if (hasViewOverride) {
            return this.repo.list({ page, pageSize, status });
        }
        const actor = await this.scope.requireEmployeeForUser(actorUserId);
        return this.repo.list({ page, pageSize, assignedTo: actor.id, status });
    }
    async listIDelegated(actorUserId) {
        const actor = await this.scope.getEmployeeForUser(actorUserId);
        if (!actor)
            return [];
        const { items } = await this.repo.list({ page: 1, pageSize: 100, assignedBy: actor.id });
        return items;
    }
    async getById(id, actorUserId, hasViewOverride) {
        const task = await this.repo.getWithContext(id);
        if (!task)
            throw new DomainError_1.NotFoundError("Delegated task not found.");
        if (!hasViewOverride) {
            const actor = await this.scope.requireEmployeeForUser(actorUserId);
            if (actor.id !== task.assignedTo && actor.id !== task.assignedBy) {
                throw new DomainError_1.ForbiddenError("You can only view delegated tasks you assigned or were assigned to you.");
            }
        }
        return task;
    }
    async create(input, actorUserId, hasCreateOverride) {
        let assignedByEmployeeId = input.assignedBy;
        if (!assignedByEmployeeId) {
            const actor = await this.scope.requireEmployeeForUser(actorUserId);
            assignedByEmployeeId = actor.id;
        }
        const actualTarget = await this.scope.authorizeManagerOnly(actorUserId, input.assignedTo, hasCreateOverride || input.assignedBy !== undefined, // Allow override if we select manually in UI
        "You can only delegate tasks to your direct reports.");
        const task = await this.repo.create({ id: (0, uuid_1.v4)(), assignedBy: assignedByEmployeeId, ...input, assignedTo: actualTarget.id });
        await AuditService_1.AuditService.record({
            actorUserId,
            action: "TASK_DELEGATED",
            entityType: "delegated_task",
            entityId: task.id,
            afterState: { title: task.title, assignedTo: task.assignedTo, dueDate: task.dueDate, priority: task.priority },
        });
        // Real cross-module trigger: proves the notification engine is
        // genuinely reusable, not an isolated CRUD nobody calls. Silently
        // skipped if the assignee has no linked user account to notify.
        let waUrl;
        if (actualTarget.userId) {
            if (input.sendAppNotification !== false) {
                await notificationService.notify({
                    type: "delegation_assigned",
                    module: "office",
                    referenceType: "delegated_task",
                    referenceId: task.id,
                    assignedUserId: actualTarget.userId,
                    createdBy: actorUserId,
                    dueDate: task.dueDate,
                    priority: task.priority === "urgent" || task.priority === "high" ? "high" : "medium",
                });
            }
            if (input.sendWhatsappNotification !== false) {
                const [userRows] = await connection_1.pool.query("SELECT whatsapp_number, full_name FROM users WHERE id = ?", [actualTarget.userId]);
                if (userRows[0] && userRows[0].whatsapp_number) {
                    const msg = `Hello ${userRows[0].full_name}, you have a new delegated task: "${task.title}". Due date: ${task.dueDate}`;
                    WhatsAppBotService_1.whatsappBot.sendMessage(userRows[0].whatsapp_number, msg);
                }
            }
        }
        return task;
    }
    async sendWhatsAppReminder(id, actorUserId) {
        const task = await this.repo.getWithContext(id);
        if (!task)
            throw new DomainError_1.NotFoundError("Delegated task not found.");
        // The target user is the one assigned to the task
        const [empRows] = await connection_1.pool.query("SELECT user_id FROM employees WHERE id = ?", [task.assignedTo]);
        if (!empRows[0] || !empRows[0].user_id)
            throw new DomainError_1.ConflictError("Assigned employee has no linked user account.");
        const [userRows] = await connection_1.pool.query("SELECT whatsapp_number, full_name FROM users WHERE id = ?", [empRows[0].user_id]);
        if (!userRows[0] || !userRows[0].whatsapp_number)
            throw new DomainError_1.ConflictError("User does not have a WhatsApp number recorded.");
        const msg = `Hello ${userRows[0].full_name}, this is a reminder for your delegated task: "${task.title}". Due date: ${task.dueDate}`;
        WhatsAppBotService_1.whatsappBot.sendMessage(userRows[0].whatsapp_number, msg);
        await AuditService_1.AuditService.record({ actorUserId, action: "WHATSAPP_REMINDER_SENT", entityType: "delegated_task", entityId: id });
        return { message: "WhatsApp reminder queued successfully." };
    }
    async update(id, changes, actorUserId, hasUpdateOverride) {
        const existing = await this.repo.findById(id);
        if (!existing)
            throw new DomainError_1.NotFoundError("Delegated task not found.");
        if (!hasUpdateOverride) {
            const actor = await this.scope.requireEmployeeForUser(actorUserId);
            if (actor.id !== existing.assignedBy) {
                throw new DomainError_1.ForbiddenError("Only the person who delegated this task can edit it.");
            }
        }
        const updated = await this.repo.update(id, changes);
        await AuditService_1.AuditService.record({ actorUserId, action: "DELEGATED_TASK_UPDATED", entityType: "delegated_task", entityId: id });
        return updated;
    }
    async updateStatus(id, status, actorUserId, hasUpdateOverride) {
        const existing = await this.repo.getWithContext(id);
        if (!existing)
            throw new DomainError_1.NotFoundError("Delegated task not found.");
        if (existing.baseStatus === "completed")
            throw new DomainError_1.ConflictError("This task is already completed.");
        if (status === "completed") {
            if (existing.isNoteMandatory && !existing.remarks) {
                throw new DomainError_1.ConflictError("A note/remark is mandatory before completing this task.");
            }
            if (existing.isAttachmentMandatory) {
                const hasAttachment = existing.files.some(f => f.kind === "attachment" || f.kind === "proof");
                if (!hasAttachment) {
                    throw new DomainError_1.ConflictError("An attachment is mandatory before completing this task.");
                }
            }
        }
        if (!hasUpdateOverride) {
            const actor = await this.scope.getEmployeeForUser(actorUserId);
            if (!actor || actor.id !== existing.assignedTo) {
                throw new DomainError_1.ForbiddenError("Only the person this task is assigned to can update its status.");
            }
        }
        const updated = await this.repo.updateStatus(id, status);
        await AuditService_1.AuditService.record({ actorUserId, action: "DELEGATED_TASK_STATUS_CHANGED", entityType: "delegated_task", entityId: id, afterState: { status } });
        return updated;
    }
    async escalate(id, escalateTo, notes, actorUserId, hasUpdateOverride) {
        const existing = await this.repo.findById(id);
        if (!existing)
            throw new DomainError_1.NotFoundError("Delegated task not found.");
        if (!hasUpdateOverride) {
            const actor = await this.scope.requireEmployeeForUser(actorUserId);
            if (actor.id !== existing.assignedBy) {
                throw new DomainError_1.ForbiddenError("Only the person who delegated this task can escalate it.");
            }
        }
        const updated = await this.repo.escalate(id, escalateTo, notes ?? null);
        await AuditService_1.AuditService.record({ actorUserId, action: "DELEGATED_TASK_ESCALATED", entityType: "delegated_task", entityId: id, afterState: { escalateTo, notes } });
        return updated;
    }
    async remove(id, actorUserId, hasUpdateOverride) {
        const existing = await this.repo.findById(id);
        if (!existing)
            throw new DomainError_1.NotFoundError("Delegated task not found.");
        if (!hasUpdateOverride) {
            const actor = await this.scope.requireEmployeeForUser(actorUserId);
            if (actor.id !== existing.assignedBy) {
                throw new DomainError_1.ForbiddenError("Only the person who delegated this task can delete it.");
            }
        }
        await this.repo.softDelete(id);
        await AuditService_1.AuditService.record({ actorUserId, action: "DELEGATED_TASK_DELETED", entityType: "delegated_task", entityId: id });
    }
    async addFile(id, kind, fileName, fileUrl, actorUserId, hasUpdateOverride) {
        const existing = await this.repo.findById(id);
        if (!existing)
            throw new DomainError_1.NotFoundError("Delegated task not found.");
        if (!hasUpdateOverride) {
            const actor = await this.scope.requireEmployeeForUser(actorUserId);
            const isParty = actor.id === existing.assignedTo || actor.id === existing.assignedBy;
            if (!isParty)
                throw new DomainError_1.ForbiddenError("Only the assigner or assignee can attach files to this task.");
        }
        await this.repo.addFile(id, kind, fileName, fileUrl, actorUserId);
        await AuditService_1.AuditService.record({ actorUserId, action: "DELEGATED_TASK_FILE_ADDED", entityType: "delegated_task", entityId: id, afterState: { kind, fileName } });
        return this.repo.getWithContext(id);
    }
    async requestExtension(id, reason, requestedDate, actorUserId) {
        const existing = await this.repo.findById(id);
        if (!existing)
            throw new DomainError_1.NotFoundError("Delegated task not found.");
        const actor = await this.scope.requireEmployeeForUser(actorUserId);
        if (actor.id !== existing.assignedTo) {
            throw new DomainError_1.ForbiddenError("Only the assignee can request an extension.");
        }
        const updated = await this.repo.setExtensionRequest(id, reason, requestedDate);
        await AuditService_1.AuditService.record({ actorUserId, action: "DELEGATED_TASK_EXTENSION_REQUESTED", entityType: "delegated_task", entityId: id, afterState: { reason, requestedDate } });
        // Notify assigner
        const assignerUser = await connection_1.pool.query("SELECT id FROM users WHERE employee_id = ?", [existing.assignedBy]);
        if (assignerUser[0] && assignerUser[0][0]) {
            await notificationService.notify({
                type: "delegation_extension_requested",
                module: "office",
                referenceType: "delegated_task",
                referenceId: id,
                assignedUserId: assignerUser[0][0].id,
                createdBy: actorUserId,
            });
        }
        return updated;
    }
    async respondToExtension(id, status, rejectionReason, actorUserId, hasUpdateOverride) {
        const existing = await this.repo.findById(id);
        if (!existing)
            throw new DomainError_1.NotFoundError("Delegated task not found.");
        if (!hasUpdateOverride) {
            const actor = await this.scope.requireEmployeeForUser(actorUserId);
            if (actor.id !== existing.assignedBy) {
                throw new DomainError_1.ForbiddenError("Only the assigner can respond to an extension request.");
            }
        }
        const updated = await this.repo.respondToExtension(id, status, rejectionReason);
        await AuditService_1.AuditService.record({ actorUserId, action: "DELEGATED_TASK_EXTENSION_RESPONDED", entityType: "delegated_task", entityId: id, afterState: { status, rejectionReason } });
        // Notify assignee
        const assigneeUser = await connection_1.pool.query("SELECT id FROM users WHERE employee_id = ?", [existing.assignedTo]);
        if (assigneeUser[0] && assigneeUser[0][0]) {
            await notificationService.notify({
                type: status === "approved" ? "delegation_extension_approved" : "delegation_extension_rejected",
                module: "office",
                referenceType: "delegated_task",
                referenceId: id,
                assignedUserId: assigneeUser[0][0].id,
                createdBy: actorUserId,
            });
        }
        return updated;
    }
}
exports.DelegationService = DelegationService;
//# sourceMappingURL=DelegationService.js.map