import React, { useState, useEffect } from "react";
import { usersApi, UserRecord } from "../../admin/users/api/usersApi";
import { officeEmApi, OfficeEmReport, OfficeEmModuleScore, OfficeEmTaskDetail } from "../api/officeEmApi";
import { misScoreApi, MisScoreReport } from "../api/misScoreApi";

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
  const [report, setReport] = useState<OfficeEmReport | null>(null);
  const [misReport, setMisReport] = useState<MisScoreReport | null>(null);
  const [loading, setLoading] = useState(false);
  const [activeTab, setActiveTab] = useState<"scores" | "tasks">("scores");

  useEffect(() => {
    usersApi.list().then(setUsers);
  }, []);

  useEffect(() => {
    if (selectedUser) {
      setLoading(true);
      Promise.all([
        officeEmApi.getGapScore(selectedUser, period),
        misScoreApi.getReport(selectedUser, period).catch(() => null)
      ])
        .then(([gapRes, misRes]) => {
          setReport(gapRes.data);
          setMisReport(misRes);
        })
        .catch(err => console.error(err))
        .finally(() => setLoading(false));
    } else {
      setReport(null);
      setMisReport(null);
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
          if (compTime <= dueTime) {
            acc.completedOnTime++;
          }
        }
        else if (t.baseStatus === "running") acc.running++;
        else if (t.baseStatus === "pending") acc.pending++;
        return acc;
      },
      { total: 0, completed: 0, completedOnTime: 0, running: 0, pending: 0 }
    );
  };

  const renderModuleListRow = (title: string, data: OfficeEmModuleScore) => {
    if (!data.isActive) {
      return (
        <div className="module-list-row inactive">
          <div className="module-header">
            <h3>{title}</h3>
            <span className="status-badge">Not Assigned</span>
          </div>
        </div>
      );
    }

    const taskCounts = calculateTaskCounts(data.tasks);

    return (
      <div className="module-list-row">
        <div className="module-header">
          <div>
            <h3>{title}</h3>
            <div className="module-sub">
              Normalized Weight: {data.normalizedWeight.toFixed(1)}% (Standard: {data.standardWeight}%)
            </div>
          </div>
          <div className="module-gap-score">
            <span>Gap Score</span>
            <span className="bold-red">{data.gapScore.toFixed(1)}</span>
          </div>
        </div>

        <div className="module-details">
          <div className="details-group">
            <h4>Work Completion (60%)</h4>
            <div className="details-stats">
              <div><span>Points:</span> {data.completedPoints} / {data.totalDuePoints}</div>
              <div><span>Rate:</span> {data.completionPercent.toFixed(1)}%</div>
              <div><span>Gap:</span> {data.completionGap.toFixed(1)}</div>
            </div>
          </div>

          <div className="details-group">
            <h4>Timeliness (40%)</h4>
            <div className="details-stats">
              <div><span>Points:</span> {data.onTimePoints} / {data.completedPoints}</div>
              <div><span>Rate:</span> {data.onTimePercent.toFixed(1)}%</div>
              <div><span>Gap:</span> {data.timelinessGap.toFixed(1)}</div>
            </div>
          </div>

          <div className="details-group tasks-group">
            <h4>Task Allocation</h4>
            <div className="details-stats tasks-stats">
              <div className="task-count total"><span>Total:</span> {taskCounts.total}</div>
              <div className="task-count completed"><span>Completed:</span> {taskCounts.completed}</div>
              <div className="task-count on-time" style={{ borderLeft: "3px solid #10b981", color: "#047857" }}><span>On Time:</span> {taskCounts.completedOnTime}</div>
              <div className="task-count running"><span>Running:</span> {taskCounts.running}</div>
              <div className="task-count pending"><span>Pending:</span> {taskCounts.pending}</div>
            </div>
          </div>
        </div>
      </div>
    );
  };

  const renderStatusBadge = (status: string) => {
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
        <div className="task-section">
          <h3>{title}</h3>
          <p style={{ color: "#64748b", fontStyle: "italic", background: "#f8fafc", padding: "16px", borderRadius: "8px", border: "1px dashed #cbd5e1" }}>
            No tasks found in this period.
          </p>
        </div>
      );
    }

    return (
      <div className="task-section">
        <h3>{title}</h3>
        <div style={{ overflowX: "auto" }}>
          <table className="task-table">
            <thead>
              <tr>
                <th>Task Name</th>
                <th>Status</th>
                <th>Due Date</th>
                <th>Completed At</th>
              </tr>
            </thead>
            <tbody>
              {tasks.map(t => (
                <tr key={t.id}>
                  <td style={{ fontWeight: 500, color: "#1e293b" }}>{t.name}</td>
                  <td>{renderStatusBadge(t.baseStatus)}</td>
                  <td>{new Date(t.dueDate).toLocaleDateString()}</td>
                  <td>{t.completedAt ? new Date(t.completedAt).toLocaleDateString() : "-"}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    );
  };

  return (
    <div style={{ padding: "24px 32px", fontFamily: "'Inter', sans-serif", backgroundColor: "#f8fafc", minHeight: "100vh" }}>
      <h1 style={{ fontSize: "24px", marginBottom: "24px", color: "#0f172a", fontWeight: 600 }}>LII Performance Gap Score (Office EM)</h1>

      <div style={{ display: "flex", gap: "16px", marginBottom: "32px", alignItems: "center" }}>
        <select className="professional-select" value={selectedUser} onChange={e => setSelectedUser(e.target.value)}>
          <option value="">-- Select Employee --</option>
          {users.map(u => (
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
      </div>

      {loading && <p style={{ color: "#64748b" }}>Loading Gap Score...</p>}

      {!loading && report && (
        <div className="report-container">
          <div className="final-score-banner">
            <h2 style={{ margin: 0, color: "#334155", fontWeight: 600, fontSize: "1.25rem" }}>Final Performance Gap Score</h2>
            <div className="score-display">
              {report.finalGapScore.toFixed(1)}
            </div>
            <p style={{ margin: 0, color: "#64748b", fontSize: "0.9rem" }}>Best possible score: 0 &nbsp;|&nbsp; Worst possible score: -100</p>
            <p style={{ margin: "4px 0 0", color: "#94a3b8", fontSize: "0.85rem" }}>The closer to 0, the better the performance.</p>
          </div>

          {misReport && (
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))", gap: "16px", margin: "24px 0" }}>
              <div style={cardStyle}>
                <h3 style={cardTitle}>System Execution Score</h3>
                <p style={{ fontSize: 32, fontWeight: 700, color: "#111827", margin: "10px 0" }}>
                  {misReport.systemScore} <span style={{ fontSize: 16, color: "#6b7280" }}>/ 5</span>
                </p>
                <p style={{ fontSize: 12, color: "#6b7280", margin: 0 }}>Based on On-Time Task %</p>
              </div>

              <div style={cardStyle}>
                <h3 style={cardTitle}>HOD Evaluation</h3>
                {misReport.hodScore !== null ? (
                  <p style={{ fontSize: 32, fontWeight: 700, color: "#111827", margin: "10px 0" }}>
                    {misReport.hodScore} <span style={{ fontSize: 16, color: "#6b7280" }}>/ 5</span>
                  </p>
                ) : (
                  <p style={{ fontSize: 24, fontWeight: 700, color: "#d97706", margin: "10px 0" }}>Pending</p>
                )}
              </div>

              <div style={cardStyle}>
                <h3 style={cardTitle}>HR Evaluation</h3>
                {misReport.hrScore !== null ? (
                  <p style={{ fontSize: 32, fontWeight: 700, color: "#111827", margin: "10px 0" }}>
                    {misReport.hrScore} <span style={{ fontSize: 16, color: "#6b7280" }}>/ 5</span>
                  </p>
                ) : (
                  <p style={{ fontSize: 24, fontWeight: 700, color: "#d97706", margin: "10px 0" }}>Pending</p>
                )}
              </div>

              <div style={cardStyle}>
                <h3 style={cardTitle}>Attendance</h3>
                {misReport.attendancePercentage !== null ? (
                  <p style={{ fontSize: 32, fontWeight: 700, color: "#111827", margin: "10px 0" }}>
                    {misReport.attendancePercentage}%
                  </p>
                ) : (
                  <p style={{ fontSize: 24, fontWeight: 700, color: "#d97706", margin: "10px 0" }}>Pending</p>
                )}
              </div>
            </div>
          )}

          <div className="tabs-container">
            <button 
              className={`tab-button ${activeTab === "scores" ? "active" : ""}`} 
              onClick={() => setActiveTab("scores")}
            >
              Scores
            </button>
            <button 
              className={`tab-button ${activeTab === "tasks" ? "active" : ""}`} 
              onClick={() => setActiveTab("tasks")}
            >
              View Tasks
            </button>
          </div>

          <div className="tab-content">
            {activeTab === "scores" && (
              <div className="modules-list-container">
                {renderModuleListRow("FMS – Flow Management System", report.modules.fms)}
                {renderModuleListRow("Checklist", report.modules.checklist)}
                {renderModuleListRow("Delegation", report.modules.delegation)}
              </div>
            )}

            {activeTab === "tasks" && (
              <div className="tasks-view">
                {renderTaskTable("FMS – Flow Management System", report.modules.fms.tasks)}
                {renderTaskTable("Checklist", report.modules.checklist.tasks)}
                {renderTaskTable("Delegation", report.modules.delegation.tasks)}
              </div>
            )}
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
        .final-score-banner {
          text-align: center;
          background: #f8fafc;
          padding: 32px 24px;
          border-radius: 12px;
          margin-bottom: 32px;
          border: 1px solid #e2e8f0;
        }
        .score-display {
          font-size: 4rem;
          color: #ef4444;
          font-weight: 800;
          margin: 12px 0;
          letter-spacing: -0.02em;
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
          flex-direction: row;
          align-items: center;
          justify-content: space-between;
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
        .bold-red {
          color: #ef4444;
          font-weight: 700;
          font-size: 1.35rem;
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
