import React, { useEffect, useState } from "react";
import { recruitmentApi, InductionTrackerRecord } from "../api/recruitmentApi";

interface ChecklistSectionItem {
  id: string;
  category: string;
  item: string;
  completed: boolean;
}

const INITIAL_CHECKLIST_ITEMS: ChecklistSectionItem[] = [
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

export default function EmployeeInductionCompletionPage() {
  // Employee Details Form State
  const [employeeName, setEmployeeName] = useState("");
  const [employeeId, setEmployeeId] = useState("");
  const [department, setDepartment] = useState("");
  const [designation, setDesignation] = useState("");
  const [dateOfJoining, setDateOfJoining] = useState("");
  const [dateOfInduction, setDateOfInduction] = useState("");
  const [hrExecutive, setHrExecutive] = useState("");
  const [reportingManager, setReportingManager] = useState("");

  // Checklist Items State
  const [checklist, setChecklist] = useState<ChecklistSectionItem[]>(INITIAL_CHECKLIST_ITEMS);

  // Status & Submissions History State
  const [submitting, setSubmitting] = useState(false);
  const [successMsg, setSuccessMsg] = useState("");
  const [submissions, setSubmissions] = useState<InductionTrackerRecord[]>([]);
  const [loadingSubmissions, setLoadingSubmissions] = useState(false);
  const [selectedSubmission, setSelectedSubmission] = useState<InductionTrackerRecord | null>(null);
  const [historySearch, setHistorySearch] = useState("");

  useEffect(() => {
    loadSubmissions();
  }, []);

  async function loadSubmissions() {
    setLoadingSubmissions(true);
    try {
      const data = await recruitmentApi.getInductions();
      setSubmissions(data || []);
    } catch (err) {
      console.error("Failed to load induction submissions", err);
    } finally {
      setLoadingSubmissions(false);
    }
  }

  // Calculate Progress
  const totalItems = checklist.length;
  const completedItemsCount = checklist.filter((i) => i.completed).length;
  const progressPercent = Math.round((completedItemsCount / totalItems) * 100);

  function toggleItem(id: string) {
    setChecklist((prev) =>
      prev.map((item) => (item.id === id ? { ...item, completed: !item.completed } : item))
    );
  }

  function handleSelectAll() {
    setChecklist((prev) => prev.map((item) => ({ ...item, completed: true })));
  }

  function handleResetChecklist() {
    if (window.confirm("Are you sure you want to reset all checklist selections?")) {
      setChecklist((prev) => prev.map((item) => ({ ...item, completed: false })));
    }
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!employeeName.trim() || !employeeId.trim()) {
      alert("Please fill in Employee Name and Employee ID.");
      return;
    }

    setSubmitting(true);
    try {
      await recruitmentApi.createInduction({
        employeeName,
        employeeCode: employeeId,
        department: department || "General",
        joiningDate: dateOfJoining || new Date().toISOString().split("T")[0],
        mentorName: reportingManager || hrExecutive || "HR Team",
        status: progressPercent === 100 ? "Completed" : "In Progress",
        checklistJson: JSON.stringify(checklist),
        notes: `Designation: ${designation} | Induction Date: ${dateOfInduction} | HR: ${hrExecutive}`,
      });

      setSuccessMsg("🎉 Employee Induction Completion Form saved successfully!");
      setTimeout(() => setSuccessMsg(""), 5000);
      loadSubmissions(); // reload history list
    } catch (err) {
      console.error("Failed to submit induction completion form", err);
      alert("Failed to save induction completion form.");
    } finally {
      setSubmitting(false);
    }
  }

  function handlePrint() {
    window.print();
  }

  // Categories Grouping
  const categories = Array.from(new Set(checklist.map((i) => i.category)));

  // Filtered Submissions
  const filteredSubmissions = submissions.filter((s) => {
    if (!historySearch.trim()) return true;
    const q = historySearch.toLowerCase();
    return (
      s.employee_name.toLowerCase().includes(q) ||
      (s.employee_code && s.employee_code.toLowerCase().includes(q)) ||
      s.department.toLowerCase().includes(q)
    );
  });

  // Helper to parse checklist items from JSON
  function parseSubmissionChecklist(jsonStr: string | null): ChecklistSectionItem[] {
    if (!jsonStr) return INITIAL_CHECKLIST_ITEMS;
    try {
      const parsed = JSON.parse(jsonStr);
      if (Array.isArray(parsed) && parsed.length > 0) {
        if (parsed[0].category && parsed[0].item !== undefined) {
          return parsed as ChecklistSectionItem[];
        }
        // Legacy checklist format conversion
        return INITIAL_CHECKLIST_ITEMS.map((item, idx) => ({
          ...item,
          completed: parsed[idx] ? parsed[idx].completed : false,
        }));
      }
    } catch (e) {
      console.error("Error parsing checklist json", e);
    }
    return INITIAL_CHECKLIST_ITEMS;
  }

  return (
    <div style={{ background: "#f8fafc", minHeight: "100vh", padding: "24px" }}>
      {/* Header */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "20px" }}>
        <div>
          <span style={{ fontSize: "12px", fontWeight: "700", color: "#0284c7", textTransform: "uppercase", letterSpacing: "0.5px" }}>
            LII Nexus – HR Module
          </span>
          <h1 style={{ fontSize: "24px", fontWeight: "800", color: "#0f172a", margin: "2px 0 4px 0" }}>
            Employee Induction Completion Form
          </h1>
          <p style={{ fontSize: "14px", color: "#64748b", margin: 0 }}>
            System-driven employee onboarding checklist and official induction sign-off process.
          </p>
        </div>

        <div style={{ display: "flex", gap: "10px" }}>
          <button
            type="button"
            onClick={handleSelectAll}
            style={{
              padding: "9px 14px",
              background: "#f0fdf4",
              border: "1px solid #bbf7d0",
              color: "#166534",
              borderRadius: "8px",
              fontSize: "13px",
              fontWeight: "700",
              cursor: "pointer",
            }}
          >
            ⚡ Select All
          </button>

          <button
            type="button"
            onClick={handleResetChecklist}
            style={{
              padding: "9px 14px",
              background: "#ffffff",
              border: "1px solid #cbd5e1",
              color: "#475569",
              borderRadius: "8px",
              fontSize: "13px",
              fontWeight: "600",
              cursor: "pointer",
            }}
          >
            🔄 Reset
          </button>

          <button
            type="button"
            onClick={handlePrint}
            style={{
              padding: "9px 16px",
              background: "#0f172a",
              color: "#ffffff",
              border: "none",
              borderRadius: "8px",
              fontSize: "13px",
              fontWeight: "700",
              cursor: "pointer",
            }}
          >
            🖨️ Print / PDF
          </button>
        </div>
      </div>

      {successMsg && (
        <div style={{ padding: "12px 16px", background: "#f0fdf4", border: "1px solid #bbf7d0", color: "#166534", borderRadius: "8px", fontWeight: "700", fontSize: "14px", marginBottom: "20px" }}>
          {successMsg}
        </div>
      )}

      {/* Progress Bar Card */}
      <div style={{ background: "#ffffff", borderRadius: "12px", border: "1px solid #e2e8f0", padding: "16px 20px", marginBottom: "24px", boxShadow: "0 2px 4px rgba(0,0,0,0.04)" }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "8px" }}>
          <span style={{ fontSize: "13px", fontWeight: "700", color: "#334155" }}>
            Induction Completion Progress
          </span>
          <span
            style={{
              fontSize: "12px",
              fontWeight: "800",
              padding: "3px 10px",
              borderRadius: "12px",
              background: progressPercent === 100 ? "#dcfce7" : "#e0f2fe",
              color: progressPercent === 100 ? "#15803d" : "#0369a1",
            }}
          >
            {completedItemsCount} / {totalItems} Items Completed ({progressPercent}%)
          </span>
        </div>
        <div style={{ width: "100%", height: "10px", background: "#e2e8f0", borderRadius: "6px", overflow: "hidden" }}>
          <div
            style={{
              width: `${progressPercent}%`,
              height: "100%",
              background: progressPercent === 100 ? "#16a34a" : "#0284c7",
              transition: "width 0.3s ease",
            }}
          />
        </div>
      </div>

      <form onSubmit={handleSubmit}>
        {/* SECTION 1: Employee Details */}
        <div style={{ background: "#ffffff", borderRadius: "12px", border: "1px solid #e2e8f0", padding: "24px", marginBottom: "24px", boxShadow: "0 2px 8px rgba(0,0,0,0.04)" }}>
          <h2 style={{ fontSize: "16px", fontWeight: "700", color: "#0f172a", margin: "0 0 16px 0", borderBottom: "1px solid #f1f5f9", paddingBottom: "10px" }}>
            📋 Section 1: Employee Details
          </h2>

          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))", gap: "16px" }}>
            <div>
              <label style={{ display: "block", fontSize: "13px", fontWeight: "600", color: "#334155", marginBottom: "4px" }}>
                Employee Name *
              </label>
              <input
                type="text"
                required
                value={employeeName}
                onChange={(e) => setEmployeeName(e.target.value)}
                placeholder="e.g. Ramesh Kumar"
                style={{ width: "100%", padding: "9px 12px", border: "1px solid #cbd5e1", borderRadius: "6px", fontSize: "14px" }}
              />
            </div>

            <div>
              <label style={{ display: "block", fontSize: "13px", fontWeight: "600", color: "#334155", marginBottom: "4px" }}>
                Employee ID *
              </label>
              <input
                type="text"
                required
                value={employeeId}
                onChange={(e) => setEmployeeId(e.target.value)}
                placeholder="e.g. LII-2026-089"
                style={{ width: "100%", padding: "9px 12px", border: "1px solid #cbd5e1", borderRadius: "6px", fontSize: "14px" }}
              />
            </div>

            <div>
              <label style={{ display: "block", fontSize: "13px", fontWeight: "600", color: "#334155", marginBottom: "4px" }}>
                Department *
              </label>
              <select
                required
                value={department}
                onChange={(e) => setDepartment(e.target.value)}
                style={{ width: "100%", padding: "9px 12px", border: "1px solid #cbd5e1", borderRadius: "6px", fontSize: "14px", color: department ? "#0f172a" : "#64748b" }}
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
                <option value="IT & ERP Support">IT & ERP Support</option>
              </select>
            </div>

            <div>
              <label style={{ display: "block", fontSize: "13px", fontWeight: "600", color: "#334155", marginBottom: "4px" }}>
                Designation *
              </label>
              <input
                type="text"
                required
                value={designation}
                onChange={(e) => setDesignation(e.target.value)}
                placeholder="e.g. Senior CNC Operator"
                style={{ width: "100%", padding: "9px 12px", border: "1px solid #cbd5e1", borderRadius: "6px", fontSize: "14px" }}
              />
            </div>

            <div>
              <label style={{ display: "block", fontSize: "13px", fontWeight: "600", color: "#334155", marginBottom: "4px" }}>
                Date of Joining *
              </label>
              <input
                type="date"
                required
                value={dateOfJoining}
                onChange={(e) => setDateOfJoining(e.target.value)}
                style={{ width: "100%", padding: "9px 12px", border: "1px solid #cbd5e1", borderRadius: "6px", fontSize: "14px" }}
              />
            </div>

            <div>
              <label style={{ display: "block", fontSize: "13px", fontWeight: "600", color: "#334155", marginBottom: "4px" }}>
                Date of Induction *
              </label>
              <input
                type="date"
                required
                value={dateOfInduction}
                onChange={(e) => setDateOfInduction(e.target.value)}
                style={{ width: "100%", padding: "9px 12px", border: "1px solid #cbd5e1", borderRadius: "6px", fontSize: "14px" }}
              />
            </div>

            <div>
              <label style={{ display: "block", fontSize: "13px", fontWeight: "600", color: "#334155", marginBottom: "4px" }}>
                HR Executive *
              </label>
              <input
                type="text"
                required
                value={hrExecutive}
                onChange={(e) => setHrExecutive(e.target.value)}
                placeholder="e.g. Sunita Rao"
                style={{ width: "100%", padding: "9px 12px", border: "1px solid #cbd5e1", borderRadius: "6px", fontSize: "14px" }}
              />
            </div>

            <div>
              <label style={{ display: "block", fontSize: "13px", fontWeight: "600", color: "#334155", marginBottom: "4px" }}>
                Reporting Manager *
              </label>
              <input
                type="text"
                required
                value={reportingManager}
                onChange={(e) => setReportingManager(e.target.value)}
                placeholder="e.g. Vikram Sharma"
                style={{ width: "100%", padding: "9px 12px", border: "1px solid #cbd5e1", borderRadius: "6px", fontSize: "14px" }}
              />
            </div>
          </div>
        </div>

        {/* SECTION 2: Induction Checklist Categories */}
        {categories.map((cat) => {
          const categoryItems = checklist.filter((i) => i.category === cat);
          const completedCategoryCount = categoryItems.filter((i) => i.completed).length;

          return (
            <div key={cat} style={{ background: "#ffffff", borderRadius: "12px", border: "1px solid #e2e8f0", padding: "20px", marginBottom: "20px", boxShadow: "0 2px 6px rgba(0,0,0,0.03)" }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", borderBottom: "2px solid #f1f5f9", paddingBottom: "10px", marginBottom: "16px" }}>
                <h3 style={{ fontSize: "15px", fontWeight: "700", color: "#0f172a", margin: 0 }}>
                  {cat}
                </h3>
                <span style={{ fontSize: "12px", fontWeight: "700", color: completedCategoryCount === categoryItems.length ? "#166534" : "#64748b", background: completedCategoryCount === categoryItems.length ? "#dcfce7" : "#f1f5f9", padding: "3px 8px", borderRadius: "6px" }}>
                  {completedCategoryCount} / {categoryItems.length} Done
                </span>
              </div>

              <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
                {categoryItems.map((item) => (
                  <label
                    key={item.id}
                    onClick={() => toggleItem(item.id)}
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: "12px",
                      padding: "10px 14px",
                      borderRadius: "8px",
                      border: item.completed ? "1px solid #bbf7d0" : "1px solid #e2e8f0",
                      background: item.completed ? "#f0fdf4" : "#ffffff",
                      cursor: "pointer",
                      transition: "all 0.15s ease",
                    }}
                  >
                    <input
                      type="checkbox"
                      checked={item.completed}
                      onChange={() => {}}
                      style={{ width: "18px", height: "18px", accentColor: "#16a34a", cursor: "pointer" }}
                    />
                    <span style={{ fontSize: "14px", fontWeight: item.completed ? "600" : "500", color: item.completed ? "#14532d" : "#334155" }}>
                      {item.item}
                    </span>
                  </label>
                ))}
              </div>
            </div>
          );
        })}

        {/* Submit Button */}
        <div style={{ display: "flex", justifyContent: "flex-end", gap: "12px", marginTop: "24px", marginBottom: "32px" }}>
          <button
            type="submit"
            disabled={submitting}
            style={{
              padding: "12px 28px",
              background: "#0284c7",
              color: "#ffffff",
              border: "none",
              borderRadius: "8px",
              fontSize: "15px",
              fontWeight: "700",
              cursor: "pointer",
              boxShadow: "0 2px 8px rgba(2, 132, 199, 0.3)",
            }}
          >
            {submitting ? "Submitting Form..." : "💾 Submit Employee Induction Completion Form"}
          </button>
        </div>
      </form>
    </div>
  );
}
