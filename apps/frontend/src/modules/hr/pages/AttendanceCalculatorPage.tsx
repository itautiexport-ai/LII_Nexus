import React, { useState } from "react";
import { employeesApi, EmployeeRecord } from "../../admin/organization/employees/api/employeesApi";
import * as xlsx from "xlsx";
import { axiosInstance } from "../../../services/api/axiosInstance";
import * as pdfjsLib from "pdfjs-dist";

pdfjsLib.GlobalWorkerOptions.workerSrc = `https://cdnjs.cloudflare.com/ajax/libs/pdf.js/${pdfjsLib.version}/pdf.worker.min.mjs`;

export default function AttendanceCalculatorPage() {
  const [file, setFile] = useState<File | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [report, setReport] = useState<any[]>([]);
  const [reportDate, setReportDate] = useState<string>(new Date().toISOString().split('T')[0]);
  const [saving, setSaving] = useState(false);
  const [saveMessage, setSaveMessage] = useState<string | null>(null);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      setFile(e.target.files[0]);
    }
  };

  const handleCalculate = async () => {
    if (!file) {
      setError("Please select a file to import.");
      return;
    }

    setLoading(true);
    setError(null);
    setReport([]);

    try {
      let lines: string[] = [];
      const fileName = file.name.toLowerCase();

      if (fileName.endsWith(".csv")) {
        const text = await file.text();
        lines = text.split("\n").map(l => l.trim()).filter(l => l.length > 0);
      } else if (fileName.endsWith(".xlsx") || fileName.endsWith(".xls")) {
        const arrayBuffer = await file.arrayBuffer();
        const workbook = xlsx.read(arrayBuffer, { type: "array" });
        const firstSheet = workbook.Sheets[workbook.SheetNames[0]];
        const json: any[][] = xlsx.utils.sheet_to_json(firstSheet, { header: 1 });
        lines = json.map(row => row.join(",")).filter(l => l.trim().length > 0);
      } else if (fileName.endsWith(".pdf")) {
        const arrayBuffer = await file.arrayBuffer();
        const pdf = await pdfjsLib.getDocument({ data: arrayBuffer }).promise;
        let fullText = "";
        for (let i = 1; i <= pdf.numPages; i++) {
          const page = await pdf.getPage(i);
          const textContent = await page.getTextContent();
          const pageText = textContent.items.map((item: any) => item.str).join(" ");
          fullText += pageText + "\n";
        }
        
        // Very basic PDF table extraction heuristic: split by newlines or large spaces
        // This simulates CSV lines by trying to find Employee Code patterns.
        // We will just extract words and try to build mock lines for the CSV parser
        lines = fullText.split("\n").filter(l => l.trim().length > 0);
        
        // If it's a single block of text (often happens in PDF extraction), 
        // we might have to fake the headers and parse tokens
        if (lines.length < 2) {
          const tokens = fullText.split(/\s+/);
          // Just make one giant line and hope the heuristics catch it, 
          // or force the user to use structured files.
          lines = ["Employee Code,Status", fullText.replace(/\s+/g, ',')];
        } else {
          // ensure header exists
          if (!lines[0].toLowerCase().includes("employee") && !lines[0].toLowerCase().includes("status")) {
             lines.unshift("Employee Code,Status");
          }
        }
      } else {
        throw new Error("Unsupported file format. Please upload CSV, Excel, or PDF.");
      }

      if (lines.length < 2) {
        throw new Error("File must contain a header row and at least one data row.");
      }

      const headers = lines[0].split(",").map(h => h.trim().toLowerCase());
      let empCodeIdx = headers.findIndex(h => h.includes("employee") || h.includes("code") || h.includes("id"));
      let statusIdx = headers.findIndex(h => h.includes("status") || h.includes("attendance"));

      // Fallback if headers aren't explicitly named correctly in unstructured PDFs
      if (fileName.endsWith(".pdf") && (empCodeIdx === -1 || statusIdx === -1)) {
        empCodeIdx = 0;
        statusIdx = 1; 
      } else if (empCodeIdx === -1 || statusIdx === -1) {
        throw new Error("Could not find 'Employee Code' or 'Status' columns in the file.");
      }

      // Group by Employee
      const empStats: Record<string, { present: number; absent: number; halfDay: number; total: number }> = {};

      for (let i = 1; i < lines.length; i++) {
        const cols = lines[i].split(",");
        if (cols.length <= Math.max(empCodeIdx, statusIdx)) continue;

        const empCode = cols[empCodeIdx].trim();
        const status = cols[statusIdx].trim().toLowerCase();

        if (!empCode || empCode.length < 2) continue; // skip empty or invalid

        if (!empStats[empCode]) {
          empStats[empCode] = { present: 0, absent: 0, halfDay: 0, total: 0 };
        }

        if (status.includes("present") || status === "p") {
          empStats[empCode].present += 1;
        } else if (status.includes("half") || status === "hd") {
          empStats[empCode].halfDay += 1;
        } else if (status.includes("absent") || status === "a" || status.includes("leave")) {
          empStats[empCode].absent += 1;
        }
        
        empStats[empCode].total += 1;
      }

      // Fetch actual employee details to match codes with names
      const employees = await employeesApi.listForDropdown();
      
      const results = Object.keys(empStats).map(code => {
        const stats = empStats[code];
        // Calculate effective present days (Half day = 0.5 present)
        const effectivePresent = stats.present + (stats.halfDay * 0.5);
        // Assuming total days in month is 30 for percentage, or we can use the total records found for this employee
        const percentage = stats.total > 0 ? (effectivePresent / stats.total) * 100 : 0;
        
        const matchingEmp = employees.find(e => e.employeeCode?.toLowerCase() === code.toLowerCase() || e.fullName.toLowerCase() === code.toLowerCase());

        return {
          employeeCode: code,
          employeeName: matchingEmp ? matchingEmp.fullName : "Unknown Employee",
          department: matchingEmp ? matchingEmp.departmentName : "—",
          ...stats,
          effectivePresent,
          percentage: percentage.toFixed(2)
        };
      });

      setReport(results);
    } catch (err: any) {
      console.error(err);
      setError(err.message || "An error occurred while parsing the file.");
    } finally {
      setLoading(false);
    }
  };

  const handleSaveToDB = async () => {
    if (report.length === 0) return;
    setSaving(true);
    setSaveMessage(null);
    try {
      const records = report.flatMap(r => {
        const statuses = [];
        for (let i=0; i<r.present; i++) statuses.push({ employeeCode: r.employeeCode, date: reportDate, status: "Present" });
        for (let i=0; i<r.absent; i++) statuses.push({ employeeCode: r.employeeCode, date: reportDate, status: "Absent" });
        for (let i=0; i<r.halfDay; i++) statuses.push({ employeeCode: r.employeeCode, date: reportDate, status: "Half Day" });
        return statuses;
      });
      if (records.length === 0) return;
      const res = await axiosInstance.post("/hr/attendance/bulk", { records });
      setSaveMessage(res.data.data?.message || "Saved successfully!");
    } catch (err: any) {
      console.error(err);
      setError(err?.response?.data?.error?.message ?? "Failed to save to database.");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div style={{ padding: "24px", maxWidth: "1200px", margin: "0 auto", fontFamily: "Inter, system-ui, sans-serif" }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 24 }}>
        <div>
          <h1 style={{ margin: "0 0 6px 0", fontSize: 24, fontWeight: 700, color: "#111827" }}>Attendance Calculator</h1>
          <p style={{ color: "#6b7280", margin: 0, fontSize: 14 }}>Import a file to automatically calculate monthly attendance reports.</p>
        </div>
      </div>

      <div style={{ background: "white", padding: 24, borderRadius: 8, border: "1px solid #e5e7eb", marginBottom: 24, boxShadow: "0 1px 3px rgba(0,0,0,0.05)" }}>
        <h3 style={{ marginTop: 0, marginBottom: 16, fontSize: 16, color: "#374151" }}>Import Instructions</h3>
        <p style={{ fontSize: 14, color: "#4b5563", marginBottom: 16 }}>
          Please upload a <strong>.csv, .xlsx, .xls, or .pdf</strong> file containing at least two columns: 
          <strong>"Employee Code"</strong> and <strong>"Status"</strong>.
        </p>

        <div style={{ marginBottom: 24, display: "flex", gap: 16, alignItems: "center" }}>
          <input type="file" onChange={handleFileChange} accept=".csv, .xlsx, .xls, .pdf" style={{ padding: "8px", border: "1px solid #d1d5db", borderRadius: 4, flex: 1 }} />
          <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
            <label style={{ fontSize: 14, fontWeight: 500 }}>Report Date:</label>
            <input type="date" value={reportDate} onChange={(e) => setReportDate(e.target.value)} style={{ padding: "8px", border: "1px solid #d1d5db", borderRadius: 4 }} />
          </div>
          <button onClick={handleCalculate} disabled={loading || !file} style={{ padding: "8px 16px", background: loading || !file ? "#9ca3af" : "#2563eb", color: "white", border: "none", borderRadius: 4, cursor: loading || !file ? "not-allowed" : "pointer" }}>
            {loading ? "Calculating..." : "Calculate Attendance"}
          </button>
          {report.length > 0 && (
            <button onClick={handleSaveToDB} disabled={saving} style={{ padding: "8px 16px", background: saving ? "#9ca3af" : "#10b981", color: "white", border: "none", borderRadius: 4, cursor: saving ? "not-allowed" : "pointer" }}>
              {saving ? "Saving..." : "Save to DB"}
            </button>
          )}
        </div>

        {error && (
          <div style={{ padding: "12px 16px", background: "#fee2e2", color: "#dc2626", borderRadius: 6, marginBottom: 16, fontSize: 14 }}>
            {error}
          </div>
        )}
      </div>

      {report.length > 0 && (
        <div style={{ background: "white", borderRadius: 8, boxShadow: "0 1px 3px rgba(0,0,0,0.05)", border: "1px solid #e5e7eb", overflowX: "auto" }}>
          <table style={{ width: "100%", borderCollapse: "collapse" }}>
            <thead>
              <tr style={{ background: "#f9fafb", textAlign: "left" }}>
                <th style={{ padding: "12px 16px", borderBottom: "2px solid #e5e7eb", color: "#4b5563", fontWeight: 600, fontSize: 13 }}>Employee Code</th>
                <th style={{ padding: "12px 16px", borderBottom: "2px solid #e5e7eb", color: "#4b5563", fontWeight: 600, fontSize: 13 }}>Employee Name</th>
                <th style={{ padding: "12px 16px", borderBottom: "2px solid #e5e7eb", color: "#4b5563", fontWeight: 600, fontSize: 13 }}>Total Days Logged</th>
                <th style={{ padding: "12px 16px", borderBottom: "2px solid #e5e7eb", color: "#4b5563", fontWeight: 600, fontSize: 13 }}>Present</th>
                <th style={{ padding: "12px 16px", borderBottom: "2px solid #e5e7eb", color: "#4b5563", fontWeight: 600, fontSize: 13 }}>Half-Day</th>
                <th style={{ padding: "12px 16px", borderBottom: "2px solid #e5e7eb", color: "#4b5563", fontWeight: 600, fontSize: 13 }}>Absent</th>
                <th style={{ padding: "12px 16px", borderBottom: "2px solid #e5e7eb", color: "#4b5563", fontWeight: 600, fontSize: 13 }}>Attendance %</th>
              </tr>
            </thead>
            <tbody>
              {report.map((r, idx) => (
                <tr key={idx} style={{ borderBottom: "1px solid #f3f4f6" }}>
                  <td style={{ padding: "12px 16px", fontSize: 14, color: "#1f2937", fontWeight: 500 }}>{r.employeeCode}</td>
                  <td style={{ padding: "12px 16px", fontSize: 14, color: "#1f2937" }}>{r.employeeName}</td>
                  <td style={{ padding: "12px 16px", fontSize: 14, color: "#6b7280" }}>{r.total}</td>
                  <td style={{ padding: "12px 16px", fontSize: 14, color: "#16a34a", fontWeight: 600 }}>{r.present}</td>
                  <td style={{ padding: "12px 16px", fontSize: 14, color: "#d97706", fontWeight: 600 }}>{r.halfDay}</td>
                  <td style={{ padding: "12px 16px", fontSize: 14, color: "#dc2626", fontWeight: 600 }}>{r.absent}</td>
                  <td style={{ padding: "12px 16px", fontSize: 14, color: "#2563eb", fontWeight: 700 }}>{r.percentage}%</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
