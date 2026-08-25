import React, { useState, useEffect } from "react";
import { recruitmentApi, CandidateAssessmentRecord } from "../api/recruitmentApi";

// --- ANSWER KEYS ---
const SECTION_A_KEYS: Record<string, string> = {
  q1: "B", // Keyboard
  q2: "B", // Ctrl + C
  q3: "C", // Ctrl + Z
  q4: "C", // .pdf
  q5: "B", // Google Chrome
  q6: "A", // Windows
  q7: "B", // Ctrl + S
  q8: "A", // USB Flash Drive
  q9: "C", // Recycle Bin
  q10: "B", // CC
};

const SECTION_B_MCQ_KEYS: Record<string, string> = {
  q11: "A", // Workbook
  q12: "B", // Numbers
  q13: "B", // Letters
  q14: "B", // =SUM()
  q15: "B", // =AVERAGE()
  q16: "C", // MAX
  q17: "B", // Sort
  q18: "B", // Filter
  q19: "B", // IF
  q20: "C", // TODAY()
};

export default function CandidateAssessmentPage() {
  // --- CANDIDATE INFO ---
  const [candName, setCandName] = useState("");
  const [candEmail, setCandEmail] = useState("");
  const [positionApplied, setPositionApplied] = useState("CNC Machine Operator");
  const [department, setDepartment] = useState("Production / Machine Shop");
  const [testStarted, setTestStarted] = useState(false);
  const [testSubmittedSuccessfully, setTestSubmittedSuccessfully] = useState(false);

  // --- TIMER (45 Minutes = 2700 Seconds) ---
  const [timeLeft, setTimeLeft] = useState(2700);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // --- SECTION A ANSWERS ---
  const [secAAnswers, setSecAAnswers] = useState<Record<string, string>>({});

  // --- SECTION B MCQ ANSWERS ---
  const [secBMcqAnswers, setSecBMcqAnswers] = useState<Record<string, string>>({});

  // --- SECTION B PRACTICAL EXCEL STATE ---
  const [excelBorders, setExcelBorders] = useState(false);
  const [excelHeaderBold, setExcelHeaderBold] = useState(false);
  const [excelHeaderBg, setExcelHeaderBg] = useState(false);
  const [excelWidthAdjusted, setExcelWidthAdjusted] = useState(false);
  const [excelSumFormula, setExcelSumFormula] = useState("");
  const [excelAvgFormula, setExcelAvgFormula] = useState("");
  const [excelMaxFormula, setExcelMaxFormula] = useState("");
  const [excelMinFormula, setExcelMinFormula] = useState("");
  const [excelSorted, setExcelSorted] = useState(false);
  const [excelFiltered, setExcelFiltered] = useState(false);
  const [excelCondFormat, setExcelCondFormat] = useState(false);
  const [excelChartCreated, setExcelChartCreated] = useState(false);

  // --- SECTION C MS WORD STATE ---
  const [wordHeading, setWordHeading] = useState("");
  const [wordHeadingBold, setWordHeadingBold] = useState(false);
  const [wordHeadingFontSize, setWordHeadingFontSize] = useState("14");
  const [wordHeadingAlign, setWordHeadingAlign] = useState("left");
  const [wordTableRows, setWordTableRows] = useState(0);
  const [wordTableCols, setWordTableCols] = useState(0);
  const [wordPageNumbers, setWordPageNumbers] = useState(false);

  // --- SECTION D EMAIL WRITING STATE ---
  const [emailSubject, setEmailSubject] = useState("");
  const [emailBody, setEmailBody] = useState("");

  // Timer Effect
  useEffect(() => {
    let interval: any = null;
    if (testStarted && timeLeft > 0 && !testSubmittedSuccessfully) {
      interval = setInterval(() => {
        setTimeLeft((prev) => prev - 1);
      }, 1000);
    } else if (timeLeft === 0 && testStarted && !testSubmittedSuccessfully) {
      handleAutoSubmit();
    }
    return () => clearInterval(interval);
  }, [testStarted, timeLeft, testSubmittedSuccessfully]);



  function formatTime(seconds: number) {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, "0")}:${secs.toString().padStart(2, "0")}`;
  }

  // --- PURE SYSTEM-DRIVEN AUTOMATED EVALUATION ENGINE ---
  function evaluateTest() {
    // 1. Section A Score (20 Marks max)
    let secAScore = 0;
    Object.keys(SECTION_A_KEYS).forEach((qKey) => {
      if (secAAnswers[qKey] === SECTION_A_KEYS[qKey]) {
        secAScore += 2;
      }
    });

    // 2. Section B MCQ Score (20 Marks max)
    let secBMcqScore = 0;
    Object.keys(SECTION_B_MCQ_KEYS).forEach((qKey) => {
      if (secBMcqAnswers[qKey] === SECTION_B_MCQ_KEYS[qKey]) {
        secBMcqScore += 2;
      }
    });

    // 3. Section B Practical Excel Score (20 Marks max)
    let secBPracticalScore = 0;
    if (excelBorders) secBPracticalScore += 2;
    if (excelHeaderBold) secBPracticalScore += 2;
    if (excelHeaderBg) secBPracticalScore += 2;
    if (excelWidthAdjusted) secBPracticalScore += 2;

    // Formulas evaluation
    const safeStr = (v: any) => (v ? String(v) : "");

    const sumVal = safeStr(excelSumFormula).trim().toUpperCase();
    if (sumVal.includes("SUM") || sumVal === "203000" || sumVal === "=SUM(C2:C6)" || sumVal.includes("203000")) {
      secBPracticalScore += 3;
    }
    // AVG = 40600
    const avgVal = safeStr(excelAvgFormula).trim().toUpperCase();
    if (avgVal.includes("AVERAGE") || avgVal === "40600" || avgVal === "=AVERAGE(C2:C6)" || avgVal.includes("40600")) {
      secBPracticalScore += 3;
    }
    // MAX = 52000
    const maxVal = safeStr(excelMaxFormula).trim().toUpperCase();
    if (maxVal.includes("MAX") || maxVal === "52000" || maxVal.includes("52000")) {
      secBPracticalScore += 2;
    }
    // MIN = 28000
    const minVal = safeStr(excelMinFormula).trim().toUpperCase();
    if (minVal.includes("MIN") || minVal === "28000" || minVal.includes("28000")) {
      secBPracticalScore += 2;
    }
    if (excelSorted || excelFiltered || excelCondFormat || excelChartCreated) {
      secBPracticalScore = Math.min(20, secBPracticalScore + 2);
    }

    // 4. Section C MS Word Score (15 Marks max)
    let secCScore = 0;
    if (safeStr(wordHeading).trim().toLowerCase().includes("furniture manufacturing company")) secCScore += 3;
    if (wordHeadingBold) secCScore += 3;
    if (wordHeadingFontSize === "18") secCScore += 3;
    if (wordHeadingAlign === "center") secCScore += 3;
    if (wordTableCols >= 3 && wordTableRows >= 5) secCScore += 3;

    // 5. Section D Professional Email Writing Score (10 Marks max)
    let secDScore = 0;
    const subj = safeStr(emailSubject).toLowerCase();
    const body = safeStr(emailBody).toLowerCase();

    // Subject check
    if (subj.includes("leave") || subj.includes("medical") || subj.includes("appointment")) {
      secDScore += 3;
    }
    // Greeting check
    if (body.includes("dear") || body.includes("respected") || body.includes("hello") || body.includes("hi hr")) {
      secDScore += 2;
    }
    // Reason check
    if (body.includes("doctor") || body.includes("medical") || body.includes("appointment") || body.includes("health") || body.includes("hospital")) {
      secDScore += 3;
    }
    // Sign-off check
    if (body.includes("sincerely") || body.includes("regards") || body.includes("thank") || body.includes("yours")) {
      secDScore += 2;
    }

    return {
      secAScore,
      secBMcqScore,
      secBPracticalScore,
      secCScore,
      secDScore,
    };
  }

  async function handleAutoSubmit() {
    if (isSubmitting) return;
    setIsSubmitting(true);
    setError(null);

    try {
      const scores = evaluateTest();
      const timeTaken = Math.max(1, Math.round((2700 - timeLeft) / 60));

      const safeName = (candName || "Anonymous Candidate").trim() || "Anonymous Candidate";
      const safePos = (positionApplied || "Candidate Position").trim() || "General Position";
      const safeDept = (department || "General Department").trim() || "General Department";

      const answersPayload = JSON.stringify({
        secA: secAAnswers || {},
        secBMcq: secBMcqAnswers || {},
        secBPractical: {
          excelBorders,
          excelHeaderBold,
          excelHeaderBg,
          excelWidthAdjusted,
          excelSumFormula: excelSumFormula || "",
          excelAvgFormula: excelAvgFormula || "",
          excelMaxFormula: excelMaxFormula || "",
          excelMinFormula: excelMinFormula || "",
          excelSorted,
          excelFiltered,
          excelCondFormat,
          excelChartCreated,
        },
        secC: {
          wordHeading: wordHeading || "",
          wordHeadingBold,
          wordHeadingFontSize: wordHeadingFontSize || "14",
          wordHeadingAlign: wordHeadingAlign || "left",
          wordTableRows: wordTableRows || 0,
          wordTableCols: wordTableCols || 0,
          wordPageNumbers,
        },
        secD: {
          emailSubject: emailSubject || "",
          emailBody: emailBody || "",
        },
      });

      const record = await recruitmentApi.submitAssessment({
        candidateName: safeName,
        candidateEmail: candEmail && candEmail.trim() ? candEmail.trim() : undefined,
        positionApplied: safePos,
        department: safeDept,
        timeTakenMinutes: timeTaken,
        sectionAScore: scores.secAScore,
        sectionBMcqScore: scores.secBMcqScore,
        sectionBPracticalScore: scores.secBPracticalScore,
        sectionCScore: scores.secCScore,
        sectionDScore: scores.secDScore,
        answersJson: answersPayload,
      });

      setTestSubmittedSuccessfully(true);
    } catch (err: any) {
      console.error("Failed to submit assessment", err);
      const errMsg = err.response?.data?.error || err.message || "Failed to submit assessment. Please try again.";
      setError(errMsg);
      alert("Submission Error: " + errMsg);
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <div style={{ background: "#f8fafc", minHeight: "100vh", padding: "24px" }}>
      {/* Header */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "20px" }}>
        <div>
          <h1 style={{ fontSize: "24px", fontWeight: "700", color: "#0f172a", margin: "0 0 4px 0" }}>
            LII Nexus – Candidate Computer & Excel Assessment
          </h1>
          <p style={{ fontSize: "14px", color: "#64748b", margin: 0 }}>
            System-Driven Online Assessment Engine with Instant Automatic Evaluation & Candidate Grading.
          </p>
        </div>
      </div>

      {testSubmittedSuccessfully ? (
        <div style={{ background: "#ffffff", borderRadius: "10px", padding: "40px 28px", border: "1px solid #e2e8f0", boxShadow: "0 4px 12px rgba(0,0,0,0.08)", maxWidth: "700px", margin: "40px auto", textAlign: "center" }}>
          <div style={{ fontSize: "64px", marginBottom: "16px" }}>✅</div>
          <h2 style={{ fontSize: "22px", fontWeight: "800", color: "#0f172a", margin: "0 0 12px 0" }}>
            Assessment Submitted Successfully / मूल्यांकन सफलतापूर्वक जमा हो गया है
          </h2>
          <p style={{ fontSize: "15px", color: "#475569", lineHeight: "1.6", margin: "0 0 24px 0" }}>
            Thank you, your assessment test paper has been submitted to the HR department for evaluation.
            <br/>
            <span style={{ color: "#64748b" }}>धन्यवाद, आपका मूल्यांकन परीक्षा पत्र मूल्यांकन के लिए मानव संसाधन विभाग को सौंप दिया गया है।</span>
          </p>
          <button
            onClick={() => {
              setTestSubmittedSuccessfully(false);
              setTestStarted(false);
              setTimeLeft(2700);
              setCandName("");
              setCandEmail("");
              setSecAAnswers({});
              setSecBMcqAnswers({});
              setExcelBorders(false);
              setExcelHeaderBold(false);
              setExcelHeaderBg(false);
              setExcelWidthAdjusted(false);
              setExcelSumFormula("");
              setExcelAvgFormula("");
              setExcelMaxFormula("");
              setExcelMinFormula("");
              setExcelSorted(false);
              setExcelFiltered(false);
              setExcelCondFormat(false);
              setExcelChartCreated(false);
              setWordHeading("");
              setWordHeadingBold(false);
              setWordHeadingFontSize("14");
              setWordHeadingAlign("left");
              setWordTableRows(0);
              setWordTableCols(0);
              setWordPageNumbers(false);
              setEmailSubject("");
              setEmailBody("");
            }}
            style={{ padding: "10px 24px", background: "#0284c7", color: "#ffffff", border: "none", borderRadius: "6px", fontWeight: "700", fontSize: "15px", cursor: "pointer" }}
          >
            Back / वापस
          </button>
        </div>
      ) : (
        <>
          {/* CANDIDATE REGISTRATION CARD */}
          {!testStarted ? (
            <div style={{ background: "#ffffff", borderRadius: "10px", padding: "24px", border: "1px solid #e2e8f0", boxShadow: "0 2px 4px rgba(0,0,0,0.05)", maxWidth: "650px", margin: "0 auto" }}>
              <div style={{ textAlign: "center", marginBottom: "20px" }}>
                <div style={{ fontSize: "36px", marginBottom: "8px" }}>💻</div>
                <h2 style={{ fontSize: "20px", fontWeight: "700", color: "#0f172a", margin: "0 0 6px 0" }}>Candidate Assessment Portal</h2>
                <p style={{ fontSize: "14px", color: "#64748b", margin: 0 }}>Please fill out your details before starting the timed test.</p>
              </div>

              <div style={{ background: "#f1f5f9", borderRadius: "8px", padding: "14px", marginBottom: "20px", fontSize: "13px", color: "#334155" }}>
                <div><strong>⏱️ Time Allowed:</strong> 45 Minutes (Auto-submits when timer expires)</div>
                <div><strong>🎯 Total Marks:</strong> 100 Marks | <strong>Passing Marks:</strong> 70 Marks</div>
                <div><strong>📋 Structure:</strong> Section A (20M), Section B MCQs & Excel Practical (40M), Section C Word (15M), Section D Email (10M)</div>
              </div>

              <form
                onSubmit={(e) => {
                  e.preventDefault();
                  if (candName.trim()) setTestStarted(true);
                }}
              >
                <div style={{ marginBottom: "14px" }}>
                  <label style={{ display: "block", fontSize: "13px", fontWeight: "600", color: "#475569", marginBottom: "4px" }}>Candidate Name * <span style={{ color: "#94a3b8", fontWeight: "400" }}>/ उम्मीदवार का नाम</span></label>
                  <input
                    type="text"
                    required
                    value={candName}
                    onChange={(e) => setCandName(e.target.value)}
                    placeholder="Enter full name / पूरा नाम लिखें"
                    style={{ width: "100%", padding: "10px 12px", border: "1px solid #cbd5e1", borderRadius: "6px", fontSize: "14px" }}
                  />
                </div>

                <div style={{ marginBottom: "14px" }}>
                  <label style={{ display: "block", fontSize: "13px", fontWeight: "600", color: "#475569", marginBottom: "4px" }}>Candidate Email <span style={{ color: "#94a3b8", fontWeight: "400" }}>/ ईमेल</span></label>
                  <input
                    type="email"
                    value={candEmail}
                    onChange={(e) => setCandEmail(e.target.value)}
                    placeholder="e.g. candidate@email.com"
                    style={{ width: "100%", padding: "10px 12px", border: "1px solid #cbd5e1", borderRadius: "6px", fontSize: "14px" }}
                  />
                </div>

                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "14px", marginBottom: "20px" }}>
                  <div>
                    <label style={{ display: "block", fontSize: "13px", fontWeight: "600", color: "#475569", marginBottom: "4px" }}>Position Applied For <span style={{ color: "#94a3b8", fontWeight: "400" }}>/ पद का नाम</span></label>
                    <input
                      type="text"
                      value={positionApplied}
                      onChange={(e) => setPositionApplied(e.target.value)}
                      style={{ width: "100%", padding: "10px 12px", border: "1px solid #cbd5e1", borderRadius: "6px", fontSize: "14px" }}
                    />
                  </div>
                  <div>
                    <label style={{ display: "block", fontSize: "13px", fontWeight: "600", color: "#475569", marginBottom: "4px" }}>Department <span style={{ color: "#94a3b8", fontWeight: "400" }}>/ विभाग</span></label>
                    <input
                      type="text"
                      value={department}
                      onChange={(e) => setDepartment(e.target.value)}
                      style={{ width: "100%", padding: "10px 12px", border: "1px solid #cbd5e1", borderRadius: "6px", fontSize: "14px" }}
                    />
                  </div>
                </div>

                <button
                  type="submit"
                  style={{
                    width: "100%",
                    padding: "12px",
                    background: "#0284c7",
                    color: "#ffffff",
                    border: "none",
                    borderRadius: "6px",
                    fontWeight: "700",
                    fontSize: "15px",
                    cursor: "pointer",
                  }}
                >
                  ▶️ Start Online Assessment Now / परीक्षा शुरू करें
                </button>
              </form>
            </div>
          ) : (
            /* ACTIVE TEST RUNNER WITH STICKY TIMER BAR */
            <div>
              {/* Sticky Top Timer Bar */}
              <div
                style={{
                  position: "sticky",
                  top: 0,
                  zIndex: 100,
                  background: "#0f172a",
                  color: "#ffffff",
                  padding: "12px 20px",
                  borderRadius: "8px",
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "center",
                  marginBottom: "20px",
                  boxShadow: "0 4px 6px rgba(0,0,0,0.1)",
                }}
              >
                <div>
                  <div style={{ fontSize: "14px", fontWeight: "700" }}>👤 {candName}</div>
                  <div style={{ fontSize: "12px", color: "#94a3b8" }}>{positionApplied} ({department})</div>
                </div>

                <div style={{ display: "flex", alignItems: "center", gap: "16px" }}>
                  <div style={{ textAlign: "right" }}>
                    <div style={{ fontSize: "11px", color: "#94a3b8" }}>TIME REMAINING</div>
                    <div style={{ fontSize: "20px", fontWeight: "800", color: timeLeft < 300 ? "#ef4444" : "#38bdf8" }}>
                      ⏱️ {formatTime(timeLeft)}
                    </div>
                  </div>

                  <button
                    onClick={handleAutoSubmit}
                    disabled={isSubmitting}
                    style={{
                      padding: "8px 18px",
                      background: isSubmitting ? "#94a3b8" : "#16a34a",
                      color: "#ffffff",
                      border: "none",
                      borderRadius: "6px",
                      fontWeight: "700",
                      fontSize: "13px",
                      cursor: isSubmitting ? "not-allowed" : "pointer",
                    }}
                  >
                    {isSubmitting ? "Submitting..." : "✅ Submit Assessment"}
                  </button>
                </div>
              </div>

              {error && (
                <div style={{ background: "#fef2f2", border: "1px solid #fecaca", color: "#991b1b", padding: "12px 16px", borderRadius: "8px", marginBottom: "20px", fontSize: "14px", fontWeight: "600" }}>
                  ⚠️ Submission Error: {error}
                </div>
              )}

              {/* SECTION A */}
              <div style={{ background: "#ffffff", borderRadius: "10px", padding: "24px", border: "1px solid #e2e8f0", marginBottom: "24px" }}>
                <div style={{ borderBottom: "2px solid #e2e8f0", paddingBottom: "10px", marginBottom: "16px", display: "flex", justifyContent: "space-between" }}>
                  <h3 style={{ fontSize: "17px", fontWeight: "700", color: "#0f172a", margin: 0 }}>
                    Section A – Computer Fundamentals (20 Marks) / कंप्यूटर बुनियादी ज्ञान
                  </h3>
                  <span style={{ fontSize: "12px", fontWeight: "600", color: "#0284c7" }}>10 Questions | 2 Marks Each</span>
                </div>

                <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
                  {[
                    { q: "1. Which of the following is an input device? / इनमें से कौन सा इनपुट डिवाइस है?", key: "q1", opts: ["A. Monitor", "B. Keyboard", "C. Printer", "D. Speaker"] },
                    { q: "2. Which shortcut is used to copy selected text? / चुने हुए टेक्स्ट को कॉपी करने का शॉर्टकट क्या है?", key: "q2", opts: ["A. Ctrl + X", "B. Ctrl + C", "C. Ctrl + V", "D. Ctrl + A"] },
                    { q: "3. Which shortcut is used to undo the last action? / पिछली क्रिया को वापस लेने का शॉर्टकट क्या है?", key: "q3", opts: ["A. Ctrl + Y", "B. Ctrl + U", "C. Ctrl + Z", "D. Ctrl + P"] },
                    { q: "4. Which file format is commonly used for PDF documents? / PDF के लिए कौन सा फॉर्मेट उपयोग होता है?", key: "q4", opts: ["A. .docx", "B. .xlsx", "C. .pdf", "D. .ppt"] },
                    { q: "5. Which application is mainly used to browse websites? / वेबसाइट देखने के लिए कौन सा एप्लिकेशन उपयोग होता है?", key: "q5", opts: ["A. MS Word", "B. Google Chrome", "C. Excel", "D. Paint"] },
                    { q: "6. Which of the following is an operating system? / इनमें से कौन सा ऑपरेटिंग सिस्टम है?", key: "q6", opts: ["A. Windows", "B. Excel", "C. Gmail", "D. Chrome"] },
                    { q: "7. Which shortcut saves a document? / दस्तावेज़ सेव करने का शॉर्टकट क्या है?", key: "q7", opts: ["A. Ctrl + P", "B. Ctrl + S", "C. Ctrl + O", "D. Ctrl + N"] },
                    { q: "8. Which storage device is portable? / कौन सा स्टोरेज डिवाइस पोर्टेबल है?", key: "q8", opts: ["A. USB Flash Drive", "B. CPU", "C. RAM", "D. Motherboard"] },
                    { q: "9. Which folder usually stores deleted files? / डिलीट की गई फाइलें किस फोल्डर में जाती हैं?", key: "q9", opts: ["A. Downloads", "B. Desktop", "C. Recycle Bin", "D. Documents"] },
                    { q: "10. Which email field is used to send a copy of an email? / ईमेल की कॉपी भेजने के लिए कौन सा फील्ड उपयोग होता है?", key: "q10", opts: ["A. Subject", "B. CC", "C. Inbox", "D. Draft"] },
                  ].map((item) => (
                    <div key={item.key} style={{ background: "#f8fafc", padding: "14px", borderRadius: "8px", border: "1px solid #cbd5e1" }}>
                      <div style={{ fontWeight: "600", fontSize: "14px", color: "#1e293b", marginBottom: "8px" }}>{item.q}</div>
                      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))", gap: "8px" }}>
                        {item.opts.map((opt) => {
                          const code = opt.charAt(0);
                          return (
                            <label key={opt} style={{ display: "flex", alignItems: "center", gap: "6px", fontSize: "13px", color: "#334155", cursor: "pointer" }}>
                              <input
                                type="radio"
                                name={item.key}
                                checked={secAAnswers[item.key] === code}
                                onChange={() => setSecAAnswers((prev) => ({ ...prev, [item.key]: code }))}
                              />
                              {opt}
                            </label>
                          );
                        })}
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* SECTION B PART A: EXCEL MCQS */}
              <div style={{ background: "#ffffff", borderRadius: "10px", padding: "24px", border: "1px solid #e2e8f0", marginBottom: "24px" }}>
                <div style={{ borderBottom: "2px solid #e2e8f0", paddingBottom: "10px", marginBottom: "16px", display: "flex", justifyContent: "space-between" }}>
                  <h3 style={{ fontSize: "17px", fontWeight: "700", color: "#0f172a", margin: 0 }}>
                    Section B – Microsoft Excel Basics (Part A: MCQs - 20 Marks) / एक्सेल बुनियादी ज्ञान
                  </h3>
                  <span style={{ fontSize: "12px", fontWeight: "600", color: "#0284c7" }}>10 Questions | 2 Marks Each</span>
                </div>

                <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
                  {[
                    { q: "11. Every Excel file is called a: / हर Excel फाइल को क्या कहते हैं?", key: "q11", opts: ["A. Workbook", "B. Folder", "C. Document", "D. Slide"] },
                    { q: "12. Rows are identified by: / पंक्तियाँ किससे पहचानी जाती हैं?", key: "q12", opts: ["A. Letters", "B. Numbers", "C. Symbols", "D. Colors"] },
                    { q: "13. Columns are identified by: / कॉलम किससे पहचाने जाते हैं?", key: "q13", opts: ["A. Numbers", "B. Letters", "C. Symbols", "D. Dates"] },
                    { q: "14. Which formula calculates the total? / कुल जोड़ के लिए कौन सा फॉर्मूला है?", key: "q14", opts: ["A. =COUNT()", "B. =SUM()", "C. =MAX()", "D. =AVERAGE()"] },
                    { q: "15. Which formula calculates the average? / औसत निकालने का फॉर्मूला क्या है?", key: "q15", opts: ["A. =SUM()", "B. =AVERAGE()", "C. =COUNT()", "D. =MIN()"] },
                    { q: "16. Which function returns the highest value? / सबसे अधिक मान देने वाला फंक्शन?", key: "q16", opts: ["A. MIN", "B. COUNT", "C. MAX", "D. ROUND"] },
                    { q: "17. Which feature arranges data alphabetically? / डेटा को क्रम में लगाने की सुविधा?", key: "q17", opts: ["A. Filter", "B. Sort", "C. Freeze", "D. Merge"] },
                    { q: "18. Which feature shows only selected records? / केवल चुने हुए रिकॉर्ड दिखाने की सुविधा?", key: "q18", opts: ["A. Freeze Panes", "B. Filter", "C. Format Painter", "D. Wrap Text"] },
                    { q: "19. Which formula checks a condition? / शर्त जाँचने का फॉर्मूला क्या है?", key: "q19", opts: ["A. SUM", "B. IF", "C. COUNT", "D. MAX"] },
                    { q: "20. Which formula returns today's date? / आज की तारीख देने वाला फॉर्मूला?", key: "q20", opts: ["A. NOW()", "B. DATE()", "C. TODAY()", "D. YEAR()"] },
                  ].map((item) => (
                    <div key={item.key} style={{ background: "#f8fafc", padding: "14px", borderRadius: "8px", border: "1px solid #cbd5e1" }}>
                      <div style={{ fontWeight: "600", fontSize: "14px", color: "#1e293b", marginBottom: "8px" }}>{item.q}</div>
                      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))", gap: "8px" }}>
                        {item.opts.map((opt) => {
                          const code = opt.charAt(0);
                          return (
                            <label key={opt} style={{ display: "flex", alignItems: "center", gap: "6px", fontSize: "13px", color: "#334155", cursor: "pointer" }}>
                              <input
                                type="radio"
                                name={item.key}
                                checked={secBMcqAnswers[item.key] === code}
                                onChange={() => setSecBMcqAnswers((prev) => ({ ...prev, [item.key]: code }))}
                              />
                              {opt}
                            </label>
                          );
                        })}
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* SECTION B PART B: PRACTICAL EXCEL TEST */}
              <div style={{ background: "#ffffff", borderRadius: "10px", padding: "24px", border: "1px solid #e2e8f0", marginBottom: "24px" }}>
                <div style={{ borderBottom: "2px solid #e2e8f0", paddingBottom: "10px", marginBottom: "16px", display: "flex", justifyContent: "space-between" }}>
                  <h3 style={{ fontSize: "17px", fontWeight: "700", color: "#0f172a", margin: 0 }}>
                    Section B – Microsoft Excel Basics (Part B: Practical Excel Simulator - 20 Marks) / एक्सेल अभ्यास
                  </h3>
                  <span style={{ fontSize: "12px", fontWeight: "600", color: "#0284c7" }}>Interactive Table & Formula Engine</span>
                </div>

                {/* Practical Controls Toolbar */}
                <div style={{ display: "flex", gap: "8px", flexWrap: "wrap", marginBottom: "16px", background: "#f1f5f9", padding: "10px", borderRadius: "6px" }}>
                  <button
                    type="button"
                    onClick={() => setExcelBorders(!excelBorders)}
                    style={{ padding: "6px 12px", background: excelBorders ? "#0284c7" : "#ffffff", color: excelBorders ? "#fff" : "#334155", border: "1px solid #cbd5e1", borderRadius: "4px", fontSize: "12px", fontWeight: "600", cursor: "pointer" }}
                  >
                    🔲 {excelBorders ? "Borders Applied" : "Apply Borders"}
                  </button>

                  <button
                    type="button"
                    onClick={() => setExcelHeaderBold(!excelHeaderBold)}
                    style={{ padding: "6px 12px", background: excelHeaderBold ? "#0284c7" : "#ffffff", color: excelHeaderBold ? "#fff" : "#334155", border: "1px solid #cbd5e1", borderRadius: "4px", fontSize: "12px", fontWeight: "600", cursor: "pointer" }}
                  >
                    <strong>B</strong> {excelHeaderBold ? "Header Bold" : "Make Header Bold"}
                  </button>

                  <button
                    type="button"
                    onClick={() => setExcelHeaderBg(!excelHeaderBg)}
                    style={{ padding: "6px 12px", background: excelHeaderBg ? "#0284c7" : "#ffffff", color: excelHeaderBg ? "#fff" : "#334155", border: "1px solid #cbd5e1", borderRadius: "4px", fontSize: "12px", fontWeight: "600", cursor: "pointer" }}
                  >
                    🎨 {excelHeaderBg ? "Header Color Applied" : "Change Header Bg Color"}
                  </button>

                  <button
                    type="button"
                    onClick={() => setExcelWidthAdjusted(!excelWidthAdjusted)}
                    style={{ padding: "6px 12px", background: excelWidthAdjusted ? "#0284c7" : "#ffffff", color: excelWidthAdjusted ? "#fff" : "#334155", border: "1px solid #cbd5e1", borderRadius: "4px", fontSize: "12px", fontWeight: "600", cursor: "pointer" }}
                  >
                    ↔️ {excelWidthAdjusted ? "Width Adjusted" : "Auto-Adjust Column Width"}
                  </button>

                  <button
                    type="button"
                    onClick={() => setExcelSorted(!excelSorted)}
                    style={{ padding: "6px 12px", background: excelSorted ? "#0284c7" : "#ffffff", color: excelSorted ? "#fff" : "#334155", border: "1px solid #cbd5e1", borderRadius: "4px", fontSize: "12px", fontWeight: "600", cursor: "pointer" }}
                  >
                    📶 {excelSorted ? "Salary Sorted" : "Sort Salary (High to Low)"}
                  </button>

                  <button
                    type="button"
                    onClick={() => setExcelFiltered(!excelFiltered)}
                    style={{ padding: "6px 12px", background: excelFiltered ? "#0284c7" : "#ffffff", color: excelFiltered ? "#fff" : "#334155", border: "1px solid #cbd5e1", borderRadius: "4px", fontSize: "12px", fontWeight: "600", cursor: "pointer" }}
                  >
                    🔍 {excelFiltered ? "Filter On" : "Apply Filter"}
                  </button>

                  <button
                    type="button"
                    onClick={() => setExcelCondFormat(!excelCondFormat)}
                    style={{ padding: "6px 12px", background: excelCondFormat ? "#0284c7" : "#ffffff", color: excelCondFormat ? "#fff" : "#334155", border: "1px solid #cbd5e1", borderRadius: "4px", fontSize: "12px", fontWeight: "600", cursor: "pointer" }}
                  >
                    💡 {excelCondFormat ? "Cond. Format On" : "Highlight Salary > ₹40,000"}
                  </button>

                  <button
                    type="button"
                    onClick={() => setExcelChartCreated(!excelChartCreated)}
                    style={{ padding: "6px 12px", background: excelChartCreated ? "#0284c7" : "#ffffff", color: excelChartCreated ? "#fff" : "#334155", border: "1px solid #cbd5e1", borderRadius: "4px", fontSize: "12px", fontWeight: "600", cursor: "pointer" }}
                  >
                    📊 {excelChartCreated ? "Column Chart Generated" : "Create Column Chart"}
                  </button>
                </div>

                {/* Simulated Spreadsheet Grid */}
                <div style={{ overflowX: "auto", marginBottom: "16px" }}>
                  <table
                    style={{
                      width: "100%",
                      borderCollapse: excelBorders ? "collapse" : "separate",
                      border: excelBorders ? "2px solid #475569" : "1px solid #cbd5e1",
                    }}
                  >
                    <thead>
                      <tr style={{ background: excelHeaderBg ? "#dbeafe" : "#f8fafc", fontWeight: excelHeaderBold ? "bold" : "normal" }}>
                        <th style={{ padding: excelWidthAdjusted ? "12px 20px" : "8px", border: excelBorders ? "1px solid #475569" : "1px solid #cbd5e1" }}>Employee</th>
                        <th style={{ padding: excelWidthAdjusted ? "12px 20px" : "8px", border: excelBorders ? "1px solid #475569" : "1px solid #cbd5e1" }}>Department {excelFiltered && "🔽"}</th>
                        <th style={{ padding: excelWidthAdjusted ? "12px 20px" : "8px", border: excelBorders ? "1px solid #475569" : "1px solid #cbd5e1" }}>Salary (₹)</th>
                      </tr>
                    </thead>
                    <tbody>
                      {[
                        { emp: "Ravi", dept: "Sales", sal: 52000 },
                        { emp: "Priya", dept: "Accounts", sal: 46000 },
                        { emp: "Neha", dept: "HR", sal: 42000 },
                        { emp: "Amit", dept: "Purchase", sal: 35000 },
                        { emp: "Rahul", dept: "Production", sal: 28000 },
                      ]
                        .sort((a, b) => (excelSorted ? b.sal - a.sal : 0))
                        .map((r) => (
                          <tr key={r.emp}>
                            <td style={{ padding: "8px", border: excelBorders ? "1px solid #475569" : "1px solid #e2e8f0" }}>{r.emp}</td>
                            <td style={{ padding: "8px", border: excelBorders ? "1px solid #475569" : "1px solid #e2e8f0" }}>{r.dept}</td>
                            <td
                              style={{
                                padding: "8px",
                                border: excelBorders ? "1px solid #475569" : "1px solid #e2e8f0",
                                background: excelCondFormat && r.sal > 40000 ? "#bbf7d0" : "transparent",
                                fontWeight: excelCondFormat && r.sal > 40000 ? "bold" : "normal",
                              }}
                            >
                              ₹{r.sal.toLocaleString()}
                            </td>
                          </tr>
                        ))}
                    </tbody>
                  </table>
                </div>

                {/* Chart Preview */}
                {excelChartCreated && (
                  <div style={{ background: "#f8fafc", border: "1px solid #cbd5e1", borderRadius: "8px", padding: "16px", marginBottom: "16px", textAlign: "center" }}>
                    <div style={{ fontWeight: "700", fontSize: "14px", color: "#0f172a", marginBottom: "10px" }}>📊 Employee Salary Column Chart</div>
                    <div style={{ display: "flex", alignItems: "flex-end", justifyContent: "center", gap: "20px", height: "120px", paddingTop: "10px" }}>
                      {[
                        { name: "Ravi", sal: 52000 },
                        { name: "Priya", sal: 46000 },
                        { name: "Neha", sal: 42000 },
                        { name: "Amit", sal: 35000 },
                        { name: "Rahul", sal: 28000 },
                      ].map((item) => (
                        <div key={item.name} style={{ display: "flex", flexDirection: "column", alignItems: "center" }}>
                          <div style={{ background: "#0284c7", width: "30px", height: `${(item.sal / 52000) * 90}px`, borderRadius: "4px 4px 0 0" }} />
                          <div style={{ fontSize: "11px", color: "#334155", marginTop: "4px" }}>{item.name}</div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Excel Formulas Inputs */}
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "12px" }}>
                  <div>
                    <label style={{ display: "block", fontSize: "13px", fontWeight: "600", marginBottom: "4px" }}>Total Salary Formula =SUM(...) / कुल वेतन</label>
                    <input
                      type="text"
                      value={excelSumFormula}
                      onChange={(e) => setExcelSumFormula(e.target.value)}
                      placeholder="e.g. =SUM(C2:C6) or 203000"
                      style={{ width: "100%", padding: "8px", border: "1px solid #cbd5e1", borderRadius: "6px" }}
                    />
                  </div>
                  <div>
                    <label style={{ display: "block", fontSize: "13px", fontWeight: "600", marginBottom: "4px" }}>Average Salary Formula =AVERAGE(...) / औसत वेतन</label>
                    <input
                      type="text"
                      value={excelAvgFormula}
                      onChange={(e) => setExcelAvgFormula(e.target.value)}
                      placeholder="e.g. =AVERAGE(C2:C6) or 40600"
                      style={{ width: "100%", padding: "8px", border: "1px solid #cbd5e1", borderRadius: "6px" }}
                    />
                  </div>
                  <div>
                    <label style={{ display: "block", fontSize: "13px", fontWeight: "600", marginBottom: "4px" }}>Highest Salary Formula =MAX(...) / सबसे अधिक वेतन</label>
                    <input
                      type="text"
                      value={excelMaxFormula}
                      onChange={(e) => setExcelMaxFormula(e.target.value)}
                      placeholder="e.g. =MAX(C2:C6) or 52000"
                      style={{ width: "100%", padding: "8px", border: "1px solid #cbd5e1", borderRadius: "6px" }}
                    />
                  </div>
                  <div>
                    <label style={{ display: "block", fontSize: "13px", fontWeight: "600", marginBottom: "4px" }}>Lowest Salary Formula =MIN(...) / सबसे कम वेतन</label>
                    <input
                      type="text"
                      value={excelMinFormula}
                      onChange={(e) => setExcelMinFormula(e.target.value)}
                      placeholder="e.g. =MIN(C2:C6) or 28000"
                      style={{ width: "100%", padding: "8px", border: "1px solid #cbd5e1", borderRadius: "6px" }}
                    />
                  </div>
                </div>
              </div>

              {/* SECTION C: MS WORD */}
              <div style={{ background: "#ffffff", borderRadius: "10px", padding: "24px", border: "1px solid #e2e8f0", marginBottom: "24px" }}>
                <div style={{ borderBottom: "2px solid #e2e8f0", paddingBottom: "10px", marginBottom: "16px", display: "flex", justifyContent: "space-between" }}>
                  <h3 style={{ fontSize: "17px", fontWeight: "700", color: "#0f172a", margin: 0 }}>
                    Section C – MS Word Practical Document Builder (15 Marks) / MS Word अभ्यास
                  </h3>
                  <span style={{ fontSize: "12px", fontWeight: "600", color: "#0284c7" }}>Automated Document Format Inspector</span>
                </div>

                <div style={{ marginBottom: "14px" }}>
                  <label style={{ display: "block", fontSize: "13px", fontWeight: "600", marginBottom: "4px" }}>Document Heading * / दस्तावेज़ का शीर्षक</label>
                  <input
                    type="text"
                    value={wordHeading}
                    onChange={(e) => setWordHeading(e.target.value)}
                    placeholder="Type heading: Furniture Manufacturing Company"
                    style={{ width: "100%", padding: "8px", border: "1px solid #cbd5e1", borderRadius: "6px" }}
                  />
                </div>

                <div style={{ display: "flex", gap: "12px", flexWrap: "wrap", marginBottom: "16px", background: "#f8fafc", padding: "10px", borderRadius: "6px" }}>
                  <label style={{ display: "flex", alignItems: "center", gap: "6px", fontSize: "13px", fontWeight: "600" }}>
                    <input type="checkbox" checked={wordHeadingBold} onChange={(e) => setWordHeadingBold(e.target.checked)} />
                    Bold Heading / मोटा शीर्षक
                  </label>

                  <div style={{ display: "flex", alignItems: "center", gap: "6px", fontSize: "13px", fontWeight: "600" }}>
                    Font Size / फ़ॉन्ट आकार:
                    <select value={wordHeadingFontSize} onChange={(e) => setWordHeadingFontSize(e.target.value)} style={{ padding: "4px 8px" }}>
                      <option value="12">12 pt</option>
                      <option value="14">14 pt</option>
                      <option value="18">18 pt (Required)</option>
                      <option value="24">24 pt</option>
                    </select>
                  </div>

                  <div style={{ display: "flex", alignItems: "center", gap: "6px", fontSize: "13px", fontWeight: "600" }}>
                    Alignment / संरेखन:
                    <select value={wordHeadingAlign} onChange={(e) => setWordHeadingAlign(e.target.value)} style={{ padding: "4px 8px" }}>
                      <option value="left">Left Aligned</option>
                      <option value="center">Center Aligned (Required)</option>
                      <option value="right">Right Aligned</option>
                    </select>
                  </div>

                  <label style={{ display: "flex", alignItems: "center", gap: "6px", fontSize: "13px", fontWeight: "600" }}>
                    <input type="checkbox" checked={wordPageNumbers} onChange={(e) => setWordPageNumbers(e.target.checked)} />
                    Add Page Numbers / पेज नंबर जोड़ें
                  </label>
                </div>

                {/* Table Insert Config */}
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "12px", marginBottom: "16px" }}>
                  <div>
                    <label style={{ display: "block", fontSize: "13px", fontWeight: "600", marginBottom: "4px" }}>Insert Table Columns (Required: 3)</label>
                    <input
                      type="number"
                      min="0"
                      value={wordTableCols}
                      onChange={(e) => setWordTableCols(Number(e.target.value))}
                      style={{ width: "100%", padding: "8px", border: "1px solid #cbd5e1", borderRadius: "6px" }}
                    />
                  </div>
                  <div>
                    <label style={{ display: "block", fontSize: "13px", fontWeight: "600", marginBottom: "4px" }}>Insert Table Rows (Required: 5)</label>
                    <input
                      type="number"
                      min="0"
                      value={wordTableRows}
                      onChange={(e) => setWordTableRows(Number(e.target.value))}
                      style={{ width: "100%", padding: "8px", border: "1px solid #cbd5e1", borderRadius: "6px" }}
                    />
                  </div>
                </div>

                {/* Live Document Preview Box */}
                <div style={{ background: "#ffffff", border: "2px dashed #cbd5e1", borderRadius: "8px", padding: "20px", minHeight: "120px" }}>
                  <div style={{ fontSize: "11px", color: "#94a3b8", marginBottom: "8px" }}>📄 DOCUMENT LIVE PREVIEW (CandidateName.docx)</div>
                  <div
                    style={{
                      fontWeight: wordHeadingBold ? "bold" : "normal",
                      fontSize: `${wordHeadingFontSize}px`,
                      textAlign: wordHeadingAlign as any,
                      color: "#0f172a",
                      marginBottom: "14px",
                    }}
                  >
                    {wordHeading || "[ Document Heading Will Appear Here ]"}
                  </div>

                  {wordTableCols > 0 && wordTableRows > 0 && (
                    <div style={{ border: "1px solid #94a3b8", borderRadius: "4px", padding: "8px", fontSize: "12px", color: "#334155" }}>
                      📊 Table Inserted: {wordTableCols} Columns × {wordTableRows} Rows
                    </div>
                  )}

                  {wordPageNumbers && (
                    <div style={{ textAlign: "right", fontSize: "10px", color: "#94a3b8", marginTop: "12px" }}>Page 1 of 1</div>
                  )}
                </div>
              </div>

              {/* SECTION D: PROFESSIONAL EMAIL WRITING */}
              <div style={{ background: "#ffffff", borderRadius: "10px", padding: "24px", border: "1px solid #e2e8f0", marginBottom: "24px" }}>
                <div style={{ borderBottom: "2px solid #e2e8f0", paddingBottom: "10px", marginBottom: "16px", display: "flex", justifyContent: "space-between" }}>
                  <h3 style={{ fontSize: "17px", fontWeight: "700", color: "#0f172a", margin: 0 }}>
                    Section D – Professional Email Writing (10 Marks) / व्यावसायिक ईमेल लेखन
                  </h3>
                  <span style={{ fontSize: "12px", fontWeight: "600", color: "#0284c7" }}>Automated NLP Grading Engine</span>
                </div>

                <p style={{ fontSize: "13px", color: "#64748b", marginTop: 0, marginBottom: "14px" }}>
                  <strong>Task / कार्य:</strong> Write an email to the HR Department requesting one day's leave due to a medical appointment. / HR विभाग को एक दिन की छुट्टी के लिए ईमेल लिखें।
                </p>

                <div style={{ marginBottom: "12px" }}>
                  <label style={{ display: "block", fontSize: "13px", fontWeight: "600", marginBottom: "4px" }}>To: / प्रापतकर्ता:</label>
                  <input type="text" readOnly value="hr.department@liinexus.com" style={{ width: "100%", padding: "8px", background: "#f1f5f9", border: "1px solid #cbd5e1", borderRadius: "6px", fontSize: "13px" }} />
                </div>

                <div style={{ marginBottom: "12px" }}>
                  <label style={{ display: "block", fontSize: "13px", fontWeight: "600", marginBottom: "4px" }}>Subject Line * / विषय:</label>
                  <input
                    type="text"
                    value={emailSubject}
                    onChange={(e) => setEmailSubject(e.target.value)}
                    placeholder="e.g. Leave Application for Medical Appointment - [Your Name]"
                    style={{ width: "100%", padding: "8px", border: "1px solid #cbd5e1", borderRadius: "6px", fontSize: "13px" }}
                  />
                </div>

                <div style={{ marginBottom: "16px" }}>
                  <label style={{ display: "block", fontSize: "13px", fontWeight: "600", marginBottom: "4px" }}>Email Body * / ईमेल का मुख्य लेख:</label>
                  <textarea
                    rows={6}
                    value={emailBody}
                    onChange={(e) => setEmailBody(e.target.value)}
                    placeholder="Dear HR Team, I am writing to request one day leave on..."
                    style={{ width: "100%", padding: "10px", border: "1px solid #cbd5e1", borderRadius: "6px", fontSize: "13px" }}
                  />
                </div>

                <button
                  type="button"
                  onClick={handleAutoSubmit}
                  disabled={isSubmitting}
                  style={{
                    width: "100%",
                    padding: "14px",
                    background: "#16a34a",
                    color: "#ffffff",
                    border: "none",
                    borderRadius: "6px",
                    fontWeight: "700",
                    fontSize: "16px",
                    cursor: "pointer",
                  }}
                >
                  {isSubmitting ? "Evaluating & Calculating Score..." : "🚀 Finish & Submit Assessment (100 Marks)"}
                </button>
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
}
