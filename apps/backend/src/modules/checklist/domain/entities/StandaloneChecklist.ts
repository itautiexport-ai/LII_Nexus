export interface StandaloneChecklist {
  id: string;
  assignedBy: string;
  taskName: string;
  assignTo: string;
  plannedDate: Date;
  priority: "Low" | "Medium" | "High";
  makeAttachmentMandatory: boolean;
  makeNoteMandatory: boolean;
  mode: string;
  frequency: string;
  whenRule?: string;
  remindBeforeDays: number;
  skipOnHolidays: boolean;
  createdAt: Date;
  updatedAt: Date;
}
