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

    const plannedDateStr = getIstDateStr(dto.plannedDate);
    const plannedDateDb = `${plannedDateStr} 09:00:00`;
    const plannedDateObj = getIst9AmDate(plannedDateStr);

    const checklist: StandaloneChecklist = {
      id,
      assignedBy,
      taskName: dto.taskName,
      assignTo: dto.assignTo,
      plannedDate: plannedDateObj,
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
        plannedDateDb,
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
      const formattedDate = new Date(`${plannedDateStr}T09:00:00+05:30`).toLocaleDateString("en-IN", {
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
    // 1. Fetch employee ID from user ID (handling both employee UUID and user UUID)
    const [empRows] = await pool.query<any[]>(
      "SELECT id, user_id FROM employees WHERE (user_id = ? OR id = ?) AND deleted_at IS NULL",
      [userId, userId]
    );
    const employeeId = empRows[0]?.id || userId;

    // 2. Verify checklist exists
    const [chkRows] = await pool.query<any[]>(
      "SELECT * FROM standalone_checklists WHERE id = ? AND deleted_at IS NULL",
      [id]
    );
    const checklist = chkRows[0];
    if (!checklist) {
      throw new Error("Checklist not found.");
    }

    const freq = (checklist.frequency || "one-time").toLowerCase().trim();
    const isRecurring = freq !== "one-time" && freq !== "once" && freq !== "single";
    const targetOccDate = occurrenceDate || (isRecurring ? getIstDateStr(new Date()) : getIstDateStr(checklist.planned_date));

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
    // Fetch employee (cross-referencing user UUID and employee UUID, matching TaskCenterService)
    const [empRows] = await pool.query<any[]>(
      "SELECT id, user_id FROM employees WHERE (user_id = ? OR id = ?) AND deleted_at IS NULL",
      [userId, userId]
    );
    const employeeId = empRows[0]?.id || userId;
    const linkedUserId = empRows[0]?.user_id || userId;
    const myIds = Array.from(new Set([userId, employeeId, linkedUserId].filter(Boolean)));

    if (!empRows.length && !userId) {
      return {
        metrics: { pendingCount: 0, completedToday: 0, totalCompleted: 0 },
        active: [],
        pipeline: [],
        history: [],
      };
    }

    // Fetch all active checklists assigned to this employee / user
    const [rows] = await pool.query<any[]>(
      `SELECT c.*,
        e1.full_name as assigner_name
       FROM standalone_checklists c
       LEFT JOIN employees e1 ON e1.id = c.assigned_by
       WHERE c.assign_to IN (?) AND c.deleted_at IS NULL
       ORDER BY c.created_at DESC`,
      [myIds]
    );

    // Fetch completions to map completed occurrences
    const [compRows] = await pool.query<any[]>(
      `SELECT c.checklist_id, c.occurrence_date, c.completed_at
       FROM standalone_checklist_completions c
       JOIN standalone_checklists sc ON sc.id = c.checklist_id
       WHERE c.completed_by IN (?) AND sc.deleted_at IS NULL`,
      [myIds]
    );

    const completionsSet = new Set<string>();
    const completedChecklistIds = new Set<string>();
    for (const comp of compRows) {
      completedChecklistIds.add(comp.checklist_id);
      const occStr = comp.occurrence_date
        ? (typeof comp.occurrence_date === "string"
            ? comp.occurrence_date.slice(0, 10)
            : getIstDateStr(comp.occurrence_date))
        : getIstDateStr(comp.completed_at);
      completionsSet.add(`${comp.checklist_id}_${occStr}`);
    }

    const now = new Date();
    const todayDateStr = getIstDateStr(now);
    const startOfTodayIst = getStartOfTodayIst(now);

    const activeList: any[] = [];
    const pipelineList: any[] = [];

    for (const row of rows) {
      const freq = (row.frequency || "one-time").toLowerCase().trim();
      const isOneTime = freq === "one-time" || freq === "once" || freq === "single";

      const startDateStr = getIstDateStr(row.planned_date);
      let curr = getIst9AmDate(startDateStr);

      const occurrences: Date[] = [];

      if (isOneTime) {
        occurrences.push(new Date(curr));
      } else {
        let count = 0;
        while (count < 365) {
          count++;
          occurrences.push(new Date(curr));

          if (curr > now) {
            break;
          }

          curr = getNextOccurrenceDate(curr, freq);
        }
      }

      for (const occDate of occurrences) {
        const dateStr = getIstDateStr(occDate);

        const compKey = `${row.id}_${dateStr}`;
        const isCompleted = isOneTime
          ? completedChecklistIds.has(row.id)
          : completionsSet.has(compKey);

        if (!isCompleted) {
          const item = {
            id: row.id,
            occurrenceDate: dateStr,
            assignedBy: row.assigned_by,
            assignBy: row.assigned_by,
            assignTo: row.assign_to,
            taskName: row.task_name,
            plannedDate: occDate.toISOString(),
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
            isOverdue: occDate < startOfTodayIst,
          };

          if (now >= occDate) {
            activeList.push(item);
          } else {
            const diffTime = occDate.getTime() - now.getTime();
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
       WHERE c.completed_by IN (?)
         AND sc.deleted_at IS NULL
         AND (c.occurrence_date = ? OR (c.occurrence_date IS NULL AND c.completed_at >= ?))`,
      [myIds, todayDateStr, `${todayDateStr} 00:00:00`]
    );
    const completedToday = todayRows[0]?.count || 0;

    const [totalRows] = await pool.query<any[]>(
      `SELECT COUNT(*) as count
       FROM standalone_checklist_completions c
       JOIN standalone_checklists sc ON sc.id = c.checklist_id
       WHERE c.completed_by IN (?)
         AND sc.deleted_at IS NULL`,
      [myIds]
    );
    const totalCompleted = totalRows[0]?.count || 0;

    // History
    const [historyRows] = await pool.query<any[]>(
      `SELECT comp.*, chk.task_name, chk.priority, chk.frequency
       FROM standalone_checklist_completions comp
       JOIN standalone_checklists chk ON chk.id = comp.checklist_id
       WHERE comp.completed_by IN (?)
         AND chk.deleted_at IS NULL
       ORDER BY comp.completed_at DESC
       LIMIT 10`,
      [myIds]
    );

    const history = historyRows.map((row: any) => ({
      id: row.id,
      checklistId: row.checklist_id,
      occurrenceDate: row.occurrence_date ? getIstDateStr(row.occurrence_date) : null,
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

function getIstDateStr(d: Date | string): string {
  if (!d) return "";
  if (typeof d === "string") {
    if (d.includes(" ") || d.length === 10) {
      return d.slice(0, 10);
    }
    const parsed = new Date(d);
    if (!isNaN(parsed.getTime())) {
      return new Intl.DateTimeFormat("en-CA", {
        timeZone: "Asia/Kolkata",
        year: "numeric",
        month: "2-digit",
        day: "2-digit",
      }).format(parsed);
    }
    return d.slice(0, 10);
  }
  return new Intl.DateTimeFormat("en-CA", {
    timeZone: "Asia/Kolkata",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(d);
}

function getIst9AmDate(dateStr: string): Date {
  const [y, m, d] = dateStr.slice(0, 10).split("-").map(Number);
  // 09:00:00 Asia/Kolkata (IST = UTC+05:30) corresponds precisely to 03:30:00 UTC
  return new Date(Date.UTC(y, m - 1, d, 3, 30, 0, 0));
}

function getStartOfTodayIst(now: Date): Date {
  const todayStr = getIstDateStr(now);
  const [y, m, d] = todayStr.split("-").map(Number);
  // 00:00:00 Asia/Kolkata is 18:30:00 UTC of previous day
  return new Date(Date.UTC(y, m - 1, d - 1, 18, 30, 0, 0));
}

function getNextOccurrenceDate(current: Date, frequency: string): Date {
  const dateStr = getIstDateStr(current);
  const [y, m, d] = dateStr.split("-").map(Number);
  const freq = (frequency || "").toLowerCase().trim();

  // Anchor in UTC at 03:30:00 (which is 09:00:00 IST)
  const nextUtc = new Date(Date.UTC(y, m - 1, d, 3, 30, 0, 0));

  if (freq === "daily") {
    nextUtc.setUTCDate(nextUtc.getUTCDate() + 1);
  } else if (freq === "weekly") {
    nextUtc.setUTCDate(nextUtc.getUTCDate() + 7);
  } else if (freq === "monthly") {
    nextUtc.setUTCMonth(nextUtc.getUTCMonth() + 1);
  } else if (freq === "quarterly") {
    nextUtc.setUTCMonth(nextUtc.getUTCMonth() + 3);
  } else if (freq === "half-yearly" || freq === "half_yearly" || freq === "half yearly" || freq === "bi-annually") {
    nextUtc.setUTCMonth(nextUtc.getUTCMonth() + 6);
  } else if (freq === "yearly" || freq === "annually") {
    nextUtc.setUTCFullYear(nextUtc.getUTCFullYear() + 1);
  } else {
    nextUtc.setUTCDate(nextUtc.getUTCDate() + 1);
  }
  return nextUtc;
}

