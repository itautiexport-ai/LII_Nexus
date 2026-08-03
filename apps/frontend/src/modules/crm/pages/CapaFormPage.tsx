import React, { useState, useEffect } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { employeesApi } from "../../admin/organization/employees/api/employeesApi";

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

const sectionHeaderStyle: React.CSSProperties = {
  fontSize: "18px",
  fontWeight: 700,
  color: "#111827",
  marginBottom: "16px",
  paddingBottom: "8px",
  borderBottom: "2px solid #e5e7eb"
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

const checkboxContainerStyle: React.CSSProperties = {
  display: "flex",
  alignItems: "center",
  gap: "10px",
  padding: "12px",
  backgroundColor: "#f9fafb",
  border: "1px solid #d1d5db",
  borderRadius: "8px"
};

const checkboxStyle: React.CSSProperties = {
  width: "20px",
  height: "20px",
  cursor: "pointer"
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

export default function CapaFormPage() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const editId = searchParams.get("edit");
  const [loading, setLoading] = useState(false);
  const [employees, setEmployees] = useState<{ id: string; fullName: string }[]>([]);

  const [formData, setFormData] = useState({
    complaintId: "",
    // CAPA
    immediateAction: "",
    correctiveAction: "",
    preventiveAction: "",
    capaResponsiblePerson: "",
    targetCompletionDate: "",
    verificationStatus: "",
    // Resolution
    resolutionType: "",
    customerConfirmation: false,
    closureDate: "",
    satisfactionRating: 0,
    lessonsLearned: "",
    repeatIssue: false,
  });

  useEffect(() => {
    fetchOptions();
  }, []);

  const fetchOptions = async () => {
    try {
      const empData = await employeesApi.list();
      setEmployees(empData || []);
    } catch (e) {
      console.error("Failed to fetch employees", e);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    
    // Simulate API call
    setTimeout(() => {
      setLoading(false);
      navigate("/admin/crm/capa");
    }, 1000);
  };

  return (
    <div style={containerStyle}>
      <div style={headerStyle}>
        <h1 style={titleStyle}>
          {editId ? "Edit CAPA" : "New CAPA & Resolution"}
        </h1>
        <button style={buttonStyle()} onClick={() => navigate("/admin/crm/capa")}>
          Cancel
        </button>
      </div>

      <div style={cardStyle}>
        <form onSubmit={handleSubmit}>
          <div style={formSectionStyle}>
            
            <div>
              <label style={labelStyle}>Link to Complaint ID</label>
              <input
                type="text"
                required
                style={{...inputStyle, maxWidth: "400px"}}
                placeholder="e.g. CMP-202607-0006"
                value={formData.complaintId}
                onChange={(e) => setFormData({ ...formData, complaintId: e.target.value })}
              />
            </div>

            {/* --- CAPA SECTION --- */}
            <div style={{ marginTop: "16px" }}>
              <h3 style={sectionHeaderStyle}>CAPA Details</h3>
              <div style={{ display: "flex", flexDirection: "column", gap: "20px" }}>
                <div>
                  <label style={labelStyle}>Immediate Action (Containment)</label>
                  <textarea
                    style={{ ...inputStyle, minHeight: "80px", resize: "vertical" }}
                    rows={3}
                    value={formData.immediateAction}
                    onChange={(e) => setFormData({ ...formData, immediateAction: e.target.value })}
                  />
                </div>
                <div>
                  <label style={labelStyle}>Corrective Action</label>
                  <textarea
                    style={{ ...inputStyle, minHeight: "80px", resize: "vertical" }}
                    rows={3}
                    value={formData.correctiveAction}
                    onChange={(e) => setFormData({ ...formData, correctiveAction: e.target.value })}
                  />
                </div>
                <div>
                  <label style={labelStyle}>Preventive Action</label>
                  <textarea
                    style={{ ...inputStyle, minHeight: "80px", resize: "vertical" }}
                    rows={3}
                    value={formData.preventiveAction}
                    onChange={(e) => setFormData({ ...formData, preventiveAction: e.target.value })}
                  />
                </div>
                
                <div style={gridStyle}>
                  <div>
                    <label style={labelStyle}>Responsible Person</label>
                    <select
                      style={inputStyle}
                      value={formData.capaResponsiblePerson}
                      onChange={(e) => setFormData({ ...formData, capaResponsiblePerson: e.target.value })}
                    >
                      <option value="">-- Unassigned --</option>
                      {employees.map((emp) => (
                        <option key={emp.id} value={emp.id}>{emp.fullName}</option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label style={labelStyle}>Target Completion Date</label>
                    <input
                      type="date"
                      style={inputStyle}
                      value={formData.targetCompletionDate}
                      onChange={(e) => setFormData({ ...formData, targetCompletionDate: e.target.value })}
                    />
                  </div>
                  <div>
                    <label style={labelStyle}>Verification Status</label>
                    <input
                      type="text"
                      style={inputStyle}
                      placeholder="e.g. Pending, Verified, Failed"
                      value={formData.verificationStatus}
                      onChange={(e) => setFormData({ ...formData, verificationStatus: e.target.value })}
                    />
                  </div>
                </div>
              </div>
            </div>

            {/* --- RESOLUTION SECTION --- */}
            <div style={{ marginTop: "16px" }}>
              <h3 style={sectionHeaderStyle}>Resolution & Closure</h3>
              <div style={{ display: "flex", flexDirection: "column", gap: "20px" }}>
                
                <div style={gridStyle}>
                  <div>
                    <label style={labelStyle}>Resolution Type</label>
                    <select
                      style={inputStyle}
                      value={formData.resolutionType}
                      onChange={(e) => setFormData({ ...formData, resolutionType: e.target.value })}
                    >
                      <option value="">-- Select Type --</option>
                      <option value="Replacement">Replacement</option>
                      <option value="Repair">Repair</option>
                      <option value="Refund">Refund</option>
                      <option value="Discount">Discount</option>
                      <option value="Other">Other</option>
                    </select>
                  </div>
                  <div>
                    <label style={labelStyle}>Closure Date</label>
                    <input
                      type="date"
                      style={inputStyle}
                      value={formData.closureDate}
                      onChange={(e) => setFormData({ ...formData, closureDate: e.target.value })}
                    />
                  </div>
                  <div>
                    <label style={labelStyle}>Customer Satisfaction Rating (1-5)</label>
                    <input
                      type="number"
                      min="1" max="5"
                      style={inputStyle}
                      value={formData.satisfactionRating || ""}
                      onChange={(e) => setFormData({ ...formData, satisfactionRating: parseInt(e.target.value) || 0 })}
                    />
                  </div>
                </div>

                <div style={{ display: "flex", gap: "20px" }}>
                  <label style={checkboxContainerStyle}>
                    <input
                      type="checkbox"
                      style={checkboxStyle}
                      checked={formData.customerConfirmation}
                      onChange={(e) => setFormData({ ...formData, customerConfirmation: e.target.checked })}
                    />
                    <span style={{ fontSize: "15px", fontWeight: 500 }}>Customer Confirmation Received</span>
                  </label>
                  <label style={checkboxContainerStyle}>
                    <input
                      type="checkbox"
                      style={checkboxStyle}
                      checked={formData.repeatIssue}
                      onChange={(e) => setFormData({ ...formData, repeatIssue: e.target.checked })}
                    />
                    <span style={{ fontSize: "15px", fontWeight: 500 }}>Repeat Issue Indicator</span>
                  </label>
                </div>

                <div>
                  <label style={labelStyle}>Lessons Learned</label>
                  <textarea
                    style={{ ...inputStyle, minHeight: "80px", resize: "vertical" }}
                    rows={3}
                    value={formData.lessonsLearned}
                    onChange={(e) => setFormData({ ...formData, lessonsLearned: e.target.value })}
                  />
                </div>

              </div>
            </div>

          </div>

          <div style={{ padding: "24px 32px", borderTop: "1px solid #e1e4e8", display: "flex", justifyContent: "flex-end", backgroundColor: "#f9fafb" }}>
            <button type="submit" disabled={loading} style={{ ...buttonStyle(true), opacity: loading ? 0.7 : 1 }}>
              {loading ? "Saving..." : "Save CAPA"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
