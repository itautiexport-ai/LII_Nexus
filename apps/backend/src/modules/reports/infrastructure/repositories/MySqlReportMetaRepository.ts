import { pool } from "../../../../infrastructure/database/mysql/connection";
import { ChartType, DashboardWidget, ReportFilters, ReportType, SavedReport, ScheduledReport } from "../../domain/entities/Report";
import { IReportMetaRepository } from "../../domain/repositories/IReportMetaRepository";

function parseFilters(value: any): any {
  // mysql2 auto-deserializes JSON columns into objects already - calling
  // JSON.parse on an already-parsed object throws "[object Object] is not
  // valid JSON". Handle both cases defensively rather than assuming string.
  return typeof value === "string" ? JSON.parse(value) : value;
}

function mapSaved(row: any): SavedReport {
  return { id: row.id, userId: row.user_id, reportType: row.report_type, name: row.name, filters: parseFilters(row.filters), chartType: row.chart_type, createdAt: row.created_at };
}

function mapScheduled(row: any): ScheduledReport {
  return {
    id: row.id, userId: row.user_id, reportType: row.report_type, name: row.name, filters: parseFilters(row.filters),
    frequency: row.frequency, status: row.status, lastRunAt: row.last_run_at, nextDueAt: row.next_due_at,
  };
}

function mapWidget(row: any): DashboardWidget {
  return { id: row.id, userId: row.user_id, reportType: row.report_type, savedReportId: row.saved_report_id, chartType: row.chart_type, title: row.title, sortOrder: row.sort_order };
}

export class MySqlReportMetaRepository implements IReportMetaRepository {
  async createSavedReport(data: { id: string; userId: string; reportType: ReportType; name: string; filters: ReportFilters; chartType: ChartType }): Promise<SavedReport> {
    await pool.query(
      "INSERT INTO saved_reports (id, user_id, report_type, name, filters, chart_type) VALUES (?, ?, ?, ?, ?, ?)",
      [data.id, data.userId, data.reportType, data.name, JSON.stringify(data.filters), data.chartType]
    );
    const [rows] = await pool.query<any[]>("SELECT * FROM saved_reports WHERE id = ?", [data.id]);
    return mapSaved(rows[0]);
  }

  async listSavedReports(userId: string): Promise<SavedReport[]> {
    const [rows] = await pool.query<any[]>("SELECT * FROM saved_reports WHERE user_id = ? ORDER BY created_at DESC", [userId]);
    return rows.map(mapSaved);
  }

  async findSavedReportById(id: string): Promise<SavedReport | null> {
    const [rows] = await pool.query<any[]>("SELECT * FROM saved_reports WHERE id = ?", [id]);
    return rows[0] ? mapSaved(rows[0]) : null;
  }

  async deleteSavedReport(id: string): Promise<void> {
    await pool.query("DELETE FROM saved_reports WHERE id = ?", [id]);
  }

  async addFavourite(data: { id: string; userId: string; reportType: ReportType; savedReportId: string | null }): Promise<void> {
    await pool.query(
      "INSERT IGNORE INTO favourite_reports (id, user_id, report_type, saved_report_id) VALUES (?, ?, ?, ?)",
      [data.id, data.userId, data.reportType, data.savedReportId]
    );
  }

  async removeFavourite(id: string, userId: string): Promise<void> {
    await pool.query("DELETE FROM favourite_reports WHERE id = ? AND user_id = ?", [id, userId]);
  }

  async listFavourites(userId: string): Promise<{ id: string; reportType: ReportType; savedReportId: string | null }[]> {
    const [rows] = await pool.query<any[]>("SELECT id, report_type, saved_report_id FROM favourite_reports WHERE user_id = ?", [userId]);
    return rows.map((r) => ({ id: r.id, reportType: r.report_type, savedReportId: r.saved_report_id }));
  }

