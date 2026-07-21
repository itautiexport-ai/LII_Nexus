"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.MySqlBehaviourRepository = void 0;
const uuid_1 = require("uuid");
const connection_1 = require("../../../../infrastructure/database/mysql/connection");
function parseJson(value) {
    // mysql2 auto-deserializes JSON columns already - a lesson learned the
    // hard way in the Reports & BI module. Never assume it's still a string.
    return typeof value === "string" ? JSON.parse(value) : value;
}
function mapComponent(row) {
    return { id: row.id, componentKey: row.component_key, label: row.label, weight: Number(row.weight), description: row.description, status: row.status };
}
function mapEmployeeScore(row) {
    return {
        id: row.id, employeeId: row.employee_id, periodType: row.period_type, periodKey: row.period_key,
        overallIndex: row.overall_index === null ? null : Number(row.overall_index),
        componentScores: parseJson(row.component_scores), computedAt: row.computed_at,
    };
}
function mapFeedback(row) {
    return {
        id: row.id, employeeId: row.employee_id, submittedBy: row.submitted_by, periodType: row.period_type,
        periodKey: row.period_key, rating: row.rating, comments: row.comments, createdAt: row.created_at, updatedAt: row.updated_at,
    };
}
function mapRule(row) {
    return { id: row.id, ruleKey: row.rule_key, label: row.label, thresholdValue: Number(row.threshold_value), enabled: !!row.enabled, description: row.description };
}
function mapInsight(row) {
    return {
        id: row.id, ruleKey: row.rule_key, severity: row.severity, message: row.message, entityType: row.entity_type,
        entityId: row.entity_id, periodType: row.period_type, periodKey: row.period_key, generatedAt: row.generated_at,
    };
}
class MySqlBehaviourRepository {
    async listComponents() {
        const [rows] = await connection_1.pool.query("SELECT * FROM behaviour_components ORDER BY weight DESC");
        return rows.map(mapComponent);
    }
    async findComponentByKey(key) {
        const [rows] = await connection_1.pool.query("SELECT * FROM behaviour_components WHERE component_key = ?", [key]);
        return rows[0] ? mapComponent(rows[0]) : null;
    }
    async updateComponent(id, changes) {
        const fields = [];
        const values = [];
        if (changes.weight !== undefined) {
            fields.push("weight = ?");
            values.push(changes.weight);
        }
        if (changes.status !== undefined) {
            fields.push("status = ?");
            values.push(changes.status);
        }
        if (fields.length > 0) {
            values.push(id);
            await connection_1.pool.query(`UPDATE behaviour_components SET ${fields.join(", ")} WHERE id = ?`, values);
        }
        const [rows] = await connection_1.pool.query("SELECT * FROM behaviour_components WHERE id = ?", [id]);
        return mapComponent(rows[0]);
    }
    async upsertEmployeeScore(data) {
        const id = (0, uuid_1.v4)();
        await connection_1.pool.query(`INSERT INTO employee_behaviour_scores (id, employee_id, period_type, period_key, overall_index, component_scores)
       VALUES (?, ?, ?, ?, ?, ?)
       ON DUPLICATE KEY UPDATE overall_index = VALUES(overall_index), component_scores = VALUES(component_scores), computed_at = NOW()`, [id, data.employeeId, data.periodType, data.periodKey, data.overallIndex, JSON.stringify(data.componentScores)]);
        return (await this.getEmployeeScore(data.employeeId, data.periodType, data.periodKey));
    }
    async getEmployeeScore(employeeId, periodType, periodKey) {
        const [rows] = await connection_1.pool.query("SELECT * FROM employee_behaviour_scores WHERE employee_id = ? AND period_type = ? AND period_key = ?", [employeeId, periodType, periodKey]);
        return rows[0] ? mapEmployeeScore(rows[0]) : null;
    }
    async getEmployeeScoreHistory(employeeId, periodType, periodKeys) {
        if (periodKeys.length === 0)
            return [];
        const placeholders = periodKeys.map(() => "?").join(",");
        const [rows] = await connection_1.pool.query(`SELECT * FROM employee_behaviour_scores WHERE employee_id = ? AND period_type = ? AND period_key IN (${placeholders})`, [employeeId, periodType, ...periodKeys]);
        return rows.map(mapEmployeeScore);
    }
    async listScoresForPeriod(periodType, periodKey, employeeIds) {
        if (employeeIds && employeeIds.length > 0) {
            const placeholders = employeeIds.map(() => "?").join(",");
            const [rows] = await connection_1.pool.query(`SELECT * FROM employee_behaviour_scores WHERE period_type = ? AND period_key = ? AND employee_id IN (${placeholders})`, [periodType, periodKey, ...employeeIds]);
            return rows.map(mapEmployeeScore);
        }
        const [rows] = await connection_1.pool.query("SELECT * FROM employee_behaviour_scores WHERE period_type = ? AND period_key = ?", [periodType, periodKey]);
        return rows.map(mapEmployeeScore);
    }
    async upsertManagerFeedback(data) {
        await connection_1.pool.query(`INSERT INTO manager_feedback (id, employee_id, submitted_by, period_type, period_key, rating, comments)
       VALUES (?, ?, ?, ?, ?, ?, ?)
       ON DUPLICATE KEY UPDATE submitted_by = VALUES(submitted_by), rating = VALUES(rating), comments = VALUES(comments)`, [data.id, data.employeeId, data.submittedBy, data.periodType, data.periodKey, data.rating, data.comments ?? null]);
        return (await this.getManagerFeedback(data.employeeId, data.periodType, data.periodKey));
    }
    async getManagerFeedback(employeeId, periodType, periodKey) {
        const [rows] = await connection_1.pool.query("SELECT * FROM manager_feedback WHERE employee_id = ? AND period_type = ? AND period_key = ?", [employeeId, periodType, periodKey]);
        return rows[0] ? mapFeedback(rows[0]) : null;
    }
    async listManagerFeedbackForEmployee(employeeId) {
        const [rows] = await connection_1.pool.query("SELECT * FROM manager_feedback WHERE employee_id = ? ORDER BY period_key DESC", [employeeId]);
        return rows.map(mapFeedback);
    }
    async listInsightRules() {
        const [rows] = await connection_1.pool.query("SELECT * FROM insight_rules ORDER BY rule_key");
        return rows.map(mapRule);
    }
    async updateInsightRule(ruleKey, changes) {
        const fields = [];
        const values = [];
        if (changes.thresholdValue !== undefined) {
            fields.push("threshold_value = ?");
            values.push(changes.thresholdValue);
        }
        if (changes.enabled !== undefined) {
            fields.push("enabled = ?");
            values.push(changes.enabled);
        }
        if (fields.length > 0) {
            values.push(ruleKey);
            await connection_1.pool.query(`UPDATE insight_rules SET ${fields.join(", ")} WHERE rule_key = ?`, values);
        }
        const [rows] = await connection_1.pool.query("SELECT * FROM insight_rules WHERE rule_key = ?", [ruleKey]);
        return mapRule(rows[0]);
    }
    async recordInsight(data) {
        await connection_1.pool.query("INSERT INTO generated_insights (id, rule_key, severity, message, entity_type, entity_id, period_type, period_key) VALUES (?, ?, ?, ?, ?, ?, ?, ?)", [data.id, data.ruleKey, data.severity, data.message, data.entityType ?? null, data.entityId ?? null, data.periodType, data.periodKey]);
    }
    async listInsights(periodType, periodKey) {
        const [rows] = await connection_1.pool.query("SELECT * FROM generated_insights WHERE period_type = ? AND period_key = ? ORDER BY generated_at DESC", [periodType, periodKey]);
        return rows.map(mapInsight);
    }
}
exports.MySqlBehaviourRepository = MySqlBehaviourRepository;
//# sourceMappingURL=MySqlBehaviourRepository.js.map