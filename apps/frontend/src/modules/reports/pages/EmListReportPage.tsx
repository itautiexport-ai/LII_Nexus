import React, { useState, useEffect } from "react";
import { officeEmApi, OfficeEmReport } from "../api/officeEmApi";

function getCurrentWeekString() {
  const d = new Date();
  const dayNum = d.getDay() || 7;
  d.setDate(d.getDate() + 4 - dayNum);
  const yearStart = new Date(d.getFullYear(), 0, 1);
  const weekNo = Math.ceil((((d.getTime() - yearStart.getTime()) / 86400000) + 1) / 7);
  return `${d.getFullYear()}-W${weekNo.toString().padStart(2, "0")}`;
}

export default function EmListReportPage() {
  const [period, setPeriod] = useState(getCurrentWeekString);
  const [reports, setReports] = useState<OfficeEmReport[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    setLoading(true);
    officeEmApi.getGapScoreList(period)
      .then(res => setReports(res.data))
      .catch(err => console.error(err))
      .finally(() => setLoading(false));
  }, [period]);

  return (
    <div style={{ padding: "24px 32px", fontFamily: "'Inter', sans-serif", backgroundColor: "#f8fafc", minHeight: "100vh" }}>
      <h1 style={{ fontSize: "24px", marginBottom: "24px", color: "#0f172a", fontWeight: 600 }}>EM List (Gap Scores)</h1>

      <div style={{ display: "flex", gap: "16px", marginBottom: "32px" }}>
        <input 
          type="week" 
          className="professional-select" 
          value={period} 
          onChange={e => setPeriod(e.target.value)} 
          style={{ width: "200px" }}
        />
      </div>

      {loading && <p style={{ color: "#64748b" }}>Loading EM List...</p>}

      {!loading && (
        <div className="report-container">
          <div style={{ overflowX: "auto" }}>
            <table className="em-table">
              <thead>
                <tr>
                  <th>Employee Name</th>
                  <th>FMS Score</th>
                  <th>Checklist Score</th>
                  <th>Delegation Score</th>
                  <th>Final Gap Score</th>
                </tr>
              </thead>
              <tbody>
                {reports.length === 0 ? (
                  <tr>
                    <td colSpan={5} style={{ textAlign: "center", fontStyle: "italic", color: "#64748b" }}>
                      No active reports found for this period.
                    </td>
                  </tr>
                ) : (
                  reports.map(r => (
                    <tr key={r.employeeId}>
                      <td style={{ fontWeight: 500, color: "#1e293b" }}>{r.employeeName}</td>
                      <td>
                        {r.modules.fms.isActive ? (
                          <span className="bold-red">{r.modules.fms.gapScore.toFixed(1)}</span>
                        ) : (
                          <span className="status-badge">N/A</span>
                        )}
                      </td>
                      <td>
                        {r.modules.checklist.isActive ? (
                          <span className="bold-red">{r.modules.checklist.gapScore.toFixed(1)}</span>
                        ) : (
                          <span className="status-badge">N/A</span>
                        )}
                      </td>
                      <td>
                        {r.modules.delegation.isActive ? (
                          <span className="bold-red">{r.modules.delegation.gapScore.toFixed(1)}</span>
                        ) : (
                          <span className="status-badge">N/A</span>
                        )}
                      </td>
                      <td>
                        <span className="bold-red" style={{ fontSize: "1.1rem" }}>{r.finalGapScore.toFixed(1)}</span>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
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
        .em-table {
          width: 100%;
          border-collapse: separate;
          border-spacing: 0;
          background: #ffffff;
          border-radius: 8px;
          border: 1px solid #e2e8f0;
          overflow: hidden;
        }
        .em-table th, .em-table td {
          padding: 16px 20px;
          text-align: left;
          border-bottom: 1px solid #e2e8f0;
        }
        .em-table th {
          background: #f8fafc;
          color: #475569;
          font-weight: 600;
          font-size: 0.8rem;
          text-transform: uppercase;
          letter-spacing: 0.05em;
        }
        .em-table td {
          font-size: 0.95rem;
          color: #334155;
          vertical-align: middle;
        }
        .em-table tbody tr:last-child td {
          border-bottom: none;
        }
        .em-table tbody tr:hover {
          background: #f8fafc;
        }
        .bold-red {
          color: #ef4444;
          font-weight: 700;
          font-size: 1rem;
        }
        .status-badge {
          background: #f1f5f9;
          padding: 4px 10px;
          border-radius: 6px;
          display: inline-block;
          font-size: 0.8rem;
          color: #64748b;
          font-weight: 500;
        }
      `}</style>
    </div>
  );
}
