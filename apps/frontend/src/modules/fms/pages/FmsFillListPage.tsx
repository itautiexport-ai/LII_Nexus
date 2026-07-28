import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { fmsApi, FmsManager } from "../api/fmsApi";
import "./Fms.css";

export function FmsFillListPage() {
  const navigate = useNavigate();
  const [fmsList, setFmsList] = useState<FmsManager[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fmsApi.getAll().then((managers) => {
      setFmsList(managers);
      setLoading(false);
    }).catch(err => {
      console.error(err);
      setLoading(false);
    });
  }, []);

  if (loading) return <div style={{ padding: "2rem", textAlign: "center" }}>Loading forms...</div>;

  return (
    <div className="fms-container">
      <div className="fms-card">
        <div className="fms-card-header">
          <h2 className="fms-title">List of Forms</h2>
        </div>
        <div className="fms-card-content" style={{ padding: "2rem" }}>
          {fmsList.length === 0 ? (
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
                    Click below to start a new instance for this form.
                  </p>
                  <button 
                    onClick={() => navigate(`/admin/fms/fill/${fms.id}`)}
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
                    Fill Form
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
