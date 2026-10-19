import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { qmsApi, QualityInspection } from "../api/qmsApi";

export default function QmsInspectionsPage() {
  const navigate = useNavigate();
  const [inspections, setInspections] = useState<QualityInspection[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<"ALL" | "IQC" | "IPQC" | "FQC">("ALL");
  const [statusFilter, setStatusFilter] = useState<string>("ALL");
  const [searchQuery, setSearchQuery] = useState("");
  
  // Modal state
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedInspection, setSelectedInspection] = useState<QualityInspection | null>(null);

  // New inspection form state
  const [formData, setFormData] = useState({
    date: new Date().toISOString().split("T")[0],
    type: "IPQC" as "IQC" | "IPQC" | "FQC",
    stageName: "CNC Routing",
    itemCode: "",
    itemName: "",
    lotNumber: "",
    sampleSize: 50,
    defectsCount: 0,
    status: "Passed" as "Passed" | "Conditional" | "Rejected",
    inspector: "Quality Inspector",
    defectsBreakdown: "",
    remarks: "",
  });

  useEffect(() => {
    loadInspections();
  }, []);

  const loadInspections = async () => {
    setLoading(true);
    try {
      const data = await qmsApi.getInspections();
      setInspections(data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const filtered = inspections.filter((i) => {
    if (activeTab !== "ALL" && i.type !== activeTab) return false;
    if (statusFilter !== "ALL" && i.status !== statusFilter) return false;
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      const match =
        i.inspectionNumber.toLowerCase().includes(q) ||
        i.itemName.toLowerCase().includes(q) ||
        i.itemCode.toLowerCase().includes(q) ||
        i.lotNumber.toLowerCase().includes(q) ||
        i.inspector.toLowerCase().includes(q);
      if (!match) return false;
    }
    return true;
  });

  const handleCreateSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.itemName || !formData.lotNumber) {
      alert("Please enter Item Name and Lot Number.");
      return;
    }

    const defectRate =
      formData.sampleSize > 0
        ? parseFloat(((formData.defectsCount / formData.sampleSize) * 100).toFixed(2))
        : 0;

    await qmsApi.createInspection({
      ...formData,
      defectRate,
    });

    setIsModalOpen(false);
    setFormData({
      date: new Date().toISOString().split("T")[0],
      type: "IPQC",
      stageName: "CNC Routing",
      itemCode: "",
      itemName: "",
      lotNumber: "",
      sampleSize: 50,
      defectsCount: 0,
      status: "Passed",
      inspector: "Quality Inspector",
      defectsBreakdown: "",
      remarks: "",
    });
    loadInspections();
  };

  const handleDelete = async (id: string) => {
    if (window.confirm("Are you sure you want to delete this inspection record?")) {
      await qmsApi.deleteInspection(id);
      loadInspections();
    }
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
            Quality Inspection Management
          </h1>
          <p style={{ color: "#64748b", margin: "4px 0 0 0", fontSize: 14 }}>
            Incoming Quality Control (IQC), In-Process Quality Checks (IPQC), and Final Pack-out (FQC)
          </p>
        </div>

        <button
          onClick={() => setIsModalOpen(true)}
          style={{
            background: "#4f46e5",
            color: "#ffffff",
            padding: "10px 20px",
            borderRadius: 8,
            border: "none",
            fontWeight: 700,
            cursor: "pointer",
            boxShadow: "0 4px 12px rgba(79, 70, 229, 0.3)",
            display: "flex",
            alignItems: "center",
            gap: 8,
          }}
        >
          <span>+</span> Record New Inspection
        </button>
      </div>

      {/* Tabs & Filters */}
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
        {/* Type Tabs */}
        <div style={{ display: "flex", gap: 8 }}>
          {[
            { id: "ALL", label: "All Inspections" },
            { id: "IQC", label: "Incoming (IQC)" },
            { id: "IPQC", label: "In-Process (IPQC)" },
            { id: "FQC", label: "Final Pre-Dispatch (FQC)" },
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as any)}
              style={{
                padding: "8px 16px",
                borderRadius: 8,
                border: "none",
                fontWeight: 600,
                fontSize: 13,
                cursor: "pointer",
                background: activeTab === tab.id ? "#4f46e5" : "#f1f5f9",
                color: activeTab === tab.id ? "#ffffff" : "#475569",
                transition: "all 0.15s",
              }}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* Filter controls */}
        <div style={{ display: "flex", gap: 12, alignItems: "center" }}>
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            style={{
              padding: "8px 14px",
              borderRadius: 8,
              border: "1px solid #cbd5e1",
              fontSize: 13,
              background: "#ffffff",
              color: "#334155",
            }}
          >
            <option value="ALL">All Statuses</option>
            <option value="Passed">Passed</option>
            <option value="Conditional">Conditional</option>
            <option value="Rejected">Rejected</option>
          </select>

          <input
            type="text"
            placeholder="Search lot, part, inspector..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            style={{
              padding: "8px 14px",
              borderRadius: 8,
              border: "1px solid #cbd5e1",
              fontSize: 13,
              width: 240,
            }}
          />
        </div>
      </div>

      {/* Main Table */}
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
                <th style={{ padding: "12px 16px", color: "#475569", fontWeight: 600 }}>Inspection #</th>
                <th style={{ padding: "12px 16px", color: "#475569", fontWeight: 600 }}>Date</th>
                <th style={{ padding: "12px 16px", color: "#475569", fontWeight: 600 }}>Stage / Type</th>
                <th style={{ padding: "12px 16px", color: "#475569", fontWeight: 600 }}>Item & Lot</th>
                <th style={{ padding: "12px 16px", color: "#475569", fontWeight: 600 }}>Sample Size</th>
                <th style={{ padding: "12px 16px", color: "#475569", fontWeight: 600 }}>Defects / Rate</th>
                <th style={{ padding: "12px 16px", color: "#475569", fontWeight: 600 }}>Outcome</th>
                <th style={{ padding: "12px 16px", color: "#475569", fontWeight: 600 }}>Inspector</th>
                <th style={{ padding: "12px 16px", color: "#475569", fontWeight: 600, textAlign: "right" }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan={9} style={{ padding: 40, textAlign: "center", color: "#64748b" }}>
                    Loading inspection data...
                  </td>
                </tr>
              ) : filtered.length === 0 ? (
                <tr>
                  <td colSpan={9} style={{ padding: 40, textAlign: "center", color: "#94a3b8" }}>
                    No inspection records found matching your filters.
                  </td>
                </tr>
              ) : (
                filtered.map((item) => {
                  const badgeStyle =
                    item.status === "Passed"
                      ? { bg: "#dcfce7", text: "#15803d" }
                      : item.status === "Rejected"
                      ? { bg: "#fee2e2", text: "#b91c1c" }
                      : { bg: "#fef3c7", text: "#b45309" };

                  return (
                    <tr
                      key={item.id}
                      style={{ borderBottom: "1px solid #f1f5f9", transition: "background 0.15s" }}
                      onMouseEnter={(e) => (e.currentTarget.style.background = "#f8fafc")}
                      onMouseLeave={(e) => (e.currentTarget.style.background = "transparent")}
                    >
                      <td style={{ padding: "14px 16px", fontWeight: 700, color: "#1e293b" }}>
                        {item.inspectionNumber}
                      </td>
                      <td style={{ padding: "14px 16px", color: "#64748b" }}>{item.date}</td>
                      <td style={{ padding: "14px 16px" }}>
                        <span
                          style={{
                            background:
                              item.type === "IQC" ? "#e0f2fe" : item.type === "IPQC" ? "#f3e8ff" : "#ecfdf5",
                            color:
                              item.type === "IQC" ? "#0369a1" : item.type === "IPQC" ? "#7e22ce" : "#047857",
                            padding: "3px 8px",
                            borderRadius: 6,
                            fontSize: 11,
                            fontWeight: 700,
                            marginRight: 6,
                          }}
                        >
                          {item.type}
                        </span>
                        <span style={{ color: "#334155", fontSize: 12 }}>{item.stageName}</span>
                      </td>
                      <td style={{ padding: "14px 16px" }}>
                        <div style={{ fontWeight: 600, color: "#0f172a" }}>{item.itemName}</div>
                        <div style={{ fontSize: 12, color: "#64748b" }}>
                          Code: {item.itemCode || "N/A"} • Lot: <b>{item.lotNumber}</b>
                        </div>
                      </td>
                      <td style={{ padding: "14px 16px", fontWeight: 600, color: "#334155" }}>
                        {item.sampleSize} units
                      </td>
                      <td style={{ padding: "14px 16px" }}>
                        <span style={{ color: item.defectsCount > 0 ? "#dc2626" : "#16a34a", fontWeight: 700 }}>
                          {item.defectsCount} defects
                        </span>
                        <div style={{ fontSize: 11, color: "#94a3b8" }}>{item.defectRate}% rate</div>
                      </td>
                      <td style={{ padding: "14px 16px" }}>
                        <span
                          style={{
                            background: badgeStyle.bg,
                            color: badgeStyle.text,
                            padding: "4px 10px",
                            borderRadius: 12,
                            fontWeight: 700,
                            fontSize: 12,
                          }}
                        >
                          {item.status}
                        </span>
                      </td>
                      <td style={{ padding: "14px 16px", color: "#475569" }}>{item.inspector}</td>
                      <td style={{ padding: "14px 16px", textAlign: "right" }}>
                        <div style={{ display: "flex", gap: 8, justifyContent: "flex-end" }}>
                          <button
                            onClick={() => setSelectedInspection(item)}
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
                            Details
                          </button>
                          <button
                            onClick={() => handleDelete(item.id)}
                            style={{
                              background: "transparent",
                              color: "#ef4444",
                              border: "none",
                              padding: "6px 8px",
                              borderRadius: 6,
                              fontSize: 12,
                              cursor: "pointer",
                            }}
                            title="Delete record"
                          >
                            ✕
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* New Inspection Modal */}
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
              maxWidth: 600,
              width: "100%",
              maxHeight: "90vh",
              overflowY: "auto",
              padding: 28,
              boxShadow: "0 20px 25px -5px rgba(0,0,0,0.2)",
            }}
          >
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 20 }}>
              <h2 style={{ fontSize: 20, fontWeight: 800, color: "#0f172a", margin: 0 }}>
                Record Quality Inspection
              </h2>
              <button
                onClick={() => setIsModalOpen(false)}
                style={{ background: "transparent", border: "none", fontSize: 20, cursor: "pointer", color: "#64748b" }}
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleCreateSubmit} style={{ display: "flex", flexDirection: "column", gap: 16 }}>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
                <div>
                  <label style={{ display: "block", fontSize: 13, fontWeight: 600, color: "#334155", marginBottom: 4 }}>
                    Inspection Type
                  </label>
                  <select
                    value={formData.type}
                    onChange={(e) => setFormData({ ...formData, type: e.target.value as any })}
                    style={{ width: "100%", padding: 10, borderRadius: 8, border: "1px solid #cbd5e1" }}
                  >
                    <option value="IQC">Incoming (IQC)</option>
                    <option value="IPQC">In-Process (IPQC)</option>
                    <option value="FQC">Final Pre-Dispatch (FQC)</option>
                  </select>
                </div>
                <div>
                  <label style={{ display: "block", fontSize: 13, fontWeight: 600, color: "#334155", marginBottom: 4 }}>
                    Process Stage
                  </label>
                  <input
                    type="text"
                    required
                    value={formData.stageName}
                    onChange={(e) => setFormData({ ...formData, stageName: e.target.value })}
                    style={{ width: "100%", padding: 10, borderRadius: 8, border: "1px solid #cbd5e1" }}
                    placeholder="e.g. CNC Routing, Paint Booth"
                  />
                </div>
              </div>

              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
                <div>
                  <label style={{ display: "block", fontSize: 13, fontWeight: 600, color: "#334155", marginBottom: 4 }}>
                    Item / Part Name
                  </label>
                  <input
                    type="text"
                    required
                    value={formData.itemName}
                    onChange={(e) => setFormData({ ...formData, itemName: e.target.value })}
                    style={{ width: "100%", padding: 10, borderRadius: 8, border: "1px solid #cbd5e1" }}
                    placeholder="e.g. Oak Dining Chair Leg"
                  />
                </div>
                <div>
                  <label style={{ display: "block", fontSize: 13, fontWeight: 600, color: "#334155", marginBottom: 4 }}>
                    Item Code
                  </label>
                  <input
                    type="text"
                    value={formData.itemCode}
                    onChange={(e) => setFormData({ ...formData, itemCode: e.target.value })}
                    style={{ width: "100%", padding: 10, borderRadius: 8, border: "1px solid #cbd5e1" }}
                    placeholder="e.g. OAK-LEG-01"
                  />
                </div>
              </div>

              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 12 }}>
                <div>
                  <label style={{ display: "block", fontSize: 13, fontWeight: 600, color: "#334155", marginBottom: 4 }}>
                    Lot / Batch #
                  </label>
                  <input
                    type="text"
                    required
                    value={formData.lotNumber}
                    onChange={(e) => setFormData({ ...formData, lotNumber: e.target.value })}
                    style={{ width: "100%", padding: 10, borderRadius: 8, border: "1px solid #cbd5e1" }}
                    placeholder="LOT-2026-X"
                  />
                </div>
                <div>
                  <label style={{ display: "block", fontSize: 13, fontWeight: 600, color: "#334155", marginBottom: 4 }}>
                    Sample Size
                  </label>
                  <input
                    type="number"
                    min={1}
                    required
                    value={formData.sampleSize}
                    onChange={(e) => setFormData({ ...formData, sampleSize: parseInt(e.target.value) || 0 })}
                    style={{ width: "100%", padding: 10, borderRadius: 8, border: "1px solid #cbd5e1" }}
                  />
                </div>
                <div>
                  <label style={{ display: "block", fontSize: 13, fontWeight: 600, color: "#334155", marginBottom: 4 }}>
                    Defects Found
                  </label>
                  <input
                    type="number"
                    min={0}
                    required
                    value={formData.defectsCount}
                    onChange={(e) => setFormData({ ...formData, defectsCount: parseInt(e.target.value) || 0 })}
                    style={{ width: "100%", padding: 10, borderRadius: 8, border: "1px solid #cbd5e1" }}
                  />
                </div>
              </div>

              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
                <div>
                  <label style={{ display: "block", fontSize: 13, fontWeight: 600, color: "#334155", marginBottom: 4 }}>
                    Evaluation Outcome
                  </label>
                  <select
                    value={formData.status}
                    onChange={(e) => setFormData({ ...formData, status: e.target.value as any })}
                    style={{ width: "100%", padding: 10, borderRadius: 8, border: "1px solid #cbd5e1" }}
                  >
                    <option value="Passed">Passed (Meets Standard)</option>
                    <option value="Conditional">Conditional Acceptance</option>
                    <option value="Rejected">Rejected (Non-Conformance)</option>
                  </select>
                </div>
                <div>
                  <label style={{ display: "block", fontSize: 13, fontWeight: 600, color: "#334155", marginBottom: 4 }}>
                    Inspector Name
                  </label>
                  <input
                    type="text"
                    required
                    value={formData.inspector}
                    onChange={(e) => setFormData({ ...formData, inspector: e.target.value })}
                    style={{ width: "100%", padding: 10, borderRadius: 8, border: "1px solid #cbd5e1" }}
                  />
                </div>
              </div>

              <div>
                <label style={{ display: "block", fontSize: 13, fontWeight: 600, color: "#334155", marginBottom: 4 }}>
                  Defect Description / Breakdown
                </label>
                <input
                  type="text"
                  value={formData.defectsBreakdown}
                  onChange={(e) => setFormData({ ...formData, defectsBreakdown: e.target.value })}
                  style={{ width: "100%", padding: 10, borderRadius: 8, border: "1px solid #cbd5e1" }}
                  placeholder="e.g. 2 scratches, 1 dimension deviation (+0.5mm)"
                />
              </div>

              <div>
                <label style={{ display: "block", fontSize: 13, fontWeight: 600, color: "#334155", marginBottom: 4 }}>
                  Inspector Remarks & Notes
                </label>
                <textarea
                  rows={3}
                  value={formData.remarks}
                  onChange={(e) => setFormData({ ...formData, remarks: e.target.value })}
                  style={{ width: "100%", padding: 10, borderRadius: 8, border: "1px solid #cbd5e1", resize: "vertical" }}
                  placeholder="Additional context, moisture reading, gauge check details..."
                />
              </div>

              <div style={{ display: "flex", justifyContent: "flex-end", gap: 12, marginTop: 8 }}>
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
                    background: "#4f46e5",
                    color: "#ffffff",
                    fontWeight: 700,
                    cursor: "pointer",
                  }}
                >
                  Save Inspection Record
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Details View Modal */}
      {selectedInspection && (
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
              maxWidth: 520,
              width: "100%",
              padding: 28,
              boxShadow: "0 20px 25px -5px rgba(0,0,0,0.2)",
            }}
          >
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16 }}>
              <div>
                <span style={{ fontSize: 12, color: "#6366f1", fontWeight: 700 }}>
                  {selectedInspection.type} INSPECTION
                </span>
                <h2 style={{ fontSize: 20, fontWeight: 800, color: "#0f172a", margin: "2px 0 0 0" }}>
                  {selectedInspection.inspectionNumber}
                </h2>
              </div>
              <button
                onClick={() => setSelectedInspection(null)}
                style={{ background: "transparent", border: "none", fontSize: 20, cursor: "pointer", color: "#64748b" }}
              >
                ✕
              </button>
            </div>

            <div style={{ display: "flex", flexDirection: "column", gap: 12, fontSize: 13, color: "#334155" }}>
              <div style={{ display: "flex", justifyContent: "space-between", borderBottom: "1px solid #f1f5f9", paddingBottom: 8 }}>
                <span style={{ color: "#64748b" }}>Item Name</span>
                <span style={{ fontWeight: 600 }}>{selectedInspection.itemName}</span>
              </div>
              <div style={{ display: "flex", justifyContent: "space-between", borderBottom: "1px solid #f1f5f9", paddingBottom: 8 }}>
                <span style={{ color: "#64748b" }}>Lot / Batch</span>
                <span style={{ fontWeight: 600 }}>{selectedInspection.lotNumber}</span>
              </div>
              <div style={{ display: "flex", justifyContent: "space-between", borderBottom: "1px solid #f1f5f9", paddingBottom: 8 }}>
                <span style={{ color: "#64748b" }}>Process Stage</span>
                <span style={{ fontWeight: 600 }}>{selectedInspection.stageName}</span>
              </div>
              <div style={{ display: "flex", justifyContent: "space-between", borderBottom: "1px solid #f1f5f9", paddingBottom: 8 }}>
                <span style={{ color: "#64748b" }}>Sampled vs Defects</span>
                <span style={{ fontWeight: 600 }}>
                  {selectedInspection.sampleSize} units / {selectedInspection.defectsCount} defects ({selectedInspection.defectRate}%)
                </span>
              </div>
              <div style={{ display: "flex", justifyContent: "space-between", borderBottom: "1px solid #f1f5f9", paddingBottom: 8 }}>
                <span style={{ color: "#64748b" }}>Outcome</span>
                <span style={{ fontWeight: 700, color: selectedInspection.status === "Passed" ? "#16a34a" : "#dc2626" }}>
                  {selectedInspection.status}
                </span>
              </div>
              <div style={{ display: "flex", justifyContent: "space-between", borderBottom: "1px solid #f1f5f9", paddingBottom: 8 }}>
                <span style={{ color: "#64748b" }}>Inspector</span>
                <span style={{ fontWeight: 600 }}>{selectedInspection.inspector}</span>
              </div>
              <div>
                <span style={{ color: "#64748b", display: "block", marginBottom: 4 }}>Defects Breakdown</span>
                <div style={{ background: "#f8fafc", padding: 10, borderRadius: 8, border: "1px solid #e2e8f0" }}>
                  {selectedInspection.defectsBreakdown || "No specific defects noted."}
                </div>
              </div>
              <div>
                <span style={{ color: "#64748b", display: "block", marginBottom: 4 }}>Remarks</span>
                <div style={{ background: "#f8fafc", padding: 10, borderRadius: 8, border: "1px solid #e2e8f0" }}>
                  {selectedInspection.remarks || "No remarks provided."}
                </div>
              </div>
            </div>

            <div style={{ marginTop: 24, textAlign: "right" }}>
              <button
                onClick={() => setSelectedInspection(null)}
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
