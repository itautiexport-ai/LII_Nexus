import React, { useState, useRef, useEffect } from "react";
import { AiHelperService, AiQueryResult } from "../../services/aiHelperService";

interface Message {
  id: string;
  sender: "user" | "ai";
  text: string;
  category?: string;
  suggestions?: string[];
  timestamp: Date;
}

const getWelcomeMessage = (): Message => ({
  id: `welcome-${Date.now()}`,
  sender: "ai",
  text: "Hi! 😊 I'm **Milo**, your LII Nexus AI Assistant. How can I help you today?",
  category: "general",
  timestamp: new Date()
});

export const AiHelperWidget: React.FC = () => {
  const [isOpen, setIsOpen] = useState<boolean>(false);
  const [inputPrompt, setInputPrompt] = useState<string>("");
  const [loading, setLoading] = useState<boolean>(false);
  const [messages, setMessages] = useState<Message[]>([getWelcomeMessage()]);

  // Voice Speech Recognition State
  const [isListening, setIsListening] = useState<boolean>(false);
  const [speechLang, setSpeechLang] = useState<string>("hi-IN"); // 'hi-IN' (Hindi/Hinglish) or 'en-IN' (English)
  const recognitionRef = useRef<any>(null);

  const messagesEndRef = useRef<HTMLDivElement>(null);

  const handleOpen = () => {
    if (messages.length === 0) {
      setMessages([getWelcomeMessage()]);
    }
    setIsOpen(true);
  };

  const toggleVoiceInput = () => {
    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (!SpeechRecognition) {
      alert("Voice speech recognition is not supported in this browser. Please use Chrome, Edge, or Safari.");
      return;
    }

    if (isListening) {
      setIsListening(false);
      if (recognitionRef.current) {
        recognitionRef.current.stop();
      }
      return;
    }

    try {
      const recognition = new SpeechRecognition();
      recognitionRef.current = recognition;
      recognition.continuous = false;
      recognition.interimResults = true;
      recognition.maxAlternatives = 1;
      recognition.lang = speechLang;

      let lastCapturedText = "";

      recognition.onstart = () => {
        setIsListening(true);
      };

      recognition.onresult = (event: any) => {
        let transcript = "";
        for (let i = 0; i < event.results.length; i++) {
          transcript += event.results[i][0].transcript;
        }
        if (transcript) {
          lastCapturedText = transcript;
          setInputPrompt(transcript);
        }
      };

      recognition.onerror = (event: any) => {
        console.error("Speech recognition error:", event.error);
        setIsListening(false);
      };

      recognition.onend = () => {
        setIsListening(false);
        // Auto-send query immediately after user finishes speaking
        if (lastCapturedText.trim()) {
          handleSend(lastCapturedText.trim());
        }
      };

      recognition.start();
    } catch (err) {
      console.error(err);
      setIsListening(false);
    }
  };

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    if (isOpen) {
      scrollToBottom();
    }
  }, [messages, isOpen]);

  const handleSend = async (textToSend?: string) => {
    const query = textToSend || inputPrompt.trim();
    if (!query || loading) return;

    const userMsg: Message = {
      id: `user-${Date.now()}`,
      sender: "user",
      text: query,
      timestamp: new Date()
    };

    setMessages((prev) => [...prev, userMsg]);
    if (!textToSend) setInputPrompt("");
    setLoading(true);

    try {
      const res: AiQueryResult = await AiHelperService.query(query);
      const aiMsg: Message = {
        id: `ai-${Date.now()}`,
        sender: "ai",
        text: res.answer,
        category: res.category,
        suggestions: res.suggestions,
        timestamp: new Date()
      };
      setMessages((prev) => [...prev, aiMsg]);
    } catch (err: any) {
      const errorMsg: Message = {
        id: `ai-err-${Date.now()}`,
        sender: "ai",
        text: `⚠️ Sorry, I encountered an issue processing your query: ${err?.response?.data?.error?.message || err.message || "Network error"}`,
        timestamp: new Date()
      };
      setMessages((prev) => [...prev, errorMsg]);
    } finally {
      setLoading(false);
    }
  };

  // Helper to format simple markdown text & tables into HTML
  const formatMarkdown = (text: string) => {
    if (!text) return "";
    
    // Split into lines for table parsing
    const lines = text.split("\n");
    let html = "";
    let inTable = false;
    let tableHeaders: string[] = [];

    lines.forEach((line) => {
      const trimmed = line.trim();
      
      // Table header or row detection
      if (trimmed.startsWith("|") && trimmed.endsWith("|")) {
        const cells = trimmed.split("|").filter((_, idx, arr) => idx > 0 && idx < arr.length - 1).map(c => c.trim());
        
        // Skip table separator line (e.g., | :--- | :--- |)
        if (cells.every(c => /^[:\-]+$/.test(c))) {
          return;
        }

        if (!inTable) {
          inTable = true;
          tableHeaders = cells;
          html += `<div style="overflow-x:auto; margin: 10px 0;"><table style="width:100%; border-collapse:collapse; font-size:12px; border:1px solid #e2e8f0; text-align:left;">`;
          html += `<thead style="background-color:#f8fafc; border-bottom:2px solid #cbd5e1;"><tr>`;
          cells.forEach(h => {
            html += `<th style="padding:6px 8px; border:1px solid #e2e8f0;">${formatInlineMarkdown(h)}</th>`;
          });
          html += `</tr></thead><tbody>`;
        } else {
          html += `<tr>`;
          cells.forEach(c => {
            html += `<td style="padding:6px 8px; border:1px solid #e2e8f0;">${formatInlineMarkdown(c)}</td>`;
          });
          html += `</tr>`;
        }
      } else {
        if (inTable) {
          inTable = false;
          html += `</tbody></table></div>`;
        }

        if (trimmed.startsWith("### ")) {
          html += `<h4 style="font-weight:700; margin:10px 0 4px 0; color:#1e293b; font-size:14px;">${formatInlineMarkdown(trimmed.substring(4))}</h4>`;
        } else if (trimmed.startsWith("## ") || trimmed.startsWith("# ")) {
          html += `<h3 style="font-weight:700; margin:12px 0 6px 0; color:#0f172a; font-size:15px;">${formatInlineMarkdown(trimmed.replace(/^#+\s*/, ""))}</h3>`;
        } else if (trimmed.startsWith("- ")) {
          html += `<li style="margin-left:16px; margin-bottom:4px;">${formatInlineMarkdown(trimmed.substring(2))}</li>`;
        } else if (trimmed.length === 0) {
          html += `<div style="height:6px;"></div>`;
        } else {
          html += `<p style="margin:4px 0; line-height:1.4;">${formatInlineMarkdown(trimmed)}</p>`;
        }
      }
    });

    if (inTable) {
      html += `</tbody></table></div>`;
    }

    return html;
  };

  const formatInlineMarkdown = (str: string) => {
    return str
      .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
      .replace(/\*(.*?)\*/g, '<em>$1</em>')
      .replace(/`([^`]+)`/g, '<code style="background:#f1f5f9; padding:2px 4px; border-radius:4px; font-size:11px;">$1</code>');
  };

  return (
    <div style={{ position: "fixed", bottom: "24px", right: "24px", zIndex: 99999, fontFamily: "system-ui, -apple-system, sans-serif" }}>
      {/* Floating Toggle Button */}
      {!isOpen && (
        <button
          onClick={handleOpen}
          style={{
            display: "flex",
            alignItems: "center",
            gap: "10px",
            background: "linear-gradient(135deg, #4f46e5 0%, #7c3aed 100%)",
            color: "#ffffff",
            border: "none",
            borderRadius: "50px",
            padding: "12px 20px",
            boxShadow: "0 10px 25px -5px rgba(79, 70, 229, 0.4)",
            cursor: "pointer",
            fontWeight: 600,
            fontSize: "14px",
            transition: "all 0.3s cubic-bezier(0.4, 0, 0.2, 1)"
          }}
        >
          <img src="/milo-avatar.png" alt="Milo" style={{ width: "26px", height: "26px", borderRadius: "50%", objectFit: "cover", border: "1px solid rgba(255,255,255,0.4)" }} />
          <span>Ask Milo</span>
          <span style={{ background: "rgba(255,255,255,0.2)", padding: "2px 8px", borderRadius: "12px", fontSize: "11px" }}>Milo AI</span>
        </button>
      )}

      {/* Main Chat Drawer */}
      {isOpen && (
        <div
          style={{
            width: "420px",
            maxWidth: "calc(100vw - 32px)",
            height: "600px",
            maxHeight: "calc(100vh - 80px)",
            background: "#ffffff",
            borderRadius: "16px",
            boxShadow: "0 20px 40px -15px rgba(0, 0, 0, 0.25), 0 0 0 1px rgba(0,0,0,0.05)",
            display: "flex",
            flexDirection: "column",
            overflow: "hidden",
            border: "1px solid #e2e8f0"
          }}
        >
          {/* Header */}
          <div
            style={{
              background: "linear-gradient(135deg, #4f46e5 0%, #7c3aed 100%)",
              color: "#ffffff",
              padding: "14px 18px",
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between"
            }}
          >
            <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
              <div
                style={{
                  width: "34px",
                  height: "34px",
                  borderRadius: "50%",
                  overflow: "hidden",
                  border: "2px solid rgba(255,255,255,0.6)",
                  boxShadow: "0 2px 6px rgba(0,0,0,0.15)"
                }}
              >
                <img src="/milo-avatar.png" alt="Milo AI" style={{ width: "100%", height: "100%", objectFit: "cover" }} />
              </div>
              <div>
                <h3 style={{ margin: 0, fontSize: "15px", fontWeight: 700, color: "#ffffff" }}>Milo AI Assistant</h3>
                <span style={{ fontSize: "11px", color: "rgba(255,255,255,0.8)", display: "flex", alignItems: "center", gap: "4px" }}>
                  <span style={{ width: "6px", height: "6px", borderRadius: "50%", background: "#4ade80" }}></span>
                  Real-time Database AI
                </span>
              </div>
            </div>

            <div style={{ display: "flex", gap: "6px" }}>
              <button
                onClick={() => setMessages([getWelcomeMessage()])}
                title="Clear Chat"
                style={{ background: "transparent", border: "none", color: "#ffffff", opacity: 0.8, cursor: "pointer", fontSize: "14px" }}
              >
                🔄
              </button>
              <button
                onClick={() => setIsOpen(false)}
                title="Minimize"
                style={{ background: "transparent", border: "none", color: "#ffffff", opacity: 0.8, cursor: "pointer", fontSize: "18px", fontWeight: "bold" }}
              >
                ✕
              </button>
            </div>
          </div>

          {/* Messages Area */}
          <div style={{ flex: 1, padding: "16px", overflowY: "auto", background: "#f8fafc", display: "flex", flexDirection: "column", gap: "14px" }}>
            {messages.length === 0 && (
              <div style={{ display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", height: "100%", color: "#94a3b8", textAlign: "center", padding: "20px" }}>
                <img src="/milo-avatar.png" alt="Milo" style={{ width: "64px", height: "64px", borderRadius: "50%", objectFit: "cover", marginBottom: "12px", border: "2px solid #e2e8f0" }} />
                <div style={{ fontSize: "15px", fontWeight: 600, color: "#334155" }}>How can I help you today?</div>
                <div style={{ fontSize: "12px", marginTop: "4px", color: "#64748b" }}>Ask Milo any performance or database question.</div>
              </div>
            )}
            {messages.map((msg) => (
              <div
                key={msg.id}
                style={{
                  display: "flex",
                  flexDirection: "column",
                  alignItems: msg.sender === "user" ? "flex-end" : "flex-start",
                  maxWidth: "100%"
                }}
              >
                <div
                  style={{
                    display: "flex",
                    gap: "8px",
                    maxWidth: "88%",
                    flexDirection: msg.sender === "user" ? "row-reverse" : "row"
                  }}
                >
                  {msg.sender === "user" ? (
                    <div
                      style={{
                        width: "26px",
                        height: "26px",
                        borderRadius: "50%",
                        background: "#4f46e5",
                        color: "#ffffff",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        fontSize: "12px",
                        flexShrink: 0,
                        marginTop: "2px"
                      }}
                    >
                      👤
                    </div>
                  ) : (
                    <img
                      src="/milo-avatar.png"
                      alt="Milo"
                      style={{
                        width: "26px",
                        height: "26px",
                        borderRadius: "50%",
                        objectFit: "cover",
                        flexShrink: 0,
                        marginTop: "2px",
                        border: "1px solid #cbd5e1"
                      }}
                    />
                  )}

                  {/* Message Bubble */}
                  <div
                    style={{
                      background: msg.sender === "user" ? "#4f46e5" : "#ffffff",
                      color: msg.sender === "user" ? "#ffffff" : "#1e293b",
                      padding: "10px 14px",
                      borderRadius: msg.sender === "user" ? "16px 16px 4px 16px" : "16px 16px 16px 4px",
                      boxShadow: msg.sender === "user" ? "0 2px 8px rgba(79, 70, 229, 0.25)" : "0 2px 8px rgba(0,0,0,0.05)",
                      border: msg.sender === "user" ? "none" : "1px solid #e2e8f0",
                      fontSize: "13px",
                      lineHeight: "1.4"
                    }}
                  >
                    {msg.sender === "user" ? (
                      <div>{msg.text}</div>
                    ) : (
                      <div dangerouslySetInnerHTML={{ __html: formatMarkdown(msg.text) }} />
                    )}
                  </div>
                </div>
              </div>
            ))}

            {/* Loading Typing Indicator */}
            {loading && (
              <div style={{ display: "flex", gap: "8px", alignItems: "center", marginLeft: "4px" }}>
                <img src="/milo-avatar.png" alt="Milo" style={{ width: "26px", height: "26px", borderRadius: "50%", objectFit: "cover", border: "1px solid #cbd5e1" }} />
                <div style={{ background: "#ffffff", border: "1px solid #e2e8f0", padding: "8px 14px", borderRadius: "16px", fontSize: "12px", color: "#64748b", display: "flex", alignItems: "center", gap: "6px" }}>
                  <span>Analyzing Nexus database...</span>
                  <span className="spinner" style={{ display: "inline-block", width: "12px", height: "12px", border: "2px solid #7c3aed", borderTopColor: "transparent", borderRadius: "50%", animation: "spin 0.8s linear infinite" }}></span>
                </div>
              </div>
            )}

            <div ref={messagesEndRef} />
          </div>

          {/* Live Voice Input Banner */}
          {isListening && (
            <div style={{ padding: "6px 14px", background: "#fef2f2", borderTop: "1px solid #fecaca", display: "flex", alignItems: "center", justifyContent: "space-between", fontSize: "12px", color: "#dc2626", fontWeight: "bold" }}>
              <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
                <span style={{ display: "inline-block", width: "8px", height: "8px", borderRadius: "50%", background: "#dc2626", animation: "pulse 1s infinite" }}></span>
                <span>Listening... Speak now in Hindi or English</span>
              </div>
              <button
                type="button"
                onClick={toggleVoiceInput}
                style={{ background: "transparent", border: "none", color: "#dc2626", cursor: "pointer", fontWeight: "bold" }}
              >
                Stop
              </button>
            </div>
          )}

          {/* Input Box & Voice Controls */}
          <div style={{ padding: "12px", background: "#ffffff", borderTop: "1px solid #e2e8f0" }}>
            {/* Language Selector Bar */}
            <div style={{ display: "flex", justifyContent: "flex-end", alignItems: "center", marginBottom: "6px", gap: "6px" }}>
              <span style={{ fontSize: "11px", color: "#64748b" }}>Voice Language:</span>
              <button
                type="button"
                onClick={() => setSpeechLang("hi-IN")}
                style={{
                  fontSize: "11px",
                  padding: "2px 8px",
                  borderRadius: "10px",
                  border: "none",
                  background: speechLang === "hi-IN" ? "#e0e7ff" : "#f1f5f9",
                  color: speechLang === "hi-IN" ? "#4338ca" : "#64748b",
                  fontWeight: speechLang === "hi-IN" ? "bold" : "normal",
                  cursor: "pointer"
                }}
              >
                🇮🇳 Hindi / Hinglish
              </button>
              <button
                type="button"
                onClick={() => setSpeechLang("en-IN")}
                style={{
                  fontSize: "11px",
                  padding: "2px 8px",
                  borderRadius: "10px",
                  border: "none",
                  background: speechLang === "en-IN" ? "#e0e7ff" : "#f1f5f9",
                  color: speechLang === "en-IN" ? "#4338ca" : "#64748b",
                  fontWeight: speechLang === "en-IN" ? "bold" : "normal",
                  cursor: "pointer"
                }}
              >
                🇬🇧 English
              </button>
            </div>

            <form
              onSubmit={(e) => {
                e.preventDefault();
                handleSend();
              }}
              style={{ display: "flex", gap: "8px", alignItems: "center" }}
            >
              {/* Mic Voice Button */}
              <button
                type="button"
                onClick={toggleVoiceInput}
                title={isListening ? "Stop listening" : "Speak to Milo AI (Hindi / English)"}
                style={{
                  width: "38px",
                  height: "38px",
                  borderRadius: "50%",
                  background: isListening ? "#ef4444" : "#f1f5f9",
                  color: isListening ? "#ffffff" : "#475569",
                  border: isListening ? "none" : "1px solid #cbd5e1",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  cursor: "pointer",
                  fontSize: "16px",
                  transition: "all 0.2s ease",
                  boxShadow: isListening ? "0 0 12px rgba(239, 68, 68, 0.5)" : "none"
                }}
              >
                {isListening ? "🔴" : "🎙️"}
              </button>

              <input
                type="text"
                placeholder={isListening ? "Listening... Speak in Hindi or English" : "Ask Milo anything..."}
                value={inputPrompt}
                onChange={(e) => setInputPrompt(e.target.value)}
                disabled={loading}
                style={{
                  flex: 1,
                  padding: "10px 14px",
                  borderRadius: "24px",
                  border: isListening ? "1.5px solid #ef4444" : "1px solid #cbd5e1",
                  outline: "none",
                  fontSize: "13px",
                  background: isListening ? "#fef2f2" : "#f8fafc"
                }}
              />
              <button
                type="submit"
                disabled={loading || !inputPrompt.trim()}
                style={{
                  width: "38px",
                  height: "38px",
                  borderRadius: "50%",
                  background: inputPrompt.trim() && !loading ? "linear-gradient(135deg, #4f46e5 0%, #7c3aed 100%)" : "#cbd5e1",
                  color: "#ffffff",
                  border: "none",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  cursor: inputPrompt.trim() && !loading ? "pointer" : "default",
                  transition: "all 0.2s"
                }}
              >
                ➔
              </button>
            </form>
          </div>
        </div>
      )}

      <style>{`
        @keyframes spin {
          0% { transform: rotate(0deg); }
          100% { transform: rotate(360deg); }
        }
        @keyframes pulse {
          0% { opacity: 1; }
          50% { opacity: 0.4; }
          100% { opacity: 1; }
        }
      `}</style>
    </div>
  );
};
