import React, { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { complaintApi, Complaint, ComplaintStatus, ComplaintPriority } from "../api/complaintApi";

const statusColors: Record<ComplaintStatus, { bg: string, text: string }> = {
  new: { bg: "#e0f2fe", text: "#0369a1" },
  assigned: { bg: "#e0e7ff", text: "#4338ca" },
  under_investigation: { bg: "#fef3c7", text: "#b45309" },
  capa_in_progress: { bg: "#ffedd5", text: "#c2410c" },
  pending_customer: { bg: "#f3e8ff", text: "#7e22ce" },
  resolved: { bg: "#dcfce7", text: "#15803d" },
  closed: { bg: "#f3f4f6", text: "#374151" },
  escalated: { bg: "#fee2e2", text: "#b91c1c" },
};

const priorityColors: Record<ComplaintPriority, { bg: string, text: string }> = {
  low: { bg: "#f3f4f6", text: "#374151" },
  medium: { bg: "#e0f2fe", text: "#0369a1" },
  high: { bg: "#ffedd5", text: "#c2410c" },
  critical: { bg: "#fee2e2", text: "#b91c1c" },
};

// --- Styles ---
const containerStyle: React.CSSProperties = {
  maxWidth: "1000px",
  margin: "40px auto",
  fontFamily: "'Inter', 'Roboto', sans-serif",
  color: "#333",
  paddingBottom: "60px",
  padding: "0 20px"
};

const headerWrapperStyle: React.CSSProperties = {
  display: "flex",
  justifyContent: "space-between",
  alignItems: "flex-start",
  marginBottom: "30px",
  flexWrap: "wrap",
  gap: "16px"
};

const titleRowStyle: React.CSSProperties = {
  display: "flex",
  alignItems: "center",
  gap: "12px",
  flexWrap: "wrap",
  marginBottom: "8px"
};

const titleStyle: React.CSSProperties = {
  fontSize: "26px",
  fontWeight: 700,
  color: "#111827",
  margin: 0
};

const badgeStyle = (bg: string, text: string, border?: string): React.CSSProperties => ({
  padding: "4px 10px",
  borderRadius: "9999px",
  fontSize: "12px",
  fontWeight: 600,
  backgroundColor: bg,
  color: text,
  border: border ? `1px solid ${border}` : "none",
  whiteSpace: "nowrap"
});

const buttonGroupStyle: React.CSSProperties = {
  display: "flex",
  gap: "12px",
  alignItems: "center"
};

const buttonStyle = (primary = false): React.CSSProperties => ({
  padding: "10px 18px",
  fontSize: "14px",
  fontWeight: 600,
  borderRadius: "8px",
  border: primary ? "none" : "1px solid #d1d5db",
  backgroundColor: primary ? "#4f46e5" : "#ffffff",
  color: primary ? "#ffffff" : "#374151",
  cursor: "pointer",
  transition: "all 0.2s ease",
  boxShadow: primary ? "0 4px 12px rgba(79, 70, 229, 0.3)" : "0 1px 2px rgba(0,0,0,0.05)",
  display: "inline-flex",
  alignItems: "center",
  gap: "6px"
});

const selectStyle: React.CSSProperties = {
  padding: "9px 12px",
  fontSize: "14px",
  fontWeight: 500,
  borderRadius: "8px",
  border: "1px solid #d1d5db",
  backgroundColor: "#fff",
  color: "#374151",
  outline: "none",
  cursor: "pointer"
};

const gridContainerStyle: React.CSSProperties = {
  display: "grid",
  gridTemplateColumns: "repeat(auto-fit, minmax(400px, 1fr))",
  gap: "24px"
};

const cardStyle: React.CSSProperties = {
  backgroundColor: "#ffffff",
  borderRadius: "12px",
  boxShadow: "0 4px 20px rgba(0,0,0,0.03)",
  border: "1px solid #f3f4f6",
  padding: "24px"
};

const cardHeaderStyle: React.CSSProperties = {
  fontSize: "18px",
  fontWeight: 600,
  color: "#111827",
  borderBottom: "1px solid #f3f4f6",
  paddingBottom: "12px",
  marginBottom: "20px",
  display: "flex",
  alignItems: "center",
  gap: "8px"
};

const fieldGridStyle = (cols: number = 2): React.CSSProperties => ({
  display: "grid",
  gridTemplateColumns: `repeat(${cols}, 1fr)`,
  gap: "20px",
  marginBottom: "20px"
});

const labelStyle: React.CSSProperties = {
  fontSize: "12px",
  fontWeight: 600,
  color: "#6b7280",
  textTransform: "uppercase",
  letterSpacing: "0.5px",
  marginBottom: "6px",
  display: "block"
};

const valueStyle: React.CSSProperties = {
  fontSize: "15px",
  color: "#111827",
  fontWeight: 500,
  lineHeight: "1.5"
};

const boxValueStyle: React.CSSProperties = {
  fontSize: "14px",
  color: "#374151",
  backgroundColor: "#f9fafb",
  padding: "12px",
  borderRadius: "8px",
  border: "1px solid #f3f4f6",
  whiteSpace: "pre-wrap",
  lineHeight: "1.6"
};

const linkListStyle: React.CSSProperties = {
  listStyle: "none",
  padding: 0,
  margin: 0,
  display: "flex",
  flexDirection: "column",
  gap: "8px"
};

const linkStyle: React.CSSProperties = {
  color: "#4f46e5",
  textDecoration: "none",
  fontSize: "14px",
  fontWeight: 500,
  display: "flex",
  alignItems: "center",
  gap: "6px"
};

export default function ComplaintDetailPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [complaint, setComplaint] = useState<Complaint | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (id) fetchComplaint(id);
  }, [id]);

  const fetchComplaint = async (complaintId: string) => {
    try {
      const data = await complaintApi.getById(complaintId);
      setComplaint(data);
    } catch (e) {
      console.error("Failed to load complaint", e);
    } finally {
      setLoading(false);
    }
  };

  const handleStatusChange = async (e: React.ChangeEvent<HTMLSelectElement>) => {
    if (!complaint) return;
    const newStatus = e.target.value as ComplaintStatus;
    try {
      await complaintApi.update(complaint.id, { status: newStatus });
      setComplaint({ ...complaint, status: newStatus });
    } catch (err) {
      console.error("Failed to update status", err);
      alert("Failed to update status");
    }
  };

  if (loading) return <div style={{ textAlign: "center", padding: "40px", color: "#6b7280" }}>Loading complaint details...</div>;
  if (!complaint) return <div style={{ textAlign: "center", padding: "40px", color: "#ef4444" }}>Complaint not found or you don't have access.</div>;

  return (
    <div style={containerStyle}>
      {/* Header Section */}
      <div style={headerWrapperStyle}>
        <div>
          <div style={titleRowStyle}>
            <h1 style={titleStyle}>{complaint.complaintNumber}</h1>
            <span style={badgeStyle(priorityColors[complaint.priority].bg, priorityColors[complaint.priority].text)}>
              {complaint.priority.toUpperCase()}
            </span>
            <span style={badgeStyle(statusColors[complaint.status].bg, statusColors[complaint.status].text)}>
              {complaint.status.replace(/_/g, " ").toUpperCase()}
            </span>
            {complaint.repeatIssue && (
              <span style={badgeStyle("#fee2e2", "#991b1b", "#fca5a5")}>
                ★ REPEAT ISSUE
              </span>
            )}
          </div>
          <p style={{ margin: 0, fontSize: "14px", color: "#6b7280", marginTop: "8px" }}>
            Registered on <strong>{new Date(complaint.createdAt).toLocaleString()}</strong>
          </p>
        </div>
        
        <div style={buttonGroupStyle}>
          <select 
            value={complaint.status} 
            onChange={handleStatusChange}
            style={selectStyle}
            title="Update Status"
          >
            {Object.keys(statusColors).map(s => (
              <option key={s} value={s}>{s.replace(/_/g, " ").toUpperCase()}</option>
            ))}
          </select>
          <button 
            style={buttonStyle()} 
            onClick={() => navigate("/admin/crm/complaints")}
            onMouseEnter={(e) => (e.target as HTMLElement).style.backgroundColor = "#f9fafb"}
            onMouseLeave={(e) => (e.target as HTMLElement).style.backgroundColor = "#ffffff"}
          >
            ← Back to List
          </button>
          <button 
            style={buttonStyle(true)} 
            onClick={() => navigate(`/admin/crm/complaints/new?edit=${complaint.id}`)}
            onMouseEnter={(e) => (e.target as HTMLElement).style.backgroundColor = "#4338ca"}
            onMouseLeave={(e) => (e.target as HTMLElement).style.backgroundColor = "#4f46e5"}
          >
            Edit full CQA ✎
          </button>
        </div>
      </div>

      <div style={gridContainerStyle}>
        {/* Card: Registration Info */}
        <div style={cardStyle}>
          <h2 style={cardHeaderStyle}>📄 Registration Details</h2>
          
          <div style={{ marginBottom: "20px" }}>
            <span style={labelStyle}>Complaint Title</span>
            <span style={{ ...valueStyle, fontSize: "18px", color: "#4f46e5" }}>{complaint.title}</span>
          </div>
          
          <div style={fieldGridStyle(2)}>
            <div>
              <span style={labelStyle}>Customer / Buyer</span>
              <span style={valueStyle}>{complaint.buyerName || "—"}</span>
            </div>
            <div>
              <span style={labelStyle}>Assigned Owner</span>
              <span style={valueStyle}>{complaint.assignedToName || "—"}</span>
            </div>
            <div>
              <span style={labelStyle}>Order / Invoice</span>
              <span style={valueStyle}>{complaint.orderInvoiceNo || "—"}</span>
            </div>
            <div>
              <span style={labelStyle}>Product / SKU</span>
              <span style={valueStyle}>{complaint.productSku || "—"}</span>
            </div>
            <div>
              <span style={labelStyle}>Category</span>
              <span style={valueStyle}>{complaint.complaintCategory || "—"}</span>
            </div>
          </div>
          
          <div style={{ marginBottom: "20px" }}>
            <span style={labelStyle}>Description</span>
            <div style={boxValueStyle}>
              {complaint.description || "No description provided."}
            </div>
          </div>

          {complaint.attachments && complaint.attachments.length > 0 && (
            <div>
              <span style={labelStyle}>Attachments</span>
              <ul style={linkListStyle}>
                {complaint.attachments.map((att, i) => (
                  <li key={i}>
                    <a href={att} target="_blank" rel="noreferrer" style={linkStyle}>
                      <span style={{ fontSize: "16px" }}>📎</span> {att.split('/').pop()}
                    </a>
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>

        {/* Card: Investigation & RCA */}
        <div style={cardStyle}>
          <h2 style={cardHeaderStyle}>🔍 Investigation & RCA</h2>
          
          <div style={fieldGridStyle(1)}>
            <div>
              <span style={labelStyle}>Inspection Findings</span>
              <div style={boxValueStyle}>{complaint.inspectionFindings || "—"}</div>
            </div>
            <div>
              <span style={labelStyle}>Root Cause Analysis (RCA)</span>
              <div style={boxValueStyle}>{complaint.rootCause || "—"}</div>
            </div>
          </div>
          
          <div style={fieldGridStyle(2)}>
            <div>
              <span style={labelStyle}>Responsible Dept</span>
              <span style={valueStyle}>{complaint.responsibleDepartment || "—"}</span>
            </div>
          </div>

          <div>
            <span style={labelStyle}>Additional RCA Notes</span>
            <div style={boxValueStyle}>{complaint.rcaNotes || "—"}</div>
          </div>
        </div>

        {/* Card: CAPA Actions */}
        <div style={cardStyle}>
          <h2 style={cardHeaderStyle}>⚙️ CAPA (Corrective & Preventive)</h2>
          
          <div style={fieldGridStyle(1)}>
            <div>
              <span style={labelStyle}>Immediate Action (Containment)</span>
              <div style={boxValueStyle}>{complaint.immediateAction || "—"}</div>
            </div>
            <div>
              <span style={labelStyle}>Corrective Action</span>
              <div style={boxValueStyle}>{complaint.correctiveAction || "—"}</div>
            </div>
            <div>
              <span style={labelStyle}>Preventive Action</span>
              <div style={boxValueStyle}>{complaint.preventiveAction || "—"}</div>
            </div>
          </div>

          <div style={fieldGridStyle(2)}>
            <div>
              <span style={labelStyle}>CAPA Owner</span>
              <span style={valueStyle}>{complaint.capaResponsiblePersonName || "—"}</span>
            </div>
            <div>
              <span style={labelStyle}>Target Completion</span>
              <span style={valueStyle}>
                {complaint.targetCompletionDate ? new Date(complaint.targetCompletionDate).toLocaleDateString() : "—"}
              </span>
            </div>
            <div>
              <span style={labelStyle}>Verification Status</span>
              <span style={valueStyle}>{complaint.verificationStatus || "—"}</span>
            </div>
          </div>
        </div>

        {/* Card: Resolution & Closure */}
        <div style={cardStyle}>
          <h2 style={cardHeaderStyle}>✅ Resolution & Closure</h2>
          
          <div style={fieldGridStyle(2)}>
            <div>
              <span style={labelStyle}>Resolution Type</span>
              <span style={valueStyle}>{complaint.resolutionType || "—"}</span>
            </div>
            <div>
              <span style={labelStyle}>Closure Date</span>
              <span style={valueStyle}>
                {complaint.closureDate ? new Date(complaint.closureDate).toLocaleDateString() : "—"}
              </span>
            </div>
            <div>
              <span style={labelStyle}>Cust. Confirmation</span>
              <span style={valueStyle}>
                {complaint.customerConfirmation ? <span style={{ color: "#059669", fontWeight: "bold" }}>✓ Received</span> : "—"}
              </span>
            </div>
            <div>
              <span style={labelStyle}>Satisfaction Rating</span>
              <div style={{ display: "flex", gap: "2px", fontSize: "20px" }}>
                {[1,2,3,4,5].map(star => (
                  <span key={star} style={{ color: (complaint.satisfactionRating || 0) >= star ? "#fbbf24" : "#e5e7eb" }}>
                    ★
                  </span>
                ))}
              </div>
            </div>
          </div>
          
          <div style={{ marginTop: "20px" }}>
            <span style={labelStyle}>Lessons Learned</span>
            <div style={boxValueStyle}>{complaint.lessonsLearned || "—"}</div>
          </div>
        </div>

      </div>
    </div>
  );
}
