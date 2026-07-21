import { Complaint, ComplaintPriority, ComplaintRecord, ComplaintStatus } from "../entities/Complaint";

export interface ListComplaintsParams {
  search?: string;
  status?: ComplaintStatus;
  priority?: ComplaintPriority;
  buyerId?: string;
  assignedTo?: string;
}

export interface IComplaintRepository {
  create(complaint: Omit<Complaint, "id" | "createdAt" | "updatedAt" | "deletedAt">): Promise<ComplaintRecord>;
  findById(id: string): Promise<ComplaintRecord | null>;
  list(params: ListComplaintsParams): Promise<{ items: ComplaintRecord[]; total: number }>;
  update(id: string, changes: Partial<Omit<Complaint, "id" | "createdAt" | "updatedAt" | "deletedAt">>): Promise<ComplaintRecord>;
  remove(id: string): Promise<void>;
  generateComplaintNumber(): Promise<string>;
}
