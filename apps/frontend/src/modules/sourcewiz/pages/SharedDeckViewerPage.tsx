import React, { useState, useEffect, useRef, useMemo } from "react";
import { useParams, Link } from "react-router-dom";
import { catalogueShareApi, SharedDeckData } from "../api/catalogueShareApi";
import {
  DECK_THEMES,
  ThemeId,
  DeckTheme,
  generateProductPptx,
  PresentationFieldsConfig,
  DEFAULT_PRESENTATION_FIELDS,
  CatalogProductItem,
} from "../utils/pptxExport";
import { exportProductsToExcel } from "../utils/excelExport";

export type SlideItem =
  | { type: "cover" }
  | { type: "product"; product: CatalogProductItem; index: number }
  | { type: "closing" };

export default function SharedDeckViewerPage() {
  const { token } = useParams<{ token: string }>();
  const [deck, setDeck] = useState<SharedDeckData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [currentSlideIndex, setCurrentSlideIndex] = useState(0);
  const [isGridMode, setIsGridMode] = useState(false);
  const [isDownloadingPpt, setIsDownloadingPpt] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const deckContainerRef = useRef<HTMLDivElement>(null);
  const hasTrackedView = useRef(false);

  // Load deck data & record view
  useEffect(() => {
    if (!token) {
      setError("Invalid presentation link.");
      setLoading(false);
      return;
    }

    async function loadDeck() {
      try {
        setLoading(true);
        const data = await catalogueShareApi.getSharedDeckByToken(token!);
        setDeck(data);

        // Record buyer view once per session
        if (!hasTrackedView.current) {
          hasTrackedView.current = true;
          try {
            await catalogueShareApi.recordDeckView(token!);
          } catch {
            // view logging error shouldn't block presentation rendering
          }
        }
      } catch (err: any) {
        console.error("Failed to load shared deck:", err);
        setError(err.response?.data?.error?.message || "Presentation deck not found or link has expired.");
      } finally {
        setLoading(false);
      }
    }

    loadDeck();
  }, [token]);

  const activeTheme: DeckTheme = useMemo(() => {
    const tid = (deck?.themeId as ThemeId) || "obsidian";
    return DECK_THEMES[tid] || DECK_THEMES.obsidian;
  }, [deck?.themeId]);

  const products = deck?.products || [];

  const fields: PresentationFieldsConfig = useMemo(() => {
    return {
      ...DEFAULT_PRESENTATION_FIELDS,
      ...(deck?.includePricing !== undefined ? { includePricing: deck.includePricing } : {}),
      ...(deck?.fieldsConfig || {}),
    };
  }, [deck]);

  const slides: SlideItem[] = useMemo(() => {
    const list: SlideItem[] = [];
    if (fields.includeCoverSlide) {
      list.push({ type: "cover" });
    }
    products.forEach((p, idx) => {
      list.push({ type: "product", product: p, index: idx });
    });
    if (fields.includeClosingSlide) {
      list.push({ type: "closing" });
    }
    if (list.length === 0 && products.length > 0) {
      products.forEach((p, idx) => list.push({ type: "product", product: p, index: idx }));
    }
    return list;
  }, [fields, products]);

  const totalSlides = slides.length > 0 ? slides.length : 1;

  // Keyboard navigation (Arrow keys)
  useEffect(() => {
    function handleKeyDown(e: KeyboardEvent) {
      if (isGridMode) return;
      if (e.key === "ArrowRight" || e.key === "PageDown" || e.key === " ") {
        handleNext();
      } else if (e.key === "ArrowLeft" || e.key === "PageUp") {
        handlePrev();
      } else if (e.key === "Home") {
        setCurrentSlideIndex(0);
      } else if (e.key === "End" && deck) {
        setCurrentSlideIndex(totalSlides - 1);
      }
    }

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [currentSlideIndex, deck, isGridMode, totalSlides]);

  function handleNext() {
    setCurrentSlideIndex((prev) => Math.min(prev + 1, totalSlides - 1));
  }

  function handlePrev() {
    setCurrentSlideIndex((prev) => Math.max(prev - 1, 0));
  }

  async function handleDownloadPpt() {
    if (!deck || products.length === 0) return;
    setIsDownloadingPpt(true);
    try {
      await generateProductPptx(products, {
        themeId: (deck.themeId as ThemeId) || "obsidian",
        deckTitle: deck.title,
        customerName: deck.customerName,
        includePricing: fields.includePricing,
        fields,
      });
    } catch (err) {
      console.error("Failed to download PPT:", err);
      alert("Could not generate PowerPoint file. Please try again.");
    } finally {
      setIsDownloadingPpt(false);
    }
  }

  function handleDownloadExcel() {
    if (!deck || products.length === 0) return;
    exportProductsToExcel(products, {
      deckTitle: deck.title,
      customerName: deck.customerName,
      includePricing: fields.includePricing,
      fields,
    });
  }

  function toggleFullscreen() {
    if (!deckContainerRef.current) return;
    if (!document.fullscreenElement) {
      deckContainerRef.current.requestFullscreen().then(() => setIsFullscreen(true)).catch(() => {});
    } else {
      document.exitFullscreen().then(() => setIsFullscreen(false)).catch(() => {});
    }
  }

  if (loading) {
    return (
      <div style={{ minHeight: "100vh", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", background: "#0c0f17", color: "#fff", fontFamily: "'Inter', sans-serif" }}>
        <div style={{ width: 44, height: 44, border: "3px solid rgba(255,255,255,0.15)", borderTopColor: "#3b82f6", borderRadius: "50%", animation: "spin 0.8s linear infinite" }} />
        <p style={{ marginTop: 20, fontSize: 15, color: "#94a3b8", fontWeight: 500 }}>Loading presentation deck...</p>
        <style>{`@keyframes spin { 0% { transform: rotate(0deg); } 100% { transform: rotate(360deg); } }`}</style>
      </div>
    );
  }

  if (error || !deck) {
    return (
      <div style={{ minHeight: "100vh", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", background: "#0c0f17", color: "#fff", fontFamily: "'Inter', sans-serif", padding: 24, textAlign: "center" }}>
        <div style={{ width: 64, height: 64, borderRadius: "50%", background: "rgba(239,68,68,0.1)", display: "flex", alignItems: "center", justifyContent: "center", color: "#ef4444", fontSize: 28, marginBottom: 16 }}>
          ✕
        </div>
        <h2 style={{ fontSize: 24, fontWeight: 700, marginBottom: 8 }}>Presentation Not Available</h2>
        <p style={{ color: "#94a3b8", maxWidth: 440, fontSize: 14, lineHeight: 1.6, marginBottom: 24 }}>
          {error || "This shared presentation link is invalid or may have been removed."}
        </p>
        <Link to="/login" style={{ padding: "10px 22px", background: "#2563eb", color: "#fff", borderRadius: 8, textDecoration: "none", fontSize: 14, fontWeight: 600 }}>
          Go to Sign In
        </Link>
      </div>
    );
  }

  const accentHex = `#${activeTheme.swatch.accent}`;

  return (
    <div
      ref={deckContainerRef}
      style={{
        minHeight: "100vh",
        background: "#080b11",
        color: "#f8fafc",
        fontFamily: "'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif",
        display: "flex",
        flexDirection: "column",
        userSelect: "none",
      }}
    >
      {/* Top Header Bar */}
      <header
        style={{
          height: 60,
          background: "rgba(15, 23, 42, 0.85)",
          backdropFilter: "blur(12px)",
          borderBottom: "1px solid rgba(255,255,255,0.08)",
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          padding: "0 20px",
          zIndex: 40,
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: 14 }}>
          <div
            style={{
              width: 32,
              height: 32,
              borderRadius: 8,
              background: `linear-gradient(135deg, ${accentHex}, #1e293b)`,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              fontWeight: 800,
              fontSize: 14,
              color: "#fff",
              boxShadow: "0 2px 8px rgba(0,0,0,0.3)",
            }}
          >
            LII
          </div>
          <div>
            <div style={{ fontSize: 14, fontWeight: 700, color: "#fff", letterSpacing: "0.2px" }}>
              {deck.title}
            </div>
            {deck.customerName && (
              <div style={{ fontSize: 11, color: "#94a3b8" }}>
                Prepared for <strong style={{ color: "#cbd5e1" }}>{deck.customerName}</strong>
              </div>
            )}
          </div>
        </div>

        {/* Action Buttons */}
        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
          <button
            onClick={() => setIsGridMode(!isGridMode)}
            style={{
              display: "flex",
              alignItems: "center",
              gap: 6,
              background: isGridMode ? "rgba(255,255,255,0.15)" : "rgba(255,255,255,0.06)",
              border: "1px solid rgba(255,255,255,0.12)",
              color: "#f1f5f9",
              borderRadius: 6,
              padding: "6px 12px",
              fontSize: 12,
              fontWeight: 600,
              cursor: "pointer",
              transition: "all 0.15s ease",
            }}
            title="Toggle All Slides Grid"
          >
            <span>⊞</span>
            <span>All Slides</span>
          </button>

          <button
            onClick={handleDownloadExcel}
            style={{
              display: "flex",
              alignItems: "center",
              gap: 6,
              background: "rgba(16, 185, 129, 0.15)",
              border: "1px solid rgba(16, 185, 129, 0.3)",
              color: "#34d399",
              borderRadius: 6,
              padding: "6px 12px",
              fontSize: 12,
              fontWeight: 600,
              cursor: "pointer",
            }}
            title="Download full specs in Excel format"
          >
            <span>📊</span>
            <span>Excel (.xlsx)</span>
          </button>

          <button
            onClick={handleDownloadPpt}
            disabled={isDownloadingPpt}
            style={{
              display: "flex",
              alignItems: "center",
              gap: 6,
              background: `linear-gradient(135deg, ${accentHex}, #2563eb)`,
              border: "none",
              color: "#fff",
              borderRadius: 6,
              padding: "6px 14px",
              fontSize: 12,
              fontWeight: 700,
              cursor: isDownloadingPpt ? "not-allowed" : "pointer",
              boxShadow: "0 2px 8px rgba(37,99,235,0.3)",
            }}
            title="Download PowerPoint presentation file"
          >
            <span>{isDownloadingPpt ? "⏳" : "📥"}</span>
            <span>{isDownloadingPpt ? "Generating..." : "Download PPT (.pptx)"}</span>
          </button>

          <button
            onClick={toggleFullscreen}
            style={{
              background: "rgba(255,255,255,0.06)",
              border: "1px solid rgba(255,255,255,0.1)",
              color: "#94a3b8",
              borderRadius: 6,
              padding: "6px 10px",
              fontSize: 13,
              cursor: "pointer",
            }}
            title="Toggle Fullscreen"
          >
            {isFullscreen ? "↙↗" : "⛶"}
          </button>
        </div>
      </header>

      {/* Progress Bar */}
      <div style={{ height: 3, background: "rgba(255,255,255,0.05)", width: "100%" }}>
        <div
          style={{
            height: "100%",
            background: accentHex,
            width: `${((currentSlideIndex + 1) / totalSlides) * 100}%`,
            transition: "width 0.3s cubic-bezier(0.4, 0, 0.2, 1)",
          }}
        />
      </div>

      {/* Main Slide Viewing Area */}
      <main
        style={{
          flex: 1,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          padding: "24px 16px 80px 16px",
          position: "relative",
          overflow: "auto",
        }}
      >
        {isGridMode ? (
          /* Grid Mode: View all slides as cards */
          <div
            style={{
              maxWidth: 1200,
              width: "100%",
              display: "grid",
              gridTemplateColumns: "repeat(auto-fill, minmax(280px, 1fr))",
              gap: 20,
              padding: "16px 0",
            }}
          >
            {slides.map((s, slideIdx) => {
              if (s.type === "cover") {
                return (
                  <div
                    key="cover-preview"
                    onClick={() => {
                      setCurrentSlideIndex(slideIdx);
                      setIsGridMode(false);
                    }}
                    style={{
                      aspectRatio: "16/9",
                      background: `#${activeTheme.cover.bg}`,
                      color: `#${activeTheme.cover.titleColor}`,
                      borderRadius: 10,
                      border: currentSlideIndex === slideIdx ? `2px solid ${accentHex}` : "1px solid rgba(255,255,255,0.15)",
                      padding: 16,
                      cursor: "pointer",
                      display: "flex",
                      flexDirection: "column",
                      justifyContent: "center",
                      alignItems: "center",
                      textAlign: "center",
                      boxShadow: "0 4px 16px rgba(0,0,0,0.3)",
                    }}
                  >
                    <span style={{ fontSize: 10, letterSpacing: 2, color: accentHex, fontWeight: 700, textTransform: "uppercase" }}>
                      Cover Slide
                    </span>
                    <h4 style={{ fontSize: 14, fontWeight: 700, margin: "8px 0" }}>{deck.title}</h4>
                    <p style={{ fontSize: 11, color: `#${activeTheme.cover.subtitleColor}` }}>
                      {deck.customerName ? `For: ${deck.customerName}` : "LAKSHYA INTERNATIONAL"}
                    </p>
                  </div>
                );
              }

              if (s.type === "closing") {
                return (
                  <div
                    key="closing-preview"
                    onClick={() => {
                      setCurrentSlideIndex(slideIdx);
                      setIsGridMode(false);
                    }}
                    style={{
                      aspectRatio: "16/9",
                      background: `#${activeTheme.closing.bg}`,
                      color: `#${activeTheme.closing.titleColor}`,
                      borderRadius: 10,
                      border: currentSlideIndex === slideIdx ? `2px solid ${accentHex}` : "1px solid rgba(255,255,255,0.15)",
                      padding: 16,
                      cursor: "pointer",
                      display: "flex",
                      flexDirection: "column",
                      justifyContent: "center",
                      alignItems: "center",
                      textAlign: "center",
                    }}
                  >
                    <span style={{ fontSize: 10, letterSpacing: 2, color: accentHex, fontWeight: 700 }}>
                      Closing Slide
                    </span>
                    <h4 style={{ fontSize: 14, fontWeight: 700, margin: "8px 0" }}>Thank You</h4>
                    <p style={{ fontSize: 11, color: `#${activeTheme.closing.subtitleColor}` }}>Order & Inquiry Contact</p>
                  </div>
                );
              }

              const item = s.product;
              return (
                <div
                  key={item.id || item.sku || slideIdx}
                  onClick={() => {
                    setCurrentSlideIndex(slideIdx);
                    setIsGridMode(false);
                  }}
                  style={{
                    aspectRatio: "16/9",
                    background: `#${activeTheme.product.tableBg}`,
                    borderRadius: 10,
                    border: currentSlideIndex === slideIdx ? `2px solid ${accentHex}` : "1px solid rgba(255,255,255,0.12)",
                    overflow: "hidden",
                    cursor: "pointer",
                    display: "flex",
                    flexDirection: "column",
                    boxShadow: "0 4px 16px rgba(0,0,0,0.3)",
                  }}
                >
                  <div style={{ flex: 1, position: "relative", background: "#111" }}>
                    <img
                      src={item.image}
                      alt={item.name}
                      style={{ width: "100%", height: "100%", objectFit: "cover" }}
                      onError={(e) => {
                        (e.target as HTMLImageElement).src =
                          "https://images.unsplash.com/photo-1555041469-a586c61ea9bc?w=600&auto=format&fit=crop&q=80";
                      }}
                    />
                    {fields.includeSku && (
                      <div
                        style={{
                          position: "absolute",
                          top: 6,
                          left: 6,
                          background: "rgba(0,0,0,0.75)",
                          color: "#fff",
                          fontSize: 10,
                          fontWeight: 700,
                          padding: "2px 6px",
                          borderRadius: 4,
                          fontFamily: "monospace",
                        }}
                      >
                        {item.sku}
                      </div>
                    )}
                  </div>
                  <div style={{ padding: "8px 12px", background: `#${activeTheme.product.bg}`, color: `#${activeTheme.product.titleColor}` }}>
                    <div style={{ fontSize: 12, fontWeight: 700, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
                      {item.name}
                    </div>
                    <div style={{ fontSize: 11, color: accentHex, fontWeight: 600 }}>
                      {fields.includePricing
                        ? `$${Number(item.fobPriceUsd || 0).toFixed(2)} FOB`
                        : fields.includeCategory
                        ? item.category
                        : item.collectionName || "Catalogue Item"}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          /* Presentation Slide Container (16:9 widescreen ratio) */
          <div
            style={{
              width: "100%",
              maxWidth: 1180,
              aspectRatio: "16/9",
              background:
                slides[currentSlideIndex]?.type === "cover"
                  ? `#${activeTheme.cover.bg}`
                  : slides[currentSlideIndex]?.type === "closing"
                  ? `#${activeTheme.closing.bg}`
                  : `#${activeTheme.product.bg}`,
              borderRadius: 16,
              border: `1px solid #${activeTheme.product.tableBorder}`,
              boxShadow: "0 25px 60px -15px rgba(0,0,0,0.7), 0 0 0 1px rgba(255,255,255,0.05)",
              overflow: "hidden",
              display: "flex",
              flexDirection: "column",
              position: "relative",
              transition: "all 0.25s ease",
            }}
          >
            {/* COVER SLIDE */}
            {slides[currentSlideIndex]?.type === "cover" && (
              <div
                style={{
                  height: "100%",
                  display: "flex",
                  flexDirection: "column",
                  justifyContent: "center",
                  alignItems: "center",
                  padding: "48px 40px",
                  textAlign: "center",
                  background: `#${activeTheme.cover.bg}`,
                  position: "relative",
                }}
              >
                {/* Decorative theme pill */}
                <div
                  style={{
                    display: "inline-flex",
                    alignItems: "center",
                    gap: 8,
                    background: "rgba(255,255,255,0.06)",
                    border: `1px solid ${accentHex}40`,
                    padding: "6px 16px",
                    borderRadius: 30,
                    marginBottom: 24,
                  }}
                >
                  <span style={{ width: 8, height: 8, borderRadius: "50%", background: accentHex }} />
                  <span style={{ fontSize: 11, fontWeight: 700, letterSpacing: 2, color: accentHex, textTransform: "uppercase" }}>
                    B2B Export Collection 2026
                  </span>
                </div>

                <h1
                  style={{
                    fontSize: "clamp(26px, 4.5vw, 48px)",
                    fontWeight: 800,
                    color: `#${activeTheme.cover.titleColor}`,
                    margin: "0 0 16px 0",
                    lineHeight: 1.15,
                    maxWidth: 820,
                  }}
                >
                  {deck.title}
                </h1>

                {deck.customerName && (
                  <div
                    style={{
                      fontSize: "clamp(14px, 2vw, 18px)",
                      color: `#${activeTheme.cover.subtitleColor}`,
                      marginBottom: 28,
                      fontWeight: 500,
                    }}
                  >
                    Exclusively curated for <strong style={{ color: accentHex }}>{deck.customerName}</strong>
                  </div>
                )}

                <div
                  style={{
                    width: 60,
                    height: 2,
                    background: accentHex,
                    margin: "0 auto 28px auto",
                    borderRadius: 2,
                  }}
                />

                <div style={{ display: "flex", alignItems: "center", gap: 24, fontSize: 13, color: `#${activeTheme.cover.subtitleColor}` }}>
                  <div>
                    <strong style={{ color: `#${activeTheme.cover.titleColor}` }}>LAKSHYA INTERNATIONAL</strong>
                  </div>
                  <span style={{ opacity: 0.4 }}>•</span>
                  <div>Jodhpur, India</div>
                  <span style={{ opacity: 0.4 }}>•</span>
                  <div>{products.length} Products Curated</div>
                </div>

                <div
                  style={{
                    position: "absolute",
                    bottom: 24,
                    display: "flex",
                    alignItems: "center",
                    gap: 8,
                    fontSize: 11,
                    color: `#${activeTheme.cover.subtitleColor}`,
                    opacity: 0.7,
                  }}
                >
                  <span>Use</span>
                  <kbd style={{ background: "rgba(255,255,255,0.1)", padding: "2px 6px", borderRadius: 4, fontFamily: "inherit" }}>←</kbd>
                  <kbd style={{ background: "rgba(255,255,255,0.1)", padding: "2px 6px", borderRadius: 4, fontFamily: "inherit" }}>→</kbd>
                  <span>arrow keys or bottom controls to browse items</span>
                </div>
              </div>
            )}

            {/* PRODUCT SLIDE */}
            {slides[currentSlideIndex]?.type === "product" && (() => {
              const item = (slides[currentSlideIndex] as { product: CatalogProductItem }).product;
              const hasAnySpecs =
                fields.includeCollection ||
                fields.includeMaterial ||
                fields.includeWoodFinish ||
                fields.includeMetalFinish ||
                fields.includeDimensions ||
                fields.includeAssembly;

              return (
                <div
                  style={{
                    height: "100%",
                    display: "grid",
                    gridTemplateColumns: "1.05fr 1fr",
                    background: `#${activeTheme.product.bg}`,
                    position: "relative",
                  }}
                >
                  {/* Left Column: Image Canvas */}
                  <div
                    style={{
                      height: "100%",
                      padding: "24px 16px 24px 28px",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                    }}
                  >
                    <div
                      style={{
                        width: "100%",
                        height: "100%",
                        background: `#${activeTheme.product.tableBg}`,
                        borderRadius: 12,
                        border: `1px solid #${activeTheme.product.imgBorderColor || activeTheme.product.tableBorder}`,
                        overflow: "hidden",
                        position: "relative",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        boxShadow: "0 10px 30px rgba(0,0,0,0.3)",
                      }}
                    >
                      <img
                        src={item.image}
                        alt={item.name}
                        style={{
                          width: "100%",
                          height: "100%",
                          objectFit: "contain",
                          padding: 16,
                          background: "#0d1117",
                        }}
                        onError={(e) => {
                          (e.target as HTMLImageElement).src =
                            "https://images.unsplash.com/photo-1555041469-a586c61ea9bc?w=600&auto=format&fit=crop&q=80";
                        }}
                      />
                      {fields.includeSku && (
                        <div
                          style={{
                            position: "absolute",
                            bottom: 14,
                            left: 14,
                            background: "rgba(0,0,0,0.8)",
                            backdropFilter: "blur(6px)",
                            padding: "4px 10px",
                            borderRadius: 6,
                            fontSize: 11,
                            fontWeight: 700,
                            color: "#cbd5e1",
                            fontFamily: "monospace",
                            border: "1px solid rgba(255,255,255,0.1)",
                          }}
                        >
                          {item.sku}
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Right Column: Specifications & Pricing */}
                  <div
                    style={{
                      padding: "28px 32px 28px 16px",
                      display: "flex",
                      flexDirection: "column",
                      justifyContent: "center",
                      overflowY: "auto",
                    }}
                  >
                    {/* Category Pill */}
                    {fields.includeCategory && (
                      <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 8 }}>
                        <span
                          style={{
                            fontSize: 10,
                            fontWeight: 700,
                            letterSpacing: 1.5,
                            color: `#${activeTheme.product.categoryColor}`,
                            textTransform: "uppercase",
                          }}
                        >
                          {item.category || "FURNITURE"} • {item.subCategory || "GENERAL"}
                        </span>
                      </div>
                    )}

                    {/* Product Name */}
                    <h2
                      style={{
                        fontSize: "clamp(18px, 2.4vw, 26px)",
                        fontWeight: 700,
                        color: `#${activeTheme.product.titleColor}`,
                        margin: "0 0 14px 0",
                        lineHeight: 1.25,
                      }}
                    >
                      {item.name}
                    </h2>

                    {/* Specifications Grid */}
                    {hasAnySpecs && (
                      <div
                        style={{
                          display: "grid",
                          gridTemplateColumns: "1fr 1fr",
                          gap: "10px 14px",
                          background: `#${activeTheme.product.tableBg}`,
                          border: `1px solid #${activeTheme.product.tableBorder}`,
                          borderRadius: 10,
                          padding: "14px 16px",
                          marginBottom: 16,
                        }}
                      >
                        {fields.includeCollection && (
                          <div>
                            <div style={{ fontSize: 10, color: `#${activeTheme.product.tableLabelColor}`, textTransform: "uppercase", fontWeight: 600 }}>
                              Collection
                            </div>
                            <div style={{ fontSize: 12, fontWeight: 600, color: `#${activeTheme.product.tableValColor}` }}>
                              {item.collectionName || "-"}
                            </div>
                          </div>
                        )}

                        {fields.includeMaterial && (
                          <div>
                            <div style={{ fontSize: 10, color: `#${activeTheme.product.tableLabelColor}`, textTransform: "uppercase", fontWeight: 600 }}>
                              Material
                            </div>
                            <div style={{ fontSize: 12, fontWeight: 600, color: `#${activeTheme.product.tableValColor}` }}>
                              {item.material || "-"}
                            </div>
                          </div>
                        )}

                        {fields.includeWoodFinish && (
                          <div>
                            <div style={{ fontSize: 10, color: `#${activeTheme.product.tableLabelColor}`, textTransform: "uppercase", fontWeight: 600 }}>
                              Wood Finish
                            </div>
                            <div style={{ fontSize: 12, fontWeight: 600, color: `#${activeTheme.product.tableValColor}` }}>
                              {item.woodFinish || "-"}
                            </div>
                          </div>
                        )}

                        {fields.includeMetalFinish && (
                          <div>
                            <div style={{ fontSize: 10, color: `#${activeTheme.product.tableLabelColor}`, textTransform: "uppercase", fontWeight: 600 }}>
                              Metal Finish
                            </div>
                            <div style={{ fontSize: 12, fontWeight: 600, color: `#${activeTheme.product.tableValColor}` }}>
                              {item.metalFinish || "-"}
                            </div>
                          </div>
                        )}

                        {fields.includeAssembly && (
                          <div>
                            <div style={{ fontSize: 10, color: `#${activeTheme.product.tableLabelColor}`, textTransform: "uppercase", fontWeight: 600 }}>
                              Assembly
                            </div>
                            <div style={{ fontSize: 12, fontWeight: 600, color: `#${activeTheme.product.tableValColor}` }}>
                              {item.assembledKd || "KD"}
                            </div>
                          </div>
                        )}

                        {fields.includeDimensions && (
                          <div style={{ gridColumn: "span 2" }}>
                            <div style={{ fontSize: 10, color: `#${activeTheme.product.tableLabelColor}`, textTransform: "uppercase", fontWeight: 600 }}>
                              Dimensions (L x W x H)
                            </div>
                            <div style={{ fontSize: 12, fontWeight: 600, color: `#${activeTheme.product.tableValColor}`, fontFamily: "monospace" }}>
                              {item.sizeCm} cm
                            </div>
                          </div>
                        )}
                      </div>
                    )}

                    {/* Pricing Block */}
                    {(fields.includePricing || fields.includeStockStatus) && (
                      <div
                        style={{
                          background: `#${activeTheme.product.priceCardBg}`,
                          border: `1px solid #${activeTheme.product.priceCardBorder}`,
                          borderRadius: 10,
                          padding: "12px 18px",
                          marginBottom: 14,
                          display: "flex",
                          alignItems: "baseline",
                          justifyContent: "space-between",
                        }}
                      >
                        {fields.includePricing ? (
                          <div>
                            <div style={{ fontSize: 10, color: accentHex, fontWeight: 700, textTransform: "uppercase", letterSpacing: 1 }}>
                              FOB Price (USD)
                            </div>
                            <div style={{ fontSize: "clamp(22px, 3vw, 30px)", fontWeight: 800, color: `#${activeTheme.product.priceColor}`, fontFamily: "monospace" }}>
                              ${Number(item.fobPriceUsd || 0).toFixed(2)}
                              <span style={{ fontSize: 12, fontWeight: 500, color: `#${activeTheme.product.tableLabelColor}`, marginLeft: 6 }}>/ Pc</span>
                            </div>
                          </div>
                        ) : <div />}

                        {fields.includeStockStatus && (
                          <div style={{ textAlign: "right" }}>
                            <span
                              style={{
                                fontSize: 10,
                                fontWeight: 700,
                                padding: "4px 8px",
                                borderRadius: 4,
                                background: item.stockStatus === "In Stock" ? "rgba(16,185,129,0.2)" : "rgba(59,130,246,0.2)",
                                color: item.stockStatus === "In Stock" ? "#34d399" : "#60a5fa",
                              }}
                            >
                              {item.stockStatus || "Active"}
                            </span>
                          </div>
                        )}
                      </div>
                    )}

                    {/* Logistics Metrics */}
                    {(fields.includeMoq || fields.includeCbm || fields.includeContainerQty) && (
                      <div
                        style={{
                          display: "grid",
                          gridTemplateColumns: `repeat(${[fields.includeMoq, fields.includeCbm, fields.includeContainerQty].filter(Boolean).length || 1}, 1fr)`,
                          gap: 8,
                          textAlign: "center",
                        }}
                      >
                        {fields.includeMoq && (
                          <div style={{ background: "rgba(255,255,255,0.04)", borderRadius: 6, padding: "8px 6px" }}>
                            <div style={{ fontSize: 9, color: `#${activeTheme.product.tableLabelColor}`, textTransform: "uppercase", fontWeight: 600 }}>MOQ</div>
                            <div style={{ fontSize: 13, fontWeight: 700, color: `#${activeTheme.product.titleColor}`, fontFamily: "monospace" }}>
                              {item.moq} pcs
                            </div>
                          </div>
                        )}
                        {fields.includeCbm && (
                          <div style={{ background: "rgba(255,255,255,0.04)", borderRadius: 6, padding: "8px 6px" }}>
                            <div style={{ fontSize: 9, color: `#${activeTheme.product.tableLabelColor}`, textTransform: "uppercase", fontWeight: 600 }}>Unit CBM</div>
                            <div style={{ fontSize: 13, fontWeight: 700, color: `#${activeTheme.product.titleColor}`, fontFamily: "monospace" }}>
                              {Number(item.cbm || 0).toFixed(3)}
                            </div>
                          </div>
                        )}
                        {fields.includeContainerQty && (
                          <div style={{ background: "rgba(255,255,255,0.04)", borderRadius: 6, padding: "8px 6px" }}>
                            <div style={{ fontSize: 9, color: `#${activeTheme.product.tableLabelColor}`, textTransform: "uppercase", fontWeight: 600 }}>40' HQ Qty</div>
                            <div style={{ fontSize: 13, fontWeight: 700, color: `#${activeTheme.product.titleColor}`, fontFamily: "monospace" }}>
                              {item.gp40ft} pcs
                            </div>
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                </div>
              );
            })()}

            {/* CLOSING / CONTACT SLIDE */}
            {slides[currentSlideIndex]?.type === "closing" && (
              <div
                style={{
                  height: "100%",
                  display: "flex",
                  flexDirection: "column",
                  justifyContent: "center",
                  alignItems: "center",
                  padding: "48px 40px",
                  textAlign: "center",
                  background: `#${activeTheme.closing.bg}`,
                }}
              >
                <div
                  style={{
                    width: 56,
                    height: 56,
                    borderRadius: "50%",
                    background: `linear-gradient(135deg, ${accentHex}, #2563eb)`,
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    fontSize: 24,
                    marginBottom: 20,
                    boxShadow: "0 4px 16px rgba(0,0,0,0.4)",
                  }}
                >
                  ✓
                </div>

                <h2 style={{ fontSize: "clamp(24px, 3.5vw, 36px)", fontWeight: 800, color: `#${activeTheme.closing.titleColor}`, margin: "0 0 10px 0" }}>
                  Thank You for Your Time
                </h2>
                <p style={{ color: `#${activeTheme.closing.subtitleColor}`, fontSize: 14, maxWidth: 540, lineHeight: 1.6, margin: "0 0 28px 0" }}>
                  We look forward to partnering with {deck.customerName || "your esteemed organization"}. For customized sampling, volume orders, or bespoke designs, connect with our export team.
                </p>

                <div
                  style={{
                    display: "flex",
                    flexWrap: "wrap",
                    gap: 16,
                    justifyContent: "center",
                    marginBottom: 24,
                  }}
                >
                  <a
                    href="mailto:exports@liinexus.com"
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: 8,
                      background: accentHex,
                      color: "#fff",
                      padding: "10px 20px",
                      borderRadius: 8,
                      textDecoration: "none",
                      fontSize: 13,
                      fontWeight: 600,
                    }}
                  >
                    <span>✉</span> Email Us: exports@liinexus.com
                  </a>

                  <button
                    onClick={handleDownloadExcel}
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: 8,
                      background: "rgba(255,255,255,0.08)",
                      border: "1px solid rgba(255,255,255,0.15)",
                      color: "#f8fafc",
                      padding: "10px 20px",
                      borderRadius: 8,
                      cursor: "pointer",
                      fontSize: 13,
                      fontWeight: 600,
                    }}
                  >
                    <span>📊</span> Download Full Product Spec Sheet
                  </button>
                </div>

                <div style={{ fontSize: 12, color: `#${activeTheme.closing.subtitleColor}` }}>
                  LII Exports • Jodhpur, Rajasthan, India
                </div>
              </div>
            )}
          </div>
        )}
      </main>

      {/* Bottom Floating Navigation Dock */}
      <footer
        style={{
          position: "fixed",
          bottom: 18,
          left: "50%",
          transform: "translateX(-50%)",
          background: "rgba(15, 23, 42, 0.9)",
          backdropFilter: "blur(16px)",
          border: "1px solid rgba(255,255,255,0.15)",
          borderRadius: 40,
          padding: "6px 16px",
          display: "flex",
          alignItems: "center",
          gap: 12,
          boxShadow: "0 10px 30px rgba(0,0,0,0.5)",
          zIndex: 50,
        }}
      >
        <button
          onClick={handlePrev}
          disabled={currentSlideIndex === 0}
          style={{
            background: "none",
            border: "none",
            color: currentSlideIndex === 0 ? "rgba(255,255,255,0.2)" : "#fff",
            fontSize: 18,
            cursor: currentSlideIndex === 0 ? "not-allowed" : "pointer",
            padding: "4px 8px",
          }}
          title="Previous Slide (Left Arrow)"
        >
          ‹
        </button>

        <span style={{ fontSize: 13, fontWeight: 600, color: "#cbd5e1", minWidth: 80, textAlign: "center" }}>
          {currentSlideIndex + 1} / {totalSlides}
        </span>

        <button
          onClick={handleNext}
          disabled={currentSlideIndex === totalSlides - 1}
          style={{
            background: "none",
            border: "none",
            color: currentSlideIndex === totalSlides - 1 ? "rgba(255,255,255,0.2)" : "#fff",
            fontSize: 18,
            cursor: currentSlideIndex === totalSlides - 1 ? "not-allowed" : "pointer",
            padding: "4px 8px",
          }}
          title="Next Slide (Right Arrow)"
        >
          ›
        </button>
      </footer>
    </div>
  );
}
