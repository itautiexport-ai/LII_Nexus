import React, { useState, useEffect } from "react";
import "../../fms/pages/Fms.css";
import { masterDataApi } from "../../admin/masterdata/api/masterDataApi";
import { finishingRecipeApi } from "../api/finishingRecipeApi";
import { useNavigate, useLocation } from "react-router-dom";
import { axiosInstance } from "../../../services/api/axiosInstance";

interface RecipeStep {
  id: string;
  stepNo: number;
  processMaterial: string;
  toolMachine: string;
  gritQuantity: string;
  dryingTime: string;
  notes: string;
  noOfCoats: string;
}

export function FinishingRecipePage() {
  const navigate = useNavigate();
  const location = useLocation();
  const [formData, setFormData] = useState({
    itemCode: "",
    finishCode: "",
    itemDescription: "",
    createdOn: new Date().toISOString().split("T")[0],
    buyerCode: "",
    glossLevel: "",
    woodType: "",
  });

  const [swatchImage, setSwatchImage] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploading(true);
    const formDataObj = new FormData();
    formDataObj.append("file", file);

    try {
      const res = await axiosInstance.post<{ success: boolean; data: { fileUrl: string } }>(
        "/standalone-checklists/upload-attachment",
        formDataObj,
        {
          headers: {
            "Content-Type": "multipart/form-data",
          },
        }
      );
      setSwatchImage(res.data.data.fileUrl);
    } catch (err) {
      console.error(err);
      alert("Failed to upload image.");
    } finally {
      setUploading(false);
    }
  };

  const [woodTypes, setWoodTypes] = useState<{id: string, name: string}[]>([]);
  const [finishCodes, setFinishCodes] = useState<{id: string, code: string, name: string}[]>([]);
  const [savedRecipes, setSavedRecipes] = useState<any[]>([]);

  useEffect(() => {
    masterDataApi.getWoodTypes()
      .then(data => setWoodTypes(data.filter((w: any) => w.status === 'active')))
      .catch(console.error);

    masterDataApi.getFinishCodes()
      .then(data => setFinishCodes(data))
      .catch(console.error);

    finishingRecipeApi.getAll()
      .then(data => setSavedRecipes(data || []))
      .catch(console.error);
  }, []);

  // Auto-fill from ?capture= query param (when coming from Edit button on list page)
  useEffect(() => {
    const params = new URLSearchParams(location.search);
    const captureCode = params.get("capture");
    if (!captureCode || savedRecipes.length === 0) return;

    const matching = savedRecipes.find((r: any) => r.finish_code === captureCode);
    if (!matching) return;

    finishingRecipeApi.getById(matching.id).then(fullRecipe => {
      setFormData({
        itemCode: fullRecipe.item_code || "",
        finishCode: fullRecipe.finish_code || "",
        itemDescription: fullRecipe.item_description || "",
        createdOn: new Date().toISOString().split("T")[0],
        buyerCode: fullRecipe.buyer_code || "",
        glossLevel: fullRecipe.gloss_level || "",
        woodType: fullRecipe.wood_type || "",
      });
      setSwatchImage(fullRecipe.swatch_image || null);
      if (fullRecipe.steps && fullRecipe.steps.length > 0) {
        setSteps(fullRecipe.steps.map((s: any, index: number) => ({
          id: s.id || generateId(),
          stepNo: s.step_no || (index + 1),
          processMaterial: s.process_material || "",
          toolMachine: s.tool_machine || "",
          gritQuantity: s.grit_quantity || "",
          dryingTime: s.drying_time || "",
          notes: s.notes || "",
          noOfCoats: s.no_of_coats || "",
        })));
      }
    }).catch(console.error);
  }, [savedRecipes, location.search]);

  const handleCaptureCodeChange = async (e: React.ChangeEvent<HTMLSelectElement>) => {
    const selectedCode = e.target.value;

    if (!selectedCode) {
      // Reset form to blank when user deselects
      setFormData({
        itemCode: "",
        finishCode: "",
        itemDescription: "",
        createdOn: new Date().toISOString().split("T")[0],
        buyerCode: "",
        glossLevel: "",
        woodType: "",
      });
      setSwatchImage(null);
      setSteps([{
        id: generateId(),
        stepNo: 1,
        processMaterial: "",
        toolMachine: "",
        gritQuantity: "",
        dryingTime: "",
        notes: "",
        noOfCoats: "",
      }]);
      return;
    }

    const matching = savedRecipes.find(r => r.finish_code === selectedCode);
    if (!matching) {
      alert("No saved recipe found for this finish code.");
      return;
    }

    try {
      const fullRecipe = await finishingRecipeApi.getById(matching.id);
      setFormData({
        itemCode: fullRecipe.item_code || "",
        finishCode: fullRecipe.finish_code || "",
        itemDescription: fullRecipe.item_description || "",
        createdOn: new Date().toISOString().split("T")[0],
        buyerCode: fullRecipe.buyer_code || "",
        glossLevel: fullRecipe.gloss_level || "",
        woodType: fullRecipe.wood_type || "",
      });

      setSwatchImage(fullRecipe.swatch_image || null);

      if (fullRecipe.steps && fullRecipe.steps.length > 0) {
        setSteps(fullRecipe.steps.map((s, index) => ({
          id: s.id || generateId(),
          stepNo: s.step_no || (index + 1),
          processMaterial: s.process_material || "",
          toolMachine: s.tool_machine || "",
          gritQuantity: s.grit_quantity || "",
          dryingTime: s.drying_time || "",
          notes: s.notes || "",
          noOfCoats: s.no_of_coats || "",
        })));
      }
    } catch (err) {
      console.error(err);
      alert("Failed to load details for the selected recipe.");
    }
  };

  const generateId = () => {
    return typeof crypto !== 'undefined' && crypto.randomUUID 
      ? crypto.randomUUID() 
      : Date.now().toString(36) + Math.random().toString(36).substring(2);
  };

  const [steps, setSteps] = useState<RecipeStep[]>([
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

  const handleHeaderChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleStepChange = (id: string, field: keyof RecipeStep, value: string) => {
    setSteps(prev => prev.map(step => 
      step.id === id ? { ...step, [field]: value } : step
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

  const removeStep = (id: string) => {
    setSteps(prev => {
      const filtered = prev.filter(step => step.id !== id);
      return filtered.map((step, index) => ({ ...step, stepNo: index + 1 }));
    });
  };

  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.itemCode || !formData.finishCode) {
      setSubmitError("Item Code and Finish Code are required.");
      return;
    }
    setSubmitting(true);
    setSubmitError(null);

    try {
      await finishingRecipeApi.create({
        itemCode: formData.itemCode,
        finishCode: formData.finishCode,
        itemDescription: formData.itemDescription,
        createdOn: formData.createdOn,
        buyerCode: formData.buyerCode,
        glossLevel: formData.glossLevel,
        woodType: formData.woodType,
        swatchImage: swatchImage || undefined,
        steps: steps.map(s => ({
          stepNo: s.stepNo,
          processMaterial: s.processMaterial,
          toolMachine: s.toolMachine,
          gritQuantity: s.gritQuantity,
          dryingTime: s.dryingTime,
          notes: s.notes,
          noOfCoats: s.noOfCoats,
        }))
      });

      alert("Finishing Recipe submitted successfully!");
      navigate("/admin/finishing-recipe-list");
    } catch (err: any) {
      console.error(err);
      setSubmitError(err.response?.data?.error || err.message || "Failed to submit recipe.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="fms-container">
      <div className="fms-card" style={{ maxWidth: "1200px" }}>
        <div className="fms-card-header">
          <h2 className="fms-title">FINISHING RECIPE FORM<br/><small style={{ fontSize: "0.6em", fontWeight: "400", letterSpacing: "0" }}>फिनिशिंग रेसिपी फॉर्म</small></h2>
        </div>

        <div className="fms-card-content">
          {submitError && (
            <div style={{ padding: "12px 16px", background: "#fef2f2", color: "#991b1b", borderRadius: "6px", marginBottom: "16px", fontSize: "14px", border: "1px solid #fee2e2" }}>
              ❌ {submitError}
            </div>
          )}
          <form onSubmit={handleSubmit}>
            {/* Header Section */}
            <div className="fms-grid" style={{ gridTemplateColumns: "1fr 1fr", gap: "20px", marginBottom: "30px" }}>
              <div className="fms-form-group" style={{ gridColumn: "span 2" }}>
                <label className="fms-label" style={{ color: "#2563eb", fontWeight: "bold" }}>Capture Code (Auto-Fill Recipe) <small style={{ fontWeight: "normal" }}>/ कैप्चर कोड (रेसिपी स्वतः भरें)</small></label>
                <select
                  onChange={handleCaptureCodeChange}
                  className="fms-input"
                  style={{ padding: "8px", border: "2px solid #2563eb", borderRadius: "4px" }}
                >
                  <option value="">— Select Finish Code to Auto-Fill / फिनिश कोड चुनें —</option>
                  {savedRecipes.map(r => (
                    <option key={r.id} value={r.finish_code}>{r.finish_code} — {r.item_code || "No Item Code"}</option>
                  ))}
                </select>
                <span style={{ fontSize: "12px", color: "#64748b", marginTop: "4px", display: "block" }}>
                  Only saved recipes shown. Selecting one auto-fills all fields &amp; steps. / केवल सहेजी गई रेसिपी दिखती हैं। चुनने पर सारी जानकारी स्वतः भर जाएगी।
                </span>
              </div>

              <div className="fms-form-group">
                <label className="fms-label">Item Code <small style={{ color: "#64748b" }}>/ आइटम कोड</small></label>
                <input
                  type="text"
                  name="itemCode"
                  value={formData.itemCode}
                  onChange={handleHeaderChange}
                  className="fms-input"
                  placeholder="e.g. 11806, 11807"
                />
              </div>
              
              <div className="fms-form-group">
                <label className="fms-label">Finish Code <small style={{ color: "#64748b" }}>/ फिनिश कोड</small></label>
                <input
                  type="text"
                  name="finishCode"
                  value={formData.finishCode}
                  onChange={handleHeaderChange}
                  className="fms-input"
                  placeholder="e.g. Dark Honey"
                />
              </div>

              <div className="fms-form-group">
                <label className="fms-label">Item Description <small style={{ color: "#64748b" }}>/ आइटम विवरण</small></label>
                <input
                  type="text"
                  name="itemDescription"
                  value={formData.itemDescription}
                  onChange={handleHeaderChange}
                  className="fms-input"
                  placeholder="e.g. Bathroom Cabinet"
                />
              </div>

              <div className="fms-form-group">
                <label className="fms-label">Created On <small style={{ color: "#64748b" }}>/ दिनांक</small></label>
                <input
                  type="date"
                  name="createdOn"
                  value={formData.createdOn}
                  onChange={handleHeaderChange}
                  className="fms-input"
                />
              </div>

              <div className="fms-form-group">
                <label className="fms-label">Buyer Code <small style={{ color: "#64748b" }}>/ खरीदार कोड</small></label>
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
                <label className="fms-label">Gloss Level <small style={{ color: "#64748b" }}>/ चमक स्तर</small></label>
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
                <label className="fms-label">Wood Type <small style={{ color: "#64748b" }}>/ लकड़ी का प्रकार</small></label>
                <select
                  name="woodType"
                  value={formData.woodType}
                  onChange={handleHeaderChange as any}
                  className="fms-input"
                  style={{ padding: "8px", border: "1px solid #ced4da", borderRadius: "4px" }}
                >
                  <option value="">Select Wood Type / लकड़ी चुनें...</option>
                  {woodTypes.map(wood => (
                    <option key={wood.id} value={wood.name}>{wood.name}</option>
                  ))}
                </select>
              </div>

              <div className="fms-form-group" style={{ gridColumn: "span 2" }}>
                <label className="fms-label">Finish Swatch Image <small style={{ color: "#64748b" }}>/ फिनिश स्वैच छवि</small></label>
                <div style={{ display: "flex", gap: "16px", alignItems: "center" }}>
                  <input
                    type="file"
                    accept="image/*"
                    onChange={handleImageUpload}
                    className="fms-input"
                    style={{ padding: "8px", border: "1px solid #ced4da", borderRadius: "4px", flex: 1 }}
                  />
                  {uploading && <span style={{ fontSize: "14px", color: "#475569" }}>Uploading...</span>}
                  {swatchImage && (
                    <div style={{ position: "relative" }}>
                      <img 
                        src={swatchImage} 
                        alt="Swatch Swatch Preview" 
                        style={{ width: "80px", height: "80px", objectFit: "cover", borderRadius: "8px", border: "1px solid #cbd5e1" }} 
                      />
                      <button 
                        type="button"
                        onClick={() => setSwatchImage(null)}
                        style={{
                          position: "absolute",
                          top: "-8px",
                          right: "-8px",
                          background: "#ef4444",
                          color: "white",
                          border: "none",
                          borderRadius: "50%",
                          width: "20px",
                          height: "20px",
                          cursor: "pointer",
                          fontSize: "12px",
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "center"
                        }}
                      >
                        ✕
                      </button>
                    </div>
                  )}
                </div>
              </div>
            </div>

            <hr className="fms-divider" />

            {/* Steps Table Section */}
            <h3 className="fms-title" style={{ marginTop: "20px", marginBottom: "15px", fontSize: "1.2rem" }}>Recipe Steps <small style={{ fontSize: "0.7em", fontWeight: "400" }}>/ रेसिपी के चरण</small></h3>
            
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
                    <th className="fms-th" style={{ width: "60px" }}>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {steps.map((step) => (
                    <tr key={step.id} className="fms-tr">
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

            <div style={{ marginTop: "15px", display: "flex", gap: "10px", justifyContent: "space-between", alignItems: "center" }}>
              <button 
                type="button" 
                onClick={addStep} 
                style={{ background: "#007bff", color: "white", border: "none", borderRadius: "4px", padding: "8px 16px", cursor: "pointer", fontWeight: "bold", marginTop: "30px" }}
              >
                + ADD STEP
              </button>

              <div style={{ display: "flex", gap: "10px", marginTop: "30px" }}>
                <button
                  type="submit"
                  disabled={submitting}
                  className="fms-btn-primary"
                  style={{
                    padding: "10px 24px",
                    fontSize: "1rem",
                    fontWeight: "bold",
                    background: submitting ? "#94a3b8" : "#28a745",
                    border: "none",
                    borderRadius: "4px",
                    color: "#fff",
                    cursor: submitting ? "not-allowed" : "pointer"
                  }}
                >
                  {submitting ? "Submitting..." : "Submit Recipe"}
                </button>
                <button
                  type="button"
                  onClick={() => navigate("/admin/finishing-recipe-list")}
                  style={{
                    padding: "10px 24px",
                    fontSize: "1rem",
                    fontWeight: "bold",
                    background: "#6c757d",
                    border: "none",
                    borderRadius: "4px",
                    color: "#fff",
                    cursor: "pointer"
                  }}
                >
                  Go to List
                </button>
              </div>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
