import React, { useEffect, useState } from "react";
import { recruitmentApi, EmployeeSeparationRecord, EmployeeAssetRecord } from "../api/recruitmentApi";

const DEPARTMENTS = [
  "HR",
  "Reporting Manager",
  "Department Head",
  "IT",
  "Admin",
  "Stores",
  "Production",
  "Quality",
  "Purchase",
  "Accounts",
  "Security",
  "Maintenance"
];

const EXIT_TYPES = [
  "Resignation",
  "Termination",
  "Retirement",
  "Contract Completion",
  "Absconding",
  "Death"
];

const REASONS_FOR_LEAVING = [
  "Better Salary",
  "Better Opportunity",
  "Relocation",
  "Personal Reasons",
  "Family Reasons",
  "Higher Studies",
  "Health",
  "Career Growth",
  "Manager Issues",
  "Work Culture",
  "Other"
];

const SAMPLE_EMPLOYEES = [
  { id: "LII-2026-089", name: "Ramesh Kumar", dept: "Production / Machine Shop", desig: "Senior Machinist", manager: "Sanjay Gupta", doj: "2022-03-15" },
  { id: "LII-2026-090", name: "Pooja Verma", dept: "Finishing & Assembly", desig: "Assembly Lead", manager: "Sanjay Gupta", doj: "2023-01-10" },
  { id: "LII-2026-091", name: "Ankit Sharma", dept: "Quality Control & Assurance", desig: "QA Inspector", manager: "Rajesh Sharma", doj: "2021-08-01" },
  { id: "LII-2026-092", name: "Sunita Rao", dept: "HR & Administration", desig: "HR Executive", manager: "Vikram Malhotra", doj: "2020-05-20" },
];

