import React, { FormEvent, useEffect, useRef, useState } from "react";
import {
  factoryDocumentApi,
  FactoryRecord,
  FactoryDocumentRecord,
} from "../api/factoryDocumentApi";

type MainTab = "upload" | "list";

const DEFAULT_FACTORIES: FactoryRecord[] = [
  { id: "LII", name: "LII", code: "LII", status: "active" },
  { id: "LIE", name: "LIE", code: "LIE", status: "active" },
  { id: "Laxmi Joy LLP", name: "Laxmi Joy LLP", code: "LJLLP", status: "active" },
];

export default function FactoryDocumentsPage() {
  const [activeTab, setActiveTab] = useState<MainTab>("upload");
  const [factories, setFactories] = useState<FactoryRecord[]>(DEFAULT_FACTORIES);
  const [documents, setDocuments] = useState<FactoryDocumentRecord[]>([]);
  const [loading, setLoading] = useState(false);

  // Filter state for "List of Documents"
  const [selectedFactoryTab, setSelectedFactoryTab] = useState<string>("ALL");
  const [searchQuery, setSearchQuery] = useState("");
  const [expiryFilter, setExpiryFilter] = useState<"all" | "valid" | "expiring_soon" | "expired">("all");

  // Upload Form state
  const [formFactoryId, setFormFactoryId] = useState("LII");
  const [documentName, setDocumentName] = useState("");
  const [description, setDescription] = useState("");
  const [expiryDate, setExpiryDate] = useState("");
  const [file, setFile] = useState<File | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [submitSuccess, setSubmitSuccess] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    loadFactories();
    loadDocuments();
  }, []);

  const loadFactories = async () => {
    try {
      const data = await factoryDocumentApi.getFactories();
      if (Array.isArray(data) && data.length > 0) {
        const activeList = data.filter((f) => f.status !== "inactive");
        setFactories(activeList);
        setFormFactoryId((prev) => {
          if (!prev || !activeList.some((f) => f.id === prev || f.name === prev)) {
            return activeList[0].id;
          }
          return prev;
        });
      }
    } catch (err) {
      console.error("Failed to load factories", err);
    }
  };

  const loadDocuments = async () => {
    try {
      setLoading(true);
      const data = await factoryDocumentApi.listDocuments();
      setDocuments(data);
    } catch (err) {
      console.error("Failed to load factory documents", err);
    } finally {
      setLoading(false);
    }
  };

  const handleFileDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragging(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      setFile(e.dataTransfer.files[0]);
    }
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (!formFactoryId) {
      setSubmitError("Please select a factory.");
      return;
    }
    if (!documentName.trim()) {
      setSubmitError("Please enter the document name.");
      return;
    }
    if (!file) {
      setSubmitError("Please select a file to upload.");
      return;
    }

    setSubmitting(true);
    setSubmitError(null);
    setSubmitSuccess(false);

    try {
      const selectedFact = factories.find((f) => f.id === formFactoryId);
      const factoryName = selectedFact ? selectedFact.name : "Factory";

      // 1. Upload File
      const uploadRes = await factoryDocumentApi.uploadFile(file);

      // 2. Save Document record
      await factoryDocumentApi.createDocument({
        factoryId: formFactoryId,
        factoryName,
        documentName: documentName.trim(),
        fileName: uploadRes.fileName || file.name,
        fileUrl: uploadRes.fileUrl,
        fileSize: uploadRes.size || file.size,
        fileType: uploadRes.mimetype || file.type || file.name.split(".").pop(),
        description: description.trim() || undefined,
        expiryDate: expiryDate || undefined,
      });

      setSubmitSuccess(true);
      setDocumentName("");
      setDescription("");
      setExpiryDate("");
      setFile(null);
      if (fileInputRef.current) fileInputRef.current.value = "";
      await loadDocuments();
    } catch (err: any) {
      console.error("Factory document upload error:", err);
      let msg = "Failed to upload document.";
      if (err?.response?.data?.error?.message) {
        msg = err.response.data.error.message;
      } else if (err?.response?.data?.message) {
        msg = err.response.data.message;
      } else if (err.message) {
        msg = err.message;
      }
      setSubmitError(msg);
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (doc: FactoryDocumentRecord) => {
    if (!window.confirm(`Are you sure you want to delete "${doc.documentName}"?`)) return;
    try {
      await factoryDocumentApi.deleteDocument(doc.id);
      setDocuments((prev) => prev.filter((d) => d.id !== doc.id));
    } catch (err) {
      alert("Failed to delete document.");
    }
  };

  const formatFileSize = (bytes?: number) => {
    if (!bytes || isNaN(bytes)) return "—";
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(2)} MB`;
  };

  const getExpiryStatus = (dateStr?: string | null) => {
    if (!dateStr) return { label: "No Expiry", color: "#64748b", bg: "#f1f5f9", status: "none" };
    const exp = new Date(dateStr);
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const diffDays = Math.ceil((exp.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));

    if (diffDays < 0) {
      return { label: `Expired (${dateStr})`, color: "#b91c1c", bg: "#fee2e2", status: "expired" };
    }
    if (diffDays <= 30) {
      return { label: `Expiring Soon (${diffDays}d left)`, color: "#b45309", bg: "#fef3c7", status: "expiring_soon" };
    }
    return { label: `Valid until ${dateStr}`, color: "#15803d", bg: "#dcfce7", status: "valid" };
  };

  const getFileBadge = (fileName: string) => {
    const ext = fileName.split(".").pop()?.toUpperCase() || "FILE";
    let bg = "#f1f5f9";
    let color = "#475569";
    if (["PDF"].includes(ext)) { bg = "#fee2e2"; color = "#b91c1c"; }
    else if (["XLS", "XLSX", "CSV"].includes(ext)) { bg = "#dcfce7"; color = "#15803d"; }
    else if (["DOC", "DOCX"].includes(ext)) { bg = "#dbeafe"; color = "#1d4ed8"; }
    else if (["PNG", "JPG", "JPEG", "WEBP"].includes(ext)) { bg = "#f3e8ff"; color = "#7e22ce"; }
    else if (["DWG", "DXF", "CAD"].includes(ext)) { bg = "#ffedd5"; color = "#c2410c"; }
    else if (["ZIP", "RAR", "7Z"].includes(ext)) { bg = "#fef9c3"; color = "#a16207"; }

    return (
      <span
        style={{
          display: "inline-block",
          padding: "3px 8px",
          borderRadius: 6,
          fontSize: 11,
          fontWeight: 700,
          background: bg,
          color,
          letterSpacing: "0.04em",
        }}
      >
        {ext}
      </span>
    );
  };

  // Filter documents for the List tab
  const filteredDocuments = documents.filter((doc) => {
    // 1. Factory Filter
    if (selectedFactoryTab !== "ALL") {
      if (doc.factoryId !== selectedFactoryTab && doc.factoryName !== selectedFactoryTab) {
        return false;
      }
    }
    // 2. Search Query
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      const matchName = doc.documentName.toLowerCase().includes(q);
      const matchFile = doc.fileName.toLowerCase().includes(q);
      const matchFact = doc.factoryName.toLowerCase().includes(q);
      const matchDesc = doc.description ? doc.description.toLowerCase().includes(q) : false;
      if (!matchName && !matchFile && !matchFact && !matchDesc) return false;
    }
    // 3. Expiry status filter
    if (expiryFilter !== "all") {
      const st = getExpiryStatus(doc.expiryDate).status;
      if (expiryFilter === "expired" && st !== "expired") return false;
      if (expiryFilter === "expiring_soon" && st !== "expiring_soon") return false;
      if (expiryFilter === "valid" && st !== "valid") return false;
    }
    return true;
  });

  // Calculate count per factory
  const getFactoryDocCount = (factoryId: string, factoryName: string) => {
    return documents.filter((d) => d.factoryId === factoryId || d.factoryName === factoryName).length;
  };

  return (
    <div style={{ padding: "32px 28px", maxWidth: 1200, margin: "0 auto", fontFamily: "system-ui, -apple-system, sans-serif" }}>
      {/* ── Top Header ── */}
      <div style={{ marginBottom: 28 }}>
        <h1 style={{ fontSize: 24, fontWeight: 700, color: "#0f172a", margin: "0 0 6px 0", letterSpacing: "-0.02em" }}>
          🏭 Factory Documents
        </h1>
        <p style={{ fontSize: 14, color: "#64748b", margin: 0 }}>
          Upload, inspect, and organize factory-specific legal, compliance, and operational documents.
        </p>
      </div>

      {/* ── Main Tabs (Upload vs List) ── */}
      <div style={{ display: "flex", borderBottom: "2px solid #e2e8f0", marginBottom: 26 }}>
        <button
          type="button"
          onClick={() => setActiveTab("upload")}
          style={{
            padding: "12px 26px",
            border: "none",
            borderBottom: activeTab === "upload" ? "2px solid #2563eb" : "2px solid transparent",
            marginBottom: -2,
            background: "none",
            cursor: "pointer",
            fontSize: 14,
            fontWeight: activeTab === "upload" ? 700 : 500,
            color: activeTab === "upload" ? "#2563eb" : "#64748b",
            display: "flex",
            alignItems: "center",
            gap: 8,
          }}
        >
          <span>📤</span> Upload Document
        </button>

        <button
          type="button"
          onClick={() => setActiveTab("list")}
          style={{
            padding: "12px 26px",
            border: "none",
            borderBottom: activeTab === "list" ? "2px solid #2563eb" : "2px solid transparent",
            marginBottom: -2,
            background: "none",
            cursor: "pointer",
            fontSize: 14,
            fontWeight: activeTab === "list" ? 700 : 500,
            color: activeTab === "list" ? "#2563eb" : "#64748b",
            display: "flex",
            alignItems: "center",
            gap: 8,
          }}
        >
          <span>📋</span> List of Documents
          <span
            style={{
              background: activeTab === "list" ? "#dbeafe" : "#f1f5f9",
              color: activeTab === "list" ? "#1e40af" : "#64748b",
              borderRadius: 12,
              padding: "2px 8px",
              fontSize: 12,
              fontWeight: 600,
            }}
          >
            {documents.length}
          </span>
        </button>
      </div>

      {/* ══════════════════════════════════════════════════════════════
          TAB 1: UPLOAD DOCUMENT FORM
         ══════════════════════════════════════════════════════════════ */}
      {activeTab === "upload" && (
        <div style={{ maxWidth: 640 }}>
          {submitSuccess && (
            <div
              style={{
                background: "#ecfdf5",
                border: "1px solid #a7f3d0",
                borderRadius: 10,
                padding: "14px 18px",
                marginBottom: 24,
                color: "#065f46",
                fontSize: 14,
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
              }}
            >
              <div>
                <strong>✅ Document uploaded successfully!</strong>
              </div>
              <button
                type="button"
                onClick={() => {
                  setSubmitSuccess(false);
                  setActiveTab("list");
                }}
                style={{
                  background: "#059669",
                  color: "#ffffff",
                  border: "none",
                  padding: "6px 14px",
                  borderRadius: 6,
                  fontWeight: 600,
                  fontSize: 12,
                  cursor: "pointer",
                }}
              >
                View in List →
              </button>
            </div>
          )}

          {submitError && (
            <div
              style={{
                background: "#fef2f2",
                border: "1px solid #fecaca",
                borderRadius: 10,
                padding: "14px 18px",
                marginBottom: 24,
                color: "#991b1b",
                fontSize: 14,
              }}
            >
              ⚠️ {submitError}
            </div>
          )}

          <form
            onSubmit={handleSubmit}
            style={{
              background: "#ffffff",
              border: "1px solid #e2e8f0",
              borderRadius: 12,
              padding: 28,
              boxShadow: "0 4px 6px -1px rgba(0, 0, 0, 0.05)",
              display: "flex",
              flexDirection: "column",
              gap: 20,
            }}
          >
            {/* 1. Factory Dropdown (connected to Factory Master) */}
            <div>
              <label style={{ display: "block", fontSize: 13.5, fontWeight: 600, color: "#1e293b", marginBottom: 6 }}>
                Factory <span style={{ color: "#ef4444" }}>*</span>
              </label>

              <select
                value={formFactoryId}
                onChange={(e) => setFormFactoryId(e.target.value)}
                required
                style={{
                  width: "100%",
                  padding: "10px 14px",
                  border: "1px solid #cbd5e1",
                  borderRadius: 8,
                  fontSize: 14,
                  color: "#1e293b",
                  background: "#ffffff",
                  outline: "none",
                  boxSizing: "border-box",
                }}
              >
                {factories.length === 0 && <option value="">Loading factories...</option>}
                {factories.map((f) => (
                  <option key={f.id} value={f.id}>
                    🏢 {f.name} {f.code ? `(${f.code})` : ""}
                  </option>
                ))}
              </select>
              <div style={{ fontSize: 12, color: "#64748b", marginTop: 4 }}>
                Select the factory unit this document belongs to (e.g. LII, LIE, Laxmi Joy LLP).
              </div>
            </div>

            {/* 2. Document Name */}
            <div>
              <label style={{ display: "block", fontSize: 13.5, fontWeight: 600, color: "#1e293b", marginBottom: 6 }}>
                Document Name <span style={{ color: "#ef4444" }}>*</span>
              </label>
              <input
                type="text"
                required
                placeholder="e.g. Factory Fire Safety NOC 2026, Factory License, Building Plan"
                value={documentName}
                onChange={(e) => setDocumentName(e.target.value)}
                style={{
                  width: "100%",
                  padding: "10px 14px",
                  border: "1px solid #cbd5e1",
                  borderRadius: 8,
                  fontSize: 14,
                  color: "#1e293b",
                  outline: "none",
                  boxSizing: "border-box",
                }}
              />
            </div>

            {/* 3. Upload a Document Option (Drag & Drop any kind of file) */}
            <div>
              <label style={{ display: "block", fontSize: 13.5, fontWeight: 600, color: "#1e293b", marginBottom: 6 }}>
                Upload Document File <span style={{ color: "#ef4444" }}>*</span>
              </label>
              <div
                onClick={() => fileInputRef.current?.click()}
                onDragOver={(e) => {
                  e.preventDefault();
                  setIsDragging(true);
                }}
                onDragLeave={() => setIsDragging(false)}
                onDrop={handleFileDrop}
                style={{
                  border: `2px dashed ${isDragging ? "#2563eb" : file ? "#10b981" : "#cbd5e1"}`,
                  borderRadius: 10,
                  padding: "24px 20px",
                  textAlign: "center",
                  cursor: "pointer",
                  background: isDragging ? "#eff6ff" : file ? "#f0fdf4" : "#f8fafc",
                  transition: "all 0.15s ease",
                }}
              >
                {file ? (
                  <div style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 12 }}>
                    <div style={{ fontSize: 28 }}>📄</div>
                    <div style={{ textAlign: "left" }}>
                      <div style={{ fontSize: 14, fontWeight: 600, color: "#065f46" }}>{file.name}</div>
                      <div style={{ fontSize: 12, color: "#64748b" }}>{formatFileSize(file.size)}</div>
                    </div>
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        setFile(null);
                        if (fileInputRef.current) fileInputRef.current.value = "";
                      }}
                      style={{
                        marginLeft: 12,
                        padding: "4px 8px",
                        background: "#fee2e2",
                        color: "#991b1b",
                        border: "none",
                        borderRadius: 6,
                        fontSize: 12,
                        fontWeight: 600,
                        cursor: "pointer",
                      }}
                    >
                      ✕ Remove
                    </button>
                  </div>
                ) : (
                  <>
                    <div style={{ fontSize: 32, marginBottom: 8 }}>📁</div>
                    <div style={{ fontSize: 14, fontWeight: 600, color: "#334155" }}>
                      Click to browse or drag & drop a file here
                    </div>
                    <div style={{ fontSize: 12, color: "#64748b", marginTop: 4 }}>
                      Any file supported: PDF, DOCX, XLSX, DWG/CAD, JPG, PNG, ZIP, etc. (up to 50MB)
                    </div>
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

            {/* 4. Expiry Date */}
            <div>
              <label style={{ display: "block", fontSize: 13.5, fontWeight: 600, color: "#1e293b", marginBottom: 6 }}>
                Expiry Date <span style={{ color: "#64748b", fontWeight: 400 }}>(optional)</span>
              </label>
              <input
                type="date"
                value={expiryDate}
                onChange={(e) => setExpiryDate(e.target.value)}
                style={{
                  width: "100%",
                  padding: "10px 14px",
                  border: "1px solid #cbd5e1",
                  borderRadius: 8,
                  fontSize: 14,
                  color: "#1e293b",
                  outline: "none",
                  boxSizing: "border-box",
                }}
              />
              <div style={{ fontSize: 12, color: "#64748b", marginTop: 4 }}>
                Leave empty if document does not expire (e.g. permanent building deeds).
              </div>
            </div>

            {/* 5. Description / Notes */}
            <div>
              <label style={{ display: "block", fontSize: 13.5, fontWeight: 600, color: "#1e293b", marginBottom: 6 }}>
                Description / Notes <span style={{ color: "#64748b", fontWeight: 400 }}>(optional)</span>
              </label>
              <textarea
                rows={3}
                placeholder="Add notes, issuing authority, registration number, or renewal notes..."
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                style={{
                  width: "100%",
                  padding: "10px 14px",
                  border: "1px solid #cbd5e1",
                  borderRadius: 8,
                  fontSize: 14,
                  color: "#1e293b",
                  outline: "none",
                  boxSizing: "border-box",
                  resize: "vertical",
                }}
              />
            </div>

            {/* Submit Button */}
            <button
              type="submit"
              disabled={submitting}
              style={{
                padding: "12px 24px",
                background: submitting ? "#93c5fd" : "#2563eb",
                color: "#ffffff",
                border: "none",
                borderRadius: 8,
                fontSize: 14,
                fontWeight: 600,
                cursor: submitting ? "not-allowed" : "pointer",
                boxShadow: "0 2px 4px rgba(37, 99, 235, 0.2)",
                transition: "background 0.15s ease",
              }}
            >
              {submitting ? "Uploading Document..." : "Upload Document"}
            </button>
          </form>
        </div>
      )}

      {/* ══════════════════════════════════════════════════════════════
          TAB 2: LIST OF DOCUMENTS (WITH FACTORY-WISE TABS ON ONE PAGE)
         ══════════════════════════════════════════════════════════════ */}
      {activeTab === "list" && (
        <div>
          {/* ── Factory-Wise Tabs Bar ── */}
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: 8,
              overflowX: "auto",
              paddingBottom: 6,
              marginBottom: 20,
            }}
          >
            {/* ALL Tab */}
            <button
              type="button"
              onClick={() => setSelectedFactoryTab("ALL")}
              style={{
                padding: "8px 16px",
                borderRadius: 20,
                border: selectedFactoryTab === "ALL" ? "2px solid #2563eb" : "1px solid #cbd5e1",
                background: selectedFactoryTab === "ALL" ? "#eff6ff" : "#ffffff",
                color: selectedFactoryTab === "ALL" ? "#1d4ed8" : "#475569",
                fontWeight: selectedFactoryTab === "ALL" ? 700 : 500,
                fontSize: 13,
                cursor: "pointer",
                display: "inline-flex",
                alignItems: "center",
                gap: 6,
                whiteSpace: "nowrap",
                transition: "all 0.15s",
              }}
            >
              🌐 All Factories
              <span
                style={{
                  background: selectedFactoryTab === "ALL" ? "#dbeafe" : "#f1f5f9",
                  padding: "1px 7px",
                  borderRadius: 10,
                  fontSize: 11,
                  fontWeight: 700,
                }}
              >
                {documents.length}
              </span>
            </button>

            {/* Individual Factory Tabs */}
            {factories.map((f) => {
              const count = getFactoryDocCount(f.id, f.name);
              const isSelected = selectedFactoryTab === f.id || selectedFactoryTab === f.name;
              return (
                <button
                  key={f.id}
                  type="button"
                  onClick={() => setSelectedFactoryTab(f.id)}
                  style={{
                    padding: "8px 16px",
                    borderRadius: 20,
                    border: isSelected ? "2px solid #2563eb" : "1px solid #cbd5e1",
                    background: isSelected ? "#eff6ff" : "#ffffff",
                    color: isSelected ? "#1d4ed8" : "#475569",
                    fontWeight: isSelected ? 700 : 500,
                    fontSize: 13,
                    cursor: "pointer",
                    display: "inline-flex",
                    alignItems: "center",
                    gap: 6,
                    whiteSpace: "nowrap",
                    transition: "all 0.15s",
                  }}
                >
                  🏢 {f.name}
                  <span
                    style={{
                      background: isSelected ? "#dbeafe" : "#f1f5f9",
                      padding: "1px 7px",
                      borderRadius: 10,
                      fontSize: 11,
                      fontWeight: 700,
                    }}
                  >
                    {count}
                  </span>
                </button>
              );
            })}
          </div>

          {/* ── Search & Filter Controls ── */}
          <div
            style={{
              background: "#ffffff",
              border: "1px solid #e2e8f0",
              borderRadius: 10,
              padding: "12px 18px",
              marginBottom: 20,
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
              flexWrap: "wrap",
              gap: 12,
            }}
          >
            {/* Search Input */}
            <div style={{ flex: 1, minWidth: 260 }}>
              <input
                type="text"
                placeholder="🔍 Search documents, file names, or descriptions..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                style={{
                  width: "100%",
                  padding: "8px 14px",
                  border: "1px solid #cbd5e1",
                  borderRadius: 6,
                  fontSize: 13.5,
                  outline: "none",
                  boxSizing: "border-box",
                }}
              />
            </div>

            {/* Expiry Status Filter */}
            <div style={{ display: "flex", gap: 6, alignItems: "center" }}>
              <span style={{ fontSize: 12, fontWeight: 600, color: "#64748b" }}>Status:</span>
              {(["all", "valid", "expiring_soon", "expired"] as const).map((filterKey) => {
                const labels = {
                  all: "All",
                  valid: "🟢 Valid",
                  expiring_soon: "🟡 Expiring Soon",
                  expired: "🔴 Expired",
                };
                const active = expiryFilter === filterKey;
                return (
                  <button
                    key={filterKey}
                    type="button"
                    onClick={() => setExpiryFilter(filterKey)}
                    style={{
                      padding: "5px 10px",
                      border: active ? "1px solid #2563eb" : "1px solid #e2e8f0",
                      background: active ? "#eff6ff" : "#ffffff",
                      color: active ? "#1d4ed8" : "#475569",
                      borderRadius: 6,
                      fontSize: 12,
                      fontWeight: active ? 700 : 500,
                      cursor: "pointer",
                    }}
                  >
                    {labels[filterKey]}
                  </button>
                );
              })}
            </div>
          </div>

          {/* ── Documents Table ── */}
          <div
            style={{
              background: "#ffffff",
              borderRadius: 12,
              border: "1px solid #e2e8f0",
              boxShadow: "0 4px 6px -1px rgba(0,0,0,0.05)",
              overflow: "hidden",
            }}
          >
            {loading ? (
              <div style={{ padding: 40, textAlign: "center", color: "#64748b", fontSize: 14 }}>
                Loading factory documents...
              </div>
            ) : filteredDocuments.length === 0 ? (
              <div style={{ padding: "50px 20px", textAlign: "center", color: "#64748b" }}>
                <div style={{ fontSize: 40, marginBottom: 12 }}>📁</div>
                <div style={{ fontSize: 16, fontWeight: 600, color: "#334155", marginBottom: 6 }}>
                  No documents found
                </div>
                <div style={{ fontSize: 13, color: "#94a3b8", maxWidth: 420, margin: "0 auto 20px auto" }}>
                  {selectedFactoryTab !== "ALL"
                    ? "No documents have been uploaded for this factory yet."
                    : "No documents match your search or filter criteria."}
                </div>
                <button
                  type="button"
                  onClick={() => {
                    if (selectedFactoryTab !== "ALL") {
                      setFormFactoryId(selectedFactoryTab);
                    }
                    setActiveTab("upload");
                  }}
                  style={{
                    padding: "9px 20px",
                    background: "#2563eb",
                    color: "#ffffff",
                    border: "none",
                    borderRadius: 8,
                    fontSize: 13,
                    fontWeight: 600,
                    cursor: "pointer",
                  }}
                >
                  ➕ Upload New Document
                </button>
              </div>
            ) : (
              <table style={{ width: "100%", borderCollapse: "collapse", textAlign: "left" }}>
                <thead>
                  <tr style={{ background: "#f8fafc", borderBottom: "1px solid #e2e8f0" }}>
                    <th style={{ padding: "12px 18px", fontSize: 12, fontWeight: 700, color: "#475569", textTransform: "uppercase" }}>
                      Document Name
                    </th>
                    <th style={{ padding: "12px 18px", fontSize: 12, fontWeight: 700, color: "#475569", textTransform: "uppercase" }}>
                      Factory
                    </th>
                    <th style={{ padding: "12px 18px", fontSize: 12, fontWeight: 700, color: "#475569", textTransform: "uppercase" }}>
                      File & Size
                    </th>
                    <th style={{ padding: "12px 18px", fontSize: 12, fontWeight: 700, color: "#475569", textTransform: "uppercase" }}>
                      Expiry Status
                    </th>
                    <th style={{ padding: "12px 18px", fontSize: 12, fontWeight: 700, color: "#475569", textTransform: "uppercase" }}>
                      Uploaded
                    </th>
                    <th style={{ padding: "12px 18px", fontSize: 12, fontWeight: 700, color: "#475569", textTransform: "uppercase", textAlign: "right" }}>
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {filteredDocuments.map((doc) => {
                    const expInfo = getExpiryStatus(doc.expiryDate);
                    return (
                      <tr
                        key={doc.id}
                        style={{
                          borderBottom: "1px solid #f1f5f9",
                          transition: "background 0.15s ease",
                        }}
                      >
                        {/* Document Name */}
                        <td style={{ padding: "14px 18px", verticalAlign: "top" }}>
                          <div style={{ fontSize: 14, fontWeight: 600, color: "#0f172a" }}>
                            {doc.documentName}
                          </div>
                          {doc.description && (
                            <div style={{ fontSize: 12, color: "#64748b", marginTop: 3, maxWidth: 360, lineHeight: 1.4 }}>
                              {doc.description}
                            </div>
                          )}
                        </td>

                        {/* Factory */}
                        <td style={{ padding: "14px 18px", verticalAlign: "top" }}>
                          <span
                            style={{
                              display: "inline-block",
                              padding: "4px 10px",
                              borderRadius: 12,
                              fontSize: 12,
                              fontWeight: 600,
                              background: "#eff6ff",
                              color: "#1d4ed8",
                              border: "1px solid #bfdbfe",
                            }}
                          >
                            🏢 {doc.factoryName}
                          </span>
                        </td>

                        {/* File & Size */}
                        <td style={{ padding: "14px 18px", verticalAlign: "top" }}>
                          <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                            {getFileBadge(doc.fileName)}
                            <a
                              href={doc.fileUrl}
                              target="_blank"
                              rel="noreferrer"
                              style={{
                                fontSize: 13,
                                color: "#2563eb",
                                textDecoration: "none",
                                fontWeight: 500,
                                maxWidth: 180,
                                overflow: "hidden",
                                textOverflow: "ellipsis",
                                whiteSpace: "nowrap",
                              }}
                              title={doc.fileName}
                            >
                              {doc.fileName}
                            </a>
                          </div>
                          <div style={{ fontSize: 11, color: "#94a3b8", marginTop: 2, marginLeft: 34 }}>
                            {formatFileSize(doc.fileSize)}
                          </div>
                        </td>

                        {/* Expiry Status */}
                        <td style={{ padding: "14px 18px", verticalAlign: "top" }}>
                          <span
                            style={{
                              display: "inline-block",
                              padding: "3px 9px",
                              borderRadius: 12,
                              fontSize: 12,
                              fontWeight: 600,
                              background: expInfo.bg,
                              color: expInfo.color,
                            }}
                          >
                            {expInfo.label}
                          </span>
                        </td>

                        {/* Uploaded Date & By */}
                        <td style={{ padding: "14px 18px", verticalAlign: "top", fontSize: 12, color: "#64748b" }}>
                          <div>{new Date(doc.createdAt).toLocaleDateString()}</div>
                          {doc.uploadedByName && (
                            <div style={{ fontSize: 11, color: "#94a3b8", marginTop: 2 }}>
                              by {doc.uploadedByName}
                            </div>
                          )}
                        </td>

                        {/* Actions */}
                        <td style={{ padding: "14px 18px", verticalAlign: "top", textAlign: "right" }}>
                          <div style={{ display: "inline-flex", gap: 8 }}>
                            <a
                              href={doc.fileUrl}
                              target="_blank"
                              rel="noreferrer"
                              style={{
                                padding: "5px 10px",
                                background: "#eff6ff",
                                color: "#1d4ed8",
                                borderRadius: 6,
                                fontSize: 12,
                                fontWeight: 600,
                                textDecoration: "none",
                              }}
                            >
                              View
                            </a>
                            <a
                              href={doc.fileUrl}
                              download={doc.fileName}
                              style={{
                                padding: "5px 10px",
                                background: "#f8fafc",
                                border: "1px solid #cbd5e1",
                                color: "#334155",
                                borderRadius: 6,
                                fontSize: 12,
                                fontWeight: 600,
                                textDecoration: "none",
                              }}
                            >
                              Download
                            </a>
                            <button
                              type="button"
                              onClick={() => handleDelete(doc)}
                              style={{
                                padding: "5px 8px",
                                background: "#fee2e2",
                                border: "none",
                                color: "#b91c1c",
                                borderRadius: 6,
                                fontSize: 12,
                                fontWeight: 600,
                                cursor: "pointer",
                              }}
                            >
                              Delete
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

