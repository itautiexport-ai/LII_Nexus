import React, { useState } from "react";
import { CreateFmsManagerDto, FmsManager } from "../api/fmsApi";

export interface FormField {
  name: string;
  label: string;
  type: "text" | "number" | "date" | "boolean";
  required: boolean;
}

interface FmsFormBuilderProps {
  initialData?: FmsManager;
  onSave: (data: CreateFmsManagerDto) => Promise<void>;
  onCancel: () => void;
}

export function FmsFormBuilder({ initialData, onSave, onCancel }: FmsFormBuilderProps) {
  const [name, setName] = useState(initialData?.name || "");
  const [description, setDescription] = useState(initialData?.description || "");
  const [fields, setFields] = useState<FormField[]>(initialData?.formFields || []);
  const [loading, setLoading] = useState(false);

  const addField = () => {
    setFields([...fields, { name: "", label: "", type: "text", required: false }]);
  };

  const updateField = (index: number, key: keyof FormField, value: any) => {
    const newFields = [...fields];
    newFields[index] = { ...newFields[index], [key]: value };
    // Auto-generate name from label if name is empty
    if (key === "label" && !newFields[index].name) {
        newFields[index].name = value.replace(/\s+/g, "_").toLowerCase();
    }
    setFields(newFields);
  };

  const removeField = (index: number) => {
    setFields(fields.filter((_, i) => i !== index));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name || !description) {
      alert("Name and description are required.");
      return;
    }

    try {
      setLoading(true);
      await onSave({
        name,
        description,
        formFields: fields,
      });
    } catch (err) {
      console.error(err);
      alert("Failed to save form definition");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ padding: "20px", background: "white", borderRadius: "8px", boxShadow: "0 2px 4px rgba(0,0,0,0.1)" }}>
      <h2 style={{ marginBottom: "20px", color: "#333" }}>{initialData ? "Edit Form Definition" : "Create New Form Definition"}</h2>
      <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: "20px" }}>
        
        {/* Basic Info */}
        <div style={{ display: "flex", gap: "20px" }}>
          <div style={{ flex: 1 }}>
            <label style={{ display: "block", marginBottom: "5px", fontWeight: "bold" }}>Form Name *</label>
            <input 
              type="text" 
              value={name} 
              onChange={(e) => setName(e.target.value)} 
              required
              style={{ width: "100%", padding: "10px", borderRadius: "4px", border: "1px solid #ccc" }}
            />
          </div>
          <div style={{ flex: 1 }}>
            <label style={{ display: "block", marginBottom: "5px", fontWeight: "bold" }}>Description *</label>
            <input 
              type="text" 
              value={description} 
              onChange={(e) => setDescription(e.target.value)} 
              required
              style={{ width: "100%", padding: "10px", borderRadius: "4px", border: "1px solid #ccc" }}
            />
          </div>
        </div>

        {/* Dynamic Fields */}
        <div>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "10px" }}>
            <h3 style={{ margin: 0, color: "#333" }}>Custom Form Fields</h3>
            <button 
              type="button" 
              onClick={addField}
              style={{ padding: "6px 12px", background: "#28a745", color: "white", border: "none", borderRadius: "4px", cursor: "pointer", fontSize: "14px" }}
            >
              + Add Field
            </button>
          </div>
          
          {fields.length === 0 ? (
            <div style={{ padding: "20px", textAlign: "center", background: "#f8f9fa", borderRadius: "4px", color: "#666" }}>
              No custom fields added yet. Note: "Reference / Order ID" is automatically included for all forms.
            </div>
          ) : (
            <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
              {fields.map((field, index) => (
                <div key={index} style={{ display: "flex", gap: "10px", alignItems: "center", background: "#f8f9fa", padding: "10px", borderRadius: "4px", border: "1px solid #e9ecef" }}>
                  <div style={{ flex: 1 }}>
                    <input 
                      type="text" 
                      value={field.label} 
                      onChange={(e) => updateField(index, "label", e.target.value)} 
                      placeholder="Field Label (e.g. Quantity)"
                      required
                      style={{ width: "100%", padding: "8px", borderRadius: "4px", border: "1px solid #ccc" }}
                    />
                  </div>
                  <div style={{ flex: 1 }}>
                    <input 
                      type="text" 
                      value={field.name} 
                      onChange={(e) => updateField(index, "name", e.target.value)} 
                      placeholder="Variable Name (e.g. quantity)"
                      required
                      style={{ width: "100%", padding: "8px", borderRadius: "4px", border: "1px solid #ccc" }}
                    />
                  </div>
                  <div style={{ width: "150px" }}>
                    <select 
                      value={field.type}
                      onChange={(e) => updateField(index, "type", e.target.value)}
                      style={{ width: "100%", padding: "8px", borderRadius: "4px", border: "1px solid #ccc" }}
                    >
                      <option value="text">Text</option>
                      <option value="number">Number</option>
                      <option value="date">Date</option>
                      <option value="boolean">Yes/No</option>
                    </select>
                  </div>
                  <div style={{ width: "100px", display: "flex", alignItems: "center", gap: "5px" }}>
                    <input 
                      type="checkbox" 
                      checked={field.required} 
                      onChange={(e) => updateField(index, "required", e.target.checked)} 
                      id={`req-${index}`}
                    />
                    <label htmlFor={`req-${index}`} style={{ fontSize: "14px", cursor: "pointer" }}>Required</label>
                  </div>
                  <button 
                    type="button" 
                    onClick={() => removeField(index)}
                    style={{ padding: "8px 12px", background: "#dc3545", color: "white", border: "none", borderRadius: "4px", cursor: "pointer" }}
                  >
                    Delete
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Actions */}
        <div style={{ display: "flex", gap: "10px", justifyContent: "flex-end", marginTop: "20px", borderTop: "1px solid #eee", paddingTop: "20px" }}>
          <button 
            type="button" 
            onClick={onCancel}
            disabled={loading}
            style={{ padding: "10px 20px", background: "#6c757d", color: "white", border: "none", borderRadius: "4px", cursor: "pointer" }}
          >
            Cancel
          </button>
          <button 
            type="submit" 
            disabled={loading}
            style={{ padding: "10px 20px", background: "#007bff", color: "white", border: "none", borderRadius: "4px", cursor: "pointer" }}
          >
            {loading ? "Saving..." : "Save Form Definition"}
          </button>
        </div>
      </form>
    </div>
  );
}
