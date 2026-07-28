import { v4 as uuidv4 } from "uuid";

export interface StartFmsInstanceDto {
  referenceTitle: string;
  formData?: any;
  creatorId?: string;
}

export interface CompleteFmsStepDto {
  inputData: any;
}

export class FmsExecutionService {
  constructor(private dbPool: any) {}

  async startFmsInstance(fmsManagerId: string, dto: StartFmsInstanceDto) {
    const instanceId = uuidv4();
    
    // Create instance
    await this.dbPool.query(
      "INSERT INTO fms_instances (id, fms_manager_id, reference_title, status, form_data, creator_id) VALUES (?, ?, ?, ?, ?, ?)",
      [instanceId, fmsManagerId, dto.referenceTitle, 'In Progress', dto.formData ? JSON.stringify(dto.formData) : null, dto.creatorId || null]
    );

    // Get steps for this manager
    const [steps] = await this.dbPool.query(
      "SELECT id FROM fms_steps WHERE fms_id = ? ORDER BY sequence_order ASC",
      [fmsManagerId]
    );

    // Insert instance steps
    for (const step of steps) {
      await this.dbPool.query(
        "INSERT INTO fms_instance_steps (id, instance_id, fms_step_id, status) VALUES (?, ?, ?, ?)",
        [uuidv4(), instanceId, step.id, 'Pending']
      );
    }

    // Fetch current FMS name to handle auto-connect logic
    const [managerRows] = await this.dbPool.query("SELECT name FROM fms_managers WHERE id = ?", [fmsManagerId]);
    const managerName = managerRows[0]?.name;

    if (managerName === 'BUYER ORDER TO CARTON ORDER') {
      const [targetRows] = await this.dbPool.query(
        "SELECT id, name FROM fms_managers WHERE name IN ('FINISHED PRODUCTS TO DELIVERY', 'DELIVERY TO CLEARANCE')"
      );
      
      for (const target of targetRows) {
         const targetInstanceId = uuidv4();
         await this.dbPool.query(
           "INSERT INTO fms_instances (id, fms_manager_id, reference_title, status, form_data, creator_id) VALUES (?, ?, ?, ?, ?, ?)",
           [targetInstanceId, target.id, dto.referenceTitle, 'In Progress', dto.formData ? JSON.stringify(dto.formData) : null, dto.creatorId || null]
         );
         
         const [targetSteps] = await this.dbPool.query(
           "SELECT id FROM fms_steps WHERE fms_id = ? ORDER BY sequence_order ASC",
           [target.id]
         );
         
         for (const step of targetSteps) {
           await this.dbPool.query(
             "INSERT INTO fms_instance_steps (id, instance_id, fms_step_id, status) VALUES (?, ?, ?, ?)",
             [uuidv4(), targetInstanceId, step.id, 'Pending']
           );
         }
      }
    }

    return { id: instanceId, message: "FMS instance started successfully" };
  }

  async getMyPendingTasks(employeeId: string) {
    const query = `
      SELECT 
        fis.id as instanceStepId,
        fi.id as instanceId,
        fi.reference_title as referenceTitle,
        fi.form_data as formData,
        fm.name as managerName,
        fs.step_name as stepName,
        fs.timeline_hours as timelineHours,
        fs.timeline_unit as timelineUnit,
        fs.is_sequential as isSequential,
        fs.doer_employee_ids as doerEmployeeIds,
        fs.sequence_order as sequenceOrder,
        fi.creator_id as creatorId,
        fis.status,
        fis.created_at as assignedAt
      FROM fms_instance_steps fis
      JOIN fms_instances fi ON fis.instance_id = fi.id
      JOIN fms_steps fs ON fis.fms_step_id = fs.id
      JOIN fms_managers fm ON fi.fms_manager_id = fm.id
      WHERE fi.status = 'In Progress' 
        AND fis.status IN ('Pending', 'Under Process')
        AND (
          fs.depends_on_step_ids IS NULL 
          OR JSON_LENGTH(fs.depends_on_step_ids) = 0
          OR JSON_LENGTH(fs.depends_on_step_ids) = (
            SELECT COUNT(DISTINCT prev_fis.fms_step_id)
            FROM fms_instance_steps prev_fis
            JOIN fms_instances prev_fi ON prev_fis.instance_id = prev_fi.id
            WHERE prev_fi.reference_title = fi.reference_title
              AND JSON_CONTAINS(fs.depends_on_step_ids, CONCAT('"', prev_fis.fms_step_id, '"'))
              AND prev_fis.status = 'Completed'
          )
        )
      ORDER BY fis.created_at ASC
    `;
    const [rows] = await this.dbPool.query(query);

    // Filter where employee is a doer
    return rows.filter((row: any) => {
      let doers = [];
      try {
        doers = typeof row.doerEmployeeIds === 'string' ? JSON.parse(row.doerEmployeeIds) : row.doerEmployeeIds;
      } catch (e) {}
      
      if (!Array.isArray(doers)) doers = [];

      const isDoer = doers.includes(employeeId);
      const isCreator = row.creatorId === employeeId;

      // If a step has no assigned doers, default to the creator of the FMS instance
      if (doers.length === 0 && isCreator) {
        return true;
      }

      return isDoer;
    }).map((row: any) => ({
      instanceStepId: row.instanceStepId,
      instanceId: row.instanceId,
      referenceTitle: row.referenceTitle,
      managerName: row.managerName,
      formData: typeof row.formData === 'string' && row.formData ? JSON.parse(row.formData) : (row.formData || {}),
      stepName: row.stepName,
      timelineHours: parseFloat(row.timelineHours),
      timelineUnit: row.timelineUnit,
      isSequential: !!row.isSequential,
      status: row.status,
      assignedAt: row.assignedAt
    }));
  }

