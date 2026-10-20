import React, { useState } from "react";

export interface PmsCheckpoint {
  id: number;
  title: string;
  requirement: string;
  observation: string;
  result: "Pass" | "Fail" | "N/A";
}

export interface PmsDefectRow {
  id: string;
  observation: string;
  qtyAffected: number;
  identification: string;
  actionTaken: string;
}

export interface PmsInspectionReportData {
  id: string;
  reportType: "PrimaryMachineShop";
  department: string;
  inspector: string;
  date: string;
  reportNo: string;
  aliasName: string;
  plannedQty: number;
  skuNo: string;
  shift: string;
  jobCard: string;
  drawingRev: string;
  operator: string;
  componentName: string;
  inspectedQty: number;
  checkpoints: PmsCheckpoint[];
  acceptedQty: number;
  rejectedQty: number;
  reworkQty: number;
  holdQty: number;
  holdTagNo: string;
  overallStatus: "ACCEPTED" | "REJECTED" | "HOLD" | "PARTIALLY ACCEPTED";
  defects: PmsDefectRow[];
  disposition: string;
  nextProcess: string;
  handoverDateTime: string;
  supervisorName: string;
  approvalName: string;
  createdAt: string;
}

const DEFAULT_CHECKPOINTS: PmsCheckpoint[] = [
  {
    id: 1,
    title: "Joint Open / Glue Line",
    requirement: "Glue joints must be fully bonded, seamless & tight; zero open joints",
    observation: "",
    result: "Pass",
  },
  {
    id: 2,
    title: "Moisture Issue",
    requirement: "Moisture Content (MC) within standard limit (8% - 12%); no wet wood",
    observation: "",
    result: "Pass",
  },
  {
    id: 3,
    title: "Pin Holes Issue",
    requirement: "Surface free from excessive insect/worm pin holes affecting strength",
    observation: "",
    result: "Pass",
  },
  {
    id: 4,
    title: "Knot Condition",
    requirement: "No dead/loose knots; sound knot size must not exceed 1\" (inch)",
    observation: "",
    result: "Pass",
  },
  {
    id: 5,
    title: "Under-size Thickness",
    requirement: "Thickness must meet approved drawing/spec; no under-thickness allowed",
    observation: "",
    result: "Pass",
  },
  {
    id: 6,
    title: "Size Variation",
    requirement: "Dimensions (Length & Width) strictly as per cutting list without variance",
    observation: "",
    result: "Pass",
  },
  {
    id: 7,
    title: "End Crack / Water Wood",
    requirement: "No severe end-splitting, drying cracks, or water-soaked wood zones",
    observation: "",
    result: "Pass",
  },
  {
    id: 8,
    title: "Material & Identification",
    requirement: "Correct wood/material, grade, lot, and job-card identification",
    observation: "",
    result: "Pass",
  },
  {
    id: 9,
    title: "Drawing / Work Instruction",
    requirement: "Approved drawing and revision available at workstation",
    observation: "",
    result: "Pass",
  },
  {
    id: 10,
    title: "Planing / Surface Prep",
    requirement: "Surface even and smooth; no unacceptable machine marks / tear-out",
    observation: "",
    result: "Pass",
  },
  {
    id: 11,
    title: "Edge / Corner Condition",
    requirement: "No unacceptable chip-out, tear-out, cracks, or edge damage",
    observation: "",
    result: "Pass",
  },
  {
    id: 12,
    title: "Part Marking & Traceability",
    requirement: "Part identification, order, and batch remain fully traceable",
    observation: "",
    result: "Pass",
  },
  {
    id: 13,
    title: "Quantity & Completeness",
    requirement: "Required parts and quantities match job card / cutting list",
    observation: "",
    result: "Pass",
  },
];

interface Props {
  department: string;
  inspector: string;
  onCancel: () => void;
  onSubmitSuccess: (report: PmsInspectionReportData) => void;
}

