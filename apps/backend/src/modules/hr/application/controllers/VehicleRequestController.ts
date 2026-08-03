import { Request, Response } from "express";
import { VehicleRequestRepository } from "../../infrastructure/repositories/VehicleRequestRepository";

const repo = new VehicleRequestRepository();

export class VehicleRequestController {
  // Vehicle Requests
  static async getAll(_req: Request, res: Response) {
    try {
      const records = await repo.findAll();
      res.json({ success: true, data: records });
    } catch (err: any) {
      res.status(500).json({ success: false, error: err.message });
    }
  }

  static async create(req: Request, res: Response) {
    try {
      const { requesterName, department, travelDate, travelTime, destination, purpose, passengersCount, vehicleType, remarks } = req.body;
      if (!requesterName || !travelDate || !destination) {
        return res.status(400).json({ success: false, error: "Requester name, travel date, and destination are required." });
      }

      const record = await repo.create({
        requesterName,
        department,
        travelDate,
        travelTime,
        destination,
        purpose,
        passengersCount: passengersCount ? Number(passengersCount) : 1,
        vehicleType,
        remarks,
      });

      res.status(201).json({ success: true, data: record });
    } catch (err: any) {
      res.status(500).json({ success: false, error: err.message });
    }
  }

  static async updatePlanning(req: Request, res: Response) {
    try {
      const { id } = req.params;
      const { driverName, assignedVehicle, startTime, endTime, routeDetails, status } = req.body;
      const record = await repo.updatePlanning(id, {
        driverName,
        assignedVehicle,
        startTime,
        endTime,
        routeDetails,
        status,
      });
      res.json({ success: true, data: record });
    } catch (err: any) {
      res.status(500).json({ success: false, error: err.message });
    }
  }

  static async updateStatus(req: Request, res: Response) {
    try {
      const { id } = req.params;
      const { status } = req.body;
      if (!status) return res.status(400).json({ success: false, error: "Status is required." });
      const record = await repo.updateStatus(id, status);
      res.json({ success: true, data: record });
    } catch (err: any) {
      res.status(500).json({ success: false, error: err.message });
    }
  }

  static async delete(req: Request, res: Response) {
    try {
      const { id } = req.params;
      await repo.delete(id);
      res.json({ success: true });
    } catch (err: any) {
      res.status(500).json({ success: false, error: err.message });
    }
  }

  // Driver Route Planning
  static async getDriverRoutes(_req: Request, res: Response) {
    try {
      const records = await repo.findAllDriverRoutes();
      res.json({ success: true, data: records });
    } catch (err: any) {
      res.status(500).json({ success: false, error: err.message });
    }
  }

  static async createDriverRoute(req: Request, res: Response) {
    try {
      const { driverName, vehicleName, routeName, waypoints, scheduledDate, startTime, endTime, status } = req.body;
      if (!driverName || !vehicleName || !routeName || !scheduledDate) {
        return res.status(400).json({ success: false, error: "Driver name, vehicle name, route name, and scheduled date are required." });
      }

      const record = await repo.createDriverRoute({
        driverName,
        vehicleName,
        routeName,
        waypoints,
        scheduledDate,
        startTime,
        endTime,
        status,
      });

      res.status(201).json({ success: true, data: record });
    } catch (err: any) {
      res.status(500).json({ success: false, error: err.message });
    }
  }

  static async updateDriverRouteStatus(req: Request, res: Response) {
    try {
      const { id } = req.params;
      const { status } = req.body;
      if (!status) return res.status(400).json({ success: false, error: "Status is required." });
      const record = await repo.updateDriverRouteStatus(id, status);
      res.json({ success: true, data: record });
    } catch (err: any) {
      res.status(500).json({ success: false, error: err.message });
    }
  }

  static async deleteDriverRoute(req: Request, res: Response) {
    try {
      const { id } = req.params;
      await repo.deleteDriverRoute(id);
      res.json({ success: true });
    } catch (err: any) {
      res.status(500).json({ success: false, error: err.message });
    }
  }
}
