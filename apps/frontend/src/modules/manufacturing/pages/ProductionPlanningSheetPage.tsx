import React, { useEffect, useState, useRef } from "react";
import * as XLSX from "xlsx";
import { manufacturingApi, ProductionPlanningData, ProductionPlanningRecord } from "../api/manufacturingApi";
import { env } from "../../../config/env";
import { getAssetUrl } from "../../../shared/utils/urlHelper";

// --- Styles ---
const containerStyle: React.CSSProperties = {
  maxWidth: "1200px",
  margin: "40px auto",
  fontFamily: "'Inter', 'Roboto', sans-serif",
  color: "#111827",
  paddingBottom: "60px",
  padding: "0 20px"
};

const headerStyle: React.CSSProperties = {
  display: "flex",
  justifyContent: "space-between",
  alignItems: "center",
  marginBottom: "30px"
};

const titleStyle: React.CSSProperties = {
  fontSize: "28px",
  fontWeight: 700,
  color: "#111827",
  margin: 0
};

const cardStyle: React.CSSProperties = {
  backgroundColor: "#ffffff",
  borderRadius: "16px",
  boxShadow: "0 4px 20px rgba(0,0,0,0.04)",
  border: "1px solid #f3f4f6",
  padding: "24px",
  marginBottom: "24px"
};

const tableContainerStyle: React.CSSProperties = {
  backgroundColor: "#ffffff",
  borderRadius: "16px",
  boxShadow: "0 4px 20px rgba(0,0,0,0.04)",
  border: "1px solid #f3f4f6",
  overflowX: "auto"
};

const tableStyle: React.CSSProperties = {
  width: "100%",
  borderCollapse: "collapse",
  textAlign: "left"
};

const thStyle: React.CSSProperties = {
  padding: "16px 24px",
  backgroundColor: "#f9fafb",
  color: "#6b7280",
  fontSize: "13px",
  fontWeight: 600,
  textTransform: "uppercase",
  letterSpacing: "0.05em",
  borderBottom: "1px solid #e5e7eb",
  whiteSpace: "nowrap"
};

const tdStyle: React.CSSProperties = {
  padding: "16px 24px",
  fontSize: "15px",
  borderBottom: "1px solid #f3f4f6",
  color: "#374151",
  whiteSpace: "nowrap"
};

const emptyMessageStyle: React.CSSProperties = {
  padding: "48px",
  textAlign: "center",
  color: "#6b7280",
  fontSize: "15px"
};

const inputStyle: React.CSSProperties = {
  width: "100%",
  padding: "10px",
  border: "1px solid #d1d5db",
  borderRadius: "6px",
  boxSizing: "border-box"
};

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

const CbmSplitCell = ({ plan, onCbmChange, onVendorNameChange }: { 
  plan: ProductionPlanningRecord; 
  onCbmChange: (id: string, sezCbm: number, sirsiCbm: number, vendorCbm: number, vendorName?: string) => void;
  onVendorNameChange: (id: string, newName: string) => void;
}) => {
  const [editingVendor, setEditingVendor] = useState(false);
  
  const handleLocalChange = (field: 'sez' | 'sirsi' | 'vendor', val: string) => {
    const num = Number(val) || 0;
    const sez = field === 'sez' ? num : Number(plan.sezCbm) || 0;
    const sirsi = field === 'sirsi' ? num : Number(plan.sirsiCbm) || 0;
    const vendor = field === 'vendor' ? num : Number(plan.vendorCbm) || 0;
    onCbmChange(plan.id, sez, sirsi, vendor, plan.vendorName);
  };

  const inputStyles = { width: "100%", padding: "4px 8px", borderRadius: "6px", border: "1px solid #d1d5db", fontSize: "13px", boxSizing: "border-box" as const };
  const labelStyles = { fontSize: "12px", fontWeight: 600, color: "#6b7280", marginBottom: "4px" };

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "12px", minWidth: "200px" }}>
      <div style={{ display: "flex", gap: "8px" }}>
        <div style={{ flex: 1 }}>
          <div style={labelStyles}>SEZ CBM</div>
          <input type="number" step="0.01" min="0" value={plan.sezCbm || 0} onChange={(e) => handleLocalChange('sez', e.target.value)} style={inputStyles} />
        </div>
        <div style={{ flex: 1 }}>
          <div style={labelStyles}>Sirsi CBM</div>
          <input type="number" step="0.01" min="0" value={plan.sirsiCbm || 0} onChange={(e) => handleLocalChange('sirsi', e.target.value)} style={inputStyles} />
        </div>
        <div style={{ flex: 1 }}>
          <div style={labelStyles}>Vendor CBM</div>
          <input type="number" step="0.01" min="0" value={plan.vendorCbm || 0} onChange={(e) => handleLocalChange('vendor', e.target.value)} style={inputStyles} />
        </div>
      </div>
      
      {(Number(plan.vendorCbm) > 0) && (
        <div style={{ padding: "8px", backgroundColor: "#f9fafb", borderRadius: "8px", border: "1px solid #e5e7eb" }}>
          <div style={labelStyles}>Vendor Name</div>
          {plan.vendorName && !editingVendor ? (
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", backgroundColor: "#fff", padding: "6px 8px", borderRadius: "6px", border: "1px solid #d1d5db" }}>
              <span style={{ fontSize: "13px", color: "#374151", fontWeight: 500 }}>{plan.vendorName}</span>
              <button onClick={() => setEditingVendor(true)} style={{ background: "transparent", border: "none", color: "#2563eb", cursor: "pointer", fontSize: "12px", fontWeight: 600 }}>Edit</button>
            </div>
          ) : (
            <input 
              type="text" 
              placeholder="Enter Vendor Name" 
              value={plan.vendorName || ""}
              onChange={(e) => onVendorNameChange(plan.id, e.target.value)}
              onBlur={(e) => {
                onCbmChange(plan.id, Number(plan.sezCbm) || 0, Number(plan.sirsiCbm) || 0, Number(plan.vendorCbm) || 0, e.target.value);
                setEditingVendor(false);
              }}
              autoFocus={editingVendor}
              style={inputStyles}
            />
          )}
        </div>
      )}
    </div>
  );
};

