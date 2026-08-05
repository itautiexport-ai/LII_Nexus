import { pool } from "../../../../infrastructure/database/mysql/connection";
import { v4 as uuid } from "uuid";

export interface EquipmentRecord {
  id: string;
  equipment_code: string;
  asset_number: string | null;
  name: string;
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
  created_at: Date;
  updated_at: Date;
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
  reported_date: Date;
  scheduled_date: string | null;
  completed_date: Date | null;
  downtime_minutes: number;
  cost: number;
  resolution_notes: string | null;
  maintenance_frequency?: string;
  maintenance_interval_days?: number;
  next_maintenance_due?: Date | string | null;
  created_at: Date;
  updated_at: Date;
}

export interface PreventiveScheduleRecord {
  id: string;
  schedule_no: string;
  equipment_id: string | null;
  equipment_name: string;
  task_title: string;
  frequency: 'Daily' | 'Weekly' | 'Monthly' | 'Quarterly' | 'Annual';
  last_performed_date: Date | null;
  next_due_date: Date;
  assigned_team: string | null;
  status: 'Active' | 'Inactive' | 'Overdue';
  checklist_summary: string | null;
  created_at: Date;
  updated_at: Date;
}

export interface BreakdownLogRecord {
  id: string;
  breakdown_no: string;
  equipment_id: string | null;
  equipment_name: string;
  breakdown_date: Date;
  resolved_date: Date | null;
  downtime_hours: number;
  root_cause: string | null;
  corrective_action: string | null;
  logged_by: string | null;
  status: 'Active' | 'Resolved';
  created_at: Date;
  updated_at: Date;
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
  created_at: Date;
  updated_at: Date;
}

export interface AmcContractRecord {
  id: string;
  contract_no: string;
  vendor_name: string;
  vendor_contact: string | null;
  equipment_id: string | null;
  equipment_name: string;
  contract_value: number;
  start_date: Date | string;
  end_date: Date | string;
  visit_schedule: string;
  documents_url: string | null;
  renewal_reminder_days: number;
  status: 'Active' | 'Expiring Soon' | 'Expired' | 'Terminated';
  notes: string | null;
  created_at: Date;
  updated_at: Date;
}

export interface MaintenanceChecklistRecord {
  id: string;
  checklist_no: string;
  filled_by_name: string;
  technician_name: string | null;
  equipment_id: string | null;
  equipment_name: string;
  department_name: string | null;
  due_date: Date | string;
  mechanical_checks: any;
  electrical_checks: any;
  safety_checks: any;
  general_checks: any;
  spare_parts_used: any;
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
  approval_date: Date | string | null;
  status: 'Scheduled' | 'In Progress' | 'Completed' | 'Overdue' | 'Cancelled';
  created_at: Date;
  updated_at: Date;
}

export class MaintenanceRepository {
  // Stats
  async getDashboardStats() {
    const [woStats]: any = await pool.query(`
      SELECT 
        COUNT(*) as total_work_orders,
        SUM(CASE WHEN status IN ('Open', 'In Progress', 'On Hold') THEN 1 ELSE 0 END) as active_work_orders,
        SUM(CASE WHEN status = 'Completed' THEN 1 ELSE 0 END) as completed_work_orders,
        SUM(downtime_minutes) as total_downtime_minutes
      FROM maintenance_work_orders
    `);
    const [eqStats]: any = await pool.query(`
      SELECT 
        COUNT(*) as total_equipment,
        SUM(CASE WHEN status = 'Operational' THEN 1 ELSE 0 END) as operational_count,
        SUM(CASE WHEN status = 'Under Maintenance' THEN 1 ELSE 0 END) as under_maintenance_count,
        SUM(CASE WHEN status = 'Breakdown' THEN 1 ELSE 0 END) as breakdown_count
      FROM maintenance_equipment
    `);
    const [pmStats]: any = await pool.query(`
      SELECT 
        COUNT(*) as total_schedules,
        SUM(CASE WHEN next_due_date < CURRENT_DATE AND status = 'Active' THEN 1 ELSE 0 END) as overdue_schedules
      FROM maintenance_preventive_schedules
    `);
    const [partStats]: any = await pool.query(`
      SELECT 
        COUNT(*) as total_parts,
        SUM(CASE WHEN quantity <= min_threshold THEN 1 ELSE 0 END) as low_stock_parts
      FROM maintenance_spare_parts
    `);

    return {
      workOrders: woStats[0],
      equipment: eqStats[0],
      preventive: pmStats[0],
      spareParts: partStats[0]
    };
  }

