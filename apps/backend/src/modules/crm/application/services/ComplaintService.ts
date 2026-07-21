import { Complaint, ComplaintPriority, ComplaintStatus } from "../../domain/entities/Complaint";
import { IComplaintRepository, ListComplaintsParams } from "../../domain/repositories/IComplaintRepository";

export class ComplaintService {
  constructor(private repo: IComplaintRepository) {}

  async create(input: Omit<Complaint, "id" | "createdAt" | "updatedAt" | "deletedAt" | "complaintNumber">) {
    const complaintNumber = await this.repo.generateComplaintNumber();
    return this.repo.create({
      complaintNumber,
      ...input
    });
  }

  async getById(id: string) {
    const complaint = await this.repo.findById(id);
    if (!complaint) throw new Error("Complaint not found");
    return complaint;
  }

  async list(params: ListComplaintsParams) {
    return this.repo.list(params);
  }

  async update(id: string, changes: Partial<Omit<Complaint, "id" | "createdAt" | "updatedAt" | "deletedAt" | "complaintNumber">>) {
    return this.repo.update(id, changes);
  }

  async delete(id: string) {
    await this.repo.remove(id);
  }
}
