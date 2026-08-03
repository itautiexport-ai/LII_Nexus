import React from "react";

export default function SecurityPage() {
  return (
    <div style={{ padding: "24px", color: "#f8fafc", backgroundColor: "#0f172a", minHeight: "100vh" }}>
      <div style={{ marginBottom: "24px" }}>
        <h1 style={{ fontSize: "1.75rem", fontWeight: "700", margin: "0 0 6px 0", color: "#ffffff" }}>
          HR Security Sub-Module
        </h1>
        <p style={{ fontSize: "0.9rem", color: "#94a3b8", margin: 0 }}>
          Dedicated Security sub-module under HR Module.
        </p>
      </div>

      <div
        style={{
          background: "#1e293b",
          borderRadius: "12px",
          padding: "32px",
          border: "1px dashed #334155",
          textAlign: "center",
          marginTop: "32px",
        }}
      >
        <div style={{ fontSize: "2.5rem", marginBottom: "12px" }}>🛡️</div>
        <h2 style={{ fontSize: "1.25rem", color: "#ffffff", marginBottom: "8px" }}>
          Security Sub-Module Ready
        </h2>
        <p style={{ color: "#94a3b8", fontSize: "0.9rem", maxWidth: "500px", margin: "0 auto 16px auto" }}>
          Please specify what forms, fields, tables, or workflows you want to add under this Security sub-module.
        </p>
      </div>
    </div>
  );
}