  // Equipment / Machine Details
  async getAllEquipment(): Promise<EquipmentRecord[]> {
    const [rows]: any = await pool.query(`SELECT * FROM maintenance_equipment ORDER BY created_at DESC`);
    return rows;
  }

  async getEquipmentById(id: string): Promise<EquipmentRecord | null> {
    const [rows]: any = await pool.query(`SELECT * FROM maintenance_equipment WHERE id = ?`, [id]);
    return rows[0] || null;
  }

  async createEquipment(data: Partial<EquipmentRecord>): Promise<EquipmentRecord> {
    const id = uuid();
    const qrCodeValue = data.qr_code || `QR-${data.equipment_code || id}`;
    await pool.query(
      `INSERT INTO maintenance_equipment (
        id, equipment_code, asset_number, name, category, machine_type, department_name, location,
        manufacturer, model, status, serial_number, installation_date, purchase_date,
        last_maintenance_date, next_maintenance_date, warranty_expiry, power_rating, capacity,
        plc_details, operating_manual, sop_attachment, machine_images, qr_code
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        id,
        data.equipment_code,
        data.asset_number || null,
        data.name,
        data.category || 'General',
        data.machine_type || null,
        data.department_name || null,
        data.location || null,
        data.manufacturer || null,
        data.model || null,
        data.status || 'Operational',
        data.serial_number || null,
        data.installation_date || null,
        data.purchase_date || null,
        data.last_maintenance_date || null,
        data.next_maintenance_date || null,
        data.warranty_expiry || null,
        data.power_rating || null,
        data.capacity || null,
        data.plc_details || null,
        data.operating_manual || null,
        data.sop_attachment || null,
        data.machine_images || null,
        qrCodeValue
      ]
    );
    const [rows]: any = await pool.query(`SELECT * FROM maintenance_equipment WHERE id = ?`, [id]);
    return rows[0];
  }

  async updateEquipment(id: string, data: Partial<EquipmentRecord>): Promise<EquipmentRecord | null> {
    await pool.query(
      `UPDATE maintenance_equipment SET 
        equipment_code = COALESCE(?, equipment_code),
        asset_number = COALESCE(?, asset_number),
        name = COALESCE(?, name),
        category = COALESCE(?, category),
        machine_type = COALESCE(?, machine_type),
        department_name = COALESCE(?, department_name),
        location = COALESCE(?, location),
        manufacturer = COALESCE(?, manufacturer),
        model = COALESCE(?, model),
        status = COALESCE(?, status),
        serial_number = COALESCE(?, serial_number),
        installation_date = COALESCE(?, installation_date),
        purchase_date = COALESCE(?, purchase_date),
        last_maintenance_date = COALESCE(?, last_maintenance_date),
        next_maintenance_date = COALESCE(?, next_maintenance_date),
        warranty_expiry = COALESCE(?, warranty_expiry),
        power_rating = COALESCE(?, power_rating),
        capacity = COALESCE(?, capacity),
        plc_details = COALESCE(?, plc_details),
        operating_manual = COALESCE(?, operating_manual),
        sop_attachment = COALESCE(?, sop_attachment),
        machine_images = COALESCE(?, machine_images),
        qr_code = COALESCE(?, qr_code)
       WHERE id = ?`,
      [
        data.equipment_code,
        data.asset_number,
        data.name,
        data.category,
        data.machine_type,
        data.department_name,
        data.location,
        data.manufacturer,
        data.model,
        data.status,
        data.serial_number,
        data.installation_date,
        data.purchase_date,
        data.last_maintenance_date,
        data.next_maintenance_date,
        data.warranty_expiry,
        data.power_rating,
        data.capacity,
        data.plc_details,
        data.operating_manual,
        data.sop_attachment,
        data.machine_images,
        data.qr_code,
        id
      ]
    );
    const [rows]: any = await pool.query(`SELECT * FROM maintenance_equipment WHERE id = ?`, [id]);
    return rows[0] || null;
  }

  async deleteEquipment(id: string): Promise<boolean> {
    const [result]: any = await pool.query(`DELETE FROM maintenance_equipment WHERE id = ?`, [id]);
    return result.affectedRows > 0;
  }

  // Work Orders
  async getAllWorkOrders(): Promise<WorkOrderRecord[]> {
    const [rows]: any = await pool.query(`SELECT * FROM maintenance_work_orders ORDER BY reported_date DESC`);
    return rows;
  }

  private getIntervalDays(frequency?: string, customDays?: number): number {
    if (customDays && customDays > 0) return customDays;
    switch (frequency) {
      case 'Daily': return 1;
      case 'Weekly': return 7;
      case 'Monthly': return 30;
      case 'Quarterly': return 90;
      case 'Semi-Annual': return 180;
      case 'Annual': return 365;
      default: return 30;
    }
  }

  async createWorkOrder(data: any): Promise<WorkOrderRecord> {
    const id = uuid();
    const woNo = `WO-${Date.now().toString().slice(-6)}`;
    const frequency = data.maintenance_frequency || 'Monthly';
    const intervalDays = this.getIntervalDays(frequency, data.maintenance_interval_days);
    
    let isCompleted = data.status === 'Completed';
    let completedDate: Date | null = isCompleted ? (data.completed_date ? new Date(data.completed_date) : new Date()) : null;
    let nextMaintenanceDue: Date | null = null;

    if (isCompleted && completedDate) {
      nextMaintenanceDue = new Date(completedDate.getTime() + intervalDays * 24 * 60 * 60 * 1000);
    }

    await pool.query(
      `INSERT INTO maintenance_work_orders (
        id, work_order_no, equipment_id, equipment_name, title, description, type, priority, status,
        requested_by, assigned_to, scheduled_date, completed_date, downtime_minutes, cost, resolution_notes,
        maintenance_frequency, maintenance_interval_days, next_maintenance_due
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        id,
        woNo,
        data.equipment_id || null,
        data.equipment_name,
        data.title,
        data.description || null,
        data.type || 'Preventive',
        data.priority || 'Medium',
        data.status || 'Open',
        data.requested_by || null,
        data.assigned_to || null,
        data.scheduled_date || null,
        completedDate,
        data.downtime_minutes || 0,
        data.cost || 0,
        data.resolution_notes || null,
        frequency,
        intervalDays,
        nextMaintenanceDue
      ]
    );

    // Auto-update Equipment last & next maintenance dates if completed
    if (isCompleted && data.equipment_id) {
      await pool.query(
        `UPDATE maintenance_equipment 
         SET last_maintenance_date = ?, next_maintenance_date = ? 
         WHERE id = ?`,
        [completedDate, nextMaintenanceDue, data.equipment_id]
      );
    }

    const [rows]: any = await pool.query(`SELECT * FROM maintenance_work_orders WHERE id = ?`, [id]);
    return rows[0];
  }

