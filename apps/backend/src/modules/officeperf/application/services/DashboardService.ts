import { IFlowchartRepository } from "../../domain/repositories/IFlowchartRepository";
import { IDelegationRepository } from "../../domain/repositories/IDelegationRepository";
import { EmployeeScopeService } from "../../../performance/application/services/EmployeeScopeService";
import { ScoreService } from "./ScoreService";
import { computeDisplayStatus } from "../../domain/entities/Flowchart";
import { computeDelegationDisplayStatus } from "../../domain/entities/Delegation";
import { MySqlEmployeeRepository } from "../../../organization/infrastructure/repositories/MySqlEmployeeRepository";
import { MySqlDepartmentRepository } from "../../../organization/infrastructure/repositories/MySqlDepartmentRepository";
import { NotFoundError } from "../../../../core/domain/errors/DomainError";
import { getRangeForWindow } from "./periodUtils";

export class DashboardService {
  private readonly employeeRepo = new MySqlEmployeeRepository();
  private readonly departmentRepo = new MySqlDepartmentRepository();

  constructor(
    private readonly flowchartRepo: IFlowchartRepository,
    private readonly delegationRepo: IDelegationRepository,
    private readonly scope: EmployeeScopeService,
    private readonly scoreService: ScoreService
  ) {}

  /** Today's/Pending/Delayed task counts across all three subsystems for one employee. */
  private async getTaskSummary(employeeId: string) {
    const today = getRangeForWindow("today").from;
    const [flowchartTasks, delegatedTasks] = await Promise.all([
      this.flowchartRepo.listTasksForEmployee(employeeId),
      this.delegationRepo.listForEmployee(employeeId),
    ]);

    const flowchartWithStatus = flowchartTasks.map((t) => ({ ...t, displayStatus: computeDisplayStatus(t) }));
    const delegationWithStatus = delegatedTasks.map((t) => ({ ...t, displayStatus: computeDelegationDisplayStatus(t) }));

    const allOpen = [
      ...flowchartWithStatus.map((t) => ({ id: t.id, title: `${t.workflowName}: ${t.stageName}`, dueDate: t.dueDate, status: t.displayStatus, source: "flowchart" as const })),
      ...delegationWithStatus.map((t) => ({ id: t.id, title: t.title, dueDate: t.dueDate, status: t.displayStatus, source: "delegation" as const })),
    ];

    return {
      todaysTasks: allOpen.filter((t) => t.dueDate === today && t.status !== "completed"),
      pendingTasks: allOpen.filter((t) => t.status === "pending" || t.status === "running"),
      delayedTasks: allOpen.filter((t) => t.status === "delayed"),
    };
  }

  async getEmployeeDashboard(actorUserId: string) {
    const actor = await this.scope.requireEmployeeForUser(actorUserId);
    const [summary, scores] = await Promise.all([
      this.getTaskSummary(actor.id),
      this.scoreService.computeAllWindows(actor.id),
    ]);
    return { employeeId: actor.id, employeeName: actor.fullName, ...summary, scores };
  }

  async getManagerDashboard(actorUserId: string) {
    const actor = await this.scope.requireEmployeeForUser(actorUserId);
    const reports = await this.employeeRepo.listDirectReports(actor.id);

    const reportSummaries = await Promise.all(
      reports.map(async (report) => {
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
      })
    );

    return { managerId: actor.id, managerName: actor.fullName, directReports: reportSummaries };
  }

  async getDepartmentDashboard(departmentId: string) {
    const department = await this.departmentRepo.findById(departmentId);
    if (!department) throw new NotFoundError("Department not found.");

    const { items: employees } = await this.employeeRepo.list({ page: 1, pageSize: 500, departmentId });
    const summaries = await Promise.all(
      employees.map(async (emp) => {
        const scores = await this.scoreService.computeAllWindows(emp.id);
        return { employeeId: emp.id, employeeName: emp.fullName, todayScore: scores.today.overall, weekScore: scores.week.overall, monthScore: scores.month.overall };
      })
    );

    const scored = summaries.filter((s) => s.todayScore !== null);
    const departmentAverageToday = scored.length > 0
      ? Math.round((scored.reduce((sum, s) => sum + (s.todayScore as number), 0) / scored.length) * 100) / 100
      : null;

    return { departmentId, departmentName: department.name, departmentAverageToday, employees: summaries };
  }

  async getCompanyDashboard() {
    const departments = await this.departmentRepo.list();
    const departmentSummaries = await Promise.all(
      departments.map(async (dept) => {
        const dashboard = await this.getDepartmentDashboard(dept.id);
        return { departmentId: dept.id, departmentName: dept.name, averageToday: dashboard.departmentAverageToday, employeeCount: dashboard.employees.length };
      })
    );

    const withScores = departmentSummaries.filter((d) => d.averageToday !== null);
    const companyAverageToday = withScores.length > 0
      ? Math.round((withScores.reduce((sum, d) => sum + (d.averageToday as number), 0) / withScores.length) * 100) / 100
      : null;

    return { companyAverageToday, departments: departmentSummaries };
  }
}
