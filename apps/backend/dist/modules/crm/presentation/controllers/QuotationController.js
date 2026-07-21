"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.QuotationController = void 0;
class QuotationController {
    constructor(service) {
        this.service = service;
    }
    async listQuotations(req, res) {
        const data = await this.service.listQuotations();
        res.json({ success: true, data });
    }
    async createQuotation(req, res) {
        const data = await this.service.createQuotation(req.body);
        res.json({ success: true, data });
    }
    async updateStatus(req, res) {
        await this.service.updateStatus(req.params.id, req.body.status);
        res.json({ success: true });
    }
    async addQuote(req, res) {
        const data = await this.service.addQuote(req.params.id, req.body);
        res.json({ success: true, data });
    }
    async listQuotes(req, res) {
        const data = await this.service.listQuotes(req.params.id);
        res.json({ success: true, data });
    }
}
exports.QuotationController = QuotationController;
//# sourceMappingURL=QuotationController.js.map