  async updateWorkOrder(id: string, data: Partial<WorkOrderRecord> & { maintenance_frequency?: string; maintenance_interval_days?: number }): Promise<WorkOrderRecord | null> {
    const [existing]: any = await pool.query(`SELECT * FROM maintenance_work_orders WHERE id = ?`, [id]);
    const currentWO = existing[0];
    if (!currentWO) return null;

    const newStatus = data.status || currentWO.status;
    const frequency = data.maintenance_frequency || currentWO.maintenance_frequency || 'Monthly';
    const intervalDays = this.getIntervalDays(frequency, data.maintenance_interval_days || currentWO.maintenance_interval_days);

    let isCompleted = newStatus === 'Completed';
    let completedDate = currentWO.completed_date;
    if (isCompleted && !completedDate) {
      completedDate = data.completed_date ? new Date(data.completed_date) : new Date();
    } else if (isCompleted && data.completed_date) {
      completedDate = new Date(data.completed_date);
    }

    let nextMaintenanceDue = currentWO.next_maintenance_due;
    if (isCompleted && completedDate) {
      nextMaintenanceDue = new Date(new Date(completedDate).getTime() + intervalDays * 24 * 60 * 60 * 1000);
    }

    await pool.query(
      `UPDATE maintenance_work_orders SET 
        title = COALESCE(?, title),
        description = COALESCE(?, description),
        type = COALESCE(?, type),
        priority = COALESCE(?, priority),
        status = COALESCE(?, status),
        assigned_to = COALESCE(?, assigned_to),
        scheduled_date = COALESCE(?, scheduled_date),
        completed_date = ?,
        downtime_minutes = COALESCE(?, downtime_minutes),
        cost = COALESCE(?, cost),
        resolution_notes = COALESCE(?, resolution_notes),
        maintenance_frequency = ?,
        maintenance_interval_days = ?,
        next_maintenance_due = ?
       WHERE id = ?`,
      [
        data.title,
        data.description,
        data.type,
        data.priority,
        newStatus,
        data.assigned_to,
        data.scheduled_date,
        completedDate,
        data.downtime_minutes,
        data.cost,
        data.resolution_notes,
        frequency,
        intervalDays,
        nextMaintenanceDue,
        id
      ]
    );

    const equipmentId = data.equipment_id || currentWO.equipment_id;
    if (isCompleted && equipmentId && completedDate) {
      await pool.query(
        `UPDATE maintenance_equipment 
         SET last_maintenance_date = ?, next_maintenance_date = ? 
         WHERE id = ?`,
        [completedDate, nextMaintenanceDue, equipmentId]
      );
    }

    const [rows]: any = await pool.query(`SELECT * FROM maintenance_work_orders WHERE id = ?`, [id]);
    return rows[0] || null;
  }

