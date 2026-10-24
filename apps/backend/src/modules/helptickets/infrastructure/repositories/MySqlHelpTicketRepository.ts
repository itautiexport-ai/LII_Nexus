import { v4 as uuidv4 } from "uuid";
import { pool } from "../../../../infrastructure/database/mysql/connection";
import {
  HelpTicket,
  IHelpTicketRepository,
} from "../../domain/repositories/IHelpTicketRepository";

function mapRow(row: any): HelpTicket {
  return {
    id: row.id,
    subject: row.subject,
    problemSolverId: row.problem_solver_id,
    problemSolverName: row.problem_solver_name,
    problem: row.problem,
    mediaUrl: row.media_url,
    priority: row.priority,
    plannedDate: row.planned_date ? (row.planned_date instanceof Date ? row.planned_date.toISOString().split("T")[0] : String(row.planned_date).split("T")[0]) : null,
    attachmentMandatory: !!row.attachment_mandatory,
    status: row.status,
    createdBy: row.created_by,
    createdByName: row.created_by_name,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

const SELECT_BASE = `
  SELECT 
    ht.*,
    ps.full_name AS problem_solver_name,
    cb.full_name AS created_by_name
  FROM help_tickets ht
  LEFT JOIN employees ps ON ps.id = ht.problem_solver_id
  LEFT JOIN users cb ON cb.id = ht.created_by
  WHERE ht.deleted_at IS NULL
`;

export class MySqlHelpTicketRepository implements IHelpTicketRepository {
  async create(ticket: HelpTicket): Promise<void> {
    await pool.execute(
      `INSERT INTO help_tickets 
        (id, subject, problem_solver_id, problem, media_url, priority, planned_date, attachment_mandatory, status, created_by)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        ticket.id,
        ticket.subject,
        ticket.problemSolverId,
        ticket.problem,
        ticket.mediaUrl ?? null,
        ticket.priority,
        ticket.plannedDate ?? null,
        ticket.attachmentMandatory ? 1 : 0,
        ticket.status,
        ticket.createdBy,
      ]
    );
  }

  async findById(id: string): Promise<HelpTicket | null> {
    const [rows] = await pool.execute(`${SELECT_BASE} AND ht.id = ?`, [id]) as any[];
    return rows.length ? mapRow(rows[0]) : null;
  }

  async listAll(): Promise<HelpTicket[]> {
    const [rows] = await pool.execute(`${SELECT_BASE} ORDER BY ht.created_at DESC`) as any[];
    return rows.map(mapRow);
  }

  async listAssignedToMe(userId: string): Promise<HelpTicket[]> {
    const [rows] = await pool.execute(
      `${SELECT_BASE} AND ht.problem_solver_id = ? ORDER BY ht.created_at DESC`,
      [userId]
    ) as any[];
    return rows.map(mapRow);
  }

  async listAssignedByMe(userId: string): Promise<HelpTicket[]> {
    const [rows] = await pool.execute(
      `${SELECT_BASE} AND ht.created_by = ? ORDER BY ht.created_at DESC`,
      [userId]
    ) as any[];
    return rows.map(mapRow);
  }

  async updateStatus(id: string, status: string): Promise<void> {
    await pool.execute(`UPDATE help_tickets SET status = ? WHERE id = ?`, [status, id]);
  }

  async update(id: string, ticket: Partial<HelpTicket>): Promise<void> {
    const fields: string[] = [];
    const values: any[] = [];

    if (ticket.subject !== undefined) { fields.push("subject = ?"); values.push(ticket.subject); }
    if (ticket.problemSolverId !== undefined) { fields.push("problem_solver_id = ?"); values.push(ticket.problemSolverId); }
    if (ticket.problem !== undefined) { fields.push("problem = ?"); values.push(ticket.problem); }
    if (ticket.mediaUrl !== undefined) { fields.push("media_url = ?"); values.push(ticket.mediaUrl); }
    if (ticket.priority !== undefined) { fields.push("priority = ?"); values.push(ticket.priority); }
    if (ticket.plannedDate !== undefined) { fields.push("planned_date = ?"); values.push(ticket.plannedDate); }
    if (ticket.attachmentMandatory !== undefined) { fields.push("attachment_mandatory = ?"); values.push(ticket.attachmentMandatory ? 1 : 0); }
    if (ticket.status !== undefined) { fields.push("status = ?"); values.push(ticket.status); }

    if (fields.length === 0) return;

    values.push(id);
    await pool.execute(`UPDATE help_tickets SET ${fields.join(", ")} WHERE id = ?`, values);
  }
}
