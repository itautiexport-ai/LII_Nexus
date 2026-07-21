"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.HelpTicketController = void 0;
const HelpTicketService_1 = require("../../application/services/HelpTicketService");
const helpTicket_dto_1 = require("../../application/dto/helpTicket.dto");
const service = new HelpTicketService_1.HelpTicketService();
class HelpTicketController {
    async create(req, res) {
        const parsed = helpTicket_dto_1.CreateHelpTicketSchema.safeParse(req.body);
        if (!parsed.success) {
            return res.status(400).json({ error: parsed.error.flatten() });
        }
        const userId = req.user?.id;
        if (!userId)
            return res.status(401).json({ error: "Unauthorized" });
        const ticket = await service.createTicket(parsed.data, userId);
        return res.status(201).json(ticket);
    }
    async listAll(_req, res) {
        const tickets = await service.listAll();
        return res.json(tickets);
    }
    async listAssignedToMe(req, res) {
        const userId = req.user?.id;
        if (!userId)
            return res.status(401).json({ error: "Unauthorized" });
        const tickets = await service.listAssignedToMe(userId);
        return res.json(tickets);
    }
    async listAssignedByMe(req, res) {
        const userId = req.user?.id;
        if (!userId)
            return res.status(401).json({ error: "Unauthorized" });
        const tickets = await service.listAssignedByMe(userId);
        return res.json(tickets);
    }
    async getById(req, res) {
        const ticket = await service.getById(req.params.id);
        if (!ticket)
            return res.status(404).json({ error: "Ticket not found" });
        return res.json(ticket);
    }
    async updateStatus(req, res) {
        const parsed = helpTicket_dto_1.UpdateHelpTicketStatusSchema.safeParse(req.body);
        if (!parsed.success) {
            return res.status(400).json({ error: parsed.error.flatten() });
        }
        const ticket = await service.updateStatus(req.params.id, parsed.data);
        return res.json(ticket);
    }
}
exports.HelpTicketController = HelpTicketController;
//# sourceMappingURL=HelpTicketController.js.map