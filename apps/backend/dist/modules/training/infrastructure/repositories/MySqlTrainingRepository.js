"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.MySqlTrainingRepository = void 0;
const uuid_1 = require("uuid");
class MySqlTrainingRepository {
    constructor(pool) {
        this.pool = pool;
    }
    async listCalendars() {
        const [rows] = await this.pool.query('SELECT * FROM training_calendars ORDER BY created_at DESC');
        return rows;
    }
    async createCalendar(financial_year) {
        const id = (0, uuid_1.v4)();
        await this.pool.query('INSERT INTO training_calendars (id, financial_year) VALUES (?, ?)', [id, financial_year]);
        return { id, financial_year, status: 'active' };
    }
    async listSessions(calendar_id) {
        let query = 'SELECT * FROM training_sessions';
        const params = [];
        if (calendar_id) {
            query += ' WHERE calendar_id = ?';
            params.push(calendar_id);
        }
        query += ' ORDER BY scheduled_date DESC';
        const [rows] = await this.pool.query(query, params);
        return rows;
    }
    async createSession(session) {
        const id = (0, uuid_1.v4)();
        await this.pool.query(`INSERT INTO training_sessions 
      (id, calendar_id, title, category, department_id, training_type, priority, scheduled_date, duration_hours, trainer, venue_mode, budget, status, description) 
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`, [
            id, session.calendar_id, session.title, session.category, session.department_id || null,
            session.training_type || 'internal', session.priority || 'medium', session.scheduled_date || null,
            session.duration_hours || 0, session.trainer, session.venue_mode, session.budget || 0,
            session.status || 'planned', session.description || ''
        ]);
        const [rows] = await this.pool.query('SELECT * FROM training_sessions WHERE id = ?', [id]);
        return rows[0];
    }
    async updateSessionStatus(id, status) {
        await this.pool.query('UPDATE training_sessions SET status = ? WHERE id = ?', [status, id]);
    }
    async deleteSession(id) {
        await this.pool.query('DELETE FROM training_sessions WHERE id = ?', [id]);
    }
}
exports.MySqlTrainingRepository = MySqlTrainingRepository;
//# sourceMappingURL=MySqlTrainingRepository.js.map