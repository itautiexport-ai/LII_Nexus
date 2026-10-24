import React, { useState, useEffect, useRef } from "react";
import { useNavigate, useParams, Link } from "react-router-dom";
import { helpTicketsApi, CreateHelpTicketPayload } from "../api/helpTicketsApi";
import { employeesApi, EmployeeRecord } from "../../../admin/organization/employees/api/employeesApi";
import { useIsSystemAdmin } from "../../../auth/hooks/usePermissions";
import { axiosInstance } from "../../../../services/api/axiosInstance";

export default function AddHelpTicketPage() {
  const navigate = useNavigate();
  const { id } = useParams<{ id?: string }>();
  const isEdit = !!id;
  const isAdmin = useIsSystemAdmin();
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
    let mounted = true;
    Promise.all([
      employeesApi.listForDropdown(""),
      isEdit && id ? helpTicketsApi.getById(id) : Promise.resolve(null),
    ])
      .then(([emps, ticket]) => {
        if (!mounted) return;
        setEmployees(emps);
        if (ticket) {
          setForm({
            subject: ticket.subject,
            problemSolverId: ticket.problemSolverId,
            problem: ticket.problem,
            priority: ticket.priority,
            plannedDate: ticket.plannedDate || "",
            attachmentMandatory: !!ticket.attachmentMandatory,
            mediaUrl: ticket.mediaUrl || null,
          });
        }
      })
      .catch(() => {
        if (mounted) setError("Failed to load required data.");
      });

    return () => {
      mounted = false;
    };
  }, [id, isEdit]);

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
      let uploadedMediaUrl = form.mediaUrl;
      if (mediaFile) {
        try {
          const uploadFormData = new FormData();
          uploadFormData.append("file", mediaFile);
          const uploadRes = await axiosInstance.post("/upload", uploadFormData, {
            headers: { "Content-Type": "multipart/form-data" },
          });
          uploadedMediaUrl = uploadRes.data?.data?.fileUrl || uploadRes.data?.fileUrl || mediaFile.name;
        } catch (uploadErr) {
          console.error("Attachment upload failed, using file name:", uploadErr);
          uploadedMediaUrl = mediaFile.name;
        }
      }

      const payload: CreateHelpTicketPayload = {
        ...form,
        plannedDate: form.plannedDate || null,
        mediaUrl: uploadedMediaUrl,
      };
      if (isEdit && id) {
        await helpTicketsApi.update(id, payload);
      } else {
        await helpTicketsApi.create(payload);
      }
      navigate("/admin/help-tickets/all");
    } catch (err: any) {
      setError(err?.response?.data?.error || `Failed to ${isEdit ? "update" : "create"} ticket.`);
    } finally {
      setSubmitting(false);
    }
  }

  if (!isAdmin) {
    return (
      <div style={{ ...s.page, textAlign: "center", paddingTop: 80 }}>
        <div style={{ ...s.card, maxWidth: 500, margin: "0 auto", padding: 40 }}>
          <div style={{ fontSize: 48, marginBottom: 16 }}>🔒</div>
          <h2 style={{ fontSize: 22, color: "#1e293b", marginBottom: 12 }}>Access Restricted</h2>
          <p style={{ color: "#64748b", fontSize: 14, lineHeight: 1.6, marginBottom: 24 }}>
            Only Admin accounts have permission to {isEdit ? "edit" : "add"} help tickets.
          </p>
          <Link
            to="/admin/help-tickets/all"
            style={{
              display: "inline-block",
              background: "#3b82f6",
              color: "#fff",
              padding: "10px 20px",
              borderRadius: 6,
              textDecoration: "none",
              fontWeight: 600,
              fontSize: 14,
            }}
          >
            ← Back to Help Tickets
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div style={s.page}>
      <div style={s.card}>
        <p style={s.cardTitle}>{isEdit ? "EDIT HELP TICKET" : "CREATE HELP TICKET"}</p>
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
                    {mediaFile ? mediaFile.name : (form.mediaUrl ? form.mediaUrl.split("/").pop() : "No file chosen")}
                  </span>
                </div>
                {form.mediaUrl && !mediaFile && (
                  <p style={{ margin: "4px 0 0", fontSize: 12, color: "#2563eb" }}>
                    Current attachment: <a href={form.mediaUrl.startsWith("http") ? form.mediaUrl : `/uploads/${form.mediaUrl}`} target="_blank" rel="noopener noreferrer" style={{ color: "#2563eb", textDecoration: "underline" }}>{form.mediaUrl.split("/").pop()}</a>
                  </p>
                )}
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
                  {submitting ? (isEdit ? "UPDATING..." : "SUBMITTING...") : (isEdit ? "UPDATE TICKET" : "SUBMIT")}
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
