import React, { useEffect, useState } from "react";
import { axiosInstance } from "../../../services/api/axiosInstance";
import { standaloneChecklistApi, StandaloneChecklist } from "../../checklist/api/checklistApi";
import "./UserDashboardPage.css";

interface DashboardMetrics {
  pendingCount: number;
  completedToday: number;
  totalCompleted: number;
}

interface CompletedHistoryItem {
  id: string;
  checklistId: string;
  completedAt: string;
  notes: string | null;
  attachmentUrl: string | null;
  taskName: string;
  priority: string;
  frequency: string;
}

export function UserChecklistPage() {
  const [employeeId, setEmployeeId] = useState<string | null>(null);
  const [metrics, setMetrics] = useState<DashboardMetrics>({ pendingCount: 0, completedToday: 0, totalCompleted: 0 });
  const [activeChecklists, setActiveChecklists] = useState<StandaloneChecklist[]>([]);
  const [pipelineChecklists, setPipelineChecklists] = useState<StandaloneChecklist[]>([]);
  const [history, setHistory] = useState<CompletedHistoryItem[]>([]);
  const [loading, setLoading] = useState(true);

  // Tabs: "active" | "pipeline" | "history"
  const [activeTab, setActiveTab] = useState<"active" | "pipeline" | "history">("active");

  // Completion Modal State
  const [showModal, setShowModal] = useState(false);
  const [selectedTask, setSelectedTask] = useState<StandaloneChecklist | null>(null);
  const [notes, setNotes] = useState("");
  const [file, setFile] = useState<File | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [modalError, setModalError] = useState("");

  const loadDashboard = async () => {
    try {
      setLoading(true);
      const empRes = await axiosInstance.get("/employees/me");
      const myEmployeeId = empRes.data?.data?.id;
      
      if (!myEmployeeId) {
        setLoading(false);
        return;
      }
      setEmployeeId(myEmployeeId);

      const dashboardData = await standaloneChecklistApi.getMyDashboard();
      setMetrics(dashboardData.metrics || { pendingCount: 0, completedToday: 0, totalCompleted: 0 });
      setActiveChecklists(dashboardData.active || []);
      setPipelineChecklists(dashboardData.pipeline || []);
      setHistory(dashboardData.history || []);
    } catch (err) {
      console.error("Failed to load user checklist dashboard:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadDashboard();
  }, []);

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
      await loadDashboard();
    } catch (err: any) {
      console.error(err);
      setModalError(err.response?.data?.message || "Failed to submit checklist completion.");
    } finally {
      setSubmitting(false);
    }
  };

  const getDaysRemainingText = (plannedDateStr: string) => {
    const planned = new Date(plannedDateStr);
    const now = new Date();
    const diffTime = planned.getTime() - now.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    
    if (diffDays <= 0) return "Starting today";
    if (diffDays === 1) return "Starts tomorrow";
    return `Starts in ${diffDays} days`;
  };

  if (loading && !showModal) {
    return <div style={{ padding: "3rem", textAlign: "center", color: "#64748b" }}>Loading checklist dashboard...</div>;
  }

  if (!employeeId) {
    return (
      <div style={{ maxWidth: 600, margin: "40px auto", padding: 24, backgroundColor: "#fef2f2", border: "1px solid #fee2e2", borderRadius: 12, textAlign: "center" }}>
        <h2 style={{ color: "#991b1b", marginTop: 0 }}>My Checklists</h2>
        <p style={{ color: "#7f1d1d" }}>Your user account is not linked to an Employee record. Please link your user account to an Employee record in the Organization master to view your checklists.</p>
      </div>
    );
  }

  return (
    <div className="user-dashboard-container" style={{ maxWidth: "1200px", margin: "0 auto", padding: "24px" }}>
      {/* Title */}
      <div style={{ marginBottom: "24px" }}>
        <h1 style={{ fontSize: "24px", fontWeight: "700", color: "#1e293b", margin: 0 }}>My Checklists</h1>
        <p style={{ color: "#64748b", margin: "4px 0 0 0", fontSize: "14px" }}>Manage, complete, and track your daily and cyclical checklist tasks.</p>
      </div>

      {/* KPI Stats Grid */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: "20px", marginBottom: "28px" }}>
        {/* Card 1 */}
        <div style={{ background: "#fff", borderRadius: "12px", padding: "20px", border: "1px solid #e2e8f0", boxShadow: "0 1px 3px rgba(0,0,0,0.02)" }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            <span style={{ fontSize: "14px", fontWeight: "600", color: "#64748b" }}>Pending Checklists</span>
            <div style={{ display: "flex", alignItems: "center", justifyContent: "center", width: "36px", height: "36px", borderRadius: "50%", background: "#fef3c7" }}>
              <svg width="20" height="20" fill="none" viewBox="0 0 24 24" stroke="#d97706" strokeWidth="2">
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
          </div>
          <h2 style={{ fontSize: "28px", fontWeight: "700", color: "#1e293b", margin: "10px 0 0 0" }}>{metrics.pendingCount}</h2>
        </div>

        {/* Card 2 */}
        <div style={{ background: "#fff", borderRadius: "12px", padding: "20px", border: "1px solid #e2e8f0", boxShadow: "0 1px 3px rgba(0,0,0,0.02)" }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            <span style={{ fontSize: "14px", fontWeight: "600", color: "#64748b" }}>Completed Today</span>
            <div style={{ display: "flex", alignItems: "center", justifyContent: "center", width: "36px", height: "36px", borderRadius: "50%", background: "#dcfce7" }}>
              <svg width="20" height="20" fill="none" viewBox="0 0 24 24" stroke="#16a34a" strokeWidth="2">
                <path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
          </div>
          <h2 style={{ fontSize: "28px", fontWeight: "700", color: "#1e293b", margin: "10px 0 0 0" }}>{metrics.completedToday}</h2>
        </div>

        {/* Card 3 */}
        <div style={{ background: "#fff", borderRadius: "12px", padding: "20px", border: "1px solid #e2e8f0", boxShadow: "0 1px 3px rgba(0,0,0,0.02)" }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            <span style={{ fontSize: "14px", fontWeight: "600", color: "#64748b" }}>Total Completed</span>
            <div style={{ display: "flex", alignItems: "center", justifyContent: "center", width: "36px", height: "36px", borderRadius: "50%", background: "#dbeafe" }}>
              <svg width="20" height="20" fill="none" viewBox="0 0 24 24" stroke="#2563eb" strokeWidth="2">
                <path strokeLinecap="round" strokeLinejoin="round" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4" />
              </svg>
            </div>
          </div>
          <h2 style={{ fontSize: "28px", fontWeight: "700", color: "#1e293b", margin: "10px 0 0 0" }}>{metrics.totalCompleted}</h2>
        </div>
      </div>

      {/* Tabs Switcher */}
      <div style={{ display: "flex", borderBottom: "1px solid #e2e8f0", marginBottom: "20px" }}>
        <button
          onClick={() => setActiveTab("active")}
          style={{
            padding: "12px 16px",
            background: "none",
            border: "none",
            borderBottom: activeTab === "active" ? "2px solid #2563eb" : "2px solid transparent",
            fontWeight: "600",
            color: activeTab === "active" ? "#2563eb" : "#64748b",
            cursor: "pointer",
            fontSize: "14px",
            outline: "none",
          }}
        >
          Active Tasks ({activeChecklists.length})
        </button>
        <button
          onClick={() => setActiveTab("pipeline")}
          style={{
            padding: "12px 16px",
            background: "none",
            border: "none",
            borderBottom: activeTab === "pipeline" ? "2px solid #2563eb" : "2px solid transparent",
            fontWeight: "600",
            color: activeTab === "pipeline" ? "#2563eb" : "#64748b",
            cursor: "pointer",
            fontSize: "14px",
            outline: "none",
          }}
        >
          Pipeline / Upcoming ({pipelineChecklists.length})
        </button>
        <button
          onClick={() => setActiveTab("history")}
          style={{
            padding: "12px 16px",
            background: "none",
            border: "none",
            borderBottom: activeTab === "history" ? "2px solid #2563eb" : "2px solid transparent",
            fontWeight: "600",
            color: activeTab === "history" ? "#2563eb" : "#64748b",
            cursor: "pointer",
            fontSize: "14px",
            outline: "none",
          }}
        >
          Recently Completed ({history.length})
        </button>
      </div>

      {/* Tab Contents */}
      <div>
        {/* Tab 1: Active */}
        {activeTab === "active" && (
          <div>
            {activeChecklists.length === 0 ? (
              <div style={{ background: "#fff", border: "1px dashed #cbd5e1", borderRadius: "8px", padding: "40px", textAlign: "center", color: "#64748b" }}>
                <p style={{ margin: 0, fontSize: "15px" }}>No active checklists to complete right now. You are all caught up!</p>
              </div>
            ) : (
              <div style={{ display: "grid", gridTemplateColumns: "1fr", gap: "16px" }}>
                {activeChecklists.map((task) => (
                  <div key={task.id} style={{ background: "#fff", border: "1px solid #e2e8f0", borderRadius: "12px", padding: "20px", display: "flex", justifyContent: "space-between", alignItems: "center", boxShadow: "0 1px 2px rgba(0,0,0,0.01)" }}>
                    <div>
                      <div style={{ display: "flex", alignItems: "center", gap: "8px", marginBottom: "6px" }}>
                        <span style={{ fontSize: "16px", fontWeight: "600", color: "#1e293b" }}>{task.taskName}</span>
                        <span className={`status-pill ${task.priority.toLowerCase()}`}>{task.priority}</span>
                      </div>
                      <div style={{ display: "flex", gap: "16px", fontSize: "13px", color: "#64748b" }}>
                        <span><strong>Frequency:</strong> {task.frequency}</span>
                        <span><strong>Assigned By:</strong> {task.assigner_name || "System"}</span>
                        <span><strong>Scheduled:</strong> {new Date(task.plannedDate).toLocaleDateString()}</span>
                      </div>
                      {(task.makeNoteMandatory || task.makeAttachmentMandatory) && (
                        <div style={{ display: "flex", gap: "12px", marginTop: "8px" }}>
                          {task.makeNoteMandatory && (
                            <span style={{ fontSize: "11px", background: "#f1f5f9", padding: "2px 6px", borderRadius: "4px", color: "#475569" }}>Note Required</span>
                          )}
                          {task.makeAttachmentMandatory && (
                            <span style={{ fontSize: "11px", background: "#f1f5f9", padding: "2px 6px", borderRadius: "4px", color: "#475569" }}>Photo/File Required</span>
                          )}
                        </div>
                      )}
                    </div>
                    <button
                      onClick={() => handleOpenCompleteModal(task)}
                      style={{
                        background: "#2563eb",
                        color: "#fff",
                        border: "none",
                        padding: "10px 18px",
                        borderRadius: "8px",
                        fontWeight: "600",
                        fontSize: "14px",
                        cursor: "pointer",
                        boxShadow: "0 1px 2px rgba(0,0,0,0.05)",
                      }}
                    >
                      Complete Task
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Tab 2: Pipeline */}
        {activeTab === "pipeline" && (
          <div>
            {pipelineChecklists.length === 0 ? (
              <div style={{ background: "#fff", border: "1px dashed #cbd5e1", borderRadius: "8px", padding: "40px", textAlign: "center", color: "#64748b" }}>
                <p style={{ margin: 0, fontSize: "15px" }}>No upcoming cyclical tasks in your pipeline for the next 7 days.</p>
              </div>
            ) : (
              <div style={{ display: "grid", gridTemplateColumns: "1fr", gap: "16px" }}>
                {pipelineChecklists.map((task) => (
                  <div key={task.id} style={{ background: "#f8fafc", border: "1px solid #e2e8f0", borderRadius: "12px", padding: "20px", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                    <div>
                      <div style={{ display: "flex", alignItems: "center", gap: "8px", marginBottom: "6px" }}>
                        <span style={{ fontSize: "16px", fontWeight: "600", color: "#475569" }}>{task.taskName}</span>
                        <span className={`status-pill ${task.priority.toLowerCase()}`} style={{ opacity: 0.8 }}>{task.priority}</span>
                      </div>
                      <div style={{ display: "flex", gap: "16px", fontSize: "13px", color: "#64748b" }}>
                        <span><strong>Frequency:</strong> {task.frequency}</span>
                        <span><strong>Assigned By:</strong> {task.assigner_name || "System"}</span>
                        <span><strong>Scheduled:</strong> {new Date(task.plannedDate).toLocaleDateString()}</span>
                      </div>
                    </div>
                    <span style={{ fontSize: "13px", fontWeight: "600", color: "#d97706", background: "#fef3c7", padding: "6px 12px", borderRadius: "20px" }}>
                      {getDaysRemainingText(task.plannedDate)}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Tab 3: History */}
        {activeTab === "history" && (
          <div>
            {history.length === 0 ? (
              <div style={{ background: "#fff", border: "1px dashed #cbd5e1", borderRadius: "8px", padding: "40px", textAlign: "center", color: "#64748b" }}>
                <p style={{ margin: 0, fontSize: "15px" }}>You have not completed any standalone checklist tasks yet.</p>
              </div>
            ) : (
              <table className="user-dashboard-table" style={{ background: "#fff", borderRadius: "8px", border: "1px solid #e2e8f0", overflow: "hidden" }}>
                <thead>
                  <tr style={{ background: "#f8fafc" }}>
                    <th style={{ color: "#475569", fontWeight: "600" }}>Task Name</th>
                    <th style={{ color: "#475569", fontWeight: "600" }}>Priority / Freq</th>
                    <th style={{ color: "#475569", fontWeight: "600" }}>Completed At</th>
                    <th style={{ color: "#475569", fontWeight: "600" }}>Notes</th>
                    <th style={{ color: "#475569", fontWeight: "600" }}>Attachment</th>
                  </tr>
                </thead>
                <tbody>
                  {history.map((item) => (
                    <tr key={item.id}>
                      <td style={{ fontWeight: "600", color: "#1e293b" }}>{item.taskName}</td>
                      <td>
                        <div style={{ display: "flex", gap: "6px", alignItems: "center" }}>
                          <span className={`status-pill ${item.priority.toLowerCase()}`} style={{ fontSize: "10px", padding: "1px 4px" }}>{item.priority}</span>
                          <span style={{ fontSize: "12px", color: "#64748b" }}>{item.frequency}</span>
                        </div>
                      </td>
                      <td style={{ fontSize: "13px", color: "#475569" }}>{new Date(item.completedAt).toLocaleString()}</td>
                      <td style={{ fontSize: "13px", color: "#64748b", maxWidth: "250px", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                        {item.notes || <span style={{ color: "#cbd5e1" }}>None</span>}
                      </td>
                      <td>
                        {item.attachmentUrl ? (
                          <a
                            href={`${axiosInstance.defaults.baseURL?.replace("/api/v1", "") || ""}${item.attachmentUrl}`}
                            target="_blank"
                            rel="noreferrer"
                            style={{ color: "#2563eb", textDecoration: "none", fontSize: "13px", fontWeight: "600" }}
                          >
                            View File
                          </a>
                        ) : (
                          <span style={{ color: "#cbd5e1", fontSize: "13px" }}>None</span>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        )}
      </div>

      {/* Completion Modal */}
      {showModal && selectedTask && (
        <div style={{ position: "fixed", top: 0, left: 0, width: "100%", height: "100%", background: "rgba(0, 0, 0, 0.4)", display: "flex", justifyContent: "center", alignItems: "center", zIndex: 1000 }}>
          <div style={{ background: "#fff", borderRadius: "12px", width: "100%", maxWidth: "500px", padding: "24px", boxShadow: "0 10px 25px rgba(0,0,0,0.1)" }}>
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
                    display: "flex",
                    alignItems: "center",
                    gap: "8px",
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
