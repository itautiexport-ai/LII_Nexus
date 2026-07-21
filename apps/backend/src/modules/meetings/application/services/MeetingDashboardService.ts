import { pool } from "../../../../infrastructure/database/mysql/connection";
import { IMeetingRepository } from "../../domain/repositories/IMeetingRepository";

export class MeetingDashboardService {
  constructor(private readonly repo: IMeetingRepository) {}

  async getOverview() {
    const [pending, completed] = await Promise.all([this.repo.listPendingActions(), this.repo.listCompletedActions()]);
    const overdue = pending.filter((a) => a.status === "delayed");

    const [upcomingRows] = await pool.query<any[]>(
      "SELECT id, title, meeting_type, meeting_date FROM meetings WHERE deleted_at IS NULL AND status = 'scheduled' AND meeting_date >= CURDATE() ORDER BY meeting_date ASC LIMIT 10"
    );
    const [byTypeRows] = await pool.query<any[]>(
      "SELECT meeting_type, COUNT(*) as count FROM meetings WHERE deleted_at IS NULL GROUP BY meeting_type"
    );

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
