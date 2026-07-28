import React, { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { fmsApi, FmsManager } from "../api/fmsApi";
import BuyerCartonOrderFormPage from "../../ordermanagement/pages/BuyerCartonOrderFormPage";
import { GenericFmsForm } from "./FmsFormsHubPage"; // Wait, I need to export GenericFmsForm from FmsFormsHubPage
import { useAuthStore } from "../../auth/hooks/useAuthStore";
import "./Fms.css";

export function FmsFillPage() {
  const { fmsId } = useParams();
  const navigate = useNavigate();
  const [fms, setFms] = useState<FmsManager | null>(null);
  const [loading, setLoading] = useState(true);
  const user = useAuthStore((state: any) => state.user);
  const isSystemAdmin = user?.roles?.includes("System Admin");

  useEffect(() => {
    if (!fmsId) return;
    fmsApi.getAll().then(managers => {
      const active = managers.find(m => m.id === fmsId);
      setFms(active || null);
      setLoading(false);
    });
  }, [fmsId]);

  if (loading) return <div style={{ padding: "2rem", textAlign: "center" }}>Loading form...</div>;
  if (!fms) return <div style={{ padding: "2rem", textAlign: "center" }}>Form not found.</div>;

  const isCartonOrder = fms.name && fms.name.replace(/\s+/g, " ").trim().toLowerCase() === "buyer order to carton order";

  // Both admin and regular users go back to FMS main page
  const backPath = "/admin/fms";
  const backLabel = "BACK TO FMS";

  return (
    <div className="fms-container" style={{ padding: "20px" }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "20px" }}>
        <h2 style={{ margin: 0 }}>Fill Form: {fms.name}</h2>
        <button 
          onClick={() => navigate(backPath)}
          className="fms-btn-primary"
          style={{ background: "#ffc107", color: "#333", border: "none", padding: "8px 16px", borderRadius: "6px", fontWeight: "bold", cursor: "pointer" }}
        >
          {backLabel}
        </button>
      </div>
      
      <div style={{ background: "#fff", borderRadius: "8px", boxShadow: "0 2px 4px rgba(0,0,0,0.1)", overflow: "auto" }}>
        {isCartonOrder ? (
          <div style={{ padding: "20px" }}>
            <BuyerCartonOrderFormPage />
          </div>
        ) : (
          <GenericFmsForm fms={fms} />
        )}
      </div>
    </div>
  );
}
