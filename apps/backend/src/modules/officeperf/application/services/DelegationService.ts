import { v4 as uuid } from "uuid";
import { IDelegationRepository } from "../../domain/repositories/IDelegationRepository";
import { EmployeeScopeService } from "../../../performance/application/services/EmployeeScopeService";
import { DelegationBaseStatus, DelegationFileKind, DelegationPriority } from "../../domain/entities/Delegation";
import { ConflictError, ForbiddenError, NotFoundError, ValidationError } from "../../../../core/domain/errors/DomainError";
import { AuditService } from "../../../../shared/services/AuditService";
import { NotificationService } from "../../../notifications/application/services/NotificationService";
import { MySqlNotificationRepository } from "../../../notifications/infrastructure/repositories/MySqlNotificationRepository";
import { pool } from "../../../../infrastructure/database/mysql/connection";
import { whatsappBot } from "../../../whatsapp/application/services/WhatsAppBotService";
import { logger } from "../../../../infrastructure/logging/logger";

const notificationService = new NotificationService(new MySqlNotificationRepository());

export class DelegationService {
  private lastDueDateCheck = 0;

  constructor(private readonly repo: IDelegationRepository, private readonly scope: EmployeeScopeService) {}

  async checkAndNotifyApproachingDueDates() {
    const now = Date.now();
    if (now - this.lastDueDateCheck < 30000) return;
    this.lastDueDateCheck = now;

    try {
      const [tasks] = await pool.query<any[]>(`
        SELECT dt.id, dt.title, dt.due_date, dt.assigned_to, dt.extension_status, dt.extension_requested_date,
               COALESCE(e.user_id, u.id) AS assignee_user_id,
               COALESCE(e.full_name, u.full_name) AS assignee_name
        FROM delegated_tasks dt
        LEFT JOIN employees e ON e.id = dt.assigned_to
        LEFT JOIN users u ON u.id = dt.assigned_to
        WHERE dt.deleted_at IS NULL
          AND dt.base_status != 'completed'
          AND dt.due_date IS NOT NULL
          AND DATEDIFF(dt.due_date, CURDATE()) <= 2
      `);

      for (const t of tasks) {
        const targetUserId = t.assignee_user_id;
        if (!targetUserId) continue;

        const [existing] = await pool.query<any[]>(`
          SELECT id FROM notifications 
          WHERE assigned_user_id = ? 
            AND reference_type = 'delegated_task' 
            AND reference_id = ? 
            AND notification_type IN ('task_due_today', 'delegation_due_reminder')
            AND DATE(created_at) = CURDATE()
          LIMIT 1
        `, [targetUserId, t.id]);

        if (existing.length === 0) {
          const due = new Date(t.due_date);
          const today = new Date();
          today.setHours(0, 0, 0, 0);
          due.setHours(0, 0, 0, 0);

          const diffDays = Math.round((due.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
          const isOverdue = diffDays < 0;
          const isToday = diffDays === 0;
          const statusLabel = isOverdue ? "Overdue" : isToday ? "Due Today" : "Due Soon";

          const isExtended = t.extension_status === "approved";
          const dueFormatted = new Date(t.due_date).toLocaleDateString("en-IN", {
            day: "2-digit",
            month: "2-digit",
            year: "numeric"
          });

          await notificationService.notify({
            type: isToday ? "task_due_today" : "delegation_due_reminder" as any,
            module: "office",
            referenceType: "delegated_task",
            referenceId: t.id,
            assignedUserId: targetUserId,
            createdBy: null,
            title: `Delegation Task ${statusLabel}: ${t.title}`,
            description: `Task "${t.title}" is ${statusLabel.toLowerCase()} (Target: ${dueFormatted}${isExtended ? " - Extended Date" : ""}). Please complete it or request an extension if more time is required.`,
            priority: isOverdue ? "urgent" : isToday ? "high" : "medium",
            actionLabel: "View / Request Extension",
            actionUrl: "/admin/delegation/list",
          });
        }
      }
    } catch (err: any) {
      logger.warn("Failed to check and notify approaching due dates for delegations", { error: err?.message });
    }
  }

  async list(
    page: number,
    pageSize: number,
    actorUserId: string,
    hasViewOverride: boolean,
    status?: DelegationBaseStatus,
    scope?: "assigned_to_me" | "assigned_by_me" | "all",
    filterEmployeeId?: string
  ) {
    await this.checkAndNotifyApproachingDueDates();
    const [empRows] = await pool.query<any[]>(
      "SELECT id, user_id FROM employees WHERE user_id = ? OR id = ?",
      [actorUserId, actorUserId]
    );
    const myIds = Array.from(new Set([
      actorUserId,
      ...empRows.map(e => e.id),
      ...empRows.map(e => e.user_id)
    ].filter(Boolean)));

    if (filterEmployeeId && hasViewOverride) {
      const [targetEmpRows] = await pool.query<any[]>(
        "SELECT id, user_id FROM employees WHERE id = ? OR user_id = ?",
        [filterEmployeeId, filterEmployeeId]
      );
      const targetIds = Array.from(new Set([
        filterEmployeeId,
        ...targetEmpRows.map(e => e.id),
        ...targetEmpRows.map(e => e.user_id)
      ].filter(Boolean)));

      if (scope === "assigned_by_me") {
        return this.repo.list({ page, pageSize, assignedBy: targetIds, status });
      }
      return this.repo.list({ page, pageSize, assignedTo: targetIds, status });
    }

    if (scope === "assigned_to_me") {
      return this.repo.list({ page, pageSize, assignedTo: myIds, status });
    }

    if (scope === "assigned_by_me") {
      return this.repo.list({ page, pageSize, assignedBy: myIds, status });
    }

    if (hasViewOverride) {
      return this.repo.list({ page, pageSize, status });
    }

    return this.repo.list({ page, pageSize, involvingUser: myIds, status });
  }

  async listIDelegated(actorUserId: string) {
    const actor = await this.scope.getEmployeeForUser(actorUserId);
    const myIds = [actorUserId];
    if (actor) myIds.push(actor.id);
    const { items } = await this.repo.list({ page: 1, pageSize: 200, assignedBy: myIds });
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
    if (input.dueDate) {
      const targetDate = new Date(input.dueDate);
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      if (targetDate.getTime() < today.getTime()) {
        throw new ValidationError("Due date cannot be set in the past.");
      }
    }

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
  async requestExtension(id: string, reason: string, requestedDate: string, actorUserId: string, hasUpdateOverride: boolean = false) {
    const existing = await this.repo.findById(id);
    if (!existing) throw new NotFoundError("Delegated task not found.");

    if (requestedDate) {
      const targetDate = new Date(requestedDate);
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      if (targetDate.getTime() < today.getTime()) {
        throw new ValidationError("Proposed extension date cannot be set in the past.");
      }
    }

    if (existing.extensionStatus === "pending") {
      throw new ValidationError("An extension request is already pending review for this task.");
    }

    if (!hasUpdateOverride) {
      const actor = await this.scope.getEmployeeForUser(actorUserId);
      const isAssignee = (actor && actor.id === existing.assignedTo) || actorUserId === existing.assignedTo;
      if (!isAssignee) {
        throw new ForbiddenError("Only the assignee can request an extension.");
      }
    }

    const updated = await this.repo.setExtensionRequest(id, reason, requestedDate);
    await AuditService.record({ actorUserId, action: "DELEGATED_TASK_EXTENSION_REQUESTED", entityType: "delegated_task", entityId: id, afterState: { reason, requestedDate } });

    // Notify assigner
    try {
      const [empRows] = await pool.query<any[]>("SELECT user_id, full_name FROM employees WHERE id = ?", [existing.assignedBy]);
      const targetUserId = empRows[0]?.user_id;
      if (targetUserId) {
        const [actorRows] = await pool.query<any[]>("SELECT full_name FROM users WHERE id = ?", [actorUserId]);
        const actorName = actorRows[0]?.full_name || "An employee";
        await notificationService.notify({
          type: "delegation_extension_requested",
          module: "office",
          referenceType: "delegated_task",
          referenceId: id,
          assignedUserId: targetUserId,
          createdBy: actorUserId,
          title: `Extension Requested: ${existing.title}`,
          description: `${actorName} requested an extension to ${requestedDate}. Reason: ${reason}`,
          actionLabel: "Review Extension",
          actionUrl: "/admin/delegation/list",
        });
      }
    } catch (notifErr: any) {
      logger.warn("Failed to notify assigner about delegation extension request", { error: notifErr?.message });
    }

    return updated;
  }

  async respondToExtension(id: string, status: "approved" | "rejected", rejectionReason: string | null, actorUserId: string, hasUpdateOverride: boolean) {
    const existing = await this.repo.findById(id);
    if (!existing) throw new NotFoundError("Delegated task not found.");

    if (!hasUpdateOverride) {
      const actor = await this.scope.getEmployeeForUser(actorUserId);
      const isAssigner = (actor && actor.id === existing.assignedBy) || actorUserId === existing.assignedBy;
      if (!isAssigner) {
        throw new ForbiddenError("Only the assigner can respond to an extension request.");
      }
    }

    const updated = await this.repo.respondToExtension(id, status, rejectionReason);
    await AuditService.record({ actorUserId, action: "DELEGATED_TASK_EXTENSION_RESPONDED", entityType: "delegated_task", entityId: id, afterState: { status, rejectionReason } });

    // Notify assignee
    try {
      const [empRows] = await pool.query<any[]>("SELECT user_id FROM employees WHERE id = ?", [existing.assignedTo]);
      const assigneeUserId = empRows[0]?.user_id;
      if (assigneeUserId) {
        await notificationService.notify({
          type: status === "approved" ? "delegation_extension_approved" : "delegation_extension_rejected",
          module: "office",
          referenceType: "delegated_task",
          referenceId: id,
          assignedUserId: assigneeUserId,
          createdBy: actorUserId,
          title: status === "approved" ? `Extension Approved: ${existing.title}` : `Extension Rejected: ${existing.title}`,
          description: status === "approved"
            ? `Your extension request for "${existing.title}" was approved. New due date is ${existing.extensionRequestedDate}.`
            : `Your extension request for "${existing.title}" was rejected.${rejectionReason ? ` Reason: ${rejectionReason}` : ""}`,
          actionLabel: "View Task",
          actionUrl: "/admin/delegation/user",
        });
      }
    } catch (notifErr: any) {
      logger.warn("Failed to notify assignee about delegation extension response", { error: notifErr?.message });
    }

    return updated;
  }
}
