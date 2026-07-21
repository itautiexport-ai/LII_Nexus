"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.MachineEfficiencyController = void 0;
const MachineEfficiencyService_1 = require("../../application/services/MachineEfficiencyService");
const machineEfficiency_dto_1 = require("../../application/dto/machineEfficiency.dto");
const service = new MachineEfficiencyService_1.MachineEfficiencyService();
class MachineEfficiencyController {
    // -- Targets --
    async createTarget(req, res) {
        const parsed = machineEfficiency_dto_1.createMachineTargetSchema.safeParse(req.body);
        if (!parsed.success) {
            return res.status(400).json({ error: parsed.error.flatten() });
        }
        try {
            const target = await service.createTarget(parsed.data);
            return res.status(201).json(target);
        }
        catch (e) {
            return res.status(400).json({ error: e.message });
        }
    }
    async updateTarget(req, res) {
        const parsed = machineEfficiency_dto_1.updateMachineTargetSchema.safeParse(req.body);
        if (!parsed.success) {
            return res.status(400).json({ error: parsed.error.flatten() });
        }
        try {
            const target = await service.updateTarget(req.params.id, parsed.data);
            return res.json(target);
        }
        catch (e) {
            return res.status(404).json({ error: e.message });
        }
    }
    async deleteTarget(req, res) {
        await service.deleteTarget(req.params.id);
        return res.status(204).send();
    }
    async listTargets(req, res) {
        const machineId = req.query.machineId;
        const targets = await service.listTargets(machineId);
        return res.json(targets);
    }
    async getTargetById(req, res) {
        const target = await service.getTargetById(req.params.id);
        if (!target)
            return res.status(404).json({ error: "Target not found" });
        return res.json(target);
    }
    // -- Entries --
    async createEntry(req, res) {
        const parsed = machineEfficiency_dto_1.createMachineEfficiencyEntrySchema.safeParse(req.body);
        if (!parsed.success) {
            return res.status(400).json({ error: parsed.error.flatten() });
        }
        const userId = req.user?.id;
        if (!userId)
            return res.status(401).json({ error: "Unauthorized" });
        try {
            const entry = await service.createEntry(parsed.data, userId);
            return res.status(201).json(entry);
        }
        catch (e) {
            return res.status(400).json({ error: e.message });
        }
    }
    async listEntries(_req, res) {
        const entries = await service.listEntries();
        return res.json(entries);
    }
    async getEntryById(req, res) {
        const entry = await service.getEntryById(req.params.id);
        if (!entry)
            return res.status(404).json({ error: "Entry not found" });
        return res.json(entry);
    }
}
exports.MachineEfficiencyController = MachineEfficiencyController;
//# sourceMappingURL=MachineEfficiencyController.js.map