import React, { useEffect, useState } from "react";
import { recruitmentApi, JobRequisitionRecord } from "../api/recruitmentApi";

export default function JobRequisitionListPage() {
  const [jobs, setJobs] = useState<JobRequisitionRecord[]>([]);
  const [loading, setLoading] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [deptFilter, setDeptFilter] = useState("ALL");
  const [statusFilter, setStatusFilter] = useState("ALL");
  const [selectedJob, setSelectedJob] = useState<JobRequisitionRecord | null>(null);

  // Status updating state feedback
  const [updatingId, setUpdatingId] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState("");

  useEffect(() => {
    loadJobs();
  }, []);

  async function loadJobs() {
    setLoading(true);
    try {
      const data = await recruitmentApi.getJobs();
      setJobs(data || []);
    } catch (err) {
      console.error("Failed to fetch job requisitions", err);
    } finally {
      setLoading(false);
    }
  }

  async function handleStatusChange(id: string, newStatus: 'Open' | 'Interviewing' | 'In Pipeline' | 'On Hold' | 'Closed') {
    setUpdatingId(id);
    try {
      await recruitmentApi.updateJobStatus(id, newStatus);
      setJobs((prev) =>
        prev.map((j) => (j.id === id ? { ...j, status: newStatus } : j))
      );
      setSuccessMsg("✅ Requisition status updated successfully!");
      setTimeout(() => setSuccessMsg(""), 4000);
    } catch (err) {
      console.error("Failed to update status", err);
      alert("Failed to update requisition status.");
    } finally {
      setUpdatingId(null);
    }
  }

  async function handleDelete(id: string) {
    if (!window.confirm("Are you sure you want to delete this job requisition?")) return;
    try {
      await recruitmentApi.deleteJob(id);
      setJobs((prev) => prev.filter((j) => j.id !== id));
      if (selectedJob?.id === id) setSelectedJob(null);
    } catch (err) {
      console.error("Failed to delete requisition", err);
    }
  }

  // Filter logic
  const filteredJobs = jobs.filter((j) => {
    const matchesSearch =
      searchQuery === "" ||
      j.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      j.requisition_code.toLowerCase().includes(searchQuery.toLowerCase()) ||
      j.department.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (j.requested_by && j.requested_by.toLowerCase().includes(searchQuery.toLowerCase()));

    const matchesDept = deptFilter === "ALL" || j.department === deptFilter;
    const matchesStatus = statusFilter === "ALL" || j.status === statusFilter;

    return matchesSearch && matchesDept && matchesStatus;
  });

  return (
    <div style={{ background: "#f8fafc", minHeight: "100vh", padding: "24px" }}>
      {/* Header */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "20px" }}>
        <div>
          <h1 style={{ fontSize: "24px", fontWeight: "700", color: "#0f172a", margin: "0 0 4px 0" }}>
            Job Requisition List
          </h1>
          <p style={{ fontSize: "14px", color: "#64748b", margin: 0 }}>
            HR Portal: Manage and update hiring status for manpower requisitions submitted by Department Heads.
          </p>
        </div>

        <div style={{ display: "flex", gap: "10px" }}>
          <button
            onClick={loadJobs}
            style={{
              padding: "8px 16px",
              background: "#ffffff",
              border: "1px solid #cbd5e1",
              borderRadius: "6px",
              fontSize: "13px",
              fontWeight: "600",
              color: "#334155",
              cursor: "pointer",
            }}
          >
            🔄 Refresh
          </button>
        </div>
      </div>

      {successMsg && (
        <div style={{ padding: "12px 16px", background: "#f0fdf4", border: "1px solid #bbf7d0", color: "#166534", borderRadius: "8px", fontWeight: "600", fontSize: "14px", marginBottom: "20px" }}>
          {successMsg}
        </div>
      )}

      {/* Filter Bar */}
      <div style={{ background: "#ffffff", borderRadius: "10px", padding: "16px", border: "1px solid #e2e8f0", boxShadow: "0 1px 3px rgba(0,0,0,0.05)", marginBottom: "20px" }}>
        <div style={{ display: "flex", flexWrap: "wrap", gap: "12px", alignItems: "center", justifyContent: "space-between" }}>
          <div style={{ display: "flex", gap: "12px", flexWrap: "wrap", flex: 1 }}>
            <input
              type="text"
              placeholder="Search by code, position, department, requested by..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              style={{ minWidth: "260px", flex: 1, padding: "8px 12px", border: "1px solid #cbd5e1", borderRadius: "6px", fontSize: "13px" }}
            />

            <select
              value={deptFilter}
              onChange={(e) => setDeptFilter(e.target.value)}
              style={{ padding: "8px 12px", border: "1px solid #cbd5e1", borderRadius: "6px", fontSize: "13px" }}
            >
              <option value="ALL">All Departments</option>
              <option value="Production / Machine Shop">Production / Machine Shop</option>
              <option value="Quality Control & Assurance">Quality Control & Assurance</option>
              <option value="Maintenance & Electrical">Maintenance & Electrical</option>
              <option value="Supply Chain & Purchase">Supply Chain & Purchase</option>
              <option value="Sales & Marketing">Sales & Marketing</option>
              <option value="Accounts & Finance">Accounts & Finance</option>
              <option value="HR & Administration">HR & Administration</option>
              <option value="Design & R&D">Design & R&D</option>
              <option value="Finishing & Polish">Finishing & Polish</option>
            </select>

            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              style={{ padding: "8px 12px", border: "1px solid #cbd5e1", borderRadius: "6px", fontSize: "13px" }}
            >
              <option value="ALL">All Statuses</option>
              <option value="Open">Open</option>
              <option value="Interviewing">Interviewing</option>
              <option value="In Pipeline">In Pipeline</option>
              <option value="On Hold">On Hold</option>
              <option value="Closed">Closed</option>
            </select>
          </div>

          <div style={{ fontSize: "13px", fontWeight: "600", color: "#64748b" }}>
            Showing <strong>{filteredJobs.length}</strong> of {jobs.length} requisitions
          </div>
        </div>
      </div>

      {/* Requisitions List Table */}
      <div style={{ background: "#ffffff", borderRadius: "10px", padding: "20px", border: "1px solid #e2e8f0", boxShadow: "0 1px 3px rgba(0,0,0,0.05)" }}>
        {loading ? (
          <p style={{ color: "#64748b" }}>Loading job requisitions...</p>
        ) : filteredJobs.length === 0 ? (
          <p style={{ color: "#94a3b8", textAlign: "center", padding: "30px" }}>No job requisitions found matching your criteria.</p>
        ) : (
          <div style={{ overflowX: "auto" }}>
            <table style={{ width: "100%", borderCollapse: "collapse", textAlign: "left" }}>
              <thead>
                <tr style={{ borderBottom: "2px solid #e2e8f0", background: "#f8fafc" }}>
                  <th style={{ padding: "12px", fontSize: "13px", color: "#475569" }}>Code</th>
                  <th style={{ padding: "12px", fontSize: "13px", color: "#475569" }}>Position Title</th>
                  <th style={{ padding: "12px", fontSize: "13px", color: "#475569" }}>Department</th>
                  <th style={{ padding: "12px", fontSize: "13px", color: "#475569" }}>Vacancies</th>
                  <th style={{ padding: "12px", fontSize: "13px", color: "#475569" }}>Salary / Budget</th>
                  <th style={{ padding: "12px", fontSize: "13px", color: "#475569" }}>Urgency</th>
                  <th style={{ padding: "12px", fontSize: "13px", color: "#475569" }}>Requested By</th>
                  <th style={{ padding: "12px", fontSize: "13px", color: "#475569" }}>HR Status Update *</th>
                  <th style={{ padding: "12px", fontSize: "13px", color: "#475569" }}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredJobs.map((j) => (
                  <tr key={j.id} style={{ borderBottom: "1px solid #f1f5f9" }}>
                    <td style={{ padding: "12px", fontSize: "13px", fontWeight: "700", color: "#0284c7" }}>{j.requisition_code}</td>
                    <td style={{ padding: "12px", fontSize: "14px", fontWeight: "600", color: "#0f172a" }}>{j.title}</td>
                    <td style={{ padding: "12px", fontSize: "13px", color: "#334155" }}>{j.department}</td>
                    <td style={{ padding: "12px", fontSize: "13px", color: "#334155", fontWeight: "700" }}>{j.positions_count}</td>
                    <td style={{ padding: "12px", fontSize: "13px", color: "#059669", fontWeight: "600" }}>{j.salary_budget || "-"}</td>
                    <td style={{ padding: "12px" }}>
                      <span
                        style={{
                          padding: "4px 8px",
                          borderRadius: "6px",
                          fontSize: "11px",
                          fontWeight: "700",
                          background: j.urgency_level === "Immediate" ? "#fee2e2" : j.urgency_level === "High" ? "#ffedd5" : "#e0f2fe",
                          color: j.urgency_level === "Immediate" ? "#991b1b" : j.urgency_level === "High" ? "#9a3412" : "#0369a1",
                        }}
                      >
                        {j.urgency_level || "Medium"}
                      </span>
                    </td>
                    <td style={{ padding: "12px", fontSize: "13px", color: "#475569" }}>{j.requested_by || j.hiring_manager || "-"}</td>
                    <td style={{ padding: "12px" }}>
                      <select
                        disabled={updatingId === j.id}
                        value={j.status}
                        onChange={(e) => handleStatusChange(j.id, e.target.value as any)}
                        style={{
                          padding: "6px 10px",
                          borderRadius: "8px",
                          fontSize: "12px",
                          fontWeight: "700",
                          cursor: "pointer",
                          border: "1px solid #cbd5e1",
                          background:
                            j.status === "Open"
                              ? "#dcfce7"
                              : j.status === "Interviewing"
                              ? "#dbeafe"
                              : j.status === "In Pipeline"
                              ? "#f3e8ff"
                              : j.status === "On Hold"
                              ? "#fef3c7"
                              : "#f1f5f9",
                          color:
                            j.status === "Open"
                              ? "#166534"
                              : j.status === "Interviewing"
                              ? "#1d4ed8"
                              : j.status === "In Pipeline"
                              ? "#7e22ce"
                              : j.status === "On Hold"
                              ? "#92400e"
                              : "#475569",
                        }}
                      >
                        <option value="Open">🟢 Open</option>
                        <option value="Interviewing">🔵 Interviewing</option>
                        <option value="In Pipeline">🟣 In Pipeline</option>
                        <option value="On Hold">🟡 On Hold</option>
                        <option value="Closed">🔴 Closed / Fulfilled</option>
                      </select>
                    </td>
                    <td style={{ padding: "12px" }}>
                      <div style={{ display: "flex", gap: "6px" }}>
                        <button
                          onClick={() => setSelectedJob(j)}
                          style={{
                            padding: "4px 10px",
                            background: "#f1f5f9",
                            border: "1px solid #cbd5e1",
                            borderRadius: "6px",
                            fontSize: "12px",
                            fontWeight: "600",
                            cursor: "pointer",
                          }}
                        >
                          👁️ Details
                        </button>
                        <button
                          onClick={() => handleDelete(j.id)}
                          style={{
                            padding: "4px 8px",
                            background: "#fff1f2",
                            border: "1px solid #fecdd3",
                            color: "#e11d48",
                            borderRadius: "6px",
                            fontSize: "12px",
                            fontWeight: "600",
                            cursor: "pointer",
                          }}
                        >
                          🗑️
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* --- MODAL VIEW DETAILS --- */}
      {selectedJob && (
        <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.5)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 1000 }}>
          <div style={{ background: "#ffffff", borderRadius: "12px", width: "90%", maxWidth: "600px", padding: "24px", boxShadow: "0 10px 25px rgba(0,0,0,0.2)" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", borderBottom: "1px solid #e2e8f0", paddingBottom: "12px", marginBottom: "16px" }}>
              <div>
                <span style={{ fontSize: "12px", fontWeight: "700", color: "#0284c7" }}>{selectedJob.requisition_code}</span>
                <h3 style={{ fontSize: "18px", fontWeight: "700", color: "#0f172a", margin: "2px 0 0 0" }}>{selectedJob.title}</h3>
              </div>
              <button
                onClick={() => setSelectedJob(null)}
                style={{ background: "none", border: "none", fontSize: "20px", cursor: "pointer", color: "#64748b" }}
              >
                ✕
              </button>
            </div>

            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "12px", fontSize: "13px", marginBottom: "16px" }}>
              <div><strong>Department:</strong> {selectedJob.department}</div>
              <div><strong>Vacancies:</strong> {selectedJob.positions_count}</div>
              <div><strong>Reason for Vacancy:</strong> {selectedJob.reason_for_vacancy || "-"}</div>
              <div><strong>Employment Type:</strong> {selectedJob.employment_type || "-"}</div>
              <div><strong>Salary Budget:</strong> {selectedJob.salary_budget || "-"}</div>
              <div><strong>Required Experience:</strong> {selectedJob.experience_range || "-"}</div>
              <div><strong>Qualification:</strong> {selectedJob.required_qualification || "-"}</div>
              <div><strong>Urgency:</strong> {selectedJob.urgency_level || "-"}</div>
              <div><strong>Requested By:</strong> {selectedJob.requested_by || "-"}</div>
              <div><strong>Target Date:</strong> {selectedJob.target_date || "-"}</div>
              <div><strong>Work Location:</strong> {selectedJob.work_location || "-"}</div>
              <div><strong>Current HR Status:</strong> {selectedJob.status}</div>
            </div>

            {selectedJob.key_skills && (
              <div style={{ marginBottom: "12px", fontSize: "13px" }}>
                <strong>Key Skills & Technical Requirements:</strong>
                <p style={{ margin: "4px 0 0 0", color: "#475569", background: "#f8fafc", padding: "8px 12px", borderRadius: "6px" }}>
                  {selectedJob.key_skills}
                </p>
              </div>
            )}

            {selectedJob.job_description && (
              <div style={{ marginBottom: "20px", fontSize: "13px" }}>
                <strong>Job Description / Remarks:</strong>
                <p style={{ margin: "4px 0 0 0", color: "#475569", background: "#f8fafc", padding: "8px 12px", borderRadius: "6px" }}>
                  {selectedJob.job_description}
                </p>
              </div>
            )}

            <div style={{ display: "flex", justifyContent: "flex-end" }}>
              <button
                onClick={() => setSelectedJob(null)}
                style={{ padding: "8px 16px", background: "#0284c7", color: "#fff", border: "none", borderRadius: "6px", fontWeight: "600" }}
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
