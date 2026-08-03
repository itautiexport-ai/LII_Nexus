import React, { useState, useEffect } from "react";
import { payrollApi, MonthlySalarySheetRecord } from "../api/payrollApi";

function getMonthDateRange(monthStr: string) {
  if (!monthStr) return { start: "", end: "" };
  const [year, month] = monthStr.split("-").map(Number);
  const start = new Date(Date.UTC(year, month - 1, 1));
  const end = new Date(Date.UTC(year, month, 0)); // Last day of month
  return {
    start: start.toISOString().split("T")[0],
    end: end.toISOString().split("T")[0]
  };
}

export default function MonthlySalarySheetPage() {
  const d = new Date();
  const currentMonthStr = `${d.getFullYear()}-${(d.getMonth() + 1).toString().padStart(2, '0')}`;
  
  const [monthStr, setMonthStr] = useState(currentMonthStr);
  const [data, setData] = useState<MonthlySalarySheetRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchSheet = async () => {
    try {
      setLoading(true);
      setError(null);
      if (!monthStr) return;
      const [year, month] = monthStr.split("-").map(Number);
      const res = await payrollApi.getMonthlySalarySheet(year, month);
      setData(res);
    } catch (err) {
      console.error(err);
      setError("Failed to fetch salary sheet.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSheet();
  }, [monthStr]);

  const totalGross = data.reduce((acc, row) => acc + row.gross, 0);
  const totalDays = data.reduce((acc, row) => acc + row.days, 0);
  const totalOtHrs = data.reduce((acc, row) => acc + row.otHrs, 0);
  const totalGrossAmt = data.reduce((acc, row) => acc + row.grossAmt, 0);
  const totalOtAmt = data.reduce((acc, row) => acc + row.otAmt, 0);

  return (
    <div style={{ padding: 24, maxWidth: 1200, margin: "0 auto", fontFamily: "Inter, sans-serif" }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 24 }}>
        <div>
          <h1 style={{ margin: "0 0 6px 0", fontSize: 24, fontWeight: 700, color: "#111827" }}>Monthly Salary Sheet</h1>
          <p style={{ margin: 0, color: "#6b7280", fontSize: 14 }}>
            Department-wise summary of attendance and payroll aggregates
          </p>
        </div>
        <div style={{ display: "flex", gap: "12px", alignItems: "center" }}>
          <input 
            type="month" 
            value={monthStr} 
            onChange={(e) => setMonthStr(e.target.value)} 
            style={{ padding: "8px 12px", borderRadius: 6, border: "1px solid #d1d5db", fontSize: 14 }}
          />
        </div>
      </div>

      {error && (
        <div style={{ padding: 12, background: "#fee2e2", color: "#b91c1c", borderRadius: 6, marginBottom: 16 }}>
          {error}
        </div>
      )}

      <div style={{ background: "white", borderRadius: 12, border: "1px solid #e5e7eb", overflow: "hidden", boxShadow: "0 1px 3px rgba(0,0,0,0.05)" }}>
        {loading ? (
          <div style={{ padding: 32, textAlign: "center", color: "#6b7280" }}>Calculating payroll...</div>
        ) : (
          <div style={{ overflowX: "auto" }}>
            <table style={{ width: "100%", borderCollapse: "collapse", textAlign: "left" }}>
              <thead>
                <tr style={{ background: "#f8fafc", borderBottom: "1px solid #e5e7eb" }}>
                  <th style={{ padding: "12px 16px", fontWeight: 600, fontSize: 13, color: "#475569" }}>SR NO</th>
                  <th style={{ padding: "12px 16px", fontWeight: 600, fontSize: 13, color: "#475569" }}>DEPARTMENT</th>
                  <th style={{ padding: "12px 16px", fontWeight: 600, fontSize: 13, color: "#475569", textAlign: "right" }}>GROSS</th>
                  <th style={{ padding: "12px 16px", fontWeight: 600, fontSize: 13, color: "#475569", textAlign: "right" }}>DAYS</th>
                  <th style={{ padding: "12px 16px", fontWeight: 600, fontSize: 13, color: "#475569", textAlign: "right" }}>OT HRS</th>
                  <th style={{ padding: "12px 16px", fontWeight: 600, fontSize: 13, color: "#475569", textAlign: "right" }}>GROSS AMT</th>
                  <th style={{ padding: "12px 16px", fontWeight: 600, fontSize: 13, color: "#475569", textAlign: "right" }}>OT AMT</th>
                </tr>
              </thead>
              <tbody>
                {data.length === 0 ? (
                  <tr>
                    <td colSpan={7} style={{ padding: 24, textAlign: "center", color: "#6b7280" }}>
                      No payroll data found for this month.
                    </td>
                  </tr>
                ) : (
                  <>
                    {data.map((row) => (
                      <tr key={row.sNo} style={{ borderBottom: "1px solid #e5e7eb" }}>
                        <td style={{ padding: "12px 16px", fontSize: 14, color: "#374151" }}>{row.sNo}</td>
                        <td style={{ padding: "12px 16px", fontSize: 14, color: "#374151", fontWeight: 500 }}>{row.departmentName}</td>
                        <td style={{ padding: "12px 16px", fontSize: 14, color: "#374151", textAlign: "right" }}>{row.gross.toLocaleString(undefined, { maximumFractionDigits: 0 })}</td>
                        <td style={{ padding: "12px 16px", fontSize: 14, color: "#374151", textAlign: "right" }}>{row.days}</td>
                        <td style={{ padding: "12px 16px", fontSize: 14, color: "#374151", textAlign: "right" }}>{row.otHrs}</td>
                        <td style={{ padding: "12px 16px", fontSize: 14, color: "#16a34a", fontWeight: 600, textAlign: "right" }}>{row.grossAmt.toLocaleString(undefined, { maximumFractionDigits: 0 })}</td>
                        <td style={{ padding: "12px 16px", fontSize: 14, color: "#16a34a", fontWeight: 600, textAlign: "right" }}>{row.otAmt.toLocaleString(undefined, { maximumFractionDigits: 0 })}</td>
                      </tr>
                    ))}
                    <tr style={{ background: "#f1f5f9", fontWeight: 700 }}>
                      <td colSpan={2} style={{ padding: "16px", fontSize: 14, color: "#0f172a", textAlign: "right" }}>Grand Total</td>
                      <td style={{ padding: "16px", fontSize: 14, color: "#0f172a", textAlign: "right" }}>{totalGross.toLocaleString(undefined, { maximumFractionDigits: 0 })}</td>
                      <td style={{ padding: "16px", fontSize: 14, color: "#0f172a", textAlign: "right" }}>{totalDays}</td>
                      <td style={{ padding: "16px", fontSize: 14, color: "#0f172a", textAlign: "right" }}>{totalOtHrs}</td>
                      <td style={{ padding: "16px", fontSize: 14, color: "#0f172a", textAlign: "right" }}>{totalGrossAmt.toLocaleString(undefined, { maximumFractionDigits: 0 })}</td>
                      <td style={{ padding: "16px", fontSize: 14, color: "#0f172a", textAlign: "right" }}>{totalOtAmt.toLocaleString(undefined, { maximumFractionDigits: 0 })}</td>
                    </tr>
                  </>
                )}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
