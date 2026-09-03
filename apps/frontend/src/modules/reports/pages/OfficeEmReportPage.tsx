import React, { useState, useEffect } from "react";
import { usersApi, UserRecord } from "../../admin/users/api/usersApi";
import { officeEmApi, OfficeEmReport, OfficeEmTaskDetail, OfficeEmModuleScore } from "../api/officeEmApi";
import * as XLSX from "xlsx";

function getCurrentWeekString() {
  const d = new Date();
  const dayNum = d.getDay() || 7;
  d.setDate(d.getDate() + 4 - dayNum);
  const yearStart = new Date(d.getFullYear(), 0, 1);
  const weekNo = Math.ceil((((d.getTime() - yearStart.getTime()) / 86400000) + 1) / 7);
  return `${d.getFullYear()}-W${weekNo.toString().padStart(2, "0")}`;
}

export default function OfficeEmReportPage() {
  const [users, setUsers] = useState<UserRecord[]>([]);
  const [selectedUser, setSelectedUser] = useState("");
  const [period, setPeriod] = useState(getCurrentWeekString);
  const [reports, setReports] = useState<OfficeEmReport[]>([]);
  const [loading, setLoading] = useState(false);
  const [showActions, setShowActions] = useState(false);

  useEffect(() => {
    if (!showActions) return;
    const close = () => setShowActions(false);
    document.addEventListener("click", close);
    return () => document.removeEventListener("click", close);
  }, [showActions]);
  
  // Expanded week track state (contains the week string, e.g. "2026-W34")
  const [expandedWeek, setExpandedWeek] = useState<string | null>(null);
  const activeReport = reports.find(r => r.periodType === expandedWeek);
  const [modalTab, setModalTab] = useState<"summary" | "pending" | "completed">("summary");

  useEffect(() => {
    usersApi.list().then((res) => setUsers(res.items));
  }, []);

  useEffect(() => {
    if (selectedUser) {
      setLoading(true);
      officeEmApi.getGapScore(selectedUser, period)
        .then((res) => {
          setReports(res.data || []);
          setExpandedWeek(null);
        })
        .catch(err => console.error(err))
        .finally(() => setLoading(false));
    } else {
      setReports([]);
      setExpandedWeek(null);
    }
  }, [selectedUser, period]);

  const calculateTaskCounts = (tasks: OfficeEmTaskDetail[] = []) => {
    return tasks.reduce(
      (acc, t) => {
        acc.total++;
        if (t.baseStatus === "completed" || t.baseStatus === "verified") {
          acc.completed++;
          const compTime = new Date(t.completedAt || t.dueDate).getTime();
          const dueTime = new Date(t.dueDate).getTime();
          if (t.isNotApplicable) {
            acc.completedOnTime++;
          } else if (compTime <= dueTime) {
            acc.completedOnTime++;
          } else {
            acc.completedLate++;
          }
        } else {
          acc.pending++;
        }
        return acc;
      },
      { total: 0, completed: 0, completedOnTime: 0, completedLate: 0, running: 0, pending: 0 }
    );
  };

  const renderModuleListRow = (title: string, data: OfficeEmModuleScore) => {
    if (!data.isActive) {
      return (
        <div className="module-list-row inactive" key={title}>
          <div className="module-header" style={{ borderBottom: "none", paddingBottom: 0 }}>
            <h3>{title}</h3>
            <span className="status-badge">Not Active (Weight redistributed)</span>
          </div>
        </div>
      );
    }

    const taskCounts = calculateTaskCounts(data.tasks);

    return (
      <div className="module-list-row" key={title}>
        <div className="module-header">
          <div>
            <h3>{title}</h3>
            <div className="module-sub">
              Redistributed Weight: <strong>{data.normalizedWeight.toFixed(1)}%</strong> (Standard Weight: {data.standardWeight}%)
            </div>
          </div>
          <div className="module-gap-score">
            <span>Gap Score contribution</span>
            <span className="bold-red">{data.gapScore.toFixed(1)}</span>
          </div>
        </div>

        <div className="module-details">
          <div className="details-group">
            <h4>Completion Metric (60%)</h4>
            <div className="details-stats">
              <div><span>Points:</span> {data.completedPoints} / {data.totalDuePoints}</div>
              <div><span>Rate:</span> {data.completionPercent.toFixed(1)}%</div>
              <div><span>Gap:</span> {data.completionGap.toFixed(1)}</div>
            </div>
          </div>

          <div className="details-group">
            <h4>Timeliness Metric (40%)</h4>
            <div className="details-stats">
              <div><span>Points:</span> {data.onTimePoints} / {data.completedPoints}</div>
              <div><span>Rate:</span> {data.onTimePercent.toFixed(1)}%</div>
              <div><span>Gap:</span> {data.timelinessGap.toFixed(1)}</div>
            </div>
          </div>

          <div className="details-group tasks-group">
            <h4>Task Summary</h4>
            <div className="details-stats tasks-stats">
              <div className="task-count total"><span>Total:</span> {taskCounts.total}</div>
              <div className="task-count completed"><span>Completed:</span> {taskCounts.completed}</div>
              <div className="task-count on-time" style={{ borderLeft: "3px solid #10b981", color: "#047857" }}><span>On-Time:</span> {taskCounts.completedOnTime}</div>
              <div className="task-count late" style={{ borderLeft: "3px solid #ef4444", color: "#b91c1c" }}><span>Not On-Time:</span> {taskCounts.completedLate}</div>
              <div className="task-count pending"><span>Pending:</span> {taskCounts.pending}</div>
            </div>
          </div>
        </div>
      </div>
    );
  };

  const renderStatusBadge = (status: string, isNotApplicable?: boolean) => {
    if (isNotApplicable) {
      return (
        <span style={{ color: "#475569", backgroundColor: "#f1f5f9", padding: "4px 10px", borderRadius: "12px", fontSize: "0.75rem", fontWeight: 600, textTransform: "capitalize", whiteSpace: "nowrap" }}>
          Not Applicable
        </span>
      );
    }
    let color = "#475569";
    let bg = "#f1f5f9";
    if (status === "completed" || status === "verified") {
      color = "#166534";
      bg = "#dcfce7";
    } else if (status === "running") {
      color = "#1e40af";
      bg = "#dbeafe";
    } else if (status === "pending") {
      color = "#92400e";
      bg = "#fef3c7";
    }
    return (
      <span style={{ color, backgroundColor: bg, padding: "4px 10px", borderRadius: "12px", fontSize: "0.75rem", fontWeight: 600, textTransform: "capitalize", whiteSpace: "nowrap" }}>
        {status}
      </span>
    );
  };

  const renderTaskTable = (title: string, tasks: OfficeEmTaskDetail[] | undefined) => {
    if (!tasks || tasks.length === 0) {
      return (
        <div className="task-section" key={title}>
          <h3>{title}</h3>
          <p style={{ color: "#64748b", fontStyle: "italic", background: "#f8fafc", padding: "12px 16px", borderRadius: "8px", border: "1px dashed #cbd5e1", fontSize: "14px" }}>
            No tasks scheduled in this week.
          </p>
        </div>
      );
    }

    return (
      <div className="task-section" key={title} style={{ marginBottom: "20px" }}>
        <h4 style={{ color: "#475569", margin: "0 0 10px 0", fontSize: "14px" }}>{title}</h4>
        <div style={{ overflowX: "auto" }}>
          <table className="task-table" style={{ fontSize: "13px" }}>
            <thead>
              <tr style={{ background: "#f8fafc" }}>
                <th style={{ padding: "10px 14px" }}>Task Name</th>
                <th style={{ padding: "10px 14px" }}>Status</th>
                <th style={{ padding: "10px 14px" }}>Due Date</th>
                <th style={{ padding: "10px 14px" }}>Completed At</th>
              </tr>
            </thead>
            <tbody>
              {tasks.map(t => (
                <tr key={t.id}>
                  <td style={{ fontWeight: 500, color: "#1e293b", padding: "10px 14px" }}>{t.name}</td>
                  <td style={{ padding: "10px 14px" }}>{renderStatusBadge(t.baseStatus, t.isNotApplicable)}</td>
                  <td style={{ padding: "10px 14px" }}>{new Date(t.dueDate).toLocaleDateString()}</td>
                  <td style={{ padding: "10px 14px" }}>{t.completedAt ? new Date(t.completedAt).toLocaleDateString() : "-"}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    );
  };

  const formatWeekName = (weekStr: string) => {
    const parts = weekStr.split("-W");
    if (parts.length === 2) {
      return `Week ${parts[1]}, ${parts[0]}`;
    }
    return weekStr;
  };

  const getBriefSummaryText = (data: OfficeEmModuleScore) => {
    const counts = calculateTaskCounts(data.tasks);
    if (counts.pending > 0) {
      return `${counts.total} total, ${counts.completed} done (${counts.completedOnTime} on-time, ${counts.completedLate} late), ${counts.pending} pending`;
    }
    return `${counts.total} total, ${counts.completed} done (${counts.completedOnTime} on-time, ${counts.completedLate} late)`;
  };

  const handleExportExcel = () => {
    if (reports.length === 0) return;
    const wsData = reports.map(r => ({
      "Week": formatWeekName(r.periodType),
      "Gap Score": r.isEvaluationPending ? "Evaluation Pending" : (r.finalGapScore !== null ? r.finalGapScore.toFixed(1) : "-"),
      "FMS Summary": getBriefSummaryText(r.modules.fms),
      "Checklist Summary": getBriefSummaryText(r.modules.checklist),
      "Delegation Summary": getBriefSummaryText(r.modules.delegation)
    }));
    const ws = XLSX.utils.json_to_sheet(wsData);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Office EM Summary");
    const empName = users.find(u => u.id === selectedUser)?.fullName || "Employee";
    XLSX.writeFile(wb, `Office_EM_Summary_${empName}_${period}.xlsx`);
  };

  const handlePrint = () => {
    window.print();
  };

  return (
    <div style={{ padding: "24px 32px", fontFamily: "'Inter', sans-serif", backgroundColor: "#f8fafc", minHeight: "100vh" }}>
      <style>{`
        .export-btn {
          padding: 10px 16px;
          border-radius: 8px;
          border: 1px solid #cbd5e1;
          background: #10b981;
          color: #ffffff;
          font-size: 0.95rem;
          font-weight: 600;
          cursor: pointer;
          outline: none;
          transition: background-color 0.2s;
          box-shadow: 0 1px 2px rgba(0,0,0,0.05);
        }
        .export-btn:hover {
          background: #059669;
        }
        .dropdown-trigger-btn {
          background: #2563eb;
        }
        .dropdown-trigger-btn:hover {
          background: #1d4ed8;
        }
        .dropdown-menu-item {
          width: 100%;
          padding: 12px 16px;
          text-align: left;
          background: none;
          border: none;
          color: #1e293b;
          font-size: 0.9rem;
          font-weight: 500;
          cursor: pointer;
          display: block;
          transition: background-color 0.15s ease;
        }
        .dropdown-menu-item:hover {
          background-color: #f1f5f9;
        }
        .dropdown-menu-item:first-of-type {
          border-bottom: 1px solid #f1f5f9;
        }
        @media print {
          .no-print {
            display: none !important;
          }
          body {
            background: #ffffff !important;
            padding: 0 !important;
          }
          .report-container {
            border: none !important;
            box-shadow: none !important;
            padding: 0 !important;
          }
          .custom-modal-backdrop {
            position: relative !important;
            background: none !important;
            padding: 0 !important;
          }
          .custom-modal-content {
            border: none !important;
            box-shadow: none !important;
            width: 100% !important;
            max-width: 100% !important;
            margin: 0 !important;
          }
          .custom-modal-close, .modal-tabs {
            display: none !important;
          }
        }
      `}</style>
      <h1 style={{ fontSize: "24px", marginBottom: "24px", color: "#0f172a", fontWeight: 600 }}>LII Performance Gap Score (Office EM)</h1>

      <div className="no-print" style={{ display: "flex", gap: "12px", marginBottom: "32px", alignItems: "center" }}>
        <select className="professional-select" value={selectedUser} onChange={e => setSelectedUser(e.target.value)}>
          <option value="">-- Select Employee --</option>
          {users.filter(u => !u.roles?.some(r => {
            const lower = r.toLowerCase();
            return lower.includes("director") || lower.includes("admin");
          })).map(u => (
            <option key={u.id} value={u.id}>{u.fullName}</option>
          ))}
        </select>

        <input 
          type="week" 
          className="professional-select" 
          value={period} 
          onChange={e => setPeriod(e.target.value)} 
          style={{ width: "200px" }}
        />
        
        {reports.length > 0 && (
          <div style={{ position: "relative", display: "inline-block" }}>
            <button 
              onClick={(e) => {
                e.stopPropagation();
                setShowActions(!showActions);
              }} 
              className="export-btn dropdown-trigger-btn"
            >
              📥 Export / Print Option <span style={{ fontSize: "10px", marginLeft: "4px" }}>▼</span>
            </button>
            
            {showActions && (
              <div style={{
                position: "absolute",
                top: "100%",
                left: 0,
                marginTop: "6px",
                background: "#ffffff",
                border: "1px solid #cbd5e1",
                borderRadius: "8px",
                boxShadow: "0 4px 6px -1px rgba(0,0,0,0.1), 0 2px 4px -1px rgba(0,0,0,0.06)",
                zIndex: 100,
                minWidth: "180px",
                overflow: "hidden"
              }}>
                <button 
                  onClick={() => {
                    handleExportExcel();
                    setShowActions(false);
                  }}
                  className="dropdown-menu-item"
                >
                  🟢 Export to Excel
                </button>
                <button 
                  onClick={() => {
                    handlePrint();
                    setShowActions(false);
                  }}
                  className="dropdown-menu-item"
                >
                  🖨️ Print / PDF
                </button>
              </div>
            )}
          </div>
        )}
      </div>

      {loading && <p style={{ color: "#64748b" }}>Loading Gap Score History...</p>}

      {!loading && selectedUser && reports.length === 0 && (
        <p style={{ color: "#64748b", fontStyle: "italic" }}>No report records found for this employee.</p>
      )}

      {!loading && reports.length > 0 && (
        <div>
          {/* Main List Table of Preceding Weeks */}
          <div className="report-container" style={{ padding: "20px", marginBottom: "24px" }}>
            <h3 style={{ fontSize: "16px", fontWeight: "700", color: "#1e293b", margin: "0 0 16px 0" }}>Weekly Scoring Summary</h3>
            <div style={{ overflowX: "auto" }}>
              <table className="task-table" style={{ width: "100%" }}>
                <thead>
                  <tr style={{ background: "#f8fafc" }}>
                    <th>Week</th>
                    <th>Gap Score</th>
                    <th>FMS Task Summary</th>
                    <th>Checklist Summary</th>
                    <th>Delegation Summary</th>
                    <th>Action</th>
                  </tr>
                </thead>
                <tbody>
                  {reports.map((weekRep) => {
                    return (
                      <tr key={weekRep.periodType} style={{ background: "#fff" }}>
                        <td style={{ color: "#1e293b", fontWeight: "600" }}>{formatWeekName(weekRep.periodType)}</td>
                        <td>
                          {weekRep.isEvaluationPending ? (
                            <span style={{ color: "#d97706", fontSize: "12px", background: "#fef3c7", padding: "4px 8px", borderRadius: "6px", fontWeight: "600" }}>
                              Evaluation Pending
                            </span>
                          ) : (
                            <span style={{ color: "#ef4444", fontWeight: "700" }}>
                              {weekRep.finalGapScore !== null ? weekRep.finalGapScore.toFixed(1) : "-"}
                            </span>
                          )}
                        </td>
                        <td style={{ fontSize: "13px", color: "#475569" }}>{getBriefSummaryText(weekRep.modules.fms)}</td>
                        <td style={{ fontSize: "13px", color: "#475569" }}>{getBriefSummaryText(weekRep.modules.checklist)}</td>
                        <td style={{ fontSize: "13px", color: "#475569" }}>{getBriefSummaryText(weekRep.modules.delegation)}</td>
                        <td>
                          <button
                            onClick={() => {
                              setModalTab("summary");
                              setExpandedWeek(weekRep.periodType);
                            }}
                            style={{
                              background: "#2563eb",
                              color: "#fff",
                              border: "none",
                              padding: "6px 12px",
                              borderRadius: "6px",
                              fontSize: "12px",
                              fontWeight: "600",
                              cursor: "pointer",
                              outline: "none"
                            }}
                          >
                            View Result
                          </button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {expandedWeek && activeReport && (
        <div className="custom-modal-backdrop" onClick={() => setExpandedWeek(null)}>
          <div className="custom-modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="custom-modal-header">
              <h2>{formatWeekName(activeReport.periodType)} - Detailed Result</h2>
              <button className="custom-modal-close" onClick={() => setExpandedWeek(null)}>✕</button>
            </div>
            
            <div className="modal-tabs">
              <button 
                className={`modal-tab-btn ${modalTab === "summary" ? "active" : ""}`}
                onClick={() => setModalTab("summary")}
              >
                Summary
              </button>
              <button 
                className={`modal-tab-btn ${modalTab === "pending" ? "active" : ""}`}
                onClick={() => setModalTab("pending")}
              >
                Pending Items
              </button>
              <button 
                className={`modal-tab-btn ${modalTab === "completed" ? "active" : ""}`}
                onClick={() => setModalTab("completed")}
              >
                Completed Tasks
              </button>
            </div>

            <div className="custom-modal-body">
              {modalTab === "summary" && (
                <>
                  {activeReport.isEvaluationPending && (
                    <div className="modal-pending-banner">
                      ⚠️ {activeReport.pendingMessage}
                    </div>
                  )}

                  <div className="modal-ratings-grid">
                    <div className="modal-rating-card">
                      <h4>HOD Rating</h4>
                      <div className="rating-val">
                        {activeReport.hodScore !== null ? `${activeReport.hodScore} / 5` : "Pending"}
                      </div>
                      <span className="rating-weight">Weight: {activeReport.hodWeight}%</span>
                    </div>
                    <div className="modal-rating-card">
                      <h4>HR Rating</h4>
                      <div className="rating-val">
                        {activeReport.hrScore !== null ? `${activeReport.hrScore} / 5` : "Pending"}
                      </div>
                      <span className="rating-weight">Weight: {activeReport.hrWeight}%</span>
                    </div>
                  </div>

                  <div className="modal-modules-stack">
                    {[
                      { title: "FMS – Flow Management System", module: activeReport.modules.fms },
                      { title: "Checklist", module: activeReport.modules.checklist },
                      { title: "Delegation", module: activeReport.modules.delegation }
                    ].map(({ title, module }) => {
                      const counts = calculateTaskCounts(module.tasks);
                      return (
                        <div className="modal-module-card" key={title}>
                          <h3>{title}</h3>
                          <div className="modal-stats-grid">
                            <div className="modal-stat-item">
                              <span className="stat-lbl">Total Tasks:</span>
                              <span className="stat-num">{counts.total}</span>
                            </div>
                            <div className="modal-stat-item">
                              <span className="stat-lbl">Completed:</span>
                              <span className="stat-num">{counts.completed}</span>
                            </div>
                            <div className="modal-stat-item">
                              <span className="stat-lbl">Completed On-Time:</span>
                              <span className="stat-num green">{counts.completedOnTime}</span>
                            </div>
                            <div className="modal-stat-item">
                              <span className="stat-lbl">Not On-Time:</span>
                              <span className="stat-num red">{counts.completedLate}</span>
                            </div>
                            {counts.pending > 0 && (
                              <div className="modal-stat-item" style={{ gridColumn: "span 2", background: "#fffbeb", border: "1px solid #fef3c7" }}>
                                <span className="stat-lbl" style={{ color: "#92400e" }}>Pending Tasks:</span>
                                <span className="stat-num" style={{ color: "#b45309" }}>{counts.pending}</span>
                              </div>
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </div>

                  <div className="modal-footer-summary">
                    <div className="footer-stat">
                      <span>Average Task Gap Score:</span>
                      <strong>
                        {((activeReport.modules.fms.gapScore + activeReport.modules.checklist.gapScore + activeReport.modules.delegation.gapScore) / 3).toFixed(1)}
                      </strong>
                    </div>
                    <div className="footer-stat" style={{ marginTop: "12px", borderTop: "1px solid #e2e8f0", paddingTop: "12px" }}>
                      <span>Final Gap Score:</span>
                      <strong className="final-score">
                        {activeReport.finalGapScore !== null ? activeReport.finalGapScore.toFixed(1) : "Pending"}
                      </strong>
                    </div>
                  </div>
                </>
              )}

              {modalTab === "pending" && (
                <div className="modal-pending-tab-content">
                  {/* FMS Pending Section */}
                  <div className="pending-section">
                    <h4 className="pending-section-title">FMS – Flow Management System</h4>
                    {activeReport.modules.fms.tasks.filter(t => t.baseStatus !== "completed" && t.baseStatus !== "verified").length === 0 ? (
                      <p className="no-pending-msg">🎉 No pending FMS tasks for this week</p>
                    ) : (
                      <div className="pending-list">
                        {activeReport.modules.fms.tasks
                          .filter(t => t.baseStatus !== "completed" && t.baseStatus !== "verified")
                          .map(t => {
                            const isOverdue = new Date().getTime() > new Date(t.dueDate).getTime();
                            return (
                              <div key={t.id} className="pending-item">
                                <div className="pending-item-details">
                                  <span className="pending-item-name">{t.name}</span>
                                  <span className="pending-item-meta">
                                    Due: {new Date(t.dueDate).toLocaleDateString()}
                                    {isOverdue && <span className="overdue-tag"> [OVERDUE]</span>}
                                    {t.priority && ` | Priority: ${t.priority}`}
                                  </span>
                                </div>
                                <span className={`pending-status-badge ${t.baseStatus}`}>
                                  {t.baseStatus}
                                </span>
                              </div>
                            );
                          })}
                      </div>
                    )}
                  </div>

                  {/* Checklist Pending Section */}
                  <div className="pending-section">
                    <h4 className="pending-section-title">Checklist Tasks</h4>
                    {activeReport.modules.checklist.tasks.filter(t => t.baseStatus !== "completed" && t.baseStatus !== "verified").length === 0 ? (
                      <p className="no-pending-msg">🎉 No pending checklist tasks for this week</p>
                    ) : (
                      <div className="pending-list">
                        {activeReport.modules.checklist.tasks
                          .filter(t => t.baseStatus !== "completed" && t.baseStatus !== "verified")
                          .map(t => {
                            const isOverdue = new Date().getTime() > new Date(t.dueDate).getTime();
                            return (
                              <div key={t.id} className="pending-item">
                                <div className="pending-item-details">
                                  <span className="pending-item-name">{t.name}</span>
                                  <span className="pending-item-meta">
                                    Due: {new Date(t.dueDate).toLocaleDateString()}
                                    {isOverdue && <span className="overdue-tag"> [OVERDUE]</span>}
                                    {t.priority && ` | Priority: ${t.priority}`}
                                  </span>
                                </div>
                                <span className={`pending-status-badge ${t.baseStatus}`}>
                                  {t.baseStatus}
                                </span>
                              </div>
                            );
                          })}
                      </div>
                    )}
                  </div>

                  {/* Delegation Pending Section */}
                  <div className="pending-section">
                    <h4 className="pending-section-title">Delegations</h4>
                    {activeReport.modules.delegation.tasks.filter(t => t.baseStatus !== "completed" && t.baseStatus !== "verified").length === 0 ? (
                      <p className="no-pending-msg">🎉 No pending delegations for this week</p>
                    ) : (
                      <div className="pending-list">
                        {activeReport.modules.delegation.tasks
                          .filter(t => t.baseStatus !== "completed" && t.baseStatus !== "verified")
                          .map(t => {
                            const isOverdue = new Date().getTime() > new Date(t.dueDate).getTime();
                            return (
                              <div key={t.id} className="pending-item">
                                <div className="pending-item-details">
                                  <span className="pending-item-name">{t.name}</span>
                                  <span className="pending-item-meta">
                                    Due: {new Date(t.dueDate).toLocaleDateString()}
                                    {isOverdue && <span className="overdue-tag"> [OVERDUE]</span>}
                                    {t.priority && ` | Priority: ${t.priority}`}
                                  </span>
                                </div>
                                <span className={`pending-status-badge ${t.baseStatus}`}>
                                  {t.baseStatus}
                                </span>
                              </div>
                            );
                          })}
                      </div>
                    )}
                  </div>
                </div>
              )}

              {modalTab === "completed" && (
                <div className="modal-pending-tab-content">
                  {/* FMS Completed Section */}
                  <div className="pending-section">
                    <h4 className="pending-section-title">FMS – Flow Management System</h4>
                    {activeReport.modules.fms.tasks.filter(t => t.baseStatus === "completed" || t.baseStatus === "verified").length === 0 ? (
                      <p className="no-pending-msg">No completed FMS tasks for this week</p>
                    ) : (
                      <div className="pending-list">
                        {activeReport.modules.fms.tasks
                          .filter(t => t.baseStatus === "completed" || t.baseStatus === "verified")
                          .map(t => {
                            const compTime = new Date(t.completedAt || t.dueDate).getTime();
                            const dueTime = new Date(t.dueDate).getTime();
                            const isOnTime = t.isNotApplicable ? true : (compTime <= dueTime);
                            return (
                              <div key={t.id} className="pending-item">
                                <div className="pending-item-details">
                                  <span className="pending-item-name">{t.name}</span>
                                  <span className="pending-item-meta">
                                    Completed: {t.completedAt ? new Date(t.completedAt).toLocaleDateString() : new Date(t.dueDate).toLocaleDateString()}
                                    {t.isNotApplicable ? (
                                      <span style={{ color: "#475569", fontWeight: "bold" }}> [NOT APPLICABLE]</span>
                                    ) : isOnTime ? (
                                      <span style={{ color: "#16a34a", fontWeight: "bold" }}> [ON TIME]</span>
                                    ) : (
                                      <span style={{ color: "#ea580c", fontWeight: "bold" }}> [LATE]</span>
                                    )}
                                    {t.priority && ` | Priority: ${t.priority}`}
                                  </span>
                                </div>
                                <span className={`pending-status-badge ${t.baseStatus}`}>
                                  {t.isNotApplicable ? "Not Applicable" : t.baseStatus}
                                </span>
                              </div>
                            );
                          })}
                      </div>
                    )}
                  </div>

                  {/* Checklist Completed Section */}
                  <div className="pending-section">
                    <h4 className="pending-section-title">Checklist Tasks</h4>
                    {activeReport.modules.checklist.tasks.filter(t => t.baseStatus === "completed" || t.baseStatus === "verified").length === 0 ? (
                      <p className="no-pending-msg">No completed checklist tasks for this week</p>
                    ) : (
                      <div className="pending-list">
                        {activeReport.modules.checklist.tasks
                          .filter(t => t.baseStatus === "completed" || t.baseStatus === "verified")
                          .map(t => {
                            const compTime = new Date(t.completedAt || t.dueDate).getTime();
                            const dueTime = new Date(t.dueDate).getTime();
                            const isOnTime = t.isNotApplicable ? true : (compTime <= dueTime);
                            return (
                              <div key={t.id} className="pending-item">
                                <div className="pending-item-details">
                                  <span className="pending-item-name">{t.name}</span>
                                  <span className="pending-item-meta">
                                    Completed: {t.completedAt ? new Date(t.completedAt).toLocaleDateString() : new Date(t.dueDate).toLocaleDateString()}
                                    {t.isNotApplicable ? (
                                      <span style={{ color: "#475569", fontWeight: "bold" }}> [NOT APPLICABLE]</span>
                                    ) : isOnTime ? (
                                      <span style={{ color: "#16a34a", fontWeight: "bold" }}> [ON TIME]</span>
                                    ) : (
                                      <span style={{ color: "#ea580c", fontWeight: "bold" }}> [LATE]</span>
                                    )}
                                  </span>
                                </div>
                                <span className={`pending-status-badge ${t.baseStatus}`}>
                                  {t.isNotApplicable ? "Not Applicable" : t.baseStatus}
                                </span>
                              </div>
                            );
                          })}
                      </div>
                    )}
                  </div>

                  {/* Delegation Completed Section */}
                  <div className="pending-section">
                    <h4 className="pending-section-title">Delegation Tasks</h4>
                    {activeReport.modules.delegation.tasks.filter(t => t.baseStatus === "completed" || t.baseStatus === "verified").length === 0 ? (
                      <p className="no-pending-msg">No completed delegation tasks for this week</p>
                    ) : (
                      <div className="pending-list">
                        {activeReport.modules.delegation.tasks
                          .filter(t => t.baseStatus === "completed" || t.baseStatus === "verified")
                          .map(t => {
                            const compTime = new Date(t.completedAt || t.dueDate).getTime();
                            const dueTime = new Date(t.dueDate).getTime();
                            const isOnTime = t.isNotApplicable ? true : (compTime <= dueTime);
                            return (
                              <div key={t.id} className="pending-item">
                                <div className="pending-item-details">
                                  <span className="pending-item-name">{t.name}</span>
                                  <span className="pending-item-meta">
                                    Completed: {t.completedAt ? new Date(t.completedAt).toLocaleDateString() : new Date(t.dueDate).toLocaleDateString()}
                                    {t.isNotApplicable ? (
                                      <span style={{ color: "#475569", fontWeight: "bold" }}> [NOT APPLICABLE]</span>
                                    ) : isOnTime ? (
                                      <span style={{ color: "#16a34a", fontWeight: "bold" }}> [ON TIME]</span>
                                    ) : (
                                      <span style={{ color: "#ea580c", fontWeight: "bold" }}> [LATE]</span>
                                    )}
                                  </span>
                                </div>
                                <span className={`pending-status-badge ${t.baseStatus}`}>
                                  {t.isNotApplicable ? "Not Applicable" : t.baseStatus}
                                </span>
                              </div>
                            );
                          })}
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      <style>{`
        .professional-select {
          padding: 10px 16px;
          border-radius: 8px;
          border: 1px solid #cbd5e1;
          background: #ffffff;
          color: #334155;
          font-size: 0.95rem;
          outline: none;
          transition: border-color 0.2s, box-shadow 0.2s;
          box-shadow: 0 1px 2px rgba(0,0,0,0.05);
          cursor: pointer;
        }
        .professional-select:focus {
          border-color: #3b82f6;
          box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.1);
        }
        .report-container {
          background: #ffffff;
          color: #0f172a;
          border-radius: 12px;
          padding: 32px;
          box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06);
          border: 1px solid #e2e8f0;
        }
        .bold-red {
          color: #ef4444;
          font-weight: 700;
          font-size: 1.35rem;
        }
        .tabs-container {
          display: flex;
          border-bottom: 1px solid #e2e8f0;
          margin-bottom: 32px;
          gap: 32px;
        }
        .tab-button {
          background: transparent;
          border: none;
          color: #64748b;
          font-size: 1rem;
          font-weight: 600;
          padding: 12px 4px;
          cursor: pointer;
          position: relative;
          transition: color 0.2s;
        }
        .tab-button:hover {
          color: #0f172a;
        }
        .tab-button.active {
          color: #2563eb;
        }
        .tab-button.active::after {
          content: '';
          position: absolute;
          bottom: -1px;
          left: 0;
          width: 100%;
          height: 3px;
          background-color: #2563eb;
          border-radius: 3px 3px 0 0;
        }
        .modules-list-container {
          display: flex;
          flex-direction: column;
          gap: 16px;
        }
        .module-list-row {
          background: #ffffff;
          padding: 20px 24px;
          border-radius: 10px;
          border: 1px solid #e2e8f0;
          border-left: 4px solid #3b82f6;
          box-shadow: 0 1px 3px rgba(0,0,0,0.05);
          display: flex;
          flex-direction: column;
          gap: 16px;
        }
        .module-list-row.inactive {
          border-left: 4px solid #cbd5e1;
          opacity: 0.8;
        }
        .module-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          border-bottom: 1px solid #f1f5f9;
          padding-bottom: 12px;
        }
        .module-header h3 {
          margin: 0 0 4px 0;
          font-size: 1.1rem;
          color: #1e293b;
          font-weight: 600;
        }
        .module-sub {
          font-size: 0.85rem;
          color: #64748b;
        }
        .module-gap-score {
          text-align: right;
        }
        .module-gap-score span:first-child {
          display: block;
          font-size: 0.8rem;
          color: #64748b;
          text-transform: uppercase;
          letter-spacing: 0.05em;
          margin-bottom: 2px;
        }
        .module-details {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
          gap: 16px;
        }
        .details-group {
          background: #f8fafc;
          padding: 16px;
          border-radius: 8px;
          border: 1px solid #f1f5f9;
        }
        .details-group h4 {
          margin: 0 0 12px 0;
          color: #334155;
          font-size: 0.9rem;
          font-weight: 600;
        }
        .details-stats {
          display: flex;
          flex-direction: column;
          gap: 6px;
          font-size: 0.85rem;
          color: #475569;
        }
        .details-stats span {
          color: #94a3b8;
          display: inline-block;
          width: 50px;
        }
        .tasks-group {
          background: #f0fdf4;
          border-color: #dcfce7;
        }
        .tasks-group h4 {
          color: #166534;
        }
        .tasks-stats {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 8px;
        }
        .task-count {
          background: #ffffff;
          padding: 6px 10px;
          border-radius: 6px;
          border: 1px solid #e2e8f0;
          font-weight: 500;
        }
        .task-count span {
          width: auto;
          margin-right: 6px;
          font-weight: 400;
        }
        .task-count.total { border-left: 3px solid #3b82f6; color: #1e40af; }
        .task-count.completed { border-left: 3px solid #22c55e; color: #166534; }
        .task-count.running { border-left: 3px solid #eab308; color: #854d0e; }
        .task-count.pending { border-left: 3px solid #f97316; color: #9a3412; }
        .status-badge {
          background: #f1f5f9;
          padding: 6px 12px;
          border-radius: 6px;
          display: inline-block;
          font-size: 0.85rem;
          color: #475569;
          font-weight: 500;
        }
        .task-section {
          margin-bottom: 40px;
        }
        .task-section h3 {
          color: #0f172a;
          margin-bottom: 20px;
          font-size: 1.15rem;
          font-weight: 600;
        }
        .task-table {
          width: 100%;
          border-collapse: separate;
          border-spacing: 0;
          background: #ffffff;
          border-radius: 8px;
          border: 1px solid #e2e8f0;
          overflow: hidden;
        }
        .task-table th, .task-table td {
          padding: 16px 20px;
          text-align: left;
          border-bottom: 1px solid #e2e8f0;
        }
        .task-table th {
          background: #f8fafc;
          color: #475569;
          font-weight: 600;
          font-size: 0.8rem;
          text-transform: uppercase;
          letter-spacing: 0.05em;
        }
        .task-table td {
          font-size: 0.95rem;
          color: #334155;
        }
        .task-table tbody tr:last-child td {
          border-bottom: none;
        }
        .task-table tbody tr:hover {
          background: #f8fafc;
        }
        .custom-modal-backdrop {
          position: fixed;
          top: 0;
          left: 0;
          width: 100vw;
          height: 100vh;
          background: rgba(15, 23, 42, 0.6);
          backdrop-filter: blur(4px);
          display: flex;
          align-items: center;
          justify-content: center;
          z-index: 9999;
          animation: fadeIn 0.25s ease-out;
        }
        .custom-modal-content {
          background: #ffffff;
          border-radius: 16px;
          width: 90%;
          max-width: 550px;
          max-height: 85vh;
          overflow-y: auto;
          box-shadow: 0 20px 25px -5px rgba(0, 0, 0, 0.15), 0 10px 10px -5px rgba(0, 0, 0, 0.04);
          border: 1px solid #e2e8f0;
          display: flex;
          flex-direction: column;
          animation: slideUp 0.25s ease-out;
        }
        .custom-modal-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          padding: 20px 24px;
          border-bottom: 1px solid #e2e8f0;
        }
        .custom-modal-header h2 {
          margin: 0;
          font-size: 1.2rem;
          font-weight: 700;
          color: #0f172a;
        }
        .custom-modal-close {
          background: #f1f5f9;
          border: none;
          font-size: 1.25rem;
          color: #64748b;
          cursor: pointer;
          width: 32px;
          height: 32px;
          border-radius: 50%;
          display: flex;
          align-items: center;
          justify-content: center;
          transition: background-color 0.2s, color 0.2s;
        }
        .custom-modal-close:hover {
          background-color: #e2e8f0;
          color: #0f172a;
        }
        .custom-modal-body {
          padding: 24px;
        }
        .modal-pending-banner {
          background: #fffbeb;
          border: 1px solid #fef3c7;
          padding: 12px 16px;
          border-radius: 8px;
          color: #b45309;
          font-weight: 600;
          font-size: 13px;
          margin-bottom: 20px;
          line-height: 1.4;
        }
        .modal-ratings-grid {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 16px;
          margin-bottom: 20px;
        }
        .modal-rating-card {
          background: #f8fafc;
          border: 1px solid #e2e8f0;
          border-radius: 10px;
          padding: 16px;
          text-align: center;
        }
        .modal-rating-card h4 {
          margin: 0 0 6px 0;
          font-size: 0.8rem;
          color: #64748b;
          text-transform: uppercase;
          letter-spacing: 0.05em;
        }
        .rating-val {
          font-size: 1.4rem;
          font-weight: 700;
          color: #0f172a;
          margin-bottom: 2px;
        }
        .rating-weight {
          font-size: 11px;
          color: #94a3b8;
        }
        .modal-modules-stack {
          display: flex;
          flex-direction: column;
          gap: 16px;
          margin-bottom: 20px;
        }
        .modal-module-card {
          background: #ffffff;
          border: 1px solid #e2e8f0;
          border-radius: 10px;
          padding: 16px;
          border-left: 4px solid #2563eb;
          box-shadow: 0 1px 3px rgba(0,0,0,0.02);
        }
        .modal-module-card h3 {
          margin: 0 0 12px 0;
          font-size: 0.95rem;
          color: #1e293b;
          font-weight: 700;
        }
        .modal-stats-grid {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 12px;
        }
        .modal-stat-item {
          display: flex;
          justify-content: space-between;
          font-size: 0.85rem;
          color: #475569;
          background: #f8fafc;
          padding: 6px 10px;
          border-radius: 6px;
          border: 1px solid #f1f5f9;
        }
        .stat-lbl {
          font-weight: 500;
        }
        .stat-num {
          font-weight: 700;
          color: #0f172a;
        }
        .stat-num.green {
          color: #166534;
        }
        .stat-num.red {
          color: #b91c1c;
        }
        .modal-footer-summary {
          background: #f8fafc;
          border: 1px solid #e2e8f0;
          border-radius: 10px;
          padding: 16px;
        }
        .footer-stat {
          display: flex;
          justify-content: space-between;
          align-items: center;
          font-size: 0.95rem;
          color: #334155;
        }
        .footer-stat span {
          font-weight: 500;
        }
        .footer-stat strong {
          font-size: 1.1rem;
          color: #0f172a;
        }
        .footer-stat strong.final-score {
          font-size: 1.3rem;
          color: #ef4444;
        }
        .modal-tabs {
          display: flex;
          border-bottom: 1px solid #e2e8f0;
          padding: 0 24px;
          background: #f8fafc;
        }
        .modal-tab-btn {
          background: transparent;
          border: none;
          color: #64748b;
          font-size: 0.9rem;
          font-weight: 600;
          padding: 12px 16px;
          cursor: pointer;
          position: relative;
          transition: color 0.2s;
        }
        .modal-tab-btn:hover {
          color: #0f172a;
        }
        .modal-tab-btn.active {
          color: #2563eb;
        }
        .modal-tab-btn.active::after {
          content: '';
          position: absolute;
          bottom: -1px;
          left: 0;
          width: 100%;
          height: 3px;
          background-color: #2563eb;
          border-radius: 3px 3px 0 0;
        }
        .modal-pending-tab-content {
          display: flex;
          flex-direction: column;
          gap: 20px;
        }
        .pending-section {
          background: #ffffff;
          border: 1px solid #e2e8f0;
          border-radius: 10px;
          padding: 16px;
        }
        .pending-section-title {
          margin: 0 0 12px 0;
          font-size: 0.95rem;
          font-weight: 700;
          color: #1e293b;
          border-bottom: 2px solid #2563eb;
          padding-bottom: 4px;
          display: inline-block;
        }
        .pending-list {
          display: flex;
          flex-direction: column;
          gap: 8px;
        }
        .pending-item {
          display: flex;
          justify-content: space-between;
          align-items: center;
          background: #f8fafc;
          border: 1px solid #f1f5f9;
          padding: 10px 12px;
          border-radius: 6px;
        }
        .pending-item-details {
          display: flex;
          flex-direction: column;
          gap: 2px;
        }
        .pending-item-name {
          font-size: 0.88rem;
          font-weight: 600;
          color: #0f172a;
        }
        .pending-item-meta {
          font-size: 0.75rem;
          color: #64748b;
        }
        .overdue-tag {
          color: #ef4444;
          font-weight: 700;
        }
        .no-pending-msg {
          font-size: 0.85rem;
          color: #475569;
          font-style: italic;
          margin: 0;
        }
        .pending-status-badge {
          font-size: 11px;
          font-weight: 700;
          text-transform: uppercase;
          padding: 2px 6px;
          border-radius: 4px;
        }
        .pending-status-badge.pending {
          background: #fef3c7;
          color: #d97706;
        }
        .pending-status-badge.running {
          background: #dbeafe;
          color: #1d4ed8;
        }
        .pending-status-badge.failed {
          background: #fee2e2;
          color: #b91c1c;
        }
        @keyframes fadeIn {
          from { opacity: 0; }
          to { opacity: 1; }
        }
        @keyframes slideUp {
          from { transform: translateY(20px); opacity: 0; }
          to { transform: translateY(0); opacity: 1; }
        }
      `}</style>
    </div>
  );
}

const cardStyle: React.CSSProperties = {
  background: "white",
  padding: "20px",
  borderRadius: 8,
  boxShadow: "0 1px 3px rgba(0,0,0,0.05)",
  border: "1px solid #e2e8f0",
  display: "flex",
  flexDirection: "column",
  alignItems: "center",
  justifyContent: "center",
  textAlign: "center"
};

const cardTitle: React.CSSProperties = {
  fontSize: 12,
  fontWeight: 600,
  color: "#64748b",
  textTransform: "uppercase",
  margin: 0,
  letterSpacing: "0.05em"
};
