import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { qmsApi, QualityAudit } from "../api/qmsApi";

export default function QmsAuditsPage() {
  const navigate = useNavigate();
  const [audits, setAudits] = useState<QualityAudit[]>([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);

  const [formData, setFormData] = useState({
    title: "",
    type: "Internal ISO 9001" as QualityAudit["type"],
    department: "Machining & Assembly",
    auditDate: new Date(Date.now() + 7 * 86400000).toISOString().split("T")[0],
    leadAuditor: "Quality Manager",
    status: "Scheduled" as QualityAudit["status"],
    score: 0,
    minorFindings: 0,
    majorFindings: 0,
    opportunities: 0,
  });

  useEffect(() => {
    loadAudits();
  }, []);

  const loadAudits = async () => {
    setLoading(true);
    try {
      const data = await qmsApi.getAudits();
      setAudits(data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleCreateSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.title) {
      alert("Please enter Audit Title.");
      return;
    }

    await qmsApi.createAudit(formData);
    setIsModalOpen(false);
    setFormData({
      title: "",
      type: "Internal ISO 9001",
      department: "Machining & Assembly",
      auditDate: new Date(Date.now() + 7 * 86400000).toISOString().split("T")[0],
      leadAuditor: "Quality Manager",
      status: "Scheduled",
      score: 0,
      minorFindings: 0,
      majorFindings: 0,
      opportunities: 0,
    });
    loadAudits();
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
            Quality Audits & Compliance
          </h1>
          <p style={{ color: "#64748b", margin: "4px 0 0 0", fontSize: 14 }}>
            ISO 9001:2015 internal audits, layer process audits (LPA), and supplier evaluations
          </p>
        </div>

        <button
          onClick={() => setIsModalOpen(true)}
          style={{
            background: "#059669",
            color: "#ffffff",
            padding: "10px 20px",
            borderRadius: 8,
            border: "none",
            fontWeight: 700,
            cursor: "pointer",
            boxShadow: "0 4px 12px rgba(5, 150, 105, 0.3)",
            display: "flex",
            alignItems: "center",
            gap: 8,
          }}
        >
          <span>📋</span> Schedule New Audit
        </button>
      </div>

      {/* Audit List Grid */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(340px, 1fr))", gap: 20 }}>
        {loading ? (
          <div style={{ padding: 40, color: "#64748b" }}>Loading audit schedule...</div>
        ) : audits.length === 0 ? (
          <div style={{ padding: 40, color: "#94a3b8" }}>No audits registered.</div>
        ) : (
          audits.map((a) => (
            <div
              key={a.id}
              style={{
                background: "#ffffff",
                borderRadius: 14,
                border: "1px solid #e2e8f0",
                padding: 24,
                boxShadow: "0 1px 3px rgba(0,0,0,0.04)",
                display: "flex",
                flexDirection: "column",
                justifyContent: "space-between",
              }}
            >
              <div>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 10 }}>
                  <span style={{ fontSize: 12, fontWeight: 800, color: "#059669", background: "#d1fae5", padding: "2px 8px", borderRadius: 6 }}>
                    {a.auditNumber}
                  </span>
                  <span
                    style={{
                      background: a.status === "Completed" ? "#dcfce7" : a.status === "In Progress" ? "#fef3c7" : "#e0e7ff",
                      color: a.status === "Completed" ? "#166534" : a.status === "In Progress" ? "#92400e" : "#3730a3",
                      fontSize: 12,
                      fontWeight: 700,
                      padding: "2px 10px",
                      borderRadius: 12,
                    }}
                  >
                    {a.status}
                  </span>
                </div>

                <h3 style={{ fontSize: 16, fontWeight: 700, color: "#0f172a", margin: "0 0 6px 0" }}>
                  {a.title}
                </h3>
                <p style={{ fontSize: 13, color: "#475569", margin: "0 0 16px 0" }}>
                  Department: <b>{a.department}</b>
                </p>

                <div style={{ background: "#f8fafc", padding: "12px 14px", borderRadius: 8, fontSize: 12, display: "flex", flexDirection: "column", gap: 6 }}>
                  <div style={{ display: "flex", justifyContent: "space-between" }}>
                    <span style={{ color: "#64748b" }}>Audit Date:</span>
                    <span style={{ fontWeight: 600, color: "#1e293b" }}>{a.auditDate}</span>
                  </div>
                  <div style={{ display: "flex", justifyContent: "space-between" }}>
                    <span style={{ color: "#64748b" }}>Lead Auditor:</span>
                    <span style={{ fontWeight: 600, color: "#1e293b" }}>{a.leadAuditor}</span>
                  </div>
                  <div style={{ display: "flex", justifyContent: "space-between" }}>
                    <span style={{ color: "#64748b" }}>Audit Scope:</span>
                    <span style={{ fontWeight: 600, color: "#1e293b" }}>{a.type}</span>
                  </div>
                </div>
              </div>

              <div style={{ marginTop: 20, paddingTop: 16, borderTop: "1px solid #f1f5f9" }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                  <div>
                    <div style={{ fontSize: 11, color: "#64748b", textTransform: "uppercase", fontWeight: 600 }}>
                      Compliance Score
                    </div>
                    <div style={{ fontSize: 20, fontWeight: 800, color: a.score >= 90 ? "#16a34a" : a.score > 0 ? "#eab308" : "#64748b" }}>
                      {a.score > 0 ? `${a.score}%` : "Pending"}
                    </div>
                  </div>
                  <div style={{ display: "flex", gap: 8, fontSize: 11, textAlign: "right" }}>
                    <div>
                      <span style={{ color: "#dc2626", fontWeight: 700 }}>{a.majorFindings}</span>
                      <div style={{ color: "#94a3b8" }}>Maj NC</div>
                    </div>
                    <div>
                      <span style={{ color: "#d97706", fontWeight: 700 }}>{a.minorFindings}</span>
                      <div style={{ color: "#94a3b8" }}>Min NC</div>
                    </div>
                    <div>
                      <span style={{ color: "#0284c7", fontWeight: 700 }}>{a.opportunities}</span>
                      <div style={{ color: "#94a3b8" }}>OFI</div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          ))
        )}
      </div>

      {/* Schedule Audit Modal */}
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
              maxWidth: 540,
              width: "100%",
              padding: 28,
              boxShadow: "0 20px 25px -5px rgba(0,0,0,0.2)",
            }}
          >
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 20 }}>
              <h2 style={{ fontSize: 20, fontWeight: 800, color: "#0f172a", margin: 0 }}>
                Schedule Quality Audit
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
                  Audit Title / Scope
                </label>
                <input
                  type="text"
                  required
                  value={formData.title}
                  onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                  style={{ width: "100%", padding: 10, borderRadius: 8, border: "1px solid #cbd5e1" }}
                  placeholder="e.g. Q4 Internal Assembly & Joinery Compliance"
                />
              </div>

              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
                <div>
                  <label style={{ display: "block", fontSize: 13, fontWeight: 600, color: "#334155", marginBottom: 4 }}>
                    Audit Type
                  </label>
                  <select
                    value={formData.type}
                    onChange={(e) => setFormData({ ...formData, type: e.target.value as any })}
                    style={{ width: "100%", padding: 10, borderRadius: 8, border: "1px solid #cbd5e1" }}
                  >
                    <option value="Internal ISO 9001">Internal ISO 9001</option>
                    <option value="Process Audit">Process & Workmanship</option>
                    <option value="Supplier Quality">Supplier Quality Audit</option>
                    <option value="Safety & Environmental">Safety & Environmental</option>
                  </select>
                </div>
                <div>
                  <label style={{ display: "block", fontSize: 13, fontWeight: 600, color: "#334155", marginBottom: 4 }}>
                    Department
                  </label>
                  <input
                    type="text"
                    required
                    value={formData.department}
                    onChange={(e) => setFormData({ ...formData, department: e.target.value })}
                    style={{ width: "100%", padding: 10, borderRadius: 8, border: "1px solid #cbd5e1" }}
                    placeholder="e.g. Finishing & Coating"
                  />
                </div>
              </div>

              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
                <div>
                  <label style={{ display: "block", fontSize: 13, fontWeight: 600, color: "#334155", marginBottom: 4 }}>
                    Audit Date
                  </label>
                  <input
                    type="date"
                    required
                    value={formData.auditDate}
                    onChange={(e) => setFormData({ ...formData, auditDate: e.target.value })}
                    style={{ width: "100%", padding: 10, borderRadius: 8, border: "1px solid #cbd5e1" }}
                  />
                </div>
                <div>
                  <label style={{ display: "block", fontSize: 13, fontWeight: 600, color: "#334155", marginBottom: 4 }}>
                    Lead Auditor
                  </label>
                  <input
                    type="text"
                    required
                    value={formData.leadAuditor}
                    onChange={(e) => setFormData({ ...formData, leadAuditor: e.target.value })}
                    style={{ width: "100%", padding: 10, borderRadius: 8, border: "1px solid #cbd5e1" }}
                    placeholder="e.g. Lead Quality Auditor"
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
                    background: "#059669",
                    color: "#ffffff",
                    fontWeight: 700,
                    cursor: "pointer",
                  }}
                >
                  Save Schedule
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
