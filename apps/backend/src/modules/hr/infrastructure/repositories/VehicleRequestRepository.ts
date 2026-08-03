import { pool } from "../../../../infrastructure/database/mysql/connection";
import { v4 as uuid } from "uuid";

export interface VehicleRequestRecord {
  id: string;
  requester_name: string;
  department: string | null;
  travel_date: string;
  travel_time: string | null;
  destination: string;
  purpose: string | null;
  passengers_count: number;
  vehicle_type: string;
  remarks: string | null;
  driver_name: string | null;
  assigned_vehicle: string | null;
  start_time: string | null;
  end_time: string | null;
  route_details: string | null;
  status: 'Pending' | 'Approved' | 'Rejected' | 'Completed';
  created_at: Date;
}

export interface DriverRouteRecord {
  id: string;
  driver_name: string;
  vehicle_name: string;
  route_name: string;
  waypoints: string | null;
  scheduled_date: string;
  start_time: string | null;
  end_time: string | null;
  status: 'Scheduled' | 'En Route' | 'Completed';
  created_at: Date;
}

export class VehicleRequestRepository {
  // Vehicle Requests
  async findAll(): Promise<VehicleRequestRecord[]> {
    const [rows] = await pool.query("SELECT * FROM hr_vehicle_requests ORDER BY created_at DESC");
    return rows as VehicleRequestRecord[];
  }

  async create(data: {
    requesterName: string;
    department?: string;
    travelDate: string;
    travelTime?: string;
    destination: string;
    purpose?: string;
    passengersCount?: number;
    vehicleType?: string;
    remarks?: string;
  }): Promise<VehicleRequestRecord> {
    const id = uuid();
    await pool.query(
      `INSERT INTO hr_vehicle_requests 
       (id, requester_name, department, travel_date, travel_time, destination, purpose, passengers_count, vehicle_type, remarks)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        id,
        data.requesterName,
        data.department || null,
        data.travelDate,
        data.travelTime || null,
        data.destination,
        data.purpose || null,
        data.passengersCount || 1,
        data.vehicleType || 'Car',
        data.remarks || null,
      ]
    );
    const [rows] = await pool.query("SELECT * FROM hr_vehicle_requests WHERE id = ?", [id]);
    return (rows as VehicleRequestRecord[])[0];
  }

  async updatePlanning(id: string, data: {
    driverName?: string;
    assignedVehicle?: string;
    startTime?: string;
    endTime?: string;
    routeDetails?: string;
    status?: 'Pending' | 'Approved' | 'Rejected' | 'Completed';
  }): Promise<VehicleRequestRecord | null> {
    await pool.query(
      `UPDATE hr_vehicle_requests 
       SET driver_name = ?, assigned_vehicle = ?, start_time = ?, end_time = ?, route_details = ?, status = COALESCE(?, status)
       WHERE id = ?`,
      [
        data.driverName || null,
        data.assignedVehicle || null,
        data.startTime || null,
        data.endTime || null,
        data.routeDetails || null,
        data.status || null,
        id,
      ]
    );
    const [rows] = await pool.query("SELECT * FROM hr_vehicle_requests WHERE id = ?", [id]);
    return (rows as VehicleRequestRecord[])[0] || null;
  }

  async updateStatus(id: string, status: 'Pending' | 'Approved' | 'Rejected' | 'Completed'): Promise<VehicleRequestRecord | null> {
    await pool.query("UPDATE hr_vehicle_requests SET status = ? WHERE id = ?", [status, id]);
    const [rows] = await pool.query("SELECT * FROM hr_vehicle_requests WHERE id = ?", [id]);
    return (rows as VehicleRequestRecord[])[0] || null;
  }

  async delete(id: string): Promise<void> {
    await pool.query("DELETE FROM hr_vehicle_requests WHERE id = ?", [id]);
  }

  // Driver Route Planning
  async findAllDriverRoutes(): Promise<DriverRouteRecord[]> {
    const [rows] = await pool.query("SELECT * FROM hr_driver_routes ORDER BY scheduled_date DESC, start_time ASC");
    return rows as DriverRouteRecord[];
  }

  async createDriverRoute(data: {
    driverName: string;
    vehicleName: string;
    routeName: string;
    waypoints?: string;
    scheduledDate: string;
    startTime?: string;
    endTime?: string;
    status?: 'Scheduled' | 'En Route' | 'Completed';
  }): Promise<DriverRouteRecord> {
    const id = uuid();
    await pool.query(
      `INSERT INTO hr_driver_routes
       (id, driver_name, vehicle_name, route_name, waypoints, scheduled_date, start_time, end_time, status)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        id,
        data.driverName,
        data.vehicleName,
        data.routeName,
        data.waypoints || null,
        data.scheduledDate,
        data.startTime || null,
        data.endTime || null,
        data.status || 'Scheduled',
      ]
    );
    const [rows] = await pool.query("SELECT * FROM hr_driver_routes WHERE id = ?", [id]);
    return (rows as DriverRouteRecord[])[0];
  }

  async updateDriverRouteStatus(id: string, status: 'Scheduled' | 'En Route' | 'Completed'): Promise<DriverRouteRecord | null> {
    await pool.query("UPDATE hr_driver_routes SET status = ? WHERE id = ?", [status, id]);
    const [rows] = await pool.query("SELECT * FROM hr_driver_routes WHERE id = ?", [id]);
    return (rows as DriverRouteRecord[])[0] || null;
  }

  async deleteDriverRoute(id: string): Promise<void> {
    await pool.query("DELETE FROM hr_driver_routes WHERE id = ?", [id]);
  }
}
