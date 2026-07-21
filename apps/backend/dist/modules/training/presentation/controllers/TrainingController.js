"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.TrainingController = void 0;
class TrainingController {
    constructor(service) {
        this.service = service;
    }
    async listCalendars(req, res) {
        try {
            const c = await this.service.getCalendars();
            res.json({ success: true, data: c });
        }
        catch (error) {
            console.error(error);
            res.status(500).json({ success: false, message: 'Server error' });
        }
    }
    async createCalendar(req, res) {
        try {
            const { financial_year } = req.body;
            const c = await this.service.createCalendar(financial_year);
            res.json({ success: true, data: c });
        }
        catch (error) {
            console.error(error);
            res.status(500).json({ success: false, message: 'Server error' });
        }
    }
    async listSessions(req, res) {
        try {
            const { calendar_id } = req.query;
            const s = await this.service.getSessions(calendar_id);
            res.json({ success: true, data: s });
        }
        catch (error) {
            console.error(error);
            res.status(500).json({ success: false, message: 'Server error' });
        }
    }
    async createSession(req, res) {
        try {
            const session = req.body;
            const s = await this.service.createSession(session);
            res.json({ success: true, data: s });
        }
        catch (error) {
            console.error(error);
            res.status(500).json({ success: false, message: 'Server error' });
        }
    }
    async updateSessionStatus(req, res) {
        try {
            const { id } = req.params;
            const { status } = req.body;
            await this.service.updateSessionStatus(id, status);
            res.json({ success: true });
        }
        catch (error) {
            console.error(error);
            res.status(500).json({ success: false, message: 'Server error' });
        }
    }
    async deleteSession(req, res) {
        try {
            const { id } = req.params;
            await this.service.deleteSession(id);
            res.json({ success: true });
        }
        catch (error) {
            console.error(error);
            res.status(500).json({ success: false, message: 'Server error' });
        }
    }
}
exports.TrainingController = TrainingController;
//# sourceMappingURL=TrainingController.js.map