"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.MySqlNotificationRepository = void 0;
const uuid_1 = require("uuid");
const connection_1 = require("../../../../infrastructure/database/mysql/connection");
function mapTemplate(row) {
    return {
        id: row.id, notificationType: row.notification_type, module: row.module,
        defaultTitle: row.default_title, defaultDescription: row.default_description,
        defaultPriority: row.default_priority, defaultActionLabel: row.default_action_label, status: row.status,
    };
}
function mapNotification(row) {
    return {
        id: row.id, notificationType: row.notification_type, module: row.module,
        referenceType: row.reference_type, referenceId: row.reference_id,
        title: row.title, description: row.description, priority: row.priority,
        assignedUserId: row.assigned_user_id, createdBy: row.created_by, dueDate: row.due_date,
        status: row.status, isRead: !!row.is_read, readAt: row.read_at,
        actionLabel: row.action_label, actionUrl: row.action_url,
        escalationLevel: row.escalation_level, lastEscalatedAt: row.last_escalated_at,
        parentNotificationId: row.parent_notification_id, createdAt: row.created_at, updatedAt: row.updated_at,
    };
}
function mapEscalationRule(row) {
    return { id: row.id, level: row.level, levelLabel: row.level_label, targetRoleId: row.target_role_id, escalateAfterHours: row.escalate_after_hours };
}
class MySqlNotificationRepository {
    async listTemplates() {
        const [rows] = await connection_1.pool.query("SELECT * FROM notification_templates ORDER BY module, notification_type");
        return rows.map(mapTemplate);
    }
    async findTemplateByType(type) {
        const [rows] = await connection_1.pool.query("SELECT * FROM notification_templates WHERE notification_type = ?", [type]);
        return rows[0] ? mapTemplate(rows[0]) : null;
    }
    async updateTemplate(id, changes) {
        const fields = [];
        const values = [];
        if (changes.defaultTitle !== undefined) {
            fields.push("default_title = ?");
            values.push(changes.defaultTitle);
        }
        if (changes.defaultDescription !== undefined) {
            fields.push("default_description = ?");
            values.push(changes.defaultDescription);
        }
        if (changes.defaultPriority !== undefined) {
            fields.push("default_priority = ?");
            values.push(changes.defaultPriority);
        }
        if (changes.defaultActionLabel !== undefined) {
            fields.push("default_action_label = ?");
            values.push(changes.defaultActionLabel);
        }
        if (changes.status !== undefined) {
            fields.push("status = ?");
            values.push(changes.status);
        }
        if (fields.length > 0) {
            values.push(id);
            await connection_1.pool.query(`UPDATE notification_templates SET ${fields.join(", ")} WHERE id = ?`, values);
        }
        const [rows] = await connection_1.pool.query("SELECT * FROM notification_templates WHERE id = ?", [id]);
        return mapTemplate(rows[0]);
    }
    async listEscalationRules() {
        const [rows] = await connection_1.pool.query("SELECT * FROM escalation_rules ORDER BY level ASC");
        return rows.map(mapEscalationRule);
    }
    async updateEscalationRule(level, changes) {
        const fields = [];
        const values = [];
        if (changes.targetRoleId !== undefined) {
            fields.push("target_role_id = ?");
            values.push(changes.targetRoleId);
        }
        if (changes.escalateAfterHours !== undefined) {
            fields.push("escalate_after_hours = ?");
            values.push(changes.escalateAfterHours);
        }
        if (fields.length > 0) {
            values.push(level);
            await connection_1.pool.query(`UPDATE escalation_rules SET ${fields.join(", ")} WHERE level = ?`, values);
        }
        const [rows] = await connection_1.pool.query("SELECT * FROM escalation_rules WHERE level = ?", [level]);
        return mapEscalationRule(rows[0]);
    }
    async create(data) {
        const id = data.id || (0, uuid_1.v4)();
        await connection_1.pool.query(`INSERT INTO notifications
         (id, notification_type, module, reference_type, reference_id, title, description, priority,
          assigned_user_id, created_by, due_date, action_label, action_url, parent_notification_id, escalation_level)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`, [
            id, data.notificationType, data.module, data.referenceType ?? null, data.referenceId ?? null,
            data.title, data.description ?? null, data.priority, data.assignedUserId, data.createdBy ?? null,
            data.dueDate ?? null, data.actionLabel ?? null, data.actionUrl ?? null,
            data.parentNotificationId ?? null, data.escalationLevel ?? 1,
        ]);
        return (await this.findById(id));
    }
    async list(params) {
        const offset = (params.page - 1) * params.pageSize;
        const conditions = [];
        const values = [];
        if (params.assignedUserId) {
            conditions.push("assigned_user_id = ?");
            values.push(params.assignedUserId);
        }
        if (params.status) {
            conditions.push("status = ?");
            values.push(params.status);
        }
        if (params.isRead !== undefined) {
            conditions.push("is_read = ?");
            values.push(params.isRead);
        }
        if (params.module) {
            conditions.push("module = ?");
            values.push(params.module);
        }
        if (params.priority) {
            conditions.push("priority = ?");
            values.push(params.priority);
        }
        const whereClause = conditions.length > 0 ? `WHERE ${conditions.join(" AND ")}` : "";
        const [rows] = await connection_1.pool.query(`SELECT * FROM notifications ${whereClause} ORDER BY created_at DESC LIMIT ? OFFSET ?`, [...values, params.pageSize, offset]);
        const [countRows] = await connection_1.pool.query(`SELECT COUNT(*) as total FROM notifications ${whereClause}`, values);
        return { items: rows.map(mapNotification), total: countRows[0].total };
    }
    async findById(id) {
        const [rows] = await connection_1.pool.query("SELECT * FROM notifications WHERE id = ?", [id]);
        return rows[0] ? mapNotification(rows[0]) : null;
    }
    async countUnread(assignedUserId) {
        const [rows] = await connection_1.pool.query("SELECT COUNT(*) as total FROM notifications WHERE assigned_user_id = ? AND is_read = 0 AND status = 'pending'", [assignedUserId]);
        return Number(rows[0].total);
    }
    async markRead(id) {
        await connection_1.pool.query("UPDATE notifications SET is_read = 1, read_at = NOW() WHERE id = ?", [id]);
        return (await this.findById(id));
    }
    async markAllRead(assignedUserId) {
        const [result] = await connection_1.pool.query("UPDATE notifications SET is_read = 1, read_at = NOW() WHERE assigned_user_id = ? AND is_read = 0", [assignedUserId]);
        return result.affectedRows;
    }
    async updateStatus(id, status) {
        await connection_1.pool.query("UPDATE notifications SET status = ? WHERE id = ?", [status, id]);
        return (await this.findById(id));
    }
    async bumpEscalation(id, newLevel) {
        await connection_1.pool.query("UPDATE notifications SET escalation_level = ?, last_escalated_at = NOW() WHERE id = ?", [newLevel, id]);
    }
    async listPendingUnescalatedOlderThan(level, hours) {
        const [rows] = await connection_1.pool.query(`SELECT * FROM notifications
       WHERE status = 'pending' AND is_read = 0 AND escalation_level = ?
         AND created_at <= DATE_SUB(NOW(), INTERVAL ? HOUR)`, [level, hours]);
        return rows.map(mapNotification);
    }
    async recordDelivery(notificationId, channel, status) {
        await connection_1.pool.query("INSERT INTO notification_deliveries (id, notification_id, channel, delivery_status) VALUES (?, ?, ?, ?)", [(0, uuid_1.v4)(), notificationId, channel, status]);
    }
}
exports.MySqlNotificationRepository = MySqlNotificationRepository;
//# sourceMappingURL=MySqlNotificationRepository.js.map