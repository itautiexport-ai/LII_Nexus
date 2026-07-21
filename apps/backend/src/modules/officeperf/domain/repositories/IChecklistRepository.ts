import { ChecklistAssignment, ChecklistFrequency, ChecklistInstanceWithItems, ChecklistTemplate, MasterStatus } from "../entities/Checklist";

export interface CreateTemplateData {
  id: string;
  title: string;
  description?: string | null;
  frequency: ChecklistFrequency;
  createdBy: string | null;
  items: { label: string }[];
}

export interface IChecklistRepository {
  listTemplates(params: { search?: string; frequency?: ChecklistFrequency; status?: MasterStatus }): Promise<ChecklistTemplate[]>;
  findTemplateById(id: string): Promise<ChecklistTemplate | null>;
  createTemplate(data: CreateTemplateData): Promise<ChecklistTemplate>;
  updateTemplate(id: string, changes: { title?: string; description?: string | null; status?: MasterStatus }): Promise<ChecklistTemplate>;
  replaceTemplateItems(templateId: string, items: { label: string }[]): Promise<void>;
  softDeleteTemplate(id: string): Promise<void>;

  setAssignments(templateId: string, assignments: { employeeId?: string | null; roleId?: string | null }[], assignedBy: string): Promise<void>;
  getAssignments(templateId: string): Promise<ChecklistAssignment[]>;
  listAssignedEmployeeIds(templateId: string): Promise<string[]>;
  listTemplatesAssignedToEmployee(employeeId: string): Promise<ChecklistTemplate[]>;

  findOrCreateInstance(templateId: string, employeeId: string, periodKey: string, periodStart: string, periodEnd: string): Promise<ChecklistInstanceWithItems>;
  getInstanceWithItems(instanceId: string): Promise<ChecklistInstanceWithItems | null>;
  setItemChecked(instanceId: string, itemId: string, checked: boolean): Promise<void>;
  listInstancesForEmployee(employeeId: string, periodStart: string, periodEnd: string): Promise<ChecklistInstanceWithItems[]>;
}
