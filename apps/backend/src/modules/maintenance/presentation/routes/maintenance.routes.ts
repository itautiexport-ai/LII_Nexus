import { Router } from "express";
import { MaintenanceController } from "../controllers/MaintenanceController";

const router = Router();
const controller = new MaintenanceController();

// Stats KPI endpoint
router.get("/stats", controller.getDashboardStats.bind(controller));

// Equipment
router.get("/equipment", controller.getEquipment.bind(controller));
router.post("/equipment", controller.createEquipment.bind(controller));
router.put("/equipment/:id", controller.updateEquipment.bind(controller));
router.delete("/equipment/:id", controller.deleteEquipment.bind(controller));

// Work Orders
router.get("/work-orders", controller.getWorkOrders.bind(controller));
router.post("/work-orders", controller.createWorkOrder.bind(controller));
router.put("/work-orders/:id", controller.updateWorkOrder.bind(controller));
router.delete("/work-orders/:id", controller.deleteWorkOrder.bind(controller));

// Preventive Maintenance
router.get("/preventive", controller.getPreventiveSchedules.bind(controller));
router.post("/preventive", controller.createPreventiveSchedule.bind(controller));
router.put("/preventive/:id", controller.updatePreventiveSchedule.bind(controller));
router.delete("/preventive/:id", controller.deletePreventiveSchedule.bind(controller));

// Breakdown Logs
router.get("/breakdowns", controller.getBreakdownLogs.bind(controller));
router.post("/breakdowns", controller.createBreakdownLog.bind(controller));
router.put("/breakdowns/:id", controller.updateBreakdownLog.bind(controller));
router.delete("/breakdowns/:id", controller.deleteBreakdownLog.bind(controller));

// Spare Parts
router.get("/spare-parts", controller.getSpareParts.bind(controller));
router.post("/spare-parts", controller.createSparePart.bind(controller));
router.put("/spare-parts/:id", controller.updateSparePart.bind(controller));
router.delete("/spare-parts/:id", controller.deleteSparePart.bind(controller));

// AMC Contracts
router.get("/amc", controller.getAmcContracts.bind(controller));
router.post("/amc", controller.createAmcContract.bind(controller));
router.put("/amc/:id", controller.updateAmcContract.bind(controller));
router.delete("/amc/:id", controller.deleteAmcContract.bind(controller));

// Maintenance Checklists
router.get("/checklists", controller.getChecklists.bind(controller));
router.get("/checklists/stats", controller.getChecklistStats.bind(controller));
router.post("/checklists", controller.createChecklist.bind(controller));
router.put("/checklists/:id", controller.updateChecklist.bind(controller));
router.delete("/checklists/:id", controller.deleteChecklist.bind(controller));

export default router;
