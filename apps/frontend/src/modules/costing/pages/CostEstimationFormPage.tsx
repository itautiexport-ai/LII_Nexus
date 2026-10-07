import React, { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { costingApi, CostEstimationItem, CostRateMaster } from "../api/costingApi";
import { masterDataApi, WoodType } from "../../admin/masterdata/api/masterDataApi";

export interface MetalSsItem {
  type: "Metal" | "SS";
  size: string;
  qty: number | "";
  weight: number | "";
  rate: number | "";
}

export interface WoodCostingItem {
  wood_part_name: string;
  length_ft: number | "";
  width_in: number | "";
  thick_in: number | "";
  pcs: number | "";
  rate: number | "";
}

export interface AdditionalCostItem {
  additional: string;
  size: string;
  calculation: string;
  price: number | "";
}

export interface ExpenseCostItem {
  item_name: string;
  amount: number | "";
}

export interface CncCostItem {
  item_name: string;
  timing: string;
  cost: number | "";
}

export default function CostEstimationFormPage() {
  const navigate = useNavigate();
  const { id } = useParams<{ id?: string }>();
  const isEdit = Boolean(id);

  const [loading, setLoading] = useState(false);
  const [rates, setRates] = useState<CostRateMaster[]>([]);
  const [woodTypesList, setWoodTypesList] = useState<WoodType[]>([]);

  // Form State
  const [title, setTitle] = useState("");
  const [productCode, setProductCode] = useState("");
  const [productName, setProductName] = useState("");
  const [overallSize, setOverallSize] = useState("");
  const [woodType, setWoodType] = useState("");
  const [clientName, setClientName] = useState("");
  const [status, setStatus] = useState<'Draft' | 'In Review' | 'Approved' | 'Rejected'>("Draft");
  const [currency, setCurrency] = useState("INR");
  const [exchangeRate, setExchangeRate] = useState(1.0);
  const [marginPercentage, setMarginPercentage] = useState(20);
  const [taxPercentage, setTaxPercentage] = useState(18);
  const [factoryExpensesPct, setFactoryExpensesPct] = useState(10);
  const [notes, setNotes] = useState("");
  const [woodWastagePct, setWoodWastagePct] = useState(10);
  const [imageUrl, setImageUrl] = useState("");

  // Section 7: CBM & Packaging State
  const [c1Length, setC1Length] = useState<number | "">("");
  const [c1Width, setC1Width] = useState<number | "">("");
  const [c1Height, setC1Height] = useState<number | "">("");
  const [c1Unit, setC1Unit] = useState<"cm" | "in">("cm");

  const [c2Length, setC2Length] = useState<number | "">("");
  const [c2Width, setC2Width] = useState<number | "">("");
  const [c2Height, setC2Height] = useState<number | "">("");
  const [c2Unit, setC2Unit] = useState<"cm" | "in">("cm");

  const [items, setItems] = useState<CostEstimationItem[]>([]);

  const [woodItems, setWoodItems] = useState<WoodCostingItem[]>([
    { wood_part_name: "", length_ft: "", width_in: "", thick_in: "", pcs: 1, rate: 0 },
  ]);

  const handleAddWoodItem = () => {
    setWoodItems([
      ...woodItems,
      { wood_part_name: "", length_ft: "", width_in: "", thick_in: "", pcs: 1, rate: 0 },
    ]);
  };

  const handleRemoveWoodItem = (index: number) => {
    if (woodItems.length === 1) return;
    setWoodItems(woodItems.filter((_, i) => i !== index));
  };

  const handleWoodItemChange = (index: number, field: keyof WoodCostingItem, value: any) => {
    const updated = [...woodItems];
    updated[index] = { ...updated[index], [field]: value };
    setWoodItems(updated);
  };

  const [metalSsItems, setMetalSsItems] = useState<MetalSsItem[]>([
    { type: "Metal", size: "", qty: 1, weight: 0, rate: 0 },
  ]);

  const handleAddMetalSsItem = () => {
    setMetalSsItems([
      ...metalSsItems,
      { type: "Metal", size: "", qty: 1, weight: 0, rate: 0 },
    ]);
  };

  const handleRemoveMetalSsItem = (index: number) => {
    if (metalSsItems.length === 1) return;
    setMetalSsItems(metalSsItems.filter((_, i) => i !== index));
  };

  const handleMetalSsItemChange = (index: number, field: keyof MetalSsItem, value: any) => {
    const updated = [...metalSsItems];
    updated[index] = { ...updated[index], [field]: value };
    setMetalSsItems(updated);
  };

  const [additionalItems, setAdditionalItems] = useState<AdditionalCostItem[]>([
    { additional: "Hardware", size: "", calculation: "", price: 0 },
    { additional: "Reclaimed", size: "", calculation: "", price: 0 },
    { additional: "Metal clading", size: "", calculation: "", price: 0 },
    { additional: "Leather", size: "", calculation: "", price: 0 },
    { additional: "Bone", size: "", calculation: "", price: 0 },
  ]);

  const handleAddAdditionalItem = () => {
    setAdditionalItems([
      ...additionalItems,
      { additional: "", size: "", calculation: "", price: 0 },
    ]);
  };

  const handleRemoveAdditionalItem = (index: number) => {
    if (additionalItems.length === 1) return;
    setAdditionalItems(additionalItems.filter((_, i) => i !== index));
  };

  const handleAdditionalItemChange = (index: number, field: keyof AdditionalCostItem, value: any) => {
    const updated = [...additionalItems];
    updated[index] = { ...updated[index], [field]: value };
    setAdditionalItems(updated);
  };

  const [expenseItems, setExpenseItems] = useState<ExpenseCostItem[]>([
    { item_name: "Labour", amount: 0 },
    { item_name: "Expenses", amount: 0 },
    { item_name: "Polish Labour", amount: 0 },
    { item_name: "Polish Material", amount: 0 },
    { item_name: "Packing", amount: 0 },
    { item_name: "Forwarding", amount: 0 },
  ]);

  const handleAddExpenseItem = () => {
    setExpenseItems([
      ...expenseItems,
      { item_name: "", amount: 0 },
    ]);
  };

  const handleRemoveExpenseItem = (index: number) => {
    if (expenseItems.length === 1) return;
    setExpenseItems(expenseItems.filter((_, i) => i !== index));
  };

  const handleExpenseItemChange = (index: number, field: keyof ExpenseCostItem, value: any) => {
    const updated = [...expenseItems];
    updated[index] = { ...updated[index], [field]: value };
    setExpenseItems(updated);
  };

  const [cncItems, setCncItems] = useState<CncCostItem[]>([
    { item_name: "CNC", timing: "", cost: 0 },
    { item_name: "Additional Cost", timing: "", cost: 0 },
  ]);

  const handleAddCncItem = () => {
    setCncItems([
      ...cncItems,
      { item_name: "", timing: "", cost: 0 },
    ]);
  };

  const handleRemoveCncItem = (index: number) => {
    if (cncItems.length === 1) return;
    setCncItems(cncItems.filter((_, i) => i !== index));
  };

  const handleCncItemChange = (index: number, field: keyof CncCostItem, value: any) => {
    const updated = [...cncItems];
    updated[index] = { ...updated[index], [field]: value };
    setCncItems(updated);
  };

  useEffect(() => {
    loadStandardRates();
    if (isEdit && id) {
      loadEstimation(id);
    }
  }, [id]);

  const loadStandardRates = async () => {
    try {
      const [ratesData, woodData] = await Promise.all([
        costingApi.getAllRates(),
        masterDataApi.getWoodTypes(),
      ]);
      setRates(ratesData);
      setWoodTypesList(woodData || []);
    } catch (err) {
      console.error("Failed to load rates or wood types", err);
    }
  };

  const loadEstimation = async (estId: string) => {
    setLoading(true);
    try {
      const est = await costingApi.getEstimationById(estId);
      setTitle(est.title || est.product_name || "");
      setProductCode(est.product_code || "");
      setProductName(est.product_name || est.title || "");
      setOverallSize(est.overall_size || "");
      setWoodType(est.wood_type || "");
      setClientName(est.client_name || "");
      setStatus(est.status || "Draft");
      setCurrency(est.currency || "INR");
      setExchangeRate(est.exchange_rate || 1.0);
      setMarginPercentage(est.margin_percentage ?? 20);
      setTaxPercentage(est.tax_percentage ?? 18);
      setNotes(est.notes || "");
      if (est.items && est.items.length > 0) {
        setItems(est.items);
      }
    } catch (err) {
      alert("Failed to load estimation detail");
    } finally {
      setLoading(false);
    }
  };

  const handleAddItem = () => {
    setItems([
      ...items,
      { category: "Raw Material", item_name: "", quantity: 1, unit_of_measure: "Pcs", unit_cost: 0 },
    ]);
  };

  const handleRemoveItem = (index: number) => {
    if (items.length === 1) return;
    setItems(items.filter((_, i) => i !== index));
  };

  const handleItemChange = (index: number, field: keyof CostEstimationItem, value: any) => {
    const updated = [...items];
    updated[index] = { ...updated[index], [field]: value };
    setItems(updated);
  };

  const handleRateSelect = (index: number, rateId: string) => {
    const selectedRate = rates.find((r) => r.id === rateId);
    if (!selectedRate) return;
    const updated = [...items];
    updated[index] = {
      ...updated[index],
      item_name: selectedRate.item_name,
      category: (selectedRate.category as any) || "Raw Material",
      unit_of_measure: selectedRate.unit_of_measure || "Pcs",
      unit_cost: selectedRate.rate || 0,
    };
    setItems(updated);
  };

  // Calculations
  const calculateTotals = () => {
    let materialCost = 0;
    let laborCost = 0;
    let finishingCost = 0;
    let packagingCost = 0;
    let overheadCost = 0;

    items.forEach((item) => {
      const q = Number(item.quantity) || 0;
      const uc = Number(item.unit_cost) || 0;
      const total = q * uc;

      switch (item.category) {
        case "Raw Material":
        case "Hardware":
          materialCost += total;
          break;
        case "Labor":
          laborCost += total;
          break;
        case "Finishing":
          finishingCost += total;
          break;
        case "Packaging":
          packagingCost += total;
          break;
        case "Overhead":
        case "Other":
          overheadCost += total;
          break;
        default:
          materialCost += total;
          break;
      }
    });

    const subtotal = materialCost + laborCost + finishingCost + packagingCost + overheadCost;
    const marginAmount = (subtotal * marginPercentage) / 100;
    const priceBeforeTax = subtotal + marginAmount;
    const taxAmount = (priceBeforeTax * taxPercentage) / 100;
    const finalPrice = priceBeforeTax + taxAmount;

    return {
      materialCost,
      laborCost,
      finishingCost,
      packagingCost,
      overheadCost,
      subtotal,
      marginAmount,
      taxAmount,
      finalPrice,
    };
  };

  const totals = calculateTotals();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const finalProdName = productName || title;
    if (!finalProdName.trim()) {
      alert("Please enter product name");
      return;
    }

    const payload = {
      title: finalProdName,
      product_code: productCode,
      product_name: productName,
      overall_size: overallSize,
      wood_type: woodType,
      client_name: clientName,
      status,
      currency,
      exchange_rate: Number(exchangeRate),
      margin_percentage: Number(marginPercentage),
      tax_percentage: Number(taxPercentage),
      notes,
      items: [
        ...woodItems.map((w) => {
          const l = Number(w.length_ft) || 0;
          const wi = Number(w.width_in) || 0;
          const t = Number(w.thick_in) || 0;
          const pcs = Number(w.pcs) || 0;
          const r = Number(w.rate) || 0;
          const cft = (l * wi * t * pcs) / 144;
          const amt = cft * r;
          return {
            category: "Raw Material" as const,
            item_name: w.wood_part_name || "Wood Part",
            specification: `L:${l}ft, W:${wi}in, T:${t}in, Pcs:${pcs}, Cft:${cft.toFixed(3)}`,
            quantity: cft > 0 ? Number(cft.toFixed(3)) : pcs,
            unit_of_measure: "Cft",
            unit_cost: r,
            remarks: `Wood Amount: ₹${amt.toFixed(2)}`,
          };
        }),
        ...metalSsItems.map((m) => {
          const q = Number(m.qty) || 0;
          const w = Number(m.weight) || 0;
          const r = Number(m.rate) || 0;
          const tw = q * w;
          const totalAmt = tw > 0 ? tw * r : q * r;
          return {
            category: "Raw Material" as const,
            item_name: `${m.type} (${m.size || "Standard"})`,
            specification: `Type: ${m.type}, Size: ${m.size}, Weight: ${w}kg, Total Weight: ${tw}kg`,
            quantity: q,
            unit_of_measure: "Kg",
            unit_cost: tw > 0 ? w * r : r,
            remarks: `Total Amount: ₹${totalAmt.toFixed(2)}`,
          };
        }),
        ...additionalItems.map((a) => {
          const p = Number(a.price) || 0;
          return {
            category: "Other" as const,
            item_name: a.additional || "Additional Item",
            specification: `Size: ${a.size || "-"}, Calc: ${a.calculation || "-"}`,
            quantity: 1,
            unit_of_measure: "Pcs",
            unit_cost: p,
            remarks: `Price: ₹${p.toFixed(2)}`,
          };
        }),
        ...expenseItems.map((e) => {
          const amt = Number(e.amount) || 0;
          const name = e.item_name || "Expense Item";
          return {
            category: (name.toLowerCase().includes("labour") ? "Labor" : name.toLowerCase().includes("pack") ? "Packaging" : "Overhead") as any,
            item_name: name,
            specification: `Direct Expense`,
            quantity: 1,
            unit_of_measure: "Pcs",
            unit_cost: amt,
            remarks: `Amount: ₹${amt.toFixed(2)}`,
          };
        }),
        ...cncItems.map((c) => {
          const cost = Number(c.cost) || 0;
          const name = c.item_name || "CNC / Machine";
          return {
            category: "Labor" as const,
            item_name: name,
            specification: `Timing: ${c.timing || "-"}`,
            quantity: 1,
            unit_of_measure: "Pcs",
            unit_cost: cost,
            remarks: `Cost: ₹${cost.toFixed(2)}`,
          };
        }),
      ],
    };

    setLoading(true);
    try {
      if (isEdit && id) {
        await costingApi.updateEstimation(id, payload);
        alert("Cost estimation updated successfully!");
      } else {
        await costingApi.createEstimation(payload);
        alert("Cost estimation created successfully!");
      }
      navigate("/admin/costing/new");
    } catch (err) {
      alert("Failed to save estimation");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ padding: 24, maxWidth: 1280, margin: "0 auto" }}>
      <style>{`
        /* Hide HTML number input spinners (up/down arrows) */
        input[type=number]::-webkit-outer-spin-button,
        input[type=number]::-webkit-inner-spin-button {
          -webkit-appearance: none !important;
          margin: 0 !important;
        }
        input[type=number] {
          -moz-appearance: textfield !important;
        }
      `}</style>
      {/* Header */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 24 }}>
        <div>
          <h1 style={{ fontSize: 24, fontWeight: 700, color: "#111827", margin: 0 }}>
            {isEdit ? "Edit Costing" : "Create New Costing"}
          </h1>
        </div>
        <button
          onClick={() => navigate("/admin/costing/new")}
          style={{
            padding: "8px 16px",
            background: "#ffffff",
            border: "1px solid #d1d5db",
            borderRadius: 6,
            fontWeight: 500,
            cursor: "pointer",
          }}
        >
          Cancel
        </button>
      </div>

      <form onSubmit={handleSubmit}>
        {/* Basic Details Card */}
        <div style={{ background: "#ffffff", borderRadius: 8, border: "1px solid #e5e7eb", padding: 20, marginBottom: 24 }}>
          <h3 style={{ fontSize: 16, fontWeight: 600, color: "#111827", marginTop: 0, marginBottom: 16 }}>
            1. Product Details
          </h3>

          {/* Product Image Upload Section */}
          <div style={{ marginBottom: 20 }}>
            <label style={{ display: "block", fontSize: 13, fontWeight: 600, color: "#374151", marginBottom: 8 }}>
              Product Image
            </label>

            {imageUrl ? (
              <div style={{ position: "relative", width: "100%", maxHeight: "260px", borderRadius: 8, overflow: "hidden", border: "1px solid #e2e8f0", background: "#f8fafc", textAlign: "center", padding: 12 }}>
                <img
                  src={imageUrl}
                  alt="Product Preview"
                  style={{ maxHeight: "230px", maxWidth: "100%", objectFit: "contain", borderRadius: 6, display: "block", margin: "0 auto" }}
                />
                <button
                  type="button"
                  onClick={() => setImageUrl("")}
                  style={{
                    position: "absolute",
                    top: 14,
                    right: 14,
                    background: "#dc2626",
                    color: "#ffffff",
                    border: "none",
                    borderRadius: 6,
                    padding: "6px 12px",
                    fontSize: 12,
                    fontWeight: 600,
                    cursor: "pointer",
                    boxShadow: "0 2px 4px rgba(0,0,0,0.15)",
                  }}
                >
                  ✕ Remove Image
                </button>
              </div>
            ) : (
              <label
                style={{
                  display: "flex",
                  flexDirection: "column",
                  alignItems: "center",
                  justifyContent: "center",
                  height: "170px",
                  border: "2px dashed #cbd5e1",
                  borderRadius: 8,
                  background: "#f8fafc",
                  cursor: "pointer",
                  transition: "all 0.2s ease",
                }}
              >
                <div style={{ fontSize: 36, marginBottom: 8 }}>📷</div>
                <span style={{ fontSize: 14, fontWeight: 600, color: "#2563eb", marginBottom: 4 }}>
                  Click to Upload Product Image
                </span>
                <span style={{ fontSize: 12, color: "#64748b" }}>
                  Upload image file (PNG, JPG, WEBP, GIF)
                </span>
                <input
                  type="file"
                  accept="image/*"
                  style={{ display: "none" }}
                  onChange={(e) => {
                    const file = e.target.files?.[0];
                    if (file) {
                      const reader = new FileReader();
                      reader.onloadend = () => {
                        setImageUrl(reader.result as string);
                      };
                      reader.readAsDataURL(file);
                    }
                  }}
                />
              </label>
            )}
          </div>
          <div style={{ display: "flex", flexWrap: "wrap", gap: "20px", width: "100%" }}>
            <div style={{ flex: "1 1 280px", minWidth: "280px" }}>
              <label style={{ display: "block", fontSize: 13, fontWeight: 500, color: "#374151", marginBottom: 6 }}>
                Product Code
              </label>
              <input
                type="text"
                value={productCode}
                onChange={(e) => setProductCode(e.target.value)}
                style={{ width: "100%", boxSizing: "border-box", padding: "10px 14px", border: "1px solid #d1d5db", borderRadius: 6, fontSize: 14 }}
              />
            </div>

            <div style={{ flex: "1 1 280px", minWidth: "280px" }}>
              <label style={{ display: "block", fontSize: 13, fontWeight: 500, color: "#374151", marginBottom: 6 }}>
                Product Name *
              </label>
              <input
                type="text"
                required
                value={productName}
                onChange={(e) => {
                  setProductName(e.target.value);
                  setTitle(e.target.value);
                }}
                style={{ width: "100%", boxSizing: "border-box", padding: "10px 14px", border: "1px solid #d1d5db", borderRadius: 6, fontSize: 14 }}
              />
            </div>

            <div style={{ flex: "1 1 280px", minWidth: "280px" }}>
              <label style={{ display: "block", fontSize: 13, fontWeight: 500, color: "#374151", marginBottom: 6 }}>
                Overall Size
              </label>
              <input
                type="text"
                value={overallSize}
                onChange={(e) => setOverallSize(e.target.value)}
                style={{ width: "100%", boxSizing: "border-box", padding: "10px 14px", border: "1px solid #d1d5db", borderRadius: 6, fontSize: 14 }}
              />
            </div>

            <div style={{ flex: "1 1 350px", minWidth: "320px" }}>
              <label style={{ display: "block", fontSize: 14, fontWeight: 600, color: "#111827", marginBottom: 6 }}>
                Wood Type
              </label>
              <select
                value={woodType}
                onChange={(e) => setWoodType(e.target.value)}
                style={{
                  width: "100%",
                  height: "46px",
                  boxSizing: "border-box",
                  padding: "10px 14px",
                  border: "2px solid #2563eb",
                  borderRadius: 6,
                  fontSize: "15px",
                  fontWeight: 600,
                  color: "#111827",
                  backgroundColor: "#ffffff",
                  cursor: "pointer",
                }}
              >
                <option value="" style={{ color: "#4b5563", backgroundColor: "#ffffff" }}>-- Select Wood Type --</option>
                {woodTypesList.map((wt) => (
                  <option key={wt.id} value={wt.name} style={{ color: "#111827", backgroundColor: "#ffffff", fontSize: "15px", padding: "8px" }}>
                    {wt.name}
                  </option>
                ))}
              </select>
            </div>

            <div style={{ flex: "1 1 280px", minWidth: "280px" }}>
              <label style={{ display: "block", fontSize: 13, fontWeight: 500, color: "#374151", marginBottom: 6 }}>
                Client / Customer Name
              </label>
              <input
                type="text"
                value={clientName}
                onChange={(e) => setClientName(e.target.value)}
                style={{ width: "100%", boxSizing: "border-box", padding: "10px 14px", border: "1px solid #d1d5db", borderRadius: 6, fontSize: 14 }}
              />
            </div>
          </div>
        </div>

        {/* Dynamic Items Table */}
        <div style={{ background: "#ffffff", borderRadius: 8, border: "1px solid #e5e7eb", padding: 20, marginBottom: 24 }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16 }}>
            <h3 style={{ fontSize: 16, fontWeight: 600, color: "#111827", margin: 0 }}>
              2. Wood Costing
            </h3>
            <button
              type="button"
              onClick={handleAddWoodItem}
              style={{
                padding: "6px 14px",
                background: "#eff6ff",
                color: "#2563eb",
                border: "1px solid #bfdbfe",
                borderRadius: 6,
                fontWeight: 600,
                fontSize: 13,
                cursor: "pointer",
              }}
            >
              + Add Item Line
            </button>
          </div>

          <table data-no-enhance="true" style={{ width: "100%", borderCollapse: "collapse", textAlign: "left" }}>
            <thead>
              <tr style={{ background: "#f9fafb", borderBottom: "1px solid #e5e7eb" }}>
                <th style={{ padding: "10px 12px", fontSize: 12, color: "#6b7280" }}>Wood part name</th>
                <th style={{ padding: "10px 12px", fontSize: 12, color: "#6b7280" }}>Length(ft)</th>
                <th style={{ padding: "10px 12px", fontSize: 12, color: "#6b7280" }}>Width(in.)</th>
                <th style={{ padding: "10px 12px", fontSize: 12, color: "#6b7280" }}>thick.(in.)</th>
                <th style={{ padding: "10px 12px", fontSize: 12, color: "#6b7280" }}>Pcs</th>
                <th style={{ padding: "10px 12px", fontSize: 12, color: "#6b7280" }}>Cft</th>
                <th style={{ padding: "10px 12px", fontSize: 12, color: "#6b7280" }}>Rate</th>
                <th style={{ padding: "10px 12px", fontSize: 12, color: "#6b7280" }}>Amount</th>
                <th style={{ padding: "10px 12px", fontSize: 12, color: "#6b7280" }}>Action</th>
              </tr>
            </thead>
            <tbody>
              {woodItems.map((item, idx) => {
                const l = Number(item.length_ft) || 0;
                const w = Number(item.width_in) || 0;
                const t = Number(item.thick_in) || 0;
                const pcs = Number(item.pcs) || 0;
                const r = Number(item.rate) || 0;
                const cft = (l * w * t * pcs) / 144;
                const amount = cft * r;

                return (
                  <tr key={idx} style={{ borderBottom: "1px solid #f3f4f6" }}>
                    <td style={{ padding: "8px 12px" }}>
                      <input
                        type="text"
                        placeholder="Part Name"
                        value={item.wood_part_name}
                        onChange={(e) => handleWoodItemChange(idx, "wood_part_name", e.target.value)}
                        style={{ width: "100%", padding: "6px 8px", fontSize: 13, border: "1px solid #d1d5db", borderRadius: 4 }}
                      />
                    </td>

                    <td style={{ padding: "8px 12px", width: "100px" }}>
                      <input
                        type="number"
                        step="0.01"
                        placeholder="ft"
                        value={item.length_ft}
                        onChange={(e) => handleWoodItemChange(idx, "length_ft", e.target.value)}
                        style={{ width: "100%", padding: "6px 8px", fontSize: 13, border: "1px solid #d1d5db", borderRadius: 4 }}
                      />
                    </td>

                    <td style={{ padding: "8px 12px", width: "100px" }}>
                      <input
                        type="number"
                        step="0.01"
                        placeholder="in."
                        value={item.width_in}
                        onChange={(e) => handleWoodItemChange(idx, "width_in", e.target.value)}
                        style={{ width: "100%", padding: "6px 8px", fontSize: 13, border: "1px solid #d1d5db", borderRadius: 4 }}
                      />
                    </td>

                    <td style={{ padding: "8px 12px", width: "100px" }}>
                      <input
                        type="number"
                        step="0.01"
                        placeholder="in."
                        value={item.thick_in}
                        onChange={(e) => handleWoodItemChange(idx, "thick_in", e.target.value)}
                        style={{ width: "100%", padding: "6px 8px", fontSize: 13, border: "1px solid #d1d5db", borderRadius: 4 }}
                      />
                    </td>

                    <td style={{ padding: "8px 12px", width: "90px" }}>
                      <input
                        type="number"
                        step="1"
                        placeholder="Pcs"
                        value={item.pcs}
                        onChange={(e) => handleWoodItemChange(idx, "pcs", e.target.value)}
                        style={{ width: "100%", padding: "6px 8px", fontSize: 13, border: "1px solid #d1d5db", borderRadius: 4 }}
                      />
                    </td>

                    <td style={{ padding: "8px 12px", fontWeight: 600, color: "#374151", width: "100px" }}>
                      {cft.toFixed(3)}
                    </td>

                    <td style={{ padding: "8px 12px", width: "110px" }}>
                      <input
                        type="number"
                        step="0.01"
                        placeholder="Rate"
                        value={item.rate}
                        onChange={(e) => handleWoodItemChange(idx, "rate", e.target.value)}
                        style={{ width: "100%", padding: "6px 8px", fontSize: 13, border: "1px solid #d1d5db", borderRadius: 4 }}
                      />
                    </td>

                    <td style={{ padding: "8px 12px", fontWeight: 600, color: "#111827", width: "130px" }}>
                      ₹{amount.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                    </td>

                    <td style={{ padding: "8px 12px", width: "60px" }}>
                      <button
                        type="button"
                        onClick={() => handleRemoveWoodItem(idx)}
                        style={{
                          background: "none",
                          border: "none",
                          color: "#dc2626",
                          cursor: "pointer",
                          fontWeight: 700,
                        }}
                      >
                        ✕
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
            <tfoot>
              {(() => {
                const subtotalCft = woodItems.reduce((sum, item) => {
                  const l = Number(item.length_ft) || 0;
                  const w = Number(item.width_in) || 0;
                  const t = Number(item.thick_in) || 0;
                  const pcs = Number(item.pcs) || 0;
                  return sum + ((l * w * t * pcs) / 144);
                }, 0);
                const wastageCft = (subtotalCft * (Number(woodWastagePct) || 0)) / 100;
                const totalCftWithWastage = subtotalCft + wastageCft;

                const rawWoodCost = woodItems.reduce((sum, item) => {
                  const l = Number(item.length_ft) || 0;
                  const w = Number(item.width_in) || 0;
                  const t = Number(item.thick_in) || 0;
                  const pcs = Number(item.pcs) || 0;
                  const r = Number(item.rate) || 0;
                  const cft = (l * w * t * pcs) / 144;
                  return sum + (cft * r);
                }, 0);

                const wastageAmt = (rawWoodCost * (Number(woodWastagePct) || 0)) / 100;
                const totalWithWastage = rawWoodCost + wastageAmt;

                return (
                  <>
                    <tr style={{ background: "#f8fafc", borderTop: "2px solid #cbd5e1" }}>
                      <td colSpan={5} style={{ padding: "10px 12px", textAlign: "right", fontWeight: 700, fontSize: 13, color: "#1e293b" }}>
                        Subtotal Wood:
                      </td>
                      <td style={{ padding: "10px 12px", fontWeight: 800, fontSize: 14, color: "#0f172a" }}>
                        {subtotalCft.toFixed(3)}
                      </td>
                      <td style={{ padding: "10px 12px" }}></td>
                      <td style={{ padding: "10px 12px", fontWeight: 800, fontSize: 14, color: "#0f172a" }}>
                        ₹{rawWoodCost.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                      </td>
                      <td></td>
                    </tr>
                    <tr style={{ background: "#f8fafc" }}>
                      <td colSpan={5} style={{ padding: "8px 12px", textAlign: "right", fontWeight: 600, fontSize: 13, color: "#475569" }}>
                        <div style={{ display: "inline-flex", alignItems: "center", justifyContent: "flex-end", gap: "6px" }}>
                          <span>Wastage:</span>
                          <input
                            type="number"
                            step="0.1"
                            min="0"
                            value={woodWastagePct}
                            onChange={(e) => setWoodWastagePct(Number(e.target.value))}
                            style={{ width: "55px", padding: "4px 6px", fontSize: 13, border: "1px solid #cbd5e1", borderRadius: 4, textAlign: "center", fontWeight: 600 }}
                          />
                          <span>%</span>
                        </div>
                      </td>
                      <td style={{ padding: "8px 12px", fontWeight: 600, fontSize: 13, color: "#d97706" }}>
                        + {wastageCft.toFixed(3)}
                      </td>
                      <td style={{ padding: "8px 12px" }}></td>
                      <td style={{ padding: "8px 12px", fontWeight: 600, fontSize: 13, color: "#d97706" }}>
                        + ₹{wastageAmt.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                      </td>
                      <td></td>
                    </tr>
                    <tr style={{ background: "#eff6ff", borderTop: "2px solid #bfdbfe" }}>
                      <td colSpan={5} style={{ padding: "12px", textAlign: "right", fontWeight: 800, fontSize: 14, color: "#1e3a8a" }}>
                        Total Wood (incl. Wastage):
                      </td>
                      <td style={{ padding: "12px", fontWeight: 800, fontSize: 15, color: "#2563eb" }}>
                        {totalCftWithWastage.toFixed(3)}
                      </td>
                      <td style={{ padding: "12px" }}></td>
                      <td style={{ padding: "12px", fontWeight: 800, fontSize: 16, color: "#2563eb" }}>
                        ₹{totalWithWastage.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                      </td>
                      <td></td>
                    </tr>
                  </>
                );
              })()}
            </tfoot>
          </table>
        </div>

        {/* Metal and SS Costing Section */}
        <div style={{ background: "#ffffff", borderRadius: 8, border: "1px solid #e5e7eb", padding: 20, marginBottom: 24 }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16 }}>
            <h3 style={{ fontSize: 16, fontWeight: 600, color: "#111827", margin: 0 }}>
              3. Metal and SS Costing
            </h3>
            <button
              type="button"
              onClick={handleAddMetalSsItem}
              style={{
                padding: "6px 14px",
                background: "#eff6ff",
                color: "#2563eb",
                border: "1px solid #bfdbfe",
                borderRadius: 6,
                fontWeight: 600,
                fontSize: 13,
                cursor: "pointer",
              }}
            >
              + Add Item Line
            </button>
          </div>

          <table data-no-enhance="true" style={{ width: "100%", borderCollapse: "collapse", textAlign: "left" }}>
            <thead>
              <tr style={{ background: "#f9fafb", borderBottom: "1px solid #e5e7eb" }}>
                <th style={{ padding: "10px 12px", fontSize: 12, color: "#6b7280" }}>Type</th>
                <th style={{ padding: "10px 12px", fontSize: 12, color: "#6b7280" }}>Size</th>
                <th style={{ padding: "10px 12px", fontSize: 12, color: "#6b7280" }}>Qty</th>
                <th style={{ padding: "10px 12px", fontSize: 12, color: "#6b7280" }}>Weight</th>
                <th style={{ padding: "10px 12px", fontSize: 12, color: "#6b7280" }}>Total Weight</th>
                <th style={{ padding: "10px 12px", fontSize: 12, color: "#6b7280" }}>Rate</th>
                <th style={{ padding: "10px 12px", fontSize: 12, color: "#6b7280" }}>Total Amount</th>
                <th style={{ padding: "10px 12px", fontSize: 12, color: "#6b7280" }}>Action</th>
              </tr>
            </thead>
            <tbody>
              {metalSsItems.map((item, idx) => {
                const q = Number(item.qty) || 0;
                const w = Number(item.weight) || 0;
                const r = Number(item.rate) || 0;
                const totalWeight = q * w;
                const totalAmount = totalWeight > 0 ? totalWeight * r : q * r;

                return (
                  <tr key={idx} style={{ borderBottom: "1px solid #f3f4f6" }}>
                    <td style={{ padding: "8px 12px", width: "140px" }}>
                      <select
                        value={item.type}
                        onChange={(e) => handleMetalSsItemChange(idx, "type", e.target.value as "Metal" | "SS")}
                        style={{ width: "100%", padding: "6px 8px", fontSize: 13, border: "1px solid #d1d5db", borderRadius: 4 }}
                      >
                        <option value="Metal">Metal</option>
                        <option value="SS">SS</option>
                      </select>
                    </td>

                    <td style={{ padding: "8px 12px" }}>
                      <input
                        type="text"
                        placeholder="Size (e.g. 25x25mm)"
                        value={item.size}
                        onChange={(e) => handleMetalSsItemChange(idx, "size", e.target.value)}
                        style={{ width: "100%", padding: "6px 8px", fontSize: 13, border: "1px solid #d1d5db", borderRadius: 4 }}
                      />
                    </td>

                    <td style={{ padding: "8px 12px", width: "90px" }}>
                      <input
                        type="number"
                        step="0.01"
                        placeholder="Qty"
                        value={item.qty}
                        onChange={(e) => handleMetalSsItemChange(idx, "qty", e.target.value)}
                        style={{ width: "100%", padding: "6px 8px", fontSize: 13, border: "1px solid #d1d5db", borderRadius: 4 }}
                      />
                    </td>

                    <td style={{ padding: "8px 12px", width: "110px" }}>
                      <input
                        type="number"
                        step="0.01"
                        placeholder="Weight"
                        value={item.weight}
                        onChange={(e) => handleMetalSsItemChange(idx, "weight", e.target.value)}
                        style={{ width: "100%", padding: "6px 8px", fontSize: 13, border: "1px solid #d1d5db", borderRadius: 4 }}
                      />
                    </td>

                    <td style={{ padding: "8px 12px", fontWeight: 600, color: "#374151", width: "130px" }}>
                      {totalWeight.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                    </td>

                    <td style={{ padding: "8px 12px", width: "110px" }}>
                      <input
                        type="number"
                        step="0.01"
                        placeholder="Rate"
                        value={item.rate}
                        onChange={(e) => handleMetalSsItemChange(idx, "rate", e.target.value)}
                        style={{ width: "100%", padding: "6px 8px", fontSize: 13, border: "1px solid #d1d5db", borderRadius: 4 }}
                      />
                    </td>

                    <td style={{ padding: "8px 12px", fontWeight: 600, color: "#111827", width: "130px" }}>
                      ₹{totalAmount.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                    </td>

                    <td style={{ padding: "8px 12px", width: "60px" }}>
                      <button
                        type="button"
                        onClick={() => handleRemoveMetalSsItem(idx)}
                        style={{
                          background: "none",
                          border: "none",
                          color: "#dc2626",
                          cursor: "pointer",
                          fontWeight: 700,
                        }}
                      >
                        ✕
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
            <tfoot>
              <tr style={{ background: "#f8fafc", borderTop: "2px solid #cbd5e1" }}>
                <td colSpan={4} style={{ padding: "12px", textAlign: "right", fontWeight: 700, fontSize: 14, color: "#1e293b" }}>
                  Total Weight:
                </td>
                <td style={{ padding: "12px", fontWeight: 800, fontSize: 14, color: "#1e293b" }}>
                  {metalSsItems.reduce((sum, item) => sum + ((Number(item.qty) || 0) * (Number(item.weight) || 0)), 0).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })} kg
                </td>
                <td style={{ padding: "12px", textAlign: "right", fontWeight: 700, fontSize: 14, color: "#1e293b" }}>
                  Total Metal & SS Amount:
                </td>
                <td style={{ padding: "12px", fontWeight: 800, fontSize: 15, color: "#2563eb" }}>
                  ₹{metalSsItems.reduce((sum, item) => {
                    const q = Number(item.qty) || 0;
                    const w = Number(item.weight) || 0;
                    const r = Number(item.rate) || 0;
                    const tw = q * w;
                    return sum + (tw > 0 ? tw * r : q * r);
                  }, 0).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                </td>
                <td></td>
              </tr>
            </tfoot>
          </table>
        </div>

        {/* Additional Costing Section */}
        <div style={{ background: "#ffffff", borderRadius: 8, border: "1px solid #e5e7eb", padding: 20, marginBottom: 24 }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16 }}>
            <h3 style={{ fontSize: 16, fontWeight: 600, color: "#111827", margin: 0 }}>
              4. Additional Costing
            </h3>
            <button
              type="button"
              onClick={handleAddAdditionalItem}
              style={{
                padding: "6px 14px",
                background: "#eff6ff",
                color: "#2563eb",
                border: "1px solid #bfdbfe",
                borderRadius: 6,
                fontWeight: 600,
                fontSize: 13,
                cursor: "pointer",
              }}
            >
              + Add Item Line
            </button>
          </div>

          <table data-no-enhance="true" style={{ width: "100%", borderCollapse: "collapse", textAlign: "left" }}>
            <thead>
              <tr style={{ background: "#f9fafb", borderBottom: "1px solid #e5e7eb" }}>
                <th style={{ padding: "10px 12px", fontSize: 12, color: "#6b7280" }}>Additional</th>
                <th style={{ padding: "10px 12px", fontSize: 12, color: "#6b7280" }}>Size</th>
                <th style={{ padding: "10px 12px", fontSize: 12, color: "#6b7280" }}>Calculation</th>
                <th style={{ padding: "10px 12px", fontSize: 12, color: "#6b7280" }}>Price</th>
                <th style={{ padding: "10px 12px", fontSize: 12, color: "#6b7280" }}>Action</th>
              </tr>
            </thead>
            <tbody>
              {additionalItems.map((item, idx) => {
                return (
                  <tr key={idx} style={{ borderBottom: "1px solid #f3f4f6" }}>
                    <td style={{ padding: "8px 12px", width: "220px" }}>
                      <input
                        type="text"
                        placeholder="Additional Item"
                        value={item.additional}
                        onChange={(e) => handleAdditionalItemChange(idx, "additional", e.target.value)}
                        style={{ width: "100%", padding: "6px 8px", fontSize: 13, border: "1px solid #d1d5db", borderRadius: 4, fontWeight: 500 }}
                      />
                    </td>

                    <td style={{ padding: "8px 12px" }}>
                      <input
                        type="text"
                        placeholder="Size"
                        value={item.size}
                        onChange={(e) => handleAdditionalItemChange(idx, "size", e.target.value)}
                        style={{ width: "100%", padding: "6px 8px", fontSize: 13, border: "1px solid #d1d5db", borderRadius: 4 }}
                      />
                    </td>

                    <td style={{ padding: "8px 12px" }}>
                      <input
                        type="text"
                        placeholder="Calculation"
                        value={item.calculation}
                        onChange={(e) => handleAdditionalItemChange(idx, "calculation", e.target.value)}
                        style={{ width: "100%", padding: "6px 8px", fontSize: 13, border: "1px solid #d1d5db", borderRadius: 4 }}
                      />
                    </td>

                    <td style={{ padding: "8px 12px", width: "150px" }}>
                      <input
                        type="number"
                        step="0.01"
                        placeholder="0.00"
                        value={item.price}
                        onChange={(e) => handleAdditionalItemChange(idx, "price", e.target.value)}
                        style={{ width: "100%", padding: "6px 8px", fontSize: 13, border: "1px solid #d1d5db", borderRadius: 4, fontWeight: 600, color: "#111827" }}
                      />
                    </td>

                    <td style={{ padding: "8px 12px", width: "60px" }}>
                      <button
                        type="button"
                        onClick={() => handleRemoveAdditionalItem(idx)}
                        style={{
                          background: "none",
                          border: "none",
                          color: "#dc2626",
                          cursor: "pointer",
                          fontWeight: 700,
                        }}
                      >
                        ✕
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
            <tfoot>
              <tr style={{ background: "#f8fafc", borderTop: "2px solid #cbd5e1" }}>
                <td colSpan={3} style={{ padding: "12px", textAlign: "right", fontWeight: 700, fontSize: 14, color: "#1e293b" }}>
                  Total Additional Amount:
                </td>
                <td style={{ padding: "12px", fontWeight: 800, fontSize: 15, color: "#2563eb" }}>
                  ₹{additionalItems.reduce((sum, item) => sum + (Number(item.price) || 0), 0).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                </td>
                <td></td>
              </tr>
            </tfoot>
          </table>
        </div>

        {/* 5. Labour & Operational Expenses Section */}
        <div style={{ background: "#ffffff", borderRadius: 8, border: "1px solid #e5e7eb", padding: 20, marginBottom: 24 }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16 }}>
            <h3 style={{ fontSize: 16, fontWeight: 600, color: "#111827", margin: 0 }}>
              5. Labour & Operational Expenses
            </h3>
            <button
              type="button"
              onClick={handleAddExpenseItem}
              style={{
                padding: "6px 14px",
                background: "#eff6ff",
                color: "#2563eb",
                border: "1px solid #bfdbfe",
                borderRadius: 6,
                fontWeight: 600,
                fontSize: 13,
                cursor: "pointer",
              }}
            >
              + Add Item Line
            </button>
          </div>

          <table data-no-enhance="true" style={{ width: "100%", borderCollapse: "collapse", textAlign: "left" }}>
            <thead>
              <tr style={{ background: "#f9fafb", borderBottom: "1px solid #e5e7eb" }}>
                <th style={{ padding: "10px 12px", fontSize: 12, color: "#6b7280" }}>Expense Item</th>
                <th style={{ padding: "10px 12px", fontSize: 12, color: "#6b7280" }}>Amount (₹)</th>
                <th style={{ padding: "10px 12px", fontSize: 12, color: "#6b7280", width: "60px" }}>Action</th>
              </tr>
            </thead>
            <tbody>
              {expenseItems.map((item, idx) => {
                return (
                  <tr key={idx} style={{ borderBottom: "1px solid #f3f4f6" }}>
                    <td style={{ padding: "8px 12px" }}>
                      <input
                        type="text"
                        placeholder="Expense Item Name"
                        value={item.item_name}
                        onChange={(e) => handleExpenseItemChange(idx, "item_name", e.target.value)}
                        style={{ width: "100%", maxWidth: "320px", padding: "6px 8px", fontSize: 13, border: "1px solid #d1d5db", borderRadius: 4, fontWeight: 500 }}
                      />
                    </td>

                    <td style={{ padding: "8px 12px", width: "200px" }}>
                      <input
                        type="number"
                        step="0.01"
                        placeholder="0.00"
                        value={item.amount}
                        onChange={(e) => handleExpenseItemChange(idx, "amount", e.target.value)}
                        style={{ width: "100%", padding: "6px 8px", fontSize: 13, border: "1px solid #d1d5db", borderRadius: 4, fontWeight: 600, color: "#111827" }}
                      />
                    </td>

                    <td style={{ padding: "8px 12px", width: "60px" }}>
                      <button
                        type="button"
                        onClick={() => handleRemoveExpenseItem(idx)}
                        style={{
                          background: "none",
                          border: "none",
                          color: "#dc2626",
                          cursor: "pointer",
                          fontWeight: 700,
                        }}
                      >
                        ✕
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
            <tfoot>
              <tr style={{ background: "#f8fafc", borderTop: "2px solid #cbd5e1" }}>
                <td style={{ padding: "12px", textAlign: "right", fontWeight: 700, fontSize: 14, color: "#1e293b" }}>
                  Total Expenses Amount:
                </td>
                <td style={{ padding: "12px", fontWeight: 800, fontSize: 15, color: "#2563eb" }}>
                  ₹{expenseItems.reduce((sum, item) => sum + (Number(item.amount) || 0), 0).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                </td>
                <td></td>
              </tr>
            </tfoot>
          </table>
        </div>

        {/* 6. CNC & Machine Costing Section */}
        <div style={{ background: "#ffffff", borderRadius: 8, border: "1px solid #e5e7eb", padding: 20, marginBottom: 24 }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16 }}>
            <h3 style={{ fontSize: 16, fontWeight: 600, color: "#111827", margin: 0 }}>
              6. CNC & Machine Costing
            </h3>
            <button
              type="button"
              onClick={handleAddCncItem}
              style={{
                padding: "6px 14px",
                background: "#eff6ff",
                color: "#2563eb",
                border: "1px solid #bfdbfe",
                borderRadius: 6,
                fontWeight: 600,
                fontSize: 13,
                cursor: "pointer",
              }}
            >
              + Add Machine Line
            </button>
          </div>

          <table data-no-enhance="true" style={{ width: "100%", borderCollapse: "collapse", textAlign: "left" }}>
            <thead>
              <tr style={{ background: "#f9fafb", borderBottom: "1px solid #e5e7eb" }}>
                <th style={{ padding: "10px 12px", fontSize: 12, color: "#6b7280" }}>Item Name</th>
                <th style={{ padding: "10px 12px", fontSize: 12, color: "#6b7280" }}>Timing</th>
                <th style={{ padding: "10px 12px", fontSize: 12, color: "#6b7280" }}>Cost (₹)</th>
                <th style={{ padding: "10px 12px", fontSize: 12, color: "#6b7280", width: "60px" }}>Action</th>
              </tr>
            </thead>
            <tbody>
              {cncItems.map((item, idx) => {
                return (
                  <tr key={idx} style={{ borderBottom: "1px solid #f3f4f6" }}>
                    <td style={{ padding: "8px 12px", width: "220px" }}>
                      <input
                        type="text"
                        placeholder="Item Name"
                        value={item.item_name}
                        onChange={(e) => handleCncItemChange(idx, "item_name", e.target.value)}
                        style={{ width: "100%", padding: "6px 8px", fontSize: 13, border: "1px solid #d1d5db", borderRadius: 4, fontWeight: 500 }}
                      />
                    </td>

                    <td style={{ padding: "8px 12px" }}>
                      <input
                        type="text"
                        placeholder={idx === 1 ? "-" : "Timing (e.g. 45 mins)"}
                        value={item.timing}
                        onChange={(e) => handleCncItemChange(idx, "timing", e.target.value)}
                        style={{ width: "100%", padding: "6px 8px", fontSize: 13, border: "1px solid #d1d5db", borderRadius: 4 }}
                      />
                    </td>

                    <td style={{ padding: "8px 12px", width: "180px" }}>
                      <input
                        type="number"
                        step="0.01"
                        placeholder="0.00"
                        value={item.cost}
                        onChange={(e) => handleCncItemChange(idx, "cost", e.target.value)}
                        style={{ width: "100%", padding: "6px 8px", fontSize: 13, border: "1px solid #d1d5db", borderRadius: 4, fontWeight: 600, color: "#111827" }}
                      />
                    </td>

                    <td style={{ padding: "8px 12px", width: "60px" }}>
                      <button
                        type="button"
                        onClick={() => handleRemoveCncItem(idx)}
                        style={{
                          background: "none",
                          border: "none",
                          color: "#dc2626",
                          cursor: "pointer",
                          fontWeight: 700,
                        }}
                      >
                        ✕
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
            <tfoot>
              <tr style={{ background: "#f8fafc", borderTop: "2px solid #cbd5e1" }}>
                <td colSpan={2} style={{ padding: "12px", textAlign: "right", fontWeight: 700, fontSize: 14, color: "#1e293b" }}>
                  Total CNC & Machine Cost:
                </td>
                <td style={{ padding: "12px", fontWeight: 800, fontSize: 15, color: "#2563eb" }}>
                  ₹{cncItems.reduce((sum, item) => sum + (Number(item.cost) || 0), 0).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                </td>
                <td></td>
              </tr>
            </tfoot>
          </table>
        </div>

        {/* 7. CBM & Container Load Calculation Section */}
        {(() => {
          const l1 = Number(c1Length) || 0;
          const w1 = Number(c1Width) || 0;
          const h1 = Number(c1Height) || 0;
          const cbm1 = c1Unit === "cm" ? (l1 * w1 * h1) / 1000000 : (l1 * w1 * h1) / 61023.74;

          const l2 = Number(c2Length) || 0;
          const w2 = Number(c2Width) || 0;
          const h2 = Number(c2Height) || 0;
          const cbm2 = c2Unit === "cm" ? (l2 * w2 * h2) / 1000000 : (l2 * w2 * h2) / 61023.74;

          const totalCbm = cbm1 + cbm2;
          const pcsIn40Hq = totalCbm > 0 ? Math.floor(68.0 / totalCbm) : 0;

          return (
            <div style={{ background: "#ffffff", borderRadius: 8, border: "1px solid #e5e7eb", padding: 20, marginBottom: 24 }}>
              <h3 style={{ fontSize: 16, fontWeight: 600, color: "#111827", marginTop: 0, marginBottom: 16 }}>
                7. CBM Calculation
              </h3>

              {/* Carton Size 1 */}
              <div style={{ marginBottom: 20, padding: 16, background: "#f8fafc", borderRadius: 6, border: "1px solid #e2e8f0" }}>
                <div style={{ fontWeight: 600, fontSize: 14, color: "#1e293b", marginBottom: 12, display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                  <span>Carton Size 1</span>
                  <span style={{ fontSize: 13, color: "#2563eb", fontWeight: 700 }}>
                    CBM: {cbm1.toFixed(3)} m³
                  </span>
                </div>
                <div style={{ display: "flex", flexWrap: "wrap", gap: 16, alignItems: "flex-end" }}>
                  <div style={{ flex: "1 1 120px" }}>
                    <label style={{ display: "block", fontSize: 12, fontWeight: 500, color: "#64748b", marginBottom: 4 }}>Length (L)</label>
                    <input
                      type="number"
                      step="0.01"
                      placeholder="L"
                      value={c1Length}
                      onChange={(e) => setC1Length(e.target.value ? Number(e.target.value) : "")}
                      style={{ width: "100%", padding: "8px 10px", fontSize: 13, border: "1px solid #cbd5e1", borderRadius: 4 }}
                    />
                  </div>
                  <div style={{ flex: "1 1 120px" }}>
                    <label style={{ display: "block", fontSize: 12, fontWeight: 500, color: "#64748b", marginBottom: 4 }}>Width (W)</label>
                    <input
                      type="number"
                      step="0.01"
                      placeholder="W"
                      value={c1Width}
                      onChange={(e) => setC1Width(e.target.value ? Number(e.target.value) : "")}
                      style={{ width: "100%", padding: "8px 10px", fontSize: 13, border: "1px solid #cbd5e1", borderRadius: 4 }}
                    />
                  </div>
                  <div style={{ flex: "1 1 120px" }}>
                    <label style={{ display: "block", fontSize: 12, fontWeight: 500, color: "#64748b", marginBottom: 4 }}>Height (H)</label>
                    <input
                      type="number"
                      step="0.01"
                      placeholder="H"
                      value={c1Height}
                      onChange={(e) => setC1Height(e.target.value ? Number(e.target.value) : "")}
                      style={{ width: "100%", padding: "8px 10px", fontSize: 13, border: "1px solid #cbd5e1", borderRadius: 4 }}
                    />
                  </div>
                  <div style={{ width: "100px" }}>
                    <label style={{ display: "block", fontSize: 12, fontWeight: 500, color: "#64748b", marginBottom: 4 }}>Unit</label>
                    <select
                      value={c1Unit}
                      onChange={(e) => setC1Unit(e.target.value as "cm" | "in")}
                      style={{ width: "100%", padding: "8px 10px", fontSize: 13, border: "1px solid #cbd5e1", borderRadius: 4, background: "#ffffff" }}
                    >
                      <option value="cm">cm</option>
                      <option value="in">inches</option>
                    </select>
                  </div>
                </div>
              </div>

              {/* Carton Size 2 */}
              <div style={{ marginBottom: 20, padding: 16, background: "#f8fafc", borderRadius: 6, border: "1px solid #e2e8f0" }}>
                <div style={{ fontWeight: 600, fontSize: 14, color: "#1e293b", marginBottom: 12, display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                  <span>Carton Size 2</span>
                  <span style={{ fontSize: 13, color: "#2563eb", fontWeight: 700 }}>
                    CBM: {cbm2.toFixed(3)} m³
                  </span>
                </div>
                <div style={{ display: "flex", flexWrap: "wrap", gap: 16, alignItems: "flex-end" }}>
                  <div style={{ flex: "1 1 120px" }}>
                    <label style={{ display: "block", fontSize: 12, fontWeight: 500, color: "#64748b", marginBottom: 4 }}>Length (L)</label>
                    <input
                      type="number"
                      step="0.01"
                      placeholder="L"
                      value={c2Length}
                      onChange={(e) => setC2Length(e.target.value ? Number(e.target.value) : "")}
                      style={{ width: "100%", padding: "8px 10px", fontSize: 13, border: "1px solid #cbd5e1", borderRadius: 4 }}
                    />
                  </div>
                  <div style={{ flex: "1 1 120px" }}>
                    <label style={{ display: "block", fontSize: 12, fontWeight: 500, color: "#64748b", marginBottom: 4 }}>Width (W)</label>
                    <input
                      type="number"
                      step="0.01"
                      placeholder="W"
                      value={c2Width}
                      onChange={(e) => setC2Width(e.target.value ? Number(e.target.value) : "")}
                      style={{ width: "100%", padding: "8px 10px", fontSize: 13, border: "1px solid #cbd5e1", borderRadius: 4 }}
                    />
                  </div>
                  <div style={{ flex: "1 1 120px" }}>
                    <label style={{ display: "block", fontSize: 12, fontWeight: 500, color: "#64748b", marginBottom: 4 }}>Height (H)</label>
                    <input
                      type="number"
                      step="0.01"
                      placeholder="H"
                      value={c2Height}
                      onChange={(e) => setC2Height(e.target.value ? Number(e.target.value) : "")}
                      style={{ width: "100%", padding: "8px 10px", fontSize: 13, border: "1px solid #cbd5e1", borderRadius: 4 }}
                    />
                  </div>
                  <div style={{ width: "100px" }}>
                    <label style={{ display: "block", fontSize: 12, fontWeight: 500, color: "#64748b", marginBottom: 4 }}>Unit</label>
                    <select
                      value={c2Unit}
                      onChange={(e) => setC2Unit(e.target.value as "cm" | "in")}
                      style={{ width: "100%", padding: "8px 10px", fontSize: 13, border: "1px solid #cbd5e1", borderRadius: 4, background: "#ffffff" }}
                    >
                      <option value="cm">cm</option>
                      <option value="in">inches</option>
                    </select>
                  </div>
                </div>
              </div>

              {/* Total CBM & No of Pcs in 40 HQ */}
              <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))", gap: 16, marginTop: 16 }}>
                <div style={{ background: "#eff6ff", border: "1px solid #bfdbfe", borderRadius: 6, padding: "14px 18px", textAlign: "center" }}>
                  <div style={{ fontSize: 13, color: "#1e40af", fontWeight: 700, marginBottom: 4, textTransform: "uppercase" }}>
                    Total CBM
                  </div>
                  <div style={{ fontSize: 22, color: "#2563eb", fontWeight: 800 }}>
                    {totalCbm.toFixed(3)} m³
                  </div>
                </div>

                <div style={{ background: "#fef3c7", border: "1px solid #fde68a", borderRadius: 6, padding: "14px 18px", textAlign: "center" }}>
                  <div style={{ fontSize: 13, color: "#92400e", fontWeight: 700, marginBottom: 4, textTransform: "uppercase" }}>
                    NO OF PCS IN 40 HQ
                  </div>
                  <div style={{ fontSize: 22, color: "#d97706", fontWeight: 800 }}>
                    {totalCbm > 0 ? pcsIn40Hq : "-"}
                  </div>
                </div>
              </div>
            </div>
          );
        })()}

        {/* Grand Total Summary Card */}
        {(() => {
          const woodTotal = woodItems.reduce((sum, item) => {
            const l = Number(item.length_ft) || 0;
            const w = Number(item.width_in) || 0;
            const t = Number(item.thick_in) || 0;
            const pcs = Number(item.pcs) || 0;
            const r = Number(item.rate) || 0;
            const cft = (l * w * t * pcs) / 144;
            return sum + (cft * r);
          }, 0) * (1 + (Number(woodWastagePct) || 0) / 100);

          const metalTotal = metalSsItems.reduce((sum, item) => {
            const q = Number(item.qty) || 0;
            const w = Number(item.weight) || 0;
            const r = Number(item.rate) || 0;
            const tw = q * w;
            return sum + (tw > 0 ? tw * r : q * r);
          }, 0);

          const additionalTotal = additionalItems.reduce((sum, item) => sum + (Number(item.price) || 0), 0);
          const expensesTotal = expenseItems.reduce((sum, item) => sum + (Number(item.amount) || 0), 0);
          const cncTotal = cncItems.reduce((sum, item) => sum + (Number(item.cost) || 0), 0);

          const directSubtotal = woodTotal + metalTotal + additionalTotal + expensesTotal + cncTotal;
          const factoryAmt = (directSubtotal * (Number(factoryExpensesPct) || 0)) / 100;
          const subtotalWithFactory = directSubtotal + factoryAmt;
          const profitAmt = (subtotalWithFactory * (Number(marginPercentage) || 0)) / 100;
          const grandTotal = subtotalWithFactory + profitAmt;

          return (
            <div style={{ background: "linear-gradient(135deg, #1e3a8a 0%, #2563eb 100%)", borderRadius: 8, padding: 24, color: "#ffffff", marginBottom: 24, boxShadow: "0 4px 12px rgba(37, 99, 235, 0.2)" }}>
              <h3 style={{ fontSize: 18, fontWeight: 700, margin: "0 0 16px 0", borderBottom: "1px solid rgba(255,255,255,0.2)", paddingBottom: 10 }}>
                Cost Estimation Summary
              </h3>

              {/* 5 Cost Section Breakdown Cards */}
              <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(170px, 1fr))", gap: "14px", marginBottom: 18 }}>
                <div style={{ background: "rgba(255,255,255,0.1)", borderRadius: 6, padding: 12 }}>
                  <div style={{ fontSize: 12, opacity: 0.8, marginBottom: 4 }}>Total Wood Cost</div>
                  <div style={{ fontSize: 15, fontWeight: 700 }}>₹{woodTotal.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</div>
                </div>
                <div style={{ background: "rgba(255,255,255,0.1)", borderRadius: 6, padding: 12 }}>
                  <div style={{ fontSize: 12, opacity: 0.8, marginBottom: 4 }}>Total Metal & SS Cost</div>
                  <div style={{ fontSize: 15, fontWeight: 700 }}>₹{metalTotal.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</div>
                </div>
                <div style={{ background: "rgba(255,255,255,0.1)", borderRadius: 6, padding: 12 }}>
                  <div style={{ fontSize: 12, opacity: 0.8, marginBottom: 4 }}>Total Additional Cost</div>
                  <div style={{ fontSize: 15, fontWeight: 700 }}>₹{additionalTotal.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</div>
                </div>
                <div style={{ background: "rgba(255,255,255,0.1)", borderRadius: 6, padding: 12 }}>
                  <div style={{ fontSize: 12, opacity: 0.8, marginBottom: 4 }}>Total Labour & Expenses</div>
                  <div style={{ fontSize: 15, fontWeight: 700 }}>₹{expensesTotal.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</div>
                </div>
                <div style={{ background: "rgba(255,255,255,0.1)", borderRadius: 6, padding: 12 }}>
                  <div style={{ fontSize: 12, opacity: 0.8, marginBottom: 4 }}>Total CNC & Machine</div>
                  <div style={{ fontSize: 15, fontWeight: 700 }}>₹{cncTotal.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</div>
                </div>
              </div>

              {/* Direct Subtotal Row */}
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", background: "rgba(255,255,255,0.12)", borderRadius: 6, padding: "10px 16px", marginBottom: 16 }}>
                <span style={{ fontSize: 14, fontWeight: 600 }}>Direct Costs Subtotal:</span>
                <span style={{ fontSize: 16, fontWeight: 700 }}>₹{directSubtotal.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
              </div>

              {/* Factory Expenses % & Profit Margin % Input Section */}
              <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))", gap: "16px", marginBottom: 20 }}>
                {/* Factory Expenses */}
                <div style={{ background: "rgba(255,255,255,0.15)", borderRadius: 6, padding: 14 }}>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 8 }}>
                    <label style={{ fontSize: 13, fontWeight: 600 }}>Factory Expenses (%)</label>
                    <div style={{ display: "inline-flex", alignItems: "center", gap: 4 }}>
                      <input
                        type="number"
                        step="0.5"
                        min="0"
                        value={factoryExpensesPct}
                        onChange={(e) => setFactoryExpensesPct(Number(e.target.value))}
                        style={{ width: "65px", padding: "4px 6px", fontSize: 13, border: "none", borderRadius: 4, textAlign: "center", fontWeight: 700, color: "#1e3a8a", background: "#ffffff" }}
                      />
                      <span style={{ fontSize: 13, fontWeight: 700 }}>%</span>
                    </div>
                  </div>
                  <div style={{ fontSize: 15, fontWeight: 700, textAlign: "right", color: "#fef08a" }}>
                    + ₹{factoryAmt.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                  </div>
                </div>

                {/* Profit Margin */}
                <div style={{ background: "rgba(255,255,255,0.15)", borderRadius: 6, padding: 14 }}>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 8 }}>
                    <label style={{ fontSize: 13, fontWeight: 600 }}>Profit Margin (%)</label>
                    <div style={{ display: "inline-flex", alignItems: "center", gap: 4 }}>
                      <input
                        type="number"
                        step="0.5"
                        min="0"
                        value={marginPercentage}
                        onChange={(e) => setMarginPercentage(Number(e.target.value))}
                        style={{ width: "65px", padding: "4px 6px", fontSize: 13, border: "none", borderRadius: 4, textAlign: "center", fontWeight: 700, color: "#1e3a8a", background: "#ffffff" }}
                      />
                      <span style={{ fontSize: 13, fontWeight: 700 }}>%</span>
                    </div>
                  </div>
                  <div style={{ fontSize: 15, fontWeight: 700, textAlign: "right", color: "#86efac" }}>
                    + ₹{profitAmt.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                  </div>
                </div>
              </div>

              {/* Grand Total Row */}
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", background: "rgba(0,0,0,0.25)", borderRadius: 6, padding: "16px 20px" }}>
                <span style={{ fontSize: 17, fontWeight: 700 }}>Grand Total Estimated Cost:</span>
                <span style={{ fontSize: 26, fontWeight: 800, color: "#ffffff" }}>₹{grandTotal.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
              </div>
            </div>
          );
        })()}



        {/* Submit Actions */}
        <div style={{ display: "flex", justifyContent: "flex-end", gap: 12 }}>
          <button
            type="button"
            onClick={() => navigate("/admin/costing/new")}
            style={{
              padding: "10px 20px",
              background: "#ffffff",
              border: "1px solid #d1d5db",
              borderRadius: 6,
              fontWeight: 500,
              cursor: "pointer",
            }}
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={loading}
            style={{
              padding: "10px 24px",
              background: "#2563eb",
              border: "none",
              borderRadius: 6,
              fontWeight: 600,
              color: "#ffffff",
              cursor: "pointer",
            }}
          >
            {loading ? "Saving..." : isEdit ? "Update Estimation" : "Save Estimation"}
          </button>
        </div>
      </form>
    </div>
  );
}
