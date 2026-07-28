import { v4 as uuidv4 } from "uuid";
import { CreateFmsManagerDto, CreateFmsStepDto } from "../dto/fms.dto";

export interface FmsManagerEntity {
  id: string;
  name: string;
  sopVideoLink: string | null;
  description: string;
  globalPc: string | null;
  tField: string | null;
  formFields: any[] | null;
  createdAt: string;
}

export interface FmsStepEntity {
  id: string;
  fmsId: string;
  stepName: string;
  doerEmployeeIds: string[];
  timelineHours: number;
  timelineUnit: "hours" | "days";
  isSequential: boolean;
  sequenceOrder: number;
  dependsOnStepIds?: string[];
  createdAt: string;
}

export class FmsManagerService {
  constructor(private dbPool: any) {}

  async createFms(dto: CreateFmsManagerDto): Promise<FmsManagerEntity> {
    const id = uuidv4();
    const query = `
      INSERT INTO fms_managers (
        id, name, sop_video_link, description, global_pc, t_field, conditional_step, consolidated_entry, form_fields
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
    `;
    const params = [
      id,
      dto.name,
      dto.sopVideoLink || null,
      dto.description,
      null,
      null,
      false,
      false,
      dto.formFields ? JSON.stringify(dto.formFields) : null
    ];

    await this.dbPool.query(query, params);

    const [rows] = await this.dbPool.query("SELECT * FROM fms_managers WHERE id = ?", [id]);
    return this.mapToEntity(rows[0]);
  }

  async getAllFms(): Promise<FmsManagerEntity[]> {
    const [rows] = await this.dbPool.query("SELECT * FROM fms_managers ORDER BY created_at DESC");
    return rows.map(this.mapToEntity);
  }

  async deleteFms(fmsId: string): Promise<void> {
    // Delete fms_instance_steps first
    await this.dbPool.query("DELETE FROM fms_instance_steps WHERE instance_id IN (SELECT id FROM fms_instances WHERE fms_manager_id = ?)", [fmsId]);
    // Delete fms_instances
    await this.dbPool.query("DELETE FROM fms_instances WHERE fms_manager_id = ?", [fmsId]);
    // Delete fms_steps
    await this.dbPool.query("DELETE FROM fms_steps WHERE fms_id = ?", [fmsId]);
    // Finally delete the manager
    await this.dbPool.query("DELETE FROM fms_managers WHERE id = ?", [fmsId]);
  }

  async updateFms(fmsId: string, dto: CreateFmsManagerDto): Promise<FmsManagerEntity> {
    const query = `
      UPDATE fms_managers
      SET name = ?, sop_video_link = ?, description = ?, form_fields = ?
      WHERE id = ?
    `;
    const params = [
      dto.name,
      dto.sopVideoLink || null,
      dto.description,
      dto.formFields ? JSON.stringify(dto.formFields) : null,
      fmsId
    ];

    await this.dbPool.query(query, params);

    const [rows] = await this.dbPool.query("SELECT * FROM fms_managers WHERE id = ?", [fmsId]);
    return this.mapToEntity(rows[0]);
  }

  private mapToEntity(row: any): FmsManagerEntity {
    return {
      id: row.id,
      name: row.name,
      sopVideoLink: row.sop_video_link,
      description: row.description,
      globalPc: row.global_pc,
      tField: row.t_field,
      formFields: typeof row.form_fields === "string" ? JSON.parse(row.form_fields) : row.form_fields,
      createdAt: row.created_at,
    };
  }

  async addStep(fmsId: string, dto: CreateFmsStepDto): Promise<FmsStepEntity> {
    const id = uuidv4();
    const query = `
      INSERT INTO fms_steps (
        id, fms_id, step_name, doer_employee_ids, timeline_hours, timeline_unit, is_sequential, sequence_order, depends_on_step_ids
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
    `;
    const params = [
      id,
      fmsId,
      dto.stepName,
      JSON.stringify(dto.doerEmployeeIds),
      dto.timelineHours,
      dto.timelineUnit,
      dto.isSequential !== undefined ? dto.isSequential : true,
      dto.sequenceOrder || 0,
      JSON.stringify(dto.dependsOnStepIds || [])
    ];

    await this.dbPool.query(query, params);

    const [rows] = await this.dbPool.query("SELECT * FROM fms_steps WHERE id = ?", [id]);
    return this.mapToStepEntity(rows[0]);
  }

  async getSteps(fmsId: string): Promise<FmsStepEntity[]> {
    const [rows] = await this.dbPool.query("SELECT * FROM fms_steps WHERE fms_id = ? ORDER BY sequence_order ASC, created_at ASC", [fmsId]);
    return rows.map(this.mapToStepEntity);
  }

  async getAllStepsAcrossManagers(): Promise<any[]> {
    const query = `
      SELECT fs.*, fm.name as manager_name
      FROM fms_steps fs
      JOIN fms_managers fm ON fs.fms_id = fm.id
      ORDER BY fm.name ASC, fs.sequence_order ASC, fs.created_at ASC
    `;
    const [rows] = await this.dbPool.query(query);
    return rows.map((row: any) => ({
      ...this.mapToStepEntity(row),
      managerName: row.manager_name
    }));
  }

  async deleteStep(stepId: string): Promise<void> {
    await this.dbPool.query("DELETE FROM fms_steps WHERE id = ?", [stepId]);
  }

  async updateStep(stepId: string, dto: CreateFmsStepDto): Promise<FmsStepEntity> {
    const query = `
      UPDATE fms_steps 
      SET step_name = ?, doer_employee_ids = ?, timeline_hours = ?, timeline_unit = ?, is_sequential = ?, sequence_order = ?, depends_on_step_ids = ?
      WHERE id = ?
    `;
    const params = [
      dto.stepName,
      JSON.stringify(dto.doerEmployeeIds),
      dto.timelineHours,
      dto.timelineUnit,
      dto.isSequential !== undefined ? dto.isSequential : true,
      dto.sequenceOrder || 0,
      JSON.stringify(dto.dependsOnStepIds || []),
      stepId
    ];
    await this.dbPool.query(query, params);
    
    const [rows] = await this.dbPool.query("SELECT * FROM fms_steps WHERE id = ?", [stepId]);
    return this.mapToStepEntity(rows[0]);
  }

  private mapToStepEntity(row: any): FmsStepEntity {
    return {
      id: row.id,
      fmsId: row.fms_id,
      stepName: row.step_name,
      doerEmployeeIds: typeof row.doer_employee_ids === "string" ? JSON.parse(row.doer_employee_ids) : row.doer_employee_ids,
      timelineHours: parseFloat(row.timeline_hours),
      timelineUnit: row.timeline_unit,
      isSequential: !!row.is_sequential,
      sequenceOrder: row.sequence_order,
      dependsOnStepIds: typeof row.depends_on_step_ids === "string" ? JSON.parse(row.depends_on_step_ids) : (row.depends_on_step_ids || []),
      createdAt: row.created_at,
    };
  }
}
