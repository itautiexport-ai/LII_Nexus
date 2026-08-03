import React, { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { helpTicketsApi, CreateHelpTicketPayload } from "../api/helpTicketsApi";
import { employeesApi, EmployeeRecord } from "../../../admin/organization/employees/api/employeesApi";

export default function AddHelpTicketPage() {
  const navigate = useNavigate();
  const fileRef = useRef<HTMLInputElement>(null);

  const [employees, setEmployees] = useState<EmployeeRecord[]>([]);
  const [form, setForm] = useState<CreateHelpTicketPayload>({
    subject: "",
    problemSolverId: "",
    problem: "",
    priority: "Medium",
    plannedDate: "",
    attachmentMandatory: false,
    mediaUrl: null,
  });
  const [mediaFile, setMediaFile] = useState<File | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    employeesApi.list("").then(setEmployees).catch(() => {});
  }, []);

  function handleChange(
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>
  ) {
    const { name, value, type } = e.target;
    if (type === "checkbox") {
      setForm((f) => ({ ...f, [name]: (e.target as HTMLInputElement).checked }));
    } else {
      setForm((f) => ({ ...f, [name]: value }));
    }
  }

  function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 2 * 1024 * 1024) {
      alert("File size must be 2MB or less.");
      e.target.value = "";
      return;
    }
    setMediaFile(file);
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!form.subject || !form.problemSolverId || !form.problem || !form.priority) {
      setError("Please fill in all required fields.");
      return;
    }
    setSubmitting(true);
    setError(null);
    try {
      const payload: CreateHelpTicketPayload = {
        ...form,
        plannedDate: form.plannedDate || null,
        mediaUrl: mediaFile ? mediaFile.name : null,
      };
      await helpTicketsApi.create(payload);
      navigate("/admin/help-tickets/all");
    } catch (err: any) {
      setError(err?.response?.data?.error || "Failed to create ticket.");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div style={s.page}>
      <div style={s.card}>
        <p style={s.cardTitle}>CREATE HELP TICKET</p>
        <div style={s.divider} />

        <form onSubmit={handleSubmit}>
          <div style={s.grid}>
            {/* ─── LEFT COLUMN ─── */}
            <div style={s.col}>
              {/* Subject */}
              <div style={s.field}>
                <label style={s.label}>
                  Subject <span style={s.star}>*</span>
                  <InfoIcon tip="Enter a brief subject for your ticket" />
                </label>
                <input
                  name="subject"
                  value={form.subject}
                  onChange={handleChange}
                  style={s.input}
                  required
                />
              </div>

              {/* Media Upload */}
              <div style={s.field}>
                <label style={s.label}>
                  Media Upload <InfoIcon tip="Upload a file related to the issue (max 2MB)" />
                </label>
                <input
                  ref={fileRef}
                  type="file"
                  style={{ display: "none" }}
                  onChange={handleFileChange}
                  accept="image/*,application/pdf,.doc,.docx,.xls,.xlsx"
                />
                <div style={s.fileRow} onClick={() => fileRef.current?.click()}>
                  <button
                    type="button"
                    style={s.chooseBtn}
                    onClick={(e) => { e.stopPropagation(); fileRef.current?.click(); }}
                  >
                    Choose files
                  </button>
                  <span style={s.fileName}>
                    {mediaFile ? mediaFile.name : "No file chosen"}
                  </span>
                </div>
                <p style={s.hint}>*File upload maximum limit 2MB</p>
              </div>

              {/* Priority */}
              <div style={s.field}>
                <label style={s.label}>
                  Priority <span style={s.star}>*</span>
                  <InfoIcon tip="Set the priority level" />
                </label>
                <select name="priority" value={form.priority} onChange={handleChange} style={s.select} required>
                  <option value="" disabled>Select One</option>
                  <option value="High">High</option>
                  <option value="Medium">Medium</option>
                  <option value="Low">Low</option>
                </select>
              </div>

              {/* Attachment Mandatory */}
              <div style={s.checkRow}>
                <span style={s.checkLabel}>
                  Make Attachment Mandatory When Work Done
                </span>
                <input
                  type="checkbox"
                  name="attachmentMandatory"
                  checked={!!form.attachmentMandatory}
                  onChange={handleChange}
                  style={s.checkbox}
                />
                <InfoIcon tip="Require attachment when marking as done" />
              </div>

              {/* Submit */}
              {error && <p style={s.errorText}>{error}</p>}
              <div>
                <button type="submit" style={s.submitBtn} disabled={submitting}>
                  {submitting ? "SUBMITTING..." : "SUBMIT"}
                </button>
              </div>
            </div>

            {/* ─── RIGHT COLUMN ─── */}
            <div style={s.col}>
              {/* Select Problem Solver */}
              <div style={s.field}>
                <label style={s.label}>
                  Select Problem Solver <span style={s.star}>*</span>
                  <InfoIcon tip="Select the employee responsible for solving this ticket" />
                </label>
                <select
                  name="problemSolverId"
                  value={form.problemSolverId}
                  onChange={handleChange}
                  style={s.input}
                  required
                >
                  <option value="" disabled>Select employee</option>
                  {employees.map((emp) => (
                    <option key={emp.id} value={emp.id}>
                      {emp.fullName}{emp.designationTitle ? ` — ${emp.designationTitle}` : ""}
                    </option>
                  ))}
                </select>
              </div>

              {/* Problem */}
              <div style={s.field}>
                <label style={s.label}>
                  Problem <span style={s.star}>*</span>
                  <InfoIcon tip="Describe the problem in detail" />
                </label>
                <textarea
                  name="problem"
                  value={form.problem}
                  onChange={handleChange}
                  style={s.textarea}
                  rows={6}
                  required
                />
              </div>

              {/* Planned Date */}
              <div style={s.field}>
                <label style={s.label}>
                  Planned Date <InfoIcon tip="Expected date for resolution" />
                </label>
                <input
                  type="date"
                  name="plannedDate"
                  value={form.plannedDate || ""}
                  onChange={handleChange}
                  style={{ ...s.input, background: "#f3f4f6" }}
                />
              </div>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
}

