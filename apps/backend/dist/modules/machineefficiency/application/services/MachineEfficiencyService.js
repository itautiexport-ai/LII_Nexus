"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.MachineEfficiencyService = void 0;
const uuid_1 = require("uuid");
const MySqlMachineEfficiencyRepository_1 = require("../../infrastructure/repositories/MySqlMachineEfficiencyRepository");
const repo = new MySqlMachineEfficiencyRepository_1.MySqlMachineEfficiencyRepository();
class MachineEfficiencyService {
    // -- Targets --
    async createTarget(dto) {
        const existing = await repo.getTargetByMachineAndSize(dto.machineId, dto.size);
        if (existing) {
            throw new Error(`Target for this machine and size already exists.`);
        }
        const target = {
            id: (0, uuid_1.v4)(),
            machineId: dto.machineId,
            size: dto.size,
            target: dto.target,
            uom: dto.uom,
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
        };
        await repo.createTarget(target);
        return target;
    }
    async updateTarget(id, dto) {
        const existing = await repo.getTargetById(id);
        if (!existing) {
            throw new Error("Target not found");
        }
        await repo.updateTarget(id, dto.target, dto.uom);
        return this.getTargetById(id);
    }
    async deleteTarget(id) {
        await repo.deleteTarget(id);
    }
    async listTargets(machineId) {
        return repo.listTargets(machineId);
    }
    async getTargetById(id) {
        return repo.getTargetById(id);
    }
    // -- Entries --
    async createEntry(dto, createdBy) {
        // Calculate efficiency = (Achieved / Target) * 100
        // Prevent division by zero if target is 0, though DTO validates target > 0.
        const efficiency = dto.target > 0 ? (dto.achieved / dto.target) * 100 : 0;
        const entry = {
            id: (0, uuid_1.v4)(),
            departmentId: dto.departmentId,
            machineId: dto.machineId,
            size: dto.size,
            target: dto.target,
            achieved: dto.achieved,
            manpowerCount: dto.manpowerCount,
            efficiency: Number(efficiency.toFixed(2)),
            createdBy,
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
        };
        await repo.createEntry(entry);
        return entry;
    }
    async listEntries() {
        return repo.listEntries();
    }
    async getEntryById(id) {
        return repo.getEntryById(id);
    }
}
exports.MachineEfficiencyService = MachineEfficiencyService;
//# sourceMappingURL=MachineEfficiencyService.js.map