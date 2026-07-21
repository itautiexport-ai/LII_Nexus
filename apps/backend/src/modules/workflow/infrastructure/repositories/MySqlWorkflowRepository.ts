import { v4 as uuid } from "uuid";
import { pool } from "../../../../infrastructure/database/mysql/connection";
import {
  ChecklistItem,
  EscalationRule,
  NotificationRule,
  StageDocument,
  Workflow,
  WorkflowStage,
  WorkflowStatus,
  WorkflowSummary,
  WorkflowWithStages,
} from "../../domain/entities/Workflow";
import {
  CreateWorkflowData,
  IWorkflowRepository,
  ListWorkflowsParams,
  StageInput,
  UpdateWorkflowMetaData,
} from "../../domain/repositories/IWorkflowRepository";
import { ValidationError } from "../../../../core/domain/errors/DomainError";

function mapWorkflow(row: any): Workflow {
  return {
    id: row.id,
    name: row.name,
    departmentId: row.department_id,
    description: row.description,
    status: row.status,
    version: row.version,
    createdBy: row.created_by,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
    deletedAt: row.deleted_at,
  };
}

function mapStageRow(row: any): Omit<WorkflowStage, "checklistItems" | "mandatoryDocuments" | "notificationRules" | "escalationRules"> {
  return {
    id: row.id,
    workflowId: row.workflow_id,
    name: row.name,
    sequence: row.sequence,
    responsibleRoleId: row.responsible_role_id,
    dueDays: row.due_days,
    approvalRequired: !!row.approval_required,
    checklistRequired: !!row.checklist_required,
    canSkip: !!row.can_skip,
    completionMode: row.completion_mode,
    minMandatoryDocuments: row.min_mandatory_documents,
  };
}

export class MySqlWorkflowRepository implements IWorkflowRepository {
  async list(params: ListWorkflowsParams) {
    const offset = (params.page - 1) * params.pageSize;
    const conditions = ["w.deleted_at IS NULL"];
    const values: unknown[] = [];

    if (params.search) {
      conditions.push("w.name LIKE ?");
      values.push(`%${params.search}%`);
    }
    if (params.departmentId) {
      conditions.push("w.department_id = ?");
      values.push(params.departmentId);
    }
    if (params.status) {
      conditions.push("w.status = ?");
      values.push(params.status);
    }
    const whereClause = `WHERE ${conditions.join(" AND ")}`;

    const [rows] = await pool.query<any[]>(
      `SELECT w.*, d.name AS department_name,
              (SELECT COUNT(*) FROM workflow_stages ws WHERE ws.workflow_id = w.id) AS stage_count
       FROM workflows w
       LEFT JOIN departments d ON d.id = w.department_id
       ${whereClause}
       ORDER BY w.updated_at DESC LIMIT ? OFFSET ?`,
      [...values, params.pageSize, offset]
    );
    const [countRows] = await pool.query<any[]>(`SELECT COUNT(*) as total FROM workflows w ${whereClause}`, values);

    const items: WorkflowSummary[] = rows.map((r) => ({
      ...mapWorkflow(r),
      departmentName: r.department_name,
      stageCount: r.stage_count,
    }));
    return { items, total: countRows[0].total as number };
  }

  async findById(id: string): Promise<Workflow | null> {
    const [rows] = await pool.query<any[]>("SELECT * FROM workflows WHERE id = ? AND deleted_at IS NULL", [id]);
    return rows[0] ? mapWorkflow(rows[0]) : null;
  }

