import { v4 as uuidv4 } from "uuid";
import { NotificationService } from "../../../notifications/application/services/NotificationService";
import { MySqlNotificationRepository } from "../../../notifications/infrastructure/repositories/MySqlNotificationRepository";

export interface StartFmsInstanceDto {
  referenceTitle: string;
  formData?: any;
  creatorId?: string;
}

export interface CompleteFmsStepDto {
  inputData: any;
}

export class FmsExecutionService {
  private notificationService: NotificationService;

  constructor(private dbPool: any) {
    this.notificationService = new NotificationService(new MySqlNotificationRepository());
  }

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

    // Notify initial steps
    const actionableStepIds = await this._computeActionableSteps(instanceId);
    if (actionableStepIds.length > 0) {
      const placeholders = actionableStepIds.map(() => '?').join(',');
      await this.dbPool.query(`UPDATE fms_instance_steps SET status = 'Under Process' WHERE id IN (${placeholders})`, actionableStepIds);
      
      const [initialSteps] = await this.dbPool.query(`
        SELECT fis.id as instanceStepId, fs.step_name as stepName, fs.doer_employee_ids as doerEmployeeIds, fi.creator_id as creatorId, fm.name as managerName
        FROM fms_instance_steps fis
        JOIN fms_instances fi ON fis.instance_id = fi.id
        JOIN fms_steps fs ON fis.fms_step_id = fs.id
        JOIN fms_managers fm ON fi.fms_manager_id = fm.id
        WHERE fis.id IN (${placeholders})
      `, actionableStepIds);
      
      for (const step of initialSteps) {
        await this.notifyDoers(step);
      }
    }

