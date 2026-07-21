"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.MySqlNoticeRepository = void 0;
const uuid_1 = require("uuid");
class MySqlNoticeRepository {
    constructor(pool) {
        this.pool = pool;
    }
    async createNotice(notice) {
        const id = (0, uuid_1.v4)();
        const { employee_name, person_type, department, notice_type, category, issue_date, letter_body } = notice;
        await this.pool.query(`INSERT INTO issued_notices 
       (id, employee_name, person_type, department, notice_type, category, issue_date, letter_body) 
       VALUES (?, ?, ?, ?, ?, ?, ?, ?)`, [id, employee_name, person_type, department, notice_type, category, issue_date, letter_body || null]);
        const [rows] = await this.pool.query('SELECT * FROM issued_notices WHERE id = ?', [id]);
        return rows[0];
    }
    async getNotices() {
        const [rows] = await this.pool.query('SELECT * FROM issued_notices ORDER BY issue_date DESC, created_at DESC');
        return rows;
    }
    async deleteNotice(id) {
        await this.pool.query('DELETE FROM issued_notices WHERE id = ?', [id]);
    }
}
exports.MySqlNoticeRepository = MySqlNoticeRepository;
//# sourceMappingURL=MySqlNoticeRepository.js.map