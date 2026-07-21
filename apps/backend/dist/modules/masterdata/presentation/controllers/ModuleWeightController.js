"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ModuleWeightController = void 0;
const ModuleWeightService_1 = require("../../application/services/ModuleWeightService");
class ModuleWeightController {
    static async getWeights(req, res) {
        const weights = await ModuleWeightService_1.ModuleWeightService.getWeights();
        res.json({ data: weights });
    }
    static async updateWeights(req, res) {
        const { fmsWeight, checklistWeight, delegationWeight, hodWeight, hrWeight } = req.body;
        if (fmsWeight === undefined || checklistWeight === undefined || delegationWeight === undefined
            || hodWeight === undefined || hrWeight === undefined) {
            return res.status(400).json({ error: { message: "fmsWeight, checklistWeight, delegationWeight, hodWeight, and hrWeight are required" } });
        }
        const weights = await ModuleWeightService_1.ModuleWeightService.updateWeights(Number(fmsWeight), Number(checklistWeight), Number(delegationWeight), Number(hodWeight), Number(hrWeight));
        res.json({ data: weights, message: "Weights updated successfully" });
    }
}
exports.ModuleWeightController = ModuleWeightController;
//# sourceMappingURL=ModuleWeightController.js.map