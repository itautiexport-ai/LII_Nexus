"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.WorkflowService = void 0;
const uuid_1 = require("uuid");
const DomainError_1 = require("../../../../core/domain/errors/DomainError");
const AuditService_1 = require("../../../../shared/services/AuditService");
const VALID_TRANSITIONS = {
    draft: ["active", "archived"],
    active: ["inactive", "archived"],
    inactive: ["active", "archived"],
    // Archived workflows are retired; bringing one back starts over as a draft
    // rather than snapping straight back to "active" without review.
    archived: ["draft"],
};
class WorkflowService {
    constructor(repo) {
        this.repo = repo;
    }
    list(page, pageSize, search, departmentId, status) {
        return this.repo.list({ page, pageSize, search, departmentId, status });
    }
    async getById(id) {
        const workflow = await this.repo.findByIdWithStages(id);
        if (!workflow)
            throw new DomainError_1.NotFoundError("Workflow not found.");
        return workflow;
    }
    async create(input, actorId) {
        this.assertUniqueSequenceableStages(input.stages);
        const workflow = await this.repo.create({ id: (0, uuid_1.v4)(), createdBy: actorId, ...input });
        await AuditService_1.AuditService.record({
            actorUserId: actorId,
            action: "WORKFLOW_CREATED",
            entityType: "workflow",
            entityId: workflow.id,
            afterState: { name: workflow.name, stageCount: workflow.stages.length },
        });
        return workflow;
    }
    assertUniqueSequenceableStages(stages) {
        if (!stages)
            return;
        const names = stages.map((s) => s.name.trim().toLowerCase());
        if (new Set(names).size !== names.length) {
            throw new DomainError_1.ValidationError("Stage names must be unique within a workflow.");
        }
    }
    async maybeBumpVersion(workflowId) {
        const workflow = await this.repo.findById(workflowId);
        if (workflow && workflow.status === "active") {
            await this.repo.incrementVersion(workflowId);
            await AuditService_1.AuditService.record({
                actorUserId: null,
                action: "WORKFLOW_VERSION_BUMPED",
                entityType: "workflow",
                entityId: workflowId,
                afterState: { reason: "structural change to an active workflow" },
            });
        }
    }
    async updateMeta(id, changes, actorId) {
        const existing = await this.repo.findById(id);
        if (!existing)
            throw new DomainError_1.NotFoundError("Workflow not found.");
        const updated = await this.repo.updateMeta(id, changes);
        await AuditService_1.AuditService.record({
            actorUserId: actorId,
            action: "WORKFLOW_UPDATED",
            entityType: "workflow",
            entityId: id,
            beforeState: { name: existing.name, description: existing.description },
            afterState: { name: updated.name, description: updated.description },
        });
        return updated;
    }
    async updateStatus(id, status, actorId) {
        const existing = await this.repo.findById(id);
        if (!existing)
            throw new DomainError_1.NotFoundError("Workflow not found.");
        if (existing.status === status)
            return existing;
        const allowed = VALID_TRANSITIONS[existing.status];
        if (!allowed.includes(status)) {
            throw new DomainError_1.ConflictError(`Cannot move a workflow from "${existing.status}" to "${status}".`);
        }
        const updated = await this.repo.updateStatus(id, status);
        await AuditService_1.AuditService.record({
            actorUserId: actorId,
            action: "WORKFLOW_STATUS_CHANGED",
            entityType: "workflow",
            entityId: id,
            beforeState: { status: existing.status },
            afterState: { status: updated.status },
        });
        return updated;
    }
    async remove(id, actorId) {
        const existing = await this.repo.findById(id);
        if (!existing)
            throw new DomainError_1.NotFoundError("Workflow not found.");
        await this.repo.softDelete(id);
        await AuditService_1.AuditService.record({ actorUserId: actorId, action: "WORKFLOW_DELETED", entityType: "workflow", entityId: id });
    }
    async addStage(workflowId, stage, actorId) {
        const workflow = await this.repo.findById(workflowId);
        if (!workflow)
            throw new DomainError_1.NotFoundError("Workflow not found.");
        const created = await this.repo.addStage(workflowId, stage, 0);
        await this.maybeBumpVersion(workflowId);
        await AuditService_1.AuditService.record({
            actorUserId: actorId,
            action: "WORKFLOW_STAGE_ADDED",
            entityType: "workflow_stage",
            entityId: created.id,
            afterState: { workflowId, name: created.name, sequence: created.sequence },
        });
        return created;
    }
    async updateStage(workflowId, stageId, stage, actorId) {
        const workflow = await this.repo.findById(workflowId);
        if (!workflow)
            throw new DomainError_1.NotFoundError("Workflow not found.");
        const existing = await this.repo.getStage(workflowId, stageId);
        if (!existing)
            throw new DomainError_1.NotFoundError("Stage not found.");
        const updated = await this.repo.updateStage(workflowId, stageId, stage);
        await this.maybeBumpVersion(workflowId);
        await AuditService_1.AuditService.record({
            actorUserId: actorId,
            action: "WORKFLOW_STAGE_UPDATED",
            entityType: "workflow_stage",
            entityId: stageId,
            beforeState: { name: existing.name },
            afterState: { name: updated.name },
        });
        return updated;
    }
    async removeStage(workflowId, stageId, actorId) {
        const workflow = await this.repo.findById(workflowId);
        if (!workflow)
            throw new DomainError_1.NotFoundError("Workflow not found.");
        const existing = await this.repo.getStage(workflowId, stageId);
        if (!existing)
            throw new DomainError_1.NotFoundError("Stage not found.");
        await this.repo.removeStage(workflowId, stageId);
        await this.maybeBumpVersion(workflowId);
        await AuditService_1.AuditService.record({
            actorUserId: actorId,
            action: "WORKFLOW_STAGE_REMOVED",
            entityType: "workflow_stage",
            entityId: stageId,
            beforeState: { name: existing.name },
        });
    }
    async reorderStages(workflowId, stageIds, actorId) {
        const workflow = await this.repo.findById(workflowId);
        if (!workflow)
            throw new DomainError_1.NotFoundError("Workflow not found.");
        await this.repo.reorderStages(workflowId, stageIds);
        await this.maybeBumpVersion(workflowId);
        await AuditService_1.AuditService.record({
            actorUserId: actorId,
            action: "WORKFLOW_STAGES_REORDERED",
            entityType: "workflow",
            entityId: workflowId,
            afterState: { order: stageIds },
        });
        return this.repo.findByIdWithStages(workflowId);
    }
}
exports.WorkflowService = WorkflowService;
//# sourceMappingURL=WorkflowService.js.map