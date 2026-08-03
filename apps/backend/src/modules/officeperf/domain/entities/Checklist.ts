export type ChecklistFrequency = "daily" | "weekly" | "monthly";
export type MasterStatus = "active" | "inactive";

export interface ChecklistTemplate {
  id: string;
  title: string;
  description: string | null;
  frequency: ChecklistFrequency;
  status: MasterStatus;
  createdBy: string | null;
  createdAt: Date;
  updatedAt: Date;
  deletedAt: Date | null;
}

export interface ChecklistTemplateItem {
  id: string;
  templateId: string;
  label: string;
  sortOrder: number;
}

export interface ChecklistAssignment {
  id: string;
  templateId: string;
  employeeId: string | null;
  roleId: string | null;
  assignedBy: string;
  createdAt: Date;
}

export interface ChecklistInstanceItem {
  id: string;
  instanceId: string;
  templateItemId: string;
  label: string;
  isChecked: boolean;
  checkedAt: Date | null;
}

export interface ChecklistInstance {
  id: string;
  templateId: string;
  employeeId: string;
  periodKey: string;
  periodStart: string;
  periodEnd: string;
  createdAt: Date;
}

export interface ChecklistInstanceWithItems extends ChecklistInstance {
  templateTitle: string;
  frequency: ChecklistFrequency;
  items: ChecklistInstanceItem[];
}

export function isInstanceComplete(items: Pick<ChecklistInstanceItem, "isChecked">[]): boolean {
  return items.length > 0 && items.every((i) => i.isChecked);
}
