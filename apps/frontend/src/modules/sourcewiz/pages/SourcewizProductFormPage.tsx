import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { documentApi } from "../../documents/api/documentApi";
import "../Sourcewiz.css";

interface ProductImage {
  id: string;
  label: string;
  url: string;
  previewUrl: string;
  isMain?: boolean;
}

export default function SourcewizProductFormPage() {
  const navigate = useNavigate();

  // Active top-level tab ("Images" or "Details")
  const [activeTab, setActiveTab] = useState<"Images" | "Details">("Details");

  // Accordion section open/close states under "Details"
  const [openSections, setOpenSections] = useState<{ [key: string]: boolean }>({
    basicDetails: true,
    productInfo: true,
    internalDetails: true,
    productionDetails: false,
  });

  const toggleSection = (sectionKey: string) => {
    setOpenSections((prev) => ({ ...prev, [sectionKey]: !prev[sectionKey] }));
  };

  // Start with empty images list (no pre-filled example images)
  const [images, setImages] = useState<ProductImage[]>([]);

  // Form details matching exact user screenshots
  const [formData, setFormData] = useState({
    // Basic Details
    category: "",
    subCategory: "",
    productId: "",

    // Product Info
    costPriceCurrency: "USD",
    costPriceVal: "",
    costPriceUnit: "per Pc",
    collectionName: "",
    color: "",
    productionTechnique: "",
    material: "",
    sizeCm: "",
    productName: "",
    assembledKd: "",
    sellingPriceCurrency: "USD",
    sellingPriceVal: "",
    sellingPriceUnit: "per Pc",
    gp40ft: "",
    loadability40ftHc: "",
    cbm: "",
    woodFinish: "",
    metalFinish: "",
    ft20: "",

    // Internal Details
    theme: "",
    season: "",
    internalCostPriceCurrency: "USD",
    internalCostPriceVal: "",
    internalCostPriceUnit: "per Pc",
    searchKeywords: "",
    vendorName: "",
    priceFromVendorCurrency: "USD",
    priceFromVendorVal: "",
    priceFromVendorUnit: "per Pc",
    exclusiveFor: "",

    // Production Details
    leadTimeDays: "",
    moq: "",
    factoryLocation: "",
  });

  const [saveSuccess, setSaveSuccess] = useState(false);

  const handleInputChange = (field: string, value: string) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (files && files.length > 0) {
      const newImgs: ProductImage[] = [];
      const defaultAngleLabels = [
        "Front View (Main Cover)",
        "Side Profile Angle",
        "Back View",
        "Top / Overhead Angle",
        "Close-up Detail / Texture",
        "Packaging / Crate View",
        "Lifestyle / Setting Photo",
      ];

      for (let i = 0; i < files.length; i++) {
        const file = files[i];
        const previewUrl = URL.createObjectURL(file);
        const autoLabel =
          defaultAngleLabels[images.length + i] ||
          `Product Image ${images.length + i + 1}`;
        newImgs.push({
          id: Date.now() + "_" + i + "_" + Math.random(),
          label: autoLabel,
          url: previewUrl,
          previewUrl: previewUrl,
          isMain: images.length === 0 && i === 0,
        });
      }
      setImages((prev) => [...prev, ...newImgs]);
    }
  };

  const handleRemoveImage = (id: string) => {
    setImages((prev) => prev.filter((img) => img.id !== id));
  };

  const handleSetMainCover = (id: string) => {
    setImages((prev) =>
      prev.map((img) => ({ ...img, isMain: img.id === id }))
    );
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    const mainImg = images.find((img) => img.isMain)?.previewUrl || images[0]?.previewUrl || "https://images.unsplash.com/photo-1615066390971-03e4e1c36ddf?w=600&auto=format&fit=crop&q=80";

    const newProduct = {
      id: "PF-" + Date.now(),
      sku: formData.productId || `SW-LII-PF-${Math.floor(10000 + Math.random() * 90000)}`,
      name: formData.productName || "New Product Entry",
      category: formData.category || "Furniture",
      subCategory: formData.subCategory || "General",
      collectionName: formData.collectionName || "Custom Collection",
      material: formData.material || "Wood & Metal",
      woodFinish: formData.woodFinish || "Natural",
      metalFinish: formData.metalFinish || "Standard",
      sizeCm: formData.sizeCm || "100X50X75",
      fobPriceUsd: parseFloat(formData.sellingPriceVal || formData.costPriceVal || "150") || 150,
      moq: parseInt(formData.moq || "10", 10) || 10,
      cbm: parseFloat(formData.cbm || "0.35") || 0.35,
      gp40ft: parseInt(formData.gp40ft || "50", 10) || 50,
      assembledKd: formData.assembledKd || "KD",
      image: mainImg,
      stockStatus: "Sample Ready" as const,
      fullDetails: formData,
      images: images,
    };

    // Save to localStorage
    try {
      const existing = JSON.parse(localStorage.getItem("lii_product_catalog_items") || "[]");
      const updated = [newProduct, ...existing];
      localStorage.setItem("lii_product_catalog_items", JSON.stringify(updated));
    } catch (err) {
      console.error("Failed to save product to localStorage:", err);
    }

    // Try saving to backend database API
    try {
      await documentApi.createProduct(newProduct.name, newProduct.sku).catch(() => null);
    } catch (e) {
      // Non-blocking fallback
    }

    setSaveSuccess(true);
    setTimeout(() => {
      navigate("/admin/sourcewiz/products");
    }, 1500);
  };

  return (
    <div style={{ background: "#f8fafc", minHeight: "100vh", padding: "20px" }}>
      <div style={{ maxWidth: "1000px", margin: "0 auto" }}>
        {/* Header Bar */}
        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            background: "#ffffff",
            padding: "16px 24px",
            borderRadius: "12px 12px 0 0",
            borderBottom: "1px solid #e2e8f0",
            boxShadow: "0 1px 3px rgba(0,0,0,0.05)",
          }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: "16px" }}>
            <button
              onClick={() => navigate("/admin/sourcewiz/products")}
              style={{
                background: "none",
                border: "none",
                fontSize: "1.3rem",
                cursor: "pointer",
                color: "#1e293b",
                display: "flex",
                alignItems: "center",
              }}
            >
              ←
            </button>
            <h1 style={{ margin: 0, fontSize: "1.4rem", fontWeight: 700, color: "#0f172a" }}>
              Add Product
            </h1>
          </div>

          <div style={{ display: "flex", gap: "10px", marginLeft: "auto" }}>
            <button
              onClick={handleSubmit}
              style={{
                background: "#0d9488",
                color: "#ffffff",
                border: "none",
                borderRadius: "8px",
                padding: "9px 20px",
                fontWeight: 600,
                fontSize: "0.90rem",
                cursor: "pointer",
                boxShadow: "0 2px 4px rgba(13, 148, 136, 0.2)",
              }}
            >
              Save Product
            </button>
          </div>
        </div>

        {/* Tab Navigation (Images vs Details) */}
        <div
          style={{
            display: "flex",
            background: "#ffffff",
            borderBottom: "2px solid #e2e8f0",
            marginBottom: "20px",
            borderRadius: "0 0 12px 12px",
            boxShadow: "0 2px 4px rgba(0,0,0,0.03)",
          }}
        >
          <button
            onClick={() => setActiveTab("Images")}
            style={{
              flex: 1,
              padding: "14px 20px",
              background: "none",
              border: "none",
              borderBottom: activeTab === "Images" ? "3px solid #0d9488" : "3px solid transparent",
              color: activeTab === "Images" ? "#0d9488" : "#64748b",
              fontWeight: 700,
              fontSize: "0.95rem",
              cursor: "pointer",
              transition: "all 0.2s ease",
            }}
          >
            Images ({images.length})
          </button>
          <button
            onClick={() => setActiveTab("Details")}
            style={{
              flex: 1,
              padding: "14px 20px",
              background: "none",
              border: "none",
              borderBottom: activeTab === "Details" ? "3px solid #0d9488" : "3px solid transparent",
              color: activeTab === "Details" ? "#0d9488" : "#64748b",
              fontWeight: 700,
              fontSize: "0.95rem",
              cursor: "pointer",
              transition: "all 0.2s ease",
            }}
          >
            Details
          </button>
        </div>

        {saveSuccess && (
          <div
            style={{
              background: "#f0fdf4",
              border: "1px solid #bbf7d0",
              color: "#15803d",
              padding: "14px 20px",
              borderRadius: "10px",
              marginBottom: "20px",
              fontWeight: 600,
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center"
            }}
          >
            <span>✅ Product Form entry saved successfully to Product Catalog!</span>
            <button
              type="button"
              onClick={() => navigate("/admin/sourcewiz/products")}
              style={{
                background: "#16a34a",
                color: "#fff",
                border: "none",
                padding: "8px 16px",
                borderRadius: "6px",
                cursor: "pointer",
                fontWeight: 700,
                fontSize: "0.85rem"
              }}
            >
              View in Product Catalog →
            </button>
          </div>
        )}

        {/* TAB 1: IMAGES TAB (Spacious layout with no example image pre-filled) */}
        {activeTab === "Images" && (
          <div
            style={{
              background: "#ffffff",
              borderRadius: "12px",
              padding: "28px",
              boxShadow: "0 2px 6px rgba(0,0,0,0.04)",
              border: "1px solid #e2e8f0",
            }}
          >
            {/* Top Dropzone Banner */}
            <div
              style={{
                border: "2px dashed #0d9488",
                background: "#f0fdf4",
                borderRadius: "12px",
                padding: "36px 24px",
                textAlign: "center",
                marginBottom: "28px",
                cursor: "pointer",
                transition: "all 0.2s ease",
              }}
            >
              <label style={{ cursor: "pointer", width: "100%", display: "block" }}>
                <div style={{ fontSize: "2.4rem", marginBottom: "8px" }}>📸</div>
                <h3 style={{ margin: "0 0 6px 0", fontSize: "1.15rem", fontWeight: 700, color: "#0f172a" }}>
                  Upload Product Photography & Angle Views
                </h3>
                <p style={{ margin: "0 0 16px 0", fontSize: "0.88rem", color: "#475569" }}>
                  Click to select or drag & drop multiple high-resolution photos (Front, Side, Back, Close-up detail views).
                </p>
                <div style={{ display: "flex", justifyContent: "center", gap: "12px" }}>
                  <span
                    style={{
                      background: "#0d9488",
                      color: "#ffffff",
                      padding: "10px 24px",
                      borderRadius: "8px",
                      fontSize: "0.90rem",
                      fontWeight: 600,
                      display: "inline-block",
                      boxShadow: "0 2px 6px rgba(13, 148, 136, 0.3)",
                    }}
                  >
                    + Add Product Images
                  </span>
                </div>
                <input
                  type="file"
                  multiple
                  accept="image/*"
                  onChange={handleFileUpload}
                  style={{ display: "none" }}
                />
              </label>
            </div>

            {/* Empty State Notice when no images uploaded yet */}
            {images.length === 0 ? (
              <div
                style={{
                  textAlign: "center",
                  padding: "40px 20px",
                  background: "#fafafa",
                  borderRadius: "10px",
                  border: "1px solid #f1f5f9",
                  color: "#64748b",
                }}
              >
                <p style={{ fontSize: "0.95rem", margin: 0, fontWeight: 500 }}>
                  No images uploaded yet. Use the upload box above to add product angle photos.
                </p>
              </div>
            ) : (
              <div>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "16px" }}>
                  <h4 style={{ margin: 0, fontSize: "1rem", fontWeight: 700, color: "#0f172a" }}>
                    Uploaded Angles & Catalog Photos ({images.length})
                  </h4>
                  <span style={{ fontSize: "0.80rem", color: "#64748b" }}>
                    Click "Set Main" to pick the primary catalog cover photo
                  </span>
                </div>

                {/* Spacious Grid for Multi-Angle Images */}
                <div
                  style={{
                    display: "grid",
                    gridTemplateColumns: "repeat(auto-fill, minmax(260px, 1fr))",
                    gap: "24px",
                  }}
                >
                  {images.map((img) => (
                    <div
                      key={img.id}
                      style={{
                        background: "#ffffff",
                        border: img.isMain ? "2px solid #0d9488" : "1px solid #cbd5e1",
                        borderRadius: "12px",
                        overflow: "hidden",
                        position: "relative",
                        boxShadow: img.isMain
                          ? "0 4px 12px rgba(13, 148, 136, 0.15)"
                          : "0 2px 6px rgba(0,0,0,0.04)",
                      }}
                    >
                      {/* Main Badge */}
                      {img.isMain && (
                        <div
                          style={{
                            position: "absolute",
                            top: "10px",
                            left: "10px",
                            background: "#0d9488",
                            color: "#fff",
                            fontSize: "0.72rem",
                            fontWeight: 800,
                            padding: "3px 8px",
                            borderRadius: "6px",
                            zIndex: 2,
                            textTransform: "uppercase",
                          }}
                        >
                          MAIN COVER
                        </div>
                      )}

                      {/* Remove Button */}
                      <button
                        onClick={() => handleRemoveImage(img.id)}
                        style={{
                          position: "absolute",
                          top: "10px",
                          right: "10px",
                          background: "rgba(239, 68, 68, 0.9)",
                          color: "#fff",
                          border: "none",
                          borderRadius: "50%",
                          width: "28px",
                          height: "28px",
                          cursor: "pointer",
                          fontWeight: "bold",
                          zIndex: 2,
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "center",
                        }}
                        title="Remove photo"
                      >
                        ✕
                      </button>

                      {/* Photo Display Container */}
                      <div
                        style={{
                          width: "100%",
                          height: "220px",
                          background: "#f1f5f9",
                          overflow: "hidden",
                        }}
                      >
                        <img
                          src={img.previewUrl}
                          alt={img.label}
                          style={{ width: "100%", height: "100%", objectFit: "cover" }}
                        />
                      </div>

                      {/* Photo Title & Controls */}
                      <div style={{ padding: "14px", display: "flex", flexDirection: "column", gap: "10px" }}>
                        <div>
                          <label style={{ display: "block", fontSize: "0.75rem", fontWeight: 700, color: "#64748b", marginBottom: "4px" }}>
                            Angle / View Tag
                          </label>
                          <input
                            type="text"
                            value={img.label}
                            onChange={(e) => {
                              const newLabel = e.target.value;
                              setImages((prev) =>
                                prev.map((item) =>
                                  item.id === img.id ? { ...item, label: newLabel } : item
                                )
                              );
                            }}
                            placeholder="e.g. Front View, Side View, Close-up..."
                            style={{
                              width: "100%",
                              padding: "8px 10px",
                              fontSize: "0.85rem",
                              borderRadius: "6px",
                              border: "1px solid #cbd5e1",
                              fontWeight: 600,
                            }}
                          />
                        </div>

                        {!img.isMain && (
                          <button
                            onClick={() => handleSetMainCover(img.id)}
                            style={{
                              padding: "6px 12px",
                              borderRadius: "6px",
                              background: "#eef2ff",
                              color: "#4f46e5",
                              border: "1px solid #c7d2fe",
                              fontSize: "0.78rem",
                              fontWeight: 700,
                              cursor: "pointer",
                              textAlign: "center",
                            }}
                          >
                            Set as Main Cover Photo
                          </button>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}

        {/* TAB 2: DETAILS TAB (Form matching exact user screenshots) */}
        {activeTab === "Details" && (
          <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
            {/* CARD 1: Basic Details Accordion */}
            <div
              style={{
                background: "#ffffff",
                borderRadius: "12px",
                border: "1px solid #e2e8f0",
                overflow: "hidden",
                boxShadow: "0 2px 4px rgba(0,0,0,0.03)",
              }}
            >
              <div
                onClick={() => toggleSection("basicDetails")}
                style={{
                  padding: "18px 24px",
                  background: "#fafafa",
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "center",
                  cursor: "pointer",
                  userSelect: "none",
                }}
              >
                <h3 style={{ margin: 0, fontSize: "1.05rem", fontWeight: 700, color: "#0f172a" }}>
                  Basic Details
                </h3>
                <span style={{ fontSize: "1.1rem", color: "#64748b", fontWeight: "bold" }}>
                  {openSections.basicDetails ? "︿" : "﹀"}
                </span>
              </div>

              {openSections.basicDetails && (
                <div style={{ padding: "24px", display: "flex", flexDirection: "column", gap: "20px" }}>
                  {/* Category* */}
                  <div>
                    <label style={{ display: "block", fontSize: "0.85rem", fontWeight: 600, color: "#475569", marginBottom: "6px" }}>
                      Category*
                    </label>
                    <select
                      value={formData.category}
                      onChange={(e) => handleInputChange("category", e.target.value)}
                      style={{
                        width: "100%",
                        padding: "12px 14px",
                        borderRadius: "8px",
                        border: "1px solid #cbd5e1",
                        fontSize: "0.92rem",
                        background: "#fff",
                        color: "#0f172a",
                      }}
                    >
                      <option value="">Select Category</option>
                      <option value="Furniture">Furniture</option>
                      <option value="Home Decor">Home Decor</option>
                      <option value="Lighting">Lighting</option>
                      <option value="Outdoor">Outdoor</option>
                    </select>
                  </div>

                  {/* Sub category */}
                  <div>
                    <label style={{ display: "block", fontSize: "0.85rem", fontWeight: 600, color: "#475569", marginBottom: "6px" }}>
                      Sub category
                    </label>
                    <select
                      value={formData.subCategory}
                      onChange={(e) => handleInputChange("subCategory", e.target.value)}
                      style={{
                        width: "100%",
                        padding: "12px 14px",
                        borderRadius: "8px",
                        border: "1px solid #cbd5e1",
                        fontSize: "0.92rem",
                        background: "#fff",
                        color: "#0f172a",
                      }}
                    >
                      <option value="">Select Sub category</option>
                      <option value="Dining Table">Dining Table</option>
                      <option value="Dining Chair">Dining Chair</option>
                      <option value="Coffee Table">Coffee Table</option>
                      <option value="Cabinet">Cabinet</option>
                    </select>
                  </div>

                  {/* Product ID */}
                  <div>
                    <label style={{ display: "block", fontSize: "0.85rem", fontWeight: 600, color: "#475569", marginBottom: "6px" }}>
                      Product ID
                    </label>
                    <input
                      type="text"
                      value={formData.productId}
                      onChange={(e) => handleInputChange("productId", e.target.value)}
                      placeholder="e.g. 12557"
                      style={{
                        width: "100%",
                        padding: "12px 14px",
                        borderRadius: "8px",
                        border: "1px solid #cbd5e1",
                        fontSize: "0.92rem",
                        color: "#0f172a",
                      }}
                    />
                  </div>
                </div>
              )}
            </div>

            {/* CARD 2: Product Info Accordion */}
            <div
              style={{
                background: "#ffffff",
                borderRadius: "12px",
                border: "1px solid #e2e8f0",
                overflow: "hidden",
                boxShadow: "0 2px 4px rgba(0,0,0,0.03)",
              }}
            >
              <div
                onClick={() => toggleSection("productInfo")}
                style={{
                  padding: "18px 24px",
                  background: "#fafafa",
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "center",
                  cursor: "pointer",
                  userSelect: "none",
                }}
              >
                <h3 style={{ margin: 0, fontSize: "1.05rem", fontWeight: 700, color: "#0f172a" }}>
                  Product Info
                </h3>
                <span style={{ fontSize: "1.1rem", color: "#64748b", fontWeight: "bold" }}>
                  {openSections.productInfo ? "︿" : "﹀"}
                </span>
              </div>

              {openSections.productInfo && (
                <div style={{ padding: "24px", display: "flex", flexDirection: "column", gap: "20px" }}>
                  {/* Cost Price */}
                  <div>
                    <label style={{ display: "block", fontSize: "0.85rem", fontWeight: 600, color: "#475569", marginBottom: "6px" }}>
                      Cost Price
                    </label>
                    <div style={{ display: "grid", gridTemplateColumns: "1fr 2fr 1.5fr", gap: "10px" }}>
                      <select
                        value={formData.costPriceCurrency}
                        onChange={(e) => handleInputChange("costPriceCurrency", e.target.value)}
                        style={{
                          padding: "12px",
                          borderRadius: "8px",
                          border: "1px solid #cbd5e1",
                          fontSize: "0.92rem",
                          background: "#fff",
                        }}
                      >
                        <option value="USD">$ USD</option>
                        <option value="EUR">€ EUR</option>
                        <option value="INR">₹ INR</option>
                      </select>

                      <input
                        type="text"
                        value={formData.costPriceVal}
                        onChange={(e) => handleInputChange("costPriceVal", e.target.value)}
                        placeholder="0.00"
                        style={{
                          padding: "12px 14px",
                          borderRadius: "8px",
                          border: "1px solid #cbd5e1",
                          fontSize: "0.92rem",
                        }}
                      />

                      <select
                        value={formData.costPriceUnit}
                        onChange={(e) => handleInputChange("costPriceUnit", e.target.value)}
                        style={{
                          padding: "12px",
                          borderRadius: "8px",
                          border: "1px solid #cbd5e1",
                          fontSize: "0.92rem",
                          background: "#fff",
                        }}
                      >
                        <option value="per Pc">per Pc</option>
                        <option value="per Set">per Set</option>
                      </select>
                    </div>
                  </div>

                  {/* Collection Name */}
                  <div>
                    <label style={{ display: "block", fontSize: "0.85rem", fontWeight: 600, color: "#475569", marginBottom: "6px" }}>
                      Collection Name
                    </label>
                    <input
                      type="text"
                      value={formData.collectionName}
                      onChange={(e) => handleInputChange("collectionName", e.target.value)}
                      placeholder="e.g. Muddo Collection"
                      style={{
                        width: "100%",
                        padding: "12px 14px",
                        borderRadius: "8px",
                        border: "1px solid #cbd5e1",
                        fontSize: "0.92rem",
                      }}
                    />
                  </div>

                  {/* Color */}
                  <div>
                    <label style={{ display: "block", fontSize: "0.85rem", fontWeight: 600, color: "#475569", marginBottom: "6px" }}>
                      Color
                    </label>
                    <input
                      type="text"
                      value={formData.color}
                      onChange={(e) => handleInputChange("color", e.target.value)}
                      placeholder="e.g. Natural Oak"
                      style={{
                        width: "100%",
                        padding: "12px 14px",
                        borderRadius: "8px",
                        border: "1px solid #cbd5e1",
                        fontSize: "0.92rem",
                      }}
                    />
                  </div>

                  {/* Production Technique */}
                  <div>
                    <label style={{ display: "block", fontSize: "0.85rem", fontWeight: 600, color: "#475569", marginBottom: "6px" }}>
                      Production Technique
                    </label>
                    <input
                      type="text"
                      value={formData.productionTechnique}
                      onChange={(e) => handleInputChange("productionTechnique", e.target.value)}
                      placeholder="e.g. Handcrafted"
                      style={{
                        width: "100%",
                        padding: "12px 14px",
                        borderRadius: "8px",
                        border: "1px solid #cbd5e1",
                        fontSize: "0.92rem",
                      }}
                    />
                  </div>

                  {/* Material */}
                  <div>
                    <label style={{ display: "block", fontSize: "0.85rem", fontWeight: 600, color: "#475569", marginBottom: "6px" }}>
                      Material
                    </label>
                    <input
                      type="text"
                      value={formData.material}
                      onChange={(e) => handleInputChange("material", e.target.value)}
                      placeholder="e.g. Mango Wood"
                      style={{
                        width: "100%",
                        padding: "12px 14px",
                        borderRadius: "8px",
                        border: "1px solid #cbd5e1",
                        fontSize: "0.92rem",
                      }}
                    />
                  </div>

                  {/* Size (CM) */}
                  <div>
                    <label style={{ display: "block", fontSize: "0.85rem", fontWeight: 600, color: "#475569", marginBottom: "6px" }}>
                      Size (CM)
                    </label>
                    <input
                      type="text"
                      value={formData.sizeCm}
                      onChange={(e) => handleInputChange("sizeCm", e.target.value)}
                      placeholder="e.g. 150X150X76"
                      style={{
                        width: "100%",
                        padding: "12px 14px",
                        borderRadius: "8px",
                        border: "1px solid #cbd5e1",
                        fontSize: "0.92rem",
                      }}
                    />
                  </div>

                  {/* Product Name */}
                  <div>
                    <label style={{ display: "block", fontSize: "0.85rem", fontWeight: 600, color: "#475569", marginBottom: "6px" }}>
                      Product Name
                    </label>
                    <input
                      type="text"
                      value={formData.productName}
                      onChange={(e) => handleInputChange("productName", e.target.value)}
                      placeholder="e.g. Dining Table"
                      style={{
                        width: "100%",
                        padding: "12px 14px",
                        borderRadius: "8px",
                        border: "1px solid #cbd5e1",
                        fontSize: "0.92rem",
                      }}
                    />
                  </div>

                  {/* Assembled/KD */}
                  <div>
                    <label style={{ display: "block", fontSize: "0.85rem", fontWeight: 600, color: "#475569", marginBottom: "6px" }}>
                      Assembled/KD
                    </label>
                    <input
                      type="text"
                      value={formData.assembledKd}
                      onChange={(e) => handleInputChange("assembledKd", e.target.value)}
                      placeholder="e.g. KD"
                      style={{
                        width: "100%",
                        padding: "12px 14px",
                        borderRadius: "8px",
                        border: "1px solid #cbd5e1",
                        fontSize: "0.92rem",
                      }}
                    />
                  </div>

                  {/* Selling Price */}
                  <div>
                    <label style={{ display: "block", fontSize: "0.85rem", fontWeight: 600, color: "#475569", marginBottom: "6px" }}>
                      Selling Price
                    </label>
                    <div style={{ display: "grid", gridTemplateColumns: "1fr 2fr 1.5fr", gap: "10px" }}>
                      <select
                        value={formData.sellingPriceCurrency}
                        onChange={(e) => handleInputChange("sellingPriceCurrency", e.target.value)}
                        style={{
                          padding: "12px",
                          borderRadius: "8px",
                          border: "1px solid #cbd5e1",
                          fontSize: "0.92rem",
                          background: "#fff",
                        }}
                      >
                        <option value="USD">$ USD</option>
                        <option value="EUR">€ EUR</option>
                        <option value="INR">₹ INR</option>
                      </select>

                      <input
                        type="text"
                        value={formData.sellingPriceVal}
                        onChange={(e) => handleInputChange("sellingPriceVal", e.target.value)}
                        placeholder="0.00"
                        style={{
                          padding: "12px 14px",
                          borderRadius: "8px",
                          border: "1px solid #cbd5e1",
                          fontSize: "0.92rem",
                        }}
                      />

                      <select
                        value={formData.sellingPriceUnit}
                        onChange={(e) => handleInputChange("sellingPriceUnit", e.target.value)}
                        style={{
                          padding: "12px",
                          borderRadius: "8px",
                          border: "1px solid #cbd5e1",
                          fontSize: "0.92rem",
                          background: "#fff",
                        }}
                      >
                        <option value="per Pc">per Pc</option>
                        <option value="per Set">per Set</option>
                      </select>
                    </div>
                  </div>

                  {/* 40'ft GP */}
                  <div>
                    <label style={{ display: "block", fontSize: "0.85rem", fontWeight: 600, color: "#475569", marginBottom: "6px" }}>
                      40'ft GP
                    </label>
                    <input
                      type="text"
                      value={formData.gp40ft}
                      onChange={(e) => handleInputChange("gp40ft", e.target.value)}
                      placeholder="e.g. 72"
                      style={{
                        width: "100%",
                        padding: "12px 14px",
                        borderRadius: "8px",
                        border: "1px solid #cbd5e1",
                        fontSize: "0.92rem",
                      }}
                    />
                  </div>

                  {/* Loadability (40'ft HC) */}
                  <div>
                    <label style={{ display: "block", fontSize: "0.85rem", fontWeight: 600, color: "#475569", marginBottom: "6px" }}>
                      Loadability (40'ft HC)
                    </label>
                    <input
                      type="text"
                      value={formData.loadability40ftHc}
                      onChange={(e) => handleInputChange("loadability40ftHc", e.target.value)}
                      placeholder="e.g. 148"
                      style={{
                        width: "100%",
                        padding: "12px 14px",
                        borderRadius: "8px",
                        border: "1px solid #cbd5e1",
                        fontSize: "0.92rem",
                      }}
                    />
                  </div>

                  {/* CBM */}
                  <div>
                    <label style={{ display: "block", fontSize: "0.85rem", fontWeight: 600, color: "#475569", marginBottom: "6px" }}>
                      CBM
                    </label>
                    <input
                      type="text"
                      value={formData.cbm}
                      onChange={(e) => handleInputChange("cbm", e.target.value)}
                      placeholder="e.g. 0.706"
                      style={{
                        width: "100%",
                        padding: "12px 14px",
                        borderRadius: "8px",
                        border: "1px solid #cbd5e1",
                        fontSize: "0.92rem",
                      }}
                    />
                  </div>

                  {/* Wood Finish */}
                  <div>
                    <label style={{ display: "block", fontSize: "0.85rem", fontWeight: 600, color: "#475569", marginBottom: "6px" }}>
                      Wood Finish
                    </label>
                    <input
                      type="text"
                      value={formData.woodFinish}
                      onChange={(e) => handleInputChange("woodFinish", e.target.value)}
                      placeholder="e.g. Natural"
                      style={{
                        width: "100%",
                        padding: "12px 14px",
                        borderRadius: "8px",
                        border: "1px solid #cbd5e1",
                        fontSize: "0.92rem",
                      }}
                    />
                  </div>

                  {/* Metal Finish */}
                  <div>
                    <label style={{ display: "block", fontSize: "0.85rem", fontWeight: 600, color: "#475569", marginBottom: "6px" }}>
                      Metal Finish
                    </label>
                    <input
                      type="text"
                      value={formData.metalFinish}
                      onChange={(e) => handleInputChange("metalFinish", e.target.value)}
                      placeholder="e.g. Powder Coated Brass"
                      style={{
                        width: "100%",
                        padding: "12px 14px",
                        borderRadius: "8px",
                        border: "1px solid #cbd5e1",
                        fontSize: "0.92rem",
                      }}
                    />
                  </div>

                  {/* 20'ft */}
                  <div>
                    <label style={{ display: "block", fontSize: "0.85rem", fontWeight: 600, color: "#475569", marginBottom: "6px" }}>
                      20'ft
                    </label>
                    <input
                      type="text"
                      value={formData.ft20}
                      onChange={(e) => handleInputChange("ft20", e.target.value)}
                      placeholder="e.g. 32"
                      style={{
                        width: "100%",
                        padding: "12px 14px",
                        borderRadius: "8px",
                        border: "1px solid #cbd5e1",
                        fontSize: "0.92rem",
                      }}
                    />
                  </div>
                </div>
              )}
            </div>

            {/* CARD 3: Internal Details Accordion */}
            <div
              style={{
                background: "#ffffff",
                borderRadius: "12px",
                border: "1px solid #e2e8f0",
                overflow: "hidden",
                boxShadow: "0 2px 4px rgba(0,0,0,0.03)",
              }}
            >
              <div
                onClick={() => toggleSection("internalDetails")}
                style={{
                  padding: "18px 24px",
                  background: "#fafafa",
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "center",
                  cursor: "pointer",
                  userSelect: "none",
                }}
              >
                <h3 style={{ margin: 0, fontSize: "1.05rem", fontWeight: 700, color: "#0f172a" }}>
                  Internal Details
                </h3>
                <span style={{ fontSize: "1.1rem", color: "#64748b", fontWeight: "bold" }}>
                  {openSections.internalDetails ? "︿" : "﹀"}
                </span>
              </div>

              {openSections.internalDetails && (
                <div style={{ padding: "24px", display: "flex", flexDirection: "column", gap: "20px" }}>
                  {/* Theme */}
                  <div>
                    <label style={{ display: "block", fontSize: "0.85rem", fontWeight: 600, color: "#475569", marginBottom: "6px" }}>
                      Theme
                    </label>
                    <select
                      value={formData.theme}
                      onChange={(e) => handleInputChange("theme", e.target.value)}
                      style={{
                        width: "100%",
                        padding: "12px 14px",
                        borderRadius: "8px",
                        border: "1px solid #cbd5e1",
                        fontSize: "0.92rem",
                        background: "#fff",
                        color: "#0f172a",
                      }}
                    >
                      <option value="">Select Theme</option>
                      <option value="Modern Rustic">Modern Rustic</option>
                      <option value="Industrial Wood">Industrial Wood</option>
                      <option value="Minimalist Scandinavian">Minimalist Scandinavian</option>
                      <option value="Classic Antique">Classic Antique</option>
                    </select>
                  </div>

                  {/* Season */}
                  <div>
                    <label style={{ display: "block", fontSize: "0.85rem", fontWeight: 600, color: "#475569", marginBottom: "6px" }}>
                      Season
                    </label>
                    <select
                      value={formData.season}
                      onChange={(e) => handleInputChange("season", e.target.value)}
                      style={{
                        width: "100%",
                        padding: "12px 14px",
                        borderRadius: "8px",
                        border: "1px solid #cbd5e1",
                        fontSize: "0.92rem",
                        background: "#fff",
                        color: "#0f172a",
                      }}
                    >
                      <option value="">Select Season</option>
                      <option value="Autumn / Winter 2026">Autumn / Winter 2026</option>
                      <option value="Spring / Summer 2026">Spring / Summer 2026</option>
                      <option value="All Season">All Season</option>
                    </select>
                  </div>

                  {/* Product Cost */}
                  <div>
                    <label style={{ display: "block", fontSize: "0.85rem", fontWeight: 600, color: "#475569", marginBottom: "6px" }}>
                      Product Cost
                    </label>
                    <div style={{ display: "grid", gridTemplateColumns: "1fr 2fr 1.5fr", gap: "10px" }}>
                      <select
                        value={formData.internalCostPriceCurrency}
                        onChange={(e) => handleInputChange("internalCostPriceCurrency", e.target.value)}
                        style={{
                          padding: "12px",
                          borderRadius: "8px",
                          border: "1px solid #cbd5e1",
                          fontSize: "0.92rem",
                          background: "#fff",
                        }}
                      >
                        <option value="USD">$ USD</option>
                        <option value="EUR">€ EUR</option>
                        <option value="INR">₹ INR</option>
                      </select>

                      <input
                        type="text"
                        value={formData.internalCostPriceVal}
                        onChange={(e) => handleInputChange("internalCostPriceVal", e.target.value)}
                        placeholder="0.00"
                        style={{
                          padding: "12px 14px",
                          borderRadius: "8px",
                          border: "1px solid #cbd5e1",
                          fontSize: "0.92rem",
                        }}
                      />

                      <select
                        value={formData.internalCostPriceUnit}
                        onChange={(e) => handleInputChange("internalCostPriceUnit", e.target.value)}
                        style={{
                          padding: "12px",
                          borderRadius: "8px",
                          border: "1px solid #cbd5e1",
                          fontSize: "0.92rem",
                          background: "#fff",
                        }}
                      >
                        <option value="per Pc">per Pc</option>
                        <option value="per Set">per Set</option>
                      </select>
                    </div>
                  </div>

                  {/* Search keywords */}
                  <div>
                    <label style={{ display: "block", fontSize: "0.85rem", fontWeight: 600, color: "#475569", marginBottom: "6px" }}>
                      Search keywords
                    </label>
                    <select
                      value={formData.searchKeywords}
                      onChange={(e) => handleInputChange("searchKeywords", e.target.value)}
                      style={{
                        width: "100%",
                        padding: "12px 14px",
                        borderRadius: "8px",
                        border: "1px solid #cbd5e1",
                        fontSize: "0.92rem",
                        background: "#fff",
                        color: "#0f172a",
                      }}
                    >
                      <option value="">Select or Type Search Keywords</option>
                      <option value="Dining, Oak, Muddo, Table, Wood, 6-Seater">Dining, Oak, Muddo, Table, Wood, 6-Seater</option>
                      <option value="Living, Coffee Table, Mango Wood">Living, Coffee Table, Mango Wood</option>
                      <option value="Storage, Wooden Cabinet, Brass Inlay">Storage, Wooden Cabinet, Brass Inlay</option>
                    </select>
                  </div>

                  {/* Vendor Name */}
                  <div>
                    <label style={{ display: "block", fontSize: "0.85rem", fontWeight: 600, color: "#475569", marginBottom: "6px" }}>
                      Vendor Name
                    </label>
                    <input
                      type="text"
                      value={formData.vendorName}
                      onChange={(e) => handleInputChange("vendorName", e.target.value)}
                      placeholder="Vendor Name"
                      style={{
                        width: "100%",
                        padding: "12px 14px",
                        borderRadius: "8px",
                        border: "1px solid #cbd5e1",
                        fontSize: "0.92rem",
                      }}
                    />
                  </div>

                  {/* Price from Vendor */}
                  <div>
                    <label style={{ display: "block", fontSize: "0.85rem", fontWeight: 600, color: "#475569", marginBottom: "6px" }}>
                      Price from Vendor
                    </label>
                    <div style={{ display: "grid", gridTemplateColumns: "1fr 2fr 1.5fr", gap: "10px" }}>
                      <select
                        value={formData.priceFromVendorCurrency}
                        onChange={(e) => handleInputChange("priceFromVendorCurrency", e.target.value)}
                        style={{
                          padding: "12px",
                          borderRadius: "8px",
                          border: "1px solid #cbd5e1",
                          fontSize: "0.92rem",
                          background: "#fff",
                        }}
                      >
                        <option value="USD">$ USD</option>
                        <option value="EUR">€ EUR</option>
                        <option value="INR">₹ INR</option>
                      </select>

                      <input
                        type="text"
                        value={formData.priceFromVendorVal}
                        onChange={(e) => handleInputChange("priceFromVendorVal", e.target.value)}
                        placeholder="0.00"
                        style={{
                          padding: "12px 14px",
                          borderRadius: "8px",
                          border: "1px solid #cbd5e1",
                          fontSize: "0.92rem",
                        }}
                      />

                      <select
                        value={formData.priceFromVendorUnit}
                        onChange={(e) => handleInputChange("priceFromVendorUnit", e.target.value)}
                        style={{
                          padding: "12px",
                          borderRadius: "8px",
                          border: "1px solid #cbd5e1",
                          fontSize: "0.92rem",
                          background: "#fff",
                        }}
                      >
                        <option value="per Pc">per Pc</option>
                        <option value="per Set">per Set</option>
                      </select>
                    </div>
                  </div>

                  {/* Exclusive For (i) */}
                  <div>
                    <label style={{ display: "flex", alignItems: "center", gap: "6px", fontSize: "0.85rem", fontWeight: 600, color: "#475569", marginBottom: "6px" }}>
                      Exclusive For
                      <span
                        title="Client/Importer for whom this product model is exclusively reserved."
                        style={{
                          display: "inline-flex",
                          alignItems: "center",
                          justifyContent: "center",
                          width: "16px",
                          height: "16px",
                          borderRadius: "50%",
                          background: "#cbd5e1",
                          color: "#475569",
                          fontSize: "0.72rem",
                          fontWeight: "bold",
                          cursor: "pointer",
                        }}
                      >
                        i
                      </span>
                    </label>
                    <input
                      type="text"
                      value={formData.exclusiveFor}
                      onChange={(e) => handleInputChange("exclusiveFor", e.target.value)}
                      placeholder="Exclusive Client Name"
                      style={{
                        width: "100%",
                        padding: "12px 14px",
                        borderRadius: "8px",
                        border: "1px solid #cbd5e1",
                        fontSize: "0.92rem",
                        background: "#f8fafc",
                      }}
                    />
                  </div>
                </div>
              )}
            </div>

            {/* CARD 4: Production Details Accordion */}
            <div
              style={{
                background: "#ffffff",
                borderRadius: "12px",
                border: "1px solid #e2e8f0",
                overflow: "hidden",
                boxShadow: "0 2px 4px rgba(0,0,0,0.03)",
              }}
            >
              <div
                onClick={() => toggleSection("productionDetails")}
                style={{
                  padding: "18px 24px",
                  background: "#fafafa",
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "center",
                  cursor: "pointer",
                  userSelect: "none",
                }}
              >
                <h3 style={{ margin: 0, fontSize: "1.05rem", fontWeight: 700, color: "#0f172a" }}>
                  Production Details
                </h3>
                <span style={{ fontSize: "1.1rem", color: "#64748b", fontWeight: "bold" }}>
                  {openSections.productionDetails ? "︿" : "﹀"}
                </span>
              </div>

              {openSections.productionDetails && (
                <div style={{ padding: "24px", display: "flex", flexDirection: "column", gap: "20px" }}>
                  <div>
                    <label style={{ display: "block", fontSize: "0.85rem", fontWeight: 600, color: "#475569", marginBottom: "6px" }}>
                      Production Lead Time (Days)
                    </label>
                    <input
                      type="text"
                      value={formData.leadTimeDays}
                      onChange={(e) => handleInputChange("leadTimeDays", e.target.value)}
                      style={{
                        width: "100%",
                        padding: "12px 14px",
                        borderRadius: "8px",
                        border: "1px solid #cbd5e1",
                        fontSize: "0.92rem",
                      }}
                    />
                  </div>

                  <div>
                    <label style={{ display: "block", fontSize: "0.85rem", fontWeight: 600, color: "#475569", marginBottom: "6px" }}>
                      Minimum Order Quantity (MOQ)
                    </label>
                    <input
                      type="text"
                      value={formData.moq}
                      onChange={(e) => handleInputChange("moq", e.target.value)}
                      style={{
                        width: "100%",
                        padding: "12px 14px",
                        borderRadius: "8px",
                        border: "1px solid #cbd5e1",
                        fontSize: "0.92rem",
                      }}
                    />
                  </div>
                </div>
              )}
            </div>

            {/* Bottom Actions */}
            <div style={{ display: "flex", justifyContent: "flex-end", gap: "12px", marginTop: "12px" }}>
              <button
                type="button"
                onClick={() => navigate("/admin/sourcewiz/products")}
                style={{
                  padding: "12px 24px",
                  borderRadius: "8px",
                  background: "#e2e8f0",
                  color: "#334155",
                  border: "none",
                  fontWeight: 600,
                  fontSize: "0.92rem",
                  cursor: "pointer",
                }}
              >
                Cancel
              </button>
              <button
                type="submit"
                style={{
                  padding: "12px 28px",
                  borderRadius: "8px",
                  background: "#0d9488",
                  color: "#ffffff",
                  border: "none",
                  fontWeight: 600,
                  fontSize: "0.92rem",
                  cursor: "pointer",
                  boxShadow: "0 2px 6px rgba(13, 148, 136, 0.3)",
                }}
              >
                Save Product Form Entry
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}