function InfoIcon({ tip }: { tip: string }) {
  return (
    <span
      title={tip}
      style={{
        display: "inline-flex",
        alignItems: "center",
        justifyContent: "center",
        width: 16,
        height: 16,
        background: "#3b82f6",
        color: "#fff",
        borderRadius: "50%",
        fontSize: 10,
        fontWeight: 700,
        cursor: "help",
        marginLeft: 4,
        flexShrink: 0,
        lineHeight: 1,
        verticalAlign: "middle",
      }}
    >
      i
    </span>
  );
}

const s: Record<string, React.CSSProperties> = {
  page: {
    minHeight: "100vh",
    background: "#f0f2f5",
    padding: "24px",
    fontFamily: "-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif",
  },
  card: {
    background: "#fff",
    borderRadius: 8,
    padding: "28px 32px 36px",
    maxWidth: 1060,
    margin: "0 auto",
    boxShadow: "0 1px 4px rgba(0,0,0,0.08)",
  },
  cardTitle: {
    fontSize: 13,
    fontWeight: 700,
    color: "#374151",
    margin: "0 0 14px",
    textTransform: "uppercase" as const,
    letterSpacing: "0.04em",
  },
  divider: {
    height: 1,
    background: "#e5e7eb",
    margin: "0 -32px 28px",
  },
  grid: {
    display: "grid",
    gridTemplateColumns: "1fr 1fr",
    gap: "0 40px",
    alignItems: "start",
  },
  col: {
    display: "flex",
    flexDirection: "column" as const,
    gap: 22,
  },
  field: {
    display: "flex",
    flexDirection: "column" as const,
    gap: 6,
  },
  label: {
    display: "flex",
    alignItems: "center",
    gap: 0,
    fontSize: 13,
    fontWeight: 600,
    color: "#374151",
    marginBottom: 2,
  },
  star: {
    color: "#ef4444",
    marginLeft: 2,
    marginRight: 2,
  },
  input: {
    width: "100%",
    padding: "8px 10px",
    border: "1px solid #d1d5db",
    borderRadius: 4,
    fontSize: 13,
    color: "#111827",
    background: "#fff",
    outline: "none",
    boxSizing: "border-box" as const,
    fontFamily: "inherit",
  },
  select: {
    width: "100%",
    padding: "8px 10px",
    border: "1px solid #d1d5db",
    borderRadius: 4,
    fontSize: 13,
    color: "#111827",
    background: "#fff",
    outline: "none",
    boxSizing: "border-box" as const,
    fontFamily: "inherit",
    cursor: "pointer",
  },
  textarea: {
    width: "100%",
    padding: "8px 10px",
    border: "1px solid #d1d5db",
    borderRadius: 4,
    fontSize: 13,
    color: "#111827",
    background: "#fff",
    outline: "none",
    resize: "vertical" as const,
    boxSizing: "border-box" as const,
    fontFamily: "inherit",
  },
  fileRow: {
    display: "flex",
    alignItems: "stretch",
    border: "1px solid #d1d5db",
    borderRadius: 4,
    overflow: "hidden",
    cursor: "pointer",
  },
  chooseBtn: {
    padding: "7px 12px",
    background: "#f3f4f6",
    border: "none",
    borderRight: "1px solid #d1d5db",
    fontSize: 13,
    color: "#374151",
    cursor: "pointer",
    fontFamily: "inherit",
    whiteSpace: "nowrap" as const,
  },
  fileName: {
    padding: "7px 12px",
    fontSize: 13,
    color: "#9ca3af",
    flex: 1,
    overflow: "hidden",
    textOverflow: "ellipsis",
    whiteSpace: "nowrap" as const,
    background: "#fff",
    lineHeight: "22px",
  },
  hint: {
    fontSize: 12,
    color: "#6b7280",
    margin: 0,
  },
  checkRow: {
    display: "flex",
    alignItems: "center",
    gap: 6,
    fontSize: 13,
    fontWeight: 500,
    color: "#374151",
  },
  checkLabel: {
    fontSize: 13,
    fontWeight: 500,
    color: "#374151",
  },
  checkbox: {
    width: 15,
    height: 15,
    cursor: "pointer",
    flexShrink: 0,
    accentColor: "#2563eb",
  },
  submitBtn: {
    background: "#2563eb",
    color: "#fff",
    border: "none",
    borderRadius: 4,
    padding: "10px 44px",
    fontSize: 13,
    fontWeight: 700,
    cursor: "pointer",
    letterSpacing: "0.08em",
    fontFamily: "inherit",
    marginTop: 4,
  },
  errorText: {
    color: "#ef4444",
    fontSize: 12,
    margin: "0",
  },
};
