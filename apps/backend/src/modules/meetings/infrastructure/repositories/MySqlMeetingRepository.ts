import { v4 as uuid } from "uuid";
import { pool } from "../../../../infrastructure/database/mysql/connection";
import {
  ActionPriority, AgendaItem, Decision, Meeting, MeetingAction, MeetingActionWithStatus, MeetingAttachment,
  MeetingStatus, MeetingType, ReviewSection, ReviewType,
} from "../../domain/entities/Meeting";
import { CreateMeetingData, IMeetingRepository, ListMeetingsParams } from "../../domain/repositories/IMeetingRepository";

function mapMeeting(row: any): Meeting {
  return {
    id: row.id, meetingType: row.meeting_type, title: row.title, meetingDate: row.meeting_date, status: row.status,
    organizedBy: row.organized_by, discussionNotes: row.discussion_notes, previousMeetingId: row.previous_meeting_id,
    createdAt: row.created_at, updatedAt: row.updated_at,
  };
}

const ACTION_WITH_STATUS_SELECT = `
  SELECT ma.*, e.full_name as assignee_name, dt.base_status, dt.due_date
  FROM meeting_actions ma
  JOIN employees e ON e.id = ma.assigned_to
  LEFT JOIN delegated_tasks dt ON dt.id = ma.linked_delegated_task_id
`;

function mapAction(row: any): MeetingActionWithStatus {
  const status = row.base_status === "completed" ? "completed"
    : row.due_date && new Date(row.due_date) < new Date(new Date().toDateString()) && row.base_status !== "completed" ? "delayed"
    : (row.base_status ?? "pending");
  return {
    id: row.id, meetingId: row.meeting_id, description: row.description, assignedTo: row.assigned_to,
    targetDate: row.target_date, priority: row.priority, linkedDelegatedTaskId: row.linked_delegated_task_id,
    assigneeName: row.assignee_name, status,
  };
}

export class MySqlMeetingRepository implements IMeetingRepository {
  async create(data: CreateMeetingData): Promise<Meeting> {
    const id = data.id || uuid();
    await pool.query(
      "INSERT INTO meetings (id, meeting_type, title, meeting_date, organized_by, previous_meeting_id) VALUES (?, ?, ?, ?, ?, ?)",
      [id, data.meetingType, data.title, data.meetingDate, data.organizedBy, data.previousMeetingId ?? null]
    );
    return (await this.findById(id))!;
  }

  async findById(id: string): Promise<Meeting | null> {
    const [rows] = await pool.query<any[]>("SELECT * FROM meetings WHERE id = ? AND deleted_at IS NULL", [id]);
    return rows[0] ? mapMeeting(rows[0]) : null;
  }

  async findLatestByType(meetingType: MeetingType, beforeDate: string): Promise<Meeting | null> {
    const [rows] = await pool.query<any[]>(
      "SELECT * FROM meetings WHERE meeting_type = ? AND meeting_date < ? AND deleted_at IS NULL ORDER BY meeting_date DESC LIMIT 1",
      [meetingType, beforeDate]
    );
    return rows[0] ? mapMeeting(rows[0]) : null;
  }

  async list(params: ListMeetingsParams) {
    const offset = (params.page - 1) * params.pageSize;
    const conditions = ["deleted_at IS NULL"];
    const values: unknown[] = [];
    if (params.search) { conditions.push("(title LIKE ? OR discussion_notes LIKE ?)"); values.push(`%${params.search}%`, `%${params.search}%`); }
    if (params.meetingType) { conditions.push("meeting_type = ?"); values.push(params.meetingType); }
    if (params.status) { conditions.push("status = ?"); values.push(params.status); }
    if (params.dateFrom) { conditions.push("meeting_date >= ?"); values.push(params.dateFrom); }
    if (params.dateTo) { conditions.push("meeting_date <= ?"); values.push(params.dateTo); }
    const whereClause = `WHERE ${conditions.join(" AND ")}`;

    const [rows] = await pool.query<any[]>(
      `SELECT * FROM meetings ${whereClause} ORDER BY meeting_date DESC LIMIT ? OFFSET ?`,
      [...values, params.pageSize, offset]
    );
    const [countRows] = await pool.query<any[]>(`SELECT COUNT(*) as total FROM meetings ${whereClause}`, values);
    return { items: rows.map(mapMeeting), total: countRows[0].total as number };
  }

