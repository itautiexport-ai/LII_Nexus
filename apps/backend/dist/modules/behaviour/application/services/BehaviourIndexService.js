"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.BehaviourIndexService = void 0;
const connection_1 = require("../../../../infrastructure/database/mysql/connection");
const periodUtils_1 = require("./periodUtils");
const DomainError_1 = require("../../../../core/domain/errors/DomainError");
const MySqlEmployeeRepository_1 = require("../../../organization/infrastructure/repositories/MySqlEmployeeRepository");
const employeeRepo = new MySqlEmployeeRepository_1.MySqlEmployeeRepository();
function clamp(value, min = 0, max = 100) {
    return Math.max(min, Math.min(max, value));
}
function weightedAverage(scores) {
    const present = scores.filter((s) => s.rawScore !== null);
    const totalWeight = present.reduce((sum, s) => sum + s.weightUsed, 0);
    if (totalWeight === 0)
        return null;
    return Math.round((present.reduce((sum, s) => sum + s.rawScore * s.weightUsed, 0) / totalWeight) * 100) / 100;
}
/**
 * Computes the Behaviour Index: a deliberately separate axis from the
 * Performance Scoring Engine, measuring HOW someone works (consistency,
 * discipline, delay patterns) rather than WHAT they produced. Same "no
 * manual calculation" principle as every other scoring system in this app -
 * a human can submit Manager Feedback as raw input, but the weighted
 * composite is always computed by the system.
 */
