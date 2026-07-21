export type DelegationPriority = "low" | "medium" | "high" | "urgent";
export type DelegationBaseStatus = "pending" | "running" | "completed";
export type DelegationDisplayStatus = "pending" | "running" | "completed" | "delayed";
export type DelegationFileKind = "attachment" | "proof";

export interface DelegatedTask {
  id: string;
  title: string;
  description: string | null;
  assignedBy: string;
  assignedTo: string;
  dueDate: string;
  priority: DelegationPriority;
  baseStatus: DelegationBaseStatus;
  isAttachmentMandatory: boolean;
  isNoteMandatory: boolean;
  remarks: string | null;
  escalatedTo: string | null;
  escalatedAt: Date | null;
  escalationNotes: string | null;
  startedAt: Date | null;
  completedAt: Date | null;
  createdAt: Date;
  updatedAt: Date;
  deletedAt: Date | null;
}

export interface DelegatedTaskFile {
  id: string;
  taskId: string;
  kind: DelegationFileKind;
  fileName: string;
  fileUrl: string;
  uploadedBy: string;
  uploadedAt: Date;
}

export interface DelegatedTaskWithContext extends DelegatedTask {
  assignedByName: string;
  assignedToName: string;
  escalatedToName: string | null;
  files: DelegatedTaskFile[];
}

export function computeDelegationDisplayStatus(task: Pick<DelegatedTask, "baseStatus" | "dueDate">): DelegationDisplayStatus {
  if (task.baseStatus === "completed") return "completed";
  if (new Date(task.dueDate) < new Date(new Date().toDateString())) return "delayed";
  return task.baseStatus;
}
