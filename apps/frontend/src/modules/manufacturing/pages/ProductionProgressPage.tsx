import React, { useState, useRef } from "react";
import * as XLSX from "xlsx";
import { manufacturingApi, ProductionPlanningData } from "../api/manufacturingApi";

function parseExcelDate(val: any): string {
  if (!val) return "";
  if (typeof val === "number") {
    // Excel serial date to JS Date
    const date = new Date(Math.round((val - 25569) * 86400 * 1000));
    return date.toISOString().split("T")[0];
  }
  const d = new Date(val);
  if (!isNaN(d.getTime())) return d.toISOString().split("T")[0];
  
  const parts = String(val).split(/[-/]/);
  if (parts.length === 3) {
     const d2 = new Date(`${parts[2]}-${parts[1]}-${parts[0]}`);
     if (!isNaN(d2.getTime())) return d2.toISOString().split("T")[0];
  }
  return "";
}

export default function ProductionProgressPage() {
  const [formData, setFormData] = useState<ProductionPlanningData | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [selectedFileName, setSelectedFileName] = useState<string | null>(null);
  
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  
  const fileInputRef = useRef<HTMLInputElement>(null);

  const clearFile = () => {
    setFormData(null);
    setSelectedFileName(null);
    setSelectedFile(null);
    setError(null);
    setSuccess(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) {
      clearFile();
      return;
    }

    setSelectedFileName(file.name);
    setSelectedFile(file);
    const reader = new FileReader();
    reader.onload = (evt) => {
      try {
        const data = evt.target?.result;
        const workbook = XLSX.read(data, { type: "binary" });
        const firstSheetName = workbook.SheetNames[0];
        const worksheet = workbook.Sheets[firstSheetName];
        
        // Parse the sheet into array of arrays to find the header row reliably
        const rows: any[][] = XLSX.utils.sheet_to_json(worksheet, { header: 1, defval: "" });
        
        let extractedData: Partial<ProductionPlanningData> = {};

        for (const row of rows) {
          if (!row || row.length === 0) continue;
          
          for (let i = 0; i < row.length; i++) {
            const cellValue = String(row[i] || "").toLowerCase().trim();
            if (!cellValue) continue;

            // Find the value which is usually in the next non-empty column
            let actualValue: any = "";
            for (let j = i + 1; j < row.length; j++) {
              if (String(row[j]).trim() !== "") {
                actualValue = row[j];
                break;
              }
            }

            if (cellValue.includes("factory list") || cellValue.includes("factory")) {
              if (!extractedData.factoryList) extractedData.factoryList = String(actualValue);
            } else if (cellValue.includes("order date")) {
              const parsed = parseExcelDate(actualValue);
              if (parsed && !extractedData.orderDate) extractedData.orderDate = parsed;
            } else if (cellValue.includes("company") || cellValue.includes("client") || cellValue.includes("customer")) {
              if (!extractedData.company) extractedData.company = String(actualValue);
            } else if (cellValue.includes("erp no") || cellValue.includes("erp") || cellValue.includes("erp.")) {
              if (!extractedData.erpNo) extractedData.erpNo = String(actualValue);
            } else if (cellValue.includes("ex-factroy") || cellValue.includes("ex factory") || cellValue.includes("ex-factory")) {
              const parsed = parseExcelDate(actualValue);
              if (parsed && !extractedData.exFactoryDate) extractedData.exFactoryDate = parsed;
            } else if (
              cellValue.includes("total cbm") || 
              cellValue.includes("cbm") || 
              cellValue.includes("c.b.m") || 
              cellValue.includes("volume") || 
              cellValue.includes("vol") || 
              cellValue.includes("m3")
            ) {
              const numericValue = String(actualValue).replace(/[^0-9.-]+/g, "");
              const parsedNum = parseFloat(numericValue);
              // Only set it if we found a valid number, and we haven't already found a valid number (or we want to update it if it was 0)
              if (!isNaN(parsedNum) && parsedNum > 0) {
                 if (!extractedData.totalCbm) {
                   extractedData.totalCbm = parsedNum;
                 }
              }
            }
          }
        }

        if (Object.keys(extractedData).length > 0) {
           setFormData({
             factoryName: file.name,
             factoryList: extractedData.factoryList || "",
             orderDate: extractedData.orderDate || "",
             company: extractedData.company || "",
             erpNo: extractedData.erpNo || "",
             exFactoryDate: extractedData.exFactoryDate || "",
             totalCbm: extractedData.totalCbm || 0,
           });
           setError(null);
        } else {
           setError("Could not find matching labels (Factory List, Order Date, Ex Factory Date, Total CBM) in the file.");
           setFormData(null);
        }
      } catch (err) {
        setError("Failed to parse the Excel file. Please ensure it's a valid format.");
        setFormData(null);
        console.error(err);
      }
    };
    reader.readAsBinaryString(file);
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    if (!formData) return;
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev!,
      [name]: name === "totalCbm" ? parseFloat(value) || 0 : value
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData) return;
    
    setIsSubmitting(true);
    setError(null);
    setSuccess(null);
    
    try {
      const submitData = new FormData();
      Object.entries(formData).forEach(([key, value]) => {
        if (value !== undefined && value !== null) {
          submitData.append(key, String(value));
        }
      });
      if (selectedFile) {
        submitData.append("file", selectedFile);
      }

      await manufacturingApi.createProductionPlan(submitData as any);
      setSuccess("Production Planning saved successfully!");
      setFormData(null); // Clear form on success
      setSelectedFileName(null);
      setSelectedFile(null);
      if (fileInputRef.current) fileInputRef.current.value = "";
    } catch (err: any) {
      const backendError = err.response?.data?.error?.message || err.response?.data?.message;
      setError(backendError || err.message || "Failed to save the plan.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="page-container" style={{ padding: "24px", maxWidth: "800px", margin: "0 auto" }}>
      <h1 style={{ fontSize: "24px", fontWeight: "bold", marginBottom: "24px" }}>Production Progress</h1>
      
      <div style={{ backgroundColor: "#fff", padding: "24px", borderRadius: "8px", boxShadow: "0 1px 3px rgba(0,0,0,0.1)", marginBottom: "24px" }}>
        <h2 style={{ fontSize: "18px", fontWeight: "600", marginBottom: "16px", color: "#2563eb" }}>Upload Excel File</h2>
        <p style={{ color: "#6b7280", marginBottom: "16px", fontSize: "14px" }}>
          Upload an Excel file containing the production plan. The system will automatically extract the data for the first row.
        </p>
        <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
          <input 
            type="file" 
            accept=".xlsx, .xls" 
            onChange={handleFileUpload} 
            ref={fileInputRef}
            style={{ display: "block" }}
          />
          {selectedFileName && (
            <button 
              type="button" 
              onClick={clearFile}
              style={{
                backgroundColor: "#ef4444",
                color: "#fff",
                border: "none",
                borderRadius: "4px",
                padding: "6px 12px",
                fontSize: "12px",
                cursor: "pointer",
                fontWeight: "500"
              }}
            >
              Delete File
            </button>
          )}
        </div>
      </div>

      {error && (
        <div style={{ backgroundColor: "#fee2e2", color: "#b91c1c", padding: "12px", borderRadius: "6px", marginBottom: "24px" }}>
          {error}
        </div>
      )}

      {success && (
        <div style={{ backgroundColor: "#d1fae5", color: "#047857", padding: "12px", borderRadius: "6px", marginBottom: "24px" }}>
          {success}
        </div>
      )}

      {formData && (
        <div style={{ backgroundColor: "#fff", padding: "24px", borderRadius: "8px", boxShadow: "0 1px 3px rgba(0,0,0,0.1)" }}>
          <h2 style={{ fontSize: "20px", fontWeight: "600", marginBottom: "20px", borderBottom: "1px solid #e5e7eb", paddingBottom: "12px" }}>
            Production Planning Form
          </h2>
          
          <form onSubmit={handleSubmit}>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "16px", marginBottom: "16px" }}>

              <div>
                <label style={{ display: "block", marginBottom: "4px", fontSize: "14px", fontWeight: "500", color: "#374151" }}>Factory List</label>
                <input 
                  type="text" 
                  name="factoryName" 
                  value={formData.factoryName} 
                  onChange={handleChange}
                  required
                  style={{ width: "100%", padding: "8px", border: "1px solid #d1d5db", borderRadius: "4px" }}
                />
              </div>

              <div>
                <label style={{ display: "block", marginBottom: "4px", fontSize: "14px", fontWeight: "500", color: "#374151" }}>Factory List No</label>
                <input 
                  type="text" 
                  name="factoryList" 
                  value={formData.factoryList} 
                  onChange={handleChange}
                  required
                  style={{ width: "100%", padding: "8px", border: "1px solid #d1d5db", borderRadius: "4px" }}
                />
              </div>

              <div>
                <label style={{ display: "block", marginBottom: "4px", fontSize: "14px", fontWeight: "500", color: "#374151" }}>Order Date</label>
                <input 
                  type="date" 
                  name="orderDate" 
                  value={formData.orderDate} 
                  onChange={handleChange}
                  required
                  style={{ width: "100%", padding: "8px", border: "1px solid #d1d5db", borderRadius: "4px" }}
                />
              </div>

              <div>
                <label style={{ display: "block", marginBottom: "4px", fontSize: "14px", fontWeight: "500", color: "#374151" }}>Company</label>
                <input 
                  type="text" 
                  name="company" 
                  value={formData.company || ""} 
                  onChange={handleChange}
                  style={{ width: "100%", padding: "8px", border: "1px solid #d1d5db", borderRadius: "4px" }}
                />
              </div>

              <div>
                <label style={{ display: "block", marginBottom: "4px", fontSize: "14px", fontWeight: "500", color: "#374151" }}>Total CBM</label>
                <input 
                  type="number" 
                  step="0.01"
                  name="totalCbm" 
                  value={formData.totalCbm} 
                  onChange={handleChange}
                  required
                  style={{ width: "100%", padding: "8px", border: "1px solid #d1d5db", borderRadius: "4px" }}
                />
              </div>

              <div>
                <label style={{ display: "block", marginBottom: "4px", fontSize: "14px", fontWeight: "500", color: "#374151" }}>ERP No.</label>
                <input 
                  type="text" 
                  name="erpNo" 
                  value={formData.erpNo || ""} 
                  onChange={handleChange}
                  style={{ width: "100%", padding: "8px", border: "1px solid #d1d5db", borderRadius: "4px" }}
                />
              </div>

              <div>
                <label style={{ display: "block", marginBottom: "4px", fontSize: "14px", fontWeight: "500", color: "#374151" }}>Ex Factory Date</label>
                <input 
                  type="date" 
                  name="exFactoryDate" 
                  value={formData.exFactoryDate} 
                  onChange={handleChange}
                  required
                  style={{ width: "100%", padding: "8px", border: "1px solid #d1d5db", borderRadius: "4px" }}
                />
              </div>
            </div>

            <div style={{ display: "flex", justifyContent: "flex-end", marginTop: "24px" }}>
              <button 
                type="submit" 
                disabled={isSubmitting}
                style={{
                  backgroundColor: "#2563eb",
                  color: "#fff",
                  padding: "10px 20px",
                  borderRadius: "6px",
                  fontWeight: "500",
                  border: "none",
                  cursor: isSubmitting ? "not-allowed" : "pointer",
                  opacity: isSubmitting ? 0.7 : 1
                }}
              >
                {isSubmitting ? "Saving..." : "Submit Production Plan"}
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
}
