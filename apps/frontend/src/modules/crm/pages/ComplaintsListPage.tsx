import React, { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { complaintApi, Complaint, ComplaintStatus, ComplaintPriority } from "../api/complaintApi";
import { masterDataApi } from "../../admin/masterdata/api/masterDataApi";

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

const filterCardStyle: React.CSSProperties = {
  backgroundColor: "#ffffff",
  borderRadius: "16px",
  boxShadow: "0 4px 20px rgba(0,0,0,0.04)",
  border: "1px solid #f3f4f6",
  padding: "24px",
  marginBottom: "28px"
};

const filterGridStyle: React.CSSProperties = {
  display: "grid",
  gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))",
  gap: "16px"
};

const inputStyle: React.CSSProperties = {
  width: "100%",
  padding: "12px 16px",
  fontSize: "14px",
  fontWeight: 500,
  border: "1px solid #e5e7eb",
  borderRadius: "8px",
  boxSizing: "border-box",
  outline: "none",
  backgroundColor: "#f9fafb",
  color: "#374151",
  transition: "border-color 0.2s"
};

const tableContainerStyle: React.CSSProperties = {
  backgroundColor: "#ffffff",
  borderRadius: "16px",
  boxShadow: "0 4px 20px rgba(0,0,0,0.04)",
  border: "1px solid #f3f4f6",
  overflow: "hidden"
};

const tableStyle: React.CSSProperties = {
  width: "100%",
  borderCollapse: "collapse",
  textAlign: "left"
};

const thStyle: React.CSSProperties = {
  padding: "18px 24px",
  fontSize: "12px",
  fontWeight: 600,
  textTransform: "uppercase",
  color: "#6b7280",
  backgroundColor: "#f9fafb",
  borderBottom: "1px solid #f3f4f6",
  letterSpacing: "0.5px"
};