const ProcessCbmCell = ({ plan, onProcessChange }: {
  plan: ProductionPlanningRecord;
  onProcessChange: (id: string, machineShopCbm: number, assemblyCbm: number, sandingCbm: number, finishingCbm: number, packingCbm: number) => void;
}) => {
  const handleLocalChange = (field: 'machine' | 'assembly' | 'sanding' | 'finishing' | 'packing', val: string) => {
    const num = Number(val) || 0;
    const machine = field === 'machine' ? num : Number(plan.machineShopCbm) || 0;
    const assembly = field === 'assembly' ? num : Number(plan.assemblyCbm) || 0;
    const sanding = field === 'sanding' ? num : Number(plan.sandingCbm) || 0;
    const finishing = field === 'finishing' ? num : Number(plan.finishingCbm) || 0;
    const packing = field === 'packing' ? num : Number(plan.packingCbm) || 0;
    onProcessChange(plan.id, machine, assembly, sanding, finishing, packing);
  };

  const inputStyles = { width: "100%", padding: "4px 8px", borderRadius: "6px", border: "1px solid #d1d5db", fontSize: "13px", boxSizing: "border-box" as const, minWidth: "60px" };
  const labelStyles = { fontSize: "12px", fontWeight: 600, color: "#6b7280", marginBottom: "4px" };

  return (
    <div style={{ display: "flex", gap: "8px", minWidth: "300px" }}>
      <div style={{ flex: 1 }}>
        <div style={labelStyles}>Machine Shop</div>
        <input type="number" step="0.01" min="0" value={plan.machineShopCbm || 0} onChange={(e) => handleLocalChange('machine', e.target.value)} style={inputStyles} />
      </div>
      <div style={{ flex: 1 }}>
        <div style={labelStyles}>Assembly</div>
        <input type="number" step="0.01" min="0" value={plan.assemblyCbm || 0} onChange={(e) => handleLocalChange('assembly', e.target.value)} style={inputStyles} />
      </div>
      <div style={{ flex: 1 }}>
        <div style={labelStyles}>Sanding</div>
        <input type="number" step="0.01" min="0" value={plan.sandingCbm || 0} onChange={(e) => handleLocalChange('sanding', e.target.value)} style={inputStyles} />
      </div>
      <div style={{ flex: 1 }}>
        <div style={labelStyles}>Finishing</div>
        <input type="number" step="0.01" min="0" value={plan.finishingCbm || 0} onChange={(e) => handleLocalChange('finishing', e.target.value)} style={inputStyles} />
      </div>
      <div style={{ flex: 1 }}>
        <div style={labelStyles}>Packing</div>
        <input type="number" step="0.01" min="0" value={plan.packingCbm || 0} onChange={(e) => handleLocalChange('packing', e.target.value)} style={inputStyles} />
      </div>
    </div>
  );
};

