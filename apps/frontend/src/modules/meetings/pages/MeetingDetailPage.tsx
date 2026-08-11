import { FormEvent, useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import { meetingApi, MeetingDetail, ReviewType, REVIEW_TYPES } from "../api/meetingApi";
import { employeesApi, EmployeeRecord } from "../../admin/organization/employees/api/employeesApi";
import PermissionGate from "../../../shared/guards/PermissionGate";

const priorityColors: Record<string, string> = { low: "#999", medium: "#4a90d9", high: "#e08e0b", urgent: "#c0392b" };
const statusColors: Record<string, string> = { pending: "#4a4a4a", running: "#4a90d9", completed: "#1a7f37", delayed: "#c0392b" };

export default function MeetingDetailPage() {
  const { id } = useParams<{ id: string }>();
  const [meeting, setMeeting] = useState<MeetingDetail | null>(null);
  const [employees, setEmployees] = useState<EmployeeRecord[]>([]);
  const [decisionText, setDecisionText] = useState("");
  const [reviewNotes, setReviewNotes] = useState<Record<ReviewType, string>>({} as any);
  const [actionForm, setActionForm] = useState({ description: "", assignedTo: "", targetDate: "", priority: "medium" });
  const [error, setError] = useState<string | null>(null);

  async function load() {
    if (!id) return;
    const [m, e] = await Promise.all([meetingApi.getById(id), employeesApi.listForDropdown()]);
    setMeeting(m);
    setEmployees(e);
    const notes: Record<string, string> = {};
    m.reviewSections.forEach((s) => { notes[s.reviewType] = s.notes ?? ""; });
    setReviewNotes(notes as any);
  }
  // eslint-disable-next-line react-hooks/exhaustive-deps -- reload only on route param change
  useEffect(() => { load(); }, [id]);

  async function handleAddDecision(e: FormEvent) {
    e.preventDefault();
    if (!id || !decisionText) return;
    await meetingApi.addDecision(id, decisionText);
    setDecisionText("");
    await load();
  }

  async function handleSaveReviewSection(reviewType: ReviewType) {
    if (!id) return;
    await meetingApi.setReviewSection(id, reviewType, reviewNotes[reviewType]);
    await load();
  }

  async function handleCreateAction(e: FormEvent) {
    e.preventDefault();
    if (!id) return;
    setError(null);
    try {
      await meetingApi.createAction(id, actionForm.description, actionForm.assignedTo, actionForm.targetDate, actionForm.priority);
      setActionForm({ description: "", assignedTo: "", targetDate: "", priority: "medium" });
      await load();
    } catch (err: any) {
      setError(err?.response?.data?.error?.message ?? "Failed to create action. It becomes a real Delegated Task, so the assignee must be your direct report (or you need an override).");
    }
  }

  async function handleAddAttachment() {
    if (!id) return;
    const fileName = prompt("File name:");
    if (!fileName) return;
    await meetingApi.addAttachment(id, fileName, `https://files.example.com/${encodeURIComponent(fileName)}`);
    await load();
  }

  if (!meeting) return <p>Loading...</p>;

  return (
    <div>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 16, flexWrap: "wrap", gap: 8 }}>
        <div>
          <h1 style={{ fontSize: 20 }}>{meeting.title}</h1>
          <p style={{ fontSize: 13, color: "#777" }}>{meeting.meetingDate} · {meeting.status}{meeting.previousMeetingId && " · has a previous meeting linked"}</p>
        </div>
        <PermissionGate permission="meeting.mom.export">
          <button onClick={() => meetingApi.exportMomPdf(meeting.id, meeting.title)}>Export MOM to PDF</button>
        </PermissionGate>
      </div>
      {error && <p style={{ color: "crimson", fontSize: 13 }}>{error}</p>}

      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))", gap: 16, marginBottom: 20 }}>
        <div style={{ border: "1px solid #e0e0e0", borderRadius: 6, padding: 14 }}>
          <h3 style={{ fontSize: 13, color: "#888", marginBottom: 8 }}>Attendees</h3>
          {meeting.attendees.map((a) => <div key={a.employeeId} style={{ fontSize: 13, padding: "2px 0" }}>{a.fullName}</div>)}
          {meeting.attendees.length === 0 && <p style={{ fontSize: 12, color: "#999" }}>None recorded.</p>}
        </div>
        <div style={{ border: "1px solid #e0e0e0", borderRadius: 6, padding: 14 }}>
          <h3 style={{ fontSize: 13, color: "#888", marginBottom: 8 }}>Agenda</h3>
          {meeting.agendaItems.map((a, i) => <div key={a.id} style={{ fontSize: 13, padding: "2px 0" }}>{i + 1}. {a.itemText}</div>)}
          {meeting.agendaItems.length === 0 && <p style={{ fontSize: 12, color: "#999" }}>No agenda recorded.</p>}
        </div>
        <div style={{ border: "1px solid #e0e0e0", borderRadius: 6, padding: 14 }}>
          <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 8 }}>
            <h3 style={{ fontSize: 13, color: "#888" }}>Attachments</h3>
            <button onClick={handleAddAttachment} style={{ fontSize: 11 }}>+ Add</button>
          </div>
          {meeting.attachments.map((a) => <div key={a.id} style={{ fontSize: 12 }}>{a.fileName}</div>)}
          {meeting.attachments.length === 0 && <p style={{ fontSize: 12, color: "#999" }}>None yet.</p>}
        </div>
      </div>

      <h2 style={{ fontSize: 16, marginBottom: 12 }}>Review Sections</h2>
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(240px, 1fr))", gap: 12, marginBottom: 24 }}>
        {REVIEW_TYPES.map((rt) => (
          <div key={rt} style={{ border: "1px solid #e0e0e0", borderRadius: 6, padding: 12 }}>
            <strong style={{ fontSize: 12, textTransform: "capitalize" }}>{rt} Review</strong>
            <textarea value={reviewNotes[rt] ?? ""} onChange={(e) => setReviewNotes({ ...reviewNotes, [rt]: e.target.value })} rows={2} style={{ display: "block", width: "100%", padding: 6, marginTop: 6, boxSizing: "border-box", fontSize: 12 }} />
            <button onClick={() => handleSaveReviewSection(rt)} style={{ fontSize: 11, marginTop: 4 }}>Save</button>
          </div>
        ))}
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(320px, 1fr))", gap: 16 }}>
        <div style={{ border: "1px solid #e0e0e0", borderRadius: 6, padding: 14 }}>
          <h3 style={{ fontSize: 14, marginBottom: 8 }}>Decision Register</h3>
          <form onSubmit={handleAddDecision} style={{ display: "flex", gap: 6, marginBottom: 10 }}>
            <input placeholder="Record a decision..." value={decisionText} onChange={(e) => setDecisionText(e.target.value)} style={{ flex: 1, padding: 6 }} />
            <button type="submit">Add</button>
          </form>
          {meeting.decisions.map((d) => <div key={d.id} style={{ fontSize: 13, padding: "4px 0", borderTop: "1px solid #f0f0f0" }}>{d.decisionText}</div>)}
          {meeting.decisions.length === 0 && <p style={{ fontSize: 12, color: "#999" }}>No decisions recorded yet.</p>}
        </div>

        <div style={{ border: "1px solid #e0e0e0", borderRadius: 6, padding: 14 }}>
          <h3 style={{ fontSize: 14, marginBottom: 8 }}>Action Tracker</h3>
          <p style={{ fontSize: 11, color: "#999", marginBottom: 8 }}>Every action becomes a real Delegated Task — visible in the assignee's own Delegation list, with automatic reminders and escalation.</p>
          <form onSubmit={handleCreateAction} style={{ marginBottom: 10 }}>
            <input required placeholder="Action description" value={actionForm.description} onChange={(e) => setActionForm({ ...actionForm, description: e.target.value })} style={{ display: "block", width: "100%", padding: 6, marginBottom: 6, boxSizing: "border-box" }} />
            <div style={{ display: "flex", gap: 6, marginBottom: 6 }}>
              <select required value={actionForm.assignedTo} onChange={(e) => setActionForm({ ...actionForm, assignedTo: e.target.value })} style={{ padding: 6, flex: 1 }}>
                <option value="">— Assignee —</option>
                {employees.map((e) => <option key={e.id} value={e.id}>{e.fullName}</option>)}
              </select>
              <input type="date" required value={actionForm.targetDate} onChange={(e) => setActionForm({ ...actionForm, targetDate: e.target.value })} style={{ padding: 6 }} />
              <select value={actionForm.priority} onChange={(e) => setActionForm({ ...actionForm, priority: e.target.value })} style={{ padding: 6 }}>
                <option value="low">Low</option><option value="medium">Medium</option><option value="high">High</option><option value="urgent">Urgent</option>
              </select>
            </div>
            <button type="submit">+ Add Action</button>
          </form>
          {meeting.actions.map((a) => (
            <div key={a.id} style={{ fontSize: 13, padding: "6px 0", borderTop: "1px solid #f0f0f0" }}>
              <div style={{ display: "flex", justifyContent: "space-between" }}>
                <span>{a.description}</span>
                <span style={{ color: statusColors[a.status], fontWeight: 600, fontSize: 11 }}>{a.status}</span>
              </div>
              <div style={{ fontSize: 11, color: "#999" }}>{a.assigneeName} · due {a.targetDate} · <span style={{ color: priorityColors[a.priority] }}>{a.priority}</span></div>
            </div>
          ))}
          {meeting.actions.length === 0 && <p style={{ fontSize: 12, color: "#999" }}>No actions yet.</p>}
        </div>
      </div>
    </div>
  );
}
