"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ComplaintService = void 0;
class ComplaintService {
    constructor(repo) {
        this.repo = repo;
    }
    async create(input) {
        const complaintNumber = await this.repo.generateComplaintNumber();
        return this.repo.create({
            complaintNumber,
            ...input
        });
    }
    async getById(id) {
        const complaint = await this.repo.findById(id);
        if (!complaint)
            throw new Error("Complaint not found");
        return complaint;
    }
    async list(params) {
        return this.repo.list(params);
    }
    async update(id, changes) {
        return this.repo.update(id, changes);
    }
    async delete(id) {
        await this.repo.remove(id);
    }
}
exports.ComplaintService = ComplaintService;
//# sourceMappingURL=ComplaintService.js.map