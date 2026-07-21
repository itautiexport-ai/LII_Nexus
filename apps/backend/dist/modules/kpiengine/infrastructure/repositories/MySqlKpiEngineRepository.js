"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.MySqlKpiEngineRepository = void 0;
const uuid_1 = require("uuid");
const connection_1 = require("../../../../infrastructure/database/mysql/connection");
function mapDefinition(row) {
    return {
        id: row.id, name: row.name, category: row.category, formula: row.formula, weightage: Number(row.weightage),
        frequency: row.frequency, responsibleEmployeeId: row.responsible_employee_id, departmentId: row.department_id,
        greenThreshold: Number(row.green_threshold), amberThreshold: Number(row.amber_threshold), status: row.status,
    };
}
function mapEntry(row) {
    return {
        id: row.id, kpiDefinitionId: row.kpi_definition_id, periodKey: row.period_key,
        target: Number(row.target), actual: Number(row.actual),
        computedScore: row.computed_score === null ? null : Number(row.computed_score),
        trafficLight: row.traffic_light, weightageUsed: Number(row.weightage_used),
        enteredBy: row.entered_by, enteredAt: row.entered_at,
    };
}
class MySqlKpiEngineRepository {
    async listDefinitions(params) {
        const conditions = ["deleted_at IS NULL"];
        const values = [];
        if (params.category) {
            conditions.push("category = ?");
            values.push(params.category);
        }
        if (params.departmentId) {
            conditions.push("department_id = ?");
            values.push(params.departmentId);
        }
        if (params.responsibleEmployeeId) {
            conditions.push("responsible_employee_id = ?");
            values.push(params.responsibleEmployeeId);
        }
        if (params.status) {
            conditions.push("status = ?");
            values.push(params.status);
        }
        const [rows] = await connection_1.pool.query(`SELECT * FROM kpi_engine_definitions WHERE ${conditions.join(" AND ")} ORDER BY category, name`, values);
        return rows.map(mapDefinition);
    }
    async findDefinitionById(id) {
        const [rows] = await connection_1.pool.query("SELECT * FROM kpi_engine_definitions WHERE id = ? AND deleted_at IS NULL", [id]);
        return rows[0] ? mapDefinition(rows[0]) : null;
    }
    async createDefinition(data) {
        const id = data.id || (0, uuid_1.v4)();
        await connection_1.pool.query(`INSERT INTO kpi_engine_definitions
         (id, name, category, formula, weightage, frequency, responsible_employee_id, department_id, green_threshold, amber_threshold)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`, [id, data.name, data.category, data.formula, data.weightage, data.frequency,
            data.responsibleEmployeeId ?? null, data.departmentId ?? null, data.greenThreshold ?? 90, data.amberThreshold ?? 70]);
        return (await this.findDefinitionById(id));
    }
    async updateDefinition(id, changes) {
        const fieldMap = {
            name: "name", formula: "formula", weightage: "weightage", frequency: "frequency",
            responsibleEmployeeId: "responsible_employee_id", departmentId: "department_id",
            greenThreshold: "green_threshold", amberThreshold: "amber_threshold", status: "status",
        };
        const fields = [];
        const values = [];
        for (const [key, column] of Object.entries(fieldMap)) {
            const value = changes[key];
            if (value !== undefined) {
                fields.push(`${column} = ?`);
                values.push(value);
            }
        }
        if (fields.length > 0) {
            values.push(id);
            await connection_1.pool.query(`UPDATE kpi_engine_definitions SET ${fields.join(", ")} WHERE id = ?`, values);
        }
        return (await this.findDefinitionById(id));
    }
    async softDeleteDefinition(id) {
        await connection_1.pool.query("UPDATE kpi_engine_definitions SET deleted_at = NOW(), status = 'inactive' WHERE id = ?", [id]);
    }
    async upsertEntry(data) {
        await connection_1.pool.query(`INSERT INTO kpi_engine_entries (id, kpi_definition_id, period_key, target, actual, computed_score, traffic_light, weightage_used, entered_by)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
       ON DUPLICATE KEY UPDATE target = VALUES(target), actual = VALUES(actual), computed_score = VALUES(computed_score),
         traffic_light = VALUES(traffic_light), weightage_used = VALUES(weightage_used), entered_by = VALUES(entered_by), entered_at = NOW()`, [data.id, data.kpiDefinitionId, data.periodKey, data.target, data.actual, data.computedScore, data.trafficLight, data.weightageUsed, data.enteredBy]);
        return (await this.getEntry(data.kpiDefinitionId, data.periodKey));
    }
    async getEntry(kpiDefinitionId, periodKey) {
        const [rows] = await connection_1.pool.query("SELECT * FROM kpi_engine_entries WHERE kpi_definition_id = ? AND period_key = ?", [kpiDefinitionId, periodKey]);
        return rows[0] ? mapEntry(rows[0]) : null;
    }
    async listEntriesForDefinition(kpiDefinitionId, periodKeys) {
        if (periodKeys && periodKeys.length > 0) {
            const placeholders = periodKeys.map(() => "?").join(",");
            const [rows] = await connection_1.pool.query(`SELECT * FROM kpi_engine_entries WHERE kpi_definition_id = ? AND period_key IN (${placeholders}) ORDER BY period_key ASC`, [kpiDefinitionId, ...periodKeys]);
            return rows.map(mapEntry);
        }
        const [rows] = await connection_1.pool.query("SELECT * FROM kpi_engine_entries WHERE kpi_definition_id = ? ORDER BY period_key ASC", [kpiDefinitionId]);
        return rows.map(mapEntry);
    }
    async listEntriesForPeriod(periodKey, filters) {
        const conditions = ["e.period_key = ?", "d.deleted_at IS NULL"];
        const values = [periodKey];
        if (filters.category) {
            conditions.push("d.category = ?");
            values.push(filters.category);
        }
        if (filters.departmentId) {
            conditions.push("d.department_id = ?");
            values.push(filters.departmentId);
        }
        if (filters.responsibleEmployeeId) {
            conditions.push("d.responsible_employee_id = ?");
            values.push(filters.responsibleEmployeeId);
        }
        const [rows] = await connection_1.pool.query(`SELECT e.*, d.name as kpi_name, d.category FROM kpi_engine_entries e
       JOIN kpi_engine_definitions d ON d.id = e.kpi_definition_id
       WHERE ${conditions.join(" AND ")}`, values);
        return rows.map((r) => ({ ...mapEntry(r), kpiName: r.kpi_name, category: r.category }));
    }
}
exports.MySqlKpiEngineRepository = MySqlKpiEngineRepository;
//# sourceMappingURL=MySqlKpiEngineRepository.js.map