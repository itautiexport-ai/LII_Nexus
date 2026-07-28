"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.MySqlDelegationRepository = void 0;
const uuid_1 = require("uuid");
const connection_1 = require("../../../../infrastructure/database/mysql/connection");
function mapTask(row) {
    return {
        id: row.id,
        title: row.title,
        description: row.description,
        assignedBy: row.assigned_by,
        assignedTo: row.assigned_to,
        dueDate: row.due_date,
        priority: row.priority,
        baseStatus: row.base_status,
        isAttachmentMandatory: !!row.is_attachment_mandatory,
        isNoteMandatory: !!row.is_note_mandatory,
        remarks: row.remarks,
        escalatedTo: row.escalated_to,
        escalatedAt: row.escalated_at,
        escalationNotes: row.escalation_notes,
        startedAt: row.started_at,
        completedAt: row.completed_at,
        extensionStatus: row.extension_status || "none",
        extensionReason: row.extension_reason,
        extensionRequestedDate: row.extension_requested_date,
        extensionRejectionReason: row.extension_rejection_reason,
        createdAt: row.created_at,
        updatedAt: row.updated_at,
        deletedAt: row.deleted_at,
    };
}
const WITH_CONTEXT_SELECT = `
  SELECT dt.*, eb.full_name AS assigned_by_name, ea.full_name AS assigned_to_name, ee.full_name AS escalated_to_name
  FROM delegated_tasks dt
  JOIN employees eb ON eb.id = dt.assigned_by
  JOIN employees ea ON ea.id = dt.assigned_to
  LEFT JOIN employees ee ON ee.id = dt.escalated_to
`;
class MySqlDelegationRepository {
    async attachFiles(tasks) {
        if (tasks.length === 0)
            return tasks;
        const ids = tasks.map((t) => t.id);
        const placeholders = ids.map(() => "?").join(",");
        const [fileRows] = await connection_1.pool.query(`SELECT * FROM delegated_task_files WHERE task_id IN (${placeholders})`, ids);
        const filesByTask = new Map();
        for (const f of fileRows) {
            const list = filesByTask.get(f.task_id) ?? [];
            list.push({
                id: f.id, taskId: f.task_id, kind: f.kind, fileName: f.file_name,
                fileUrl: f.file_url, uploadedBy: f.uploaded_by, uploadedAt: f.uploaded_at,
            });
            filesByTask.set(f.task_id, list);
        }
        return tasks.map((t) => ({ ...t, files: filesByTask.get(t.id) ?? [] }));
    }
    async list(params) {
        const offset = (params.page - 1) * params.pageSize;
        const conditions = ["dt.deleted_at IS NULL"];
        const values = [];
        if (params.assignedTo) {
            conditions.push("dt.assigned_to = ?");
            values.push(params.assignedTo);
        }
        if (params.assignedBy) {
            conditions.push("dt.assigned_by = ?");
            values.push(params.assignedBy);
        }
        if (params.status) {
            conditions.push("dt.base_status = ?");
            values.push(params.status);
        }
        const whereClause = `WHERE ${conditions.join(" AND ")}`;
        const [rows] = await connection_1.pool.query(`${WITH_CONTEXT_SELECT} ${whereClause} ORDER BY dt.due_date ASC LIMIT ? OFFSET ?`, [...values, params.pageSize, offset]);
        const [countRows] = await connection_1.pool.query(`SELECT COUNT(*) as total FROM delegated_tasks dt ${whereClause}`, values);
        const items = rows.map((r) => ({ ...mapTask(r), assignedByName: r.assigned_by_name, assignedToName: r.assigned_to_name, escalatedToName: r.escalated_to_name, files: [] }));
        return { items: await this.attachFiles(items), total: countRows[0].total };
    }
    async findById(id) {
        const [rows] = await connection_1.pool.query("SELECT * FROM delegated_tasks WHERE id = ? AND deleted_at IS NULL", [id]);
        return rows[0] ? mapTask(rows[0]) : null;
    }
    async getWithContext(id) {
        const [rows] = await connection_1.pool.query(`${WITH_CONTEXT_SELECT} WHERE dt.id = ? AND dt.deleted_at IS NULL`, [id]);
        if (!rows[0])
            return null;
        const r = rows[0];
        const item = { ...mapTask(r), assignedByName: r.assigned_by_name, assignedToName: r.assigned_to_name, escalatedToName: r.escalated_to_name, files: [] };
        return (await this.attachFiles([item]))[0];
    }
    async create(data) {
        const id = data.id || (0, uuid_1.v4)();
        const now = new Date();
        await connection_1.pool.query(`INSERT INTO delegated_tasks (
        id, title, description, assigned_by, assigned_to, due_date, priority, base_status, is_attachment_mandatory, is_note_mandatory, remarks, created_at, updated_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`, [
            id, data.title, data.description ?? null, data.assignedBy, data.assignedTo,
            data.dueDate, data.priority ?? "medium", data.baseStatus ?? "pending", data.isAttachmentMandatory ? 1 : 0, data.isNoteMandatory ? 1 : 0, data.remarks ?? null,
            now, now
        ]);
        return (await this.findById(id));
    }
    async update(id, changes) {
        const fields = [];
        const values = [];
        if (changes.title !== undefined) {
            fields.push("title = ?");
            values.push(changes.title);
        }
        if (changes.description !== undefined) {
            fields.push("description = ?");
            values.push(changes.description);
        }
        if (changes.dueDate !== undefined) {
            fields.push("due_date = ?");
            values.push(changes.dueDate);
        }
        if (changes.priority !== undefined) {
            fields.push("priority = ?");
            values.push(changes.priority);
        }
        if (changes.isAttachmentMandatory !== undefined) {
            fields.push("is_attachment_mandatory = ?");
            values.push(changes.isAttachmentMandatory ? 1 : 0);
        }
        if (changes.isNoteMandatory !== undefined) {
            fields.push("is_note_mandatory = ?");
            values.push(changes.isNoteMandatory ? 1 : 0);
        }
        if (changes.remarks !== undefined) {
            fields.push("remarks = ?");
            values.push(changes.remarks);
        }
        if (fields.length > 0) {
            values.push(id);
            await connection_1.pool.query(`UPDATE delegated_tasks SET ${fields.join(", ")} WHERE id = ?`, values);
        }
        return (await this.findById(id));
    }
    async updateStatus(id, status) {
        if (status === "running") {
            await connection_1.pool.query("UPDATE delegated_tasks SET base_status = 'running', started_at = COALESCE(started_at, NOW()) WHERE id = ?", [id]);
        }
        else {
            await connection_1.pool.query("UPDATE delegated_tasks SET base_status = 'completed', completed_at = NOW() WHERE id = ?", [id]);
        }
        return (await this.findById(id));
    }
    async setExtensionRequest(id, reason, requestedDate) {
        await connection_1.pool.query("UPDATE delegated_tasks SET extension_status = 'pending', extension_reason = ?, extension_requested_date = ?, extension_rejection_reason = NULL WHERE id = ?", [reason, requestedDate, id]);
        return (await this.findById(id));
    }
    async respondToExtension(id, status, rejectionReason) {
        if (status === "approved") {
            // Due date needs to be updated. Since it's done in the service or here, we do it here based on requested date.
            await connection_1.pool.query("UPDATE delegated_tasks SET extension_status = 'approved', due_date = extension_requested_date WHERE id = ?", [id]);
        }
        else {
            await connection_1.pool.query("UPDATE delegated_tasks SET extension_status = 'rejected', extension_rejection_reason = ? WHERE id = ?", [rejectionReason, id]);
        }
        return (await this.findById(id));
    }
    async escalate(id, escalateTo, notes) {
        await connection_1.pool.query("UPDATE delegated_tasks SET escalated_to = ?, escalated_at = NOW(), escalation_notes = ? WHERE id = ?", [escalateTo, notes, id]);
        return (await this.findById(id));
    }
    async softDelete(id) {
        await connection_1.pool.query("UPDATE delegated_tasks SET deleted_at = NOW() WHERE id = ?", [id]);
    }
    async addFile(taskId, kind, fileName, fileUrl, uploadedBy) {
        await connection_1.pool.query("INSERT INTO delegated_task_files (id, task_id, kind, file_name, file_url, uploaded_by) VALUES (?, ?, ?, ?, ?, ?)", [(0, uuid_1.v4)(), taskId, kind, fileName, fileUrl, uploadedBy]);
    }
    async listForEmployee(employeeId, params) {
        const conditions = ["dt.assigned_to = ?", "dt.deleted_at IS NULL"];
        const values = [employeeId];
        if (params?.from) {
            conditions.push("dt.due_date >= ?");
            values.push(params.from);
        }
        if (params?.to) {
            conditions.push("dt.due_date <= ?");
            values.push(params.to);
        }
        const [rows] = await connection_1.pool.query(`${WITH_CONTEXT_SELECT} WHERE ${conditions.join(" AND ")} ORDER BY dt.due_date ASC`, values);
        const items = rows.map((r) => ({ ...mapTask(r), assignedByName: r.assigned_by_name, assignedToName: r.assigned_to_name, escalatedToName: r.escalated_to_name, files: [] }));
        return this.attachFiles(items);
    }
    async countCompletedAndTotalDue(employeeId, from, to) {
        const [rows] = await connection_1.pool.query(`SELECT
         SUM(CASE WHEN base_status = 'completed' THEN 1 ELSE 0 END) as completed,
         COUNT(*) as total
       FROM delegated_tasks
       WHERE assigned_to = ? AND deleted_at IS NULL AND due_date BETWEEN ? AND ?`, [employeeId, from, to]);
        return { completed: Number(rows[0].completed) || 0, total: Number(rows[0].total) || 0 };
    }
}
exports.MySqlDelegationRepository = MySqlDelegationRepository;
//# sourceMappingURL=MySqlDelegationRepository.js.map