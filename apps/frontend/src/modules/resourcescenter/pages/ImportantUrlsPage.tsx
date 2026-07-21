import { FormEvent, useEffect, useState } from "react";
import { urlApi, UrlRecord } from "../../urls/api/urlApi";

type Tab = "submit" | "list";

export default function ImportantUrlsPage() {
  const [tab, setTab] = useState<Tab>("submit");
  const [urls, setUrls] = useState<UrlRecord[]>([]);
  const [loading, setLoading] = useState(false);

  const [title, setTitle] = useState("");
  const [url, setUrl] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [submitSuccess, setSubmitSuccess] = useState(false);

  async function loadUrls() {
    setLoading(true);
    try {
      const data = await urlApi.list();
      setUrls(data);
    } catch (err) {
      console.error("Failed to load URLs:", err);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    if (tab === "list") loadUrls();
  }, [tab]);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setSubmitting(true);
    setSubmitError(null);
    setSubmitSuccess(false);

    try {
      await urlApi.create({ title, url });
      setSubmitSuccess(true);
      setTitle("");
      setUrl("");
    } catch (err: any) {
      console.error("Failed to submit URL:", err);
      setSubmitError(err.response?.data?.message || err.message || "Failed to submit URL");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div style={{ fontFamily: "-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif" }}>
      {/* ── Page Header ── */}
      <div style={{ marginBottom: 24 }}>
        <h1 style={{ fontSize: 22, fontWeight: 700, color: "#111827", margin: 0 }}>
          Important URLs
        </h1>
        <p style={{ fontSize: 13, color: "#6b7280", marginTop: 4 }}>
          Manage and share key organizational links and references.
        </p>
      </div>

      {/* ── Tabs ── */}
      <div style={{ display: "flex", borderBottom: "2px solid #e5e7eb", marginBottom: 28, gap: 0 }}>
        {(["submit", "list"] as Tab[]).map((t) => {
          const labels: Record<Tab, string> = { submit: "🔗 Submit URL", list: "📋 List of URLs" };
          const active = tab === t;
          return (
            <button
              key={t}
              onClick={() => setTab(t)}
              style={{
                padding: "10px 22px",
                border: "none",
                borderBottom: active ? "2px solid #3457d5" : "2px solid transparent",
                marginBottom: -2,
                background: "none",
                cursor: "pointer",
                fontSize: 13.5,
                fontWeight: active ? 700 : 500,
                color: active ? "#3457d5" : "#6b7280",
                transition: "color 0.15s, border-color 0.15s",
              }}
            >
              {labels[t]}
            </button>
          );
        })}
      </div>

      {/* ══════════════ TAB: Submit ══════════════ */}
      {tab === "submit" && (
        <div style={{ maxWidth: 560 }}>
          {submitSuccess && (
            <div style={{ background: "#d1fae5", border: "1px solid #6ee7b7", borderRadius: 8, padding: "12px 16px", marginBottom: 20, color: "#065f46", fontSize: 13.5, fontWeight: 500 }}>
              ✅ URL submitted successfully!{" "}
              <button
                onClick={() => { setSubmitSuccess(false); setTab("list"); }}
                style={{ background: "none", border: "none", color: "#059669", cursor: "pointer", fontWeight: 700, textDecoration: "underline", fontSize: 13 }}
              >
                View in list →
              </button>
            </div>
          )}

          <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: 16 }}>
            {/* Title */}
            <div>
              <label style={labelStyle}>Title <span style={{ color: "#ef4444" }}>*</span></label>
              <input
                required
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="e.g. Employee Portal"
                style={inputStyle}
              />
            </div>

            {/* URL */}
            <div>
              <label style={labelStyle}>URL <span style={{ color: "#ef4444" }}>*</span></label>
              <input
                required
                type="url"
                value={url}
                onChange={(e) => setUrl(e.target.value)}
                placeholder="https://example.com"
                style={inputStyle}
              />
            </div>

            {submitError && (
              <div style={{ background: "#fee2e2", border: "1px solid #fca5a5", borderRadius: 6, padding: "10px 14px", color: "#991b1b", fontSize: 13 }}>
                {submitError}
              </div>
            )}

            <button
              type="submit"
              disabled={submitting}
              style={{
                padding: "11px 28px",
                background: submitting ? "#93a3d8" : "#3457d5",
                color: "#fff",
                border: "none",
                borderRadius: 8,
                fontSize: 14,
                fontWeight: 600,
                cursor: submitting ? "not-allowed" : "pointer",
                alignSelf: "flex-start",
                transition: "background 0.15s",
              }}
            >
              {submitting ? "Submitting…" : "Submit URL"}
            </button>
          </form>
        </div>
      )}

      {/* ══════════════ TAB: List ══════════════ */}
      {tab === "list" && (
        <div>
          {loading ? (
            <div style={{ textAlign: "center", padding: "40px 0", color: "#9ca3af", fontSize: 14 }}>Loading URLs…</div>
          ) : urls.length === 0 ? (
            <div style={{ textAlign: "center", padding: "48px 0", color: "#9ca3af" }}>
              <div style={{ fontSize: 36, marginBottom: 12 }}>🔗</div>
              <div style={{ fontSize: 14 }}>No important URLs found.</div>
              <button
                onClick={() => setTab("submit")}
                style={{ marginTop: 12, padding: "8px 18px", background: "#3457d5", color: "#fff", border: "none", borderRadius: 7, cursor: "pointer", fontSize: 13, fontWeight: 600 }}
              >
                Submit your first URL
              </button>
            </div>
          ) : (
            <div style={{ overflowX: "auto", borderRadius: 10, border: "1px solid #e5e7eb" }}>
              <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 13.5 }}>
                <thead>
                  <tr style={{ background: "#f9fafb", borderBottom: "1px solid #e5e7eb" }}>
                    {["#", "Title", "URL", "Added On"].map((h) => (
                      <th key={h} style={{ padding: "11px 14px", textAlign: "left", fontWeight: 600, color: "#374151", fontSize: 12, textTransform: "uppercase", letterSpacing: "0.04em" }}>
                        {h}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {urls.map((u, i) => (
                    <tr
                      key={u.id}
                      style={{ borderBottom: "1px solid #f3f4f6", transition: "background 0.1s" }}
                      onMouseEnter={(e) => (e.currentTarget.style.background = "#f9fafb")}
                      onMouseLeave={(e) => (e.currentTarget.style.background = "")}
                    >
                      <td style={{ padding: "11px 14px", color: "#9ca3af" }}>{i + 1}</td>
                      <td style={{ padding: "11px 14px", fontWeight: 600, color: "#111827" }}>
                        {u.title}
                      </td>
                      <td style={{ padding: "11px 14px" }}>
                        <a href={u.url} target="_blank" rel="noreferrer" style={{ color: "#3457d5", textDecoration: "none" }}>
                          {u.url}
                        </a>
                      </td>
                      <td style={{ padding: "11px 14px", color: "#6b7280", fontSize: 12 }}>
                        {new Date(u.createdAt).toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" })}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

/* ── Shared styles ── */
const labelStyle: React.CSSProperties = {
  display: "block",
  fontSize: 13,
  fontWeight: 600,
  color: "#374151",
  marginBottom: 6,
};

const inputStyle: React.CSSProperties = {
  display: "block",
  width: "100%",
  padding: "9px 12px",
  border: "1px solid #d1d5db",
  borderRadius: 7,
  fontSize: 13.5,
  color: "#111827",
  background: "#fff",
  outline: "none",
  boxSizing: "border-box",
  transition: "border-color 0.15s",
};
