"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.MySqlComplaintRepository = void 0;
const uuid_1 = require("uuid");
const connection_1 = require("../../../../infrastructure/database/mysql/connection");
class MySqlComplaintRepository {
    mapRow(row) {
        return {
            id: row.id,
            complaintNumber: row.complaint_number,
            buyerId: row.buyer_id,
            title: row.title,
            description: row.description,
            status: row.status,
            priority: row.priority,
            assignedTo: row.assigned_to,
            createdAt: row.created_at,
            updatedAt: row.updated_at,
            deletedAt: row.deleted_at,
            buyerName: row.buyer_name,
            assignedToName: row.assigned_to_name,
            capaResponsiblePersonName: row.capa_responsible_person_name,
            // Registration
            orderInvoiceNo: row.order_invoice_no,
            productSku: row.product_sku,
            complaintCategory: row.complaint_category,
            attachments: typeof row.attachments === 'string' ? JSON.parse(row.attachments) : row.attachments,
            // Investigation
            inspectionFindings: row.inspection_findings,
            rootCause: row.root_cause,
            responsibleDepartment: row.responsible_department,
            rcaNotes: row.rca_notes,
            // CAPA
            immediateAction: row.immediate_action,
            correctiveAction: row.corrective_action,
            preventiveAction: row.preventive_action,
            capaResponsiblePerson: row.capa_responsible_person,
            targetCompletionDate: row.target_completion_date,
            verificationStatus: row.verification_status,
            // Resolution
            resolutionType: row.resolution_type,
            customerConfirmation: !!row.customer_confirmation,
            closureDate: row.closure_date,
            satisfactionRating: row.satisfaction_rating,
            lessonsLearned: row.lessons_learned,
            repeatIssue: !!row.repeat_issue,
        };
    }
    async create(data) {
        const id = (0, uuid_1.v4)();
        const columns = ["id", "complaint_number"];
        const values = [id, data.complaintNumber];
        const placeholders = ["?", "?"];
        for (const [key, val] of Object.entries(data)) {
            if (key !== "complaintNumber" && val !== undefined) {
                columns.push(key.replace(/[A-Z]/g, letter => `_${letter.toLowerCase()}`));
                if (key === 'attachments' && val !== null) {
                    values.push(JSON.stringify(val));
                }
                else {
                    values.push(val);
                }
                placeholders.push("?");
            }
        }
        try {
            await connection_1.pool.execute(`INSERT INTO crm_complaints (${columns.join(", ")}) VALUES (${placeholders.join(", ")})`, values);
        }
        catch (err) {
            console.error("Failed to insert complaint:", err);
            throw err;
        }
        return this.findById(id);
    }
    async findById(id) {
        const [rows] = await connection_1.pool.execute(`SELECT c.*, b.name as buyer_name, e.full_name as assigned_to_name, capa_e.full_name as capa_responsible_person_name
       FROM crm_complaints c
       LEFT JOIN master_data_buyers b ON c.buyer_id = b.id
       LEFT JOIN employees e ON c.assigned_to = e.id
       LEFT JOIN employees capa_e ON c.capa_responsible_person = capa_e.id
       WHERE c.id = ? AND c.deleted_at IS NULL`, [id]);
        if (!rows || rows.length === 0)
            return null;
        return this.mapRow(rows[0]);
    }
    async list(params) {
        let baseQuery = `
       FROM crm_complaints c
       LEFT JOIN master_data_buyers b ON c.buyer_id = b.id
       LEFT JOIN employees e ON c.assigned_to = e.id
       LEFT JOIN employees capa_e ON c.capa_responsible_person = capa_e.id
       WHERE c.deleted_at IS NULL
    `;
        const values = [];
        if (params.search) {
            baseQuery += ` AND (c.title LIKE ? OR c.complaint_number LIKE ?)`;
            values.push(`%${params.search}%`, `%${params.search}%`);
        }
        if (params.status) {
            baseQuery += ` AND c.status = ?`;
            values.push(params.status);
        }
        if (params.priority) {
            baseQuery += ` AND c.priority = ?`;
            values.push(params.priority);
        }
        if (params.buyerId) {
            baseQuery += ` AND c.buyer_id = ?`;
            values.push(params.buyerId);
        }
        if (params.assignedTo) {
            baseQuery += ` AND c.assigned_to = ?`;
            values.push(params.assignedTo);
        }
        const [countRows] = await connection_1.pool.execute(`SELECT COUNT(*) as total ${baseQuery}`, values);
        const total = countRows[0]?.total || 0;
        const query = `
      SELECT c.*, b.name as buyer_name, e.full_name as assigned_to_name, capa_e.full_name as capa_responsible_person_name
      ${baseQuery}
      ORDER BY c.created_at DESC
    `;
        const [rows] = await connection_1.pool.execute(query, values);
        return {
            items: rows.map((r) => this.mapRow(r)),
            total
        };
    }
    async update(id, changes) {
        const sets = [];
        const values = [];
        for (const [key, val] of Object.entries(changes)) {
            if (val !== undefined) {
                const col = key.replace(/[A-Z]/g, letter => `_${letter.toLowerCase()}`);
                sets.push(`${col} = ?`);
                if (key === 'attachments' && val !== null) {
                    values.push(JSON.stringify(val));
                }
                else {
                    values.push(val);
                }
            }
        }
        if (sets.length > 0) {
            values.push(id);
            await connection_1.pool.execute(`UPDATE crm_complaints SET ${sets.join(", ")} WHERE id = ?`, values);
        }
        return this.findById(id);
    }
    async remove(id) {
        await connection_1.pool.execute(`UPDATE crm_complaints SET deleted_at = NOW() WHERE id = ?`, [id]);
    }
    async generateComplaintNumber() {
        const prefix = "CMP";
        const dateStr = new Date().toISOString().slice(0, 7).replace("-", ""); // YYYYMM
        const [countRows] = await connection_1.pool.execute(`SELECT COUNT(*) as c FROM crm_complaints WHERE complaint_number LIKE ?`, [`${prefix}-${dateStr}-%`]);
        const count = (countRows[0]?.c || 0) + 1;
        return `${prefix}-${dateStr}-${count.toString().padStart(4, "0")}`;
    }
}
exports.MySqlComplaintRepository = MySqlComplaintRepository;
//# sourceMappingURL=MySqlComplaintRepository.js.map