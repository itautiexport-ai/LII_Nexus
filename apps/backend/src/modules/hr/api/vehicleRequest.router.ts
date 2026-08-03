import { Router } from "express";
import { VehicleRequestController } from "../application/controllers/VehicleRequestController";

export const vehicleRequestRouter = Router();

// Vehicle Requests & Planning
vehicleRequestRouter.get("/requests", VehicleRequestController.getAll);
vehicleRequestRouter.post("/requests", VehicleRequestController.create);
vehicleRequestRouter.patch("/requests/:id/planning", VehicleRequestController.updatePlanning);
vehicleRequestRouter.patch("/requests/:id/status", VehicleRequestController.updateStatus);
vehicleRequestRouter.delete("/requests/:id", VehicleRequestController.delete);

// Driver Route Planning
vehicleRequestRouter.get("/routes", VehicleRequestController.getDriverRoutes);
vehicleRequestRouter.post("/routes", VehicleRequestController.createDriverRoute);
vehicleRequestRouter.patch("/routes/:id/status", VehicleRequestController.updateDriverRouteStatus);
vehicleRequestRouter.delete("/routes/:id", VehicleRequestController.deleteDriverRoute);
