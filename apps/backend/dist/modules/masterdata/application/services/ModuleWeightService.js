"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ModuleWeightService = void 0;
const connection_1 = require("../../../../infrastructure/database/mysql/connection");
class ModuleWeightService {
    static async getWeights() {
        const [rows] = await connection_1.pool.query("SELECT * FROM module_weights LIMIT 1");
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
    static async updateWeights(fmsWeight, checklistWeight, delegationWeight, hodWeight, hrWeight) {
        const [rows] = await connection_1.pool.query("SELECT id FROM module_weights LIMIT 1");
        if (rows.length > 0) {
            await connection_1.pool.query("UPDATE module_weights SET fms_weight = ?, checklist_weight = ?, delegation_weight = ?, hod_weight = ?, hr_weight = ? WHERE id = ?", [fmsWeight, checklistWeight, delegationWeight, hodWeight, hrWeight, rows[0].id]);
        }
        else {
            await connection_1.pool.query("INSERT INTO module_weights (fms_weight, checklist_weight, delegation_weight, hod_weight, hr_weight) VALUES (?, ?, ?, ?, ?)", [fmsWeight, checklistWeight, delegationWeight, hodWeight, hrWeight]);
        }
        return this.getWeights();
    }
}
exports.ModuleWeightService = ModuleWeightService;
//# sourceMappingURL=ModuleWeightService.js.map