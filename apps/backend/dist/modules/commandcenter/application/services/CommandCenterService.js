"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.CommandCenterService = void 0;
const connection_1 = require("../../../../infrastructure/database/mysql/connection");
const ScoringEngineService_1 = require("../../../scoring/application/services/ScoringEngineService");
const RankingService_1 = require("../../../scoring/application/services/RankingService");
const MySqlKpiRepository_1 = require("../../../scoring/infrastructure/repositories/MySqlKpiRepository");
const scoringPeriodUtils_1 = require("../../../scoring/application/services/scoringPeriodUtils");
const periodUtils_1 = require("../../../officeperf/application/services/periodUtils");
const kpiRepo = new MySqlKpiRepository_1.MySqlKpiRepository();
const scoringEngine = new ScoringEngineService_1.ScoringEngineService(kpiRepo);
const rankingService = new RankingService_1.RankingService(scoringEngine, kpiRepo);
function statusOf(score) {
    if (score === null)
        return "unknown";
    if (score >= 80)
        return "good";
    if (score >= 50)
        return "warning";
    return "critical";
}
class CommandCenterService {
    /** Business Health: company-wide average composite score this month, plus
     *  how many employees/departments are actually being evaluated (a "94%"
     *  average across 2 scored employees means something very different from
     *  94% across 200, so the sample size travels with the number). */
    getBusinessHealth(rankedEmployees) {
        const periodKey = (0, scoringPeriodUtils_1.periodKeyForNow)("monthly");
        const scores = rankedEmployees.map((e) => e.overallScore);
        const average = scores.length > 0 ? Math.round((scores.reduce((s, v) => s + v, 0) / scores.length) * 100) / 100 : null;
        return { periodKey, averageScore: average, employeesScored: scores.length, status: statusOf(average) };
    }
    async getProductionHealth() {
        const periodKey = (0, scoringPeriodUtils_1.periodKeyForNow)("monthly");
        const { from, to } = (0, scoringPeriodUtils_1.dateRangeForPeriod)("monthly", periodKey);
        const [rows] = await connection_1.pool.query(`SELECT
         COUNT(*) as total,
         SUM(CASE WHEN status = 'submitted' THEN 1 ELSE 0 END) as pendingApproval,
         SUM(CASE WHEN status = 'approved' THEN 1 ELSE 0 END) as approved,
         SUM(CASE WHEN status = 'rejected' THEN 1 ELSE 0 END) as rejected,
         SUM(actual_qty) as totalActual,
         SUM(target_qty) as totalTarget,
         SUM(rejection_qty) as totalRejection,
         SUM(rework_qty) as totalRework
       FROM factory_production_entries
       WHERE deleted_at IS NULL AND entry_date BETWEEN ? AND ?`, [from, to]);
        const r = rows[0];
        const targetAchievement = r.totalTarget > 0 ? Math.round(Math.min(100, (r.totalActual / r.totalTarget) * 100) * 100) / 100 : null;
        const defectRate = r.totalActual > 0 ? Math.round(((Number(r.totalRejection) + Number(r.totalRework)) / r.totalActual) * 10000) / 100 : null;
        return {
            periodKey,
            totalEntries: Number(r.total),
            pendingApproval: Number(r.pendingApproval),
            approved: Number(r.approved),
            rejected: Number(r.rejected),
            targetAchievementPercent: targetAchievement,
            defectRatePercent: defectRate,
            status: statusOf(targetAchievement),
        };
    }
    async getPeopleHealth(rankedEmployees) {
        const [empRows] = await connection_1.pool.query("SELECT COUNT(*) as total FROM employees WHERE deleted_at IS NULL AND status = 'active'");
        const atRisk = rankedEmployees.filter((e) => e.overallScore < 50);
        return {
            activeEmployees: Number(empRows[0].total),
            employeesScored: rankedEmployees.length,
            employeesAtRisk: atRisk.length,
            atRiskList: atRisk.slice(0, 10),
        };
    }
    async getDepartmentHealth() {
        const periodKey = (0, scoringPeriodUtils_1.periodKeyForNow)("monthly");
        const departments = await rankingService.departmentRanking("monthly", periodKey);
        return departments.map((d) => ({ ...d, status: statusOf(d.averageScore) }));
    }
    async getOrderHealth() {
        const [runRows] = await connection_1.pool.query("SELECT status, COUNT(*) as count FROM workflow_runs GROUP BY status");
        const [orderRows] = await connection_1.pool.query(`SELECT status, COUNT(DISTINCT order_reference) as count FROM factory_production_entries
       WHERE deleted_at IS NULL AND order_reference IS NOT NULL GROUP BY status`);
        return {
            workflowRuns: Object.fromEntries(runRows.map((r) => [r.status, Number(r.count)])),
            factoryOrders: Object.fromEntries(orderRows.map((r) => [r.status, Number(r.count)])),
        };
    }
    /** "Delayed" for a flowchart task is derived the same way it is everywhere
     *  else in this app: assigned, not completed, past its due date. */
    async getDelayedTasks() {
        const [flowchartRows] = await connection_1.pool.query(`SELECT ft.id, w.name as workflow_name, ws.name as stage_name, e.full_name as assignee_name, ft.due_date
       FROM flowchart_tasks ft
       JOIN workflow_runs wr ON wr.id = ft.workflow_run_id
       JOIN workflows w ON w.id = wr.workflow_id
       JOIN workflow_stages ws ON ws.id = ft.stage_id
       LEFT JOIN employees e ON e.id = ft.assigned_to
       WHERE ft.base_status != 'completed' AND ft.due_date IS NOT NULL AND ft.due_date < CURDATE()
       ORDER BY ft.due_date ASC LIMIT 20`);
        const [delegationRows] = await connection_1.pool.query(`SELECT dt.id, dt.title, e.full_name as assignee_name, dt.due_date, dt.priority
       FROM delegated_tasks dt
       JOIN employees e ON e.id = dt.assigned_to
       WHERE dt.deleted_at IS NULL AND dt.base_status != 'completed' AND dt.due_date < CURDATE()
       ORDER BY dt.due_date ASC LIMIT 20`);
        return {
            flowchart: flowchartRows.map((r) => ({ id: r.id, label: `${r.workflow_name}: ${r.stage_name}`, assigneeName: r.assignee_name, dueDate: r.due_date })),
            delegation: delegationRows.map((r) => ({ id: r.id, label: r.title, assigneeName: r.assignee_name, dueDate: r.due_date, priority: r.priority })),
        };
    }
    /** An "order" (workflow run) counts as delayed if it has at least one
     *  delayed task sitting in it. */
    async getDelayedOrders() {
        const [rows] = await connection_1.pool.query(`SELECT DISTINCT wr.id, wr.reference, w.name as workflow_name, wr.started_at
       FROM workflow_runs wr
       JOIN workflows w ON w.id = wr.workflow_id
       JOIN flowchart_tasks ft ON ft.workflow_run_id = wr.id
       WHERE wr.status = 'in_progress' AND ft.base_status != 'completed' AND ft.due_date IS NOT NULL AND ft.due_date < CURDATE()
       ORDER BY wr.started_at ASC LIMIT 20`);
        return rows.map((r) => ({ id: r.id, reference: r.reference, workflowName: r.workflow_name, startedAt: r.started_at }));
    }
    /** Delayed production: submitted entries sitting unreviewed for more than
     *  2 days, or entries that recorded a meaningful delay (>60 min) on the
     *  floor itself. Both thresholds are judgment calls, called out as such. */
    async getDelayedProduction() {
        const [rows] = await connection_1.pool.query(`SELECT fpe.id, fpe.entry_date, fd.name as department_name, fpe.delay_minutes, fpe.status,
              DATEDIFF(CURDATE(), fpe.entry_date) as days_pending
       FROM factory_production_entries fpe
       JOIN departments fd ON fd.id = fpe.factory_department_id
       WHERE fpe.deleted_at IS NULL AND (
         (fpe.status = 'submitted' AND DATEDIFF(CURDATE(), fpe.entry_date) > 2) OR fpe.delay_minutes > 60
       )
       ORDER BY fpe.entry_date ASC LIMIT 20`);
        return rows.map((r) => ({ id: r.id, entryDate: r.entry_date, departmentName: r.department_name, delayMinutes: r.delay_minutes, status: r.status, daysPending: r.days_pending }));
    }
    /** A small, bounded, rules-based alert feed - not a general-purpose rules
     *  engine, just the handful of conditions leadership would actually want
     *  surfaced immediately. */
    async getCriticalAlerts(peopleHealth, departmentHealth, delayedOrders, productionHealth) {
        const alerts = [];
        if (peopleHealth.employeesAtRisk > 0) {
            alerts.push({ severity: "critical", message: `${peopleHealth.employeesAtRisk} employee(s) scoring below 50% this month.` });
        }
        for (const dept of departmentHealth) {
            if (dept.status === "critical")
                alerts.push({ severity: "critical", message: `${dept.departmentName} department averaging ${dept.averageScore}% this month.` });
        }
        if (delayedOrders.length > 0) {
            alerts.push({ severity: "warning", message: `${delayedOrders.length} workflow run(s) have overdue stages.` });
        }
        if (productionHealth.rejected > 0) {
            alerts.push({ severity: "warning", message: `${productionHealth.rejected} production entr(y/ies) rejected this month.` });
        }
        if (productionHealth.defectRatePercent !== null && productionHealth.defectRatePercent > 10) {
            alerts.push({ severity: "critical", message: `Factory defect rate at ${productionHealth.defectRatePercent}% this month (rejection + rework).` });
        }
        return alerts;
    }
    /** Per-factory-department health, for the heat map: target achievement and
     *  defect rate from this month's approved entries. */
    async getFactoryHeatMap() {
        const periodKey = (0, scoringPeriodUtils_1.periodKeyForNow)("monthly");
        const { from, to } = (0, scoringPeriodUtils_1.dateRangeForPeriod)("monthly", periodKey);
        const [rows] = await connection_1.pool.query(`SELECT fd.id, fd.name,
         SUM(fpe.actual_qty) as totalActual, SUM(fpe.target_qty) as totalTarget,
         SUM(fpe.rejection_qty + fpe.rework_qty) as totalDefects
       FROM departments fd
       LEFT JOIN factory_production_entries fpe
         ON fpe.factory_department_id = fd.id AND fpe.deleted_at IS NULL AND fpe.status = 'approved' AND fpe.entry_date BETWEEN ? AND ?
       WHERE fd.deleted_at IS NULL
       GROUP BY fd.id, fd.name`, [from, to]);
        return rows.map((r) => {
            const totalActual = Number(r.totalActual) || 0;
            const totalTarget = Number(r.totalTarget) || 0;
            const totalDefects = Number(r.totalDefects) || 0;
            const targetAchievement = totalTarget > 0 ? Math.round(Math.min(100, (totalActual / totalTarget) * 100) * 100) / 100 : null;
            const defectRate = totalActual > 0 ? Math.round((totalDefects / totalActual) * 10000) / 100 : null;
            // Heat map health blends achievement and inverse defect rate - a
            // department could hit its quantity target while producing a lot of
            // rejects, and that shouldn't paint green.
            const health = targetAchievement !== null && defectRate !== null
                ? Math.round(Math.max(0, targetAchievement - defectRate) * 100) / 100
                : targetAchievement;
            return { departmentId: r.id, departmentName: r.name, targetAchievementPercent: targetAchievement, defectRatePercent: defectRate, health, status: statusOf(health) };
        });
    }
    async getWeeklyTrend() {
        const weeks = [];
        for (let i = 5; i >= 0; i--) {
            const ref = new Date();
            ref.setDate(ref.getDate() - i * 7);
            const { from, to } = (0, periodUtils_1.getRangeForWindow)("week", ref);
            const [rows] = await connection_1.pool.query(`SELECT
           (SELECT COUNT(*) FROM flowchart_tasks WHERE due_date BETWEEN ? AND ?) as flowchartTotal,
           (SELECT COUNT(*) FROM flowchart_tasks WHERE due_date BETWEEN ? AND ? AND base_status = 'completed') as flowchartDone,
           (SELECT COUNT(*) FROM delegated_tasks WHERE deleted_at IS NULL AND due_date BETWEEN ? AND ?) as delegationTotal,
           (SELECT COUNT(*) FROM delegated_tasks WHERE deleted_at IS NULL AND due_date BETWEEN ? AND ? AND base_status = 'completed') as delegationDone`, [from, to, from, to, from, to, from, to]);
            const r = rows[0];
            const total = Number(r.flowchartTotal) + Number(r.delegationTotal);
            const done = Number(r.flowchartDone) + Number(r.delegationDone);
            weeks.push({ weekStart: from, completionRate: total > 0 ? Math.round((done / total) * 10000) / 100 : null });
        }
        return weeks;
    }
    async getMonthlyTrend() {
        const periodKeys = (0, scoringPeriodUtils_1.lastNPeriodKeys)("monthly", 6);
        const months = [];
        for (const periodKey of periodKeys) {
            const allScored = await rankingService.topPerformers("monthly", periodKey, 100000);
            const scores = allScored.map((e) => e.overallScore);
            const average = scores.length > 0 ? Math.round((scores.reduce((s, v) => s + v, 0) / scores.length) * 100) / 100 : null;
            months.push({ periodKey, averageScore: average });
        }
        return months;
    }
    async getOverview() {
        const periodKey = (0, scoringPeriodUtils_1.periodKeyForNow)("monthly");
        // Computed once and reused for business/people health and top/bottom
        // performers, instead of separately recomputing every employee's
        // composite score 3+ times in one request - meaningful, not cosmetic,
        // given there's no caching layer in this scoring engine.
        const rankedEmployees = await rankingService.topPerformers("monthly", periodKey, 100000);
        const topPerformers = rankedEmployees.slice(0, 5);
        const bottomPerformers = [...rankedEmployees].slice(-5).reverse();
        const [businessHealth, productionHealth, peopleHealth, departmentHealth, orderHealth, delayedTasks, delayedOrders, delayedProduction, factoryHeatMap, weeklyTrend, monthlyTrend] = await Promise.all([
            Promise.resolve(this.getBusinessHealth(rankedEmployees)),
            this.getProductionHealth(),
            this.getPeopleHealth(rankedEmployees),
            this.getDepartmentHealth(),
            this.getOrderHealth(),
            this.getDelayedTasks(),
            this.getDelayedOrders(),
            this.getDelayedProduction(),
            this.getFactoryHeatMap(),
            this.getWeeklyTrend(),
            this.getMonthlyTrend(),
        ]);
        const criticalAlerts = await this.getCriticalAlerts(peopleHealth, departmentHealth, delayedOrders, productionHealth);
        return {
            generatedAt: new Date().toISOString(),
            businessHealth,
            productionHealth,
            peopleHealth,
            departmentHealth,
            orderHealth,
            delayedTasks,
            delayedOrders,
            delayedProduction,
            criticalAlerts,
            topPerformers,
            bottomPerformers,
            factoryHeatMap,
            weeklyTrend,
            monthlyTrend,
            // Deliberately inert - no AI integration exists in this system. This
            // is reserved UI space for a future capability, not a fake summary.
            aiPlaceholder: {
                available: false,
                message: "AI-generated insights are not yet implemented. This panel is reserved for a future release.",
            },
        };
    }
}
exports.CommandCenterService = CommandCenterService;
//# sourceMappingURL=CommandCenterService.js.map