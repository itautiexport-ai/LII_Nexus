"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ScoreService = void 0;
const periodUtils_1 = require("./periodUtils");
const Checklist_1 = require("../../domain/entities/Checklist");
const WEIGHTS = { flowchart: 80, checklist: 10, delegation: 10 };
class ScoreService {
    constructor(flowchartRepo, delegationRepo, checklistRepo) {
        this.flowchartRepo = flowchartRepo;
        this.delegationRepo = delegationRepo;
        this.checklistRepo = checklistRepo;
    }
    /**
     * Weighted performance score (Flowchart 80% / Checklist 10% / Delegation
     * 10%). A category with nothing due in the window is excluded from both
     * the numerator and the weight total (renormalized), rather than counted
     * as 0% - an employee with no checklist due today shouldn't be penalized
     * for it. If literally nothing was due anywhere, the overall score is
     * `null` ("nothing to evaluate"), not 0.
     */
    async computeWindowScore(employeeId, window) {
        const { from, to } = (0, periodUtils_1.getRangeForWindow)(window);
        const flowchartCounts = await this.flowchartRepo.countCompletedAndTotalDue(employeeId, from, to);
        const delegationCounts = await this.delegationRepo.countCompletedAndTotalDue(employeeId, from, to);
        const instances = await this.checklistRepo.listInstancesForEmployee(employeeId, from, to);
        const checklistTotal = instances.length;
        const checklistCompleted = instances.filter((i) => (0, Checklist_1.isInstanceComplete)(i.items)).length;
        const flowchart = {
            completed: flowchartCounts.completed,
            total: flowchartCounts.total,
            rate: flowchartCounts.total > 0 ? (flowchartCounts.completed / flowchartCounts.total) * 100 : null,
        };
        const checklist = {
            completed: checklistCompleted,
            total: checklistTotal,
            rate: checklistTotal > 0 ? (checklistCompleted / checklistTotal) * 100 : null,
        };
        const delegation = {
            completed: delegationCounts.completed,
            total: delegationCounts.total,
            rate: delegationCounts.total > 0 ? (delegationCounts.completed / delegationCounts.total) * 100 : null,
        };
        const present = [
            { rate: flowchart.rate, weight: WEIGHTS.flowchart },
            { rate: checklist.rate, weight: WEIGHTS.checklist },
            { rate: delegation.rate, weight: WEIGHTS.delegation },
        ].filter((c) => c.rate !== null);
        const totalWeight = present.reduce((sum, c) => sum + c.weight, 0);
        const overall = totalWeight > 0
            ? Math.round((present.reduce((sum, c) => sum + c.rate * c.weight, 0) / totalWeight) * 100) / 100
            : null;
        return { flowchart, checklist, delegation, overall };
    }
    async computeAllWindows(employeeId) {
        const [today, week, month] = await Promise.all([
            this.computeWindowScore(employeeId, "today"),
            this.computeWindowScore(employeeId, "week"),
            this.computeWindowScore(employeeId, "month"),
        ]);
        return { today, week, month };
    }
}
exports.ScoreService = ScoreService;
//# sourceMappingURL=ScoreService.js.map