  async update(id: string, changes: Partial<{ title: string; meetingDate: string; status: MeetingStatus; discussionNotes: string | null }>): Promise<Meeting> {
    const fieldMap: Record<string, string> = { title: "title", meetingDate: "meeting_date", status: "status", discussionNotes: "discussion_notes" };
    const fields: string[] = [];
    const values: unknown[] = [];
    for (const [key, column] of Object.entries(fieldMap)) {
      const value = (changes as any)[key];
      if (value !== undefined) { fields.push(`${column} = ?`); values.push(value); }
    }
    if (fields.length > 0) {
      values.push(id);
      await pool.query(`UPDATE meetings SET ${fields.join(", ")} WHERE id = ?`, values);
    }
    return (await this.findById(id))!;
  }

  async softDelete(id: string): Promise<void> {
    await pool.query("UPDATE meetings SET deleted_at = NOW() WHERE id = ?", [id]);
  }

  async addAttendee(meetingId: string, employeeId: string): Promise<void> {
    await pool.query("INSERT IGNORE INTO meeting_attendees (id, meeting_id, employee_id) VALUES (?, ?, ?)", [uuid(), meetingId, employeeId]);
  }

  async listAttendees(meetingId: string): Promise<{ employeeId: string; fullName: string }[]> {
    const [rows] = await pool.query<any[]>(
      "SELECT e.id as employee_id, e.full_name FROM meeting_attendees ma JOIN employees e ON e.id = ma.employee_id WHERE ma.meeting_id = ?",
      [meetingId]
    );
    return rows.map((r) => ({ employeeId: r.employee_id, fullName: r.full_name }));
  }

  async addAgendaItem(meetingId: string, itemText: string, sortOrder: number): Promise<AgendaItem> {
    const id = uuid();
    await pool.query("INSERT INTO meeting_agenda_items (id, meeting_id, item_text, sort_order) VALUES (?, ?, ?, ?)", [id, meetingId, itemText, sortOrder]);
    const [rows] = await pool.query<any[]>("SELECT * FROM meeting_agenda_items WHERE id = ?", [id]);
    return { id: rows[0].id, meetingId: rows[0].meeting_id, sortOrder: rows[0].sort_order, itemText: rows[0].item_text };
  }

  async listAgendaItems(meetingId: string): Promise<AgendaItem[]> {
    const [rows] = await pool.query<any[]>("SELECT * FROM meeting_agenda_items WHERE meeting_id = ? ORDER BY sort_order ASC", [meetingId]);
    return rows.map((r) => ({ id: r.id, meetingId: r.meeting_id, sortOrder: r.sort_order, itemText: r.item_text }));
  }

  async upsertReviewSection(meetingId: string, reviewType: ReviewType, reportTypeRef: string | null, notes: string | null): Promise<ReviewSection> {
    const [existing] = await pool.query<any[]>("SELECT id FROM meeting_review_sections WHERE meeting_id = ? AND review_type = ?", [meetingId, reviewType]);
    let id: string;
    if (existing[0]) {
      id = existing[0].id;
      await pool.query("UPDATE meeting_review_sections SET report_type_ref = ?, notes = ? WHERE id = ?", [reportTypeRef, notes, id]);
    } else {
      id = uuid();
      await pool.query("INSERT INTO meeting_review_sections (id, meeting_id, review_type, report_type_ref, notes) VALUES (?, ?, ?, ?, ?)", [id, meetingId, reviewType, reportTypeRef, notes]);
    }
    const [rows] = await pool.query<any[]>("SELECT * FROM meeting_review_sections WHERE id = ?", [id]);
    return { id: rows[0].id, meetingId: rows[0].meeting_id, reviewType: rows[0].review_type, reportTypeRef: rows[0].report_type_ref, notes: rows[0].notes };
  }

