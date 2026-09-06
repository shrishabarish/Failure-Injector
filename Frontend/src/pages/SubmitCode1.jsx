import { API_BASE_URL } from "../api/client";
import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import PortalNavbar from "../components/PortalNavbar";

export default function SubmitCode() {
  const navigate = useNavigate(); 
  const [form, setForm] = useState({ title: "", description: "", language: "", code: "" });
  const [lineCount, setLineCount] = useState(0);
  const [toast, setToast] = useState(false);
  const [toastMsg, setToastMsg] = useState("");
  const [btnError, setBtnError] = useState(false);
  const [loading, setLoading] = useState(false);

  const [tickerStats, setTickerStats] = useState([
    { label: "TRUST INDEX", val: "98.4%" },
    { label: "REVIEWS TODAY", val: "12" },
    { label: "AVG TURNAROUND", val: "4.2 MIN" },
    { label: "CONSENSUS RATE", val: "97.3%" },
    { label: "ACTIVE REVIEWERS", val: "8" },
    { label: "QUEUE DEPTH", val: "0" },
  ]);

  useEffect(() => {
    const token = localStorage.getItem("token");
    if (!token) return;

    const fetchStats = async () => {
      try {
        const statsRes = await fetch(`${API_BASE_URL}/submissions/my-stats`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        const stats = statsRes.ok ? await statsRes.json() : {};

        const subRes = await fetch(`${API_BASE_URL}/submissions`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        const subs = subRes.ok ? await subRes.json() : [];
        const pending = Array.isArray(subs)
          ? subs.filter((s) => s.STATUS === "PENDING" || s.CONSENSUS_STATUS === null).length
          : 0;

        setTickerStats([
          { label: "TRUST INDEX", val: stats.trustScore != null ? `${stats.trustScore}%` : "98.4%" },
          { label: "REVIEWS DONE", val: `${stats.totalReviews ?? 0}` },
          { label: "LATEST STATUS", val: stats.latestStatus || "N/A" },
          { label: "QUEUE DEPTH", val: `${pending}` },
          { label: "AVG TURNAROUND", val: "4.2 MIN" },
          { label: "CONSENSUS RATE", val: "97.3%" },
        ]);
      } catch (err) {
        console.error("Failed to fetch ticker stats", err);
      }
    };

    fetchStats();
  }, []);

  const handleChange = (e) => setForm({ ...form, [e.target.name]: e.target.value });

  const handleCodeChange = (e) => {
    setForm({ ...form, code: e.target.value });
    setLineCount(e.target.value ? e.target.value.split("\n").length : 0);
  };

  const resetForm = () => {
    setForm({ title: "", description: "", language: "", code: "" });
    setLineCount(0);
  };

  const showToast = (msg, isError = false) => {
    setToastMsg(msg);
    setToast(true);
    setTimeout(() => setToast(false), 3000);
  };

  const submitCode = async () => {
    if (!form.title.trim() || !form.code.trim()) {
      setBtnError(true);
      setTimeout(() => setBtnError(false), 2000);
      return;
    }

    const token = localStorage.getItem("token");
    if (!token) {
      alert("Please login first");
      navigate("/login");
      return;
    }

    setLoading(true);
    try {
      const formData = new FormData();
      formData.append("title", form.title);
      formData.append("description", form.description);
      formData.append("language", form.language);
      formData.append("code", form.code);

      const res = await fetch(`${API_BASE_URL}/submissions`, {
        method: "POST",
        headers: { Authorization: `Bearer ${token}` },
        body: formData,
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.message || "Submission failed");

      showToast("✓ Submitted successfully! Redirecting...");
      resetForm();

      setTimeout(() => {
        navigate("/dashboard");
      }, 1200);

    } catch (err) {
      console.error("SUBMIT ERROR:", err);
      showToast(`✗ ${err.message}`, true);
      setBtnError(true);
      setTimeout(() => setBtnError(false), 2000);
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@400;500;600;700;800&family=JetBrains+Mono:wght@400;500;600&display=swap');

        .sc-page {
          min-height: 100vh;
          background-color: #F8FAFC;
          font-family: 'Plus Jakarta Sans', sans-serif;
          color: #1E293B;
          display: flex;
          flex-direction: column;
        }

        .sc-container {
          max-width: 960px;
          width: 100%;
          margin: 0 auto;
          padding: 36px 24px 80px;
          display: flex;
          flex-direction: column;
          gap: 24px;
          flex: 1;
        }

        .sc-header {
          text-align: center;
          display: flex;
          flex-direction: column;
          gap: 6px;
        }

        .sc-eyebrow {
          font-family: 'JetBrains Mono', monospace;
          font-size: 11px;
          letter-spacing: 0.12em;
          color: #2563EB;
          font-weight: 700;
          text-transform: uppercase;
        }

        .sc-title {
          font-size: 32px;
          font-weight: 800;
          color: #0F172A;
          letter-spacing: -0.02em;
        }

        .sc-sub {
          font-size: 14px;
          color: #64748B;
        }

        /* Stats strip */
        .sc-ticker {
          background: #FFFFFF;
          border: 1px solid #E2E8F0;
          border-radius: 10px;
          padding: 10px 20px;
          display: flex;
          align-items: center;
          justify-content: space-around;
          flex-wrap: wrap;
          gap: 16px;
          box-shadow: 0 1px 3px rgba(0, 0, 0, 0.03);
        }

        .sc-tick-item {
          font-family: 'JetBrains Mono', monospace;
          font-size: 11px;
          color: #64748B;
          display: flex;
          align-items: center;
          gap: 6px;
        }

        .sc-tick-item span {
          color: #059669;
          font-weight: 700;
        }

        /* Form Card */
        .sc-card {
          background: #FFFFFF;
          border: 1px solid #E2E8F0;
          border-radius: 14px;
          padding: 32px;
          display: flex;
          flex-direction: column;
          gap: 20px;
          box-shadow: 0 1px 3px rgba(0, 0, 0, 0.04);
        }

        .sc-row {
          display: grid;
          grid-template-columns: 2fr 1fr;
          gap: 16px;
        }

        @media (max-width: 650px) {
          .sc-row { grid-template-columns: 1fr; }
        }

        .sc-field {
          display: flex;
          flex-direction: column;
          gap: 6px;
        }

        .sc-field label {
          font-size: 12px;
          font-weight: 700;
          color: #334155;
        }

        .sc-input, .sc-select, .sc-textarea {
          background: #FFFFFF;
          border: 1px solid #E2E8F0;
          border-radius: 8px;
          color: #0F172A;
          padding: 10px 14px;
          font-family: 'Plus Jakarta Sans', sans-serif;
          font-size: 14px;
          outline: none;
          transition: border-color 0.15s, box-shadow 0.15s;
          width: 100%;
        }

        .sc-input:focus, .sc-select:focus, .sc-textarea:focus {
          border-color: #2563EB;
          box-shadow: 0 0 0 3px rgba(37, 99, 235, 0.1);
        }

        .sc-textarea {
          resize: vertical;
          min-height: 85px;
          line-height: 1.5;
        }

        .sc-code-wrap {
          position: relative;
        }

        .sc-code {
          background: #0F172A;
          border: 1px solid #334155;
          border-radius: 8px;
          font-family: 'JetBrains Mono', monospace;
          font-size: 13px;
          color: #38BDF8;
          min-height: 220px;
          line-height: 1.6;
          padding: 16px;
          resize: vertical;
          width: 100%;
          outline: none;
        }

        .sc-code-badge {
          position: absolute;
          top: 10px;
          right: 14px;
          font-family: 'JetBrains Mono', monospace;
          font-size: 10px;
          font-weight: 600;
          color: #94A3B8;
          background: rgba(255, 255, 255, 0.1);
          padding: 2px 8px;
          border-radius: 4px;
        }

        .sc-divider {
          border: none;
          border-top: 1px solid #F1F5F9;
          margin: 6px 0;
        }

        .sc-actions {
          display: flex;
          gap: 12px;
          align-items: center;
        }

        .sc-btn-submit {
          flex: 1;
          background: #2563EB;
          color: #FFFFFF;
          font-size: 13px;
          font-weight: 700;
          padding: 12px 24px;
          border: none;
          border-radius: 8px;
          cursor: pointer;
          transition: background 0.15s;
        }

        .sc-btn-submit:hover {
          background: #1D4ED8;
        }

        .sc-btn-submit.error {
          background: #DC2626 !important;
        }

        .sc-btn-back {
          background: #F8FAFC;
          border: 1px solid #E2E8F0;
          color: #475569;
          font-size: 13px;
          font-weight: 600;
          padding: 12px 18px;
          border-radius: 8px;
          cursor: pointer;
          transition: all 0.15s;
        }

        .sc-btn-back:hover {
          background: #F1F5F9;
          color: #0F172A;
        }

        .sc-toast {
          position: fixed;
          bottom: 24px;
          right: 24px;
          background: #059669;
          color: #FFFFFF;
          padding: 12px 20px;
          border-radius: 8px;
          font-size: 13px;
          font-weight: 600;
          z-index: 9999;
          box-shadow: 0 10px 25px rgba(0, 0, 0, 0.1);
        }

        .sc-toast.error {
          background: #DC2626;
        }
      `}</style>

      <div className="sc-page">
        <PortalNavbar
          active="submit"
          breadcrumbs={[{ label: "Submit Code" }]}
          backFallback="/dashboard"
        />

        <main className="sc-container">
          <div className="sc-header">
            <span className="sc-eyebrow">— CODE REVIEW SYSTEM · V2.4.1 —</span>
            <h1 className="sc-title">Submit Code</h1>
            <p className="sc-sub">Share for anonymous review &amp; automated architecture evaluation</p>
          </div>

          <div className="sc-ticker">
            {tickerStats.map((t, i) => (
              <div key={i} className="sc-tick-item">
                {t.label}: <span>{t.val}</span>
              </div>
            ))}
          </div>

          <div className="sc-card">
            <div className="sc-row">
              <div className="sc-field">
                <label>Title *</label>
                <input
                  name="title"
                  className="sc-input"
                  placeholder="e.g. Distributed lock optimization in Redis"
                  value={form.title}
                  onChange={handleChange}
                />
              </div>
              <div className="sc-field">
                <label>Language</label>
                <select
                  name="language"
                  className="sc-select"
                  value={form.language}
                  onChange={handleChange}
                >
                  <option value="">Select language</option>
                  {["Python", "JavaScript", "TypeScript", "Go", "Java", "C++", "Rust", "SQL", "Other"].map((l) => (
                    <option key={l} value={l}>{l}</option>
                  ))}
                </select>
              </div>
            </div>

            <div className="sc-field">
              <label>Description</label>
              <textarea
                name="description"
                className="sc-textarea"
                placeholder="Describe your design choices, bottlenecks, or doubts..."
                value={form.description}
                onChange={handleChange}
              />
            </div>

            <div className="sc-field">
              <label>Code *</label>
              <div className="sc-code-wrap">
                <textarea
                  className="sc-code"
                  placeholder="// Paste your code snippet here..."
                  value={form.code}
                  onChange={handleCodeChange}
                />
                <div className="sc-code-badge">{lineCount} line{lineCount !== 1 ? "s" : ""}</div>
              </div>
            </div>

            <hr className="sc-divider" />

            <div className="sc-actions">
              <button className="sc-btn-back" onClick={() => navigate("/dashboard")}>
                ← Back to Dashboard
              </button>
              <button className="sc-btn-back" onClick={resetForm} disabled={loading}>
                Clear
              </button>
              <button
                className={`sc-btn-submit${btnError ? " error" : ""}`}
                onClick={submitCode}
                disabled={loading}
              >
                {loading ? "Submitting…" : btnError ? "! Title & Code Required" : "Submit for Review →"}
              </button>
            </div>
          </div>
        </main>

        {toast && (
          <div className={`sc-toast ${btnError ? "error" : ""}`}>
            {toastMsg}
          </div>
        )}
      </div>
    </>
  );
}
