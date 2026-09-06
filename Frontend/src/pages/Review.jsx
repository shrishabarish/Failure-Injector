import { API_BASE_URL } from "../api/client";
import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import PortalNavbar from "../components/PortalNavbar";

const DECISIONS = [
  { value: "approve",       label: "Approve",       color: "#059669", bg: "#ECFDF5", border: "#A7F3D0", icon: "✓" },
  { value: "minor_changes", label: "Minor Changes", color: "#D97706", bg: "#FFFBEB", border: "#FDE68A", icon: "~" },
  { value: "major_changes", label: "Major Changes", color: "#EA580C", bg: "#FFF7ED", border: "#FED7AA", icon: "!" },
  { value: "reject",        label: "Reject",        color: "#DC2626", bg: "#FEF2F2", border: "#FECACA", icon: "✕" },
];

const CONFIDENCE_LABELS = ["", "Uncertain", "Low", "Moderate", "High", "Very Confident"];

export default function Review() {
  const navigate = useNavigate();
  const token = localStorage.getItem("token");

  const [step, setStep] = useState("list");
  const [submissions, setSubmissions] = useState([]);
  const [listLoading, setListLoading] = useState(true);
  const [listError, setListError] = useState("");

  const [selected, setSelected] = useState(null);
  const [conflictDetected, setConflictDetected] = useState(false);

  const [review, setReview] = useState({ comment: "", decision: "", confidence: 3 });
  const [errors, setErrors] = useState({});
  const [charCount, setCharCount] = useState(0);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!token) navigate("/login");
  }, [token, navigate]);

  useEffect(() => {
    if (!token) return;
    const load = async () => {
      setListLoading(true);
      setListError("");
      try {
        let userId = null;
        try { userId = JSON.parse(atob(token.split(".")[1])).id; } catch {}
        const res = await fetch(`${API_BASE_URL}/submissions`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        if (!res.ok) throw new Error();
        const data = await res.json();
        setSubmissions(
          (Array.isArray(data) ? data : []).filter(
            (s) => userId == null || String(s.USER_ID) !== String(userId)
          )
        );
      } catch {
        setListError("Could not load submissions. Please ensure the backend is running.");
      } finally {
        setListLoading(false);
      }
    };
    load();
  }, [token]);

  const handleSelect = async (sub) => {
    try {
      const res = await fetch(`${API_BASE_URL}/submissions/${sub.SUBMISSION_ID}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = res.ok ? await res.json() : sub;
      setSelected({
        ...data,
        CODE: data.CODE || data.code
      });
    } catch {
      setSelected(sub);
    }

    try {
      const aRes = await fetch(
        `${API_BASE_URL}/submissions/${sub.SUBMISSION_ID}/analysis`,
        { headers: { Authorization: `Bearer ${token}` } }
      );
      if (aRes.ok) {
        const a = await aRes.json();
        setConflictDetected(a.CONSENSUS_STATUS === "CONFLICT");
      }
    } catch {}

    setStep("review");
    setReview({ comment: "", decision: "", confidence: 3 });
    setErrors({});
    setCharCount(0);
  };

  const handleDecision = (val) => {
    setReview((r) => ({ ...r, decision: val }));
    setErrors((e) => ({ ...e, decision: null }));
  };

  const handleComment = (e) => {
    setReview((r) => ({ ...r, comment: e.target.value }));
    setCharCount(e.target.value.length);
    if (e.target.value) setErrors((er) => ({ ...er, comment: null }));
  };

  const handleConfidence = (e) => {
    setReview((r) => ({ ...r, confidence: Number(e.target.value) }));
  };

  const handleSubmit = async () => {
    const newErrors = {};
    if (!review.decision) newErrors.decision = "Please select a decision.";
    if (!review.comment.trim()) newErrors.comment = "Please write constructive feedback.";
    if (Object.keys(newErrors).length) { setErrors(newErrors); return; }

    setLoading(true);
    try {
      const res = await fetch(`${API_BASE_URL}/reviews`, {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify({
          submission_id: selected.SUBMISSION_ID,
          rating: review.confidence,
          comments: `[${review.decision.toUpperCase()}] ${review.comment}`,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || "Review failed");
      setStep("done");
    } catch (err) {
      alert(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@400;500;600;700;800&family=JetBrains+Mono:wght@400;500;600&display=swap');

        .rv-page {
          min-height: 100vh;
          background-color: #F8FAFC;
          font-family: 'Plus Jakarta Sans', sans-serif;
          color: #1E293B;
          display: flex;
          flex-direction: column;
        }

        .rv-container {
          max-width: 1100px;
          width: 100%;
          margin: 0 auto;
          padding: 36px 24px 80px;
          display: flex;
          flex-direction: column;
          gap: 24px;
          flex: 1;
        }

        /* Top Progress Bar */
        .rv-steps {
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 12px;
          background: #FFFFFF;
          border: 1px solid #E2E8F0;
          border-radius: 12px;
          padding: 12px 20px;
          box-shadow: 0 1px 3px rgba(0, 0, 0, 0.03);
          font-family: 'JetBrains Mono', monospace;
          font-size: 11px;
          font-weight: 700;
          letter-spacing: 0.08em;
          color: #94A3B8;
        }

        .rv-step-pill {
          padding: 6px 14px;
          border-radius: 6px;
          transition: all 0.15s;
        }

        .rv-step-active {
          background: #EFF6FF;
          color: #2563EB;
          border: 1px solid #BFDBFE;
        }

        .rv-step-done {
          color: #059669;
        }

        .rv-header {
          display: flex;
          align-items: flex-end;
          justify-content: space-between;
          flex-wrap: wrap;
          gap: 16px;
        }

        .rv-title {
          font-size: 32px;
          font-weight: 800;
          color: #0F172A;
          letter-spacing: -0.02em;
        }

        .rv-sub {
          font-size: 14px;
          color: #64748B;
          margin-top: 4px;
        }

        /* List View */
        .rv-list {
          display: flex;
          flex-direction: column;
          gap: 12px;
        }

        .rv-list-item {
          background: #FFFFFF;
          border: 1px solid #E2E8F0;
          border-radius: 12px;
          padding: 20px 24px;
          display: flex;
          align-items: center;
          gap: 16px;
          cursor: pointer;
          box-shadow: 0 1px 3px rgba(0, 0, 0, 0.03);
          transition: all 0.15s ease;
        }

        .rv-list-item:hover {
          transform: translateY(-2px);
          border-color: #2563EB;
          box-shadow: 0 6px 16px rgba(37, 99, 235, 0.08);
        }

        .rv-item-id {
          font-family: 'JetBrains Mono', monospace;
          font-size: 12px;
          font-weight: 700;
          color: #2563EB;
          background: #EFF6FF;
          padding: 4px 8px;
          border-radius: 6px;
        }

        .rv-item-info {
          flex: 1;
        }

        .rv-item-title {
          font-size: 16px;
          font-weight: 700;
          color: #0F172A;
          margin-bottom: 2px;
        }

        .rv-item-meta {
          font-size: 12px;
          color: #64748B;
        }

        .rv-item-badge {
          font-family: 'JetBrains Mono', monospace;
          font-size: 11px;
          font-weight: 600;
          background: #F1F5F9;
          color: #475569;
          padding: 4px 10px;
          border-radius: 6px;
        }

        .rv-item-arrow {
          font-size: 18px;
          color: #94A3B8;
        }

        /* Review Card */
        .rv-card {
          background: #FFFFFF;
          border: 1px solid #E2E8F0;
          border-radius: 14px;
          padding: 28px;
          display: flex;
          flex-direction: column;
          gap: 20px;
          box-shadow: 0 1px 3px rgba(0, 0, 0, 0.04);
        }

        .rv-section-lbl {
          font-family: 'JetBrains Mono', monospace;
          font-size: 11px;
          font-weight: 700;
          letter-spacing: 0.08em;
          color: #64748B;
          text-transform: uppercase;
        }

        .rv-code-pre {
          background: #0F172A;
          color: #38BDF8;
          border-radius: 8px;
          padding: 18px;
          font-family: 'JetBrains Mono', monospace;
          font-size: 13px;
          line-height: 1.6;
          max-height: 350px;
          overflow: auto;
          white-space: pre-wrap;
        }

        .rv-decisions {
          display: grid;
          grid-template-columns: repeat(4, 1fr);
          gap: 12px;
        }

        @media (max-width: 700px) {
          .rv-decisions { grid-template-columns: repeat(2, 1fr); }
        }

        .rv-dec-btn {
          border: 1px solid #E2E8F0;
          background: #FFFFFF;
          padding: 14px;
          border-radius: 10px;
          font-size: 13px;
          font-weight: 700;
          color: #334155;
          cursor: pointer;
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 8px;
          transition: all 0.15s;
        }

        .rv-dec-btn:hover {
          transform: translateY(-1px);
          box-shadow: 0 4px 12px rgba(0, 0, 0, 0.05);
        }

        .rv-dec-btn.active {
          box-shadow: 0 0 0 2px currentColor;
        }

        .rv-textarea {
          width: 100%;
          min-height: 100px;
          border: 1px solid #E2E8F0;
          border-radius: 8px;
          padding: 12px 16px;
          font-family: 'Plus Jakarta Sans', sans-serif;
          font-size: 14px;
          outline: none;
          color: #0F172A;
          line-height: 1.5;
        }

        .rv-textarea:focus {
          border-color: #2563EB;
          box-shadow: 0 0 0 3px rgba(37, 99, 235, 0.1);
        }

        .rv-slider {
          width: 100%;
          accent-color: #2563EB;
          cursor: pointer;
        }

        .rv-actions {
          display: flex;
          justify-content: space-between;
          align-items: center;
          gap: 12px;
          margin-top: 10px;
        }

        .rv-btn-primary {
          background: #2563EB;
          color: #FFFFFF;
          font-size: 13px;
          font-weight: 700;
          padding: 12px 24px;
          border-radius: 8px;
          border: none;
          cursor: pointer;
          transition: background 0.15s;
        }

        .rv-btn-primary:hover {
          background: #1D4ED8;
        }

        .rv-btn-secondary {
          background: #F8FAFC;
          border: 1px solid #E2E8F0;
          color: #475569;
          font-size: 13px;
          font-weight: 600;
          padding: 12px 18px;
          border-radius: 8px;
          cursor: pointer;
        }

        .rv-btn-secondary:hover {
          background: #F1F5F9;
          color: #0F172A;
        }
      `}</style>

      <div className="rv-page">
        <PortalNavbar
          active="review"
          breadcrumbs={
            step === "review" && selected
              ? [{ label: "Review Hub", path: "#", onClick: () => setStep("list") }, { label: `#${selected.SUBMISSION_ID}` }]
              : [{ label: "Review Hub" }]
          }
          backFallback="/dashboard"
        />

        <main className="rv-container">
          {/* Progress Indicator */}
          <div className="rv-steps">
            <span className={`rv-step-pill ${step === "list" ? "rv-step-active" : "rv-step-done"}`}>
              01 · SELECT
            </span>
            <span>›</span>
            <span className={`rv-step-pill ${step === "review" ? "rv-step-active" : step === "done" ? "rv-step-done" : ""}`}>
              02 · REVIEW
            </span>
            <span>›</span>
            <span className={`rv-step-pill ${step === "done" ? "rv-step-active" : ""}`}>
              03 · DONE
            </span>
          </div>

          {/* STEP 1: SELECT SUBMISSION */}
          {step === "list" && (
            <>
              <div className="rv-header">
                <div>
                  <h1 className="rv-title">Choose a Submission</h1>
                  <p className="rv-sub">Select an anonymous code review request to inspect and rate</p>
                </div>
                <button className="rv-btn-secondary" onClick={() => navigate("/dashboard")}>
                  ← Back to Dashboard
                </button>
              </div>

              {listLoading ? (
                <div style={{ textAlign: "center", padding: "40px", color: "#64748B" }}>
                  Loading review queue...
                </div>
              ) : listError ? (
                <div style={{ background: "#FEF2F2", border: "1px solid #FECACA", padding: "16px", borderRadius: "8px", color: "#DC2626" }}>
                  ⚠ {listError}
                </div>
              ) : submissions.length === 0 ? (
                <div style={{ background: "#FFFFFF", border: "1px solid #E2E8F0", padding: "48px", borderRadius: "14px", textAlign: "center", color: "#64748B" }}>
                  <h3 style={{ color: "#0F172A", marginBottom: "6px" }}>No submissions available</h3>
                  <p>Check back later or submit your own code from the dashboard.</p>
                </div>
              ) : (
                <div className="rv-list">
                  {submissions.map((sub) => (
                    <div key={sub.SUBMISSION_ID} className="rv-list-item" onClick={() => handleSelect(sub)}>
                      <span className="rv-item-id">#{sub.SUBMISSION_ID}</span>
                      <div className="rv-item-info">
                        <div className="rv-item-title">{sub.TITLE || `Submission #${sub.SUBMISSION_ID}`}</div>
                        <div className="rv-item-meta">
                          Language: {sub.LANGUAGE || "General"} · Status: {sub.CONSENSUS_STATUS || sub.STATUS || "PENDING"}
                        </div>
                      </div>
                      <span className="rv-item-badge">{sub.LANGUAGE || "Code"}</span>
                      <span className="rv-item-arrow">→</span>
                    </div>
                  ))}
                </div>
              )}
            </>
          )}

          {/* STEP 2: REVIEW CODE */}
          {step === "review" && selected && (
            <>
              <div className="rv-header">
                <div>
                  <h1 className="rv-title">Review Submission #{selected.SUBMISSION_ID}</h1>
                  <p className="rv-sub">{selected.TITLE} · Anonymous Peer Evaluation</p>
                </div>
                <button className="rv-btn-secondary" onClick={() => setStep("list")}>
                  ← Back to Queue
                </button>
              </div>

              <div className="rv-card">
                <div>
                  <span className="rv-section-lbl">Submitted Code:</span>
                  <pre className="rv-code-pre">
                    {selected.CODE || selected.code || "(No code content available)"}
                  </pre>
                </div>

                <div>
                  <span className="rv-section-lbl">Select Decision:</span>
                  <div className="rv-decisions" style={{ marginTop: "8px" }}>
                    {DECISIONS.map((d) => {
                      const isSel = review.decision === d.value;
                      return (
                        <button
                          key={d.value}
                          className={`rv-dec-btn ${isSel ? "active" : ""}`}
                          style={{
                            borderColor: isSel ? d.color : "#E2E8F0",
                            background: isSel ? d.bg : "#FFFFFF",
                            color: isSel ? d.color : "#334155"
                          }}
                          onClick={() => handleDecision(d.value)}
                        >
                          <span>{d.icon}</span> {d.label}
                        </button>
                      );
                    })}
                  </div>
                  {errors.decision && (
                    <span style={{ color: "#DC2626", fontSize: "12px", marginTop: "4px", display: "block" }}>
                      ↑ {errors.decision}
                    </span>
                  )}
                </div>

                <div>
                  <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "6px" }}>
                    <span className="rv-section-lbl">Confidence Level:</span>
                    <span style={{ fontWeight: 700, color: "#2563EB", fontSize: "13px" }}>
                      {review.confidence} / 5 — {CONFIDENCE_LABELS[review.confidence]}
                    </span>
                  </div>
                  <input
                    type="range"
                    min="1"
                    max="5"
                    value={review.confidence}
                    onChange={handleConfidence}
                    className="rv-slider"
                  />
                </div>

                <div>
                  <span className="rv-section-lbl">Feedback Comments:</span>
                  <textarea
                    className="rv-textarea"
                    placeholder="Provide constructive review comments, architecture suggestions, or required fixes..."
                    value={review.comment}
                    onChange={handleComment}
                    style={{ marginTop: "6px" }}
                  />
                  {errors.comment && (
                    <span style={{ color: "#DC2626", fontSize: "12px", marginTop: "4px", display: "block" }}>
                      ↑ {errors.comment}
                    </span>
                  )}
                </div>

                <div className="rv-actions">
                  <button className="rv-btn-secondary" onClick={() => setStep("list")}>
                    Cancel
                  </button>
                  <button className="rv-btn-primary" onClick={handleSubmit} disabled={loading}>
                    {loading ? "Submitting..." : "Submit Review →"}
                  </button>
                </div>
              </div>
            </>
          )}

          {/* STEP 3: DONE */}
          {step === "done" && (
            <div style={{ background: "#FFFFFF", border: "1px solid #E2E8F0", borderRadius: "14px", padding: "56px 24px", textAlign: "center", display: "flex", flexDirection: "column", alignItems: "center", gap: "12px" }}>
              <div style={{ width: "48px", height: "48px", borderRadius: "50%", background: "#ECFDF5", color: "#059669", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "24px" }}>
                ✓
              </div>
              <h2 style={{ fontSize: "24px", fontWeight: 800, color: "#0F172A" }}>Review Submitted</h2>
              <p style={{ color: "#64748B", maxWidth: "420px", marginBottom: "12px" }}>
                Your anonymous feedback has been recorded and factored into consensus scoring.
              </p>
              <div style={{ display: "flex", gap: "10px" }}>
                <button className="rv-btn-secondary" onClick={() => setStep("list")}>
                  Review Another
                </button>
                <button className="rv-btn-primary" onClick={() => navigate("/dashboard")}>
                  Return to Dashboard
                </button>
              </div>
            </div>
          )}
        </main>
      </div>
    </>
  );
}
