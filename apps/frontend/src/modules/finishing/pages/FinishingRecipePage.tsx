import React, { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import "../../fms/pages/Fms.css";
import { masterDataApi } from "../../admin/masterdata/api/masterDataApi";
import { finishingApi, FinishingRecipeStep } from "../api/finishingApi";

export function FinishingRecipePage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const isEditMode = !!id;

  const [formData, setFormData] = useState({
    itemCode: "",
    finishCode: "",
    itemDescription: "",
    createdOn: new Date().toISOString().split("T")[0],
    buyerCode: "",
    glossLevel: "",
    woodType: "",
  });

  const [woodTypes, setWoodTypes] = useState<{id: string, name: string}[]>([]);
  const [steps, setSteps] = useState<FinishingRecipeStep[]>([]);
  const [loading, setLoading] = useState(isEditMode);

  useEffect(() => {
    masterDataApi.getWoodTypes()
      .then(data => setWoodTypes(data.filter((w: any) => w.status === 'active')))
      .catch(console.error);

    if (isEditMode && id) {
      finishingApi.getRecipeById(id)
        .then(data => {
          setFormData({
            itemCode: data.itemCode || "",
            finishCode: data.finishCode || "",
            itemDescription: data.itemDescription || "",
            createdOn: data.createdOn || new Date().toISOString().split("T")[0],
            buyerCode: data.buyerCode || "",
            glossLevel: data.glossLevel || "",
            woodType: data.woodType || "",
          });
          setSteps(data.steps || []);
        })
        .catch(error => {
          console.error("Error fetching recipe:", error);
          alert("Failed to load recipe details.");
        })
        .finally(() => {
          setLoading(false);
        });
    } else {
      setSteps([
        {
          id: generateId(),
          stepNo: 1,
          processMaterial: "",
          toolMachine: "",
          gritQuantity: "",
          dryingTime: "",
          notes: "",
          noOfCoats: "",
        }
      ]);
    }
  }, [id, isEditMode]);

  const generateId = () => {
    return typeof crypto !== 'undefined' && crypto.randomUUID 
      ? crypto.randomUUID() 
      : Date.now().toString(36) + Math.random().toString(36).substring(2);
  };

  const handleHeaderChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleStepChange = (stepId: string | undefined, field: keyof FinishingRecipeStep, value: string) => {
    setSteps(prev => prev.map(step => 
      step.id === stepId ? { ...step, [field]: value } : step
    ));
  };

  const addStep = () => {
    setSteps(prev => [
      ...prev,
      {
        id: generateId(),
        stepNo: prev.length + 1,
        processMaterial: "",
        toolMachine: "",
        gritQuantity: "",
        dryingTime: "",
        notes: "",
        noOfCoats: "",
      }
    ]);
  };

  const removeStep = (stepId: string | undefined) => {
    setSteps(prev => {
      const filtered = prev.filter(step => step.id !== stepId);
      return filtered.map((step, index) => ({ ...step, stepNo: index + 1 }));
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const payload = {
        ...formData,
        steps: steps.map(s => ({
          id: s.id,
          stepNo: s.stepNo,
          processMaterial: s.processMaterial,
          toolMachine: s.toolMachine,
          gritQuantity: s.gritQuantity,
          dryingTime: s.dryingTime,
          notes: s.notes,
          noOfCoats: s.noOfCoats,
        }))
      };

      if (isEditMode && id) {
        await finishingApi.updateRecipe(id, payload);
        alert("Recipe updated successfully!");
      } else {
        await finishingApi.createRecipe(payload);
        alert("Recipe created successfully!");
      }
      navigate("/admin/finishing-recipes");
    } catch (error) {
      console.error("Error saving recipe:", error);
      alert("An error occurred while saving the recipe. Please try again.");
    }
  };

  if (loading) {
    return <div style={{ padding: "20px" }}>Loading recipe...</div>;
  }

  return (
    <div className="fms-container">
      <div className="fms-card" style={{ maxWidth: "1200px" }}>
        <div className="fms-card-header" style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <h2 className="fms-title">{isEditMode ? "EDIT FINISHING RECIPE" : "FINISHING RECIPE FORM"}</h2>
          <button 
            type="button" 
            className="fms-btn-secondary" 
            onClick={() => navigate("/admin/finishing-recipes")}
            style={{ background: "#6c757d", color: "white", padding: "6px 12px", border: "none", borderRadius: "4px", cursor: "pointer", fontWeight: "bold" }}
          >
            Back to List
          </button>
        </div>

        <div className="fms-card-content">
          <form onSubmit={handleSubmit}>
            {/* Header Section */}
            <div className="fms-grid" style={{ gridTemplateColumns: "1fr 1fr", gap: "20px", marginBottom: "30px" }}>
              <div className="fms-form-group">
                <label className="fms-label">Item Code <span style={{color: "red"}}>*</span></label>
                <input
                  type="text"
                  name="itemCode"
                  value={formData.itemCode}
                  onChange={handleHeaderChange}
                  className="fms-input"
                  placeholder="e.g. 11806, 11807"
                  required
                />
              </div>
              
              <div className="fms-form-group">
                <label className="fms-label">Finish Code <span style={{color: "red"}}>*</span></label>
                <input
                  type="text"
                  name="finishCode"
                  value={formData.finishCode}
                  onChange={handleHeaderChange}
                  className="fms-input"
                  placeholder="e.g. Dark Honey"
                  required
                />
              </div>

              <div className="fms-form-group">
                <label className="fms-label">Item Description <span style={{color: "red"}}>*</span></label>
                <input
                  type="text"
                  name="itemDescription"
                  value={formData.itemDescription}
                  onChange={handleHeaderChange}
                  className="fms-input"
                  placeholder="e.g. Bathroom Cabinet"
                  required
                />
              </div>

              <div className="fms-form-group">
                <label className="fms-label">Created On <span style={{color: "red"}}>*</span></label>
                <input
                  type="date"
                  name="createdOn"
                  value={formData.createdOn}
                  onChange={handleHeaderChange}
                  className="fms-input"
                  required
                />
              </div>

              <div className="fms-form-group">
                <label className="fms-label">Buyer Code</label>
                <input
                  type="text"
                  name="buyerCode"
                  value={formData.buyerCode}
                  onChange={handleHeaderChange}
                  className="fms-input"
                  placeholder="e.g. Wayly - 07"
                />
              </div>

              <div className="fms-form-group">
                <label className="fms-label">Gloss Level</label>
                <input
                  type="text"
                  name="glossLevel"
                  value={formData.glossLevel}
                  onChange={handleHeaderChange}
                  className="fms-input"
                  placeholder="e.g. Matte, High Gloss"
                />
              </div>

              <div className="fms-form-group">
                <label className="fms-label">Wood Type</label>
                <select
                  name="woodType"
                  value={formData.woodType}
                  onChange={handleHeaderChange}
                  className="fms-input"
                  style={{ padding: "8px", border: "1px solid #ced4da", borderRadius: "4px" }}
                >
                  <option value="">Select Wood Type...</option>
                  {woodTypes.map(wood => (
                    <option key={wood.id} value={wood.name}>{wood.name}</option>
                  ))}
                </select>
              </div>
            </div>

            <hr className="fms-divider" />

            {/* Steps Table Section */}
            <h3 className="fms-title" style={{ marginTop: "20px", marginBottom: "15px", fontSize: "1.2rem" }}>Recipe Steps</h3>
            
            <div className="fms-table-container" style={{ overflowX: "auto" }}>
              <table className="fms-table" style={{ minWidth: "900px" }}>
                <thead>
                  <tr>
                    <th className="fms-th" style={{ width: "60px" }}>Step<br/><small>(क्र.सं)</small></th>
                    <th className="fms-th">Process / Material<br/><small>(प्रक्रिया / सामग्री)</small></th>
                    <th className="fms-th" style={{ width: "120px" }}>Tool / Machine<br/><small>(मशीन / उपकरण)</small></th>
                    <th className="fms-th" style={{ width: "120px" }}>Grit / Quantity<br/><small>(ग्रिट / मात्रा)</small></th>
                    <th className="fms-th" style={{ width: "120px" }}>Drying Time<br/><small>(सूखने का समय)</small></th>
                    <th className="fms-th">Notes<br/><small>(नोट्स)</small></th>
                    <th className="fms-th" style={{ width: "100px" }}>No. of Coats<br/><small>(कितने कोट)</small></th>
                    <th className="fms-th" style={{ width: "60px", textAlign: "center" }}>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {steps.map((step) => (
                    <tr key={step.id || step.stepNo} className="fms-tr">
                      <td className="fms-td" style={{ textAlign: "center", fontWeight: "bold" }}>{step.stepNo}</td>
                      <td className="fms-td">
                        <input 
                          type="text" 
                          className="fms-input" 
                          value={step.processMaterial} 
                          onChange={(e) => handleStepChange(step.id, "processMaterial", e.target.value)} 
                          style={{ padding: "6px", fontSize: "0.9rem" }}
                          placeholder="Process/Material"
                        />
                      </td>
                      <td className="fms-td">
                        <input 
                          type="text" 
                          className="fms-input" 
                          value={step.toolMachine} 
                          onChange={(e) => handleStepChange(step.id, "toolMachine", e.target.value)} 
                          style={{ padding: "6px", fontSize: "0.9rem" }}
                          placeholder="e.g. Spray"
                        />
                      </td>
                      <td className="fms-td">
                        <input 
                          type="text" 
                          className="fms-input" 
                          value={step.gritQuantity} 
                          onChange={(e) => handleStepChange(step.id, "gritQuantity", e.target.value)} 
                          style={{ padding: "6px", fontSize: "0.9rem" }}
                          placeholder="e.g. 1:3"
                        />
                      </td>
                      <td className="fms-td">
                        <input 
                          type="text" 
                          className="fms-input" 
                          value={step.dryingTime} 
                          onChange={(e) => handleStepChange(step.id, "dryingTime", e.target.value)} 
                          style={{ padding: "6px", fontSize: "0.9rem" }}
                          placeholder="e.g. 1 Hrs"
                        />
                      </td>
                      <td className="fms-td">
                        <input 
                          type="text" 
                          className="fms-input" 
                          value={step.notes} 
                          onChange={(e) => handleStepChange(step.id, "notes", e.target.value)} 
                          style={{ padding: "6px", fontSize: "0.9rem" }}
                          placeholder="Notes"
                        />
                      </td>
                      <td className="fms-td">
                        <input 
                          type="text" 
                          className="fms-input" 
                          value={step.noOfCoats} 
                          onChange={(e) => handleStepChange(step.id, "noOfCoats", e.target.value)} 
                          style={{ padding: "6px", fontSize: "0.9rem" }}
                          placeholder="e.g. 1 Coat"
                        />
                      </td>
                      <td className="fms-td" style={{ textAlign: "center" }}>
                        <button 
                          type="button" 
                          onClick={() => removeStep(step.id)}
                          style={{ background: "#dc3545", color: "white", border: "none", borderRadius: "4px", padding: "4px 8px", cursor: "pointer", fontSize: "16px", fontWeight: "bold" }}
                          title="Remove Step"
                        >
                          &times;
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            {steps.length === 0 && (
              <p style={{ color: "#6c757d", fontStyle: "italic", marginTop: "10px" }}>No steps added yet.</p>
            )}

            <div style={{ marginTop: "15px", display: "flex", gap: "10px", justifyContent: "space-between" }}>
              <button 
                type="button" 
                onClick={addStep} 
                style={{ background: "#28a745", color: "white", border: "none", borderRadius: "4px", padding: "8px 16px", cursor: "pointer", fontWeight: "bold" }}
              >
                + ADD STEP
              </button>

              <button 
                type="submit" 
                className="fms-btn-primary"
              >
                {isEditMode ? "UPDATE FINISHING RECIPE" : "SAVE FINISHING RECIPE"}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
