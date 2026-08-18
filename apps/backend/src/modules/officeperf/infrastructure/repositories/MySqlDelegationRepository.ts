import { v4 as uuid } from "uuid";
import { pool } from "../../../../infrastructure/database/mysql/connection";
import { DelegatedTask, DelegatedTaskWithContext, DelegationBaseStatus, DelegationFileKind } from "../../domain/entities/Delegation";
import { CreateDelegatedTaskData, IDelegationRepository, UpdateDelegatedTaskData } from "../../domain/repositories/IDelegationRepository";

function mapTask(row: any): DelegatedTask {
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
  LEFT JOIN employees eb ON eb.id = dt.assigned_by
  LEFT JOIN employees ea ON ea.id = dt.assigned_to
  LEFT JOIN employees ee ON ee.id = dt.escalated_to
`;

export class MySqlDelegationRepository implements IDelegationRepository {
  private async attachFiles(tasks: DelegatedTaskWithContext[]): Promise<DelegatedTaskWithContext[]> {
    if (tasks.length === 0) return tasks;
    const ids = tasks.map((t) => t.id);
    const placeholders = ids.map(() => "?").join(",");
    const [fileRows] = await pool.query<any[]>(
      `SELECT * FROM delegated_task_files WHERE task_id IN (${placeholders})`,
      ids
    );
    const filesByTask = new Map<string, any[]>();
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

  async list(params: { page: number; pageSize: number; assignedTo?: string; assignedBy?: string; status?: DelegationBaseStatus }) {
    const offset = (params.page - 1) * params.pageSize;
    const conditions = ["dt.deleted_at IS NULL"];
    const values: unknown[] = [];
    if (params.assignedTo) { conditions.push("dt.assigned_to = ?"); values.push(params.assignedTo); }
    if (params.assignedBy) { conditions.push("dt.assigned_by = ?"); values.push(params.assignedBy); }
    if (params.status) { conditions.push("dt.base_status = ?"); values.push(params.status); }
    const whereClause = `WHERE ${conditions.join(" AND ")}`;

    const [rows] = await pool.query<any[]>(
      `${WITH_CONTEXT_SELECT} ${whereClause} ORDER BY dt.due_date ASC LIMIT ? OFFSET ?`,
      [...values, params.pageSize, offset]
    );
    const [countRows] = await pool.query<any[]>(`SELECT COUNT(*) as total FROM delegated_tasks dt ${whereClause}`, values);

    const items = rows.map((r) => ({ ...mapTask(r), assignedByName: r.assigned_by_name, assignedToName: r.assigned_to_name, escalatedToName: r.escalated_to_name, files: [] }));
    return { items: await this.attachFiles(items), total: countRows[0].total as number };
  }

  async findById(id: string): Promise<DelegatedTask | null> {
    const [rows] = await pool.query<any[]>("SELECT * FROM delegated_tasks WHERE id = ? AND deleted_at IS NULL", [id]);
    return rows[0] ? mapTask(rows[0]) : null;
  }

  async getWithContext(id: string): Promise<DelegatedTaskWithContext | null> {
    const [rows] = await pool.query<any[]>(`${WITH_CONTEXT_SELECT} WHERE dt.id = ? AND dt.deleted_at IS NULL`, [id]);
    if (!rows[0]) return null;
    const r = rows[0];
    const item = { ...mapTask(r), assignedByName: r.assigned_by_name, assignedToName: r.assigned_to_name, escalatedToName: r.escalated_to_name, files: [] };
    return (await this.attachFiles([item]))[0];
  }

  async create(data: CreateDelegatedTaskData): Promise<DelegatedTask> {
    const id = data.id || uuid();
    const now = new Date();
    await pool.query(
      `INSERT INTO delegated_tasks (
        id, title, description, assigned_by, assigned_to, due_date, priority, base_status, is_attachment_mandatory, is_note_mandatory, remarks, created_at, updated_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        id, data.title, data.description ?? null, data.assignedBy, data.assignedTo,
        data.dueDate, data.priority ?? "medium", data.baseStatus ?? "pending", data.isAttachmentMandatory ? 1 : 0, data.isNoteMandatory ? 1 : 0, data.remarks ?? null,
        now, now
      ]);
    return (await this.findById(id))!;
  }

  async update(id: string, changes: UpdateDelegatedTaskData): Promise<DelegatedTask> {
    const fields: string[] = [];
    const values: unknown[] = [];
    if (changes.title !== undefined) { fields.push("title = ?"); values.push(changes.title); }
    if (changes.description !== undefined) { fields.push("description = ?"); values.push(changes.description); }
    if (changes.dueDate !== undefined) { fields.push("due_date = ?"); values.push(changes.dueDate); }
    if (changes.priority !== undefined) { fields.push("priority = ?"); values.push(changes.priority); }
    if (changes.isAttachmentMandatory !== undefined) { fields.push("is_attachment_mandatory = ?"); values.push(changes.isAttachmentMandatory ? 1 : 0); }
    if (changes.isNoteMandatory !== undefined) { fields.push("is_note_mandatory = ?"); values.push(changes.isNoteMandatory ? 1 : 0); }
    if (changes.remarks !== undefined) { fields.push("remarks = ?"); values.push(changes.remarks); }
    if (fields.length > 0) {
      values.push(id);
      await pool.query(`UPDATE delegated_tasks SET ${fields.join(", ")} WHERE id = ?`, values);
    }
    return (await this.findById(id))!;
  }

  async updateStatus(id: string, status: "running" | "completed"): Promise<DelegatedTask> {
    if (status === "running") {
      await pool.query("UPDATE delegated_tasks SET base_status = 'running', started_at = COALESCE(started_at, NOW()) WHERE id = ?", [id]);
    } else {
      await pool.query("UPDATE delegated_tasks SET base_status = 'completed', completed_at = NOW() WHERE id = ?", [id]);
    }
    return (await this.findById(id))!;
  }

  async setExtensionRequest(id: string, reason: string, requestedDate: string): Promise<DelegatedTask> {
    await pool.query(
      "UPDATE delegated_tasks SET extension_status = 'pending', extension_reason = ?, extension_requested_date = ?, extension_rejection_reason = NULL WHERE id = ?",
      [reason, requestedDate, id]
    );
    return (await this.findById(id))!;
  }

  async respondToExtension(id: string, status: "approved" | "rejected", rejectionReason: string | null, updatedDate?: string | null): Promise<DelegatedTask> {
    if (status === "approved") {
      if (updatedDate) {
        await pool.query(
          "UPDATE delegated_tasks SET extension_status = 'approved', due_date = ? WHERE id = ?",
          [updatedDate, id]
        );
      } else {
        await pool.query(
          "UPDATE delegated_tasks SET extension_status = 'approved', due_date = extension_requested_date WHERE id = ?",
          [id]
        );
      }
    } else {
      await pool.query(
        "UPDATE delegated_tasks SET extension_status = 'rejected', extension_rejection_reason = ? WHERE id = ?",
        [rejectionReason, id]
      );
    }
    return (await this.findById(id))!;
  }

  async escalate(id: string, escalateTo: string, notes: string | null): Promise<DelegatedTask> {
    await pool.query(
      "UPDATE delegated_tasks SET escalated_to = ?, escalated_at = NOW(), escalation_notes = ? WHERE id = ?",
      [escalateTo, notes, id]
    );
    return (await this.findById(id))!;
  }

  async softDelete(id: string): Promise<void> {
    await pool.query("UPDATE delegated_tasks SET deleted_at = NOW() WHERE id = ?", [id]);
  }

  async addFile(taskId: string, kind: DelegationFileKind, fileName: string, fileUrl: string, uploadedBy: string): Promise<void> {
    await pool.query(
      "INSERT INTO delegated_task_files (id, task_id, kind, file_name, file_url, uploaded_by) VALUES (?, ?, ?, ?, ?, ?)",
      [uuid(), taskId, kind, fileName, fileUrl, uploadedBy]
    );
  }

  async listForEmployee(employeeId: string, params?: { from?: string; to?: string }): Promise<DelegatedTaskWithContext[]> {
    const conditions = ["dt.assigned_to = ?", "dt.deleted_at IS NULL"];
    const values: unknown[] = [employeeId];
    if (params?.from) { conditions.push("dt.due_date >= ?"); values.push(params.from); }
    if (params?.to) { conditions.push("dt.due_date <= ?"); values.push(params.to); }
    const [rows] = await pool.query<any[]>(
      `${WITH_CONTEXT_SELECT} WHERE ${conditions.join(" AND ")} ORDER BY dt.due_date ASC`,
      values
    );
    const items = rows.map((r) => ({ ...mapTask(r), assignedByName: r.assigned_by_name, assignedToName: r.assigned_to_name, escalatedToName: r.escalated_to_name, files: [] }));
    return this.attachFiles(items);
  }

  async countCompletedAndTotalDue(employeeId: string, from: string, to: string): Promise<{ completed: number; total: number }> {
    const [rows] = await pool.query<any[]>(
      `SELECT
         SUM(CASE WHEN base_status = 'completed' THEN 1 ELSE 0 END) as completed,
         COUNT(*) as total
       FROM delegated_tasks
       WHERE assigned_to = ? AND deleted_at IS NULL AND due_date BETWEEN ? AND ?`,
      [employeeId, from, to]
    );
    return { completed: Number(rows[0].completed) || 0, total: Number(rows[0].total) || 0 };
  }
}
