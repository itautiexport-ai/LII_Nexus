import { v4 as uuid } from "uuid";
import { IWorkflowRepository, StageInput } from "../../domain/repositories/IWorkflowRepository";
import { WorkflowStatus } from "../../domain/entities/Workflow";
import { ConflictError, NotFoundError, ValidationError } from "../../../../core/domain/errors/DomainError";
import { AuditService } from "../../../../shared/services/AuditService";

const VALID_TRANSITIONS: Record<WorkflowStatus, WorkflowStatus[]> = {
  draft: ["active", "archived"],
  active: ["inactive", "archived"],
  inactive: ["active", "archived"],
  // Archived workflows are retired; bringing one back starts over as a draft
  // rather than snapping straight back to "active" without review.
  archived: ["draft"],
};

export class WorkflowService {
  constructor(private readonly repo: IWorkflowRepository) {}

  list(page: number, pageSize: number, search?: string, departmentId?: string, status?: WorkflowStatus) {
    return this.repo.list({ page, pageSize, search, departmentId, status });
  }

  async getById(id: string) {
    const workflow = await this.repo.findByIdWithStages(id);
    if (!workflow) throw new NotFoundError("Workflow not found.");
    return workflow;
  }

  async create(input: { name: string; departmentId?: string | null; description?: string | null; stages?: StageInput[] }, actorId: string) {
    this.assertUniqueSequenceableStages(input.stages);
    const workflow = await this.repo.create({ id: uuid(), createdBy: actorId, ...input });
    await AuditService.record({
      actorUserId: actorId,
      action: "WORKFLOW_CREATED",
      entityType: "workflow",
      entityId: workflow.id,
      afterState: { name: workflow.name, stageCount: workflow.stages.length },
    });
    return workflow;
  }

  private assertUniqueSequenceableStages(stages?: StageInput[]) {
    if (!stages) return;
    const names = stages.map((s) => s.name.trim().toLowerCase());
    if (new Set(names).size !== names.length) {
      throw new ValidationError("Stage names must be unique within a workflow.");
    }
  }

  private async maybeBumpVersion(workflowId: string) {
    const workflow = await this.repo.findById(workflowId);
    if (workflow && workflow.status === "active") {
      await this.repo.incrementVersion(workflowId);
      await AuditService.record({
        actorUserId: null,
        action: "WORKFLOW_VERSION_BUMPED",
        entityType: "workflow",
        entityId: workflowId,
        afterState: { reason: "structural change to an active workflow" },
      });
    }
  }

  async updateMeta(id: string, changes: { name?: string; departmentId?: string | null; description?: string | null }, actorId: string) {
    const existing = await this.repo.findById(id);
    if (!existing) throw new NotFoundError("Workflow not found.");

    const updated = await this.repo.updateMeta(id, changes);
    await AuditService.record({
      actorUserId: actorId,
      action: "WORKFLOW_UPDATED",
      entityType: "workflow",
      entityId: id,
      beforeState: { name: existing.name, description: existing.description },
      afterState: { name: updated.name, description: updated.description },
    });
    return updated;
  }

  async updateStatus(id: string, status: WorkflowStatus, actorId: string) {
    const existing = await this.repo.findById(id);
    if (!existing) throw new NotFoundError("Workflow not found.");
    if (existing.status === status) return existing;

    const allowed = VALID_TRANSITIONS[existing.status];
    if (!allowed.includes(status)) {
      throw new ConflictError(`Cannot move a workflow from "${existing.status}" to "${status}".`);
    }

    const updated = await this.repo.updateStatus(id, status);
    await AuditService.record({
      actorUserId: actorId,
      action: "WORKFLOW_STATUS_CHANGED",
      entityType: "workflow",
      entityId: id,
      beforeState: { status: existing.status },
      afterState: { status: updated.status },
    });
    return updated;
  }

  async remove(id: string, actorId: string) {
    const existing = await this.repo.findById(id);
    if (!existing) throw new NotFoundError("Workflow not found.");
    await this.repo.softDelete(id);
    await AuditService.record({ actorUserId: actorId, action: "WORKFLOW_DELETED", entityType: "workflow", entityId: id });
  }

  async addStage(workflowId: string, stage: StageInput, actorId: string) {
    const workflow = await this.repo.findById(workflowId);
    if (!workflow) throw new NotFoundError("Workflow not found.");

    const created = await this.repo.addStage(workflowId, stage, 0);
    await this.maybeBumpVersion(workflowId);
    await AuditService.record({
      actorUserId: actorId,
      action: "WORKFLOW_STAGE_ADDED",
      entityType: "workflow_stage",
      entityId: created.id,
      afterState: { workflowId, name: created.name, sequence: created.sequence },
    });
    return created;
  }

  async updateStage(workflowId: string, stageId: string, stage: StageInput, actorId: string) {
    const workflow = await this.repo.findById(workflowId);
    if (!workflow) throw new NotFoundError("Workflow not found.");
    const existing = await this.repo.getStage(workflowId, stageId);
    if (!existing) throw new NotFoundError("Stage not found.");

    const updated = await this.repo.updateStage(workflowId, stageId, stage);
    await this.maybeBumpVersion(workflowId);
    await AuditService.record({
      actorUserId: actorId,
      action: "WORKFLOW_STAGE_UPDATED",
      entityType: "workflow_stage",
      entityId: stageId,
      beforeState: { name: existing.name },
      afterState: { name: updated.name },
    });
    return updated;
  }

  async removeStage(workflowId: string, stageId: string, actorId: string) {
    const workflow = await this.repo.findById(workflowId);
    if (!workflow) throw new NotFoundError("Workflow not found.");
    const existing = await this.repo.getStage(workflowId, stageId);
    if (!existing) throw new NotFoundError("Stage not found.");

    await this.repo.removeStage(workflowId, stageId);
    await this.maybeBumpVersion(workflowId);
    await AuditService.record({
      actorUserId: actorId,
      action: "WORKFLOW_STAGE_REMOVED",
      entityType: "workflow_stage",
      entityId: stageId,
      beforeState: { name: existing.name },
    });
  }

  async reorderStages(workflowId: string, stageIds: string[], actorId: string) {
    const workflow = await this.repo.findById(workflowId);
    if (!workflow) throw new NotFoundError("Workflow not found.");

    await this.repo.reorderStages(workflowId, stageIds);
    await this.maybeBumpVersion(workflowId);
    await AuditService.record({
      actorUserId: actorId,
      action: "WORKFLOW_STAGES_REORDERED",
      entityType: "workflow",
      entityId: workflowId,
      afterState: { order: stageIds },
    });
    return this.repo.findByIdWithStages(workflowId);
  }
}