export default function ProductionPlanningSheetPage() {
  const [plans, setPlans] = useState<ProductionPlanningRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsUploading(true);
    const reader = new FileReader();
    reader.onload = async (evt) => {
      try {
        const data = evt.target?.result;
        const workbook = XLSX.read(data, { type: "binary" });
        const firstSheetName = workbook.SheetNames[0];
        const worksheet = workbook.Sheets[firstSheetName];
        const rows: any[][] = XLSX.utils.sheet_to_json(worksheet, { header: 1, defval: "" });
        
        let extractedData: Partial<ProductionPlanningData> = {};

        for (const row of rows) {
          if (!row || row.length === 0) continue;
          for (let i = 0; i < row.length; i++) {
            const cellValue = String(row[i] || "").toLowerCase().trim();
            if (!cellValue) continue;

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
              cellValue.includes("volume")
            ) {
              const numericValue = String(actualValue).replace(/[^0-9.-]+/g, "");
              const parsedNum = parseFloat(numericValue);
              if (!isNaN(parsedNum) && parsedNum > 0 && !extractedData.totalCbm) {
                extractedData.totalCbm = parsedNum;
              }
            }
          }
        }

        if (!extractedData.factoryList || !extractedData.orderDate) {
          alert("Could not extract required fields (Factory List, Order Date) from the file.");
          setIsUploading(false);
          if (fileInputRef.current) fileInputRef.current.value = "";
          return;
        }

        const submitData = new FormData();
        submitData.append("factoryName", file.name);
        submitData.append("factoryList", extractedData.factoryList);
        submitData.append("orderDate", extractedData.orderDate);
        submitData.append("company", extractedData.company || "");
        submitData.append("erpNo", extractedData.erpNo || "");
        submitData.append("exFactoryDate", extractedData.exFactoryDate || "");
        submitData.append("totalCbm", String(extractedData.totalCbm || 0));
        submitData.append("file", file);

        await manufacturingApi.createProductionPlan(submitData as any);
        await loadPlans();
      } catch (err) {
        console.error("Failed to parse and upload:", err);
        alert("Failed to upload production plan.");
      } finally {
        setIsUploading(false);
        if (fileInputRef.current) fileInputRef.current.value = "";
      }
    };
    reader.readAsBinaryString(file);
  };

  const loadPlans = async () => {
    try {
      setLoading(true);
      const data: any = await manufacturingApi.getProductionPlans();
      // Ensure data is array
      setPlans(Array.isArray(data?.data) ? data.data : (Array.isArray(data) ? data : []));
    } catch (err) {
      console.error("Failed to load production plans:", err);
      setError("Failed to load production plans.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadPlans();
  }, []);

  const handleDelete = async (id: string) => {
    if (!window.confirm("Are you sure you want to delete this production plan?")) return;
    try {
      await manufacturingApi.deleteProductionPlan(id);
      await loadPlans(); // Refresh the list
    } catch (err) {
      console.error("Failed to delete plan:", err);
      alert("Failed to delete the plan. Please try again.");
    }
  };

  const formatDate = (dateStr: string) => {
    if (!dateStr) return "-";
    try {
      const d = new Date(dateStr);
      if (isNaN(d.getTime())) return dateStr;
      return d.toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' });
    } catch (e) {
      return dateStr;
    }
  };

  const handleCbmChange = async (id: string, sezCbm: number, sirsiCbm: number, vendorCbm: number, vendorName?: string) => {
    try {
      await manufacturingApi.updateCbmSplit(id, sezCbm, sirsiCbm, vendorCbm, vendorName);
      setPlans(prev => prev.map(p => {
        if (p.id === id) {
          return { ...p, sezCbm, sirsiCbm, vendorCbm, vendorName: vendorName || undefined };
        }
        return p;
      }));
    } catch (err) {
      console.error("Failed to update CBM split:", err);
      alert("Failed to update CBM split.");
    }
  };

  const handleProcessCbmChange = async (id: string, machineShopCbm: number, assemblyCbm: number, sandingCbm: number, finishingCbm: number, packingCbm: number) => {
    try {
      await manufacturingApi.updateProcessCbm(id, machineShopCbm, assemblyCbm, sandingCbm, finishingCbm, packingCbm);
      setPlans(prev => prev.map(p => {
        if (p.id === id) {
          return { ...p, machineShopCbm, assemblyCbm, sandingCbm, finishingCbm, packingCbm };
        }
        return p;
      }));
    } catch (err) {
      console.error("Failed to update process CBM:", err);
      alert("Failed to update process CBM.");
    }
  };

  const handleVendorNameChange = (id: string, newName: string) => {
    setPlans(prev => prev.map(p => {
      if (p.id === id) {
        return { ...p, vendorName: newName };
      }
      return p;
    }));
  };

  const totalCbmSum = plans.reduce((sum, plan) => {
    return sum + (Number(plan.totalCbm) || 0);
  }, 0);

  return (
    <div style={containerStyle}>
      <div style={headerStyle}>
        <h1 style={titleStyle}>Production Planning Sheet</h1>
      </div>

      <div style={{ display: "flex", justifyContent: "flex-end", alignItems: "center", marginBottom: "24px", gap: "16px" }}>
        <input 
          type="file" 
          accept=".xlsx, .xls, image/*" 
          onChange={handleFileUpload} 
          ref={fileInputRef}
          style={{ display: "none" }}
        />
        <button 
          onClick={() => fileInputRef.current?.click()}
          disabled={isUploading}
          style={{
            padding: "12px 24px",
            backgroundColor: "#2563eb",
            color: "#ffffff",
            borderRadius: "8px",
            fontWeight: "600",
            fontSize: "15px",
            border: "none",
            cursor: isUploading ? "not-allowed" : "pointer",
            boxShadow: "0 2px 10px rgba(37, 99, 235, 0.2)",
            opacity: isUploading ? 0.8 : 1,
            transition: "all 0.2s"
          }}
        >
          {isUploading ? "Uploading..." : "Upload Sheet/Image"}
        </button>
        <div style={{ padding: "12px 24px", backgroundColor: "#f0fdf4", color: "#166534", borderRadius: "8px", fontWeight: "600", fontSize: "16px", whiteSpace: "nowrap", border: "1px solid #bbf7d0" }}>
          Total CBM: {totalCbmSum.toFixed(2)}
        </div>
      </div>

      {/* List Section */}
      <div style={tableContainerStyle}>
        {loading ? (
          <div style={emptyMessageStyle}>Loading production plans...</div>
        ) : error ? (
          <div style={emptyMessageStyle}>{error}</div>
        ) : plans.length === 0 ? (
          <div style={emptyMessageStyle}>No production plans found.</div>
        ) : (
          <table style={tableStyle}>
            <thead>
              <tr>
                <th style={thStyle}>Factory List</th>
                <th style={thStyle}>Factory List No</th>
                <th style={thStyle}>Order Date</th>
                <th style={thStyle}>Company</th>
                <th style={thStyle}>Total CBM</th>
                <th style={thStyle}>ERP No.</th>
                <th style={thStyle}>Ex-Factory Date</th>
                <th style={thStyle}>CBM Split</th>
                <th style={thStyle}>Process</th>
                <th style={thStyle}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {(Array.isArray(plans) ? plans : []).map((plan, idx) => (
                <tr key={idx} style={{ transition: "background-color 0.2s" }} onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = "#f9fafb")} onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = "transparent")}>
                  <td style={{ ...tdStyle, fontWeight: 500, color: "#111827" }}>
                    {plan.attachmentUrl ? (
                      <a 
                        href={getAssetUrl(plan.attachmentUrl)} 
                        target="_blank" 
                        rel="noreferrer"
                        style={{ color: "#2563eb", textDecoration: "underline", textUnderlineOffset: "4px" }}
                      >
                        {plan.factoryName || "-"}
                      </a>
                    ) : (
                      plan.factoryName || "-"
                    )}
                  </td>
                  <td style={tdStyle}>{plan.factoryList || "-"}</td>
                  <td style={tdStyle}>{formatDate(plan.orderDate)}</td>
                  <td style={tdStyle}>{plan.company || "-"}</td>
                  <td style={tdStyle}><strong style={{ color: "#2563eb" }}>{plan.totalCbm != null ? Number(plan.totalCbm).toFixed(2) : "-"}</strong></td>
                  <td style={tdStyle}>{plan.erpNo || "-"}</td>
                  <td style={tdStyle}>{formatDate(plan.exFactoryDate)}</td>
                  <td style={tdStyle}>
                    <CbmSplitCell 
                      plan={plan} 
                      onCbmChange={handleCbmChange} 
                      onVendorNameChange={handleVendorNameChange} 
                    />
                  </td>
                  <td style={tdStyle}>
                    <ProcessCbmCell 
                      plan={plan} 
                      onProcessChange={handleProcessCbmChange} 
                    />
                  </td>
                  <td style={tdStyle}>
                    <button 
                      onClick={() => handleDelete(plan.id)}
                      style={{
                        backgroundColor: "#fee2e2",
                        color: "#dc2626",
                        border: "none",
                        padding: "4px 8px",
                        borderRadius: "4px",
                        fontSize: "12px",
                        fontWeight: 500,
                        cursor: "pointer"
                      }}
                    >
                      Delete
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}
