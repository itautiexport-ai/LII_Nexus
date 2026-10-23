import React, { useState, useEffect, useRef } from "react";
import { pptMasterApi, PptMasterTheme, PptFrontPage } from "../api/pptMasterApi";
import { Link } from "react-router-dom";

export default function PptThemesMasterPage() {
  const [activeTab, setActiveTab] = useState<"themes" | "frontPages">("themes");
  const [themes, setThemes] = useState<PptMasterTheme[]>([]);
  const [frontPages, setFrontPages] = useState<PptFrontPage[]>([]);
  const [loading, setLoading] = useState(true);
  const [savingTheme, setSavingTheme] = useState(false);
  const [uploadingCover, setUploadingCover] = useState(false);
  const [feedback, setFeedback] = useState<{ type: "success" | "error"; message: string } | null>(null);

  // Theme Form State
  const [themeForm, setThemeForm] = useState({
    id: "",
    name: "",
    tagline: "",
    badge: "CUSTOM",
    primaryColor: "#0f172a",
    accentColor: "#d97706",
    cardBg: "#1e293b",
    textColor: "#ffffff",
    isDark: true,
  });

  // Front Page Form State
  const [coverForm, setCoverForm] = useState({
    title: "",
    description: "",
    overlayText: true,
    textTheme: "light" as "light" | "dark",
  });
  const [coverFile, setCoverFile] = useState<File | null>(null);
  const [coverPreviewUrl, setCoverPreviewUrl] = useState<string>("");
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Built-in presets for reference
  const builtInThemes = [
    {
      id: "midnight",
      name: "Midnight Luxury",
      tagline: "Ultra-dark obsidian aesthetic with brushed gold accents",
      badge: "EXECUTIVE",
      primary_color: "0B0F19",
      accent_color: "F59E0B",
      card_bg: "111827",
      text_color: "F8FAFC",
      is_dark: 1,
    },
    {
      id: "champagne",
      name: "Champagne Pearl",
      tagline: "Warm alabaster and burnished bronze for fine craftsmanship",
      badge: "ELEGANT",
      primary_color: "FBF9F5",
      accent_color: "92400E",
      card_bg: "FFFFFF",
      text_color: "1C1917",
      is_dark: 0,
    },
    {
      id: "editorial",
      name: "Architectural Studio",
      tagline: "Crisp architectural slate with high-contrast electric sapphire",
      badge: "MINIMALIST",
      primary_color: "0F172A",
      accent_color: "38BDF8",
      card_bg: "1E293B",
      text_color: "FFFFFF",
      is_dark: 1,
    },
  ];

  useEffect(() => {
    loadAll();
  }, []);

  const showNotification = (type: "success" | "error", message: string) => {
    setFeedback({ type, message });
    setTimeout(() => setFeedback(null), 4000);
  };

  const loadAll = async () => {
    try {
      setLoading(true);
      const [tData, fData] = await Promise.all([
        pptMasterApi.getThemes(),
        pptMasterApi.getFrontPages(),
      ]);
      setThemes(tData);
      setFrontPages(fData);
    } catch (err) {
      console.error("Failed to load master PPT data:", err);
      showNotification("error", "Failed to load themes and front pages.");
    } finally {
      setLoading(false);
    }
  };

  // Theme Handlers
  const handleThemeSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!themeForm.name.trim()) {
      showNotification("error", "Please provide a theme name.");
      return;
    }

    try {
      setSavingTheme(true);
      if (themeForm.id) {
        await pptMasterApi.updateTheme(themeForm.id, {
          name: themeForm.name.trim(),
          tagline: themeForm.tagline.trim(),
          badge: themeForm.badge.trim(),
          primaryColor: themeForm.primaryColor,
          accentColor: themeForm.accentColor,
          cardBg: themeForm.cardBg,
          textColor: themeForm.textColor,
          isDark: themeForm.isDark,
        });
        showNotification("success", `Theme "${themeForm.name}" updated successfully.`);
      } else {
        await pptMasterApi.createTheme({
          name: themeForm.name.trim(),
          tagline: themeForm.tagline.trim(),
          badge: themeForm.badge.trim(),
          primaryColor: themeForm.primaryColor,
          accentColor: themeForm.accentColor,
          cardBg: themeForm.cardBg,
          textColor: themeForm.textColor,
          isDark: themeForm.isDark,
        });
        showNotification("success", `Theme "${themeForm.name}" created successfully.`);
      }

      setThemeForm({
        id: "",
        name: "",
        tagline: "",
        badge: "CUSTOM",
        primaryColor: "#0f172a",
        accentColor: "#d97706",
        cardBg: "#1e293b",
        textColor: "#ffffff",
        isDark: true,
      });
      loadAll();
    } catch (err: any) {
      console.error(err);
      showNotification("error", err?.response?.data?.message || "Failed to save theme.");
    } finally {
      setSavingTheme(false);
    }
  };

  const handleEditTheme = (t: PptMasterTheme) => {
    setThemeForm({
      id: t.id,
      name: t.name,
      tagline: t.tagline || "",
      badge: t.badge || "CUSTOM",
      primaryColor: t.primary_color.startsWith("#") ? t.primary_color : `#${t.primary_color}`,
      accentColor: t.accent_color.startsWith("#") ? t.accent_color : `#${t.accent_color}`,
      cardBg: t.card_bg.startsWith("#") ? t.card_bg : `#${t.card_bg}`,
      textColor: t.text_color.startsWith("#") ? t.text_color : `#${t.text_color}`,
      isDark: Boolean(t.is_dark),
    });
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const handleDeleteTheme = async (id: string, name: string) => {
    if (!window.confirm(`Are you sure you want to delete the theme "${name}"?`)) return;
    try {
      await pptMasterApi.deleteTheme(id);
      showNotification("success", `Theme "${name}" removed.`);
      loadAll();
    } catch (err: any) {
      console.error(err);
      showNotification("error", "Failed to delete theme.");
    }
  };

  // Cover Slide Handlers
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setCoverFile(file);
      const url = URL.createObjectURL(file);
      setCoverPreviewUrl(url);
    }
  };

  const handleCoverSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!coverFile) {
      showNotification("error", "Please select a cover slide image (16:9 landscape recommended).");
      return;
    }
    if (!coverForm.title.trim()) {
      showNotification("error", "Please provide a title for the cover template.");
      return;
    }

    try {
      setUploadingCover(true);
      const formData = new FormData();
      formData.append("image", coverFile);
      formData.append("title", coverForm.title.trim());
      formData.append("description", coverForm.description.trim());
      formData.append("overlayText", coverForm.overlayText ? "1" : "0");
      formData.append("textTheme", coverForm.textTheme);

      await pptMasterApi.createFrontPage(formData);
      showNotification("success", `Front page "${coverForm.title}" uploaded successfully.`);

      // Reset
      setCoverForm({
        title: "",
        description: "",
        overlayText: true,
        textTheme: "light",
      });
      setCoverFile(null);
      setCoverPreviewUrl("");
      if (fileInputRef.current) fileInputRef.current.value = "";
      loadAll();
    } catch (err: any) {
      console.error(err);
      showNotification("error", err?.response?.data?.message || "Failed to upload front page.");
    } finally {
      setUploadingCover(false);
    }
  };

  const handleDeleteCover = async (id: string, title: string) => {
    if (!window.confirm(`Are you sure you want to remove the cover template "${title}"?`)) return;
    try {
      await pptMasterApi.deleteFrontPage(id);
      showNotification("success", `Cover template "${title}" deleted.`);
      loadAll();
    } catch (err: any) {
      console.error(err);
      showNotification("error", "Failed to delete cover template.");
    }
  };

  return (
    <div style={{ padding: "32px 40px", maxWidth: 1380, margin: "0 auto", fontFamily: "Plus Jakarta Sans, Inter, sans-serif" }}>
      {/* Breadcrumb & Header */}
      <div style={{ marginBottom: 28 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 8, fontSize: 13, color: "#64748b", marginBottom: 12 }}>
          <Link to="/admin/master-data" style={{ color: "#3b82f6", textDecoration: "none", fontWeight: 600 }}>Master Data</Link>
          <span>/</span>
          <span style={{ color: "#0f172a", fontWeight: 600 }}>PPT Themes & Front Pages</span>
        </div>

        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", flexWrap: "wrap", gap: 16 }}>
          <div>
            <h1 style={{ fontSize: 30, fontWeight: 800, color: "#0f172a", margin: "0 0 6px 0", letterSpacing: "-0.025em" }}>
              PPT Themes & Front Pages Master
            </h1>
            <p style={{ color: "#64748b", fontSize: 15, margin: 0, maxWidth: 700, lineHeight: 1.5 }}>
              Upload and customize presentation color themes and full-bleed front cover slide templates. These automatically appear in the Product Catalogue PowerPoint generator.
            </p>
          </div>

          <Link
            to="/admin/products"
            style={{
              display: "inline-flex",
              alignItems: "center",
              gap: 8,
              padding: "10px 18px",
              background: "#0f172a",
              color: "#ffffff",
              borderRadius: 10,
              fontSize: 13,
              fontWeight: 700,
              textDecoration: "none",
              boxShadow: "0 4px 12px rgba(15, 23, 42, 0.15)",
              transition: "all 0.15s ease",
            }}
          >
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M6 2L3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4z"/>
              <line x1="3" y1="6" x2="21" y2="6"/>
              <path d="M16 10a4 4 0 0 1-8 0"/>
            </svg>
            Test in Product Catalogue &rarr;
          </Link>
        </div>
      </div>

      {/* Feedback Toast */}
      {feedback && (
        <div
          style={{
            marginBottom: 24,
            padding: "14px 20px",
            borderRadius: 12,
            fontSize: 14,
            fontWeight: 600,
            display: "flex",
            alignItems: "center",
            gap: 12,
            background: feedback.type === "success" ? "#ecfdf5" : "#fef2f2",
            color: feedback.type === "success" ? "#065f46" : "#991b1b",
            border: `1px solid ${feedback.type === "success" ? "#a7f3d0" : "#fecaca"}`,
            boxShadow: "0 4px 12px rgba(0,0,0,0.05)",
          }}
        >
          {feedback.type === "success" ? (
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><polyline points="20 6 9 17 4 12"/></svg>
          ) : (
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg>
          )}
          <span>{feedback.message}</span>
        </div>
      )}

      {/* Tabs Switcher */}
      <div style={{ display: "flex", gap: 10, borderBottom: "1px solid #e2e8f0", marginBottom: 32 }}>
        <button
          onClick={() => setActiveTab("themes")}
          style={{
            display: "flex",
            alignItems: "center",
            gap: 10,
            padding: "14px 22px",
            fontSize: 14,
            fontWeight: 700,
            background: "none",
            border: "none",
            borderBottom: activeTab === "themes" ? "3px solid #2563eb" : "3px solid transparent",
            color: activeTab === "themes" ? "#2563eb" : "#64748b",
            cursor: "pointer",
            transition: "all 0.15s ease",
          }}
        >
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <circle cx="13.5" cy="6.5" r=".5"/>
            <circle cx="17.5" cy="10.5" r=".5"/>
            <circle cx="8.5" cy="7.5" r=".5"/>
            <circle cx="6.5" cy="12.5" r=".5"/>
            <path d="M12 2C6.5 2 2 6.5 2 12s4.5 10 10 10c.926 0 1.648-.746 1.648-1.688 0-.437-.18-.835-.437-1.125-.29-.289-.438-.652-.438-1.125a1.64 1.64 0 0 1 1.668-1.668h1.996c3.051 0 5.563-2.512 5.563-5.563C22 6.5 17.5 2 12 2z"/>
          </svg>
          PPT Presentation Themes
          <span style={{
            fontSize: 11,
            padding: "2px 8px",
            borderRadius: 999,
            background: activeTab === "themes" ? "#dbeafe" : "#f1f5f9",
            color: activeTab === "themes" ? "#1e40af" : "#64748b",
            fontWeight: 800,
          }}>
            {themes.length + builtInThemes.length}
          </span>
        </button>

        <button
          onClick={() => setActiveTab("frontPages")}
          style={{
            display: "flex",
            alignItems: "center",
            gap: 10,
            padding: "14px 22px",
            fontSize: 14,
            fontWeight: 700,
            background: "none",
            border: "none",
            borderBottom: activeTab === "frontPages" ? "3px solid #2563eb" : "3px solid transparent",
            color: activeTab === "frontPages" ? "#2563eb" : "#64748b",
            cursor: "pointer",
            transition: "all 0.15s ease",
          }}
        >
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <rect x="3" y="3" width="18" height="18" rx="2" ry="2"/>
            <circle cx="8.5" cy="8.5" r="1.5"/>
            <polyline points="21 15 16 10 5 21"/>
          </svg>
          Front Pages & Cover Slides
          <span style={{
            fontSize: 11,
            padding: "2px 8px",
            borderRadius: 999,
            background: activeTab === "frontPages" ? "#dbeafe" : "#f1f5f9",
            color: activeTab === "frontPages" ? "#1e40af" : "#64748b",
            fontWeight: 800,
          }}>
            {frontPages.length}
          </span>
        </button>
      </div>

      {loading ? (
        <div style={{ textAlign: "center", padding: "80px 20px", color: "#64748b" }}>
          <div style={{
            width: 38,
            height: 38,
            border: "3px solid #e2e8f0",
            borderTopColor: "#2563eb",
            borderRadius: "50%",
            margin: "0 auto 16px",
            animation: "spin 0.8s linear infinite"
          }} />
          <div style={{ fontWeight: 600 }}>Loading Master Data...</div>
        </div>
      ) : activeTab === "themes" ? (
        /* ========================================================================= */
        /* TAB 1: PPT THEMES                                                         */
        /* ========================================================================= */
        <div style={{ display: "grid", gridTemplateColumns: "440px 1fr", gap: 32, alignItems: "start" }}>
          {/* Form Card */}
          <div style={{
            background: "#ffffff",
            border: "1px solid #e2e8f0",
            borderRadius: 16,
            padding: 26,
            boxShadow: "0 4px 16px -2px rgba(15, 23, 42, 0.05)",
            position: "sticky",
            top: 24,
          }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 20 }}>
              <h2 style={{ fontSize: 18, fontWeight: 800, color: "#0f172a", margin: 0 }}>
                {themeForm.id ? "Edit Presentation Theme" : "Create Master Theme"}
              </h2>
              {themeForm.id && (
                <button
                  type="button"
                  onClick={() => setThemeForm({
                    id: "",
                    name: "",
                    tagline: "",
                    badge: "CUSTOM",
                    primaryColor: "#0f172a",
                    accentColor: "#d97706",
                    cardBg: "#1e293b",
                    textColor: "#ffffff",
                    isDark: true,
                  })}
                  style={{ fontSize: 12, color: "#64748b", background: "none", border: "none", cursor: "pointer", textDecoration: "underline" }}
                >
                  Clear (New)
                </button>
              )}
            </div>

            <form onSubmit={handleThemeSubmit} style={{ display: "flex", flexDirection: "column", gap: 16 }}>
              <div>
                <label style={{ display: "block", fontSize: 12, fontWeight: 700, color: "#334155", marginBottom: 6, textTransform: "uppercase", letterSpacing: "0.04em" }}>
                  Theme Name *
                </label>
                <input
                  type="text"
                  placeholder="e.g. Royal Emerald, Terracotta Warmth"
                  value={themeForm.name}
                  onChange={(e) => setThemeForm({ ...themeForm, name: e.target.value })}
                  style={{
                    width: "100%",
                    padding: "10px 14px",
                    border: "1px solid #cbd5e1",
                    borderRadius: 8,
                    fontSize: 14,
                    color: "#0f172a",
                    outline: "none",
                    boxSizing: "border-box",
                  }}
                  required
                />
              </div>

              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
                <div>
                  <label style={{ display: "block", fontSize: 12, fontWeight: 700, color: "#334155", marginBottom: 6, textTransform: "uppercase", letterSpacing: "0.04em" }}>
                    Badge Tag
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. LUXURY, BESPOKE"
                    value={themeForm.badge}
                    onChange={(e) => setThemeForm({ ...themeForm, badge: e.target.value })}
                    style={{
                      width: "100%",
                      padding: "10px 14px",
                      border: "1px solid #cbd5e1",
                      borderRadius: 8,
                      fontSize: 13,
                      boxSizing: "border-box",
                    }}
                  />
                </div>

                <div>
                  <label style={{ display: "block", fontSize: 12, fontWeight: 700, color: "#334155", marginBottom: 6, textTransform: "uppercase", letterSpacing: "0.04em" }}>
                    Visual Tone
                  </label>
                  <div style={{ display: "flex", gap: 8 }}>
                    <button
                      type="button"
                      onClick={() => setThemeForm({ ...themeForm, isDark: true, textColor: "#ffffff", cardBg: "#1e293b", primaryColor: "#0f172a" })}
                      style={{
                        flex: 1,
                        padding: "9px 10px",
                        borderRadius: 8,
                        fontSize: 12,
                        fontWeight: 700,
                        border: themeForm.isDark ? "2px solid #0f172a" : "1px solid #e2e8f0",
                        background: themeForm.isDark ? "#0f172a" : "#ffffff",
                        color: themeForm.isDark ? "#ffffff" : "#475569",
                        cursor: "pointer",
                      }}
                    >
                      Dark
                    </button>
                    <button
                      type="button"
                      onClick={() => setThemeForm({ ...themeForm, isDark: false, textColor: "#0f172a", cardBg: "#ffffff", primaryColor: "#f8fafc" })}
                      style={{
                        flex: 1,
                        padding: "9px 10px",
                        borderRadius: 8,
                        fontSize: 12,
                        fontWeight: 700,
                        border: !themeForm.isDark ? "2px solid #2563eb" : "1px solid #e2e8f0",
                        background: !themeForm.isDark ? "#eff6ff" : "#ffffff",
                        color: !themeForm.isDark ? "#1d4ed8" : "#475569",
                        cursor: "pointer",
                      }}
                    >
                      Light
                    </button>
                  </div>
                </div>
              </div>

              <div>
                <label style={{ display: "block", fontSize: 12, fontWeight: 700, color: "#334155", marginBottom: 6, textTransform: "uppercase", letterSpacing: "0.04em" }}>
                  Tagline / Description
                </label>
                <input
                  type="text"
                  placeholder="e.g. Deep velvet styling for luxury buyer showcases"
                  value={themeForm.tagline}
                  onChange={(e) => setThemeForm({ ...themeForm, tagline: e.target.value })}
                  style={{
                    width: "100%",
                    padding: "10px 14px",
                    border: "1px solid #cbd5e1",
                    borderRadius: 8,
                    fontSize: 13,
                    boxSizing: "border-box",
                  }}
                />
              </div>

              {/* Color Pickers Grid */}
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12, marginTop: 4 }}>
                {/* Primary Color */}
                <div>
                  <label style={{ display: "block", fontSize: 11, fontWeight: 700, color: "#475569", marginBottom: 4 }}>
                    Slide Background
                  </label>
                  <div style={{ display: "flex", alignItems: "center", gap: 8, border: "1px solid #cbd5e1", borderRadius: 8, padding: "6px 8px" }}>
                    <input
                      type="color"
                      value={themeForm.primaryColor}
                      onChange={(e) => setThemeForm({ ...themeForm, primaryColor: e.target.value })}
                      style={{ width: 28, height: 28, border: "none", cursor: "pointer", background: "none", padding: 0 }}
                    />
                    <input
                      type="text"
                      value={themeForm.primaryColor}
                      onChange={(e) => setThemeForm({ ...themeForm, primaryColor: e.target.value })}
                      style={{ width: "100%", border: "none", outline: "none", fontSize: 12, fontFamily: "monospace", textTransform: "uppercase" }}
                    />
                  </div>
                </div>

                {/* Accent Color */}
                <div>
                  <label style={{ display: "block", fontSize: 11, fontWeight: 700, color: "#475569", marginBottom: 4 }}>
                    Brand Accent
                  </label>
                  <div style={{ display: "flex", alignItems: "center", gap: 8, border: "1px solid #cbd5e1", borderRadius: 8, padding: "6px 8px" }}>
                    <input
                      type="color"
                      value={themeForm.accentColor}
                      onChange={(e) => setThemeForm({ ...themeForm, accentColor: e.target.value })}
                      style={{ width: 28, height: 28, border: "none", cursor: "pointer", background: "none", padding: 0 }}
                    />
                    <input
                      type="text"
                      value={themeForm.accentColor}
                      onChange={(e) => setThemeForm({ ...themeForm, accentColor: e.target.value })}
                      style={{ width: "100%", border: "none", outline: "none", fontSize: 12, fontFamily: "monospace", textTransform: "uppercase" }}
                    />
                  </div>
                </div>

                {/* Card Background */}
                <div>
                  <label style={{ display: "block", fontSize: 11, fontWeight: 700, color: "#475569", marginBottom: 4 }}>
                    Card Surface
                  </label>
                  <div style={{ display: "flex", alignItems: "center", gap: 8, border: "1px solid #cbd5e1", borderRadius: 8, padding: "6px 8px" }}>
                    <input
                      type="color"
                      value={themeForm.cardBg}
                      onChange={(e) => setThemeForm({ ...themeForm, cardBg: e.target.value })}
                      style={{ width: 28, height: 28, border: "none", cursor: "pointer", background: "none", padding: 0 }}
                    />
                    <input
                      type="text"
                      value={themeForm.cardBg}
                      onChange={(e) => setThemeForm({ ...themeForm, cardBg: e.target.value })}
                      style={{ width: "100%", border: "none", outline: "none", fontSize: 12, fontFamily: "monospace", textTransform: "uppercase" }}
                    />
                  </div>
                </div>

                {/* Text Color */}
                <div>
                  <label style={{ display: "block", fontSize: 11, fontWeight: 700, color: "#475569", marginBottom: 4 }}>
                    Body Text
                  </label>
                  <div style={{ display: "flex", alignItems: "center", gap: 8, border: "1px solid #cbd5e1", borderRadius: 8, padding: "6px 8px" }}>
                    <input
                      type="color"
                      value={themeForm.textColor}
                      onChange={(e) => setThemeForm({ ...themeForm, textColor: e.target.value })}
                      style={{ width: 28, height: 28, border: "none", cursor: "pointer", background: "none", padding: 0 }}
                    />
                    <input
                      type="text"
                      value={themeForm.textColor}
                      onChange={(e) => setThemeForm({ ...themeForm, textColor: e.target.value })}
                      style={{ width: "100%", border: "none", outline: "none", fontSize: 12, fontFamily: "monospace", textTransform: "uppercase" }}
                    />
                  </div>
                </div>
              </div>

              {/* Live Preview Widget */}
              <div style={{ marginTop: 8 }}>
                <div style={{ fontSize: 11, fontWeight: 700, color: "#64748b", marginBottom: 8, textTransform: "uppercase", letterSpacing: "0.04em" }}>
                  Live PPT Slide Preview
                </div>
                <div
                  style={{
                    borderRadius: 12,
                    padding: 16,
                    background: themeForm.primaryColor,
                    color: themeForm.textColor,
                    border: "1px solid rgba(0,0,0,0.1)",
                    boxShadow: "inset 0 2px 4px rgba(0,0,0,0.06)",
                    transition: "all 0.2s ease",
                  }}
                >
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 12 }}>
                    <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                      <span style={{ width: 8, height: 8, borderRadius: "50%", background: themeForm.accentColor }} />
                      <span style={{ fontSize: 12, fontWeight: 800, letterSpacing: "0.06em", color: themeForm.textColor }}>
                        {themeForm.name || "THEME TITLE"}
                      </span>
                    </div>
                    <span
                      style={{
                        fontSize: 9,
                        fontWeight: 800,
                        padding: "2px 6px",
                        borderRadius: 4,
                        background: themeForm.accentColor,
                        color: "#ffffff",
                        letterSpacing: "0.06em",
                      }}
                    >
                      {themeForm.badge || "BADGE"}
                    </span>
                  </div>

                  <div
                    style={{
                      background: themeForm.cardBg,
                      borderRadius: 8,
                      padding: 12,
                      border: `1px solid ${themeForm.accentColor}33`,
                      display: "flex",
                      alignItems: "center",
                      gap: 12,
                    }}
                  >
                    <div style={{ width: 44, height: 44, borderRadius: 6, background: `${themeForm.accentColor}22`, display: "flex", alignItems: "center", justifyContent: "center", color: themeForm.accentColor }}>
                      <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="3" y="3" width="18" height="18" rx="2"/><circle cx="8.5" cy="8.5" r="1.5"/><polyline points="21 15 16 10 5 21"/></svg>
                    </div>
                    <div>
                      <div style={{ fontSize: 11, fontWeight: 700, color: themeForm.textColor }}>Sample Furniture Item</div>
                      <div style={{ fontSize: 10, color: themeForm.accentColor, fontWeight: 600 }}>SKU: ART-2026-X</div>
                      <div style={{ fontSize: 9, opacity: 0.7, marginTop: 2 }}>{themeForm.tagline || "Presentation preview card"}</div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Submit Button */}
              <button
                type="submit"
                disabled={savingTheme}
                style={{
                  marginTop: 6,
                  padding: "12px",
                  borderRadius: 10,
                  fontSize: 14,
                  fontWeight: 700,
                  background: "#2563eb",
                  color: "#ffffff",
                  border: "none",
                  cursor: "pointer",
                  boxShadow: "0 4px 12px rgba(37, 99, 235, 0.25)",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  gap: 8,
                  opacity: savingTheme ? 0.7 : 1,
                }}
              >
                {savingTheme ? "Saving Theme..." : themeForm.id ? "Update Presentation Theme" : "Save Presentation Theme"}
              </button>
            </form>
          </div>

          {/* Themes Grid List */}
          <div>
            <div style={{ marginBottom: 16, display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <h2 style={{ fontSize: 18, fontWeight: 800, color: "#0f172a", margin: 0 }}>
                Active Presentation Themes ({themes.length + builtInThemes.length})
              </h2>
              <span style={{ fontSize: 13, color: "#64748b" }}>
                Built-in: {builtInThemes.length} | Custom: {themes.length}
              </span>
            </div>

            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(320px, 1fr))", gap: 20 }}>
              {/* Built-ins */}
              {builtInThemes.map((bt) => (
                <div
                  key={bt.id}
                  style={{
                    background: "#ffffff",
                    border: "1px solid #e2e8f0",
                    borderRadius: 14,
                    padding: 20,
                    boxShadow: "0 2px 8px rgba(0,0,0,0.04)",
                    position: "relative",
                  }}
                >
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 12 }}>
                    <span style={{ fontSize: 10, fontWeight: 800, padding: "3px 8px", borderRadius: 999, background: "#f1f5f9", color: "#475569" }}>
                      SYSTEM BUILT-IN
                    </span>
                    <span style={{ fontSize: 10, fontWeight: 800, padding: "3px 8px", borderRadius: 6, background: `#${bt.accent_color}`, color: "#ffffff" }}>
                      {bt.badge}
                    </span>
                  </div>

                  <h3 style={{ fontSize: 16, fontWeight: 800, color: "#0f172a", margin: "0 0 4px 0" }}>{bt.name}</h3>
                  <p style={{ fontSize: 12, color: "#64748b", margin: "0 0 16px 0", lineHeight: 1.4 }}>{bt.tagline}</p>

                  <div style={{ display: "flex", gap: 8, alignItems: "center", marginBottom: 16 }}>
                    <div title="Slide Background" style={{ width: 28, height: 28, borderRadius: 6, background: `#${bt.primary_color}`, border: "1px solid #cbd5e1" }} />
                    <div title="Card Surface" style={{ width: 28, height: 28, borderRadius: 6, background: `#${bt.card_bg}`, border: "1px solid #cbd5e1" }} />
                    <div title="Brand Accent" style={{ width: 28, height: 28, borderRadius: 6, background: `#${bt.accent_color}`, border: "1px solid #cbd5e1" }} />
                    <div title="Text Tone" style={{ width: 28, height: 28, borderRadius: 6, background: `#${bt.text_color}`, border: "1px solid #cbd5e1" }} />
                    <span style={{ fontSize: 11, color: "#94a3b8", marginLeft: "auto", fontWeight: 600 }}>Default Global</span>
                  </div>

                  <div style={{ fontSize: 11, color: "#059669", fontWeight: 700, display: "flex", alignItems: "center", gap: 4 }}>
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><polyline points="20 6 9 17 4 12"/></svg>
                    Always Available in Product Catalogue
                  </div>
                </div>
              ))}

              {/* Custom Master Themes */}
              {themes.map((t) => (
                <div
                  key={t.id}
                  style={{
                    background: "#ffffff",
                    border: "1px solid #e2e8f0",
                    borderRadius: 14,
                    padding: 20,
                    boxShadow: "0 2px 8px rgba(0,0,0,0.04)",
                    position: "relative",
                    transition: "transform 0.15s ease",
                  }}
                >
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 12 }}>
                    <span style={{ fontSize: 10, fontWeight: 800, padding: "3px 8px", borderRadius: 999, background: "#ecfdf5", color: "#065f46" }}>
                      CUSTOM MASTER
                    </span>
                    <span
                      style={{
                        fontSize: 10,
                        fontWeight: 800,
                        padding: "3px 8px",
                        borderRadius: 6,
                        background: t.accent_color.startsWith("#") ? t.accent_color : `#${t.accent_color}`,
                        color: "#ffffff",
                      }}
                    >
                      {t.badge || "CUSTOM"}
                    </span>
                  </div>

                  <h3 style={{ fontSize: 16, fontWeight: 800, color: "#0f172a", margin: "0 0 4px 0" }}>{t.name}</h3>
                  <p style={{ fontSize: 12, color: "#64748b", margin: "0 0 16px 0", lineHeight: 1.4 }}>{t.tagline || "No description provided."}</p>

                  <div style={{ display: "flex", gap: 8, alignItems: "center", marginBottom: 16 }}>
                    <div title="Slide Background" style={{ width: 28, height: 28, borderRadius: 6, background: t.primary_color.startsWith("#") ? t.primary_color : `#${t.primary_color}`, border: "1px solid #cbd5e1" }} />
                    <div title="Card Surface" style={{ width: 28, height: 28, borderRadius: 6, background: t.card_bg.startsWith("#") ? t.card_bg : `#${t.card_bg}`, border: "1px solid #cbd5e1" }} />
                    <div title="Brand Accent" style={{ width: 28, height: 28, borderRadius: 6, background: t.accent_color.startsWith("#") ? t.accent_color : `#${t.accent_color}`, border: "1px solid #cbd5e1" }} />
                    <div title="Text Tone" style={{ width: 28, height: 28, borderRadius: 6, background: t.text_color.startsWith("#") ? t.text_color : `#${t.text_color}`, border: "1px solid #cbd5e1" }} />
                    <span style={{ fontSize: 11, color: "#475569", marginLeft: "auto", fontWeight: 700 }}>
                      {t.is_dark ? "Dark Theme" : "Light Theme"}
                    </span>
                  </div>

                  <div style={{ display: "flex", gap: 10, borderTop: "1px solid #f1f5f9", paddingTop: 14 }}>
                    <button
                      onClick={() => handleEditTheme(t)}
                      style={{
                        flex: 1,
                        padding: "8px",
                        borderRadius: 8,
                        fontSize: 12,
                        fontWeight: 700,
                        background: "#f8fafc",
                        color: "#2563eb",
                        border: "1px solid #e2e8f0",
                        cursor: "pointer",
                      }}
                    >
                      Edit Theme
                    </button>
                    <button
                      onClick={() => handleDeleteTheme(t.id, t.name)}
                      style={{
                        padding: "8px 14px",
                        borderRadius: 8,
                        fontSize: 12,
                        fontWeight: 700,
                        background: "#fff1f2",
                        color: "#e11d48",
                        border: "1px solid #ffe4e6",
                        cursor: "pointer",
                      }}
                    >
                      Delete
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      ) : (
        /* ========================================================================= */
        /* TAB 2: FRONT PAGES / COVER SLIDES                                         */
        /* ========================================================================= */
        <div style={{ display: "grid", gridTemplateColumns: "440px 1fr", gap: 32, alignItems: "start" }}>
          {/* Upload Card */}
          <div style={{
            background: "#ffffff",
            border: "1px solid #e2e8f0",
            borderRadius: 16,
            padding: 26,
            boxShadow: "0 4px 16px -2px rgba(15, 23, 42, 0.05)",
            position: "sticky",
            top: 24,
          }}>
            <h2 style={{ fontSize: 18, fontWeight: 800, color: "#0f172a", margin: "0 0 6px 0" }}>
              Upload Front Page Template
            </h2>
            <p style={{ fontSize: 13, color: "#64748b", margin: "0 0 20px 0", lineHeight: 1.4 }}>
              Upload a high-resolution front cover graphic for PowerPoint slide 1. Recommended ratio: 16:9 widescreen (1920x1080 or 1280x720).
            </p>

            <form onSubmit={handleCoverSubmit} style={{ display: "flex", flexDirection: "column", gap: 16 }}>
              <div>
                <label style={{ display: "block", fontSize: 12, fontWeight: 700, color: "#334155", marginBottom: 6, textTransform: "uppercase", letterSpacing: "0.04em" }}>
                  Template Title *
                </label>
                <input
                  type="text"
                  placeholder="e.g. Modern Teakwood Studio Cover"
                  value={coverForm.title}
                  onChange={(e) => setCoverForm({ ...coverForm, title: e.target.value })}
                  style={{
                    width: "100%",
                    padding: "10px 14px",
                    border: "1px solid #cbd5e1",
                    borderRadius: 8,
                    fontSize: 14,
                    color: "#0f172a",
                    boxSizing: "border-box",
                  }}
                  required
                />
              </div>

              <div>
                <label style={{ display: "block", fontSize: 12, fontWeight: 700, color: "#334155", marginBottom: 6, textTransform: "uppercase", letterSpacing: "0.04em" }}>
                  Description / Buyer Context
                </label>
                <input
                  type="text"
                  placeholder="e.g. Minimalist architectural cover for US & EU collections"
                  value={coverForm.description}
                  onChange={(e) => setCoverForm({ ...coverForm, description: e.target.value })}
                  style={{
                    width: "100%",
                    padding: "10px 14px",
                    border: "1px solid #cbd5e1",
                    borderRadius: 8,
                    fontSize: 13,
                    boxSizing: "border-box",
                  }}
                />
              </div>

              {/* File Input & Live Preview */}
              <div>
                <label style={{ display: "block", fontSize: 12, fontWeight: 700, color: "#334155", marginBottom: 6, textTransform: "uppercase", letterSpacing: "0.04em" }}>
                  Cover Image File * (PNG / JPG / WEBP)
                </label>
                <input
                  type="file"
                  accept="image/png, image/jpeg, image/webp"
                  ref={fileInputRef}
                  onChange={handleFileChange}
                  style={{ display: "none" }}
                  id="cover-file-upload"
                />
                <label
                  htmlFor="cover-file-upload"
                  style={{
                    display: "flex",
                    flexDirection: "column",
                    alignItems: "center",
                    justifyContent: "center",
                    border: "2px dashed #cbd5e1",
                    borderRadius: 12,
                    padding: coverPreviewUrl ? 8 : 28,
                    cursor: "pointer",
                    background: "#f8fafc",
                    transition: "all 0.15s ease",
                  }}
                >
                  {coverPreviewUrl ? (
                    <div style={{ width: "100%", position: "relative" }}>
                      <img
                        src={coverPreviewUrl}
                        alt="Preview"
                        style={{ width: "100%", aspectRatio: "16/9", objectFit: "cover", borderRadius: 8, display: "block" }}
                      />
                      <div style={{
                        position: "absolute",
                        bottom: 8,
                        right: 8,
                        background: "rgba(15, 23, 42, 0.8)",
                        color: "#fff",
                        padding: "4px 8px",
                        borderRadius: 6,
                        fontSize: 11,
                        fontWeight: 700,
                      }}>
                        Change Image
                      </div>
                    </div>
                  ) : (
                    <>
                      <div style={{ width: 44, height: 44, borderRadius: 10, background: "#e2e8f0", display: "flex", alignItems: "center", justifyContent: "center", marginBottom: 10, color: "#475569" }}>
                        <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="17 8 12 3 7 8"/><line x1="12" y1="3" x2="12" y2="15"/></svg>
                      </div>
                      <div style={{ fontSize: 13, fontWeight: 700, color: "#0f172a" }}>Click to select Cover Image</div>
                      <div style={{ fontSize: 11, color: "#64748b", marginTop: 4 }}>16:9 widescreen recommended (Max 30MB)</div>
                    </>
                  )}
                </label>
              </div>

              {/* Cover Slide Text Settings */}
              <div style={{ background: "#f8fafc", borderRadius: 10, padding: 14, border: "1px solid #e2e8f0" }}>
                <div style={{ fontSize: 12, fontWeight: 800, color: "#0f172a", marginBottom: 10, textTransform: "uppercase", letterSpacing: "0.04em" }}>
                  Slide 1 Overlay Options
                </div>

                <label style={{ display: "flex", alignItems: "center", gap: 10, cursor: "pointer", marginBottom: 12 }}>
                  <input
                    type="checkbox"
                    checked={coverForm.overlayText}
                    onChange={(e) => setCoverForm({ ...coverForm, overlayText: e.target.checked })}
                    style={{ width: 16, height: 16, accentColor: "#2563eb", cursor: "pointer" }}
                  />
                  <span style={{ fontSize: 13, fontWeight: 600, color: "#334155" }}>
                    Overlay Catalogue Title & Buyer Details
                  </span>
                </label>
                <div style={{ fontSize: 11, color: "#64748b", margin: "-8px 0 12px 26px" }}>
                  {coverForm.overlayText
                    ? "Exporter prints title, buyer name, and date on top of your background."
                    : "No text overlay. Uses purely your uploaded image artwork as the full cover."}
                </div>

                {coverForm.overlayText && (
                  <div>
                    <label style={{ display: "block", fontSize: 11, fontWeight: 700, color: "#475569", marginBottom: 6 }}>
                      Overlay Text Tone
                    </label>
                    <div style={{ display: "flex", gap: 8 }}>
                      <button
                        type="button"
                        onClick={() => setCoverForm({ ...coverForm, textTheme: "light" })}
                        style={{
                          flex: 1,
                          padding: "8px",
                          borderRadius: 6,
                          fontSize: 12,
                          fontWeight: 700,
                          border: coverForm.textTheme === "light" ? "2px solid #0f172a" : "1px solid #cbd5e1",
                          background: coverForm.textTheme === "light" ? "#0f172a" : "#ffffff",
                          color: coverForm.textTheme === "light" ? "#ffffff" : "#475569",
                          cursor: "pointer",
                        }}
                      >
                        White / Light Text (For Dark Images)
                      </button>
                      <button
                        type="button"
                        onClick={() => setCoverForm({ ...coverForm, textTheme: "dark" })}
                        style={{
                          flex: 1,
                          padding: "8px",
                          borderRadius: 6,
                          fontSize: 12,
                          fontWeight: 700,
                          border: coverForm.textTheme === "dark" ? "2px solid #2563eb" : "1px solid #cbd5e1",
                          background: coverForm.textTheme === "dark" ? "#eff6ff" : "#ffffff",
                          color: coverForm.textTheme === "dark" ? "#1e40af" : "#475569",
                          cursor: "pointer",
                        }}
                      >
                        Slate / Dark Text (For Bright Images)
                      </button>
                    </div>
                  </div>
                )}
              </div>

              {/* Submit Upload */}
              <button
                type="submit"
                disabled={uploadingCover}
                style={{
                  marginTop: 6,
                  padding: "12px",
                  borderRadius: 10,
                  fontSize: 14,
                  fontWeight: 700,
                  background: "#2563eb",
                  color: "#ffffff",
                  border: "none",
                  cursor: "pointer",
                  boxShadow: "0 4px 12px rgba(37, 99, 235, 0.25)",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  gap: 8,
                  opacity: uploadingCover ? 0.7 : 1,
                }}
              >
                {uploadingCover ? (
                  <>
                    <div style={{ width: 16, height: 16, border: "2px solid #fff", borderTopColor: "transparent", borderRadius: "50%", animation: "spin 0.8s linear infinite" }} />
                    Uploading Cover Template...
                  </>
                ) : (
                  <>
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="17 8 12 3 7 8"/><line x1="12" y1="3" x2="12" y2="15"/></svg>
                    Upload Cover Slide Template
                  </>
                )}
              </button>
            </form>
          </div>

          {/* Front Page Gallery */}
          <div>
            <div style={{ marginBottom: 16, display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <h2 style={{ fontSize: 18, fontWeight: 800, color: "#0f172a", margin: 0 }}>
                Front Page Templates ({frontPages.length})
              </h2>
              <span style={{ fontSize: 13, color: "#64748b" }}>
                Selectable from the Product Catalogue "Front Page" dropdown
              </span>
            </div>

            {frontPages.length === 0 ? (
              <div style={{
                background: "#ffffff",
                border: "2px dashed #e2e8f0",
                borderRadius: 16,
                padding: "60px 24px",
                textAlign: "center",
                color: "#64748b",
              }}>
                <div style={{ width: 52, height: 52, borderRadius: 14, background: "#f1f5f9", display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto 16px", color: "#94a3b8" }}>
                  <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8"><rect x="3" y="3" width="18" height="18" rx="2" ry="2"/><circle cx="8.5" cy="8.5" r="1.5"/><polyline points="21 15 16 10 5 21"/></svg>
                </div>
                <h3 style={{ fontSize: 16, fontWeight: 800, color: "#1e293b", margin: "0 0 6px 0" }}>No custom front pages uploaded yet</h3>
                <p style={{ fontSize: 13, margin: 0, maxWidth: 440, marginLeft: "auto", marginRight: "auto", lineHeight: 1.5 }}>
                  Upload your brand cover artwork, studio photography, or seasonal lookbook covers above to give buyers a customized first impression.
                </p>
              </div>
            ) : (
              <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(320px, 1fr))", gap: 24 }}>
                {frontPages.map((fp) => (
                  <div
                    key={fp.id}
                    style={{
                      background: "#ffffff",
                      border: "1px solid #e2e8f0",
                      borderRadius: 16,
                      overflow: "hidden",
                      boxShadow: "0 4px 12px rgba(15, 23, 42, 0.05)",
                      display: "flex",
                      flexDirection: "column",
                      transition: "all 0.2s ease",
                    }}
                  >
                    {/* Image Preview 16:9 */}
                    <div style={{ position: "relative", width: "100%", aspectRatio: "16/9", background: "#0f172a", overflow: "hidden" }}>
                      <img
                        src={fp.image_url}
                        alt={fp.title}
                        style={{ width: "100%", height: "100%", objectFit: "cover", display: "block" }}
                        onError={(e) => {
                          // fallback placeholder if image cannot be loaded
                          (e.target as HTMLImageElement).src = "https://placehold.co/1280x720/0f172a/ffffff?text=Cover+Slide";
                        }}
                      />

                      {/* Badges Overlay */}
                      <div style={{ position: "absolute", top: 10, left: 10, display: "flex", gap: 6 }}>
                        <span style={{
                          fontSize: 10,
                          fontWeight: 800,
                          padding: "3px 8px",
                          borderRadius: 6,
                          background: "rgba(15, 23, 42, 0.85)",
                          color: "#ffffff",
                          backdropFilter: "blur(4px)",
                        }}>
                          16:9 FULL BLEED
                        </span>
                        <span style={{
                          fontSize: 10,
                          fontWeight: 800,
                          padding: "3px 8px",
                          borderRadius: 6,
                          background: fp.overlay_text ? "#2563eb" : "#475569",
                          color: "#ffffff",
                          backdropFilter: "blur(4px)",
                        }}>
                          {fp.overlay_text ? `TEXT OVERLAY (${fp.text_theme.toUpperCase()})` : "ARTWORK ONLY"}
                        </span>
                      </div>
                    </div>

                    {/* Metadata */}
                    <div style={{ padding: 18, flex: 1, display: "flex", flexDirection: "column" }}>
                      <h3 style={{ fontSize: 16, fontWeight: 800, color: "#0f172a", margin: "0 0 6px 0" }}>
                        {fp.title}
                      </h3>
                      <p style={{ fontSize: 12, color: "#64748b", margin: "0 0 16px 0", flex: 1, lineHeight: 1.4 }}>
                        {fp.description || "Custom cover template for presentation exports."}
                      </p>

                      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", borderTop: "1px solid #f1f5f9", paddingTop: 14 }}>
                        <a
                          href={fp.image_url}
                          target="_blank"
                          rel="noreferrer"
                          style={{
                            fontSize: 12,
                            fontWeight: 700,
                            color: "#3b82f6",
                            textDecoration: "none",
                            display: "inline-flex",
                            alignItems: "center",
                            gap: 4,
                          }}
                        >
                          View Full Size <span>&nearr;</span>
                        </a>

                        <button
                          onClick={() => handleDeleteCover(fp.id, fp.title)}
                          style={{
                            padding: "6px 12px",
                            borderRadius: 6,
                            fontSize: 12,
                            fontWeight: 700,
                            background: "#fff1f2",
                            color: "#e11d48",
                            border: "1px solid #ffe4e6",
                            cursor: "pointer",
                          }}
                        >
                          Delete
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
