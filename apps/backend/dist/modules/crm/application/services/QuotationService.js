"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.QuotationService = void 0;
class QuotationService {
    constructor(repo) {
        this.repo = repo;
    }
    async listQuotations() {
        return await this.repo.listQuotations();
    }
    async createQuotation(data) {
        return await this.repo.createQuotation(data);
    }
    async updateStatus(id, status) {
        await this.repo.updateQuotationStatus(id, status);
    }
    async addQuote(quotationId, data) {
        return await this.repo.addQuotationQuote({ quotationId, ...data });
    }
    async listQuotes(quotationId) {
        return await this.repo.listQuotationQuotes(quotationId);
    }
}
exports.QuotationService = QuotationService;
//# sourceMappingURL=QuotationService.js.map