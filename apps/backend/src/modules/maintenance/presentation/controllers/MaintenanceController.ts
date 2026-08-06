import { Request, Response } from "express";
import { MaintenanceRepository } from "../../infrastructure/repositories/MaintenanceRepository";

const repository = new MaintenanceRepository();

export class MaintenanceController {
  // Stats
  async getDashboardStats(req: Request, res: Response): Promise<void> {
    try {
      const stats = await repository.getDashboardStats();
      res.json({ success: true, data: stats });
    } catch (error: any) {
      res.status(500).json({ success: false, message: error.message || "Failed to fetch dashboard stats" });
    }
  }

  // Equipment
  async getEquipment(req: Request, res: Response): Promise<void> {
    try {
      const equipment = await repository.getAllEquipment();
      res.json({ success: true, data: equipment });
    } catch (error: any) {
      res.status(500).json({ success: false, message: error.message || "Failed to fetch equipment" });
    }
  }

  async createEquipment(req: Request, res: Response): Promise<void> {
    try {
      const equipment = await repository.createEquipment(req.body);
      res.status(201).json({ success: true, data: equipment });
    } catch (error: any) {
      res.status(400).json({ success: false, message: error.message || "Failed to create equipment" });
    }
  }

  async updateEquipment(req: Request, res: Response): Promise<void> {
    try {
      const { id } = req.params;
      const updated = await repository.updateEquipment(id, req.body);
      if (!updated) {
        res.status(404).json({ success: false, message: "Equipment not found" });
        return;
      }
      res.json({ success: true, data: updated });
    } catch (error: any) {
      res.status(400).json({ success: false, message: error.message || "Failed to update equipment" });
    }
  }

  async deleteEquipment(req: Request, res: Response): Promise<void> {
    try {
      const { id } = req.params;
      const deleted = await repository.deleteEquipment(id);
      if (!deleted) {
        res.status(404).json({ success: false, message: "Equipment not found" });
        return;
      }
      res.json({ success: true, message: "Equipment deleted successfully" });
    } catch (error: any) {
      res.status(500).json({ success: false, message: error.message || "Failed to delete equipment" });
    }
  }

  // Work Orders
  async getWorkOrders(req: Request, res: Response): Promise<void> {
    try {
      const workOrders = await repository.getAllWorkOrders();
      res.json({ success: true, data: workOrders });
    } catch (error: any) {
      res.status(500).json({ success: false, message: error.message || "Failed to fetch work orders" });
    }
  }

  async createWorkOrder(req: Request, res: Response): Promise<void> {
    try {
      const user = (req as any).user;
      const workOrder = await repository.createWorkOrder({
        ...req.body,
        requested_by: req.body.requested_by || user?.name || user?.email || 'System'
      });
      res.status(201).json({ success: true, data: workOrder });
    } catch (error: any) {
      res.status(400).json({ success: false, message: error.message || "Failed to create work order" });
    }
  }

  async updateWorkOrder(req: Request, res: Response): Promise<void> {
    try {
      const { id } = req.params;
      const updated = await repository.updateWorkOrder(id, req.body);
      if (!updated) {
        res.status(404).json({ success: false, message: "Work Order not found" });
        return;
      }
      res.json({ success: true, data: updated });
    } catch (error: any) {
      res.status(400).json({ success: false, message: error.message || "Failed to update work order" });
    }
  }

  async deleteWorkOrder(req: Request, res: Response): Promise<void> {
    try {
      const { id } = req.params;
      const deleted = await repository.deleteWorkOrder(id);
      if (!deleted) {
        res.status(404).json({ success: false, message: "Work Order not found" });
        return;
      }
      res.json({ success: true, message: "Work Order deleted successfully" });
    } catch (error: any) {
      res.status(500).json({ success: false, message: error.message || "Failed to delete work order" });
    }
  }

  // Preventive Maintenance
  async getPreventiveSchedules(req: Request, res: Response): Promise<void> {
    try {
      const schedules = await repository.getAllPreventiveSchedules();
      res.json({ success: true, data: schedules });
    } catch (error: any) {
      res.status(500).json({ success: false, message: error.message || "Failed to fetch preventive schedules" });
    }
  }