    return { id: instanceId, message: "FMS instance started successfully" };
  }

  private async _computeActionableSteps(instanceId: string): Promise<string[]> {
    const query = `
      SELECT 
        fis.id as instanceStepId,
        fs.id as stepId,
        fs.is_sequential as isSequential,
        fs.depends_on_step_ids as explicitDependsOn,
        fs.cross_fms_id as crossFmsId,
        fs.cross_fms_step_id as crossFmsStepId,
        fis.status,
        fs.sequence_order as sequenceOrder
      FROM fms_instance_steps fis
      JOIN fms_steps fs ON fis.fms_step_id = fs.id
      WHERE fis.instance_id = ?
      ORDER BY fs.sequence_order ASC
    `;
    const [rows] = await this.dbPool.query(query, [instanceId]);
    
    const [instanceRows] = await this.dbPool.query("SELECT reference_title, fms_manager_id FROM fms_instances WHERE id = ?", [instanceId]);
    const referenceTitle = instanceRows[0]?.reference_title;
    const managerId = instanceRows[0]?.fms_manager_id;
    
    // Check if the FMS Manager has a global cross-FMS dependency
    const [managerRows] = await this.dbPool.query("SELECT cross_fms_id, cross_fms_step_id FROM fms_managers WHERE id = ?", [managerId]);
    const manager = managerRows[0];
    
    if (manager && manager.cross_fms_id && manager.cross_fms_step_id) {
      const [crossInstanceRows] = await this.dbPool.query(
        "SELECT id FROM fms_instances WHERE fms_manager_id = ? AND reference_title = ?", 
        [manager.cross_fms_id, referenceTitle]
      );
      if (crossInstanceRows.length > 0) {
        const [crossStepRows] = await this.dbPool.query(
          "SELECT status FROM fms_instance_steps WHERE instance_id = ? AND fms_step_id = ?", 
          [crossInstanceRows[0].id, manager.cross_fms_step_id]
        );
        if (crossStepRows.length === 0 || crossStepRows[0].status !== 'Completed') {
           // Global dependency is not met, so NO steps are actionable
           return [];
        }
      } else {
         // Cross instance doesn't exist yet, NO steps actionable
         return [];
      }
    }
    
    let currentBlock: string[] = [];
    let previousBlock: string[] = [];
    const computedDeps = new Map<string, string[]>(); 
    const stepIdToInstanceStepId = new Map<string, string>();
    
    for (const row of rows) {
      stepIdToInstanceStepId.set(row.stepId, row.instanceStepId);
    }

    for (const row of rows) {
      const explicit = typeof row.explicitDependsOn === 'string' ? JSON.parse(row.explicitDependsOn) : (row.explicitDependsOn || []);
      const isSeq = !!row.isSequential;
      let deps: string[] = [];

      if (explicit && explicit.length > 0) {
        deps = explicit.map((stepId: string) => stepIdToInstanceStepId.get(stepId)).filter(Boolean);
        previousBlock = currentBlock.length > 0 ? [...currentBlock] : [...previousBlock];
        currentBlock = [row.instanceStepId];
      } else {
        if (isSeq) {
           deps = currentBlock.length > 0 ? [...currentBlock] : [...previousBlock];
           previousBlock = currentBlock.length > 0 ? [...currentBlock] : [...previousBlock];
           currentBlock = [row.instanceStepId];
        } else {
           if (currentBlock.length > 0) {
             const lastInstanceStepId = currentBlock[currentBlock.length - 1];
             const lastRow = rows.find((r: any) => r.instanceStepId === lastInstanceStepId);
             if (lastRow && lastRow.isSequential) {
                previousBlock = [...currentBlock];
                currentBlock = [row.instanceStepId];
                deps = [...previousBlock];
             } else {
                currentBlock.push(row.instanceStepId);
                deps = [...previousBlock];
             }
           } else {
             currentBlock.push(row.instanceStepId);
             deps = [];
           }
        }
      }
      computedDeps.set(row.instanceStepId, deps);
    }

    const actionableIds: string[] = [];
    for (const row of rows) {
      if (row.status === 'Pending') {
        const deps = computedDeps.get(row.instanceStepId) || [];
        let allMet = true;
        for (const depId of deps) {
           const depRow = rows.find((r: any) => r.instanceStepId === depId);
           if (!depRow || (depRow.status !== 'Completed' && depRow.status !== 'Skipped')) {
             allMet = false;
             break;
           }
        }
        if (allMet && row.crossFmsId && row.crossFmsStepId && referenceTitle) {
           const [crossRows] = await this.dbPool.query(`
             SELECT fis.status 
             FROM fms_instance_steps fis
             JOIN fms_instances fi ON fis.instance_id = fi.id
             WHERE fi.fms_manager_id = ? 
               AND fi.reference_title = ?
               AND fis.fms_step_id = ?
               AND (fis.status = 'Completed' OR fis.status = 'Skipped')
           `, [row.crossFmsId, referenceTitle, row.crossFmsStepId]);
           
           if (crossRows.length === 0) {
             allMet = false;
           }
        }
        
        if (allMet) {
          actionableIds.push(row.instanceStepId);
        }
      }
    }

    return actionableIds;
  }

  private async notifyDoers(step: any) {
    let doers: string[] = [];
    try {
      doers = typeof step.doerEmployeeIds === 'string' ? JSON.parse(step.doerEmployeeIds) : step.doerEmployeeIds;
    } catch (e) {}

    if (!Array.isArray(doers) || doers.length === 0) {
      if (step.creatorId) doers = [step.creatorId];
    }

    for (const doerId of doers) {
      if (!doerId) continue;
      try {
        await this.notificationService.notify({
          type: "new_task_assigned",
          module: "workflow",
          referenceType: "fms_step",
          referenceId: step.instanceStepId,
          assignedUserId: doerId,
          title: `FMS Task Actionable: ${step.stepName}`,
          description: `A task in the FMS workflow "${step.managerName}" is now ready for your action.`,
          priority: "medium",
          actionLabel: "View Tasks",
          actionUrl: "/admin/fms/tasks"
        });
      } catch (err) {
        console.error("Failed to send notification:", err);
      }
    }
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
        AND fis.status = 'Under Process'
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
      SELECT fis.*, fs.step_name, fs.sequence_order, fs.doer_employee_ids, fi.fms_manager_id, fi.creator_id, fi.reference_title, fi.form_data 
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

    // Find newly actionable steps dependent on this completed step
    const actionableStepIds = await this._computeActionableSteps(step.instance_id);
    if (actionableStepIds.length > 0) {
      const placeholders = actionableStepIds.map(() => '?').join(',');
      await this.dbPool.query(`UPDATE fms_instance_steps SET status = 'Under Process' WHERE id IN (${placeholders})`, actionableStepIds);
      
      const [actionableSteps] = await this.dbPool.query(`
        SELECT fis.id as instanceStepId, fs.step_name as stepName, fs.doer_employee_ids as doerEmployeeIds, fi.creator_id as creatorId, fm.name as managerName
        FROM fms_instance_steps fis
        JOIN fms_instances fi ON fis.instance_id = fi.id
        JOIN fms_steps fs ON fis.fms_step_id = fs.id
        JOIN fms_managers fm ON fi.fms_manager_id = fm.id
        WHERE fis.id IN (${placeholders})
      `, actionableStepIds);
      
      for (const aStep of actionableSteps) {
        await this.notifyDoers(aStep);
      }
    }

    // Check if all steps are done/skipped
    const [pendingSteps] = await this.dbPool.query(
      "SELECT id FROM fms_instance_steps WHERE instance_id = ? AND status IN ('Pending', 'Under Process')",
      [step.instance_id]
    );
    if (pendingSteps.length === 0) {
      await this.dbPool.query("UPDATE fms_instances SET status = 'Completed' WHERE id = ?", [step.instance_id]);

      // FMS Workflow Chaining
      const [managerRows] = await this.dbPool.query("SELECT name FROM fms_managers WHERE id = ?", [step.fms_manager_id]);
      const managerName = managerRows[0]?.name;

      if (managerName === 'BUYER ORDER TO CARTON ORDER') {
        const [targetRows] = await this.dbPool.query("SELECT id FROM fms_managers WHERE name = 'FINISHED PRODUCTS TO DELIVERY'");
        if (targetRows.length > 0) {
          const formData = typeof step.form_data === 'string' ? JSON.parse(step.form_data) : step.form_data;
          await this.startFmsInstance(targetRows[0].id, {
            referenceTitle: step.reference_title,
            formData,
            creatorId: step.creator_id
          });
        }
      } else if (managerName === 'FINISHED PRODUCTS TO DELIVERY') {
        const [targetRows] = await this.dbPool.query("SELECT id FROM fms_managers WHERE name = 'DELIVERY TO CLEARANCE'");
        if (targetRows.length > 0) {
          const formData = typeof step.form_data === 'string' ? JSON.parse(step.form_data) : step.form_data;
          await this.startFmsInstance(targetRows[0].id, {
            referenceTitle: step.reference_title,
            formData,
            creatorId: step.creator_id
          });
        }
      }
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
