"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.TrainingService = void 0;
class TrainingService {
    constructor(repo) {
        this.repo = repo;
    }
    async getCalendars() {
        return this.repo.listCalendars();
    }
    async createCalendar(financial_year) {
        return this.repo.createCalendar(financial_year);
    }
    async getSessions(calendar_id) {
        return this.repo.listSessions(calendar_id);
    }
    async createSession(session) {
        return this.repo.createSession(session);
    }
    async updateSessionStatus(id, status) {
        return this.repo.updateSessionStatus(id, status);
    }
    async deleteSession(id) {
        return this.repo.deleteSession(id);
    }
}
exports.TrainingService = TrainingService;
//# sourceMappingURL=TrainingService.js.map