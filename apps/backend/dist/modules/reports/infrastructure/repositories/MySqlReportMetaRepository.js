"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.MySqlReportMetaRepository = void 0;
const connection_1 = require("../../../../infrastructure/database/mysql/connection");
function parseFilters(value) {
    // mysql2 auto-deserializes JSON columns into objects already - calling
    // JSON.parse on an already-parsed object throws "[object Object] is not
    // valid JSON". Handle both cases defensively rather than assuming string.
    return typeof value === "string" ? JSON.parse(value) : value;
}
function mapSaved(row) {
    return { id: row.id, userId: row.user_id, reportType: row.report_type, name: row.name, filters: parseFilters(row.filters), chartType: row.chart_type, createdAt: row.created_at };
}
function mapScheduled(row) {
    return {
        id: row.id, userId: row.user_id, reportType: row.report_type, name: row.name, filters: parseFilters(row.filters),
        frequency: row.frequency, status: row.status, lastRunAt: row.last_run_at, nextDueAt: row.next_due_at,
    };
}
function mapWidget(row) {
    return { id: row.id, userId: row.user_id, reportType: row.report_type, savedReportId: row.saved_report_id, chartType: row.chart_type, title: row.title, sortOrder: row.sort_order };
}
class MySqlReportMetaRepository {
    async createSavedReport(data) {
        await connection_1.pool.query("INSERT INTO saved_reports (id, user_id, report_type, name, filters, chart_type) VALUES (?, ?, ?, ?, ?, ?)", [data.id, data.userId, data.reportType, data.name, JSON.stringify(data.filters), data.chartType]);
        const [rows] = await connection_1.pool.query("SELECT * FROM saved_reports WHERE id = ?", [data.id]);
        return mapSaved(rows[0]);
    }
    async listSavedReports(userId) {
        const [rows] = await connection_1.pool.query("SELECT * FROM saved_reports WHERE user_id = ? ORDER BY created_at DESC", [userId]);
        return rows.map(mapSaved);
    }
    async findSavedReportById(id) {
        const [rows] = await connection_1.pool.query("SELECT * FROM saved_reports WHERE id = ?", [id]);
        return rows[0] ? mapSaved(rows[0]) : null;
    }
    async deleteSavedReport(id) {
        await connection_1.pool.query("DELETE FROM saved_reports WHERE id = ?", [id]);
    }
    async addFavourite(data) {
        await connection_1.pool.query("INSERT IGNORE INTO favourite_reports (id, user_id, report_type, saved_report_id) VALUES (?, ?, ?, ?)", [data.id, data.userId, data.reportType, data.savedReportId]);
    }
    async removeFavourite(id, userId) {
        await connection_1.pool.query("DELETE FROM favourite_reports WHERE id = ? AND user_id = ?", [id, userId]);
    }
    async listFavourites(userId) {
        const [rows] = await connection_1.pool.query("SELECT id, report_type, saved_report_id FROM favourite_reports WHERE user_id = ?", [userId]);
        return rows.map((r) => ({ id: r.id, reportType: r.report_type, savedReportId: r.saved_report_id }));
    }
    async createScheduledReport(data) {
        await connection_1.pool.query("INSERT INTO scheduled_reports (id, user_id, report_type, name, filters, frequency, next_due_at) VALUES (?, ?, ?, ?, ?, ?, ?)", [data.id, data.userId, data.reportType, data.name, JSON.stringify(data.filters), data.frequency, data.nextDueAt]);
        const [rows] = await connection_1.pool.query("SELECT * FROM scheduled_reports WHERE id = ?", [data.id]);
        return mapScheduled(rows[0]);
    }
    async listScheduledReports(userId) {
        if (userId) {
            const [rows] = await connection_1.pool.query("SELECT * FROM scheduled_reports WHERE user_id = ? ORDER BY next_due_at ASC", [userId]);
            return rows.map(mapScheduled);
        }
        const [rows] = await connection_1.pool.query("SELECT * FROM scheduled_reports ORDER BY next_due_at ASC");
        return rows.map(mapScheduled);
    }
    async updateScheduledReportStatus(id, status) {
        await connection_1.pool.query("UPDATE scheduled_reports SET status = ? WHERE id = ?", [status, id]);
    }
    async deleteScheduledReport(id) {
        await connection_1.pool.query("DELETE FROM scheduled_reports WHERE id = ?", [id]);
    }
    async listDueScheduledReports() {
        const [rows] = await connection_1.pool.query("SELECT * FROM scheduled_reports WHERE status = 'active' AND next_due_at <= NOW()");
        return rows.map(mapScheduled);
    }
    async markScheduledReportRun(id, nextDueAt) {
        await connection_1.pool.query("UPDATE scheduled_reports SET last_run_at = NOW(), next_due_at = ? WHERE id = ?", [nextDueAt, id]);
    }
    async recordRunHistory(data) {
        await connection_1.pool.query("INSERT INTO report_run_history (id, scheduled_report_id, report_type, run_by, row_count) VALUES (?, ?, ?, ?, ?)", [data.id, data.scheduledReportId, data.reportType, data.runBy, data.rowCount]);
    }
    async createWidget(data) {
        await connection_1.pool.query("INSERT INTO dashboard_widgets (id, user_id, report_type, saved_report_id, chart_type, title, sort_order) VALUES (?, ?, ?, ?, ?, ?, ?)", [data.id, data.userId, data.reportType, data.savedReportId, data.chartType, data.title, data.sortOrder]);
        const [rows] = await connection_1.pool.query("SELECT * FROM dashboard_widgets WHERE id = ?", [data.id]);
        return mapWidget(rows[0]);
    }
    async listWidgets(userId) {
        const [rows] = await connection_1.pool.query("SELECT * FROM dashboard_widgets WHERE user_id = ? ORDER BY sort_order ASC", [userId]);
        return rows.map(mapWidget);
    }
    async deleteWidget(id, userId) {
        await connection_1.pool.query("DELETE FROM dashboard_widgets WHERE id = ? AND user_id = ?", [id, userId]);
    }
    async reorderWidgets(userId, orderedIds) {
        for (let i = 0; i < orderedIds.length; i++) {
            await connection_1.pool.query("UPDATE dashboard_widgets SET sort_order = ? WHERE id = ? AND user_id = ?", [i, orderedIds[i], userId]);
        }
    }
}
exports.MySqlReportMetaRepository = MySqlReportMetaRepository;
//# sourceMappingURL=MySqlReportMetaRepository.js.map