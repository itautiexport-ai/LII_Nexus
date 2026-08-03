import React, { useState, useEffect } from "react";
import { misScoreApi, MisScoreReport } from "../api/misScoreApi";

export default function CumulativeScoreCardsPage() {
  const [reports, setReports] = useState<MisScoreReport[]>([]);
  const [loading, setLoading] = useState(false);
  const [period, setPeriod] = useState("yearly");

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

  return (
    <div style={containerStyle}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 20 }}>
        <div>
          <h1 style={{ margin: "0 0 8px 0" }}>Cumulative Score Cards</h1>
          <p style={{ color: "#6b7280", margin: 0 }}>View all employee scores and rankings on a 10-point scale.</p>
        </div>
        <div>
          <select 
            value={period} 
            onChange={(e) => setPeriod(e.target.value)}
            style={{ padding: 8, borderRadius: 4, border: "1px solid #d1d5db" }}
          >
            <option value="weekly">Weekly Score</option>
            <option value="monthly">Monthly Score</option>
            <option value="yearly">Yearly Score</option>
          </select>
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
