export interface StandaloneChecklist {
  id: string;
  assignedBy: string;
  taskName: string;
  assignTo: string;
  makeAttachmentMandatory: boolean;
  makeNoteMandatory: boolean;
  mode: string;
  frequency: string;
  remindBeforeDays: string;
  reminderDays?: number;
  skipOnHolidays: boolean;
  createdAt: Date;
  updatedAt: Date;
}
