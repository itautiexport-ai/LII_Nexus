import React, { useState, useEffect } from "react";
import { misScoreApi, MisScoreReport } from "../api/misScoreApi";
import * as XLSX from "xlsx";

export default function CumulativeScoreCardsPage() {
  const [reports, setReports] = useState<MisScoreReport[]>([]);
  const [loading, setLoading] = useState(false);
  const [period, setPeriod] = useState("yearly");
  const [showActions, setShowActions] = useState(false);

  useEffect(() => {
    if (!showActions) return;
    const close = () => setShowActions(false);
    document.addEventListener("click", close);
    return () => document.removeEventListener("click", close);
  }, [showActions]);

  useEffect(() => {
    fetchCumulativeScores();
  }, [period]);

  const fetchCumulativeScores = () => {
    setLoading(true);
    misScoreApi.getCumulativeScores(period)
      .then(setReports)
      .catch(console.error)
      .finally(() => setLoading(false));
  };

  const handleExportExcel = () => {
    if (reports.length === 0) return;
    const wsData = reports.map(r => ({
      "Employee": r.employeeName,
      "Period Start": r.periodStart,
      "Period End": r.periodEnd,
      "System Score (/5)": r.systemScore,
      "Manager Score (/5)": r.managerEvaluationScore !== null ? r.managerEvaluationScore : "Pending",
      "Final Score (/10)": r.finalScore,
      "Rating": r.rating,
      "Multiplier": `${r.incrementMultiplier}x`
    }));
    const ws = XLSX.utils.json_to_sheet(wsData);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Cumulative Scores");
    XLSX.writeFile(wb, `Cumulative_Scores_${period}.xlsx`);
  };

  const handlePrint = () => {
    window.print();
  };

  return (
    <div style={containerStyle}>
      <style>{`
        @media print {
          .no-print {
            display: none !important;
          }
          body {
            background: #ffffff !important;
            padding: 0 !important;
          }
        }
      `}</style>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 20 }}>
        <div>
          <h1 style={{ margin: "0 0 8px 0" }}>Cumulative Score Cards</h1>
          <p style={{ color: "#6b7280", margin: 0 }}>View all employee scores and rankings on a 10-point scale.</p>
        </div>
        <div style={{ display: "flex", gap: "10px", alignItems: "center" }}>
          <select 
            value={period} 
            onChange={(e) => setPeriod(e.target.value)}
            style={{ padding: 8, borderRadius: 4, border: "1px solid #d1d5db" }}
          >
            <option value="weekly">Weekly Score</option>
            <option value="monthly">Monthly Score</option>
            <option value="yearly">Yearly Score</option>
          </select>
          {reports.length > 0 && (
            <div className="no-print" style={{ position: "relative", display: "inline-block" }}>
              <button 
                onClick={(e) => {
                  e.stopPropagation();
                  setShowActions(!showActions);
                }}
                style={{ padding: "8px 16px", backgroundColor: "#2563eb", color: "white", border: "none", borderRadius: 4, cursor: "pointer", fontWeight: 600, fontSize: 13, display: "flex", alignItems: "center", gap: "4px" }}
              >
                📥 Options <span style={{ fontSize: "10px" }}>▼</span>
              </button>
              
              {showActions && (
                <div style={{
                  position: "absolute",
                  top: "100%",
                  right: 0,
                  marginTop: "6px",
                  background: "#ffffff",
                  border: "1px solid #cbd5e1",
                  borderRadius: "8px",
                  boxShadow: "0 4px 6px -1px rgba(0,0,0,0.1), 0 2px 4px -1px rgba(0,0,0,0.06)",
                  zIndex: 100,
                  minWidth: "160px",
                  overflow: "hidden"
                }}>
                  <button 
                    onClick={() => {
                      handleExportExcel();
                      setShowActions(false);
                    }}
                    style={{
                      width: "100%",
                      padding: "10px 16px",
                      textAlign: "left",
                      background: "none",
                      border: "none",
                      color: "#1e293b",
                      fontSize: "0.85rem",
                      fontWeight: 500,
                      cursor: "pointer",
                      borderBottom: "1px solid #f1f5f9"
                    }}
                    onMouseOver={(e) => (e.currentTarget.style.backgroundColor = "#f1f5f9")}
                    onMouseOut={(e) => (e.currentTarget.style.backgroundColor = "transparent")}
                  >
                    🟢 Export Excel
                  </button>
                  <button 
                    onClick={() => {
                      handlePrint();
                      setShowActions(false);
                    }}
                    style={{
                      width: "100%",
                      padding: "10px 16px",
                      textAlign: "left",
                      background: "none",
                      border: "none",
                      color: "#1e293b",
                      fontSize: "0.85rem",
                      fontWeight: 500,
                      cursor: "pointer"
                    }}
                    onMouseOver={(e) => (e.currentTarget.style.backgroundColor = "#f1f5f9")}
                    onMouseOut={(e) => (e.currentTarget.style.backgroundColor = "transparent")}
                  >
                    🖨️ Print / PDF
                  </button>
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      <div style={{ background: "white", borderRadius: 8, boxShadow: "0 1px 3px rgba(0,0,0,0.1)", overflow: "hidden" }}>
        {loading ? (
          <p style={{ padding: 20 }}>Loading cumulative scores...</p>
        ) : (
          <table style={{ width: "100%", borderCollapse: "collapse" }}>
            <thead>
              <tr style={{ background: "#f3f4f6", textAlign: "left", fontSize: 13, color: "#374151" }}>
                <th style={thStyle}>Employee</th>
                <th style={thStyle}>Period</th>
                <th style={thStyle}>System Score (/5)</th>
                <th style={thStyle}>Manager Score (/5)</th>
                <th style={thStyle}>Final Score (/10)</th>
                <th style={thStyle}>Rating</th>
                <th style={thStyle}>Multiplier</th>
              </tr>
            </thead>
            <tbody>
              {reports.map((r, idx) => (
                <tr key={idx} style={{ borderBottom: "1px solid #e5e7eb" }}>
                  <td style={tdStyle}><strong>{r.employeeName}</strong></td>
                  <td style={tdStyle}>{r.periodStart} to {r.periodEnd}</td>
                  <td style={tdStyle}>
                    <span style={{ fontWeight: 600, color: "#2563eb" }}>{r.systemScore}</span>
                  </td>
                  <td style={tdStyle}>
                    <div>
                      <span style={{ fontSize: "11px", fontWeight: "600", textTransform: "uppercase", color: "#64748b" }}>Manager/HR Eval</span>
                      <div style={{ fontSize: "15px", fontWeight: "700", color: "#1e293b", marginTop: "2px" }}>
                        {r.managerEvaluationScore !== null ? `${r.managerEvaluationScore} / 5` : <span style={{ color: "#d97706", fontSize: "13px" }}>Pending</span>}
                      </div>
                    </div>
                  </td>
                  <td style={tdStyle}>
                    <span style={{ 
                      fontSize: 16, 
                      fontWeight: 700, 
                      color: r.finalScore < 5 ? "#dc2626" : "#16a34a" 
                    }}>
                      {r.finalScore}
                    </span>
                  </td>
                  <td style={tdStyle}>
                    <span style={{
                      padding: "4px 8px", borderRadius: 4, fontSize: 12, fontWeight: 600,
                      background: r.rating === "Critical" || r.rating === "Weak" ? "#fee2e2" :
                                  r.rating === "Average" ? "#fef3c7" : "#dcfce3",
                      color: r.rating === "Critical" || r.rating === "Weak" ? "#dc2626" :
                             r.rating === "Average" ? "#d97706" : "#16a34a"
                    }}>
                      {r.rating}
                    </span>
                  </td>
                  <td style={tdStyle}>
                    <strong>{r.incrementMultiplier}x</strong>
                  </td>
                </tr>
              ))}
              {reports.length === 0 && (
                <tr>
                  <td colSpan={7} style={{ padding: 20, textAlign: "center", color: "#6b7280" }}>No data found.</td>
                </tr>
              )}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}

const containerStyle: React.CSSProperties = {
  maxWidth: 1200,
  margin: "0 auto",
  padding: "20px",
  fontFamily: "system-ui, -apple-system, sans-serif"
};

const thStyle: React.CSSProperties = {
  padding: "12px 20px",
  borderBottom: "2px solid #e5e7eb"
};

const tdStyle: React.CSSProperties = {
  padding: "16px 20px",
  color: "#111827",
  fontSize: 14
};
