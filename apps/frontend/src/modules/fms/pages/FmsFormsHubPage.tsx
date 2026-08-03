import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import BuyerCartonOrderFormPage from "../../ordermanagement/pages/BuyerCartonOrderFormPage";
import { fmsApi, FmsManager, CreateFmsManagerDto } from "../api/fmsApi";
import { FmsFormBuilder } from "../components/FmsFormBuilder";
import { useAuthStore } from "../../auth/hooks/useAuthStore";
import "./Fms.css";

export function GenericFmsForm({ fms }: { fms: FmsManager }) {
  const [reference, setReference] = useState("");
  const [formData, setFormData] = useState<any>({});
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!reference) return;
    try {
      setLoading(true);
      await fmsApi.startInstance(fms.id, reference, formData);
      alert(`FMS Instance started successfully for ${fms.name}!`);
      navigate(`/admin/fms/${fms.id}/grid`);
    } catch (err) {
      console.error(err);
      alert("Failed to start FMS instance");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ padding: "20px" }}>
      <div style={{ padding: "2rem", maxWidth: "600px", margin: "0 auto", background: "white", borderRadius: "8px", boxShadow: "0 4px 6px rgba(0,0,0,0.1)" }}>
        <h2 style={{ marginBottom: "1.5rem", color: "#333" }}>{fms.name} Form</h2>
        <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
          <div>
            <label style={{ display: "block", marginBottom: "0.5rem", fontWeight: "bold" }}>Reference / Order ID <span style={{ color: "red" }}>*</span></label>
            <input
              type="text"
              required
              value={reference}
              onChange={(e) => setReference(e.target.value)}
              style={{ width: "100%", padding: "10px", borderRadius: "4px", border: "1px solid #ced4da" }}
              placeholder="Enter Reference or Order ID"
            />
          </div>
          
          {fms.formFields && fms.formFields.map((field, index) => (
            <div key={index}>
              <label style={{ display: "block", marginBottom: "0.5rem", fontWeight: "bold" }}>
                {field.label} {field.required && <span style={{ color: "red" }}>*</span>}
              </label>
              {field.type === "boolean" ? (
                <input
                  type="checkbox"
                  required={field.required}
                  checked={formData[field.name] || false}
                  onChange={(e) => setFormData({ ...formData, [field.name]: e.target.checked })}
                />
              ) : (
                <input
                  type={field.type === "date" ? "date" : field.type === "number" ? "number" : "text"}
                  required={field.required}
                  value={formData[field.name] || ""}
                  onChange={(e) => setFormData({ ...formData, [field.name]: e.target.value })}
                  style={{ width: "100%", padding: "10px", borderRadius: "4px", border: "1px solid #ced4da" }}
                />
              )}
            </div>
          ))}

          <div style={{ marginTop: "1rem", display: "flex", gap: "10px", justifyContent: "flex-end" }}>
            <button
              type="submit"
              disabled={loading}
              style={{ padding: "10px 20px", background: "#007bff", color: "white", border: "none", borderRadius: "4px", cursor: "pointer" }}
            >
              {loading ? "Starting..." : "Start FMS"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

export function FmsFormsHubPage() {
  const navigate = useNavigate();
  const [fmsList, setFmsList] = useState<FmsManager[]>([]);
  const [activeTabId, setActiveTabId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [isEditing, setIsEditing] = useState(false);
  const [isAdding, setIsAdding] = useState(false);
  const user = useAuthStore((state: any) => state.user);
  const isSystemAdmin = user?.roles?.includes("System Admin");

  const fetchFmsList = async () => {
    const managers = await fmsApi.getAll();
    setFmsList(managers);
    return managers;
  };

  useEffect(() => {
    fetchFmsList().then(managers => {
      setLoading(false);
    });
  }, []);

  const handleSaveForm = async (data: CreateFmsManagerDto) => {
    if (isAdding) {
      await fmsApi.create(data);
    } else if (activeTabId) {
      await fmsApi.update(activeTabId, data);
    }
    await fetchFmsList();
    setIsEditing(false);
    setIsAdding(false);
    if (isAdding) setActiveTabId(null);
  };

  if (isAdding) {
    return (
      <div className="fms-container" style={{ padding: "20px" }}>
        <button onClick={() => setIsAdding(false)} style={{ marginBottom: "20px", padding: "8px 16px", background: "#6c757d", color: "white", border: "none", borderRadius: "4px", cursor: "pointer" }}>← Back to List</button>
        <FmsFormBuilder onSave={handleSaveForm} onCancel={() => setIsAdding(false)} />
      </div>
    );
  }

  if (activeTabId) {
    const activeFms = fmsList.find(f => f.id === activeTabId);
    if (!activeFms) return null;

    if (isEditing) {
      return (
        <div className="fms-container" style={{ padding: "20px" }}>
          <button onClick={() => setIsEditing(false)} style={{ marginBottom: "20px", padding: "8px 16px", background: "#6c757d", color: "white", border: "none", borderRadius: "4px", cursor: "pointer" }}>← Back to Form</button>
          <FmsFormBuilder initialData={activeFms} onSave={handleSaveForm} onCancel={() => setIsEditing(false)} />
        </div>
      );
    }

    return (
      <div className="fms-container" style={{ padding: "20px" }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "20px" }}>
          <h2 style={{ margin: 0 }}>Fill Form: {activeFms.name}</h2>
          <div style={{ display: "flex", gap: "10px" }}>
            {isSystemAdmin && (
              <button 
                onClick={() => setIsEditing(true)}
                style={{ padding: "8px 16px", background: "#ffc107", border: "none", borderRadius: "4px", cursor: "pointer", fontWeight: "bold" }}
              >
                ✏️ Edit Form Definition
              </button>
            )}
            <button 
              onClick={() => setActiveTabId(null)}
              style={{ padding: "8px 16px", background: "#6c757d", color: "white", border: "none", borderRadius: "4px", cursor: "pointer" }}
            >
              Back to List
            </button>
          </div>
        </div>
        <div style={{ background: "#fff", borderRadius: "8px", boxShadow: "0 2px 4px rgba(0,0,0,0.1)", overflow: "auto" }}>
          {activeFms.name && activeFms.name.replace(/\s+/g, " ").trim().toLowerCase() === "buyer order to carton order" ? (
            <div style={{ padding: "20px" }}>
              <BuyerCartonOrderFormPage />
            </div>
          ) : (
            <GenericFmsForm fms={activeFms} />
          )}
        </div>
      </div>
    );
  }

  return (
    <div className="fms-container" style={{ padding: "20px" }}>
      <div className="fms-card">
        <div className="fms-card-header" style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "16px 20px" }}>
          <h2 className="fms-title" style={{ margin: 0 }}>List of Forms</h2>
          <div style={{ display: "flex", gap: "10px" }}>
            {isSystemAdmin && (
              <button
                onClick={() => setIsAdding(true)}
                style={{ padding: "8px 16px", background: "#28a745", color: "white", border: "none", borderRadius: "4px", cursor: "pointer", fontWeight: "bold" }}
              >
                + Add New Form
              </button>
            )}
          </div>
        </div>
        <div className="fms-card-content" style={{ padding: "2rem" }}>
          {loading ? (
             <div className="fms-empty">Loading forms...</div>
          ) : fmsList.length === 0 ? (
            <div className="fms-empty">No forms available to fill.</div>
          ) : (
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(300px, 1fr))", gap: "20px" }}>
              {fmsList.map(fms => (
                <div 
                  key={fms.id} 
                  style={{ 
                    border: "1px solid #dee2e6", 
                    borderRadius: "8px", 
                    padding: "20px",
                    background: "white",
                    boxShadow: "0 2px 4px rgba(0,0,0,0.05)",
                    display: "flex",
                    flexDirection: "column",
                    gap: "10px"
                  }}
                >
                  <h3 style={{ margin: 0, fontSize: "1.1rem", color: "#343a40" }}>{fms.name}</h3>
                  <p style={{ margin: 0, fontSize: "0.9rem", color: "#6c757d", flex: 1 }}>
                    Click below to view or fill this form.
                  </p>
                  <button 
                    onClick={() => setActiveTabId(fms.id)}
                    style={{ 
                      padding: "8px 16px", 
                      background: "#3457d5", 
                      color: "white", 
                      border: "none", 
                      borderRadius: "4px",
                      cursor: "pointer",
                      fontWeight: "bold",
                      marginTop: "10px"
                    }}
                  >
                    View Form
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
