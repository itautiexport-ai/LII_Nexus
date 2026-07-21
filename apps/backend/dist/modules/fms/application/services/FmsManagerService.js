"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.FmsManagerService = void 0;
const uuid_1 = require("uuid");
class FmsManagerService {
    constructor(dbPool) {
        this.dbPool = dbPool;
    }
    async createFms(dto) {
        const id = (0, uuid_1.v4)();
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
    async getAllFms() {
        const [rows] = await this.dbPool.query("SELECT * FROM fms_managers ORDER BY created_at DESC");
        return rows.map(this.mapToEntity);
    }
    async deleteFms(fmsId) {
        await this.dbPool.query("DELETE FROM fms_managers WHERE id = ?", [fmsId]);
    }
    mapToEntity(row) {
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
    async addStep(fmsId, dto) {
        const id = (0, uuid_1.v4)();
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
    async getSteps(fmsId) {
        const [rows] = await this.dbPool.query("SELECT * FROM fms_steps WHERE fms_id = ? ORDER BY sequence_order ASC, created_at ASC", [fmsId]);
        return rows.map(this.mapToStepEntity);
    }
    async deleteStep(stepId) {
        await this.dbPool.query("DELETE FROM fms_steps WHERE id = ?", [stepId]);
    }
    mapToStepEntity(row) {
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
exports.FmsManagerService = FmsManagerService;
//# sourceMappingURL=FmsManagerService.js.map