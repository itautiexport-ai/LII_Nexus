"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.EscalationEngineService = void 0;
const uuid_1 = require("uuid");
const connection_1 = require("../../../../infrastructure/database/mysql/connection");
const AuditService_1 = require("../../../../shared/services/AuditService");
/**
 * On-demand "scheduler" - there is no cron/job runner in this stack (the
 * same documented tradeoff as checklist instance generation). Calling
 * runCheck() computes and applies whatever escalations are currently due,
 * exactly as if a scheduled job had just fired. It's meant to be triggered
 * either by an admin action or opportunistically whenever the Notification
 * Center loads.
 *
 * Escalating a notification never mutates the original - it creates a NEW
 * notification for the resolved recipient, linked back via
 * parentNotificationId, and bumps the ORIGINAL's escalation_level so it
 * isn't re-escalated at the same level next run. If a level's recipient
 * can't be resolved (no configured role, or no manager on file), the
 * original is left un-bumped so it keeps retrying harmlessly on every
 * future run until an admin configures that level properly - it does not
 * silently give up.
 */
class EscalationEngineService {
    constructor(repo) {
        this.repo = repo;
    }
    async resolveManagerUserId(assignedUserId) {
        const [rows] = await connection_1.pool.query(`SELECT mgr.user_id AS manager_user_id
       FROM employees e
       JOIN employees mgr ON mgr.id = e.manager_id
       WHERE e.user_id = ?`, [assignedUserId]);
        return rows[0]?.manager_user_id ?? null;
    }
    async resolveRoleUserId(roleId) {
        const [rows] = await connection_1.pool.query(`SELECT u.id FROM users u
       JOIN user_roles ur ON ur.user_id = u.id
       WHERE ur.role_id = ? AND u.status = 'active'
       LIMIT 1`, [roleId]);
        return rows[0]?.id ?? null;
    }
    async runCheck() {
        const rules = await this.repo.listEscalationRules();
        const results = [];
        for (const rule of rules) {
            const candidates = await this.repo.listPendingUnescalatedOlderThan(rule.level - 1, rule.escalateAfterHours);
            let escalated = 0;
            let skippedUnresolved = 0;
            for (const notification of candidates) {
                const recipientUserId = rule.targetRoleId
                    ? await this.resolveRoleUserId(rule.targetRoleId)
                    : rule.level === 2
                        ? await this.resolveManagerUserId(notification.assignedUserId)
                        : null;
                if (!recipientUserId) {
                    skippedUnresolved++;
                    continue;
                }
                await this.repo.create({
                    id: (0, uuid_1.v4)(),
                    notificationType: notification.notificationType,
                    module: notification.module,
                    referenceType: notification.referenceType,
                    referenceId: notification.referenceId,
                    title: `[Escalated - Level ${rule.level}: ${rule.levelLabel.toUpperCase()}] ${notification.title}`,
                    description: notification.description,
                    priority: "urgent",
                    assignedUserId: recipientUserId,
                    createdBy: null,
                    dueDate: notification.dueDate,
                    actionLabel: notification.actionLabel,
                    actionUrl: notification.actionUrl,
                    parentNotificationId: notification.id,
                    escalationLevel: rule.level,
                });
                await this.repo.bumpEscalation(notification.id, rule.level);
                escalated++;
            }
            results.push({ level: rule.level, candidatesChecked: candidates.length, escalated, skippedUnresolved });
        }
        await AuditService_1.AuditService.record({ actorUserId: null, action: "NOTIFICATION_ESCALATION_CHECK_RUN", entityType: "notification", entityId: null, afterState: { results } });
        return results;
    }
}
exports.EscalationEngineService = EscalationEngineService;
//# sourceMappingURL=EscalationEngineService.js.map