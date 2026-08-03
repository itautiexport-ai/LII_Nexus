import { axiosInstance as api } from "../../../services/api/axiosInstance";

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
  created_at: string;
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
  created_at: string;
}

export const vehicleRequestApi = {
  // Requests & HR Planning
  getRequests: async (): Promise<VehicleRequestRecord[]> => {
    const res = await api.get("/hr/vehicle-request/requests");
    return res.data.data;
  },
  createRequest: async (data: {
    requesterName: string;
    department?: string;
    travelDate: string;
    travelTime?: string;
    destination: string;
    purpose?: string;
    passengersCount?: number;
    vehicleType?: string;
    remarks?: string;
  }): Promise<VehicleRequestRecord> => {
    const res = await api.post("/hr/vehicle-request/requests", data);
    return res.data.data;
  },
  updatePlanning: async (id: string, data: {
    driverName?: string;
    assignedVehicle?: string;
    startTime?: string;
    endTime?: string;
    routeDetails?: string;
    status?: 'Pending' | 'Approved' | 'Rejected' | 'Completed';
  }): Promise<VehicleRequestRecord> => {
    const res = await api.patch(`/hr/vehicle-request/requests/${id}/planning`, data);
    return res.data.data;
  },
  updateStatus: async (id: string, status: 'Pending' | 'Approved' | 'Rejected' | 'Completed'): Promise<VehicleRequestRecord> => {
    const res = await api.patch(`/hr/vehicle-request/requests/${id}/status`, { status });
    return res.data.data;
  },
  deleteRequest: async (id: string): Promise<void> => {
    await api.delete(`/hr/vehicle-request/requests/${id}`);
  },

  // Driver Route Planning
  getDriverRoutes: async (): Promise<DriverRouteRecord[]> => {
    const res = await api.get("/hr/vehicle-request/routes");
    return res.data.data;
  },
  createDriverRoute: async (data: {
    driverName: string;
    vehicleName: string;
    routeName: string;
    waypoints?: string;
    scheduledDate: string;
    startTime?: string;
    endTime?: string;
    status?: 'Scheduled' | 'En Route' | 'Completed';
  }): Promise<DriverRouteRecord> => {
    const res = await api.post("/hr/vehicle-request/routes", data);
    return res.data.data;
  },
  updateDriverRouteStatus: async (id: string, status: 'Scheduled' | 'En Route' | 'Completed'): Promise<DriverRouteRecord> => {
    const res = await api.patch(`/hr/vehicle-request/routes/${id}/status`, { status });
    return res.data.data;
  },
  deleteDriverRoute: async (id: string): Promise<void> => {
    await api.delete(`/hr/vehicle-request/routes/${id}`);
  },
};
