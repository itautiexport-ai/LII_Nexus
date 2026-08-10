import { v4 as uuidv4 } from "uuid";
import { StandaloneChecklist } from "../../domain/entities/StandaloneChecklist";
import { CreateStandaloneChecklistDto } from "../dto/checklist.dto";
import { pool } from "../../../../infrastructure/database/mysql/connection";
import { ScheduleParser } from "../utils/ScheduleParser";

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
      makeAttachmentMandatory: dto.makeAttachmentMandatory,
      makeNoteMandatory: dto.makeNoteMandatory,
      mode: dto.mode,
      frequency: dto.frequency,
      remindBeforeDays: dto.remindBeforeDays || "",
      reminderDays: dto.reminderDays,
      skipOnHolidays: dto.skipOnHolidays,
      createdAt: now,
      updatedAt: now,
    };

    await pool.query(
      `INSERT INTO standalone_checklists (
        id, assigned_by, task_name, assign_to, planned_date, priority,
        make_attachment_mandatory, make_note_mandatory, mode, frequency,
        reminder_days, remind_before_days, skip_on_holidays, created_at, updated_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        checklist.id,
        checklist.assignedBy,
        checklist.taskName,
        checklist.assignTo,
        new Date(), // dummy plannedDate
        "Low", // dummy priority
        checklist.makeAttachmentMandatory,
        checklist.makeNoteMandatory,
        checklist.mode,
        checklist.frequency,
        checklist.reminderDays || null,
        checklist.remindBeforeDays,
        checklist.skipOnHolidays,
        checklist.createdAt,
        checklist.updatedAt,
      ]
    );

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
    const mapped = rows.map((row: any) => ({
      id: row.id,
      assignedBy: row.assigned_by,
      assignBy: row.assigned_by,
      assignTo: row.assign_to,
      taskName: row.task_name,
      makeAttachmentMandatory: !!row.make_attachment_mandatory,
      makeNoteMandatory: !!row.make_note_mandatory,
      mode: row.mode,
      frequency: row.frequency,
      remindBeforeDays: row.remind_before_days,
      reminderDays: row.reminder_days,
      skipOnHolidays: !!row.skip_on_holidays,
      createdAt: row.created_at,
      updatedAt: row.updated_at,
      assigner_name: row.assigner_name,
      assignee_name: row.assignee_name,
    }));
    
    // Calculate visibility
    const today = new Date();
    return mapped.map(c => {
      let isVisible = true;
      if (c.remindBeforeDays && c.frequency !== "Daily") {
        // We want to check if ANY day from today to (today + reminderDays) falls on the schedule.
        // If yes, it's visible. (Meaning we are within the reminder window).
        let remindOffset = c.reminderDays || 0;
        if (c.frequency.toLowerCase().includes("week") && !c.reminderDays) {
          remindOffset = 1;
        }
        
        // If we are strictly waiting for the next schedule, we check if today is within remindOffset of next schedule.
        // Since our ScheduleParser only checks if a SPECIFIC date is the schedule, 
        // we can check if ANY date from today to today+remindOffset is in the schedule.
        isVisible = false;
        for (let i = 0; i <= remindOffset; i++) {
          const checkDate = new Date(today);
          checkDate.setDate(checkDate.getDate() + i);
          if (ScheduleParser.isTodayInSchedule(c.remindBeforeDays, checkDate)) {
            isVisible = true;
            break;
          }
        }
        console.log(`[Visibility Check] Task: ${c.taskName}, Schedule: ${c.remindBeforeDays}, Reminder: ${c.reminderDays}, Offset: ${remindOffset}, IsVisible: ${isVisible}`);
      }
        
        // Also if it's already past due? Since we don't track completion by instances, we just show it if it's visible.
        // But if they haven't completed it, it should probably stay visible. 
        // For simplicity, we just check if it's in the window. If they miss it, it hides. 
        // (This matches the limitation of standalone_checklists)
      
      return { ...c, isVisible };
    });
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