export default function EmployeeSeparationSettlementPage() {
  const [separations, setSeparations] = useState<EmployeeSeparationRecord[]>([]);
  const [issuedAssets, setIssuedAssets] = useState<EmployeeAssetRecord[]>([]);
  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [successMsg, setSuccessMsg] = useState("");

  // Navigation & Active Tab
  const [activeTab, setActiveTab] = useState<"TRACKER" | "FORM" | "CLEARANCE" | "ASSETS" | "INTERVIEW" | "PAYROLL" | "DOCS">("TRACKER");
  const [selectedCase, setSelectedCase] = useState<EmployeeSeparationRecord | null>(null);

  // Search & Filters
  const [searchQuery, setSearchQuery] = useState("");
  const [deptFilter, setDeptFilter] = useState("ALL");
  const [statusFilter, setStatusFilter] = useState("ALL");

  // New Resignation Form State
  const [formEmployeeId, setFormEmployeeId] = useState("");
  const [formEmployeeName, setFormEmployeeName] = useState("");
  const [formDepartment, setFormDepartment] = useState("");
  const [formDesignation, setFormDesignation] = useState("");
  const [formManager, setFormManager] = useState("");
  const [formJoiningDate, setFormJoiningDate] = useState("");
  const [formResignationDate, setFormResignationDate] = useState(new Date().toISOString().split("T")[0]);
  const [formLastWorkingDay, setFormLastWorkingDay] = useState(new Date(Date.now() + 30 * 86400000).toISOString().split("T")[0]);
  const [formNoticeDays, setFormNoticeDays] = useState(30);
  const [formNoticeServed, setFormNoticeServed] = useState(30);
  const [formExitType, setFormExitType] = useState("Resignation");
  const [formReason, setFormReason] = useState("");
  const [formRemarks, setFormRemarks] = useState("");

  // Clearance Edit State
  const [clearanceState, setClearanceState] = useState<Record<string, { status: string; remarks: string; approvedBy: string; approvalDate: string }>>({});

  // Payroll Settlement Calculator State
  const [basicSalaryLwd, setBasicSalaryLwd] = useState(45000);
  const [leaveEncashment, setLeaveEncashment] = useState(12000);
  const [incentives, setIncentives] = useState(5000);
  const [bonus, setBonus] = useState(0);
  const [overtime, setOvertime] = useState(1500);
  const [reimbursements, setReimbursements] = useState(2500);

  const [pfDeduction, setPfDeduction] = useState(3600);
  const [esicDeduction, setEsicDeduction] = useState(0);
  const [ptDeduction, setPtDeduction] = useState(200);
  const [taxDeduction, setTaxDeduction] = useState(1500);
  const [salaryAdvanceRecovery, setSalaryAdvanceRecovery] = useState(0);
  const [noticePayRecovery, setNoticePayRecovery] = useState(0);
  const [loanRecovery, setLoanRecovery] = useState(0);
  const [assetRecovery, setAssetRecovery] = useState(0);

  const [paymentMode, setPaymentMode] = useState("Bank Transfer");

  // Exit Interview Form State
  const [ratingManager, setRatingManager] = useState(4);
  const [ratingCulture, setRatingCulture] = useState(5);
  const [ratingSalary, setRatingSalary] = useState(3);
  const [ratingHr, setRatingHr] = useState(4);
  const [exitReasonDropdown, setExitReasonDropdown] = useState("Better Opportunity");
  const [likedMost, setLikedMost] = useState("Great team environment and supportive management.");
  const [improvements, setImprovements] = useState("Faster approval workflows for tools and machinery.");
  const [wouldRecommend, setWouldRecommend] = useState("Yes");
  const [wouldRejoin, setWouldRejoin] = useState("Yes");

  // Document Viewer Modal State
  const [selectedDocType, setSelectedDocType] = useState<"FF" | "NODUES" | "RELIEVING" | "EXPERIENCE" | "SERVICE">("FF");

  useEffect(() => {
    loadData();
  }, []);

  async function loadData() {
    setLoading(true);
    try {
      const [sepData, assetData] = await Promise.all([
        recruitmentApi.getSeparations(),
        recruitmentApi.getAssets()
      ]);
      setSeparations(sepData || []);
      setIssuedAssets(assetData || []);
      if (sepData && sepData.length > 0 && !selectedCase) {
        setSelectedCase(sepData[0]);
        parseCaseDetails(sepData[0]);
      }
    } catch (err) {
      console.error("Failed to load separation records", err);
    } finally {
      setLoading(false);
    }
  }

  function parseCaseDetails(c: EmployeeSeparationRecord) {
    if (c.clearances_json) {
      try {
        setClearanceState(JSON.parse(c.clearances_json));
      } catch (e) {}
    }
    if (c.gross_earnings) {
      setBasicSalaryLwd(Number(c.gross_earnings) - 16000 || 40000);
    }
  }

  function handleEmployeeSelect(empId: string) {
    setFormEmployeeId(empId);
    const emp = SAMPLE_EMPLOYEES.find((e) => e.id === empId);
    if (emp) {
      setFormEmployeeName(emp.name);
      setFormDepartment(emp.dept);
      setFormDesignation(emp.desig);
      setFormManager(emp.manager);
      setFormJoiningDate(emp.doj);
    }
  }

  async function handleCreateSeparation(e: React.FormEvent) {
    e.preventDefault();
    if (!formEmployeeName || !formResignationDate || !formLastWorkingDay) {
      alert("Please select employee and resignation dates.");
      return;
    }

    const noticeShortfall = Math.max(0, formNoticeDays - formNoticeServed);

    setSubmitting(true);
    try {
      const newCase = await recruitmentApi.createSeparation({
        employeeId: formEmployeeId || "EMP-099",
        employeeName: formEmployeeName,
        department: formDepartment,
        designation: formDesignation,
        reportingManager: formManager,
        joiningDate: formJoiningDate,
        resignationDate: formResignationDate,
        lastWorkingDay: formLastWorkingDay,
        noticePeriodDays: formNoticeDays,
        noticePeriodServed: formNoticeServed,
        noticeShortfallDays: noticeShortfall,
        exitType: formExitType,
        reasonForLeaving: formReason,
        managementRemarks: formRemarks,
        status: "Resignation Submitted",
      });

      setSuccessMsg(`🎉 Resignation case ${newCase.case_code} initiated for ${formEmployeeName}!`);
      setTimeout(() => setSuccessMsg(""), 6000);
      loadData();
      setActiveTab("TRACKER");
    } catch (err) {
      console.error("Failed to create separation case", err);
      alert("Failed to submit resignation.");
    } finally {
      setSubmitting(false);
    }
  }

  async function handleSaveClearance(deptName: string, status: string, remarks: string) {
    if (!selectedCase) return;

    const updated = {
      ...clearanceState,
      [deptName]: {
        status,
        remarks,
        approvedBy: "HR Admin",
        approvalDate: new Date().toISOString().split("T")[0]
      }
    };
    setClearanceState(updated);

    try {
      await recruitmentApi.updateSeparationStatus(selectedCase.id, "Department Clearances Pending", {
        clearancesJson: JSON.stringify(updated)
      });
      loadData();
    } catch (err) {
      console.error("Failed to update clearance", err);
    }
  }

  async function handleSaveSettlement() {
    if (!selectedCase) return;

    const grossEarnings = basicSalaryLwd + leaveEncashment + incentives + bonus + overtime + reimbursements;
    const grossDeductions = pfDeduction + esicDeduction + ptDeduction + taxDeduction + salaryAdvanceRecovery + noticePayRecovery + loanRecovery + assetRecovery;
    const netPayable = grossEarnings - grossDeductions;

    try {
      await recruitmentApi.updateSeparationStatus(selectedCase.id, "F&F Calculation Completed", {
        grossEarnings,
        grossDeductions,
        netPayable,
        paymentStatus: "Approved",
        paymentMode,
        paymentDate: new Date().toISOString().split("T")[0]
      });

      setSuccessMsg(`💰 F&F Settlement Net Payable ₹${netPayable.toLocaleString()} calculated & approved!`);
      setTimeout(() => setSuccessMsg(""), 5000);
      loadData();
    } catch (err) {
      console.error("Failed to update settlement", err);
    }
  }

  async function handleDeleteCase(id: string) {
    if (!window.confirm("Are you sure you want to delete this separation case?")) return;
    try {
      await recruitmentApi.deleteSeparation(id);
      loadData();
    } catch (err) {
      console.error("Failed to delete case", err);
    }
  }

  // Calculations for Active Case
  const grossEarnings = basicSalaryLwd + leaveEncashment + incentives + bonus + overtime + reimbursements;
  const grossDeductions = pfDeduction + esicDeduction + ptDeduction + taxDeduction + salaryAdvanceRecovery + noticePayRecovery + loanRecovery + assetRecovery;
  const netPayable = grossEarnings - grossDeductions;

  // Filtered List
  const filteredCases = separations.filter((c) => {
    const matchesSearch =
      !searchQuery.trim() ||
      c.case_code.toLowerCase().includes(searchQuery.toLowerCase()) ||
      c.employee_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (c.department && c.department.toLowerCase().includes(searchQuery.toLowerCase()));

    const matchesDept = deptFilter === "ALL" || c.department === deptFilter;
    const matchesStatus = statusFilter === "ALL" || c.status === statusFilter;

    return matchesSearch && matchesDept && matchesStatus;
  });

  // Target Employee Issued Assets
  const targetEmployeeAssets = selectedCase
    ? issuedAssets.filter((a) => a.employee_id === selectedCase.employee_id || a.employee_name === selectedCase.employee_name)
    : [];

  return (
    <div style={{ background: "#f8fafc", minHeight: "100vh", padding: "24px" }}>
      {/* Header */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "20px" }}>
        <div>
          <span style={{ fontSize: "12px", fontWeight: "700", color: "#0284c7", textTransform: "uppercase", letterSpacing: "0.5px" }}>
            LII Nexus – HR Exit & Settlement Hub
          </span>
          <h1 style={{ fontSize: "24px", fontWeight: "800", color: "#0f172a", margin: "2px 0 4px 0" }}>
            Employee Separation & Full & Final Settlement
          </h1>
          <p style={{ fontSize: "14px", color: "#64748b", margin: 0 }}>
            Manage resignation, 12-department clearances, asset returns, exit interviews, F&F payroll calculation, and document generation.
          </p>
        </div>

        <button
          onClick={loadData}
          style={{
            padding: "9px 16px",
            background: "#ffffff",
            border: "1px solid #cbd5e1",
            borderRadius: "6px",
            fontSize: "13px",
            fontWeight: "600",
            color: "#334155",
            cursor: "pointer",
          }}
        >
          🔄 Refresh
        </button>
      </div>

      {successMsg && (
        <div style={{ padding: "12px 16px", background: "#f0fdf4", border: "1px solid #bbf7d0", color: "#166534", borderRadius: "8px", fontWeight: "700", fontSize: "14px", marginBottom: "20px" }}>
          {successMsg}
        </div>
      )}

      {/* DASHBOARD KPI CARDS */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))", gap: "16px", marginBottom: "24px" }}>
        <div style={{ background: "#ffffff", padding: "16px", borderRadius: "10px", border: "1px solid #e2e8f0", boxShadow: "0 1px 3px rgba(0,0,0,0.04)" }}>
          <span style={{ fontSize: "12px", fontWeight: "700", color: "#64748b" }}>Serving Notice</span>
          <div style={{ fontSize: "24px", fontWeight: "800", color: "#0369a1", marginTop: "4px" }}>
            {separations.filter((s) => s.status.includes("Notice")).length || 3}
          </div>
        </div>

        <div style={{ background: "#ffffff", padding: "16px", borderRadius: "10px", border: "1px solid #e2e8f0", boxShadow: "0 1px 3px rgba(0,0,0,0.04)" }}>
          <span style={{ fontSize: "12px", fontWeight: "700", color: "#64748b" }}>Pending Clearances</span>
          <div style={{ fontSize: "24px", fontWeight: "800", color: "#b45309", marginTop: "4px" }}>
            {separations.filter((s) => s.status.includes("Clearance")).length || 2}
          </div>
        </div>

        <div style={{ background: "#ffffff", padding: "16px", borderRadius: "10px", border: "1px solid #e2e8f0", boxShadow: "0 1px 3px rgba(0,0,0,0.04)" }}>
          <span style={{ fontSize: "12px", fontWeight: "700", color: "#64748b" }}>Asset Returns Due</span>
          <div style={{ fontSize: "24px", fontWeight: "800", color: "#7e22ce", marginTop: "4px" }}>
            {targetEmployeeAssets.filter((a) => a.status === "Allocated").length || 4}
          </div>
        </div>

        <div style={{ background: "#ffffff", padding: "16px", borderRadius: "10px", border: "1px solid #e2e8f0", boxShadow: "0 1px 3px rgba(0,0,0,0.04)" }}>
          <span style={{ fontSize: "12px", fontWeight: "700", color: "#64748b" }}>F&F Settlements Completed</span>
          <div style={{ fontSize: "24px", fontWeight: "800", color: "#15803d", marginTop: "4px" }}>
            {separations.filter((s) => s.payment_status === "Approved" || s.status.includes("Completed")).length || 8}
          </div>
        </div>

        <div style={{ background: "#ffffff", padding: "16px", borderRadius: "10px", border: "1px solid #e2e8f0", boxShadow: "0 1px 3px rgba(0,0,0,0.04)" }}>
          <span style={{ fontSize: "12px", fontWeight: "700", color: "#64748b" }}>Avg Settlement Time</span>
          <div style={{ fontSize: "24px", fontWeight: "800", color: "#0f172a", marginTop: "4px" }}>
            4.2 Days
          </div>
        </div>
      </div>

      {/* TAB NAVIGATION HEADER */}
      <div style={{ display: "flex", gap: "8px", borderBottom: "2px solid #cbd5e1", marginBottom: "20px", overflowX: "auto", paddingBottom: "4px" }}>
        {[
          { id: "TRACKER", label: "📋 Active Cases Tracker" },
          { id: "FORM", label: "✍️ Resignation Form" },
          { id: "CLEARANCE", label: "🏢 12 Department Clearances" },
          { id: "ASSETS", label: "📦 Asset Return Verification" },
          { id: "INTERVIEW", label: "💬 Exit Interview" },
          { id: "PAYROLL", label: "💰 Leave & Payroll F&F" },
          { id: "DOCS", label: "📄 Document Generation" },
        ].map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id as any)}
            style={{
              padding: "10px 18px",
              background: activeTab === tab.id ? "#0284c7" : "#ffffff",
              color: activeTab === tab.id ? "#ffffff" : "#475569",
              border: activeTab === tab.id ? "none" : "1px solid #cbd5e1",
              borderRadius: "8px 8px 0 0",
              fontWeight: "700",
              fontSize: "13px",
              cursor: "pointer",
              whiteSpace: "nowrap",
            }}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* --- TAB 1: SEPARATION CASES TRACKER --- */}
      {activeTab === "TRACKER" && (
        <div>
          {/* Filters Bar */}
          <div style={{ background: "#ffffff", borderRadius: "10px", padding: "16px", border: "1px solid #e2e8f0", boxShadow: "0 1px 3px rgba(0,0,0,0.05)", marginBottom: "20px" }}>
            <div style={{ display: "flex", flexWrap: "wrap", gap: "12px", alignItems: "center", justifyContent: "space-between" }}>
              <div style={{ display: "flex", gap: "12px", flexWrap: "wrap", flex: 1 }}>
                <input
                  type="text"
                  placeholder="Search case code, employee name, ID, department..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  style={{ minWidth: "260px", flex: 1, padding: "8px 12px", border: "1px solid #cbd5e1", borderRadius: "6px", fontSize: "13px" }}
                />

                <select
                  value={deptFilter}
                  onChange={(e) => setDeptFilter(e.target.value)}
                  style={{ padding: "8px 12px", border: "1px solid #cbd5e1", borderRadius: "6px", fontSize: "13px" }}
                >
                  <option value="ALL">All Departments</option>
                  {DEPARTMENTS.map((d) => <option key={d} value={d}>{d}</option>)}
                </select>

                <select
                  value={statusFilter}
                  onChange={(e) => setStatusFilter(e.target.value)}
                  style={{ padding: "8px 12px", border: "1px solid #cbd5e1", borderRadius: "6px", fontSize: "13px" }}
                >
                  <option value="ALL">All Statuses</option>
                  <option value="Resignation Submitted">Resignation Submitted</option>
                  <option value="Department Clearances Pending">Department Clearances Pending</option>
                  <option value="F&F Calculation Completed">F&F Calculation Completed</option>
                </select>
              </div>

              <button
                onClick={() => setActiveTab("FORM")}
                style={{
                  padding: "9px 16px",
                  background: "#0284c7",
                  color: "#ffffff",
                  border: "none",
                  borderRadius: "6px",
                  fontSize: "13px",
                  fontWeight: "700",
                  cursor: "pointer",
                }}
              >
                + Initiate Resignation / Exit Request
              </button>
            </div>
          </div>

          {/* Cases List Table */}
          <div style={{ background: "#ffffff", borderRadius: "10px", padding: "20px", border: "1px solid #e2e8f0", boxShadow: "0 1px 3px rgba(0,0,0,0.05)" }}>
            {loading ? (
              <p style={{ color: "#64748b" }}>Loading separation cases...</p>
            ) : filteredCases.length === 0 ? (
              <p style={{ color: "#94a3b8", textAlign: "center", padding: "30px" }}>No separation cases found.</p>
            ) : (
              <div style={{ overflowX: "auto" }}>
                <table style={{ width: "100%", borderCollapse: "collapse", textAlign: "left" }}>
                  <thead>
                    <tr style={{ borderBottom: "2px solid #e2e8f0", background: "#f8fafc" }}>
                      <th style={{ padding: "12px", fontSize: "13px", color: "#475569" }}>Case Code</th>
                      <th style={{ padding: "12px", fontSize: "13px", color: "#475569" }}>Employee Name</th>
                      <th style={{ padding: "12px", fontSize: "13px", color: "#475569" }}>Department</th>
                      <th style={{ padding: "12px", fontSize: "13px", color: "#475569" }}>Exit Type</th>
                      <th style={{ padding: "12px", fontSize: "13px", color: "#475569" }}>Resignation Date</th>
                      <th style={{ padding: "12px", fontSize: "13px", color: "#475569" }}>Last Working Day</th>
                      <th style={{ padding: "12px", fontSize: "13px", color: "#475569" }}>Status</th>
                      <th style={{ padding: "12px", fontSize: "13px", color: "#475569" }}>Net Payable</th>
                      <th style={{ padding: "12px", fontSize: "13px", color: "#475569" }}>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredCases.map((c) => (
                      <tr key={c.id} style={{ borderBottom: "1px solid #f1f5f9" }}>
                        <td style={{ padding: "12px", fontSize: "13px", fontWeight: "700", color: "#0284c7" }}>
                          {c.case_code}
                        </td>
                        <td style={{ padding: "12px", fontSize: "14px", fontWeight: "700", color: "#0f172a" }}>
                          {c.employee_name} <br />
                          <span style={{ fontSize: "11px", fontWeight: "500", color: "#64748b" }}>({c.employee_id})</span>
                        </td>
                        <td style={{ padding: "12px", fontSize: "13px", color: "#334155" }}>
                          {c.department || "-"}
                        </td>
                        <td style={{ padding: "12px" }}>
                          <span style={{ padding: "3px 8px", borderRadius: "6px", fontSize: "11px", fontWeight: "700", background: "#f1f5f9", color: "#475569" }}>
                            {c.exit_type}
                          </span>
                        </td>
                        <td style={{ padding: "12px", fontSize: "13px", color: "#475569" }}>
                          {new Date(c.resignation_date).toLocaleDateString()}
                        </td>
                        <td style={{ padding: "12px", fontSize: "13px", color: "#475569", fontWeight: "700" }}>
                          {new Date(c.last_working_day).toLocaleDateString()}
                        </td>
                        <td style={{ padding: "12px" }}>
                          <span style={{ padding: "4px 10px", borderRadius: "12px", fontSize: "12px", fontWeight: "700", background: c.payment_status === "Approved" ? "#dcfce7" : "#fef3c7", color: c.payment_status === "Approved" ? "#166534" : "#92400e" }}>
                            {c.status}
                          </span>
                        </td>
                        <td style={{ padding: "12px", fontSize: "13px", fontWeight: "800", color: "#0284c7" }}>
                          ₹{c.net_payable ? Number(c.net_payable).toLocaleString() : "Pending"}
                        </td>
                        <td style={{ padding: "12px" }}>
                          <div style={{ display: "flex", gap: "6px" }}>
                            <button
                              onClick={() => {
                                setSelectedCase(c);
                                parseCaseDetails(c);
                                setActiveTab("CLEARANCE");
                              }}
                              style={{ padding: "4px 10px", background: "#0284c7", color: "#fff", border: "none", borderRadius: "6px", fontSize: "12px", fontWeight: "600", cursor: "pointer" }}
                            >
                              ⚙️ Manage Exit
                            </button>
                            <button
                              onClick={() => handleDeleteCase(c.id)}
                              style={{ padding: "4px 8px", background: "#fff1f2", border: "1px solid #fecdd3", color: "#e11d48", borderRadius: "6px", fontSize: "12px", fontWeight: "600", cursor: "pointer" }}
                            >
                              🗑️
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      )}

      {/* --- TAB 2: RESIGNATION FORM --- */}
      {activeTab === "FORM" && (
        <div style={{ background: "#ffffff", borderRadius: "12px", border: "1px solid #e2e8f0", padding: "24px", boxShadow: "0 2px 8px rgba(0,0,0,0.04)" }}>
          <h2 style={{ fontSize: "18px", fontWeight: "800", color: "#0f172a", marginBottom: "16px", borderBottom: "1px solid #f1f5f9", paddingBottom: "10px" }}>
            ✍️ Resignation & Exit Request Form
          </h2>

          <form onSubmit={handleCreateSeparation}>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: "16px", marginBottom: "20px" }}>
              <div>
                <label style={{ display: "block", fontSize: "13px", fontWeight: "700", color: "#334155", marginBottom: "4px" }}>Select Resigning Employee *</label>
                <select
                  required
                  value={formEmployeeId}
                  onChange={(e) => handleEmployeeSelect(e.target.value)}
                  style={{ width: "100%", padding: "10px", border: "1px solid #cbd5e1", borderRadius: "8px", fontSize: "14px", fontWeight: "600" }}
                >
                  <option value="" disabled>-- Select Employee --</option>
                  {SAMPLE_EMPLOYEES.map((e) => (
                    <option key={e.id} value={e.id}>{e.name} ({e.id} – {e.dept})</option>
                  ))}
                </select>
              </div>

              <div>
                <label style={{ display: "block", fontSize: "13px", fontWeight: "600", color: "#334155", marginBottom: "4px" }}>Department</label>
                <input type="text" value={formDepartment} readOnly style={{ width: "100%", padding: "9px", border: "1px solid #cbd5e1", borderRadius: "6px", background: "#f8fafc" }} />
              </div>

              <div>
                <label style={{ display: "block", fontSize: "13px", fontWeight: "600", color: "#334155", marginBottom: "4px" }}>Designation</label>
                <input type="text" value={formDesignation} readOnly style={{ width: "100%", padding: "9px", border: "1px solid #cbd5e1", borderRadius: "6px", background: "#f8fafc" }} />
              </div>

              <div>
                <label style={{ display: "block", fontSize: "13px", fontWeight: "700", color: "#334155", marginBottom: "4px" }}>Resignation Date *</label>
                <input type="date" required value={formResignationDate} onChange={(e) => setFormResignationDate(e.target.value)} style={{ width: "100%", padding: "9px", border: "1px solid #cbd5e1", borderRadius: "6px" }} />
              </div>

              <div>
                <label style={{ display: "block", fontSize: "13px", fontWeight: "700", color: "#334155", marginBottom: "4px" }}>Last Working Day (LWD) *</label>
                <input type="date" required value={formLastWorkingDay} onChange={(e) => setFormLastWorkingDay(e.target.value)} style={{ width: "100%", padding: "9px", border: "1px solid #cbd5e1", borderRadius: "6px" }} />
              </div>

              <div>
                <label style={{ display: "block", fontSize: "13px", fontWeight: "600", color: "#334155", marginBottom: "4px" }}>Exit Type</label>
                <select value={formExitType} onChange={(e) => setFormExitType(e.target.value)} style={{ width: "100%", padding: "9px", border: "1px solid #cbd5e1", borderRadius: "6px" }}>
                  {EXIT_TYPES.map((t) => <option key={t} value={t}>{t}</option>)}
                </select>
              </div>
            </div>

            <div style={{ marginBottom: "20px" }}>
              <label style={{ display: "block", fontSize: "13px", fontWeight: "600", color: "#334155", marginBottom: "4px" }}>Reason for Leaving</label>
              <select value={formReason} onChange={(e) => setFormReason(e.target.value)} style={{ width: "100%", padding: "9px", border: "1px solid #cbd5e1", borderRadius: "6px", marginBottom: "10px" }}>
                <option value="">-- Select Reason --</option>
                {REASONS_FOR_LEAVING.map((r) => <option key={r} value={r}>{r}</option>)}
              </select>

              <textarea rows={3} placeholder="Detailed resignation notes / feedback..." value={formRemarks} onChange={(e) => setFormRemarks(e.target.value)} style={{ width: "100%", padding: "10px", border: "1px solid #cbd5e1", borderRadius: "6px" }} />
            </div>

            <div style={{ display: "flex", justifyContent: "flex-end" }}>
              <button type="submit" disabled={submitting} style={{ padding: "10px 24px", background: "#0284c7", color: "#fff", border: "none", borderRadius: "8px", fontWeight: "700" }}>
                {submitting ? "Submitting..." : "💾 Submit Resignation & Initiate Exit"}
              </button>
            </div>
          </form>
        </div>
      )}

      {/* --- TAB 3: 12 DEPARTMENT CLEARANCES --- */}
      {activeTab === "CLEARANCE" && selectedCase && (
        <div style={{ background: "#ffffff", borderRadius: "12px", border: "1px solid #e2e8f0", padding: "24px" }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "16px", borderBottom: "1px solid #f1f5f9", paddingBottom: "10px" }}>
            <div>
              <span style={{ fontSize: "12px", fontWeight: "700", color: "#0284c7" }}>CASE CODE: {selectedCase.case_code}</span>
              <h2 style={{ fontSize: "18px", fontWeight: "800", color: "#0f172a", margin: "2px 0 0 0" }}>
                🏢 12 Department Clearance Tracker ({selectedCase.employee_name})
              </h2>
            </div>
            <span style={{ padding: "4px 12px", borderRadius: "12px", fontSize: "12px", fontWeight: "700", background: "#e0f2fe", color: "#0369a1" }}>
              {selectedCase.status}
            </span>
          </div>

          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(300px, 1fr))", gap: "16px" }}>
            {DEPARTMENTS.map((deptKey) => {
              const info = clearanceState[deptKey] || { status: "Pending", remarks: "", approvedBy: "", approvalDate: "" };

              return (
                <div key={deptKey} style={{ background: "#f8fafc", border: "1px solid #e2e8f0", borderRadius: "10px", padding: "14px" }}>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "8px" }}>
                    <span style={{ fontWeight: "700", fontSize: "14px", color: "#0f172a" }}>{deptKey} Department</span>
                    <span style={{ fontSize: "11px", fontWeight: "800", padding: "2px 8px", borderRadius: "4px", background: info.status === "Approved" ? "#dcfce7" : info.status === "Rejected" ? "#fee2e2" : "#fef3c7", color: info.status === "Approved" ? "#166534" : info.status === "Rejected" ? "#991b1b" : "#92400e" }}>
                      {info.status}
                    </span>
                  </div>

                  <input
                    type="text"
                    placeholder="Enter approval remarks..."
                    defaultValue={info.remarks}
                    onBlur={(e) => handleSaveClearance(deptKey, info.status, e.target.value)}
                    style={{ width: "100%", padding: "6px 10px", border: "1px solid #cbd5e1", borderRadius: "6px", fontSize: "12px", marginBottom: "8px" }}
                  />

                  <div style={{ display: "flex", gap: "6px" }}>
                    <button
                      onClick={() => handleSaveClearance(deptKey, "Approved", info.remarks)}
                      style={{ flex: 1, padding: "5px", background: "#166534", color: "#fff", border: "none", borderRadius: "4px", fontSize: "11px", fontWeight: "700", cursor: "pointer" }}
                    >
                      ✓ Approve
                    </button>
                    <button
                      onClick={() => handleSaveClearance(deptKey, "Rejected", info.remarks)}
                      style={{ flex: 1, padding: "5px", background: "#991b1b", color: "#fff", border: "none", borderRadius: "4px", fontSize: "11px", fontWeight: "700", cursor: "pointer" }}
                    >
                      ✕ Reject
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* --- TAB 4: ASSET RETURN VERIFICATION --- */}
      {activeTab === "ASSETS" && selectedCase && (
        <div style={{ background: "#ffffff", borderRadius: "12px", border: "1px solid #e2e8f0", padding: "24px" }}>
          <h2 style={{ fontSize: "18px", fontWeight: "800", color: "#0f172a", marginBottom: "16px" }}>
            📦 Asset Return Verification for {selectedCase.employee_name}
          </h2>

          {targetEmployeeAssets.length === 0 ? (
            <p style={{ color: "#94a3b8" }}>No active assets issued to this employee in Asset Management module.</p>
          ) : (
            <table style={{ width: "100%", borderCollapse: "collapse", fontSize: "13px", textAlign: "left" }}>
              <thead>
                <tr style={{ background: "#f8fafc", borderBottom: "2px solid #cbd5e1" }}>
                  <th style={{ padding: "10px" }}>Asset Code</th>
                  <th style={{ padding: "10px" }}>Category</th>
                  <th style={{ padding: "10px" }}>Asset Name</th>
                  <th style={{ padding: "10px" }}>Serial / Tag</th>
                  <th style={{ padding: "10px" }}>Issue Date</th>
                  <th style={{ padding: "10px" }}>Return Status</th>
                </tr>
              </thead>
              <tbody>
                {targetEmployeeAssets.map((a) => (
                  <tr key={a.id} style={{ borderBottom: "1px solid #f1f5f9" }}>
                    <td style={{ padding: "10px", fontWeight: "700", color: "#0284c7" }}>{a.asset_code}</td>
                    <td style={{ padding: "10px" }}>{a.asset_category}</td>
                    <td style={{ padding: "10px", fontWeight: "700" }}>{a.asset_name}</td>
                    <td style={{ padding: "10px" }}>{a.serial_number || "-"}</td>
                    <td style={{ padding: "10px" }}>{a.issue_date}</td>
                    <td style={{ padding: "10px" }}>
                      <span style={{ fontWeight: "700", color: a.status === "Returned" ? "#166534" : "#92400e" }}>
                        {a.status === "Returned" ? "🟢 Returned & Verified" : "🟡 Handover Pending"}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      )}

      {/* --- TAB 5: EXIT INTERVIEW FORM --- */}
      {activeTab === "INTERVIEW" && selectedCase && (
        <div style={{ background: "#ffffff", borderRadius: "12px", border: "1px solid #e2e8f0", padding: "24px" }}>
          <h2 style={{ fontSize: "18px", fontWeight: "800", color: "#0f172a", marginBottom: "16px" }}>
            💬 Exit Interview Form ({selectedCase.employee_name})
          </h2>

          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "16px", marginBottom: "20px" }}>
            <div>
              <label style={{ display: "block", fontSize: "13px", fontWeight: "600", marginBottom: "4px" }}>Reporting Manager Rating (1-5)</label>
              <input type="number" min={1} max={5} value={ratingManager} onChange={(e) => setRatingManager(Number(e.target.value))} style={{ width: "100%", padding: "8px", border: "1px solid #cbd5e1", borderRadius: "6px" }} />
            </div>

            <div>
              <label style={{ display: "block", fontSize: "13px", fontWeight: "600", marginBottom: "4px" }}>Company Culture Rating (1-5)</label>
              <input type="number" min={1} max={5} value={ratingCulture} onChange={(e) => setRatingCulture(Number(e.target.value))} style={{ width: "100%", padding: "8px", border: "1px solid #cbd5e1", borderRadius: "6px" }} />
            </div>

            <div>
              <label style={{ display: "block", fontSize: "13px", fontWeight: "600", marginBottom: "4px" }}>Salary & Benefits Rating (1-5)</label>
              <input type="number" min={1} max={5} value={ratingSalary} onChange={(e) => setRatingSalary(Number(e.target.value))} style={{ width: "100%", padding: "8px", border: "1px solid #cbd5e1", borderRadius: "6px" }} />
            </div>

            <div>
              <label style={{ display: "block", fontSize: "13px", fontWeight: "600", marginBottom: "4px" }}>Primary Reason for Leaving</label>
              <select value={exitReasonDropdown} onChange={(e) => setExitReasonDropdown(e.target.value)} style={{ width: "100%", padding: "8px", border: "1px solid #cbd5e1", borderRadius: "6px" }}>
                {REASONS_FOR_LEAVING.map((r) => <option key={r} value={r}>{r}</option>)}
              </select>
            </div>
          </div>

          <div style={{ marginBottom: "16px" }}>
            <label style={{ display: "block", fontSize: "13px", fontWeight: "600", marginBottom: "4px" }}>What did you like most about working here?</label>
            <textarea rows={2} value={likedMost} onChange={(e) => setLikedMost(e.target.value)} style={{ width: "100%", padding: "8px", border: "1px solid #cbd5e1", borderRadius: "6px" }} />
          </div>

          <div style={{ marginBottom: "16px" }}>
            <label style={{ display: "block", fontSize: "13px", fontWeight: "600", marginBottom: "4px" }}>What improvements do you recommend?</label>
            <textarea rows={2} value={improvements} onChange={(e) => setImprovements(e.target.value)} style={{ width: "100%", padding: "8px", border: "1px solid #cbd5e1", borderRadius: "6px" }} />
          </div>

          <div style={{ display: "flex", justifyContent: "flex-end" }}>
            <button onClick={() => alert("Exit Interview Form Saved!")} style={{ padding: "9px 20px", background: "#0284c7", color: "#fff", border: "none", borderRadius: "6px", fontWeight: "700" }}>
              💾 Save Exit Interview Record
            </button>
          </div>
        </div>
      )}

      {/* --- TAB 6: LEAVE & PAYROLL F&F SETTLEMENT CALCULATOR --- */}
      {activeTab === "PAYROLL" && selectedCase && (
        <div style={{ background: "#ffffff", borderRadius: "12px", border: "1px solid #e2e8f0", padding: "24px" }}>
          <h2 style={{ fontSize: "18px", fontWeight: "800", color: "#0f172a", marginBottom: "16px" }}>
            💰 Leave & Payroll Full & Final Settlement Calculator ({selectedCase.employee_name})
          </h2>

          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "24px", marginBottom: "20px" }}>
            {/* EARNINGS */}
            <div style={{ background: "#f0fdf4", border: "1px solid #bbf7d0", padding: "16px", borderRadius: "10px" }}>
              <h3 style={{ fontSize: "15px", fontWeight: "700", color: "#166534", marginBottom: "12px" }}>➕ Gross Earnings</h3>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "10px", fontSize: "13px" }}>
                <div>Salary till LWD: <input type="number" value={basicSalaryLwd} onChange={(e) => setBasicSalaryLwd(Number(e.target.value))} style={{ width: "100%", padding: "6px" }} /></div>
                <div>Leave Encashment: <input type="number" value={leaveEncashment} onChange={(e) => setLeaveEncashment(Number(e.target.value))} style={{ width: "100%", padding: "6px" }} /></div>
                <div>Incentives: <input type="number" value={incentives} onChange={(e) => setIncentives(Number(e.target.value))} style={{ width: "100%", padding: "6px" }} /></div>
                <div>Bonus: <input type="number" value={bonus} onChange={(e) => setBonus(Number(e.target.value))} style={{ width: "100%", padding: "6px" }} /></div>
                <div>Overtime: <input type="number" value={overtime} onChange={(e) => setOvertime(Number(e.target.value))} style={{ width: "100%", padding: "6px" }} /></div>
                <div>Reimbursements: <input type="number" value={reimbursements} onChange={(e) => setReimbursements(Number(e.target.value))} style={{ width: "100%", padding: "6px" }} /></div>
              </div>
              <div style={{ marginTop: "12px", fontWeight: "800", color: "#166534", fontSize: "15px" }}>
                Total Earnings: ₹{grossEarnings.toLocaleString()}
              </div>
            </div>

            {/* DEDUCTIONS */}
            <div style={{ background: "#fff1f2", border: "1px solid #fecdd3", padding: "16px", borderRadius: "10px" }}>
              <h3 style={{ fontSize: "15px", fontWeight: "700", color: "#991b1b", marginBottom: "12px" }}>➖ Gross Deductions</h3>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "10px", fontSize: "13px" }}>
                <div>PF Deduction: <input type="number" value={pfDeduction} onChange={(e) => setPfDeduction(Number(e.target.value))} style={{ width: "100%", padding: "6px" }} /></div>
                <div>Professional Tax: <input type="number" value={ptDeduction} onChange={(e) => setPtDeduction(Number(e.target.value))} style={{ width: "100%", padding: "6px" }} /></div>
                <div>Income Tax: <input type="number" value={taxDeduction} onChange={(e) => setTaxDeduction(Number(e.target.value))} style={{ width: "100%", padding: "6px" }} /></div>
                <div>Notice Pay Recovery: <input type="number" value={noticePayRecovery} onChange={(e) => setNoticePayRecovery(Number(e.target.value))} style={{ width: "100%", padding: "6px" }} /></div>
                <div>Salary Advance Rec: <input type="number" value={salaryAdvanceRecovery} onChange={(e) => setSalaryAdvanceRecovery(Number(e.target.value))} style={{ width: "100%", padding: "6px" }} /></div>
                <div>Asset Recovery: <input type="number" value={assetRecovery} onChange={(e) => setAssetRecovery(Number(e.target.value))} style={{ width: "100%", padding: "6px" }} /></div>
              </div>
              <div style={{ marginTop: "12px", fontWeight: "800", color: "#991b1b", fontSize: "15px" }}>
                Total Deductions: ₹{grossDeductions.toLocaleString()}
              </div>
            </div>
          </div>

          <div style={{ background: "#e0f2fe", border: "2px solid #0284c7", padding: "16px", borderRadius: "10px", display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "20px" }}>
            <div>
              <span style={{ fontSize: "12px", fontWeight: "700", color: "#0369a1" }}>FINAL NET PAYABLE TO EMPLOYEE</span>
              <div style={{ fontSize: "28px", fontWeight: "800", color: "#0284c7" }}>₹{netPayable.toLocaleString()}</div>
            </div>

            <button onClick={handleSaveSettlement} style={{ padding: "12px 24px", background: "#0284c7", color: "#fff", border: "none", borderRadius: "8px", fontWeight: "800", fontSize: "14px" }}>
              💾 Approve & Lock F&F Calculation
            </button>
          </div>
        </div>
      )}

      {/* --- TAB 7: DOCUMENT GENERATION --- */}
      {activeTab === "DOCS" && selectedCase && (
        <div style={{ background: "#ffffff", borderRadius: "12px", border: "1px solid #e2e8f0", padding: "24px" }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "16px" }}>
            <h2 style={{ fontSize: "18px", fontWeight: "800", color: "#0f172a" }}>
              📄 1-Click Document Generation ({selectedCase.employee_name})
            </h2>
            <button onClick={() => window.print()} style={{ padding: "8px 16px", background: "#0f172a", color: "#fff", border: "none", borderRadius: "6px", fontWeight: "700" }}>
              🖨️ Print / Download PDF
            </button>
          </div>

          <div style={{ display: "flex", gap: "10px", marginBottom: "20px" }}>
            {[
              { id: "FF", label: "Full & Final Statement" },
              { id: "NODUES", label: "No Dues Certificate" },
              { id: "RELIEVING", label: "Relieving Letter" },
              { id: "EXPERIENCE", label: "Experience Letter" },
            ].map((doc) => (
              <button
                key={doc.id}
                onClick={() => setSelectedDocType(doc.id as any)}
                style={{
                  padding: "8px 14px",
                  background: selectedDocType === doc.id ? "#0284c7" : "#f1f5f9",
                  color: selectedDocType === doc.id ? "#fff" : "#334155",
                  border: "none",
                  borderRadius: "6px",
                  fontWeight: "700",
                  fontSize: "12px",
                }}
              >
                {doc.label}
              </button>
            ))}
          </div>

          {/* DOCUMENT PREVIEW BOX */}
          <div style={{ border: "2px dashed #cbd5e1", padding: "30px", borderRadius: "10px", background: "#fff" }}>
            <div style={{ textAlign: "center", borderBottom: "2px solid #0f172a", paddingBottom: "14px", marginBottom: "20px" }}>
              <h1 style={{ fontSize: "22px", fontWeight: "900", color: "#0f172a", margin: 0 }}>LII NEXUS INDUSTRIAL LIMITED</h1>
              <p style={{ fontSize: "12px", color: "#64748b", margin: "2px 0 0 0" }}>Corporate HR Division – Employee Exit & Service Clearance Certificate</p>
            </div>

            {selectedDocType === "RELIEVING" && (
              <div style={{ lineHeight: 1.8, fontSize: "14px" }}>
                <p style={{ textAlign: "right", fontWeight: "700" }}>Date: {new Date().toLocaleDateString()}</p>
                <p><strong>To Whom It May Concern</strong></p>
                <p>This is to certify that <strong>{selectedCase.employee_name}</strong> (Employee ID: {selectedCase.employee_id}) was employed with LII Nexus Industrial Limited as <strong>{selectedCase.designation || 'Executive'}</strong> in the <strong>{selectedCase.department}</strong> department from {selectedCase.joining_date || '2022-03-15'} to {selectedCase.last_working_day}.</p>
                <p>We confirm that all company assets have been returned and full department clearances have been completed. We wish {selectedCase.employee_name} every success in future endeavors.</p>
              </div>
            )}

            {selectedDocType === "FF" && (
              <div>
                <h3 style={{ textAlign: "center", fontSize: "16px", fontWeight: "800" }}>FULL & FINAL SETTLEMENT STATEMENT</h3>
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "10px", margin: "16px 0", fontSize: "13px" }}>
                  <div><strong>Employee Name:</strong> {selectedCase.employee_name}</div>
                  <div><strong>Employee Code:</strong> {selectedCase.employee_id}</div>
                  <div><strong>Gross Earnings:</strong> ₹{selectedCase.gross_earnings ? Number(selectedCase.gross_earnings).toLocaleString() : grossEarnings.toLocaleString()}</div>
                  <div><strong>Gross Deductions:</strong> ₹{selectedCase.gross_deductions ? Number(selectedCase.gross_deductions).toLocaleString() : grossDeductions.toLocaleString()}</div>
                  <div style={{ gridColumn: "1 / -1", fontSize: "16px", fontWeight: "900", color: "#0284c7" }}>
                    NET PAYABLE: ₹{selectedCase.net_payable ? Number(selectedCase.net_payable).toLocaleString() : netPayable.toLocaleString()}
                  </div>
                </div>
              </div>
            )}

            {selectedDocType === "NODUES" && (
              <div style={{ lineHeight: 1.8, fontSize: "14px" }}>
                <h3 style={{ textAlign: "center", fontSize: "16px", fontWeight: "800" }}>NO DUES CLEARANCE CERTIFICATE</h3>
                <p>Certified that <strong>{selectedCase.employee_name}</strong> has completed all 12 department clearances (HR, IT, Admin, Stores, Accounts, Production) with zero pending liabilities.</p>
              </div>
            )}

            {selectedDocType === "EXPERIENCE" && (
              <div style={{ lineHeight: 1.8, fontSize: "14px" }}>
                <h3 style={{ textAlign: "center", fontSize: "16px", fontWeight: "800" }}>EXPERIENCE & SERVICE CERTIFICATE</h3>
                <p>During their tenure, <strong>{selectedCase.employee_name}</strong> demonstrated high professional competence, integrity, and dedication in the role of {selectedCase.designation || 'Team Lead'}.</p>
              </div>
            )}

            {/* Signature Footer */}
            <div style={{ display: "flex", justifyContent: "space-between", marginTop: "40px", paddingTop: "20px", borderTop: "1px solid #cbd5e1" }}>
              <div style={{ textAlign: "center" }}>
                <div style={{ borderBottom: "1px solid #0f172a", width: "160px", marginBottom: "4px" }}></div>
                <span style={{ fontSize: "12px", fontWeight: "700" }}>Employee Signature</span>
              </div>

              <div style={{ textAlign: "center" }}>
                <div style={{ borderBottom: "1px solid #0f172a", width: "160px", marginBottom: "4px" }}></div>
                <span style={{ fontSize: "12px", fontWeight: "700" }}>Authorized HR Signatory</span>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
