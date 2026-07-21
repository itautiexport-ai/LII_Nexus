import { v4 as uuidv4 } from "uuid";
import { MySqlMachineEfficiencyRepository } from "../../infrastructure/repositories/MySqlMachineEfficiencyRepository";
import { CreateMachineTargetDto, UpdateMachineTargetDto, CreateMachineEfficiencyEntryDto } from "../dto/machineEfficiency.dto";

const repo = new MySqlMachineEfficiencyRepository();

export class MachineEfficiencyService {
  
  // -- Targets --

  async createTarget(dto: CreateMachineTargetDto) {
    const existing = await repo.getTargetByMachineAndSize(dto.machineId, dto.size);
    if (existing) {
      throw new Error(`Target for this machine and size already exists.`);
    }

    const target = {
      id: uuidv4(),
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

  async updateTarget(id: string, dto: UpdateMachineTargetDto) {
    const existing = await repo.getTargetById(id);
    if (!existing) {
      throw new Error("Target not found");
    }
    await repo.updateTarget(id, dto.target, dto.uom);
    return this.getTargetById(id);
  }

  async deleteTarget(id: string) {
    await repo.deleteTarget(id);
  }

  async listTargets(machineId?: string) {
    return repo.listTargets(machineId);
  }

  async getTargetById(id: string) {
    return repo.getTargetById(id);
  }

  // -- Entries --

  async createEntry(dto: CreateMachineEfficiencyEntryDto, createdBy: string) {
    // Calculate efficiency = (Achieved / Target) * 100
    // Prevent division by zero if target is 0, though DTO validates target > 0.
    const efficiency = dto.target > 0 ? (dto.achieved / dto.target) * 100 : 0;

    const entry = {
      id: uuidv4(),
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

  async getEntryById(id: string) {
    return repo.getEntryById(id);
  }
}
