import React, { useState, useRef } from "react";
import { axiosInstance } from "../../../services/api/axiosInstance";

function getSundayToSaturday(dateStr: string) {
  const d = new Date(dateStr);
  const day = d.getDay(); // 0 is Sunday, 6 is Saturday
  const start = new Date(d);
  start.setDate(d.getDate() - day); // Snap back to Sunday
  
  const end = new Date(start);
  end.setDate(start.getDate() + 6); // Forward to Saturday
  
  return {
    start: start.toISOString().split("T")[0],
    end: end.toISOString().split("T")[0]
  };
}

export default function WeeklyPayrollPage() {
  const today = new Date().toISOString().split("T")[0];
  const [selectedDate, setSelectedDate] = useState(today);
  
  const [uploading, setUploading] = useState(false);
  const [uploadedFiles, setUploadedFiles] = useState<{name: string, url: string, parsedData?: any[]}[]>([]);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const { start, end } = getSundayToSaturday(selectedDate);
  const dateRangeDisplay = start && end 
    ? `${new Date(start).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' })} - ${new Date(end).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' })}`
    : "";

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files || e.target.files.length === 0) return;
    const file = e.target.files[0];
    
    setUploading(true);
    const formData = new FormData();
    formData.append("file", file);
    
    try {
      const res = await axiosInstance.post("/upload", formData, {
        headers: { "Content-Type": "multipart/form-data" }
      });
      if (res.data?.data?.fileUrl) {
        setUploadedFiles(prev => [...prev, { 
          name: file.name, 
          url: res.data.data.fileUrl, 
          parsedData: res.data.data.parsedData 
        }]);
        alert("File uploaded successfully!");
      }
    } catch (err) {
      console.error(err);
      alert("Failed to upload file.");
    } finally {
      setUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  };

  const [saving, setSaving] = useState(false);
  const handleSaveToDatabase = async (parsedData: any[]) => {
    if (!parsedData || parsedData.length === 0) return;
    
    setSaving(true);
    try {
      await axiosInstance.post("/hr/payroll/weekly", {
        data: parsedData,
        weekStartDate: start,
        weekEndDate: end
      });
      alert("Weekly payroll saved successfully to database!");
    } catch (err) {
      console.error(err);
      alert("Failed to save payroll to database.");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div style={{ padding: 24, maxWidth: 1200, margin: "0 auto", fontFamily: "Inter, sans-serif" }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 24 }}>
        <div>
          <h1 style={{ fontSize: 28, fontWeight: 700, color: "#111827", marginBottom: 8 }}>Weekly Payroll</h1>
          <p style={{ color: "#6b7280", fontSize: 16, margin: 0 }}>
            Review calculated weekly payout based on employee attendance.
          </p>
        </div>
        <div style={{ display: "flex", gap: "12px", alignItems: "center" }}>
          <div>
            <input 
              type="file" 
              ref={fileInputRef}
              style={{ display: "none" }} 
              accept="image/*,.pdf"
              onChange={handleFileUpload} 
            />
            <button 
              onClick={() => fileInputRef.current?.click()}
              disabled={uploading}
              style={{ 
                padding: "8px 16px", background: "#4f46e5", color: "white", 
                border: "none", borderRadius: 6, fontWeight: 500, cursor: uploading ? "not-allowed" : "pointer",
                opacity: uploading ? 0.7 : 1
              }}
            >
              {uploading ? "Uploading..." : "Upload Document"}
            </button>
          </div>
          <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
            <span style={{ fontSize: 12, color: "#6b7280", fontWeight: 500 }}>Select any day in the week:</span>
            <input 
              type="date" 
              value={selectedDate} 
              onChange={(e) => setSelectedDate(e.target.value)} 
              style={{ padding: "8px 12px", borderRadius: 6, border: "1px solid #d1d5db", fontSize: 14 }}
            />
          </div>
          <div style={{ fontSize: 13, color: "#4b5563", background: "#f3f4f6", padding: "8px 12px", borderRadius: 6, fontWeight: 500 }}>
            {dateRangeDisplay}
          </div>
        </div>
      </div>

      {uploadedFiles.length > 0 && (
        <div style={{ marginBottom: 24, padding: 16, background: "#f8fafc", borderRadius: 8, border: "1px solid #e2e8f0" }}>
          <h3 style={{ margin: "0 0 12px 0", fontSize: 16, color: "#334155" }}>Uploaded Documents for this Week</h3>
          <ul style={{ margin: 0, padding: 0, listStyle: "none", display: "flex", flexDirection: "column", gap: "24px" }}>
            {uploadedFiles.map((f, i) => (
              <li key={i}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 8 }}>
                  <a href={f.url} target="_blank" rel="noreferrer" style={{ color: "#2563eb", textDecoration: "none", fontWeight: 500 }}>
                    📄 {f.name}
                  </a>
                  {f.parsedData && f.parsedData.length > 0 && (
                    <button 
                      onClick={() => handleSaveToDatabase(f.parsedData!)}
                      disabled={saving}
                      style={{ 
                        padding: "6px 12px", background: "#10b981", color: "white", 
                        border: "none", borderRadius: 4, fontWeight: 500, cursor: saving ? "not-allowed" : "pointer",
                        opacity: saving ? 0.7 : 1, fontSize: 14
                      }}
                    >
                      {saving ? "Saving..." : "Save to Database"}
                    </button>
                  )}
                </div>
                
                {f.parsedData && f.parsedData.length > 0 && (
                  <div style={{ marginTop: 12, border: "1px solid #cbd5e1", borderRadius: 8, overflow: "hidden" }}>
                    <div style={{ padding: "8px 12px", background: "#e2e8f0", fontSize: 13, fontWeight: 600, color: "#475569" }}>
                      Parsed Data from Uploaded Sheet
                    </div>
                    <div style={{ overflowX: "auto" }}>
                      <table style={{ width: "100%", borderCollapse: "collapse", background: "white", fontSize: 13 }}>
                        <thead>
                          <tr style={{ borderBottom: "1px solid #cbd5e1", background: "#f1f5f9" }}>
                            <th style={{ padding: "8px 12px", textAlign: "left", color: "#64748b" }}>SR NO</th>
                            <th style={{ padding: "8px 12px", textAlign: "left", color: "#64748b" }}>DEPARTMENT</th>
                            <th style={{ padding: "8px 12px", textAlign: "right", color: "#64748b" }}>GROSS</th>
                            <th style={{ padding: "8px 12px", textAlign: "right", color: "#64748b" }}>DAYS</th>
                            <th style={{ padding: "8px 12px", textAlign: "right", color: "#64748b" }}>OT HRS</th>
                            <th style={{ padding: "8px 12px", textAlign: "right", color: "#64748b" }}>GROSS AMT</th>
                            <th style={{ padding: "8px 12px", textAlign: "right", color: "#64748b" }}>OT AMT</th>
                          </tr>
                        </thead>
                        <tbody>
                          {f.parsedData.map((row: any, idx: number) => (
                            <tr key={idx} style={{ borderBottom: "1px solid #f1f5f9" }}>
                              <td style={{ padding: "8px 12px" }}>{row.sNo}</td>
                              <td style={{ padding: "8px 12px", fontWeight: 500 }}>{row.departmentName}</td>
                              <td style={{ padding: "8px 12px", textAlign: "right" }}>{row.gross}</td>
                              <td style={{ padding: "8px 12px", textAlign: "right" }}>{row.days}</td>
                              <td style={{ padding: "8px 12px", textAlign: "right" }}>{row.otHrs}</td>
                              <td style={{ padding: "8px 12px", textAlign: "right", color: "#16a34a", fontWeight: 600 }}>{row.grossAmt}</td>
                              <td style={{ padding: "8px 12px", textAlign: "right", color: "#16a34a", fontWeight: 600 }}>{row.otAmt}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                )}
              </li>
            ))}
          </ul>
        </div>
      )}

      {uploadedFiles.length === 0 && (
        <div style={{ textAlign: "center", padding: 60, color: "#9ca3af", background: "#f9fafb", borderRadius: 8, border: "1px dashed #d1d5db" }}>
          <div style={{ fontSize: 48, marginBottom: 12 }}>📄</div>
          <p style={{ fontSize: 16, fontWeight: 500, color: "#6b7280", margin: 0 }}>No documents uploaded yet.</p>
          <p style={{ fontSize: 14, color: "#9ca3af", margin: "8px 0 0 0" }}>Click "Upload Document" above to upload a salary sheet and view its data here.</p>
        </div>
      )}
    </div>
  );
}
