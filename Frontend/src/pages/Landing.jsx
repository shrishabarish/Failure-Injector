import React from "react";
import { useNavigate, Link } from "react-router-dom";

export default function Landing() {
  const navigate = useNavigate();

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@400;500;600;700;800&family=JetBrains+Mono:wght@400;500;600&display=swap');

        .land-page {
          min-height: 100vh;
          background-color: #F8FAFC;
          font-family: 'Plus Jakarta Sans', sans-serif;
          color: #1E293B;
          display: flex;
          flex-direction: column;
        }

        .land-nav {
          height: 64px;
          background: #FFFFFF;
          border-bottom: 1px solid #E2E8F0;
          display: flex;
          align-items: center;
          justify-content: space-between;
          padding: 0 32px;
        }

        .land-brand {
          display: flex;
          align-items: center;
          gap: 12px;
          text-decoration: none;
        }

        .land-logo {
          width: 34px;
          height: 34px;
          background: #2563EB;
          color: #FFFFFF;
          border-radius: 8px;
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 13px;
          font-weight: 800;
        }

        .land-hero {
          max-width: 1000px;
          margin: 60px auto 40px;
          padding: 0 24px;
          text-align: center;
          display: flex;
          flex-direction: column;
          align-items: center;
          gap: 20px;
        }

        .land-badge {
          display: inline-flex;
          align-items: center;
          gap: 8px;
          background: #EFF6FF;
          border: 1px solid #BFDBFE;
          color: #2563EB;
          font-family: 'JetBrains Mono', monospace;
          font-size: 11px;
          font-weight: 700;
          padding: 6px 14px;
          border-radius: 20px;
          letter-spacing: 0.05em;
        }

        .land-title {
          font-size: clamp(36px, 5vw, 56px);
          font-weight: 800;
          color: #0F172A;
          letter-spacing: -0.03em;
          line-height: 1.1;
        }

        .land-title span {
          color: #2563EB;
        }

        .land-sub {
          font-size: 17px;
          color: #64748B;
          max-width: 680px;
          line-height: 1.6;
        }

        .land-btn-group {
          display: flex;
          gap: 14px;
          margin-top: 10px;
        }

        .land-btn-primary {
          background: #2563EB;
          color: #FFFFFF;
          font-size: 15px;
          font-weight: 700;
          padding: 14px 28px;
          border-radius: 10px;
          border: none;
          cursor: pointer;
          transition: all 0.15s ease;
          box-shadow: 0 4px 14px rgba(37, 99, 235, 0.3);
        }

        .land-btn-primary:hover {
          background: #1D4ED8;
          transform: translateY(-2px);
          box-shadow: 0 6px 20px rgba(37, 99, 235, 0.4);
        }

        .land-btn-secondary {
          background: #FFFFFF;
          border: 1px solid #CBD5E1;
          color: #334155;
          font-size: 15px;
          font-weight: 600;
          padding: 14px 24px;
          border-radius: 10px;
          cursor: pointer;
          transition: all 0.15s ease;
        }

        .land-btn-secondary:hover {
          background: #F1F5F9;
          color: #0F172A;
        }

        /* Features grid */
        .land-features {
          max-width: 1100px;
          margin: 40px auto 80px;
          padding: 0 24px;
          display: grid;
          grid-template-columns: repeat(3, 1fr);
          gap: 20px;
        }

        @media (max-width: 750px) {
          .land-features { grid-template-columns: 1fr; }
        }

        .feature-card {
          background: #FFFFFF;
          border: 1px solid #E2E8F0;
          border-radius: 14px;
          padding: 28px;
          display: flex;
          flex-direction: column;
          gap: 10px;
          box-shadow: 0 1px 3px rgba(0, 0, 0, 0.04);
        }

        .feature-icon {
          width: 40px;
          height: 40px;
          background: #EFF6FF;
          color: #2563EB;
          border-radius: 10px;
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 20px;
          margin-bottom: 6px;
        }

        .feature-title {
          font-size: 16px;
          font-weight: 700;
          color: #0F172A;
        }

        .feature-desc {
          font-size: 13px;
          color: #64748B;
          line-height: 1.5;
        }
      `}</style>

      <div className="land-page">
        <header className="land-nav">
          <Link to="/" className="land-brand">
            <div className="land-logo">CR</div>
            <span style={{ fontWeight: 800, fontSize: "16px", color: "#0F172A" }}>Anon Review</span>
          </Link>

          <div style={{ display: "flex", gap: "10px" }}>
            <button className="land-btn-secondary" style={{ padding: "8px 16px", fontSize: "13px" }} onClick={() => navigate("/login")}>
              Sign In
            </button>
            <button className="land-btn-primary" style={{ padding: "8px 16px", fontSize: "13px" }} onClick={() => navigate("/dashboard")}>
              Open Portal →
            </button>
          </div>
        </header>

        <main className="land-hero">
          <div className="land-badge">
            <span>●</span> CLOUD-NATIVE ARCHITECTURE REVIEW PLATFORM
          </div>

          <h1 className="land-title">
            Anonymous Peer Review &amp; <span>Chaos Engineering</span>
          </h1>

          <p className="land-sub">
            Collaborative code reviews with intelligent consensus scoring and a built-in fault injection lab for live RCA telemetry and incident analysis.
          </p>

          <div className="land-btn-group">
            <button className="land-btn-primary" onClick={() => navigate("/dashboard")}>
              Launch Dashboard →
            </button>
            <button className="land-btn-secondary" onClick={() => navigate("/faults")}>
              ⚡ Chaos / Fault Lab
            </button>
          </div>
        </main>

        <section className="land-features">
          <div className="feature-card">
            <div className="feature-icon">☁</div>
            <h3 className="feature-title">Anonymous Code Reviews</h3>
            <p className="feature-desc">
              Submit change sets for unbiased, confidential peer evaluation with automated consensus metrics.
            </p>
          </div>

          <div className="feature-card">
            <div className="feature-icon">⚡</div>
            <h3 className="feature-title">Chaos &amp; Fault Lab</h3>
            <p className="feature-desc">
              Simulate outages, database query latency, and HTTP 500 errors against EC2, DynamoDB, Auth, Worker, API, and Application targets.
            </p>
          </div>

          <div className="feature-card">
            <div className="feature-icon">📄</div>
            <h3 className="feature-title">Live Audit Telemetry</h3>
            <p className="feature-desc">
              Stream correlation IDs, trace incident logs, and monitor system health in real-time.
            </p>
          </div>
        </section>
      </div>
    </>
  );
}