import { v4 as uuidv4 } from "uuid";
import { CreateFmsManagerDto, CreateFmsStepDto } from "../dto/fms.dto";

export interface FmsManagerEntity {
  id: string;
  name: string;
  sopVideoLink: string | null;
  description: string;
  globalPc: string | null;
  tField: string | null;
  createdAt: string;
}

export interface FmsStepEntity {
  id: string;
  fmsId: string;
  stepName: string;
  doerEmployeeId: string;
  timelineHours: number;
  timelineUnit: "hours" | "days";
  isSequential: boolean;
  sequenceOrder: number;
  createdAt: string;
}

export class FmsManagerService {
  constructor(private dbPool: any) {}

  async createFms(dto: CreateFmsManagerDto): Promise<FmsManagerEntity> {
    const id = uuidv4();
    const query = `
      INSERT INTO fms_managers (
        id, name, sop_video_link, description, global_pc, t_field, conditional_step, consolidated_entry
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    `;
    const params = [
      id,
      dto.name,
      dto.sopVideoLink || null,
      dto.description,
      null,
      null,
      false,
      false
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
    await this.dbPool.query("DELETE FROM fms_managers WHERE id = ?", [fmsId]);
  }

  private mapToEntity(row: any): FmsManagerEntity {
    return {
      id: row.id,
      name: row.name,
      sopVideoLink: row.sop_video_link,
      description: row.description,
      globalPc: row.global_pc,
      tField: row.t_field,
      createdAt: row.created_at,
    };
  }

  async addStep(fmsId: string, dto: CreateFmsStepDto): Promise<FmsStepEntity> {
    const id = uuidv4();
    const query = `
      INSERT INTO fms_steps (
        id, fms_id, step_name, doer_employee_id, timeline_hours, timeline_unit, is_sequential, sequence_order
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    `;
    const params = [
      id,
      fmsId,
      dto.stepName,
      dto.doerEmployeeId,
      dto.timelineHours,
      dto.timelineUnit,
      dto.isSequential,
      dto.sequenceOrder
    ];

    await this.dbPool.query(query, params);

    const [rows] = await this.dbPool.query("SELECT * FROM fms_steps WHERE id = ?", [id]);
    return this.mapToStepEntity(rows[0]);
  }

  async getSteps(fmsId: string): Promise<FmsStepEntity[]> {
    const [rows] = await this.dbPool.query("SELECT * FROM fms_steps WHERE fms_id = ? ORDER BY sequence_order ASC, created_at ASC", [fmsId]);
    return rows.map(this.mapToStepEntity);
  }

  async deleteStep(stepId: string): Promise<void> {
    await this.dbPool.query("DELETE FROM fms_steps WHERE id = ?", [stepId]);
  }

  private mapToStepEntity(row: any): FmsStepEntity {
    return {
      id: row.id,
      fmsId: row.fms_id,
      stepName: row.step_name,
      doerEmployeeId: row.doer_employee_id,
      timelineHours: parseFloat(row.timeline_hours),
      timelineUnit: row.timeline_unit,
      isSequential: !!row.is_sequential,
      sequenceOrder: row.sequence_order,
      createdAt: row.created_at,
    };
  }
}
