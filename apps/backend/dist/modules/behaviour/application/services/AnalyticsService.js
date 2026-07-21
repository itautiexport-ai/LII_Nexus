"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.AnalyticsService = void 0;
const connection_1 = require("../../../../infrastructure/database/mysql/connection");
const MySqlEmployeeRepository_1 = require("../../../organization/infrastructure/repositories/MySqlEmployeeRepository");
const periodUtils_1 = require("./periodUtils");
const employeeRepo = new MySqlEmployeeRepository_1.MySqlEmployeeRepository();
class AnalyticsService {
    constructor(behaviourIndexService, repo) {
        this.behaviourIndexService = behaviourIndexService;
        this.repo = repo;
    }
    async computeAll(periodType, periodKey) {
        const { items: employees } = await employeeRepo.list({ page: 1, pageSize: 1000 });
        const results = [];
        for (const emp of employees) {
            const result = await this.behaviourIndexService.getIndex(emp.id, periodType, periodKey);
            results.push({ employeeId: emp.id, employeeName: emp.fullName, departmentName: emp.departmentName, overallIndex: result.overallIndex });
        }
        return results;
    }
    async topPerformers(periodType, periodKey, limit = 10) {
        const all = await this.computeAll(periodType, periodKey);
        return all.filter((r) => r.overallIndex !== null).sort((a, b) => b.overallIndex - a.overallIndex).slice(0, limit);
    }
    async bottomPerformers(periodType, periodKey, limit = 10) {
        const all = await this.computeAll(periodType, periodKey);
        return all.filter((r) => r.overallIndex !== null).sort((a, b) => a.overallIndex - b.overallIndex).slice(0, limit);
    }
    async mostImproved(periodType, periodKey, limit = 10) {
        const { items: employees } = await employeeRepo.list({ page: 1, pageSize: 1000 });
        const results = [];
        for (const emp of employees) {
            const result = await this.behaviourIndexService.getIndex(emp.id, periodType, periodKey);
            const trend = result.components.find((c) => c.componentKey === "improvement_trend");
            if (trend?.rawScore !== null && trend?.rawScore !== undefined) {
                results.push({ employeeId: emp.id, employeeName: emp.fullName, improvementScore: trend.rawScore });
            }
        }
        return results.sort((a, b) => b.improvementScore - a.improvementScore).slice(0, limit);
    }
    async mostDelayed(periodType, periodKey, limit = 10) {
        const { items: employees } = await employeeRepo.list({ page: 1, pageSize: 1000 });
        const results = [];
        for (const emp of employees) {
            const result = await this.behaviourIndexService.getIndex(emp.id, periodType, periodKey);
            const delay = result.components.find((c) => c.componentKey === "delay_frequency");
            if (delay?.rawScore !== null && delay?.rawScore !== undefined) {
                results.push({ employeeId: emp.id, employeeName: emp.fullName, delayFrequencyScore: delay.rawScore });
            }
        }
        return results.sort((a, b) => a.delayFrequencyScore - b.delayFrequencyScore).slice(0, limit);
    }
    async mostConsistent(periodType, periodKey, limit = 10) {
        const { items: employees } = await employeeRepo.list({ page: 1, pageSize: 1000 });
        const results = [];
        for (const emp of employees) {
            const result = await this.behaviourIndexService.getIndex(emp.id, periodType, periodKey);
            const consistency = result.components.find((c) => c.componentKey === "task_consistency");
            if (consistency?.rawScore !== null && consistency?.rawScore !== undefined) {
                results.push({ employeeId: emp.id, employeeName: emp.fullName, consistencyScore: consistency.rawScore });
            }
        }
        return results.sort((a, b) => b.consistencyScore - a.consistencyScore).slice(0, limit);
    }
    /** An employee counts as a repeat defaulter if they've landed in the
     *  bottom 20% at least `minOccurrences` times across the last N periods. */
    async repeatDefaulters(periodType, periodKey, lookback = 3, minOccurrences = 2) {
        const keys = (0, periodUtils_1.lastNPeriodKeys)(periodType, lookback, periodType === "monthly" ? new Date(`${periodKey}-01`) : new Date(`${periodKey}-01-01`));
        const occurrences = new Map();
        for (const key of keys) {
            const all = await this.computeAll(periodType, key);
            const scored = all.filter((r) => r.overallIndex !== null).sort((a, b) => a.overallIndex - b.overallIndex);
            const cutoff = Math.max(1, Math.ceil(scored.length * 0.2));
            for (const r of scored.slice(0, cutoff)) {
                const existing = occurrences.get(r.employeeId) ?? { name: r.employeeName, count: 0 };
                existing.count++;
                occurrences.set(r.employeeId, existing);
            }
        }
        return Array.from(occurrences.entries())
            .filter(([, v]) => v.count >= minOccurrences)
            .map(([employeeId, v]) => ({ employeeId, employeeName: v.name, occurrences: v.count, periodsChecked: keys.length }))
            .sort((a, b) => b.occurrences - a.occurrences);
    }
    /** The one place a genuine "delay reason" free-text field actually exists
     *  in this system - factory production entries. Flowchart/delegation
     *  tasks only have general remarks, not a dedicated delay-reason field. */
    async repeatedDelayReasons(periodType, periodKey, limit = 10) {
        const { from, to } = (0, periodUtils_1.dateRangeForPeriod)(periodType, periodKey);
        const [rows] = await connection_1.pool.query(`SELECT delay_reason, COUNT(*) as count FROM factory_production_entries
       WHERE deleted_at IS NULL AND delay_reason IS NOT NULL AND delay_reason != '' AND entry_date BETWEEN ? AND ?
       GROUP BY delay_reason ORDER BY count DESC LIMIT ?`, [from, to, limit]);
        return rows.map((r) => ({ reason: r.delay_reason, count: Number(r.count) }));
    }
    async departmentComparison(periodType, periodKey) {
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
        return Array.from(byDept.entries()).map(([departmentName, scores]) => ({
            departmentName,
            averageIndex: Math.round((scores.reduce((s, v) => s + v, 0) / scores.length) * 100) / 100,
            min: Math.min(...scores),
            max: Math.max(...scores),
            employeeCount: scores.length,
        }));
    }
    async historicalTrend(periodType, periodCount) {
        const keys = (0, periodUtils_1.lastNPeriodKeys)(periodType, periodCount);
        const trend = [];
        for (const key of keys) {
            const all = await this.computeAll(periodType, key);
            const scored = all.filter((r) => r.overallIndex !== null);
            const average = scored.length > 0 ? Math.round((scored.reduce((s, r) => s + r.overallIndex, 0) / scored.length) * 100) / 100 : null;
            trend.push({ periodKey: key, averageIndex: average, employeesScored: scored.length });
        }
        return trend;
    }
}
exports.AnalyticsService = AnalyticsService;
//# sourceMappingURL=AnalyticsService.js.map