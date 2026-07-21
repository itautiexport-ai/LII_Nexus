"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.NoticeController = void 0;
class NoticeController {
    constructor(service) {
        this.service = service;
    }
    async createNotice(req, res) {
        try {
            const notice = await this.service.createNotice(req.body);
            res.status(201).json({ success: true, data: notice });
        }
        catch (error) {
            console.error(error);
            res.status(500).json({ success: false, message: 'Server error' });
        }
    }
    async getNotices(req, res) {
        try {
            const notices = await this.service.getNotices();
            res.json({ success: true, data: notices });
        }
        catch (error) {
            res.status(500).json({ success: false, error: { message: error.message } });
        }
    }
    async deleteNotice(req, res) {
        try {
            const { id } = req.params;
            await this.service.deleteNotice(id);
            res.json({ success: true, message: 'Notice deleted successfully' });
        }
        catch (error) {
            res.status(500).json({ success: false, error: { message: error.message } });
        }
    }
}
exports.NoticeController = NoticeController;
//# sourceMappingURL=NoticeController.js.map