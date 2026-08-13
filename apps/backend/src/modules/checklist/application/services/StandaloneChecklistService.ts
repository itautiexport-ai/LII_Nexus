import { v4 as uuidv4 } from "uuid";
import * as xlsx from "xlsx";
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

  async getBulkTemplate(): Promise<Buffer> {
    const wsData = [
      [
        "Task Name",
        "Assignee Name",
        "Planned Date (YYYY-MM-DD HH:mm:ss)",
        "Priority (Low/Medium/High)",
        "Mode (Online/Physical)",
        "Frequency (Daily/Weekly/Monthly/Quarterly/Half-Yearly/Yearly)",
        "Schedule Rule (e.g., Mon,Wed or 1,15)",
        "Remind Before Days",
        "Mandatory Attachment (Yes/No)",
        "Mandatory Note (Yes/No)",
        "Skip On Holidays (Yes/No)",
      ],
      [
        "Example Task",
        "John Doe",
        "2026-09-01 09:00:00",
        "Medium",
        "Online",
        "Weekly",
        "Mon,Wed,Fri",
        "1",
        "No",
        "Yes",
        "Yes",
      ],
    ];

    const ws = xlsx.utils.aoa_to_sheet(wsData);

    // Optional: Auto-size columns slightly
    ws["!cols"] = [
      { wch: 25 },
      { wch: 20 },
      { wch: 30 },
      { wch: 20 },
      { wch: 15 },
      { wch: 25 },
      { wch: 25 },
      { wch: 20 },
      { wch: 25 },
      { wch: 20 },
      { wch: 20 },
    ];

    const wb = xlsx.utils.book_new();
    xlsx.utils.book_append_sheet(wb, ws, "Checklist_Template");

    return xlsx.write(wb, { type: "buffer", bookType: "xlsx" });
  }

  async bulkUploadChecklists(buffer: Buffer, assignedBy: string): Promise<any> {
    const wb = xlsx.read(buffer, { type: "buffer" });
    const ws = wb.Sheets[wb.SheetNames[0]];
    const data: any[] = xlsx.utils.sheet_to_json(ws);

    if (!data || data.length === 0) {
      throw new Error("Uploaded file is empty.");
    }

    // Pre-fetch all employees to map names to IDs
    const [empRows] = await pool.query<any[]>("SELECT id, full_name FROM employees WHERE deleted_at IS NULL");
    const empMap = new Map<string, string>();
    for (const emp of empRows) {
      empMap.set(emp.full_name.trim().toLowerCase(), emp.id);
    }

    const createdChecklists = [];
    let successCount = 0;
    const errors: string[] = [];

    const now = new Date();

    for (let i = 0; i < data.length; i++) {
      const row = data[i];
      const rowNum = i + 2; // +1 for 0-index, +1 for header

      const taskName = row["Task Name"]?.toString().trim();
      const assigneeName = row["Assignee Name"]?.toString().trim();
      const plannedDateStr = row["Planned Date (YYYY-MM-DD HH:mm:ss)"]?.toString().trim();
      const priorityStr = row["Priority (Low/Medium/High)"]?.toString().trim() || "Medium";
      const mode = row["Mode (Online/Physical)"]?.toString().trim() || "Online";
      const frequency = row["Frequency (Daily/Weekly/Monthly/Quarterly/Half-Yearly/Yearly)"]?.toString().trim() || "Daily";
      const whenRule = row["Schedule Rule (e.g., Mon,Wed or 1,15)"]?.toString().trim() || "";
      const remindDays = parseInt(row["Remind Before Days"]?.toString(), 10) || 0;
      const attMandatory = row["Mandatory Attachment (Yes/No)"]?.toString().trim().toLowerCase() === "yes";
      const noteMandatory = row["Mandatory Note (Yes/No)"]?.toString().trim().toLowerCase() === "yes";
      const skipHolidays = row["Skip On Holidays (Yes/No)"]?.toString().trim().toLowerCase() === "yes";

      if (!taskName) {
        errors.push(`Row ${rowNum}: Task Name is required.`);
        continue;
      }
      if (!assigneeName) {
        errors.push(`Row ${rowNum}: Assignee Name is required.`);
        continue;
      }
      const assignTo = empMap.get(assigneeName.toLowerCase());
      if (!assignTo) {
        errors.push(`Row ${rowNum}: Employee '${assigneeName}' not found.`);
        continue;
      }
      if (!plannedDateStr) {
        errors.push(`Row ${rowNum}: Planned Date is required.`);
        continue;
      }

      // Convert priority to canonical format
      let priority: "Low" | "Medium" | "High" = "Medium";
      if (priorityStr.toLowerCase() === "low") priority = "Low";
      if (priorityStr.toLowerCase() === "high") priority = "High";

      const plannedDate = new Date(plannedDateStr);
      if (isNaN(plannedDate.getTime())) {
        errors.push(`Row ${rowNum}: Invalid Planned Date format.`);
        continue;
      }

      const id = uuidv4();

      try {
        await pool.query(
          `INSERT INTO standalone_checklists (
            id, assigned_by, task_name, assign_to, planned_date, priority,
            make_attachment_mandatory, make_note_mandatory, mode, frequency,
            when_rule, remind_before_days, skip_on_holidays, created_at, updated_at
          ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
          [
            id,
            assignedBy,
            taskName,
            assignTo,
            plannedDate,
            priority,
            attMandatory,
            noteMandatory,
            mode,
            frequency,
            whenRule,
            remindDays,
            skipHolidays,
            now,
            now,
          ]
        );
        successCount++;
        createdChecklists.push({ id, taskName, assignTo });
      } catch (e: any) {
        errors.push(`Row ${rowNum}: DB Error - ${e.message}`);
      }
    }

    // Trigger pipeline notifications for successful uploads
    for (const c of createdChecklists) {
      try {
        const [uRows] = await pool.query<any[]>("SELECT user_id FROM employees WHERE id = ?", [c.assignTo]);
        const targetUserId = uRows[0]?.user_id || c.assignTo;
        
        await notificationService.notify({
          type: "checklist.pipeline" as any,
          module: "office_performance" as any,
          assignedUserId: targetUserId,
          createdBy: assignedBy,
          title: `Checklist Pipeline: ${c.taskName}`,
          description: `You have a new checklist pipeline task: ${c.taskName}`,
          dueDate: now.toISOString(),
          priority: "medium",
        });
      } catch (e) {
        // Silently ignore notification failures in bulk upload
      }
    }

    return {
      totalProcessed: data.length,
      successCount,
      errorCount: errors.length,
      errors
    };
  }

  private calculateNextDate(currentPlannedDate: Date, frequency: string, whenRule: string): Date {
    const nextDate = new Date(currentPlannedDate);
    const now = new Date();
    
    // Extract all numbers from whenRule for days
    const daysMatch = whenRule.match(/\d+/g);
    const days = daysMatch ? daysMatch.map(Number).filter(d => d >= 1 && d <= 31) : [];

    if (frequency === "Daily") {
      nextDate.setTime(now.getTime() + 24 * 60 * 60 * 1000);
      nextDate.setHours(9, 0, 0, 0); // Default to 9am
      return nextDate;
    } else if (frequency === "Monthly" && days.length > 0) {
      // Find the next closest day in the current month or next month
      let bestDate = new Date(now.getFullYear(), now.getMonth(), 1, 9, 0, 0);
      let found = false;
      
      // Sort days
      days.sort((a,b) => a - b);
      
      for (const d of days) {
         const candidate = new Date(now.getFullYear(), now.getMonth(), d, 9, 0, 0);
         if (candidate > now) {
           bestDate = candidate;
           found = true;
           break;
         }
      }
      if (!found) {
         // Next month, first available day
         bestDate = new Date(now.getFullYear(), now.getMonth() + 1, days[0], 9, 0, 0);
      }
      return bestDate;
    } else {
       // Fallback for others (just add 1 month for Monthly, 7 days for Weekly etc)
       if (frequency === "Weekly" || frequency === "Alternate") {
          nextDate.setTime(now.getTime() + 7 * 24 * 60 * 60 * 1000);
       } else if (frequency === "Monthly") {
          nextDate.setMonth(now.getMonth() + 1);
       } else if (frequency === "Quarterly") {
          nextDate.setMonth(now.getMonth() + 3);
       } else if (frequency === "Yearly") {
          nextDate.setFullYear(now.getFullYear() + 1);
       }
       nextDate.setHours(9, 0, 0, 0);
    }
    
    return nextDate;
  }

  async completeChecklist(id: string): Promise<void> {
    const [rows] = await pool.query<any[]>("SELECT frequency, when_rule, planned_date FROM standalone_checklists WHERE id = ?", [id]);
    if (rows.length === 0) return;

    const row = rows[0];
    const nextDate = this.calculateNextDate(new Date(row.planned_date), row.frequency, row.when_rule || "");

    await pool.query(
      "UPDATE standalone_checklists SET planned_date = ? WHERE id = ?",
      [nextDate, id]
    );
  }
}