  async createPreventiveSchedule(req: Request, res: Response): Promise<void> {
    try {
      const schedule = await repository.createPreventiveSchedule(req.body);
      res.status(201).json({ success: true, data: schedule });
    } catch (error: any) {
      res.status(400).json({ success: false, message: error.message || "Failed to create preventive schedule" });
    }
  }

  async updatePreventiveSchedule(req: Request, res: Response): Promise<void> {
    try {
      const { id } = req.params;
      const updated = await repository.updatePreventiveSchedule(id, req.body);
      if (!updated) {
        res.status(404).json({ success: false, message: "Preventive Schedule not found" });
        return;
      }
      res.json({ success: true, data: updated });
    } catch (error: any) {
      res.status(400).json({ success: false, message: error.message || "Failed to update preventive schedule" });
    }
  }

  async deletePreventiveSchedule(req: Request, res: Response): Promise<void> {
    try {
      const { id } = req.params;
      const deleted = await repository.deletePreventiveSchedule(id);
      if (!deleted) {
        res.status(404).json({ success: false, message: "Preventive schedule not found" });
        return;
      }
      res.json({ success: true, message: "Preventive schedule deleted successfully" });
    } catch (error: any) {
      res.status(500).json({ success: false, message: error.message || "Failed to delete preventive schedule" });
    }
  }

  // Breakdown Logs
  async getBreakdownLogs(req: Request, res: Response): Promise<void> {
    try {
      const logs = await repository.getAllBreakdownLogs();
      res.json({ success: true, data: logs });
    } catch (error: any) {
      res.status(500).json({ success: false, message: error.message || "Failed to fetch breakdown logs" });
    }
  }

  async createBreakdownLog(req: Request, res: Response): Promise<void> {
    try {
      const user = (req as any).user;
      const log = await repository.createBreakdownLog({
        ...req.body,
        logged_by: req.body.logged_by || user?.name || user?.email || 'System'
      });
      res.status(201).json({ success: true, data: log });
    } catch (error: any) {
      res.status(400).json({ success: false, message: error.message || "Failed to log breakdown" });
    }
  }

  async updateBreakdownLog(req: Request, res: Response): Promise<void> {
    try {
      const { id } = req.params;
      const updated = await repository.updateBreakdownLog(id, req.body);
      if (!updated) {
        res.status(404).json({ success: false, message: "Breakdown log not found" });
        return;
      }
      res.json({ success: true, data: updated });
    } catch (error: any) {
      res.status(400).json({ success: false, message: error.message || "Failed to update breakdown log" });
    }
  }

  async deleteBreakdownLog(req: Request, res: Response): Promise<void> {
    try {
      const { id } = req.params;
      const deleted = await repository.deleteBreakdownLog(id);
      if (!deleted) {
        res.status(404).json({ success: false, message: "Breakdown log not found" });
        return;
      }
      res.json({ success: true, message: "Breakdown log deleted successfully" });
    } catch (error: any) {
      res.status(500).json({ success: false, message: error.message || "Failed to delete breakdown log" });
    }
  }

  // Spare Parts
  async getSpareParts(req: Request, res: Response): Promise<void> {
    try {
      const parts = await repository.getAllSpareParts();
      res.json({ success: true, data: parts });
    } catch (error: any) {
      res.status(500).json({ success: false, message: error.message || "Failed to fetch spare parts" });
    }
  }

  async createSparePart(req: Request, res: Response): Promise<void> {
    try {
      const part = await repository.createSparePart(req.body);
      res.status(201).json({ success: true, data: part });
    } catch (error: any) {
      res.status(400).json({ success: false, message: error.message || "Failed to create spare part" });
    }
  }

  async updateSparePart(req: Request, res: Response): Promise<void> {
    try {
      const { id } = req.params;
      const updated = await repository.updateSparePart(id, req.body);
      if (!updated) {
        res.status(404).json({ success: false, message: "Spare part not found" });
        return;
      }
      res.json({ success: true, data: updated });
    } catch (error: any) {
      res.status(400).json({ success: false, message: error.message || "Failed to update spare part" });
    }
  }

