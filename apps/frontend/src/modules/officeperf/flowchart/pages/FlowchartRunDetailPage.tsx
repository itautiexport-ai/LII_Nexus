import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import { flowchartApi, WorkflowRunDetail, FlowchartTaskRecord } from "../api/flowchartApi";
import { factoryApi, DirectReport } from "../../../factory/api/factoryApi";

const statusColors: Record<string, string> = { pending: "#999", running: "#4a90d9", completed: "#1a7f37", delayed: "#c0392b" };

export default function FlowchartRunDetailPage() {
  const { id } = useParams<{ id: string }>();
  const [run, setRun] = useState<WorkflowRunDetail | null>(null);
  const [directReports, setDirectReports] = useState<DirectReport[]>([]);
  const [assignDrafts, setAssignDrafts] = useState<Record<string, string>>({});
  const [error, setError] = useState<string | null>(null);

  async function load() {
    if (!id) return;
    const [runDetail, reports] = await Promise.all([flowchartApi.getRunDetail(id), factoryApi.myDirectReports()]);
    setRun(runDetail);
    setDirectReports(reports);
  }
  // eslint-disable-next-line react-hooks/exhaustive-deps -- reload only when the route param changes
  useEffect(() => { load(); }, [id]);

  async function handleAssign(taskId: string) {
    const employeeId = assignDrafts[taskId];
    if (!employeeId) return;
    setError(null);
    try {
      await flowchartApi.assignTask(taskId, employeeId);
      await load();
    } catch (err: any) {
      setError(err?.response?.data?.error?.message ?? "Failed to assign task.");
    }
  }

  async function handleStatusChange(taskId: string, status: "running" | "completed") {
    try {
      await flowchartApi.updateTaskStatus(taskId, status);
      await load();
    } catch (err: any) {
      alert(err?.response?.data?.error?.message ?? "Failed to update task status.");
    }
  }

  if (!run) return <p>Loading...</p>;

  return (
    <div>
      <h1 style={{ fontSize: 20 }}>{run.reference}</h1>
      <p style={{ fontSize: 13, color: "#777", marginBottom: 16 }}>{run.workflowName} · Status: <strong>{run.status.replace("_", " ")}</strong></p>
      {run.notes && <p style={{ fontSize: 13, marginBottom: 16 }}>{run.notes}</p>}
      {error && <p style={{ color: "crimson", fontSize: 13 }}>{error}</p>}

      {/* Simple horizontal stage progress strip */}
      <div style={{ display: "flex", flexWrap: "wrap", gap: 8, marginBottom: 24 }}>
        {run.tasks.map((t: FlowchartTaskRecord) => (
          <div key={t.id} style={{
            padding: "6px 12px", borderRadius: 20, fontSize: 12, fontWeight: 600,
            background: statusColors[t.displayStatus] + "22", color: statusColors[t.displayStatus],
            border: `1px solid ${statusColors[t.displayStatus]}`,
          }}>
            {t.stageSequence}. {t.stageName}
          </div>
        ))}
      </div>

      {run.tasks.map((task) => (
        <div key={task.id} style={{ border: "1px solid #ddd", borderRadius: 6, padding: 16, marginBottom: 12, maxWidth: 640 }}>
          <div style={{ display: "flex", justifyContent: "space-between" }}>
            <strong>Stage {task.stageSequence}: {task.stageName}</strong>
            <span style={{ color: statusColors[task.displayStatus], fontWeight: 600, fontSize: 13 }}>{task.displayStatus}</span>
          </div>

          {!task.assignedTo ? (
            <div style={{ marginTop: 8, display: "flex", gap: 8 }}>
              <select value={assignDrafts[task.id] ?? ""} onChange={(e) => setAssignDrafts({ ...assignDrafts, [task.id]: e.target.value })} style={{ padding: 6, flex: 1 }}>
                <option value="">— Assign to a direct report —</option>
                {directReports.map((r) => <option key={r.id} value={r.id}>{r.fullName}</option>)}
              </select>
              <button onClick={() => handleAssign(task.id)}>Assign</button>
            </div>
          ) : (
            <div style={{ marginTop: 8, fontSize: 13 }}>
              <p>Assigned to: <strong>{task.assigneeName}</strong>{task.dueDate && <> · Due: {task.dueDate}</>}</p>
              {task.displayStatus === "pending" && <button onClick={() => handleStatusChange(task.id, "running")}>Start Task</button>}
              {task.displayStatus === "running" && <button onClick={() => handleStatusChange(task.id, "completed")}>Mark Completed</button>}
              {task.displayStatus === "delayed" && (
                <button onClick={() => handleStatusChange(task.id, "completed")}>Mark Completed (Delayed)</button>
              )}
            </div>
          )}
        </div>
      ))}
    </div>
  );
}
