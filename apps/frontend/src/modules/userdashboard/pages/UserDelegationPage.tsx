import React, { useEffect, useState } from "react";
import { axiosInstance } from "../../../services/api/axiosInstance";
import { delegationApi, DelegatedTaskRecord } from "../../officeperf/delegation/api/delegationApi";
import "./UserDashboardPage.css";

interface DisplayDelegation extends DelegatedTaskRecord {
  displayStatus?: string;
}

export function UserDelegationPage() {
  const [employeeId, setEmployeeId] = useState<string | null>(null);
  const [delegations, setDelegations] = useState<DisplayDelegation[]>([]);
  const [loading, setLoading] = useState(true);

  // Filters
  const [statusFilter, setStatusFilter] = useState("");
  const [priorityFilter, setPriorityFilter] = useState("");
  const [userFilter, setUserFilter] = useState("");

  // Extension Modal State
  const [showExtensionModal, setShowExtensionModal] = useState(false);
  const [extensionTaskId, setExtensionTaskId] = useState<string | null>(null);
  const [extensionReason, setExtensionReason] = useState("");
  const [extensionRequestedDate, setExtensionRequestedDate] = useState("");

  useEffect(() => {
    async function loadData() {
      try {
        setLoading(true);
        const empRes = await axiosInstance.get("/employees/me");
        const myEmployeeId = empRes.data?.data?.id;
        
        if (!myEmployeeId) {
          setLoading(false);
          return;
        }
        setEmployeeId(myEmployeeId);

        const delRes = await delegationApi.list({ pageSize: 500 });
        const myFullName = empRes.data?.data?.fullName;
        const myDelegations = (delRes.items as DisplayDelegation[]).filter(
          d => (d as any).assignedTo === myEmployeeId || d.assignedToName?.toLowerCase() === myFullName?.toLowerCase()
        );
        setDelegations(myDelegations);

      } catch (err) {
        console.error("Failed to load dashboard data:", err);
      } finally {
        setLoading(false);
      }
    }
    loadData();
  }, []);

  async function handleStatusChange(id: string, status: "running" | "completed") {
    try {
      await delegationApi.updateStatus(id, status);
      setDelegations(prev => prev.map(d => d.id === id ? { ...d, baseStatus: status, displayStatus: status } : d));
    } catch (err) {
      console.error("Failed to update status", err);
      alert("Failed to update status");
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
      await delegationApi.requestExtension(extensionTaskId, extensionReason, extensionRequestedDate);
      setDelegations(prev => prev.map(d => 
        d.id === extensionTaskId 
          ? { ...d, extensionStatus: "pending", extensionReason, extensionRequestedDate } 
          : d
      ));
      setShowExtensionModal(false);
      alert("Extension requested successfully.");
    } catch (err) {
      console.error("Failed to request extension", err);
      alert("Failed to request extension");
    }
  }
  if (loading) {
    return <div style={{ padding: "2rem" }}>Loading...</div>;
  }

  if (!employeeId) {
    return (
      <div style={{ padding: "2rem" }}>
        <h2>My Delegated Tasks</h2>
        <p>Your user account is not linked to an Employee record.</p>
      </div>
    );
  }

  const uniqueUsers = Array.from(new Set(delegations.map(d => d.assignedByName))).filter(Boolean);

  let filteredDelegations = delegations;
  if (statusFilter) filteredDelegations = filteredDelegations.filter(d => (d.displayStatus || d.baseStatus) === statusFilter);
  if (priorityFilter) filteredDelegations = filteredDelegations.filter(d => d.priority === priorityFilter);
  if (userFilter) filteredDelegations = filteredDelegations.filter(d => d.assignedByName === userFilter);

  return (
    <div className="user-dashboard-container">
      <h1 className="user-dashboard-title">My Delegated Tasks</h1>
      
      <div style={{ display: "flex", gap: 12, marginBottom: 16, alignItems: "center", flexWrap: "wrap" }}>
        <select value={statusFilter} onChange={e => setStatusFilter(e.target.value)} style={{ padding: "6px 12px", borderRadius: 4, border: "1px solid #ccc" }}>
          <option value="">All Statuses</option>
          <option value="pending">Pending</option>
          <option value="running">Running</option>
          <option value="delayed">Delayed</option>
          <option value="completed">Completed</option>
        </select>

        <select value={priorityFilter} onChange={e => setPriorityFilter(e.target.value)} style={{ padding: "6px 12px", borderRadius: 4, border: "1px solid #ccc" }}>
          <option value="">All Priorities</option>
          <option value="low">Low</option>
          <option value="medium">Medium</option>
          <option value="high">High</option>
          <option value="urgent">Urgent</option>
        </select>

        <select value={userFilter} onChange={e => setUserFilter(e.target.value)} style={{ padding: "6px 12px", borderRadius: 4, border: "1px solid #ccc" }}>
          <option value="">All Assigned By</option>
          {uniqueUsers.map(u => <option key={u} value={u as string}>{u as string}</option>)}
        </select>
      </div>

      <section className="user-dashboard-section">
        {filteredDelegations.length === 0 ? (
          <p>No delegated tasks assigned to you.</p>
        ) : (
          <table className="user-dashboard-table">
            <thead>
              <tr>
                <th>Task Title</th>
                <th>Assigned By</th>
                <th>Planned Date</th>
                <th>Priority</th>
                <th>Status</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredDelegations.map(d => (
                <tr key={d.id}>
                  <td>{d.title}</td>
                  <td>{d.assignedByName}</td>
                  <td>{new Date(d.dueDate).toLocaleDateString()}</td>
                  <td><span className={`status-pill ${d.priority}`}>{d.priority}</span></td>
                  <td>
                    <div style={{ display: "flex", flexDirection: "column", gap: "0.25rem" }}>
                      <span className={`status-pill ${d.baseStatus}`}>{d.displayStatus || d.baseStatus}</span>
                      {d.extensionStatus === "pending" && <span style={{ fontSize: "0.75rem", color: "#f59e0b" }}>Extension Pending</span>}
                      {d.extensionStatus === "rejected" && <span style={{ fontSize: "0.75rem", color: "#ef4444" }}>Extension Rejected: {d.extensionRejectionReason}</span>}
                    </div>
                  </td>
                  <td>
                    <div style={{ display: "flex", gap: "0.5rem" }}>
                      {d.baseStatus !== "completed" && (
                        <button 
                          onClick={() => handleStatusChange(d.id, "completed")}
                          style={{ padding: '0.5rem 1rem', background: '#10b981', color: '#fff', border: 'none', borderRadius: '4px', cursor: 'pointer', fontWeight: 'bold' }}
                        >
                          Complete Task
                        </button>
                      )}
                      {d.baseStatus !== "completed" && d.extensionStatus !== "pending" && (
                        <button 
                          onClick={() => openExtensionModal(d.id)}
                          style={{ padding: '0.5rem 1rem', background: '#f59e0b', color: '#fff', border: 'none', borderRadius: '4px', cursor: 'pointer', fontWeight: 'bold' }}
                        >
                          Request Extension
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

      {showExtensionModal && (
        <div style={{ position: "fixed", top: 0, left: 0, right: 0, bottom: 0, background: "rgba(0,0,0,0.5)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 1000 }}>
          <div style={{ background: "#fff", padding: "2rem", borderRadius: "8px", width: "400px", maxWidth: "90%" }}>
            <h2 style={{ marginTop: 0, marginBottom: "1.5rem" }}>Request Extension</h2>
            <form onSubmit={handleRequestExtension} style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
              <div>
                <label style={{ display: "block", marginBottom: "0.5rem", fontWeight: "bold" }}>Reason for Extension</label>
                <textarea 
                  required
                  rows={4}
                  value={extensionReason}
                  onChange={e => setExtensionReason(e.target.value)}
                  style={{ width: "100%", padding: "0.5rem", border: "1px solid #ccc", borderRadius: "4px" }}
                  placeholder="Explain why you need an extension..."
                />
              </div>
              <div>
                <label style={{ display: "block", marginBottom: "0.5rem", fontWeight: "bold" }}>Proposed New Due Date</label>
                <input 
                  type="date"
                  required
                  value={extensionRequestedDate}
                  onChange={e => setExtensionRequestedDate(e.target.value)}
                  style={{ width: "100%", padding: "0.5rem", border: "1px solid #ccc", borderRadius: "4px" }}
                />
              </div>
              <div style={{ display: "flex", justifyContent: "flex-end", gap: "1rem", marginTop: "1rem" }}>
                <button 
                  type="button" 
                  onClick={() => setShowExtensionModal(false)}
                  style={{ padding: "0.5rem 1rem", background: "#f3f4f6", border: "none", borderRadius: "4px", cursor: "pointer" }}
                >
                  Cancel
                </button>
                <button 
                  type="submit"
                  style={{ padding: "0.5rem 1rem", background: "#3b82f6", color: "#fff", border: "none", borderRadius: "4px", cursor: "pointer", fontWeight: "bold" }}
                >
                  Submit Request
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
