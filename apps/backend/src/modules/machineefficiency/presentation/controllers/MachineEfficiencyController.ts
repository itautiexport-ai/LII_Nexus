import { Request, Response } from "express";
import { MachineEfficiencyService } from "../../application/services/MachineEfficiencyService";
import { createMachineTargetSchema, updateMachineTargetSchema, createMachineEfficiencyEntrySchema } from "../../application/dto/machineEfficiency.dto";

const service = new MachineEfficiencyService();

export class MachineEfficiencyController {
  
  // -- Targets --

  async createTarget(req: Request, res: Response) {
    const parsed = createMachineTargetSchema.safeParse(req.body);
    if (!parsed.success) {
      return res.status(400).json({ error: parsed.error.flatten() });
    }
    try {
      const target = await service.createTarget(parsed.data);
      return res.status(201).json(target);
    } catch (e: any) {
      return res.status(400).json({ error: e.message });
    }
  }

  async updateTarget(req: Request, res: Response) {
    const parsed = updateMachineTargetSchema.safeParse(req.body);
    if (!parsed.success) {
      return res.status(400).json({ error: parsed.error.flatten() });
    }
    try {
      const target = await service.updateTarget(req.params.id, parsed.data);
      return res.json(target);
    } catch (e: any) {
      return res.status(404).json({ error: e.message });
    }
  }

  async deleteTarget(req: Request, res: Response) {
    await service.deleteTarget(req.params.id);
    return res.status(204).send();
  }

  async listTargets(req: Request, res: Response) {
    const machineId = req.query.machineId as string | undefined;
    const targets = await service.listTargets(machineId);
    return res.json(targets);
  }

  async getTargetById(req: Request, res: Response) {
    const target = await service.getTargetById(req.params.id);
    if (!target) return res.status(404).json({ error: "Target not found" });
    return res.json(target);
  }

  // -- Entries --

  async createEntry(req: Request, res: Response) {
    const parsed = createMachineEfficiencyEntrySchema.safeParse(req.body);
    if (!parsed.success) {
      return res.status(400).json({ error: parsed.error.flatten() });
    }
    const userId = (req as any).user?.id;
    if (!userId) return res.status(401).json({ error: "Unauthorized" });

    try {
      const entry = await service.createEntry(parsed.data, userId);
      return res.status(201).json(entry);
    } catch (e: any) {
      return res.status(400).json({ error: e.message });
    }
  }

  async listEntries(_req: Request, res: Response) {
    const entries = await service.listEntries();
    return res.json(entries);
  }

  async getEntryById(req: Request, res: Response) {
    const entry = await service.getEntryById(req.params.id);
    if (!entry) return res.status(404).json({ error: "Entry not found" });
    return res.json(entry);
  }
}
