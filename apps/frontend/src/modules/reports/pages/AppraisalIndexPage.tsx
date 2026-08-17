import React, { useState, useEffect } from "react";
import { misScoreApi, MisScoreReport } from "../api/misScoreApi";
import { employeesApi, EmployeeRecord } from "../../admin/organization/employees/api/employeesApi";

export default function AppraisalIndexPage() {
  const [reports, setReports] = useState<MisScoreReport[]>([]);
  const [employees, setEmployees] = useState<EmployeeRecord[]>([]);
  const [loading, setLoading] = useState(false);
  const currentYear = new Date().getFullYear();
  const currentMonthNum = (new Date().getMonth() + 1).toString().padStart(2, "0");
  
  const [startMonth, setStartMonth] = useState(`${currentYear}-01`);
  const [endMonth, setEndMonth] = useState(`${currentYear}-${currentMonthNum}`);

  const [salaries, setSalaries] = useState<Record<string, number>>({});
  const [selectedEmployee, setSelectedEmployee] = useState("");
  const [selectedDept, setSelectedDept] = useState("");
  const [selectedRating, setSelectedRating] = useState("");

  useEffect(() => {
    fetchData();
  }, [startMonth, endMonth]);

  const fetchData = async () => {
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
      
      const initialSalaries: Record<string, number> = {};
      empList.forEach((emp) => {
        let base = 25000;
        if (emp.designationTitle?.toLowerCase().includes("manager") || emp.designationTitle?.toLowerCase().includes("head")) {
          base = 65000;
        } else if (emp.designationTitle?.toLowerCase().includes("senior") || emp.designationTitle?.toLowerCase().includes("sr")) {
          base = 45000;
        } else if (emp.designationTitle?.toLowerCase().includes("supervisor")) {
          base = 35000;
        }
        initialSalaries[emp.userId || emp.id] = base;
      });
      setSalaries(initialSalaries);
    } catch (error) {
      console.error("Error loading appraisal index data:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleSalaryChange = (empId: string, val: number) => {
    setSalaries(prev => ({
      ...prev,
      [empId]: val
    }));
  };

  const departments = Array.from(new Set(employees.map(e => e.departmentName).filter((name): name is string => !!name)));

  const filteredReports = reports.filter(r => {
    const emp = employees.find(e => e.userId === r.employeeId || e.fullName === r.employeeName);
    const matchesEmployee = !selectedEmployee || 
                            r.employeeId === selectedEmployee || 
                            r.employeeName === selectedEmployee || 
                            emp?.id === selectedEmployee ||
                            emp?.userId === selectedEmployee;
    const matchesDept = !selectedDept || emp?.departmentName === selectedDept;
    const matchesRating = !selectedRating || r.rating === selectedRating;

    return matchesEmployee && matchesDept && matchesRating;
  });

  const totalEmployees = filteredReports.length;
  const totalIncrementProposed = filteredReports.reduce((sum, r) => {
    const base = salaries[r.employeeId] || 25000;
    const incrementPercent = (r.incrementMultiplier * 8);
    return sum + (base * (incrementPercent / 100));
  }, 0);
  
  const avgIncrementPercent = totalEmployees > 0 
    ? filteredReports.reduce((sum, r) => sum + (r.incrementMultiplier * 8), 0) / totalEmployees 
    : 0;

  const cardStyle: React.CSSProperties = {
    background: "white",
    padding: "20px",
    borderRadius: 10,
    boxShadow: "0 1px 3px rgba(0,0,0,0.05)",
    border: "1px solid #e5e7eb",
    display: "flex",
    flexDirection: "column",
    gap: 8,
    flex: 1
  };

  const thStyle: React.CSSProperties = {
    padding: "12px 16px",
    borderBottom: "2px solid #e5e7eb",
    color: "#4b5563",
    fontWeight: 600,
    fontSize: 13
  };

  const tdStyle: React.CSSProperties = {
    padding: "12px 16px",
    borderBottom: "1px solid #f3f4f6",
    fontSize: 14,
    color: "#1f2937"
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
    <div style={{ padding: "24px", maxWidth: "1200px", margin: "0 auto", fontFamily: "Inter, system-ui, sans-serif" }}>
      <style>
        {`
          input[type=number]::-webkit-inner-spin-button, 
          input[type=number]::-webkit-outer-spin-button { 
            -webkit-appearance: none; 
            margin: 0; 
          }
          input[type=number] {
            -moz-appearance: textfield;
          }
        `}
      </style>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 24 }}>
        <div>
          <h1 style={{ margin: "0 0 6px 0", fontSize: 24, fontWeight: 700, color: "#111827" }}>Appraisal Index</h1>
          <p style={{ color: "#6b7280", margin: 0, fontSize: 14 }}>Track employee ratings, increments, and proposed adjustments.</p>
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

      <div style={{ display: "flex", gap: 16, marginBottom: 24, flexWrap: "wrap" }}>
        <div style={cardStyle}>
          <span style={{ fontSize: 13, color: "#6b7280", fontWeight: 500 }}>Employees Listed</span>
          <span style={{ fontSize: 24, fontWeight: 700, color: "#111827" }}>{totalEmployees}</span>
        </div>
        <div style={cardStyle}>
          <span style={{ fontSize: 13, color: "#6b7280", fontWeight: 500 }}>Average Merit Increment (%)</span>
          <span style={{ fontSize: 24, fontWeight: 700, color: "#2563eb" }}>{avgIncrementPercent.toFixed(2)}%</span>
        </div>
        <div style={cardStyle}>
          <span style={{ fontSize: 13, color: "#6b7280", fontWeight: 500 }}>Total Increments Budget</span>
          <span style={{ fontSize: 24, fontWeight: 700, color: "#16a34a" }}>₹{totalIncrementProposed.toLocaleString("en-IN", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
        </div>
      </div>

      <div style={{ background: "white", padding: 16, borderRadius: 8, border: "1px solid #e5e7eb", marginBottom: 20, display: "flex", gap: 12, flexWrap: "wrap", alignItems: "center" }}>
        <div style={{ flex: 1, minWidth: 240 }}>
          <select 
            value={selectedEmployee}
            onChange={(e) => setSelectedEmployee(e.target.value)}
            style={{ width: "100%", padding: "8px 12px", border: "1px solid #d1d5db", borderRadius: 6, fontSize: "0.9rem", background: "white", color: "#334155" }}
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
            style={{ padding: "8px 12px", border: "1px solid #d1d5db", borderRadius: 6, fontSize: 14, background: "white" }}
          >
            <option value="">All Departments</option>
            {departments.map((dept, idx) => (
              <option key={idx} value={dept}>{dept}</option>
            ))}
          </select>
        </div>
        <div>
          <select 
            value={selectedRating}
            onChange={(e) => setSelectedRating(e.target.value)}
            style={{ padding: "8px 12px", border: "1px solid #d1d5db", borderRadius: 6, fontSize: 14, background: "white" }}
          >
            <option value="">All Ratings</option>
            <option value="Exceptional">Exceptional</option>
            <option value="Excellent">Excellent</option>
            <option value="Good">Good</option>
            <option value="Average">Average</option>
            <option value="Weak">Weak</option>
            <option value="Critical">Critical</option>
          </select>
        </div>
      </div>

      {/* Index Table */}
      <div style={{ background: "white", borderRadius: 8, boxShadow: "0 1px 3px rgba(0,0,0,0.05)", border: "1px solid #e5e7eb", overflowX: "auto" }}>
        {loading ? (
          <p style={{ padding: 24, textAlign: "center", color: "#6b7280" }}>Loading appraisal details...</p>
        ) : (
          <table style={{ width: "100%", borderCollapse: "collapse" }}>
            <thead>
              <tr style={{ background: "#f9fafb", textAlign: "left" }}>
                <th style={thStyle}>Employee</th>
                <th style={thStyle}>Department</th>
                <th style={thStyle}>Final Score</th>
                <th style={thStyle}>Rating</th>
                <th style={thStyle}>Increment (%)</th>
                <th style={thStyle}>Gross Salary (₹)</th>
                <th style={thStyle}>Increment Amt</th>
                <th style={thStyle}>Proposed Salary</th>
              </tr>
            </thead>
            <tbody>
              {filteredReports.map((r, idx) => {
                const emp = employees.find(e => e.userId === r.employeeId || e.fullName === r.employeeName);
                const currentSalary = salaries[r.employeeId] || 25000;
                const incrementPercent = r.incrementMultiplier * 8; // standard increment: 8%
                const incrementAmt = currentSalary * (incrementPercent / 100);
                const newSalary = currentSalary + incrementAmt;

                return (
                  <tr key={idx} style={{ borderBottom: "1px solid #f3f4f6" }}>
                    <td style={tdStyle}>
                      <div>
                        <strong>{r.employeeName}</strong>
                        {emp?.employeeCode && <div style={{ fontSize: 11, color: "#6b7280", marginTop: 2 }}>{emp.employeeCode}</div>}
                      </div>
                    </td>
                    <td style={tdStyle}>{emp?.departmentName || "—"}</td>
                    <td style={tdStyle}><strong>{r.finalScore}</strong> <span style={{ fontSize: 11, color: "#9ca3af" }}>/ 10</span></td>
                    <td style={tdStyle}>
                      <span style={{
                        padding: "3px 8px", borderRadius: 4, fontSize: 11, fontWeight: 600,
                        background: r.rating === "Critical" || r.rating === "Weak" ? "#fee2e2" :
                                    r.rating === "Average" ? "#fef3c7" : "#dcfce3",
                        color: r.rating === "Critical" || r.rating === "Weak" ? "#dc2626" :
                               r.rating === "Average" ? "#d97706" : "#15803d"
                      }}>
                        {r.rating}
                      </span>
                    </td>
                    <td style={tdStyle}>
                      <div>{incrementPercent.toFixed(1)}% <span style={{ fontSize: 11, color: "#9ca3af" }}>({r.incrementMultiplier}x)</span></div>
                    </td>
                    <td style={tdStyle}>
                      <input 
                        type="number"
                        value={currentSalary}
                        onChange={(e) => handleSalaryChange(r.employeeId, parseFloat(e.target.value) || 0)}
                        style={{ width: 90, padding: "4px 8px", border: "1px solid #d1d5db", borderRadius: 4, fontSize: 13 }}
                      />
                    </td>
                    <td style={tdStyle}><span style={{ color: "#16a34a", fontWeight: 600 }}>+₹{incrementAmt.toLocaleString("en-IN", { minimumFractionDigits: 1, maximumFractionDigits: 1 })}</span></td>
                    <td style={tdStyle}><strong>₹{newSalary.toLocaleString("en-IN", { minimumFractionDigits: 1, maximumFractionDigits: 1 })}</strong></td>
                  </tr>
                );
              })}
              {filteredReports.length === 0 && (
                <tr>
                  <td colSpan={8} style={{ padding: 24, textAlign: "center", color: "#9ca3af" }}>No appraisals found matching filter criteria.</td>
                </tr>
              )}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}
