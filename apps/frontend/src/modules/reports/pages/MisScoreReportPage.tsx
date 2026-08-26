import React, { useState, useEffect } from "react";
import { employeesApi, EmployeeRecord } from "../../admin/organization/employees/api/employeesApi";
import { misScoreApi, MisScoreReport } from "../api/misScoreApi"; 
import * as XLSX from "xlsx";

export default function MisScoreReportPage() {
  const [employees, setEmployees] = useState<EmployeeRecord[]>([]);
  const [selectedUser, setSelectedUser] = useState<string>("");
  const [report, setReport] = useState<MisScoreReport | null>(null);
  const [loading, setLoading] = useState(false);
  const [period, setPeriod] = useState("weekly");
  const [standardIncrement, setStandardIncrement] = useState(8);
  const [showActions, setShowActions] = useState(false);

  useEffect(() => {
    if (!showActions) return;
    const close = () => setShowActions(false);
    document.addEventListener("click", close);
    return () => document.removeEventListener("click", close);
  }, [showActions]);



  useEffect(() => {
    employeesApi.listForDropdown().then(setEmployees);
  }, []);

  const fetchReport = () => {
    if (selectedUser) {
      setLoading(true);
      misScoreApi.getReport(selectedUser, period)
        .then(setReport)
        .catch(console.error)
        .finally(() => setLoading(false));
    } else {
      setReport(null);
    }
  };

  useEffect(() => {
    fetchReport();
  }, [selectedUser, period]);



  const totalIncrementMultiplier = report ? report.incrementMultiplier : 0;
  const finalIncrement = standardIncrement * totalIncrementMultiplier;

  const handleExportExcel = () => {
    if (!report) return;
    const empName = employees.find(e => e.userId === selectedUser)?.fullName || selectedUser;
    const wsData = [
      { "Metric": "Employee Name", "Value": empName },
      { "Metric": "Period", "Value": period },
      { "Metric": "System Execution Score (/5)", "Value": report.systemScore },
      { "Metric": "HOD Evaluation Score (/5)", "Value": report.hodScore !== null ? report.hodScore : "Pending" },
      { "Metric": "HR Evaluation Score (/5)", "Value": report.hrScore !== null ? report.hrScore : "Pending" },
      { "Metric": "Attendance Percentage (%)", "Value": report.attendancePercentage !== null ? `${report.attendancePercentage}%` : "Pending" },
      { "Metric": "Final 10-Point Score (/10)", "Value": report.finalScore },
      { "Metric": "Rating", "Value": report.rating },
      { "Metric": "Increment Multiplier", "Value": `${report.incrementMultiplier}x` },
      { "Metric": "Proposed Merit Increment (%)", "Value": `${finalIncrement.toFixed(1)}%` }
    ];
    const ws = XLSX.utils.json_to_sheet(wsData);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "MIS Score");
    XLSX.writeFile(wb, `MIS_Score_${empName}_${period}.xlsx`);
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
      <div className="apgs-header">
        <h1>Individual MIS Score (Out of 10)</h1>
        <p style={{ color: "#6b7280" }}>Objective: 5 points for System Execution + 5 points averaged from HOD, HR, & Attendance.</p>
      </div>

      <div style={{ marginBottom: 20, background: "white", padding: 16, borderRadius: 8, boxShadow: "0 1px 3px rgba(0,0,0,0.1)", display: "flex", gap: 16, flexWrap: "wrap", alignItems: "flex-end" }}>
        <div style={{ flex: 1, minWidth: 200 }}>
          <label style={{ fontWeight: 600, display: "block", marginBottom: 8 }}>Select Employee to Evaluate</label>
          <select 
            value={selectedUser} 
            onChange={(e) => setSelectedUser(e.target.value)}
            style={{ width: "100%", maxWidth: 300, padding: 8, borderRadius: 4, border: "1px solid #d1d5db" }}
          >
            <option value="">-- Choose Employee --</option>
            {employees.map(emp => {
              if (!emp.userId) return null; // Only show employees with linked user accounts
              return (
                <option key={emp.id} value={emp.userId}>
                  {emp.employeeCode} - {emp.fullName}
                </option>
              );
            })}
          </select>
        </div>
        
        <div>
          <label style={{ fontWeight: 600, display: "block", marginBottom: 8 }}>Select Period</label>
          <select 
            value={period} 
            onChange={(e) => setPeriod(e.target.value)}
            style={{ width: "100%", minWidth: 150, padding: 8, borderRadius: 4, border: "1px solid #d1d5db" }}
          >
            <option value="weekly">Weekly Score</option>
            <option value="monthly">Monthly Score</option>
            <option value="yearly">Yearly Score</option>
          </select>
        </div>

        <div>
          <label style={{ fontWeight: 600, display: "block", marginBottom: 8 }}>Standard Increment (%)</label>
          <input 
            type="number"
            value={standardIncrement}
            onChange={(e) => setStandardIncrement(parseFloat(e.target.value) || 0)}
            style={{ width: 100, padding: 8, borderRadius: 4, border: "1px solid #d1d5db" }}
          />
        </div>

        <div className="no-print" style={{ position: "relative", display: "inline-block" }}>
          {report && (
            <>
              <button 
                onClick={(e) => {
                  e.stopPropagation();
                  setShowActions(!showActions);
                }}
                style={{ padding: "8px 16px", backgroundColor: "#2563eb", color: "white", border: "none", borderRadius: 4, cursor: "pointer", fontWeight: 600, fontSize: 13, height: 38, display: "flex", alignItems: "center", gap: "4px" }}
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
            </>
          )}
        </div>
      </div>

      {loading && <p>Calculating 10-Point Score...</p>}

      {report && (
        <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
          {/* Top Cards */}
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))", gap: 16 }}>
            <div style={cardStyle}>
              <h3 style={cardTitle}>System Execution Score</h3>
              <p style={{ fontSize: 32, fontWeight: 700, color: "#111827", margin: "10px 0" }}>
                {report.systemScore} <span style={{ fontSize: 16, color: "#6b7280" }}>/ 5</span>
              </p>
              <p style={{ fontSize: 12, color: "#6b7280" }}>Based on On-Time Task %</p>
            </div>

            <div style={cardStyle}>
              <h3 style={cardTitle}>HOD Evaluation</h3>
              {report.hodScore !== null ? (
                <p style={{ fontSize: 32, fontWeight: 700, color: "#111827", margin: "10px 0" }}>
                  {report.hodScore} <span style={{ fontSize: 16, color: "#6b7280" }}>/ 5</span>
                </p>
              ) : (
                <p style={{ fontSize: 24, fontWeight: 700, color: "#d97706", margin: "10px 0" }}>Pending</p>
              )}
            </div>

            <div style={cardStyle}>
              <h3 style={cardTitle}>HR Evaluation</h3>
              {report.hrScore !== null ? (
                <p style={{ fontSize: 32, fontWeight: 700, color: "#111827", margin: "10px 0" }}>
                  {report.hrScore} <span style={{ fontSize: 16, color: "#6b7280" }}>/ 5</span>
                </p>
              ) : (
                <p style={{ fontSize: 24, fontWeight: 700, color: "#d97706", margin: "10px 0" }}>Pending</p>
              )}
            </div>

            <div style={cardStyle}>
              <h3 style={cardTitle}>Attendance</h3>
              {report.attendancePercentage !== null ? (
                <p style={{ fontSize: 32, fontWeight: 700, color: "#111827", margin: "10px 0" }}>
                  {report.attendancePercentage}%
                </p>
              ) : (
                <p style={{ fontSize: 24, fontWeight: 700, color: "#d97706", margin: "10px 0" }}>Pending</p>
              )}
            </div>

            <div style={{ ...cardStyle, background: "#f8fafc", border: "2px solid #e2e8f0" }}>
              <h3 style={cardTitle}>Final 10-Point Score</h3>
              <p style={{ fontSize: 32, fontWeight: 700, color: report.finalScore < 5 ? "#dc2626" : "#16a34a", margin: "10px 0" }}>
                {report.finalScore} <span style={{ fontSize: 16, color: "#6b7280" }}>/ 10</span>
              </p>
            </div>
            
            <div style={{ ...cardStyle, background: "#eff6ff", border: "2px solid #bfdbfe" }}>
              <h3 style={cardTitle}>Rating & Increment</h3>
              <p style={{ fontSize: 24, fontWeight: 700, color: "#1e40af", margin: "5px 0" }}>
                {report.rating}
              </p>
              <p style={{ fontSize: 14, color: "#1e3a8a", margin: "5px 0" }}>Multiplier: <strong>{totalIncrementMultiplier}x</strong></p>
              <p style={{ fontSize: 16, color: "#15803d", fontWeight: 700, margin: "5px 0" }}>Merit Increment: {finalIncrement.toFixed(1)}%</p>
            </div>
          </div>


        </div>
      )}
    </div>
  );
}

const containerStyle: React.CSSProperties = {
  maxWidth: 1000,
  margin: "0 auto",
  padding: "20px",
  fontFamily: "system-ui, -apple-system, sans-serif"
};

const cardStyle: React.CSSProperties = {
  background: "white",
  padding: "20px",
  borderRadius: 8,
  boxShadow: "0 1px 3px rgba(0,0,0,0.1)",
  border: "1px solid #e5e7eb",
  display: "flex",
  flexDirection: "column",
  alignItems: "center",
  justifyContent: "center",
  textAlign: "center"
};

const cardTitle: React.CSSProperties = {
  margin: 0,
  fontSize: 14,
  textTransform: "uppercase",
  color: "#6b7280",
  letterSpacing: "0.05em"
};

const labelStyle: React.CSSProperties = {
  display: "block", 
  fontSize: 13, 
  fontWeight: 600, 
  marginBottom: 4 
};

const inputStyle: React.CSSProperties = {
  width: "100%", 
  padding: 8, 
  border: "1px solid #d1d5db", 
  borderRadius: 4,
  boxSizing: "border-box"
};
