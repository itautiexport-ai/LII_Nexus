import { useEffect, useState } from "react";
import { checklistApi, ChecklistInstanceRecord } from "../api/checklistApi";
import { standaloneChecklistApi, StandaloneChecklist } from "../../../checklist/api/checklistApi";
import { useAuthStore } from "../../../auth/hooks/useAuthStore";
import { employeesApi, EmployeeRecord } from "../../../admin/organization/employees/api/employeesApi";

export default function MyChecklistPage() {
  const [instances, setInstances] = useState<ChecklistInstanceRecord[]>([]);
  const [standaloneList, setStandaloneList] = useState<StandaloneChecklist[]>([]);
  const [employee, setEmployee] = useState<EmployeeRecord | null>(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<"active" | "pipeline">("active");

  const [showModal, setShowModal] = useState(false);
  const [selectedTask, setSelectedTask] = useState<StandaloneChecklist | null>(null);
  const [notes, setNotes] = useState("");
  const [file, setFile] = useState<File | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [modalError, setModalError] = useState("");

  const user = useAuthStore((state: any) => state.user);

  const handleOpenCompleteModal = (task: StandaloneChecklist) => {
    setSelectedTask(task);
    setNotes("");
    setFile(null);
    setModalError("");
    setShowModal(true);
  };

  const handleCompleteSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedTask) return;

    // Validation
    if (selectedTask.makeNoteMandatory && !notes.trim()) {
      setModalError("A completion note is required for this checklist task.");
      return;
    }
    if (selectedTask.makeAttachmentMandatory && !file) {
      setModalError("A photo or file attachment is required for this checklist task.");
      return;
    }

    setSubmitting(true);
    setModalError("");

    try {
      let attachmentUrl = "";
      if (file) {
        attachmentUrl = await standaloneChecklistApi.uploadAttachment(file);
      }

      await standaloneChecklistApi.complete(selectedTask.id, notes, attachmentUrl);
      
      // Reset & Reload
      setShowModal(false);
      setSelectedTask(null);
      setNotes("");
      setFile(null);
      await load();
    } catch (err: any) {
      console.error(err);
      setModalError(err.response?.data?.message || "Failed to submit checklist completion.");
    } finally {
      setSubmitting(false);
    }
  };

  async function load() {
    try {
      const [officeChecklists, allStandalone, me] = await Promise.all([
        checklistApi.getMyChecklists().catch(() => []),
        standaloneChecklistApi.getAll().catch(() => []),
        employeesApi.getMe().catch(() => null)
      ]);

      setInstances(officeChecklists || []);
      setEmployee(me);

      // Filter standalone checklists assigned to current employee ID or assignee name
      if (me) {
        const filtered = (allStandalone || []).filter((c: any) =>
          c.assignTo === me.id ||
          c.assignee_name === me.fullName ||
          c.assignBy === me.id ||
          c.assignedBy === me.id
        );
        setStandaloneList(filtered);
      } else {
        setStandaloneList(allStandalone || []);
      }
    } catch (err) {
      console.error("Failed to load checklists:", err);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => { load(); }, [user]);

  async function handleToggle(instance: ChecklistInstanceRecord, itemId: string, checked: boolean) {
    const updated = await checklistApi.setItemChecked(instance.id, itemId, checked);
    setInstances((prev) => prev.map((i) => (i.id === instance.id ? updated : i)));
  }

  const now = new Date();
  const sevenDaysFromNow = new Date();
  sevenDaysFromNow.setDate(now.getDate() + 7);

  // Categorize Standalone Checklists
  const activeStandalone = standaloneList.filter(c => {
    const pDate = new Date(c.plannedDate);
    return pDate <= now || isSameDay(pDate, now);
  });

  const pipelineStandalone = standaloneList.filter(c => {
    const pDate = new Date(c.plannedDate);
    // Strict pipeline rule: Only show if planned date is in the future AND within 7 days
    return pDate > now && !isSameDay(pDate, now) && pDate <= sevenDaysFromNow;
  });

  function isSameDay(d1: Date, d2: Date) {
    return d1.getFullYear() === d2.getFullYear() &&
      d1.getMonth() === d2.getMonth() &&
      d1.getDate() === d2.getDate();
  }

  if (loading) return <div style={{ padding: 24, color: "#64748b" }}>Loading checklists...</div>;

  return (
    <div style={{ maxWidth: 1200, margin: "0 auto", padding: "24px 32px" }}>
      <div style={{ marginBottom: 24 }}>
        <h1 style={{ fontSize: 28, fontWeight: 800, color: "#0f172a", margin: "0 0 8px 0" }}>
          My Checklists
        </h1>
        <p style={{ color: "#64748b", fontSize: 15, margin: 0 }}>
          Manage your daily active checklists and track upcoming tasks in pipeline.
        </p>
      </div>

      {/* Navigation Tabs */}
      <div style={{ display: "flex", gap: 12, borderBottom: "2px solid #e2e8f0", marginBottom: 24 }}>
        <button
          onClick={() => setActiveTab("active")}
          style={{
            padding: "12px 24px",
            fontSize: 15,
            fontWeight: activeTab === "active" ? 700 : 500,
            color: activeTab === "active" ? "#2563eb" : "#64748b",
            borderBottom: activeTab === "active" ? "3px solid #2563eb" : "3px solid transparent",
            background: "none",
            border: "none",
            cursor: "pointer",
            marginBottom: -2,
            display: "flex",
            alignItems: "center",
            gap: 8
          }}
        >
          Active Checklists
          <span style={{
            background: activeTab === "active" ? "#dbeafe" : "#f1f5f9",
            color: activeTab === "active" ? "#1e40af" : "#475569",
            padding: "2px 8px",
            borderRadius: 12,
            fontSize: 12,
            fontWeight: 700
          }}>
            {instances.length + activeStandalone.length}
          </span>
        </button>

        <button
          onClick={() => setActiveTab("pipeline")}
          style={{
            padding: "12px 24px",
            fontSize: 15,
            fontWeight: activeTab === "pipeline" ? 700 : 500,
            color: activeTab === "pipeline" ? "#2563eb" : "#64748b",
            borderBottom: activeTab === "pipeline" ? "3px solid #2563eb" : "3px solid transparent",
            background: "none",
            border: "none",
            cursor: "pointer",
            marginBottom: -2,
            display: "flex",
            alignItems: "center",
            gap: 8
          }}
        >
          Checklists in Pipeline (Next 7 Days)
          <span style={{
            background: activeTab === "pipeline" ? "#dbeafe" : "#f1f5f9",
            color: activeTab === "pipeline" ? "#1e40af" : "#475569",
            padding: "2px 8px",
            borderRadius: 12,
            fontSize: 12,
            fontWeight: 700
          }}>
            {pipelineStandalone.length}
          </span>
        </button>
      </div>

      {/* ACTIVE TAB CONTENT */}
      {activeTab === "active" && (
        <div>
          {instances.length === 0 && activeStandalone.length === 0 ? (
            <div style={{ padding: 40, textAlign: "center", background: "#f8fafc", borderRadius: 12, border: "1px dashed #cbd5e1" }}>
              <p style={{ color: "#64748b", fontSize: 16, margin: 0 }}>No active checklists due right now.</p>
            </div>
          ) : (
            <div style={{ display: "grid", gridTemplateColumns: "1fr", gap: 20 }}>
              {/* Standalone Active Tasks List Table */}
              {activeStandalone.length > 0 && (
                <div style={{ marginBottom: 12 }}>
                  <h3 style={{ fontSize: 15, fontWeight: 700, color: "#475569", marginBottom: 12, textTransform: "uppercase", letterSpacing: "0.05em" }}>
                    Standalone Tasks
                  </h3>
                  <table className="user-dashboard-table" style={{ background: "#fff", borderRadius: "8px", border: "1px solid #e2e8f0", overflow: "hidden", width: "100%" }}>
                    <thead>
                      <tr style={{ background: "#f8fafc" }}>
                        <th style={{ color: "#475569", fontWeight: "600" }}>Task Name</th>
                        <th style={{ color: "#475569", fontWeight: "600" }}>Assigned By</th>
                        <th style={{ color: "#475569", fontWeight: "600" }}>Planned Date</th>
                        <th style={{ color: "#475569", fontWeight: "600" }}>Priority</th>
                        <th style={{ color: "#475569", fontWeight: "600" }}>Frequency</th>
                        <th style={{ color: "#475569", fontWeight: "600" }}>Action</th>
                      </tr>
                    </thead>
                    <tbody>
                      {activeStandalone.map((item) => {
                        const isAssignee = employee && item.assignTo === employee.id;
                        return (
                          <tr key={item.id}>
                            <td style={{ fontWeight: "600", color: "#1e293b" }}>{item.taskName}</td>
                            <td style={{ fontSize: "13px", color: "#475569" }}>{item.assigner_name || "Manager"}</td>
                            <td style={{ fontSize: "13px", color: "#475569" }}>{new Date(item.plannedDate).toLocaleString()}</td>
                            <td>
                              <span className={`status-pill ${item.priority.toLowerCase()}`} style={{ fontSize: "11px", padding: "2px 6px" }}>
                                {item.priority}
                              </span>
                            </td>
                            <td style={{ fontSize: "13px", color: "#64748b" }}>{item.frequency}</td>
                            <td>
                              {isAssignee ? (
                                <button
                                  onClick={() => handleOpenCompleteModal(item)}
                                  style={{
                                    background: "#2563eb",
                                    color: "#fff",
                                    border: "none",
                                    padding: "6px 12px",
                                    borderRadius: "6px",
                                    fontWeight: "600",
                                    fontSize: "12px",
                                    cursor: "pointer",
                                    boxShadow: "0 1px 2px rgba(0,0,0,0.05)"
                                  }}
                                >
                                  Complete
                                </button>
                              ) : (
                                <span style={{ fontSize: "12px", color: "#94a3b8", fontStyle: "italic" }}>View Only</span>
                              )}
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              )}

              {/* Office Performance Instances */}
              {instances.length > 0 && (
                <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(320px, 1fr))", gap: 20 }}>
                  {instances.map((instance) => {
                    const doneCount = instance.items.filter((i) => i.isChecked).length;
                    return (
                      <div key={instance.id} style={{
                        background: "#fff",
                        border: "1px solid #e2e8f0",
                        borderRadius: 12,
                        padding: 20,
                        boxShadow: "0 1px 3px rgba(0,0,0,0.05)"
                      }}>
                        <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 8 }}>
                          <strong style={{ fontSize: 16, color: "#0f172a" }}>{instance.templateTitle}</strong>
                          <span style={{ fontSize: 11, textTransform: "uppercase", background: "#e0f2fe", color: "#0369a1", padding: "2px 8px", borderRadius: 4, fontWeight: 700 }}>
                            {instance.frequency}
                          </span>
                        </div>
                        <p style={{ fontSize: 12, color: "#64748b", marginBottom: 12 }}>
                          {instance.periodStart} – {instance.periodEnd} · <strong>{doneCount}/{instance.items.length}</strong> done
                        </p>
                        {instance.items.map((item) => (
                          <label key={item.id} style={{ display: "flex", alignItems: "center", gap: 8, fontSize: 14, marginBottom: 8, cursor: "pointer", color: "#334155" }}>
                            <input type="checkbox" checked={item.isChecked} onChange={(e) => handleToggle(instance, item.id, e.target.checked)} />
                            <span style={{ textDecoration: item.isChecked ? "line-through" : "none" }}>{item.label}</span>
                          </label>
                        ))}
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          )}
        </div>
      )}

      {/* PIPELINE TAB CONTENT */}
      {activeTab === "pipeline" && (
        <div>
          {pipelineStandalone.length === 0 ? (
            <div style={{ padding: 40, textAlign: "center", background: "#f8fafc", borderRadius: 12, border: "1px dashed #cbd5e1" }}>
              <p style={{ color: "#64748b", fontSize: 16, margin: 0 }}>No checklists in pipeline for the next 7 days.</p>
            </div>
          ) : (
            <table className="user-dashboard-table" style={{ background: "#fff", borderRadius: "8px", border: "1px solid #cbd5e1", overflow: "hidden", width: "100%" }}>
              <thead>
                <tr style={{ background: "#f8fafc" }}>
                  <th style={{ color: "#475569", fontWeight: "600" }}>Task Name</th>
                  <th style={{ color: "#475569", fontWeight: "600" }}>Assigned By</th>
                  <th style={{ color: "#475569", fontWeight: "600" }}>Planned Date</th>
                  <th style={{ color: "#475569", fontWeight: "600" }}>Priority</th>
                  <th style={{ color: "#475569", fontWeight: "600" }}>Frequency</th>
                  <th style={{ color: "#475569", fontWeight: "600" }}>Countdown</th>
                </tr>
              </thead>
              <tbody>
                {pipelineStandalone.map((item) => {
                  const pDate = new Date(item.plannedDate);
                  const diffTime = pDate.getTime() - now.getTime();
                  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
                  return (
                    <tr key={item.id}>
                      <td style={{ fontWeight: "600", color: "#475569" }}>{item.taskName}</td>
                      <td style={{ fontSize: "13px", color: "#64748b" }}>{item.assigner_name || "Manager"}</td>
                      <td style={{ fontSize: "13px", color: "#64748b" }}>{pDate.toLocaleDateString()}</td>
                      <td>
                        <span className={`status-pill ${item.priority.toLowerCase()}`} style={{ fontSize: "11px", opacity: 0.8, padding: "2px 6px" }}>
                          {item.priority}
                        </span>
                      </td>
                      <td style={{ fontSize: "13px", color: "#64748b" }}>{item.frequency}</td>
                      <td>
                        <span style={{ fontSize: "12px", fontWeight: "600", color: "#d97706", background: "#fef3c7", padding: "4px 10px", borderRadius: "12px" }}>
                          In {diffDays} day{diffDays > 1 ? "s" : ""}
                        </span>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          )}
        </div>
      )}

      {showModal && selectedTask && (
        <div style={{ position: "fixed", top: 0, left: 0, width: "100%", height: "100%", background: "rgba(0, 0, 0, 0.4)", display: "flex", justifyContent: "center", alignItems: "center", zIndex: 1000 }}>
          <div style={{ background: "#fff", borderRadius: "12px", width: "100%", maxWidth: "500px", padding: "24px", boxShadow: "0 10px 25px rgba(0,0,0,0.1)", boxSizing: "border-box" }}>
            <h3 style={{ fontSize: "18px", fontWeight: "700", color: "#1e293b", margin: "0 0 8px 0" }}>Complete Checklist Task</h3>
            <p style={{ color: "#64748b", margin: "0 0 20px 0", fontSize: "14px" }}>
              Task: <strong>{selectedTask.taskName}</strong> ({selectedTask.frequency})
            </p>

            <form onSubmit={handleCompleteSubmit}>
              {/* Note Input */}
              <div style={{ marginBottom: "16px" }}>
                <label style={{ display: "block", fontSize: "13px", fontWeight: "600", color: "#475569", marginBottom: "6px" }}>
                  Completion Notes {selectedTask.makeNoteMandatory && <span style={{ color: "#ef4444" }}>*</span>}
                </label>
                <textarea
                  rows={3}
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  placeholder="Describe task execution details..."
                  required={selectedTask.makeNoteMandatory}
                  style={{
                    width: "100%",
                    padding: "10px",
                    border: "1px solid #cbd5e1",
                    borderRadius: "8px",
                    outline: "none",
                    fontFamily: "inherit",
                    fontSize: "14px",
                    boxSizing: "border-box",
                  }}
                />
              </div>

              {/* Attachment Input */}
              <div style={{ marginBottom: "20px" }}>
                <label style={{ display: "block", fontSize: "13px", fontWeight: "600", color: "#475569", marginBottom: "6px" }}>
                  Upload Attachment / Photo {selectedTask.makeAttachmentMandatory && <span style={{ color: "#ef4444" }}>*</span>}
                </label>
                <input
                  type="file"
                  onChange={(e) => setFile(e.target.files?.[0] || null)}
                  required={selectedTask.makeAttachmentMandatory}
                  style={{
                    width: "100%",
                    fontSize: "14px",
                    color: "#64748b",
                  }}
                />
              </div>

              {/* Modal Error Alert */}
              {modalError && (
                <div style={{ background: "#fef2f2", border: "1px solid #fee2e2", borderRadius: "8px", padding: "12px", color: "#b91c1c", fontSize: "13px", marginBottom: "16px" }}>
                  {modalError}
                </div>
              )}

              {/* Buttons */}
              <div style={{ display: "flex", justifyContent: "flex-end", gap: "12px" }}>
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  disabled={submitting}
                  style={{
                    background: "#f1f5f9",
                    color: "#475569",
                    border: "none",
                    padding: "10px 16px",
                    borderRadius: "8px",
                    fontWeight: "600",
                    fontSize: "14px",
                    cursor: "pointer",
                  }}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  style={{
                    background: "#2563eb",
                    color: "#fff",
                    border: "none",
                    padding: "10px 16px",
                    borderRadius: "8px",
                    fontWeight: "600",
                    fontSize: "14px",
                    cursor: "pointer",
                  }}
                >
                  {submitting ? "Submitting..." : "Submit Completion"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