class BehaviourIndexService {
    constructor(repo) {
        this.repo = repo;
    }
    async onTimeCompletionRate(employeeId, from, to) {
        const [rows] = await connection_1.pool.query(`SELECT
         (SELECT COUNT(*) FROM flowchart_tasks WHERE assigned_to = ? AND due_date BETWEEN ? AND ?) as fcTotal,
         (SELECT COUNT(*) FROM flowchart_tasks WHERE assigned_to = ? AND due_date BETWEEN ? AND ? AND base_status = 'completed') as fcDone,
         (SELECT COUNT(*) FROM delegated_tasks WHERE assigned_to = ? AND deleted_at IS NULL AND due_date BETWEEN ? AND ?) as dtTotal,
         (SELECT COUNT(*) FROM delegated_tasks WHERE assigned_to = ? AND deleted_at IS NULL AND due_date BETWEEN ? AND ? AND base_status = 'completed') as dtDone`, [employeeId, from, to, employeeId, from, to, employeeId, from, to, employeeId, from, to]);
        const r = rows[0];
        const total = Number(r.fcTotal) + Number(r.dtTotal);
        if (total === 0)
            return null;
        const done = Number(r.fcDone) + Number(r.dtDone);
        return Math.round((done / total) * 10000) / 100;
    }
    async delayStats(employeeId, from, to) {
        const [rows] = await connection_1.pool.query(`SELECT
         COUNT(*) as total,
         SUM(CASE WHEN due_date < CURDATE() AND base_status != 'completed' THEN 1 ELSE 0 END) as delayedOpen,
         SUM(CASE WHEN base_status = 'completed' AND completed_at IS NOT NULL AND DATE(completed_at) > due_date THEN 1 ELSE 0 END) as delayedCompleted,
         SUM(CASE WHEN base_status = 'completed' AND completed_at IS NOT NULL AND DATE(completed_at) > due_date THEN DATEDIFF(completed_at, due_date) ELSE 0 END) as totalDelayDays
       FROM flowchart_tasks WHERE assigned_to = ? AND due_date BETWEEN ? AND ?`, [employeeId, from, to]);
        const [dtRows] = await connection_1.pool.query(`SELECT
         COUNT(*) as total,
         SUM(CASE WHEN due_date < CURDATE() AND base_status != 'completed' THEN 1 ELSE 0 END) as delayedOpen,
         SUM(CASE WHEN base_status = 'completed' AND completed_at IS NOT NULL AND DATE(completed_at) > due_date THEN 1 ELSE 0 END) as delayedCompleted,
         SUM(CASE WHEN base_status = 'completed' AND completed_at IS NOT NULL AND DATE(completed_at) > due_date THEN DATEDIFF(completed_at, due_date) ELSE 0 END) as totalDelayDays
       FROM delegated_tasks WHERE assigned_to = ? AND deleted_at IS NULL AND due_date BETWEEN ? AND ?`, [employeeId, from, to]);
        const r = rows[0];
        const d = dtRows[0];
        const total = Number(r.total) + Number(d.total);
        if (total === 0)
            return { frequency: null, averageDelay: null };
        const delayed = Number(r.delayedOpen) + Number(r.delayedCompleted) + Number(d.delayedOpen) + Number(d.delayedCompleted);
        const frequency = clamp(100 - (delayed / total) * 100);
        const totalDelayDays = Number(r.totalDelayDays) + Number(d.totalDelayDays);
        const delayedCompletedCount = Number(r.delayedCompleted) + Number(d.delayedCompleted);
        const avgDelayDays = delayedCompletedCount > 0 ? totalDelayDays / delayedCompletedCount : 0;
        const averageDelay = clamp(100 - avgDelayDays * 10);
        return { frequency: Math.round(frequency * 100) / 100, averageDelay: Math.round(averageDelay * 100) / 100 };
    }
    async checklistDiscipline(employeeId, from, to) {
        const [rows] = await connection_1.pool.query(`SELECT COUNT(DISTINCT ci.id) as total,
         SUM(CASE WHEN cii.is_checked THEN 1 ELSE 0 END) as checkedItems, COUNT(cii.id) as totalItems
       FROM checklist_instances ci LEFT JOIN checklist_instance_items cii ON cii.instance_id = ci.id
       WHERE ci.employee_id = ? AND ci.period_start >= ? AND ci.period_end <= ?`, [employeeId, from, to]);
        const r = rows[0];
        if (Number(r.total) === 0 || Number(r.totalItems) === 0)
            return null;
        return Math.round((Number(r.checkedItems) / Number(r.totalItems)) * 10000) / 100;
    }
    async followupDiscipline(employeeId, from, to) {
        const [rows] = await connection_1.pool.query(`SELECT SUM(CASE WHEN clf.on_time = 1 THEN 1 ELSE 0 END) as onTime, COUNT(*) as total
       FROM crm_lead_followups clf JOIN crm_leads cl ON cl.id = clf.lead_id
       WHERE cl.assigned_merchant_id = ? AND clf.completed_at IS NOT NULL AND DATE(clf.completed_at) BETWEEN ? AND ?`, [employeeId, from, to]);
        const total = Number(rows[0]?.total) || 0;
        if (total === 0)
            return null;
        return Math.round((Number(rows[0].onTime) / total) * 10000) / 100;
    }
    async crmDiscipline(employeeId) {
        const [rows] = await connection_1.pool.query(`SELECT COUNT(*) as total, SUM(CASE WHEN updated_at >= DATE_SUB(NOW(), INTERVAL 14 DAY) THEN 1 ELSE 0 END) as recent
       FROM crm_leads WHERE assigned_merchant_id = ? AND deleted_at IS NULL`, [employeeId]);
        const total = Number(rows[0]?.total) || 0;
        if (total === 0)
            return null;
        return Math.round((Number(rows[0].recent) / total) * 10000) / 100;
    }
    async attendanceImpact(employeeId, periodType, periodKey) {
        const [rows] = await connection_1.pool.query(`SELECT eks.raw_score FROM employee_kpi_scores eks
       JOIN kpi_definitions kd ON kd.id = eks.kpi_definition_id
       WHERE eks.employee_id = ? AND eks.period_type = ? AND eks.period_key = ? AND kd.name = 'Attendance'`, [employeeId, periodType, periodKey]);
        return rows[0]?.raw_score !== undefined && rows[0]?.raw_score !== null ? Number(rows[0].raw_score) : null;
    }
    async taskConsistency(employeeId, periodType, referenceKey) {
        // Live-computed over the last 3 monthly periods' on-time rate, rather
        // than relying on this engine's own stored history (avoids a
        // chicken-and-egg problem on an employee's very first computed period).
        const keys = (0, periodUtils_1.lastNPeriodKeys)("monthly", 3, new Date(`${referenceKey}-01`));
        const rates = [];
        for (const key of keys) {
            const { from, to } = (0, periodUtils_1.dateRangeForPeriod)("monthly", key);
            const rate = await this.onTimeCompletionRate(employeeId, from, to);
            if (rate !== null)
                rates.push(rate);
        }
        if (rates.length < 2)
            return null;
        const mean = rates.reduce((s, v) => s + v, 0) / rates.length;
        const variance = rates.reduce((s, v) => s + (v - mean) ** 2, 0) / rates.length;
        const stddev = Math.sqrt(variance);
        return clamp(Math.round((100 - stddev * 2) * 100) / 100);
    }
    async managerFeedbackScore(employeeId, periodType, periodKey) {
        const feedback = await this.repo.getManagerFeedback(employeeId, periodType, periodKey);
        return feedback ? feedback.rating * 20 : null;
    }
    async computeIndex(employeeId, periodType, periodKey) {
        const employee = await employeeRepo.findById(employeeId);
        if (!employee)
            throw new DomainError_1.ValidationError("Employee not found.");
        const { from, to } = (0, periodUtils_1.dateRangeForPeriod)(periodType, periodKey);
        const components = await this.repo.listComponents();
        const weightOf = (key) => components.find((c) => c.componentKey === key && c.status === "active")?.weight ?? 0;
        const onTimeCompletion = await this.onTimeCompletionRate(employeeId, from, to);
        const { frequency: delayFrequency, averageDelay } = await this.delayStats(employeeId, from, to);
        const taskConsistency = await this.taskConsistency(employeeId, periodType, periodKey);
        const checklistDiscipline = await this.checklistDiscipline(employeeId, from, to);
        const [delegationRows] = await connection_1.pool.query(`SELECT COUNT(*) as total, SUM(CASE WHEN base_status = 'completed' THEN 1 ELSE 0 END) as done
       FROM delegated_tasks WHERE assigned_to = ? AND deleted_at IS NULL AND due_date BETWEEN ? AND ?`, [employeeId, from, to]);
        const delegationDiscipline = Number(delegationRows[0].total) > 0
            ? Math.round((Number(delegationRows[0].done) / Number(delegationRows[0].total)) * 10000) / 100 : null;
        const followupDiscipline = await this.followupDiscipline(employeeId, from, to);
        const crmDiscipline = await this.crmDiscipline(employeeId);
        const attendanceImpact = await this.attendanceImpact(employeeId, periodType, periodKey);
        const managerFeedback = await this.managerFeedbackScore(employeeId, periodType, periodKey);
        const baseComponents = [
            { componentKey: "on_time_completion", label: "On-Time Completion %", rawScore: onTimeCompletion, weightUsed: weightOf("on_time_completion") },
            { componentKey: "delay_frequency", label: "Delay Frequency", rawScore: delayFrequency, weightUsed: weightOf("delay_frequency") },
            { componentKey: "average_delay", label: "Average Delay", rawScore: averageDelay, weightUsed: weightOf("average_delay") },
            { componentKey: "task_consistency", label: "Task Completion Consistency", rawScore: taskConsistency, weightUsed: weightOf("task_consistency") },
            { componentKey: "checklist_discipline", label: "Checklist Discipline", rawScore: checklistDiscipline, weightUsed: weightOf("checklist_discipline") },
            { componentKey: "delegation_discipline", label: "Delegation Discipline", rawScore: delegationDiscipline, weightUsed: weightOf("delegation_discipline") },
            { componentKey: "followup_discipline", label: "Follow-up Discipline", rawScore: followupDiscipline, weightUsed: weightOf("followup_discipline") },
            { componentKey: "crm_discipline", label: "CRM Data Discipline", rawScore: crmDiscipline, weightUsed: weightOf("crm_discipline") },
            { componentKey: "attendance_impact", label: "Attendance Impact", rawScore: attendanceImpact, weightUsed: weightOf("attendance_impact") },
            { componentKey: "manager_feedback", label: "Manager Feedback", rawScore: managerFeedback, weightUsed: weightOf("manager_feedback") },
        ];
        const baseIndex = weightedAverage(baseComponents);
        // Improvement trend compares this period's base index (everything
        // except the trend component itself) to the PREVIOUS period's already-
        // stored overall index - a timeline comparison, not a circular one.
        const priorKeys = (0, periodUtils_1.lastNPeriodKeys)(periodType, 2, periodType === "monthly" ? new Date(`${periodKey}-01`) : new Date(`${periodKey}-01-01`));
        const priorKey = priorKeys[0];
        const priorScore = priorKey !== periodKey ? await this.repo.getEmployeeScore(employeeId, periodType, priorKey) : null;
        const improvementTrend = baseIndex !== null && priorScore?.overallIndex != null
            ? clamp(50 + (baseIndex - priorScore.overallIndex))
            : null;
        const allComponents = [
            ...baseComponents,
            { componentKey: "improvement_trend", label: "Improvement Trend", rawScore: improvementTrend, weightUsed: weightOf("improvement_trend") },
        ];
        const overallIndex = weightedAverage(allComponents);
        await this.repo.upsertEmployeeScore({ employeeId, periodType, periodKey, overallIndex, componentScores: allComponents });
        return { employeeId, employeeName: employee.fullName, periodType, periodKey, overallIndex, components: allComponents };
    }
    async getIndex(employeeId, periodType, periodKey) {
        // Recomputed on every read - same "no scheduler, compute live" tradeoff
        // as the Scoring Engine, documented there and inherited here.
        return this.computeIndex(employeeId, periodType, periodKey);
    }
}
exports.BehaviourIndexService = BehaviourIndexService;
//# sourceMappingURL=BehaviourIndexService.js.map