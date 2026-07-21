import { v4 as uuid } from "uuid";
import { IFlowchartRepository } from "../../domain/repositories/IFlowchartRepository";
import { EmployeeScopeService } from "../../../performance/application/services/EmployeeScopeService";
import { MySqlWorkflowRepository } from "../../../workflow/infrastructure/repositories/MySqlWorkflowRepository";
import { ConflictError, ForbiddenError, NotFoundError, ValidationError } from "../../../../core/domain/errors/DomainError";
import { AuditService } from "../../../../shared/services/AuditService";
import { computeDisplayStatus } from "../../domain/entities/Flowchart";
import { NotificationService } from "../../../notifications/application/services/NotificationService";
import { MySqlNotificationRepository } from "../../../notifications/infrastructure/repositories/MySqlNotificationRepository";

const notificationService = new NotificationService(new MySqlNotificationRepository());

export class FlowchartService {
  private readonly workflowRepo = new MySqlWorkflowRepository();

  constructor(private readonly repo: IFlowchartRepository, private readonly scope: EmployeeScopeService) {}

  async startRun(workflowId: string, reference: string, notes: string | null | undefined, actorUserId: string) {
    const workflow = await this.workflowRepo.findByIdWithStages(workflowId);
    if (!workflow) throw new ValidationError("The specified workflow does not exist.");
    if (workflow.status !== "active") {
      throw new ConflictError("Only an active workflow can be run. This workflow is currently " + workflow.status + ".");
    }
    const sortedStages = [...workflow.stages].sort((a, b) => a.sequence - b.sequence);
    if (sortedStages.length === 0) {
      throw new ValidationError("This workflow has no stages yet and cannot be run.");
    }

    const run = await this.repo.createRun({
      id: uuid(),
      workflowId,
      reference,
      notes,
      startedBy: actorUserId,
      firstStageId: sortedStages[0].id,
    });

    await AuditService.record({
      actorUserId,
      action: "WORKFLOW_RUN_STARTED",
      entityType: "workflow_run",
      entityId: run.id,
      afterState: { workflowId, reference },
    });
    return run;
  }

  listRuns(page: number, pageSize: number, workflowId?: string, status?: "in_progress" | "completed" | "cancelled") {
    return this.repo.listRuns({ page, pageSize, workflowId, status });
  }

  async getRunDetail(runId: string) {
    const run = await this.repo.findRunById(runId);
    if (!run) throw new NotFoundError("Workflow run not found.");
    const tasks = await this.repo.listTasksForRun(runId);
    return { ...run, tasks: tasks.map((t) => ({ ...t, displayStatus: computeDisplayStatus(t) })) };
  }

  async listMyTasks(actorUserId: string, from?: string, to?: string) {
    const actor = await this.scope.requireEmployeeForUser(actorUserId);
    const tasks = await this.repo.listTasksForEmployee(actor.id, { from, to });
    return tasks.map((t) => ({ ...t, displayStatus: computeDisplayStatus(t) }));
  }

  async assignTask(taskId: string, employeeId: string, actorUserId: string, hasAssignOverride: boolean) {
    const task = await this.repo.findTaskById(taskId);
    if (!task) throw new NotFoundError("Task not found.");
    if (task.assignedTo) throw new ConflictError("This task is already assigned.");

    const assignee = await this.scope.authorizeManagerOnly(
      actorUserId,
      employeeId,
      hasAssignOverride,
      "You can only assign flowchart tasks to your direct reports."
    );

    const run = await this.repo.findRunById(task.workflowRunId);
    const stage = await this.workflowRepo.getStage(run!.workflowId, task.stageId);
    const dueDate = stage?.dueDays != null
      ? new Date(Date.now() + stage.dueDays * 24 * 60 * 60 * 1000).toISOString().slice(0, 10)
      : null;

    const updated = await this.repo.assignTask(taskId, employeeId, actorUserId, dueDate);

    if (assignee.userId) {
      await notificationService.notify({
        type: "workflow_stage_assigned",
        module: "workflow",
        referenceType: "flowchart_task",
        referenceId: taskId,
        assignedUserId: assignee.userId,
        createdBy: actorUserId,
        dueDate: dueDate ?? undefined,
      });
    }

    await AuditService.record({
      actorUserId,
      action: "FLOWCHART_TASK_ASSIGNED",
      entityType: "flowchart_task",
      entityId: taskId,
      afterState: { employeeId, dueDate },
    });
    return updated;
  }

  async updateTaskStatus(taskId: string, status: "running" | "completed", remarks: string | null | undefined, actorUserId: string, hasUpdateOverride: boolean) {
    const task = await this.repo.findTaskById(taskId);
    if (!task) throw new NotFoundError("Task not found.");
    if (!task.assignedTo) throw new ValidationError("This task has not been assigned yet.");

    if (!hasUpdateOverride) {
      const actor = await this.scope.getEmployeeForUser(actorUserId);
      if (!actor || actor.id !== task.assignedTo) {
        throw new ForbiddenError("Only the person this task is assigned to can update its status.");
      }
    }
    if (task.baseStatus === "completed") {
      throw new ConflictError("This task is already completed.");
    }

    const updated = await this.repo.updateTaskStatus(taskId, status, remarks);

    if (status === "completed") {
      const run = await this.repo.findRunById(task.workflowRunId);
      const workflow = await this.workflowRepo.findByIdWithStages(run!.workflowId);
      const sortedStages = [...workflow!.stages].sort((a, b) => a.sequence - b.sequence);
      const currentIndex = sortedStages.findIndex((s) => s.id === task.stageId);
      const nextStage = sortedStages[currentIndex + 1];

      if (nextStage) {
        await this.repo.createNextStageTask(task.workflowRunId, nextStage.id);
      } else {
        await this.repo.updateRunStatus(task.workflowRunId, "completed");
      }
    }

    await AuditService.record({
      actorUserId,
      action: "FLOWCHART_TASK_STATUS_CHANGED",
      entityType: "flowchart_task",
      entityId: taskId,
      afterState: { status },
    });
    return updated;
  }
}