const tdStyle: React.CSSProperties = {
  padding: "18px 24px",
  fontSize: "14px",
  color: "#374151",
  borderBottom: "1px solid #f3f4f6",
  verticalAlign: "middle"
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

const getBadgeStyle = (bgColor: string, color: string): React.CSSProperties => ({
  display: "inline-flex",
  alignItems: "center",
  padding: "6px 12px",
  borderRadius: "9999px",
  fontSize: "12px",
  fontWeight: 600,
  backgroundColor: bgColor,
  color: color,
  whiteSpace: "nowrap"
});

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

export default function ComplaintsListPage() {
  const navigate = useNavigate();
  const [complaints, setComplaints] = useState<Complaint[]>([]);
  const [loading, setLoading] = useState(true);
  
  const [buyers, setBuyers] = useState<{ id: string; name: string }[]>([]);
  
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<ComplaintStatus | "">("");
  const [priorityFilter, setPriorityFilter] = useState<ComplaintPriority | "">("");
  const [buyerFilter, setBuyerFilter] = useState<string>("");

  useEffect(() => {
    fetchBuyers();
  }, []);

  useEffect(() => {
    fetchComplaints();
  }, [search, statusFilter, priorityFilter, buyerFilter]);

  const fetchBuyers = async () => {
    try {
      const data = await masterDataApi.getBuyers();
      setBuyers(data || []);
    } catch (e) {
      console.error("Failed to fetch buyers", e);
    }
  };

  const fetchComplaints = async () => {
    setLoading(true);
    try {
      const data = await complaintApi.list({
        search: search || undefined,
        status: statusFilter ? statusFilter : undefined,
        priority: priorityFilter ? priorityFilter : undefined,
        buyerId: buyerFilter ? buyerFilter : undefined,
      });
      setComplaints(data.items);
    } catch (error) {
      console.error("Failed to load complaints", error);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (window.confirm("Are you sure you want to delete this complaint?")) {
      try {
        await complaintApi.delete(id);
        fetchComplaints();
      } catch (error) {
        console.error("Failed to delete complaint", error);
      }
    }
  };

  return (
    <div style={containerStyle}>
      <div style={headerStyle}>
        <h1 style={titleStyle}>Customer Complaints (CQA)</h1>
      </div>

      <div style={filterCardStyle}>
        <div style={filterGridStyle}>
          <input
            type="text"
            style={inputStyle}
            placeholder="🔍 Search by title or ID..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
          <select
            style={inputStyle}
            value={buyerFilter}
            onChange={(e) => setBuyerFilter(e.target.value)}
          >
            <option value="">All Customers/Buyers</option>
            {buyers.map((b) => (
              <option key={b.id} value={b.id}>{b.name}</option>
            ))}
          </select>
          <select
            style={inputStyle}
            value={statusFilter}
            onChange={(e: any) => setStatusFilter(e.target.value as ComplaintStatus | "")}
          >
            <option value="">All Statuses</option>
            {Object.keys(statusColors).map(s => (
              <option key={s} value={s}>{s.replace(/_/g, " ").toUpperCase()}</option>
            ))}
          </select>
          <select
            style={inputStyle}
            value={priorityFilter}
            onChange={(e: any) => setPriorityFilter(e.target.value as ComplaintPriority | "")}
          >
            <option value="">All Priorities</option>
            <option value="low">Low</option>
            <option value="medium">Medium</option>
            <option value="high">High</option>
            <option value="critical">Critical</option>
          </select>
        </div>
      </div>

      <div style={tableContainerStyle}>
        <table style={tableStyle}>
          <thead>
            <tr>
              <th style={thStyle}>ID / Title</th>
              <th style={thStyle}>Customer</th>
              <th style={thStyle}>Priority</th>
              <th style={thStyle}>Status</th>
              <th style={thStyle}>Created On</th>
              <th style={{ ...thStyle, textAlign: "right" }}>Actions</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr>
                <td colSpan={6} style={{ ...tdStyle, textAlign: "center", color: "#6b7280", padding: "40px" }}>
                  <span style={{ fontSize: "16px" }}>Loading complaints...</span>
                </td>
              </tr>
            ) : complaints.length === 0 ? (
              <tr>
                <td colSpan={6} style={{ ...tdStyle, textAlign: "center", color: "#6b7280", padding: "40px" }}>
                  <span style={{ fontSize: "16px" }}>No complaints found matching your criteria.</span>
                </td>
              </tr>
            ) : (
              complaints.map((complaint) => (
                <tr 
                  key={complaint.id} 
                  style={{ transition: "all 0.2s" }} 
                  onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = "#f9fafb")} 
                  onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = "transparent")}
                >
                  <td style={tdStyle}>
                    <div style={{ fontWeight: 700, color: "#4f46e5", marginBottom: "6px", display: "flex", alignItems: "center", gap: "8px" }}>
                      {complaint.complaintNumber}
                      {complaint.repeatIssue && (
                        <span style={getBadgeStyle("#fee2e2", "#b91c1c")}>★ REPEAT</span>
                      )}
                    </div>
                    <div style={{ fontSize: "14px", color: "#4b5563", maxWidth: "300px", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                      {complaint.title}
                    </div>
                  </td>
                  <td style={{ ...tdStyle, fontWeight: 500, color: "#111827" }}>
                    {complaint.buyerName || "—"}
                  </td>
                  <td style={tdStyle}>
                    <span style={getBadgeStyle(priorityColors[complaint.priority]?.bg, priorityColors[complaint.priority]?.text)}>
                      {complaint.priority.toUpperCase()}
                    </span>
                  </td>
                  <td style={tdStyle}>
                    <span style={getBadgeStyle(statusColors[complaint.status]?.bg, statusColors[complaint.status]?.text)}>
                      {complaint.status.replace(/_/g, " ").toUpperCase()}
                    </span>
                  </td>
                  <td style={tdStyle}>
                    <span style={{ color: "#6b7280", fontWeight: 500 }}>
                      {new Date(complaint.createdAt).toLocaleDateString()}
                    </span>
                  </td>
                  <td style={{ ...tdStyle, textAlign: "right" }}>
                    <div style={{ display: "flex", gap: "16px", justifyContent: "flex-end", alignItems: "center" }}>
                      <Link to={`/admin/crm/complaints/${complaint.id}`} style={{ textDecoration: "none", color: "#4f46e5", fontSize: "14px", fontWeight: 600 }}>
                        View
                      </Link>
                      <Link to={`/admin/crm/complaints/new?edit=${complaint.id}`} style={{ textDecoration: "none", color: "#0ea5e9", fontSize: "14px", fontWeight: 600 }}>
                        Edit
                      </Link>
                      <button 
                        onClick={() => handleDelete(complaint.id)} 
                        style={{ background: "none", border: "none", color: "#ef4444", cursor: "pointer", fontSize: "14px", fontWeight: 600, padding: 0 }}
                      >
                        Delete
                      </button>
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
