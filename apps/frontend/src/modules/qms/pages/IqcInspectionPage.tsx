import React, { useEffect, useState } from "react";
import { departmentsApi, DepartmentRecord } from "../../admin/organization/departments/api/departmentsApi";
import { masterDataApi, QcName } from "../../admin/masterdata/api/masterDataApi";
import PrimaryMachineShopInspectionForm, { PmsInspectionReportData } from "../components/PrimaryMachineShopInspectionForm";
import PrimaryMachineShopCertificateModal from "../components/PrimaryMachineShopCertificateModal";

export interface IqcRecord {
  id: string;
  reportNumber: string;
  date: string;
  departmentName: string;
  inspector: string;
  supplierName: string;
  challanNumber: string;
  category: "Timber & Wood" | "Sheet & Board" | "Hardware & Fittings" | "Paints & Chemicals" | "Packaging & Others";
  itemCode: string;
  itemName: string;
  lotQuantity: number;
  sampleSize: number;
  defectsCount: number;
  defectReason?: string;
  moisturePercentage?: number;
  status: "Accepted" | "Conditional" | "Rejected";
  remarks: string;
  attachmentName?: string;
  attachmentData?: string;
}

const STORAGE_KEY = "lii_nexus_qms_iqc_records";
const PMS_STORAGE_KEY = "lii_nexus_pms_iqc_reports";

const DEFAULT_RECORDS: IqcRecord[] = [
  {
    id: "iqc-001",
    reportNumber: "IQC-2026-0418",
    date: "2026-10-15",
    departmentName: "WOOD STORE",
    inspector: "Vipin Sharma",
    supplierName: "Timber Craft Global Ltd",
    challanNumber: "CH-88291",
    category: "Timber & Wood",
    itemCode: "WD-TEAK-2X4",
    itemName: "Burma Teak Wood Planks 2x4",
    lotQuantity: 450,
    sampleSize: 80,
    defectsCount: 1,
    defectReason: "1 plank with minor end-split (within trimming margin)",
    moisturePercentage: 11.4,
    status: "Accepted",
    remarks: "Moisture content uniformly below 12.0%. Straight grain, acceptable sapwood margin.",
  },
  {
    id: "iqc-002",
    reportNumber: "IQC-2026-0417",
    date: "2026-10-14",
    departmentName: "Warehouse",
    inspector: "Vipin Sharma",
    supplierName: "Century Plyboards Ltd",
    challanNumber: "CH-88280",
    category: "Sheet & Board",
    itemCode: "PLY-BWR-18MM",
    itemName: "18mm BWR Grade Marine Plywood 8x4",
    lotQuantity: 120,
    sampleSize: 20,
    defectsCount: 0,
    defectReason: "None",
    moisturePercentage: 9.8,
    status: "Accepted",
    remarks: "Thickness caliper test: 18.05mm average. No hollow spots or face delamination.",
  },
  {
    id: "iqc-003",
    reportNumber: "IQC-2026-0416",
    date: "2026-10-14",
    departmentName: "Warehouse",
    inspector: "Amit Verma",
    supplierName: "Apex Fasteners & Fittings",
    challanNumber: "CH-88275",
    category: "Hardware & Fittings",
    itemCode: "HDW-SLIDE-SOFT-450",
    itemName: "Soft-Close Telescopic Drawer Channel 450mm",
    lotQuantity: 600,
    sampleSize: 80,
    defectsCount: 5,
    defectReason: "Damaged hydraulic damper cylinder causing latch failure",
    status: "Rejected",
    remarks: "Rejection threshold Re=4 exceeded. Lot quarantined in Red Bin. Debit Note / RTV requested.",
  },
];

