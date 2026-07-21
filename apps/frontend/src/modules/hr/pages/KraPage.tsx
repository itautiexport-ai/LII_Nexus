import React, { useEffect, useState, useMemo } from "react";
import { departmentsApi, DepartmentRecord } from "../../admin/organization/departments/api/departmentsApi";
import { designationsApi, DesignationRecord } from "../../admin/organization/designations/api/designationsApi";
import { kraApi, KraRecord } from "../api/kraApi";

export default function KraPage() {
  const [activeTab, setActiveTab] = useState<"list" | "add">("list");
  
  const [departments, setDepartments] = useState<DepartmentRecord[]>([]);
  const [designations, setDesignations] = useState<DesignationRecord[]>([]);
  const [kras, setKras] = useState<KraRecord[]>([]);
  
  // Form State
  const [departmentId, setDepartmentId] = useState("");
  const [designationId, setDesignationId] = useState("");
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [file, setFile] = useState<File | null>(null);
  const [loading, setLoading] = useState(false);

  // Filter State
  const [filterDeptId, setFilterDeptId] = useState("");
  const [filterDesigId, setFilterDesigId] = useState("");

  useEffect(() => {
    loadDepartments();
    loadDesignations();
    loadKras();
  }, []);

  async function loadDepartments() {
    try {
      const data = await departmentsApi.list();
      setDepartments(data);
    } catch (err) {
      console.error("Failed to load departments", err);
    }
  }

  async function loadDesignations() {
    try {
      const data = await designationsApi.list();
      setDesignations(data);
    } catch (err) {
      console.error("Failed to load designations", err);
    }
  }

  async function loadKras() {
    try {
      const data = await kraApi.getAll();
      setKras(data);
    } catch (err) {
      console.error("Failed to load KRAs", err);
    }
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!departmentId || !title) return;

    setLoading(true);
    try {
      let attachmentUrl = "";
      if (file) {
        const formData = new FormData();
        formData.append("file", file);
        const { axiosInstance } = await import("../../../services/api/axiosInstance");
        const uploadRes = await axiosInstance.post("/upload", formData, {
          headers: { "Content-Type": "multipart/form-data" }
        });
        attachmentUrl = uploadRes.data.data.fileUrl;
      }

      await kraApi.create({ departmentId, designationId, title, description, attachmentUrl });
      
      // Reset form
      setDepartmentId("");
      setDesignationId("");
      setTitle("");
      setDescription("");
      setFile(null);
      
      await loadKras();
      setActiveTab("list");
    } catch (err) {
      console.error("Failed to create KRA", err);
      alert("Failed to create KRA");
    } finally {
      setLoading(false);
    }
  }

  async function handleDelete(id: string) {
    if (!window.confirm("Delete this KRA?")) return;
    try {
      await kraApi.delete(id);
      await loadKras();
    } catch (err) {
      alert("Failed to delete KRA");
    }
  }

  const filteredKras = useMemo(() => {
    return kras.filter(k => {
      if (filterDeptId && k.department_id !== filterDeptId) return false;
      if (filterDesigId && k.designation_id !== filterDesigId) return false;
      return true;
    });
  }, [kras, filterDeptId, filterDesigId]);

  return (
    <div className="page-container">
      <div className="page-header">
        <h1 className="page-title">Key Result Areas (KRA)</h1>
        <p className="page-subtitle">Manage KRAs according to departments and designations.</p>
      </div>

      <div style={{ display: "flex", gap: "16px", marginBottom: "24px", borderBottom: "1px solid #e2e8f0" }}>
        <button 
          onClick={() => setActiveTab("list")}
          style={{ 
            padding: "12px 24px", 
            background: "transparent", 
            border: "none", 
            borderBottom: activeTab === "list" ? "2px solid #2563eb" : "2px solid transparent",
            color: activeTab === "list" ? "#2563eb" : "#64748b",
            fontWeight: activeTab === "list" ? 600 : 500,
            cursor: "pointer",
            fontSize: "15px"
          }}
        >
          KRA List
        </button>
        <button 
          onClick={() => setActiveTab("add")}
          style={{ 
            padding: "12px 24px", 
            background: "transparent", 
            border: "none", 
            borderBottom: activeTab === "add" ? "2px solid #2563eb" : "2px solid transparent",
            color: activeTab === "add" ? "#2563eb" : "#64748b",
            fontWeight: activeTab === "add" ? 600 : 500,
            cursor: "pointer",
            fontSize: "15px"
          }}
        >
          Add New KRA
        </button>
      </div>
      
      {activeTab === "add" && (
        <div style={{ maxWidth: "600px", background: "#fff", padding: "24px", borderRadius: "12px", border: "1px solid #e2e8f0" }}>
          <h2 style={{ fontSize: "18px", fontWeight: "600", color: "#1e293b", marginBottom: "16px" }}>Create Key Result Area</h2>
          <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
            
            <div className="form-group">
              <label>Department <span style={{color: "red"}}>*</span></label>
              <select className="form-control" value={departmentId} onChange={(e) => setDepartmentId(e.target.value)} required>
                <option value="">Select Department...</option>
                {departments.map(d => (
                  <option key={d.id} value={d.id}>{d.name}</option>
                ))}
              </select>
            </div>

            <div className="form-group">
              <label>Designation (Optional)</label>
              <select className="form-control" value={designationId} onChange={(e) => setDesignationId(e.target.value)}>
                <option value="">Applies to all designations...</option>
                {designations.map(d => (
                  <option key={d.id} value={d.id}>{d.title}</option>
                ))}
              </select>
            </div>

            <div className="form-group">
              <label>KRA Title <span style={{color: "red"}}>*</span></label>
              <input 
                type="text" 
                className="form-control" 
                value={title} 
                onChange={(e) => setTitle(e.target.value)} 
                required 
                placeholder="e.g. Ensure 99% production quality"
              />
            </div>

            <div className="form-group">
              <label>Description (Optional)</label>
              <textarea 
                className="form-control" 
                rows={4} 
                value={description} 
                onChange={(e) => setDescription(e.target.value)} 
                placeholder="Additional details..."
              />
            </div>

            <div className="form-group">
              <label>Attachment (Optional)</label>
              <input 
                type="file" 
                className="form-control" 
                onChange={(e) => setFile(e.target.files ? e.target.files[0] : null)} 
              />
            </div>

            <button type="submit" className="btn btn-primary" disabled={loading} style={{ marginTop: "8px" }}>
              {loading ? "Saving..." : "Add KRA"}
            </button>
          </form>
        </div>
      )}

      {activeTab === "list" && (
        <div style={{ display: "flex", flexDirection: "column", gap: "24px" }}>
          
          <div style={{ display: "flex", gap: "16px", background: "#f8fafc", padding: "16px", borderRadius: "8px", border: "1px solid #e2e8f0" }}>
            <div style={{ flex: 1 }}>
              <label style={{ display: "block", fontSize: "13px", fontWeight: 600, color: "#64748b", marginBottom: "6px" }}>Filter by Department</label>
              <select className="form-control" value={filterDeptId} onChange={e => setFilterDeptId(e.target.value)}>
                <option value="">All Departments</option>
                {departments.map(d => (
                  <option key={d.id} value={d.id}>{d.name}</option>
                ))}
              </select>
            </div>
            <div style={{ flex: 1 }}>
              <label style={{ display: "block", fontSize: "13px", fontWeight: 600, color: "#64748b", marginBottom: "6px" }}>Filter by Designation</label>
              <select className="form-control" value={filterDesigId} onChange={e => setFilterDesigId(e.target.value)}>
                <option value="">All Designations</option>
                {designations.map(d => (
                  <option key={d.id} value={d.id}>{d.title}</option>
                ))}
              </select>
            </div>
          </div>

          <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
            {filteredKras.length === 0 ? (
              <div style={{ textAlign: "center", padding: "40px", background: "#fff", borderRadius: "12px", border: "1px dashed #cbd5e1" }}>
                <p style={{ color: "#94a3b8" }}>No KRAs match your filters.</p>
              </div>
            ) : (
              filteredKras.map(kra => {
                const dept = departments.find(d => d.id === kra.department_id);
                const desig = designations.find(d => d.id === kra.designation_id);
                
                return (
                  <div key={kra.id} style={{ padding: "20px", background: "#fff", borderRadius: "8px", border: "1px solid #e2e8f0", display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
                    <div>
                      <div style={{ display: "flex", gap: "8px", marginBottom: "8px" }}>
                        <span style={{ fontSize: "12px", background: "#e0e7ff", color: "#4338ca", padding: "2px 8px", borderRadius: "12px", fontWeight: 500 }}>
                          {dept?.name || "Unknown Dept"}
                        </span>
                        {desig && (
                          <span style={{ fontSize: "12px", background: "#fef3c7", color: "#b45309", padding: "2px 8px", borderRadius: "12px", fontWeight: 500 }}>
                            {desig.title}
                          </span>
                        )}
                      </div>
                      <h4 style={{ margin: "0 0 6px 0", fontSize: "16px", fontWeight: "600", color: "#1e293b" }}>{kra.title}</h4>
                      {kra.description && <p style={{ margin: "0 0 10px 0", fontSize: "14px", color: "#64748b" }}>{kra.description}</p>}
                      {kra.attachment_url && (
                        <a href={kra.attachment_url} target="_blank" rel="noopener noreferrer" style={{ display: "inline-block", fontSize: "14px", color: "#3b82f6", textDecoration: "none", fontWeight: 500 }}>
                          📎 View Attachment
                        </a>
                      )}
                    </div>
                    <button 
                      onClick={() => handleDelete(kra.id)}
                      style={{ background: "none", border: "none", color: "#ef4444", cursor: "pointer", padding: "8px" }}
                      title="Delete KRA"
                    >
                      🗑️
                    </button>
                  </div>
                );
              })
            )}
          </div>
        </div>
      )}
    </div>
  );
}