  async deleteWorkOrder(id: string): Promise<boolean> {
    const [result]: any = await pool.query(`DELETE FROM maintenance_work_orders WHERE id = ?`, [id]);
    return result.affectedRows > 0;
  }

  // Preventive Schedules
  async getAllPreventiveSchedules(): Promise<PreventiveScheduleRecord[]> {
    const [rows]: any = await pool.query(`SELECT * FROM maintenance_preventive_schedules ORDER BY next_due_date ASC`);
    return rows;
  }

  async createPreventiveSchedule(data: any): Promise<PreventiveScheduleRecord> {
    const id = uuid();
    const schedNo = `PM-${Date.now().toString().slice(-6)}`;
    await pool.query(
      `INSERT INTO maintenance_preventive_schedules (id, schedule_no, equipment_id, equipment_name, task_title, frequency, last_performed_date, next_due_date, assigned_team, status, checklist_summary)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [id, schedNo, data.equipment_id || null, data.equipment_name, data.task_title, data.frequency || 'Monthly', data.last_performed_date || null, data.next_due_date, data.assigned_team || null, data.status || 'Active', data.checklist_summary || null]
    );
    const [rows]: any = await pool.query(`SELECT * FROM maintenance_preventive_schedules WHERE id = ?`, [id]);
    return rows[0];
  }

  async updatePreventiveSchedule(id: string, data: Partial<PreventiveScheduleRecord>): Promise<PreventiveScheduleRecord | null> {
    await pool.query(
      `UPDATE maintenance_preventive_schedules SET
        task_title = COALESCE(?, task_title),
        frequency = COALESCE(?, frequency),
        last_performed_date = COALESCE(?, last_performed_date),
        next_due_date = COALESCE(?, next_due_date),
        assigned_team = COALESCE(?, assigned_team),
        status = COALESCE(?, status),
        checklist_summary = COALESCE(?, checklist_summary)
       WHERE id = ?`,
      [data.task_title, data.frequency, data.last_performed_date, data.next_due_date, data.assigned_team, data.status, data.checklist_summary, id]
    );
    const [rows]: any = await pool.query(`SELECT * FROM maintenance_preventive_schedules WHERE id = ?`, [id]);
    return rows[0] || null;
  }

  async deletePreventiveSchedule(id: string): Promise<boolean> {
    const [result]: any = await pool.query(`DELETE FROM maintenance_preventive_schedules WHERE id = ?`, [id]);
    return result.affectedRows > 0;
  }

  // Breakdown Logs
  async getAllBreakdownLogs(): Promise<BreakdownLogRecord[]> {
    const [rows]: any = await pool.query(`SELECT * FROM maintenance_breakdown_logs ORDER BY breakdown_date DESC`);
    return rows;
  }

  async createBreakdownLog(data: any): Promise<BreakdownLogRecord> {
    const id = uuid();
    const bdNo = `BD-${Date.now().toString().slice(-6)}`;
    await pool.query(
      `INSERT INTO maintenance_breakdown_logs (id, breakdown_no, equipment_id, equipment_name, root_cause, corrective_action, logged_by, status, downtime_hours)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [id, bdNo, data.equipment_id || null, data.equipment_name, data.root_cause || null, data.corrective_action || null, data.logged_by || null, data.status || 'Active', data.downtime_hours || 0]
    );
    const [rows]: any = await pool.query(`SELECT * FROM maintenance_breakdown_logs WHERE id = ?`, [id]);
    return rows[0];
  }

