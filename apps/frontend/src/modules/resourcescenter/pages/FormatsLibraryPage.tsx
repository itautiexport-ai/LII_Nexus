import React, { useState, useEffect, useRef } from "react";
import { documentApi, DocumentRecord } from "../../documents/api/documentApi";

export default function FormatsLibraryPage() {
  const [customFormats, setCustomFormats] = useState<DocumentRecord[]>([]);
  const [loading, setLoading] = useState(false);
  const [isModalOpen, setIsModalOpen] = useState(false);
  
  // Upload modal state
  const [uploadTitle, setUploadTitle] = useState("");
  const [uploadDesc, setUploadDesc] = useState("");
  const [uploadFile, setUploadFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    loadCustomFormats();
  }, []);

  const loadCustomFormats = async () => {
    setLoading(true);
    try {
      const res = await documentApi.list();
      const filtered = (res.items || []).filter(doc => doc.category === "template" || doc.category === "qc_format");
      setCustomFormats(filtered);
    } catch (err) {
      console.error("Failed to load formats", err);
    } finally {
      setLoading(false);
    }
  };

  const handleDownloadStandardTemplate = (type: string) => {
    let filename = "";
    let csvContent = "";

    if (type === "checklist") {
      filename = "Checklist_Upload_Format.csv";
      csvContent = "Task Name,Assign By,Assign To,Frequency,Schedule Rule,Priority,Mode,Remind Before Days\nSample Task 1,Admin,Employee 1,Daily,Daily execution,High,Online,0\nSample Task 2,Manager,Employee 2,Weekly,Every Tue Thu Sat,Medium,Online,1";
    } else if (type === "delegation") {
      filename = "Delegation_Upload_Format.csv";
      csvContent = "Task Name,Delegated By,Delegated To,Planned Date,Priority,Task Category,Notes\nProject Review,Manager,Employee 1,2026-08-20,High,Review,Please complete by EOD\nAudit Task,Admin,Employee 2,2026-08-25,Medium,Audit,Internal review format";
    } else if (type === "fms") {
      filename = "FMS_Steps_Upload_Format.csv";
      csvContent = "Step No,Step Name,Manager Role,Standard Days,Timeline Unit,Mandatory Attachment\n1,Initial Request,Supervisor,1,Days,Yes\n2,Manager Approval,HOD,2,Days,No";
    } else if (type === "employee") {
      filename = "Employee_Master_Import_Format.csv";
      csvContent = "Full Name,Email,Department,Designation,Role,Mobile,Date of Joining\nJohn Doe,john@company.com,Production,Supervisor,Supervisor,9876543210,2026-01-01";
    } else if (type === "crm") {
      filename = "CRM_Leads_Upload_Format.csv";
      csvContent = "Lead Name,Company,Source,Category,Contact Person,Phone,Email,Estimated Value\nAcme Corp,Acme Inc,Website,Domestic,Jane Smith,9876543210,jane@acme.com,500000";
    }

    if (csvContent) {
      const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.setAttribute("href", url);
      link.setAttribute("download", filename);
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    }
  };

  const handleUploadSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!uploadFile) {
      setUploadError("Please select a file to upload.");
      return;
    }
    setUploading(true);
    setUploadError(null);

    try {
      const uploadRes = await documentApi.uploadFile(uploadFile);
      await documentApi.create({
        title: uploadTitle,
        category: "template",
        fileName: uploadRes.fileName,
        fileUrl: uploadRes.fileUrl,
        changeNotes: uploadDesc || undefined,
      });

      alert("New format uploaded successfully!");
      setIsModalOpen(false);
      setUploadTitle("");
      setUploadDesc("");
      setUploadFile(null);
      loadCustomFormats();
    } catch (err: any) {
      console.error("Upload error:", err);
      setUploadError(err.message || "Failed to upload file");
    } finally {
      setUploading(false);
    }
  };

  const standardFormats = [
    {
      id: "checklist",
      title: "Checklist Upload Format",
      description: "Excel format template for uploading multiple checklists at once.",
      icon: "📋",
      iconBg: "#eff6ff",
      type: "checklist"
    },
    {
      id: "delegation",
      title: "Delegation Upload Format",
      description: "Excel format template for bulk delegating tasks.",
      icon: "🎯",
      iconBg: "#fef2f2",
      type: "delegation"
    },
    {
      id: "fms",
      title: "FMS Workflow Steps Format",
      description: "Excel format template for uploading FMS process steps and timelines.",
      icon: "⚡",
      iconBg: "#fff7ed",
      type: "fms"
    },
    {
      id: "employee",
      title: "Employee Master Import Format",
      description: "Excel format template for importing bulk employee records.",
      icon: "👥",
      iconBg: "#f0fdf4",
      type: "employee"
    },
    {
      id: "crm",
      title: "CRM Leads Upload Format",
      description: "Excel format template for uploading bulk sales leads & prospects.",
      icon: "📈",
      iconBg: "#faf5ff",
      type: "crm"
    }
  ];

  return (
    <div style={{ maxWidth: 1100, margin: "0 auto", padding: "32px 24px", fontFamily: "-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif" }}>
      {/* ── Page Header ── */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 36 }}>
        <div>
          <h1 style={{ fontSize: 32, fontWeight: 800, color: "#0f172a", margin: "0 0 8px 0", letterSpacing: "-0.02em" }}>
            Formats Library
          </h1>
          <p style={{ fontSize: 16, color: "#64748b", margin: 0, maxWidth: 650, lineHeight: 1.5 }}>
            Download official Excel formats and templates for bulk uploads and other module integrations.
          </p>
        </div>

        <button
          onClick={() => setIsModalOpen(true)}
          style={{
            background: "#10b981",
            color: "#ffffff",
            border: "none",
            borderRadius: 10,
            padding: "12px 20px",
            fontSize: 15,
            fontWeight: 700,
            cursor: "pointer",
            display: "inline-flex",
            alignItems: "center",
            gap: 6,
            boxShadow: "0 4px 6px -1px rgba(16, 185, 129, 0.2)",
            transition: "all 0.2s"
          }}
          onMouseEnter={(e) => (e.currentTarget.style.background = "#059669")}
          onMouseLeave={(e) => (e.currentTarget.style.background = "#10b981")}
        >
          <span>+</span> Upload New Format
        </button>
      </div>

      {/* ── Formats Cards Grid ── */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(320px, 1fr))", gap: 24 }}>
        {/* Standard System Formats */}
        {standardFormats.map((fmt) => (
          <div
            key={fmt.id}
            style={{
              background: "#ffffff",
              border: "1px solid #e2e8f0",
              borderRadius: 16,
              padding: 24,
              boxShadow: "0 4px 6px -1px rgba(0, 0, 0, 0.03), 0 2px 4px -2px rgba(0, 0, 0, 0.03)",
              display: "flex",
              flexDirection: "column",
              justifyContent: "space-between",
              transition: "transform 0.2s, box-shadow 0.2s"
            }}
          >
            <div>
              <div style={{ display: "flex", alignItems: "center", gap: 14, marginBottom: 14 }}>
                <div style={{
                  width: 48,
                  height: 48,
                  borderRadius: 12,
                  background: fmt.iconBg,
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  fontSize: 24,
                  border: "1px solid rgba(0,0,0,0.05)"
                }}>
                  {fmt.icon}
                </div>
                <h3 style={{ fontSize: 18, fontWeight: 700, color: "#0f172a", margin: 0 }}>
                  {fmt.title}
                </h3>
              </div>

              <p style={{ fontSize: 14, color: "#64748b", margin: "0 0 24px 0", lineHeight: 1.5 }}>
                {fmt.description}
              </p>
            </div>

            <button
              onClick={() => handleDownloadStandardTemplate(fmt.type)}
              style={{
                width: "100%",
                background: "#3b82f6",
                color: "#ffffff",
                border: "none",
                borderRadius: 10,
                padding: "12px 16px",
                fontSize: 15,
                fontWeight: 600,
                cursor: "pointer",
                textAlign: "center",
                boxShadow: "0 2px 4px rgba(59, 130, 246, 0.2)",
                transition: "background 0.2s"
              }}
              onMouseEnter={(e) => (e.currentTarget.style.background = "#2563eb")}
              onMouseLeave={(e) => (e.currentTarget.style.background = "#3b82f6")}
            >
              Download File ↓
            </button>
          </div>
        ))}

        {/* User Uploaded Custom Formats */}
        {customFormats.map((doc) => (
          <div
            key={doc.id}
            style={{
              background: "#ffffff",
              border: "1px solid #e2e8f0",
              borderRadius: 16,
              padding: 24,
              boxShadow: "0 4px 6px -1px rgba(0, 0, 0, 0.03)",
              display: "flex",
              flexDirection: "column",
              justifyContent: "space-between"
            }}
          >
            <div>
              <div style={{ display: "flex", alignItems: "center", gap: 14, marginBottom: 14 }}>
                <div style={{
                  width: 48,
                  height: 48,
                  borderRadius: 12,
                  background: "#f8fafc",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  fontSize: 24,
                  border: "1px solid #e2e8f0"
                }}>
                  📄
                </div>
                <div>
                  <h3 style={{ fontSize: 18, fontWeight: 700, color: "#0f172a", margin: 0 }}>
                    {doc.title}
                  </h3>
                  <span style={{ fontSize: 11, color: "#94a3b8", textTransform: "uppercase", fontWeight: 700 }}>Custom Format</span>
                </div>
              </div>

              <p style={{ fontSize: 14, color: "#64748b", margin: "0 0 24px 0", lineHeight: 1.5 }}>
                {doc.fileName || "Uploaded format template document."}
              </p>
            </div>

            {doc.fileUrl ? (
              <a
                href={doc.fileUrl}
                target="_blank"
                rel="noreferrer"
                style={{
                  width: "100%",
                  background: "#3b82f6",
                  color: "#ffffff",
                  textDecoration: "none",
                  borderRadius: 10,
                  padding: "12px 16px",
                  fontSize: 15,
                  fontWeight: 600,
                  display: "block",
                  textAlign: "center",
                  boxSizing: "border-box"
                }}
              >
                Download File ↓
              </a>
            ) : (
              <button disabled style={{ width: "100%", background: "#cbd5e1", color: "#64748b", border: "none", borderRadius: 10, padding: 12 }}>
                Unavailable
              </button>
            )}
          </div>
        ))}
      </div>

      {/* ── Upload New Format Modal ── */}
      {isModalOpen && (
        <div style={{
          position: "fixed",
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          background: "rgba(15, 23, 42, 0.6)",
          backdropFilter: "blur(4px)",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          zIndex: 9999,
          padding: 20
        }}>
          <div style={{
            background: "#ffffff",
            borderRadius: 16,
            width: "100%",
            maxWidth: 500,
            padding: 28,
            boxShadow: "0 20px 25px -5px rgba(0, 0, 0, 0.1)"
          }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 20 }}>
              <h2 style={{ fontSize: 20, fontWeight: 700, color: "#0f172a", margin: 0 }}>
                Upload New Format Template
              </h2>
              <button
                onClick={() => setIsModalOpen(false)}
                style={{ background: "none", border: "none", fontSize: 20, cursor: "pointer", color: "#64748b" }}
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleUploadSubmit} style={{ display: "flex", flexDirection: "column", gap: 16 }}>
              <div>
                <label style={{ display: "block", fontSize: 13, fontWeight: 600, color: "#334155", marginBottom: 6 }}>
                  Format Title <span style={{ color: "#ef4444" }}>*</span>
                </label>
                <input
                  required
                  type="text"
                  placeholder="e.g. Purchase Order Excel Format"
                  value={uploadTitle}
                  onChange={(e) => setUploadTitle(e.target.value)}
                  style={{
                    width: "100%",
                    padding: "10px 14px",
                    borderRadius: 8,
                    border: "1px solid #cbd5e1",
                    fontSize: 14,
                    boxSizing: "border-box"
                  }}
                />
              </div>

              <div>
                <label style={{ display: "block", fontSize: 13, fontWeight: 600, color: "#334155", marginBottom: 6 }}>
                  Description / Instructions
                </label>
                <textarea
                  rows={3}
                  placeholder="Brief description of this format template..."
                  value={uploadDesc}
                  onChange={(e) => setUploadDesc(e.target.value)}
                  style={{
                    width: "100%",
                    padding: "10px 14px",
                    borderRadius: 8,
                    border: "1px solid #cbd5e1",
                    fontSize: 14,
                    boxSizing: "border-box"
                  }}
                />
              </div>

              <div>
                <label style={{ display: "block", fontSize: 13, fontWeight: 600, color: "#334155", marginBottom: 6 }}>
                  Select File (.xlsx, .csv, .pdf) <span style={{ color: "#ef4444" }}>*</span>
                </label>
                <div
                  onClick={() => fileInputRef.current?.click()}
                  style={{
                    border: "2px dashed #cbd5e1",
                    borderRadius: 10,
                    padding: "20px 16px",
                    textAlign: "center",
                    cursor: "pointer",
                    background: uploadFile ? "#f0fdf4" : "#f8fafc"
                  }}
                >
                  {uploadFile ? (
                    <span style={{ fontSize: 14, color: "#166534", fontWeight: 600 }}>📎 {uploadFile.name}</span>
                  ) : (
                    <div>
                      <div style={{ fontSize: 24, marginBottom: 4 }}>📁</div>
                      <div style={{ fontSize: 13, color: "#64748b" }}>Click to select Excel or document file</div>
                    </div>
                  )}
                </div>
                <input
                  ref={fileInputRef}
                  type="file"
                  style={{ display: "none" }}
                  onChange={(e) => setUploadFile(e.target.files?.[0] ?? null)}
                />
              </div>

              {uploadError && (
                <div style={{ background: "#fee2e2", color: "#991b1b", padding: "10px 14px", borderRadius: 8, fontSize: 13 }}>
                  {uploadError}
                </div>
              )}

              <div style={{ display: "flex", justifyContent: "flex-end", gap: 12, marginTop: 12 }}>
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  style={{ padding: "10px 18px", borderRadius: 8, border: "1px solid #cbd5e1", background: "#fff", cursor: "pointer" }}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={uploading}
                  style={{
                    padding: "10px 20px",
                    borderRadius: 8,
                    border: "none",
                    background: "#10b981",
                    color: "#fff",
                    fontWeight: 700,
                    cursor: uploading ? "not-allowed" : "pointer"
                  }}
                >
                  {uploading ? "Uploading..." : "Save Format"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
