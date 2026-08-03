import React from "react";
import { useNavigate } from "react-router-dom";

// --- Styles ---
const containerStyle: React.CSSProperties = {
  maxWidth: "1200px",
  margin: "40px auto",
  fontFamily: "'Inter', 'Roboto', sans-serif",
  color: "#111827",
  paddingBottom: "60px",
  padding: "0 20px"
};

const headerStyle: React.CSSProperties = {
  display: "flex",
  justifyContent: "space-between",
  alignItems: "center",
  marginBottom: "30px"
};

const titleStyle: React.CSSProperties = {
  fontSize: "28px",
  fontWeight: 700,
  color: "#111827",
  margin: 0
};

const emptyCardStyle: React.CSSProperties = {
  backgroundColor: "#ffffff",
  borderRadius: "16px",
  boxShadow: "0 4px 20px rgba(0,0,0,0.04)",
  border: "1px solid #f3f4f6",
  padding: "48px",
  textAlign: "center",
  color: "#6b7280"
};

const buttonStyle = (primary = false): React.CSSProperties => ({
  padding: "10px 20px",
  fontSize: "14px",
  fontWeight: 600,
  borderRadius: "8px",
  border: primary ? "none" : "1px solid #d1d5db",
  backgroundColor: primary ? "#4f46e5" : "#ffffff",
  color: primary ? "#ffffff" : "#374151",
  cursor: "pointer",
  transition: "all 0.2s ease",
  display: "inline-flex",
  alignItems: "center",
  gap: "8px",
  boxShadow: primary ? "0 4px 12px rgba(79, 70, 229, 0.3)" : "0 1px 2px rgba(0,0,0,0.02)",
});

export default function InvestigationListPage() {
  const navigate = useNavigate();

  return (
    <div style={containerStyle}>
      <div style={headerStyle}>
        <h1 style={titleStyle}>Investigation (CQA)</h1>
        <button 
          style={buttonStyle(true)} 
          onClick={() => navigate("/admin/crm/investigation/new")}
          onMouseEnter={(e) => (e.target as HTMLElement).style.backgroundColor = "#4338ca"}
          onMouseLeave={(e) => (e.target as HTMLElement).style.backgroundColor = "#4f46e5"}
        >
          ➕ New Investigation
        </button>
      </div>

      <div style={emptyCardStyle}>
        <h2 style={{ margin: "0 0 8px 0", color: "#374151" }}>Investigation Module</h2>
        <p style={{ margin: 0, fontSize: "15px" }}>Click "New Investigation" to start a new RCA.</p>
      </div>
    </div>
  );
}
