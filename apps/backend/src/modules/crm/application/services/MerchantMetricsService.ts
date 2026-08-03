import { pool } from "../../../../infrastructure/database/mysql/connection";
import { ScoringEngineService } from "../../../scoring/application/services/ScoringEngineService";
import { periodKeyForNow } from "../../../scoring/application/services/scoringPeriodUtils";
import { MySqlKpiRepository } from "../../../scoring/infrastructure/repositories/MySqlKpiRepository";

const kpiRepo = new MySqlKpiRepository();
const scoringEngine = new ScoringEngineService(kpiRepo);

export interface MerchantMetrics {
  merchantId: string;
  leadsAssigned: number;
  followUpsDue: number;
  followUpsCompletedOnTime: number;
  delayedFollowUps: number;
  activeLeads: number;
  wonLeads: number;
  lostLeads: number;
  deadLeads: number;
  forecastValue: number;
  weightedForecastValue: number;
  conversionPercent: number | null;
  averageResponseDays: number | null;
  leadAgeingDays: number | null;
  merchantScore: number | null;
}

export class MerchantMetricsService {
  async getMetrics(merchantId: string): Promise<MerchantMetrics> {
    const [statusRows] = await pool.query<any[]>(
      `SELECT status, COUNT(*) as count, SUM(forecast_amount) as forecast, SUM(weighted_forecast) as weighted
       FROM crm_leads WHERE assigned_merchant_id = ? AND deleted_at IS NULL GROUP BY status`,
      [merchantId]
    );
    const byStatus = Object.fromEntries(statusRows.map((r) => [r.status, r]));
    const leadsAssigned = statusRows.reduce((sum, r) => sum + Number(r.count), 0);
    const activeLeads = Number(byStatus.active?.count) || 0;
    const wonLeads = Number(byStatus.won?.count) || 0;
    const lostLeads = Number(byStatus.lost?.count) || 0;
    const deadLeads = (Number(byStatus.dead?.count) || 0) + (Number(byStatus.dormant?.count) || 0);
    const forecastValue = Number(byStatus.active?.forecast) || 0;
    const weightedForecastValue = Number(byStatus.active?.weighted) || 0;
    const conversionPercent = (wonLeads + lostLeads) > 0 ? Math.round((wonLeads / (wonLeads + lostLeads)) * 10000) / 100 : null;

    const [followupRows] = await pool.query<any[]>(
      `SELECT
         SUM(CASE WHEN clf.completed_at IS NULL AND clf.due_date <= CURDATE() THEN 1 ELSE 0 END) as due,
         SUM(CASE WHEN clf.on_time = 1 THEN 1 ELSE 0 END) as onTime,
         SUM(CASE WHEN clf.on_time = 0 THEN 1 ELSE 0 END) as delayed_count
       FROM crm_lead_followups clf
       JOIN crm_leads cl ON cl.id = clf.lead_id
       WHERE cl.assigned_merchant_id = ? AND cl.deleted_at IS NULL`,
      [merchantId]
    );
    const followupRow = followupRows[0];

    const [responseRows] = await pool.query<any[]>(
      `SELECT AVG(DATEDIFF(first_followup.first_due, cl.inquiry_date)) as avgResponse
       FROM crm_leads cl
       JOIN (
         SELECT lead_id, MIN(created_at) as first_due FROM crm_lead_followups GROUP BY lead_id
       ) first_followup ON first_followup.lead_id = cl.id
       WHERE cl.assigned_merchant_id = ? AND cl.deleted_at IS NULL`,
      [merchantId]
    );
    const averageResponseDays = responseRows[0]?.avgResponse !== null && responseRows[0]?.avgResponse !== undefined
      ? Math.round(Number(responseRows[0].avgResponse) * 100) / 100 : null;

    const [ageingRows] = await pool.query<any[]>(
      `SELECT AVG(DATEDIFF(CURDATE(), inquiry_date)) as avgAge FROM crm_leads
       WHERE assigned_merchant_id = ? AND deleted_at IS NULL AND status = 'active'`,
      [merchantId]
    );
    const leadAgeingDays = ageingRows[0]?.avgAge !== null && ageingRows[0]?.avgAge !== undefined
      ? Math.round(Number(ageingRows[0].avgAge) * 100) / 100 : null;

    const compositeResult = await scoringEngine.getCompositeScore(merchantId, "monthly", periodKeyForNow("monthly"));

    return {
      merchantId,
      leadsAssigned,
      followUpsDue: Number(followupRow.due) || 0,
      followUpsCompletedOnTime: Number(followupRow.onTime) || 0,
      delayedFollowUps: Number(followupRow.delayed_count) || 0,
      activeLeads,
      wonLeads,
      lostLeads,
      deadLeads,
      forecastValue,
      weightedForecastValue,
      conversionPercent,
      averageResponseDays,
      leadAgeingDays,
      merchantScore: compositeResult.overallScore,
    };
  }
}
