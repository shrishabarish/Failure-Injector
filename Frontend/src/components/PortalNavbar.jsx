import React, { useState, useEffect } from "react";
import { Link, useNavigate, useLocation } from "react-router-dom";
import { API_BASE_URL } from "../api/client";

export default function PortalNavbar({ active = "", breadcrumbs = [], showBack = true, backFallback = "/dashboard" }) {
  const navigate = useNavigate();
  const location = useLocation();

  const [faultCount, setFaultCount] = useState(0);
  const [systemHealth, setSystemHealth] = useState("HEALTHY");
  const [userRole, setUserRole] = useState("USER");
  const [userEmail, setUserEmail] = useState("");

  const currentPath = location.pathname;
  const activeTab = active || (
    currentPath.startsWith("/dashboard") ? "dashboard" :
    currentPath.startsWith("/submit") ? "submit" :
    currentPath.startsWith("/review") ? "review" :
    (currentPath.startsWith("/faults") || currentPath.startsWith("/failure-injection")) ? "faults" :
    currentPath.startsWith("/logs") ? "logs" : ""
  );

  useEffect(() => {
    const role = localStorage.getItem("role") || "USER";
    setUserRole(role);

    const token = localStorage.getItem("token");
    if (token) {
      try {
        const payload = JSON.parse(atob(token.split(".")[1]));
        if (payload.email) setUserEmail(payload.email);
        if (payload.role) setUserRole(payload.role);
      } catch (e) {}
    }
  }, []);

  useEffect(() => {
    let isMounted = true;

    const checkStatus = async () => {
      try {
        const healthRes = await fetch(`${API_BASE_URL.replace(/\/api$/, "")}/health`).catch(() => null);
        if (healthRes && isMounted) {
          setSystemHealth(healthRes.ok ? "HEALTHY" : "DEGRADED");
        }

        const apiKey = localStorage.getItem("admin_api_key") || "admin-fault-injection-secret-key";
        const token = localStorage.getItem("token");
        const faultRes = await fetch(`${API_BASE_URL}/fault/status`, {
          headers: {
            "x-api-key": apiKey,
            ...(token ? { Authorization: `Bearer ${token}` } : {})
          }
        }).catch(() => null);

        if (faultRes && faultRes.ok && isMounted) {
          const data = await faultRes.json();
          if (data.activeFaults) {
            let count = 0;
            if (data.activeFaults.dbDisconnect) count++;
            if (data.activeFaults.dbLatencyMs > 0) count++;
            if (data.activeFaults.apiErrors && Object.keys(data.activeFaults.apiErrors).length > 0) {
              count += Object.keys(data.activeFaults.apiErrors).length;
            }
            if (data.activeFaults.dependencyTimeoutMs > 0) count++;
            if (data.activeFaults.serviceUnhealthy) count++;
            setFaultCount(count);
          }
        }
      } catch (err) {}
    };

    checkStatus();
    const interval = setInterval(checkStatus, 8000);
    return () => {
      isMounted = false;
      clearInterval(interval);
    };
  }, []);

  const handleLogout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("role");
    navigate("/login");
  };

  const handleBack = () => {
    if (window.history.length > 2) {
      navigate(-1);
    } else {
      navigate(backFallback);
    }
  };

  return (
    <>
      <style>{`
        .pnav-container {
          position: sticky;
          top: 0;
          left: 0;
          right: 0;
          z-index: 100;
          background: #FFFFFF;
          border-bottom: 1px solid #E2E8F0;
          box-shadow: 0 1px 3px rgba(0, 0, 0, 0.04);
          font-family: 'Plus Jakarta Sans', sans-serif;
        }

        .pnav-main {
          max-width: 1320px;
          margin: 0 auto;
          padding: 0 24px;
          height: 64px;
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 16px;
        }

        .pnav-brand {
          display: flex;
          align-items: center;
          gap: 12px;
          text-decoration: none;
          color: inherit;
        }

        .pnav-logo-box {
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
          letter-spacing: -0.02em;
          box-shadow: 0 2px 6px rgba(37, 99, 235, 0.3);
        }

        .pnav-brand-text {
          display: flex;
          flex-direction: column;
        }

        .pnav-brand-title {
          font-size: 15px;
          font-weight: 800;
          color: #0F172A;
          letter-spacing: -0.01em;
          line-height: 1.1;
        }

        .pnav-brand-sub {
          font-family: 'JetBrains Mono', monospace;
          font-size: 9px;
          letter-spacing: 0.1em;
          color: #64748B;
          text-transform: uppercase;
          margin-top: 2px;
        }

        /* Nav links */
        .pnav-links {
          display: flex;
          align-items: center;
          gap: 4px;
          list-style: none;
          margin: 0;
          padding: 0;
        }

        .pnav-link {
          display: flex;
          align-items: center;
          gap: 8px;
          padding: 8px 14px;
          border-radius: 8px;
          font-size: 13px;
          font-weight: 500;
          text-decoration: none;
          color: #64748B;
          transition: all 0.15s ease;
        }

        .pnav-link:hover {
          color: #0F172A;
          background: #F8FAFC;
        }

        .pnav-link.active {
          color: #0F172A;
          background: #F1F5F9;
          font-weight: 600;
        }

        .pnav-link-icon {
          font-size: 14px;
          opacity: 0.85;
        }

        .pnav-fault-badge {
          background: #DC2626;
          color: white;
          font-size: 10px;
          font-weight: 700;
          padding: 1px 6px;
          border-radius: 10px;
          line-height: 1.3;
        }

        /* Right items */
        .pnav-actions {
          display: flex;
          align-items: center;
          gap: 12px;
        }

        .pnav-health-pill {
          display: flex;
          align-items: center;
          gap: 6px;
          padding: 6px 12px;
          border-radius: 20px;
          font-size: 11px;
          font-weight: 600;
          letter-spacing: 0.04em;
          text-decoration: none;
          transition: all 0.15s ease;
        }

        .pnav-health-pill.healthy {
          background: #ECFDF5;
          color: #059669;
          border: 1px solid #A7F3D0;
        }

        .pnav-health-pill.degraded {
          background: #FEF2F2;
          color: #DC2626;
          border: 1px solid #FECACA;
        }

        .pnav-health-dot {
          width: 7px;
          height: 7px;
          border-radius: 50%;
        }

        .pnav-health-pill.healthy .pnav-health-dot {
          background: #059669;
        }

        .pnav-health-pill.degraded .pnav-health-dot {
          background: #DC2626;
          animation: pnav-pulse 1.2s infinite;
        }

        @keyframes pnav-pulse {
          0%, 100% { opacity: 1; transform: scale(1); }
          50% { opacity: 0.5; transform: scale(1.15); }
        }

        .pnav-region {
          font-family: 'JetBrains Mono', monospace;
          font-size: 11px;
          color: #94A3B8;
        }

        .pnav-avatar {
          width: 32px;
          height: 32px;
          border-radius: 50%;
          background: #F1F5F9;
          border: 1px solid #E2E8F0;
          color: #475569;
          font-size: 11px;
          font-weight: 700;
          display: flex;
          align-items: center;
          justify-content: center;
        }

        .pnav-btn-back {
          background: #F8FAFC;
          border: 1px solid #E2E8F0;
          color: #334155;
          font-size: 12px;
          font-weight: 600;
          padding: 6px 12px;
          border-radius: 6px;
          cursor: pointer;
          display: flex;
          align-items: center;
          gap: 6px;
          transition: all 0.15s ease;
        }

        .pnav-btn-back:hover {
          background: #F1F5F9;
          border-color: #CBD5E1;
          color: #0F172A;
        }

        .pnav-btn-logout {
          background: transparent;
          border: 1px solid #FCA5A5;
          color: #DC2626;
          font-size: 11px;
          font-weight: 600;
          padding: 6px 12px;
          border-radius: 6px;
          cursor: pointer;
          transition: all 0.15s ease;
        }

        .pnav-btn-logout:hover {
          background: #FEF2F2;
          border-color: #EF4444;
        }

        /* Sub-bar / Breadcrumbs */
        .pnav-subbar {
          background: #F8FAFC;
          border-top: 1px solid #F1F5F9;
          border-bottom: 1px solid #E2E8F0;
          padding: 7px 24px;
        }

        .pnav-subbar-inner {
          max-width: 1320px;
          margin: 0 auto;
          display: flex;
          align-items: center;
          justify-content: space-between;
          font-size: 12px;
          color: #64748B;
        }

        .pnav-breadcrumbs {
          display: flex;
          align-items: center;
          gap: 8px;
          flex-wrap: wrap;
        }

        .pnav-crumb-item {
          display: flex;
          align-items: center;
          gap: 8px;
        }

        .pnav-crumb-link {
          color: #2563EB;
          text-decoration: none;
          font-weight: 500;
        }

        .pnav-crumb-link:hover {
          text-decoration: underline;
        }

        .pnav-crumb-current {
          color: #0F172A;
          font-weight: 600;
        }

        .pnav-quick-nav {
          display: flex;
          align-items: center;
          gap: 12px;
          font-size: 11px;
        }

        .pnav-quick-btn {
          color: #64748B;
          text-decoration: none;
          transition: color 0.15s;
        }

        .pnav-quick-btn:hover {
          color: #2563EB;
        }

        @media (max-width: 960px) {
          .pnav-links { display: none; }
          .pnav-region { display: none; }
        }
      `}</style>

      <header className="pnav-container">
        <div className="pnav-main">
          {/* Brand */}
          <Link to="/dashboard" className="pnav-brand">
            <div className="pnav-logo-box">CR</div>
            <div className="pnav-brand-text">
              <span className="pnav-brand-title">Anon Review</span>
              <span className="pnav-brand-sub">CLOUD ARCHITECTURE · V2.4</span>
            </div>
          </Link>

          {/* Navigation Items matching Lovable design */}
          <ul className="pnav-links">
            <li>
              <Link to="/dashboard" className={`pnav-link ${activeTab === "dashboard" ? "active" : ""}`}>
                <span className="pnav-link-icon">⊞</span> Dashboard
              </Link>
            </li>
            <li>
              <Link to="/submit" className={`pnav-link ${activeTab === "submit" ? "active" : ""}`}>
                <span className="pnav-link-icon">☁</span> Submit Code
              </Link>
            </li>
            <li>
              <Link to="/review" className={`pnav-link ${activeTab === "review" ? "active" : ""}`}>
                <span className="pnav-link-icon">🔍</span> Review Hub
              </Link>
            </li>
            <li>
              <Link to="/faults" className={`pnav-link ${activeTab === "faults" ? "active" : ""}`}>
                <span className="pnav-link-icon">⚡</span> Failure Injection
                {faultCount > 0 && (
                  <span className="pnav-fault-badge">
                    {faultCount}
                  </span>
                )}
              </Link>
            </li>
            <li>
              <Link to="/logs" className={`pnav-link ${activeTab === "logs" ? "active" : ""}`}>
                <span className="pnav-link-icon">📄</span> System Logs
              </Link>
            </li>
          </ul>

          {/* Right Actions */}
          <div className="pnav-actions">
            {/* Status Pill */}
            <Link
              to="/faults"
              className={`pnav-health-pill ${systemHealth === "HEALTHY" && faultCount === 0 ? "healthy" : "degraded"}`}
              title="Click to view Failure Injection Console"
            >
              <span className="pnav-health-dot" />
              {faultCount > 0 ? `FAULTS ACTIVE (${faultCount})` : systemHealth === "HEALTHY" ? "SYSTEM NOMINAL" : "DEGRADED"}
            </Link>

            {/* Region */}
            <span className="pnav-region">US-EAST-1</span>

            {/* User Avatar Circle */}
            <div className="pnav-avatar" title={`${userEmail || "Operator"} (${userRole})`}>
              {userRole === "ADMIN" ? "AD" : "OP"}
            </div>

            {/* Back Button */}
            {showBack && (
              <button className="pnav-btn-back" onClick={handleBack} title="Navigate Back">
                ← Back
              </button>
            )}

            {/* Logout */}
            <button className="pnav-btn-logout" onClick={handleLogout} title="Sign Out">
              Sign Out
            </button>
          </div>
        </div>

        {/* Sub-bar / Breadcrumbs */}
        {breadcrumbs.length > 0 && (
          <div className="pnav-subbar">
            <div className="pnav-subbar-inner">
              <div className="pnav-breadcrumbs">
                <Link to="/dashboard" className="pnav-crumb-link">Dashboard</Link>
                {breadcrumbs.map((b, i) => (
                  <span key={i} className="pnav-crumb-item">
                    <span style={{ color: "#CBD5E1" }}>/</span>
                    {b.path ? (
                      <Link to={b.path} className="pnav-crumb-link">{b.label}</Link>
                    ) : (
                      <span className="pnav-crumb-current">{b.label}</span>
                    )}
                  </span>
                ))}
              </div>

              <div className="pnav-quick-nav">
                <Link to="/dashboard" className="pnav-quick-btn">Dashboard</Link>
                <span style={{ color: "#E2E8F0" }}>•</span>
                <Link to="/submit" className="pnav-quick-btn">Submit Code</Link>
                <span style={{ color: "#E2E8F0" }}>•</span>
                <Link to="/faults" className="pnav-quick-btn">Fault Lab</Link>
              </div>
            </div>
          </div>
        )}
      </header>
    </>
  );
}
