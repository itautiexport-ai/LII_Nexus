import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { workflowApi, WorkflowSummary, WorkflowStatus } from "../api/workflowApi";
import PermissionGate from "../../../shared/guards/PermissionGate";

const statusColors: Record<WorkflowStatus, string> = {
  draft: "#999",
  active: "#1a7f37",
  inactive: "#a66",
  archived: "#666",
};

export default function WorkflowListPage() {
  const navigate = useNavigate();
  const [items, setItems] = useState<WorkflowSummary[]>([]);
  const [total, setTotal] = useState(0);
  const [search, setSearch] = useState("");
  const [status, setStatus] = useState("");
  const [page, setPage] = useState(1);
  const pageSize = 10;

  async function load() {
    const res = await workflowApi.list({ search, status: status || undefined, page, pageSize });
    setItems(res.items);
    setTotal(res.totalItems);
  }

  // eslint-disable-next-line react-hooks/exhaustive-deps -- re-runs on filter/page changes only, `load` itself is stable
  useEffect(() => { load(); }, [search, status, page]);

  async function handleCreate() {
    const created = await workflowApi.create({ name: "Untitled Workflow" });
    navigate(`/admin/workflows/${created.id}`);
  }

  const totalPages = Math.max(1, Math.ceil(total / pageSize));

  return (
    <div>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16 }}>
        <h1 style={{ fontSize: 20 }}>Workflows</h1>
        <PermissionGate permission="workflow.create">
          <button onClick={handleCreate}>+ New Workflow</button>
        </PermissionGate>
      </div>

      <div style={{ display: "flex", gap: 8, marginBottom: 16 }}>
        <input
          placeholder="Search by name..."
          value={search}
          onChange={(e) => { setSearch(e.target.value); setPage(1); }}
          style={{ padding: 6, width: 260 }}
        />
        <select value={status} onChange={(e) => { setStatus(e.target.value); setPage(1); }} style={{ padding: 6 }}>
          <option value="">All statuses</option>
          <option value="draft">Draft</option>
          <option value="active">Active</option>
          <option value="inactive">Inactive</option>
          <option value="archived">Archived</option>
        </select>
      </div>

      <table style={{ width: "100%", borderCollapse: "collapse" }}>
        <thead>
          <tr style={{ textAlign: "left", borderBottom: "1px solid #ddd" }}>
            <th style={{ padding: 8 }}>Name</th>
            <th style={{ padding: 8 }}>Department</th>
            <th style={{ padding: 8 }}>Stages</th>
            <th style={{ padding: 8 }}>Version</th>
            <th style={{ padding: 8 }}>Status</th>
            <th style={{ padding: 8 }}>Updated</th>
          </tr>
        </thead>
        <tbody>
          {items.map((wf) => (
            <tr
              key={wf.id}
              style={{ borderBottom: "1px solid #eee", cursor: "pointer" }}
              onClick={() => navigate(`/admin/workflows/${wf.id}`)}
            >
              <td style={{ padding: 8, fontWeight: 600 }}>{wf.name}</td>
              <td style={{ padding: 8 }}>{wf.departmentName ?? "—"}</td>
              <td style={{ padding: 8 }}>{wf.stageCount}</td>
              <td style={{ padding: 8 }}>v{wf.version}</td>
              <td style={{ padding: 8 }}>
                <span style={{ color: statusColors[wf.status], fontWeight: 600, textTransform: "capitalize" }}>{wf.status}</span>
              </td>
              <td style={{ padding: 8, fontSize: 13, color: "#777" }}>{wf.updatedAt}</td>
            </tr>
          ))}
          {items.length === 0 && (
            <tr><td colSpan={6} style={{ padding: 16, textAlign: "center", color: "#777" }}>No workflows found.</td></tr>
          )}
        </tbody>
      </table>

      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginTop: 16 }}>
        <span style={{ fontSize: 13, color: "#777" }}>{total} total</span>
        <div style={{ display: "flex", gap: 8 }}>
          <button disabled={page <= 1} onClick={() => setPage((p) => p - 1)}>Previous</button>
          <span style={{ fontSize: 13, padding: "4px 8px" }}>Page {page} of {totalPages}</span>
          <button disabled={page >= totalPages} onClick={() => setPage((p) => p + 1)}>Next</button>
        </div>
      </div>
    </div>
  );
}
