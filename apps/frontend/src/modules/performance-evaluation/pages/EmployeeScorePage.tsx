import React, { useState, useEffect } from "react";
import { misScoreApi, MisScoreReport } from "../../reports/api/misScoreApi";
import { employeesApi, EmployeeRecord } from "../../admin/organization/employees/api/employeesApi";

export default function EmployeeScorePage() {
  const [reports, setReports] = useState<MisScoreReport[]>([]);
  const [employees, setEmployees] = useState<EmployeeRecord[]>([]);
  const [loading, setLoading] = useState(false);
  
  // Custom range filters
  const currentYear = new Date().getFullYear();
  const currentMonthNum = (new Date().getMonth() + 1).toString().padStart(2, "0");
  
  const [startMonth, setStartMonth] = useState(`${currentYear}-01`);
  const [endMonth, setEndMonth] = useState(`${currentYear}-${currentMonthNum}`);

  // Search & Filter State
  const [selectedEmployee, setSelectedEmployee] = useState("");
  const [selectedDept, setSelectedDept] = useState("");

  useEffect(() => {
    fetchScores();
  }, [startMonth, endMonth]);

  const fetchScores = async () => {
    if (!startMonth || !endMonth) return;
    setLoading(true);
    const periodRange = `${startMonth}_${endMonth}`;
    try {
      const [scores, empList] = await Promise.all([
        misScoreApi.getCumulativeScores(periodRange),
        employeesApi.list()
      ]);
      setReports(scores);
      setEmployees(empList);
    } catch (err) {
      console.error("Failed to load employee scores:", err);
    } finally {
      setLoading(false);
    }
  };

  // Get departments present in loaded employees
  const departments = Array.from(new Set(employees.map(e => e.departmentName).filter((name): name is string => !!name)));

  // Filtered reports
  const filteredReports = reports.filter(r => {
    const emp = employees.find(e => e.userId === r.employeeId || e.fullName === r.employeeName);
    
    // Match selected employee by ID or full name match
    const matchesEmployee = !selectedEmployee || 
                            r.employeeId === selectedEmployee || 
                            r.employeeName === selectedEmployee || 
                            emp?.id === selectedEmployee ||
                            emp?.userId === selectedEmployee;
                            
    const matchesDept = !selectedDept || emp?.departmentName === selectedDept;

    return matchesEmployee && matchesDept;
  });

  const thStyle: React.CSSProperties = {
    padding: "16px 20px",
    background: "#f8fafc",
    color: "#475569",
    fontWeight: 600,
    fontSize: "0.8rem",
    textTransform: "uppercase",
    letterSpacing: "0.05em",
    textAlign: "left",
    borderBottom: "1px solid #e2e8f0"
  };

  const tdStyle: React.CSSProperties = {
    padding: "16px 20px",
    fontSize: "0.95rem",
    color: "#334155",
    borderBottom: "1px solid #e2e8f0"
  };

  const inputStyle: React.CSSProperties = {
    padding: "8px 12px",
    borderRadius: "8px",
    border: "1px solid #cbd5e1",
    fontSize: "0.9rem",
    outline: "none",
    background: "#ffffff",
    boxShadow: "0 1px 2px rgba(0,0,0,0.05)",
    cursor: "pointer",
    fontWeight: 500,
    color: "#334155"
  };

  return (
    <div style={{ padding: "24px 32px", fontFamily: "'Inter', sans-serif", backgroundColor: "#f8fafc", minHeight: "100vh" }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "28px" }}>
        <div>
          <h1 style={{ fontSize: "24px", margin: "0 0 6px 0", color: "#0f172a", fontWeight: 600 }}>Employee Score</h1>
          <p style={{ color: "#64748b", margin: 0, fontSize: "0.9rem" }}>Select custom start and end months to view calculated score ranges.</p>
        </div>
        <div style={{ display: "flex", gap: "16px", alignItems: "center", background: "#ffffff", padding: "10px 16px", borderRadius: "10px", border: "1px solid #e2e8f0", boxShadow: "0 1px 2px rgba(0,0,0,0.02)" }}>
          <div style={{ display: "flex", gap: "8px", alignItems: "center" }}>
            <span style={{ fontSize: "13px", fontWeight: 600, color: "#64748b" }}>From:</span>
            <input 
              type="month" 
              value={startMonth} 
              min="2026-01" 
              max="2055-12"
              onChange={(e) => setStartMonth(e.target.value)} 
              style={inputStyle}
            />
          </div>
          <div style={{ display: "flex", gap: "8px", alignItems: "center" }}>
            <span style={{ fontSize: "13px", fontWeight: 600, color: "#64748b" }}>To:</span>
            <input 
              type="month" 
              value={endMonth} 
              min="2026-01" 
              max="2055-12"
              onChange={(e) => setEndMonth(e.target.value)} 
              style={inputStyle}
            />
          </div>
        </div>
      </div>

      {/* Filters & Search Row */}
      <div style={{ background: "white", padding: 16, borderRadius: 8, border: "1px solid #e2e8f0", marginBottom: 20, display: "flex", gap: 12, flexWrap: "wrap", alignItems: "center" }}>
        <div style={{ flex: 1, minWidth: 240 }}>
          <select 
            value={selectedEmployee}
            onChange={(e) => setSelectedEmployee(e.target.value)}
            style={{ width: "100%", padding: "8px 12px", border: "1px solid #cbd5e1", borderRadius: 6, fontSize: "0.9rem", background: "white", color: "#334155" }}
          >
            <option value="">All Employees</option>
            {employees.map((emp) => (
              <option key={emp.id} value={emp.userId || emp.id}>
                {emp.employeeCode ? `${emp.employeeCode} - ${emp.fullName}` : emp.fullName}
              </option>
            ))}
          </select>
        </div>
        <div>
          <select 
            value={selectedDept}
            onChange={(e) => setSelectedDept(e.target.value)}
            style={{ padding: "8px 12px", border: "1px solid #cbd5e1", borderRadius: 6, fontSize: "0.9rem", background: "white", color: "#334155" }}
          >
            <option value="">All Departments</option>
            {departments.map((dept, idx) => (
              <option key={idx} value={dept}>{dept}</option>
            ))}
          </select>
        </div>
      </div>

      <div style={{ background: "white", borderRadius: "10px", border: "1px solid #e2e8f0", boxShadow: "0 1px 3px rgba(0,0,0,0.02)", overflow: "hidden" }}>
        {loading ? (
          <p style={{ padding: "24px", textAlign: "center", color: "#64748b" }}>Loading employee score records...</p>
        ) : (
          <table style={{ width: "100%", borderCollapse: "collapse" }}>
            <thead>
              <tr>
                <th style={thStyle}>Employee</th>
                <th style={thStyle}>Department</th>
                <th style={thStyle}>System Execution Score</th>
                <th style={thStyle}>HOD Evaluation</th>
                <th style={thStyle}>HR Evaluation</th>

                <th style={thStyle}>Final Score</th>
                <th style={thStyle}>Rating</th>
              </tr>
            </thead>
            <tbody>
              {filteredReports.map((r, idx) => {
                const emp = employees.find(e => e.userId === r.employeeId || e.fullName === r.employeeName);
                
                return (
                  <tr key={idx} style={{ borderBottom: "1px solid #e2e8f0" }}>
                    <td style={tdStyle}>
                      <div>
                        <strong style={{ color: "#0f172a" }}>{r.employeeName}</strong>
                        {emp?.employeeCode && <div style={{ fontSize: "11px", color: "#64748b", marginTop: "2px" }}>{emp.employeeCode}</div>}
                      </div>
                    </td>
                    <td style={tdStyle}>{emp?.departmentName || "—"}</td>
                    <td style={tdStyle}>
                      <strong>{r.systemScore}</strong> <span style={{ fontSize: "12px", color: "#94a3b8" }}>/ 5</span>
                    </td>
                    <td style={tdStyle}>
                      {r.hodScore !== null ? (
                        <span><strong>{r.hodScore}</strong> <span style={{ fontSize: "12px", color: "#94a3b8" }}>/ 5</span></span>
                      ) : (
                        <span style={{ color: "#d97706", fontWeight: 600, fontSize: "13px" }}>Pending</span>
                      )}
                    </td>
                    <td style={tdStyle}>
                      {r.hrScore !== null ? (
                        <span><strong>{r.hrScore}</strong> <span style={{ fontSize: "12px", color: "#94a3b8" }}>/ 5</span></span>
                      ) : (
                        <span style={{ color: "#d97706", fontWeight: 600, fontSize: "13px" }}>Pending</span>
                      )}
                    </td>

                    <td style={tdStyle}>
                      <span style={{ color: "#1e3a8a", fontWeight: 700 }}>{r.finalScore}</span> <span style={{ fontSize: "12px", color: "#94a3b8" }}>/ 10</span>
                    </td>
                    <td style={tdStyle}>
                      <span style={{
                        padding: "4px 10px", borderRadius: "6px", fontSize: "12px", fontWeight: 600,
                        background: r.rating === "Critical" || r.rating === "Weak" ? "#fee2e2" :
                                    r.rating === "Average" ? "#fef3c7" : "#dcfce7",
                        color: r.rating === "Critical" || r.rating === "Weak" ? "#dc2626" :
                               r.rating === "Average" ? "#b45309" : "#15803d"
                      }}>
                        {r.rating}
                      </span>
                    </td>
                  </tr>
                );
              })}
              {filteredReports.length === 0 && (
                <tr>
                  <td colSpan={7} style={{ padding: "24px", textAlign: "center", color: "#94a3b8" }}>No employee scores found matching filter criteria.</td>
                </tr>
              )}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}
