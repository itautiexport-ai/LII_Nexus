import React, { useState, useEffect } from "react";
import { performanceEvaluationApi, EvaluationListItem, EvaluationData } from "../api/performanceEvaluationApi";

export default function EvaluationsListPage() {
  const [evaluations, setEvaluations] = useState<EvaluationListItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [activeTab, setActiveTab] = useState<"all" | "pendingHod" | "pendingHr" | "completed">("all");

  // Modal states for evaluating inline
  const [evalModal, setEvalModal] = useState<{
    type: "hod" | "hr";
    employee: EvaluationListItem;
  } | null>(null);

  const [hodFormData, setHodFormData] = useState<EvaluationData>({
    employeeId: "",
    evaluationPeriod: "",
    score: 0,
    comments: "",
    qualityOfWork: 0,
    technicalCompetence: 0,
    leadership: 0,
    teamBehaviour: 0,
    initiative: 0,
    costSaving: 0,
  });

  const [hrFormData, setHrFormData] = useState<EvaluationData>({
    employeeId: "",
    evaluationPeriod: "",
    score: 0,
    comments: "",
    attendancePunctuality: 0,
    discipline: 0,
    behaviourAttitude: 0,
    communication: 0,
    responsibilityAccountability: 0,
    workEthics: 0,
    teamContribution: 0,
    attendancePercentage: 100,
  });

  const [submittingModal, setSubmittingModal] = useState(false);
  const [modalMessage, setModalMessage] = useState<{ type: "error" | "success"; text: string } | null>(null);

  // Get current week string e.g. "2026-W41"
  const getCurrentWeekString = () => {
    const d = new Date();
    const year = d.getFullYear();
    const dFirst = new Date(year, 0, 4);
    const dayNum = dFirst.getDay() || 7;
    dFirst.setDate(dFirst.getDate() - dayNum + 1);
    const weekNum = Math.ceil(((d.getTime() - dFirst.getTime()) / 86400000 + 1) / 7);
    return `${year}-W${weekNum.toString().padStart(2, "0")}`;
  };

  const loadData = async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await performanceEvaluationApi.getEvaluationList();
      setEvaluations(data);
    } catch (err: any) {
      console.error("Failed to load evaluations list:", err);
      setError(err?.response?.data?.error || err.message || "Failed to load evaluation list.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const openHodModal = (emp: EvaluationListItem) => {
    setHodFormData({
      employeeId: emp.employeeId,
      evaluationPeriod: getCurrentWeekString(),
      score: 0,
      comments: "",
      qualityOfWork: 5,
      technicalCompetence: 5,
      leadership: 5,
      teamBehaviour: 5,
      initiative: 5,
      costSaving: 5,
    });
    setModalMessage(null);
    setEvalModal({ type: "hod", employee: emp });
  };

  const openHrModal = (emp: EvaluationListItem) => {
    setHrFormData({
      employeeId: emp.employeeId,
      evaluationPeriod: getCurrentWeekString(),
      score: 0,
      comments: "",
      attendancePunctuality: 5,
      discipline: 5,
      behaviourAttitude: 5,
      communication: 5,
      responsibilityAccountability: 5,
      workEthics: 5,
      teamContribution: 5,
      attendancePercentage: 100,
    });
    setModalMessage(null);
    setEvalModal({ type: "hr", employee: emp });
  };

  const handleHodChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setHodFormData((prev) => {
      const isNum = ["qualityOfWork", "technicalCompetence", "leadership", "teamBehaviour", "initiative", "costSaving"].includes(name);
      const val = isNum ? parseFloat(value) || 0 : value;
      const updated = { ...prev, [name]: val };
      if (isNum) {
        const avg =
          ((updated.qualityOfWork || 0) +
            (updated.technicalCompetence || 0) +
            (updated.leadership || 0) +
            (updated.teamBehaviour || 0) +
            (updated.initiative || 0) +
            (updated.costSaving || 0)) /
          6;
        updated.score = parseFloat(avg.toFixed(2));
      }
      return updated;
    });
  };

  const handleHrChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setHrFormData((prev) => {
      const isNum = ["attendancePunctuality", "discipline", "behaviourAttitude", "communication", "responsibilityAccountability", "workEthics", "teamContribution", "attendancePercentage"].includes(name);
      const val = isNum ? parseFloat(value) || 0 : value;
      const updated = { ...prev, [name]: val };
      if (isNum && name !== "attendancePercentage") {
        const avg =
          ((updated.attendancePunctuality || 0) +
            (updated.discipline || 0) +
            (updated.behaviourAttitude || 0) +
            (updated.communication || 0) +
            (updated.responsibilityAccountability || 0) +
            (updated.workEthics || 0) +
            (updated.teamContribution || 0)) /
          7;
        updated.score = parseFloat(avg.toFixed(2));
      }
      return updated;
    });
  };

  const submitHodEvaluation = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmittingModal(true);
    setModalMessage(null);
    try {
      await performanceEvaluationApi.createHodEvaluation(hodFormData);
      setModalMessage({ type: "success", text: "HOD Evaluation saved successfully! Updating ERM Score..." });
      setTimeout(() => {
        setEvalModal(null);
        loadData();
      }, 800);
    } catch (err: any) {
      setModalMessage({ type: "error", text: err.message || "Failed to submit evaluation." });
    } finally {
      setSubmittingModal(false);
    }
  };

  const submitHrEvaluation = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmittingModal(true);
    setModalMessage(null);
    try {
      await performanceEvaluationApi.createHrEvaluation(hrFormData);
      setModalMessage({ type: "success", text: "HR Evaluation saved successfully! Updating ERM Score..." });
      setTimeout(() => {
        setEvalModal(null);
        loadData();
      }, 800);
    } catch (err: any) {
      setModalMessage({ type: "error", text: err.message || "Failed to submit evaluation." });
    } finally {
      setSubmittingModal(false);
    }
  };

  // Filtered list
  const filteredList = evaluations.filter((item) => {
    const matchesSearch =
      !searchQuery ||
      item.fullName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.employeeCode.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.departmentName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.hodName.toLowerCase().includes(searchQuery.toLowerCase());

    if (!matchesSearch) return false;

    if (activeTab === "pendingHod") return item.isPendingHod;
    if (activeTab === "pendingHr") return item.isPendingHr;
    if (activeTab === "completed") return !item.isPendingHod && !item.isPendingHr;
    return true;
  });

  const pendingHodCount = evaluations.filter((e) => e.isPendingHod).length;
  const pendingHrCount = evaluations.filter((e) => e.isPendingHr).length;
  const completedCount = evaluations.filter((e) => !e.isPendingHod && !e.isPendingHr).length;

  return (
    <div style={{ padding: "24px", maxWidth: "1400px", margin: "0 auto", fontFamily: "Inter, system-ui, sans-serif" }}>
      {/* Header */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "24px", flexWrap: "wrap", gap: "16px" }}>
        <div>
          <h1 style={{ fontSize: "24px", fontWeight: 700, color: "#0f172a", margin: 0 }}>List of Performance Evaluations</h1>
          <p style={{ color: "#64748b", margin: "4px 0 0 0", fontSize: "14px" }}>
            Comprehensive list of pending and completed employee evaluations for HODs and HR. Submitting an evaluation updates ERM scoring live.
          </p>
        </div>
        <button
          onClick={loadData}
          style={{
            padding: "8px 16px",
            backgroundColor: "#2563eb",
            color: "#ffffff",
            border: "none",
            borderRadius: "6px",
            fontWeight: 600,
            cursor: "pointer",
            display: "flex",
            alignItems: "center",
            gap: "8px",
            boxShadow: "0 1px 2px rgba(0,0,0,0.05)"
          }}
        >
          🔄 Refresh List
        </button>
      </div>

      {/* Summary KPI Cards */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(240px, 1fr))", gap: "16px", marginBottom: "24px" }}>
        <div style={{ backgroundColor: "#ffffff", padding: "20px", borderRadius: "10px", border: "1px solid #e2e8f0", boxShadow: "0 1px 3px rgba(0,0,0,0.05)" }}>
          <p style={{ margin: 0, fontSize: "13px", color: "#64748b", fontWeight: 600 }}>Total Assigned Employees</p>
          <p style={{ margin: "8px 0 0 0", fontSize: "28px", fontWeight: 800, color: "#0f172a" }}>{evaluations.length}</p>
        </div>
        <div style={{ backgroundColor: "#ffffff", padding: "20px", borderRadius: "10px", border: "1px solid #fde68a", background: "#fffbeb", boxShadow: "0 1px 3px rgba(0,0,0,0.05)" }}>
          <p style={{ margin: 0, fontSize: "13px", color: "#b45309", fontWeight: 600 }}>Pending HOD Evaluations</p>
          <p style={{ margin: "8px 0 0 0", fontSize: "28px", fontWeight: 800, color: "#d97706" }}>{pendingHodCount}</p>
        </div>
        <div style={{ backgroundColor: "#ffffff", padding: "20px", borderRadius: "10px", border: "1px solid #bfdbfe", background: "#eff6ff", boxShadow: "0 1px 3px rgba(0,0,0,0.05)" }}>
          <p style={{ margin: 0, fontSize: "13px", color: "#1d4ed8", fontWeight: 600 }}>Pending HR Evaluations</p>
          <p style={{ margin: "8px 0 0 0", fontSize: "28px", fontWeight: 800, color: "#2563eb" }}>{pendingHrCount}</p>
        </div>
        <div style={{ backgroundColor: "#ffffff", padding: "20px", borderRadius: "10px", border: "1px solid #bbf7d0", background: "#f0fdf4", boxShadow: "0 1px 3px rgba(0,0,0,0.05)" }}>
          <p style={{ margin: 0, fontSize: "13px", color: "#15803d", fontWeight: 600 }}>Fully Completed</p>
          <p style={{ margin: "8px 0 0 0", fontSize: "28px", fontWeight: 800, color: "#16a34a" }}>{completedCount}</p>
        </div>
      </div>

      {/* Filter Tabs & Search Bar */}
      <div style={{ backgroundColor: "#ffffff", padding: "16px", borderRadius: "10px", border: "1px solid #e2e8f0", marginBottom: "20px", display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: "16px" }}>
        <div style={{ display: "flex", gap: "8px", flexWrap: "wrap" }}>
          <button
            onClick={() => setActiveTab("all")}
            style={{
              padding: "8px 16px",
              borderRadius: "6px",
              border: "1px solid",
              borderColor: activeTab === "all" ? "#2563eb" : "#cbd5e1",
              backgroundColor: activeTab === "all" ? "#eff6ff" : "#ffffff",
              color: activeTab === "all" ? "#1d4ed8" : "#475569",
              fontWeight: 600,
              fontSize: "13px",
              cursor: "pointer"
            }}
          >
            All Employees ({evaluations.length})
          </button>
          <button
            onClick={() => setActiveTab("pendingHod")}
            style={{
              padding: "8px 16px",
              borderRadius: "6px",
              border: "1px solid",
              borderColor: activeTab === "pendingHod" ? "#d97706" : "#cbd5e1",
              backgroundColor: activeTab === "pendingHod" ? "#fffbeb" : "#ffffff",
              color: activeTab === "pendingHod" ? "#b45309" : "#475569",
              fontWeight: 600,
              fontSize: "13px",
              cursor: "pointer"
            }}
          >
            Pending HOD ({pendingHodCount})
          </button>
          <button
            onClick={() => setActiveTab("pendingHr")}
            style={{
              padding: "8px 16px",
              borderRadius: "6px",
              border: "1px solid",
              borderColor: activeTab === "pendingHr" ? "#2563eb" : "#cbd5e1",
              backgroundColor: activeTab === "pendingHr" ? "#eff6ff" : "#ffffff",
              color: activeTab === "pendingHr" ? "#1d4ed8" : "#475569",
              fontWeight: 600,
              fontSize: "13px",
              cursor: "pointer"
            }}
          >
            Pending HR ({pendingHrCount})
          </button>
          <button
            onClick={() => setActiveTab("completed")}
            style={{
              padding: "8px 16px",
              borderRadius: "6px",
              border: "1px solid",
              borderColor: activeTab === "completed" ? "#16a34a" : "#cbd5e1",
              backgroundColor: activeTab === "completed" ? "#f0fdf4" : "#ffffff",
              color: activeTab === "completed" ? "#15803d" : "#475569",
              fontWeight: 600,
              fontSize: "13px",
              cursor: "pointer"
            }}
          >
            Completed ({completedCount})
          </button>
        </div>

        <input
          type="text"
          placeholder="Search Employee, Code, Department or HOD..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          style={{
            padding: "8px 14px",
            border: "1px solid #cbd5e1",
            borderRadius: "6px",
            fontSize: "13px",
            width: "300px",
            maxWidth: "100%"
          }}
        />
      </div>

      {/* Content Table */}
      {loading ? (
        <div style={{ backgroundColor: "#ffffff", padding: "40px", textAlign: "center", color: "#64748b", borderRadius: "10px", border: "1px solid #e2e8f0" }}>
          Loading evaluation list...
        </div>
      ) : error ? (
        <div style={{ backgroundColor: "#fef2f2", color: "#991b1b", padding: "16px", borderRadius: "8px", border: "1px solid #fecaca" }}>
          {error}
        </div>
      ) : filteredList.length === 0 ? (
        <div style={{ backgroundColor: "#ffffff", padding: "40px", textAlign: "center", color: "#64748b", borderRadius: "10px", border: "1px solid #e2e8f0" }}>
          No evaluation records found matching your filters.
        </div>
      ) : (
        <div style={{ backgroundColor: "#ffffff", borderRadius: "10px", border: "1px solid #e2e8f0", overflow: "hidden", boxShadow: "0 1px 3px rgba(0,0,0,0.05)" }}>
          <table style={{ width: "100%", borderCollapse: "collapse", textAlign: "left", fontSize: "14px" }}>
            <thead>
              <tr style={{ backgroundColor: "#f8fafc", borderBottom: "1px solid #e2e8f0" }}>
                <th style={{ padding: "12px 16px", fontWeight: 600, color: "#475569" }}>Rank</th>
                <th style={{ padding: "12px 16px", fontWeight: 600, color: "#475569" }}>Employee</th>
                <th style={{ padding: "12px 16px", fontWeight: 600, color: "#475569" }}>Department & Designation</th>
                <th style={{ padding: "12px 16px", fontWeight: 600, color: "#475569" }}>Assigned HOD</th>
                <th style={{ padding: "12px 16px", fontWeight: 600, color: "#475569" }}>HOD Evaluation</th>
                <th style={{ padding: "12px 16px", fontWeight: 600, color: "#475569" }}>HR Evaluation</th>
                <th style={{ padding: "12px 16px", fontWeight: 600, color: "#475569" }}>ERM Overall Score</th>
                <th style={{ padding: "12px 16px", fontWeight: 600, color: "#475569", textAlign: "right" }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredList.map((item) => (
                <tr key={item.employeeId} style={{ borderBottom: "1px solid #f1f5f9" }}>
                  <td style={{ padding: "14px 16px" }}>
                    <span style={{
                      backgroundColor: item.rank === 1 ? "#fef3c7" : item.rank === 2 ? "#e2e8f0" : item.rank === 3 ? "#ffedd5" : "#f1f5f9",
                      color: item.rank === 1 ? "#92400e" : item.rank === 2 ? "#334155" : item.rank === 3 ? "#c2410c" : "#64748b",
                      padding: "4px 8px",
                      borderRadius: "12px",
                      fontWeight: 700,
                      fontSize: "12px"
                    }}>
                      #{item.rank}
                    </span>
                  </td>

                  <td style={{ padding: "14px 16px" }}>
                    <div style={{ fontWeight: 600, color: "#0f172a" }}>{item.fullName}</div>
                    <code style={{ fontSize: "12px", color: "#64748b", backgroundColor: "#f1f5f9", padding: "2px 6px", borderRadius: "4px" }}>
                      {item.employeeCode}
                    </code>
                  </td>

                  <td style={{ padding: "14px 16px" }}>
                    <div style={{ color: "#334155", fontWeight: 500 }}>{item.departmentName}</div>
                    <div style={{ fontSize: "12px", color: "#64748b" }}>{item.designationTitle}</div>
                  </td>

                  <td style={{ padding: "14px 16px" }}>
                    <span style={{ fontWeight: 500, color: item.hodName !== "N/A" ? "#1e40af" : "#94a3b8" }}>
                      {item.hodName}
                    </span>
                  </td>

                  <td style={{ padding: "14px 16px" }}>
                    {item.hodEvaluation ? (
                      <div>
                        <span style={{ backgroundColor: "#dcfce7", color: "#15803d", padding: "3px 8px", borderRadius: "4px", fontWeight: 700, fontSize: "12px" }}>
                          ✓ {item.hodEvaluation.score} / 5
                        </span>
                        <div style={{ fontSize: "11px", color: "#64748b", marginTop: "2px" }}>{item.hodEvaluation.period}</div>
                      </div>
                    ) : (
                      <span style={{ backgroundColor: "#fffbeb", color: "#b45309", padding: "3px 8px", borderRadius: "4px", fontWeight: 600, fontSize: "12px", border: "1px solid #fde68a" }}>
                        ⏳ Pending HOD
                      </span>
                    )}
                  </td>

                  <td style={{ padding: "14px 16px" }}>
                    {item.hrEvaluation ? (
                      <div>
                        <span style={{ backgroundColor: "#dcfce7", color: "#15803d", padding: "3px 8px", borderRadius: "4px", fontWeight: 700, fontSize: "12px" }}>
                          ✓ {item.hrEvaluation.score} / 5
                        </span>
                        <div style={{ fontSize: "11px", color: "#64748b", marginTop: "2px" }}>{item.hrEvaluation.period}</div>
                      </div>
                    ) : (
                      <span style={{ backgroundColor: "#eff6ff", color: "#1d4ed8", padding: "3px 8px", borderRadius: "4px", fontWeight: 600, fontSize: "12px", border: "1px solid #bfdbfe" }}>
                        ⏳ Pending HR
                      </span>
                    )}
                  </td>

                  <td style={{ padding: "14px 16px" }}>
                    <div style={{ fontSize: "15px", fontWeight: 800, color: item.ermScore >= 80 ? "#16a34a" : item.ermScore >= 60 ? "#d97706" : "#dc2626" }}>
                      {item.ermScore}%
                    </div>
                    <div style={{ fontSize: "11px", color: "#64748b" }}>
                      Gap: {item.ermGapScore}
                    </div>
                  </td>

                  <td style={{ padding: "14px 16px", textAlign: "right" }}>
                    <div style={{ display: "flex", gap: "8px", justifyContent: "flex-end" }}>
                      <button
                        onClick={() => openHodModal(item)}
                        style={{
                          padding: "6px 12px",
                          backgroundColor: item.isPendingHod ? "#d97706" : "#475569",
                          color: "#ffffff",
                          border: "none",
                          borderRadius: "6px",
                          fontSize: "12px",
                          fontWeight: 600,
                          cursor: "pointer"
                        }}
                      >
                        {item.isPendingHod ? "Evaluate (HOD)" : "Edit HOD Eval"}
                      </button>

                      <button
                        onClick={() => openHrModal(item)}
                        style={{
                          padding: "6px 12px",
                          backgroundColor: item.isPendingHr ? "#2563eb" : "#475569",
                          color: "#ffffff",
                          border: "none",
                          borderRadius: "6px",
                          fontSize: "12px",
                          fontWeight: 600,
                          cursor: "pointer"
                        }}
                      >
                        {item.isPendingHr ? "Evaluate (HR)" : "Edit HR Eval"}
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Inline Evaluation Modal */}
      {evalModal && (
        <div style={{
          position: "fixed",
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          backgroundColor: "rgba(15, 23, 42, 0.6)",
          zIndex: 1000,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          padding: "20px"
        }}>
          <div style={{
            backgroundColor: "#ffffff",
            borderRadius: "12px",
            maxWidth: "700px",
            width: "100%",
            maxHeight: "90vh",
            overflowY: "auto",
            padding: "24px",
            boxShadow: "0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)"
          }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "20px", borderBottom: "1px solid #e2e8f0", paddingBottom: "12px" }}>
              <h2 style={{ fontSize: "18px", fontWeight: 700, margin: 0, color: "#0f172a" }}>
                {evalModal.type === "hod" ? "HOD Performance Evaluation" : "HR Performance Evaluation"} - {evalModal.employee.fullName}
              </h2>
              <button
                onClick={() => setEvalModal(null)}
                style={{ background: "none", border: "none", fontSize: "18px", cursor: "pointer", color: "#64748b" }}
              >
                ✕
              </button>
            </div>

            {modalMessage && (
              <div style={{
                padding: "12px",
                borderRadius: "6px",
                marginBottom: "16px",
                backgroundColor: modalMessage.type === "success" ? "#dcfce7" : "#fef2f2",
                color: modalMessage.type === "success" ? "#15803d" : "#991b1b",
                fontSize: "14px",
                fontWeight: 600
              }}>
                {modalMessage.text}
              </div>
            )}

            {evalModal.type === "hod" ? (
              <form onSubmit={submitHodEvaluation}>
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "12px", marginBottom: "16px" }}>
                  <div style={{ gridColumn: "span 2" }}>
                    <label style={{ display: "block", fontSize: "13px", fontWeight: 600, color: "#334155", marginBottom: "4px" }}>Evaluation Week</label>
                    <input
                      type="week"
                      name="evaluationPeriod"
                      value={hodFormData.evaluationPeriod}
                      onChange={handleHodChange}
                      required
                      style={{ width: "100%", padding: "8px", border: "1px solid #cbd5e1", borderRadius: "6px" }}
                    />
                  </div>

                  <div>
                    <label style={{ display: "block", fontSize: "13px", fontWeight: 500, color: "#334155", marginBottom: "4px" }}>Quality of Work (0-5)</label>
                    <input type="number" name="qualityOfWork" value={hodFormData.qualityOfWork} onChange={handleHodChange} min="0" max="5" step="0.1" style={{ width: "100%", padding: "8px", border: "1px solid #cbd5e1", borderRadius: "6px" }} />
                  </div>

                  <div>
                    <label style={{ display: "block", fontSize: "13px", fontWeight: 500, color: "#334155", marginBottom: "4px" }}>Technical Competence (0-5)</label>
                    <input type="number" name="technicalCompetence" value={hodFormData.technicalCompetence} onChange={handleHodChange} min="0" max="5" step="0.1" style={{ width: "100%", padding: "8px", border: "1px solid #cbd5e1", borderRadius: "6px" }} />
                  </div>

                  <div>
                    <label style={{ display: "block", fontSize: "13px", fontWeight: 500, color: "#334155", marginBottom: "4px" }}>Leadership (0-5)</label>
                    <input type="number" name="leadership" value={hodFormData.leadership} onChange={handleHodChange} min="0" max="5" step="0.1" style={{ width: "100%", padding: "8px", border: "1px solid #cbd5e1", borderRadius: "6px" }} />
                  </div>

                  <div>
                    <label style={{ display: "block", fontSize: "13px", fontWeight: 500, color: "#334155", marginBottom: "4px" }}>Team Behaviour (0-5)</label>
                    <input type="number" name="teamBehaviour" value={hodFormData.teamBehaviour} onChange={handleHodChange} min="0" max="5" step="0.1" style={{ width: "100%", padding: "8px", border: "1px solid #cbd5e1", borderRadius: "6px" }} />
                  </div>

                  <div>
                    <label style={{ display: "block", fontSize: "13px", fontWeight: 500, color: "#334155", marginBottom: "4px" }}>Initiative (0-5)</label>
                    <input type="number" name="initiative" value={hodFormData.initiative} onChange={handleHodChange} min="0" max="5" step="0.1" style={{ width: "100%", padding: "8px", border: "1px solid #cbd5e1", borderRadius: "6px" }} />
                  </div>

                  <div>
                    <label style={{ display: "block", fontSize: "13px", fontWeight: 500, color: "#334155", marginBottom: "4px" }}>Cost Saving (0-5)</label>
                    <input type="number" name="costSaving" value={hodFormData.costSaving} onChange={handleHodChange} min="0" max="5" step="0.1" style={{ width: "100%", padding: "8px", border: "1px solid #cbd5e1", borderRadius: "6px" }} />
                  </div>

                  <div style={{ gridColumn: "span 2", backgroundColor: "#f8fafc", padding: "12px", borderRadius: "6px", border: "1px solid #e2e8f0" }}>
                    <label style={{ display: "block", fontSize: "13px", fontWeight: 700, color: "#0f172a" }}>Calculated HOD Score: {hodFormData.score} / 5</label>
                  </div>

                  <div style={{ gridColumn: "span 2" }}>
                    <label style={{ display: "block", fontSize: "13px", fontWeight: 600, color: "#334155", marginBottom: "4px" }}>Evaluation Remarks</label>
                    <textarea
                      name="comments"
                      value={hodFormData.comments}
                      onChange={handleHodChange}
                      required
                      rows={3}
                      placeholder="Add evaluation remarks..."
                      style={{ width: "100%", padding: "8px", border: "1px solid #cbd5e1", borderRadius: "6px" }}
                    />
                  </div>
                </div>

                <div style={{ display: "flex", justifyContent: "flex-end", gap: "8px" }}>
                  <button type="button" onClick={() => setEvalModal(null)} style={{ padding: "8px 16px", border: "1px solid #cbd5e1", borderRadius: "6px", backgroundColor: "#ffffff" }}>Cancel</button>
                  <button type="submit" disabled={submittingModal} style={{ padding: "8px 16px", border: "none", borderRadius: "6px", backgroundColor: "#d97706", color: "#ffffff", fontWeight: 600 }}>
                    {submittingModal ? "Saving..." : "Submit HOD Evaluation"}
                  </button>
                </div>
              </form>
            ) : (
              <form onSubmit={submitHrEvaluation}>
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "12px", marginBottom: "16px" }}>
                  <div style={{ gridColumn: "span 2" }}>
                    <label style={{ display: "block", fontSize: "13px", fontWeight: 600, color: "#334155", marginBottom: "4px" }}>Evaluation Week</label>
                    <input
                      type="week"
                      name="evaluationPeriod"
                      value={hrFormData.evaluationPeriod}
                      onChange={handleHrChange}
                      required
                      style={{ width: "100%", padding: "8px", border: "1px solid #cbd5e1", borderRadius: "6px" }}
                    />
                  </div>

                  <div>
                    <label style={{ display: "block", fontSize: "13px", fontWeight: 500, color: "#334155", marginBottom: "4px" }}>Attendance & Punctuality (0-5)</label>
                    <input type="number" name="attendancePunctuality" value={hrFormData.attendancePunctuality} onChange={handleHrChange} min="0" max="5" step="0.1" style={{ width: "100%", padding: "8px", border: "1px solid #cbd5e1", borderRadius: "6px" }} />
                  </div>

                  <div>
                    <label style={{ display: "block", fontSize: "13px", fontWeight: 500, color: "#334155", marginBottom: "4px" }}>Discipline (0-5)</label>
                    <input type="number" name="discipline" value={hrFormData.discipline} onChange={handleHrChange} min="0" max="5" step="0.1" style={{ width: "100%", padding: "8px", border: "1px solid #cbd5e1", borderRadius: "6px" }} />
                  </div>

                  <div>
                    <label style={{ display: "block", fontSize: "13px", fontWeight: 500, color: "#334155", marginBottom: "4px" }}>Behaviour & Attitude (0-5)</label>
                    <input type="number" name="behaviourAttitude" value={hrFormData.behaviourAttitude} onChange={handleHrChange} min="0" max="5" step="0.1" style={{ width: "100%", padding: "8px", border: "1px solid #cbd5e1", borderRadius: "6px" }} />
                  </div>

                  <div>
                    <label style={{ display: "block", fontSize: "13px", fontWeight: 500, color: "#334155", marginBottom: "4px" }}>Communication (0-5)</label>
                    <input type="number" name="communication" value={hrFormData.communication} onChange={handleHrChange} min="0" max="5" step="0.1" style={{ width: "100%", padding: "8px", border: "1px solid #cbd5e1", borderRadius: "6px" }} />
                  </div>

                  <div>
                    <label style={{ display: "block", fontSize: "13px", fontWeight: 500, color: "#334155", marginBottom: "4px" }}>Responsibility (0-5)</label>
                    <input type="number" name="responsibilityAccountability" value={hrFormData.responsibilityAccountability} onChange={handleHrChange} min="0" max="5" step="0.1" style={{ width: "100%", padding: "8px", border: "1px solid #cbd5e1", borderRadius: "6px" }} />
                  </div>

                  <div>
                    <label style={{ display: "block", fontSize: "13px", fontWeight: 500, color: "#334155", marginBottom: "4px" }}>Work Ethics (0-5)</label>
                    <input type="number" name="workEthics" value={hrFormData.workEthics} onChange={handleHrChange} min="0" max="5" step="0.1" style={{ width: "100%", padding: "8px", border: "1px solid #cbd5e1", borderRadius: "6px" }} />
                  </div>

                  <div style={{ gridColumn: "span 2" }}>
                    <label style={{ display: "block", fontSize: "13px", fontWeight: 500, color: "#334155", marginBottom: "4px" }}>Team Contribution (0-5)</label>
                    <input type="number" name="teamContribution" value={hrFormData.teamContribution} onChange={handleHrChange} min="0" max="5" step="0.1" style={{ width: "100%", padding: "8px", border: "1px solid #cbd5e1", borderRadius: "6px" }} />
                  </div>

                  <div style={{ gridColumn: "span 2", backgroundColor: "#f8fafc", padding: "12px", borderRadius: "6px", border: "1px solid #e2e8f0" }}>
                    <label style={{ display: "block", fontSize: "13px", fontWeight: 700, color: "#0f172a" }}>Calculated HR Score: {hrFormData.score} / 5</label>
                  </div>

                  <div style={{ gridColumn: "span 2" }}>
                    <label style={{ display: "block", fontSize: "13px", fontWeight: 600, color: "#334155", marginBottom: "4px" }}>Evaluation Remarks</label>
                    <textarea
                      name="comments"
                      value={hrFormData.comments}
                      onChange={handleHrChange}
                      required
                      rows={3}
                      placeholder="Add evaluation remarks..."
                      style={{ width: "100%", padding: "8px", border: "1px solid #cbd5e1", borderRadius: "6px" }}
                    />
                  </div>
                </div>

                <div style={{ display: "flex", justifyContent: "flex-end", gap: "8px" }}>
                  <button type="button" onClick={() => setEvalModal(null)} style={{ padding: "8px 16px", border: "1px solid #cbd5e1", borderRadius: "6px", backgroundColor: "#ffffff" }}>Cancel</button>
                  <button type="submit" disabled={submittingModal} style={{ padding: "8px 16px", border: "none", borderRadius: "6px", backgroundColor: "#2563eb", color: "#ffffff", fontWeight: 600 }}>
                    {submittingModal ? "Saving..." : "Submit HR Evaluation"}
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
