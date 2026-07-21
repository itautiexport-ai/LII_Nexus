import { v4 as uuid } from "uuid";
import { pool } from "../../../../infrastructure/database/mysql/connection";
import {
  ChecklistAssignment,
  ChecklistFrequency,
  ChecklistInstanceWithItems,
  ChecklistTemplate,
  MasterStatus,
} from "../../domain/entities/Checklist";
import { CreateTemplateData, IChecklistRepository } from "../../domain/repositories/IChecklistRepository";

function mapTemplate(row: any): ChecklistTemplate {
  return {
    id: row.id,
    title: row.title,
    description: row.description,
    frequency: row.frequency,
    status: row.status,
    createdBy: row.created_by,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
    deletedAt: row.deleted_at,
  };
}

function mapAssignment(row: any): ChecklistAssignment {
  return {
    id: row.id,
    templateId: row.template_id,
    employeeId: row.employee_id,
    roleId: row.role_id,
    assignedBy: row.assigned_by,
    createdAt: row.created_at,
  };
}

export class MySqlChecklistRepository implements IChecklistRepository {
  async listTemplates(params: { search?: string; frequency?: ChecklistFrequency; status?: MasterStatus }): Promise<ChecklistTemplate[]> {
    const conditions = ["deleted_at IS NULL"];
    const values: unknown[] = [];
    if (params.search) { conditions.push("title LIKE ?"); values.push(`%${params.search}%`); }
    if (params.frequency) { conditions.push("frequency = ?"); values.push(params.frequency); }
    if (params.status) { conditions.push("status = ?"); values.push(params.status); }
    const [rows] = await pool.query<any[]>(
      `SELECT * FROM checklist_templates WHERE ${conditions.join(" AND ")} ORDER BY title ASC`,
      values
    );
    return rows.map(mapTemplate);
  }

  async findTemplateById(id: string): Promise<ChecklistTemplate | null> {
    const [rows] = await pool.query<any[]>("SELECT * FROM checklist_templates WHERE id = ? AND deleted_at IS NULL", [id]);
    return rows[0] ? mapTemplate(rows[0]) : null;
  }

  async createTemplate(data: CreateTemplateData): Promise<ChecklistTemplate> {
    const id = data.id || uuid();
    const conn = await pool.getConnection();
    try {
      await conn.beginTransaction();
      await conn.query(
        "INSERT INTO checklist_templates (id, title, description, frequency, created_by) VALUES (?, ?, ?, ?, ?)",
        [id, data.title, data.description ?? null, data.frequency, data.createdBy]
      );
      for (const [i, item] of data.items.entries()) {
        await conn.query(
          "INSERT INTO checklist_template_items (id, template_id, label, sort_order) VALUES (?, ?, ?, ?)",
          [uuid(), id, item.label, i]
        );
      }
      await conn.commit();
    } catch (err) {
      await conn.rollback();
      throw err;
    } finally {
      conn.release();
    }
    return (await this.findTemplateById(id))!;
  }

  async updateTemplate(id: string, changes: { title?: string; description?: string | null; status?: MasterStatus }): Promise<ChecklistTemplate> {
    const fields: string[] = [];
    const values: unknown[] = [];
    if (changes.title !== undefined) { fields.push("title = ?"); values.push(changes.title); }
    if (changes.description !== undefined) { fields.push("description = ?"); values.push(changes.description); }
    if (changes.status !== undefined) { fields.push("status = ?"); values.push(changes.status); }
    if (fields.length > 0) {
      values.push(id);
      await pool.query(`UPDATE checklist_templates SET ${fields.join(", ")} WHERE id = ?`, values);
    }
    return (await this.findTemplateById(id))!;
  }

  async replaceTemplateItems(templateId: string, items: { label: string }[]): Promise<void> {
    const conn = await pool.getConnection();
    try {
      await conn.beginTransaction();
      await conn.query("DELETE FROM checklist_template_items WHERE template_id = ?", [templateId]);
      for (const [i, item] of items.entries()) {
        await conn.query(
          "INSERT INTO checklist_template_items (id, template_id, label, sort_order) VALUES (?, ?, ?, ?)",
          [uuid(), templateId, item.label, i]
        );
      }
      await conn.commit();
    } catch (err) {
      await conn.rollback();
      throw err;
    } finally {
      conn.release();
    }
  }

  async softDeleteTemplate(id: string): Promise<void> {
    await pool.query("UPDATE checklist_templates SET deleted_at = NOW(), status = 'inactive' WHERE id = ?", [id]);
  }

  async setAssignments(templateId: string, assignments: { employeeId?: string | null; roleId?: string | null }[], assignedBy: string): Promise<void> {
    const conn = await pool.getConnection();
    try {
      await conn.beginTransaction();
      await conn.query("DELETE FROM checklist_assignments WHERE template_id = ?", [templateId]);
      for (const a of assignments) {
        await conn.query(
          "INSERT INTO checklist_assignments (id, template_id, employee_id, role_id, assigned_by) VALUES (?, ?, ?, ?, ?)",
          [uuid(), templateId, a.employeeId ?? null, a.roleId ?? null, assignedBy]
        );
      }
      await conn.commit();
    } catch (err) {
      await conn.rollback();
      throw err;
    } finally {
      conn.release();
    }
  }

  async getAssignments(templateId: string): Promise<ChecklistAssignment[]> {
    const [rows] = await pool.query<any[]>("SELECT * FROM checklist_assignments WHERE template_id = ?", [templateId]);
    return rows.map(mapAssignment);
  }