export default function PrimaryMachineShopInspectionForm({
  department,
  inspector,
  onCancel,
  onSubmitSuccess,
}: Props) {
  const today = new Date().toISOString().split("T")[0];
  const count = Math.floor(100 + Math.random() * 900);

  // Section A: Production & Inspection Details
  const [reportNo] = useState(`PMS-IQC-${new Date().getFullYear()}-${count}`);
  const [aliasName, setAliasName] = useState("");
  const [plannedQty, setPlannedQty] = useState<number>(100);
  const [skuNo, setSkuNo] = useState("");
  const [shift, setShift] = useState("General");
  const [jobCard, setJobCard] = useState("");
  const [date, setDate] = useState(today);
  const [drawingRev, setDrawingRev] = useState("REV-01");
  const [operator, setOperator] = useState("");
  const [componentName, setComponentName] = useState("");
  const [inspectedQty, setInspectedQty] = useState<number>(100);

  // Section B: 13 Checkpoints
  const [checkpoints, setCheckpoints] = useState<PmsCheckpoint[]>(DEFAULT_CHECKPOINTS);

  // Section C: Summary & Status
  const [acceptedQty, setAcceptedQty] = useState<number>(100);
  const [rejectedQty, setRejectedQty] = useState<number>(0);
  const [reworkQty, setReworkQty] = useState<number>(0);
  const [holdQty, setHoldQty] = useState<number>(0);
  const [holdTagNo, setHoldTagNo] = useState("");
  const [overallStatus, setOverallStatus] = useState<"ACCEPTED" | "REJECTED" | "HOLD" | "PARTIALLY ACCEPTED">("ACCEPTED");

  // Section D: Defect Details
  const [defects, setDefects] = useState<PmsDefectRow[]>([]);

  // Section E: Handover & F: Approval
  const [disposition, setDisposition] = useState("Release to Secondary MS");
  const [nextProcess, setNextProcess] = useState("Secondary Machine Shop");
  const [handoverDateTime, setHandoverDateTime] = useState(`${today} 16:30`);
  const [supervisorName, setSupervisorName] = useState("");
  const [approvalName, setApprovalName] = useState("");

  const handleCheckpointChange = (id: number, field: "observation" | "result", value: any) => {
    setCheckpoints((prev) =>
      prev.map((item) => (item.id === id ? { ...item, [field]: value } : item))
    );
  };

  const handleAddDefect = () => {
    setDefects((prev) => [
      ...prev,
      {
        id: "def-" + Date.now(),
        observation: "",
        qtyAffected: 1,
        identification: "",
        actionTaken: "Rework / Scrap",
      },
    ]);
  };

  const handleRemoveDefect = (id: string) => {
    setDefects((prev) => prev.filter((d) => d.id !== id));
  };

  const handleDefectChange = (id: string, field: keyof PmsDefectRow, val: any) => {
    setDefects((prev) =>
      prev.map((d) => (d.id === id ? { ...d, [field]: val } : d))
    );
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!componentName.trim()) {
      alert("Please enter the Component Name.");
      return;
    }
    if (!jobCard.trim()) {
      alert("Please enter Job Card number.");
      return;
    }

    const report: PmsInspectionReportData = {
      id: "pms-rep-" + Date.now(),
      reportType: "PrimaryMachineShop",
      department,
      inspector,
      date,
      reportNo,
      aliasName,
      plannedQty,
      skuNo,
      shift,
      jobCard,
      drawingRev,
      operator,
      componentName,
      inspectedQty,
      checkpoints,
      acceptedQty,
      rejectedQty,
      reworkQty,
      holdQty,
      holdTagNo,
      overallStatus,
      defects,
      disposition,
      nextProcess,
      handoverDateTime,
      supervisorName,
      approvalName,
      createdAt: new Date().toISOString(),
    };

    onSubmitSuccess(report);
  };

  return (
    <div
      style={{
        background: "#ffffff",
        borderRadius: 16,
        padding: "36px 40px",
        boxShadow: "0 10px 25px -5px rgba(15, 23, 42, 0.08), 0 8px 10px -6px rgba(15, 23, 42, 0.04)",
        border: "1px solid #e2e8f0",
        fontFamily: "-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif",
      }}
    >
      {/* ============================================================ */}
      {/* 1. OFFICIAL DOCUMENT HEADER WITH LOGO */}
      {/* ============================================================ */}
      <div
        style={{
          borderBottom: "2px solid #0f172a",
          paddingBottom: 20,
          marginBottom: 28,
        }}
      >
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            flexWrap: "wrap",
            gap: 16,
          }}
        >
          {/* Company Brand & Logo */}
          <div style={{ display: "flex", alignItems: "center", gap: 16 }}>
            <img
              src="/logo.jpg"
              alt="Laxmi Ideal Interiors"
              style={{
                width: 72,
                height: 72,
                objectFit: "contain",
                borderRadius: 8,
                border: "1px solid #e2e8f0",
                padding: 4,
                background: "#ffffff",
              }}
              onError={(e) => {
                // Fallback styling if image fails
                (e.currentTarget as HTMLElement).style.display = "none";
              }}
            />
            <div>
              <div
                style={{
                  fontSize: 20,
                  fontWeight: 900,
                  color: "#0f172a",
                  letterSpacing: "0.04em",
                  textTransform: "uppercase",
                }}
              >
                LAXMI IDEAL INTERIORS
              </div>
              <div
                style={{
                  fontSize: 16,
                  fontWeight: 800,
                  color: "#2563eb",
                  letterSpacing: "0.02em",
                  textTransform: "uppercase",
                  marginTop: 2,
                }}
              >
                PRIMARY MACHINE SHOP – QUALITY INSPECTION REPORT
              </div>
              <div style={{ fontSize: 12, color: "#64748b", marginTop: 4, fontWeight: 500 }}>
                Inward & Process Gate 1 • Precision Milling, Sizing & Planing Verification
              </div>
            </div>
          </div>

          {/* Form Metadata Box */}
          <div
            style={{
              background: "#f8fafc",
              border: "1px solid #cbd5e1",
              borderRadius: 8,
              padding: "10px 16px",
              textAlign: "right",
              fontSize: 12,
              color: "#334155",
            }}
          >
            <div>Form No.: <b style={{ color: "#0f172a" }}>LII/QC/PMS/01</b></div>
            <div style={{ marginTop: 2 }}>Revision: <b style={{ color: "#0f172a" }}>01</b></div>
            <div style={{ marginTop: 2 }}>Effective Date: <b>{date}</b></div>
          </div>
        </div>

        {/* Frozen Identity Bar */}
        <div
          style={{
            marginTop: 18,
            padding: "10px 16px",
            background: "#eff6ff",
            border: "1px solid #bfdbfe",
            borderRadius: 8,
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            flexWrap: "wrap",
            gap: 12,
            fontSize: 13,
          }}
        >
          <div style={{ display: "flex", gap: 20, alignItems: "center", flexWrap: "wrap" }}>
            <div>
              <span style={{ color: "#64748b" }}>🏢 Department: </span>
              <b style={{ color: "#1e3a8a" }}>{department}</b>
              <span style={{ marginLeft: 6, fontSize: 11, background: "#dbeafe", color: "#1e40af", padding: "2px 6px", borderRadius: 4, fontWeight: 700 }}>
                🔒 Frozen
              </span>
            </div>
            <div>
              <span style={{ color: "#64748b" }}>👤 QC Inspector: </span>
              <b style={{ color: "#1e3a8a" }}>{inspector}</b>
              <span style={{ marginLeft: 6, fontSize: 11, background: "#dbeafe", color: "#1e40af", padding: "2px 6px", borderRadius: 4, fontWeight: 700 }}>
                🔒 Frozen
              </span>
            </div>
          </div>
          <button
            type="button"
            onClick={onCancel}
            style={{
              background: "#ffffff",
              color: "#475569",
              border: "1px solid #cbd5e1",
              padding: "6px 14px",
              borderRadius: 6,
              fontSize: 12,
              fontWeight: 600,
              cursor: "pointer",
            }}
          >
            ← Exit to Department Selection
          </button>
        </div>
      </div>

      <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: 28 }}>
        {/* ============================================================ */}
        {/* SECTION A: PRODUCTION & INSPECTION DETAILS */}
        {/* ============================================================ */}
        <div>
          <div
            style={{
              fontSize: 14,
              fontWeight: 800,
              color: "#0f172a",
              textTransform: "uppercase",
              letterSpacing: "0.04em",
              marginBottom: 14,
              display: "flex",
              alignItems: "center",
              gap: 8,
            }}
          >
            <span style={{ background: "#0f172a", color: "#fff", width: 22, height: 22, borderRadius: "50%", display: "inline-flex", alignItems: "center", justifyContent: "center", fontSize: 12 }}>
              A
            </span>
            <span>Production & Inspection Details</span>
          </div>

          <div
            style={{
              background: "#f8fafc",
              border: "1px solid #e2e8f0",
              borderRadius: 12,
              padding: "20px 24px",
              display: "grid",
              gridTemplateColumns: "repeat(4, 1fr)",
              gap: 16,
            }}
          >
            <div>
              <label style={labelStyle}>Report No.</label>
              <input
                type="text"
                value={reportNo}
                readOnly
                disabled
                style={{ ...inputStyle, background: "#e2e8f0", cursor: "not-allowed", fontWeight: 700 }}
              />
            </div>

            <div>
              <label style={labelStyle}>Inspector Name (Locked)</label>
              <input
                type="text"
                value={inspector}
                readOnly
                disabled
                style={{ ...inputStyle, background: "#e2e8f0", cursor: "not-allowed", fontWeight: 700 }}
              />
            </div>

            <div>
              <label style={labelStyle}>Alias Name</label>
              <input
                type="text"
                value={aliasName}
                onChange={(e) => setAliasName(e.target.value)}
                placeholder="e.g. Master Woodshop"
                style={inputStyle}
              />
            </div>

            <div>
              <label style={labelStyle}>Planned Qty *</label>
              <input
                type="number"
                min={1}
                required
                value={plannedQty}
                onChange={(e) => setPlannedQty(Number(e.target.value))}
                style={inputStyle}
              />
            </div>

            <div>
              <label style={labelStyle}>SKU No. *</label>
              <input
                type="text"
                required
                value={skuNo}
                onChange={(e) => setSkuNo(e.target.value)}
                placeholder="e.g. SKU-WD-7840"
                style={inputStyle}
              />
            </div>

            <div>
              <label style={labelStyle}>Shift *</label>
              <select
                value={shift}
                onChange={(e) => setShift(e.target.value)}
                style={inputStyle}
              >
                <option value="General">General Shift (09:00 - 18:00)</option>
                <option value="Shift A (Morning)">Shift A (Morning 06:00 - 14:30)</option>
                <option value="Shift B (Evening)">Shift B (Evening 14:30 - 23:00)</option>
                <option value="Shift C (Night)">Shift C (Night 23:00 - 06:00)</option>
              </select>
            </div>

            <div>
              <label style={labelStyle}>Job Card *</label>
              <input
                type="text"
                required
                value={jobCard}
                onChange={(e) => setJobCard(e.target.value)}
                placeholder="e.g. JC-2026-4412"
                style={inputStyle}
              />
            </div>

            <div>
              <label style={labelStyle}>Inspection Date *</label>
              <input
                type="date"
                required
                value={date}
                onChange={(e) => setDate(e.target.value)}
                style={inputStyle}
              />
            </div>

            <div>
              <label style={labelStyle}>Drawing / Rev *</label>
              <input
                type="text"
                required
                value={drawingRev}
                onChange={(e) => setDrawingRev(e.target.value)}
                placeholder="e.g. DWG-882 Rev-02"
                style={inputStyle}
              />
            </div>

            <div>
              <label style={labelStyle}>Operator Name</label>
              <input
                type="text"
                value={operator}
                onChange={(e) => setOperator(e.target.value)}
                placeholder="e.g. Rajesh Kumar"
                style={inputStyle}
              />
            </div>

            <div>
              <label style={labelStyle}>Component Name *</label>
              <input
                type="text"
                required
                value={componentName}
                onChange={(e) => setComponentName(e.target.value)}
                placeholder="e.g. Teak Dining Table Top"
                style={inputStyle}
              />
            </div>

            <div>
              <label style={labelStyle}>Inspected Qty *</label>
              <input
                type="number"
                min={1}
                required
                value={inspectedQty}
                onChange={(e) => {
                  const val = Number(e.target.value);
                  setInspectedQty(val);
                  setAcceptedQty(val);
                }}
                style={inputStyle}
              />
            </div>
          </div>
        </div>

        {/* ============================================================ */}
        {/* SECTION B: PRIMARY MACHINE SHOP PROCESS CHECKPOINTS (13 ITEMS) */}
        {/* ============================================================ */}
        <div>
          <div
            style={{
              fontSize: 14,
              fontWeight: 800,
              color: "#0f172a",
              textTransform: "uppercase",
              letterSpacing: "0.04em",
              marginBottom: 14,
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
            }}
          >
            <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
              <span style={{ background: "#0f172a", color: "#fff", width: 22, height: 22, borderRadius: "50%", display: "inline-flex", alignItems: "center", justifyContent: "center", fontSize: 12 }}>
                B
              </span>
              <span>Primary Machine Shop Process Checkpoints (13 Mandatory Parameters)</span>
            </div>
            <span style={{ fontSize: 12, fontWeight: 600, color: "#64748b" }}>
              Standard: 100% Visual & Dimensional Audit
            </span>
          </div>

          <div
            style={{
              border: "1px solid #e2e8f0",
              borderRadius: 12,
              overflow: "hidden",
              boxShadow: "0 1px 3px rgba(0,0,0,0.02)",
            }}
          >
            <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 13 }}>
              <thead>
                <tr style={{ background: "#0f172a", color: "#ffffff", textAlign: "left" }}>
                  <th style={{ padding: "12px 14px", width: 44, textAlign: "center" }}>#</th>
                  <th style={{ padding: "12px 14px", width: 220 }}>Process / Checkpoint</th>
                  <th style={{ padding: "12px 14px" }}>Acceptance Requirement</th>
                  <th style={{ padding: "12px 14px", width: 260 }}>Actual Observation</th>
                  <th style={{ padding: "12px 14px", width: 170, textAlign: "center" }}>Result</th>
                </tr>
              </thead>
              <tbody>
                {checkpoints.map((cp, idx) => (
                  <tr
                    key={cp.id}
                    style={{
                      background: idx % 2 === 0 ? "#ffffff" : "#f8fafc",
                      borderBottom: "1px solid #e2e8f0",
                    }}
                  >
                    <td style={{ padding: "12px 14px", textAlign: "center", fontWeight: 700, color: "#64748b" }}>
                      {cp.id}
                    </td>
                    <td style={{ padding: "12px 14px", fontWeight: 700, color: "#0f172a" }}>
                      {cp.title}
                    </td>
                    <td style={{ padding: "12px 14px", color: "#475569", lineHeight: 1.45 }}>
                      {cp.requirement}
                    </td>
                    <td style={{ padding: "8px 14px" }}>
                      <input
                        type="text"
                        value={cp.observation}
                        onChange={(e) => handleCheckpointChange(cp.id, "observation", e.target.value)}
                        style={{
                          width: "100%",
                          padding: "7px 10px",
                          borderRadius: 6,
                          border: "1px solid #cbd5e1",
                          fontSize: 13,
                          boxSizing: "border-box",
                        }}
                      />
                    </td>
                    <td style={{ padding: "8px 14px", textAlign: "center" }}>
                      <div style={{ display: "inline-flex", gap: 4, background: "#f1f5f9", padding: 3, borderRadius: 8 }}>
                        {(["Pass", "Fail", "N/A"] as const).map((opt) => {
                          const active = cp.result === opt;
                          return (
                            <button
                              key={opt}
                              type="button"
                              onClick={() => handleCheckpointChange(cp.id, "result", opt)}
                              style={{
                                border: "none",
                                padding: "4px 10px",
                                borderRadius: 6,
                                fontSize: 11,
                                fontWeight: 700,
                                cursor: "pointer",
                                transition: "all 0.15s",
                                background: active
                                  ? opt === "Pass"
                                    ? "#16a34a"
                                    : opt === "Fail"
                                    ? "#dc2626"
                                    : "#475569"
                                  : "transparent",
                                color: active ? "#ffffff" : "#64748b",
                              }}
                            >
                              {opt}
                            </button>
                          );
                        })}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* ============================================================ */}
        {/* SECTION C: INSPECTION SUMMARY */}
        {/* ============================================================ */}
        <div>
          <div
            style={{
              fontSize: 14,
              fontWeight: 800,
              color: "#0f172a",
              textTransform: "uppercase",
              letterSpacing: "0.04em",
              marginBottom: 14,
              display: "flex",
              alignItems: "center",
              gap: 8,
            }}
          >
            <span style={{ background: "#0f172a", color: "#fff", width: 22, height: 22, borderRadius: "50%", display: "inline-flex", alignItems: "center", justifyContent: "center", fontSize: 12 }}>
              C
            </span>
            <span>Inspection Summary & Disposition</span>
          </div>

          <div
            style={{
              background: "#f8fafc",
              border: "1px solid #e2e8f0",
              borderRadius: 12,
              padding: "20px 24px",
              display: "grid",
              gridTemplateColumns: "repeat(5, 1fr)",
              gap: 16,
              marginBottom: 16,
            }}
          >
            <div>
              <label style={{ ...labelStyle, color: "#166534" }}>✓ Accepted Qty</label>
              <input
                type="number"
                min={0}
                value={acceptedQty}
                onChange={(e) => setAcceptedQty(Number(e.target.value))}
                style={{ ...inputStyle, borderColor: "#86efac", background: "#f0fdf4", fontWeight: 700, color: "#166534" }}
              />
            </div>

            <div>
              <label style={{ ...labelStyle, color: "#991b1b" }}>✕ Rejected Qty</label>
              <input
                type="number"
                min={0}
                value={rejectedQty}
                onChange={(e) => setRejectedQty(Number(e.target.value))}
                style={{ ...inputStyle, borderColor: "#fca5a5", background: "#fef2f2", fontWeight: 700, color: "#991b1b" }}
              />
            </div>

            <div>
              <label style={{ ...labelStyle, color: "#92400e" }}>⚙️ Rework Qty</label>
              <input
                type="number"
                min={0}
                value={reworkQty}
                onChange={(e) => setReworkQty(Number(e.target.value))}
                style={{ ...inputStyle, borderColor: "#fde68a", background: "#fffbeb", fontWeight: 700, color: "#92400e" }}
              />
            </div>

            <div>
              <label style={{ ...labelStyle, color: "#475569" }}>⏸️ Hold Qty</label>
              <input
                type="number"
                min={0}
                value={holdQty}
                onChange={(e) => setHoldQty(Number(e.target.value))}
                style={{ ...inputStyle, borderColor: "#cbd5e1", background: "#f1f5f9", fontWeight: 700, color: "#334155" }}
              />
            </div>

            <div>
              <label style={labelStyle}>Hold Tag No.</label>
              <input
                type="text"
                value={holdTagNo}
                onChange={(e) => setHoldTagNo(e.target.value)}
                placeholder="e.g. HT-092"
                style={inputStyle}
              />
            </div>
          </div>

          {/* Overall Status Selection */}
          <div
            style={{
              padding: "16px 20px",
              background: "#ffffff",
              border: "1px solid #cbd5e1",
              borderRadius: 10,
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
              flexWrap: "wrap",
              gap: 12,
            }}
          >
            <div style={{ fontSize: 13, fontWeight: 700, color: "#0f172a" }}>
              Overall Quality Status:
            </div>
            <div style={{ display: "flex", gap: 10 }}>
              {(["ACCEPTED", "REJECTED", "HOLD", "PARTIALLY ACCEPTED"] as const).map((st) => {
                const active = overallStatus === st;
                return (
                  <button
                    key={st}
                    type="button"
                    onClick={() => setOverallStatus(st)}
                    style={{
                      border: "none",
                      padding: "8px 18px",
                      borderRadius: 8,
                      fontWeight: 800,
                      fontSize: 12,
                      cursor: "pointer",
                      transition: "all 0.15s",
                      background: active
                        ? st === "ACCEPTED"
                          ? "#16a34a"
                          : st === "REJECTED"
                          ? "#dc2626"
                          : st === "HOLD"
                          ? "#ea580c"
                          : "#4f46e5"
                        : "#f1f5f9",
                      color: active ? "#ffffff" : "#475569",
                      boxShadow: active ? "0 2px 6px rgba(0,0,0,0.15)" : "none",
                    }}
                  >
                    {st === "ACCEPTED" ? "✓ " : st === "REJECTED" ? "✕ " : "• "}
                    {st}
                  </button>
                );
              })}
            </div>
          </div>
        </div>

        {/* ============================================================ */}
        {/* SECTION D: DEFECT DETAILS LOG */}
        {/* ============================================================ */}
        <div>
          <div
            style={{
              fontSize: 14,
              fontWeight: 800,
              color: "#0f172a",
              textTransform: "uppercase",
              letterSpacing: "0.04em",
              marginBottom: 14,
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
            }}
          >
            <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
              <span style={{ background: "#0f172a", color: "#fff", width: 22, height: 22, borderRadius: "50%", display: "inline-flex", alignItems: "center", justifyContent: "center", fontSize: 12 }}>
                D
              </span>
              <span>Defect Log (Fill if Rejected / Hold / Rework)</span>
            </div>
            <button
              type="button"
              onClick={handleAddDefect}
              style={{
                background: "#0f172a",
                color: "#ffffff",
                border: "none",
                padding: "6px 14px",
                borderRadius: 6,
                fontSize: 12,
                fontWeight: 700,
                cursor: "pointer",
              }}
            >
              + Add Defect Row
            </button>
          </div>

          {defects.length === 0 ? (
            <div
              style={{
                padding: "20px",
                textAlign: "center",
                background: "#f8fafc",
                borderRadius: 10,
                border: "1px dashed #cbd5e1",
                color: "#64748b",
                fontSize: 13,
              }}
            >
              Zero defects logged. Click <b>+ Add Defect Row</b> if any part has defects.
            </div>
          ) : (
            <div style={{ border: "1px solid #e2e8f0", borderRadius: 10, overflow: "hidden" }}>
              <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 13 }}>
                <thead>
                  <tr style={{ background: "#f1f5f9", textAlign: "left", color: "#334155" }}>
                    <th style={{ padding: "10px 12px", width: 44, textAlign: "center" }}>#</th>
                    <th style={{ padding: "10px 12px" }}>Defect / Observation</th>
                    <th style={{ padding: "10px 12px", width: 120 }}>Qty Affected</th>
                    <th style={{ padding: "10px 12px", width: 220 }}>Part / Batch Identification</th>
                    <th style={{ padding: "10px 12px", width: 200 }}>Action Taken</th>
                    <th style={{ padding: "10px 12px", width: 60, textAlign: "center" }}>Action</th>
                  </tr>
                </thead>
                <tbody>
                  {defects.map((d, i) => (
                    <tr key={d.id} style={{ borderBottom: "1px solid #f1f5f9" }}>
                      <td style={{ padding: "10px 12px", textAlign: "center", fontWeight: 700 }}>{i + 1}</td>
                      <td style={{ padding: "6px 10px" }}>
                        <input
                          type="text"
                          value={d.observation}
                          onChange={(e) => handleDefectChange(d.id, "observation", e.target.value)}
                          placeholder="Describe defect..."
                          style={{ ...inputStyle, padding: "6px 10px" }}
                        />
                      </td>
                      <td style={{ padding: "6px 10px" }}>
                        <input
                          type="number"
                          min={1}
                          value={d.qtyAffected}
                          onChange={(e) => handleDefectChange(d.id, "qtyAffected", Number(e.target.value))}
                          style={{ ...inputStyle, padding: "6px 10px" }}
                        />
                      </td>
                      <td style={{ padding: "6px 10px" }}>
                        <input
                          type="text"
                          value={d.identification}
                          onChange={(e) => handleDefectChange(d.id, "identification", e.target.value)}
                          placeholder="e.g. Lot A-14, Side panel"
                          style={{ ...inputStyle, padding: "6px 10px" }}
                        />
                      </td>
                      <td style={{ padding: "6px 10px" }}>
                        <input
                          type="text"
                          value={d.actionTaken}
                          onChange={(e) => handleDefectChange(d.id, "actionTaken", e.target.value)}
                          placeholder="e.g. Send to rework"
                          style={{ ...inputStyle, padding: "6px 10px" }}
                        />
                      </td>
                      <td style={{ padding: "6px 10px", textAlign: "center" }}>
                        <button
                          type="button"
                          onClick={() => handleRemoveDefect(d.id)}
                          style={{
                            background: "#fee2e2",
                            color: "#dc2626",
                            border: "none",
                            borderRadius: 6,
                            padding: "4px 8px",
                            cursor: "pointer",
                            fontSize: 12,
                          }}
                        >
                          ✕
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* ============================================================ */}
        {/* SECTION E: HANDOVER & F: APPROVAL SIGN-OFFS */}
        {/* ============================================================ */}
        <div>
          <div
            style={{
              fontSize: 14,
              fontWeight: 800,
              color: "#0f172a",
              textTransform: "uppercase",
              letterSpacing: "0.04em",
              marginBottom: 14,
              display: "flex",
              alignItems: "center",
              gap: 8,
            }}
          >
            <span style={{ background: "#0f172a", color: "#fff", width: 22, height: 22, borderRadius: "50%", display: "inline-flex", alignItems: "center", justifyContent: "center", fontSize: 12 }}>
              E
            </span>
            <span>Handover, Verification & Approval Sign-offs</span>
          </div>

          {/* Handover Details */}
          <div
            style={{
              background: "#f8fafc",
              border: "1px solid #e2e8f0",
              borderRadius: 12,
              padding: "18px 24px",
              display: "grid",
              gridTemplateColumns: "1fr 1fr 1fr",
              gap: 16,
              marginBottom: 20,
            }}
          >
            <div>
              <label style={labelStyle}>Disposition *</label>
              <select
                value={disposition}
                onChange={(e) => setDisposition(e.target.value)}
                style={inputStyle}
              >
                <option value="Release to Secondary MS">Release to Secondary MS</option>
                <option value="Rework">Rework</option>
                <option value="Hold / Quarantine">Hold / Quarantine</option>
                <option value="Reject">Reject</option>
                <option value="Other">Other</option>
              </select>
            </div>

            <div>
              <label style={labelStyle}>Handover To / Next Process</label>
              <input
                type="text"
                value={nextProcess}
                onChange={(e) => setNextProcess(e.target.value)}
                placeholder="e.g. Secondary Machine Shop (Assembly)"
                style={inputStyle}
              />
            </div>

            <div>
              <label style={labelStyle}>Handover Date / Time</label>
              <input
                type="text"
                value={handoverDateTime}
                onChange={(e) => setHandoverDateTime(e.target.value)}
                style={inputStyle}
              />
            </div>
          </div>

          {/* 3 Sign-Off Boxes */}
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "1fr 1fr 1fr",
              gap: 16,
            }}
          >
            {/* 1. Inspected By */}
            <div
              style={{
                border: "1px solid #bfdbfe",
                background: "#f0fdf4",
                borderRadius: 10,
                padding: "16px 18px",
              }}
            >
              <div style={{ fontSize: 11, fontWeight: 800, color: "#166534", textTransform: "uppercase" }}>
                1. Inspected By (QC Inspector)
              </div>
              <div style={{ fontSize: 15, fontWeight: 800, color: "#0f172a", marginTop: 6 }}>
                {inspector}
              </div>
              <div style={{ fontSize: 12, color: "#15803d", marginTop: 4, fontWeight: 600 }}>
                ✓ Digital Sign Verified ({date})
              </div>
            </div>

            {/* 2. Supervisor */}
            <div
              style={{
                border: "1px solid #cbd5e1",
                background: "#ffffff",
                borderRadius: 10,
                padding: "16px 18px",
              }}
            >
              <div style={{ fontSize: 11, fontWeight: 800, color: "#475569", textTransform: "uppercase" }}>
                2. Machine Shop Supervisor
              </div>
              <input
                type="text"
                value={supervisorName}
                onChange={(e) => setSupervisorName(e.target.value)}
                placeholder="Supervisor name & sign..."
                style={{ ...inputStyle, marginTop: 6 }}
              />
            </div>

            {/* 3. Quality Release */}
            <div
              style={{
                border: "1px solid #cbd5e1",
                background: "#ffffff",
                borderRadius: 10,
                padding: "16px 18px",
              }}
            >
              <div style={{ fontSize: 11, fontWeight: 800, color: "#475569", textTransform: "uppercase" }}>
                3. Quality Release / Approval
              </div>
              <input
                type="text"
                value={approvalName}
                onChange={(e) => setApprovalName(e.target.value)}
                placeholder="Head of Quality approval..."
                style={{ ...inputStyle, marginTop: 6 }}
              />
            </div>
          </div>
        </div>

        {/* Note from Document */}
        <div
          style={{
            fontSize: 12,
            color: "#64748b",
            fontStyle: "italic",
            background: "#f8fafc",
            padding: "10px 16px",
            borderRadius: 8,
            borderLeft: "3px solid #2563eb",
          }}
        >
          Note: Record actual measurements against approved drawing/spec. Mark N/A where not applicable. Segregate HOLD/REJECTED parts; do not transfer without authorized Quality release.
        </div>

        {/* Submit & Cancel Actions */}
        <div style={{ display: "flex", justifyContent: "flex-end", gap: 14, paddingTop: 10 }}>
          <button
            type="button"
            onClick={onCancel}
            style={{
              padding: "12px 24px",
              borderRadius: 8,
              border: "1px solid #cbd5e1",
              background: "#ffffff",
              color: "#475569",
              fontWeight: 700,
              fontSize: 14,
              cursor: "pointer",
            }}
          >
            Cancel
          </button>

          <button
            type="submit"
            style={{
              padding: "12px 32px",
              borderRadius: 8,
              border: "none",
              background: "#0f172a",
              color: "#ffffff",
              fontWeight: 800,
              fontSize: 15,
              cursor: "pointer",
              boxShadow: "0 4px 12px rgba(15, 23, 42, 0.2)",
            }}
          >
            Submit & Generate Quality Report →
          </button>
        </div>
      </form>
    </div>
  );
}

const labelStyle: React.CSSProperties = {
  display: "block",
  fontSize: 12,
  fontWeight: 700,
  color: "#334155",
  marginBottom: 6,
  letterSpacing: "0.01em",
};

const inputStyle: React.CSSProperties = {
  width: "100%",
  padding: "9px 12px",
  borderRadius: 8,
  border: "1px solid #cbd5e1",
  fontSize: 13,
  outline: "none",
  boxSizing: "border-box",
  background: "#ffffff",
  color: "#0f172a",
};
