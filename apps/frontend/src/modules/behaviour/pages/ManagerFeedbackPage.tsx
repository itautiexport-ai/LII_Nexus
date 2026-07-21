import { FormEvent, useEffect, useState } from "react";
import { behaviourApi } from "../api/behaviourApi";
import { factoryApi, DirectReport } from "../../factory/api/factoryApi";

function currentMonthKey() {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
}

export default function ManagerFeedbackPage() {
  const [directReports, setDirectReports] = useState<DirectReport[]>([]);
  const [form, setForm] = useState({ employeeId: "", rating: 3, comments: "" });
  const [history, setHistory] = useState<any[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  useEffect(() => { factoryApi.myDirectReports().then(setDirectReports); }, []);

  async function handleSelectEmployee(employeeId: string) {
    setForm({ ...form, employeeId });
    if (employeeId) setHistory(await behaviourApi.listFeedback(employeeId));
  }

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setError(null);
    setSuccess(false);
    try {
      await behaviourApi.submitFeedback(form.employeeId, "monthly", currentMonthKey(), form.rating, form.comments || undefined);
      setSuccess(true);
      setHistory(await behaviourApi.listFeedback(form.employeeId));
    } catch (err: any) {
      setError(err?.response?.data?.error?.message ?? "Failed to submit feedback.");
    }
  }

  return (
    <div style={{ maxWidth: 520 }}>
      <h1 style={{ fontSize: 20, marginBottom: 4 }}>Manager Feedback</h1>
      <p style={{ fontSize: 13, color: "#777", marginBottom: 16 }}>A qualitative signal for your direct reports' Behaviour Index — one rating per person per month.</p>

      <form onSubmit={handleSubmit}>
        <label style={{ fontSize: 13, display: "block", marginBottom: 8 }}>Direct Report
          <select required value={form.employeeId} onChange={(e) => handleSelectEmployee(e.target.value)} style={{ display: "block", width: "100%", padding: 6, marginTop: 4 }}>
            <option value="">— Select —</option>
            {directReports.map((r) => <option key={r.id} value={r.id}>{r.fullName}</option>)}
          </select>
        </label>
        <label style={{ fontSize: 13, display: "block", marginBottom: 8 }}>Rating (1-5)
          <input type="number" min={1} max={5} required value={form.rating} onChange={(e) => setForm({ ...form, rating: Number(e.target.value) })} style={{ display: "block", width: "100%", padding: 6, marginTop: 4 }} />
        </label>
        <label style={{ fontSize: 13, display: "block", marginBottom: 8 }}>Comments
          <textarea value={form.comments} onChange={(e) => setForm({ ...form, comments: e.target.value })} rows={3} style={{ display: "block", width: "100%", padding: 6, marginTop: 4, boxSizing: "border-box" }} />
        </label>
        {error && <p style={{ color: "crimson", fontSize: 13 }}>{error}</p>}
        {success && <p style={{ color: "#1a7f37", fontSize: 13 }}>Feedback saved for this month.</p>}
        <button type="submit">Submit Feedback</button>
      </form>

      {history.length > 0 && (
        <div style={{ marginTop: 24 }}>
          <h3 style={{ fontSize: 13, color: "#888", marginBottom: 8 }}>History</h3>
          {history.map((h) => (
            <div key={h.id} style={{ padding: "8px 0", borderBottom: "1px solid #f0f0f0", fontSize: 13 }}>
              <strong>{h.periodKey}</strong> — {h.rating}/5 {h.comments && <div style={{ color: "#666" }}>{h.comments}</div>}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
