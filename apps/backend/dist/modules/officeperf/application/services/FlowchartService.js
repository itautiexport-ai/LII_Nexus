"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.FlowchartService = void 0;
const uuid_1 = require("uuid");
const MySqlWorkflowRepository_1 = require("../../../workflow/infrastructure/repositories/MySqlWorkflowRepository");
const DomainError_1 = require("../../../../core/domain/errors/DomainError");
const AuditService_1 = require("../../../../shared/services/AuditService");
const Flowchart_1 = require("../../domain/entities/Flowchart");
const NotificationService_1 = require("../../../notifications/application/services/NotificationService");
const MySqlNotificationRepository_1 = require("../../../notifications/infrastructure/repositories/MySqlNotificationRepository");
const notificationService = new NotificationService_1.NotificationService(new MySqlNotificationRepository_1.MySqlNotificationRepository());
class FlowchartService {
    constructor(repo, scope) {
        this.repo = repo;
        this.scope = scope;
        this.workflowRepo = new MySqlWorkflowRepository_1.MySqlWorkflowRepository();
    }
    async startRun(workflowId, reference, notes, actorUserId) {
        const workflow = await this.workflowRepo.findByIdWithStages(workflowId);
        if (!workflow)
            throw new DomainError_1.ValidationError("The specified workflow does not exist.");
        if (workflow.status !== "active") {
            throw new DomainError_1.ConflictError("Only an active workflow can be run. This workflow is currently " + workflow.status + ".");
        }
        const sortedStages = [...workflow.stages].sort((a, b) => a.sequence - b.sequence);
        if (sortedStages.length === 0) {
            throw new DomainError_1.ValidationError("This workflow has no stages yet and cannot be run.");
        }
        const run = await this.repo.createRun({
            id: (0, uuid_1.v4)(),
            workflowId,
            reference,
            notes,
            startedBy: actorUserId,
            firstStageId: sortedStages[0].id,
        });
        await AuditService_1.AuditService.record({
            actorUserId,
            action: "WORKFLOW_RUN_STARTED",
            entityType: "workflow_run",
            entityId: run.id,
            afterState: { workflowId, reference },
        });
        return run;
    }
    listRuns(page, pageSize, workflowId, status) {
        return this.repo.listRuns({ page, pageSize, workflowId, status });
    }
    async getRunDetail(runId) {
        const run = await this.repo.findRunById(runId);
        if (!run)
            throw new DomainError_1.NotFoundError("Workflow run not found.");
        const tasks = await this.repo.listTasksForRun(runId);
        return { ...run, tasks: tasks.map((t) => ({ ...t, displayStatus: (0, Flowchart_1.computeDisplayStatus)(t) })) };
    }
    async listMyTasks(actorUserId, from, to) {
        const actor = await this.scope.requireEmployeeForUser(actorUserId);
        const tasks = await this.repo.listTasksForEmployee(actor.id, { from, to });
        return tasks.map((t) => ({ ...t, displayStatus: (0, Flowchart_1.computeDisplayStatus)(t) }));
    }
    async assignTask(taskId, employeeId, actorUserId, hasAssignOverride) {
        const task = await this.repo.findTaskById(taskId);
        if (!task)
            throw new DomainError_1.NotFoundError("Task not found.");
        if (task.assignedTo)
            throw new DomainError_1.ConflictError("This task is already assigned.");
        const assignee = await this.scope.authorizeManagerOnly(actorUserId, employeeId, hasAssignOverride, "You can only assign flowchart tasks to your direct reports.");
        const run = await this.repo.findRunById(task.workflowRunId);
        const stage = await this.workflowRepo.getStage(run.workflowId, task.stageId);
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
        await AuditService_1.AuditService.record({
            actorUserId,
            action: "FLOWCHART_TASK_ASSIGNED",
            entityType: "flowchart_task",
            entityId: taskId,
            afterState: { employeeId, dueDate },
        });
        return updated;
    }
    async updateTaskStatus(taskId, status, remarks, actorUserId, hasUpdateOverride) {
        const task = await this.repo.findTaskById(taskId);
        if (!task)
            throw new DomainError_1.NotFoundError("Task not found.");
        if (!task.assignedTo)
            throw new DomainError_1.ValidationError("This task has not been assigned yet.");
        if (!hasUpdateOverride) {
            const actor = await this.scope.getEmployeeForUser(actorUserId);
            if (!actor || actor.id !== task.assignedTo) {
                throw new DomainError_1.ForbiddenError("Only the person this task is assigned to can update its status.");
            }
        }
        if (task.baseStatus === "completed") {
            throw new DomainError_1.ConflictError("This task is already completed.");
        }
        const updated = await this.repo.updateTaskStatus(taskId, status, remarks);
        if (status === "completed") {
            const run = await this.repo.findRunById(task.workflowRunId);
            const workflow = await this.workflowRepo.findByIdWithStages(run.workflowId);
            const sortedStages = [...workflow.stages].sort((a, b) => a.sequence - b.sequence);
            const currentIndex = sortedStages.findIndex((s) => s.id === task.stageId);
            const nextStage = sortedStages[currentIndex + 1];
            if (nextStage) {
                await this.repo.createNextStageTask(task.workflowRunId, nextStage.id);
            }
            else {
                await this.repo.updateRunStatus(task.workflowRunId, "completed");
            }
        }
        await AuditService_1.AuditService.record({
            actorUserId,
            action: "FLOWCHART_TASK_STATUS_CHANGED",
            entityType: "flowchart_task",
            entityId: taskId,
            afterState: { status },
        });
        return updated;
    }
}
exports.FlowchartService = FlowchartService;
//# sourceMappingURL=FlowchartService.js.map