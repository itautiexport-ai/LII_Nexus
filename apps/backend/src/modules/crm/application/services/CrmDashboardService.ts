import { pool } from "../../../../infrastructure/database/mysql/connection";
import { MerchantMetricsService } from "./MerchantMetricsService";
import { MySqlEmployeeRepository } from "../../../organization/infrastructure/repositories/MySqlEmployeeRepository";

const merchantMetricsService = new MerchantMetricsService();
const employeeRepo = new MySqlEmployeeRepository();

export class CrmDashboardService {
  /** 1. CEO CRM Dashboard: company-wide pipeline snapshot. */
  async getCeoDashboard() {
    const [statusRows] = await pool.query<any[]>(
      `SELECT status, COUNT(*) as count, SUM(forecast_amount) as forecast, SUM(weighted_forecast) as weighted
       FROM crm_leads WHERE deleted_at IS NULL GROUP BY status`
    );
    const [categoryRows] = await pool.query<any[]>(
      `SELECT lead_category, COUNT(*) as count FROM crm_leads WHERE deleted_at IS NULL AND status = 'active' GROUP BY lead_category`
    );
    const [overdueRows] = await pool.query<any[]>(
      `SELECT COUNT(*) as count FROM crm_leads WHERE deleted_at IS NULL AND status = 'active' AND next_follow_up_date < CURDATE()`
    );
    return {
      byStatus: statusRows.map((r) => ({ status: r.status, count: Number(r.count), forecast: Number(r.forecast) || 0, weighted: Number(r.weighted) || 0 })),
      byCategory: categoryRows.map((r) => ({ category: r.lead_category, count: Number(r.count) })),
      overdueFollowUps: Number(overdueRows[0].count),
    };
  }

  /** 2. Merchant Dashboard: every merchant's metrics side by side. */
  async getMerchantDashboard() {
    const [merchantRows] = await pool.query<any[]>(
      "SELECT DISTINCT assigned_merchant_id FROM crm_leads WHERE assigned_merchant_id IS NOT NULL AND deleted_at IS NULL"
    );
    const results = [];
    for (const row of merchantRows) {
      const employee = await employeeRepo.findById(row.assigned_merchant_id);
      const metrics = await merchantMetricsService.getMetrics(row.assigned_merchant_id);
      results.push({ merchantName: employee?.fullName ?? "Unknown", ...metrics });
    }
    return results.sort((a, b) => (b.merchantScore ?? -1) - (a.merchantScore ?? -1));
  }

  /** 3. Lead Source Dashboard: volume and conversion by channel. */
  async getLeadSourceDashboard() {
    const [rows] = await pool.query<any[]>(
      `SELECT lead_source,
         COUNT(*) as total,
         SUM(CASE WHEN status = 'won' THEN 1 ELSE 0 END) as won,
         SUM(CASE WHEN status = 'lost' THEN 1 ELSE 0 END) as lost,
         SUM(weighted_forecast) as weighted
       FROM crm_leads WHERE deleted_at IS NULL GROUP BY lead_source`
    );
    return rows.map((r) => {
      const won = Number(r.won);
      const lost = Number(r.lost);
      return {
        leadSource: r.lead_source, total: Number(r.total), won, lost,
        conversionPercent: (won + lost) > 0 ? Math.round((won / (won + lost)) * 10000) / 100 : null,
        weightedForecast: Number(r.weighted) || 0,
      };
    });
  }

  /** 4. Export vs Domestic Dashboard. */
  async getExportVsDomesticDashboard() {
    const [rows] = await pool.query<any[]>(
      `SELECT
         CASE WHEN lead_category = 'export' THEN 'export' ELSE 'domestic' END as bucket,
         COUNT(*) as total,
         SUM(CASE WHEN status = 'won' THEN 1 ELSE 0 END) as won,
         SUM(CASE WHEN status = 'lost' THEN 1 ELSE 0 END) as lost,
         SUM(forecast_amount) as forecast,
         SUM(weighted_forecast) as weighted
       FROM crm_leads WHERE deleted_at IS NULL GROUP BY bucket`
    );
    return rows.map((r) => ({
      bucket: r.bucket, total: Number(r.total), won: Number(r.won), lost: Number(r.lost),
      forecast: Number(r.forecast) || 0, weighted: Number(r.weighted) || 0,
    }));
  }

  /** 5. Follow-up Delay Dashboard. */
  async getFollowUpDelayDashboard() {
    const [overdueRows] = await pool.query<any[]>(
      `SELECT cl.id, cl.lead_code, cl.contact_name, e.full_name as merchant_name, cl.next_follow_up_date,
              DATEDIFF(CURDATE(), cl.next_follow_up_date) as days_overdue
       FROM crm_leads cl LEFT JOIN employees e ON e.id = cl.assigned_merchant_id
       WHERE cl.deleted_at IS NULL AND cl.status = 'active' AND cl.next_follow_up_date < CURDATE()
       ORDER BY days_overdue DESC LIMIT 50`
    );
    const [byMerchantRows] = await pool.query<any[]>(
      `SELECT e.full_name as merchant_name,
         SUM(CASE WHEN cl.next_follow_up_date < CURDATE() THEN 1 ELSE 0 END) as overdue,
         COUNT(*) as total
       FROM crm_leads cl LEFT JOIN employees e ON e.id = cl.assigned_merchant_id
       WHERE cl.deleted_at IS NULL AND cl.status = 'active'
       GROUP BY e.full_name`
    );
    return {
      overdueLeads: overdueRows.map((r) => ({ id: r.id, leadCode: r.lead_code, contactName: r.contact_name, merchantName: r.merchant_name, dueDate: r.next_follow_up_date, daysOverdue: Number(r.days_overdue) })),
      byMerchant: byMerchantRows.map((r) => ({ merchantName: r.merchant_name ?? "Unassigned", overdue: Number(r.overdue), total: Number(r.total) })),
    };
  }

  /** 6. Forecast Pipeline Dashboard: pipeline by stage. */
  async getForecastPipelineDashboard() {
    const [rows] = await pool.query<any[]>(
      `SELECT sales_stage, COUNT(*) as count, SUM(forecast_amount) as forecast, SUM(weighted_forecast) as weighted
       FROM crm_leads WHERE deleted_at IS NULL AND status = 'active' GROUP BY sales_stage`
    );
    return rows.map((r) => ({ salesStage: r.sales_stage, count: Number(r.count), forecast: Number(r.forecast) || 0, weighted: Number(r.weighted) || 0 }));
  }

  /** 7. Won / Lost Analysis. */
  async getWonLostAnalysis() {
    const [rows] = await pool.query<any[]>(
      `SELECT lead_category, lead_source,
         SUM(CASE WHEN status = 'won' THEN 1 ELSE 0 END) as won,
         SUM(CASE WHEN status = 'lost' THEN 1 ELSE 0 END) as lost,
         SUM(CASE WHEN status = 'won' THEN forecast_amount ELSE 0 END) as wonValue
       FROM crm_leads WHERE deleted_at IS NULL AND status IN ('won','lost')
       GROUP BY lead_category, lead_source`
    );
    return rows.map((r) => ({
      leadCategory: r.lead_category, leadSource: r.lead_source,
      won: Number(r.won), lost: Number(r.lost), wonValue: Number(r.wonValue) || 0,
    }));
  }
}
