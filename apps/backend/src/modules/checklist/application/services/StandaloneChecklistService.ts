import { v4 as uuidv4 } from "uuid";
import { StandaloneChecklist } from "../../domain/entities/StandaloneChecklist";
import { CreateStandaloneChecklistDto } from "../dto/checklist.dto";
import { pool } from "../../../../infrastructure/database/mysql/connection";
import { NotificationService } from "../../../notifications/application/services/NotificationService";
import { MySqlNotificationRepository } from "../../../notifications/infrastructure/repositories/MySqlNotificationRepository";

const notificationService = new NotificationService(new MySqlNotificationRepository());

export class StandaloneChecklistService {
  async createChecklist(
    dto: CreateStandaloneChecklistDto,
    assignedBy: string
  ): Promise<StandaloneChecklist> {
    const id = uuidv4();
    const now = new Date();

    const checklist: StandaloneChecklist = {
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
      whenRule: dto.whenRule || "",
      remindBeforeDays: dto.remindBeforeDays,
      skipOnHolidays: dto.skipOnHolidays,
      createdAt: now,
      updatedAt: now,
    };

    await pool.query(
      `INSERT INTO standalone_checklists (
        id, assigned_by, task_name, assign_to, planned_date, priority,
        make_attachment_mandatory, make_note_mandatory, mode, frequency,
        when_rule, remind_before_days, skip_on_holidays, created_at, updated_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
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
        checklist.whenRule,
        checklist.remindBeforeDays,
        checklist.skipOnHolidays,
        checklist.createdAt,
        checklist.updatedAt,
      ]
    );

    // Send pipeline notification to assigned user
    try {
      const [empRows] = await pool.query<any[]>("SELECT user_id FROM employees WHERE id = ?", [dto.assignTo]);
      const targetUserId = empRows[0]?.user_id || dto.assignTo;
      const formattedDate = new Date(dto.plannedDate).toLocaleDateString("en-IN", {
        day: "numeric",
        month: "short",
        year: "numeric"
      });

      await notificationService.notify({
        type: "checklist.pipeline" as any,
        module: "office_performance" as any,
        assignedUserId: targetUserId,
        createdBy: assignedBy,
        title: `Checklist Pipeline: ${dto.taskName}`,
        description: `Apka task pipeline me hai jo ${formattedDate} ko aane wala hai`,
        dueDate: dto.plannedDate,
        priority: (dto.priority.toLowerCase() === "high" ? "high" : dto.priority.toLowerCase() === "medium" ? "medium" : "low") as any,
      });
    } catch (e) {
      console.error("Failed to trigger checklist pipeline notification:", e);
    }

    return checklist;
  }

  async getAllChecklists(): Promise<any[]> {
    const [rows] = await pool.query<any[]>(
      `SELECT c.*, 
        e1.full_name as assigner_name,
        e2.full_name as assignee_name
       FROM standalone_checklists c
       LEFT JOIN employees e1 ON e1.id = c.assigned_by
       LEFT JOIN employees e2 ON e2.id = c.assign_to
       WHERE c.deleted_at IS NULL
       ORDER BY c.created_at DESC`
    );
    return rows.map((row: any) => ({
      id: row.id,
      assignedBy: row.assigned_by,
      assignBy: row.assigned_by,
      assignTo: row.assign_to,
      taskName: row.task_name,
      plannedDate: row.planned_date,
      priority: row.priority,
      makeAttachmentMandatory: !!row.make_attachment_mandatory,
      makeNoteMandatory: !!row.make_note_mandatory,
      mode: row.mode,
      frequency: row.frequency,
      whenRule: row.when_rule || "",
      remindBeforeDays: row.remind_before_days,
      skipOnHolidays: !!row.skip_on_holidays,
      createdAt: row.created_at,
      updatedAt: row.updated_at,
      assigner_name: row.assigner_name,
      assignee_name: row.assignee_name,
    }));
  }

  async deleteChecklist(id: string): Promise<void> {
    await pool.query(
      "UPDATE standalone_checklists SET deleted_at = NOW() WHERE id = ?",
      [id]
    );
  }

  async bulkDeleteChecklists(ids: string[]): Promise<void> {
    if (ids.length === 0) return;
    const placeholders = ids.map(() => "?").join(",");
    await pool.query(
      `UPDATE standalone_checklists SET deleted_at = NOW() WHERE id IN (${placeholders})`,
      ids
    );
  }
}
