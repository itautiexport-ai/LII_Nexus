import { FormEvent, useEffect, useState } from "react";
import { performanceApi, ReviewRecord } from "../api/performanceApi";
import { useMyEmployee } from "../hooks/useMyEmployee";

const statusLabel: Record<ReviewRecord["status"], string> = {
  self_pending: "Awaiting your self-assessment",
  manager_pending: "Awaiting manager assessment",
  completed: "Completed",
};

export default function ReviewsPage() {
  const { employee, loading: loadingEmployee } = useMyEmployee();
  const [myReviews, setMyReviews] = useState<ReviewRecord[]>([]);
  const [managedReviews, setManagedReviews] = useState<ReviewRecord[]>([]);
  const [selfDrafts, setSelfDrafts] = useState<Record<string, string>>({});
  const [managerDrafts, setManagerDrafts] = useState<Record<string, { summary: string; score: string }>>({});
  const [error, setError] = useState<string | null>(null);

  async function load() {
    const [mine, managed] = await Promise.all([performanceApi.listMyReviews(), performanceApi.listReviewsIManage()]);
    setMyReviews(mine);
    setManagedReviews(managed);
  }
  useEffect(() => { if (employee) load(); }, [employee]);

  async function handleInitiate() {
    if (!employee) return;
    setError(null);
    try {
      await performanceApi.initiateReview(employee.id);
      await load();
    } catch (err: any) {
      setError(err?.response?.data?.error?.message ?? "Failed to initiate review.");
    }
  }

  async function handleSubmitSelf(e: FormEvent, reviewId: string) {
    e.preventDefault();
    const summary = selfDrafts[reviewId];
    if (!summary) return;
    try {
      await performanceApi.submitSelfAssessment(reviewId, summary);
      await load();
    } catch (err: any) {
      alert(err?.response?.data?.error?.message ?? "Failed to submit self-assessment.");
    }
  }

  async function handleSubmitManager(e: FormEvent, reviewId: string) {
    e.preventDefault();
    const draft = managerDrafts[reviewId];
    if (!draft?.summary || !draft?.score) return;
    try {
      await performanceApi.submitManagerAssessment(reviewId, draft.summary, Number(draft.score));
      await load();
    } catch (err: any) {
      alert(err?.response?.data?.error?.message ?? "Failed to submit manager assessment.");
    }
  }

  if (loadingEmployee) return <p>Loading...</p>;
  if (!employee) {
    return (
      <div>
        <h1 style={{ fontSize: 20 }}>My Reviews</h1>
        <p style={{ color: "#777" }}>Your login isn't linked to an Employee Master record yet. Ask an admin to link it first.</p>
      </div>
    );
  }

  return (
    <div>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <h1 style={{ fontSize: 20 }}>My Reviews</h1>
        <button onClick={handleInitiate}>+ Initiate Review</button>
      </div>
      {error && <p style={{ color: "crimson", fontSize: 13 }}>{error}</p>}

      <div style={{ marginTop: 16 }}>
        {myReviews.length === 0 && <p style={{ color: "#777" }}>No reviews yet.</p>}
        {myReviews.map((r) => (
          <div key={r.id} style={{ border: "1px solid #ddd", padding: 16, marginBottom: 12, maxWidth: 560 }}>
            <div style={{ display: "flex", justifyContent: "space-between" }}>
              <strong>{statusLabel[r.status]}</strong>
              {r.overallScore !== null && <span>Overall score: <strong>{r.overallScore}</strong></span>}
            </div>

            {r.status === "self_pending" && (
              <form onSubmit={(e) => handleSubmitSelf(e, r.id)} style={{ marginTop: 8 }}>
                <textarea
                  placeholder="Write your self-assessment..."
                  required
                  rows={3}
                  value={selfDrafts[r.id] ?? ""}
                  onChange={(e) => setSelfDrafts({ ...selfDrafts, [r.id]: e.target.value })}
                  style={{ width: "100%", padding: 6, marginBottom: 8 }}
                />
                <button type="submit">Submit self-assessment</button>
              </form>
            )}

            {r.status !== "self_pending" && r.selfSummary && (
              <p style={{ fontSize: 13, marginTop: 8 }}><em>Your self-assessment:</em> {r.selfSummary}</p>
            )}
            {r.status === "completed" && (
              <>
                <p style={{ fontSize: 13 }}><em>Manager feedback:</em> {r.managerSummary}</p>
                <p style={{ fontSize: 13 }}>Goal-driven score: {r.goalScore ?? "—"} · Manager score: {r.managerScore ?? "—"}</p>
              </>
            )}
          </div>
        ))}
      </div>

      <h2 style={{ fontSize: 18, marginTop: 32 }}>Reviews I Manage</h2>
      <div style={{ marginTop: 8 }}>
        {managedReviews.length === 0 && <p style={{ color: "#777" }}>No direct reports' reviews pending.</p>}
        {managedReviews.map((r) => (
          <div key={r.id} style={{ border: "1px solid #ddd", padding: 16, marginBottom: 12, maxWidth: 560 }}>
            <strong>{statusLabel[r.status]}</strong>
            {r.selfSummary && <p style={{ fontSize: 13, marginTop: 8 }}><em>Employee's self-assessment:</em> {r.selfSummary}</p>}

            {r.status === "manager_pending" && (
              <form onSubmit={(e) => handleSubmitManager(e, r.id)} style={{ marginTop: 8 }}>
                <textarea
                  placeholder="Manager assessment..."
                  required
                  rows={3}
                  value={managerDrafts[r.id]?.summary ?? ""}
                  onChange={(e) => setManagerDrafts({ ...managerDrafts, [r.id]: { ...managerDrafts[r.id], summary: e.target.value, score: managerDrafts[r.id]?.score ?? "" } })}
                  style={{ width: "100%", padding: 6, marginBottom: 8 }}
                />
                <input
                  type="number" min={0} max={100} placeholder="Score (0-100)" required
                  value={managerDrafts[r.id]?.score ?? ""}
                  onChange={(e) => setManagerDrafts({ ...managerDrafts, [r.id]: { ...managerDrafts[r.id], score: e.target.value, summary: managerDrafts[r.id]?.summary ?? "" } })}
                  style={{ padding: 6, marginBottom: 8, marginRight: 8, width: 140 }}
                />
                <button type="submit">Submit manager assessment</button>
              </form>
            )}

            {r.status === "completed" && (
              <p style={{ fontSize: 13, marginTop: 8 }}>
                Goal-driven score: {r.goalScore ?? "—"} · Manager score: {r.managerScore ?? "—"} · Overall: <strong>{r.overallScore ?? "—"}</strong>
              </p>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
