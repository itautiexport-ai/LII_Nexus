"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.DashboardService = void 0;
const Flowchart_1 = require("../../domain/entities/Flowchart");
const Delegation_1 = require("../../domain/entities/Delegation");
const MySqlEmployeeRepository_1 = require("../../../organization/infrastructure/repositories/MySqlEmployeeRepository");
const MySqlDepartmentRepository_1 = require("../../../organization/infrastructure/repositories/MySqlDepartmentRepository");
const DomainError_1 = require("../../../../core/domain/errors/DomainError");
const periodUtils_1 = require("./periodUtils");
class DashboardService {
    constructor(flowchartRepo, delegationRepo, scope, scoreService) {
        this.flowchartRepo = flowchartRepo;
        this.delegationRepo = delegationRepo;
        this.scope = scope;
        this.scoreService = scoreService;
        this.employeeRepo = new MySqlEmployeeRepository_1.MySqlEmployeeRepository();
        this.departmentRepo = new MySqlDepartmentRepository_1.MySqlDepartmentRepository();
    }
    /** Today's/Pending/Delayed task counts across all three subsystems for one employee. */
    async getTaskSummary(employeeId) {
        const today = (0, periodUtils_1.getRangeForWindow)("today").from;
        const [flowchartTasks, delegatedTasks] = await Promise.all([
            this.flowchartRepo.listTasksForEmployee(employeeId),
            this.delegationRepo.listForEmployee(employeeId),
        ]);
        const flowchartWithStatus = flowchartTasks.map((t) => ({ ...t, displayStatus: (0, Flowchart_1.computeDisplayStatus)(t) }));
        const delegationWithStatus = delegatedTasks.map((t) => ({ ...t, displayStatus: (0, Delegation_1.computeDelegationDisplayStatus)(t) }));
        const allOpen = [
            ...flowchartWithStatus.map((t) => ({ id: t.id, title: `${t.workflowName}: ${t.stageName}`, dueDate: t.dueDate, status: t.displayStatus, source: "flowchart" })),
            ...delegationWithStatus.map((t) => ({ id: t.id, title: t.title, dueDate: t.dueDate, status: t.displayStatus, source: "delegation" })),
        ];
        return {
            todaysTasks: allOpen.filter((t) => t.dueDate === today && t.status !== "completed"),
            pendingTasks: allOpen.filter((t) => t.status === "pending" || t.status === "running"),
            delayedTasks: allOpen.filter((t) => t.status === "delayed"),
        };
    }
    async getEmployeeDashboard(actorUserId) {
        const actor = await this.scope.requireEmployeeForUser(actorUserId);
        const [summary, scores] = await Promise.all([
            this.getTaskSummary(actor.id),
            this.scoreService.computeAllWindows(actor.id),
        ]);
        return { employeeId: actor.id, employeeName: actor.fullName, ...summary, scores };
    }
    async getManagerDashboard(actorUserId) {
        const actor = await this.scope.requireEmployeeForUser(actorUserId);
        const reports = await this.employeeRepo.listDirectReports(actor.id);
        const reportSummaries = await Promise.all(reports.map(async (report) => {
            const [summary, scores] = await Promise.all([
                this.getTaskSummary(report.id),
                this.scoreService.computeAllWindows(report.id),
            ]);
            return {
                employeeId: report.id,
                employeeName: report.fullName,
                todaysTaskCount: summary.todaysTasks.length,
                pendingTaskCount: summary.pendingTasks.length,
                delayedTaskCount: summary.delayedTasks.length,
                todayScore: scores.today.overall,
                weekScore: scores.week.overall,
                monthScore: scores.month.overall,
            };
        }));
        return { managerId: actor.id, managerName: actor.fullName, directReports: reportSummaries };
    }
    async getDepartmentDashboard(departmentId) {
        const department = await this.departmentRepo.findById(departmentId);
        if (!department)
            throw new DomainError_1.NotFoundError("Department not found.");
        const { items: employees } = await this.employeeRepo.list({ page: 1, pageSize: 500, departmentId });
        const summaries = await Promise.all(employees.map(async (emp) => {
            const scores = await this.scoreService.computeAllWindows(emp.id);
            return { employeeId: emp.id, employeeName: emp.fullName, todayScore: scores.today.overall, weekScore: scores.week.overall, monthScore: scores.month.overall };
        }));
        const scored = summaries.filter((s) => s.todayScore !== null);
        const departmentAverageToday = scored.length > 0
            ? Math.round((scored.reduce((sum, s) => sum + s.todayScore, 0) / scored.length) * 100) / 100
            : null;
        return { departmentId, departmentName: department.name, departmentAverageToday, employees: summaries };
    }
    async getCompanyDashboard() {
        const departments = await this.departmentRepo.list();
        const departmentSummaries = await Promise.all(departments.map(async (dept) => {
            const dashboard = await this.getDepartmentDashboard(dept.id);
            return { departmentId: dept.id, departmentName: dept.name, averageToday: dashboard.departmentAverageToday, employeeCount: dashboard.employees.length };
        }));
        const withScores = departmentSummaries.filter((d) => d.averageToday !== null);
        const companyAverageToday = withScores.length > 0
            ? Math.round((withScores.reduce((sum, d) => sum + d.averageToday, 0) / withScores.length) * 100) / 100
            : null;
        return { companyAverageToday, departments: departmentSummaries };
    }
}
exports.DashboardService = DashboardService;
//# sourceMappingURL=DashboardService.js.map