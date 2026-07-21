import { DelegatedTask, DelegatedTaskWithContext, DelegationBaseStatus, DelegationFileKind, DelegationPriority } from "../entities/Delegation";

export interface CreateDelegatedTaskData {
  id: string;
  title: string;
  description?: string | null;
  assignedBy: string;
  assignedTo: string;
  dueDate: string;
  priority?: DelegationPriority;
  baseStatus?: DelegationBaseStatus;
  isAttachmentMandatory?: boolean;
  isNoteMandatory?: boolean;
  remarks?: string | null;
}

export interface UpdateDelegatedTaskData {
  title?: string;
  description?: string | null;
  dueDate?: string;
  priority?: DelegationPriority;
  isAttachmentMandatory?: boolean;
  isNoteMandatory?: boolean;
  remarks?: string | null;
}

export interface IDelegationRepository {
  list(params: { page: number; pageSize: number; assignedTo?: string; assignedBy?: string; status?: DelegationBaseStatus }): Promise<{ items: DelegatedTaskWithContext[]; total: number }>;
  findById(id: string): Promise<DelegatedTask | null>;
  getWithContext(id: string): Promise<DelegatedTaskWithContext | null>;
  create(data: CreateDelegatedTaskData): Promise<DelegatedTask>;
  update(id: string, changes: UpdateDelegatedTaskData): Promise<DelegatedTask>;
  updateStatus(id: string, status: "running" | "completed"): Promise<DelegatedTask>;
  escalate(id: string, escalateTo: string, notes: string | null): Promise<DelegatedTask>;
  softDelete(id: string): Promise<void>;
  addFile(taskId: string, kind: DelegationFileKind, fileName: string, fileUrl: string, uploadedBy: string): Promise<void>;

  listForEmployee(employeeId: string, params?: { from?: string; to?: string }): Promise<DelegatedTaskWithContext[]>;
  countCompletedAndTotalDue(employeeId: string, from: string, to: string): Promise<{ completed: number; total: number }>;
}