export default function IqcInspectionPage() {
  // Master Data States
  const [departments, setDepartments] = useState<DepartmentRecord[]>([]);
  const [qcList, setQcList] = useState<QcName[]>([]);
  const [selectedDept, setSelectedDept] = useState<string>("");
  const [selectedQc, setSelectedQc] = useState<string>("");
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  // Quick Add QC State
  const [showAddQcModal, setShowAddQcModal] = useState(false);
  const [newQcNameInput, setNewQcNameInput] = useState("");
  const [isAddingQc, setIsAddingQc] = useState(false);

  // View state: 'entry' (front selection page) vs 'form' (filling report) vs 'history'
  const [viewMode, setViewMode] = useState<"entry" | "form" | "history">("entry");
  const [records, setRecords] = useState<IqcRecord[]>([]);
  const [lastSubmittedRecord, setLastSubmittedRecord] = useState<IqcRecord | null>(null);
  const [showCertificate, setShowCertificate] = useState(false);

  // PMS Specific Reports State
  const [pmsReports, setPmsReports] = useState<PmsInspectionReportData[]>([]);
  const [pmsReportToShow, setPmsReportToShow] = useState<PmsInspectionReportData | null>(null);

  const isPrimaryMachineShop = (deptName: string) => {
    if (!deptName) return false;
    const lower = deptName.toLowerCase();
    return lower.includes("primary") || lower.includes("pms");
  };

  // Form State
  const [formData, setFormData] = useState({
    date: new Date().toISOString().split("T")[0],
    supplierName: "",
    challanNumber: "",
    category: "Timber & Wood" as IqcRecord["category"],
    itemCode: "",
    itemName: "",
    lotQuantity: 100,
    sampleSize: 20,
    defectsCount: 0,
    defectReason: "",
    moisturePercentage: 11.2,
    status: "Accepted" as IqcRecord["status"],
    remarks: "",
    attachmentName: "",
    attachmentData: "",
  });

  const handleQuickAddQc = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newQcNameInput.trim()) return;
    try {
      setIsAddingQc(true);
      const created = await masterDataApi.createQcName(newQcNameInput.trim());
      setQcList((prev) => [...prev, created]);
      setSelectedQc(created.name);
      setNewQcNameInput("");
      setShowAddQcModal(false);
    } catch (err: any) {
      alert(err.message || "Failed to add QC Name");
    } finally {
      setIsAddingQc(false);
    }
  };

  useEffect(() => {
    loadMasterData();
    loadRecords();
  }, []);

  const loadMasterData = async () => {
    try {
      const [deptData, qcData] = await Promise.all([
        departmentsApi.list(),
        masterDataApi.getQcNames().catch(() => [
          { id: "1", name: "Vipin Sharma" },
          { id: "2", name: "Amit Verma" },
          { id: "3", name: "Manoj Singh" },
          { id: "4", name: "Rajesh Kumar" },
          { id: "5", name: "Sunil Dogra" },
        ]),
      ]);
      setDepartments(deptData || []);
      setQcList(qcData || []);

      if (deptData && deptData.length > 0 && !selectedDept) {
        setSelectedDept(deptData[0].name);
      }
      if (qcData && qcData.length > 0 && !selectedQc) {
        setSelectedQc(qcData[0].name);
      }
    } catch (err) {
      console.error("Failed to load master data", err);
    }
  };

  const loadRecords = () => {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(DEFAULT_RECORDS));
      setRecords(DEFAULT_RECORDS);
    } else {
      try {
        setRecords(JSON.parse(raw));
      } catch {
        setRecords(DEFAULT_RECORDS);
      }
    }

    const rawPms = localStorage.getItem(PMS_STORAGE_KEY);
    if (rawPms) {
      try {
        setPmsReports(JSON.parse(rawPms));
      } catch {
        setPmsReports([]);
      }
    }
  };

  const handleProceed = () => {
    if (!selectedDept || selectedDept === "") {
      setErrorMsg("Please select a Department to proceed.");
      return;
    }
    if (!selectedQc || selectedQc === "") {
      setErrorMsg("Please select a QC Name to proceed.");
      return;
    }
    setErrorMsg(null);
    setViewMode("form");
  };

  const handlePmsSubmitSuccess = (pmsReport: PmsInspectionReportData) => {
    const updatedPms = [pmsReport, ...pmsReports];
    setPmsReports(updatedPms);
    localStorage.setItem(PMS_STORAGE_KEY, JSON.stringify(updatedPms));

    // Also sync to unified records list
    const count = records.length + 420;
    const newRecord: IqcRecord = {
      id: pmsReport.id,
      reportNumber: pmsReport.reportNo,
      date: pmsReport.date,
      departmentName: pmsReport.department,
      inspector: pmsReport.inspector,
      supplierName: pmsReport.componentName + " (Job: " + pmsReport.jobCard + ")",
      challanNumber: pmsReport.jobCard,
      category: "Timber & Wood",
      itemCode: pmsReport.skuNo,
      itemName: pmsReport.componentName,
      lotQuantity: pmsReport.inspectedQty,
      sampleSize: pmsReport.inspectedQty,
      defectsCount: pmsReport.rejectedQty + pmsReport.reworkQty,
      defectReason: pmsReport.defects.length > 0 ? pmsReport.defects.map(d => d.observation).join("; ") : "None",
      status: pmsReport.overallStatus === "ACCEPTED" ? "Accepted" : pmsReport.overallStatus === "REJECTED" ? "Rejected" : "Conditional",
      remarks: `Form LII/QC/PMS/01. Disposition: ${pmsReport.disposition} to ${pmsReport.nextProcess}`,
    };

    const updated = [newRecord, ...records];
    setRecords(updated);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));

    setPmsReportToShow(pmsReport);
    setViewMode("entry");
  };

  const handleFormSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.supplierName || !formData.itemName) {
      alert("Please provide Supplier Name and Material Description.");
      return;
    }

    const count = records.length + 419;
    const newRecord: IqcRecord = {
      ...formData,
      id: "iqc-" + Date.now(),
      reportNumber: `IQC-2026-0${count}`,
      departmentName: selectedDept,
      inspector: selectedQc,
      moisturePercentage:
        formData.category === "Timber & Wood" || formData.category === "Sheet & Board"
          ? formData.moisturePercentage
          : undefined,
    };

    const updated = [newRecord, ...records];
    localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
    setRecords(updated);
    setLastSubmittedRecord(newRecord);
    setShowCertificate(true);
    setViewMode("entry");

    // Reset Form
    setFormData({
      date: new Date().toISOString().split("T")[0],
      supplierName: "",
      challanNumber: "",
      category: "Timber & Wood",
      itemCode: "",
      itemName: "",
      lotQuantity: 100,
      sampleSize: 20,
      defectsCount: 0,
      defectReason: "",
      moisturePercentage: 11.2,
      status: "Accepted",
      remarks: "",
      attachmentName: "",
      attachmentData: "",
    });
  };

  return (
    <div
      style={{
        minHeight: "calc(100vh - 80px)",
        display: "flex",
        flexDirection: "column",
        justifyContent: "space-between",
        padding: "20px 28px 40px 28px",
        maxWidth: 1080,
        margin: "0 auto",
        fontFamily: "-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif",
        boxSizing: "border-box",
      }}
    >
      {/* ============================================================ */}
      {/* MAIN CONTENT AREA */}
      {/* ============================================================ */}
      <div style={{ flex: 1 }}>

        {/* ------------------------------------------------------------ */}
        {/* VIEW 1: FRONT ENTRY PORTAL (DEFAULT) */}
        {/* ------------------------------------------------------------ */}
        {viewMode === "entry" && (
          <div>
            {/* Success Alert if just submitted */}
            {lastSubmittedRecord && !showCertificate && (
              <div
                style={{
                  background: "#dcfce7",
                  border: "1px solid #86efac",
                  color: "#166534",
                  padding: "10px 18px",
                  borderRadius: 12,
                  marginBottom: 16,
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "center",
                }}
              >
                <span>
                  ✓ <b>Report {lastSubmittedRecord.reportNumber}</b> has been successfully recorded for{" "}
                  <b>{lastSubmittedRecord.departmentName}</b> by <b>{lastSubmittedRecord.inspector}</b>.
                </span>
                <button
                  onClick={() => setShowCertificate(true)}
                  style={{
                    background: "#16a34a",
                    color: "#fff",
                    border: "none",
                    padding: "5px 12px",
                    borderRadius: 6,
                    fontSize: 12,
                    fontWeight: 700,
                    cursor: "pointer",
                  }}
                >
                  View Certificate
                </button>
              </div>
            )}

            {/* Central Portal Card */}
            <div
              style={{
                background: "#ffffff",
                borderRadius: 16,
                padding: "36px 40px",
                color: "#0f172a",
                boxShadow: "0 10px 25px -5px rgba(15, 23, 42, 0.06), 0 8px 10px -6px rgba(15, 23, 42, 0.04)",
                border: "1px solid #e2e8f0",
              }}
            >
              {/* 1. TOP SELECTION: QC Name & Department Dropdowns */}
              <div
                style={{
                  background: "#f8fafc",
                  border: "1px solid #e2e8f0",
                  borderRadius: 14,
                  padding: "20px 24px",
                  display: "grid",
                  gridTemplateColumns: "1fr 1fr",
                  gap: 20,
                  marginBottom: 26,
                }}
              >
                {/* 1. QC Name Dropdown (Upper/First) */}
                <div>
                  <label
                    style={{
                      display: "block",
                      fontSize: 13,
                      fontWeight: 700,
                      color: "#334155",
                      marginBottom: 8,
                      letterSpacing: "0.01em",
                    }}
                  >
                    👤 QC Name
                  </label>
                  <select
                    value={selectedQc}
                    onChange={(e) => {
                      setSelectedQc(e.target.value);
                      setErrorMsg(null);
                    }}
                    style={{
                      width: "100%",
                      padding: "11px 14px",
                      borderRadius: 8,
                      border: "1px solid #cbd5e1",
                      background: "#ffffff",
                      color: "#0f172a",
                      fontSize: 14,
                      fontWeight: 600,
                      outline: "none",
                      cursor: "pointer",
                      boxSizing: "border-box",
                      boxShadow: "0 1px 2px rgba(0,0,0,0.05)",
                    }}
                  >
                    <option value="" disabled>-- Select QC Name --</option>
                    {qcList.map((qc) => (
                      <option key={qc.id} value={qc.name}>
                        {qc.name}
                      </option>
                    ))}
                  </select>
                </div>

                {/* 2. Department Dropdown */}
                <div>
                  <label
                    style={{
                      display: "block",
                      fontSize: 13,
                      fontWeight: 700,
                      color: "#334155",
                      marginBottom: 8,
                      letterSpacing: "0.01em",
                    }}
                  >
                    🏢 Department
                  </label>
                  <select
                    value={selectedDept}
                    onChange={(e) => {
                      setSelectedDept(e.target.value);
                      setErrorMsg(null);
                    }}
                    style={{
                      width: "100%",
                      padding: "11px 14px",
                      borderRadius: 8,
                      border: "1px solid #cbd5e1",
                      background: "#ffffff",
                      color: "#0f172a",
                      fontSize: 14,
                      fontWeight: 600,
                      outline: "none",
                      cursor: "pointer",
                      boxSizing: "border-box",
                      boxShadow: "0 1px 2px rgba(0,0,0,0.05)",
                    }}
                  >
                    <option value="" disabled>-- Select Department --</option>
                    {departments.map((dept) => (
                      <option key={dept.id} value={dept.name}>
                        {dept.name} {dept.code ? `(${dept.code})` : ""}
                      </option>
                    ))}
                  </select>

                  {/* Dynamic Format Indicator */}
                  {selectedDept && (
                    isPrimaryMachineShop(selectedDept) ? (
                      <div style={{ marginTop: 8, fontSize: 12, color: "#166534", background: "#f0fdf4", border: "1px solid #bbf7d0", padding: "4px 10px", borderRadius: 6, fontWeight: 700, display: "inline-flex", alignItems: "center", gap: 6 }}>
                        <span>⚡</span>
                        <span>Format Loaded: LII/QC/PMS/01 (Primary Machine Shop Report)</span>
                      </div>
                    ) : (
                      <div style={{ marginTop: 8, fontSize: 12, color: "#64748b", fontWeight: 500 }}>
                        Standard Inward Format (Department-specific format will load once configured)
                      </div>
                    )
                  )}
                </div>
              </div>

              {/* 2. HEADING SECTION (Placed below QC Name selection) */}
              <div style={{ marginBottom: 12 }}>
                <span
                  style={{
                    background: "#eff6ff",
                    color: "#1d4ed8",
                    border: "1px solid #bfdbfe",
                    padding: "5px 14px",
                    borderRadius: 20,
                    fontSize: 12,
                    fontWeight: 700,
                    letterSpacing: "0.04em",
                    textTransform: "uppercase",
                    display: "inline-flex",
                    alignItems: "center",
                    gap: 6,
                  }}
                >
                  <span>🛡️</span>
                  <span>QMS Gate 1 • Inward Inspection</span>
                </span>
              </div>

              {/* Main Heading */}
              <h1
                style={{
                  fontSize: 28,
                  fontWeight: 800,
                  margin: "0 0 10px 0",
                  letterSpacing: "-0.02em",
                  color: "#0f172a",
                  lineHeight: 1.25,
                }}
              >
                Incoming Quality Material Report
              </h1>

              {/* Instruction Subtitle */}
              <p
                style={{
                  fontSize: 15,
                  color: "#64748b",
                  margin: "0 0 24px 0",
                  lineHeight: 1.5,
                  maxWidth: 720,
                  fontWeight: 500,
                }}
              >
                Kindly select your department and then QC name and then proceed further to fill the IQC report
              </p>

              {/* Error Message */}
              {errorMsg && (
                <div style={{ color: "#dc2626", fontSize: 13, fontWeight: 600, marginBottom: 16 }}>
                  ⚠️ {errorMsg}
                </div>
              )}

              {/* Action Buttons */}
              <div style={{ display: "flex", gap: 14, alignItems: "center", flexWrap: "wrap" }}>
                <button
                  onClick={handleProceed}
                  style={{
                    background: "#0f172a",
                    color: "#ffffff",
                    border: "none",
                    padding: "13px 28px",
                    borderRadius: 10,
                    fontWeight: 700,
                    fontSize: 15,
                    cursor: "pointer",
                    boxShadow: "0 4px 12px rgba(15, 23, 42, 0.15)",
                    display: "flex",
                    alignItems: "center",
                    gap: 8,
                    transition: "transform 0.15s, background 0.15s",
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.background = "#1e293b";
                    e.currentTarget.style.transform = "translateY(-1px)";
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.background = "#0f172a";
                    e.currentTarget.style.transform = "translateY(0)";
                  }}
                >
                  <span>Proceed to Fill Report</span>
                  <span style={{ fontSize: 16 }}>→</span>
                </button>

                <button
                  onClick={() => setViewMode("history")}
                  style={{
                    background: "#ffffff",
                    color: "#475569",
                    border: "1px solid #cbd5e1",
                    padding: "12px 22px",
                    borderRadius: 10,
                    fontWeight: 600,
                    fontSize: 14,
                    cursor: "pointer",
                    boxShadow: "0 1px 2px rgba(0,0,0,0.05)",
                    transition: "background 0.15s",
                  }}
                  onMouseEnter={(e) => (e.currentTarget.style.background = "#f8fafc")}
                  onMouseLeave={(e) => (e.currentTarget.style.background = "#ffffff")}
                >
                  View Reports History ({records.length})
                </button>
              </div>
            </div>
          </div>
        )}

        {/* ------------------------------------------------------------ */}
        {/* VIEW 2: FILL REPORT FORM (DYNAMIC BY DEPARTMENT) */}
        {/* ------------------------------------------------------------ */}
        {viewMode === "form" && (
          isPrimaryMachineShop(selectedDept) ? (
            <PrimaryMachineShopInspectionForm
              department={selectedDept}
              inspector={selectedQc}
              onCancel={() => setViewMode("entry")}
              onSubmitSuccess={handlePmsSubmitSuccess}
            />
          ) : (
            <div
              style={{
                background: "#ffffff",
                borderRadius: 20,
                padding: "36px 40px",
                boxShadow: "0 10px 30px rgba(0, 0, 0, 0.08)",
                border: "1px solid #e2e8f0",
              }}
            >
            {/* Header with selected Dept & QC pills */}
            <div
              style={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "flex-start",
                borderBottom: "1px solid #f1f5f9",
                paddingBottom: 20,
                marginBottom: 24,
                flexWrap: "wrap",
                gap: 16,
              }}
            >
              <div>
                <span
                  style={{
                    background: "#ecfdf5",
                    color: "#065f46",
                    padding: "4px 12px",
                    borderRadius: 20,
                    fontSize: 12,
                    fontWeight: 800,
                    textTransform: "uppercase",
                    letterSpacing: "0.05em",
                  }}
                >
                  QMS Gate 1 • Inward Entry
                </span>
                <h2 style={{ fontSize: 24, fontWeight: 900, color: "#0f172a", margin: "6px 0 0 0" }}>
                  Incoming Quality Material Report Form
                </h2>
              </div>

              {/* Active Selection summary pills & Exit button */}
              <div style={{ display: "flex", gap: 10, alignItems: "center", flexWrap: "wrap" }}>
                <div style={{ background: "#f1f5f9", border: "1px solid #cbd5e1", padding: "6px 14px", borderRadius: 8, fontSize: 13, display: "flex", alignItems: "center", gap: 6 }}>
                  <span style={{ color: "#64748b" }}>🏢 Dept: </span>
                  <b style={{ color: "#0f172a" }}>{selectedDept}</b>
                  <span style={{ fontSize: 11, background: "#e2e8f0", color: "#475569", padding: "2px 6px", borderRadius: 4, fontWeight: 700 }}>🔒 Frozen</span>
                </div>
                <div style={{ background: "#f1f5f9", border: "1px solid #cbd5e1", padding: "6px 14px", borderRadius: 8, fontSize: 13, display: "flex", alignItems: "center", gap: 6 }}>
                  <span style={{ color: "#64748b" }}>👤 QC Inspector: </span>
                  <b style={{ color: "#0f172a" }}>{selectedQc}</b>
                  <span style={{ fontSize: 11, background: "#e2e8f0", color: "#475569", padding: "2px 6px", borderRadius: 4, fontWeight: 700 }}>🔒 Frozen</span>
                </div>
                <button
                  type="button"
                  onClick={() => setViewMode("entry")}
                  style={{
                    background: "#ffffff",
                    color: "#475569",
                    border: "1px solid #cbd5e1",
                    padding: "7px 14px",
                    borderRadius: 8,
                    fontWeight: 600,
                    fontSize: 13,
                    cursor: "pointer",
                    boxShadow: "0 1px 2px rgba(0,0,0,0.04)",
                  }}
                >
                  ← Exit Form
                </button>
              </div>
            </div>

            {/* Form */}
            <form onSubmit={handleFormSubmit} style={{ display: "flex", flexDirection: "column", gap: 18 }}>
              {/* Frozen Department & QC Inspector Fields */}
              <div
                style={{
                  background: "#f8fafc",
                  border: "1px solid #e2e8f0",
                  borderRadius: 12,
                  padding: "16px 20px",
                  display: "grid",
                  gridTemplateColumns: "1fr 1fr",
                  gap: 16,
                }}
              >
                <div>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 6 }}>
                    <label style={{ fontSize: 13, fontWeight: 700, color: "#475569" }}>
                      👤 QC Inspector Name
                    </label>
                    <span style={{ fontSize: 11, fontWeight: 700, color: "#64748b", background: "#e2e8f0", padding: "2px 6px", borderRadius: 4 }}>
                      🔒 Frozen / Seized
                    </span>
                  </div>
                  <input
                    type="text"
                    value={selectedQc}
                    readOnly
                    disabled
                    style={{
                      width: "100%",
                      padding: "10px 14px",
                      borderRadius: 8,
                      border: "1px solid #cbd5e1",
                      background: "#f1f5f9",
                      color: "#0f172a",
                      fontSize: 14,
                      fontWeight: 700,
                      cursor: "not-allowed",
                      boxSizing: "border-box",
                    }}
                  />
                </div>

                <div>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 6 }}>
                    <label style={{ fontSize: 13, fontWeight: 700, color: "#475569" }}>
                      🏢 Department
                    </label>
                    <span style={{ fontSize: 11, fontWeight: 700, color: "#64748b", background: "#e2e8f0", padding: "2px 6px", borderRadius: 4 }}>
                      🔒 Frozen / Seized
                    </span>
                  </div>
                  <input
                    type="text"
                    value={selectedDept}
                    readOnly
                    disabled
                    style={{
                      width: "100%",
                      padding: "10px 14px",
                      borderRadius: 8,
                      border: "1px solid #cbd5e1",
                      background: "#f1f5f9",
                      color: "#0f172a",
                      fontSize: 14,
                      fontWeight: 700,
                      cursor: "not-allowed",
                      boxSizing: "border-box",
                    }}
                  />
                </div>
              </div>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }}>
                <div>
                  <label style={{ display: "block", fontSize: 13, fontWeight: 700, color: "#334155", marginBottom: 6 }}>
                    Supplier / Vendor Name *
                  </label>
                  <input
                    type="text"
                    required
                    value={formData.supplierName}
                    onChange={(e) => setFormData({ ...formData, supplierName: e.target.value })}
                    style={{ width: "100%", padding: "11px 14px", borderRadius: 8, border: "1px solid #cbd5e1", fontSize: 14, boxSizing: "border-box" }}
                    placeholder="e.g. Timber Craft Global Ltd"
                  />
                </div>
                <div>
                  <label style={{ display: "block", fontSize: 13, fontWeight: 700, color: "#334155", marginBottom: 6 }}>
                    Inward Challan / PO # *
                  </label>
                  <input
                    type="text"
                    required
                    value={formData.challanNumber}
                    onChange={(e) => setFormData({ ...formData, challanNumber: e.target.value })}
                    style={{ width: "100%", padding: "11px 14px", borderRadius: 8, border: "1px solid #cbd5e1", fontSize: 14, boxSizing: "border-box" }}
                    placeholder="e.g. CH-2026-99"
                  />
                </div>
              </div>

              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }}>
                <div>
                  <label style={{ display: "block", fontSize: 13, fontWeight: 700, color: "#334155", marginBottom: 6 }}>
                    Material Category *
                  </label>
                  <select
                    value={formData.category}
                    onChange={(e) => setFormData({ ...formData, category: e.target.value as any })}
                    style={{ width: "100%", padding: "11px 14px", borderRadius: 8, border: "1px solid #cbd5e1", fontSize: 14, boxSizing: "border-box", background: "#fff" }}
                  >
                    <option value="Timber & Wood">Timber & Wood</option>
                    <option value="Sheet & Board">Sheet & Board (Plywood/MDF)</option>
                    <option value="Hardware & Fittings">Hardware & Fittings</option>
                    <option value="Paints & Chemicals">Paints & Chemicals</option>
                    <option value="Packaging & Others">Packaging & Others</option>
                  </select>
                </div>
                <div>
                  <label style={{ display: "block", fontSize: 13, fontWeight: 700, color: "#334155", marginBottom: 6 }}>
                    Item Code / SKU
                  </label>
                  <input
                    type="text"
                    value={formData.itemCode}
                    onChange={(e) => setFormData({ ...formData, itemCode: e.target.value })}
                    style={{ width: "100%", padding: "11px 14px", borderRadius: 8, border: "1px solid #cbd5e1", fontSize: 14, boxSizing: "border-box" }}
                    placeholder="e.g. WD-TEAK-01"
                  />
                </div>
              </div>

              <div>
                <label style={{ display: "block", fontSize: 13, fontWeight: 700, color: "#334155", marginBottom: 6 }}>
                  Material / Part Description *
                </label>
                <input
                  type="text"
                  required
                  value={formData.itemName}
                  onChange={(e) => setFormData({ ...formData, itemName: e.target.value })}
                  style={{ width: "100%", padding: "11px 14px", borderRadius: 8, border: "1px solid #cbd5e1", fontSize: 14, boxSizing: "border-box" }}
                  placeholder="e.g. Burma Teak Wood Planks 2x4 (Rough Sawn)"
                />
              </div>

              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 16 }}>
                <div>
                  <label style={{ display: "block", fontSize: 13, fontWeight: 700, color: "#334155", marginBottom: 6 }}>
                    Inward Lot Qty *
                  </label>
                  <input
                    type="number"
                    min={1}
                    required
                    value={formData.lotQuantity}
                    onChange={(e) => setFormData({ ...formData, lotQuantity: parseInt(e.target.value) || 0 })}
                    style={{ width: "100%", padding: "11px 14px", borderRadius: 8, border: "1px solid #cbd5e1", fontSize: 14, boxSizing: "border-box" }}
                  />
                </div>
                <div>
                  <label style={{ display: "block", fontSize: 13, fontWeight: 700, color: "#334155", marginBottom: 6 }}>
                    Sample Size (AQL) *
                  </label>
                  <input
                    type="number"
                    min={1}
                    required
                    value={formData.sampleSize}
                    onChange={(e) => setFormData({ ...formData, sampleSize: parseInt(e.target.value) || 0 })}
                    style={{ width: "100%", padding: "11px 14px", borderRadius: 8, border: "1px solid #cbd5e1", fontSize: 14, boxSizing: "border-box" }}
                  />
                </div>
                <div>
                  <label style={{ display: "block", fontSize: 13, fontWeight: 700, color: "#334155", marginBottom: 6 }}>
                    Defects Found *
                  </label>
                  <input
                    type="number"
                    min={0}
                    required
                    value={formData.defectsCount}
                    onChange={(e) => setFormData({ ...formData, defectsCount: parseInt(e.target.value) || 0 })}
                    style={{ width: "100%", padding: "11px 14px", borderRadius: 8, border: "1px solid #cbd5e1", fontSize: 14, boxSizing: "border-box" }}
                  />
                </div>
              </div>

              {(formData.category === "Timber & Wood" || formData.category === "Sheet & Board") && (
                <div>
                  <label style={{ display: "block", fontSize: 13, fontWeight: 700, color: "#334155", marginBottom: 6 }}>
                    Moisture Content (% verified by digital pin meter)
                  </label>
                  <input
                    type="number"
                    step="0.1"
                    value={formData.moisturePercentage}
                    onChange={(e) => setFormData({ ...formData, moisturePercentage: parseFloat(e.target.value) || 0 })}
                    style={{ width: "100%", padding: "11px 14px", borderRadius: 8, border: "1px solid #cbd5e1", fontSize: 14, boxSizing: "border-box" }}
                    placeholder="e.g. 11.2 (Standard acceptance < 12.0%)"
                  />
                </div>
              )}

              <div>
                <label style={{ display: "block", fontSize: 13, fontWeight: 700, color: "#334155", marginBottom: 6 }}>
                  Final Quality Disposition Decision *
                </label>
                <select
                  value={formData.status}
                  onChange={(e) => setFormData({ ...formData, status: e.target.value as any })}
                  style={{
                    width: "100%",
                    padding: "11px 14px",
                    borderRadius: 8,
                    border: "1px solid #cbd5e1",
                    fontSize: 14,
                    fontWeight: 700,
                    boxSizing: "border-box",
                    background:
                      formData.status === "Accepted"
                        ? "#f0fdf4"
                        : formData.status === "Rejected"
                        ? "#fef2f2"
                        : "#fefce8",
                    color:
                      formData.status === "Accepted"
                        ? "#166534"
                        : formData.status === "Rejected"
                        ? "#991b1b"
                        : "#854d0e",
                  }}
                >
                  <option value="Accepted">Accepted (Send to Raw Material Store)</option>
                  <option value="Conditional">Conditional (Deviation Approved by HOD)</option>
                  <option value="Rejected">Rejected (Red Quarantine / Return to Vendor)</option>
                </select>
              </div>

              <div>
                <label style={{ display: "block", fontSize: 13, fontWeight: 700, color: "#334155", marginBottom: 6 }}>
                  Defect Description / Observations
                </label>
                <input
                  type="text"
                  value={formData.defectReason}
                  onChange={(e) => setFormData({ ...formData, defectReason: e.target.value })}
                  style={{ width: "100%", padding: "11px 14px", borderRadius: 8, border: "1px solid #cbd5e1", fontSize: 14, boxSizing: "border-box" }}
                  placeholder="e.g. 2 planks with knots exceeding 20mm diameter"
                />
              </div>

              <div>
                <label style={{ display: "block", fontSize: 13, fontWeight: 700, color: "#334155", marginBottom: 6 }}>
                  Inspector Remarks & Sign-off Notes
                </label>
                <textarea
                  rows={2}
                  value={formData.remarks}
                  onChange={(e) => setFormData({ ...formData, remarks: e.target.value })}
                  style={{ width: "100%", padding: "11px 14px", borderRadius: 8, border: "1px solid #cbd5e1", fontSize: 14, boxSizing: "border-box", resize: "vertical" }}
                  placeholder="Lot verified against purchase specification, batch tags applied..."
                />
              </div>

              {/* Submit Buttons */}
              <div style={{ display: "flex", justifyContent: "flex-end", gap: 12, marginTop: 12 }}>
                <button
                  type="button"
                  onClick={() => setViewMode("entry")}
                  style={{
                    padding: "12px 22px",
                    borderRadius: 10,
                    border: "1px solid #cbd5e1",
                    background: "#ffffff",
                    color: "#475569",
                    fontWeight: 700,
                    cursor: "pointer",
                  }}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  style={{
                    padding: "12px 28px",
                    borderRadius: 10,
                    border: "none",
                    background: "#065f46",
                    color: "#ffffff",
                    fontWeight: 800,
                    fontSize: 15,
                    cursor: "pointer",
                    boxShadow: "0 4px 14px rgba(6, 95, 70, 0.35)",
                  }}
                >
                  Submit & Issue IQC Report
                </button>
              </div>
            </form>
          </div>
          )
        )}

        {/* ------------------------------------------------------------ */}
        {/* VIEW 3: REPORTS HISTORY LIST */}
        {/* ------------------------------------------------------------ */}
        {viewMode === "history" && (
          <div
            style={{
              background: "#ffffff",
              borderRadius: 20,
              padding: "32px 36px",
              boxShadow: "0 10px 30px rgba(0, 0, 0, 0.08)",
              border: "1px solid #e2e8f0",
            }}
          >
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 20 }}>
              <div>
                <h2 style={{ fontSize: 22, fontWeight: 800, color: "#0f172a", margin: 0 }}>
                  Submitted IQC Reports History
                </h2>
                <p style={{ color: "#64748b", fontSize: 13, margin: "2px 0 0 0" }}>
                  All logged incoming inspections across factory departments
                </p>
              </div>
              <button
                onClick={() => setViewMode("entry")}
                style={{
                  background: "#065f46",
                  color: "#ffffff",
                  padding: "9px 18px",
                  borderRadius: 8,
                  border: "none",
                  fontWeight: 700,
                  fontSize: 13,
                  cursor: "pointer",
                }}
              >
                ← Back to Portal
              </button>
            </div>

            <div style={{ overflowX: "auto" }}>
              <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 13 }}>
                <thead>
                  <tr style={{ background: "#f8fafc", borderBottom: "1px solid #e2e8f0", textAlign: "left" }}>
                    <th style={{ padding: "10px 14px", color: "#475569", fontWeight: 600 }}>Report #</th>
                    <th style={{ padding: "10px 14px", color: "#475569", fontWeight: 600 }}>Date</th>
                    <th style={{ padding: "10px 14px", color: "#475569", fontWeight: 600 }}>Department</th>
                    <th style={{ padding: "10px 14px", color: "#475569", fontWeight: 600 }}>Supplier</th>
                    <th style={{ padding: "10px 14px", color: "#475569", fontWeight: 600 }}>Material</th>
                    <th style={{ padding: "10px 14px", color: "#475569", fontWeight: 600 }}>Outcome</th>
                    <th style={{ padding: "10px 14px", color: "#475569", fontWeight: 600 }}>QC Inspector</th>
                    <th style={{ padding: "10px 14px", color: "#475569", fontWeight: 600, textAlign: "right" }}>Action</th>
                  </tr>
                </thead>
                <tbody>
                  {records.map((r) => {
                    const badgeStyle =
                      r.status === "Accepted"
                        ? { bg: "#dcfce7", text: "#15803d" }
                        : r.status === "Rejected"
                        ? { bg: "#fee2e2", text: "#b91c1c" }
                        : { bg: "#fef3c7", text: "#b45309" };

                    return (
                      <tr key={r.id} style={{ borderBottom: "1px solid #f1f5f9" }}>
                        <td style={{ padding: "12px 14px", fontWeight: 700, color: "#1e293b" }}>
                          <div>{r.reportNumber}</div>
                          {isPrimaryMachineShop(r.departmentName) && (
                            <span style={{ fontSize: 10, background: "#dbeafe", color: "#1e40af", padding: "1px 6px", borderRadius: 4, fontWeight: 700 }}>
                              LII/QC/PMS/01
                            </span>
                          )}
                        </td>
                        <td style={{ padding: "12px 14px", color: "#64748b" }}>{r.date}</td>
                        <td style={{ padding: "12px 14px" }}>
                          <span style={{ background: "#eff6ff", color: "#1d4ed8", padding: "2px 8px", borderRadius: 4, fontSize: 11, fontWeight: 700 }}>
                            {r.departmentName}
                          </span>
                        </td>
                        <td style={{ padding: "12px 14px", fontWeight: 600 }}>{r.supplierName}</td>
                        <td style={{ padding: "12px 14px" }}>{r.itemName}</td>
                        <td style={{ padding: "12px 14px" }}>
                          <span style={{ background: badgeStyle.bg, color: badgeStyle.text, padding: "3px 8px", borderRadius: 10, fontSize: 11, fontWeight: 700 }}>
                            {r.status}
                          </span>
                        </td>
                        <td style={{ padding: "12px 14px", fontWeight: 600, color: "#334155" }}>{r.inspector}</td>
                        <td style={{ padding: "12px 14px", textAlign: "right" }}>
                          <button
                            onClick={() => {
                              const pmsMatch = pmsReports.find(
                                (p) => p.id === r.id || p.reportNo === r.reportNumber
                              );
                              if (pmsMatch) {
                                setPmsReportToShow(pmsMatch);
                              } else {
                                setLastSubmittedRecord(r);
                                setShowCertificate(true);
                              }
                            }}
                            style={{
                              background: "#0f172a",
                              color: "#ffffff",
                              border: "none",
                              padding: "6px 12px",
                              borderRadius: 6,
                              fontSize: 12,
                              fontWeight: 700,
                              cursor: "pointer",
                            }}
                          >
                            Certificate
                          </button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>

      {/* ============================================================ */}
      {/* QUALITY MOTTO & GENERAL INSTRUCTIONS FOOTER */}
      {/* ============================================================ */}
      <div
        style={{
          marginTop: 28,
          borderRadius: 14,
          background: "#ffffff",
          border: "1px solid #e2e8f0",
          boxShadow: "0 2px 8px -2px rgba(15, 23, 42, 0.05)",
          overflow: "hidden",
        }}
      >
        {/* Top Slang / Motto Banner */}
        <div
          style={{
            padding: "14px 24px",
            background: "linear-gradient(90deg, #0f172a 0%, #1e293b 100%)",
            color: "#ffffff",
            display: "flex",
            alignItems: "center",
            gap: 10,
          }}
        >
          <span style={{ fontSize: 18 }}>🎯</span>
          <span style={{ fontSize: 15, fontWeight: 800, color: "#f8fafc", letterSpacing: "0.01em" }}>
            Right First Time, Every Time.
          </span>
        </div>

        {/* Instructions Body */}
        <div style={{ padding: "20px 24px", background: "#f8fafc" }}>
          <div
            style={{
              fontSize: 12,
              fontWeight: 800,
              color: "#475569",
              textTransform: "uppercase",
              letterSpacing: "0.05em",
              marginBottom: 14,
              display: "flex",
              alignItems: "center",
              gap: 8,
            }}
          >
            <span>📋</span>
            <span>General Instructions for Filling the IQC Report</span>
          </div>

          <div
            style={{
              display: "grid",
              gridTemplateColumns: "1fr 1fr",
              gap: "10px 24px",
            }}
          >
            {[
              "Fill in all details correctly and clearly.",
              "Inspect the actual material/part before recording results.",
              "Record actual measurements and observations honestly.",
              "Mark Pass, Fail or N/A correctly.",
              "Do not leave any field blank; write N/A where applicable.",
              "Record all defects and actions taken.",
              "Ensure the report is complete, signed and submitted on time.",
              "Never guess measurements or fill in false information.",
            ].map((instruction, idx) => (
              <div
                key={idx}
                style={{
                  display: "flex",
                  alignItems: "flex-start",
                  gap: 10,
                  fontSize: 13,
                  color: idx === 7 ? "#b91c1c" : "#334155",
                  fontWeight: idx === 7 ? 600 : 500,
                  lineHeight: 1.45,
                }}
              >
                <span
                  style={{
                    color: idx === 7 ? "#dc2626" : "#2563eb",
                    fontWeight: 700,
                    fontSize: 14,
                    lineHeight: 1,
                    marginTop: 2,
                  }}
                >
                  {idx === 7 ? "⚠️" : "•"}
                </span>
                <span>{instruction}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* ============================================================ */}
      {/* MODAL: QUICK ADD QC NAME */}
      {/* ============================================================ */}
      {showAddQcModal && (
        <div
          style={{
            position: "fixed",
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            background: "rgba(15, 23, 42, 0.5)",
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
              maxWidth: 440,
              width: "100%",
              padding: 24,
              boxShadow: "0 20px 35px -10px rgba(0,0,0,0.25)",
              border: "1px solid #e2e8f0",
            }}
          >
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16 }}>
              <h3 style={{ margin: 0, fontSize: 18, fontWeight: 800, color: "#0f172a" }}>
                Add New QC Name
              </h3>
              <button
                onClick={() => setShowAddQcModal(false)}
                style={{ background: "transparent", border: "none", fontSize: 18, cursor: "pointer", color: "#64748b" }}
              >
                ✕
              </button>
            </div>
            <form onSubmit={handleQuickAddQc}>
              <div style={{ marginBottom: 16 }}>
                <label style={{ display: "block", fontSize: 13, fontWeight: 600, color: "#475569", marginBottom: 6 }}>
                  Quality Controller / Inspector Name
                </label>
                <input
                  type="text"
                  value={newQcNameInput}
                  onChange={(e) => setNewQcNameInput(e.target.value)}
                  placeholder="e.g. Ramesh Chandra"
                  required
                  style={{
                    width: "100%",
                    padding: "10px 14px",
                    borderRadius: 8,
                    border: "1px solid #cbd5e1",
                    fontSize: 14,
                    outline: "none",
                    boxSizing: "border-box",
                  }}
                  autoFocus
                />
              </div>
              <div style={{ display: "flex", justifyContent: "flex-end", gap: 10 }}>
                <button
                  type="button"
                  onClick={() => setShowAddQcModal(false)}
                  style={{
                    padding: "8px 16px",
                    borderRadius: 8,
                    border: "1px solid #cbd5e1",
                    background: "#f8fafc",
                    color: "#475569",
                    fontWeight: 600,
                    fontSize: 13,
                    cursor: "pointer",
                  }}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isAddingQc}
                  style={{
                    padding: "8px 18px",
                    borderRadius: 8,
                    border: "none",
                    background: "#0f172a",
                    color: "#ffffff",
                    fontWeight: 700,
                    fontSize: 13,
                    cursor: "pointer",
                  }}
                >
                  {isAddingQc ? "Saving..." : "Save QC Name"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ============================================================ */}
      {/* MODAL: CERTIFICATE OF INSPECTION */}
      {/* ============================================================ */}
      {showCertificate && lastSubmittedRecord && (
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
              borderRadius: 18,
              maxWidth: 580,
              width: "100%",
              padding: 32,
              boxShadow: "0 25px 40px -10px rgba(0,0,0,0.25)",
              border: "1px solid #e2e8f0",
            }}
          >
            <div style={{ borderBottom: "2px solid #065f46", paddingBottom: 16, marginBottom: 20 }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
                <div>
                  <span style={{ fontSize: 11, fontWeight: 800, color: "#065f46", textTransform: "uppercase", letterSpacing: "0.06em" }}>
                    QMS Gate 1 • Incoming Quality
                  </span>
                  <h2 style={{ fontSize: 22, fontWeight: 800, color: "#0f172a", margin: "4px 0 0 0" }}>
                    IQC Certificate of Inspection
                  </h2>
                  <div style={{ fontSize: 13, color: "#64748b", marginTop: 2 }}>
                    Report ID: <b>{lastSubmittedRecord.reportNumber}</b> • Date: {lastSubmittedRecord.date}
                  </div>
                </div>
                <button
                  onClick={() => setShowCertificate(false)}
                  style={{ background: "transparent", border: "none", fontSize: 20, cursor: "pointer", color: "#64748b" }}
                >
                  ✕
                </button>
              </div>
            </div>

            <div style={{ display: "flex", flexDirection: "column", gap: 12, fontSize: 13 }}>
              <div style={{ display: "flex", justifyContent: "space-between", borderBottom: "1px solid #f1f5f9", paddingBottom: 8 }}>
                <span style={{ color: "#64748b" }}>Department</span>
                <span style={{ fontWeight: 700, color: "#1d4ed8" }}>{lastSubmittedRecord.departmentName}</span>
              </div>
              <div style={{ display: "flex", justifyContent: "space-between", borderBottom: "1px solid #f1f5f9", paddingBottom: 8 }}>
                <span style={{ color: "#64748b" }}>QC Inspector</span>
                <span style={{ fontWeight: 700, color: "#0f172a" }}>{lastSubmittedRecord.inspector}</span>
              </div>
              <div style={{ display: "flex", justifyContent: "space-between", borderBottom: "1px solid #f1f5f9", paddingBottom: 8 }}>
                <span style={{ color: "#64748b" }}>Supplier / Vendor</span>
                <span style={{ fontWeight: 600 }}>{lastSubmittedRecord.supplierName}</span>
              </div>
              <div style={{ display: "flex", justifyContent: "space-between", borderBottom: "1px solid #f1f5f9", paddingBottom: 8 }}>
                <span style={{ color: "#64748b" }}>Challan / PO #</span>
                <span style={{ fontWeight: 600 }}>{lastSubmittedRecord.challanNumber || "N/A"}</span>
              </div>
              <div style={{ display: "flex", justifyContent: "space-between", borderBottom: "1px solid #f1f5f9", paddingBottom: 8 }}>
                <span style={{ color: "#64748b" }}>Material Description</span>
                <span style={{ fontWeight: 600, color: "#0f172a" }}>{lastSubmittedRecord.itemName}</span>
              </div>
              <div style={{ display: "flex", justifyContent: "space-between", borderBottom: "1px solid #f1f5f9", paddingBottom: 8 }}>
                <span style={{ color: "#64748b" }}>Category</span>
                <span style={{ fontWeight: 600 }}>{lastSubmittedRecord.category}</span>
              </div>
              <div style={{ display: "flex", justifyContent: "space-between", borderBottom: "1px solid #f1f5f9", paddingBottom: 8 }}>
                <span style={{ color: "#64748b" }}>Lot Qty vs Sampled</span>
                <span style={{ fontWeight: 600 }}>
                  {lastSubmittedRecord.lotQuantity} rec'd • {lastSubmittedRecord.sampleSize} sampled
                </span>
              </div>

              {lastSubmittedRecord.moisturePercentage !== undefined && (
                <div style={{ display: "flex", justifyContent: "space-between", borderBottom: "1px solid #f1f5f9", paddingBottom: 8 }}>
                  <span style={{ color: "#64748b" }}>Moisture Reading</span>
                  <span style={{ fontWeight: 700, color: lastSubmittedRecord.moisturePercentage <= 12 ? "#16a34a" : "#dc2626" }}>
                    {lastSubmittedRecord.moisturePercentage}% (Standard: &lt; 12.0%)
                  </span>
                </div>
              )}

              <div style={{ display: "flex", justifyContent: "space-between", borderBottom: "1px solid #f1f5f9", paddingBottom: 8 }}>
                <span style={{ color: "#64748b" }}>Defects Found</span>
                <span style={{ fontWeight: 700, color: lastSubmittedRecord.defectsCount > 0 ? "#dc2626" : "#16a34a" }}>
                  {lastSubmittedRecord.defectsCount} defects
                </span>
              </div>

              {lastSubmittedRecord.defectReason && lastSubmittedRecord.defectReason !== "None" && (
                <div>
                  <span style={{ color: "#64748b", display: "block", marginBottom: 4 }}>Defect Observation</span>
                  <div style={{ background: "#fef2f2", padding: 10, borderRadius: 8, color: "#991b1b", fontSize: 12 }}>
                    {lastSubmittedRecord.defectReason}
                  </div>
                </div>
              )}

              <div>
                <span style={{ color: "#64748b", display: "block", marginBottom: 4 }}>Inspector Sign-off & Remarks</span>
                <div style={{ background: "#f8fafc", padding: 10, borderRadius: 8, border: "1px solid #e2e8f0", fontSize: 12 }}>
                  {lastSubmittedRecord.remarks || "No remarks entered."}
                </div>
              </div>

              <div
                style={{
                  marginTop: 8,
                  padding: "12px 16px",
                  borderRadius: 10,
                  background:
                    lastSubmittedRecord.status === "Accepted"
                      ? "#dcfce7"
                      : lastSubmittedRecord.status === "Rejected"
                      ? "#fee2e2"
                      : "#fef3c7",
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "center",
                }}
              >
                <div>
                  <div style={{ fontSize: 11, fontWeight: 700, textTransform: "uppercase", color: "#475569" }}>
                    Final Lot Disposition
                  </div>
                  <div
                    style={{
                      fontSize: 16,
                      fontWeight: 800,
                      color:
                        lastSubmittedRecord.status === "Accepted"
                          ? "#166534"
                          : lastSubmittedRecord.status === "Rejected"
                          ? "#991b1b"
                          : "#92400e",
                    }}
                  >
                    {lastSubmittedRecord.status}
                  </div>
                </div>
                <div style={{ textAlign: "right" }}>
                  <div style={{ fontSize: 11, color: "#64748b" }}>Verified By:</div>
                  <div style={{ fontWeight: 700, color: "#1e293b" }}>{lastSubmittedRecord.inspector}</div>
                </div>
              </div>
            </div>

            <div style={{ marginTop: 24, textAlign: "right" }}>
              <button
                onClick={() => setShowCertificate(false)}
                style={{
                  padding: "10px 24px",
                  borderRadius: 8,
                  border: "none",
                  background: "#065f46",
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
      )}

      {/* ============================================================ */}
      {/* MODAL: PRIMARY MACHINE SHOP OFFICIAL INSPECTION CERTIFICATE */}
      {/* ============================================================ */}
      {pmsReportToShow && (
        <PrimaryMachineShopCertificateModal
          report={pmsReportToShow}
          onClose={() => setPmsReportToShow(null)}
        />
      )}
    </div>
  );
}
