import { v4 as uuid } from "uuid";
import { pool } from "../../../../infrastructure/database/mysql/connection";
import {
  BehaviourComponent, BehaviourComponentKey, EmployeeBehaviourScore, GeneratedInsight, InsightRule,
  InsightRuleKey, InsightSeverity, ManagerFeedback, PeriodType,
} from "../../domain/entities/Behaviour";
import { IBehaviourRepository } from "../../domain/repositories/IBehaviourRepository";

function parseJson(value: any): any {
  // mysql2 auto-deserializes JSON columns already - a lesson learned the
  // hard way in the Reports & BI module. Never assume it's still a string.
  return typeof value === "string" ? JSON.parse(value) : value;
}

function mapComponent(row: any): BehaviourComponent {
  return { id: row.id, componentKey: row.component_key, label: row.label, weight: Number(row.weight), description: row.description, status: row.status };
}

function mapEmployeeScore(row: any): EmployeeBehaviourScore {
  return {
    id: row.id, employeeId: row.employee_id, periodType: row.period_type, periodKey: row.period_key,
    overallIndex: row.overall_index === null ? null : Number(row.overall_index),
    componentScores: parseJson(row.component_scores), computedAt: row.computed_at,
  };
}

function mapFeedback(row: any): ManagerFeedback {
  return {
    id: row.id, employeeId: row.employee_id, submittedBy: row.submitted_by, periodType: row.period_type,
    periodKey: row.period_key, rating: row.rating, comments: row.comments, createdAt: row.created_at, updatedAt: row.updated_at,
  };
}

function mapRule(row: any): InsightRule {
  return { id: row.id, ruleKey: row.rule_key, label: row.label, thresholdValue: Number(row.threshold_value), enabled: !!row.enabled, description: row.description };
}

function mapInsight(row: any): GeneratedInsight {
  return {
    id: row.id, ruleKey: row.rule_key, severity: row.severity, message: row.message, entityType: row.entity_type,
    entityId: row.entity_id, periodType: row.period_type, periodKey: row.period_key, generatedAt: row.generated_at,
  };
}

export class MySqlBehaviourRepository implements IBehaviourRepository {
  async listComponents(): Promise<BehaviourComponent[]> {
    const [rows] = await pool.query<any[]>("SELECT * FROM behaviour_components ORDER BY weight DESC");
    return rows.map(mapComponent);
  }

  async findComponentByKey(key: BehaviourComponentKey): Promise<BehaviourComponent | null> {
    const [rows] = await pool.query<any[]>("SELECT * FROM behaviour_components WHERE component_key = ?", [key]);
    return rows[0] ? mapComponent(rows[0]) : null;
  }

  async updateComponent(id: string, changes: { weight?: number; status?: "active" | "inactive" }): Promise<BehaviourComponent> {
    const fields: string[] = [];
    const values: unknown[] = [];
    if (changes.weight !== undefined) { fields.push("weight = ?"); values.push(changes.weight); }
    if (changes.status !== undefined) { fields.push("status = ?"); values.push(changes.status); }
    if (fields.length > 0) {
      values.push(id);
      await pool.query(`UPDATE behaviour_components SET ${fields.join(", ")} WHERE id = ?`, values);
    }
    const [rows] = await pool.query<any[]>("SELECT * FROM behaviour_components WHERE id = ?", [id]);
    return mapComponent(rows[0]);
  }

  async upsertEmployeeScore(data: { employeeId: string; periodType: PeriodType; periodKey: string; overallIndex: number | null; componentScores: unknown }): Promise<EmployeeBehaviourScore> {
    const id = uuid();
    await pool.query(
      `INSERT INTO employee_behaviour_scores (id, employee_id, period_type, period_key, overall_index, component_scores)
       VALUES (?, ?, ?, ?, ?, ?)
       ON DUPLICATE KEY UPDATE overall_index = VALUES(overall_index), component_scores = VALUES(component_scores), computed_at = NOW()`,
      [id, data.employeeId, data.periodType, data.periodKey, data.overallIndex, JSON.stringify(data.componentScores)]
    );
    return (await this.getEmployeeScore(data.employeeId, data.periodType, data.periodKey))!;
  }

  async getEmployeeScore(employeeId: string, periodType: PeriodType, periodKey: string): Promise<EmployeeBehaviourScore | null> {
    const [rows] = await pool.query<any[]>(
      "SELECT * FROM employee_behaviour_scores WHERE employee_id = ? AND period_type = ? AND period_key = ?",
      [employeeId, periodType, periodKey]
    );
    return rows[0] ? mapEmployeeScore(rows[0]) : null;
  }

