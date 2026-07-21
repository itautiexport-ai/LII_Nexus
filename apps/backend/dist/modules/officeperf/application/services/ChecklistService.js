"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ChecklistService = void 0;
const uuid_1 = require("uuid");
const DomainError_1 = require("../../../../core/domain/errors/DomainError");
const AuditService_1 = require("../../../../shared/services/AuditService");
const periodUtils_1 = require("./periodUtils");
class ChecklistService {
    constructor(repo, scope) {
        this.repo = repo;
        this.scope = scope;
    }
    listTemplates(search, frequency, status) {
        return this.repo.listTemplates({ search, frequency, status });
    }
    async getTemplateDetail(id) {
        const template = await this.repo.findTemplateById(id);
        if (!template)
            throw new DomainError_1.NotFoundError("Checklist template not found.");
        const assignments = await this.repo.getAssignments(id);
        return { ...template, assignments };
    }
    async createTemplate(input, actorId) {
        const template = await this.repo.createTemplate({ id: (0, uuid_1.v4)(), createdBy: actorId, ...input });
        if (input.assignments && input.assignments.length > 0) {
            await this.repo.setAssignments(template.id, input.assignments, actorId);
        }
        await AuditService_1.AuditService.record({
            actorUserId: actorId,
            action: "CHECKLIST_TEMPLATE_CREATED",
            entityType: "checklist_template",
            entityId: template.id,
            afterState: { title: template.title, frequency: template.frequency },
        });
        return this.getTemplateDetail(template.id);
    }
    async updateTemplate(id, changes, actorId) {
        const existing = await this.repo.findTemplateById(id);
        if (!existing)
            throw new DomainError_1.NotFoundError("Checklist template not found.");
        const updated = await this.repo.updateTemplate(id, changes);
        if (changes.items)
            await this.repo.replaceTemplateItems(id, changes.items);
        if (changes.assignments)
            await this.repo.setAssignments(id, changes.assignments, actorId);
        await AuditService_1.AuditService.record({
            actorUserId: actorId,
            action: "CHECKLIST_TEMPLATE_UPDATED",
            entityType: "checklist_template",
            entityId: id,
            beforeState: { title: existing.title, status: existing.status },
            afterState: { title: updated.title, status: updated.status },
        });
        return this.getTemplateDetail(id);
    }
    async deleteTemplate(id, actorId) {
        const existing = await this.repo.findTemplateById(id);
        if (!existing)
            throw new DomainError_1.NotFoundError("Checklist template not found.");
        await this.repo.softDeleteTemplate(id);
        await AuditService_1.AuditService.record({ actorUserId: actorId, action: "CHECKLIST_TEMPLATE_DELETED", entityType: "checklist_template", entityId: id });
    }
    /** Ensures every template assigned to this employee has a generated
     *  instance for the current period, then returns all of them. This is the
     *  "lazy generation" substitute for a cron job. */
    async getMyChecklists(actorUserId) {
        const actor = await this.scope.requireEmployeeForUser(actorUserId);
        const templates = await this.repo.listTemplatesAssignedToEmployee(actor.id);
        const instances = [];
        for (const template of templates) {
            const { periodKey, periodStart, periodEnd } = (0, periodUtils_1.computeCurrentPeriod)(template.frequency);
            const instance = await this.repo.findOrCreateInstance(template.id, actor.id, periodKey, periodStart, periodEnd);
            instances.push(instance);
        }
        return instances;
    }
    async setItemChecked(instanceId, itemId, checked, actorUserId, hasViewOverride) {
        const instance = await this.repo.getInstanceWithItems(instanceId);
        if (!instance)
            throw new DomainError_1.NotFoundError("Checklist instance not found.");
        if (!hasViewOverride) {
            const actor = await this.scope.getEmployeeForUser(actorUserId);
            if (!actor || actor.id !== instance.employeeId) {
                throw new DomainError_1.ForbiddenError("You can only tick items on your own checklist.");
            }
        }
        const item = instance.items.find((i) => i.id === itemId);
        if (!item)
            throw new DomainError_1.NotFoundError("Checklist item not found on this instance.");
        await this.repo.setItemChecked(instanceId, itemId, checked);
        await AuditService_1.AuditService.record({
            actorUserId,
            action: checked ? "CHECKLIST_ITEM_CHECKED" : "CHECKLIST_ITEM_UNCHECKED",
            entityType: "checklist_instance_item",
            entityId: itemId,
        });
        return this.repo.getInstanceWithItems(instanceId);
    }
}
exports.ChecklistService = ChecklistService;
//# sourceMappingURL=ChecklistService.js.map