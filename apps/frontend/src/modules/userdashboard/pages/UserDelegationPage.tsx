import React, { useEffect, useState } from "react";
import { axiosInstance } from "../../../services/api/axiosInstance";
import { delegationApi, DelegatedTaskRecord } from "../../officeperf/delegation/api/delegationApi";
import { useAuthStore } from "../../auth/hooks/useAuthStore";
import "./UserDashboardPage.css";

interface DisplayDelegation extends DelegatedTaskRecord {
  displayStatus?: string;
}

export function UserDelegationPage() {
  const user = useAuthStore(state => state.user);
  const isAdmin = user?.roles.includes("System Admin");
  const [employeeId, setEmployeeId] = useState<string | null>(null);
  const [currentEmployee, setCurrentEmployee] = useState<any | null>(null);
  const [activeTab, setActiveTab] = useState<"received" | "delegated">("delegated");

  const [receivedDelegations, setReceivedDelegations] = useState<DisplayDelegation[]>([]);
  const [delegatedByMe, setDelegatedByMe] = useState<DisplayDelegation[]>([]);
  const [loading, setLoading] = useState(true);

  // Request Extension Modal State
  const [showExtensionModal, setShowExtensionModal] = useState(false);
  const [extensionTaskId, setExtensionTaskId] = useState<string | null>(null);
  const [extensionReason, setExtensionReason] = useState("");
  const [extensionRequestedDate, setExtensionRequestedDate] = useState("");
  const [requestingExtension, setRequestingExtension] = useState(false);

  // Review Extension Modal State (for Tasks I Delegated)
  const [showReviewModal, setShowReviewModal] = useState(false);
  const [selectedTaskForReview, setSelectedTaskForReview] = useState<DisplayDelegation | null>(null);
  const [reviewStatus, setReviewStatus] = useState<"approved" | "rejected">("approved");
  const [rejectionReason, setRejectionReason] = useState("");
  const [submittingReview, setSubmittingReview] = useState(false);

  useEffect(() => {
    loadData();
  }, []);

  async function loadData() {
    try {
      setLoading(true);
      const [empRes, allRes] = await Promise.all([
        axiosInstance.get("/employees/me").catch(() => null),
        delegationApi.list({ scope: isAdmin ? "all" : undefined }).catch(() => ({ items: [] })),
      ]);

      const me = empRes?.data?.data;
      const myEmployeeId = me?.id;
      const myUserId = user?.id;
      const myFullName = (me?.fullName || user?.fullName || "").trim().toLowerCase();
      setCurrentEmployee(me || null);
      if (myEmployeeId) setEmployeeId(myEmployeeId);

      const items = (allRes.items as DisplayDelegation[]) || [];

      // 1. Assigned to Me: strictly tasks assigned to this user/employee
      const myReceived = items.filter(d => {
        const toId = (d as any).assignedTo;
        const toName = (d.assignedToName || "").trim().toLowerCase();
        return (myEmployeeId && toId === myEmployeeId) || (myUserId && toId === myUserId) || (myFullName && toName === myFullName);
      });

      // 2. Tasks Assigned by Me: for admin, all tasks assigned by admin / management; for non-admin, tasks assigned by user
      const myDelegated = items.filter(d => {
        const byId = (d as any).assignedBy;
        const byName = (d.assignedByName || "").trim().toLowerCase();
        const isSelfAssignedToMe = (myEmployeeId && (d as any).assignedTo === myEmployeeId) ||
                                   (myUserId && (d as any).assignedTo === myUserId) ||
                                   (myFullName && (d.assignedToName || "").trim().toLowerCase() === myFullName);

        if (isAdmin) {
          return !isSelfAssignedToMe || (myEmployeeId && byId === myEmployeeId) || (myUserId && byId === myUserId) || (myFullName && byName === myFullName);
        }
        return (myEmployeeId && byId === myEmployeeId) || (myUserId && byId === myUserId) || (myFullName && byName === myFullName);
      });

      setReceivedDelegations(myReceived);
      setDelegatedByMe(myDelegated);
    } catch (err) {
      console.error("Failed to load dashboard data:", err);
    } finally {
      setLoading(false);
    }
  }

  async function handleStatusChange(id: string, status: "running" | "completed") {
    try {
      await delegationApi.updateStatus(id, status);
      setReceivedDelegations(prev => prev.map(d => d.id === id ? { ...d, baseStatus: status, displayStatus: status } : d));
      setDelegatedByMe(prev => prev.map(d => d.id === id ? { ...d, baseStatus: status, displayStatus: status } : d));
    } catch (err: any) {
      console.error("Failed to update status", err);
      alert(err?.response?.data?.error?.message || err?.response?.data?.message || "Failed to update status");
    }
  }

  function openExtensionModal(taskId: string) {
    setExtensionTaskId(taskId);
    setExtensionReason("");
    setExtensionRequestedDate("");
    setShowExtensionModal(true);
  }

  async function handleRequestExtension(e: React.FormEvent) {
    e.preventDefault();
    if (!extensionTaskId || !extensionReason || !extensionRequestedDate) return;
    try {
      setRequestingExtension(true);
      await delegationApi.requestExtension(extensionTaskId, extensionReason, extensionRequestedDate);

      // Update local state immediately
      setReceivedDelegations(prev => prev.map(d =>
        d.id === extensionTaskId
          ? { ...d, extensionStatus: "pending", extensionReason, extensionRequestedDate }
          : d
      ));
      setShowExtensionModal(false);
      alert("Extension request submitted successfully. Waiting for review from the task assigner.");
      await loadData();
    } catch (err: any) {
      console.error("Failed to request extension", err);
      const msg = err?.response?.data?.error?.message || err?.response?.data?.message || "Failed to request extension";
      alert(msg);
    } finally {
      setRequestingExtension(false);
    }
  }

  function openExtensionReview(task: DisplayDelegation, status: "approved" | "rejected") {
    setSelectedTaskForReview(task);
    setReviewStatus(status);
    setRejectionReason("");
    setShowReviewModal(true);
  }

  async function handleReviewSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!selectedTaskForReview) return;
    try {
      setSubmittingReview(true);
      await delegationApi.respondToExtension(
        selectedTaskForReview.id,
        reviewStatus,
        reviewStatus === "rejected" ? rejectionReason : undefined
      );
      setShowReviewModal(false);
      alert(`Extension has been ${reviewStatus === "approved" ? "approved" : "rejected"} successfully.`);
      await loadData();
    } catch (err: any) {
      console.error("Failed to respond to extension", err);
      const msg = err?.response?.data?.error?.message || err?.response?.data?.message || "Failed to respond to extension";
      alert(msg);
    } finally {
      setSubmittingReview(false);
    }
  }

  if (loading) {
    return <div style={{ padding: "2rem", color: "#64748b" }}>Loading delegated tasks...</div>;
  }

  return (
    <div className="user-dashboard-container">
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "1.5rem" }}>
        <div>
          <h1 className="user-dashboard-title" style={{ margin: 0 }}>My Delegation Center</h1>
          <p style={{ color: "#64748b", margin: "4px 0 0 0", fontSize: "14px" }}>
            Track tasks assigned to you and review requests on tasks you have delegated.
          </p>
        </div>
      </div>

      {/* Tabs */}
      <div style={{ display: "flex", gap: "12px", borderBottom: "2px solid #e2e8f0", marginBottom: "1.5rem" }}>
        <button
          onClick={() => setActiveTab("received")}
          style={{
            padding: "10px 20px",
            fontSize: "15px",
            fontWeight: activeTab === "received" ? 700 : 500,
            color: activeTab === "received" ? "#2563eb" : "#64748b",
            borderBottom: activeTab === "received" ? "3px solid #2563eb" : "3px solid transparent",
            background: "none",
            border: "none",
            cursor: "pointer",
            marginBottom: "-2px",
            display: "flex",
            alignItems: "center",
            gap: "8px"
          }}
        >
          Assigned to Me
          <span style={{
            background: activeTab === "received" ? "#dbeafe" : "#f1f5f9",
            color: activeTab === "received" ? "#1e40af" : "#475569",
            padding: "2px 8px",
            borderRadius: "12px",
            fontSize: "12px",
            fontWeight: 700
          }}>
            {receivedDelegations.length}
          </span>
        </button>

        <button
          onClick={() => setActiveTab("delegated")}
          style={{
            padding: "10px 20px",
            fontSize: "15px",
            fontWeight: activeTab === "delegated" ? 700 : 500,
            color: activeTab === "delegated" ? "#2563eb" : "#64748b",
            borderBottom: activeTab === "delegated" ? "3px solid #2563eb" : "3px solid transparent",
            background: "none",
            border: "none",
            cursor: "pointer",
            marginBottom: "-2px",
            display: "flex",
            alignItems: "center",
            gap: "8px"
          }}
        >
          Tasks Assigned by Me
          <span style={{
            background: activeTab === "delegated" ? "#dbeafe" : "#f1f5f9",
            color: activeTab === "delegated" ? "#1e40af" : "#475569",
            padding: "2px 8px",
            borderRadius: "12px",
            fontSize: "12px",
            fontWeight: 700
          }}>
            {delegatedByMe.length}
          </span>
          {delegatedByMe.some(t => t.extensionStatus === "pending") && (
            <span style={{
              background: "#fef3c7",
              color: "#d97706",
              padding: "2px 6px",
              borderRadius: "10px",
              fontSize: "11px",
              fontWeight: 700
            }}>
              Extension Pending
            </span>
          )}
        </button>
      </div>

      {/* TAB 1: ASSIGNED TO ME */}
      {activeTab === "received" && (
        <section className="user-dashboard-section">
          {receivedDelegations.length === 0 ? (
            <div style={{ padding: "3rem", textAlign: "center", background: "#f8fafc", borderRadius: "8px", border: "1px dashed #cbd5e1" }}>
              <p style={{ color: "#64748b", fontSize: "15px", margin: 0 }}>No delegated tasks assigned to you right now.</p>
            </div>
          ) : (
            <table className="user-dashboard-table">
              <thead>
                <tr>
                  <th>Task Title</th>
                  <th>Assigned By</th>
                  <th>Assigned Date</th>
                  <th>Planned Due Date</th>
                  <th>Priority</th>
                  <th>Status</th>
                  <th>Extension</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {receivedDelegations.map(d => (
                  <tr key={d.id}>
                    <td style={{ fontWeight: 600 }}>{d.title}</td>
                    <td>{d.assignedByName || "Manager"}</td>
                    <td>{d.createdAt ? new Date(d.createdAt).toLocaleDateString() : "—"}</td>
                    <td>
                      <span style={{ fontWeight: 500 }}>
                        {new Date(d.dueDate).toLocaleDateString()}
                      </span>
                    </td>
                    <td><span className={`status-pill ${d.priority}`}>{d.priority}</span></td>
                    <td>
                      <span className={`status-pill ${d.baseStatus}`}>{d.displayStatus || d.baseStatus}</span>
                    </td>
                    {/* Extension Column */}
                    <td>
                      {d.extensionStatus === "pending" ? (
                        <div style={{ display: "flex", flexDirection: "column", gap: 4, background: "#fffbeb", border: "1px solid #fde68a", padding: "6px 8px", borderRadius: 6 }}>
                          <span style={{ fontSize: "11px", fontWeight: 700, color: "#b45309" }}>
                            ⏳ Extension Pending
                          </span>
                          <span style={{ fontSize: "11px", color: "#78350f" }}>
                            New Date: <strong>{d.extensionRequestedDate ? new Date(d.extensionRequestedDate).toLocaleDateString() : "—"}</strong>
                          </span>
                          {d.extensionReason && (
                            <span style={{ fontSize: "11px", color: "#451a03", background: "#fef3c7", padding: "2px 4px", borderRadius: 4 }}>
                              <strong>Reason:</strong> {d.extensionReason}
                            </span>
                          )}
                        </div>
                      ) : d.extensionStatus === "approved" ? (
                        <div style={{ display: "flex", flexDirection: "column", gap: 2, background: "#ecfdf5", border: "1px solid #a7f3d0", padding: "4px 8px", borderRadius: 6 }}>
                          <span style={{ fontSize: "11px", fontWeight: 700, color: "#065f46" }}>
                            ✓ Extension Approved
                          </span>
                          {d.extensionRequestedDate && (
                            <span style={{ fontSize: "11px", color: "#047857" }}>
                              Extended to: {new Date(d.extensionRequestedDate).toLocaleDateString()}
                            </span>
                          )}
                        </div>
                      ) : d.extensionStatus === "rejected" ? (
                        <div style={{ display: "flex", flexDirection: "column", gap: 2, background: "#fef2f2", border: "1px solid #fecaca", padding: "4px 8px", borderRadius: 6 }}>
                          <span style={{ fontSize: "11px", fontWeight: 700, color: "#b91c1c" }}>
                            ✕ Extension Rejected
                          </span>
                          {d.extensionRejectionReason && (
                            <span style={{ fontSize: "11px", color: "#991b1b" }}>
                              <strong>Reason:</strong> {d.extensionRejectionReason}
                            </span>
                          )}
                        </div>
                      ) : (
                        <div>
                          {d.baseStatus !== "completed" ? (
                            <button
                              onClick={() => openExtensionModal(d.id)}
                              style={{ padding: '4px 8px', background: '#fef3c7', color: '#92400e', border: '1px solid #fde68a', borderRadius: '4px', cursor: 'pointer', fontWeight: 600, fontSize: "12px" }}
                            >
                              ⏱ Request Ext.
                            </button>
                          ) : (
                            <span style={{ color: "#94a3b8" }}>—</span>
                          )}
                        </div>
                      )}
                    </td>
                    <td>
                      <div style={{ display: "flex", gap: "0.5rem", flexWrap: "wrap", alignItems: "center" }}>
                        {d.baseStatus !== "completed" && (
                          <button
                            onClick={() => handleStatusChange(d.id, "completed")}
                            style={{ padding: '0.4rem 0.8rem', background: '#10b981', color: '#fff', border: 'none', borderRadius: '4px', cursor: 'pointer', fontWeight: 600, fontSize: "13px" }}
                          >
                            Complete Task
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </section>
      )}

      {/* TAB 2: TASKS ASSIGNED BY ME */}
      {activeTab === "delegated" && (
        <section className="user-dashboard-section">
          {delegatedByMe.length === 0 ? (
            <div style={{ padding: "3rem", textAlign: "center", background: "#f8fafc", borderRadius: "8px", border: "1px dashed #cbd5e1" }}>
              <p style={{ color: "#64748b", fontSize: "15px", margin: 0 }}>You haven't delegated any tasks yet.</p>
            </div>
          ) : (
            <table className="user-dashboard-table">
              <thead>
                <tr>
                  <th>Task Title</th>
                  <th>Assigned To</th>
                  <th>Assigned Date</th>
                  <th>Planned Due Date</th>
                  <th>Priority</th>
                  <th>Status</th>
                  <th>Extension</th>
                </tr>
              </thead>
              <tbody>
                {delegatedByMe.map(d => (
                  <tr key={d.id}>
                    <td style={{ fontWeight: 600 }}>{d.title}</td>
                    <td>{d.assignedToName || "Team Member"}</td>
                    <td>{d.createdAt ? new Date(d.createdAt).toLocaleDateString() : "—"}</td>
                    <td>
                      <span style={{ fontWeight: 500 }}>
                        {new Date(d.dueDate).toLocaleDateString()}
                      </span>
                    </td>
                    <td><span className={`status-pill ${d.priority}`}>{d.priority}</span></td>
                    <td>
                      <span className={`status-pill ${d.baseStatus}`}>{d.displayStatus || d.baseStatus}</span>
                    </td>
                    {/* Dedicated Extension Column for Assigner */}
                    <td style={{ minWidth: "220px" }}>
                      {d.extensionStatus === "pending" ? (
                        <div style={{ display: "flex", flexDirection: "column", gap: 6, background: "#fffbeb", border: "1px solid #fde68a", padding: "8px", borderRadius: 6 }}>
                          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                            <span style={{ fontSize: "11px", fontWeight: 700, color: "#b45309" }}>
                              ⏳ Pending Review
                            </span>
                            <span style={{ fontSize: "11px", fontWeight: 600, color: "#78350f" }}>
                              New: {d.extensionRequestedDate ? new Date(d.extensionRequestedDate).toLocaleDateString() : "—"}
                            </span>
                          </div>
                          {d.extensionReason && (
                            <div style={{ fontSize: "11px", color: "#451a03", background: "#fef3c7", padding: "4px 6px", borderRadius: 4, wordBreak: "break-word" }}>
                              <strong>Reason:</strong> {d.extensionReason}
                            </div>
                          )}
                          <div style={{ display: "flex", gap: "6px", marginTop: 2 }}>
                            <button
                              onClick={() => openExtensionReview(d, "approved")}
                              title="Accept Extension"
                              style={{
                                flex: 1,
                                padding: "4px 8px",
                                background: "#10b981",
                                color: "#fff",
                                border: "none",
                                borderRadius: "4px",
                                cursor: "pointer",
                                fontSize: "12px",
                                fontWeight: 700
                              }}
                            >
                              ✓ Accept
                            </button>
                            <button
                              onClick={() => openExtensionReview(d, "rejected")}
                              title="Reject Extension (Reason Required)"
                              style={{
                                flex: 1,
                                padding: "4px 8px",
                                background: "#ef4444",
                                color: "#fff",
                                border: "none",
                                borderRadius: "4px",
                                cursor: "pointer",
                                fontSize: "12px",
                                fontWeight: 700
                              }}
                            >
                              ✕ Reject
                            </button>
                          </div>
                        </div>
                      ) : d.extensionStatus === "approved" ? (
                        <div style={{ display: "flex", flexDirection: "column", gap: 2, background: "#ecfdf5", border: "1px solid #a7f3d0", padding: "4px 8px", borderRadius: 6 }}>
                          <span style={{ fontSize: "11px", fontWeight: 700, color: "#065f46" }}>
                            ✓ Extension Approved
                          </span>
                          {d.extensionRequestedDate && (
                            <span style={{ fontSize: "11px", color: "#047857" }}>
                              Extended: {new Date(d.extensionRequestedDate).toLocaleDateString()}
                            </span>
                          )}
                        </div>
                      ) : d.extensionStatus === "rejected" ? (
                        <div style={{ display: "flex", flexDirection: "column", gap: 2, background: "#fef2f2", border: "1px solid #fecaca", padding: "4px 8px", borderRadius: 6 }}>
                          <span style={{ fontSize: "11px", fontWeight: 700, color: "#b91c1c" }}>
                            ✕ Extension Rejected
                          </span>
                          {d.extensionRejectionReason && (
                            <span style={{ fontSize: "11px", color: "#991b1b", wordBreak: "break-word" }}>
                              <strong>Reason:</strong> {d.extensionRejectionReason}
                            </span>
                          )}
                        </div>
                      ) : (
                        <span style={{ color: "#94a3b8" }}>—</span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </section>
      )}

      {/* REQUEST EXTENSION MODAL */}
      {showExtensionModal && (
        <div style={{ position: "fixed", top: 0, left: 0, right: 0, bottom: 0, background: "rgba(0,0,0,0.5)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 1000 }}>
          <div style={{ background: "#fff", padding: "2rem", borderRadius: "8px", width: "450px", maxWidth: "90%", boxShadow: "0 10px 25px rgba(0,0,0,0.1)" }}>
            <h2 style={{ marginTop: 0, marginBottom: "1.25rem", color: "#0f172a" }}>Request Extension</h2>
            <form onSubmit={handleRequestExtension} style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
              <div>
                <label style={{ display: "block", marginBottom: "0.5rem", fontWeight: "bold", fontSize: "14px", color: "#334155" }}>
                  Reason for Extension <span style={{ color: "#ef4444" }}>*</span>
                </label>
                <textarea
                  required
                  rows={4}
                  value={extensionReason}
                  onChange={e => setExtensionReason(e.target.value)}
                  style={{ width: "100%", padding: "0.6rem", border: "1px solid #cbd5e1", borderRadius: "6px", boxSizing: "border-box", fontSize: "14px" }}
                  placeholder="Explain why you need an extension..."
                />
              </div>
              <div>
                <label style={{ display: "block", marginBottom: "0.5rem", fontWeight: "bold", fontSize: "14px", color: "#334155" }}>
                  Proposed New Due Date <span style={{ color: "#ef4444" }}>*</span>
                </label>
                <input
                  type="date"
                  required
                  value={extensionRequestedDate}
                  min={new Date().toISOString().split("T")[0]}
                  onChange={e => setExtensionRequestedDate(e.target.value)}
                  style={{ width: "100%", padding: "0.6rem", border: "1px solid #cbd5e1", borderRadius: "6px", boxSizing: "border-box", fontSize: "14px" }}
                />
              </div>
              <div style={{ display: "flex", justifyContent: "flex-end", gap: "0.75rem", marginTop: "1rem" }}>
                <button
                  type="button"
                  onClick={() => setShowExtensionModal(false)}
                  disabled={requestingExtension}
                  style={{ padding: "0.6rem 1.2rem", background: "#f1f5f9", color: "#475569", border: "none", borderRadius: "6px", cursor: "pointer", fontWeight: 600 }}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={requestingExtension}
                  style={{ padding: "0.6rem 1.2rem", background: "#2563eb", color: "#fff", border: "none", borderRadius: "6px", cursor: "pointer", fontWeight: 700 }}
                >
                  {requestingExtension ? "Submitting..." : "Submit Request"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* REVIEW EXTENSION MODAL */}
      {showReviewModal && selectedTaskForReview && (
        <div style={{ position: "fixed", top: 0, left: 0, right: 0, bottom: 0, background: "rgba(0,0,0,0.5)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 1000 }}>
          <div style={{ background: "#fff", padding: "2rem", borderRadius: "8px", width: "450px", maxWidth: "90%", boxShadow: "0 10px 25px rgba(0,0,0,0.1)" }}>
            <h2 style={{ marginTop: 0, marginBottom: "1rem", color: reviewStatus === "approved" ? "#047857" : "#b91c1c" }}>
              {reviewStatus === "approved" ? "Approve Extension" : "Reject Extension"}
            </h2>
            <div style={{ marginBottom: "1.25rem", fontSize: "14px", color: "#334155", background: "#f8fafc", padding: "12px", borderRadius: "6px", border: "1px solid #e2e8f0" }}>
              <p style={{ margin: "0 0 6px 0" }}><strong>Task:</strong> {selectedTaskForReview.title}</p>
              <p style={{ margin: "0 0 6px 0" }}><strong>Assigned To:</strong> {selectedTaskForReview.assignedToName || "Team Member"}</p>
              <p style={{ margin: "0 0 6px 0" }}><strong>Reason:</strong> {selectedTaskForReview.extensionReason || "No reason given"}</p>
              <p style={{ margin: 0 }}><strong>Proposed Date:</strong> {selectedTaskForReview.extensionRequestedDate ? new Date(selectedTaskForReview.extensionRequestedDate).toLocaleDateString() : "Not specified"}</p>
            </div>
            <form onSubmit={handleReviewSubmit} style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
              {reviewStatus === "rejected" && (
                <div>
                  <label style={{ display: "block", marginBottom: "0.5rem", fontWeight: "bold", fontSize: "14px", color: "#334155" }}>
                    Reason for Rejection <span style={{ color: "#ef4444" }}>*</span>
                  </label>
                  <textarea
                    required
                    rows={3}
                    value={rejectionReason}
                    onChange={e => setRejectionReason(e.target.value)}
                    style={{ width: "100%", padding: "0.6rem", border: "1px solid #cbd5e1", borderRadius: "6px", boxSizing: "border-box", fontSize: "14px" }}
                    placeholder="Provide a clear reason why the extension is rejected..."
                  />
                </div>
              )}
              {reviewStatus === "approved" && (
                <p style={{ fontSize: "14px", color: "#065f46", background: "#d1fae5", padding: "10px", borderRadius: "6px", margin: 0 }}>
                  Approving this will automatically extend the due date to <strong>{selectedTaskForReview.extensionRequestedDate ? new Date(selectedTaskForReview.extensionRequestedDate).toLocaleDateString() : ""}</strong>.
                </p>
              )}
              <div style={{ display: "flex", justifyContent: "flex-end", gap: "0.75rem", marginTop: "1rem" }}>
                <button
                  type="button"
                  onClick={() => setShowReviewModal(false)}
                  disabled={submittingReview}
                  style={{ padding: "0.6rem 1.2rem", background: "#f1f5f9", color: "#475569", border: "none", borderRadius: "6px", cursor: "pointer", fontWeight: 600 }}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submittingReview}
                  style={{
                    padding: "0.6rem 1.2rem",
                    background: reviewStatus === "approved" ? "#10b981" : "#ef4444",
                    color: "#fff",
                    border: "none",
                    borderRadius: "6px",
                    cursor: "pointer",
                    fontWeight: 700
                  }}
                >
                  {submittingReview ? "Processing..." : (reviewStatus === "approved" ? "Confirm Approval" : "Confirm Rejection")}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
