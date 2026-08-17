import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { workflowApi, WorkflowDetail, StageInput, WorkflowStatus } from "../api/workflowApi";
import { rolesApi, RoleRecord } from "../../admin/roles/api/rolesApi";
import { departmentsApi, DepartmentRecord, DepartmentDropdownRecord } from "../../admin/organization/departments/api/departmentsApi";
import StageCard from "../components/StageCard";
import FlowchartView from "../components/FlowchartView";
import PermissionGate from "../../../shared/guards/PermissionGate";

const VALID_NEXT_STATUS: Record<WorkflowStatus, WorkflowStatus[]> = {
  draft: ["active", "archived"],
  active: ["inactive", "archived"],
  inactive: ["active", "archived"],
  archived: ["draft"],
};

export default function WorkflowEditorPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [workflow, setWorkflow] = useState<WorkflowDetail | null>(null);
  const [roles, setRoles] = useState<RoleRecord[]>([]);
  const [departments, setDepartments] = useState<DepartmentDropdownRecord[]>([]);
  const [view, setView] = useState<"form" | "flowchart">("form");
  const [metaForm, setMetaForm] = useState({ name: "", departmentId: "", description: "" });
  const [dragIndex, setDragIndex] = useState<number | null>(null);
  const [dragOverIndex, setDragOverIndex] = useState<number | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function load() {
    if (!id) return;
    const [wf, roleList, deptList] = await Promise.all([workflowApi.getById(id), rolesApi.list(), departmentsApi.listForDropdown()]);
    setWorkflow(wf);
    setRoles(roleList);
    setDepartments(deptList);
    setMetaForm({ name: wf.name, departmentId: wf.departmentId ?? "", description: wf.description ?? "" });
  }

  // eslint-disable-next-line react-hooks/exhaustive-deps -- reload only when the route param changes
  useEffect(() => { load(); }, [id]);

  async function handleSaveMeta() {
    if (!id) return;
    setError(null);
    try {
      await workflowApi.updateMeta(id, {
        name: metaForm.name,
        departmentId: metaForm.departmentId || null,
        description: metaForm.description || null,
      });
      await load();
    } catch (err: any) {
      setError(err?.response?.data?.error?.message ?? "Failed to save workflow details.");
    }
  }

  async function handleStatusChange(status: WorkflowStatus) {
    if (!id) return;
    try {
      await workflowApi.updateStatus(id, status);
      await load();
    } catch (err: any) {
      alert(err?.response?.data?.error?.message ?? "Failed to change status.");
    }
  }

  async function handleAddStage() {
    if (!id || roles.length === 0) return;
    await workflowApi.addStage(id, { name: "New Stage", responsibleRoleId: roles[0].id });
    await load();
  }

  async function handleSaveStage(stageId: string, input: StageInput) {
    if (!id) return;
    await workflowApi.updateStage(id, stageId, input);
    await load();
  }

  async function handleDeleteStage(stageId: string) {
    if (!id) return;
    if (!confirm("Delete this stage?")) return;
    await workflowApi.removeStage(id, stageId);
    await load();
  }

  async function handleDrop() {
    if (!id || !workflow || dragIndex === null || dragOverIndex === null || dragIndex === dragOverIndex) {
      setDragIndex(null);
      setDragOverIndex(null);
      return;
    }
    const reordered = [...workflow.stages];
    const [moved] = reordered.splice(dragIndex, 1);
    reordered.splice(dragOverIndex, 0, moved);
    setDragIndex(null);
    setDragOverIndex(null);
    await workflowApi.reorderStages(id, reordered.map((s) => s.id));
    await load();
  }

  async function handleDelete() {
    if (!id) return;
    if (!confirm("Delete this entire workflow? This cannot be undone.")) return;
    await workflowApi.remove(id);
    navigate("/admin/workflows");
  }

  if (!workflow) return <p>Loading...</p>;

  const sortedStages = [...workflow.stages].sort((a, b) => a.sequence - b.sequence);

  return (
    <div>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 16 }}>
        <div>
          <h1 style={{ fontSize: 20 }}>{workflow.name}</h1>
          <p style={{ fontSize: 13, color: "#777" }}>Version {workflow.version} · Status: <strong>{workflow.status}</strong></p>
        </div>
        <div style={{ display: "flex", gap: 8 }}>
          <PermissionGate permission="workflow.publish">
            {VALID_NEXT_STATUS[workflow.status].map((s) => (
              <button key={s} onClick={() => handleStatusChange(s)}>Move to {s}</button>
            ))}
          </PermissionGate>
          <PermissionGate permission="workflow.delete">
            <button onClick={handleDelete} style={{ color: "crimson" }}>Delete Workflow</button>
          </PermissionGate>
        </div>
      </div>

      <div style={{ display: "flex", gap: 24, marginBottom: 20 }}>
        <div style={{ flex: 1, maxWidth: 480 }}>
          <label style={{ display: "block", fontSize: 13, marginBottom: 8 }}>
            Workflow Name
            <input value={metaForm.name} onChange={(e) => setMetaForm({ ...metaForm, name: e.target.value })} style={{ display: "block", width: "100%", padding: 6, marginTop: 4 }} />
          </label>
          <label style={{ display: "block", fontSize: 13, marginBottom: 8 }}>
            Department
            <select value={metaForm.departmentId} onChange={(e) => setMetaForm({ ...metaForm, departmentId: e.target.value })} style={{ display: "block", width: "100%", padding: 6, marginTop: 4 }}>
              <option value="">— None —</option>
              {departments.map((d) => <option key={d.id} value={d.id}>{d.name}</option>)}
            </select>
          </label>
          <label style={{ display: "block", fontSize: 13, marginBottom: 8 }}>
            Description
            <textarea value={metaForm.description} onChange={(e) => setMetaForm({ ...metaForm, description: e.target.value })} rows={2} style={{ display: "block", width: "100%", padding: 6, marginTop: 4 }} />
          </label>
          {error && <p style={{ color: "crimson", fontSize: 13 }}>{error}</p>}
          <PermissionGate permission="workflow.update">
            <button onClick={handleSaveMeta}>Save Details</button>
          </PermissionGate>
        </div>
      </div>

      <div style={{ display: "flex", gap: 8, marginBottom: 16, borderBottom: "1px solid #ddd" }}>
        <button
          onClick={() => setView("form")}
          style={{ padding: "8px 16px", border: "none", borderBottom: view === "form" ? "2px solid #4a90d9" : "2px solid transparent", background: "none", fontWeight: view === "form" ? 600 : 400 }}
        >Stage Builder</button>
        <button
          onClick={() => setView("flowchart")}
          style={{ padding: "8px 16px", border: "none", borderBottom: view === "flowchart" ? "2px solid #4a90d9" : "2px solid transparent", background: "none", fontWeight: view === "flowchart" ? 600 : 400 }}
        >Flowchart View</button>
      </div>

      {view === "flowchart" ? (
        <FlowchartView stages={workflow.stages} roles={roles} />
      ) : (
        <div>
          <PermissionGate permission="workflow.update">
            <button onClick={handleAddStage} style={{ marginBottom: 12 }}>+ Add Stage</button>
          </PermissionGate>
          {sortedStages.length === 0 && <p style={{ color: "#777" }}>No stages yet. Add the first one above.</p>}
          {sortedStages.map((stage, index) => (
            <StageCard
              key={stage.id}
              stage={stage}
              roles={roles}
              onSave={handleSaveStage}
              onDelete={handleDeleteStage}
              draggable
              onDragStart={() => setDragIndex(index)}
              onDragOver={(e) => { e.preventDefault(); setDragOverIndex(index); }}
              onDrop={handleDrop}
              isDragTarget={dragOverIndex === index && dragIndex !== index}
            />
          ))}
        </div>
      )}
    </div>
  );
}
