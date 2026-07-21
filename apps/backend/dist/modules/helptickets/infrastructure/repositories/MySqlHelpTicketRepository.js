"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.MySqlHelpTicketRepository = void 0;
const connection_1 = require("../../../../infrastructure/database/mysql/connection");
function mapRow(row) {
    return {
        id: row.id,
        subject: row.subject,
        problemSolverId: row.problem_solver_id,
        problemSolverName: row.problem_solver_name,
        problem: row.problem,
        mediaUrl: row.media_url,
        priority: row.priority,
        plannedDate: row.planned_date ? row.planned_date.toISOString().split("T")[0] : null,
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
  LEFT JOIN identity_users cb ON cb.id = ht.created_by
  WHERE ht.deleted_at IS NULL
`;
class MySqlHelpTicketRepository {
    async create(ticket) {
        await connection_1.pool.execute(`INSERT INTO help_tickets 
        (id, subject, problem_solver_id, problem, media_url, priority, planned_date, attachment_mandatory, status, created_by)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`, [
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
        ]);
    }
    async findById(id) {
        const [rows] = await connection_1.pool.execute(`${SELECT_BASE} AND ht.id = ?`, [id]);
        return rows.length ? mapRow(rows[0]) : null;
    }
    async listAll() {
        const [rows] = await connection_1.pool.execute(`${SELECT_BASE} ORDER BY ht.created_at DESC`);
        return rows.map(mapRow);
    }
    async listAssignedToMe(userId) {
        const [rows] = await connection_1.pool.execute(`${SELECT_BASE} AND ht.problem_solver_id = ? ORDER BY ht.created_at DESC`, [userId]);
        return rows.map(mapRow);
    }
    async listAssignedByMe(userId) {
        const [rows] = await connection_1.pool.execute(`${SELECT_BASE} AND ht.created_by = ? ORDER BY ht.created_at DESC`, [userId]);
        return rows.map(mapRow);
    }
    async updateStatus(id, status) {
        await connection_1.pool.execute(`UPDATE help_tickets SET status = ? WHERE id = ?`, [status, id]);
    }
}
exports.MySqlHelpTicketRepository = MySqlHelpTicketRepository;
//# sourceMappingURL=MySqlHelpTicketRepository.js.map