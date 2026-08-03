import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { meetingApi, MeetingRecord, MEETING_TYPE_LABELS, MeetingType } from "../api/meetingApi";
import PermissionGate from "../../../shared/guards/PermissionGate";

const statusColors: Record<string, string> = { scheduled: "#4a90d9", completed: "#1a7f37", cancelled: "#999" };

export default function MeetingsListPage() {
  const navigate = useNavigate();
  const [items, setItems] = useState<MeetingRecord[]>([]);
  const [search, setSearch] = useState("");
  const [typeFilter, setTypeFilter] = useState("");

  async function load() {
    const res = await meetingApi.list({ search: search || undefined, meetingType: typeFilter || undefined });
    setItems(res.items);
  }
  // eslint-disable-next-line react-hooks/exhaustive-deps -- re-runs on filter changes only
  useEffect(() => { load(); }, [search, typeFilter]);

  return (
    <div>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16 }}>
        <h1 style={{ fontSize: 20 }}>Executive Meetings</h1>
        <PermissionGate permission="meeting.create">
          <button onClick={() => navigate("/admin/meetings/new")}>+ New Meeting</button>
        </PermissionGate>
      </div>

      <div style={{ display: "flex", gap: 8, marginBottom: 16 }}>
        <input placeholder="Search title or notes..." value={search} onChange={(e) => setSearch(e.target.value)} style={{ padding: 6, flex: 1 }} />
        <select value={typeFilter} onChange={(e) => setTypeFilter(e.target.value)} style={{ padding: 6 }}>
          <option value="">All types</option>
          {Object.entries(MEETING_TYPE_LABELS).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
        </select>
      </div>

      <table style={{ width: "100%", borderCollapse: "collapse" }}>
        <thead><tr style={{ textAlign: "left", borderBottom: "1px solid #ddd" }}><th style={{ padding: 8 }}>Title</th><th style={{ padding: 8 }}>Type</th><th style={{ padding: 8 }}>Date</th><th style={{ padding: 8 }}>Status</th></tr></thead>
        <tbody>
          {items.map((m) => (
            <tr key={m.id} style={{ borderBottom: "1px solid #eee", cursor: "pointer" }} onClick={() => navigate(`/admin/meetings/${m.id}`)}>
              <td style={{ padding: 8, fontWeight: 600 }}>{m.title}</td>
              <td style={{ padding: 8 }}>{MEETING_TYPE_LABELS[m.meetingType as MeetingType]}</td>
              <td style={{ padding: 8 }}>{m.meetingDate}</td>
              <td style={{ padding: 8 }}><span style={{ color: statusColors[m.status], fontWeight: 600 }}>{m.status}</span></td>
            </tr>
          ))}
          {items.length === 0 && <tr><td colSpan={4} style={{ padding: 16, textAlign: "center", color: "#999" }}>No meetings found.</td></tr>}
        </tbody>
      </table>
    </div>
  );
}