  async updateBreakdownLog(id: string, data: Partial<BreakdownLogRecord>): Promise<BreakdownLogRecord | null> {
    await pool.query(
      `UPDATE maintenance_breakdown_logs SET
        downtime_hours = COALESCE(?, downtime_hours),
        root_cause = COALESCE(?, root_cause),
        corrective_action = COALESCE(?, corrective_action),
        status = COALESCE(?, status),
        resolved_date = CASE WHEN ? = 'Resolved' AND resolved_date IS NULL THEN CURRENT_TIMESTAMP ELSE resolved_date END
       WHERE id = ?`,
      [data.downtime_hours, data.root_cause, data.corrective_action, data.status, data.status, id]
    );
    const [rows]: any = await pool.query(`SELECT * FROM maintenance_breakdown_logs WHERE id = ?`, [id]);
    return rows[0] || null;
  }

  async deleteBreakdownLog(id: string): Promise<boolean> {
    const [result]: any = await pool.query(`DELETE FROM maintenance_breakdown_logs WHERE id = ?`, [id]);
    return result.affectedRows > 0;
  }

  // Spare Parts
  async getAllSpareParts(): Promise<SparePartRecord[]> {
    const [rows]: any = await pool.query(`SELECT * FROM maintenance_spare_parts ORDER BY name ASC`);
    return rows;
  }

  async createSparePart(data: any): Promise<SparePartRecord> {
    const id = uuid();
    const partCode = data.part_code || `PART-${Date.now().toString().slice(-5)}`;
    await pool.query(
      `INSERT INTO maintenance_spare_parts (id, part_code, name, category, quantity, min_threshold, unit_cost, location)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
      [id, partCode, data.name, data.category || 'General', data.quantity || 0, data.min_threshold || 5, data.unit_cost || 0, data.location || null]
    );
    const [rows]: any = await pool.query(`SELECT * FROM maintenance_spare_parts WHERE id = ?`, [id]);
    return rows[0];
  }

  async updateSparePart(id: string, data: Partial<SparePartRecord>): Promise<SparePartRecord | null> {
    await pool.query(
      `UPDATE maintenance_spare_parts SET
        name = COALESCE(?, name),
        category = COALESCE(?, category),
        quantity = COALESCE(?, quantity),
        min_threshold = COALESCE(?, min_threshold),
        unit_cost = COALESCE(?, unit_cost),
        location = COALESCE(?, location)
       WHERE id = ?`,
      [data.name, data.category, data.quantity, data.min_threshold, data.unit_cost, data.location, id]
    );
    const [rows]: any = await pool.query(`SELECT * FROM maintenance_spare_parts WHERE id = ?`, [id]);
    return rows[0] || null;
  }

  async deleteSparePart(id: string): Promise<boolean> {
    const [result]: any = await pool.query(`DELETE FROM maintenance_spare_parts WHERE id = ?`, [id]);
    return result.affectedRows > 0;
  }

  // AMC Contracts
  async getAllAmcContracts(): Promise<AmcContractRecord[]> {
    const [rows]: any = await pool.query(`SELECT * FROM maintenance_amc_contracts ORDER BY end_date ASC`);
    return rows;
  }

  async createAmcContract(data: any): Promise<AmcContractRecord> {
    const id = uuid();
    const contractNo = data.contract_no || `AMC-${Date.now().toString().slice(-6)}`;
    const reminderDays = data.renewal_reminder_days || 30;

    // Calculate status based on end_date & reminder_days
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const endDate = new Date(data.end_date);
    const diffDays = Math.ceil((endDate.getTime() - today.getTime()) / (1000 * 3600 * 24));

    let status = data.status || 'Active';
    if (diffDays < 0) {
      status = 'Expired';
    } else if (diffDays <= reminderDays) {
      status = 'Expiring Soon';
    }

    await pool.query(
      `INSERT INTO maintenance_amc_contracts (
        id, contract_no, vendor_name, vendor_contact, equipment_id, equipment_name, contract_value,
        start_date, end_date, visit_schedule, documents_url, renewal_reminder_days, status, notes
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        id,
        contractNo,
        data.vendor_name,
        data.vendor_contact || null,
        data.equipment_id || null,
        data.equipment_name,
        data.contract_value || 0,
        data.start_date,
        data.end_date,
        data.visit_schedule || 'Quarterly',
        data.documents_url || null,
        reminderDays,
        status,
        data.notes || null
      ]
    );

    const [rows]: any = await pool.query(`SELECT * FROM maintenance_amc_contracts WHERE id = ?`, [id]);
    return rows[0];
  }

