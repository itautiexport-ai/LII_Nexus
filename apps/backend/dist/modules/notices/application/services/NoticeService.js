"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.NoticeService = void 0;
class NoticeService {
    constructor(repo) {
        this.repo = repo;
    }
    async createNotice(notice) {
        return this.repo.createNotice(notice);
    }
    async getNotices() {
        return this.repo.getNotices();
    }
    async deleteNotice(id) {
        return this.repo.deleteNotice(id);
    }
}
exports.NoticeService = NoticeService;
//# sourceMappingURL=NoticeService.js.map