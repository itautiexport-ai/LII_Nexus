import { FormEvent, useEffect, useRef, useState } from "react";
import { documentApi, DocumentRecord } from "../../documents/api/documentApi";
import { departmentsApi, DepartmentRecord } from "../../admin/organization/departments/api/departmentsApi";

type Tab = "upload" | "list";

const EMPTY_FORM = {
  title: "",
  departmentId: "",
  changeNotes: "",
};

export default function ManualsPage() {
  const [tab, setTab] = useState<Tab>("upload");
  const [form, setForm] = useState(EMPTY_FORM);
  const [file, setFile] = useState<File | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [submitSuccess, setSubmitSuccess] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [docs, setDocs] = useState<DocumentRecord[]>([]);
  const [departments, setDepartments] = useState<DepartmentRecord[]>([]);
  const [loading, setLoading] = useState(false);
  const [search, setSearch] = useState("");
  const [filterDepartment, setFilterDepartment] = useState("");

  async function loadDepartments() {
    try {
      const data = await departmentsApi.list();
      setDepartments(data);
    } catch (err) {
      console.error("Failed to load departments", err);
    }
  }

  async function loadDocs() {
    setLoading(true);
    try {
      const res = await documentApi.list({ search: search || undefined });
      
      const filtered = res.items.filter(doc => 
        doc.category === "machine_manual" &&
        (!filterDepartment || doc.departmentId === filterDepartment)
      );
      
      setDocs(filtered);
    } catch (err) {
      console.error("Failed to load documents", err);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadDepartments();
  }, []);

  useEffect(() => {
    if (tab === "list") loadDocs();
  }, [tab, search, filterDepartment]);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    if (!file) { setSubmitError("Please select a file to upload."); return; }
    setSubmitting(true);
    setSubmitError(null);
    setSubmitSuccess(false);
    try {
      const uploadRes = await documentApi.uploadFile(file);
      await documentApi.create({
        title: form.title,
        category: "machine_manual",
        departmentId: form.departmentId || null,
        fileName: uploadRes.fileName,
        fileUrl: uploadRes.fileUrl,
        changeNotes: form.changeNotes || undefined,
      });
      setSubmitSuccess(true);
      setForm(EMPTY_FORM);
      setFile(null);
      if (fileInputRef.current) fileInputRef.current.value = "";
    } catch (err: any) {
      console.error("Upload error:", err.response?.data || err);
      let msg = "Failed to upload document.";
      if (err?.response?.data?.message) {
        msg = Array.isArray(err.response.data.message) 
          ? err.response.data.message.join(", ") 
          : err.response.data.message;
      } else if (err?.response?.data?.error?.message) {
        msg = err.response.data.error.message;
      } else if (err.message) {
        msg = err.message;
      }
      setSubmitError(msg);
    } finally {
      setSubmitting(false);
    }
  }

  async function handleDelete(id: string) {
    if (!window.confirm("Are you sure you want to delete this manual?")) return;
    try {
      await documentApi.remove(id);
      setDocs(docs.filter(d => d.id !== id));
    } catch (err) {
      console.error("Failed to delete manual", err);
      alert("Failed to delete manual.");
    }
  }

  return (
    <div style={{ fontFamily: "-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif" }}>
      {/* ── Page Header ── */}
      <div style={{ marginBottom: 24 }}>
        <h1 style={{ fontSize: 22, fontWeight: 700, color: "#111827", margin: 0 }}>
          Manuals
        </h1>
        <p style={{ fontSize: 13, color: "#6b7280", marginTop: 4 }}>
          Upload and manage machine and equipment manuals.
        </p>
      </div>

      {/* ── Tabs ── */}
      <div style={{ display: "flex", borderBottom: "2px solid #e5e7eb", marginBottom: 28, gap: 0 }}>
        {(["upload", "list"] as Tab[]).map((t) => {
          const labels: Record<Tab, string> = { upload: "📤  Upload Manual", list: "📋  List of Manuals" };
          const active = tab === t;
          return (
            <button
              key={t}
              onClick={() => setTab(t)}
              style={{
                padding: "10px 22px",
                border: "none",
                borderBottom: active ? "2px solid #3457d5" : "2px solid transparent",
                marginBottom: -2,
                background: "none",
                cursor: "pointer",
                fontSize: 13.5,
                fontWeight: active ? 700 : 500,
                color: active ? "#3457d5" : "#6b7280",
                transition: "color 0.15s, border-color 0.15s",
              }}
            >
              {labels[t]}
            </button>
          );
        })}
      </div>

      {/* ══════════════ TAB: Upload ══════════════ */}
      {tab === "upload" && (
        <div style={{ maxWidth: 560 }}>
          {submitSuccess && (
            <div style={{ background: "#d1fae5", border: "1px solid #6ee7b7", borderRadius: 8, padding: "12px 16px", marginBottom: 20, color: "#065f46", fontSize: 13.5, fontWeight: 500 }}>
              ✅ Manual uploaded successfully!{" "}
              <button
                onClick={() => { setSubmitSuccess(false); setTab("list"); }}
                style={{ background: "none", border: "none", color: "#059669", cursor: "pointer", fontWeight: 700, textDecoration: "underline", fontSize: 13 }}
              >
                View in list →
              </button>
            </div>
          )}

          <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: 16 }}>

            {/* Title */}
            <div>
              <label style={labelStyle}>Manual Title <span style={{ color: "#ef4444" }}>*</span></label>
              <input
                required
                value={form.title}
                onChange={(e) => setForm({ ...form, title: e.target.value })}
                placeholder="e.g. CNC Machine Operator Manual"
                style={inputStyle}
              />
            </div>

            {/* Department */}
            <div>
              <label style={labelStyle}>Department</label>
              <select
                value={form.departmentId}
                onChange={(e) => setForm({ ...form, departmentId: e.target.value })}
                style={inputStyle}
              >
                <option value="">-- General (All Departments) --</option>
                {departments.map((d) => (
                  <option key={d.id} value={d.id}>{d.name}</option>
                ))}
              </select>
            </div>

            {/* File picker */}
            <div>
              <label style={labelStyle}>File <span style={{ color: "#ef4444" }}>*</span></label>
              <div
                onClick={() => fileInputRef.current?.click()}
                style={{
                  border: "2px dashed #d1d5db",
                  borderRadius: 8,
                  padding: "18px 16px",
                  textAlign: "center",
                  cursor: "pointer",
                  background: file ? "#f0fdf4" : "#f9fafb",
                  transition: "border-color 0.15s",
                }}
                onMouseEnter={(e) => (e.currentTarget.style.borderColor = "#3457d5")}
                onMouseLeave={(e) => (e.currentTarget.style.borderColor = "#d1d5db")}
              >
                {file ? (
                  <span style={{ fontSize: 13, color: "#065f46", fontWeight: 600 }}>📎 {file.name}</span>
                ) : (
                  <>
                    <div style={{ fontSize: 24, marginBottom: 6 }}>📁</div>
                    <div style={{ fontSize: 13, color: "#6b7280" }}>Click to browse or drag a file here</div>
                    <div style={{ fontSize: 11, color: "#9ca3af", marginTop: 4 }}>PDF, DOCX, XLSX etc.</div>
                  </>
                )}
              </div>
              <input
                ref={fileInputRef}
                type="file"
                style={{ display: "none" }}
                onChange={(e) => setFile(e.target.files?.[0] ?? null)}
              />
            </div>

            {/* Change Notes */}
            <div>
              <label style={labelStyle}>Notes / Description <span style={{ color: "#9ca3af", fontWeight: 400 }}>(optional)</span></label>
              <textarea
                value={form.changeNotes}
                onChange={(e) => setForm({ ...form, changeNotes: e.target.value })}
                rows={3}
                placeholder="Brief notes about this manual..."
                style={{ ...inputStyle, resize: "vertical" }}
              />
            </div>

            {submitError && (
              <div style={{ background: "#fee2e2", border: "1px solid #fca5a5", borderRadius: 6, padding: "10px 14px", color: "#991b1b", fontSize: 13 }}>
                {submitError}
              </div>
            )}

            <button
              type="submit"
              disabled={submitting}
              style={{
                padding: "11px 28px",
                background: submitting ? "#93a3d8" : "#3457d5",
                color: "#fff",
                border: "none",
                borderRadius: 8,
                fontSize: 14,
                fontWeight: 600,
                cursor: submitting ? "not-allowed" : "pointer",
                alignSelf: "flex-start",
                transition: "background 0.15s",
              }}
            >
              {submitting ? "Uploading…" : "Upload Manual"}
            </button>
          </form>
        </div>
      )}

      {/* ══════════════ TAB: List ══════════════ */}
      {tab === "list" && (
        <div>
          {/* Filters */}
          <div style={{ display: "flex", gap: 10, marginBottom: 18, flexWrap: "wrap" }}>
            <input
              placeholder="🔍  Search by title…"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              style={{ ...inputStyle, maxWidth: 260, flex: 1 }}
            />
            <select
              value={filterDepartment}
              onChange={(e) => setFilterDepartment(e.target.value)}
              style={{ ...inputStyle, maxWidth: 200 }}
            >
              <option value="">All Departments</option>
              {departments.map((d) => (
                <option key={d.id} value={d.id}>{d.name}</option>
              ))}
            </select>
            <button
              onClick={loadDocs}
              style={{ padding: "8px 16px", background: "#f3f4f6", border: "1px solid #e5e7eb", borderRadius: 7, cursor: "pointer", fontSize: 13, fontWeight: 600, color: "#374151" }}
            >
              ↻ Refresh
            </button>
          </div>

          {/* Table */}
          {loading ? (
            <div style={{ textAlign: "center", padding: "40px 0", color: "#9ca3af", fontSize: 14 }}>Loading manuals…</div>
          ) : docs.length === 0 ? (
            <div style={{ textAlign: "center", padding: "48px 0", color: "#9ca3af" }}>
              <div style={{ fontSize: 36, marginBottom: 12 }}>📂</div>
              <div style={{ fontSize: 14 }}>No manuals found.</div>
              <button
                onClick={() => setTab("upload")}
                style={{ marginTop: 12, padding: "8px 18px", background: "#3457d5", color: "#fff", border: "none", borderRadius: 7, cursor: "pointer", fontSize: 13, fontWeight: 600 }}
              >
                Upload your first manual
              </button>
            </div>
          ) : (
            <div style={{ overflowX: "auto", borderRadius: 10, border: "1px solid #e5e7eb" }}>
              <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 13.5 }}>
                <thead>
                  <tr style={{ background: "#f9fafb", borderBottom: "1px solid #e5e7eb" }}>
                    {["#", "Title", "Attachment", "Department", "Last Updated", "Actions"].map((h) => (
                      <th key={h} style={{ padding: "11px 14px", textAlign: "left", fontWeight: 600, color: "#374151", fontSize: 12, textTransform: "uppercase", letterSpacing: "0.04em" }}>
                        {h}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {docs.map((doc, i) => (
                    <tr
                      key={doc.id}
                      style={{ borderBottom: "1px solid #f3f4f6", transition: "background 0.1s" }}
                      onMouseEnter={(e) => (e.currentTarget.style.background = "#f9fafb")}
                      onMouseLeave={(e) => (e.currentTarget.style.background = "")}
                    >
                      <td style={{ padding: "11px 14px", color: "#9ca3af" }}>{i + 1}</td>
                      <td style={{ padding: "11px 14px", fontWeight: 600, color: "#111827" }}>
                        {doc.title}
                      </td>
                      <td style={{ padding: "11px 14px" }}>
                        {doc.fileUrl ? (
                          <a href={doc.fileUrl} target="_blank" rel="noreferrer" style={{ color: "#3457d5", textDecoration: "none", display: "inline-flex", alignItems: "center", gap: 4 }}>
                            📎 View
                          </a>
                        ) : (
                          <span style={{ color: "#9ca3af" }}>—</span>
                        )}
                      </td>
                      <td style={{ padding: "11px 14px", color: "#6b7280" }}>
                        {doc.departmentName || <span style={{ color: "#9ca3af" }}>—</span>}
                      </td>
                      <td style={{ padding: "11px 14px", color: "#9ca3af", fontSize: 12 }}>
                        {new Date(doc.updatedAt).toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" })}
                      </td>
                      <td style={{ padding: "11px 14px" }}>
                        <button
                          onClick={() => handleDelete(doc.id)}
                          style={{
                            padding: "6px 12px",
                            background: "#fee2e2",
                            color: "#b91c1c",
                            border: "none",
                            borderRadius: 6,
                            cursor: "pointer",
                            fontSize: 12,
                            fontWeight: 600,
                            transition: "background 0.15s",
                          }}
                          onMouseEnter={(e) => (e.currentTarget.style.background = "#fecaca")}
                          onMouseLeave={(e) => (e.currentTarget.style.background = "#fee2e2")}
                        >
                          🗑 Delete
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

/* ── Shared styles ── */
const labelStyle: React.CSSProperties = {
  display: "block",
  fontSize: 13,
  fontWeight: 600,
  color: "#374151",
  marginBottom: 6,
};

const inputStyle: React.CSSProperties = {
  display: "block",
  width: "100%",
  padding: "9px 12px",
  border: "1px solid #d1d5db",
  borderRadius: 7,
  fontSize: 13.5,
  color: "#111827",
  background: "#fff",
  outline: "none",
  boxSizing: "border-box",
  transition: "border-color 0.15s",
};
