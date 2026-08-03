import React, { useEffect, useState, useRef } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { complaintApi, Complaint, ComplaintPriority } from "../api/complaintApi";
import { axiosInstance } from "../../../services/api/axiosInstance";
import { masterDataApi } from "../../admin/masterdata/api/masterDataApi";

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

export default function ComplaintFormPage() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const editId = searchParams.get("edit");
  const [loading, setLoading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);
  
  const [buyers, setBuyers] = useState<{ id: string; name: string }[]>([]);

  const [formData, setFormData] = useState<Partial<Complaint>>({
    title: "",
    description: "",
    buyerId: "",
    priority: "medium",
    orderInvoiceNo: "",
    productSku: "",
    complaintCategory: "",
    attachments: [],
  });

  useEffect(() => {
    fetchOptions();
    if (editId) {
      fetchComplaint(editId);
    }
  }, [editId]);

  const fetchOptions = async () => {
    try {
      const buyersData = await masterDataApi.getBuyers();
      setBuyers(buyersData || []);
    } catch (e) {
      console.error("Failed to fetch options", e);
    }
  };

  const fetchComplaint = async (id: string) => {
    try {
      const data = await complaintApi.getById(id);
      setFormData({
        ...data,
        buyerId: data.buyerId || "",
        description: data.description || "",
        orderInvoiceNo: data.orderInvoiceNo || "",
        productSku: data.productSku || "",
        complaintCategory: data.complaintCategory || "",
        attachments: data.attachments || [],
      });
    } catch (e) {
      console.error("Failed to load complaint", e);
    }
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploading(true);
    const form = new FormData();
    form.append("file", file);
    try {
      const res = await axiosInstance.post("/upload", form, {
        headers: { "Content-Type": "multipart/form-data" },
      });
      const fileUrl = res.data.data.fileUrl;
      setFormData(prev => ({
        ...prev,
        attachments: [...(prev.attachments || []), fileUrl]
      }));
    } catch (error) {
      console.error("Upload failed", error);
      alert("Failed to upload file.");
    } finally {
      setUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  };

  const removeAttachment = (index: number) => {
    setFormData(prev => {
      const newAtt = [...(prev.attachments || [])];
      newAtt.splice(index, 1);
      return { ...prev, attachments: newAtt };
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      const payload = { ...formData };
      
      if (!payload.buyerId) payload.buyerId = null as any;
      if (!payload.status) payload.status = "new";

      if (editId) {
        await complaintApi.update(editId, payload);
      } else {
        await complaintApi.create(payload);
      }
      navigate("/admin/crm/complaints");
    } catch (error) {
      console.error("Failed to save complaint", error);
      alert("Failed to save complaint.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={containerStyle}>
      <div style={headerStyle}>
        <h1 style={titleStyle}>
          {editId ? "Edit Complaint" : "Register New Complaint"}
        </h1>
      </div>

      <div style={cardStyle}>
        <form onSubmit={handleSubmit}>
          <div style={formSectionStyle}>
            <div style={gridStyle}>
              <div>
                <label style={labelStyle}>Title</label>
                <input
                  type="text"
                  required
                  style={inputStyle}
                  value={formData.title}
                  onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                />
              </div>
              <div>
                <label style={labelStyle}>Category</label>
                <input
                  type="text"
                  style={inputStyle}
                  value={formData.complaintCategory || ""}
                  onChange={(e) => setFormData({ ...formData, complaintCategory: e.target.value })}
                  placeholder="e.g. Damage, Finish, Dimension"
                />
              </div>
              <div>
                <label style={labelStyle}>Customer / Buyer</label>
                <select
                  style={inputStyle}
                  value={formData.buyerId || ""}
                  onChange={(e) => setFormData({ ...formData, buyerId: e.target.value })}
                >
                  <option value="">-- Select Buyer --</option>
                  {buyers.map((b) => (
                    <option key={b.id} value={b.id}>{b.name}</option>
                  ))}
                </select>
              </div>
              <div>
                <label style={labelStyle}>Order / Invoice No.</label>
                <input
                  type="text"
                  style={inputStyle}
                  value={formData.orderInvoiceNo || ""}
                  onChange={(e) => setFormData({ ...formData, orderInvoiceNo: e.target.value })}
                />
              </div>
              <div>
                <label style={labelStyle}>Product / SKU</label>
                <input
                  type="text"
                  style={inputStyle}
                  value={formData.productSku || ""}
                  onChange={(e) => setFormData({ ...formData, productSku: e.target.value })}
                />
              </div>
              <div>
                <label style={labelStyle}>Priority</label>
                <select
                  style={inputStyle}
                  value={formData.priority}
                  onChange={(e) => setFormData({ ...formData, priority: e.target.value as ComplaintPriority })}
                >
                  <option value="low">Low</option>
                  <option value="medium">Medium</option>
                  <option value="high">High</option>
                  <option value="critical">Critical</option>
                </select>
              </div>
            </div>
            
            <div>
              <label style={labelStyle}>Description</label>
              <textarea
                style={{ ...inputStyle, resize: "vertical", minHeight: "100px" }}
                rows={4}
                value={formData.description || ""}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              />
            </div>
            
            <div>
              <label style={labelStyle}>Attachments (Photos/Videos)</label>
              <input 
                type="file" 
                ref={fileInputRef} 
                onChange={handleFileUpload}
                style={inputStyle} 
              />
              {uploading && <p style={{ color: "#4f46e5", fontSize: "14px", marginTop: "8px" }}>Uploading...</p>}
              
              {formData.attachments && formData.attachments.length > 0 && (
                <ul style={{ marginTop: "16px", padding: 0, listStyle: "none", display: "flex", flexDirection: "column", gap: "8px" }}>
                  {formData.attachments.map((att, i) => (
                    <li key={i} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", backgroundColor: "#f3f4f6", padding: "12px", borderRadius: "8px", border: "1px solid #e5e7eb" }}>
                      <a href={att} target="_blank" rel="noreferrer" style={{ color: "#4f46e5", textDecoration: "none", fontSize: "14px", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis", maxWidth: "80%" }}>{att.split('/').pop()}</a>
                      <button type="button" onClick={() => removeAttachment(i)} style={{ color: "#ef4444", background: "none", border: "none", cursor: "pointer", fontSize: "14px", fontWeight: 600 }}>Remove</button>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          </div>

          <div style={{ padding: "24px 32px", borderTop: "1px solid #e1e4e8", display: "flex", justifyContent: "flex-end", backgroundColor: "#f9fafb" }}>
            <button type="submit" disabled={loading} style={{ ...buttonStyle(true), opacity: loading ? 0.7 : 1 }}>
              {loading ? "Saving..." : "Save Complaint"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
