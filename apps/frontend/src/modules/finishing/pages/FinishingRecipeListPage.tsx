import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { finishingApi, FinishingRecipe } from "../api/finishingApi";
import "../../fms/pages/Fms.css";

export function FinishingRecipeListPage() {
  const [recipes, setRecipes] = useState<FinishingRecipe[]>([]);
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    fetchRecipes();
  }, []);

  const fetchRecipes = async () => {
    try {
      const data = await finishingApi.getAllRecipes();
      setRecipes(data);
      setSelectedIds([]); // Clear selection when data is re-fetched
    } catch (error) {
      console.error("Error fetching recipes:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleSelectAll = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.checked) {
      setSelectedIds(recipes.map((r) => r.id as string));
    } else {
      setSelectedIds([]);
    }
  };

  const handleSelectOne = (id: string) => {
    if (selectedIds.includes(id)) {
      setSelectedIds(selectedIds.filter(selectedId => selectedId !== id));
    } else {
      setSelectedIds([...selectedIds, id]);
    }
  };

  const handleDelete = async (id: string) => {
    if (!window.confirm("Are you sure you want to delete this recipe?")) return;
    try {
      await finishingApi.deleteBulkRecipes([id]);
      await fetchRecipes();
    } catch (error) {
      console.error("Error deleting recipe:", error);
      alert("Failed to delete recipe");
    }
  };

  const handleBulkDelete = async () => {
    if (selectedIds.length === 0) return;
    if (!window.confirm(`Are you sure you want to delete ${selectedIds.length} selected recipe(s)?`)) return;
    try {
      await finishingApi.deleteBulkRecipes(selectedIds);
      await fetchRecipes();
    } catch (error) {
      console.error("Error deleting recipes:", error);
      alert("Failed to delete selected recipes");
    }
  };

  return (
    <div className="fms-container">
      <div className="fms-card" style={{ maxWidth: "1200px" }}>
        <div className="fms-card-header" style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <h2 className="fms-title">FINISHING RECIPE LIST</h2>
          <div style={{ display: "flex", gap: "10px" }}>
            {selectedIds.length > 0 && (
              <button 
                className="fms-btn-danger" 
                onClick={handleBulkDelete}
                style={{ background: "#dc3545", color: "white", padding: "8px 16px", border: "none", borderRadius: "4px", cursor: "pointer", fontWeight: "bold" }}
              >
                DELETE SELECTED ({selectedIds.length})
              </button>
            )}
            <button 
              className="fms-btn-primary" 
              onClick={() => navigate("/admin/finishing-recipes/new")}
            >
              + ADD NEW RECIPE
            </button>
          </div>
        </div>

        <div className="fms-card-content">
          {loading ? (
            <p>Loading...</p>
          ) : recipes.length === 0 ? (
            <p>No Finishing Recipes found.</p>
          ) : (
            <div className="fms-table-container">
              <table className="fms-table">
                <thead>
                  <tr>
                    <th className="fms-th" style={{ width: "40px", textAlign: "center" }}>
                      <input 
                        type="checkbox" 
                        checked={recipes.length > 0 && selectedIds.length === recipes.length}
                        onChange={handleSelectAll}
                        style={{ cursor: "pointer" }}
                      />
                    </th>
                    <th className="fms-th">Created On</th>
                    <th className="fms-th">Item Code</th>
                    <th className="fms-th">Finish Code</th>
                    <th className="fms-th">Item Description</th>
                    <th className="fms-th">Wood Type</th>
                    <th className="fms-th" style={{ width: "150px", textAlign: "center" }}>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {recipes.map((recipe) => (
                    <tr key={recipe.id} className="fms-tr">
                      <td className="fms-td" style={{ textAlign: "center" }}>
                        <input 
                          type="checkbox"
                          checked={selectedIds.includes(recipe.id as string)}
                          onChange={() => handleSelectOne(recipe.id as string)}
                          style={{ cursor: "pointer" }}
                        />
                      </td>
                      <td className="fms-td">{recipe.createdOn}</td>
                      <td className="fms-td">{recipe.itemCode}</td>
                      <td className="fms-td">{recipe.finishCode}</td>
                      <td className="fms-td">{recipe.itemDescription}</td>
                      <td className="fms-td">{recipe.woodType}</td>
                      <td className="fms-td" style={{ textAlign: "center" }}>
                        <div style={{ display: "flex", gap: "8px", justifyContent: "center" }}>
                          <button
                            onClick={() => navigate(`/admin/finishing-recipes/edit/${recipe.id}`)}
                            style={{
                              background: "#007bff",
                              color: "white",
                              border: "none",
                              padding: "6px 12px",
                              borderRadius: "4px",
                              cursor: "pointer",
                              fontWeight: "bold",
                              fontSize: "13px"
                            }}
                          >
                            Edit
                          </button>
                          <button
                            onClick={() => handleDelete(recipe.id as string)}
                            style={{
                              background: "#dc3545",
                              color: "white",
                              border: "none",
                              padding: "6px 12px",
                              borderRadius: "4px",
                              cursor: "pointer",
                              fontWeight: "bold",
                              fontSize: "13px"
                            }}
                          >
                            Delete
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
