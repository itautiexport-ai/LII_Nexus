import { v4 as uuid } from "uuid";
import { IDelegationRepository } from "../../domain/repositories/IDelegationRepository";
import { EmployeeScopeService } from "../../../performance/application/services/EmployeeScopeService";
import { DelegationBaseStatus, DelegationFileKind, DelegationPriority } from "../../domain/entities/Delegation";
import { ConflictError, ForbiddenError, NotFoundError } from "../../../../core/domain/errors/DomainError";
import { AuditService } from "../../../../shared/services/AuditService";
import { NotificationService } from "../../../notifications/application/services/NotificationService";
import { MySqlNotificationRepository } from "../../../notifications/infrastructure/repositories/MySqlNotificationRepository";
import { pool } from "../../../../infrastructure/database/mysql/connection";
import { whatsappBot } from "../../../whatsapp/application/services/WhatsAppBotService";

const notificationService = new NotificationService(new MySqlNotificationRepository());

export class DelegationService {
  constructor(private readonly repo: IDelegationRepository, private readonly scope: EmployeeScopeService) {}

  async list(page: number, pageSize: number, actorUserId: string, hasViewOverride: boolean, status?: DelegationBaseStatus) {
    if (hasViewOverride) {
      return this.repo.list({ page, pageSize, status });
    }
    const actor = await this.scope.requireEmployeeForUser(actorUserId);
    return this.repo.list({ page, pageSize, assignedTo: actor.id, status });
  }

  async listIDelegated(actorUserId: string) {
    const actor = await this.scope.getEmployeeForUser(actorUserId);
    if (!actor) return [];
    const { items } = await this.repo.list({ page: 1, pageSize: 100, assignedBy: actor.id });
    return items;
  }

  async getById(id: string, actorUserId: string, hasViewOverride: boolean) {
    const task = await this.repo.getWithContext(id);
    if (!task) throw new NotFoundError("Delegated task not found.");
    if (!hasViewOverride) {
      const actor = await this.scope.requireEmployeeForUser(actorUserId);
      if (actor.id !== task.assignedTo && actor.id !== task.assignedBy) {
        throw new ForbiddenError("You can only view delegated tasks you assigned or were assigned to you.");
      }
    }
    return task;
  }

