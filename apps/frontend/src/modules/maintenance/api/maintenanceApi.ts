import { axiosInstance as api } from "../../../services/api/axiosInstance";

export interface EquipmentRecord {
  id: string;
  equipment_code: string; // Machine ID
  asset_number: string | null;
  name: string; // Machine Name
  category: string;
  machine_type: string | null;
  department_name: string | null;
  location: string | null;
  manufacturer: string | null;
  model: string | null;
  status: 'Operational' | 'Under Maintenance' | 'Breakdown' | 'Decommissioned';
  serial_number: string | null;
  installation_date: string | null;
  purchase_date: string | null;
  last_maintenance_date: string | null;
  next_maintenance_date: string | null;
  warranty_expiry: string | null;
  power_rating: string | null;
  capacity: string | null;
  plc_details: string | null;
  operating_manual: string | null;
  sop_attachment: string | null;
  machine_images: string | null;
  qr_code: string | null;
  created_at: string;
}

export interface WorkOrderRecord {
  id: string;
  work_order_no: string;
  equipment_id: string | null;
  equipment_name: string;
  title: string;
  description: string | null;
  type: 'Breakdown' | 'Preventive' | 'Corrective' | 'Predictive';
  priority: 'Low' | 'Medium' | 'High' | 'Critical';
  status: 'Open' | 'In Progress' | 'On Hold' | 'Completed' | 'Cancelled';
  requested_by: string | null;
  assigned_to: string | null;
  reported_date: string;
  scheduled_date: string | null;
  completed_date: string | null;
  downtime_minutes: number;
  cost: number;
  resolution_notes: string | null;
  maintenance_frequency?: string;
  maintenance_interval_days?: number;
  next_maintenance_due?: string | null;
  created_at: string;
}

export interface PreventiveScheduleRecord {
  id: string;
  schedule_no: string;
  equipment_id: string | null;
  equipment_name: string;
  task_title: string;
  frequency: 'Daily' | 'Weekly' | 'Monthly' | 'Quarterly' | 'Annual';
  last_performed_date: string | null;
  next_due_date: string;
  assigned_team: string | null;
  status: 'Active' | 'Inactive' | 'Overdue';
  checklist_summary: string | null;
  created_at: string;
}

export interface BreakdownLogRecord {
  id: string;
  breakdown_no: string;
  equipment_id: string | null;
  equipment_name: string;
  breakdown_date: string;
  resolved_date: string | null;
  downtime_hours: number;
  root_cause: string | null;
  corrective_action: string | null;
  logged_by: string | null;
  status: 'Active' | 'Resolved';
  created_at: string;
}

export interface SparePartRecord {
  id: string;
  part_code: string;
  name: string;
  category: string;
  quantity: number;
  min_threshold: number;
  unit_cost: number;
  location: string | null;
  created_at: string;
}

export interface AmcContractRecord {
  id: string;
  contract_no: string;
  vendor_name: string;
  vendor_contact: string | null;
  equipment_id: string | null;
  equipment_name: string;
  contract_value: number;
  start_date: string;
  end_date: string;
  visit_schedule: string;
  documents_url: string | null;
  renewal_reminder_days: number;
  status: 'Active' | 'Expiring Soon' | 'Expired' | 'Terminated';
  notes: string | null;
  created_at: string;
}

export interface ChecklistSparePartItem {
  part_name: string;
  quantity: string | number;
  remarks?: string;
}

export interface MechanicalChecks {
  clean_machine?: boolean;
  check_belts?: boolean;
  tighten_bolts?: boolean;
  lubricate_moving_parts?: boolean;
}

export interface ElectricalChecks {
  check_wiring?: boolean;
  check_emergency_stop?: boolean;
  check_sensors?: boolean;
}

export interface SafetyChecks {
  safety_guards_in_place?: boolean;
  emergency_stop_working?: boolean;
  work_area_cleaned?: boolean;
}

export interface GeneralChecks {
  machine_test_run_completed?: boolean;
  no_abnormal_noise?: boolean;
  machine_handed_over_to_production?: boolean;
}

export interface MaintenanceChecklistRecord {
  id: string;
  checklist_no: string;
  filled_by_name: string;
  technician_name: string | null;
  equipment_id: string | null;
  equipment_name: string;
  department_name: string | null;
  due_date: string;
  mechanical_checks: MechanicalChecks;
  electrical_checks: ElectricalChecks;
  safety_checks: SafetyChecks;
  general_checks: GeneralChecks;
  spare_parts_used: ChecklistSparePartItem[];
  start_time: string | null;
  end_time: string | null;
  work_completed: string | null;
  issues_found: string | null;
  technician_remarks: string | null;
  photo_before_url: string | null;
  photo_after_url: string | null;
  supervisor_name: string | null;
  approval_status: 'Pending' | 'Approved' | 'Rejected';
  approval_remarks: string | null;
  approval_date: string | null;
  status: 'Scheduled' | 'In Progress' | 'Completed' | 'Overdue' | 'Cancelled';
  created_at: string;
}

export interface ChecklistDashboardStats {
  todays_pm_tasks: number;
  overdue_pms: number;
  completed_this_month: number;
  upcoming_pms_next_7_days: number;
}

export interface MaintenanceDashboardStats {
  workOrders: {
    total_work_orders: number;
    active_work_orders: number;
    completed_work_orders: number;
    total_downtime_minutes: number;
  };
  equipment: {
    total_equipment: number;
    operational_count: number;
    under_maintenance_count: number;
    breakdown_count: number;
  };
  preventive: {
    total_schedules: number;
    overdue_schedules: number;
  };
  spareParts: {
    total_parts: number;
    low_stock_parts: number;
  };
}

