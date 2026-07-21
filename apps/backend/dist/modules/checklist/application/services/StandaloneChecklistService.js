"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.StandaloneChecklistService = void 0;
const uuid_1 = require("uuid");
const connection_1 = require("../../../../infrastructure/database/mysql/connection");
class StandaloneChecklistService {
    async createChecklist(dto, assignedBy) {
        const id = (0, uuid_1.v4)();
        const now = new Date();
        const checklist = {
            id,
            assignedBy,
            taskName: dto.taskName,
            assignTo: dto.assignTo,
            plannedDate: new Date(dto.plannedDate),
            priority: dto.priority,
            makeAttachmentMandatory: dto.makeAttachmentMandatory,
            makeNoteMandatory: dto.makeNoteMandatory,
            mode: dto.mode,
            frequency: dto.frequency,
            remindBeforeDays: dto.remindBeforeDays,
            skipOnHolidays: dto.skipOnHolidays,
            createdAt: now,
            updatedAt: now,
        };
        await connection_1.pool.query(`INSERT INTO standalone_checklists (
        id, assigned_by, task_name, assign_to, planned_date, priority,
        make_attachment_mandatory, make_note_mandatory, mode, frequency,
        remind_before_days, skip_on_holidays, created_at, updated_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`, [
            checklist.id,
            checklist.assignedBy,
            checklist.taskName,
            checklist.assignTo,
            checklist.plannedDate,
            checklist.priority,
            checklist.makeAttachmentMandatory,
            checklist.makeNoteMandatory,
            checklist.mode,
            checklist.frequency,
            checklist.remindBeforeDays,
            checklist.skipOnHolidays,
            checklist.createdAt,
            checklist.updatedAt,
        ]);
        return checklist;
    }
    async getAllChecklists() {
        const [rows] = await connection_1.pool.query(`SELECT c.*, 
        e1.full_name as assigner_name,
        e2.full_name as assignee_name
       FROM standalone_checklists c
       LEFT JOIN employees e1 ON e1.id = c.assigned_by
       LEFT JOIN employees e2 ON e2.id = c.assign_to
       WHERE c.deleted_at IS NULL
       ORDER BY c.created_at DESC`);
        return rows.map((row) => ({
            ...row,
            make_attachment_mandatory: !!row.make_attachment_mandatory,
            make_note_mandatory: !!row.make_note_mandatory,
            skip_on_holidays: !!row.skip_on_holidays,
        }));
    }
    async deleteChecklist(id) {
        await connection_1.pool.query("UPDATE standalone_checklists SET deleted_at = NOW() WHERE id = ?", [id]);
    }
}
exports.StandaloneChecklistService = StandaloneChecklistService;
//# sourceMappingURL=StandaloneChecklistService.js.map