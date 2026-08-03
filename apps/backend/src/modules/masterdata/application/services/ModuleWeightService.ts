import { pool } from "../../../../infrastructure/database/mysql/connection";

export class ModuleWeightService {
  static async getWeights() {
    const [rows] = await pool.query<any[]>("SELECT * FROM module_weights LIMIT 1");
    if (rows.length === 0) {
      return { fmsWeight: 20, checklistWeight: 20, delegationWeight: 20, hodWeight: 20, hrWeight: 20 };
    }
    return {
      fmsWeight: parseFloat(rows[0].fms_weight),
      checklistWeight: parseFloat(rows[0].checklist_weight),
      delegationWeight: parseFloat(rows[0].delegation_weight),
      hodWeight: parseFloat(rows[0].hod_weight ?? 20),
      hrWeight: parseFloat(rows[0].hr_weight ?? 20),
    };
  }

  static async updateWeights(
    fmsWeight: number,
    checklistWeight: number,
    delegationWeight: number,
    hodWeight: number,
    hrWeight: number
  ) {
    const [rows] = await pool.query<any[]>("SELECT id FROM module_weights LIMIT 1");
    if (rows.length > 0) {
      await pool.query(
        "UPDATE module_weights SET fms_weight = ?, checklist_weight = ?, delegation_weight = ?, hod_weight = ?, hr_weight = ? WHERE id = ?",
        [fmsWeight, checklistWeight, delegationWeight, hodWeight, hrWeight, rows[0].id]
      );
    } else {
      await pool.query(
        "INSERT INTO module_weights (fms_weight, checklist_weight, delegation_weight, hod_weight, hr_weight) VALUES (?, ?, ?, ?, ?)",
        [fmsWeight, checklistWeight, delegationWeight, hodWeight, hrWeight]
      );
    }
    return this.getWeights();
  }
}
