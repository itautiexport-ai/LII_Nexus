import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { meetingApi, MEETING_TYPE_LABELS, MeetingType } from "../api/meetingApi";

export default function MeetingDashboardPage() {
  const navigate = useNavigate();
  const [data, setData] = useState<any>(null);

  useEffect(() => { meetingApi.dashboard().then(setData); }, []);

  if (!data) return <p>Loading...</p>;

  return (
    <div>
      <h1 style={{ fontSize: 20, marginBottom: 16 }}>Meetings Dashboard</h1>

      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(160px, 1fr))", gap: 16, marginBottom: 24 }}>
        <div style={{ border: "1px solid #e0e0e0", borderRadius: 8, padding: 16 }}>
          <div style={{ fontSize: 12, color: "#888" }}>Pending Actions</div>
          <div style={{ fontSize: 28, fontWeight: 700 }}>{data.pendingActionsCount}</div>
        </div>
        <div style={{ border: "1px solid #e0e0e0", borderRadius: 8, padding: 16 }}>
          <div style={{ fontSize: 12, color: "#888" }}>Completed Actions</div>
          <div style={{ fontSize: 28, fontWeight: 700, color: "#1a7f37" }}>{data.completedActionsCount}</div>
        </div>
        <div style={{ border: "1px solid #e0e0e0", borderRadius: 8, padding: 16 }}>
          <div style={{ fontSize: 12, color: "#888" }}>Overdue Actions</div>
          <div style={{ fontSize: 28, fontWeight: 700, color: data.overdueActionsCount > 0 ? "#c0392b" : "#1a7f37" }}>{data.overdueActionsCount}</div>
        </div>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(300px, 1fr))", gap: 16 }}>
        <div style={{ border: "1px solid #e0e0e0", borderRadius: 6, padding: 14 }}>
          <h3 style={{ fontSize: 13, color: "#888", marginBottom: 8 }}>Upcoming Meetings</h3>
          {data.upcomingMeetings.map((m: any) => (
            <div key={m.id} style={{ fontSize: 13, padding: "6px 0", borderTop: "1px solid #f0f0f0", cursor: "pointer" }} onClick={() => navigate(`/admin/meetings/${m.id}`)}>
              {m.title} <span style={{ color: "#999", fontSize: 11 }}>· {MEETING_TYPE_LABELS[m.meetingType as MeetingType]} · {m.meetingDate}</span>
            </div>
          ))}
          {data.upcomingMeetings.length === 0 && <p style={{ fontSize: 12, color: "#999" }}>None scheduled.</p>}
        </div>

        <div style={{ border: "1px solid #e0e0e0", borderRadius: 6, padding: 14 }}>
          <h3 style={{ fontSize: 13, color: "#888", marginBottom: 8 }}>Overdue Actions</h3>
          {data.overdueActions.map((a: any) => (
            <div key={a.id} style={{ fontSize: 13, padding: "6px 0", borderTop: "1px solid #f0f0f0" }}>
              {a.description} <span style={{ color: "#999", fontSize: 11 }}>· {a.assigneeName} · was due {a.targetDate}</span>
            </div>
          ))}
          {data.overdueActions.length === 0 && <p style={{ fontSize: 12, color: "#1a7f37" }}>Nothing overdue.</p>}
        </div>

        <div style={{ border: "1px solid #e0e0e0", borderRadius: 6, padding: 14 }}>
          <h3 style={{ fontSize: 13, color: "#888", marginBottom: 8 }}>Meetings by Type</h3>
          {data.meetingCountByType.map((m: any) => (
            <div key={m.meetingType} style={{ fontSize: 13, padding: "4px 0" }}>{MEETING_TYPE_LABELS[m.meetingType as MeetingType]}: <strong>{m.count}</strong></div>
          ))}
        </div>
      </div>
    </div>
  );
}
