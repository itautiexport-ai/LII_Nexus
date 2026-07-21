import React, { useState, useEffect } from "react";
import { whatsappApi } from "../api/whatsappApi";

export default function WhatsAppIntegrationPage() {
  const [status, setStatus] = useState<"disconnected" | "qr" | "connected" | "authenticating" | "loading">("loading");
  const [qrCodeDataUrl, setQrCodeDataUrl] = useState<string | null>(null);

  const fetchStatus = async () => {
    try {
      const res = await whatsappApi.getStatus();
      setStatus(res.status);
      setQrCodeDataUrl(res.qrCodeDataUrl);
    } catch (err) {
      console.error(err);
      setStatus("disconnected");
    }
  };

  useEffect(() => {
    fetchStatus();
    // Poll every 3 seconds to catch QR updates or connection status
    const interval = setInterval(fetchStatus, 3000);
    return () => clearInterval(interval);
  }, []);

  const handleLogout = async () => {
    if (!window.confirm("Are you sure you want to disconnect WhatsApp?")) return;
    setStatus("loading");
    try {
      await whatsappApi.logout();
      await fetchStatus();
    } catch (err) {
      alert("Failed to disconnect");
    }
  };

  return (
    <div style={{ padding: 24, maxWidth: 800 }}>
      <div style={{ marginBottom: 24 }}>
        <h2 style={{ margin: 0, fontSize: 20, fontWeight: 600, color: "#1F2937" }}>WhatsApp Integration</h2>
        <p style={{ margin: "4px 0 0", color: "#6B7280", fontSize: 14 }}>Link a WhatsApp account to automatically send delegation notifications.</p>
      </div>

      <div style={{ background: "#fff", padding: 24, borderRadius: 8, boxShadow: "0 1px 3px rgba(0,0,0,0.1)", textAlign: "center" }}>
        {status === "loading" && <p style={{ color: "#6B7280" }}>Checking connection status...</p>}
        
        {status === "connected" && (
          <div>
            <div style={{ display: "inline-flex", alignItems: "center", justifyContent: "center", width: 64, height: 64, borderRadius: "50%", background: "#D1FAE5", color: "#059669", marginBottom: 16 }}>
              <svg width="32" height="32" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7"></path></svg>
            </div>
            <h3 style={{ margin: "0 0 8px", fontSize: 18, color: "#065F46" }}>WhatsApp is Connected!</h3>
            <p style={{ color: "#4B5563", fontSize: 14, marginBottom: 24 }}>Your server is successfully linked and can automatically send task notifications.</p>
            <button
              onClick={handleLogout}
              style={{ padding: "8px 16px", background: "#FEE2E2", color: "#DC2626", border: "1px solid #FCA5A5", borderRadius: 4, cursor: "pointer", fontWeight: 500 }}
            >
              Disconnect Session
            </button>
          </div>
        )}

        {status === "authenticating" && (
          <div>
            <p style={{ color: "#D97706", fontSize: 16, fontWeight: 500 }}>Authenticating session... Please wait.</p>
          </div>
        )}

        {status === "qr" && qrCodeDataUrl && (
          <div>
            <h3 style={{ margin: "0 0 16px", fontSize: 18, color: "#1F2937" }}>Link Your Account</h3>
            <p style={{ color: "#4B5563", fontSize: 14, marginBottom: 24 }}>Open WhatsApp on your phone, go to Linked Devices, and scan the QR code below.</p>
            <div style={{ display: "inline-block", padding: 16, border: "1px solid #E5E7EB", borderRadius: 8, background: "#F9FAFB" }}>
              <img src={qrCodeDataUrl} alt="WhatsApp QR Code" style={{ width: 256, height: 256 }} />
            </div>
            <p style={{ color: "#9CA3AF", fontSize: 12, marginTop: 16 }}>The QR code updates automatically. Waiting for scan...</p>
          </div>
        )}

        {(status === "disconnected" || (status === "qr" && !qrCodeDataUrl)) && (
          <div>
            <p style={{ color: "#DC2626", fontSize: 16, fontWeight: 500 }}>Disconnected</p>
            <p style={{ color: "#6B7280", fontSize: 14, marginBottom: 16 }}>The server is disconnected from WhatsApp. Waiting for QR code generation...</p>
          </div>
        )}
      </div>
    </div>
  );
}
