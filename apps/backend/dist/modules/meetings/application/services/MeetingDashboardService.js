"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.MeetingDashboardService = void 0;
const connection_1 = require("../../../../infrastructure/database/mysql/connection");
class MeetingDashboardService {
    constructor(repo) {
        this.repo = repo;
    }
    async getOverview() {
        const [pending, completed] = await Promise.all([this.repo.listPendingActions(), this.repo.listCompletedActions()]);
        const overdue = pending.filter((a) => a.status === "delayed");
        const [upcomingRows] = await connection_1.pool.query("SELECT id, title, meeting_type, meeting_date FROM meetings WHERE deleted_at IS NULL AND status = 'scheduled' AND meeting_date >= CURDATE() ORDER BY meeting_date ASC LIMIT 10");
        const [byTypeRows] = await connection_1.pool.query("SELECT meeting_type, COUNT(*) as count FROM meetings WHERE deleted_at IS NULL GROUP BY meeting_type");
        return {
            pendingActionsCount: pending.length,
            completedActionsCount: completed.length,
            overdueActionsCount: overdue.length,
            overdueActions: overdue.slice(0, 10),
            upcomingMeetings: upcomingRows.map((r) => ({ id: r.id, title: r.title, meetingType: r.meeting_type, meetingDate: r.meeting_date })),
            meetingCountByType: byTypeRows.map((r) => ({ meetingType: r.meeting_type, count: Number(r.count) })),
        };
    }
}
exports.MeetingDashboardService = MeetingDashboardService;
//# sourceMappingURL=MeetingDashboardService.js.map