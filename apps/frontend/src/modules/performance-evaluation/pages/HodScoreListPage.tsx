import React, { useEffect, useState } from "react";
import { performanceEvaluationApi } from "../api/performanceEvaluationApi";

interface HodEvaluationRecord {
  id: string;
  employee_id: string;
  employee_name?: string;
  employee_code?: string;
  department_name?: string;
  designation_title?: string;
  evaluation_period: string;
  score: number;
  comments?: string;
  quality_of_work?: number;
  technical_competence?: number;
  leadership?: number;
  team_behaviour?: number;
  initiative?: number;
  cost_saving?: number;
  created_at?: string;
}

export default function HodScoreListPage() {
  const [evaluations, setEvaluations] = useState<HodEvaluationRecord[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [search, setSearch] = useState<string>("");
  const [selectedPeriod, setSelectedPeriod] = useState<string>("");
  const [selectedRecord, setSelectedRecord] = useState<HodEvaluationRecord | null>(null);

  useEffect(() => {
    loadEvaluations();
  }, []);

  async function loadEvaluations() {
    setLoading(true);
    setError(null);
    try {
      const data = await performanceEvaluationApi.getHodEvaluations();
      setEvaluations(data || []);
    } catch (err: any) {
      console.error("Failed to load HOD evaluations", err);
      setError("Failed to load HOD evaluation scores.");
    } finally {
      setLoading(false);
    }
  }

  // Filter logic
  const filteredRecords = evaluations.filter((rec) => {
    const matchesSearch =
      !search ||
      rec.employee_name?.toLowerCase().includes(search.toLowerCase()) ||
      rec.employee_code?.toLowerCase().includes(search.toLowerCase()) ||
      rec.department_name?.toLowerCase().includes(search.toLowerCase());

    const matchesPeriod = !selectedPeriod || rec.evaluation_period === selectedPeriod;

    return matchesSearch && matchesPeriod;
  });

  // Periods list for dropdown filter
  const periodOptions = Array.from(
    new Set(evaluations.map((e) => e.evaluation_period).filter(Boolean))
  ).sort();

  // Metric stats
  const totalCount = filteredRecords.length;
  const avgScore = totalCount > 0 ? (filteredRecords.reduce((acc, r) => acc + (Number(r.score) || 0), 0) / totalCount).toFixed(2) : "0.00";
  const maxScore = totalCount > 0 ? Math.max(...filteredRecords.map((r) => Number(r.score) || 0)).toFixed(2) : "0.00";

  const getBadgeStyle = (score: number) => {
    if (score >= 8) return { background: "#dcfce7", color: "#15803d", border: "1px solid #bbf7d0" };
    if (score >= 6) return { background: "#e0f2fe", color: "#0369a1", border: "1px solid #bae6fd" };
    if (score >= 4) return { background: "#fef3c7", color: "#b45309", border: "1px solid #fde68a" };
    return { background: "#fee2e2", color: "#b91c1c", border: "1px solid #fca5a5" };
  };

  return (
    <div style={{ padding: "24px 32px", fontFamily: "'Inter', sans-serif", backgroundColor: "#f8fafc", minHeight: "100vh" }}>
      {/* Header Bar */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "24px" }}>
        <div>
          <h1 style={{ fontSize: "24px", fontWeight: 700, color: "#0f172a", margin: 0 }}>HOD's Score List</h1>
          <p style={{ fontSize: "14px", color: "#64748b", margin: "4px 0 0 0" }}>
            Comprehensive record of all performance evaluation scores submitted by HODs for employees.
          </p>
        </div>

      </div>


      {/* Filter Toolbar */}
      <div style={{ background: "#ffffff", padding: "16px 20px", borderRadius: "12px", border: "1px solid #e2e8f0", marginBottom: "24px", display: "flex", gap: "16px", flexWrap: "wrap", alignItems: "center" }}>
        <input
          type="text"
          placeholder="🔍 Search employee, code, or department..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          style={{ flex: "1 1 250px", padding: "10px 14px", borderRadius: "8px", border: "1px solid #cbd5e1", fontSize: "14px", outline: "none" }}
        />
        <select
          value={selectedPeriod}
          onChange={(e) => setSelectedPeriod(e.target.value)}
          style={{ padding: "10px 14px", borderRadius: "8px", border: "1px solid #cbd5e1", fontSize: "14px", backgroundColor: "#ffffff", minWidth: "180px" }}
        >
          <option value="">All Evaluation Periods</option>
          {periodOptions.map((p) => (
            <option key={p} value={p}>{p}</option>
          ))}
        </select>
        {(search || selectedPeriod) && (
          <button
            onClick={() => { setSearch(""); setSelectedPeriod(""); }}
            style={{ padding: "10px 14px", borderRadius: "8px", border: "1px solid #cbd5e1", background: "#f1f5f9", color: "#475569", fontSize: "13px", cursor: "pointer", fontWeight: 600 }}
          >
            Clear Filters
          </button>
        )}
      </div>

      {/* Main Table */}
      <div style={{ background: "#ffffff", borderRadius: "12px", border: "1px solid #e2e8f0", overflow: "hidden", boxShadow: "0 1px 3px rgba(0,0,0,0.05)" }}>
        {loading ? (
          <div style={{ padding: "40px", textAlign: "center", color: "#64748b" }}>Loading HOD Score List...</div>
        ) : error ? (
          <div style={{ padding: "40px", textAlign: "center", color: "#ef4444" }}>{error}</div>
        ) : filteredRecords.length === 0 ? (
          <div style={{ padding: "40px", textAlign: "center", color: "#64748b" }}>No HOD evaluation scores found matching your criteria.</div>
        ) : (
          <table style={{ width: "100%", borderCollapse: "collapse", textAlign: "left", fontSize: "14px" }}>
            <thead>
              <tr style={{ backgroundColor: "#f8fafc", borderBottom: "1px solid #e2e8f0", color: "#475569", fontWeight: 600 }}>
                <th style={{ padding: "14px 18px" }}>Date</th>
                <th style={{ padding: "14px 18px" }}>Employee</th>
                <th style={{ padding: "14px 18px" }}>Dept / Designation</th>
                <th style={{ padding: "14px 18px" }}>Period</th>
                <th style={{ padding: "14px 18px" }}>Overall Score</th>
                <th style={{ padding: "14px 18px" }}>Criteria Breakdown</th>
                <th style={{ padding: "14px 18px" }}>Comments</th>
                <th style={{ padding: "14px 18px", textAlign: "right" }}>Action</th>
              </tr>
            </thead>
            <tbody>
              {filteredRecords.map((rec) => {
                const bStyle = getBadgeStyle(Number(rec.score) || 0);
                const dateStr = rec.created_at ? new Date(rec.created_at).toLocaleDateString() : "—";

                return (
                  <tr key={rec.id} style={{ borderBottom: "1px solid #f1f5f9" }}>
                    <td style={{ padding: "14px 18px", color: "#64748b", whiteSpace: "nowrap" }}>{dateStr}</td>
                    <td style={{ padding: "14px 18px" }}>
                      <div style={{ fontWeight: 600, color: "#0f172a" }}>{rec.employee_name || "Unknown Employee"}</div>
                      {rec.employee_code && <div style={{ fontSize: "12px", color: "#64748b" }}>Code: {rec.employee_code}</div>}
                    </td>
                    <td style={{ padding: "14px 18px", color: "#334155" }}>
                      <div>{rec.department_name || "—"}</div>
                      {rec.designation_title && <div style={{ fontSize: "12px", color: "#64748b" }}>{rec.designation_title}</div>}
                    </td>
                    <td style={{ padding: "14px 18px" }}>
                      <span style={{ background: "#f1f5f9", padding: "4px 8px", borderRadius: "6px", fontSize: "12px", fontWeight: 600, color: "#475569" }}>
                        {rec.evaluation_period}
                      </span>
                    </td>
                    <td style={{ padding: "14px 18px" }}>
                      <span
                        style={{
                          padding: "6px 12px",
                          borderRadius: "16px",
                          fontSize: "13px",
                          fontWeight: 700,
                          ...bStyle,
                        }}
                      >
                        {Number(rec.score || 0).toFixed(1)} / 10
                      </span>
                    </td>
                    <td style={{ padding: "14px 18px", fontSize: "12px", color: "#475569" }}>
                      <div style={{ display: "flex", gap: "8px", flexWrap: "wrap" }}>
                        <span>Quality: <b>{rec.quality_of_work ?? "-"}</b></span>
                        <span>Tech: <b>{rec.technical_competence ?? "-"}</b></span>
                        <span>Leadership: <b>{rec.leadership ?? "-"}</b></span>
                      </div>
                    </td>
                    <td style={{ padding: "14px 18px", color: "#475569", maxWidth: "220px", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                      {rec.comments || "—"}
                    </td>
                    <td style={{ padding: "14px 18px", textAlign: "right" }}>
                      <button
                        onClick={() => setSelectedRecord(rec)}
                        style={{
                          padding: "6px 12px",
                          borderRadius: "6px",
                          border: "1px solid #cbd5e1",
                          background: "#ffffff",
                          color: "#2563eb",
                          fontSize: "12px",
                          fontWeight: 600,
                          cursor: "pointer",
                        }}
                      >
                        View Scorecard
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        )}
      </div>

      {/* Modal View for Scorecard Breakdown */}
      {selectedRecord && (
        <div
          style={{
            position: "fixed",
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            backgroundColor: "rgba(15, 23, 42, 0.6)",
            display: "flex",
            justifyContent: "center",
            alignItems: "center",
            zIndex: 1000,
            padding: "20px",
          }}
        >
          <div
            style={{
              backgroundColor: "#ffffff",
              borderRadius: "16px",
              maxWidth: "550px",
              width: "100%",
              padding: "28px",
              boxShadow: "0 20px 25px -5px rgba(0, 0, 0, 0.1)",
              maxHeight: "90vh",
              overflowY: "auto",
            }}
          >
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "20px" }}>
              <div>
                <h2 style={{ margin: 0, fontSize: "20px", fontWeight: 700, color: "#0f172a" }}>HOD Score Details</h2>
                <p style={{ margin: "4px 0 0 0", fontSize: "14px", color: "#64748b" }}>
                  {selectedRecord.employee_name} ({selectedRecord.employee_code || "N/A"})
                </p>
              </div>
              <button
                onClick={() => setSelectedRecord(null)}
                style={{ background: "none", border: "none", fontSize: "20px", cursor: "pointer", color: "#94a3b8" }}
              >
                ✕
              </button>
            </div>

            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "12px", marginBottom: "20px", backgroundColor: "#f8fafc", padding: "14px", borderRadius: "10px", fontSize: "13px" }}>
              <div><b>Department:</b> {selectedRecord.department_name || "—"}</div>
              <div><b>Designation:</b> {selectedRecord.designation_title || "—"}</div>
              <div><b>Evaluation Period:</b> {selectedRecord.evaluation_period}</div>
              <div><b>Date Submitted:</b> {selectedRecord.created_at ? new Date(selectedRecord.created_at).toLocaleDateString() : "—"}</div>
            </div>

            <h3 style={{ fontSize: "15px", fontWeight: 700, color: "#0f172a", marginBottom: "12px" }}>Parameter Breakdown (Scale 1-10)</h3>
            <div style={{ display: "flex", flexDirection: "column", gap: "10px", marginBottom: "24px" }}>
              {[
                { label: "Quality of Work", value: selectedRecord.quality_of_work },
                { label: "Technical Competence", value: selectedRecord.technical_competence },
                { label: "Leadership Skills", value: selectedRecord.leadership },
                { label: "Team Behaviour & Alignment", value: selectedRecord.team_behaviour },
                { label: "Initiative & Problem Solving", value: selectedRecord.initiative },
                { label: "Cost Saving & Efficiency", value: selectedRecord.cost_saving },
              ].map((item) => (
                <div key={item.label} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", fontSize: "13px" }}>
                  <span style={{ color: "#475569" }}>{item.label}</span>
                  <span style={{ fontWeight: 700, color: "#0f172a" }}>{item.value ?? "N/A"} / 10</span>
                </div>
              ))}
            </div>

            <div style={{ backgroundColor: "#eff6ff", padding: "16px", borderRadius: "10px", marginBottom: "24px", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <span style={{ fontSize: "15px", fontWeight: 700, color: "#1e40af" }}>HOD Overall Score</span>
              <span style={{ fontSize: "22px", fontWeight: 800, color: "#1e3a8a" }}>{Number(selectedRecord.score || 0).toFixed(2)} / 10</span>
            </div>

            {selectedRecord.comments && (
              <div style={{ marginBottom: "24px" }}>
                <h4 style={{ fontSize: "13px", fontWeight: 700, color: "#475569", margin: "0 0 6px 0" }}>HOD Comments & Feedback</h4>
                <div style={{ fontSize: "14px", color: "#334155", backgroundColor: "#f8fafc", padding: "12px", borderRadius: "8px", border: "1px solid #e2e8f0", whiteSpace: "pre-wrap" }}>
                  {selectedRecord.comments}
                </div>
              </div>
            )}

            <div style={{ textAlign: "right" }}>
              <button
                onClick={() => setSelectedRecord(null)}
                style={{ padding: "10px 20px", borderRadius: "8px", background: "#0f172a", color: "#ffffff", border: "none", fontSize: "14px", fontWeight: 600, cursor: "pointer" }}
              >
                Close Scorecard
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