  async deleteSparePart(req: Request, res: Response): Promise<void> {
    try {
      const { id } = req.params;
      const deleted = await repository.deleteSparePart(id);
      if (!deleted) {
        res.status(404).json({ success: false, message: "Spare part not found" });
        return;
      }
      res.json({ success: true, message: "Spare part deleted successfully" });
    } catch (error: any) {
      res.status(500).json({ success: false, message: error.message || "Failed to delete spare part" });
    }
  }

  // AMC Contracts
  async getAmcContracts(req: Request, res: Response): Promise<void> {
    try {
      const contracts = await repository.getAllAmcContracts();
      res.json({ success: true, data: contracts });
    } catch (error: any) {
      res.status(500).json({ success: false, message: error.message || "Failed to fetch AMC contracts" });
    }
  }

  async createAmcContract(req: Request, res: Response): Promise<void> {
    try {
      const contract = await repository.createAmcContract(req.body);
      res.status(201).json({ success: true, data: contract });
    } catch (error: any) {
      res.status(400).json({ success: false, message: error.message || "Failed to create AMC contract" });
    }
  }

  async updateAmcContract(req: Request, res: Response): Promise<void> {
    try {
      const { id } = req.params;
      const updated = await repository.updateAmcContract(id, req.body);
      if (!updated) {
        res.status(404).json({ success: false, message: "AMC contract not found" });
        return;
      }
      res.json({ success: true, data: updated });
    } catch (error: any) {
      res.status(400).json({ success: false, message: error.message || "Failed to update AMC contract" });
    }
  }

  async deleteAmcContract(req: Request, res: Response): Promise<void> {
    try {
      const { id } = req.params;
      const deleted = await repository.deleteAmcContract(id);
      if (!deleted) {
        res.status(404).json({ success: false, message: "AMC contract not found" });
        return;
      }
      res.json({ success: true, message: "AMC contract deleted successfully" });
    } catch (error: any) {
      res.status(500).json({ success: false, message: error.message || "Failed to delete AMC contract" });
    }
  }

  // Maintenance Checklists
  async getChecklists(req: Request, res: Response): Promise<void> {
    try {
      const checklists = await repository.getAllChecklists();
      res.json({ success: true, data: checklists });
    } catch (error: any) {
      res.status(500).json({ success: false, message: error.message || "Failed to fetch maintenance checklists" });
    }
  }

  async getChecklistStats(req: Request, res: Response): Promise<void> {
    try {
      const stats = await repository.getChecklistStats();
      res.json({ success: true, data: stats });
    } catch (error: any) {
      res.status(500).json({ success: false, message: error.message || "Failed to fetch checklist stats" });
    }
  }

  async createChecklist(req: Request, res: Response): Promise<void> {
    try {
      const user = (req as any).user;
      const checklist = await repository.createChecklist({
        ...req.body,
        filled_by_name: req.body.filled_by_name || user?.name || user?.email || 'Technician'
      });
      res.status(201).json({ success: true, data: checklist });
    } catch (error: any) {
      res.status(400).json({ success: false, message: error.message || "Failed to create maintenance checklist" });
    }
  }

  async updateChecklist(req: Request, res: Response): Promise<void> {
    try {
      const { id } = req.params;
      const updated = await repository.updateChecklist(id, req.body);
      if (!updated) {
        res.status(404).json({ success: false, message: "Maintenance checklist not found" });
        return;
      }
      res.json({ success: true, data: updated });
    } catch (error: any) {
      res.status(400).json({ success: false, message: error.message || "Failed to update maintenance checklist" });
    }
  }

  async deleteChecklist(req: Request, res: Response): Promise<void> {
    try {
      const { id } = req.params;
      const deleted = await repository.deleteChecklist(id);
      if (!deleted) {
        res.status(404).json({ success: false, message: "Maintenance checklist not found" });
        return;
      }
      res.json({ success: true, message: "Maintenance checklist deleted successfully" });
    } catch (error: any) {
      res.status(500).json({ success: false, message: error.message || "Failed to delete maintenance checklist" });
    }
  }
}
