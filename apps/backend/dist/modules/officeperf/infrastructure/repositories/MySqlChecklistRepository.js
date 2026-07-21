"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.MySqlChecklistRepository = void 0;
const uuid_1 = require("uuid");
const connection_1 = require("../../../../infrastructure/database/mysql/connection");
function mapTemplate(row) {
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
function mapAssignment(row) {
    return {
        id: row.id,
        templateId: row.template_id,
        employeeId: row.employee_id,
        roleId: row.role_id,
        assignedBy: row.assigned_by,
        createdAt: row.created_at,
    };
}
class MySqlChecklistRepository {
    async listTemplates(params) {
        const conditions = ["deleted_at IS NULL"];
        const values = [];
        if (params.search) {
            conditions.push("title LIKE ?");
            values.push(`%${params.search}%`);
        }
        if (params.frequency) {
            conditions.push("frequency = ?");
            values.push(params.frequency);
        }
        if (params.status) {
            conditions.push("status = ?");
            values.push(params.status);
        }
        const [rows] = await connection_1.pool.query(`SELECT * FROM checklist_templates WHERE ${conditions.join(" AND ")} ORDER BY title ASC`, values);
        return rows.map(mapTemplate);
    }
    async findTemplateById(id) {
        const [rows] = await connection_1.pool.query("SELECT * FROM checklist_templates WHERE id = ? AND deleted_at IS NULL", [id]);
        return rows[0] ? mapTemplate(rows[0]) : null;
    }
    async createTemplate(data) {
        const id = data.id || (0, uuid_1.v4)();
        const conn = await connection_1.pool.getConnection();
        try {
            await conn.beginTransaction();
            await conn.query("INSERT INTO checklist_templates (id, title, description, frequency, created_by) VALUES (?, ?, ?, ?, ?)", [id, data.title, data.description ?? null, data.frequency, data.createdBy]);
            for (const [i, item] of data.items.entries()) {
                await conn.query("INSERT INTO checklist_template_items (id, template_id, label, sort_order) VALUES (?, ?, ?, ?)", [(0, uuid_1.v4)(), id, item.label, i]);
            }
            await conn.commit();
        }
        catch (err) {
            await conn.rollback();
            throw err;
        }
        finally {
            conn.release();
        }
        return (await this.findTemplateById(id));
    }
    async updateTemplate(id, changes) {
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
        if (changes.status !== undefined) {
            fields.push("status = ?");
            values.push(changes.status);
        }
        if (fields.length > 0) {
            values.push(id);
            await connection_1.pool.query(`UPDATE checklist_templates SET ${fields.join(", ")} WHERE id = ?`, values);
        }
        return (await this.findTemplateById(id));
    }
    async replaceTemplateItems(templateId, items) {
        const conn = await connection_1.pool.getConnection();
        try {
            await conn.beginTransaction();
            await conn.query("DELETE FROM checklist_template_items WHERE template_id = ?", [templateId]);
            for (const [i, item] of items.entries()) {
                await conn.query("INSERT INTO checklist_template_items (id, template_id, label, sort_order) VALUES (?, ?, ?, ?)", [(0, uuid_1.v4)(), templateId, item.label, i]);
            }
            await conn.commit();
        }
        catch (err) {
            await conn.rollback();
            throw err;
        }
        finally {
            conn.release();
        }
    }
    async softDeleteTemplate(id) {
        await connection_1.pool.query("UPDATE checklist_templates SET deleted_at = NOW(), status = 'inactive' WHERE id = ?", [id]);
    }
    async setAssignments(templateId, assignments, assignedBy) {
        const conn = await connection_1.pool.getConnection();
        try {
            await conn.beginTransaction();
            await conn.query("DELETE FROM checklist_assignments WHERE template_id = ?", [templateId]);
            for (const a of assignments) {
                await conn.query("INSERT INTO checklist_assignments (id, template_id, employee_id, role_id, assigned_by) VALUES (?, ?, ?, ?, ?)", [(0, uuid_1.v4)(), templateId, a.employeeId ?? null, a.roleId ?? null, assignedBy]);
            }
            await conn.commit();
        }
        catch (err) {
            await conn.rollback();
            throw err;
        }
        finally {
            conn.release();
        }
    }
    async getAssignments(templateId) {
        const [rows] = await connection_1.pool.query("SELECT * FROM checklist_assignments WHERE template_id = ?", [templateId]);
        return rows.map(mapAssignment);
    }
    async listAssignedEmployeeIds(templateId) {
        const [directRows] = await connection_1.pool.query("SELECT employee_id FROM checklist_assignments WHERE template_id = ? AND employee_id IS NOT NULL", [templateId]);
        const [roleRows] = await connection_1.pool.query(`SELECT DISTINCT e.id as employee_id
       FROM checklist_assignments ca
       JOIN user_roles ur ON ur.role_id = ca.role_id
       JOIN employees e ON e.user_id = ur.user_id
       WHERE ca.template_id = ? AND ca.role_id IS NOT NULL AND e.deleted_at IS NULL`, [templateId]);
        const ids = new Set();
        for (const r of directRows)
            ids.add(r.employee_id);
        for (const r of roleRows)
            ids.add(r.employee_id);
        return Array.from(ids);
    }
    async listTemplatesAssignedToEmployee(employeeId) {
        const [rows] = await connection_1.pool.query(`SELECT DISTINCT t.* FROM checklist_templates t
       LEFT JOIN checklist_assignments ca ON ca.template_id = t.id
       LEFT JOIN user_roles ur ON ur.role_id = ca.role_id
       LEFT JOIN employees e ON e.user_id = ur.user_id
       WHERE t.deleted_at IS NULL AND t.status = 'active'
         AND (ca.employee_id = ? OR e.id = ?)`, [employeeId, employeeId]);
        return rows.map(mapTemplate);
    }
    async fetchInstanceWithItems(instanceId) {
        const [instRows] = await connection_1.pool.query(`SELECT ci.*, t.title AS template_title, t.frequency
       FROM checklist_instances ci JOIN checklist_templates t ON t.id = ci.template_id
       WHERE ci.id = ?`, [instanceId]);
        if (!instRows[0])
            return null;
        const [itemRows] = await connection_1.pool.query(`SELECT cii.*, cti.label FROM checklist_instance_items cii
       JOIN checklist_template_items cti ON cti.id = cii.template_item_id
       WHERE cii.instance_id = ? ORDER BY cti.sort_order ASC`, [instanceId]);
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
    async findOrCreateInstance(templateId, employeeId, periodKey, periodStart, periodEnd) {
        const [existing] = await connection_1.pool.query("SELECT id FROM checklist_instances WHERE template_id = ? AND employee_id = ? AND period_key = ?", [templateId, employeeId, periodKey]);
        if (existing[0]) {
            return (await this.fetchInstanceWithItems(existing[0].id));
        }
        const instanceId = (0, uuid_1.v4)();
        const conn = await connection_1.pool.getConnection();
        try {
            await conn.beginTransaction();
            await conn.query("INSERT INTO checklist_instances (id, template_id, employee_id, period_key, period_start, period_end) VALUES (?, ?, ?, ?, ?, ?)", [instanceId, templateId, employeeId, periodKey, periodStart, periodEnd]);
            const [templateItems] = await conn.query("SELECT id FROM checklist_template_items WHERE template_id = ? ORDER BY sort_order ASC", [templateId]);
            for (const item of templateItems) {
                await conn.query("INSERT INTO checklist_instance_items (id, instance_id, template_item_id, is_checked) VALUES (?, ?, ?, 0)", [(0, uuid_1.v4)(), instanceId, item.id]);
            }
            await conn.commit();
        }
        catch (err) {
            await conn.rollback();
            throw err;
        }
        finally {
            conn.release();
        }
        return (await this.fetchInstanceWithItems(instanceId));
    }
    async getInstanceWithItems(instanceId) {
        return this.fetchInstanceWithItems(instanceId);
    }
    async setItemChecked(instanceId, itemId, checked) {
        await connection_1.pool.query("UPDATE checklist_instance_items SET is_checked = ?, checked_at = ? WHERE id = ? AND instance_id = ?", [checked, checked ? new Date() : null, itemId, instanceId]);
    }
    async listInstancesForEmployee(employeeId, periodStart, periodEnd) {
        const [rows] = await connection_1.pool.query(`SELECT id FROM checklist_instances WHERE employee_id = ? AND period_start >= ? AND period_end <= ?`, [employeeId, periodStart, periodEnd]);
        const results = [];
        for (const row of rows) {
            const instance = await this.fetchInstanceWithItems(row.id);
            if (instance)
                results.push(instance);
        }
        return results;
    }
}
exports.MySqlChecklistRepository = MySqlChecklistRepository;
//# sourceMappingURL=MySqlChecklistRepository.js.map