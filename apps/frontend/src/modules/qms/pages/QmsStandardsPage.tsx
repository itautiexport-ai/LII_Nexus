import React, { useState } from "react";
import { useNavigate } from "react-router-dom";

export default function QmsStandardsPage() {
  const navigate = useNavigate();

  // AQL Calculator State
  const [lotSize, setLotSize] = useState<number>(1000);
  const [aqlLevel, setAqlLevel] = useState<"1.0" | "1.5" | "2.5" | "4.0">("2.5");
  const [inspectionLevel, setInspectionLevel] = useState<"I" | "II" | "III">("II");

  // Simple AQL Level II ANSI/ASQ Z1.4 lookup calculation
  const calculateAql = () => {
    let sampleSize = 80;
    let codeLetter = "J";
    let accept = 5;
    let reject = 6;

    if (lotSize <= 50) {
      sampleSize = 8;
      codeLetter = "E";
    } else if (lotSize <= 150) {
      sampleSize = 20;
      codeLetter = "F";
    } else if (lotSize <= 500) {
      sampleSize = 50;
      codeLetter = "H";
    } else if (lotSize <= 1200) {
      sampleSize = 80;
      codeLetter = "J";
    } else if (lotSize <= 3200) {
      sampleSize = 125;
      codeLetter = "K";
    } else if (lotSize <= 10000) {
      sampleSize = 200;
      codeLetter = "L";
    } else {
      sampleSize = 315;
      codeLetter = "M";
    }

    if (aqlLevel === "1.0") {
      accept = Math.max(1, Math.floor(sampleSize * 0.02));
      reject = accept + 1;
    } else if (aqlLevel === "1.5") {
      accept = Math.max(1, Math.floor(sampleSize * 0.03));
      reject = accept + 1;
    } else if (aqlLevel === "2.5") {
      accept = Math.max(2, Math.floor(sampleSize * 0.05));
      reject = accept + 1;
    } else if (aqlLevel === "4.0") {
      accept = Math.max(3, Math.floor(sampleSize * 0.08));
      reject = accept + 1;
    }

    return { sampleSize, codeLetter, accept, reject };
  };

  const aqlResult = calculateAql();

  return (
    <div style={{ padding: "24px 32px", maxWidth: 1400, margin: "0 auto" }}>
      {/* Header */}
      <div style={{ marginBottom: 24 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 4 }}>
          <span
            style={{ cursor: "pointer", color: "#6366f1", fontWeight: 600, fontSize: 13 }}
            onClick={() => navigate("/admin/qms/dashboard")}
          >
            ← QMS Overview
          </span>
        </div>
        <h1 style={{ fontSize: 26, fontWeight: 800, color: "#0f172a", margin: 0 }}>
          Quality Standards & AQL Reference
        </h1>
        <p style={{ color: "#64748b", margin: "4px 0 0 0", fontSize: 14 }}>
          ISO 2859-1 / ANSI Z1.4 Acceptance Quality Limits, moisture thresholds, and finishing tolerance standards
        </p>
      </div>

      {/* Interactive AQL Sampling Calculator */}
      <div
        style={{
          background: "linear-gradient(135deg, #1e1b4b 0%, #312e81 100%)",
          color: "#ffffff",
          borderRadius: 16,
          padding: "28px 32px",
          marginBottom: 32,
          boxShadow: "0 10px 25px -5px rgba(49, 46, 129, 0.3)",
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 12 }}>
          <span style={{ fontSize: 24 }}>📐</span>
          <h2 style={{ fontSize: 20, fontWeight: 800, margin: 0 }}>
            Interactive AQL Sampling Calculator (Normal Level II)
          </h2>
        </div>
        <p style={{ color: "#c7d2fe", fontSize: 14, margin: "0 0 24px 0", maxWidth: 700 }}>
          Determine required sample sizes and critical accept/reject limits for lot-based incoming and pre-dispatch inspections.
        </p>

        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))", gap: 20, marginBottom: 24 }}>
          <div>
            <label style={{ display: "block", fontSize: 13, fontWeight: 600, color: "#e0e7ff", marginBottom: 6 }}>
              Production Lot / Batch Size
            </label>
            <input
              type="number"
              min={1}
              value={lotSize}
              onChange={(e) => setLotSize(parseInt(e.target.value) || 1)}
              style={{
                width: "100%",
                padding: "10px 14px",
                borderRadius: 8,
                border: "1px solid rgba(255,255,255,0.2)",
                background: "rgba(255,255,255,0.1)",
                color: "#ffffff",
                fontSize: 15,
                fontWeight: 700,
              }}
            />
          </div>

          <div>
            <label style={{ display: "block", fontSize: 13, fontWeight: 600, color: "#e0e7ff", marginBottom: 6 }}>
              AQL Threshold Limit
            </label>
            <select
              value={aqlLevel}
              onChange={(e) => setAqlLevel(e.target.value as any)}
              style={{
                width: "100%",
                padding: "10px 14px",
                borderRadius: 8,
                border: "1px solid rgba(255,255,255,0.2)",
                background: "#312e81",
                color: "#ffffff",
                fontSize: 14,
                fontWeight: 700,
              }}
            >
              <option value="1.0">AQL 1.0 (Strict / High Value)</option>
              <option value="1.5">AQL 1.5 (Standard Critical)</option>
              <option value="2.5">AQL 2.5 (Industrial Standard / Major)</option>
              <option value="4.0">AQL 4.0 (Minor Workmanship)</option>
            </select>
          </div>

          <div>
            <label style={{ display: "block", fontSize: 13, fontWeight: 600, color: "#e0e7ff", marginBottom: 6 }}>
              Inspection Level
            </label>
            <select
              value={inspectionLevel}
              onChange={(e) => setInspectionLevel(e.target.value as any)}
              style={{
                width: "100%",
                padding: "10px 14px",
                borderRadius: 8,
                border: "1px solid rgba(255,255,255,0.2)",
                background: "#312e81",
                color: "#ffffff",
                fontSize: 14,
                fontWeight: 700,
              }}
            >
              <option value="I">Level I (Reduced)</option>
              <option value="II">Level II (General Standard)</option>
              <option value="III">Level III (Tightened)</option>
            </select>
          </div>
        </div>

        {/* Calculated Results Banner */}
        <div
          style={{
            background: "rgba(255, 255, 255, 0.1)",
            backdropFilter: "blur(8px)",
            borderRadius: 12,
            padding: "20px 24px",
            border: "1px solid rgba(255, 255, 255, 0.15)",
            display: "grid",
            gridTemplateColumns: "repeat(auto-fit, minmax(140px, 1fr))",
            gap: 16,
            textAlign: "center",
          }}
        >
          <div>
            <div style={{ fontSize: 12, color: "#cbd5e1", textTransform: "uppercase", fontWeight: 600 }}>
              Sampling Code
            </div>
            <div style={{ fontSize: 26, fontWeight: 800, marginTop: 4 }}>Letter {aqlResult.codeLetter}</div>
          </div>
          <div>
            <div style={{ fontSize: 12, color: "#cbd5e1", textTransform: "uppercase", fontWeight: 600 }}>
              Sample To Pull
            </div>
            <div style={{ fontSize: 26, fontWeight: 800, marginTop: 4, color: "#38bdf8" }}>
              {aqlResult.sampleSize} units
            </div>
          </div>
          <div>
            <div style={{ fontSize: 12, color: "#cbd5e1", textTransform: "uppercase", fontWeight: 600 }}>
              Acceptance Limit (Ac)
            </div>
            <div style={{ fontSize: 26, fontWeight: 800, marginTop: 4, color: "#4ade80" }}>
              ≤ {aqlResult.accept} defects
            </div>
          </div>
          <div>
            <div style={{ fontSize: 12, color: "#cbd5e1", textTransform: "uppercase", fontWeight: 600 }}>
              Rejection Threshold (Re)
            </div>
            <div style={{ fontSize: 26, fontWeight: 800, marginTop: 4, color: "#f87171" }}>
              ≥ {aqlResult.reject} defects
            </div>
          </div>
        </div>
      </div>

      {/* Standards Reference Cards */}
      <h2 style={{ fontSize: 18, fontWeight: 700, color: "#1e293b", marginBottom: 16 }}>
        Technical Manufacturing Quality Specs
      </h2>

      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(320px, 1fr))", gap: 20 }}>
        {/* Card 1: Moisture Standard */}
        <div style={{ background: "#ffffff", border: "1px solid #e2e8f0", borderRadius: 14, padding: 24 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 12 }}>
            <span style={{ fontSize: 22 }}>🪵</span>
            <h3 style={{ fontSize: 16, fontWeight: 700, color: "#0f172a", margin: 0 }}>
              Timber Moisture Content Standard
            </h3>
          </div>
          <p style={{ fontSize: 13, color: "#64748b", margin: "0 0 16px 0", lineHeight: 1.4 }}>
            Mandatory moisture equilibrium thresholds tested with pin-type digital moisture meters prior to kiln drying & cutting.
          </p>
          <div style={{ display: "flex", flexDirection: "column", gap: 8, fontSize: 13 }}>
            <div style={{ display: "flex", justifyContent: "space-between", borderBottom: "1px solid #f1f5f9", paddingBottom: 6 }}>
              <span style={{ color: "#475569" }}>Export Kiln-Dried Timber</span>
              <span style={{ fontWeight: 700, color: "#16a34a" }}>8% – 12% Max</span>
            </div>
            <div style={{ display: "flex", justifyContent: "space-between", borderBottom: "1px solid #f1f5f9", paddingBottom: 6 }}>
              <span style={{ color: "#475569" }}>Domestic Interior Furniture</span>
              <span style={{ fontWeight: 700, color: "#16a34a" }}>10% – 14% Max</span>
            </div>
            <div style={{ display: "flex", justifyContent: "space-between", borderBottom: "1px solid #f1f5f9", paddingBottom: 6 }}>
              <span style={{ color: "#475569" }}>Air Dried Planks (Pre-Kiln)</span>
              <span style={{ fontWeight: 700, color: "#eab308" }}>&lt; 18%</span>
            </div>
            <div style={{ display: "flex", justifyContent: "space-between", borderBottom: "1px solid #f1f5f9", paddingBottom: 6 }}>
              <span style={{ color: "#475569" }}>Rejection Threshold</span>
              <span style={{ fontWeight: 700, color: "#dc2626" }}>&gt; 14.5% Immediate Quarantine</span>
            </div>
          </div>
        </div>

        {/* Card 2: Machining Tolerances */}
        <div style={{ background: "#ffffff", border: "1px solid #e2e8f0", borderRadius: 14, padding: 24 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 12 }}>
            <span style={{ fontSize: 22 }}>⚙️</span>
            <h3 style={{ fontSize: 16, fontWeight: 700, color: "#0f172a", margin: 0 }}>
              Joinery & Machining Tolerances
            </h3>
          </div>
          <p style={{ fontSize: 13, color: "#64748b", margin: "0 0 16px 0", lineHeight: 1.4 }}>
            Permissible dimensional variances verified by digital vernier calipers during IPQC inspections.
          </p>
          <div style={{ display: "flex", flexDirection: "column", gap: 8, fontSize: 13 }}>
            <div style={{ display: "flex", justifyContent: "space-between", borderBottom: "1px solid #f1f5f9", paddingBottom: 6 }}>
              <span style={{ color: "#475569" }}>CNC Boring / Dowel Holes</span>
              <span style={{ fontWeight: 700, color: "#16a34a" }}>±0.2 mm</span>
            </div>
            <div style={{ display: "flex", justifyContent: "space-between", borderBottom: "1px solid #f1f5f9", paddingBottom: 6 }}>
              <span style={{ color: "#475569" }}>Tenon Width & Mortise Depth</span>
              <span style={{ fontWeight: 700, color: "#16a34a" }}>±0.3 mm</span>
            </div>
            <div style={{ display: "flex", justifyContent: "space-between", borderBottom: "1px solid #f1f5f9", paddingBottom: 6 }}>
              <span style={{ color: "#475569" }}>Table Top Diagonal Squareness</span>
              <span style={{ fontWeight: 700, color: "#16a34a" }}>±1.0 mm</span>
            </div>
            <div style={{ display: "flex", justifyContent: "space-between", borderBottom: "1px solid #f1f5f9", paddingBottom: 6 }}>
              <span style={{ color: "#475569" }}>Drawer Gap Uniformity</span>
              <span style={{ fontWeight: 700, color: "#16a34a" }}>2.5 mm ± 0.5 mm</span>
            </div>
          </div>
        </div>

        {/* Card 3: Coating Standards */}
        <div style={{ background: "#ffffff", border: "1px solid #e2e8f0", borderRadius: 14, padding: 24 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 12 }}>
            <span style={{ fontSize: 22 }}>🎨</span>
            <h3 style={{ fontSize: 16, fontWeight: 700, color: "#0f172a", margin: 0 }}>
              Finishing & Coating Specs
            </h3>
          </div>
          <p style={{ fontSize: 13, color: "#64748b", margin: "0 0 16px 0", lineHeight: 1.4 }}>
            Optical and physical standards for polyurethane (PU), nitrocellulose (NC), and water-based finishes.
          </p>
          <div style={{ display: "flex", flexDirection: "column", gap: 8, fontSize: 13 }}>
            <div style={{ display: "flex", justifyContent: "space-between", borderBottom: "1px solid #f1f5f9", paddingBottom: 6 }}>
              <span style={{ color: "#475569" }}>Total Dry Film Thickness (DFT)</span>
              <span style={{ fontWeight: 700, color: "#16a34a" }}>80 – 110 µm</span>
            </div>
            <div style={{ display: "flex", justifyContent: "space-between", borderBottom: "1px solid #f1f5f9", paddingBottom: 6 }}>
              <span style={{ color: "#475569" }}>Gloss Level (Matte / Satin)</span>
              <span style={{ fontWeight: 700, color: "#16a34a" }}>25% ± 3% (60° meter)</span>
            </div>
            <div style={{ display: "flex", justifyContent: "space-between", borderBottom: "1px solid #f1f5f9", paddingBottom: 6 }}>
              <span style={{ color: "#475569" }}>Adhesion Cross-Hatch (ASTM)</span>
              <span style={{ fontWeight: 700, color: "#16a34a" }}>Class 4B / 5B</span>
            </div>
            <div style={{ display: "flex", justifyContent: "space-between", borderBottom: "1px solid #f1f5f9", paddingBottom: 6 }}>
              <span style={{ color: "#475569" }}>Pencil Hardness Test</span>
              <span style={{ fontWeight: 700, color: "#16a34a" }}>≥ 2H Scratch Resistance</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
