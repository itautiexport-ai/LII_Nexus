import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { qmsApi, CapaItem } from "../api/qmsApi";

export default function QmsCapaPage() {
  const navigate = useNavigate();
  const [capas, setCapas] = useState<CapaItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedCapa, setSelectedCapa] = useState<CapaItem | null>(null);

  const [formData, setFormData] = useState({
    title: "",
    ncrReference: "",
    problemStatement: "",
    rootCause: "",
    correctiveAction: "",
    preventiveAction: "",
    verificationMethod: "",
    owner: "",
    dueDate: new Date(Date.now() + 14 * 86400000).toISOString().split("T")[0],
    status: "Investigation" as "Draft" | "Investigation" | "Action Implemented" | "Verification" | "Closed",
    progress: 30,
  });

  useEffect(() => {
    loadCapas();
  }, []);

  const loadCapas = async () => {
    setLoading(true);
    try {
      const data = await qmsApi.getCapas();
      setCapas(data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const filtered = capas.filter((c) => {
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      return (
        c.capaNumber.toLowerCase().includes(q) ||
        c.title.toLowerCase().includes(q) ||
        c.owner.toLowerCase().includes(q) ||
        c.ncrReference.toLowerCase().includes(q)
      );
    }
    return true;
  });

  const handleCreateSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.title || !formData.problemStatement) {
      alert("Please provide Title and Problem Statement.");
      return;
    }

    await qmsApi.createCapa(formData);
    setIsModalOpen(false);
    setFormData({
      title: "",
      ncrReference: "",
      problemStatement: "",
      rootCause: "",
      correctiveAction: "",
      preventiveAction: "",
      verificationMethod: "",
      owner: "",
      dueDate: new Date(Date.now() + 14 * 86400000).toISOString().split("T")[0],
      status: "Investigation",
      progress: 30,
    });
    loadCapas();
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
            Corrective & Preventive Actions (CAPA)
          </h1>
          <p style={{ color: "#64748b", margin: "4px 0 0 0", fontSize: 14 }}>
            Structured 8D problem-solving framework to permanently eradicate repeat quality deviations
          </p>
        </div>

        <button
          onClick={() => setIsModalOpen(true)}
          style={{
            background: "#4338ca",
            color: "#ffffff",
            padding: "10px 20px",
            borderRadius: 8,
            border: "none",
            fontWeight: 700,
            cursor: "pointer",
            boxShadow: "0 4px 12px rgba(67, 56, 202, 0.3)",
            display: "flex",
            alignItems: "center",
            gap: 8,
          }}
        >
          <span>🛡️</span> Initiate New CAPA
        </button>
      </div>

      {/* 8D Methodology Header Banner */}
      <div
        style={{
          background: "#f8fafc",
          border: "1px solid #e2e8f0",
          borderRadius: 12,
          padding: "16px 20px",
          marginBottom: 24,
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          flexWrap: "wrap",
          gap: 12,
        }}
      >
        <span style={{ fontSize: 13, fontWeight: 700, color: "#334155" }}>
          ISO 9001 8D Discipline Flow:
        </span>
        <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
          {["D1 Team", "D2 Problem", "D3 Containment", "D4 Root Cause", "D5 Corrective", "D6 Validate", "D7 Preventive", "D8 Congratulate"].map(
            (step, idx) => (
              <span
                key={step}
                style={{
                  background: idx <= 4 ? "#e0e7ff" : "#f1f5f9",
                  color: idx <= 4 ? "#3730a3" : "#64748b",
                  padding: "4px 10px",
                  borderRadius: 6,
                  fontSize: 11,
                  fontWeight: 700,
                }}
              >
                {step}
              </span>
            )
          )}
        </div>
      </div>

      {/* CAPA Cards / List */}
      <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
        {loading ? (
          <div style={{ padding: 40, textAlign: "center", color: "#64748b" }}>Loading CAPA projects...</div>
        ) : filtered.length === 0 ? (
          <div style={{ padding: 40, textAlign: "center", color: "#94a3b8" }}>No active CAPA records found.</div>
        ) : (
          filtered.map((item) => (
            <div
              key={item.id}
              style={{
                background: "#ffffff",
                border: "1px solid #e2e8f0",
                borderRadius: 14,
                padding: 24,
                boxShadow: "0 1px 3px rgba(0,0,0,0.04)",
                transition: "border-color 0.15s",
              }}
            >
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 12 }}>
                <div>
                  <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                    <span style={{ fontSize: 13, fontWeight: 800, color: "#4338ca", background: "#e0e7ff", padding: "2px 8px", borderRadius: 6 }}>
                      {item.capaNumber}
                    </span>
                    {item.ncrReference && (
                      <span style={{ fontSize: 12, color: "#dc2626", background: "#fee2e2", padding: "2px 8px", borderRadius: 6, fontWeight: 600 }}>
                        Ref: {item.ncrReference}
                      </span>
                    )}
                    <span style={{ fontSize: 12, color: "#64748b" }}>Due: {item.dueDate}</span>
                  </div>
                  <h3 style={{ fontSize: 17, fontWeight: 700, color: "#0f172a", margin: "8px 0 4px 0" }}>
                    {item.title}
                  </h3>
                  <p style={{ fontSize: 13, color: "#475569", margin: 0, lineHeight: 1.5 }}>
                    {item.problemStatement}
                  </p>
                </div>

                <div style={{ textAlign: "right" }}>
                  <span
                    style={{
                      background: item.status === "Closed" ? "#dcfce7" : item.status === "Action Implemented" ? "#e0e7ff" : "#fef3c7",
                      color: item.status === "Closed" ? "#166534" : item.status === "Action Implemented" ? "#3730a3" : "#92400e",
                      padding: "4px 12px",
                      borderRadius: 14,
                      fontSize: 12,
                      fontWeight: 700,
                    }}
                  >
                    {item.status}
                  </span>
                  <div style={{ fontSize: 12, color: "#64748b", marginTop: 6 }}>
                    Owner: <b>{item.owner}</b>
                  </div>
                </div>
              </div>

              {/* Progress Bar */}
              <div style={{ marginTop: 16 }}>
                <div style={{ display: "flex", justifyContent: "space-between", fontSize: 12, marginBottom: 4 }}>
                  <span style={{ color: "#64748b", fontWeight: 600 }}>Implementation Progress</span>
                  <span style={{ color: "#0f172a", fontWeight: 700 }}>{item.progress}%</span>
                </div>
                <div style={{ height: 8, background: "#f1f5f9", borderRadius: 4, overflow: "hidden" }}>
                  <div
                    style={{
                      width: `${item.progress}%`,
                      height: "100%",
                      background: item.progress === 100 ? "#22c55e" : "#4f46e5",
                      borderRadius: 4,
                    }}
                  />
                </div>
              </div>

              {/* Quick Details Grid */}
              <div
                style={{
                  display: "grid",
                  gridTemplateColumns: "1fr 1fr",
                  gap: 16,
                  marginTop: 18,
                  paddingTop: 16,
                  borderTop: "1px solid #f1f5f9",
                  fontSize: 13,
                }}
              >
                <div>
                  <span style={{ color: "#64748b", fontWeight: 600, display: "block", marginBottom: 2 }}>
                    Identified Root Cause (5-Why):
                  </span>
                  <span style={{ color: "#1e293b" }}>{item.rootCause || "Under root cause analysis"}</span>
                </div>
                <div>
                  <span style={{ color: "#64748b", fontWeight: 600, display: "block", marginBottom: 2 }}>
                    Permanent Preventive Action:
                  </span>
                  <span style={{ color: "#1e293b" }}>{item.preventiveAction || "Action being drafted"}</span>
                </div>
              </div>

              <div style={{ marginTop: 14, textAlign: "right" }}>
                <button
                  onClick={() => setSelectedCapa(item)}
                  style={{
                    background: "#f8fafc",
                    border: "1px solid #cbd5e1",
                    padding: "6px 14px",
                    borderRadius: 6,
                    fontSize: 12,
                    fontWeight: 600,
                    color: "#334155",
                    cursor: "pointer",
                  }}
                >
                  View Full 8D Dossier →
                </button>
              </div>
            </div>
          ))
        )}
      </div>

      {/* New CAPA Modal */}
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
                Initiate 8D CAPA Action
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
                  CAPA Initiative Title
                </label>
                <input
                  type="text"
                  required
                  value={formData.title}
                  onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                  style={{ width: "100%", padding: 10, borderRadius: 8, border: "1px solid #cbd5e1" }}
                  placeholder="e.g. Moisture Entrapment Prevention in Finishing Booths"
                />
              </div>

              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
                <div>
                  <label style={{ display: "block", fontSize: 13, fontWeight: 600, color: "#334155", marginBottom: 4 }}>
                    NCR Reference #
                  </label>
                  <input
                    type="text"
                    value={formData.ncrReference}
                    onChange={(e) => setFormData({ ...formData, ncrReference: e.target.value })}
                    style={{ width: "100%", padding: 10, borderRadius: 8, border: "1px solid #cbd5e1" }}
                    placeholder="e.g. NCR-2026-044"
                  />
                </div>
                <div>
                  <label style={{ display: "block", fontSize: 13, fontWeight: 600, color: "#334155", marginBottom: 4 }}>
                    Process Owner
                  </label>
                  <input
                    type="text"
                    required
                    value={formData.owner}
                    onChange={(e) => setFormData({ ...formData, owner: e.target.value })}
                    style={{ width: "100%", padding: 10, borderRadius: 8, border: "1px solid #cbd5e1" }}
                    placeholder="e.g. Quality Manager"
                  />
                </div>
              </div>

              <div>
                <label style={{ display: "block", fontSize: 13, fontWeight: 600, color: "#334155", marginBottom: 4 }}>
                  Problem Description (5W2H)
                </label>
                <textarea
                  rows={2}
                  required
                  value={formData.problemStatement}
                  onChange={(e) => setFormData({ ...formData, problemStatement: e.target.value })}
                  style={{ width: "100%", padding: 10, borderRadius: 8, border: "1px solid #cbd5e1" }}
                  placeholder="What occurred, where was it detected, what is the extent of impact..."
                />
              </div>

              <div>
                <label style={{ display: "block", fontSize: 13, fontWeight: 600, color: "#334155", marginBottom: 4 }}>
                  Root Cause Analysis (Fishbone / 5-Why)
                </label>
                <textarea
                  rows={2}
                  value={formData.rootCause}
                  onChange={(e) => setFormData({ ...formData, rootCause: e.target.value })}
                  style={{ width: "100%", padding: 10, borderRadius: 8, border: "1px solid #cbd5e1" }}
                  placeholder="Root cause identified after iterative 5-Why analysis..."
                />
              </div>

              <div>
                <label style={{ display: "block", fontSize: 13, fontWeight: 600, color: "#334155", marginBottom: 4 }}>
                  Permanent Corrective Action (PCA)
                </label>
                <textarea
                  rows={2}
                  value={formData.correctiveAction}
                  onChange={(e) => setFormData({ ...formData, correctiveAction: e.target.value })}
                  style={{ width: "100%", padding: 10, borderRadius: 8, border: "1px solid #cbd5e1" }}
                  placeholder="Direct technical change to fix the defect..."
                />
              </div>

              <div>
                <label style={{ display: "block", fontSize: 13, fontWeight: 600, color: "#334155", marginBottom: 4 }}>
                  Preventive Action (Systemic Standard Update)
                </label>
                <textarea
                  rows={2}
                  value={formData.preventiveAction}
                  onChange={(e) => setFormData({ ...formData, preventiveAction: e.target.value })}
                  style={{ width: "100%", padding: 10, borderRadius: 8, border: "1px solid #cbd5e1" }}
                  placeholder="SOP update, training, mechanical poka-yoke to prevent recurrence..."
                />
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
                    background: "#4338ca",
                    color: "#ffffff",
                    fontWeight: 700,
                    cursor: "pointer",
                  }}
                >
                  Register CAPA
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Full 8D Details Modal */}
      {selectedCapa && (
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
              maxWidth: 620,
              width: "100%",
              maxHeight: "90vh",
              overflowY: "auto",
              padding: 28,
              boxShadow: "0 20px 25px -5px rgba(0,0,0,0.2)",
            }}
          >
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16 }}>
              <div>
                <span style={{ fontSize: 12, color: "#4338ca", fontWeight: 700 }}>8D DOSSIER</span>
                <h2 style={{ fontSize: 20, fontWeight: 800, color: "#0f172a", margin: "2px 0 0 0" }}>
                  {selectedCapa.capaNumber}: {selectedCapa.title}
                </h2>
              </div>
              <button
                onClick={() => setSelectedCapa(null)}
                style={{ background: "transparent", border: "none", fontSize: 20, cursor: "pointer", color: "#64748b" }}
              >
                ✕
              </button>
            </div>

            <div style={{ display: "flex", flexDirection: "column", gap: 14, fontSize: 13, color: "#334155" }}>
              <div>
                <span style={{ fontWeight: 700, color: "#0f172a" }}>Problem Statement</span>
                <div style={{ background: "#f8fafc", padding: 10, borderRadius: 8, marginTop: 4 }}>
                  {selectedCapa.problemStatement}
                </div>
              </div>
              <div>
                <span style={{ fontWeight: 700, color: "#0f172a" }}>Root Cause</span>
                <div style={{ background: "#f8fafc", padding: 10, borderRadius: 8, marginTop: 4 }}>
                  {selectedCapa.rootCause || "Pending root cause sign-off"}
                </div>
              </div>
              <div>
                <span style={{ fontWeight: 700, color: "#0f172a" }}>Corrective Action</span>
                <div style={{ background: "#f8fafc", padding: 10, borderRadius: 8, marginTop: 4 }}>
                  {selectedCapa.correctiveAction || "Pending action design"}
                </div>
              </div>
              <div>
                <span style={{ fontWeight: 700, color: "#0f172a" }}>Preventive Action</span>
                <div style={{ background: "#f8fafc", padding: 10, borderRadius: 8, marginTop: 4 }}>
                  {selectedCapa.preventiveAction || "Pending standardization"}
                </div>
              </div>
              <div>
                <span style={{ fontWeight: 700, color: "#0f172a" }}>Verification of Effectiveness</span>
                <div style={{ background: "#f8fafc", padding: 10, borderRadius: 8, marginTop: 4 }}>
                  {selectedCapa.verificationMethod || "Continuous lot inspection"}
                </div>
              </div>
            </div>

            <div style={{ marginTop: 24, textAlign: "right" }}>
              <button
                onClick={() => setSelectedCapa(null)}
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
