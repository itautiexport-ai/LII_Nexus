import React, { useEffect, useState, useMemo } from "react";
import { fmsApi } from "../api/fmsApi";
import "./MyFmsPage.css";

export function MyFmsPage() {
  const [tasks, setTasks] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<"under_process" | "pending" | "completed" | "all">("under_process");
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedProcess, setSelectedProcess] = useState("all");

  // Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedTask, setSelectedTask] = useState<any>(null);
  const [inputData, setInputData] = useState<any>({});
  const [submitting, setSubmitting] = useState(false);

  const fetchTasks = async (status: string) => {
    try {
      setLoading(true);
      const data = await fmsApi.getMyTasks(status);
      setTasks(data || []);
    } catch (err) {
      console.error("Failed to load FMS tasks:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTasks(activeTab);
  }, [activeTab]);

  // Extract list of process names for filter dropdown
  const processNames = useMemo(() => {
    const names = new Set<string>();
    tasks.forEach(t => {
      if (t.managerName) names.add(t.managerName);
    });
    return Array.from(names);
  }, [tasks]);

  // Filter tasks locally by search & process selection
  const filteredTasks = useMemo(() => {
    return tasks.filter(t => {
      const matchesSearch = 
        (t.referenceTitle && t.referenceTitle.toLowerCase().includes(searchTerm.toLowerCase())) ||
        (t.stepName && t.stepName.toLowerCase().includes(searchTerm.toLowerCase())) ||
        (t.managerName && t.managerName.toLowerCase().includes(searchTerm.toLowerCase()));
      
      const matchesProcess = selectedProcess === "all" || t.managerName === selectedProcess;

      return matchesSearch && matchesProcess;
    });
  }, [tasks, searchTerm, selectedProcess]);

  // Compute summary stats
  const stats = useMemo(() => {
    let actionNeeded = 0;
    let pending = 0;
    let completed = 0;

    tasks.forEach(t => {
      if (t.status === "Under Process") actionNeeded++;
      else if (t.status === "Pending") pending++;
      else if (t.status === "Completed") completed++;
    });

    return { actionNeeded, pending, completed, total: tasks.length };
  }, [tasks]);

  const handleExecuteClick = (task: any) => {
    setSelectedTask(task);
    setInputData({});
    setIsModalOpen(true);
  };

  const handleFormSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedTask) return;

    try {
      setSubmitting(true);
      await fmsApi.completeTask(selectedTask.instanceStepId, inputData);
      setIsModalOpen(false);
      setSelectedTask(null);
      fetchTasks(activeTab);
    } catch (err: any) {
      console.error(err);
      alert(err.response?.data?.message || "Failed to execute task step.");
    } finally {
      setSubmitting(false);
    }
  };

  const renderStatusPill = (status: string) => {
    switch (status) {
      case "Under Process":
        return <span className="status-pill under-process">⚡ Action Needed</span>;
      case "Pending":
        return <span className="status-pill pending">⏳ Pending</span>;
      case "Completed":
        return <span className="status-pill completed">✅ Completed</span>;
      case "Skipped":
        return <span className="status-pill skipped">⏭️ Not Applicable</span>;
      default:
        return <span className="status-pill">{status}</span>;
    }
  };

  return (
    <div className="my-fms-container">
      {/* Header */}
      <div className="my-fms-header">
        <div>
          <h1 className="my-fms-title">
            <span>My FMS Tasks</span>
            <span className="my-fms-badge-tag">Sub Module</span>
          </h1>
          <p className="my-fms-subtitle">
            View, track, and execute all FMS workflow tasks assigned to you across processes.
          </p>
        </div>
        <button 
          className="my-fms-btn-secondary"
          onClick={() => fetchTasks(activeTab)}
        >
          🔄 Refresh List
        </button>
      </div>

      {/* Quick Summary Cards */}
      <div className="my-fms-stats-grid">
        <div className="my-fms-stat-card" style={{ borderLeft: "4px solid #f59e0b" }}>
          <div>
            <div className="my-fms-stat-title">Action Needed</div>
            <div className="my-fms-stat-value" style={{ color: "#d97706" }}>{stats.actionNeeded}</div>
          </div>
          <div className="my-fms-stat-icon" style={{ background: "#fef3c7", color: "#d97706" }}>⚡</div>
        </div>

        <div className="my-fms-stat-card" style={{ borderLeft: "4px solid #3b82f6" }}>
          <div>
            <div className="my-fms-stat-title">Pending / Waiting</div>
            <div className="my-fms-stat-value" style={{ color: "#2563eb" }}>{stats.pending}</div>
          </div>
          <div className="my-fms-stat-icon" style={{ background: "#e0f2fe", color: "#2563eb" }}>⏳</div>
        </div>

        <div className="my-fms-stat-card" style={{ borderLeft: "4px solid #10b981" }}>
          <div>
            <div className="my-fms-stat-title">Completed</div>
            <div className="my-fms-stat-value" style={{ color: "#059669" }}>{stats.completed}</div>
          </div>
          <div className="my-fms-stat-icon" style={{ background: "#dcfce7", color: "#059669" }}>✅</div>
        </div>

        <div className="my-fms-stat-card" style={{ borderLeft: "4px solid #6366f1" }}>
          <div>
            <div className="my-fms-stat-title">Total Filtered</div>
            <div className="my-fms-stat-value" style={{ color: "#4f46e5" }}>{filteredTasks.length}</div>
          </div>
          <div className="my-fms-stat-icon" style={{ background: "#e0e7ff", color: "#4f46e5" }}>📊</div>
        </div>
      </div>

      {/* Control Bar: Tabs, Search, Process Filter */}
      <div className="my-fms-controls">
        <div className="my-fms-tabs">
          <button
            className={`my-fms-tab-btn ${activeTab === "under_process" ? "active" : ""}`}
            onClick={() => setActiveTab("under_process")}
          >
            ⚡ Action Needed
          </button>
          <button
            className={`my-fms-tab-btn ${activeTab === "pending" ? "active" : ""}`}
            onClick={() => setActiveTab("pending")}
          >
            ⏳ Upcoming
          </button>
          <button
            className={`my-fms-tab-btn ${activeTab === "completed" ? "active" : ""}`}
            onClick={() => setActiveTab("completed")}
          >
            ✅ Completed
          </button>
          <button
            className={`my-fms-tab-btn ${activeTab === "all" ? "active" : ""}`}
            onClick={() => setActiveTab("all")}
          >
            📁 All Tasks
          </button>
        </div>

        <div className="my-fms-search-box">
          <input
            type="text"
            className="my-fms-input"
            placeholder="Search by reference title, step name, process..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />

          {processNames.length > 0 && (
            <select
              className="my-fms-select"
              value={selectedProcess}
              onChange={(e) => setSelectedProcess(e.target.value)}
            >
              <option value="all">All FMS Processes</option>
              {processNames.map(p => (
                <option key={p} value={p}>{p}</option>
              ))}
            </select>
          )}
        </div>
      </div>

      {/* Main Content Table */}
      <div className="my-fms-table-container">
        {loading ? (
          <div style={{ padding: "40px", textAlign: "center", color: "#64748b" }}>
            Loading your FMS tasks...
          </div>
        ) : filteredTasks.length === 0 ? (
          <div style={{ padding: "48px 20px", textAlign: "center" }}>
            <div style={{ fontSize: "40px", marginBottom: "12px" }}>📋</div>
            <h3 style={{ margin: "0 0 6px 0", color: "#1e293b" }}>No tasks found</h3>
            <p style={{ color: "#64748b", margin: 0, fontSize: "14px" }}>
              {activeTab === "under_process" 
                ? "You have no active FMS tasks requiring immediate action right now." 
                : "No tasks match your selected filter criteria."}
            </p>
          </div>
        ) : (
          <table className="my-fms-table">
            <thead>
              <tr>
                <th>Process / FMS Name</th>
                <th>Reference / Order Title</th>
                <th>Step Name</th>
                <th>Timeline / Due</th>
                <th>Assigned Date</th>
                <th>Status</th>
                <th style={{ textAlign: "right" }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredTasks.map((t) => (
                <tr key={t.instanceStepId}>
                  <td>
                    <div style={{ fontWeight: 700, color: "#0f172a" }}>{t.managerName}</div>
                    {t.formData?.aliasName && (
                      <div style={{ fontSize: "12px", color: "#64748b" }}>Alias: {t.formData.aliasName}</div>
                    )}
                  </td>
                  <td>
                    <span style={{ fontWeight: 600, color: "#2563eb", background: "#eff6ff", padding: "4px 8px", borderRadius: "6px" }}>
                      {t.referenceTitle}
                    </span>
                  </td>
                  <td>
                    <div style={{ fontWeight: 600 }}>{t.stepName}</div>
                    {t.sequenceOrder !== undefined && (
                      <div style={{ fontSize: "11px", color: "#94a3b8" }}>Step #{t.sequenceOrder + 1}</div>
                    )}
                  </td>
                  <td>
                    <span style={{ fontWeight: 600, color: "#475569" }}>
                      {t.timelineHours} {t.timelineUnit}
                    </span>
                  </td>
                  <td>
                    <div style={{ fontSize: "13px", color: "#64748b" }}>
                      {new Date(t.assignedAt).toLocaleDateString()}
                    </div>
                    <div style={{ fontSize: "11px", color: "#94a3b8" }}>
                      {new Date(t.assignedAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </div>
                  </td>
                  <td>{renderStatusPill(t.status)}</td>
                  <td style={{ textAlign: "right" }}>
                    {t.status === "Under Process" ? (
                      <button
                        className="my-fms-btn-action"
                        onClick={() => handleExecuteClick(t)}
                      >
                        ⚡ Execute Step
                      </button>
                    ) : (
                      <button
                        className="my-fms-btn-secondary"
                        onClick={() => handleExecuteClick(t)}
                      >
                        👁️ View Details
                      </button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {/* Task Action Modal */}
      {isModalOpen && selectedTask && (
        <div className="my-fms-modal-overlay">
          <div className="my-fms-modal">
            <div className="my-fms-modal-header">
              <h3 className="my-fms-modal-title">
                {selectedTask.status === "Under Process" ? "Execute Task Step" : "Task Step Details"}
              </h3>
              <button 
                className="my-fms-modal-close" 
                onClick={() => setIsModalOpen(false)}
              >
                ✖
              </button>
            </div>

            <form onSubmit={handleFormSubmit}>
              <div className="my-fms-modal-body">
                {/* Details Summary */}
                <div className="my-fms-detail-box">
                  <div className="my-fms-detail-item">
                    <span className="my-fms-detail-label">FMS Process</span>
                    <span className="my-fms-detail-val">{selectedTask.managerName}</span>
                  </div>
                  <div className="my-fms-detail-item">
                    <span className="my-fms-detail-label">Reference Title / Order</span>
                    <span className="my-fms-detail-val">{selectedTask.referenceTitle}</span>
                  </div>
                  <div className="my-fms-detail-item" style={{ gridColumn: "span 2" }}>
                    <span className="my-fms-detail-label">Current Step</span>
                    <span className="my-fms-detail-val" style={{ color: "#2563eb" }}>
                      {selectedTask.stepName}
                    </span>
                  </div>
                </div>

                {/* Form fields if actionable */}
                {selectedTask.status === "Under Process" ? (
                  <>
                    <div className="my-fms-form-group">
                      <label className="my-fms-label">Was this step completed or is it Not Applicable? *</label>
                      <select 
                        required 
                        className="my-fms-select"
                        style={{ width: "100%" }}
                        value={inputData.status || ""}
                        onChange={(e) => setInputData({ ...inputData, status: e.target.value })}
                      >
                        <option value="" disabled>Select option</option>
                        <option value="Completed">Yes</option>
                        <option value="Skipped">Not Applicable</option>
                      </select>
                    </div>

                    <div className="my-fms-form-group">
                      <label className="my-fms-label">Execution Remarks / Comments</label>
                      <textarea 
                        className="my-fms-input"
                        rows={3}
                        placeholder="Enter step completion notes or updates..."
                        value={inputData.comments || ""}
                        onChange={(e) => setInputData({ ...inputData, comments: e.target.value })}
                      />
                    </div>
                  </>
                ) : (
                  <div>
                    {selectedTask.completedAt && (
                      <div className="my-fms-form-group">
                        <label className="my-fms-label">Completion Date</label>
                        <div style={{ fontSize: "14px", color: "#334155" }}>
                          {new Date(selectedTask.completedAt).toLocaleString()}
                        </div>
                      </div>
                    )}
                    {selectedTask.completedByName && (
                      <div className="my-fms-form-group">
                        <label className="my-fms-label">Completed By</label>
                        <div style={{ fontSize: "14px", color: "#334155" }}>
                          {selectedTask.completedByName}
                        </div>
                      </div>
                    )}
                    {selectedTask.inputData && Object.keys(selectedTask.inputData).length > 0 && (
                      <div className="my-fms-form-group">
                        <label className="my-fms-label">Submitted Form Data</label>
                        <pre style={{ background: "#f1f5f9", padding: "12px", borderRadius: "8px", fontSize: "12px", overflowX: "auto" }}>
                          {JSON.stringify(selectedTask.inputData, null, 2)}
                        </pre>
                      </div>
                    )}
                  </div>
                )}
              </div>

              <div style={{ padding: "16px 24px", background: "#f8fafc", borderTop: "1px solid #e2e8f0", display: "flex", justifyContent: "flex-end", gap: "10px" }}>
                <button 
                  type="button" 
                  className="my-fms-btn-secondary"
                  onClick={() => setIsModalOpen(false)}
                >
                  Close
                </button>
                {selectedTask.status === "Under Process" && (
                  <button 
                    type="submit" 
                    className="my-fms-btn-action"
                    disabled={submitting}
                  >
                    {submitting ? "Submitting..." : "Submit & Complete Step"}
                  </button>
                )}
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

export default MyFmsPage;
