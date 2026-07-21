import { v4 as uuidv4 } from "uuid";
import { MySqlHelpTicketRepository } from "../../infrastructure/repositories/MySqlHelpTicketRepository";
import { CreateHelpTicketDto, UpdateHelpTicketStatusDto } from "../dto/helpTicket.dto";

const repo = new MySqlHelpTicketRepository();

export class HelpTicketService {
  async createTicket(dto: CreateHelpTicketDto, createdBy: string) {
    const ticket = {
      id: uuidv4(),
      subject: dto.subject,
      problemSolverId: dto.problemSolverId,
      problem: dto.problem,
      mediaUrl: dto.mediaUrl ?? null,
      priority: dto.priority,
      plannedDate: dto.plannedDate ?? null,
      attachmentMandatory: dto.attachmentMandatory ?? false,
      status: "Open" as const,
      createdBy,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    await repo.create(ticket);
    return ticket;
  }

  async getById(id: string) {
    return repo.findById(id);
  }

  async listAll() {
    return repo.listAll();
  }

  async listAssignedToMe(userId: string) {
    return repo.listAssignedToMe(userId);
  }

  async listAssignedByMe(userId: string) {
    return repo.listAssignedByMe(userId);
  }

  async updateStatus(id: string, dto: UpdateHelpTicketStatusDto) {
    await repo.updateStatus(id, dto.status);
    return repo.findById(id);
  }
}
