import React, { useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";

// --- Styles ---
const containerStyle: React.CSSProperties = {
  maxWidth: "900px",
  margin: "40px auto",
  fontFamily: "'Inter', 'Roboto', sans-serif",
  color: "#333",
  paddingBottom: "60px"
};

const headerStyle: React.CSSProperties = {
  display: "flex",
  justifyContent: "space-between",
  alignItems: "center",
  marginBottom: "24px"
};

const titleStyle: React.CSSProperties = {
  fontSize: "28px",
  fontWeight: 700,
  color: "#1a1a2e",
  margin: 0
};

const cardStyle: React.CSSProperties = {
  backgroundColor: "#ffffff",
  borderRadius: "16px",
  boxShadow: "0 10px 30px rgba(0,0,0,0.05)",
  border: "1px solid #e1e4e8",
  overflow: "hidden"
};

const formSectionStyle: React.CSSProperties = {
  padding: "32px",
  display: "flex",
  flexDirection: "column",
  gap: "24px"
};

const gridStyle: React.CSSProperties = {
  display: "grid",
  gridTemplateColumns: "1fr 1fr",
  gap: "20px"
};

const labelStyle: React.CSSProperties = {
  display: "block",
  fontSize: "14px",
  fontWeight: 600,
  color: "#4b5563",
  marginBottom: "8px"
};

const inputStyle: React.CSSProperties = {
  width: "100%",
  padding: "12px 16px",
  fontSize: "15px",
  border: "1px solid #d1d5db",
  borderRadius: "8px",
  boxSizing: "border-box",
  transition: "border-color 0.2s ease, box-shadow 0.2s ease",
  outline: "none",
  backgroundColor: "#f9fafb"
};

const buttonStyle = (primary = false): React.CSSProperties => ({
  padding: "12px 24px",
  fontSize: "15px",
  fontWeight: 600,
  borderRadius: "8px",
  border: primary ? "none" : "1px solid #d1d5db",
  backgroundColor: primary ? "#4f46e5" : "#ffffff",
  color: primary ? "#ffffff" : "#374151",
  cursor: "pointer",
  transition: "all 0.2s ease",
  boxShadow: primary ? "0 4px 12px rgba(79, 70, 229, 0.3)" : "0 2px 4px rgba(0,0,0,0.02)",
});

export default function InvestigationFormPage() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const editId = searchParams.get("edit");
  const [loading, setLoading] = useState(false);

  const [formData, setFormData] = useState({
    complaintId: "",
    inspectionFindings: "",
    rootCause: "",
    responsibleDepartment: "",
    rcaNotes: "",
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    
    // Simulate API call
    setTimeout(() => {
      setLoading(false);
      navigate("/admin/crm/investigation");
    }, 1000);
  };

  return (
    <div style={containerStyle}>
      <div style={headerStyle}>
        <h1 style={titleStyle}>
          {editId ? "Edit Investigation" : "New Investigation & RCA"}
        </h1>
        <button style={buttonStyle()} onClick={() => navigate("/admin/crm/investigation")}>
          Cancel
        </button>
      </div>

      <div style={cardStyle}>
        <form onSubmit={handleSubmit}>
          <div style={formSectionStyle}>
            
            <div style={gridStyle}>
              <div>
                <label style={labelStyle}>Link to Complaint ID</label>
                <input
                  type="text"
                  required
                  style={inputStyle}
                  placeholder="e.g. CMP-202607-0006"
                  value={formData.complaintId}
                  onChange={(e) => setFormData({ ...formData, complaintId: e.target.value })}
                />
              </div>
              <div>
                <label style={labelStyle}>Responsible Department</label>
                <input
                  type="text"
                  style={inputStyle}
                  value={formData.responsibleDepartment}
                  onChange={(e) => setFormData({ ...formData, responsibleDepartment: e.target.value })}
                  placeholder="e.g. Production, Packaging"
                />
              </div>
            </div>

            <div>
              <label style={labelStyle}>Inspection Findings</label>
              <textarea
                style={{ ...inputStyle, minHeight: "100px", resize: "vertical" }}
                rows={4}
                value={formData.inspectionFindings}
                onChange={(e) => setFormData({ ...formData, inspectionFindings: e.target.value })}
              />
            </div>

            <div>
              <label style={labelStyle}>Root Cause</label>
              <textarea
                style={{ ...inputStyle, minHeight: "100px", resize: "vertical" }}
                rows={4}
                value={formData.rootCause}
                onChange={(e) => setFormData({ ...formData, rootCause: e.target.value })}
              />
            </div>

            <div>
              <label style={labelStyle}>Additional RCA Notes</label>
              <textarea
                style={{ ...inputStyle, minHeight: "100px", resize: "vertical" }}
                rows={4}
                value={formData.rcaNotes}
                onChange={(e) => setFormData({ ...formData, rcaNotes: e.target.value })}
              />
            </div>
          </div>

          <div style={{ padding: "24px 32px", borderTop: "1px solid #e1e4e8", display: "flex", justifyContent: "flex-end", backgroundColor: "#f9fafb" }}>
            <button type="submit" disabled={loading} style={{ ...buttonStyle(true), opacity: loading ? 0.7 : 1 }}>
              {loading ? "Saving..." : "Save Investigation"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