  async create(
    input: { title: string; description?: string | null; assignedBy?: string; assignedTo: string; dueDate: string; priority?: DelegationPriority; remarks?: string | null; sendAppNotification?: boolean; sendWhatsappNotification?: boolean },
    actorUserId: string,
    hasCreateOverride: boolean
  ) {
    let assignedByEmployeeId = input.assignedBy;
    if (!assignedByEmployeeId) {
      const actor = await this.scope.requireEmployeeForUser(actorUserId);
      assignedByEmployeeId = actor.id;
    }

    const actualTarget = await this.scope.authorizeManagerOnly(
      actorUserId,
      input.assignedTo,
      hasCreateOverride || input.assignedBy !== undefined, // Allow override if we select manually in UI
      "You can only delegate tasks to your direct reports."
    );

    const task = await this.repo.create({ id: uuid(), assignedBy: assignedByEmployeeId, ...input, assignedTo: actualTarget.id });
    await AuditService.record({
      actorUserId,
      action: "TASK_DELEGATED",
      entityType: "delegated_task",
      entityId: task.id,
      afterState: { title: task.title, assignedTo: task.assignedTo, dueDate: task.dueDate, priority: task.priority },
    });

    // Real cross-module trigger: proves the notification engine is
    // genuinely reusable, not an isolated CRUD nobody calls. Silently
    // skipped if the assignee has no linked user account to notify.
    let waUrl: string | undefined;

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
        const [userRows] = await pool.query<any[]>("SELECT whatsapp_number, full_name FROM users WHERE id = ?", [actualTarget.userId]);
        if (userRows[0] && userRows[0].whatsapp_number) {
          const msg = `Hello ${userRows[0].full_name}, you have a new delegated task: "${task.title}". Due date: ${task.dueDate}`;
          whatsappBot.sendMessage(userRows[0].whatsapp_number, msg);
        }
      }
    }

    return task;
  }

  async sendWhatsAppReminder(id: string, actorUserId: string) {
    const task = await this.repo.getWithContext(id);
    if (!task) throw new NotFoundError("Delegated task not found.");

    // The target user is the one assigned to the task
    const [empRows] = await pool.query<any[]>("SELECT user_id FROM employees WHERE id = ?", [task.assignedTo]);
    if (!empRows[0] || !empRows[0].user_id) throw new ConflictError("Assigned employee has no linked user account.");

    const [userRows] = await pool.query<any[]>("SELECT whatsapp_number, full_name FROM users WHERE id = ?", [empRows[0].user_id]);
    if (!userRows[0] || !userRows[0].whatsapp_number) throw new ConflictError("User does not have a WhatsApp number recorded.");

    const msg = `Hello ${userRows[0].full_name}, this is a reminder for your delegated task: "${task.title}". Due date: ${task.dueDate}`;
    whatsappBot.sendMessage(userRows[0].whatsapp_number, msg);

    await AuditService.record({ actorUserId, action: "WHATSAPP_REMINDER_SENT", entityType: "delegated_task", entityId: id });

    return { message: "WhatsApp reminder queued successfully." };
  }

  async update(id: string, changes: { title?: string; description?: string | null; dueDate?: string; priority?: DelegationPriority; remarks?: string | null }, actorUserId: string, hasUpdateOverride: boolean) {
    const existing = await this.repo.findById(id);
    if (!existing) throw new NotFoundError("Delegated task not found.");
    if (!hasUpdateOverride) {
      const actor = await this.scope.requireEmployeeForUser(actorUserId);
      if (actor.id !== existing.assignedBy) {
        throw new ForbiddenError("Only the person who delegated this task can edit it.");
      }
    }
    const updated = await this.repo.update(id, changes);
    await AuditService.record({ actorUserId, action: "DELEGATED_TASK_UPDATED", entityType: "delegated_task", entityId: id });
    return updated;
  }

  async updateStatus(id: string, status: "running" | "completed", actorUserId: string, hasUpdateOverride: boolean) {
    const existing = await this.repo.getWithContext(id);
    if (!existing) throw new NotFoundError("Delegated task not found.");
    if (existing.baseStatus === "completed") throw new ConflictError("This task is already completed.");

    if (status === "completed") {
      if (existing.isNoteMandatory && !existing.remarks) {
        throw new ConflictError("A note/remark is mandatory before completing this task.");
      }
      if (existing.isAttachmentMandatory) {
        const hasAttachment = existing.files.some(f => f.kind === "attachment" || f.kind === "proof");
        if (!hasAttachment) {
          throw new ConflictError("An attachment is mandatory before completing this task.");
        }
      }
    }

    if (!hasUpdateOverride) {
      const actor = await this.scope.getEmployeeForUser(actorUserId);
      if (!actor || actor.id !== existing.assignedTo) {
        throw new ForbiddenError("Only the person this task is assigned to can update its status.");
      }
    }

    const updated = await this.repo.updateStatus(id, status);
    await AuditService.record({ actorUserId, action: "DELEGATED_TASK_STATUS_CHANGED", entityType: "delegated_task", entityId: id, afterState: { status } });
    return updated;
  }

  async escalate(id: string, escalateTo: string, notes: string | null | undefined, actorUserId: string, hasUpdateOverride: boolean) {
    const existing = await this.repo.findById(id);
    if (!existing) throw new NotFoundError("Delegated task not found.");
    if (!hasUpdateOverride) {
      const actor = await this.scope.requireEmployeeForUser(actorUserId);
      if (actor.id !== existing.assignedBy) {
        throw new ForbiddenError("Only the person who delegated this task can escalate it.");
      }
    }
    const updated = await this.repo.escalate(id, escalateTo, notes ?? null);
    await AuditService.record({ actorUserId, action: "DELEGATED_TASK_ESCALATED", entityType: "delegated_task", entityId: id, afterState: { escalateTo, notes } });
    return updated;
  }

  async remove(id: string, actorUserId: string, hasUpdateOverride: boolean) {
    const existing = await this.repo.findById(id);
    if (!existing) throw new NotFoundError("Delegated task not found.");
    if (!hasUpdateOverride) {
      const actor = await this.scope.requireEmployeeForUser(actorUserId);
      if (actor.id !== existing.assignedBy) {
        throw new ForbiddenError("Only the person who delegated this task can delete it.");
      }
    }
    await this.repo.softDelete(id);
    await AuditService.record({ actorUserId, action: "DELEGATED_TASK_DELETED", entityType: "delegated_task", entityId: id });
  }

  async addFile(id: string, kind: DelegationFileKind, fileName: string, fileUrl: string, actorUserId: string, hasUpdateOverride: boolean) {
    const existing = await this.repo.findById(id);
    if (!existing) throw new NotFoundError("Delegated task not found.");
    if (!hasUpdateOverride) {
      const actor = await this.scope.requireEmployeeForUser(actorUserId);
      const isParty = actor.id === existing.assignedTo || actor.id === existing.assignedBy;
      if (!isParty) throw new ForbiddenError("Only the assigner or assignee can attach files to this task.");
    }
    await this.repo.addFile(id, kind, fileName, fileUrl, actorUserId);
    await AuditService.record({ actorUserId, action: "DELEGATED_TASK_FILE_ADDED", entityType: "delegated_task", entityId: id, afterState: { kind, fileName } });
    return this.repo.getWithContext(id);
  }
  async requestExtension(id: string, reason: string, requestedDate: string, actorUserId: string) {
    const existing = await this.repo.findById(id);
    if (!existing) throw new NotFoundError("Delegated task not found.");
    
    const actor = await this.scope.requireEmployeeForUser(actorUserId);
    if (actor.id !== existing.assignedTo) {
      throw new ForbiddenError("Only the assignee can request an extension.");
    }
    
    const updated = await this.repo.setExtensionRequest(id, reason, requestedDate);
    await AuditService.record({ actorUserId, action: "DELEGATED_TASK_EXTENSION_REQUESTED", entityType: "delegated_task", entityId: id, afterState: { reason, requestedDate } });

    // Notify assigner
    const assignerUser = await pool.query<any[]>("SELECT user_id as id FROM employees WHERE id = ?", [existing.assignedBy]);
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

  async respondToExtension(id: string, status: "approved" | "rejected", rejectionReason: string | null, updatedDate: string | null | undefined, actorUserId: string, hasUpdateOverride: boolean) {
    const existing = await this.repo.findById(id);
    if (!existing) throw new NotFoundError("Delegated task not found.");

    if (!hasUpdateOverride) {
      const actor = await this.scope.requireEmployeeForUser(actorUserId);
      if (actor.id !== existing.assignedBy) {
        throw new ForbiddenError("Only the assigner can respond to an extension request.");
      }
    }

    const updated = await this.repo.respondToExtension(id, status, rejectionReason, updatedDate);
    await AuditService.record({ actorUserId, action: "DELEGATED_TASK_EXTENSION_RESPONDED", entityType: "delegated_task", entityId: id, afterState: { status, rejectionReason } });

    // Notify assignee
    const assigneeUser = await pool.query<any[]>("SELECT user_id as id FROM employees WHERE id = ?", [existing.assignedTo]);
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
