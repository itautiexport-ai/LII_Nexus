import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { qmsApi, QualityInspection, NonConformanceReport, CapaItem, QualityAudit } from "../api/qmsApi";

export default function QmsDashboardPage() {
  const navigate = useNavigate();
  const [inspections, setInspections] = useState<QualityInspection[]>([]);
  const [ncrs, setNcrs] = useState<NonConformanceReport[]>([]);
  const [capas, setCapas] = useState<CapaItem[]>([]);
  const [audits, setAudits] = useState<QualityAudit[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    setLoading(true);
    try {
      const [inspList, ncrList, capaList, auditList] = await Promise.all([
        qmsApi.getInspections(),
        qmsApi.getNcrs(),
        qmsApi.getCapas(),
        qmsApi.getAudits(),
      ]);
      setInspections(inspList);
      setNcrs(ncrList);
      setCapas(capaList);
      setAudits(auditList);
    } catch (err) {
      console.error("Failed to load QMS data", err);
    } finally {
      setLoading(false);
    }
  };

  const totalInspected = inspections.reduce((acc, i) => acc + i.sampleSize, 0);
  const totalDefects = inspections.reduce((acc, i) => acc + i.defectsCount, 0);
  const overallDefectRate = totalInspected > 0 ? ((totalDefects / totalInspected) * 100).toFixed(2) : "0.00";
  const passedCount = inspections.filter((i) => i.status === "Passed").length;
  const fpyRate = inspections.length > 0 ? (((passedCount) / inspections.length) * 100).toFixed(1) : "100";
  const openNcrs = ncrs.filter((n) => n.status !== "Closed");

  return (
    <div style={{ padding: "24px 32px", maxWidth: 1400, margin: "0 auto", fontFamily: "inherit" }}>
      {/* Top Banner Header */}
      <div
        style={{
          background: "linear-gradient(135deg, #0f172a 0%, #1e293b 50%, #312e81 100%)",
          borderRadius: 16,
          padding: "28px 36px",
          color: "#ffffff",
          marginBottom: 28,
          boxShadow: "0 10px 25px -5px rgba(15, 23, 42, 0.3)",
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          flexWrap: "wrap",
          gap: 20,
        }}
      >
        <div>
          <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 6 }}>
            <span
              style={{
                background: "rgba(99, 102, 241, 0.3)",
                color: "#a5b4fc",
                border: "1px solid rgba(165, 180, 252, 0.3)",
                padding: "3px 10px",
                borderRadius: 20,
                fontSize: 12,
                fontWeight: 700,
                letterSpacing: "0.05em",
                textTransform: "uppercase",
              }}
            >
              ISO 9001:2015 Compliant
            </span>
            <span style={{ color: "#94a3b8", fontSize: 13 }}>• QMS Module 9.0</span>
          </div>
          <h1 style={{ fontSize: 28, fontWeight: 800, margin: 0, letterSpacing: "-0.02em" }}>
            Quality Management System (QMS)
          </h1>
          <p style={{ color: "#cbd5e1", margin: "6px 0 0 0", fontSize: 15, maxWidth: 650, lineHeight: 1.5 }}>
            Total Quality Assurance across Incoming Raw Materials, In-Process Machining & Finishing, and Pre-Dispatch Inspection.
          </p>
        </div>

        <div style={{ display: "flex", gap: 12, flexWrap: "wrap" }}>
          <button
            onClick={() => navigate("/admin/qms/inspections")}
            style={{
              background: "#4f46e5",
              color: "#fff",
              border: "none",
              padding: "10px 18px",
              borderRadius: 8,
              fontWeight: 600,
              fontSize: 14,
              cursor: "pointer",
              boxShadow: "0 4px 12px rgba(79, 70, 229, 0.4)",
              display: "flex",
              alignItems: "center",
              gap: 8,
              transition: "transform 0.15s",
            }}
            onMouseEnter={(e) => (e.currentTarget.style.transform = "translateY(-1px)")}
            onMouseLeave={(e) => (e.currentTarget.style.transform = "translateY(0)")}
          >
            <span>🔍</span> New Inspection
          </button>
          <button
            onClick={() => navigate("/admin/qms/ncr")}
            style={{
              background: "rgba(239, 68, 68, 0.9)",
              color: "#fff",
              border: "none",
              padding: "10px 18px",
              borderRadius: 8,
              fontWeight: 600,
              fontSize: 14,
              cursor: "pointer",
              boxShadow: "0 4px 12px rgba(239, 68, 68, 0.3)",
              display: "flex",
              alignItems: "center",
              gap: 8,
            }}
          >
            <span>⚠️</span> Log NCR
          </button>
          <button
            onClick={() => navigate("/admin/qms/standards")}
            style={{
              background: "rgba(255, 255, 255, 0.12)",
              color: "#fff",
              border: "1px solid rgba(255, 255, 255, 0.25)",
              padding: "10px 16px",
              borderRadius: 8,
              fontWeight: 600,
              fontSize: 14,
              cursor: "pointer",
              backdropFilter: "blur(6px)",
            }}
          >
            📋 AQL Standards
          </button>
        </div>
      </div>

      {/* KPI Cards */}
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit, minmax(240px, 1fr))",
          gap: 20,
          marginBottom: 28,
        }}
      >
        {/* Card 1: First Pass Yield */}
        <div
          style={{
            background: "#ffffff",
            padding: "22px 24px",
            borderRadius: 14,
            border: "1px solid #e2e8f0",
            boxShadow: "0 2px 4px rgba(0,0,0,0.03)",
          }}
        >
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
            <span style={{ fontSize: 13, fontWeight: 600, color: "#64748b", textTransform: "uppercase" }}>
              First Pass Yield (FPY)
            </span>
            <span
              style={{
                fontSize: 12,
                color: "#16a34a",
                background: "#dcfce7",
                padding: "2px 8px",
                borderRadius: 12,
                fontWeight: 700,
              }}
            >
              +1.8%
            </span>
          </div>
          <div style={{ fontSize: 32, fontWeight: 800, color: "#0f172a", marginTop: 8 }}>{fpyRate}%</div>
          <div style={{ fontSize: 13, color: "#94a3b8", marginTop: 4 }}>
            {passedCount} of {inspections.length} lots passed without rework
          </div>
        </div>

        {/* Card 2: Defect Rate */}
        <div
          style={{
            background: "#ffffff",
            padding: "22px 24px",
            borderRadius: 14,
            border: "1px solid #e2e8f0",
            boxShadow: "0 2px 4px rgba(0,0,0,0.03)",
          }}
        >
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
            <span style={{ fontSize: 13, fontWeight: 600, color: "#64748b", textTransform: "uppercase" }}>
              Total Defect Rate
            </span>
            <span
              style={{
                fontSize: 12,
                color: "#16a34a",
                background: "#dcfce7",
                padding: "2px 8px",
                borderRadius: 12,
                fontWeight: 700,
              }}
            >
              -0.42%
            </span>
          </div>
          <div style={{ fontSize: 32, fontWeight: 800, color: "#0f172a", marginTop: 8 }}>
            {overallDefectRate}%
          </div>
          <div style={{ fontSize: 13, color: "#94a3b8", marginTop: 4 }}>
            {totalDefects} defects across {totalInspected} sampled units
          </div>
        </div>

        {/* Card 3: Open NCRs */}
        <div
          style={{
            background: "#ffffff",
            padding: "22px 24px",
            borderRadius: 14,
            border: "1px solid #e2e8f0",
            boxShadow: "0 2px 4px rgba(0,0,0,0.03)",
          }}
        >
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
            <span style={{ fontSize: 13, fontWeight: 600, color: "#64748b", textTransform: "uppercase" }}>
              Active Non-Conformances
            </span>
            <span
              style={{
                fontSize: 12,
                color: openNcrs.length > 0 ? "#b91c1c" : "#16a34a",
                background: openNcrs.length > 0 ? "#fee2e2" : "#dcfce7",
                padding: "2px 8px",
                borderRadius: 12,
                fontWeight: 700,
              }}
            >
              {openNcrs.length} Active
            </span>
          </div>
          <div style={{ fontSize: 32, fontWeight: 800, color: "#0f172a", marginTop: 8 }}>
            {openNcrs.length}
          </div>
          <div style={{ fontSize: 13, color: "#94a3b8", marginTop: 4 }}>
            {ncrs.filter((n) => n.severity === "Critical").length} Critical • {ncrs.filter((n) => n.severity === "Major").length} Major
          </div>
        </div>

        {/* Card 4: CAPA Actions */}
        <div
          style={{
            background: "#ffffff",
            padding: "22px 24px",
            borderRadius: 14,
            border: "1px solid #e2e8f0",
            boxShadow: "0 2px 4px rgba(0,0,0,0.03)",
          }}
        >
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
            <span style={{ fontSize: 13, fontWeight: 600, color: "#64748b", textTransform: "uppercase" }}>
              Active CAPA Initiatives
            </span>
            <span
              style={{
                fontSize: 12,
                color: "#4338ca",
                background: "#e0e7ff",
                padding: "2px 8px",
                borderRadius: 12,
                fontWeight: 700,
              }}
            >
              8D Framework
            </span>
          </div>
          <div style={{ fontSize: 32, fontWeight: 800, color: "#0f172a", marginTop: 8 }}>
            {capas.length}
          </div>
          <div style={{ fontSize: 13, color: "#94a3b8", marginTop: 4 }}>
            Avg resolution progress: 82%
          </div>
        </div>
      </div>

      {/* Navigation Sub-module Cards */}
      <h2 style={{ fontSize: 18, fontWeight: 700, color: "#1e293b", marginBottom: 16 }}>
        QMS Functional Workspaces
      </h2>
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit, minmax(250px, 1fr))",
          gap: 16,
          marginBottom: 32,
        }}
      >
        {[
          {
            title: "Quality Inspections",
            desc: "Incoming (IQC), In-Process (IPQC), and Final Pack-out (FQC) inspection logs.",
            icon: "🔍",
            path: "/admin/qms/inspections",
            tag: `${inspections.length} Records`,
            tagColor: "#e0e7ff",
            tagTextColor: "#3730a3",
          },
          {
            title: "Non-Conformance (NCR)",
            desc: "Defect logging, severity grading, root causes & disposition tracking.",
            icon: "⚠️",
            path: "/admin/qms/ncr",
            tag: `${openNcrs.length} Open`,
            tagColor: "#fee2e2",
            tagTextColor: "#991b1b",
          },
          {
            title: "CAPA Management",
            desc: "8D Corrective and Preventive Action plans to eliminate recurring issues.",
            icon: "🛡️",
            path: "/admin/qms/capa",
            tag: `${capas.length} Active`,
            tagColor: "#fef3c7",
            tagTextColor: "#92400e",
          },
          {
            title: "Quality Audits",
            desc: "Internal ISO 9001 audits, process audits, and supplier evaluations.",
            icon: "📝",
            path: "/admin/qms/audits",
            tag: `${audits.length} Audits`,
            tagColor: "#dcfce7",
            tagTextColor: "#166534",
          },
          {
            title: "Quality Standards & AQL",
            desc: "AQL sampling tables, moisture thresholds, finish tolerance metrics.",
            icon: "📐",
            path: "/admin/qms/standards",
            tag: "Reference Library",
            tagColor: "#f1f5f9",
            tagTextColor: "#475569",
          },
        ].map((item) => (
          <div
            key={item.title}
            onClick={() => navigate(item.path)}
            style={{
              background: "#ffffff",
              border: "1px solid #e2e8f0",
              borderRadius: 12,
              padding: "20px",
              cursor: "pointer",
              transition: "all 0.2s ease",
              boxShadow: "0 1px 3px rgba(0,0,0,0.05)",
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.borderColor = "#6366f1";
              e.currentTarget.style.transform = "translateY(-3px)";
              e.currentTarget.style.boxShadow = "0 8px 16px rgba(99, 102, 241, 0.12)";
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.borderColor = "#e2e8f0";
              e.currentTarget.style.transform = "translateY(0)";
              e.currentTarget.style.boxShadow = "0 1px 3px rgba(0,0,0,0.05)";
            }}
          >
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 12 }}>
              <span style={{ fontSize: 26 }}>{item.icon}</span>
              <span
                style={{
                  fontSize: 11,
                  fontWeight: 700,
                  padding: "3px 8px",
                  borderRadius: 6,
                  background: item.tagColor,
                  color: item.tagTextColor,
                }}
              >
                {item.tag}
              </span>
            </div>
            <h3 style={{ fontSize: 16, fontWeight: 700, color: "#0f172a", margin: "0 0 6px 0" }}>
              {item.title}
            </h3>
            <p style={{ fontSize: 13, color: "#64748b", margin: 0, lineHeight: 1.4 }}>
              {item.desc}
            </p>
          </div>
        ))}
      </div>

      {/* Two-Column Detail Section */}
      <div style={{ display: "grid", gridTemplateColumns: "2fr 1fr", gap: 24, marginBottom: 32 }}>
        {/* Recent Inspections Table */}
        <div
          style={{
            background: "#ffffff",
            borderRadius: 14,
            border: "1px solid #e2e8f0",
            padding: 24,
            boxShadow: "0 1px 3px rgba(0,0,0,0.04)",
          }}
        >
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 18 }}>
            <div>
              <h3 style={{ fontSize: 16, fontWeight: 700, color: "#0f172a", margin: 0 }}>
                Recent Quality Inspection Logs
              </h3>
              <p style={{ fontSize: 13, color: "#64748b", margin: "2px 0 0 0" }}>
                Latest lot evaluations across plant checkpoints
              </p>
            </div>
            <button
              onClick={() => navigate("/admin/qms/inspections")}
              style={{
                fontSize: 13,
                fontWeight: 600,
                color: "#4f46e5",
                background: "transparent",
                border: "none",
                cursor: "pointer",
              }}
            >
              View All Inspections →
            </button>
          </div>

          <div style={{ overflowX: "auto" }}>
            <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 13 }}>
              <thead>
                <tr style={{ borderBottom: "1px solid #e2e8f0", background: "#f8fafc", textAlign: "left" }}>
                  <th style={{ padding: "10px 12px", color: "#475569", fontWeight: 600 }}>ID</th>
                  <th style={{ padding: "10px 12px", color: "#475569", fontWeight: 600 }}>Type</th>
                  <th style={{ padding: "10px 12px", color: "#475569", fontWeight: 600 }}>Item & Lot</th>
                  <th style={{ padding: "10px 12px", color: "#475569", fontWeight: 600 }}>Sample / Def.</th>
                  <th style={{ padding: "10px 12px", color: "#475569", fontWeight: 600 }}>Outcome</th>
                  <th style={{ padding: "10px 12px", color: "#475569", fontWeight: 600 }}>Inspector</th>
                </tr>
              </thead>
              <tbody>
                {inspections.slice(0, 5).map((i) => {
                  const badgeStyle =
                    i.status === "Passed"
                      ? { bg: "#dcfce7", text: "#15803d" }
                      : i.status === "Rejected"
                      ? { bg: "#fee2e2", text: "#b91c1c" }
                      : { bg: "#fef3c7", text: "#b45309" };

                  return (
                    <tr
                      key={i.id}
                      style={{ borderBottom: "1px solid #f1f5f9", transition: "background 0.15s" }}
                      onMouseEnter={(e) => (e.currentTarget.style.background = "#f8fafc")}
                      onMouseLeave={(e) => (e.currentTarget.style.background = "transparent")}
                    >
                      <td style={{ padding: "12px", fontWeight: 600, color: "#1e293b" }}>
                        {i.inspectionNumber}
                      </td>
                      <td style={{ padding: "12px" }}>
                        <span
                          style={{
                            background:
                              i.type === "IQC" ? "#e0f2fe" : i.type === "IPQC" ? "#f3e8ff" : "#ecfdf5",
                            color:
                              i.type === "IQC" ? "#0369a1" : i.type === "IPQC" ? "#7e22ce" : "#047857",
                            padding: "2px 8px",
                            borderRadius: 6,
                            fontSize: 11,
                            fontWeight: 700,
                          }}
                        >
                          {i.type}
                        </span>
                      </td>
                      <td style={{ padding: "12px" }}>
                        <div style={{ fontWeight: 600, color: "#1e293b" }}>{i.itemName}</div>
                        <div style={{ fontSize: 11, color: "#64748b" }}>
                          {i.itemCode} • {i.lotNumber}
                        </div>
                      </td>
                      <td style={{ padding: "12px", color: "#334155" }}>
                        <b>{i.sampleSize}</b> sampled •{" "}
                        <span style={{ color: i.defectsCount > 0 ? "#dc2626" : "#16a34a", fontWeight: 600 }}>
                          {i.defectsCount} defects
                        </span>
                      </td>
                      <td style={{ padding: "12px" }}>
                        <span
                          style={{
                            background: badgeStyle.bg,
                            color: badgeStyle.text,
                            padding: "3px 10px",
                            borderRadius: 12,
                            fontWeight: 700,
                            fontSize: 12,
                          }}
                        >
                          {i.status}
                        </span>
                      </td>
                      <td style={{ padding: "12px", color: "#475569" }}>{i.inspector}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>

        {/* Quality Defect Breakdown & Root Cause */}
        <div
          style={{
            background: "#ffffff",
            borderRadius: 14,
            border: "1px solid #e2e8f0",
            padding: 24,
            boxShadow: "0 1px 3px rgba(0,0,0,0.04)",
          }}
        >
          <h3 style={{ fontSize: 16, fontWeight: 700, color: "#0f172a", margin: "0 0 4px 0" }}>
            Quality Health Breakdown
          </h3>
          <p style={{ fontSize: 13, color: "#64748b", margin: "0 0 20px 0" }}>
            Process stage pass rates & tolerance compliance
          </p>

          <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
            {[
              { stage: "Incoming Timber & Board (IQC)", pass: 98.4, color: "#22c55e" },
              { stage: "Hardware & Fittings (IQC)", pass: 99.1, color: "#22c55e" },
              { stage: "CNC Machining & Tenoning (IPQC)", pass: 95.8, color: "#3b82f6" },
              { stage: "Sub-Assembly & Sanding (IPQC)", pass: 94.2, color: "#eab308" },
              { stage: "Lacquer & Finishing (IPQC)", pass: 92.5, color: "#f97316" },
              { stage: "Pre-Dispatch & Packaging (FQC)", pass: 97.6, color: "#22c55e" },
            ].map((p) => (
              <div key={p.stage}>
                <div style={{ display: "flex", justifyContent: "space-between", fontSize: 12, marginBottom: 4 }}>
                  <span style={{ fontWeight: 600, color: "#334155" }}>{p.stage}</span>
                  <span style={{ fontWeight: 700, color: "#0f172a" }}>{p.pass}% Pass</span>
                </div>
                <div style={{ height: 6, background: "#f1f5f9", borderRadius: 4, overflow: "hidden" }}>
                  <div
                    style={{
                      width: `${p.pass}%`,
                      height: "100%",
                      background: p.color,
                      borderRadius: 4,
                    }}
                  />
                </div>
              </div>
            ))}
          </div>

          <div
            style={{
              marginTop: 24,
              padding: 16,
              background: "#f8fafc",
              borderRadius: 10,
              border: "1px dashed #cbd5e1",
            }}
          >
            <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 6 }}>
              <span style={{ fontSize: 16 }}>💡</span>
              <span style={{ fontSize: 13, fontWeight: 700, color: "#1e293b" }}>Quality Tip of the Week</span>
            </div>
            <p style={{ fontSize: 12, color: "#64748b", margin: 0, lineHeight: 1.4 }}>
              Maintain wood moisture equilibrium below 12% before applying PU sealer coats to prevent finish micro-blistering during monsoon curing cycles.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
