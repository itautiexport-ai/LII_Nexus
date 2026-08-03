import { FormEvent, useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { flowchartApi, WorkflowRunRecord } from "../api/flowchartApi";
import { workflowApi, WorkflowSummary } from "../../../workflow/api/workflowApi";
import PermissionGate from "../../../../shared/guards/PermissionGate";

const statusColors: Record<string, string> = { in_progress: "#4a90d9", completed: "#1a7f37", cancelled: "#999" };

export default function FlowchartRunsPage() {
  const navigate = useNavigate();
  const [runs, setRuns] = useState<WorkflowRunRecord[]>([]);
  const [workflows, setWorkflows] = useState<WorkflowSummary[]>([]);
  const [showCreate, setShowCreate] = useState(false);
  const [form, setForm] = useState({ workflowId: "", reference: "", notes: "" });
  const [error, setError] = useState<string | null>(null);

  async function load() {
    const [runsRes, wfRes] = await Promise.all([
      flowchartApi.listRuns({}),
      workflowApi.list({ status: "active", pageSize: 100 }),
    ]);
    setRuns(runsRes.items);
    setWorkflows(wfRes.items);
  }
  useEffect(() => { load(); }, []);

  async function handleCreate(e: FormEvent) {
    e.preventDefault();
    setError(null);
    try {
      const run = await flowchartApi.startRun(form);
      setShowCreate(false);
      setForm({ workflowId: "", reference: "", notes: "" });
      navigate(`/admin/flowchart/runs/${run.id}`);
    } catch (err: any) {
      setError(err?.response?.data?.error?.message ?? "Failed to start workflow run.");
    }
  }

  return (
    <div>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16 }}>
        <h1 style={{ fontSize: 20 }}>Flowchart — Workflow Runs</h1>
        <PermissionGate permission="flowchart.run.create">
          <button onClick={() => setShowCreate((v) => !v)}>{showCreate ? "Cancel" : "+ Start Run"}</button>
        </PermissionGate>
      </div>

      {showCreate && (
        <form onSubmit={handleCreate} style={{ padding: 16, border: "1px solid #ddd", borderRadius: 6, marginBottom: 16, maxWidth: 480 }}>
          <label style={{ display: "block", fontSize: 13, marginBottom: 8 }}>
            Workflow
            <select required value={form.workflowId} onChange={(e) => setForm({ ...form, workflowId: e.target.value })} style={{ display: "block", width: "100%", padding: 6, marginTop: 4 }}>
              <option value="">— Select an active workflow —</option>
              {workflows.map((w) => <option key={w.id} value={w.id}>{w.name}</option>)}
            </select>
          </label>
          <label style={{ display: "block", fontSize: 13, marginBottom: 8 }}>
            Reference
            <input required placeholder="e.g. PO-1001" value={form.reference} onChange={(e) => setForm({ ...form, reference: e.target.value })} style={{ display: "block", width: "100%", padding: 6, marginTop: 4 }} />
          </label>
          <label style={{ display: "block", fontSize: 13, marginBottom: 8 }}>
            Notes (optional)
            <textarea value={form.notes} onChange={(e) => setForm({ ...form, notes: e.target.value })} rows={2} style={{ display: "block", width: "100%", padding: 6, marginTop: 4 }} />
          </label>
          {error && <p style={{ color: "crimson", fontSize: 13 }}>{error}</p>}
          <button type="submit">Start Run</button>
        </form>
      )}

      <table style={{ width: "100%", borderCollapse: "collapse" }}>
        <thead>
          <tr style={{ textAlign: "left", borderBottom: "1px solid #ddd" }}>
            <th style={{ padding: 8 }}>Reference</th>
            <th style={{ padding: 8 }}>Workflow</th>
            <th style={{ padding: 8 }}>Status</th>
            <th style={{ padding: 8 }}>Started</th>
          </tr>
        </thead>
        <tbody>
          {runs.map((r) => (
            <tr key={r.id} style={{ borderBottom: "1px solid #eee", cursor: "pointer" }} onClick={() => navigate(`/admin/flowchart/runs/${r.id}`)}>
              <td style={{ padding: 8, fontWeight: 600 }}>{r.reference}</td>
              <td style={{ padding: 8 }}>{r.workflowName}</td>
              <td style={{ padding: 8 }}><span style={{ color: statusColors[r.status], fontWeight: 600 }}>{r.status.replace("_", " ")}</span></td>
              <td style={{ padding: 8, fontSize: 13, color: "#777" }}>{r.startedAt}</td>
            </tr>
          ))}
          {runs.length === 0 && <tr><td colSpan={4} style={{ padding: 16, textAlign: "center", color: "#777" }}>No workflow runs yet.</td></tr>}
        </tbody>
      </table>
    </div>
  );
}