  private async fetchStagesWithChildren(workflowId: string): Promise<WorkflowStage[]> {
    const [stageRows] = await pool.query<any[]>(
      "SELECT * FROM workflow_stages WHERE workflow_id = ? ORDER BY sequence ASC",
      [workflowId]
    );
    if (stageRows.length === 0) return [];
    const stageIds = stageRows.map((s) => s.id);
    const placeholders = stageIds.map(() => "?").join(",");

    const [checklistRows] = await pool.query<any[]>(
      `SELECT * FROM workflow_stage_checklist_items WHERE stage_id IN (${placeholders}) ORDER BY sort_order ASC`,
      stageIds
    );
    const [documentRows] = await pool.query<any[]>(
      `SELECT * FROM workflow_stage_documents WHERE stage_id IN (${placeholders})`,
      stageIds
    );
    const [notificationRows] = await pool.query<any[]>(
      `SELECT * FROM workflow_stage_notification_rules WHERE stage_id IN (${placeholders})`,
      stageIds
    );
    const [escalationRows] = await pool.query<any[]>(
      `SELECT * FROM workflow_stage_escalation_rules WHERE stage_id IN (${placeholders})`,
      stageIds
    );

    const checklistByStage = new Map<string, ChecklistItem[]>();
    for (const r of checklistRows) {
      const list = checklistByStage.get(r.stage_id) ?? [];
      list.push({ id: r.id, label: r.label, sortOrder: r.sort_order });
      checklistByStage.set(r.stage_id, list);
    }
    const documentsByStage = new Map<string, StageDocument[]>();
    for (const r of documentRows) {
      const list = documentsByStage.get(r.stage_id) ?? [];
      list.push({ id: r.id, documentName: r.document_name, isMandatory: !!r.is_mandatory });
      documentsByStage.set(r.stage_id, list);
    }
    const notificationsByStage = new Map<string, NotificationRule[]>();
    for (const r of notificationRows) {
      const list = notificationsByStage.get(r.stage_id) ?? [];
      list.push({
        id: r.id,
        triggerEvent: r.trigger_event,
        channel: r.channel,
        recipientType: r.recipient_type,
        customRoleId: r.custom_role_id,
        messageTemplate: r.message_template,
      });
      notificationsByStage.set(r.stage_id, list);
    }
    const escalationsByStage = new Map<string, EscalationRule[]>();
    for (const r of escalationRows) {
      const list = escalationsByStage.get(r.stage_id) ?? [];
      list.push({
        id: r.id,
        escalateAfterDays: r.escalate_after_days,
        escalateToRoleId: r.escalate_to_role_id,
        escalationAction: r.escalation_action,
        notes: r.notes,
      });
      escalationsByStage.set(r.stage_id, list);
    }

    return stageRows.map((s) => ({
      ...mapStageRow(s),
      checklistItems: checklistByStage.get(s.id) ?? [],
      mandatoryDocuments: documentsByStage.get(s.id) ?? [],
      notificationRules: notificationsByStage.get(s.id) ?? [],
      escalationRules: escalationsByStage.get(s.id) ?? [],
    }));
  }

  async findByIdWithStages(id: string): Promise<WorkflowWithStages | null> {
    const workflow = await this.findById(id);
    if (!workflow) return null;
    const stages = await this.fetchStagesWithChildren(id);
    return { ...workflow, stages };
  }

  private async insertStageChildren(conn: any, stageId: string, input: StageInput) {
    for (const [i, item] of (input.checklistItems ?? []).entries()) {
      await conn.query(
        "INSERT INTO workflow_stage_checklist_items (id, stage_id, label, sort_order) VALUES (?, ?, ?, ?)",
        [uuid(), stageId, item.label, i]
      );
    }
    for (const doc of input.mandatoryDocuments ?? []) {
      await conn.query(
        "INSERT INTO workflow_stage_documents (id, stage_id, document_name, is_mandatory) VALUES (?, ?, ?, ?)",
        [uuid(), stageId, doc.documentName, doc.isMandatory ?? true]
      );
    }
    for (const rule of input.notificationRules ?? []) {
      await conn.query(
        `INSERT INTO workflow_stage_notification_rules
           (id, stage_id, trigger_event, channel, recipient_type, custom_role_id, message_template)
         VALUES (?, ?, ?, ?, ?, ?, ?)`,
        [
          uuid(), stageId, rule.triggerEvent, rule.channel ?? "in_app", rule.recipientType ?? "responsible_role",
          rule.customRoleId ?? null, rule.messageTemplate ?? null,
        ]
      );
    }
    for (const rule of input.escalationRules ?? []) {
      await conn.query(
        `INSERT INTO workflow_stage_escalation_rules
           (id, stage_id, escalate_after_days, escalate_to_role_id, escalation_action, notes)
         VALUES (?, ?, ?, ?, ?, ?)`,
        [uuid(), stageId, rule.escalateAfterDays, rule.escalateToRoleId, rule.escalationAction ?? "notify_only", rule.notes ?? null]
      );
    }
  }