  async getInstancesByManagerId(fmsManagerId: string) {
    const query = `
      SELECT 
        fi.id as instanceId,
        fi.reference_title as referenceTitle,
        fi.status as instanceStatus,
        fi.created_at as createdAt,
        fi.form_data as formData,
        e.full_name as creatorName,
        fis.id as stepId,
        fs.step_name as stepName,
        fs.sequence_order as sequenceOrder,
        fis.status as stepStatus,
        fis.completed_at as completedAt,
        ce.full_name as completedByName
      FROM fms_instances fi
      LEFT JOIN employees e ON fi.creator_id = e.id
      LEFT JOIN fms_instance_steps fis ON fi.id = fis.instance_id
      LEFT JOIN fms_steps fs ON fis.fms_step_id = fs.id
      LEFT JOIN employees ce ON fis.completed_by = ce.id
      WHERE fi.fms_manager_id = ?
      ORDER BY fi.created_at DESC, fs.sequence_order ASC
    `;
    const [rows] = await this.dbPool.query(query, [fmsManagerId]);

    // Group by instance
    const instancesMap = new Map<string, any>();
    for (const row of rows) {
      if (!instancesMap.has(row.instanceId)) {
        instancesMap.set(row.instanceId, {
          id: row.instanceId,
          referenceTitle: row.referenceTitle,
          status: row.instanceStatus,
          createdAt: row.createdAt,
          creatorName: row.creatorName || "System / Unassigned",
          formData: row.formData ? (typeof row.formData === 'string' ? JSON.parse(row.formData) : row.formData) : {},
          steps: []
        });
      }
      if (row.stepId) {
        instancesMap.get(row.instanceId).steps.push({
          id: row.stepId,
          stepName: row.stepName,
          sequenceOrder: row.sequenceOrder,
          status: row.stepStatus,
          completedAt: row.completedAt,
          completedByName: row.completedByName
        });
      }
    }

    return Array.from(instancesMap.values());
  }

  async completeStep(employeeId: string, instanceStepId: string, dto: CompleteFmsStepDto) {
    // Check step details
    const [rows] = await this.dbPool.query(`
      SELECT fis.*, fs.step_name, fs.sequence_order, fs.doer_employee_ids, fi.fms_manager_id, fi.creator_id 
      FROM fms_instance_steps fis
      JOIN fms_steps fs ON fis.fms_step_id = fs.id
      JOIN fms_instances fi ON fis.instance_id = fi.id
      WHERE fis.id = ?
    `, [instanceStepId]);

    if (rows.length === 0) throw new Error("Instance step not found");
    const step = rows[0];

    // Authorization check
    let isAuthorized = false;
    let doers = [];
    try {
      doers = typeof step.doer_employee_ids === 'string' ? JSON.parse(step.doer_employee_ids) : step.doer_employee_ids;
    } catch (e) {}
    
    const isCreatorStep = !doers || doers.length === 0;
    
    if (isCreatorStep && step.creator_id === employeeId) {
      isAuthorized = true;
    } else if (Array.isArray(doers) && doers.includes(employeeId)) {
      isAuthorized = true;
    }

    if (!isAuthorized) {
      throw new Error("You are not authorized to complete this step");
    }

    const newStatus = dto.inputData?.status || 'Completed';

    // Mark updated
    await this.dbPool.query(
      "UPDATE fms_instance_steps SET status = ?, completed_by = ?, input_data = ?, completed_at = NOW() WHERE id = ?",
      [newStatus, employeeId, JSON.stringify(dto.inputData || {}), instanceStepId]
    );

    // Hardcoded Condition Check
    const isRepeatOrderYes = step.step_name.includes("Repeat Order") && dto.inputData?.isRepeatOrder === 'Yes';
    if (isRepeatOrderYes) {
      // Find all steps for this instance with sequence order between current and 8
      const currentOrder = step.sequence_order;
      // We assume order 8 means sequence_order = 8.
      // Wait, in FMS, sequence_order is 0-indexed or 1-indexed? Usually 0-indexed in our code.
      // The frontend shows "Order" as index + 1. So Step 8 means index 7 (sequence_order = 7).
      const targetOrder = 7;
      
      const [skipSteps] = await this.dbPool.query(`
        SELECT fis.id 
        FROM fms_instance_steps fis
        JOIN fms_steps fs ON fis.fms_step_id = fs.id
        WHERE fis.instance_id = ? AND fs.sequence_order > ? AND fs.sequence_order < ?
      `, [step.instance_id, currentOrder, targetOrder]);

      for (const s of skipSteps) {
        await this.dbPool.query("UPDATE fms_instance_steps SET status = 'Skipped' WHERE id = ?", [s.id]);
      }
    }

    // Check if all steps are done/skipped
    const [pendingSteps] = await this.dbPool.query(
      "SELECT id FROM fms_instance_steps WHERE instance_id = ? AND status = 'Pending'",
      [step.instance_id]
    );
    if (pendingSteps.length === 0) {
      await this.dbPool.query("UPDATE fms_instances SET status = 'Completed' WHERE id = ?", [step.instance_id]);
    }

    return { message: "Step completed" };
  }

  async deleteInstance(instanceId: string) {
    // Delete steps first
    await this.dbPool.query("DELETE FROM fms_instance_steps WHERE instance_id = ?", [instanceId]);
    // Delete instance
    const [result] = await this.dbPool.query("DELETE FROM fms_instances WHERE id = ?", [instanceId]);
    
    if (result.affectedRows === 0) {
      throw new Error("Instance not found");
    }
    
    return { message: "Instance deleted successfully" };
  }
}
