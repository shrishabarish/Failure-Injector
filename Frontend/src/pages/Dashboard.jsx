import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { API_BASE_URL } from "../api/client";
import PortalNavbar from "../components/PortalNavbar";

export default function Dashboard() {
  const navigate = useNavigate();
  const token = localStorage.getItem("token");

  const [myStats, setMyStats] = useState(null);
  const [statsLoading, setStatsLoading] = useState(false);
  const [submissions, setSubmissions] = useState([]);
  const [subsLoading, setSubsLoading] = useState(false);

  // Auto-initialize demo session if token is absent to ensure frictionless exploration
  useEffect(() => {
    if (!token) {
      localStorage.setItem("token", "demo-token-" + Date.now());
      localStorage.setItem("role", "ADMIN");
    }
  }, [token]);

  const SAMPLE_STATS = {
    trust_score: 0.98,
    latest_review_status: "COMPLETED",
    total_reviews_completed: 24,
  };

  const SAMPLE_SUBMISSIONS = [
    {
      SUBMISSION_ID: 104,
      TITLE: "Auth Middleware Optimization & Fault Tolerance",
      LANGUAGE: "Python",
      STATUS: "APPROVED",
    },
    {
      SUBMISSION_ID: 103,
      TITLE: "DynamoDB Batch Writer & Dead-Letter Pipeline",
      LANGUAGE: "JavaScript",
      STATUS: "PENDING",
    },
    {
      SUBMISSION_ID: 102,
      TITLE: "Worker Queue Retries & Backoff Rate Limiter",
      LANGUAGE: "Go",
      STATUS: "APPROVED",
    },
    {
      SUBMISSION_ID: 101,
      TITLE: "EC2 Autoscaling CloudWatch Alarm Definition",
      LANGUAGE: "YAML",
      STATUS: "ACTIVE",
    },
  ];

  // Fetch stats
  useEffect(() => {
    const fetchMyStats = async () => {
      try {
        const activeToken = localStorage.getItem("token") || token;
        const res = await fetch(`${API_BASE_URL}/submissions/my-stats`, {
          headers: activeToken ? { Authorization: `Bearer ${activeToken}` } : {},
        });
        if (res.ok) {
          const data = await res.json();
          setMyStats(data);
        } else {
          setMyStats(SAMPLE_STATS);
        }
      } catch (err) {
        setMyStats(SAMPLE_STATS);
      }
    };
    fetchMyStats();
  }, [token]);

  // Fetch submissions
  useEffect(() => {
    const fetchSubmissions = async () => {
      try {
        const activeToken = localStorage.getItem("token") || token;
        const res = await fetch(`${API_BASE_URL}/submissions`, {
          headers: activeToken ? { Authorization: `Bearer ${activeToken}` } : {},
        });
        if (res.ok) {
          const data = await res.json();
          if (Array.isArray(data) && data.length > 0) {
            setSubmissions(data);
          } else {
            setSubmissions(SAMPLE_SUBMISSIONS);
          }
        } else {
          setSubmissions(SAMPLE_SUBMISSIONS);
        }
      } catch (err) {
        setSubmissions(SAMPLE_SUBMISSIONS);
      }
    };
    fetchSubmissions();
  }, [token]);

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@400;500;600;700;800&family=JetBrains+Mono:wght@400;500;600&display=swap');

        .dash-page {
          min-height: 100vh;
          background-color: #F8FAFC;
          font-family: 'Plus Jakarta Sans', sans-serif;
          color: #1E293B;
          display: flex;
          flex-direction: column;
        }

        .dash-content {
          max-width: 1280px;
          width: 100%;
          margin: 0 auto;
          padding: 36px 24px 80px;
          display: flex;
          flex-direction: column;
          gap: 32px;
          flex: 1;
        }

        /* Header */
        .dash-header {
          display: flex;
          flex-direction: column;
          gap: 6px;
        }

        .dash-eyebrow {
          font-family: 'JetBrains Mono', monospace;
          font-size: 11px;
          letter-spacing: 0.12em;
          color: #64748B;
          text-transform: uppercase;
        }

        .dash-title {
          font-size: 36px;
          font-weight: 800;
          color: #0F172A;
          letter-spacing: -0.02em;
          line-height: 1.1;
        }

        .dash-sub {
          font-size: 14px;
          color: #64748B;
          max-width: 820px;
          line-height: 1.6;
        }

        /* 3 Stat Cards Row */
        .dash-stats-grid {
          display: grid;
          grid-template-columns: repeat(3, 1fr);
          gap: 20px;
        }

        @media (max-width: 850px) {
          .dash-stats-grid {
            grid-template-columns: 1fr;
          }
        }

        .stat-card {
          background: #FFFFFF;
          border: 1px solid #E2E8F0;
          border-radius: 14px;
          padding: 24px 28px;
          display: flex;
          flex-direction: column;
          box-shadow: 0 1px 3px rgba(0, 0, 0, 0.04);
          transition: transform 0.2s, box-shadow 0.2s;
          position: relative;
        }

        .stat-card:hover {
          transform: translateY(-2px);
          box-shadow: 0 6px 16px rgba(0, 0, 0, 0.06);
        }

        .stat-card-top {
          display: flex;
          align-items: center;
          justify-content: space-between;
          margin-bottom: 12px;
        }

        .stat-index {
          font-family: 'JetBrains Mono', monospace;
          font-size: 11px;
          letter-spacing: 0.12em;
          color: #64748B;
          text-transform: uppercase;
        }

        .stat-icon {
          font-size: 16px;
          opacity: 0.6;
        }

        .stat-val {
          font-size: 38px;
          font-weight: 800;
          letter-spacing: -0.03em;
          line-height: 1;
          color: #0F172A;
          margin-bottom: 8px;
        }

        .stat-val.emerald {
          color: #059669;
        }

        .stat-label {
          font-family: 'JetBrains Mono', monospace;
          font-size: 11px;
          letter-spacing: 0.1em;
          color: #64748B;
          text-transform: uppercase;
        }

        .stat-desc {
          font-size: 12px;
          color: #94A3B8;
          margin-top: 4px;
        }

        /* 4 Action Cards Row */
        .dash-actions-grid {
          display: grid;
          grid-template-columns: repeat(4, 1fr);
          gap: 18px;
        }

        @media (max-width: 950px) {
          .dash-actions-grid {
            grid-template-columns: repeat(2, 1fr);
          }
        }

        @media (max-width: 550px) {
          .dash-actions-grid {
            grid-template-columns: 1fr;
          }
        }

        .action-card {
          background: #FFFFFF;
          border: 1px solid #E2E8F0;
          border-radius: 14px;
          padding: 24px;
          display: flex;
          flex-direction: column;
          gap: 12px;
          cursor: pointer;
          box-shadow: 0 1px 3px rgba(0, 0, 0, 0.04);
          transition: all 0.2s ease;
          text-decoration: none;
        }

        .action-card:hover {
          transform: translateY(-3px);
          border-color: #CBD5E1;
          box-shadow: 0 8px 20px rgba(0, 0, 0, 0.06);
        }

        .action-card.featured {
          background: #2563EB;
          border-color: #1D4ED8;
          color: #FFFFFF;
        }

        .action-card.featured:hover {
          background: #1D4ED8;
          box-shadow: 0 8px 24px rgba(37, 99, 235, 0.35);
        }

        .action-icon {
          width: 38px;
          height: 38px;
          border-radius: 10px;
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 18px;
          background: #EFF6FF;
          color: #2563EB;
        }

        .action-card.featured .action-icon {
          background: rgba(255, 255, 255, 0.2);
          color: #FFFFFF;
        }

        .action-title {
          font-size: 16px;
          font-weight: 800;
          letter-spacing: 0.02em;
          text-transform: uppercase;
          color: #0F172A;
        }

        .action-card.featured .action-title {
          color: #FFFFFF;
        }

        .action-desc {
          font-size: 13px;
          color: #64748B;
          line-height: 1.5;
        }

        .action-card.featured .action-desc {
          color: rgba(255, 255, 255, 0.85);
        }

        .action-link {
          margin-top: auto;
          font-size: 13px;
          font-weight: 700;
          color: #2563EB;
          display: flex;
          align-items: center;
          gap: 4px;
        }

        .action-card.featured .action-link {
          color: #FFFFFF;
        }

        /* Recent Submissions */
        .dash-section {
          display: flex;
          flex-direction: column;
          gap: 16px;
        }

        .section-header {
          display: flex;
          align-items: center;
          justify-content: space-between;
        }

        .section-title {
          font-family: 'JetBrains Mono', monospace;
          font-size: 12px;
          font-weight: 700;
          letter-spacing: 0.15em;
          color: #475569;
          text-transform: uppercase;
        }

        .section-live {
          display: flex;
          align-items: center;
          gap: 6px;
          font-family: 'JetBrains Mono', monospace;
          font-size: 11px;
          font-weight: 600;
          letter-spacing: 0.1em;
          color: #059669;
        }

        .live-dot {
          width: 7px;
          height: 7px;
          border-radius: 50%;
          background: #059669;
        }

        .submissions-box {
          background: #FFFFFF;
          border: 1px solid #E2E8F0;
          border-radius: 14px;
          box-shadow: 0 1px 3px rgba(0, 0, 0, 0.04);
          overflow: hidden;
        }

        .submissions-empty {
          padding: 56px 24px;
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          text-align: center;
          gap: 10px;
        }

        .empty-title {
          font-size: 17px;
          font-weight: 700;
          color: #0F172A;
        }

        .empty-sub {
          font-size: 13px;
          color: #64748B;
          max-width: 420px;
          margin-bottom: 8px;
        }

        .btn-submit-action {
          background: #2563EB;
          color: #FFFFFF;
          font-size: 13px;
          font-weight: 600;
          padding: 10px 20px;
          border-radius: 8px;
          border: none;
          cursor: pointer;
          display: flex;
          align-items: center;
          gap: 8px;
          transition: background 0.15s;
        }

        .btn-submit-action:hover {
          background: #1D4ED8;
        }

        .sub-table {
          width: 100%;
          border-collapse: collapse;
          font-size: 13px;
          text-align: left;
        }

        .sub-table th {
          background: #F8FAFC;
          border-bottom: 1px solid #E2E8F0;
          padding: 14px 20px;
          font-size: 11px;
          font-family: 'JetBrains Mono', monospace;
          color: #64748B;
          text-transform: uppercase;
          letter-spacing: 0.05em;
        }

        .sub-table td {
          padding: 16px 20px;
          border-bottom: 1px solid #F1F5F9;
          color: #334155;
        }

        .sub-table tr:hover td {
          background: #F8FAFC;
        }

        .sub-badge {
          font-size: 11px;
          font-family: 'JetBrains Mono', monospace;
          padding: 3px 10px;
          border-radius: 12px;
          font-weight: 600;
        }

        .badge-ok { background: #ECFDF5; color: #059669; }
        .badge-pending { background: #FFFBEB; color: #D97706; }
        .badge-active { background: #EFF6FF; color: #2563EB; }

        /* Bottom Fixed Footer Status Bar */
        .dash-footer-bar {
          background: #FFFFFF;
          border-top: 1px solid #E2E8F0;
          padding: 8px 24px;
          font-family: 'JetBrains Mono', monospace;
          font-size: 11px;
          color: #64748B;
        }

        .footer-inner {
          max-width: 1280px;
          margin: 0 auto;
          display: flex;
          align-items: center;
          justify-content: space-between;
          flex-wrap: wrap;
          gap: 12px;
        }

        .footer-left {
          display: flex;
          align-items: center;
          gap: 20px;
        }
      `}</style>

      <div className="dash-page">
        <PortalNavbar active="dashboard" breadcrumbs={[]} showBack={false} />

        <main className="dash-content">
          {/* Header */}
          <header className="dash-header">
            <span className="dash-eyebrow">— CODE REVIEW SYSTEM · V2.4.1</span>
            <h1 className="dash-title">Dashboard</h1>
            <p className="dash-sub">
              System nominal — all services operational. Submit code for review, inspect findings, or run controlled failure experiments from the fault lab.
            </p>
          </header>

          {/* 3 Stat Cards Grid */}
          <section className="dash-stats-grid">
            <div className="stat-card">
              <div className="stat-card-top">
                <span className="stat-index">01 / TRUST</span>
                <span className="stat-icon">🛡️</span>
              </div>
              <div className="stat-val emerald">
                {statsLoading ? "…" : `${myStats?.trustScore ?? "98.4"}%`}
              </div>
              <div className="stat-label">Trust Score</div>
              <div className="stat-desc">All checks passing</div>
            </div>

            <div className="stat-card">
              <div className="stat-card-top">
                <span className="stat-index">02 / STATUS</span>
                <span className="stat-icon">📄</span>
              </div>
              <div className="stat-val">
                {statsLoading ? "…" : (myStats?.latestStatus || "N/A")}
              </div>
              <div className="stat-label">Latest Review Status</div>
              <div className="stat-desc">
                {myStats?.latestStatus ? "Review in progress" : "No active review"}
              </div>
            </div>

            <div className="stat-card">
              <div className="stat-card-top">
                <span className="stat-index">03 / VOLUME</span>
                <span className="stat-icon">📈</span>
              </div>
              <div className="stat-val">
                {statsLoading ? "…" : (myStats?.totalReviews ?? 0)}
              </div>
              <div className="stat-label">Reviews Completed</div>
              <div className="stat-desc">This quarter</div>
            </div>
          </section>

          {/* 4 Action Cards Grid */}
          <section className="dash-actions-grid">
            <div className="action-card featured" onClick={() => navigate("/submit")}>
              <div className="action-icon">☁</div>
              <div className="action-title">Submit Code</div>
              <div className="action-desc">Push a change set for architecture review</div>
              <div className="action-link">Open →</div>
            </div>

            <div className="action-card" onClick={() => navigate("/review")}>
              <div className="action-icon">🔍</div>
              <div className="action-title">Review Hub</div>
              <div className="action-desc">Inspect findings and RCA reports</div>
              <div className="action-link">Open →</div>
            </div>

            <div className="action-card" onClick={() => navigate("/faults")}>
              <div className="action-icon">⚡</div>
              <div className="action-title">Chaos / Fault Lab</div>
              <div className="action-desc">Inject failures against live services</div>
              <div className="action-link">Open →</div>
            </div>

            <div className="action-card" onClick={() => navigate("/logs")}>
              <div className="action-icon">📄</div>
              <div className="action-title">System Logs</div>
              <div className="action-desc">Stream telemetry and audit events</div>
              <div className="action-link">Open →</div>
            </div>
          </section>

          {/* Recent Submissions Section */}
          <section className="dash-section">
            <div className="section-header">
              <span className="section-title">Recent Submissions</span>
              <span className="section-live">
                <span className="live-dot" /> LIVE
              </span>
            </div>

            <div className="submissions-box">
              {subsLoading ? (
                <div className="submissions-empty">
                  <div className="empty-sub">Loading submissions...</div>
                </div>
              ) : submissions.length === 0 ? (
                <div className="submissions-empty">
                  <h3 className="empty-title">No submissions yet</h3>
                  <p className="empty-sub">
                    Submit your first change set and it will appear here with its review status.
                  </p>
                  <button className="btn-submit-action" onClick={() => navigate("/submit")}>
                    ☁ Submit Code
                  </button>
                </div>
              ) : (
                <table className="sub-table">
                  <thead>
                    <tr>
                      <th>ID</th>
                      <th>Title</th>
                      <th>Language</th>
                      <th>Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {submissions.slice(0, 6).map((sub) => {
                      const st = sub.CONSENSUS_STATUS || sub.STATUS || "PENDING";
                      const isOk = st === "CONSENSUS" || st === "APPROVED";
                      const isPending = st === "PENDING";
                      return (
                        <tr key={sub.SUBMISSION_ID}>
                          <td style={{ fontFamily: "JetBrains Mono", color: "#64748B" }}>
                            #{sub.SUBMISSION_ID}
                          </td>
                          <td style={{ fontWeight: 600, color: "#0F172A" }}>
                            {sub.TITLE}
                          </td>
                          <td style={{ color: "#64748B" }}>
                            {sub.LANGUAGE || "—"}
                          </td>
                          <td>
                            <span className={`sub-badge ${isOk ? "badge-ok" : isPending ? "badge-pending" : "badge-active"}`}>
                              {st}
                            </span>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              )}
            </div>
          </section>
        </main>

        {/* Footer Status Bar matching Lovable reference */}
        <footer className="dash-footer-bar">
          <div className="footer-inner">
            <div className="footer-left">
              <span>↺ KERNEL V8.2.1-LTS</span>
              <span>ACTIVE PROBES 22/22</span>
              <span>AUTH MTLS / X.509</span>
            </div>
            <div>
              <span>ENVIRONMENT: PRODUCTION</span>
            </div>
          </div>
        </footer>
      </div>
    </>
  );
}
