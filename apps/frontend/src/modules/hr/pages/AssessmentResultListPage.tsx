import React, { useEffect, useState } from "react";
import { recruitmentApi, CandidateAssessmentRecord } from "../api/recruitmentApi";

export default function AssessmentResultListPage() {
  const [submissions, setSubmissions] = useState<CandidateAssessmentRecord[]>([]);
  const [loading, setLoading] = useState(false);
  const [selectedSub, setSelectedSub] = useState<CandidateAssessmentRecord | null>(null);

  useEffect(() => {
    fetchSubmissions();
  }, []);

  const fetchSubmissions = async () => {
    setLoading(true);
    try {
      const data = await recruitmentApi.getAssessments();
      setSubmissions(data || []);
    } catch (err) {
      console.error("Failed to load assessments", err);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!window.confirm("Are you sure you want to delete this result?")) return;
    try {
      await recruitmentApi.deleteAssessment(id);
      fetchSubmissions();
      if (selectedSub?.id === id) {
        setSelectedSub(null);
      }
    } catch (err) {
      console.error(err);
      alert("Failed to delete record.");
    }
  };

  return (
    <div style={{ background: "#f8fafc", minHeight: "100vh", padding: "24px" }}>
      {/* Header */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "20px" }}>
        <div>
          <h1 style={{ fontSize: "22px", fontWeight: "700", color: "#0f172a", margin: "0 0 4px 0" }}>
            Candidate Assessment Results
          </h1>
          <p style={{ fontSize: "14px", color: "#64748b", margin: 0 }}>
            Review system-graded online assessment papers, marks breakdown, and pass/fail status.
          </p>
        </div>
        <button
          onClick={fetchSubmissions}
          style={{
            padding: "8px 16px",
            background: "#ffffff",
            border: "1px solid #cbd5e1",
            borderRadius: "6px",
            fontSize: "13px",
            fontWeight: "600",
            color: "#334155",
            cursor: "pointer",
          }}
        >
          🔄 Refresh List
        </button>
      </div>

      {/* Main Table Card */}
      <div
        style={{
          background: "#ffffff",
          borderRadius: "10px",
          padding: "20px",
          border: "1px solid #e2e8f0",
          boxShadow: "0 1px 3px rgba(0,0,0,0.05)",
        }}
      >
        {loading ? (
          <p style={{ color: "#64748b", fontSize: "14px", padding: "16px 0" }}>Loading assessment results...</p>
        ) : submissions.length === 0 ? (
          <p style={{ color: "#94a3b8", textAlign: "center", padding: "30px", fontSize: "14px", fontStyle: "italic" }}>
            No candidate assessment submissions found.
          </p>
        ) : (
          <div style={{ overflowX: "auto" }}>
            <table style={{ width: "100%", borderCollapse: "collapse", textAlign: "left" }}>
              <thead>
                <tr style={{ borderBottom: "2px solid #cbd5e1", background: "#f8fafc" }}>
                  <th style={{ padding: "12px", fontSize: "13px", color: "#475569", fontWeight: "600" }}>Candidate Name</th>
                  <th style={{ padding: "12px", fontSize: "13px", color: "#475569", fontWeight: "600" }}>Position Applied</th>
                  <th style={{ padding: "12px", fontSize: "13px", color: "#475569", fontWeight: "600", textAlign: "right" }}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {submissions.map((sub) => (
                  <tr key={sub.id} style={{ borderBottom: "1px solid #f1f5f9" }}>
                    <td style={{ padding: "12px", fontWeight: "600", fontSize: "14px", color: "#0f172a" }}>
                      {sub.candidate_name}
                    </td>
                    <td style={{ padding: "12px", fontSize: "14px", color: "#334155" }}>
                      {sub.position_applied}
                    </td>
                    <td style={{ padding: "12px", textAlign: "right" }}>
                      <div style={{ display: "flex", gap: "8px", justifyContent: "flex-end" }}>
                        <button
                          onClick={() => setSelectedSub(sub)}
                          style={{
                            background: "#0284c7",
                            color: "#ffffff",
                            border: "none",
                            padding: "6px 14px",
                            borderRadius: "6px",
                            fontSize: "12px",
                            fontWeight: "600",
                            cursor: "pointer",
                          }}
                        >
                          👁️ View Result
                        </button>
                        <button
                          onClick={() => handleDelete(sub.id)}
                          style={{
                            background: "#ef4444",
                            color: "#ffffff",
                            border: "none",
                            padding: "6px 14px",
                            borderRadius: "6px",
                            fontSize: "12px",
                            fontWeight: "600",
                            cursor: "pointer",
                          }}
                        >
                          🗑️ Delete
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

      {/* View Result Detail Modal */}
      {selectedSub && (
        <div
          style={{
            position: "fixed",
            inset: 0,
            background: "rgba(0,0,0,0.5)",
            display: "flex",
            justifyContent: "center",
            alignItems: "center",
            zIndex: 9999,
          }}
          onClick={() => setSelectedSub(null)}
        >
          <div
            style={{
              background: "#ffffff",
              borderRadius: "12px",
              width: "90%",
              maxWidth: "700px",
              maxHeight: "85vh",
              overflowY: "auto",
              boxShadow: "0 20px 25px -5px rgba(0,0,0,0.1), 0 10px 10px -5px rgba(0,0,0,0.04)",
              padding: "28px",
              position: "relative",
            }}
            onClick={(e) => e.stopPropagation()}
          >
            {/* Modal Header */}
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", borderBottom: "1px solid #e2e8f0", paddingBottom: "14px", marginBottom: "20px" }}>
              <h2 style={{ fontSize: "18px", fontWeight: "700", color: "#0f172a", margin: 0 }}>
                System Assessment Report Card
              </h2>
              <button
                onClick={() => setSelectedSub(null)}
                style={{
                  background: "transparent",
                  border: "none",
                  fontSize: "20px",
                  color: "#64748b",
                  cursor: "pointer",
                  fontWeight: "bold",
                }}
              >
                ✕
              </button>
            </div>

            {/* Modal Content */}
            <div style={{ textAlign: "center" }}>
              <div style={{ fontSize: "56px", marginBottom: "12px" }}>
                {selectedSub.result === "PASSED" ? "🎉" : "⚠️"}
              </div>
              <h2 style={{ fontSize: "22px", fontWeight: "700", color: "#0f172a", margin: "0 0 6px 0" }}>
                Evaluation: <span style={{ color: selectedSub.result === "PASSED" ? "#16a34a" : "#dc2626" }}>{selectedSub.result}</span>
              </h2>
              <p style={{ fontSize: "14px", color: "#64748b", margin: "0 0 20px 0" }}>
                Candidate: <strong>{selectedSub.candidate_name}</strong> | Position: {selectedSub.position_applied} ({selectedSub.department})
              </p>

              {/* Big Score Badge */}
              <div
                style={{
                  background: selectedSub.result === "PASSED" ? "#f0fdf4" : "#fef2f2",
                  border: `2px solid ${selectedSub.result === "PASSED" ? "#bbf7d0" : "#fecaca"}`,
                  borderRadius: "12px",
                  padding: "20px",
                  marginBottom: "24px",
                }}
              >
                <div style={{ fontSize: "13px", fontWeight: "600", color: "#475569" }}>TOTAL SCORE ACHIEVED</div>
                <div style={{ fontSize: "40px", fontWeight: "800", color: selectedSub.result === "PASSED" ? "#15803d" : "#b91c1c", margin: "4px 0" }}>
                  {selectedSub.total_score} <span style={{ fontSize: "18px", color: "#64748b" }}>/ 100 Marks</span>
                </div>
                <div style={{ fontSize: "13px", color: "#64748b" }}>
                  Passing Threshold: {selectedSub.passing_score} Marks | Time Taken: {selectedSub.time_taken_minutes} Minutes
                </div>
              </div>

              {/* Breakdown Grid */}
              <h3 style={{ fontSize: "15px", fontWeight: "700", color: "#334155", marginBottom: "12px", textAlign: "left" }}>📊 Section Score Breakdown</h3>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "12px", textAlign: "left", marginBottom: "24px" }}>
                <div style={{ background: "#f8fafc", padding: "14px", borderRadius: "8px", border: "1px solid #cbd5e1" }}>
                  <div style={{ fontSize: "11px", color: "#64748b", fontWeight: "600", textTransform: "uppercase" }}>Section A – Computer Fundamentals</div>
                  <div style={{ fontSize: "16px", fontWeight: "700", color: "#0f172a", marginTop: "4px" }}>{selectedSub.section_a_score} / 20 Marks</div>
                </div>
                <div style={{ background: "#f8fafc", padding: "14px", borderRadius: "8px", border: "1px solid #cbd5e1" }}>
                  <div style={{ fontSize: "11px", color: "#64748b", fontWeight: "600", textTransform: "uppercase" }}>Section B (Part A) – Excel MCQs</div>
                  <div style={{ fontSize: "16px", fontWeight: "700", color: "#0f172a", marginTop: "4px" }}>{selectedSub.section_b_mcq_score} / 20 Marks</div>
                </div>
                <div style={{ background: "#f8fafc", padding: "14px", borderRadius: "8px", border: "1px solid #cbd5e1" }}>
                  <div style={{ fontSize: "11px", color: "#64748b", fontWeight: "600", textTransform: "uppercase" }}>Section B (Part B) – Excel Practical</div>
                  <div style={{ fontSize: "16px", fontWeight: "700", color: "#0f172a", marginTop: "4px" }}>{selectedSub.section_b_practical_score} / 20 Marks</div>
                </div>
                <div style={{ background: "#f8fafc", padding: "14px", borderRadius: "8px", border: "1px solid #cbd5e1" }}>
                  <div style={{ fontSize: "11px", color: "#64748b", fontWeight: "600", textTransform: "uppercase" }}>Section C – MS Word Formatting</div>
                  <div style={{ fontSize: "16px", fontWeight: "700", color: "#0f172a", marginTop: "4px" }}>{selectedSub.section_c_score} / 15 Marks</div>
                </div>
                <div style={{ background: "#f8fafc", padding: "14px", borderRadius: "8px", border: "1px solid #cbd5e1", gridColumn: "span 2" }}>
                  <div style={{ fontSize: "11px", color: "#64748b", fontWeight: "600", textTransform: "uppercase" }}>Section D – Email Writing</div>
                  <div style={{ fontSize: "16px", fontWeight: "700", color: "#0f172a", marginTop: "4px" }}>{selectedSub.section_d_score} / 10 Marks</div>
                </div>
              </div>
            </div>

            {/* Modal Footer */}
            <div style={{ display: "flex", justifyContent: "flex-end", marginTop: "24px", borderTop: "1px solid #e2e8f0", paddingTop: "16px" }}>
              <button
                onClick={() => setSelectedSub(null)}
                style={{
                  background: "#64748b",
                  color: "#ffffff",
                  border: "none",
                  padding: "8px 20px",
                  borderRadius: "6px",
                  fontSize: "13px",
                  fontWeight: "600",
                  cursor: "pointer",
                }}
              >
                Close / बंद करें
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