  async updateAmcContract(id: string, data: Partial<AmcContractRecord>): Promise<AmcContractRecord | null> {
    const [existing]: any = await pool.query(`SELECT * FROM maintenance_amc_contracts WHERE id = ?`, [id]);
    const current = existing[0];
    if (!current) return null;

    const endDate = data.end_date ? new Date(data.end_date) : new Date(current.end_date);
    const reminderDays = data.renewal_reminder_days || current.renewal_reminder_days || 30;

    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const diffDays = Math.ceil((endDate.getTime() - today.getTime()) / (1000 * 3600 * 24));

    let status = data.status || current.status;
    if (diffDays < 0) {
      status = 'Expired';
    } else if (diffDays <= reminderDays && status !== 'Terminated') {
      status = 'Expiring Soon';
    }

    await pool.query(
      `UPDATE maintenance_amc_contracts SET
        vendor_name = COALESCE(?, vendor_name),
        vendor_contact = COALESCE(?, vendor_contact),
        equipment_id = COALESCE(?, equipment_id),
        equipment_name = COALESCE(?, equipment_name),
        contract_value = COALESCE(?, contract_value),
        start_date = COALESCE(?, start_date),
        end_date = COALESCE(?, end_date),
        visit_schedule = COALESCE(?, visit_schedule),
        documents_url = COALESCE(?, documents_url),
        renewal_reminder_days = COALESCE(?, renewal_reminder_days),
        status = ?,
        notes = COALESCE(?, notes)
       WHERE id = ?`,
      [
        data.vendor_name,
        data.vendor_contact,
        data.equipment_id,
        data.equipment_name,
        data.contract_value,
        data.start_date,
        data.end_date,
        data.visit_schedule,
        data.documents_url,
        reminderDays,
        status,
        data.notes,
        id
      ]
    );

    const [rows]: any = await pool.query(`SELECT * FROM maintenance_amc_contracts WHERE id = ?`, [id]);
    return rows[0] || null;
  }

  async deleteAmcContract(id: string): Promise<boolean> {
    const [result]: any = await pool.query(`DELETE FROM maintenance_amc_contracts WHERE id = ?`, [id]);
    return result.affectedRows > 0;
  }

  // Maintenance Checklists
  async getAllChecklists(): Promise<MaintenanceChecklistRecord[]> {
    const [rows]: any = await pool.query(`SELECT * FROM maintenance_checklists ORDER BY due_date DESC`);
    return rows.map((r: any) => ({
      ...r,
      mechanical_checks: typeof r.mechanical_checks === 'string' ? JSON.parse(r.mechanical_checks) : r.mechanical_checks,
      electrical_checks: typeof r.electrical_checks === 'string' ? JSON.parse(r.electrical_checks) : r.electrical_checks,
      safety_checks: typeof r.safety_checks === 'string' ? JSON.parse(r.safety_checks) : r.safety_checks,
      general_checks: typeof r.general_checks === 'string' ? JSON.parse(r.general_checks) : r.general_checks,
      spare_parts_used: typeof r.spare_parts_used === 'string' ? JSON.parse(r.spare_parts_used) : r.spare_parts_used
    }));
  }

