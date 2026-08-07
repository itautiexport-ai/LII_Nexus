import React, { useEffect, useState } from "react";
import { recruitmentApi, InductionTrackerRecord } from "../api/recruitmentApi";

interface ChecklistSectionItem {
  id: string;
  category: string;
  item: string;
  completed: boolean;
}

const DEFAULT_CHECKLIST: ChecklistSectionItem[] = [
  // 1. Company Introduction
  { id: "c1", category: "1. Company Introduction", item: "Company history and background explained", completed: false },
  { id: "c2", category: "1. Company Introduction", item: "Vision, Mission and Core Values explained", completed: false },
  { id: "c3", category: "1. Company Introduction", item: "Organization structure explained", completed: false },
  { id: "c4", category: "1. Company Introduction", item: "Company products and services introduced", completed: false },
  { id: "c5", category: "1. Company Introduction", item: "Employee handbook shared", completed: false },

  // 2. Factory & Manufacturing Orientation
  { id: "f1", category: "2. Factory & Manufacturing Orientation", item: "Factory layout explained", completed: false },
  { id: "f2", category: "2. Factory & Manufacturing Orientation", item: "Production process explained", completed: false },
  { id: "f3", category: "2. Factory & Manufacturing Orientation", item: "Manufacturing workflow demonstrated", completed: false },
  { id: "f4", category: "2. Factory & Manufacturing Orientation", item: "Factory video presentation shown", completed: false },
  { id: "f5", category: "2. Factory & Manufacturing Orientation", item: "Product manufacturing video shown", completed: false },
  { id: "f6", category: "2. Factory & Manufacturing Orientation", item: "Department-specific work process video shown", completed: false },
  { id: "f7", category: "2. Factory & Manufacturing Orientation", item: "Material flow explained", completed: false },
  { id: "f8", category: "2. Factory & Manufacturing Orientation", item: "Quality inspection process explained", completed: false },
  { id: "f9", category: "2. Factory & Manufacturing Orientation", item: "Dispatch and packing process explained", completed: false },

  // 3. Department Introduction
  { id: "d1", category: "3. Department Introduction", item: "Human Resources", completed: false },
  { id: "d2", category: "3. Department Introduction", item: "Production", completed: false },
  { id: "d3", category: "3. Department Introduction", item: "Planning", completed: false },
  { id: "d4", category: "3. Department Introduction", item: "Purchase", completed: false },
  { id: "d5", category: "3. Department Introduction", item: "Stores", completed: false },
  { id: "d6", category: "3. Department Introduction", item: "Quality Control", completed: false },
  { id: "d7", category: "3. Department Introduction", item: "Maintenance", completed: false },
  { id: "d8", category: "3. Department Introduction", item: "Accounts & Finance", completed: false },
  { id: "d9", category: "3. Department Introduction", item: "Sales & Marketing (if applicable)", completed: false },
  { id: "d10", category: "3. Department Introduction", item: "IT / ERP Support", completed: false },

  // 4. Key Personnel Introduction
  { id: "p1", category: "4. Key Personnel Introduction", item: "HR Manager", completed: false },
  { id: "p2", category: "4. Key Personnel Introduction", item: "Reporting Manager", completed: false },
  { id: "p3", category: "4. Key Personnel Introduction", item: "Department Head", completed: false },
  { id: "p4", category: "4. Key Personnel Introduction", item: "Team Leader / Supervisor", completed: false },
  { id: "p5", category: "4. Key Personnel Introduction", item: "Safety Officer", completed: false },
  { id: "p6", category: "4. Key Personnel Introduction", item: "Quality Head", completed: false },
  { id: "p7", category: "4. Key Personnel Introduction", item: "Production Manager", completed: false },
  { id: "p8", category: "4. Key Personnel Introduction", item: "IT Support Executive", completed: false },
  { id: "p9", category: "4. Key Personnel Introduction", item: "Immediate Team Members", completed: false },

  // 5. HR Policies Explained
  { id: "h1", category: "5. HR Policies Explained", item: "Working hours", completed: false },
  { id: "h2", category: "5. HR Policies Explained", item: "Attendance system", completed: false },
  { id: "h3", category: "5. HR Policies Explained", item: "Leave policy", completed: false },
  { id: "h4", category: "5. HR Policies Explained", item: "Overtime policy", completed: false },
  { id: "h5", category: "5. HR Policies Explained", item: "Salary cycle and payment process", completed: false },
  { id: "h6", category: "5. HR Policies Explained", item: "Probation period", completed: false },
  { id: "h7", category: "5. HR Policies Explained", item: "Performance appraisal process", completed: false },
  { id: "h8", category: "5. HR Policies Explained", item: "Promotion policy", completed: false },
  { id: "h9", category: "5. HR Policies Explained", item: "Code of Conduct", completed: false },
  { id: "h10", category: "5. HR Policies Explained", item: "Anti-harassment policy", completed: false },
];