export const maintenanceApi = {
  // Stats
  getStats: async (): Promise<MaintenanceDashboardStats> => {
    const res = await api.get("/maintenance/stats");
    return res.data.data;
  },

  // Equipment / Machine Details
  getEquipment: async (): Promise<EquipmentRecord[]> => {
    const res = await api.get("/maintenance/equipment");
    return res.data.data;
  },
  createEquipment: async (data: Partial<EquipmentRecord>): Promise<EquipmentRecord> => {
    const res = await api.post("/maintenance/equipment", data);
    return res.data.data;
  },
  updateEquipment: async (id: string, data: Partial<EquipmentRecord>): Promise<EquipmentRecord> => {
    const res = await api.put(`/maintenance/equipment/${id}`, data);
    return res.data.data;
  },
  deleteEquipment: async (id: string): Promise<void> => {
    await api.delete(`/maintenance/equipment/${id}`);
  },

  // Work Orders
  getWorkOrders: async (): Promise<WorkOrderRecord[]> => {
    const res = await api.get("/maintenance/work-orders");
    return res.data.data;
  },
  createWorkOrder: async (data: Partial<WorkOrderRecord>): Promise<WorkOrderRecord> => {
    const res = await api.post("/maintenance/work-orders", data);
    return res.data.data;
  },
  updateWorkOrder: async (id: string, data: Partial<WorkOrderRecord>): Promise<WorkOrderRecord> => {
    const res = await api.put(`/maintenance/work-orders/${id}`, data);
    return res.data.data;
  },
  deleteWorkOrder: async (id: string): Promise<void> => {
    await api.delete(`/maintenance/work-orders/${id}`);
  },

  // Preventive Maintenance
  getPreventiveSchedules: async (): Promise<PreventiveScheduleRecord[]> => {
    const res = await api.get("/maintenance/preventive");
    return res.data.data;
  },
  createPreventiveSchedule: async (data: Partial<PreventiveScheduleRecord>): Promise<PreventiveScheduleRecord> => {
    const res = await api.post("/maintenance/preventive", data);
    return res.data.data;
  },
  updatePreventiveSchedule: async (id: string, data: Partial<PreventiveScheduleRecord>): Promise<PreventiveScheduleRecord> => {
    const res = await api.put(`/maintenance/preventive/${id}`, data);
    return res.data.data;
  },
  deletePreventiveSchedule: async (id: string): Promise<void> => {
    await api.delete(`/maintenance/preventive/${id}`);
  },

  // Breakdown Logs
  getBreakdownLogs: async (): Promise<BreakdownLogRecord[]> => {
    const res = await api.get("/maintenance/breakdowns");
    return res.data.data;
  },
  createBreakdownLog: async (data: Partial<BreakdownLogRecord>): Promise<BreakdownLogRecord> => {
    const res = await api.post("/maintenance/breakdowns", data);
    return res.data.data;
  },
  updateBreakdownLog: async (id: string, data: Partial<BreakdownLogRecord>): Promise<BreakdownLogRecord> => {
    const res = await api.put(`/maintenance/breakdowns/${id}`, data);
    return res.data.data;
  },
  deleteBreakdownLog: async (id: string): Promise<void> => {
    await api.delete(`/maintenance/breakdowns/${id}`);
  },

  // Spare Parts
  getSpareParts: async (): Promise<SparePartRecord[]> => {
    const res = await api.get("/maintenance/spare-parts");
    return res.data.data;
  },
  createSparePart: async (data: Partial<SparePartRecord>): Promise<SparePartRecord> => {
    const res = await api.post("/maintenance/spare-parts", data);
    return res.data.data;
  },
  updateSparePart: async (id: string, data: Partial<SparePartRecord>): Promise<SparePartRecord> => {
    const res = await api.put(`/maintenance/spare-parts/${id}`, data);
    return res.data.data;
  },
  deleteSparePart: async (id: string): Promise<void> => {
    await api.delete(`/maintenance/spare-parts/${id}`);
  },

  // AMC Contracts
  getAmcContracts: async (): Promise<AmcContractRecord[]> => {
    const res = await api.get("/maintenance/amc");
    return res.data.data;
  },
  createAmcContract: async (data: Partial<AmcContractRecord>): Promise<AmcContractRecord> => {
    const res = await api.post("/maintenance/amc", data);
    return res.data.data;
  },
  updateAmcContract: async (id: string, data: Partial<AmcContractRecord>): Promise<AmcContractRecord> => {
    const res = await api.put(`/maintenance/amc/${id}`, data);
    return res.data.data;
  },
  deleteAmcContract: async (id: string): Promise<void> => {
    await api.delete(`/maintenance/amc/${id}`);
  },

  // Maintenance Checklists
  getChecklists: async (): Promise<MaintenanceChecklistRecord[]> => {
    const res = await api.get("/maintenance/checklists");
    return res.data.data;
  },
  getChecklistStats: async (): Promise<ChecklistDashboardStats> => {
    const res = await api.get("/maintenance/checklists/stats");
    return res.data.data;
  },
  createChecklist: async (data: Partial<MaintenanceChecklistRecord>): Promise<MaintenanceChecklistRecord> => {
    const res = await api.post("/maintenance/checklists", data);
    return res.data.data;
  },
  updateChecklist: async (id: string, data: Partial<MaintenanceChecklistRecord>): Promise<MaintenanceChecklistRecord> => {
    const res = await api.put(`/maintenance/checklists/${id}`, data);
    return res.data.data;
  },
  deleteChecklist: async (id: string): Promise<void> => {
    await api.delete(`/maintenance/checklists/${id}`);
  }
};
