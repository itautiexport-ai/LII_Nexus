import React, { useState, useEffect } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import { CatalogProductItem } from "../utils/pptxExport";
import { catalogueError, catalogueProductsApi } from "../api/catalogueProductsApi";
import { getProductImageUrls } from "../utils/productImages";
import { useAuthStore } from "../../auth/hooks/useAuthStore";
import { useIsSystemAdmin } from "../../auth/hooks/usePermissions";

const FALLBACK_IMG = "https://images.unsplash.com/photo-1567538096630-e0c55bd6374c?auto=format&fit=crop&w=1000&q=80";

export default function SourcewizProductDetailPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const user = useAuthStore((s) => s.user);
  const isSysAdmin = useIsSystemAdmin();
  const isAdmin = isSysAdmin;

  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState("");
  const [deleting, setDeleting] = useState(false);
  const [products, setProducts] = useState<CatalogProductItem[]>([]);
  const [activeTab, setActiveTab] = useState<
    "basic" | "variants" | "packing" | "costing" | "attachments"
  >("basic");
  const [selectedImageIndex, setSelectedImageIndex] = useState(0);
  const [showLabelModal, setShowLabelModal] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [copyFeedback, setCopyFeedback] = useState(false);

  useEffect(() => {
    let active = true;
    setLoading(true);
    catalogueProductsApi.list().then(data => { if (active) setProducts(data); })
      .catch(error => { if (active) setLoadError(catalogueError(error)); })
      .finally(() => { if (active) setLoading(false); });
    return () => { active = false; };
  }, []);

  const currentIndex = products.findIndex(
    (p) => String(p.id) === String(id) || String(p.sku) === String(id)
  );

  const product = products[currentIndex];

  const prevProduct = currentIndex > 0 ? products[currentIndex - 1] : null;
  const nextProduct =
    currentIndex >= 0 && currentIndex < products.length - 1
      ? products[currentIndex + 1]
      : null;

  const galleryImages = product ? getProductImageUrls(product) : [];
  const activeImage = galleryImages[selectedImageIndex] || galleryImages[0] || "";

  const handleDelete = async () => {
    if (!isAdmin || deleting || !product) return;
    setDeleting(true);
    try {
      await catalogueProductsApi.remove([product.id]);
      navigate("/admin/sourcewiz/products");
    } catch (error) { alert(catalogueError(error)); }
    finally { setDeleting(false); }
  };

  const handleShareLink = () => {
    navigator.clipboard.writeText(window.location.href).then(() => {
      setCopyFeedback(true);
      setTimeout(() => setCopyFeedback(false), 2500);
    });
  };

  if (loading) return <p role="status">Loading shared product…</p>;
  if (loadError) return <div role="alert">{loadError} <button onClick={() => window.location.reload()}>Retry</button></div>;
  if (!product) return <div>Product not found. <Link to="/admin/sourcewiz/products">Back to catalogue</Link></div>;

  return (
    <div
      style={{
        padding: "16px 36px 60px",
        maxWidth: "1440px",
        margin: "0 auto",
        fontFamily:
          "var(--sw-font-sans, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif)",
        color: "#111827",
      }}
    >
      {/* TOP HEADER: STATUS PILL & AVATAR */}
      <div
        style={{
          display: "flex",
          justifyContent: "flex-end",
          alignItems: "center",
          gap: "12px",
          marginBottom: "12px",
        }}
      >
        <div
          style={{
            display: "inline-flex",
            alignItems: "center",
            gap: "7px",
            background: "#e6f4ea",
            color: "#137333",
            padding: "5px 14px",
            borderRadius: "9999px",
            fontSize: "13px",
            fontWeight: 500,
          }}
        >
          <span
            style={{
              width: 8,
              height: 8,
              borderRadius: "50%",
              background: "#16a34a",
              display: "inline-block",
            }}
          />
          <span>1 Task in progress</span>
        </div>

        <div
          style={{
            width: 32,
            height: 32,
            borderRadius: "50%",
            background: "#86efac",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            color: "#166534",
          }}
          title={user?.fullName || "User Profile"}
        >
          <svg
            width="17"
            height="17"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2.2"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <path d="M19 21v-2a4 4 0 0 0-4-4H9a4 4 0 0 0-4 4v2" />
            <circle cx="12" cy="7" r="4" />
          </svg>
        </div>
      </div>

      {/* PRODUCT TITLE & ACTIONS BAR */}
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          flexWrap: "wrap",
          gap: "16px",
          marginBottom: "16px",
        }}
      >
        {/* Left: Back Arrow Circle & Product ID */}
        <div style={{ display: "flex", alignItems: "center", gap: "14px" }}>
          <button
            type="button"
            onClick={() => navigate("/admin/sourcewiz/products")}
            style={{
              width: "36px",
              height: "36px",
              borderRadius: "50%",
              background: "#f3f4f6",
              border: "1px solid #e5e7eb",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              cursor: "pointer",
              color: "#374151",
              transition: "all 0.15s ease",
            }}
            title="Back to All Products"
          >
            <svg
              width="18"
              height="18"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2.5"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <polyline points="15 18 9 12 15 6" />
            </svg>
          </button>

          <h1
            style={{
              fontSize: "24px",
              fontWeight: 700,
              color: "#111827",
              margin: 0,
              letterSpacing: "-0.02em",
            }}
          >
            {product.sku || product.id}
          </h1>
        </div>

        {/* Right: Prev/Next Pagers, Trash, Download Label, Edit Mode */}
        <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
          {/* Previous / Next Button Group */}
          <div
            style={{
              display: "inline-flex",
              borderRadius: "8px",
              border: "1px solid #e5e7eb",
              background: "#ffffff",
              overflow: "hidden",
            }}
          >
            <button
              type="button"
              disabled={!prevProduct}
              onClick={() => {
                if (prevProduct) {
                  navigate(`/admin/sourcewiz/products/${prevProduct.id}`);
                  setSelectedImageIndex(0);
                }
              }}
              style={{
                padding: "8px 12px",
                border: "none",
                background: "transparent",
                color: prevProduct ? "#374151" : "#d1d5db",
                cursor: prevProduct ? "pointer" : "not-allowed",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                borderRight: "1px solid #e5e7eb",
              }}
              title="Previous Product"
            >
              <svg
                width="16"
                height="16"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2.5"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <polyline points="15 18 9 12 15 6" />
              </svg>
            </button>
            <button
              type="button"
              disabled={!nextProduct}
              onClick={() => {
                if (nextProduct) {
                  navigate(`/admin/sourcewiz/products/${nextProduct.id}`);
                  setSelectedImageIndex(0);
                }
              }}
              style={{
                padding: "8px 12px",
                border: "none",
                background: "transparent",
                color: nextProduct ? "#374151" : "#d1d5db",
                cursor: nextProduct ? "pointer" : "not-allowed",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
              }}
              title="Next Product"
            >
              <svg
                width="16"
                height="16"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2.5"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <polyline points="9 18 15 12 9 6" />
              </svg>
            </button>
          </div>

          {/* Delete Trash Button */}
          {isAdmin && (
            <button
              type="button"
              onClick={() => setShowDeleteConfirm(true)}
              style={{
                padding: "8px 12px",
                borderRadius: "8px",
                border: "1px solid #e5e7eb",
                background: "#ffffff",
                color: "#6b7280",
                cursor: "pointer",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                transition: "all 0.15s ease",
              }}
              title="Delete Product"
            >
              <svg
                width="17"
                height="17"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <path d="M3 6h18" />
                <path d="M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6" />
                <path d="M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2" />
              </svg>
            </button>
          )}

          {/* Download Label Button */}
          <button
            type="button"
            onClick={() => setShowLabelModal(true)}
            style={{
              padding: "8px 16px",
              borderRadius: "8px",
              border: "1.5px solid #2dd4bf",
              background: "#ffffff",
              color: "#0f766e",
              fontSize: "13.5px",
              fontWeight: 600,
              cursor: "pointer",
              display: "inline-flex",
              alignItems: "center",
              gap: "7px",
              transition: "all 0.15s ease",
            }}
          >
            {/* QR / Barcode Icon */}
            <svg
              width="17"
              height="17"
              viewBox="0 0 24 24"
              fill="none"
              stroke="#0f766e"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <rect width="6" height="6" x="3" y="3" rx="1" />
              <rect width="6" height="6" x="15" y="3" rx="1" />
              <rect width="6" height="6" x="3" y="15" rx="1" />
              <path d="m15 15 3 3" />
              <path d="m18 15-3 3" />
              <path d="M21 21v-3" />
              <path d="M21 15h-3" />
            </svg>
            <span>Download Label</span>
          </button>

          {/* Edit Mode Button */}
          <Link
            to={`/admin/sourcewiz/product-form?editId=${product.id}`}
            style={{
              padding: "8px 18px",
              borderRadius: "8px",
              border: "none",
              background: "#115e59",
              color: "#ffffff",
              fontSize: "13.5px",
              fontWeight: 600,
              textDecoration: "none",
              display: "inline-flex",
              alignItems: "center",
              gap: "6px",
              cursor: "pointer",
              boxShadow: "0 1px 3px rgba(17, 94, 89, 0.2)",
            }}
          >
            <span>Edit Mode</span>
          </Link>
        </div>
      </div>

      {/* HORIZONTAL DETAIL TABS */}
      <div
        style={{
          display: "flex",
          gap: "28px",
          borderBottom: "1.5px solid #e5e7eb",
          marginBottom: "28px",
        }}
      >
        {[
          { id: "basic", label: "Basic information" },
          { id: "variants", label: "Variants" },
          { id: "packing", label: "Packing & Loadability" },
          { id: "costing", label: "Costing" },
          { id: "attachments", label: "Attachments" },
        ].map((tab) => {
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              type="button"
              onClick={() => setActiveTab(tab.id as any)}
              style={{
                background: "none",
                border: "none",
                padding: "10px 4px 14px",
                fontSize: "14.5px",
                fontWeight: isActive ? 600 : 500,
                color: isActive ? "#0f766e" : "#6b7280",
                cursor: "pointer",
                position: "relative",
              }}
            >
              {tab.label}
              {isActive && (
                <span
                  style={{
                    position: "absolute",
                    bottom: "-1.5px",
                    left: 0,
                    right: 0,
                    height: "2.5px",
                    background: "#0f766e",
                    borderRadius: "2px",
                  }}
                />
              )}
            </button>
          );
        })}
      </div>

      {/* TAB CONTENT: BASIC INFORMATION */}
      {activeTab === "basic" && (
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "1.1fr 1fr",
            gap: "48px",
            alignItems: "start",
          }}
        >
          {/* LEFT: IMAGE CAROUSEL & THUMBNAILS GALLERY */}
          <div>
            {/* Counter: "1 of 7" */}
            <div
              style={{
                display: "flex",
                justifyContent: "flex-end",
                fontSize: "12.5px",
                color: "#6b7280",
                fontWeight: 500,
                marginBottom: "8px",
              }}
            >
              {selectedImageIndex + 1} of {galleryImages.length}
            </div>

            {/* Large Main Image Display */}
            <div
              style={{
                height: "440px",
                background: "#ffffff",
                borderRadius: "14px",
                border: "1px solid #f1f5f9",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                position: "relative",
                padding: "24px",
              }}
            >
              <img
                src={activeImage}
                alt={product.name || `Product ${product.sku}`}
                style={{
                  maxHeight: "100%",
                  maxWidth: "100%",
                  objectFit: "contain",
                  transition: "opacity 0.2s ease",
                }}
                onError={(e) => {
                  (e.target as HTMLImageElement).src = FALLBACK_IMG;
                }}
              />

              {/* Share Icon at Bottom Right */}
              <button
                type="button"
                onClick={handleShareLink}
                style={{
                  position: "absolute",
                  bottom: "16px",
                  right: "16px",
                  background: "#ffffff",
                  border: "1px solid #e5e7eb",
                  borderRadius: "50%",
                  width: "32px",
                  height: "32px",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  cursor: "pointer",
                  color: "#6b7280",
                  boxShadow: "0 2px 5px rgba(0,0,0,0.06)",
                }}
                title={copyFeedback ? "Copied!" : "Copy Product Link"}
              >
                <svg
                  width="15"
                  height="15"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71" />
                  <path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71" />
                </svg>
              </button>
            </div>

            {/* Carousel Dots */}
            <div
              style={{
                display: "flex",
                justifyContent: "center",
                gap: "8px",
                margin: "14px 0 20px 0",
              }}
            >
              {galleryImages.map((_, idx) => (
                <button
                  key={idx}
                  type="button"
                  onClick={() => setSelectedImageIndex(idx)}
                  style={{
                    width: selectedImageIndex === idx ? "8px" : "6px",
                    height: selectedImageIndex === idx ? "8px" : "6px",
                    borderRadius: "50%",
                    background: selectedImageIndex === idx ? "#6b7280" : "#d1d5db",
                    border: "none",
                    cursor: "pointer",
                    padding: 0,
                    transition: "all 0.15s ease",
                  }}
                />
              ))}
            </div>

            {/* Thumbnails Row */}
            <div
              style={{
                display: "flex",
                gap: "10px",
                overflowX: "auto",
                paddingBottom: "8px",
              }}
            >
              {galleryImages.map((imgUrl, idx) => {
                const isActive = selectedImageIndex === idx;
                return (
                  <button
                    key={idx}
                    type="button"
                    onClick={() => setSelectedImageIndex(idx)}
                    style={{
                      width: "60px",
                      height: "60px",
                      borderRadius: "6px",
                      border: isActive ? "2px solid #111827" : "1px solid #e5e7eb",
                      background: "#ffffff",
                      padding: "4px",
                      cursor: "pointer",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      flexShrink: 0,
                      outline: "none",
                    }}
                  >
                    <img
                      src={imgUrl}
                      alt={`Thumb ${idx + 1}`}
                      style={{
                        maxHeight: "100%",
                        maxWidth: "100%",
                        objectFit: "contain",
                      }}
                      onError={(e) => {
                        (e.target as HTMLImageElement).src = FALLBACK_IMG;
                      }}
                    />
                  </button>
                );
              })}
            </div>
          </div>

          {/* RIGHT: DETAILS & SPECS TABLE */}
          <div style={{ paddingTop: "12px" }}>
            {/* Top Summary Block */}
            <div style={{ marginBottom: "24px" }}>
              <div style={{ fontSize: "12px", color: "#6b7280", fontWeight: 500, marginBottom: "4px" }}>
                Base selling price
              </div>
              <div style={{ fontSize: "16px", fontWeight: 700, color: "#111827", marginBottom: "18px" }}>
                {product.fobPriceUsd ? `$${product.fobPriceUsd.toFixed(2)}` : "-- --"}
              </div>

              <div style={{ fontSize: "12px", color: "#6b7280", fontWeight: 500, marginBottom: "4px" }}>
                Category
              </div>
              <div style={{ fontSize: "15px", fontWeight: 700, color: "#111827", marginBottom: "18px" }}>
                {product.category ?? "—"}
              </div>

              <div style={{ fontSize: "12px", color: "#6b7280", fontWeight: 500, marginBottom: "4px" }}>
                Sub Category
              </div>
              <div style={{ fontSize: "15px", fontWeight: 700, color: "#111827", marginBottom: "18px" }}>
                {product.subCategory ?? "—"}
              </div>

              <div style={{ fontSize: "12px", color: "#6b7280", fontWeight: 500, marginBottom: "4px" }}>
                Product ID
              </div>
              <div style={{ fontSize: "15px", fontWeight: 700, color: "#111827" }}>
                {product.sku || product.id}
              </div>
            </div>

            {/* Divider */}
            <div style={{ height: "1px", background: "#e5e7eb", margin: "24px 0" }} />

            {/* Specifications Key-Value List */}
            <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
              <div style={{ display: "grid", gridTemplateColumns: "160px 1fr", alignItems: "baseline" }}>
                <span style={{ fontSize: "13px", color: "#6b7280", fontWeight: 500 }}>
                  Collection Name
                </span>
                <span style={{ fontSize: "14px", fontWeight: 600, color: "#111827" }}>
                  {product.collectionName ?? "—"}
                </span>
              </div>

              <div style={{ display: "grid", gridTemplateColumns: "160px 1fr", alignItems: "baseline" }}>
                <span style={{ fontSize: "13px", color: "#6b7280", fontWeight: 500 }}>
                  Material
                </span>
                <span style={{ fontSize: "14px", fontWeight: 600, color: "#111827" }}>
                  {product.material ?? "—"}
                </span>
              </div>

              <div style={{ display: "grid", gridTemplateColumns: "160px 1fr", alignItems: "baseline" }}>
                <span style={{ fontSize: "13px", color: "#6b7280", fontWeight: 500 }}>
                  Size (CM)
                </span>
                <span style={{ fontSize: "14px", fontWeight: 600, color: "#111827" }}>
                  {product.sizeCm || product.dimensions || "—"}
                </span>
              </div>

              <div style={{ display: "grid", gridTemplateColumns: "160px 1fr", alignItems: "baseline" }}>
                <span style={{ fontSize: "13px", color: "#6b7280", fontWeight: 500 }}>
                  Product Name
                </span>
                <span style={{ fontSize: "14px", fontWeight: 600, color: "#111827" }}>
                  {product.name ?? "—"}
                </span>
              </div>

              <div style={{ display: "grid", gridTemplateColumns: "160px 1fr", alignItems: "baseline" }}>
                <span style={{ fontSize: "13px", color: "#6b7280", fontWeight: 500 }}>
                  Assembled/KD
                </span>
                <span style={{ fontSize: "14px", fontWeight: 600, color: "#111827" }}>
                  {product.assembledKd ?? "—"}
                </span>
              </div>

              <div style={{ display: "grid", gridTemplateColumns: "160px 1fr", alignItems: "baseline" }}>
                <span style={{ fontSize: "13px", color: "#6b7280", fontWeight: 500 }}>
                  Metal Finish
                </span>
                <span style={{ fontSize: "14px", fontWeight: 600, color: "#111827" }}>
                  {product.metalFinish ?? "—"}
                </span>
              </div>

              <div style={{ display: "grid", gridTemplateColumns: "160px 1fr", alignItems: "baseline" }}>
                <span style={{ fontSize: "13px", color: "#6b7280", fontWeight: 500 }}>
                  CBM
                </span>
                <span style={{ fontSize: "14px", fontWeight: 600, color: "#111827" }}>
                  {product.cbm ?? "—"}
                </span>
              </div>

              {product.woodFinish && (
                <div style={{ display: "grid", gridTemplateColumns: "160px 1fr", alignItems: "baseline" }}>
                  <span style={{ fontSize: "13px", color: "#6b7280", fontWeight: 500 }}>
                    Wood Finish
                  </span>
                  <span style={{ fontSize: "14px", fontWeight: 600, color: "#111827" }}>
                    {product.woodFinish}
                  </span>
                </div>
              )}

              {product.moq && (
                <div style={{ display: "grid", gridTemplateColumns: "160px 1fr", alignItems: "baseline" }}>
                  <span style={{ fontSize: "13px", color: "#6b7280", fontWeight: 500 }}>
                    MOQ
                  </span>
                  <span style={{ fontSize: "14px", fontWeight: 600, color: "#111827" }}>
                    {product.moq} Pcs
                  </span>
                </div>
              )}

              {product.stockStatus && (
                <div style={{ display: "grid", gridTemplateColumns: "160px 1fr", alignItems: "baseline" }}>
                  <span style={{ fontSize: "13px", color: "#6b7280", fontWeight: 500 }}>
                    Stock Availability
                  </span>
                  <span
                    style={{
                      fontSize: "12px",
                      fontWeight: 700,
                      color: "#15803d",
                      background: "#dcfce7",
                      padding: "3px 10px",
                      borderRadius: "9999px",
                      display: "inline-block",
                      width: "fit-content",
                    }}
                  >
                    {product.stockStatus}
                  </span>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* TAB CONTENT: VARIANTS */}
      {activeTab === "variants" && (
        <div style={{ background: "#ffffff", borderRadius: "14px", border: "1px solid #e5e7eb", padding: "28px" }}>
          <h3 style={{ fontSize: "16px", fontWeight: 700, color: "#111827", margin: "0 0 16px 0" }}>
            Available Color & Material Variants
          </h3>
          <p>No variants have been added for this product.</p>
        </div>
      )}

      {/* TAB CONTENT: PACKING & LOADABILITY */}
      {activeTab === "packing" && (
        <div style={{ background: "#ffffff", borderRadius: "14px", border: "1px solid #e5e7eb", padding: "28px" }}>
          <h3 style={{ fontSize: "16px", fontWeight: 700, color: "#111827", margin: "0 0 20px 0" }}>
            Export Packaging & Container Loadability
          </h3>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: "24px" }}>
            <div style={{ background: "#f8fafc", padding: "20px", borderRadius: "12px", border: "1px solid #e2e8f0" }}>
              <div style={{ fontSize: "12px", color: "#64748b", fontWeight: 600, textTransform: "uppercase" }}>
                Package Dimensions
              </div>
              <div style={{ fontSize: "18px", fontWeight: 700, color: "#0f172a", marginTop: "8px" }}>
                {product.sizeCm || product.dimensions || "—"}
              </div>
              <div style={{ fontSize: "12.5px", color: "#64748b", marginTop: "4px" }}>
                Packaging details not provided
              </div>
            </div>

            <div style={{ background: "#f8fafc", padding: "20px", borderRadius: "12px", border: "1px solid #e2e8f0" }}>
              <div style={{ fontSize: "12px", color: "#64748b", fontWeight: 600, textTransform: "uppercase" }}>
                CBM per Carton
              </div>
              <div style={{ fontSize: "18px", fontWeight: 700, color: "#0f172a", marginTop: "8px" }}>
                {product.cbm ?? "—"} m³
              </div>
              <div style={{ fontSize: "12.5px", color: "#64748b", marginTop: "4px" }}>
                Weight details not provided
              </div>
            </div>

            <div style={{ background: "#f8fafc", padding: "20px", borderRadius: "12px", border: "1px solid #e2e8f0" }}>
              <div style={{ fontSize: "12px", color: "#64748b", fontWeight: 600, textTransform: "uppercase" }}>
                40'ft GP Container Load
              </div>
              <div style={{ fontSize: "18px", fontWeight: 700, color: "#0f172a", marginTop: "8px" }}>
                {product.gp40ft ?? "—"} Units
              </div>
              <div style={{ fontSize: "12.5px", color: "#64748b", marginTop: "4px" }}>
                40'HC capacity not provided
              </div>
            </div>
          </div>
        </div>
      )}

      {/* TAB CONTENT: COSTING */}
      {activeTab === "costing" && (
        <div style={{ background: "#ffffff", borderRadius: "14px", border: "1px solid #e5e7eb", padding: "28px" }}>
          <h3 style={{ fontSize: "16px", fontWeight: 700, color: "#111827", margin: "0 0 16px 0" }}>
            Commercial Costing & Estimation
          </h3>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "24px" }}>
            <div style={{ border: "1px solid #e5e7eb", borderRadius: "12px", padding: "20px" }}>
              <h4 style={{ margin: "0 0 14px 0", fontSize: "14px", fontWeight: 700, color: "#111827" }}>
                Bill of Materials (BOM)
              </h4>
              <p>No bill of materials is linked to this product.</p>
            </div>

            <div style={{ background: "#f0fdfa", border: "1.5px solid #2dd4bf", borderRadius: "12px", padding: "20px" }}>
              <h4 style={{ margin: "0 0 8px 0", fontSize: "14px", fontWeight: 700, color: "#0f766e" }}>
                FOB Price Summary
              </h4>
              <div style={{ fontSize: "28px", fontWeight: 800, color: "#0f766e", margin: "12px 0" }}>
                ${product.fobPriceUsd ? product.fobPriceUsd.toFixed(2) : "0.00"}
              </div>
              <p style={{ fontSize: "12.5px", color: "#115e59", margin: "0 0 16px 0" }}>
                MOQ: {product.moq ?? 0} pcs.
              </p>
              <Link
                to="/costing"
                style={{
                  background: "#0f766e",
                  color: "#ffffff",
                  padding: "8px 16px",
                  borderRadius: "8px",
                  fontSize: "12.5px",
                  fontWeight: 600,
                  textDecoration: "none",
                  display: "inline-block",
                }}
              >
                Open Costing Module →
              </Link>
            </div>
          </div>
        </div>
      )}

      {/* TAB CONTENT: ATTACHMENTS */}
      {activeTab === "attachments" && (
        <div style={{ background: "#ffffff", borderRadius: "14px", border: "1px solid #e5e7eb", padding: "28px" }}>
          <h3 style={{ fontSize: "16px", fontWeight: 700, color: "#111827", margin: "0 0 16px 0" }}>
            Documents & Digital Assets
          </h3>
          <p>No documents have been added for this product.</p>
        </div>
      )}

      {/* DOWNLOAD LABEL PRINTABLE MODAL */}
      {showLabelModal && (
        <div
          style={{
            position: "fixed",
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            background: "rgba(15, 23, 42, 0.5)",
            backdropFilter: "blur(4px)",
            zIndex: 100,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            padding: "20px",
          }}
          onClick={() => setShowLabelModal(false)}
        >
          <div
            style={{
              background: "#ffffff",
              borderRadius: "16px",
              maxWidth: "460px",
              width: "100%",
              padding: "28px",
              boxShadow: "0 20px 40px rgba(0,0,0,0.15)",
              border: "1px solid #e2e8f0",
              textAlign: "center",
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <h3 style={{ fontSize: "18px", fontWeight: 700, color: "#111827", margin: "0 0 6px 0" }}>
              Print Product Barcode & Label
            </h3>
            <p style={{ fontSize: "13px", color: "#6b7280", margin: "0 0 20px 0" }}>
              Ready to print export hang-tag label or packaging barcode.
            </p>

            {/* Label Preview Card */}
            <div
              style={{
                border: "2px dashed #cbd5e1",
                borderRadius: "12px",
                padding: "20px",
                background: "#fafafa",
                marginBottom: "20px",
              }}
            >
              <div style={{ fontSize: "11px", fontWeight: 700, color: "#0f766e", letterSpacing: "0.08em" }}>
                LAXMI IDEAL INTERIORS
              </div>
              <div style={{ fontSize: "20px", fontWeight: 800, color: "#111827", margin: "6px 0" }}>
                ID : {product.sku || product.id}
              </div>
              <div style={{ fontSize: "13px", color: "#374151", fontWeight: 600 }}>
                {product.name ?? "—"}
              </div>
              <div style={{ fontSize: "11.5px", color: "#6b7280", margin: "4px 0 14px 0" }}>
                Dim: {product.sizeCm || product.dimensions || "—"} • CBM: {product.cbm ?? "—"}
              </div>

              {/* Barcode Mock Graphic */}
              <div
                style={{
                  height: "44px",
                  background:
                    "repeating-linear-gradient(90deg, #111827 0, #111827 2px, transparent 2px, transparent 5px, #111827 5px, #111827 8px, transparent 8px, transparent 10px, #111827 10px, #111827 14px, transparent 14px, transparent 18px)",
                  margin: "0 auto",
                  maxWidth: "260px",
                }}
              />
              <div style={{ fontSize: "11px", color: "#6b7280", marginTop: "4px", letterSpacing: "0.2em" }}>
                *{product.sku || product.id}*
              </div>
            </div>

            <div style={{ display: "flex", gap: "10px", justifyContent: "flex-end" }}>
              <button
                type="button"
                onClick={() => setShowLabelModal(false)}
                style={{
                  background: "#f1f5f9",
                  border: "none",
                  padding: "9px 18px",
                  borderRadius: "8px",
                  fontSize: "13px",
                  fontWeight: 600,
                  color: "#475569",
                  cursor: "pointer",
                }}
              >
                Close
              </button>
              <button
                type="button"
                onClick={() => {
                  window.print();
                }}
                style={{
                  background: "#0f766e",
                  border: "none",
                  padding: "9px 20px",
                  borderRadius: "8px",
                  fontSize: "13px",
                  fontWeight: 600,
                  color: "#ffffff",
                  cursor: "pointer",
                }}
              >
                Print Label
              </button>
            </div>
          </div>
        </div>
      )}

      {/* DELETE CONFIRMATION DIALOG */}
      {showDeleteConfirm && (
        <div
          style={{
            position: "fixed",
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            background: "rgba(15, 23, 42, 0.5)",
            backdropFilter: "blur(4px)",
            zIndex: 100,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            padding: "20px",
          }}
          onClick={() => setShowDeleteConfirm(false)}
        >
          <div
            style={{
              background: "#ffffff",
              borderRadius: "16px",
              maxWidth: "420px",
              width: "100%",
              padding: "24px 28px",
              boxShadow: "0 20px 40px rgba(0,0,0,0.15)",
              border: "1px solid #e2e8f0",
              textAlign: "center",
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <div
              style={{
                width: "48px",
                height: "48px",
                borderRadius: "50%",
                background: "#ffe4e6",
                color: "#e11d48",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                margin: "0 auto 14px auto",
              }}
            >
              <svg
                width="24"
                height="24"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <path d="M3 6h18" />
                <path d="M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6" />
                <path d="M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2" />
              </svg>
            </div>

            <h3 style={{ fontSize: "17px", fontWeight: 700, color: "#111827", margin: "0 0 8px 0" }}>
              Delete Product {product.sku || product.id}?
            </h3>
            <p style={{ fontSize: "13px", color: "#64748b", margin: "0 0 20px 0" }}>
              This will remove this product from your catalogue permanently. This action cannot be undone.
            </p>

            <div style={{ display: "flex", gap: "10px", justifyContent: "center" }}>
              <button
                type="button"
                onClick={() => setShowDeleteConfirm(false)}
                style={{
                  background: "#f1f5f9",
                  border: "none",
                  padding: "9px 18px",
                  borderRadius: "8px",
                  fontSize: "13px",
                  fontWeight: 600,
                  color: "#475569",
                  cursor: "pointer",
                }}
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleDelete}
                style={{
                  background: "#e11d48",
                  border: "none",
                  padding: "9px 20px",
                  borderRadius: "8px",
                  fontSize: "13px",
                  fontWeight: 600,
                  color: "#ffffff",
                  cursor: "pointer",
                }}
              >
                Yes, Delete
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
