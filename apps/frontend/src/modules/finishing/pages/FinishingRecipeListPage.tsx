import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { finishingRecipeApi, FinishingRecipeRecord } from "../api/finishingRecipeApi";

export default function FinishingRecipeListPage() {
  const navigate = useNavigate();
  const [recipes, setRecipes] = useState<FinishingRecipeRecord[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Detail Modal State
  const [selectedRecipe, setSelectedRecipe] = useState<FinishingRecipeRecord | null>(null);
  const [detailsLoading, setDetailsLoading] = useState(false);

  useEffect(() => {
    fetchRecipes();
  }, []);

  const fetchRecipes = async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await finishingRecipeApi.getAll();
      setRecipes(data || []);
    } catch (err: any) {
      console.error(err);
      setError("Failed to load finishing recipes.");
    } finally {
      setLoading(false);
    }
  };

  const handleViewDetails = async (id: string) => {
    setDetailsLoading(true);
    try {
      const fullRecipe = await finishingRecipeApi.getById(id);
      setSelectedRecipe(fullRecipe);
    } catch (err: any) {
      alert("Failed to load recipe details: " + (err.message || "Error"));
    } finally {
      setDetailsLoading(false);
    }
  };

  return (
    <div style={{ background: "#f8fafc", minHeight: "100vh", padding: "24px" }}>
      {/* Header */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "20px" }}>
        <div>
          <h1 style={{ fontSize: "22px", fontWeight: "700", color: "#0f172a", margin: "0 0 4px 0" }}>
            Finishing Recipe List
          </h1>
          <p style={{ fontSize: "14px", color: "#64748b", margin: 0 }}>
            Browse and view comprehensive finishing recipes and process specifications.
          </p>
        </div>
        <button
          onClick={fetchRecipes}
          style={{
            padding: "8px 16px",
            background: "#ffffff",
            border: "1px solid #cbd5e1",
            borderRadius: "6px",
            fontSize: "13px",
            fontWeight: "600",
            color: "#334155",
            cursor: "pointer",
          }}
        >
          🔄 Refresh List
        </button>
      </div>

      {/* Main Table Card */}
      <div
        style={{
          background: "#ffffff",
          borderRadius: "10px",
          padding: "20px",
          border: "1px solid #e2e8f0",
          boxShadow: "0 1px 3px rgba(0,0,0,0.05)",
        }}
      >
        {error && (
          <div style={{ padding: "12px 16px", background: "#fef2f2", color: "#991b1b", borderRadius: "6px", marginBottom: "16px", fontSize: "13px" }}>
            {error}
          </div>
        )}

        {loading ? (
          <p style={{ color: "#64748b", fontSize: "14px", padding: "16px 0" }}>Loading recipes...</p>
        ) : (
          <div style={{ overflowX: "auto" }}>
            <table style={{ width: "100%", borderCollapse: "collapse", textAlign: "left" }}>
              <thead>
                <tr style={{ borderBottom: "2px solid #cbd5e1", background: "#f8fafc" }}>
                  <th style={{ padding: "12px", fontSize: "13px", color: "#475569", fontWeight: "600" }}>Finish Code / Name</th>
                  <th style={{ padding: "12px", fontSize: "13px", color: "#475569", fontWeight: "600" }}>Filled By (User)</th>
                  <th style={{ padding: "12px", fontSize: "13px", color: "#475569", fontWeight: "600" }}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {recipes.length === 0 ? (
                  <tr>
                    <td colSpan={3} style={{ padding: "28px", fontStyle: "italic", textAlign: "center", color: "#94a3b8", fontSize: "14px" }}>
                      No recipes submitted yet.
                    </td>
                  </tr>
                ) : (
                  recipes.map((r) => (
                    <tr key={r.id} style={{ borderBottom: "1px solid #f1f5f9" }}>
                      <td style={{ padding: "10px 12px", fontWeight: "600", fontSize: "14px", color: "#0f172a" }}>
                        {r.finish_code}
                      </td>
                      <td style={{ padding: "10px 12px", fontSize: "14px", color: "#334155" }}>
                        {r.user_name || "Unknown"}
                      </td>
                      <td style={{ padding: "10px 12px" }}>
                        <button
                          onClick={() => handleViewDetails(r.id)}
                          disabled={detailsLoading}
                          style={{
                            background: "#2563eb",
                            color: "#ffffff",
                            border: "none",
                            padding: "6px 14px",
                            borderRadius: "6px",
                            fontSize: "12px",
                            fontWeight: "600",
                            cursor: "pointer",
                          }}
                        >
                          View Details
                        </button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* View Details Modal */}
      {selectedRecipe && (
        <div
          style={{
            position: "fixed",
            inset: 0,
            background: "rgba(0,0,0,0.5)",
            display: "flex",
            justifyContent: "center",
            alignItems: "center",
            zIndex: 9999,
          }}
        >
          <div
            style={{
              background: "#ffffff",
              borderRadius: "10px",
              width: "90%",
              maxWidth: "1000px",
              maxHeight: "85vh",
              overflowY: "auto",
              boxShadow: "0 10px 25px rgba(0,0,0,0.2)",
              padding: "24px",
              position: "relative"
            }}
          >
            {/* Modal Header */}
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", borderBottom: "1px solid #e2e8f0", paddingBottom: "12px", marginBottom: "20px" }}>
              <h2 style={{ fontSize: "18px", fontWeight: "700", color: "#0f172a", margin: 0 }}>
                Recipe Details - {selectedRecipe.finish_code}
              </h2>
              <div style={{ display: "flex", gap: "8px", alignItems: "center" }}>
                <button
                  onClick={() => {
                    setSelectedRecipe(null);
                    navigate("/admin/finishing-recipe?capture=" + encodeURIComponent(selectedRecipe.finish_code));
                  }}
                  style={{
                    background: "#f59e0b",
                    color: "#ffffff",
                    border: "none",
                    padding: "6px 14px",
                    borderRadius: "6px",
                    fontSize: "13px",
                    fontWeight: "600",
                    cursor: "pointer",
                  }}
                >
                  ✏️ Edit Recipe
                </button>
                <button
                  onClick={() => window.print()}
                  style={{
                    background: "#2563eb",
                    color: "#ffffff",
                    border: "none",
                    padding: "6px 14px",
                    borderRadius: "6px",
                    fontSize: "13px",
                    fontWeight: "600",
                    cursor: "pointer",
                  }}
                >
                  🖨️ Print / PDF
                </button>
                <button
                  onClick={() => setSelectedRecipe(null)}
                  style={{
                    background: "transparent",
                    border: "none",
                    fontSize: "20px",
                    color: "#64748b",
                    cursor: "pointer",
                    fontWeight: "bold",
                  }}
                >
                  ✕
                </button>
              </div>
            </div>

            {/* Modal Body */}
            <div>
              {/* Header metadata grid */}
              <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))", gap: "16px", marginBottom: "24px", background: "#f8fafc", padding: "16px", borderRadius: "8px", border: "1px solid #cbd5e1" }}>
                <div>
                  <div style={{ fontSize: "11px", fontWeight: "600", color: "#64748b", textTransform: "uppercase", marginBottom: "4px" }}>Item Code</div>
                  <div style={{ fontSize: "14px", fontWeight: "600", color: "#0f172a" }}>{selectedRecipe.item_code}</div>
                </div>
                <div>
                  <div style={{ fontSize: "11px", fontWeight: "600", color: "#64748b", textTransform: "uppercase", marginBottom: "4px" }}>Finish Code</div>
                  <div style={{ fontSize: "14px", fontWeight: "600", color: "#0f172a" }}>{selectedRecipe.finish_code}</div>
                </div>
                <div>
                  <div style={{ fontSize: "11px", fontWeight: "600", color: "#64748b", textTransform: "uppercase", marginBottom: "4px" }}>Item Description</div>
                  <div style={{ fontSize: "14px", color: "#334155" }}>{selectedRecipe.item_description || "-"}</div>
                </div>
                <div>
                  <div style={{ fontSize: "11px", fontWeight: "600", color: "#64748b", textTransform: "uppercase", marginBottom: "4px" }}>Buyer Code</div>
                  <div style={{ fontSize: "14px", color: "#334155" }}>{selectedRecipe.buyer_code || "-"}</div>
                </div>
                <div>
                  <div style={{ fontSize: "11px", fontWeight: "600", color: "#64748b", textTransform: "uppercase", marginBottom: "4px" }}>Gloss Level</div>
                  <div style={{ fontSize: "14px", color: "#334155" }}>{selectedRecipe.gloss_level || "-"}</div>
                </div>
                <div>
                  <div style={{ fontSize: "11px", fontWeight: "600", color: "#64748b", textTransform: "uppercase", marginBottom: "4px" }}>Wood Type</div>
                  <div style={{ fontSize: "14px", color: "#334155" }}>{selectedRecipe.wood_type || "-"}</div>
                </div>
                <div>
                  <div style={{ fontSize: "11px", fontWeight: "600", color: "#64748b", textTransform: "uppercase", marginBottom: "4px" }}>Created On</div>
                  <div style={{ fontSize: "14px", color: "#334155" }}>{new Date(selectedRecipe.created_on).toLocaleDateString()}</div>
                </div>
                <div>
                  <div style={{ fontSize: "11px", fontWeight: "600", color: "#64748b", textTransform: "uppercase", marginBottom: "4px" }}>Created By</div>
                  <div style={{ fontSize: "14px", color: "#334155" }}>{selectedRecipe.user_name || "Unknown"}</div>
                </div>
                {selectedRecipe.swatch_image && (
                  <div style={{ gridColumn: "span 2" }}>
                    <div style={{ fontSize: "11px", fontWeight: "600", color: "#64748b", textTransform: "uppercase", marginBottom: "4px" }}>Finish Swatch Image</div>
                    <img 
                      src={selectedRecipe.swatch_image} 
                      alt="Finish Swatch" 
                      style={{ maxWidth: "200px", maxHeight: "200px", objectFit: "contain", borderRadius: "8px", border: "1px solid #cbd5e1" }} 
                    />
                  </div>
                )}
              </div>

              {/* Recipe Steps Sub-Table */}
              <h3 style={{ fontSize: "14px", fontWeight: "600", color: "#1e293b", marginBottom: "12px" }}>Recipe Steps</h3>
              
              <div style={{ overflowX: "auto" }}>
                <table style={{ width: "100%", borderCollapse: "collapse", textAlign: "left" }}>
                  <thead>
                    <tr style={{ borderBottom: "2px solid #cbd5e1", background: "#f8fafc" }}>
                      <th style={{ padding: "8px 10px", fontSize: "12px", color: "#475569", fontWeight: "600" }}>Step No</th>
                      <th style={{ padding: "8px 10px", fontSize: "12px", color: "#475569", fontWeight: "600" }}>Process / Material</th>
                      <th style={{ padding: "8px 10px", fontSize: "12px", color: "#475569", fontWeight: "600" }}>Tool / Machine</th>
                      <th style={{ padding: "8px 10px", fontSize: "12px", color: "#475569", fontWeight: "600" }}>Grit / Quantity</th>
                      <th style={{ padding: "8px 10px", fontSize: "12px", color: "#475569", fontWeight: "600" }}>Drying Time</th>
                      <th style={{ padding: "8px 10px", fontSize: "12px", color: "#475569", fontWeight: "600" }}>No. of Coats</th>
                      <th style={{ padding: "8px 10px", fontSize: "12px", color: "#475569", fontWeight: "600" }}>Notes</th>
                    </tr>
                  </thead>
                  <tbody>
                    {selectedRecipe.steps && selectedRecipe.steps.length > 0 ? (
                      selectedRecipe.steps.map((step) => (
                        <tr key={step.id || step.step_no} style={{ borderBottom: "1px solid #cbd5e1" }}>
                          <td style={{ padding: "8px 10px", fontSize: "13px", fontWeight: "bold" }}>{step.step_no}</td>
                          <td style={{ padding: "8px 10px", fontSize: "13px", color: "#334155" }}>{step.process_material || "-"}</td>
                          <td style={{ padding: "8px 10px", fontSize: "13px", color: "#334155" }}>{step.tool_machine || "-"}</td>
                          <td style={{ padding: "8px 10px", fontSize: "13px", color: "#334155" }}>{step.grit_quantity || "-"}</td>
                          <td style={{ padding: "8px 10px", fontSize: "13px", color: "#334155" }}>{step.drying_time || "-"}</td>
                          <td style={{ padding: "8px 10px", fontSize: "13px", color: "#334155" }}>{step.no_of_coats || "-"}</td>
                          <td style={{ padding: "8px 10px", fontSize: "13px", color: "#64748b" }}>{step.notes || "-"}</td>
                        </tr>
                      ))
                    ) : (
                      <tr>
                        <td colSpan={7} style={{ padding: "16px", fontStyle: "italic", textAlign: "center", color: "#94a3b8" }}>
                          No steps defined.
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
            
            {/* Modal Footer */}
            <div className="no-print" style={{ display: "flex", justifyContent: "flex-end", gap: "8px", marginTop: "24px", borderTop: "1px solid #cbd5e1", paddingTop: "16px" }}>
              <button
                onClick={() => {
                  setSelectedRecipe(null);
                  navigate("/admin/finishing-recipe?capture=" + encodeURIComponent(selectedRecipe.finish_code));
                }}
                style={{
                  background: "#f59e0b",
                  color: "#ffffff",
                  border: "none",
                  padding: "8px 16px",
                  borderRadius: "6px",
                  fontSize: "13px",
                  fontWeight: "600",
                  cursor: "pointer",
                }}
              >
                ✏️ Edit Recipe
              </button>
              <button
                onClick={() => window.print()}
                style={{
                  background: "#2563eb",
                  color: "#ffffff",
                  border: "none",
                  padding: "8px 16px",
                  borderRadius: "6px",
                  fontSize: "13px",
                  fontWeight: "600",
                  cursor: "pointer",
                }}
              >
                🖨️ Print / PDF
              </button>
              <button
                onClick={() => setSelectedRecipe(null)}
                style={{
                  background: "#64748b",
                  color: "#ffffff",
                  border: "none",
                  padding: "8px 16px",
                  borderRadius: "6px",
                  fontSize: "13px",
                  fontWeight: "600",
                  cursor: "pointer",
                }}
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