export default function EmployeeInductionCompletionListPage() {
  const [submissions, setSubmissions] = useState<InductionTrackerRecord[]>([]);
  const [loading, setLoading] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [deptFilter, setDeptFilter] = useState("ALL");
  const [statusFilter, setStatusFilter] = useState("ALL");

  // One-click View Modal state
  const [selectedSubmission, setSelectedSubmission] = useState<InductionTrackerRecord | null>(null);

  useEffect(() => {
    loadSubmissions();
  }, []);

  async function loadSubmissions() {
    setLoading(true);
    try {
      const data = await recruitmentApi.getInductions();
      setSubmissions(data || []);
    } catch (err) {
      console.error("Failed to load induction submissions list", err);
    } finally {
      setLoading(false);
    }
  }

  // Filter logic
  const filteredSubmissions = submissions.filter((s) => {
    const matchesSearch =
      !searchQuery.trim() ||
      s.employee_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (s.employee_code && s.employee_code.toLowerCase().includes(searchQuery.toLowerCase())) ||
      s.department.toLowerCase().includes(searchQuery.toLowerCase());

    const matchesDept = deptFilter === "ALL" || s.department === deptFilter;
    const matchesStatus = statusFilter === "ALL" || s.status === statusFilter;

    return matchesSearch && matchesDept && matchesStatus;
  });

  // Helper to parse checklist items from JSON
  function parseSubmissionChecklist(jsonStr: string | null): ChecklistSectionItem[] {
    if (!jsonStr) return DEFAULT_CHECKLIST;
    try {
      const parsed = JSON.parse(jsonStr);
      if (Array.isArray(parsed) && parsed.length > 0) {
        if (parsed[0].category && parsed[0].item !== undefined) {
          return parsed as ChecklistSectionItem[];
        }
        // Legacy checklist format conversion
        return DEFAULT_CHECKLIST.map((item, idx) => ({
          ...item,
          completed: parsed[idx] ? parsed[idx].completed : false,
        }));
      }
    } catch (e) {
      console.error("Error parsing checklist json", e);
    }
    return DEFAULT_CHECKLIST;
  }

  return (
    <div style={{ background: "#f8fafc", minHeight: "100vh", padding: "24px" }}>
      {/* Header */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "20px" }}>
        <div>
          <span style={{ fontSize: "12px", fontWeight: "700", color: "#0284c7", textTransform: "uppercase", letterSpacing: "0.5px" }}>
            LII Nexus – HR Portal
          </span>
          <h1 style={{ fontSize: "24px", fontWeight: "800", color: "#0f172a", margin: "2px 0 4px 0" }}>
            Employee Induction Completion Form List
          </h1>
          <p style={{ fontSize: "14px", color: "#64748b", margin: 0 }}>
            Inspect and review submitted employee onboarding & induction sign-off forms in one click.
          </p>
        </div>

        <div style={{ display: "flex", gap: "10px" }}>
          <button
            onClick={loadSubmissions}
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
      </div>

      {/* Filter Bar */}
      <div style={{ background: "#ffffff", borderRadius: "10px", padding: "16px", border: "1px solid #e2e8f0", boxShadow: "0 1px 3px rgba(0,0,0,0.05)", marginBottom: "20px" }}>
        <div style={{ display: "flex", flexWrap: "wrap", gap: "12px", alignItems: "center", justifyContent: "space-between" }}>
          <div style={{ display: "flex", gap: "12px", flexWrap: "wrap", flex: 1 }}>
            <input
              type="text"
              placeholder="Search by employee name, ID, or department..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              style={{ minWidth: "280px", flex: 1, padding: "8px 12px", border: "1px solid #cbd5e1", borderRadius: "6px", fontSize: "13px" }}
            />

            <select
              value={deptFilter}
              onChange={(e) => setDeptFilter(e.target.value)}
              style={{ padding: "8px 12px", border: "1px solid #cbd5e1", borderRadius: "6px", fontSize: "13px" }}
            >
              <option value="ALL">All Departments</option>
              <option value="Production / Machine Shop">Production / Machine Shop</option>
              <option value="Quality Control & Assurance">Quality Control & Assurance</option>
              <option value="Maintenance & Electrical">Maintenance & Electrical</option>
              <option value="Supply Chain & Purchase">Supply Chain & Purchase</option>
              <option value="Sales & Marketing">Sales & Marketing</option>
              <option value="Accounts & Finance">Accounts & Finance</option>
              <option value="HR & Administration">HR & Administration</option>
              <option value="Design & R&D">Design & R&D</option>
              <option value="IT & ERP Support">IT & ERP Support</option>
            </select>

            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              style={{ padding: "8px 12px", border: "1px solid #cbd5e1", borderRadius: "6px", fontSize: "13px" }}
            >
              <option value="ALL">All Statuses</option>
              <option value="Completed">Completed</option>
              <option value="In Progress">In Progress</option>
            </select>
          </div>

          <div style={{ fontSize: "13px", fontWeight: "600", color: "#64748b" }}>
            Showing <strong>{filteredSubmissions.length}</strong> of {submissions.length} forms
          </div>
        </div>
      </div>

      {/* Submitted Forms Table */}
      <div style={{ background: "#ffffff", borderRadius: "10px", padding: "20px", border: "1px solid #e2e8f0", boxShadow: "0 1px 3px rgba(0,0,0,0.05)" }}>
        {loading ? (
          <p style={{ color: "#64748b" }}>Loading employee induction completion forms...</p>
        ) : filteredSubmissions.length === 0 ? (
          <p style={{ color: "#94a3b8", textAlign: "center", padding: "30px" }}>No employee induction completion forms found matching your criteria.</p>
        ) : (
          <div style={{ overflowX: "auto" }}>
            <table style={{ width: "100%", borderCollapse: "collapse", textAlign: "left" }}>
              <thead>
                <tr style={{ borderBottom: "2px solid #e2e8f0", background: "#f8fafc" }}>
                  <th style={{ padding: "12px", fontSize: "13px", color: "#475569" }}>Emp Code / ID</th>
                  <th style={{ padding: "12px", fontSize: "13px", color: "#475569" }}>Employee Name</th>
                  <th style={{ padding: "12px", fontSize: "13px", color: "#475569" }}>Department</th>
                  <th style={{ padding: "12px", fontSize: "13px", color: "#475569" }}>Joining Date</th>
                  <th style={{ padding: "12px", fontSize: "13px", color: "#475569" }}>Reporting Manager</th>
                  <th style={{ padding: "12px", fontSize: "13px", color: "#475569" }}>Status</th>
                  <th style={{ padding: "12px", fontSize: "13px", color: "#475569" }}>One-Click Action</th>
                </tr>
              </thead>
              <tbody>
                {filteredSubmissions.map((s) => (
                  <tr key={s.id} style={{ borderBottom: "1px solid #f1f5f9" }}>
                    <td style={{ padding: "12px", fontSize: "13px", fontWeight: "700", color: "#0284c7" }}>
                      {s.employee_code || "LII-IND-001"}
                    </td>
                    <td style={{ padding: "12px", fontSize: "14px", fontWeight: "700", color: "#0f172a" }}>
                      {s.employee_name}
                    </td>
                    <td style={{ padding: "12px", fontSize: "13px", color: "#334155" }}>
                      {s.department}
                    </td>
                    <td style={{ padding: "12px", fontSize: "13px", color: "#475569" }}>
                      {s.joining_date ? new Date(s.joining_date).toLocaleDateString() : "-"}
                    </td>
                    <td style={{ padding: "12px", fontSize: "13px", color: "#475569" }}>
                      {s.mentor_name || "-"}
                    </td>
                    <td style={{ padding: "12px" }}>
                      <span
                        style={{
                          padding: "4px 10px",
                          borderRadius: "12px",
                          fontSize: "12px",
                          fontWeight: "700",
                          background: s.status === "Completed" ? "#dcfce7" : "#e0f2fe",
                          color: s.status === "Completed" ? "#166534" : "#0369a1",
                        }}
                      >
                        {s.status === "Completed" ? "🟢 Completed" : "🔵 In Progress"}
                      </span>
                    </td>
                    <td style={{ padding: "12px" }}>
                      <button
                        type="button"
                        onClick={() => setSelectedSubmission(s)}
                        style={{
                          padding: "6px 14px",
                          background: "#0284c7",
                          color: "#ffffff",
                          border: "none",
                          borderRadius: "6px",
                          fontSize: "12px",
                          fontWeight: "700",
                          cursor: "pointer",
                          boxShadow: "0 1px 3px rgba(2, 132, 199, 0.25)",
                        }}
                      >
                        👁️ View Filled Form
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* --- ONE-CLICK MODAL VIEW FILLED FORM --- */}
      {selectedSubmission && (
        <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.6)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 2000, padding: "20px" }}>
          <div style={{ background: "#ffffff", borderRadius: "14px", width: "100%", maxWidth: "800px", maxHeight: "90vh", overflowY: "auto", padding: "28px", boxShadow: "0 20px 40px rgba(0,0,0,0.3)" }}>
            
            {/* Modal Header */}
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", borderBottom: "2px solid #e2e8f0", paddingBottom: "16px", marginBottom: "20px" }}>
              <div>
                <span style={{ fontSize: "12px", fontWeight: "800", color: "#0284c7", textTransform: "uppercase" }}>
                  LII Nexus – Official Sign-off Record
                </span>
                <h2 style={{ fontSize: "20px", fontWeight: "800", color: "#0f172a", margin: "2px 0 0 0" }}>
                  Employee Induction Completion Form
                </h2>
              </div>
              <div style={{ display: "flex", gap: "10px", alignItems: "center" }}>
                <button
                  onClick={() => window.print()}
                  style={{ padding: "6px 14px", background: "#0f172a", color: "#fff", border: "none", borderRadius: "6px", fontSize: "12px", fontWeight: "700", cursor: "pointer" }}
                >
                  🖨️ Print / PDF
                </button>
                <button
                  onClick={() => setSelectedSubmission(null)}
                  style={{ background: "none", border: "none", fontSize: "24px", cursor: "pointer", color: "#64748b", lineHeight: 1 }}
                >
                  ✕
                </button>
              </div>
            </div>

            {/* Filled Employee Details Header */}
            <div style={{ background: "#f8fafc", border: "1px solid #cbd5e1", borderRadius: "10px", padding: "16px", marginBottom: "24px" }}>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "12px", fontSize: "13px" }}>
                <div><strong>Employee Name:</strong> {selectedSubmission.employee_name}</div>
                <div><strong>Employee ID:</strong> {selectedSubmission.employee_code || "-"}</div>
                <div><strong>Department:</strong> {selectedSubmission.department}</div>
                <div><strong>Date of Joining:</strong> {selectedSubmission.joining_date ? new Date(selectedSubmission.joining_date).toLocaleDateString() : "-"}</div>
                <div><strong>Reporting Manager / Mentor:</strong> {selectedSubmission.mentor_name || "-"}</div>
                <div><strong>Overall Status:</strong> <span style={{ fontWeight: "700", color: selectedSubmission.status === "Completed" ? "#15803d" : "#0284c7" }}>{selectedSubmission.status}</span></div>
                {selectedSubmission.notes && <div style={{ gridColumn: "1 / -1" }}><strong>Form Details / Remarks:</strong> {selectedSubmission.notes}</div>}
              </div>
            </div>

            {/* Filled Checklist Breakdown */}
            <h3 style={{ fontSize: "16px", fontWeight: "700", color: "#0f172a", marginBottom: "16px" }}>
              Filled Induction Checklist Breakdown
            </h3>

            {(() => {
              const filledChecklist = parseSubmissionChecklist(selectedSubmission.checklist_json);
              const filledCats = Array.from(new Set(filledChecklist.map((i) => i.category)));

              return filledCats.map((cat) => {
                const catItems = filledChecklist.filter((i) => i.category === cat);
                const doneCount = catItems.filter((i) => i.completed).length;

                return (
                  <div key={cat} style={{ border: "1px solid #e2e8f0", borderRadius: "10px", padding: "16px", marginBottom: "16px", background: "#ffffff" }}>
                    <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "12px", borderBottom: "1px solid #f1f5f9", paddingBottom: "8px" }}>
                      <strong style={{ fontSize: "14px", color: "#0f172a" }}>{cat}</strong>
                      <span style={{ fontSize: "12px", fontWeight: "700", color: doneCount === catItems.length ? "#16a34a" : "#64748b" }}>
                        {doneCount} / {catItems.length} Completed
                      </span>
                    </div>

                    <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
                      {catItems.map((ci) => (
                        <div
                          key={ci.id}
                          style={{
                            display: "flex",
                            alignItems: "center",
                            gap: "10px",
                            padding: "8px 12px",
                            borderRadius: "6px",
                            background: ci.completed ? "#f0fdf4" : "#fafafa",
                            border: ci.completed ? "1px solid #bbf7d0" : "1px solid #f1f5f9",
                            fontSize: "13px",
                          }}
                        >
                          <span style={{ fontSize: "16px" }}>{ci.completed ? "✅" : "⬜"}</span>
                          <span style={{ fontWeight: ci.completed ? "600" : "400", color: ci.completed ? "#15803d" : "#64748b" }}>
                            {ci.item}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                );
              });
            })()}

            <div style={{ display: "flex", justifyContent: "flex-end", marginTop: "20px" }}>
              <button
                onClick={() => setSelectedSubmission(null)}
                style={{ padding: "9px 20px", background: "#0284c7", color: "#fff", border: "none", borderRadius: "6px", fontWeight: "700" }}
              >
                Close View
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
