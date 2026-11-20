import React, { useEffect, useState, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { costingApi, FURNITURE_PRODUCT_TYPES } from "../api/costingApi";
import { masterDataApi, WoodType } from "../../admin/masterdata/api/masterDataApi";
import { useAuthStore } from "../../auth/hooks/useAuthStore";

interface ProductFormItem {
  id: string;
  product_name: string;
  product_code: string;
  product_type: string;
  collection_name: string;
  wood_type: string;
  overall_size: string;
  client_name: string;
  description: string;
  image_url: string;
  uploading?: boolean;
  priority: "Normal" | "High" | "Urgent";
}

export default function CostingRequestCenterPage() {
  const navigate = useNavigate();
  const user = useAuthStore((s) => s.user);

  const [merchantName, setMerchantName] = useState(user?.fullName || "");
  const [clientName, setClientName] = useState("");
  const [bunchPriority, setBunchPriority] = useState<"Normal" | "High" | "Urgent">("Normal");
  const [notes, setNotes] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [createdBunch, setCreatedBunch] = useState<any | null>(null);

  // Master Data: Wood Types
  const [woodTypes, setWoodTypes] = useState<WoodType[]>([]);
  const [bunchCodePrefix, setBunchCodePrefix] = useState<string>("BUN-" + new Date().getFullYear().toString().slice(-2) + String(new Date().getMonth() + 1).padStart(2, "0") + "-0001");

  const [products, setProducts] = useState<ProductFormItem[]>([
    {
      id: "prod-1",
      product_name: "",
      product_code: "",
      product_type: "",
      collection_name: "",
      wood_type: "",
      overall_size: "",
      client_name: "",
      description: "",
      image_url: "",
      priority: "Normal",
    },
  ]);

  const bulkFileInputRef = useRef<HTMLInputElement | null>(null);

  useEffect(() => {
    // Load Wood Types from Master Data
    masterDataApi.getWoodTypes()
      .then((data) => setWoodTypes(data || []))
      .catch((err) => console.error("Failed to load wood types master:", err));

    // Fetch next auto bunch code & product codes from backend
    costingApi.getNextCodes(5)
      .then((res) => {
        if (res && res.bunchCode) {
          setBunchCodePrefix(res.bunchCode);
          setProducts((prev) => {
            if (prev.length === 1 && !prev[0].product_code) {
              return [{
                ...prev[0],
                product_code: `${res.bunchCode}-P01`,
              }];
            }
            return prev;
          });
        }
      })
      .catch(() => {
        // Fallback default
        const code = `BUN-${new Date().getFullYear().toString().slice(-2)}${String(new Date().getMonth() + 1).padStart(2, "0")}-0001`;
        setBunchCodePrefix(code);
        setProducts((prev) => {
          if (prev.length === 1 && !prev[0].product_code) {
            return [{ ...prev[0], product_code: `${code}-P01` }];
          }
          return prev;
        });
      });
  }, []);

  const getAutoCodeForIndex = (index: number) => {
    return `${bunchCodePrefix}-P${String(index + 1).padStart(2, "0")}`;
  };

  const handleAddProduct = () => {
    setProducts((prev) => {
      const nextIndex = prev.length;
      return [
        ...prev,
        {
          id: `prod-${Date.now()}-${nextIndex + 1}`,
          product_name: "",
          product_code: getAutoCodeForIndex(nextIndex),
          product_type: "",
          collection_name: "",
          wood_type: woodTypes.length > 0 ? woodTypes[0].name : "",
          overall_size: "",
          client_name: clientName || "",
          description: "",
          image_url: "",
          priority: bunchPriority,
        },
      ];
    });
  };

  const handleRemoveProduct = (index: number) => {
    if (products.length <= 1) {
      alert("At least one product is required.");
      return;
    }
    setProducts((prev) => prev.filter((_, i) => i !== index));
  };

  const handleProductChange = (index: number, field: keyof ProductFormItem, value: any) => {
    setProducts((prev) => {
      const updated = [...prev];
      updated[index] = {
        ...updated[index],
        [field]: value,
      };
      return updated;
    });
  };

  // Upload a single file for a product
  const handleUploadProductImage = async (index: number, file: File) => {
    handleProductChange(index, "uploading", true);
    try {
      // Direct file reader preview first so it feels instant
      const reader = new FileReader();
      reader.onload = (e) => {
        const previewUrl = e.target?.result as string;
        handleProductChange(index, "image_url", previewUrl);
      };
      reader.readAsDataURL(file);

      // Upload to server
      const uploadedUrl = await costingApi.uploadImageFile(file);
      if (uploadedUrl) {
        handleProductChange(index, "image_url", uploadedUrl);
      }
    } catch (err) {
      console.warn("Server upload failed, using local image preview:", err);
    } finally {
      handleProductChange(index, "uploading", false);
    }
  };

  // Bulk Image Upload / Drag and Drop (Creates multiple product listings automatically)
  const handleBulkUploadFiles = async (files: FileList | File[]) => {
    const fileList = Array.from(files).filter((f) => f.type.startsWith("image/"));
    if (fileList.length === 0) return;

    const newItems: ProductFormItem[] = [];
    const startIndex = products.length === 1 && !products[0].product_name && !products[0].image_url ? 0 : products.length;

    for (let i = 0; i < fileList.length; i++) {
      const file = fileList[i];
      const autoCode = getAutoCodeForIndex(startIndex + i);
      const cleanFileName = file.name.replace(/\.[^/.]+$/, "").replace(/[-_]/g, " ");

      // Generate preview URL
      const previewUrl = URL.createObjectURL(file);

      newItems.push({
        id: `prod-${Date.now()}-${i + 1}`,
        product_name: cleanFileName,
        product_code: autoCode,
        product_type: "",
        collection_name: "",
        wood_type: woodTypes.length > 0 ? woodTypes[0].name : "",
        overall_size: "",
        client_name: clientName || "",
        description: "",
        image_url: previewUrl,
        uploading: true,
        priority: bunchPriority,
      });
    }

    if (startIndex === 0) {
      setProducts(newItems);
    } else {
      setProducts((prev) => [...prev, ...newItems]);
    }

    // Upload files to server in background
    for (let i = 0; i < fileList.length; i++) {
      const file = fileList[i];
      const itemIndex = startIndex + i;
      try {
        const uploadedUrl = await costingApi.uploadImageFile(file);
        if (uploadedUrl) {
          handleProductChange(itemIndex, "image_url", uploadedUrl);
        }
      } catch (err) {
        console.warn("Background upload fallback for file:", file.name, err);
      } finally {
        handleProductChange(itemIndex, "uploading", false);
      }
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!merchantName.trim()) {
      alert("Please enter Merchant Name.");
      return;
    }

    for (let i = 0; i < products.length; i++) {
      if (!products[i].product_name.trim()) {
        alert(`Please enter Product Name for Product #${i + 1}.`);
        return;
      }
    }

    setSubmitting(true);
    try {
      const bunch = await costingApi.createRequestBunch({
        merchant_name: merchantName.trim(),
        client_name: clientName.trim() || undefined,
        notes: notes.trim() || undefined,
        priority: bunchPriority,
        items: products.map((p, idx) => ({
          product_name: p.product_name.trim(),
          product_code: p.product_code.trim() || getAutoCodeForIndex(idx),
          product_type: p.product_type.trim() || undefined,
          collection_name: p.collection_name.trim() || undefined,
          wood_type: p.wood_type.trim() || undefined,
          overall_size: p.overall_size.trim() || undefined,
          client_name: (p.client_name || clientName).trim() || undefined,
          description: p.description.trim() || undefined,
          image_url: p.image_url.trim() || undefined,
          priority: p.priority || bunchPriority,
        })),
      });

      setCreatedBunch(bunch);
    } catch (err: any) {
      console.error("Failed to create costing request bunch:", err);
      alert(err?.response?.data?.error?.message || err?.message || "Failed to create request bunch.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div style={{ padding: "24px 32px", maxWidth: 1200, margin: "0 auto", color: "#1f2937" }}>
      {/* Top Header */}
      <div style={{ marginBottom: 20 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          <span style={{ fontSize: 28 }}>📦</span>
          <h1 style={{ fontSize: 24, fontWeight: 700, margin: 0, color: "#111827" }}>
            Costing Request Center
          </h1>
        </div>
      </div>

      {/* Success Notification */}
      {createdBunch && (
        <div
          style={{
            background: "#f0fdf4",
            border: "1.5px solid #86efac",
            borderRadius: 8,
            padding: 20,
            marginBottom: 24,
            boxShadow: "0 4px 12px rgba(22, 101, 52, 0.08)",
          }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 12 }}>
            <span style={{ fontSize: 28 }}>🎉</span>
            <div>
              <h3 style={{ fontSize: 17, fontWeight: 700, color: "#166534", margin: 0 }}>
                Costing Request Submitted Successfully!
              </h3>
              <p style={{ margin: "2px 0 0 0", fontSize: 13, color: "#15803d" }}>
                Bunch Code: <strong>{createdBunch.bunch_code}</strong> | Total Products for Costing: <strong>{createdBunch.total_products}</strong>
              </p>
            </div>
          </div>

          <div style={{ background: "#ffffff", border: "1px solid #bbf7d0", borderRadius: 6, padding: 12, marginBottom: 14 }}>
            <div style={{ fontSize: 12, fontWeight: 700, color: "#166534", marginBottom: 6 }}>
              Auto-Generated Products:
            </div>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(260px, 1fr))", gap: 8 }}>
              {(createdBunch.items || []).map((it: any) => (
                <div key={it.id} style={{ padding: "6px 10px", background: "#f8fafc", borderRadius: 4, border: "1px solid #e2e8f0", fontSize: 12 }}>
                  <span style={{ fontWeight: 700, color: "#2563eb" }}>{it.product_code}</span>: {it.product_name}
                </div>
              ))}
            </div>
          </div>

          <div style={{ display: "flex", gap: 12 }}>
            <button
              type="button"
              onClick={() => navigate("/admin/costing/sku-wise")}
              style={{
                padding: "8px 16px",
                background: "#16a34a",
                color: "#ffffff",
                border: "none",
                borderRadius: 6,
                fontWeight: 600,
                fontSize: 13,
                cursor: "pointer",
              }}
            >
              Go to SKU Wise Costing →
            </button>
            <button
              type="button"
              onClick={() => navigate("/admin/costing/tracker")}
              style={{
                padding: "8px 16px",
                background: "#2563eb",
                color: "#ffffff",
                border: "none",
                borderRadius: 6,
                fontWeight: 600,
                fontSize: 13,
                cursor: "pointer",
              }}
            >
              Open Costing Tracker ⏱️
            </button>
            <button
              type="button"
              onClick={() => {
                setCreatedBunch(null);
                setProducts([
                  {
                    id: "prod-1",
                    product_name: "",
                    product_code: `${bunchCodePrefix}-P01`,
                    product_type: "",
                    collection_name: "",
                    wood_type: woodTypes.length > 0 ? woodTypes[0].name : "",
                    overall_size: "",
                    client_name: "",
                    description: "",
                    image_url: "",
                    priority: "Normal",
                  },
                ]);
              }}
              style={{
                padding: "8px 16px",
                background: "#ffffff",
                color: "#374151",
                border: "1px solid #d1d5db",
                borderRadius: 6,
                fontWeight: 600,
                fontSize: 13,
                cursor: "pointer",
              }}
            >
              + Create Another Request
            </button>
          </div>
        </div>
      )}

      {/* Main Request Form */}
      <form onSubmit={handleSubmit}>
        {/* Merchant Details Card */}
        <div style={{ background: "#ffffff", border: "1px solid #e5e7eb", borderRadius: 8, padding: 20, marginBottom: 20 }}>
          <h2 style={{ fontSize: 16, fontWeight: 700, margin: "0 0 16px 0", color: "#111827" }}>
            Merchant Information
          </h2>

          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))", gap: 16 }}>
            <div>
              <label style={{ display: "block", fontSize: 13, fontWeight: 600, color: "#374151", marginBottom: 6 }}>
                Merchant Name <span style={{ color: "#ef4444" }}>*</span>
              </label>
              <input
                type="text"
                value={merchantName}
                onChange={(e) => setMerchantName(e.target.value)}
                required
                placeholder="Merchant Name"
                style={{ width: "100%", padding: "8px 12px", borderRadius: 6, border: "1px solid #d1d5db", fontSize: 14 }}
              />
            </div>

            <div>
              <label style={{ display: "block", fontSize: 13, fontWeight: 600, color: "#374151", marginBottom: 6 }}>
                Client / Buyer Name
              </label>
              <input
                type="text"
                value={clientName}
                onChange={(e) => setClientName(e.target.value)}
                placeholder="Client Name"
                style={{ width: "100%", padding: "8px 12px", borderRadius: 6, border: "1px solid #d1d5db", fontSize: 14 }}
              />
            </div>

            <div>
              <label style={{ display: "block", fontSize: 13, fontWeight: 600, color: "#374151", marginBottom: 6 }}>
                Priority Level
              </label>
              <select
                value={bunchPriority}
                onChange={(e) => setBunchPriority(e.target.value as any)}
                style={{ width: "100%", padding: "8px 12px", borderRadius: 6, border: "1px solid #d1d5db", fontSize: 14, fontWeight: 600 }}
              >
                <option value="Normal">🟢 Normal</option>
                <option value="High">🟠 High</option>
                <option value="Urgent">🔴 Urgent</option>
              </select>
            </div>
          </div>

          <div style={{ marginTop: 14 }}>
            <label style={{ display: "block", fontSize: 13, fontWeight: 600, color: "#374151", marginBottom: 6 }}>
              Notes / Instructions
            </label>
            <textarea
              rows={2}
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Additional instructions or requirements"
              style={{ width: "100%", padding: "8px 12px", borderRadius: 6, border: "1px solid #d1d5db", fontSize: 13 }}
            />
          </div>
        </div>

        {/* Bulk Photo Upload Drop Zone */}
        <div
          onDragOver={(e) => e.preventDefault()}
          onDrop={(e) => {
            e.preventDefault();
            if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
              handleBulkUploadFiles(e.dataTransfer.files);
            }
          }}
          style={{
            background: "#f0fdf4",
            border: "2px dashed #86efac",
            borderRadius: 8,
            padding: "20px 24px",
            marginBottom: 20,
            textAlign: "center",
            cursor: "pointer",
          }}
          onClick={() => bulkFileInputRef.current?.click()}
        >
          <input
            type="file"
            ref={bulkFileInputRef}
            multiple
            accept="image/*"
            style={{ display: "none" }}
            onChange={(e) => {
              if (e.target.files && e.target.files.length > 0) {
                handleBulkUploadFiles(e.target.files);
              }
            }}
          />
          <div style={{ fontSize: 32, marginBottom: 6 }}>📸</div>
          <div style={{ fontSize: 15, fontWeight: 700, color: "#166534" }}>
            Instant Bulk Photo Upload: Drag & Drop Multiple Product Photos Here
          </div>
          <div style={{ fontSize: 13, color: "#15803d", marginTop: 4 }}>
            Drop 2, 5 or 10+ photos together. System automatically creates product cards with images & auto-generated codes.
          </div>
          <button
            type="button"
            style={{
              marginTop: 10,
              padding: "6px 16px",
              background: "#16a34a",
              color: "#ffffff",
              border: "none",
              borderRadius: 6,
              fontWeight: 600,
              fontSize: 12,
              cursor: "pointer",
            }}
          >
            Browse Multiple Photos
          </button>
        </div>

        {/* Products Section */}
        <div style={{ marginBottom: 20 }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 14 }}>
            <h2 style={{ fontSize: 16, fontWeight: 700, margin: 0, color: "#111827" }}>
              Total Products for Costing: {products.length}
            </h2>
            <button
              type="button"
              onClick={handleAddProduct}
              style={{
                padding: "8px 16px",
                background: "#2563eb",
                color: "#ffffff",
                border: "none",
                borderRadius: 6,
                fontWeight: 600,
                fontSize: 13,
                cursor: "pointer",
                display: "flex",
                alignItems: "center",
                gap: 6,
              }}
            >
              <span>+</span> Add Product
            </button>
          </div>

          {products.map((item, index) => (
            <div
              key={item.id}
              style={{
                background: "#ffffff",
                border: "1px solid #e5e7eb",
                borderRadius: 8,
                padding: 20,
                marginBottom: 16,
                boxShadow: "0 1px 3px rgba(0,0,0,0.04)",
              }}
            >
              {/* Product Header Bar */}
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", borderBottom: "1px solid #f1f5f9", paddingBottom: 10, marginBottom: 14 }}>
                <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                  <span
                    style={{
                      background: "#e0e7ff",
                      color: "#3730a3",
                      fontSize: 12,
                      fontWeight: 700,
                      padding: "3px 10px",
                      borderRadius: 12,
                    }}
                  >
                    Product #{index + 1}
                  </span>
                  <span style={{ fontSize: 13, fontWeight: 700, color: "#2563eb" }}>
                    {item.product_code || getAutoCodeForIndex(index)}
                  </span>
                </div>

                {products.length > 1 && (
                  <button
                    type="button"
                    onClick={() => handleRemoveProduct(index)}
                    style={{
                      background: "none",
                      border: "none",
                      color: "#dc2626",
                      fontWeight: 600,
                      fontSize: 13,
                      cursor: "pointer",
                    }}
                  >
                    🗑️ Remove
                  </button>
                )}
              </div>

              {/* Product Layout: Photo Upload Zone on Left + Form Fields on Right */}
              <div style={{ display: "grid", gridTemplateColumns: "180px 1fr", gap: 20 }}>
                {/* Photo Upload / Drag Zone */}
                <div>
                  <label style={{ display: "block", fontSize: 12, fontWeight: 600, color: "#374151", marginBottom: 6 }}>
                    Product Photo
                  </label>
                  <div
                    onDragOver={(e) => e.preventDefault()}
                    onDrop={(e) => {
                      e.preventDefault();
                      if (e.dataTransfer.files && e.dataTransfer.files[0]) {
                        handleUploadProductImage(index, e.dataTransfer.files[0]);
                      }
                    }}
                    onClick={() => {
                      const input = document.createElement("input");
                      input.type = "file";
                      input.accept = "image/*";
                      input.onchange = (e: any) => {
                        if (e.target.files && e.target.files[0]) {
                          handleUploadProductImage(index, e.target.files[0]);
                        }
                      };
                      input.click();
                    }}
                    style={{
                      width: "100%",
                      height: 140,
                      border: "2px dashed #cbd5e1",
                      borderRadius: 8,
                      background: "#f8fafc",
                      display: "flex",
                      flexDirection: "column",
                      alignItems: "center",
                      justifyContent: "center",
                      cursor: "pointer",
                      position: "relative",
                      overflow: "hidden",
                    }}
                  >
                    {item.image_url ? (
                      <img
                        src={item.image_url}
                        alt="Product"
                        style={{ width: "100%", height: "100%", objectFit: "cover" }}
                      />
                    ) : item.uploading ? (
                      <div style={{ fontSize: 12, color: "#2563eb", fontWeight: 600 }}>Uploading...</div>
                    ) : (
                      <>
                        <span style={{ fontSize: 24, marginBottom: 4 }}>📷</span>
                        <span style={{ fontSize: 11, fontWeight: 600, color: "#2563eb" }}>Click / Drag Photo</span>
                        <span style={{ fontSize: 10, color: "#94a3b8" }}>Upload image</span>
                      </>
                    )}
                  </div>
                  {item.image_url && (
                    <button
                      type="button"
                      onClick={() => handleProductChange(index, "image_url", "")}
                      style={{
                        marginTop: 6,
                        width: "100%",
                        padding: "4px 8px",
                        background: "#fee2e2",
                        color: "#991b1b",
                        border: "none",
                        borderRadius: 4,
                        fontSize: 11,
                        fontWeight: 600,
                        cursor: "pointer",
                      }}
                    >
                      ✕ Remove Photo
                    </button>
                  )}
                </div>

                {/* Fields Grid */}
                <div>
                  <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))", gap: 12, marginBottom: 12 }}>
                    <div>
                      <label style={{ display: "block", fontSize: 12, fontWeight: 600, color: "#374151", marginBottom: 4 }}>
                        Product Name <span style={{ color: "#ef4444" }}>*</span>
                      </label>
                      <input
                        type="text"
                        required
                        value={item.product_name}
                        onChange={(e) => handleProductChange(index, "product_name", e.target.value)}
                        placeholder="Product Name"
                        style={{ width: "100%", padding: "7px 10px", borderRadius: 6, border: "1px solid #d1d5db", fontSize: 13, fontWeight: 600 }}
                      />
                    </div>

                    <div>
                      <label style={{ display: "block", fontSize: 12, fontWeight: 600, color: "#374151", marginBottom: 4 }}>
                        Product Code (Auto-Generated)
                      </label>
                      <input
                        type="text"
                        value={item.product_code || getAutoCodeForIndex(index)}
                        onChange={(e) => handleProductChange(index, "product_code", e.target.value)}
                        style={{ width: "100%", padding: "7px 10px", borderRadius: 6, border: "1.5px solid #93c5fd", background: "#f0fdf4", color: "#166534", fontSize: 13, fontWeight: 700 }}
                      />
                    </div>

                    <div>
                      <label style={{ display: "block", fontSize: 12, fontWeight: 600, color: "#374151", marginBottom: 4 }}>
                        Wood Type (Master Data)
                      </label>
                      <select
                        value={item.wood_type}
                        onChange={(e) => handleProductChange(index, "wood_type", e.target.value)}
                        style={{ width: "100%", padding: "7px 10px", borderRadius: 6, border: "1px solid #d1d5db", fontSize: 13, fontWeight: 600 }}
                      >
                        <option value="">-- Select Wood Type --</option>
                        {woodTypes.map((wt) => (
                          <option key={wt.id} value={wt.name}>
                            {wt.name}
                          </option>
                        ))}
                      </select>
                    </div>

                    <div>
                      <label style={{ display: "block", fontSize: 12, fontWeight: 600, color: "#374151", marginBottom: 4 }}>
                        Product Type
                      </label>
                      <select
                        value={item.product_type}
                        onChange={(e) => handleProductChange(index, "product_type", e.target.value)}
                        style={{ width: "100%", padding: "7px 10px", borderRadius: 6, border: "1px solid #d1d5db", fontSize: 13 }}
                      >
                        <option value="">-- Select Product Type --</option>
                        {FURNITURE_PRODUCT_TYPES.map((t) => (
                          <option key={t} value={t}>
                            {t}
                          </option>
                        ))}
                      </select>
                    </div>

                    <div>
                      <label style={{ display: "block", fontSize: 12, fontWeight: 600, color: "#374151", marginBottom: 4 }}>
                        Overall Size / Dimensions
                      </label>
                      <input
                        type="text"
                        value={item.overall_size}
                        onChange={(e) => handleProductChange(index, "overall_size", e.target.value)}
                        placeholder="Dimensions (L x W x H)"
                        style={{ width: "100%", padding: "7px 10px", borderRadius: 6, border: "1px solid #d1d5db", fontSize: 13 }}
                      />
                    </div>

                    <div>
                      <label style={{ display: "block", fontSize: 12, fontWeight: 600, color: "#374151", marginBottom: 4 }}>
                        Collection Name
                      </label>
                      <input
                        type="text"
                        value={item.collection_name}
                        onChange={(e) => handleProductChange(index, "collection_name", e.target.value)}
                        placeholder="Collection Name"
                        style={{ width: "100%", padding: "7px 10px", borderRadius: 6, border: "1px solid #d1d5db", fontSize: 13 }}
                      />
                    </div>
                  </div>

                  <div>
                    <label style={{ display: "block", fontSize: 12, fontWeight: 600, color: "#4b5563", marginBottom: 4 }}>
                      Specifications / Details
                    </label>
                    <textarea
                      rows={2}
                      value={item.description}
                      onChange={(e) => handleProductChange(index, "description", e.target.value)}
                      placeholder="Product details, finish specifications or special instructions"
                      style={{ width: "100%", padding: "6px 10px", borderRadius: 6, border: "1px solid #d1d5db", fontSize: 12 }}
                    />
                  </div>
                </div>
              </div>
            </div>
          ))}

          {/* Quick Add Button Bar */}
          <button
            type="button"
            onClick={handleAddProduct}
            style={{
              width: "100%",
              padding: "12px",
              background: "#f8fafc",
              border: "1.5px dashed #cbd5e1",
              borderRadius: 8,
              fontSize: 14,
              fontWeight: 600,
              color: "#2563eb",
              cursor: "pointer",
              marginBottom: 20,
            }}
          >
            + Add Another Product
          </button>
        </div>

        {/* Action Submit Bar */}
        <div
          style={{
            background: "#ffffff",
            border: "1px solid #e5e7eb",
            borderRadius: 8,
            padding: "16px 20px",
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
          }}
        >
          <div>
            <div style={{ fontSize: 15, fontWeight: 700, color: "#111827" }}>
              Total Products for Costing: {products.length}
            </div>
            <div style={{ fontSize: 12, color: "#6b7280" }}>
              Merchant: <strong>{merchantName || "Not set"}</strong> | Priority: <strong>{bunchPriority}</strong>
            </div>
          </div>

          <div style={{ display: "flex", gap: 12 }}>
            <button
              type="button"
              onClick={() => navigate("/admin/costing/dashboard")}
              style={{
                padding: "10px 18px",
                background: "#f3f4f6",
                color: "#374151",
                border: "1px solid #d1d5db",
                borderRadius: 6,
                fontWeight: 600,
                fontSize: 14,
                cursor: "pointer",
              }}
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={submitting}
              style={{
                padding: "10px 24px",
                background: "#2563eb",
                color: "#ffffff",
                border: "none",
                borderRadius: 6,
                fontWeight: 700,
                fontSize: 14,
                cursor: submitting ? "not-allowed" : "pointer",
                opacity: submitting ? 0.7 : 1,
              }}
            >
              {submitting ? "Submitting..." : "🚀 Submit Costing Request"}
            </button>
          </div>
        </div>
      </form>
    </div>
  );
}