  async createScheduledReport(data: { id: string; userId: string; reportType: ReportType; name: string; filters: ReportFilters; frequency: "daily" | "weekly" | "monthly"; nextDueAt: Date }): Promise<ScheduledReport> {
    await pool.query(
      "INSERT INTO scheduled_reports (id, user_id, report_type, name, filters, frequency, next_due_at) VALUES (?, ?, ?, ?, ?, ?, ?)",
      [data.id, data.userId, data.reportType, data.name, JSON.stringify(data.filters), data.frequency, data.nextDueAt]
    );
    const [rows] = await pool.query<any[]>("SELECT * FROM scheduled_reports WHERE id = ?", [data.id]);
    return mapScheduled(rows[0]);
  }

  async listScheduledReports(userId?: string): Promise<ScheduledReport[]> {
    if (userId) {
      const [rows] = await pool.query<any[]>("SELECT * FROM scheduled_reports WHERE user_id = ? ORDER BY next_due_at ASC", [userId]);
      return rows.map(mapScheduled);
    }
    const [rows] = await pool.query<any[]>("SELECT * FROM scheduled_reports ORDER BY next_due_at ASC");
    return rows.map(mapScheduled);
  }

  async updateScheduledReportStatus(id: string, status: "active" | "paused"): Promise<void> {
    await pool.query("UPDATE scheduled_reports SET status = ? WHERE id = ?", [status, id]);
  }

  async deleteScheduledReport(id: string): Promise<void> {
    await pool.query("DELETE FROM scheduled_reports WHERE id = ?", [id]);
  }

  async listDueScheduledReports(): Promise<ScheduledReport[]> {
    const [rows] = await pool.query<any[]>(
      "SELECT * FROM scheduled_reports WHERE status = 'active' AND next_due_at <= NOW()"
    );
    return rows.map(mapScheduled);
  }

  async markScheduledReportRun(id: string, nextDueAt: Date): Promise<void> {
    await pool.query("UPDATE scheduled_reports SET last_run_at = NOW(), next_due_at = ? WHERE id = ?", [nextDueAt, id]);
  }

  async recordRunHistory(data: { id: string; scheduledReportId: string | null; reportType: ReportType; runBy: string | null; rowCount: number }): Promise<void> {
    await pool.query(
      "INSERT INTO report_run_history (id, scheduled_report_id, report_type, run_by, row_count) VALUES (?, ?, ?, ?, ?)",
      [data.id, data.scheduledReportId, data.reportType, data.runBy, data.rowCount]
    );
  }

  async createWidget(data: { id: string; userId: string; reportType: ReportType; savedReportId: string | null; chartType: ChartType; title: string; sortOrder: number }): Promise<DashboardWidget> {
    await pool.query(
      "INSERT INTO dashboard_widgets (id, user_id, report_type, saved_report_id, chart_type, title, sort_order) VALUES (?, ?, ?, ?, ?, ?, ?)",
      [data.id, data.userId, data.reportType, data.savedReportId, data.chartType, data.title, data.sortOrder]
    );
    const [rows] = await pool.query<any[]>("SELECT * FROM dashboard_widgets WHERE id = ?", [data.id]);
    return mapWidget(rows[0]);
  }

  async listWidgets(userId: string): Promise<DashboardWidget[]> {
    const [rows] = await pool.query<any[]>("SELECT * FROM dashboard_widgets WHERE user_id = ? ORDER BY sort_order ASC", [userId]);
    return rows.map(mapWidget);
  }

  async deleteWidget(id: string, userId: string): Promise<void> {
    await pool.query("DELETE FROM dashboard_widgets WHERE id = ? AND user_id = ?", [id, userId]);
  }

  async reorderWidgets(userId: string, orderedIds: string[]): Promise<void> {
    for (let i = 0; i < orderedIds.length; i++) {
      await pool.query("UPDATE dashboard_widgets SET sort_order = ? WHERE id = ? AND user_id = ?", [i, orderedIds[i], userId]);
    }
  }
}
