"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.KraController = void 0;
const KraRepository_1 = require("../../infrastructure/repositories/KraRepository");
const repo = new KraRepository_1.KraRepository();
class KraController {
    static async list(req, res) {
        try {
            const { departmentId } = req.query;
            const kras = await repo.findAll(departmentId);
            res.json({ success: true, data: kras });
        }
        catch (err) {
            res.status(500).json({ success: false, error: err.message });
        }
    }
    static async create(req, res) {
        try {
            const { departmentId, designationId, title, description, attachmentUrl } = req.body;
            if (!departmentId || !title) {
                return res.status(400).json({ success: false, error: "Missing required fields" });
            }
            const kra = await repo.create({ departmentId, designationId, title, description, attachmentUrl });
            res.status(201).json({ success: true, data: kra });
        }
        catch (err) {
            res.status(500).json({ success: false, error: err.message });
        }
    }
    static async remove(req, res) {
        try {
            const { id } = req.params;
            await repo.delete(id);
            res.json({ success: true });
        }
        catch (err) {
            res.status(500).json({ success: false, error: err.message });
        }
    }
}
exports.KraController = KraController;
//# sourceMappingURL=KraController.js.map