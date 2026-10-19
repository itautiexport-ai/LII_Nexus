import React from "react";
import { PmsInspectionReportData } from "./PrimaryMachineShopInspectionForm";

interface Props {
  report: PmsInspectionReportData;
  onClose: () => void;
}

export default function PrimaryMachineShopCertificateModal({ report, onClose }: Props) {
  const handlePrint = () => {
    window.print();
  };

  return (
    <div
      style={{
        position: "fixed",
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        background: "rgba(15, 23, 42, 0.65)",
        backdropFilter: "blur(5px)",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        zIndex: 1100,
        padding: 20,
        overflowY: "auto",
      }}
    >
      <div
        style={{
          background: "#ffffff",
          borderRadius: 16,
          maxWidth: 880,
          width: "100%",
          maxHeight: "92vh",
          overflowY: "auto",
          padding: "36px 40px",
          boxShadow: "0 25px 50px -12px rgba(0, 0, 0, 0.25)",
          border: "1px solid #e2e8f0",
          fontFamily: "-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif",
          position: "relative",
        }}
      >
        {/* Top Control Bar (Non-printable) */}
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            marginBottom: 20,
            paddingBottom: 14,
            borderBottom: "1px solid #e2e8f0",
          }}
        >
          <div style={{ display: "flex", gap: 10, alignItems: "center" }}>
            <span style={{ fontSize: 13, background: "#ecfdf5", color: "#166534", padding: "4px 10px", borderRadius: 6, fontWeight: 700 }}>
              ✓ Verified Inspection Record
            </span>
            <span style={{ fontSize: 13, color: "#64748b" }}>
              ID: <b>{report.reportNo}</b>
            </span>
          </div>

          <div style={{ display: "flex", gap: 10 }}>
            <button
              onClick={handlePrint}
              style={{
                background: "#0f172a",
                color: "#ffffff",
                border: "none",
                padding: "8px 16px",
                borderRadius: 6,
                fontSize: 13,
                fontWeight: 700,
                cursor: "pointer",
                display: "flex",
                alignItems: "center",
                gap: 6,
              }}
            >
              <span>🖨️</span>
              <span>Print / Save PDF</span>
            </button>
            <button
              onClick={onClose}
              style={{
                background: "#f1f5f9",
                border: "1px solid #cbd5e1",
                color: "#475569",
                padding: "8px 14px",
                borderRadius: 6,
                fontSize: 13,
                fontWeight: 700,
                cursor: "pointer",
              }}
            >
              ✕ Close
            </button>
          </div>
        </div>

        {/* Printable Document Body */}
        <div
          id="printable-iqc-report"
          style={{
            border: "2px solid #0f172a",
            padding: "24px 28px",
            background: "#ffffff",
          }}
        >
          {/* Header with Logo */}
          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
              borderBottom: "2px solid #0f172a",
              paddingBottom: 16,
              marginBottom: 16,
            }}
          >
            <div style={{ display: "flex", alignItems: "center", gap: 16 }}>
              <img
                src="/logo.jpg"
                alt="Laxmi Ideal Interiors Logo"
                style={{
                  width: 64,
                  height: 64,
                  objectFit: "contain",
                }}
                onError={(e) => {
                  (e.currentTarget as HTMLElement).style.display = "none";
                }}
              />
              <div>
                <h1 style={{ fontSize: 18, fontWeight: 900, color: "#0f172a", margin: 0, letterSpacing: "0.04em" }}>
                  LAXMI IDEAL INTERIORS
                </h1>
                <h2 style={{ fontSize: 14, fontWeight: 800, color: "#1d4ed8", margin: "2px 0 0 0" }}>
                  PRIMARY MACHINE SHOP – QUALITY INSPECTION REPORT
                </h2>
              </div>
            </div>

            <div style={{ textAlign: "right", fontSize: 11, color: "#334155" }}>
              <div>Form No.: <b>LII/QC/PMS/01</b></div>
              <div>Revision: <b>01</b></div>
              <div>Effective Date: <b>{report.date}</b></div>
            </div>
          </div>

          {/* Table A: Production & Inspection Details */}
          <div style={{ marginBottom: 14 }}>
            <div style={{ fontSize: 11, fontWeight: 800, color: "#0f172a", textTransform: "uppercase", marginBottom: 4 }}>
              A. PRODUCTION & INSPECTION DETAILS
            </div>
            <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 11, border: "1px solid #0f172a" }}>
              <tbody>
                <tr>
                  <td style={thCell}>Report No.:</td>
                  <td style={tdCell}><b>{report.reportNo}</b></td>
                  <td style={thCell}>Inspector Name:</td>
                  <td style={tdCell}><b>{report.inspector}</b></td>
                  <td style={thCell}>Alias Name:</td>
                  <td style={tdCell}>{report.aliasName || "N/A"}</td>
                  <td style={thCell}>Planned Qty:</td>
                  <td style={tdCell}><b>{report.plannedQty}</b></td>
                </tr>
                <tr>
                  <td style={thCell}>SKU No.:</td>
                  <td style={tdCell}>{report.skuNo}</td>
                  <td style={thCell}>Shift:</td>
                  <td style={tdCell}>{report.shift}</td>
                  <td style={thCell}>Job Card:</td>
                  <td style={tdCell}><b>{report.jobCard}</b></td>
                  <td style={thCell}>Date:</td>
                  <td style={tdCell}>{report.date}</td>
                </tr>
                <tr>
                  <td style={thCell}>Drawing / Rev:</td>
                  <td style={tdCell}>{report.drawingRev}</td>
                  <td style={thCell}>Operator:</td>
                  <td style={tdCell}>{report.operator || "N/A"}</td>
                  <td style={thCell}>Component Name:</td>
                  <td style={tdCell}><b>{report.componentName}</b></td>
                  <td style={thCell}>Inspected Qty:</td>
                  <td style={tdCell}><b>{report.inspectedQty}</b></td>
                </tr>
              </tbody>
            </table>
          </div>

          {/* Table B: 13 Process Checkpoints */}
          <div style={{ marginBottom: 14 }}>
            <div style={{ fontSize: 11, fontWeight: 800, color: "#0f172a", textTransform: "uppercase", marginBottom: 4 }}>
              B. PRIMARY MACHINE SHOP PROCESS CHECKPOINTS
            </div>
            <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 10, border: "1px solid #0f172a" }}>
              <thead>
                <tr style={{ background: "#f1f5f9", textAlign: "left" }}>
                  <th style={{ ...borderCell, width: 28, textAlign: "center" }}>Sr.</th>
                  <th style={{ ...borderCell, width: 140 }}>Process / Checkpoint</th>
                  <th style={borderCell}>Acceptance Requirement</th>
                  <th style={{ ...borderCell, width: 170 }}>Actual Observation</th>
                  <th style={{ ...borderCell, width: 90, textAlign: "center" }}>Result</th>
                </tr>
              </thead>
              <tbody>
                {report.checkpoints.map((cp) => (
                  <tr key={cp.id}>
                    <td style={{ ...borderCell, textAlign: "center", fontWeight: 700 }}>{cp.id}</td>
                    <td style={{ ...borderCell, fontWeight: 700, color: "#0f172a" }}>{cp.title}</td>
                    <td style={borderCell}>{cp.requirement}</td>
                    <td style={borderCell}>{cp.observation || ""}</td>
                    <td style={{ ...borderCell, textAlign: "center", fontWeight: 800 }}>
                      <span
                        style={{
                          color:
                            cp.result === "Pass"
                              ? "#16a34a"
                              : cp.result === "Fail"
                              ? "#dc2626"
                              : "#64748b",
                        }}
                      >
                        [ {cp.result === "Pass" ? "✓" : cp.result === "Fail" ? "✕" : "-"} ] {cp.result}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Section C: Summary & Status */}
          <div style={{ marginBottom: 14 }}>
            <div style={{ fontSize: 11, fontWeight: 800, color: "#0f172a", textTransform: "uppercase", marginBottom: 4 }}>
              C. INSPECTION SUMMARY & D. DEFECT LOG
            </div>
            <div style={{ display: "flex", justifyContent: "space-between", background: "#f8fafc", padding: "8px 12px", border: "1px solid #0f172a", fontSize: 11 }}>
              <div>Accepted Qty: <b>{report.acceptedQty}</b></div>
              <div>Rejected Qty: <b style={{ color: "#dc2626" }}>{report.rejectedQty}</b></div>
              <div>Rework Qty: <b style={{ color: "#d97706" }}>{report.reworkQty}</b></div>
              <div>Hold Qty: <b>{report.holdQty}</b></div>
              <div>Hold Tag No: <b>{report.holdTagNo || "N/A"}</b></div>
              <div>
                Overall Status:{" "}
                <b
                  style={{
                    color:
                      report.overallStatus === "ACCEPTED"
                        ? "#16a34a"
                        : report.overallStatus === "REJECTED"
                        ? "#dc2626"
                        : "#d97706",
                  }}
                >
                  [ {report.overallStatus} ]
                </b>
              </div>
            </div>

            {/* Defect Details Table if any */}
            {report.defects && report.defects.length > 0 && (
              <div style={{ marginTop: 8 }}>
                <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 10, border: "1px solid #0f172a" }}>
                  <thead>
                    <tr style={{ background: "#fee2e2" }}>
                      <th style={{ ...borderCell, width: 28 }}>Sr.</th>
                      <th style={borderCell}>Defect / Observation</th>
                      <th style={{ ...borderCell, width: 90 }}>Qty. Affected</th>
                      <th style={{ ...borderCell, width: 140 }}>Part / Batch ID</th>
                      <th style={{ ...borderCell, width: 140 }}>Action Taken</th>
                    </tr>
                  </thead>
                  <tbody>
                    {report.defects.map((d, i) => (
                      <tr key={d.id}>
                        <td style={{ ...borderCell, textAlign: "center" }}>{i + 1}</td>
                        <td style={borderCell}>{d.observation}</td>
                        <td style={{ ...borderCell, textAlign: "center" }}>{d.qtyAffected}</td>
                        <td style={borderCell}>{d.identification}</td>
                        <td style={borderCell}>{d.actionTaken}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>

          {/* Section E: Handover & F: Verification */}
          <div>
            <div style={{ fontSize: 11, fontWeight: 800, color: "#0f172a", textTransform: "uppercase", marginBottom: 4 }}>
              E. HANDOVER & F. VERIFICATION & APPROVAL
            </div>
            <div style={{ border: "1px solid #0f172a", padding: "8px 12px", fontSize: 11, marginBottom: 8, background: "#f8fafc" }}>
              <span style={{ marginRight: 16 }}>
                Disposition: <b>[ ✓ ] {report.disposition}</b>
              </span>
              <span style={{ marginRight: 16 }}>
                Handover To / Next Process: <b>{report.nextProcess}</b>
              </span>
              <span>
                Date / Time: <b>{report.handoverDateTime}</b>
              </span>
            </div>

            <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 11, border: "1px solid #0f172a" }}>
              <thead>
                <tr style={{ background: "#f1f5f9" }}>
                  <th style={{ ...borderCell, width: "33.3%" }}>Inspected By (QC Inspector)</th>
                  <th style={{ ...borderCell, width: "33.3%" }}>Primary Machine Shop Supervisor</th>
                  <th style={{ ...borderCell, width: "33.3%" }}>Quality Release / Approval</th>
                </tr>
              </thead>
              <tbody>
                <tr>
                  <td style={{ ...borderCell, padding: 12 }}>
                    <div>Name: <b>{report.inspector}</b></div>
                    <div style={{ color: "#16a34a", marginTop: 4, fontWeight: 700 }}>✓ Verified ({report.date})</div>
                  </td>
                  <td style={{ ...borderCell, padding: 12 }}>
                    <div>Name: <b>{report.supervisorName || "—"}</b></div>
                    <div style={{ color: "#64748b", marginTop: 4 }}>Sign: ___________________</div>
                  </td>
                  <td style={{ ...borderCell, padding: 12 }}>
                    <div>Name: <b>{report.approvalName || "—"}</b></div>
                    <div style={{ color: "#64748b", marginTop: 4 }}>Sign: ___________________</div>
                  </td>
                </tr>
              </tbody>
            </table>
          </div>

          {/* Footer Note */}
          <div style={{ fontSize: 9, color: "#64748b", fontStyle: "italic", marginTop: 10, textAlign: "center" }}>
            Note: Record actual measurements against approved drawing/spec. Mark N/A where not applicable. Segregate HOLD/REJECTED parts; do not transfer without authorized Quality release.
          </div>
        </div>

        <div style={{ marginTop: 20, textAlign: "right" }}>
          <button
            onClick={onClose}
            style={{
              padding: "10px 24px",
              borderRadius: 8,
              border: "none",
              background: "#0f172a",
              color: "#ffffff",
              fontWeight: 700,
              cursor: "pointer",
            }}
          >
            Done
          </button>
        </div>
      </div>
    </div>
  );
}

const thCell: React.CSSProperties = {
  background: "#f8fafc",
  fontWeight: 700,
  color: "#475569",
  padding: "4px 8px",
  border: "1px solid #0f172a",
  whiteSpace: "nowrap",
  width: "12%",
};

const tdCell: React.CSSProperties = {
  padding: "4px 8px",
  border: "1px solid #0f172a",
  width: "13%",
};

const borderCell: React.CSSProperties = {
  border: "1px solid #0f172a",
  padding: "5px 8px",
};