  async listReviewSections(meetingId: string): Promise<ReviewSection[]> {
    const [rows] = await pool.query<any[]>("SELECT * FROM meeting_review_sections WHERE meeting_id = ?", [meetingId]);
    return rows.map((r) => ({ id: r.id, meetingId: r.meeting_id, reviewType: r.review_type, reportTypeRef: r.report_type_ref, notes: r.notes }));
  }

  async addDecision(meetingId: string, decisionText: string): Promise<Decision> {
    const id = uuid();
    await pool.query("INSERT INTO meeting_decisions (id, meeting_id, decision_text) VALUES (?, ?, ?)", [id, meetingId, decisionText]);
    const [rows] = await pool.query<any[]>("SELECT * FROM meeting_decisions WHERE id = ?", [id]);
    return { id: rows[0].id, meetingId: rows[0].meeting_id, decisionText: rows[0].decision_text, decidedAt: rows[0].decided_at };
  }

  async listDecisions(meetingId: string): Promise<Decision[]> {
    const [rows] = await pool.query<any[]>("SELECT * FROM meeting_decisions WHERE meeting_id = ? ORDER BY decided_at ASC", [meetingId]);
    return rows.map((r) => ({ id: r.id, meetingId: r.meeting_id, decisionText: r.decision_text, decidedAt: r.decided_at }));
  }

  async createAction(data: { id: string; meetingId: string; description: string; assignedTo: string; targetDate: string; priority: ActionPriority; linkedDelegatedTaskId: string | null }): Promise<MeetingAction> {
    await pool.query(
      "INSERT INTO meeting_actions (id, meeting_id, description, assigned_to, target_date, priority, linked_delegated_task_id) VALUES (?, ?, ?, ?, ?, ?, ?)",
      [data.id, data.meetingId, data.description, data.assignedTo, data.targetDate, data.priority, data.linkedDelegatedTaskId]
    );
    const [rows] = await pool.query<any[]>("SELECT * FROM meeting_actions WHERE id = ?", [data.id]);
    const r = rows[0];
    return { id: r.id, meetingId: r.meeting_id, description: r.description, assignedTo: r.assigned_to, targetDate: r.target_date, priority: r.priority, linkedDelegatedTaskId: r.linked_delegated_task_id };
  }

  async listActionsForMeeting(meetingId: string): Promise<MeetingActionWithStatus[]> {
    const [rows] = await pool.query<any[]>(`${ACTION_WITH_STATUS_SELECT} WHERE ma.meeting_id = ?`, [meetingId]);
    return rows.map(mapAction);
  }

  async listPendingActions(): Promise<MeetingActionWithStatus[]> {
    const [rows] = await pool.query<any[]>(`${ACTION_WITH_STATUS_SELECT} WHERE dt.base_status IS NULL OR dt.base_status != 'completed'`);
    return rows.map(mapAction);
  }

  async listCompletedActions(): Promise<MeetingActionWithStatus[]> {
    const [rows] = await pool.query<any[]>(`${ACTION_WITH_STATUS_SELECT} WHERE dt.base_status = 'completed'`);
    return rows.map(mapAction);
  }

  async addAttachment(meetingId: string, fileName: string, fileUrl: string, uploadedBy: string | null): Promise<MeetingAttachment> {
    const id = uuid();
    await pool.query("INSERT INTO meeting_attachments (id, meeting_id, file_name, file_url, uploaded_by) VALUES (?, ?, ?, ?, ?)", [id, meetingId, fileName, fileUrl, uploadedBy]);
    const [rows] = await pool.query<any[]>("SELECT * FROM meeting_attachments WHERE id = ?", [id]);
    const r = rows[0];
    return { id: r.id, meetingId: r.meeting_id, fileName: r.file_name, fileUrl: r.file_url, uploadedBy: r.uploaded_by, uploadedAt: r.uploaded_at };
  }

  async listAttachments(meetingId: string): Promise<MeetingAttachment[]> {
    const [rows] = await pool.query<any[]>("SELECT * FROM meeting_attachments WHERE meeting_id = ?", [meetingId]);
    return rows.map((r) => ({ id: r.id, meetingId: r.meeting_id, fileName: r.file_name, fileUrl: r.file_url, uploadedBy: r.uploaded_by, uploadedAt: r.uploaded_at }));
  }
}
