import React, { useState } from "react";
import "../../fms/pages/Fms.css"; // Reuse FMS styles for consistency

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
  const [formData, setFormData] = useState({
    itemCode: "",
    finishCode: "",
    itemDescription: "",
    createdOn: new Date().toISOString().split("T")[0],
    buyerCode: "",
    glossLevel: "",
    woodType: "",
  });

  const [steps, setSteps] = useState<RecipeStep[]>([
    {
      id: crypto.randomUUID(),
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
        id: crypto.randomUUID(),
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

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    console.log("Submitting Recipe:", { header: formData, steps });
    alert("Form submitted successfully! (Check console for data)");
  };

  return (
    <div className="fms-container">
      <div className="fms-card" style={{ maxWidth: "1200px" }}>
        <div className="fms-card-header">
          <h2 className="fms-title">FINISHING RECIPE FORM</h2>
        </div>

        <div className="fms-card-content">
          <form onSubmit={handleSubmit}>
            {/* Header Section */}
            <div className="fms-grid" style={{ gridTemplateColumns: "1fr 1fr", gap: "20px", marginBottom: "30px" }}>
              <div className="fms-form-group">
                <label className="fms-label">Item Code</label>
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
                <label className="fms-label">Finish Code</label>
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
                <label className="fms-label">Item Description</label>
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
                <label className="fms-label">Created On</label>
                <input
                  type="date"
                  name="createdOn"
                  value={formData.createdOn}
                  onChange={handleHeaderChange}
                  className="fms-input"
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
                <input
                  type="text"
                  name="woodType"
                  value={formData.woodType}
                  onChange={handleHeaderChange}
                  className="fms-input"
                  placeholder="e.g. Mango"
                />
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
                SAVE FINISHING RECIPE
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
