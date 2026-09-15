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

    let plannedDate = new Date(dto.plannedDate);
    if (dto.frequency && dto.frequency.toLowerCase() === "daily") {
      plannedDate.setHours(9, 0, 0, 0);
    }

    const checklist: StandaloneChecklist = {
      id,
      assignedBy,
      taskName: dto.taskName,
      assignTo: dto.assignTo,
      plannedDate,
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

    await pool.query(
      `INSERT INTO standalone_checklists (
        id, assigned_by, task_name, assign_to, planned_date, priority,
        make_attachment_mandatory, make_note_mandatory, mode, frequency,
        remind_before_days, skip_on_holidays, created_at, updated_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
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

    // Dismiss any notifications associated with this checklist
    try {
      await pool.query(
        `UPDATE notifications SET status = 'dismissed' WHERE reference_id = ? OR (module = 'office' AND description LIKE ?)`,
        [id, `%${id}%`]
      );
    } catch (e) {
      console.error("Failed to dismiss notifications for deleted checklist:", e);
    }
  }

  async completeChecklist(
    id: string,
    userId: string,
    notes?: string,
    attachmentUrl?: string,
    occurrenceDate?: string
  ): Promise<void> {
    // 1. Fetch employee ID from user ID
    const [empRows] = await pool.query<any[]>(
      "SELECT id FROM employees WHERE user_id = ? AND deleted_at IS NULL",
      [userId]
    );
    const employeeId = empRows[0]?.id;
    if (!employeeId) {
      throw new Error("Employee record not found for logged in user.");
    }

    // 2. Verify checklist exists and is assigned to the employee
    const [chkRows] = await pool.query<any[]>(
      "SELECT * FROM standalone_checklists WHERE id = ? AND deleted_at IS NULL",
      [id]
    );
    const checklist = chkRows[0];
    if (!checklist) {
      throw new Error("Checklist not found.");
    }

    const targetOccDate = occurrenceDate || parseLocalDateStr(new Date(checklist.planned_date));

    // 3. Log the completion with occurrence_date
    const completionId = uuidv4();
    await pool.query(
      `INSERT INTO standalone_checklist_completions (
        id, checklist_id, occurrence_date, completed_at, completed_by, notes, attachment_url
      ) VALUES (?, ?, ?, NOW(), ?, ?, ?)`,
      [completionId, id, targetOccDate, employeeId, notes || null, attachmentUrl || null]
    );
  }

  async getDashboardData(userId: string): Promise<any> {
    // Fetch employee
    const [empRows] = await pool.query<any[]>(
      "SELECT id FROM employees WHERE user_id = ? AND deleted_at IS NULL",
      [userId]
    );
    const employeeId = empRows[0]?.id;
    if (!employeeId) {
      return {
        metrics: { pendingCount: 0, completedToday: 0, totalCompleted: 0 },
        active: [],
        pipeline: [],
        history: [],
      };
    }

    // Fetch all active checklists assigned to this employee
    const [rows] = await pool.query<any[]>(
      `SELECT c.*, 
        e1.full_name as assigner_name
       FROM standalone_checklists c
       LEFT JOIN employees e1 ON e1.id = c.assigned_by
       WHERE c.assign_to = ? AND c.deleted_at IS NULL
       ORDER BY c.created_at DESC`,
      [employeeId]
    );

    // Fetch completions to map completed occurrences
    const [compRows] = await pool.query<any[]>(
      `SELECT c.checklist_id, c.occurrence_date, c.completed_at
       FROM standalone_checklist_completions c
       JOIN standalone_checklists sc ON sc.id = c.checklist_id
       WHERE c.completed_by = ? AND sc.deleted_at IS NULL`,
      [employeeId]
    );

    const completionsSet = new Set<string>();
    for (const comp of compRows) {
      const occStr = comp.occurrence_date 
        ? parseLocalDateStr(new Date(comp.occurrence_date))
        : parseLocalDateStr(new Date(comp.completed_at));
      completionsSet.add(`${comp.checklist_id}_${occStr}`);
    }

    const now = new Date();
    const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 0, 0, 0, 0);

    const activeList: any[] = [];
    const pipelineList: any[] = [];

    for (const row of rows) {
      const freq = (row.frequency || "one-time").toLowerCase().trim();
      const isOneTime = freq === "one-time" || freq === "once" || freq === "single";

      const initDate = new Date(row.planned_date);
      if (initDate.getHours() === 0 && initDate.getMinutes() === 0) {
        initDate.setHours(9, 0, 0, 0);
      }

      const occurrences: Date[] = [];
      let curr = new Date(initDate);

      if (isOneTime) {
        occurrences.push(new Date(curr));
      } else {
        let count = 0;
        while (count < 365) {
          count++;
          const curr9am = new Date(curr);
          curr9am.setHours(9, 0, 0, 0);

          occurrences.push(new Date(curr9am));

          if (curr9am > now) {
            break;
          }

          curr = getNextOccurrenceDate(curr, freq);
        }
      }

      for (const occDate of occurrences) {
        const dateStr = parseLocalDateStr(occDate);
        const occ9am = new Date(occDate);
        occ9am.setHours(9, 0, 0, 0);

        const compKey = `${row.id}_${dateStr}`;
        const isCompleted = completionsSet.has(compKey);

        if (!isCompleted) {
          const item = {
            id: row.id,
            occurrenceDate: dateStr,
            assignedBy: row.assigned_by,
            assignBy: row.assigned_by,
            assignTo: row.assign_to,
            taskName: row.task_name,
            plannedDate: occ9am.toISOString(),
            priority: row.priority,
            makeAttachmentMandatory: !!row.make_attachment_mandatory,
            makeNoteMandatory: !!row.make_note_mandatory,
            mode: row.mode,
            frequency: row.frequency,
            remindBeforeDays: row.remind_before_days,
            skipOnHolidays: !!row.skip_on_holidays,
            createdAt: row.created_at,
            updatedAt: row.updated_at,
            assigner_name: row.assigner_name,
            isOverdue: occ9am < startOfToday,
          };

          if (now >= occ9am) {
            activeList.push(item);
          } else {
            const diffTime = occ9am.getTime() - now.getTime();
            const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
            if (diffDays <= 7) {
              pipelineList.push(item);
            }
          }
        }
      }
    }

    // Counts
    const [todayRows] = await pool.query<any[]>(
      `SELECT COUNT(*) as count 
       FROM standalone_checklist_completions c
       JOIN standalone_checklists sc ON sc.id = c.checklist_id
       WHERE c.completed_by = ? 
         AND sc.deleted_at IS NULL
         AND c.completed_at >= DATE_FORMAT(NOW(), '%Y-%m-%d 00:00:00')`,
      [employeeId]
    );
    const completedToday = todayRows[0]?.count || 0;

    const [totalRows] = await pool.query<any[]>(
      `SELECT COUNT(*) as count 
       FROM standalone_checklist_completions c
       JOIN standalone_checklists sc ON sc.id = c.checklist_id
       WHERE c.completed_by = ?
         AND sc.deleted_at IS NULL`,
      [employeeId]
    );
    const totalCompleted = totalRows[0]?.count || 0;

    // History
    const [historyRows] = await pool.query<any[]>(
      `SELECT comp.*, chk.task_name, chk.priority, chk.frequency
       FROM standalone_checklist_completions comp
       JOIN standalone_checklists chk ON chk.id = comp.checklist_id
       WHERE comp.completed_by = ?
         AND chk.deleted_at IS NULL
       ORDER BY comp.completed_at DESC
       LIMIT 10`,
      [employeeId]
    );

    const history = historyRows.map((row: any) => ({
      id: row.id,
      checklistId: row.checklist_id,
      occurrenceDate: row.occurrence_date ? parseLocalDateStr(new Date(row.occurrence_date)) : null,
      completedAt: row.completed_at,
      notes: row.notes,
      attachmentUrl: row.attachment_url,
      taskName: row.task_name,
      priority: row.priority,
      frequency: row.frequency,
    }));

    return {
      metrics: {
        pendingCount: activeList.length,
        completedToday,
        totalCompleted,
      },
      active: activeList,
      pipeline: pipelineList,
      history,
    };
  }
}

function parseLocalDateStr(d: Date): string {
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

function getNextOccurrenceDate(current: Date, frequency: string): Date {
  const next = new Date(current);
  const freq = (frequency || "").toLowerCase().trim();

  if (freq === "daily") {
    next.setDate(next.getDate() + 1);
  } else if (freq === "weekly") {
    next.setDate(next.getDate() + 7);
  } else if (freq === "monthly") {
    next.setMonth(next.getMonth() + 1);
  } else if (freq === "quarterly") {
    next.setMonth(next.getMonth() + 3);
  } else if (freq === "half-yearly" || freq === "half_yearly" || freq === "half yearly" || freq === "bi-annually") {
    next.setMonth(next.getMonth() + 6);
  } else if (freq === "yearly" || freq === "annually") {
    next.setFullYear(next.getFullYear() + 1);
  } else {
    next.setDate(next.getDate() + 1);
  }
  return next;
}

