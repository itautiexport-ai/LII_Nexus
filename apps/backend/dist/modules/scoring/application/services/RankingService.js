"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.RankingService = void 0;
const MySqlEmployeeRepository_1 = require("../../../organization/infrastructure/repositories/MySqlEmployeeRepository");
const MySqlDepartmentRepository_1 = require("../../../organization/infrastructure/repositories/MySqlDepartmentRepository");
const scoringPeriodUtils_1 = require("./scoringPeriodUtils");
class RankingService {
    constructor(scoringEngine, kpiRepo) {
        this.scoringEngine = scoringEngine;
        this.kpiRepo = kpiRepo;
        this.employeeRepo = new MySqlEmployeeRepository_1.MySqlEmployeeRepository();
        this.departmentRepo = new MySqlDepartmentRepository_1.MySqlDepartmentRepository();
    }
    /** Recomputes every active employee's composite score for the period, then
     *  ranks them. This is O(employees) real-time recomputation, acceptable at
     *  this scale given the lack of a scheduler - see docs for the caching
     *  tradeoff at larger employee counts. */
    async computeAllScoresForPeriod(periodType, periodKey) {
        const { items: employees } = await this.employeeRepo.list({ page: 1, pageSize: 1000 });
        const results = [];
        for (const emp of employees) {
            const result = await this.scoringEngine.computeCompositeScore(emp.id, periodType, periodKey);
            results.push({ employeeId: emp.id, employeeName: emp.fullName, departmentName: emp.departmentName, overallScore: result.overallScore, rank: 0 });
        }
        const scored = results.filter((r) => r.overallScore !== null).sort((a, b) => b.overallScore - a.overallScore);
        const unscored = results.filter((r) => r.overallScore === null);
        scored.forEach((r, i) => { r.rank = i + 1; });
        return [...scored, ...unscored];
    }
    async topPerformers(periodType, periodKey, limit = 10) {
        const ranked = await this.computeAllScoresForPeriod(periodType, periodKey);
        return ranked.filter((r) => r.overallScore !== null).slice(0, limit);
    }
    async bottomPerformers(periodType, periodKey, limit = 10) {
        const ranked = await this.computeAllScoresForPeriod(periodType, periodKey);
        const scored = ranked.filter((r) => r.overallScore !== null);
        return scored.slice(-limit).reverse();
    }
    async departmentRanking(periodType, periodKey) {
        const ranked = await this.computeAllScoresForPeriod(periodType, periodKey);
        const byDept = new Map();
        for (const r of ranked) {
            if (r.overallScore === null || !r.departmentName)
                continue;
            const bucket = byDept.get(r.departmentName) ?? { total: 0, count: 0 };
            bucket.total += r.overallScore;
            bucket.count += 1;
            byDept.set(r.departmentName, bucket);
        }
        const departments = Array.from(byDept.entries())
            .map(([departmentName, { total, count }]) => ({ departmentName, averageScore: Math.round((total / count) * 100) / 100, employeeCount: count }))
            .sort((a, b) => b.averageScore - a.averageScore);
        departments.forEach((d, i) => { d.rank = i + 1; });
        return departments;
    }
    /** Trend data for a single employee across the last N periods, for
     *  charting. Also returns each KPI's raw score per period so the frontend
     *  can plot per-KPI trend lines, not just the composite. */
    async getEmployeeTrend(employeeId, periodType, periodCount) {
        const periodKeys = (0, scoringPeriodUtils_1.lastNPeriodKeys)(periodType, periodCount);
        const composites = [];
        for (const key of periodKeys) {
            const result = await this.scoringEngine.getCompositeScore(employeeId, periodType, key);
            composites.push({ periodKey: key, overallScore: result.overallScore, kpiScores: result.kpiScores });
        }
        return composites;
    }
}
exports.RankingService = RankingService;
//# sourceMappingURL=RankingService.js.map