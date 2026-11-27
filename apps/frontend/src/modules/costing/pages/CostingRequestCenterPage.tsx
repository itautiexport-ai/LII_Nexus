import React, { useEffect, useState, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { costingApi, FURNITURE_PRODUCT_TYPES } from "../api/costingApi";
import { masterDataApi, WoodType } from "../../admin/masterdata/api/masterDataApi";
import { useAuthStore } from "../../auth/hooks/useAuthStore";

interface ProductFormItem {
  id: string;
  product_name: string;
  costing_code: string;
  buyer_code: string;
  product_type: string;
  collection_name: string;
  sample_availability: "Not Available" | "Sample Available";
  wood_type: string;
  overall_size: string;
  client_name: string;
  target_price: string;
  target_currency: string;
  description: string;
  image_url: string;
  image_urls: string[];
  activeImageIndex: number;
  uploading?: boolean;
  priority: "Normal" | "High" | "Urgent";
}

export default function CostingRequestCenterPage() {
  const navigate = useNavigate();
  const user = useAuthStore((s) => s.user);

  const [merchantName, setMerchantName] = useState(user?.fullName || "");
  const [clientName, setClientName] = useState("");
  const [requestPriority, setRequestPriority] = useState<"Normal" | "High" | "Urgent">("Normal");
  const [notes, setNotes] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [createdRequest, setCreatedRequest] = useState<any | null>(null);

  // Master Data: Wood Types
  const [woodTypes, setWoodTypes] = useState<WoodType[]>([]);
  const [nextCodeBase, setNextCodeBase] = useState<number>(1);

  const [products, setProducts] = useState<ProductFormItem[]>([
    {
      id: "prod-1",
      product_name: "",
      costing_code: "1",
      buyer_code: "",
      product_type: "",
      collection_name: "",
      sample_availability: "Not Available",
      wood_type: "",
      overall_size: "",
      client_name: "",
      target_price: "",
      target_currency: "USD",
      description: "",
      image_url: "",
      image_urls: [],
      activeImageIndex: 0,
      priority: "Normal",
    },
  ]);

  const bulkFileInputRef = useRef<HTMLInputElement | null>(null);

  useEffect(() => {
    if (user?.fullName && !merchantName) {
      setMerchantName(user.fullName);
    }
  }, [user?.fullName]);

  const fetchNextCostingCode = async (resetFirstProduct: boolean = false) => {
    try {
      const res = await costingApi.getNextCodes(1);
      const startNum = Number(res?.nextCostingCode || 1);
      setNextCodeBase(startNum);
      setProducts((prev) => {
        if (resetFirstProduct) {
          return [
            {
              id: `prod-${Date.now()}-1`,
              product_name: "",
              costing_code: String(startNum),
              buyer_code: "",
              product_type: "",
              collection_name: "",
              sample_availability: "Not Available",
              wood_type: woodTypes.length > 0 ? woodTypes[0].name : "",
              overall_size: "",
              client_name: "",
              target_price: "",
              target_currency: "USD",
              description: "",
              image_url: "",
              image_urls: [],
              activeImageIndex: 0,
              priority: "Normal",
            },
          ];
        }
        if (prev.length === 1 && !prev[0].product_name) {
          return [{ ...prev[0], costing_code: String(startNum) }];
        }
        return prev;
      });
    } catch {
      setNextCodeBase(1);
    }
  };

  useEffect(() => {
    // Load Wood Types from Master Data
    masterDataApi
      .getWoodTypes()
      .then((data) => setWoodTypes(data || []))
      .catch((err) => console.error("Failed to load wood types master:", err));

    // Fetch next sequential numeric costing code (1, 2, 3...)
    fetchNextCostingCode(false);
  }, []);

  const getNextNumericCode = (currentList: ProductFormItem[]): string => {
    let maxVal = nextCodeBase - 1;
    currentList.forEach((p) => {
      const parsed = parseInt((p.costing_code || "").trim(), 10);
      if (!isNaN(parsed) && parsed > maxVal) {
        maxVal = parsed;
      }
    });
    return String(maxVal + 1);
  };

  const handleAddProduct = () => {
    setProducts((prev) => {
      const nextCode = getNextNumericCode(prev);
      return [
        ...prev,
        {
          id: `prod-${Date.now()}-${prev.length + 1}`,
          product_name: "",
          costing_code: nextCode,
          buyer_code: "",
          product_type: "",
          collection_name: "",
          sample_availability: "Not Available",
          wood_type: woodTypes.length > 0 ? woodTypes[0].name : "",
          overall_size: "",
          client_name: clientName || "",
          target_price: "",
          target_currency: "USD",
          description: "",
          image_url: "",
          image_urls: [],
          activeImageIndex: 0,
          priority: requestPriority,
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

  // Upload one or multiple side/angle photos for a single product
  const handleUploadProductImages = async (index: number, files: FileList | File[]) => {
    const fileArr = Array.from(files).filter((f) => f.type.startsWith("image/"));
    if (fileArr.length === 0) return;

    handleProductChange(index, "uploading", true);
    try {
      const previewUrls = fileArr.map((f) => URL.createObjectURL(f));

      // Append previews immediately and switch view to the first newly added photo
      let startSlot = 0;
      setProducts((prev) => {
        const updated = [...prev];
        const existing = updated[index].image_urls || [];
        startSlot = existing.length;
        const merged = [...existing, ...previewUrls];
        updated[index] = {
          ...updated[index],
          image_urls: merged,
          image_url: merged[0] || "",
          activeImageIndex: startSlot,
        };
        return updated;
      });

      // Upload each file to server and replace its preview slot
      for (let i = 0; i < fileArr.length; i++) {
        try {
          const uploadedUrl = await costingApi.uploadImageFile(fileArr[i]);
          if (uploadedUrl) {
            const targetSlot = startSlot + i;
            setProducts((prev) => {
              const updated = [...prev];
              if (!updated[index]) return prev;
              const urls = [...(updated[index].image_urls || [])];
              if (targetSlot < urls.length) {
                urls[targetSlot] = uploadedUrl;
              }
              updated[index] = {
                ...updated[index],
                image_urls: urls,
                image_url: urls[0] || "",
              };
              return updated;
            });
          }
        } catch (err) {
          console.warn("Server upload failed, keeping local preview:", err);
        }
      }
    } finally {
      handleProductChange(index, "uploading", false);
    }
  };

  const handleRemoveCurrentImage = (index: number) => {
    setProducts((prev) => {
      const updated = [...prev];
      const item = updated[index];
      const urls = [...(item.image_urls || [])];
      if (urls.length === 0) return prev;
      const removeIdx = Math.min(item.activeImageIndex || 0, urls.length - 1);
      urls.splice(removeIdx, 1);
      const nextActive = urls.length === 0 ? 0 : Math.min(removeIdx, urls.length - 1);
      updated[index] = {
        ...item,
        image_urls: urls,
        image_url: urls[0] || "",
        activeImageIndex: nextActive,
      };
      return updated;
    });
  };

  const handleCycleImage = (index: number, direction: -1 | 1) => {
    setProducts((prev) => {
      const updated = [...prev];
      const item = updated[index];
      const total = (item.image_urls || []).length;
      if (total <= 1) return prev;
      const nextIdx = ((item.activeImageIndex || 0) + direction + total) % total;
      updated[index] = {
        ...item,
        activeImageIndex: nextIdx,
      };
      return updated;
    });
  };

  // Bulk Image Upload / Drag and Drop (1 product card per photo)
  const handleBulkUploadFiles = async (files: FileList | File[]) => {
    const fileList = Array.from(files).filter((f) => f.type.startsWith("image/"));
    if (fileList.length === 0) return;

    const replaceFirst = products.length === 1 && !products[0].product_name && products[0].image_urls.length === 0;
    const startIndex = replaceFirst ? 0 : products.length;
    let runningCode = replaceFirst ? nextCodeBase : parseInt(getNextNumericCode(products), 10);

    const newItems: ProductFormItem[] = [];
    for (let i = 0; i < fileList.length; i++) {
      const file = fileList[i];
      const cleanFileName = file.name.replace(/\.[^/.]+$/, "").replace(/[-_]/g, " ");
      const previewUrl = URL.createObjectURL(file);

      newItems.push({
        id: `prod-${Date.now()}-${i + 1}`,
        product_name: cleanFileName,
        costing_code: String(runningCode++),
        buyer_code: "",
        product_type: "",
        collection_name: "",
        sample_availability: "Not Available",
        wood_type: woodTypes.length > 0 ? woodTypes[0].name : "",
        overall_size: "",
        client_name: clientName || "",
        target_price: "",
        target_currency: "USD",
        description: "",
        image_url: previewUrl,
        image_urls: [previewUrl],
        activeImageIndex: 0,
        uploading: true,
        priority: requestPriority,
      });
    }

    if (replaceFirst) {
      setProducts(newItems);
    } else {
      setProducts((prev) => [...prev, ...newItems]);
    }

    for (let i = 0; i < fileList.length; i++) {
      const file = fileList[i];
      const itemIndex = startIndex + i;
      try {
        const uploadedUrl = await costingApi.uploadImageFile(file);
        if (uploadedUrl) {
          setProducts((prev) => {
            const updated = [...prev];
            if (!updated[itemIndex]) return prev;
            const urls = [...(updated[itemIndex].image_urls || [])];
            urls[0] = uploadedUrl;
            updated[itemIndex] = {
              ...updated[itemIndex],
              image_url: uploadedUrl,
              image_urls: urls,
            };
            return updated;
          });
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
    const effectiveMerchant = merchantName.trim() || user?.fullName?.trim() || "";
    if (!effectiveMerchant) {
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
      const res = await costingApi.createRequestBunch({
        merchant_name: effectiveMerchant,
        client_name: clientName.trim() || undefined,
        notes: notes.trim() || undefined,
        priority: requestPriority,
        items: products.map((p, idx) => ({
          product_name: p.product_name.trim(),
          costing_code: p.costing_code.trim() || String(nextCodeBase + idx),
          buyer_code: p.buyer_code.trim() || undefined,
          product_code: p.costing_code.trim() || String(nextCodeBase + idx),
          product_type: p.product_type.trim() || undefined,
          collection_name: p.collection_name.trim() || undefined,
          sample_availability: p.sample_availability || "Not Available",
          wood_type: p.wood_type.trim() || undefined,
          overall_size: p.overall_size.trim() || undefined,
          client_name: (p.client_name || clientName).trim() || undefined,
          target_price: p.target_price.trim() !== "" ? Number(p.target_price) : null,
          target_currency: p.target_currency || "USD",
          description: p.description.trim() || undefined,
          image_url: (p.image_urls[0] || p.image_url || "").trim() || undefined,
          image_urls: (p.image_urls || []).map((u) => u.trim()).filter(Boolean),
          priority: p.priority || requestPriority,
        })),
      });

      setCreatedRequest(res);
    } catch (err: any) {
      console.error("Failed to create costing request:", err);
      alert(err?.response?.data?.error?.message || err?.message || "Failed to submit costing request.");
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
      {createdRequest && (
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
                Merchant Folder: <strong>📁 {createdRequest.merchant_name}</strong> | Total Products Submitted:{" "}
                <strong>{createdRequest.total_products}</strong>
              </p>
            </div>
          </div>

          <div style={{ background: "#ffffff", border: "1px solid #bbf7d0", borderRadius: 6, padding: 12, marginBottom: 14 }}>
            <div style={{ fontSize: 12, fontWeight: 700, color: "#166534", marginBottom: 6 }}>
              Submitted Products:
            </div>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(260px, 1fr))", gap: 8 }}>
              {(createdRequest.items || []).map((it: any) => (
                <div key={it.id} style={{ padding: "6px 10px", background: "#f8fafc", borderRadius: 4, border: "1px solid #e2e8f0", fontSize: 12 }}>
                  <span style={{ fontWeight: 700, color: "#2563eb" }}>
                    Costing #{it.costing_code || it.product_code}
                  </span>
                  {it.buyer_code && (
                    <span style={{ color: "#6d28d9", fontWeight: 600 }}> ({it.buyer_code})</span>
                  )}
                  : {it.product_name}
                </div>
              ))}
            </div>
          </div>

          <div style={{ display: "flex", gap: 12, flexWrap: "wrap" }}>
            <button
              type="button"
              onClick={() => navigate(`/admin/costing/merchant-wise?merchant=${encodeURIComponent(createdRequest.merchant_name)}`)}
              style={{
                padding: "8px 16px",
                background: "#4f46e5",
                color: "#ffffff",
                border: "none",
                borderRadius: 6,
                fontWeight: 600,
                fontSize: 13,
                cursor: "pointer",
              }}
            >
              📂 Open {createdRequest.merchant_name}'s Folder →
            </button>
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
              onClick={() => {
                setCreatedRequest(null);
                fetchNextCostingCode(true);
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
                Merchant Name (Folder Name) <span style={{ color: "#ef4444" }}>*</span>
              </label>
              <input
                type="text"
                value={merchantName}
                onChange={(e) => setMerchantName(e.target.value)}
                required
                placeholder="Merchant Name"
                style={{ width: "100%", padding: "8px 12px", borderRadius: 6, border: "1px solid #d1d5db", fontSize: 14, fontWeight: 600 }}
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
                value={requestPriority}
                onChange={(e) => setRequestPriority(e.target.value as any)}
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
                  <span style={{ fontSize: 13, fontWeight: 700, color: "#166534", background: "#dcfce7", padding: "3px 10px", borderRadius: 12 }}>
                    Costing Code: {item.costing_code || String(nextCodeBase + index)}
                  </span>
                  {item.buyer_code && (
                    <span style={{ fontSize: 12, fontWeight: 700, color: "#6d28d9", background: "#ede9fe", padding: "3px 10px", borderRadius: 12 }}>
                      Buyer Code: {item.buyer_code}
                    </span>
                  )}
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
                {/* Photo Upload / Multi-Angle Carousel Zone */}
                <div>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 6 }}>
                    <label style={{ fontSize: 12, fontWeight: 600, color: "#374151" }}>
                      Product Photos
                    </label>
                    {item.image_urls.length > 0 && (
                      <span style={{ fontSize: 11, fontWeight: 700, color: "#2563eb", background: "#eff6ff", padding: "1px 7px", borderRadius: 10 }}>
                        {item.image_urls.length} {item.image_urls.length === 1 ? "Photo" : "Photos"}
                      </span>
                    )}
                  </div>

                  {(() => {
                    const totalPhotos = item.image_urls.length;
                    const activeIdx = totalPhotos > 0 ? Math.min(item.activeImageIndex || 0, totalPhotos - 1) : 0;
                    const currentPhoto = totalPhotos > 0 ? item.image_urls[activeIdx] : "";

                    const openFilePicker = (multiple: boolean) => {
                      const input = document.createElement("input");
                      input.type = "file";
                      input.accept = "image/*";
                      input.multiple = multiple;
                      input.onchange = (e: any) => {
                        if (e.target.files && e.target.files.length > 0) {
                          handleUploadProductImages(index, e.target.files);
                        }
                      };
                      input.click();
                    };

                    return (
                      <>
                        <div
                          onDragOver={(e) => e.preventDefault()}
                          onDrop={(e) => {
                            e.preventDefault();
                            if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
                              handleUploadProductImages(index, e.dataTransfer.files);
                            }
                          }}
                          onClick={() => openFilePicker(totalPhotos > 0)}
                          style={{
                            width: "100%",
                            height: 150,
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
                          title={totalPhotos > 0 ? "Click or drag to add more side/angle photos" : "Click or drag to upload photo"}
                        >
                          {currentPhoto ? (
                            <>
                              <img
                                src={currentPhoto}
                                alt={`Product view ${activeIdx + 1}`}
                                style={{ width: "100%", height: "100%", objectFit: "cover" }}
                              />
                              {totalPhotos > 1 && (
                                <span
                                  style={{
                                    position: "absolute",
                                    top: 6,
                                    right: 6,
                                    background: "rgba(15, 23, 42, 0.72)",
                                    color: "#ffffff",
                                    fontSize: 10,
                                    fontWeight: 700,
                                    padding: "2px 7px",
                                    borderRadius: 10,
                                  }}
                                >
                                  {activeIdx + 1} / {totalPhotos}
                                </span>
                              )}
                            </>
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

                        {/* Arrow Navigation Below Image (when 2+ photos uploaded) */}
                        {totalPhotos > 1 && (
                          <div
                            style={{
                              display: "flex",
                              alignItems: "center",
                              justifyContent: "space-between",
                              marginTop: 6,
                              background: "#f1f5f9",
                              borderRadius: 6,
                              padding: "4px 6px",
                            }}
                          >
                            <button
                              type="button"
                              onClick={() => handleCycleImage(index, -1)}
                              style={{
                                width: 28,
                                height: 24,
                                border: "1px solid #cbd5e1",
                                background: "#ffffff",
                                borderRadius: 4,
                                cursor: "pointer",
                                fontWeight: 800,
                                color: "#1e293b",
                                fontSize: 12,
                                display: "flex",
                                alignItems: "center",
                                justifyContent: "center",
                              }}
                              title="Previous photo"
                            >
                              ◀
                            </button>
                            <span style={{ fontSize: 11, fontWeight: 700, color: "#475569" }}>
                              Photo {activeIdx + 1} / {totalPhotos}
                            </span>
                            <button
                              type="button"
                              onClick={() => handleCycleImage(index, 1)}
                              style={{
                                width: 28,
                                height: 24,
                                border: "1px solid #cbd5e1",
                                background: "#ffffff",
                                borderRadius: 4,
                                cursor: "pointer",
                                fontWeight: 800,
                                color: "#1e293b",
                                fontSize: 12,
                                display: "flex",
                                alignItems: "center",
                                justifyContent: "center",
                              }}
                              title="Next photo"
                            >
                              ▶
                            </button>
                          </div>
                        )}

                        {/* Add More Photos (Different Sides) + Remove Current Photo */}
                        {totalPhotos > 0 && (
                          <div style={{ display: "flex", flexDirection: "column", gap: 5, marginTop: 6 }}>
                            <button
                              type="button"
                              onClick={() => openFilePicker(true)}
                              style={{
                                width: "100%",
                                padding: "5px 8px",
                                background: "#eff6ff",
                                color: "#1d4ed8",
                                border: "1px solid #93c5fd",
                                borderRadius: 4,
                                fontSize: 11,
                                fontWeight: 700,
                                cursor: "pointer",
                              }}
                            >
                              + Add More Photos
                            </button>
                            <button
                              type="button"
                              onClick={() => handleRemoveCurrentImage(index)}
                              style={{
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
                              ✕ Remove This Photo
                            </button>
                          </div>
                        )}
                      </>
                    );
                  })()}
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
                        Costing Code (Auto Numeric)
                      </label>
                      <input
                        type="text"
                        value={item.costing_code}
                        onChange={(e) => handleProductChange(index, "costing_code", e.target.value)}
                        placeholder="e.g. 1, 2, 3"
                        style={{
                          width: "100%",
                          padding: "7px 10px",
                          borderRadius: 6,
                          border: "1.5px solid #93c5fd",
                          background: "#f0fdf4",
                          color: "#166534",
                          fontSize: 13,
                          fontWeight: 700,
                        }}
                      />
                    </div>

                    <div>
                      <label style={{ display: "block", fontSize: 12, fontWeight: 600, color: "#374151", marginBottom: 4 }}>
                        Buyer Code
                      </label>
                      <input
                        type="text"
                        value={item.buyer_code}
                        onChange={(e) => handleProductChange(index, "buyer_code", e.target.value)}
                        placeholder="Enter Buyer Code"
                        style={{
                          width: "100%",
                          padding: "7px 10px",
                          borderRadius: 6,
                          border: "1px solid #d1d5db",
                          fontSize: 13,
                          fontWeight: 600,
                        }}
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

                    <div>
                      <label style={{ display: "block", fontSize: 12, fontWeight: 600, color: "#374151", marginBottom: 4 }}>
                        Sample Status
                      </label>
                      <select
                        value={item.sample_availability || "Not Available"}
                        onChange={(e) => handleProductChange(index, "sample_availability", e.target.value)}
                        style={{ width: "100%", padding: "7px 10px", borderRadius: 6, border: "1px solid #d1d5db", fontSize: 13, fontWeight: 600 }}
                      >
                        <option value="Not Available">Not Available</option>
                        <option value="Sample Available">Sample Available</option>
                      </select>
                    </div>

                    <div>
                      <label style={{ display: "block", fontSize: 12, fontWeight: 600, color: "#374151", marginBottom: 4 }}>
                        Buyer Target Price <span style={{ fontSize: 10, color: "#9ca3af", fontWeight: 400 }}>(Optional)</span>
                      </label>
                      <div style={{ display: "flex", gap: 6 }}>
                        <select
                          value={item.target_currency || "USD"}
                          onChange={(e) => handleProductChange(index, "target_currency", e.target.value)}
                          style={{ width: 82, padding: "7px 6px", borderRadius: 6, border: "1px solid #d1d5db", fontSize: 12, fontWeight: 700, background: "#f8fafc" }}
                        >
                          <option value="USD">USD ($)</option>
                          <option value="INR">INR (₹)</option>
                          <option value="EUR">EUR (€)</option>
                          <option value="GBP">GBP (£)</option>
                          <option value="AED">AED</option>
                          <option value="AUD">AUD</option>
                          <option value="CAD">CAD</option>
                        </select>
                        <input
                          type="number"
                          step="0.01"
                          min="0"
                          value={item.target_price}
                          onChange={(e) => handleProductChange(index, "target_price", e.target.value)}
                          placeholder="Target Price"
                          style={{ flex: 1, minWidth: 0, padding: "7px 10px", borderRadius: 6, border: "1px solid #d1d5db", fontSize: 13 }}
                        />
                      </div>
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
              Merchant Folder: <strong>{merchantName || "Not set"}</strong> | Priority: <strong>{requestPriority}</strong>
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
