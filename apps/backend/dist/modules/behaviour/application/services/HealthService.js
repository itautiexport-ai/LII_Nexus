"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.HealthService = void 0;
const connection_1 = require("../../../../infrastructure/database/mysql/connection");
const MySqlEmployeeRepository_1 = require("../../../organization/infrastructure/repositories/MySqlEmployeeRepository");
const periodUtils_1 = require("./periodUtils");
const employeeRepo = new MySqlEmployeeRepository_1.MySqlEmployeeRepository();
class HealthService {
    constructor(behaviourIndexService) {
        this.behaviourIndexService = behaviourIndexService;
    }
    /** Department Health: average Behaviour Index across a department's employees. */
    async departmentHealth(periodType, periodKey) {
        const { items: employees } = await employeeRepo.list({ page: 1, pageSize: 1000 });
        const byDept = new Map();
        for (const emp of employees) {
            const result = await this.behaviourIndexService.getIndex(emp.id, periodType, periodKey);
            if (result.overallIndex === null || !emp.departmentName)
                continue;
            const list = byDept.get(emp.departmentName) ?? [];
            list.push(result.overallIndex);
            byDept.set(emp.departmentName, list);
        }
        return Array.from(byDept.entries())
            .map(([departmentName, scores]) => ({ departmentName, averageIndex: Math.round((scores.reduce((s, v) => s + v, 0) / scores.length) * 100) / 100, employeeCount: scores.length }))
            .sort((a, b) => b.averageIndex - a.averageIndex);
    }
    /** Workflow Health: on-time completion rate across all flowchart tasks in the period. */
    async workflowHealth(periodType, periodKey) {
        const { from, to } = (0, periodUtils_1.dateRangeForPeriod)(periodType, periodKey);
        const [rows] = await connection_1.pool.query(`SELECT COUNT(*) as total, SUM(CASE WHEN base_status = 'completed' THEN 1 ELSE 0 END) as done
       FROM flowchart_tasks WHERE due_date BETWEEN ? AND ?`, [from, to]);
        const total = Number(rows[0].total);
        const onTimeRate = total > 0 ? Math.round((Number(rows[0].done) / total) * 10000) / 100 : null;
        return { onTimeRate, totalTasks: total };
    }
    /** Factory Health: delay frequency and consistency on the factory floor - a
     *  BEHAVIOUR view (are entries submitted on time, consistently), distinct
     *  from the Scoring Engine's Factory KPIs which measure output volume. */
    async factoryHealth(periodType, periodKey) {
        const { from, to } = (0, periodUtils_1.dateRangeForPeriod)(periodType, periodKey);
        const [rows] = await connection_1.pool.query(`SELECT fd.name,
         COUNT(*) as total,
         SUM(CASE WHEN DATE(fpe.submitted_at) = fpe.entry_date THEN 1 ELSE 0 END) as onTime,
         AVG(fpe.delay_minutes) as avgDelayMinutes
       FROM factory_production_entries fpe JOIN departments fd ON fd.id = fpe.factory_department_id
       WHERE fpe.deleted_at IS NULL AND fpe.entry_date BETWEEN ? AND ? GROUP BY fd.name`, [from, to]);
        return rows.map((r) => ({
            departmentName: r.name,
            onTimeRate: Number(r.total) > 0 ? Math.round((Number(r.onTime) / Number(r.total)) * 10000) / 100 : null,
            averageDelayMinutes: r.avgDelayMinutes !== null ? Math.round(Number(r.avgDelayMinutes) * 100) / 100 : null,
        }));
    }
    /** CRM Health: aggregate follow-up discipline and data discipline across all merchants. */
    async crmHealth(periodType, periodKey) {
        const { from, to } = (0, periodUtils_1.dateRangeForPeriod)(periodType, periodKey);
        const [followupRows] = await connection_1.pool.query(`SELECT SUM(CASE WHEN on_time = 1 THEN 1 ELSE 0 END) as onTime, COUNT(*) as total
       FROM crm_lead_followups WHERE completed_at IS NOT NULL AND DATE(completed_at) BETWEEN ? AND ?`, [from, to]);
        const [dataRows] = await connection_1.pool.query(`SELECT COUNT(*) as total, SUM(CASE WHEN updated_at >= DATE_SUB(NOW(), INTERVAL 14 DAY) THEN 1 ELSE 0 END) as recent
       FROM crm_leads WHERE deleted_at IS NULL`);
        const followupTotal = Number(followupRows[0].total);
        const dataTotal = Number(dataRows[0].total);
        return {
            followupDiscipline: followupTotal > 0 ? Math.round((Number(followupRows[0].onTime) / followupTotal) * 10000) / 100 : null,
            dataDiscipline: dataTotal > 0 ? Math.round((Number(dataRows[0].recent) / dataTotal) * 10000) / 100 : null,
        };
    }
    /** Merchant Health: per-merchant follow-up discipline, the CRM-specific
     *  slice of the Behaviour Index rather than the whole composite. */
    async merchantHealth(periodType, periodKey) {
        const [merchantRows] = await connection_1.pool.query("SELECT DISTINCT assigned_merchant_id FROM crm_leads WHERE assigned_merchant_id IS NOT NULL AND deleted_at IS NULL");
        const results = [];
        for (const row of merchantRows) {
            const result = await this.behaviourIndexService.getIndex(row.assigned_merchant_id, periodType, periodKey);
            const followup = result.components.find((c) => c.componentKey === "followup_discipline");
            results.push({ merchantId: row.assigned_merchant_id, merchantName: result.employeeName, followupDiscipline: followup?.rawScore ?? null, overallIndex: result.overallIndex });
        }
        return results.sort((a, b) => (b.overallIndex ?? -1) - (a.overallIndex ?? -1));
    }
    /** Executive Health: company-wide average Behaviour Index. */
    async executiveHealth(periodType, periodKey) {
        const departments = await this.departmentHealth(periodType, periodKey);
        const allScores = departments.flatMap((d) => Array(d.employeeCount).fill(d.averageIndex));
        const companyAverage = allScores.length > 0
            ? Math.round((departments.reduce((s, d) => s + d.averageIndex * d.employeeCount, 0) / departments.reduce((s, d) => s + d.employeeCount, 0)) * 100) / 100
            : null;
        return { companyAverageIndex: companyAverage, departmentCount: departments.length, departments };
    }
}
exports.HealthService = HealthService;
//# sourceMappingURL=HealthService.js.map