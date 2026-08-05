import React, { useEffect, useState } from "react";
import {
  recruitmentApi,
  JobRequisitionRecord,
  CandidatePipelineRecord,
  InductionTrackerRecord,
  ChecklistItem,
} from "../api/recruitmentApi";

export default function RecruitmentInductionPage() {
  const [activeTab, setActiveTab] = useState<"jobs" | "candidates" | "induction">("jobs");

  // Data states
  const [jobs, setJobs] = useState<JobRequisitionRecord[]>([]);
  const [candidates, setCandidates] = useState<CandidatePipelineRecord[]>([]);
  const [inductions, setInductions] = useState<InductionTrackerRecord[]>([]);
  const [loading, setLoading] = useState(false);

  // Filters & Search for Requisitions
  const [reqSearch, setReqSearch] = useState("");
  const [reqDeptFilter, setReqDeptFilter] = useState("ALL");
  const [reqCategoryFilter, setReqCategoryFilter] = useState("ALL");

  // View Modal State
  const [selectedJobView, setSelectedJobView] = useState<JobRequisitionRecord | null>(null);

  // Modals for Candidate & Induction
  const [showCandidateModal, setShowCandidateModal] = useState(false);
  const [showInductionModal, setShowInductionModal] = useState(false);

  // --- EMPLOYEE REQUISITION FORM STATE ---
  const [reqCategory, setReqCategory] = useState("");
  const [customCategory, setCustomCategory] = useState("");
  const [jobTitle, setJobTitle] = useState("");
  const [jobDept, setJobDept] = useState("");
  const [jobPositions, setJobPositions] = useState("");
  const [reasonForVacancy, setReasonForVacancy] = useState("");
  const [employmentType, setEmploymentType] = useState("");
  const [jobExp, setJobExp] = useState("");
  const [requiredQualification, setRequiredQualification] = useState("");
  const [jobSalary, setJobSalary] = useState("");
  const [urgencyLevel, setUrgencyLevel] = useState("");
  const [jobTargetDate, setJobTargetDate] = useState("");
  const [requestedBy, setRequestedBy] = useState("");
  const [jobManager, setJobManager] = useState("");
  const [workLocation, setWorkLocation] = useState("");
  const [jobDesc, setJobDesc] = useState("");
  const [keySkills, setKeySkills] = useState("");

  const [formSubmitting, setFormSubmitting] = useState(false);
  const [formSuccessMsg, setFormSuccessMsg] = useState("");

  // Candidate Form
  const [candName, setCandName] = useState("");
  const [candEmail, setCandEmail] = useState("");
  const [candPhone, setCandPhone] = useState("");
  const [candPosition, setCandPosition] = useState("");
  const [candExp, setCandExp] = useState("3 Years");
  const [candStage, setCandStage] = useState<'Applied' | 'Screening' | 'Interview Scheduled' | 'Offer Sent' | 'Hired' | 'Rejected'>("Applied");
  const [candNotes, setCandNotes] = useState("");

  // Induction Form
  const [indEmpName, setIndEmpName] = useState("");
  const [indEmpCode, setIndEmpCode] = useState("");
  const [indDept, setIndDept] = useState("Quality Control");
  const [indJoiningDate, setIndJoiningDate] = useState(new Date().toISOString().split("T")[0]);
  const [indMentor, setIndMentor] = useState("");

  useEffect(() => {
    loadAllData();
  }, []);

  async function loadAllData() {
    setLoading(true);
    try {
      const [jData, cData, iData] = await Promise.all([
        recruitmentApi.getJobs(),
        recruitmentApi.getCandidates(),
        recruitmentApi.getInductions(),
      ]);
      setJobs(jData || []);
      setCandidates(cData || []);
      setInductions(iData || []);
    } catch (err) {
      console.error("Failed to load recruitment data", err);
    } finally {
      setLoading(false);
    }
  }

  // --- SUBMIT EMPLOYEE REQUISITION FORM ---
  async function handleCreateJobRequisition(e: React.FormEvent) {
    e.preventDefault();
    if (!jobTitle || !jobDept) return;
    setFormSubmitting(true);
    setFormSuccessMsg("");

    try {
      const selectedCategoryStr = reqCategory === "Other" ? (customCategory.trim() || "Other") : reqCategory;
      const fullTitle = `${jobTitle} (${selectedCategoryStr})`;

      await recruitmentApi.createJob({
        title: fullTitle,
        department: jobDept,
        positionsCount: Number(jobPositions) || 1,
        reasonForVacancy,
        employmentType,
        experienceRange: jobExp,
        requiredQualification,
        salaryBudget: jobSalary,
        hiringManager: jobManager,
        requestedBy,
        workLocation,
        targetDate: jobTargetDate,
        urgencyLevel,
        jobDescription: jobDesc,
        keySkills,
      });

      setFormSuccessMsg("✅ Employee Requisition submitted successfully to HR!");
      // Reset form fields
      setJobTitle("");
      setCustomCategory("");
      setJobDesc("");
      setKeySkills("");
      setRequestedBy("");
      setTimeout(() => setFormSuccessMsg(""), 5000);
      loadAllData();
    } catch (err) {
      console.error("Error creating job requisition", err);
    } finally {
      setFormSubmitting(false);
    }
  }

  async function handleDeleteJob(id: string) {
    if (!window.confirm("Are you sure you want to delete this requisition?")) return;
    try {
      await recruitmentApi.deleteJob(id);
      loadAllData();
    } catch (err) {
      console.error("Failed to delete job requisition", err);
    }
  }

  async function handleCreateCandidate(e: React.FormEvent) {
    e.preventDefault();
    if (!candName || !candPosition) return;
    try {
      await recruitmentApi.createCandidate({
        candidateName: candName,
        email: candEmail,
        phone: candPhone,
        positionApplied: candPosition,
        experienceYears: candExp,
        stage: candStage,
        notes: candNotes,
      });
      setShowCandidateModal(false);
      setCandName("");
      setCandEmail("");
      setCandPhone("");
      setCandNotes("");
      loadAllData();
    } catch (err) {
      console.error("Error creating candidate", err);
    }
  }

  async function handleCreateInduction(e: React.FormEvent) {
    e.preventDefault();
    if (!indEmpName || !indDept || !indJoiningDate) return;
    try {
      await recruitmentApi.createInduction({
        employeeName: indEmpName,
        employeeCode: indEmpCode,
        department: indDept,
        joiningDate: indJoiningDate,
        mentorName: indMentor,
      });
      setShowInductionModal(false);
      setIndEmpName("");
      setIndEmpCode("");
      setIndMentor("");
      loadAllData();
    } catch (err) {
      console.error("Error creating induction", err);
    }
  }

  async function handleToggleChecklistItem(induction: InductionTrackerRecord, itemIndex: number) {
    try {
      let items: ChecklistItem[] = [];
      if (induction.checklist_json) {
        items = JSON.parse(induction.checklist_json);
      }
      if (items[itemIndex]) {
        items[itemIndex].completed = !items[itemIndex].completed;
      }
      const allCompleted = items.every((i) => i.completed);
      const anyCompleted = items.some((i) => i.completed);
      const newStatus = allCompleted ? "Completed" : anyCompleted ? "In Progress" : "Pending";

      await recruitmentApi.updateInductionChecklist(induction.id, JSON.stringify(items), newStatus);
      loadAllData();
    } catch (err) {
      console.error("Failed to update checklist item", err);
    }
  }

  // --- Metrics ---
  const openJobsCount = jobs.filter((j) => j.status === "Open" || j.status === "Interviewing").length;
  const activeCandidatesCount = candidates.filter((c) => c.stage !== "Rejected" && c.stage !== "Hired").length;
  const hiredCount = candidates.filter((c) => c.stage === "Hired" || c.stage === "Offer Sent").length;
  const pendingInductionsCount = inductions.filter((i) => i.status !== "Completed").length;

  // Filtered jobs
  const filteredJobs = jobs.filter((j) => {
    const matchesSearch =
      reqSearch === "" ||
      j.title.toLowerCase().includes(reqSearch.toLowerCase()) ||
      j.requisition_code.toLowerCase().includes(reqSearch.toLowerCase()) ||
      j.department.toLowerCase().includes(reqSearch.toLowerCase()) ||
      (j.requested_by && j.requested_by.toLowerCase().includes(reqSearch.toLowerCase()));

    const matchesDept = reqDeptFilter === "ALL" || j.department === reqDeptFilter;
    const matchesCat = reqCategoryFilter === "ALL" || j.title.includes(`(${reqCategoryFilter})`);

    return matchesSearch && matchesDept && matchesCat;
  });

  return (
    <div style={{ background: "#f8fafc", minHeight: "100vh", padding: "24px" }}>
      {/* --- EMPLOYEE REQUISITION FORM --- */}
      {activeTab === "jobs" && (
        <div style={{ display: "flex", flexDirection: "column", gap: "24px" }}>
          {/* Main Form Card */}
          <div style={{ background: "#ffffff", borderRadius: "12px", border: "1px solid #e2e8f0", boxShadow: "0 2px 8px rgba(0,0,0,0.06)", padding: "24px" }}>
            <div style={{ borderBottom: "1px solid #e2e8f0", paddingBottom: "16px", marginBottom: "20px" }}>
              <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                <span style={{ fontSize: "24px" }}>📋</span>
                <div>
                  <h2 style={{ fontSize: "20px", fontWeight: "700", color: "#0f172a", margin: 0 }}>
                    Employee Requisition
                  </h2>
                  <p style={{ fontSize: "13px", color: "#64748b", margin: "2px 0 0 0" }}>
                    Raise manpower requirements to HR for vacant positions to fill across departments, staff levels, and budget specifications.
                  </p>
                </div>
              </div>
            </div>

            {formSuccessMsg && (
              <div style={{ padding: "12px 16px", background: "#f0fdf4", border: "1px solid #bbf7d0", color: "#166534", borderRadius: "8px", fontWeight: "600", fontSize: "14px", marginBottom: "20px" }}>
                {formSuccessMsg}
              </div>
            )}

            <form onSubmit={handleCreateJobRequisition}>
              {/* Category Dropdown */}
              <div style={{ marginBottom: "20px" }}>
                <label style={{ display: "block", fontSize: "13px", fontWeight: "700", color: "#334155", marginBottom: "6px" }}>
                  Staff Category / Level *
                </label>
                <select
                  required
                  value={reqCategory}
                  onChange={(e) => setReqCategory(e.target.value)}
                  style={{ width: "100%", padding: "10px 14px", border: "1px solid #cbd5e1", borderRadius: "8px", fontSize: "14px", fontWeight: "600", color: reqCategory ? "#0f172a" : "#64748b", background: "#f8fafc" }}
                >
                  <option value="" disabled>-- Select Staff Category / Level --</option>
                  <option value="Floor Labour">👷 Floor Labour / Helper</option>
                  <option value="Machine Operator">⚙️ Machine Operator / Craftsman</option>
                  <option value="Supervisor">🔍 Supervisor / Team Lead</option>
                  <option value="Executive">💼 Executive / Officer</option>
                  <option value="Manager">👔 Manager / HOD</option>
                  <option value="Engineer">🛠️ Engineer / Technician</option>
                  <option value="Other">📌 Other (Specify Custom Requirement)</option>
                </select>

                {reqCategory === "Other" && (
                  <div style={{ marginTop: "12px", background: "#f0f9ff", border: "1px solid #bae6fd", padding: "12px", borderRadius: "8px" }}>
                    <label style={{ display: "block", fontSize: "13px", fontWeight: "700", color: "#0369a1", marginBottom: "6px" }}>
                      Specify Custom Category / Staff Requirement *
                    </label>
                    <input
                      type="text"
                      required
                      value={customCategory}
                      onChange={(e) => setCustomCategory(e.target.value)}
                      placeholder="e.g. Apprentice Trainee, Office Boy, Security Guard, Contract Helper"
                      style={{ width: "100%", padding: "9px 12px", border: "1px solid #7dd3fc", borderRadius: "6px", fontSize: "14px", background: "#ffffff" }}
                    />
                  </div>
                )}
              </div>

              {/* Grid 1: Basic Position Details */}
              <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(240px, 1fr))", gap: "16px", marginBottom: "16px" }}>
                <div>
                  <label style={{ display: "block", fontSize: "13px", fontWeight: "600", color: "#334155", marginBottom: "4px" }}>
                    Vacant Position Title *
                  </label>
                  <input
                    type="text"
                    required
                    value={jobTitle}
                    onChange={(e) => setJobTitle(e.target.value)}
                    placeholder="e.g. Senior CNC Operator / Helper / QA Officer"
                    style={{ width: "100%", padding: "9px 12px", border: "1px solid #cbd5e1", borderRadius: "6px", fontSize: "14px" }}
                  />
                </div>

                <div>
                  <label style={{ display: "block", fontSize: "13px", fontWeight: "600", color: "#334155", marginBottom: "4px" }}>
                    Requesting Department *
                  </label>
                  <select
                    required
                    value={jobDept}
                    onChange={(e) => setJobDept(e.target.value)}
                    style={{ width: "100%", padding: "9px 12px", border: "1px solid #cbd5e1", borderRadius: "6px", fontSize: "14px", color: jobDept ? "#0f172a" : "#64748b" }}
                  >
                    <option value="" disabled>-- Select Department --</option>
                    <option value="Production / Machine Shop">Production / Machine Shop</option>
                    <option value="Quality Control & Assurance">Quality Control & Assurance</option>
                    <option value="Maintenance & Electrical">Maintenance & Electrical</option>
                    <option value="Supply Chain & Purchase">Supply Chain & Purchase</option>
                    <option value="Sales & Marketing">Sales & Marketing</option>
                    <option value="Accounts & Finance">Accounts & Finance</option>
                    <option value="HR & Administration">HR & Administration</option>
                    <option value="Design & R&D">Design & R&D</option>
                    <option value="Finishing & Polish">Finishing & Polish</option>
                  </select>
                </div>

                <div>
                  <label style={{ display: "block", fontSize: "13px", fontWeight: "600", color: "#334155", marginBottom: "4px" }}>
                    Number of Vacancies *
                  </label>
                  <input
                    type="number"
                    min="1"
                    required
                    value={jobPositions}
                    onChange={(e) => setJobPositions(e.target.value)}
                    placeholder="e.g. 1"
                    style={{ width: "100%", padding: "9px 12px", border: "1px solid #cbd5e1", borderRadius: "6px", fontSize: "14px" }}
                  />
                </div>
              </div>

              {/* Grid 2: Budget & Reason */}
              <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(240px, 1fr))", gap: "16px", marginBottom: "16px" }}>
                <div>
                  <label style={{ display: "block", fontSize: "13px", fontWeight: "600", color: "#334155", marginBottom: "4px" }}>
                    Budget for Position (Salary Range) *
                  </label>
                  <input
                    type="text"
                    required
                    value={jobSalary}
                    onChange={(e) => setJobSalary(e.target.value)}
                    placeholder="e.g. ₹18,000 - ₹25,000 / month OR ₹3.5 - 5.0 LPA"
                    style={{ width: "100%", padding: "9px 12px", border: "1px solid #cbd5e1", borderRadius: "6px", fontSize: "14px" }}
                  />
                </div>

                <div>
                  <label style={{ display: "block", fontSize: "13px", fontWeight: "600", color: "#334155", marginBottom: "4px" }}>
                    Reason for Vacancy / Requirement
                  </label>
                  <select
                    value={reasonForVacancy}
                    onChange={(e) => setReasonForVacancy(e.target.value)}
                    style={{ width: "100%", padding: "9px 12px", border: "1px solid #cbd5e1", borderRadius: "6px", fontSize: "14px", color: reasonForVacancy ? "#0f172a" : "#64748b" }}
                  >
                    <option value="">-- Select Reason for Requirement --</option>
                    <option value="Employee Replacement">Employee Replacement (Resignation / Exit)</option>
                    <option value="Business Expansion">Business Expansion / Workload Increase</option>
                    <option value="New Department Unit">New Department / Production Line</option>
                    <option value="Temporary Project">Temporary Project / Seasonal Demand</option>
                  </select>
                </div>

                <div>
                  <label style={{ display: "block", fontSize: "13px", fontWeight: "600", color: "#334155", marginBottom: "4px" }}>
                    Employment Type
                  </label>
                  <select
                    value={employmentType}
                    onChange={(e) => setEmploymentType(e.target.value)}
                    style={{ width: "100%", padding: "9px 12px", border: "1px solid #cbd5e1", borderRadius: "6px", fontSize: "14px", color: employmentType ? "#0f172a" : "#64748b" }}
                  >
                    <option value="">-- Select Employment Type --</option>
                    <option value="Full-Time Permanent">Full-Time Permanent</option>
                    <option value="Fixed Term Contract">Fixed Term Contract</option>
                    <option value="Apprentice / Trainee">Apprentice / Trainee</option>
                    <option value="Daily Wages / Temporary">Daily Wages / Temporary</option>
                  </select>
                </div>
              </div>

              {/* Grid 3: Qualifications & Urgency */}
              <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(240px, 1fr))", gap: "16px", marginBottom: "16px" }}>
                <div>
                  <label style={{ display: "block", fontSize: "13px", fontWeight: "600", color: "#334155", marginBottom: "4px" }}>
                    Required Qualification
                  </label>
                  <select
                    value={requiredQualification}
                    onChange={(e) => setRequiredQualification(e.target.value)}
                    style={{ width: "100%", padding: "9px 12px", border: "1px solid #cbd5e1", borderRadius: "6px", fontSize: "14px", color: requiredQualification ? "#0f172a" : "#64748b" }}
                  >
                    <option value="">-- Select Required Qualification --</option>
                    <option value="10th / 12th Pass">10th / 12th Pass (Labor/Helper)</option>
                    <option value="ITI / Technical Diploma">ITI / Technical Diploma</option>
                    <option value="BE / B.Tech / Engineering">BE / B.Tech / Engineering</option>
                    <option value="Graduate (B.Com/B.Sc/BA)">Graduate (B.Com/B.Sc/BA)</option>
                    <option value="Post Graduate (MBA/M.Tech)">Post Graduate (MBA/M.Tech)</option>
                    <option value="No Specific Requirement">No Specific Requirement</option>
                  </select>
                </div>

                <div>
                  <label style={{ display: "block", fontSize: "13px", fontWeight: "600", color: "#334155", marginBottom: "4px" }}>
                    Required Experience
                  </label>
                  <input
                    type="text"
                    value={jobExp}
                    onChange={(e) => setJobExp(e.target.value)}
                    placeholder="e.g. Fresher / 1-3 Years / 5+ Years"
                    style={{ width: "100%", padding: "9px 12px", border: "1px solid #cbd5e1", borderRadius: "6px", fontSize: "14px" }}
                  />
                </div>

                <div>
                  <label style={{ display: "block", fontSize: "13px", fontWeight: "600", color: "#334155", marginBottom: "4px" }}>
                    Hiring Urgency
                  </label>
                  <select
                    value={urgencyLevel}
                    onChange={(e) => setUrgencyLevel(e.target.value)}
                    style={{ width: "100%", padding: "9px 12px", border: "1px solid #cbd5e1", borderRadius: "6px", fontSize: "14px", color: urgencyLevel ? "#0f172a" : "#64748b" }}
                  >
                    <option value="">-- Select Hiring Urgency --</option>
                    <option value="Immediate">🔴 Immediate (Within 7 Days)</option>
                    <option value="High">🟠 High (Within 15 Days)</option>
                    <option value="Medium">🔵 Medium (Within 30 Days)</option>
                    <option value="Standard">⚪ Standard (60 Days)</option>
                  </select>
                </div>
              </div>

              {/* Grid 4: Requisition Authority & Location */}
              <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(240px, 1fr))", gap: "16px", marginBottom: "16px" }}>
                <div>
                  <label style={{ display: "block", fontSize: "13px", fontWeight: "600", color: "#334155", marginBottom: "4px" }}>
                    Requested By (HOD / Manager Name)
                  </label>
                  <input
                    type="text"
                    value={requestedBy}
                    onChange={(e) => setRequestedBy(e.target.value)}
                    placeholder="e.g. Production Manager / Rajesh Sharma"
                    style={{ width: "100%", padding: "9px 12px", border: "1px solid #cbd5e1", borderRadius: "6px", fontSize: "14px" }}
                  />
                </div>

                <div>
                  <label style={{ display: "block", fontSize: "13px", fontWeight: "600", color: "#334155", marginBottom: "4px" }}>
                    Target Closure Date
                  </label>
                  <input
                    type="date"
                    value={jobTargetDate}
                    onChange={(e) => setJobTargetDate(e.target.value)}
                    style={{ width: "100%", padding: "9px 12px", border: "1px solid #cbd5e1", borderRadius: "6px", fontSize: "14px" }}
                  />
                </div>

                <div>
                  <label style={{ display: "block", fontSize: "13px", fontWeight: "600", color: "#334155", marginBottom: "4px" }}>
                    Work Location
                  </label>
                  <input
                    type="text"
                    value={workLocation}
                    onChange={(e) => setWorkLocation(e.target.value)}
                    placeholder="e.g. Main Unit / Plant 2"
                    style={{ width: "100%", padding: "9px 12px", border: "1px solid #cbd5e1", borderRadius: "6px", fontSize: "14px" }}
                  />
                </div>
              </div>

              {/* Details & Skills */}
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "16px", marginBottom: "20px" }}>
                <div>
                  <label style={{ display: "block", fontSize: "13px", fontWeight: "600", color: "#334155", marginBottom: "4px" }}>
                    Key Skills & Technical Requirements
                  </label>
                  <textarea
                    rows={3}
                    value={keySkills}
                    onChange={(e) => setKeySkills(e.target.value)}
                    placeholder="e.g. CNC Machine Setup, Woodworking tools, Drawings reading..."
                    style={{ width: "100%", padding: "9px 12px", border: "1px solid #cbd5e1", borderRadius: "6px", fontSize: "13px" }}
                  />
                </div>

                <div>
                  <label style={{ display: "block", fontSize: "13px", fontWeight: "600", color: "#334155", marginBottom: "4px" }}>
                    Job Description & Remarks
                  </label>
                  <textarea
                    rows={3}
                    value={jobDesc}
                    onChange={(e) => setJobDesc(e.target.value)}
                    placeholder="Detailed duties, shift timing, special instructions..."
                    style={{ width: "100%", padding: "9px 12px", border: "1px solid #cbd5e1", borderRadius: "6px", fontSize: "13px" }}
                  />
                </div>
              </div>

              {/* Submit Button Bar */}
              <div style={{ display: "flex", justifyContent: "flex-end", gap: "12px", borderTop: "1px solid #e2e8f0", paddingTop: "16px" }}>
                <button
                  type="submit"
                  disabled={formSubmitting}
                  style={{
                    padding: "10px 24px",
                    background: "#0284c7",
                    color: "#ffffff",
                    border: "none",
                    borderRadius: "8px",
                    fontSize: "14px",
                    fontWeight: "700",
                    cursor: "pointer",
                    boxShadow: "0 2px 4px rgba(2, 132, 199, 0.3)",
                  }}
                >
                  {formSubmitting ? "Submitting Requisition..." : "Submit Employee Requisition to HR"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* --- TAB 2: CANDIDATE PIPELINE --- */}
      {activeTab === "candidates" && (
        <div style={{ background: "#ffffff", borderRadius: "10px", padding: "20px", border: "1px solid #e2e8f0", boxShadow: "0 1px 3px rgba(0,0,0,0.05)" }}>
          {loading ? (
            <p style={{ color: "#64748b" }}>Loading candidates...</p>
          ) : candidates.length === 0 ? (
            <p style={{ color: "#94a3b8", textAlign: "center", padding: "20px" }}>No candidates in pipeline yet.</p>
          ) : (
            <div style={{ overflowX: "auto" }}>
              <table style={{ width: "100%", borderCollapse: "collapse", textAlign: "left" }}>
                <thead>
                  <tr style={{ borderBottom: "2px solid #e2e8f0", background: "#f8fafc" }}>
                    <th style={{ padding: "12px", fontSize: "13px", color: "#475569" }}>Candidate Name</th>
                    <th style={{ padding: "12px", fontSize: "13px", color: "#475569" }}>Position Applied</th>
                    <th style={{ padding: "12px", fontSize: "13px", color: "#475569" }}>Contact Info</th>
                    <th style={{ padding: "12px", fontSize: "13px", color: "#475569" }}>Experience</th>
                    <th style={{ padding: "12px", fontSize: "13px", color: "#475569" }}>Stage</th>
                    <th style={{ padding: "12px", fontSize: "13px", color: "#475569" }}>Rating</th>
                    <th style={{ padding: "12px", fontSize: "13px", color: "#475569" }}>Notes</th>
                  </tr>
                </thead>
                <tbody>
                  {candidates.map((c) => (
                    <tr key={c.id} style={{ borderBottom: "1px solid #f1f5f9" }}>
                      <td style={{ padding: "12px", fontSize: "14px", fontWeight: "600", color: "#0f172a" }}>{c.candidate_name}</td>
                      <td style={{ padding: "12px", fontSize: "13px", color: "#334155" }}>{c.position_applied}</td>
                      <td style={{ padding: "12px", fontSize: "13px", color: "#64748b" }}>
                        <div>{c.email || "-"}</div>
                        <div style={{ fontSize: "12px", color: "#94a3b8" }}>{c.phone}</div>
                      </td>
                      <td style={{ padding: "12px", fontSize: "13px", color: "#334155" }}>{c.experience_years || "-"}</td>
                      <td style={{ padding: "12px" }}>
                        <span
                          style={{
                            padding: "4px 10px",
                            borderRadius: "12px",
                            fontSize: "12px",
                            fontWeight: "600",
                            background:
                              c.stage === "Hired"
                                ? "#dcfce7"
                                : c.stage === "Offer Sent"
                                ? "#fef3c7"
                                : c.stage === "Rejected"
                                ? "#fee2e2"
                                : "#e0f2fe",
                            color:
                              c.stage === "Hired"
                                ? "#166534"
                                : c.stage === "Offer Sent"
                                ? "#92400e"
                                : c.stage === "Rejected"
                                ? "#991b1b"
                                : "#0369a1",
                          }}
                        >
                          {c.stage}
                        </span>
                      </td>
                      <td style={{ padding: "12px", fontSize: "13px", color: "#eab308" }}>
                        {"★".repeat(c.rating || 0)}
                      </td>
                      <td style={{ padding: "12px", fontSize: "13px", color: "#64748b", maxWidth: "200px" }}>{c.notes || "-"}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* --- TAB 3: INDUCTION TRACKER --- */}
      {activeTab === "induction" && (
        <div style={{ background: "#ffffff", borderRadius: "10px", padding: "20px", border: "1px solid #e2e8f0", boxShadow: "0 1px 3px rgba(0,0,0,0.05)" }}>
          {loading ? (
            <p style={{ color: "#64748b" }}>Loading onboarding inductions...</p>
          ) : inductions.length === 0 ? (
            <p style={{ color: "#94a3b8", textAlign: "center", padding: "20px" }}>No employee inductions initiated yet.</p>
          ) : (
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(320px, 1fr))", gap: "16px" }}>
              {inductions.map((ind) => {
                let checklist: ChecklistItem[] = [];
                if (ind.checklist_json) {
                  try {
                    checklist = JSON.parse(ind.checklist_json);
                  } catch (e) {}
                }
                const completedCount = checklist.filter((i) => i.completed).length;

                return (
                  <div key={ind.id} style={{ border: "1px solid #cbd5e1", borderRadius: "8px", padding: "16px", background: "#f8fafc" }}>
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "10px" }}>
                      <div>
                        <h4 style={{ fontSize: "16px", fontWeight: "700", margin: "0 0 2px 0", color: "#0f172a" }}>{ind.employee_name}</h4>
                        <span style={{ fontSize: "12px", color: "#64748b" }}>{ind.employee_code} • {ind.department}</span>
                      </div>
                      <span
                        style={{
                          padding: "2px 8px",
                          borderRadius: "10px",
                          fontSize: "11px",
                          fontWeight: "700",
                          background: ind.status === "Completed" ? "#dcfce7" : "#fef3c7",
                          color: ind.status === "Completed" ? "#166534" : "#92400e",
                        }}
                      >
                        {ind.status}
                      </span>
                    </div>

                    <div style={{ fontSize: "12px", color: "#475569", marginBottom: "12px" }}>
                      📅 Joining Date: <strong>{ind.joining_date}</strong> {ind.mentor_name ? `• Mentor: ${ind.mentor_name}` : ""}
                    </div>

                    <div style={{ fontSize: "13px", fontWeight: "700", color: "#334155", marginBottom: "6px" }}>
                      Onboarding Checklist ({completedCount}/{checklist.length})
                    </div>
                    <div style={{ display: "flex", flexDirection: "column", gap: "6px" }}>
                      {checklist.map((item, idx) => (
                        <label
                          key={item.id || idx}
                          style={{
                            display: "flex",
                            alignItems: "center",
                            gap: "8px",
                            background: "#ffffff",
                            padding: "8px 12px",
                            borderRadius: "6px",
                            border: "1px solid #e2e8f0",
                            fontSize: "13px",
                            color: item.completed ? "#166534" : "#334155",
                            cursor: "pointer",
                          }}
                        >
                          <input
                            type="checkbox"
                            checked={item.completed}
                            onChange={() => handleToggleChecklistItem(ind, idx)}
                            style={{ cursor: "pointer" }}
                          />
                          <span style={{ textDecoration: item.completed ? "line-through" : "none" }}>{item.title}</span>
                        </label>
                      ))}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* --- MODAL VIEW DETAILS --- */}
      {selectedJobView && (
        <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.5)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 1000 }}>
          <div style={{ background: "#ffffff", borderRadius: "12px", width: "90%", maxWidth: "600px", padding: "24px", boxShadow: "0 10px 25px rgba(0,0,0,0.2)" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", borderBottom: "1px solid #e2e8f0", paddingBottom: "12px", marginBottom: "16px" }}>
              <div>
                <span style={{ fontSize: "12px", fontWeight: "700", color: "#0284c7" }}>{selectedJobView.requisition_code}</span>
                <h3 style={{ fontSize: "18px", fontWeight: "700", color: "#0f172a", margin: "2px 0 0 0" }}>{selectedJobView.title}</h3>
              </div>
              <button
                onClick={() => setSelectedJobView(null)}
                style={{ background: "none", border: "none", fontSize: "20px", cursor: "pointer", color: "#64748b" }}
              >
                ✕
              </button>
            </div>

            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "12px", fontSize: "13px", marginBottom: "16px" }}>
              <div><strong>Department:</strong> {selectedJobView.department}</div>
              <div><strong>Positions Count:</strong> {selectedJobView.positions_count}</div>
              <div><strong>Reason for Vacancy:</strong> {selectedJobView.reason_for_vacancy || "-"}</div>
              <div><strong>Employment Type:</strong> {selectedJobView.employment_type || "-"}</div>
              <div><strong>Salary Budget:</strong> {selectedJobView.salary_budget || "-"}</div>
              <div><strong>Required Experience:</strong> {selectedJobView.experience_range || "-"}</div>
              <div><strong>Qualification:</strong> {selectedJobView.required_qualification || "-"}</div>
              <div><strong>Urgency:</strong> {selectedJobView.urgency_level || "-"}</div>
              <div><strong>Requested By:</strong> {selectedJobView.requested_by || "-"}</div>
              <div><strong>Target Closure Date:</strong> {selectedJobView.target_date || "-"}</div>
              <div><strong>Work Location:</strong> {selectedJobView.work_location || "-"}</div>
              <div><strong>Status:</strong> {selectedJobView.status}</div>
            </div>

            {selectedJobView.key_skills && (
              <div style={{ marginBottom: "12px", fontSize: "13px" }}>
                <strong>Key Skills & Technical Requirements:</strong>
                <p style={{ margin: "4px 0 0 0", color: "#475569", background: "#f8fafc", padding: "8px 12px", borderRadius: "6px" }}>
                  {selectedJobView.key_skills}
                </p>
              </div>
            )}

            {selectedJobView.job_description && (
              <div style={{ marginBottom: "20px", fontSize: "13px" }}>
                <strong>Job Description / Remarks:</strong>
                <p style={{ margin: "4px 0 0 0", color: "#475569", background: "#f8fafc", padding: "8px 12px", borderRadius: "6px" }}>
                  {selectedJobView.job_description}
                </p>
              </div>
            )}

            <div style={{ display: "flex", justifyContent: "flex-end" }}>
              <button
                onClick={() => setSelectedJobView(null)}
                style={{ padding: "8px 16px", background: "#0284c7", color: "#fff", border: "none", borderRadius: "6px", fontWeight: "600" }}
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* --- MODAL 2: ADD CANDIDATE --- */}
      {showCandidateModal && (
        <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.5)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 1000 }}>
          <div style={{ background: "#ffffff", borderRadius: "10px", width: "90%", maxWidth: "550px", padding: "24px", boxShadow: "0 4px 12px rgba(0,0,0,0.15)" }}>
            <h2 style={{ marginTop: 0, fontSize: "18px", fontWeight: "700", color: "#0f172a" }}>👥 Add Candidate to Pipeline</h2>
            <form onSubmit={handleCreateCandidate}>
              <div style={{ marginBottom: "12px" }}>
                <label style={{ display: "block", fontSize: "13px", fontWeight: "600", marginBottom: "4px" }}>Candidate Name *</label>
                <input
                  type="text"
                  required
                  value={candName}
                  onChange={(e) => setCandName(e.target.value)}
                  placeholder="e.g. Ramesh Kumar"
                  style={{ width: "100%", padding: "8px 12px", border: "1px solid #cbd5e1", borderRadius: "6px" }}
                />
              </div>

              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "12px", marginBottom: "12px" }}>
                <div>
                  <label style={{ display: "block", fontSize: "13px", fontWeight: "600", marginBottom: "4px" }}>Position Applied *</label>
                  <input
                    type="text"
                    required
                    value={candPosition}
                    onChange={(e) => setCandPosition(e.target.value)}
                    placeholder="e.g. CNC Machine Operator"
                    style={{ width: "100%", padding: "8px 12px", border: "1px solid #cbd5e1", borderRadius: "6px" }}
                  />
                </div>
                <div>
                  <label style={{ display: "block", fontSize: "13px", fontWeight: "600", marginBottom: "4px" }}>Initial Stage</label>
                  <select
                    value={candStage}
                    onChange={(e) => setCandStage(e.target.value as any)}
                    style={{ width: "100%", padding: "8px 12px", border: "1px solid #cbd5e1", borderRadius: "6px" }}
                  >
                    <option value="Applied">Applied</option>
                    <option value="Screening">Screening</option>
                    <option value="Interview Scheduled">Interview Scheduled</option>
                    <option value="Offer Sent">Offer Sent</option>
                    <option value="Hired">Hired</option>
                    <option value="Rejected">Rejected</option>
                  </select>
                </div>
              </div>

              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "12px", marginBottom: "12px" }}>
                <div>
                  <label style={{ display: "block", fontSize: "13px", fontWeight: "600", marginBottom: "4px" }}>Email Address</label>
                  <input
                    type="email"
                    value={candEmail}
                    onChange={(e) => setCandEmail(e.target.value)}
                    style={{ width: "100%", padding: "8px 12px", border: "1px solid #cbd5e1", borderRadius: "6px" }}
                  />
                </div>
                <div>
                  <label style={{ display: "block", fontSize: "13px", fontWeight: "600", marginBottom: "4px" }}>Phone Number</label>
                  <input
                    type="text"
                    value={candPhone}
                    onChange={(e) => setCandPhone(e.target.value)}
                    style={{ width: "100%", padding: "8px 12px", border: "1px solid #cbd5e1", borderRadius: "6px" }}
                  />
                </div>
              </div>

              <div style={{ marginBottom: "16px" }}>
                <label style={{ display: "block", fontSize: "13px", fontWeight: "600", marginBottom: "4px" }}>HR Notes & Feedback</label>
                <textarea
                  rows={3}
                  value={candNotes}
                  onChange={(e) => setCandNotes(e.target.value)}
                  style={{ width: "100%", padding: "8px 12px", border: "1px solid #cbd5e1", borderRadius: "6px" }}
                />
              </div>

              <div style={{ display: "flex", justifyContent: "flex-end", gap: "8px" }}>
                <button
                  type="button"
                  onClick={() => setShowCandidateModal(false)}
                  style={{ padding: "8px 16px", background: "#f1f5f9", border: "1px solid #cbd5e1", borderRadius: "6px" }}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  style={{ padding: "8px 16px", background: "#0284c7", color: "#fff", border: "none", borderRadius: "6px", fontWeight: "600" }}
                >
                  Add Candidate
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* --- MODAL 3: INITIATE INDUCTION --- */}
      {showInductionModal && (
        <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.5)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 1000 }}>
          <div style={{ background: "#ffffff", borderRadius: "10px", width: "90%", maxWidth: "550px", padding: "24px", boxShadow: "0 4px 12px rgba(0,0,0,0.15)" }}>
            <h2 style={{ marginTop: 0, fontSize: "18px", fontWeight: "700", color: "#0f172a" }}>🚀 Initiate New Employee Induction</h2>
            <form onSubmit={handleCreateInduction}>
              <div style={{ marginBottom: "12px" }}>
                <label style={{ display: "block", fontSize: "13px", fontWeight: "600", marginBottom: "4px" }}>New Employee Name *</label>
                <input
                  type="text"
                  required
                  value={indEmpName}
                  onChange={(e) => setIndEmpName(e.target.value)}
                  placeholder="e.g. Ankit Sharma"
                  style={{ width: "100%", padding: "8px 12px", border: "1px solid #cbd5e1", borderRadius: "6px" }}
                />
              </div>

              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "12px", marginBottom: "12px" }}>
                <div>
                  <label style={{ display: "block", fontSize: "13px", fontWeight: "600", marginBottom: "4px" }}>Employee Code / ID</label>
                  <input
                    type="text"
                    value={indEmpCode}
                    onChange={(e) => setIndEmpCode(e.target.value)}
                    placeholder="e.g. LII-2026-101"
                    style={{ width: "100%", padding: "8px 12px", border: "1px solid #cbd5e1", borderRadius: "6px" }}
                  />
                </div>
                <div>
                  <label style={{ display: "block", fontSize: "13px", fontWeight: "600", marginBottom: "4px" }}>Department *</label>
                  <input
                    type="text"
                    required
                    value={indDept}
                    onChange={(e) => setIndDept(e.target.value)}
                    style={{ width: "100%", padding: "8px 12px", border: "1px solid #cbd5e1", borderRadius: "6px" }}
                  />
                </div>
              </div>

              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "12px", marginBottom: "16px" }}>
                <div>
                  <label style={{ display: "block", fontSize: "13px", fontWeight: "600", marginBottom: "4px" }}>Joining Date *</label>
                  <input
                    type="date"
                    required
                    value={indJoiningDate}
                    onChange={(e) => setIndJoiningDate(e.target.value)}
                    style={{ width: "100%", padding: "8px 12px", border: "1px solid #cbd5e1", borderRadius: "6px" }}
                  />
                </div>
                <div>
                  <label style={{ display: "block", fontSize: "13px", fontWeight: "600", marginBottom: "4px" }}>Assigned Mentor / Buddy</label>
                  <input
                    type="text"
                    value={indMentor}
                    onChange={(e) => setIndMentor(e.target.value)}
                    placeholder="e.g. Senior Engineer Name"
                    style={{ width: "100%", padding: "8px 12px", border: "1px solid #cbd5e1", borderRadius: "6px" }}
                  />
                </div>
              </div>

              <div style={{ display: "flex", justifyContent: "flex-end", gap: "8px" }}>
                <button
                  type="button"
                  onClick={() => setShowInductionModal(false)}
                  style={{ padding: "8px 16px", background: "#f1f5f9", border: "1px solid #cbd5e1", borderRadius: "6px" }}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  style={{ padding: "8px 16px", background: "#0284c7", color: "#fff", border: "none", borderRadius: "6px", fontWeight: "600" }}
                >
                  Initiate Onboarding
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
