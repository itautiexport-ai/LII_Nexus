"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.HelpTicketService = void 0;
const uuid_1 = require("uuid");
const MySqlHelpTicketRepository_1 = require("../../infrastructure/repositories/MySqlHelpTicketRepository");
const repo = new MySqlHelpTicketRepository_1.MySqlHelpTicketRepository();
class HelpTicketService {
    async createTicket(dto, createdBy) {
        const ticket = {
            id: (0, uuid_1.v4)(),
            subject: dto.subject,
            problemSolverId: dto.problemSolverId,
            problem: dto.problem,
            mediaUrl: dto.mediaUrl ?? null,
            priority: dto.priority,
            plannedDate: dto.plannedDate ?? null,
            attachmentMandatory: dto.attachmentMandatory ?? false,
            status: "Open",
            createdBy,
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
        };
        await repo.create(ticket);
        return ticket;
    }
    async getById(id) {
        return repo.findById(id);
    }
    async listAll() {
        return repo.listAll();
    }
    async listAssignedToMe(userId) {
        return repo.listAssignedToMe(userId);
    }
    async listAssignedByMe(userId) {
        return repo.listAssignedByMe(userId);
    }
    async updateStatus(id, dto) {
        await repo.updateStatus(id, dto.status);
        return repo.findById(id);
    }
}
exports.HelpTicketService = HelpTicketService;
//# sourceMappingURL=HelpTicketService.js.map