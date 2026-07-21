"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ComplaintController = void 0;
class ComplaintController {
    constructor(service) {
        this.service = service;
        this.create = async (req, res) => {
            try {
                const complaint = await this.service.create(req.body);
                res.status(201).json(complaint);
            }
            catch (err) {
                console.error("COMPLAINT CREATION ERROR:", err);
                res.status(400).json({ error: { message: err.message } });
            }
        };
        this.list = async (req, res) => {
            try {
                const { search, status, priority, buyerId, assignedTo } = req.query;
                const result = await this.service.list({
                    search: search,
                    status: status,
                    priority: priority,
                    buyerId: buyerId,
                    assignedTo: assignedTo
                });
                res.json(result);
            }
            catch (err) {
                res.status(500).json({ error: { message: err.message } });
            }
        };
        this.getById = async (req, res) => {
            try {
                const complaint = await this.service.getById(req.params.id);
                res.json(complaint);
            }
            catch (err) {
                res.status(404).json({ error: { message: err.message } });
            }
        };
        this.update = async (req, res) => {
            try {
                const complaint = await this.service.update(req.params.id, req.body);
                res.json(complaint);
            }
            catch (err) {
                res.status(400).json({ error: { message: err.message } });
            }
        };
        this.delete = async (req, res) => {
            try {
                await this.service.delete(req.params.id);
                res.status(204).send();
            }
            catch (err) {
                res.status(400).json({ error: { message: err.message } });
            }
        };
    }
}
exports.ComplaintController = ComplaintController;
//# sourceMappingURL=ComplaintController.js.map