  async create(data: CreateWorkflowData): Promise<WorkflowWithStages> {
    const id = data.id || uuid();
    const conn = await pool.getConnection();
    try {
      await conn.beginTransaction();
      await conn.query(
        `INSERT INTO workflows (id, name, department_id, description, status, version, created_by)
         VALUES (?, ?, ?, ?, 'draft', 1, ?)`,
        [id, data.name, data.departmentId ?? null, data.description ?? null, data.createdBy]
      );

      for (const [i, stage] of (data.stages ?? []).entries()) {
        const stageId = uuid();
        await conn.query(
          `INSERT INTO workflow_stages
             (id, workflow_id, name, sequence, responsible_role_id, due_days, approval_required, checklist_required, can_skip, completion_mode, min_mandatory_documents)
           VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
          [
            stageId, id, stage.name, i + 1, stage.responsibleRoleId, stage.dueDays ?? null,
            stage.approvalRequired ?? false, stage.checklistRequired ?? false, stage.canSkip ?? false,
            stage.completionMode ?? "manual", stage.minMandatoryDocuments ?? 0,
          ]
        );
        await this.insertStageChildren(conn, stageId, stage);
      }

      await conn.commit();
    } catch (err) {
      await conn.rollback();
      throw err;
    } finally {
      conn.release();
    }
    return (await this.findByIdWithStages(id))!;
  }

  async updateMeta(id: string, changes: UpdateWorkflowMetaData): Promise<Workflow> {
    const fields: string[] = [];
    const values: unknown[] = [];
    if (changes.name !== undefined) { fields.push("name = ?"); values.push(changes.name); }
    if (changes.departmentId !== undefined) { fields.push("department_id = ?"); values.push(changes.departmentId); }
    if (changes.description !== undefined) { fields.push("description = ?"); values.push(changes.description); }
    if (fields.length > 0) {
      values.push(id);
      await pool.query(`UPDATE workflows SET ${fields.join(", ")} WHERE id = ?`, values);
    }
    return (await this.findById(id))!;
  }

  async updateStatus(id: string, status: WorkflowStatus): Promise<Workflow> {
    await pool.query("UPDATE workflows SET status = ? WHERE id = ?", [status, id]);
    return (await this.findById(id))!;
  }

  async incrementVersion(id: string): Promise<void> {
    await pool.query("UPDATE workflows SET version = version + 1 WHERE id = ?", [id]);
  }

  async softDelete(id: string): Promise<void> {
    await pool.query("UPDATE workflows SET deleted_at = NOW() WHERE id = ?", [id]);
  }

  async addStage(workflowId: string, stage: StageInput, _sequence: number): Promise<WorkflowStage> {
    const conn = await pool.getConnection();
    const stageId = uuid();
    try {
      await conn.beginTransaction();
      const [maxRows] = await conn.query<any[]>(
        "SELECT COALESCE(MAX(sequence), 0) as maxSeq FROM workflow_stages WHERE workflow_id = ?",
        [workflowId]
      );
      const nextSequence = maxRows[0].maxSeq + 1;
      await conn.query(
        `INSERT INTO workflow_stages
           (id, workflow_id, name, sequence, responsible_role_id, due_days, approval_required, checklist_required, can_skip, completion_mode, min_mandatory_documents)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [
          stageId, workflowId, stage.name, nextSequence, stage.responsibleRoleId, stage.dueDays ?? null,
          stage.approvalRequired ?? false, stage.checklistRequired ?? false, stage.canSkip ?? false,
          stage.completionMode ?? "manual", stage.minMandatoryDocuments ?? 0,
        ]
      );
      await this.insertStageChildren(conn, stageId, stage);
      await conn.commit();
    } catch (err) {
      await conn.rollback();
      throw err;
    } finally {
      conn.release();
    }
    return (await this.getStage(workflowId, stageId))!;
  }

  async updateStage(workflowId: string, stageId: string, stage: StageInput): Promise<WorkflowStage> {
    const conn = await pool.getConnection();
    try {
      await conn.beginTransaction();
      await conn.query(
        `UPDATE workflow_stages SET
           name = ?, responsible_role_id = ?, due_days = ?, approval_required = ?, checklist_required = ?,
           can_skip = ?, completion_mode = ?, min_mandatory_documents = ?
         WHERE id = ? AND workflow_id = ?`,
        [
          stage.name, stage.responsibleRoleId, stage.dueDays ?? null, stage.approvalRequired ?? false,
          stage.checklistRequired ?? false, stage.canSkip ?? false, stage.completionMode ?? "manual",
          stage.minMandatoryDocuments ?? 0, stageId, workflowId,
        ]
      );
      // Nested config is small and fully admin-managed in the UI as a unit,
      // so a full replace on every update is simpler and safer than diffing.
      await conn.query("DELETE FROM workflow_stage_checklist_items WHERE stage_id = ?", [stageId]);
      await conn.query("DELETE FROM workflow_stage_documents WHERE stage_id = ?", [stageId]);
      await conn.query("DELETE FROM workflow_stage_notification_rules WHERE stage_id = ?", [stageId]);
      await conn.query("DELETE FROM workflow_stage_escalation_rules WHERE stage_id = ?", [stageId]);
      await this.insertStageChildren(conn, stageId, stage);
      await conn.commit();
    } catch (err) {
      await conn.rollback();
      throw err;
    } finally {
      conn.release();
    }
    return (await this.getStage(workflowId, stageId))!;
  }

  async removeStage(workflowId: string, stageId: string): Promise<void> {
    const conn = await pool.getConnection();
    try {
      await conn.beginTransaction();
      await conn.query("DELETE FROM workflow_stages WHERE id = ? AND workflow_id = ?", [stageId, workflowId]);
      // Re-sequence remaining stages to stay contiguous (1..N) - keeps the
      // unique (workflow_id, sequence) constraint meaningful and the
      // flowchart/drag-and-drop order gap-free.
      const [remaining] = await conn.query<any[]>(
        "SELECT id FROM workflow_stages WHERE workflow_id = ? ORDER BY sequence ASC",
        [workflowId]
      );
      for (const [i, row] of remaining.entries()) {
        await conn.query("UPDATE workflow_stages SET sequence = ? WHERE id = ?", [i + 1, row.id]);
      }
      await conn.commit();
    } catch (err) {
      await conn.rollback();
      throw err;
    } finally {
      conn.release();
    }
  }

  async reorderStages(workflowId: string, orderedStageIds: string[]): Promise<void> {
    const [existingRows] = await pool.query<any[]>("SELECT id FROM workflow_stages WHERE workflow_id = ?", [workflowId]);
    const existingIds = new Set(existingRows.map((r) => r.id as string));
    if (existingIds.size !== orderedStageIds.length || !orderedStageIds.every((id) => existingIds.has(id))) {
      throw new ValidationError("The reorder list must contain exactly the stages currently in this workflow.");
    }

    const conn = await pool.getConnection();
    try {
      await conn.beginTransaction();
      // Two-pass update avoids transiently violating the unique (workflow_id,
      // sequence) constraint while reordering.
      for (const [i, stageId] of orderedStageIds.entries()) {
        await conn.query("UPDATE workflow_stages SET sequence = ? WHERE id = ?", [-(i + 1), stageId]);
      }
      for (const [i, stageId] of orderedStageIds.entries()) {
        await conn.query("UPDATE workflow_stages SET sequence = ? WHERE id = ?", [i + 1, stageId]);
      }
      await conn.commit();
    } catch (err) {
      await conn.rollback();
      throw err;
    } finally {
      conn.release();
    }
  }

  async getStage(workflowId: string, stageId: string): Promise<WorkflowStage | null> {
    const stages = await this.fetchStagesWithChildren(workflowId);
    return stages.find((s) => s.id === stageId) ?? null;
  }
}
