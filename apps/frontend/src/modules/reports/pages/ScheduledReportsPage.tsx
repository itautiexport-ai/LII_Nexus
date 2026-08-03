import { FormEvent, useEffect, useState } from "react";
import { reportApi, REPORT_TYPE_LABELS, ReportType, ScheduledReportRecord } from "../api/reportApi";
import PermissionGate from "../../../shared/guards/PermissionGate";

const REPORT_TYPES = Object.keys(REPORT_TYPE_LABELS) as ReportType[];

export default function ScheduledReportsPage() {
  const [schedules, setSchedules] = useState<ScheduledReportRecord[]>([]);
  const [form, setForm] = useState({ reportType: "executive_reports" as ReportType, name: "", frequency: "weekly" as "daily" | "weekly" | "monthly" });
  const [runResult, setRunResult] = useState<any>(null);

  async function load() { setSchedules(await reportApi.listScheduled()); }
  useEffect(() => { load(); }, []);

  async function handleCreate(e: FormEvent) {
    e.preventDefault();
    await reportApi.createScheduled(form.reportType, form.name, {}, form.frequency);
    setForm({ ...form, name: "" });
    await load();
  }

  async function handleToggle(s: ScheduledReportRecord) {
    if (s.status === "active") await reportApi.pauseScheduled(s.id);
    else await reportApi.resumeScheduled(s.id);
    await load();
  }

  async function handleDelete(id: string) {
    await reportApi.deleteScheduled(id);
    await load();
  }

  async function handleRunDue() {
    setRunResult(await reportApi.runDueScheduled());
    await load();
  }

  return (
    <div>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 4 }}>
        <h1 style={{ fontSize: 20 }}>Scheduled Reports</h1>
        <PermissionGate permission="report.schedule.run">
          <button onClick={handleRunDue}>Run Due Reports Now</button>
        </PermissionGate>
      </div>
      <p style={{ fontSize: 13, color: "#777", marginBottom: 16 }}>
        There is no background job scheduler in this system — reports due to run are generated when this check is triggered
        (manually here, or automatically whenever an admin runs it). A notification is raised for you when your report is ready.
      </p>

      {runResult && (
        <div style={{ border: "1px solid #e0e0e0", borderRadius: 6, padding: 12, marginBottom: 16, fontSize: 13 }}>
          {runResult.length === 0 ? "Nothing was due." : runResult.map((r: any) => <div key={r.scheduledReportId}>{REPORT_TYPE_LABELS[r.reportType as ReportType]}: {r.rowCount} row(s) generated</div>)}
        </div>
      )}

      <form onSubmit={handleCreate} style={{ display: "flex", gap: 8, marginBottom: 20, flexWrap: "wrap" }}>
        <select value={form.reportType} onChange={(e) => setForm({ ...form, reportType: e.target.value as ReportType })} style={{ padding: 6 }}>
          {REPORT_TYPES.map((t) => <option key={t} value={t}>{REPORT_TYPE_LABELS[t]}</option>)}
        </select>
        <input required placeholder="Name" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} style={{ padding: 6 }} />
        <select value={form.frequency} onChange={(e) => setForm({ ...form, frequency: e.target.value as any })} style={{ padding: 6 }}>
          <option value="daily">Daily</option><option value="weekly">Weekly</option><option value="monthly">Monthly</option>
        </select>
        <button type="submit">Schedule</button>
      </form>

      <table style={{ width: "100%", borderCollapse: "collapse" }}>
        <thead><tr style={{ textAlign: "left", borderBottom: "1px solid #ddd" }}>
          <th style={{ padding: 8 }}>Name</th><th style={{ padding: 8 }}>Report</th><th style={{ padding: 8 }}>Frequency</th>
          <th style={{ padding: 8 }}>Next Due</th><th style={{ padding: 8 }}>Status</th><th style={{ padding: 8 }}></th>
        </tr></thead>
        <tbody>
          {schedules.map((s) => (
            <tr key={s.id} style={{ borderBottom: "1px solid #f0f0f0" }}>
              <td style={{ padding: 8 }}>{s.name}</td>
              <td style={{ padding: 8 }}>{REPORT_TYPE_LABELS[s.reportType]}</td>
              <td style={{ padding: 8, textTransform: "capitalize" }}>{s.frequency}</td>
              <td style={{ padding: 8, fontSize: 12 }}>{new Date(s.nextDueAt).toLocaleString()}</td>
              <td style={{ padding: 8 }}>{s.status}</td>
              <td style={{ padding: 8, display: "flex", gap: 6 }}>
                <button onClick={() => handleToggle(s)}>{s.status === "active" ? "Pause" : "Resume"}</button>
                <button onClick={() => handleDelete(s.id)}>Delete</button>
              </td>
            </tr>
          ))}
          {schedules.length === 0 && <tr><td colSpan={6} style={{ padding: 16, textAlign: "center", color: "#999" }}>No scheduled reports.</td></tr>}
        </tbody>
      </table>
    </div>
  );
}