  async listAssignedEmployeeIds(templateId: string): Promise<string[]> {
    const [directRows] = await pool.query<any[]>(
      "SELECT employee_id FROM checklist_assignments WHERE template_id = ? AND employee_id IS NOT NULL",
      [templateId]
    );
    const [roleRows] = await pool.query<any[]>(
      `SELECT DISTINCT e.id as employee_id
       FROM checklist_assignments ca
       JOIN user_roles ur ON ur.role_id = ca.role_id
       JOIN employees e ON e.user_id = ur.user_id
       WHERE ca.template_id = ? AND ca.role_id IS NOT NULL AND e.deleted_at IS NULL`,
      [templateId]
    );
    const ids = new Set<string>();
    for (const r of directRows) ids.add(r.employee_id);
    for (const r of roleRows) ids.add(r.employee_id);
    return Array.from(ids);
  }

  async listTemplatesAssignedToEmployee(employeeId: string): Promise<ChecklistTemplate[]> {
    const [rows] = await pool.query<any[]>(
      `SELECT DISTINCT t.* FROM checklist_templates t
       LEFT JOIN checklist_assignments ca ON ca.template_id = t.id
       LEFT JOIN user_roles ur ON ur.role_id = ca.role_id
       LEFT JOIN employees e ON e.user_id = ur.user_id
       WHERE t.deleted_at IS NULL AND t.status = 'active'
         AND (ca.employee_id = ? OR e.id = ?)`,
      [employeeId, employeeId]
    );
    return rows.map(mapTemplate);
  }

  private async fetchInstanceWithItems(instanceId: string): Promise<ChecklistInstanceWithItems | null> {
    const [instRows] = await pool.query<any[]>(
      `SELECT ci.*, t.title AS template_title, t.frequency
       FROM checklist_instances ci JOIN checklist_templates t ON t.id = ci.template_id
       WHERE ci.id = ?`,
      [instanceId]
    );
    if (!instRows[0]) return null;
    const [itemRows] = await pool.query<any[]>(
      `SELECT cii.*, cti.label FROM checklist_instance_items cii
       JOIN checklist_template_items cti ON cti.id = cii.template_item_id
       WHERE cii.instance_id = ? ORDER BY cti.sort_order ASC`,
      [instanceId]
    );
    const row = instRows[0];
    return {
      id: row.id,
      templateId: row.template_id,
      employeeId: row.employee_id,
      periodKey: row.period_key,
      periodStart: row.period_start,
      periodEnd: row.period_end,
      createdAt: row.created_at,
      templateTitle: row.template_title,
      frequency: row.frequency,
      items: itemRows.map((i) => ({
        id: i.id,
        instanceId: i.instance_id,
        templateItemId: i.template_item_id,
        label: i.label,
        isChecked: !!i.is_checked,
        checkedAt: i.checked_at,
      })),
    };
  }

  async findOrCreateInstance(templateId: string, employeeId: string, periodKey: string, periodStart: string, periodEnd: string): Promise<ChecklistInstanceWithItems> {
    const [existing] = await pool.query<any[]>(
      "SELECT id FROM checklist_instances WHERE template_id = ? AND employee_id = ? AND period_key = ?",
      [templateId, employeeId, periodKey]
    );
    if (existing[0]) {
      return (await this.fetchInstanceWithItems(existing[0].id))!;
    }

    const instanceId = uuid();
    const conn = await pool.getConnection();
    try {
      await conn.beginTransaction();
      await conn.query(
        "INSERT INTO checklist_instances (id, template_id, employee_id, period_key, period_start, period_end) VALUES (?, ?, ?, ?, ?, ?)",
        [instanceId, templateId, employeeId, periodKey, periodStart, periodEnd]
      );
      const [templateItems] = await conn.query<any[]>(
        "SELECT id FROM checklist_template_items WHERE template_id = ? ORDER BY sort_order ASC",
        [templateId]
      );
      for (const item of templateItems) {
        await conn.query(
          "INSERT INTO checklist_instance_items (id, instance_id, template_item_id, is_checked) VALUES (?, ?, ?, 0)",
          [uuid(), instanceId, item.id]
        );
      }
      await conn.commit();
    } catch (err) {
      await conn.rollback();
      throw err;
    } finally {
      conn.release();
    }
    return (await this.fetchInstanceWithItems(instanceId))!;
  }

  async getInstanceWithItems(instanceId: string): Promise<ChecklistInstanceWithItems | null> {
    return this.fetchInstanceWithItems(instanceId);
  }

  async setItemChecked(instanceId: string, itemId: string, checked: boolean): Promise<void> {
    await pool.query(
      "UPDATE checklist_instance_items SET is_checked = ?, checked_at = ? WHERE id = ? AND instance_id = ?",
      [checked, checked ? new Date() : null, itemId, instanceId]
    );
  }

  async listInstancesForEmployee(employeeId: string, periodStart: string, periodEnd: string): Promise<ChecklistInstanceWithItems[]> {
    const [rows] = await pool.query<any[]>(
      `SELECT id FROM checklist_instances WHERE employee_id = ? AND period_start >= ? AND period_end <= ?`,
      [employeeId, periodStart, periodEnd]
    );
    const results: ChecklistInstanceWithItems[] = [];
    for (const row of rows) {
      const instance = await this.fetchInstanceWithItems(row.id);
      if (instance) results.push(instance);
    }
    return results;
  }
}
