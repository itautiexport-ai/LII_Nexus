import { v4 as uuid } from "uuid";
import { IChecklistRepository } from "../../domain/repositories/IChecklistRepository";
import { EmployeeScopeService } from "../../../performance/application/services/EmployeeScopeService";
import { ChecklistFrequency, MasterStatus } from "../../domain/entities/Checklist";
import { ForbiddenError, NotFoundError } from "../../../../core/domain/errors/DomainError";
import { AuditService } from "../../../../shared/services/AuditService";
import { computeCurrentPeriod } from "./periodUtils";

interface CreateTemplateInput {
  title: string;
  description?: string | null;
  frequency: ChecklistFrequency;
  items: { label: string }[];
  assignments?: { employeeId?: string | null; roleId?: string | null }[];
}

export class ChecklistService {
  constructor(private readonly repo: IChecklistRepository, private readonly scope: EmployeeScopeService) {}

  listTemplates(search?: string, frequency?: ChecklistFrequency, status?: MasterStatus) {
    return this.repo.listTemplates({ search, frequency, status });
  }

  async getTemplateDetail(id: string) {
    const template = await this.repo.findTemplateById(id);
    if (!template) throw new NotFoundError("Checklist template not found.");
    const assignments = await this.repo.getAssignments(id);
    return { ...template, assignments };
  }

  async createTemplate(input: CreateTemplateInput, actorId: string) {
    const template = await this.repo.createTemplate({ id: uuid(), createdBy: actorId, ...input });
    if (input.assignments && input.assignments.length > 0) {
      await this.repo.setAssignments(template.id, input.assignments, actorId);
    }
    await AuditService.record({
      actorUserId: actorId,
      action: "CHECKLIST_TEMPLATE_CREATED",
      entityType: "checklist_template",
      entityId: template.id,
      afterState: { title: template.title, frequency: template.frequency },
    });
    return this.getTemplateDetail(template.id);
  }

  async updateTemplate(
    id: string,
    changes: { title?: string; description?: string | null; status?: MasterStatus; items?: { label: string }[]; assignments?: { employeeId?: string | null; roleId?: string | null }[] },
    actorId: string
  ) {
    const existing = await this.repo.findTemplateById(id);
    if (!existing) throw new NotFoundError("Checklist template not found.");

    const updated = await this.repo.updateTemplate(id, changes);
    if (changes.items) await this.repo.replaceTemplateItems(id, changes.items);
    if (changes.assignments) await this.repo.setAssignments(id, changes.assignments, actorId);

    await AuditService.record({
      actorUserId: actorId,
      action: "CHECKLIST_TEMPLATE_UPDATED",
      entityType: "checklist_template",
      entityId: id,
      beforeState: { title: existing.title, status: existing.status },
      afterState: { title: updated.title, status: updated.status },
    });
    return this.getTemplateDetail(id);
  }

  async deleteTemplate(id: string, actorId: string) {
    const existing = await this.repo.findTemplateById(id);
    if (!existing) throw new NotFoundError("Checklist template not found.");
    await this.repo.softDeleteTemplate(id);
    await AuditService.record({ actorUserId: actorId, action: "CHECKLIST_TEMPLATE_DELETED", entityType: "checklist_template", entityId: id });
  }

  /** Ensures every template assigned to this employee has a generated
   *  instance for the current period, then returns all of them. This is the
   *  "lazy generation" substitute for a cron job. */
  async getMyChecklists(actorUserId: string) {
    const actor = await this.scope.requireEmployeeForUser(actorUserId);
    const templates = await this.repo.listTemplatesAssignedToEmployee(actor.id);

    const instances = [];
    for (const template of templates) {
      const { periodKey, periodStart, periodEnd } = computeCurrentPeriod(template.frequency);
      const instance = await this.repo.findOrCreateInstance(template.id, actor.id, periodKey, periodStart, periodEnd);
      instances.push(instance);
    }
    return instances;
  }

  async setItemChecked(instanceId: string, itemId: string, checked: boolean, actorUserId: string, hasViewOverride: boolean) {
    const instance = await this.repo.getInstanceWithItems(instanceId);
    if (!instance) throw new NotFoundError("Checklist instance not found.");

    if (!hasViewOverride) {
      const actor = await this.scope.getEmployeeForUser(actorUserId);
      if (!actor || actor.id !== instance.employeeId) {
        throw new ForbiddenError("You can only tick items on your own checklist.");
      }
    }

    const item = instance.items.find((i) => i.id === itemId);
    if (!item) throw new NotFoundError("Checklist item not found on this instance.");

    await this.repo.setItemChecked(instanceId, itemId, checked);
    await AuditService.record({
      actorUserId,
      action: checked ? "CHECKLIST_ITEM_CHECKED" : "CHECKLIST_ITEM_UNCHECKED",
      entityType: "checklist_instance_item",
      entityId: itemId,
    });
    return this.repo.getInstanceWithItems(instanceId);
  }
}
