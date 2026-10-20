import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { qmsApi, NonConformanceReport } from "../api/qmsApi";

export default function QmsNcrPage() {
  const navigate = useNavigate();
  const [ncrs, setNcrs] = useState<NonConformanceReport[]>([]);
  const [loading, setLoading] = useState(true);
  const [severityFilter, setSeverityFilter] = useState<string>("ALL");
  const [statusFilter, setStatusFilter] = useState<string>("ALL");
  const [searchQuery, setSearchQuery] = useState("");

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedNcr, setSelectedNcr] = useState<NonConformanceReport | null>(null);

  const [formData, setFormData] = useState({
    date: new Date().toISOString().split("T")[0],
    title: "",
    partNumber: "",
    partName: "",
    severity: "Major" as "Critical" | "Major" | "Minor",
    stage: "In-Process" as "Incoming" | "In-Process" | "Final Inspection" | "Customer Return",
    defectDescription: "",
    rootCauseCategory: "Machine" as "Material" | "Machine" | "Method" | "Manpower" | "Environment",
    containmentAction: "",
    disposition: "Rework" as "Rework" | "Scrap" | "Return to Vendor" | "Use As-Is (Concession)",
    status: "Open" as "Open" | "Under Investigation" | "Disposition Assigned" | "Closed",
    assignedTo: "",
    targetDate: new Date(Date.now() + 7 * 86400000).toISOString().split("T")[0],
  });

  useEffect(() => {
    loadNcrs();
  }, []);

  const loadNcrs = async () => {
    setLoading(true);
    try {
      const data = await qmsApi.getNcrs();
      setNcrs(data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const filtered = ncrs.filter((n) => {
    if (severityFilter !== "ALL" && n.severity !== severityFilter) return false;
    if (statusFilter !== "ALL" && n.status !== statusFilter) return false;
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      const match =
        n.ncrNumber.toLowerCase().includes(q) ||
        n.title.toLowerCase().includes(q) ||
        n.partName.toLowerCase().includes(q) ||
        n.assignedTo.toLowerCase().includes(q);
      if (!match) return false;
    }
    return true;
  });

  const handleCreateSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.title || !formData.partName) {
      alert("Please provide Title and Part Name.");
      return;
    }

    await qmsApi.createNcr(formData);
    setIsModalOpen(false);
    setFormData({
      date: new Date().toISOString().split("T")[0],
      title: "",
      partNumber: "",
      partName: "",
      severity: "Major",
      stage: "In-Process",
      defectDescription: "",
      rootCauseCategory: "Machine",
      containmentAction: "",
      disposition: "Rework",
      status: "Open",
      assignedTo: "",
      targetDate: new Date(Date.now() + 7 * 86400000).toISOString().split("T")[0],
    });
    loadNcrs();
  };

  const handleStatusChange = async (id: string, newStatus: NonConformanceReport["status"]) => {
    await qmsApi.updateNcrStatus(id, newStatus);
    loadNcrs();
  };

  return (
    <div style={{ padding: "24px 32px", maxWidth: 1400, margin: "0 auto" }}>
      {/* Header */}
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          marginBottom: 24,
          flexWrap: "wrap",
          gap: 16,
        }}
      >
        <div>
          <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 4 }}>
            <span style={{ cursor: "pointer", color: "#6366f1", fontWeight: 600, fontSize: 13 }} onClick={() => navigate("/admin/qms/dashboard")}>
              ← QMS Overview
            </span>
          </div>
          <h1 style={{ fontSize: 26, fontWeight: 800, color: "#0f172a", margin: 0 }}>
            Non-Conformance Reports (NCR)
          </h1>
          <p style={{ color: "#64748b", margin: "4px 0 0 0", fontSize: 14 }}>
            Systematic defect containment, material segregation, and disposition management
          </p>
        </div>

        <button
          onClick={() => setIsModalOpen(true)}
          style={{
            background: "#dc2626",
            color: "#ffffff",
            padding: "10px 20px",
            borderRadius: 8,
            border: "none",
            fontWeight: 700,
            cursor: "pointer",
            boxShadow: "0 4px 12px rgba(220, 38, 38, 0.3)",
            display: "flex",
            alignItems: "center",
            gap: 8,
          }}
        >
          <span>⚠️</span> Log New NCR
        </button>
      </div>

      {/* Filter Bar */}
      <div
        style={{
          background: "#ffffff",
          borderRadius: 12,
          padding: "16px 20px",
          border: "1px solid #e2e8f0",
          marginBottom: 20,
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          flexWrap: "wrap",
          gap: 16,
        }}
      >
        <div style={{ display: "flex", gap: 12, flexWrap: "wrap" }}>
          <select
            value={severityFilter}
            onChange={(e) => setSeverityFilter(e.target.value)}
            style={{ padding: "8px 14px", borderRadius: 8, border: "1px solid #cbd5e1", fontSize: 13 }}
          >
            <option value="ALL">All Severities</option>
            <option value="Critical">Critical</option>
            <option value="Major">Major</option>
            <option value="Minor">Minor</option>
          </select>

          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            style={{ padding: "8px 14px", borderRadius: 8, border: "1px solid #cbd5e1", fontSize: 13 }}
          >
            <option value="ALL">All Statuses</option>
            <option value="Open">Open</option>
            <option value="Under Investigation">Under Investigation</option>
            <option value="Disposition Assigned">Disposition Assigned</option>
            <option value="Closed">Closed</option>
          </select>
        </div>

        <input
          type="text"
          placeholder="Search NCR #, defect, owner..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          style={{ padding: "8px 14px", borderRadius: 8, border: "1px solid #cbd5e1", fontSize: 13, width: 260 }}
        />
      </div>

      {/* Table */}
      <div
        style={{
          background: "#ffffff",
          borderRadius: 14,
          border: "1px solid #e2e8f0",
          overflow: "hidden",
          boxShadow: "0 1px 3px rgba(0,0,0,0.04)",
        }}
      >
        <div style={{ overflowX: "auto" }}>
          <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 13 }}>
            <thead>
              <tr style={{ background: "#f8fafc", borderBottom: "1px solid #e2e8f0", textAlign: "left" }}>
                <th style={{ padding: "12px 16px", color: "#475569", fontWeight: 600 }}>NCR #</th>
                <th style={{ padding: "12px 16px", color: "#475569", fontWeight: 600 }}>Date</th>
                <th style={{ padding: "12px 16px", color: "#475569", fontWeight: 600 }}>Defect Description & Item</th>
                <th style={{ padding: "12px 16px", color: "#475569", fontWeight: 600 }}>Severity</th>
                <th style={{ padding: "12px 16px", color: "#475569", fontWeight: 600 }}>Stage</th>
                <th style={{ padding: "12px 16px", color: "#475569", fontWeight: 600 }}>Disposition</th>
                <th style={{ padding: "12px 16px", color: "#475569", fontWeight: 600 }}>Status</th>
                <th style={{ padding: "12px 16px", color: "#475569", fontWeight: 600 }}>Owner</th>
                <th style={{ padding: "12px 16px", color: "#475569", fontWeight: 600, textAlign: "right" }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan={9} style={{ padding: 40, textAlign: "center", color: "#64748b" }}>
                    Loading NCRs...
                  </td>
                </tr>
              ) : filtered.length === 0 ? (
                <tr>
                  <td colSpan={9} style={{ padding: 40, textAlign: "center", color: "#94a3b8" }}>
                    No Non-Conformance Reports match your search criteria.
                  </td>
                </tr>
              ) : (
                filtered.map((ncr) => {
                  const sevStyle =
                    ncr.severity === "Critical"
                      ? { bg: "#fee2e2", text: "#991b1b" }
                      : ncr.severity === "Major"
                      ? { bg: "#ffedd5", text: "#c2410c" }
                      : { bg: "#fef9c3", text: "#854d0e" };

                  return (
                    <tr
                      key={ncr.id}
                      style={{ borderBottom: "1px solid #f1f5f9", transition: "background 0.15s" }}
                      onMouseEnter={(e) => (e.currentTarget.style.background = "#f8fafc")}
                      onMouseLeave={(e) => (e.currentTarget.style.background = "transparent")}
                    >
                      <td style={{ padding: "14px 16px", fontWeight: 700, color: "#1e293b" }}>
                        {ncr.ncrNumber}
                      </td>
                      <td style={{ padding: "14px 16px", color: "#64748b" }}>{ncr.date}</td>
                      <td style={{ padding: "14px 16px" }}>
                        <div style={{ fontWeight: 600, color: "#0f172a" }}>{ncr.title}</div>
                        <div style={{ fontSize: 12, color: "#64748b" }}>
                          Part: <b>{ncr.partName}</b> ({ncr.partNumber || "N/A"})
                        </div>
                      </td>
                      <td style={{ padding: "14px 16px" }}>
                        <span
                          style={{
                            background: sevStyle.bg,
                            color: sevStyle.text,
                            padding: "3px 10px",
                            borderRadius: 12,
                            fontWeight: 700,
                            fontSize: 11,
                          }}
                        >
                          {ncr.severity}
                        </span>
                      </td>
                      <td style={{ padding: "14px 16px", color: "#334155" }}>{ncr.stage}</td>
                      <td style={{ padding: "14px 16px" }}>
                        <span
                          style={{
                            background: "#f1f5f9",
                            color: "#334155",
                            padding: "2px 8px",
                            borderRadius: 6,
                            fontSize: 12,
                            fontWeight: 600,
                          }}
                        >
                          {ncr.disposition}
                        </span>
                      </td>
                      <td style={{ padding: "14px 16px" }}>
                        <select
                          value={ncr.status}
                          onChange={(e) => handleStatusChange(ncr.id, e.target.value as any)}
                          style={{
                            padding: "4px 8px",
                            borderRadius: 6,
                            fontSize: 12,
                            fontWeight: 600,
                            border: "1px solid #cbd5e1",
                            background:
                              ncr.status === "Closed"
                                ? "#dcfce7"
                                : ncr.status === "Open"
                                ? "#fee2e2"
                                : "#fef3c7",
                            color:
                              ncr.status === "Closed"
                                ? "#166534"
                                : ncr.status === "Open"
                                ? "#991b1b"
                                : "#92400e",
                            cursor: "pointer",
                          }}
                        >
                          <option value="Open">Open</option>
                          <option value="Under Investigation">Under Investigation</option>
                          <option value="Disposition Assigned">Disposition Assigned</option>
                          <option value="Closed">Closed</option>
                        </select>
                      </td>
                      <td style={{ padding: "14px 16px", color: "#475569" }}>{ncr.assignedTo || "Unassigned"}</td>
                      <td style={{ padding: "14px 16px", textAlign: "right" }}>
                        <button
                          onClick={() => setSelectedNcr(ncr)}
                          style={{
                            background: "#f1f5f9",
                            color: "#334155",
                            border: "none",
                            padding: "6px 12px",
                            borderRadius: 6,
                            fontSize: 12,
                            fontWeight: 600,
                            cursor: "pointer",
                          }}
                        >
                          View 8D
                        </button>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* New NCR Modal */}
      {isModalOpen && (
        <div
          style={{
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
            zIndex: 1000,
            padding: 20,
          }}
        >
          <div
            style={{
              background: "#ffffff",
              borderRadius: 16,
              maxWidth: 640,
              width: "100%",
              maxHeight: "90vh",
              overflowY: "auto",
              padding: 28,
              boxShadow: "0 20px 25px -5px rgba(0,0,0,0.2)",
            }}
          >
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 20 }}>
              <h2 style={{ fontSize: 20, fontWeight: 800, color: "#0f172a", margin: 0 }}>
                Log Non-Conformance Report (NCR)
              </h2>
              <button
                onClick={() => setIsModalOpen(false)}
                style={{ background: "transparent", border: "none", fontSize: 20, cursor: "pointer", color: "#64748b" }}
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleCreateSubmit} style={{ display: "flex", flexDirection: "column", gap: 16 }}>
              <div>
                <label style={{ display: "block", fontSize: 13, fontWeight: 600, color: "#334155", marginBottom: 4 }}>
                  NCR Title / Problem Summary
                </label>
                <input
                  type="text"
                  required
                  value={formData.title}
                  onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                  style={{ width: "100%", padding: 10, borderRadius: 8, border: "1px solid #cbd5e1" }}
                  placeholder="e.g. Excessive Table Edge Chamfer Chipping"
                />
              </div>

              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
                <div>
                  <label style={{ display: "block", fontSize: 13, fontWeight: 600, color: "#334155", marginBottom: 4 }}>
                    Part / Item Name
                  </label>
                  <input
                    type="text"
                    required
                    value={formData.partName}
                    onChange={(e) => setFormData({ ...formData, partName: e.target.value })}
                    style={{ width: "100%", padding: 10, borderRadius: 8, border: "1px solid #cbd5e1" }}
                    placeholder="e.g. Solid Oak Table Top"
                  />
                </div>
                <div>
                  <label style={{ display: "block", fontSize: 13, fontWeight: 600, color: "#334155", marginBottom: 4 }}>
                    Part Code / SKU
                  </label>
                  <input
                    type="text"
                    value={formData.partNumber}
                    onChange={(e) => setFormData({ ...formData, partNumber: e.target.value })}
                    style={{ width: "100%", padding: 10, borderRadius: 8, border: "1px solid #cbd5e1" }}
                    placeholder="e.g. OAK-TBL-60"
                  />
                </div>
              </div>

              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
                <div>
                  <label style={{ display: "block", fontSize: 13, fontWeight: 600, color: "#334155", marginBottom: 4 }}>
                    Severity Level
                  </label>
                  <select
                    value={formData.severity}
                    onChange={(e) => setFormData({ ...formData, severity: e.target.value as any })}
                    style={{ width: "100%", padding: 10, borderRadius: 8, border: "1px solid #cbd5e1" }}
                  >
                    <option value="Critical">Critical (Immediate Line Stop / Safety Risk)</option>
                    <option value="Major">Major (Functionality / Aesthetic Non-Acceptance)</option>
                    <option value="Minor">Minor (Minor Workmanship / Packaging)</option>
                  </select>
                </div>
                <div>
                  <label style={{ display: "block", fontSize: 13, fontWeight: 600, color: "#334155", marginBottom: 4 }}>
                    Detection Stage
                  </label>
                  <select
                    value={formData.stage}
                    onChange={(e) => setFormData({ ...formData, stage: e.target.value as any })}
                    style={{ width: "100%", padding: 10, borderRadius: 8, border: "1px solid #cbd5e1" }}
                  >
                    <option value="Incoming">Incoming (IQC)</option>
                    <option value="In-Process">In-Process (IPQC)</option>
                    <option value="Final Inspection">Final Inspection (FQC)</option>
                    <option value="Customer Return">Customer Return</option>
                  </select>
                </div>
              </div>

              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
                <div>
                  <label style={{ display: "block", fontSize: 13, fontWeight: 600, color: "#334155", marginBottom: 4 }}>
                    Root Cause Category
                  </label>
                  <select
                    value={formData.rootCauseCategory}
                    onChange={(e) => setFormData({ ...formData, rootCauseCategory: e.target.value as any })}
                    style={{ width: "100%", padding: 10, borderRadius: 8, border: "1px solid #cbd5e1" }}
                  >
                    <option value="Material">Material (Vendor defects, moisture)</option>
                    <option value="Machine">Machine (Tool wear, alignment)</option>
                    <option value="Method">Method (SOP deviation, speeds)</option>
                    <option value="Manpower">Manpower (Handling, training)</option>
                    <option value="Environment">Environment (Humidity, dust)</option>
                  </select>
                </div>
                <div>
                  <label style={{ display: "block", fontSize: 13, fontWeight: 600, color: "#334155", marginBottom: 4 }}>
                    Assigned Disposition
                  </label>
                  <select
                    value={formData.disposition}
                    onChange={(e) => setFormData({ ...formData, disposition: e.target.value as any })}
                    style={{ width: "100%", padding: 10, borderRadius: 8, border: "1px solid #cbd5e1" }}
                  >
                    <option value="Rework">Rework (Fix on secondary line)</option>
                    <option value="Scrap">Scrap (Non-recoverable material loss)</option>
                    <option value="Return to Vendor">Return to Vendor (RTV Debit)</option>
                    <option value="Use As-Is (Concession)">Use As-Is (Approved Concession)</option>
                  </select>
                </div>
              </div>

              <div>
                <label style={{ display: "block", fontSize: 13, fontWeight: 600, color: "#334155", marginBottom: 4 }}>
                  Immediate Containment Action
                </label>
                <input
                  type="text"
                  required
                  value={formData.containmentAction}
                  onChange={(e) => setFormData({ ...formData, containmentAction: e.target.value })}
                  style={{ width: "100%", padding: 10, borderRadius: 8, border: "1px solid #cbd5e1" }}
                  placeholder="e.g. Segregated lot into Red Quarantine Bin, stopped machine #2"
                />
              </div>

              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
                <div>
                  <label style={{ display: "block", fontSize: 13, fontWeight: 600, color: "#334155", marginBottom: 4 }}>
                    Assignee / Lead
                  </label>
                  <input
                    type="text"
                    value={formData.assignedTo}
                    onChange={(e) => setFormData({ ...formData, assignedTo: e.target.value })}
                    style={{ width: "100%", padding: 10, borderRadius: 8, border: "1px solid #cbd5e1" }}
                    placeholder="e.g. Production Supervisor"
                  />
                </div>
                <div>
                  <label style={{ display: "block", fontSize: 13, fontWeight: 600, color: "#334155", marginBottom: 4 }}>
                    Target Resolution Date
                  </label>
                  <input
                    type="date"
                    value={formData.targetDate}
                    onChange={(e) => setFormData({ ...formData, targetDate: e.target.value })}
                    style={{ width: "100%", padding: 10, borderRadius: 8, border: "1px solid #cbd5e1" }}
                  />
                </div>
              </div>

              <div style={{ display: "flex", justifyContent: "flex-end", gap: 12, marginTop: 12 }}>
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  style={{
                    padding: "10px 18px",
                    borderRadius: 8,
                    border: "1px solid #cbd5e1",
                    background: "#ffffff",
                    color: "#475569",
                    fontWeight: 600,
                    cursor: "pointer",
                  }}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  style={{
                    padding: "10px 22px",
                    borderRadius: 8,
                    border: "none",
                    background: "#dc2626",
                    color: "#ffffff",
                    fontWeight: 700,
                    cursor: "pointer",
                  }}
                >
                  Issue NCR
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* NCR Details Modal */}
      {selectedNcr && (
        <div
          style={{
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
            zIndex: 1000,
            padding: 20,
          }}
        >
          <div
            style={{
              background: "#ffffff",
              borderRadius: 16,
              maxWidth: 580,
              width: "100%",
              padding: 28,
              boxShadow: "0 20px 25px -5px rgba(0,0,0,0.2)",
            }}
          >
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16 }}>
              <div>
                <span style={{ fontSize: 12, color: "#dc2626", fontWeight: 700 }}>
                  NON-CONFORMANCE REPORT
                </span>
                <h2 style={{ fontSize: 20, fontWeight: 800, color: "#0f172a", margin: "2px 0 0 0" }}>
                  {selectedNcr.ncrNumber}: {selectedNcr.title}
                </h2>
              </div>
              <button
                onClick={() => setSelectedNcr(null)}
                style={{ background: "transparent", border: "none", fontSize: 20, cursor: "pointer", color: "#64748b" }}
              >
                ✕
              </button>
            </div>

            <div style={{ display: "flex", flexDirection: "column", gap: 12, fontSize: 13, color: "#334155" }}>
              <div style={{ display: "flex", justifyContent: "space-between", borderBottom: "1px solid #f1f5f9", paddingBottom: 8 }}>
                <span style={{ color: "#64748b" }}>Part / Item</span>
                <span style={{ fontWeight: 600 }}>{selectedNcr.partName} ({selectedNcr.partNumber})</span>
              </div>
              <div style={{ display: "flex", justifyContent: "space-between", borderBottom: "1px solid #f1f5f9", paddingBottom: 8 }}>
                <span style={{ color: "#64748b" }}>Severity</span>
                <span style={{ fontWeight: 700, color: "#dc2626" }}>{selectedNcr.severity}</span>
              </div>
              <div style={{ display: "flex", justifyContent: "space-between", borderBottom: "1px solid #f1f5f9", paddingBottom: 8 }}>
                <span style={{ color: "#64748b" }}>Detection Stage</span>
                <span style={{ fontWeight: 600 }}>{selectedNcr.stage}</span>
              </div>
              <div style={{ display: "flex", justifyContent: "space-between", borderBottom: "1px solid #f1f5f9", paddingBottom: 8 }}>
                <span style={{ color: "#64748b" }}>Root Cause Category</span>
                <span style={{ fontWeight: 600 }}>{selectedNcr.rootCauseCategory}</span>
              </div>
              <div style={{ display: "flex", justifyContent: "space-between", borderBottom: "1px solid #f1f5f9", paddingBottom: 8 }}>
                <span style={{ color: "#64748b" }}>Disposition Plan</span>
                <span style={{ fontWeight: 700, color: "#4f46e5" }}>{selectedNcr.disposition}</span>
              </div>
              <div>
                <span style={{ color: "#64748b", display: "block", marginBottom: 4 }}>Containment Action</span>
                <div style={{ background: "#fef2f2", padding: 10, borderRadius: 8, border: "1px solid #fecaca", color: "#991b1b" }}>
                  {selectedNcr.containmentAction}
                </div>
              </div>
              <div>
                <span style={{ color: "#64748b", display: "block", marginBottom: 4 }}>Defect Description</span>
                <div style={{ background: "#f8fafc", padding: 10, borderRadius: 8, border: "1px solid #e2e8f0" }}>
                  {selectedNcr.defectDescription || "No further description provided."}
                </div>
              </div>
            </div>

            <div style={{ marginTop: 24, display: "flex", justifyContent: "space-between" }}>
              <button
                onClick={() => {
                  setSelectedNcr(null);
                  navigate("/admin/qms/capa");
                }}
                style={{
                  padding: "8px 16px",
                  borderRadius: 8,
                  border: "none",
                  background: "#4f46e5",
                  color: "#ffffff",
                  fontWeight: 600,
                  fontSize: 13,
                  cursor: "pointer",
                }}
              >
                Escalate to CAPA →
              </button>
              <button
                onClick={() => setSelectedNcr(null)}
                style={{
                  padding: "8px 18px",
                  borderRadius: 8,
                  border: "none",
                  background: "#1e293b",
                  color: "#ffffff",
                  fontWeight: 600,
                  cursor: "pointer",
                }}
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
