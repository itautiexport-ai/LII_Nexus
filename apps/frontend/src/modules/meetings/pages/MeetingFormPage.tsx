import { FormEvent, useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { meetingApi, MEETING_TYPE_LABELS, MeetingType } from "../api/meetingApi";
import { employeesApi, EmployeeRecord, EmployeeDropdownRecord } from "../../admin/organization/employees/api/employeesApi";

export default function MeetingFormPage() {
  const navigate = useNavigate();
  const [employees, setEmployees] = useState<EmployeeDropdownRecord[]>([]);
  const [form, setForm] = useState({ meetingType: "weekly_executive" as MeetingType, title: "", meetingDate: new Date().toISOString().slice(0, 10), attendeeIds: [] as string[], agendaText: "" });
  const [error, setError] = useState<string | null>(null);

  useEffect(() => { employeesApi.listForDropdown().then(setEmployees); }, []);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setError(null);
    try {
      const meeting = await meetingApi.create({
        meetingType: form.meetingType, title: form.title, meetingDate: form.meetingDate,
        attendeeIds: form.attendeeIds,
        agendaItems: form.agendaText.split("\n").map((l) => l.trim()).filter(Boolean),
      });
      navigate(`/admin/meetings/${meeting.id}`);
    } catch (err: any) {
      setError(err?.response?.data?.error?.message ?? "Failed to create meeting.");
    }
  }

  return (
    <div style={{ maxWidth: 520 }}>
      <h1 style={{ fontSize: 20, marginBottom: 16 }}>Schedule a Meeting</h1>
      <form onSubmit={handleSubmit}>
        <label style={{ fontSize: 13, display: "block", marginBottom: 8 }}>Meeting Type
          <select value={form.meetingType} onChange={(e) => setForm({ ...form, meetingType: e.target.value as MeetingType })} style={{ display: "block", width: "100%", padding: 6, marginTop: 4 }}>
            {Object.entries(MEETING_TYPE_LABELS).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
          </select>
        </label>
        <label style={{ fontSize: 13, display: "block", marginBottom: 8 }}>Title
          <input required value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} style={{ display: "block", width: "100%", padding: 6, marginTop: 4 }} />
        </label>
        <label style={{ fontSize: 13, display: "block", marginBottom: 8 }}>Date
          <input type="date" required value={form.meetingDate} onChange={(e) => setForm({ ...form, meetingDate: e.target.value })} style={{ display: "block", width: "100%", padding: 6, marginTop: 4 }} />
        </label>
        <label style={{ fontSize: 13, display: "block", marginBottom: 8 }}>Attendees
          <select multiple value={form.attendeeIds} onChange={(e) => setForm({ ...form, attendeeIds: Array.from(e.target.selectedOptions, (o) => o.value) })} style={{ display: "block", width: "100%", height: 100, marginTop: 4 }}>
            {employees.map((e) => <option key={e.id} value={e.id}>{e.fullName}</option>)}
          </select>
        </label>
        <label style={{ fontSize: 13, display: "block", marginBottom: 8 }}>Agenda (one item per line)
          <textarea value={form.agendaText} onChange={(e) => setForm({ ...form, agendaText: e.target.value })} rows={4} style={{ display: "block", width: "100%", padding: 6, marginTop: 4, boxSizing: "border-box" }} />
        </label>
        {error && <p style={{ color: "crimson", fontSize: 13 }}>{error}</p>}
        <button type="submit">Create Meeting</button>
      </form>
    </div>
  );
}