  async getEmployeeScoreHistory(employeeId: string, periodType: PeriodType, periodKeys: string[]): Promise<EmployeeBehaviourScore[]> {
    if (periodKeys.length === 0) return [];
    const placeholders = periodKeys.map(() => "?").join(",");
    const [rows] = await pool.query<any[]>(
      `SELECT * FROM employee_behaviour_scores WHERE employee_id = ? AND period_type = ? AND period_key IN (${placeholders})`,
      [employeeId, periodType, ...periodKeys]
    );
    return rows.map(mapEmployeeScore);
  }

  async listScoresForPeriod(periodType: PeriodType, periodKey: string, employeeIds?: string[]): Promise<EmployeeBehaviourScore[]> {
    if (employeeIds && employeeIds.length > 0) {
      const placeholders = employeeIds.map(() => "?").join(",");
      const [rows] = await pool.query<any[]>(
        `SELECT * FROM employee_behaviour_scores WHERE period_type = ? AND period_key = ? AND employee_id IN (${placeholders})`,
        [periodType, periodKey, ...employeeIds]
      );
      return rows.map(mapEmployeeScore);
    }
    const [rows] = await pool.query<any[]>("SELECT * FROM employee_behaviour_scores WHERE period_type = ? AND period_key = ?", [periodType, periodKey]);
    return rows.map(mapEmployeeScore);
  }

  async upsertManagerFeedback(data: { id: string; employeeId: string; submittedBy: string; periodType: PeriodType; periodKey: string; rating: number; comments?: string | null }): Promise<ManagerFeedback> {
    await pool.query(
      `INSERT INTO manager_feedback (id, employee_id, submitted_by, period_type, period_key, rating, comments)
       VALUES (?, ?, ?, ?, ?, ?, ?)
       ON DUPLICATE KEY UPDATE submitted_by = VALUES(submitted_by), rating = VALUES(rating), comments = VALUES(comments)`,
      [data.id, data.employeeId, data.submittedBy, data.periodType, data.periodKey, data.rating, data.comments ?? null]
    );
    return (await this.getManagerFeedback(data.employeeId, data.periodType, data.periodKey))!;
  }

  async getManagerFeedback(employeeId: string, periodType: PeriodType, periodKey: string): Promise<ManagerFeedback | null> {
    const [rows] = await pool.query<any[]>(
      "SELECT * FROM manager_feedback WHERE employee_id = ? AND period_type = ? AND period_key = ?",
      [employeeId, periodType, periodKey]
    );
    return rows[0] ? mapFeedback(rows[0]) : null;
  }

  async listManagerFeedbackForEmployee(employeeId: string): Promise<ManagerFeedback[]> {
    const [rows] = await pool.query<any[]>("SELECT * FROM manager_feedback WHERE employee_id = ? ORDER BY period_key DESC", [employeeId]);
    return rows.map(mapFeedback);
  }

  async listInsightRules(): Promise<InsightRule[]> {
    const [rows] = await pool.query<any[]>("SELECT * FROM insight_rules ORDER BY rule_key");
    return rows.map(mapRule);
  }

  async updateInsightRule(ruleKey: InsightRuleKey, changes: { thresholdValue?: number; enabled?: boolean }): Promise<InsightRule> {
    const fields: string[] = [];
    const values: unknown[] = [];
    if (changes.thresholdValue !== undefined) { fields.push("threshold_value = ?"); values.push(changes.thresholdValue); }
    if (changes.enabled !== undefined) { fields.push("enabled = ?"); values.push(changes.enabled); }
    if (fields.length > 0) {
      values.push(ruleKey);
      await pool.query(`UPDATE insight_rules SET ${fields.join(", ")} WHERE rule_key = ?`, values);
    }
    const [rows] = await pool.query<any[]>("SELECT * FROM insight_rules WHERE rule_key = ?", [ruleKey]);
    return mapRule(rows[0]);
  }

  async recordInsight(data: { id: string; ruleKey: string; severity: InsightSeverity; message: string; entityType?: string | null; entityId?: string | null; periodType: PeriodType; periodKey: string }): Promise<void> {
    await pool.query(
      "INSERT INTO generated_insights (id, rule_key, severity, message, entity_type, entity_id, period_type, period_key) VALUES (?, ?, ?, ?, ?, ?, ?, ?)",
      [data.id, data.ruleKey, data.severity, data.message, data.entityType ?? null, data.entityId ?? null, data.periodType, data.periodKey]
    );
  }

  async listInsights(periodType: PeriodType, periodKey: string): Promise<GeneratedInsight[]> {
    const [rows] = await pool.query<any[]>(
      "SELECT * FROM generated_insights WHERE period_type = ? AND period_key = ? ORDER BY generated_at DESC",
      [periodType, periodKey]
    );
    return rows.map(mapInsight);
  }
}
