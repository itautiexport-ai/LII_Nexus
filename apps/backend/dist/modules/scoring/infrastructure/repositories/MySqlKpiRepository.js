"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.MySqlKpiRepository = void 0;
const uuid_1 = require("uuid");
const connection_1 = require("../../../../infrastructure/database/mysql/connection");
function mapDefinition(row) {
    return {
        id: row.id,
        name: row.name,
        category: row.category,
        calculationType: row.calculation_type,
        defaultWeightage: Number(row.default_weightage),
        description: row.description,
        status: row.status,
        createdAt: row.created_at,
        updatedAt: row.updated_at,
        deletedAt: row.deleted_at,
    };
}
function mapKpiScore(row) {
    return {
        id: row.id,
        employeeId: row.employee_id,
        kpiDefinitionId: row.kpi_definition_id,
        periodType: row.period_type,
        periodKey: row.period_key,
        rawScore: row.raw_score === null ? null : Number(row.raw_score),
        weightageUsed: Number(row.weightage_used),
        source: row.source,
        enteredBy: row.entered_by,
        computedAt: row.computed_at,
    };
}
function mapCompositeScore(row) {
    return {
        id: row.id,
        employeeId: row.employee_id,
        periodType: row.period_type,
        periodKey: row.period_key,
        overallScore: row.overall_score === null ? null : Number(row.overall_score),
        computedAt: row.computed_at,
    };
}
class MySqlKpiRepository {
    async listDefinitions(status) {
        const conditions = ["deleted_at IS NULL"];
        const values = [];
        if (status) {
            conditions.push("status = ?");
            values.push(status);
        }
        const [rows] = await connection_1.pool.query(`SELECT * FROM kpi_definitions WHERE ${conditions.join(" AND ")} ORDER BY category, name`, values);
        return rows.map(mapDefinition);
    }
    async findDefinitionById(id) {
        const [rows] = await connection_1.pool.query("SELECT * FROM kpi_definitions WHERE id = ? AND deleted_at IS NULL", [id]);
        return rows[0] ? mapDefinition(rows[0]) : null;
    }
    async findDefinitionByName(name) {
        const [rows] = await connection_1.pool.query("SELECT * FROM kpi_definitions WHERE name = ? AND deleted_at IS NULL", [name]);
        return rows[0] ? mapDefinition(rows[0]) : null;
    }
    async createDefinition(data) {
        const id = data.id || (0, uuid_1.v4)();
        await connection_1.pool.query("INSERT INTO kpi_definitions (id, name, category, calculation_type, default_weightage, description) VALUES (?, ?, ?, ?, ?, ?)", [id, data.name, data.category, data.calculationType, data.defaultWeightage, data.description ?? null]);
        return (await this.findDefinitionById(id));
    }
    async updateDefinition(id, changes) {
        const fields = [];
        const values = [];
        if (changes.name !== undefined) {
            fields.push("name = ?");
            values.push(changes.name);
        }
        if (changes.defaultWeightage !== undefined) {
            fields.push("default_weightage = ?");
            values.push(changes.defaultWeightage);
        }
        if (changes.description !== undefined) {
            fields.push("description = ?");
            values.push(changes.description);
        }
        if (changes.status !== undefined) {
            fields.push("status = ?");
            values.push(changes.status);
        }
        if (fields.length > 0) {
            values.push(id);
            await connection_1.pool.query(`UPDATE kpi_definitions SET ${fields.join(", ")} WHERE id = ?`, values);
        }
        return (await this.findDefinitionById(id));
    }
    async softDeleteDefinition(id) {
        await connection_1.pool.query("UPDATE kpi_definitions SET deleted_at = NOW(), status = 'inactive' WHERE id = ?", [id]);
    }
    async setDepartmentWeightage(kpiDefinitionId, departmentId, weightage) {
        await connection_1.pool.query(`INSERT INTO kpi_department_weightages (id, kpi_definition_id, department_id, weightage)
       VALUES (?, ?, ?, ?)
       ON DUPLICATE KEY UPDATE weightage = VALUES(weightage)`, [(0, uuid_1.v4)(), kpiDefinitionId, departmentId, weightage]);
    }
    async removeDepartmentWeightage(kpiDefinitionId, departmentId) {
        await connection_1.pool.query("DELETE FROM kpi_department_weightages WHERE kpi_definition_id = ? AND department_id = ?", [kpiDefinitionId, departmentId]);
    }
    async getDepartmentWeightages(kpiDefinitionId) {
        const [rows] = await connection_1.pool.query("SELECT * FROM kpi_department_weightages WHERE kpi_definition_id = ?", [kpiDefinitionId]);
        return rows.map((r) => ({ id: r.id, kpiDefinitionId: r.kpi_definition_id, departmentId: r.department_id, weightage: Number(r.weightage) }));
    }
    async getWeightageForDepartment(kpiDefinitionId, departmentId) {
        if (departmentId) {
            const [rows] = await connection_1.pool.query("SELECT weightage FROM kpi_department_weightages WHERE kpi_definition_id = ? AND department_id = ?", [kpiDefinitionId, departmentId]);
            if (rows[0])
                return Number(rows[0].weightage);
        }
        const definition = await this.findDefinitionById(kpiDefinitionId);
        return definition ? definition.defaultWeightage : 0;
    }
    async upsertEmployeeKpiScore(data) {
        const id = (0, uuid_1.v4)();
        await connection_1.pool.query(`INSERT INTO employee_kpi_scores (id, employee_id, kpi_definition_id, period_type, period_key, raw_score, weightage_used, source, entered_by)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
       ON DUPLICATE KEY UPDATE raw_score = VALUES(raw_score), weightage_used = VALUES(weightage_used),
         source = VALUES(source), entered_by = VALUES(entered_by), computed_at = NOW()`, [id, data.employeeId, data.kpiDefinitionId, data.periodType, data.periodKey, data.rawScore, data.weightageUsed, data.source, data.enteredBy ?? null]);
        const [rows] = await connection_1.pool.query("SELECT * FROM employee_kpi_scores WHERE employee_id = ? AND kpi_definition_id = ? AND period_type = ? AND period_key = ?", [data.employeeId, data.kpiDefinitionId, data.periodType, data.periodKey]);
        return mapKpiScore(rows[0]);
    }
    async getEmployeeKpiScores(employeeId, periodType, periodKey) {
        const [rows] = await connection_1.pool.query(`SELECT eks.*, kd.name AS kpi_name, kd.category FROM employee_kpi_scores eks
       JOIN kpi_definitions kd ON kd.id = eks.kpi_definition_id
       WHERE eks.employee_id = ? AND eks.period_type = ? AND eks.period_key = ?`, [employeeId, periodType, periodKey]);
        return rows.map((r) => ({ ...mapKpiScore(r), kpiName: r.kpi_name, category: r.category }));
    }
    async getEmployeeKpiScoreHistory(employeeId, kpiDefinitionId, periodType, periodKeys) {
        if (periodKeys.length === 0)
            return [];
        const placeholders = periodKeys.map(() => "?").join(",");
        const [rows] = await connection_1.pool.query(`SELECT * FROM employee_kpi_scores WHERE employee_id = ? AND kpi_definition_id = ? AND period_type = ? AND period_key IN (${placeholders})`, [employeeId, kpiDefinitionId, periodType, ...periodKeys]);
        return rows.map(mapKpiScore);
    }
    async upsertCompositeScore(employeeId, periodType, periodKey, overallScore) {
        const id = (0, uuid_1.v4)();
        await connection_1.pool.query(`INSERT INTO employee_composite_scores (id, employee_id, period_type, period_key, overall_score)
       VALUES (?, ?, ?, ?, ?)
       ON DUPLICATE KEY UPDATE overall_score = VALUES(overall_score), computed_at = NOW()`, [id, employeeId, periodType, periodKey, overallScore]);
        const [rows] = await connection_1.pool.query("SELECT * FROM employee_composite_scores WHERE employee_id = ? AND period_type = ? AND period_key = ?", [employeeId, periodType, periodKey]);
        return mapCompositeScore(rows[0]);
    }
    async getCompositeScore(employeeId, periodType, periodKey) {
        const [rows] = await connection_1.pool.query("SELECT * FROM employee_composite_scores WHERE employee_id = ? AND period_type = ? AND period_key = ?", [employeeId, periodType, periodKey]);
        return rows[0] ? mapCompositeScore(rows[0]) : null;
    }
    async getCompositeScoreHistory(employeeId, periodType, periodKeys) {
        if (periodKeys.length === 0)
            return [];
        const placeholders = periodKeys.map(() => "?").join(",");
        const [rows] = await connection_1.pool.query(`SELECT * FROM employee_composite_scores WHERE employee_id = ? AND period_type = ? AND period_key IN (${placeholders})`, [employeeId, periodType, ...periodKeys]);
        return rows.map(mapCompositeScore);
    }
    async listCompositeScoresForPeriod(periodType, periodKey, employeeIds) {
        if (employeeIds && employeeIds.length > 0) {
            const placeholders = employeeIds.map(() => "?").join(",");
            const [rows] = await connection_1.pool.query(`SELECT * FROM employee_composite_scores WHERE period_type = ? AND period_key = ? AND employee_id IN (${placeholders})`, [periodType, periodKey, ...employeeIds]);
            return rows.map(mapCompositeScore);
        }
        const [rows] = await connection_1.pool.query("SELECT * FROM employee_composite_scores WHERE period_type = ? AND period_key = ?", [periodType, periodKey]);
        return rows.map(mapCompositeScore);
    }
}
exports.MySqlKpiRepository = MySqlKpiRepository;
//# sourceMappingURL=MySqlKpiRepository.js.map