  async getChecklistStats() {
    const [rows]: any = await pool.query(`
      SELECT
        SUM(CASE WHEN due_date = CURRENT_DATE() THEN 1 ELSE 0 END) as todays_pm_tasks,
        SUM(CASE WHEN due_date < CURRENT_DATE() AND status NOT IN ('Completed', 'Cancelled') THEN 1 ELSE 0 END) as overdue_pms,
        SUM(CASE WHEN status = 'Completed' AND MONTH(due_date) = MONTH(CURRENT_DATE()) AND YEAR(due_date) = YEAR(CURRENT_DATE()) THEN 1 ELSE 0 END) as completed_this_month,
        SUM(CASE WHEN due_date BETWEEN CURRENT_DATE() AND DATE_ADD(CURRENT_DATE(), INTERVAL 7 DAY) THEN 1 ELSE 0 END) as upcoming_pms_next_7_days
      FROM maintenance_checklists
    `);
    return rows[0] || { todays_pm_tasks: 0, overdue_pms: 0, completed_this_month: 0, upcoming_pms_next_7_days: 0 };
  }

  async createChecklist(data: any): Promise<MaintenanceChecklistRecord> {
    const id = uuid();
    const checklistNo = data.checklist_no || `MCL-${Date.now().toString().slice(-6)}`;
    
    // Auto status check for overdue if past due date & not completed
    const todayStr = new Date().toISOString().split("T")[0];
    let status = data.status || 'Scheduled';
    if (data.due_date < todayStr && status !== 'Completed' && status !== 'Cancelled') {
      status = 'Overdue';
    }

    await pool.query(
      `INSERT INTO maintenance_checklists (
        id, checklist_no, filled_by_name, technician_name, equipment_id, equipment_name, department_name, due_date,
        mechanical_checks, electrical_checks, safety_checks, general_checks, spare_parts_used,
        start_time, end_time, work_completed, issues_found, technician_remarks, photo_before_url, photo_after_url,
        supervisor_name, approval_status, approval_remarks, approval_date, status
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        id,
        checklistNo,
        data.filled_by_name || 'Technician',
        data.technician_name || null,
        data.equipment_id || null,
        data.equipment_name,
        data.department_name || null,
        data.due_date,
        JSON.stringify(data.mechanical_checks || {}),
        JSON.stringify(data.electrical_checks || {}),
        JSON.stringify(data.safety_checks || {}),
        JSON.stringify(data.general_checks || {}),
        JSON.stringify(data.spare_parts_used || []),
        data.start_time || null,
        data.end_time || null,
        data.work_completed || null,
        data.issues_found || null,
        data.technician_remarks || null,
        data.photo_before_url || null,
        data.photo_after_url || null,
        data.supervisor_name || null,
        data.approval_status || 'Pending',
        data.approval_remarks || null,
        data.approval_date || null,
        status
      ]
    );

    const [rows]: any = await pool.query(`SELECT * FROM maintenance_checklists WHERE id = ?`, [id]);
    const r = rows[0];
    return {
      ...r,
      mechanical_checks: typeof r.mechanical_checks === 'string' ? JSON.parse(r.mechanical_checks) : r.mechanical_checks,
      electrical_checks: typeof r.electrical_checks === 'string' ? JSON.parse(r.electrical_checks) : r.electrical_checks,
      safety_checks: typeof r.safety_checks === 'string' ? JSON.parse(r.safety_checks) : r.safety_checks,
      general_checks: typeof r.general_checks === 'string' ? JSON.parse(r.general_checks) : r.general_checks,
      spare_parts_used: typeof r.spare_parts_used === 'string' ? JSON.parse(r.spare_parts_used) : r.spare_parts_used
    };
  }

  async updateChecklist(id: string, data: Partial<MaintenanceChecklistRecord>): Promise<MaintenanceChecklistRecord | null> {
    const [existing]: any = await pool.query(`SELECT * FROM maintenance_checklists WHERE id = ?`, [id]);
    const current = existing[0];
    if (!current) return null;

    const todayStr = new Date().toISOString().split("T")[0];
    const dueDate = data.due_date ? String(data.due_date) : String(current.due_date);
    let status = data.status || current.status;
    if (dueDate < todayStr && status !== 'Completed' && status !== 'Cancelled') {
      status = 'Overdue';
    }

    await pool.query(
      `UPDATE maintenance_checklists SET
        filled_by_name = COALESCE(?, filled_by_name),
        technician_name = COALESCE(?, technician_name),
        equipment_id = COALESCE(?, equipment_id),
        equipment_name = COALESCE(?, equipment_name),
        department_name = COALESCE(?, department_name),
        due_date = COALESCE(?, due_date),
        mechanical_checks = CASE WHEN ? IS NOT NULL THEN ? ELSE mechanical_checks END,
        electrical_checks = CASE WHEN ? IS NOT NULL THEN ? ELSE electrical_checks END,
        safety_checks = CASE WHEN ? IS NOT NULL THEN ? ELSE safety_checks END,
        general_checks = CASE WHEN ? IS NOT NULL THEN ? ELSE general_checks END,
        spare_parts_used = CASE WHEN ? IS NOT NULL THEN ? ELSE spare_parts_used END,
        start_time = COALESCE(?, start_time),
        end_time = COALESCE(?, end_time),
        work_completed = COALESCE(?, work_completed),
        issues_found = COALESCE(?, issues_found),
        technician_remarks = COALESCE(?, technician_remarks),
        photo_before_url = COALESCE(?, photo_before_url),
        photo_after_url = COALESCE(?, photo_after_url),
        supervisor_name = COALESCE(?, supervisor_name),
        approval_status = COALESCE(?, approval_status),
        approval_remarks = COALESCE(?, approval_remarks),
        approval_date = COALESCE(?, approval_date),
        status = ?
       WHERE id = ?`,
      [
        data.filled_by_name,
        data.technician_name,
        data.equipment_id,
        data.equipment_name,
        data.department_name,
        data.due_date,
        data.mechanical_checks ? 'SET' : null, data.mechanical_checks ? JSON.stringify(data.mechanical_checks) : null,
        data.electrical_checks ? 'SET' : null, data.electrical_checks ? JSON.stringify(data.electrical_checks) : null,
        data.safety_checks ? 'SET' : null, data.safety_checks ? JSON.stringify(data.safety_checks) : null,
        data.general_checks ? 'SET' : null, data.general_checks ? JSON.stringify(data.general_checks) : null,
        data.spare_parts_used ? 'SET' : null, data.spare_parts_used ? JSON.stringify(data.spare_parts_used) : null,
        data.start_time,
        data.end_time,
        data.work_completed,
        data.issues_found,
        data.technician_remarks,
        data.photo_before_url,
        data.photo_after_url,
        data.supervisor_name,
        data.approval_status,
        data.approval_remarks,
        data.approval_date,
        status,
        id
      ]
    );

    const [rows]: any = await pool.query(`SELECT * FROM maintenance_checklists WHERE id = ?`, [id]);
    const r = rows[0];
    if (!r) return null;
    return {
      ...r,
      mechanical_checks: typeof r.mechanical_checks === 'string' ? JSON.parse(r.mechanical_checks) : r.mechanical_checks,
      electrical_checks: typeof r.electrical_checks === 'string' ? JSON.parse(r.electrical_checks) : r.electrical_checks,
      safety_checks: typeof r.safety_checks === 'string' ? JSON.parse(r.safety_checks) : r.safety_checks,
      general_checks: typeof r.general_checks === 'string' ? JSON.parse(r.general_checks) : r.general_checks,
      spare_parts_used: typeof r.spare_parts_used === 'string' ? JSON.parse(r.spare_parts_used) : r.spare_parts_used
    };
  }

  async deleteChecklist(id: string): Promise<boolean> {
    const [result]: any = await pool.query(`DELETE FROM maintenance_checklists WHERE id = ?`, [id]);
    return result.affectedRows > 0;
  }
}
