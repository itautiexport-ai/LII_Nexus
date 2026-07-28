import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { cartonOrderApi } from "../api/cartonOrderApi";
import { fmsApi } from "../../fms/api/fmsApi";
import { useAuthStore } from "../../auth/hooks/useAuthStore";

export default function BuyerCartonOrderFormPage() {
  const navigate = useNavigate();
  const user = useAuthStore((state: any) => state.user);
  const isSystemAdmin = user?.roles?.includes("System Admin");
  const backPath = "/admin/fms";
  const [loading, setLoading] = useState(false);

  const [formData, setFormData] = useState({
    erpOrderNumber: "",
    companyName: "LII",
    aliasName: "",
  });

  useEffect(() => {

  }, []);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setLoading(true);
      await cartonOrderApi.create(formData);
      
      try {
        const allFms = await fmsApi.getAll();
        const cartonFms = allFms.find(f => f.name && f.name.replace(/\s+/g, " ").trim().toLowerCase() === "buyer order to carton order");
        if (cartonFms) {
          await fmsApi.startInstance(cartonFms.id, formData.erpOrderNumber, formData);
          alert("Carton order created and FMS instance started successfully!");
          navigate("/admin/fms");
          return;
        }
      } catch (fmsErr) {
        console.error("Failed to start FMS instance:", fmsErr);
      }
      
      alert("Carton order created successfully!");
      navigate("/admin/fms");
    } catch (err) {
      console.error(err);
      alert("Failed to create carton order.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ padding: "2rem", maxWidth: "600px", margin: "0 auto" }}>
      <div style={{ background: "white", padding: "2rem", borderRadius: "8px", boxShadow: "0 4px 6px rgba(0,0,0,0.1)" }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "1.5rem" }}>
          <h2 style={{ margin: 0, color: "#333" }}>New Buyer Order to Carton Order</h2>
          <button 
            type="button"
            onClick={() => navigate(backPath)}
            className="fms-btn-primary"
            style={{ background: "#ffc107", color: "#333", border: "none", padding: "8px 16px", borderRadius: "6px", fontWeight: "bold", cursor: "pointer" }}
          >
            BACK TO FMS
          </button>
        </div>
        <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
          
          <div>
            <label style={{ display: "block", marginBottom: "0.5rem", fontWeight: "bold" }}>ERP Order Number <span style={{ color: "red" }}>*</span></label>
            <input
              type="text"
              name="erpOrderNumber"
              required
              value={formData.erpOrderNumber}
              onChange={handleChange}
              style={{ width: "100%", padding: "10px", borderRadius: "4px", border: "1px solid #ced4da" }}
              placeholder="Enter ERP Order Number"
            />
          </div>

          <div>
            <label style={{ display: "block", marginBottom: "0.5rem", fontWeight: "bold" }}>Company Name</label>
            <select
              name="companyName"
              value={formData.companyName}
              onChange={handleChange}
              style={{ width: "100%", padding: "10px", borderRadius: "4px", border: "1px solid #ced4da" }}
            >
              <option value="LII">LII</option>
              <option value="LIE">LIE</option>
            </select>
          </div>

          <div>
            <label style={{ display: "block", marginBottom: "0.5rem", fontWeight: "bold" }}>Alias Name</label>
            <input
              type="text"
              name="aliasName"
              value={formData.aliasName}
              onChange={handleChange}
              style={{ width: "100%", padding: "10px", borderRadius: "4px", border: "1px solid #ced4da" }}
              placeholder="Enter Alias Name (Optional)"
            />
          </div>

          <div style={{ marginTop: "1rem", display: "flex", gap: "10px", justifyContent: "flex-end" }}>
            <button
              type="button"
              onClick={() => navigate(backPath)}
              style={{ padding: "10px 20px", background: "#f8f9fa", color: "#333", border: "1px solid #ced4da", borderRadius: "4px", cursor: "pointer" }}
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              style={{ padding: "10px 20px", background: "#007bff", color: "white", border: "none", borderRadius: "4px", cursor: "pointer" }}
            >
              {loading ? "Saving..." : "Save Order"}
            </button>
          </div>

        </form>
      </div>
    </div>
  );
}
