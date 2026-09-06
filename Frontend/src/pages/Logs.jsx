import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { API_BASE_URL } from "../api/client";
import PortalNavbar from "../components/PortalNavbar";

export default function Logs() {
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [errorMsg, setErrorMsg] = useState("");
  const [search, setSearch] = useState("");
  const [selectedModule, setSelectedModule] = useState("ALL");
  const [expandedRow, setExpandedRow] = useState(null);

  const navigate = useNavigate();

  const fetchLogs = async () => {
    const token = localStorage.getItem("token");
    if (!token) {
      navigate("/login");
      return;
    }

    setLoading(true);
    setErrorMsg("");
    try {
      const url = selectedModule !== "ALL"
        ? `${API_BASE_URL}/logs?module=${encodeURIComponent(selectedModule)}`
        : `${API_BASE_URL}/logs`;

      const res = await fetch(url, {
        headers: { Authorization: `Bearer ${token}` },
      });

      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.message || `HTTP ${res.status}: Failed to retrieve audit logs`);
      }

      const data = await res.json();
      setLogs(Array.isArray(data) ? data : []);
    } catch (err) {
      console.error("Error fetching logs:", err);
      setErrorMsg(err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchLogs();
  }, [selectedModule]);

  const filteredLogs = logs.filter((log) => {
    if (!search.trim()) return true;
    const q = search.toLowerCase();
    const user = String(log.userId || "").toLowerCase();
    const action = String(log.action || "").toLowerCase();
    const mod = String(log.module || "").toLowerCase();
    const details = typeof log.details === "object" ? JSON.stringify(log.details).toLowerCase() : String(log.details || "").toLowerCase();
    return user.includes(q) || action.includes(q) || mod.includes(q) || details.includes(q);
  });

  const getModuleBadge = (mod) => {
    const m = String(mod || "").toUpperCase();
    if (m.includes("FAULT")) return { bg: "#FEF2F2", text: "#DC2626", border: "#FECACA" };
    if (m.includes("AUTH")) return { bg: "#F5F3FF", text: "#7C3AED", border: "#DDD6FE" };
    if (m.includes("SUBMISSION")) return { bg: "#ECFDF5", text: "#059669", border: "#A7F3D0" };
    if (m.includes("REVIEW")) return { bg: "#EFF6FF", text: "#2563EB", border: "#BFDBFE" };
    return { bg: "#F1F5F9", text: "#475569", border: "#E2E8F0" };
  };

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@400;500;600;700;800&family=JetBrains+Mono:wght@400;500;600&display=swap');

        .logs-page {
          min-height: 100vh;
          background-color: #F8FAFC;
          font-family: 'Plus Jakarta Sans', sans-serif;
          color: #1E293B;
          display: flex;
          flex-direction: column;
        }

        .logs-container {
          max-width: 1280px;
          width: 100%;
          margin: 0 auto;
          padding: 36px 24px 80px;
          display: flex;
          flex-direction: column;
          gap: 24px;
          flex: 1;
        }

        .logs-header {
          display: flex;
          align-items: flex-end;
          justify-content: space-between;
          flex-wrap: wrap;
          gap: 16px;
        }

        .logs-eyebrow {
          font-family: 'JetBrains Mono', monospace;
          font-size: 11px;
          letter-spacing: 0.12em;
          color: #2563EB;
          font-weight: 700;
          text-transform: uppercase;
        }

        .logs-title {
          font-size: 32px;
          font-weight: 800;
          color: #0F172A;
          letter-spacing: -0.02em;
        }

        .logs-sub {
          font-size: 14px;
          color: #64748B;
          margin-top: 4px;
        }

        /* Toolbar */
        .logs-toolbar {
          background: #FFFFFF;
          border: 1px solid #E2E8F0;
          border-radius: 12px;
          padding: 16px 20px;
          display: flex;
          align-items: center;
          justify-content: space-between;
          flex-wrap: wrap;
          gap: 14px;
          box-shadow: 0 1px 3px rgba(0, 0, 0, 0.03);
        }

        .logs-search-box {
          display: flex;
          align-items: center;
          gap: 10px;
          flex: 1;
          min-width: 260px;
        }

        .logs-input {
          flex: 1;
          background: #FFFFFF;
          border: 1px solid #E2E8F0;
          color: #0F172A;
          padding: 8px 14px;
          border-radius: 8px;
          font-size: 13px;
          outline: none;
          transition: border-color 0.15s;
        }

        .logs-input:focus {
          border-color: #2563EB;
          box-shadow: 0 0 0 3px rgba(37, 99, 235, 0.1);
        }

        .logs-select {
          background: #FFFFFF;
          border: 1px solid #E2E8F0;
          color: #0F172A;
          padding: 8px 14px;
          border-radius: 8px;
          font-size: 13px;
          outline: none;
          cursor: pointer;
        }

        .logs-btn {
          background: #F8FAFC;
          border: 1px solid #E2E8F0;
          color: #334155;
          font-size: 12px;
          font-weight: 600;
          padding: 8px 14px;
          border-radius: 8px;
          cursor: pointer;
          transition: all 0.15s;
        }

        .logs-btn:hover {
          background: #F1F5F9;
          color: #0F172A;
        }

        /* Table Card */
        .logs-table-card {
          background: #FFFFFF;
          border: 1px solid #E2E8F0;
          border-radius: 14px;
          overflow: hidden;
          box-shadow: 0 1px 3px rgba(0, 0, 0, 0.04);
        }

        .logs-table {
          width: 100%;
          border-collapse: collapse;
          font-size: 13px;
          text-align: left;
        }

        .logs-table th {
          background: #F8FAFC;
          border-bottom: 1px solid #E2E8F0;
          padding: 14px 20px;
          font-size: 11px;
          font-family: 'JetBrains Mono', monospace;
          letter-spacing: 0.05em;
          color: #64748B;
          text-transform: uppercase;
        }

        .logs-table td {
          padding: 14px 20px;
          border-bottom: 1px solid #F1F5F9;
          color: #334155;
          vertical-align: top;
        }

        .logs-table tr:hover td {
          background: #F8FAFC;
        }

        .logs-badge {
          font-family: 'JetBrains Mono', monospace;
          font-size: 10px;
          letter-spacing: 0.05em;
          padding: 2px 8px;
          border-radius: 4px;
          font-weight: 700;
          display: inline-block;
        }

        .logs-empty {
          padding: 56px 20px;
          text-align: center;
          color: #64748B;
          font-size: 14px;
        }

        .logs-expand-btn {
          background: #F1F5F9;
          border: 1px solid #E2E8F0;
          color: #2563EB;
          font-family: inherit;
          font-size: 11px;
          font-weight: 600;
          padding: 3px 8px;
          border-radius: 4px;
          cursor: pointer;
        }

        .logs-details-box {
          background: #0F172A;
          color: #E2E8F0;
          border-radius: 6px;
          padding: 12px;
          margin-top: 8px;
          font-family: 'JetBrains Mono', monospace;
          font-size: 11px;
          white-space: pre-wrap;
          overflow-x: auto;
        }
      `}</style>

      <div className="logs-page">
        <PortalNavbar
          active="logs"
          breadcrumbs={[{ label: "System Logs" }]}
          backFallback="/dashboard"
        />

        <main className="logs-container">
          <div className="logs-header">
            <div>
              <span className="logs-eyebrow">— SECURITY &amp; TELEMETRY AUDIT —</span>
              <h1 className="logs-title">System Audit Logs</h1>
              <p className="logs-sub">
                Immutable operational event trail with correlation IDs and module telemetry
              </p>
            </div>

            <div style={{ display: "flex", gap: "10px" }}>
              <button
                className="logs-btn"
                onClick={() => navigate("/dashboard")}
              >
                ← Return to Dashboard
              </button>
              <button
                className="logs-btn"
                onClick={fetchLogs}
                disabled={loading}
              >
                {loading ? "Refreshing..." : "↻ Refresh Stream"}
              </button>
            </div>
          </div>

          {/* Search & Filter Toolbar */}
          <div className="logs-toolbar">
            <div className="logs-search-box">
              <span style={{ fontSize: "14px", color: "#64748B" }}>🔍</span>
              <input
                type="text"
                className="logs-input"
                placeholder="Filter by user, action, module, or payload..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
            </div>

            <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
              <span style={{ fontSize: "11px", fontWeight: 700, color: "#64748B", fontFamily: "JetBrains Mono" }}>MODULE:</span>
              <select
                className="logs-select"
                value={selectedModule}
                onChange={(e) => setSelectedModule(e.target.value)}
              >
                <option value="ALL">All Modules</option>
                <option value="AUTH">AUTH</option>
                <option value="SUBMISSIONS">SUBMISSIONS</option>
                <option value="REVIEWS">REVIEWS</option>
                <option value="FAULT_INJECTION">FAULT_INJECTION</option>
              </select>
            </div>
          </div>

          {errorMsg && (
            <div style={{ background: "#FEF2F2", border: "1px solid #FECACA", padding: "14px 20px", borderRadius: "8px", color: "#DC2626", fontSize: "13px" }}>
              ⚠ {errorMsg}
            </div>
          )}

          {/* Table */}
          <div className="logs-table-card">
            {loading ? (
              <div className="logs-empty">Streaming system logs from server telemetry...</div>
            ) : filteredLogs.length === 0 ? (
              <div className="logs-empty">
                No system logs match your filter criteria.
                <div style={{ marginTop: "6px", fontSize: "12px", color: "#94A3B8" }}>
                  Try resetting the search query or selecting 'All Modules'.
                </div>
              </div>
            ) : (
              <table className="logs-table">
                <thead>
                  <tr>
                    <th>Timestamp</th>
                    <th>Module</th>
                    <th>Action</th>
                    <th>User ID / Origin</th>
                    <th>Telemetry Payload</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredLogs.map((log, i) => {
                    const badge = getModuleBadge(log.module);
                    return (
                      <tr key={i}>
                        <td style={{ fontFamily: "JetBrains Mono", fontSize: "12px", color: "#64748B", whiteSpace: "nowrap" }}>
                          {new Date(log.timestamp).toLocaleString()}
                        </td>
                        <td>
                          <span
                            className="logs-badge"
                            style={{
                              background: badge.bg,
                              color: badge.text,
                              border: `1px solid ${badge.border}`
                            }}
                          >
                            {log.module || "SYSTEM"}
                          </span>
                        </td>
                        <td style={{ fontWeight: 600, color: "#0F172A" }}>
                          {log.action}
                        </td>
                        <td style={{ fontFamily: "JetBrains Mono", color: "#2563EB", fontSize: "12px" }}>
                          {log.userId || "anonymous"}
                        </td>
                        <td>
                          {log.details ? (
                            <div>
                              <button
                                className="logs-expand-btn"
                                onClick={() => setExpandedRow(expandedRow === i ? null : i)}
                              >
                                {expandedRow === i ? "▲ Hide Payload" : "▼ Show Payload"}
                              </button>
                              {expandedRow === i && (
                                <pre className="logs-details-box">
                                  {typeof log.details === "object"
                                    ? JSON.stringify(log.details, null, 2)
                                    : String(log.details)}
                                </pre>
                              )}
                            </div>
                          ) : (
                            <span style={{ color: "#CBD5E1" }}>—</span>
                          )}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            )}
          </div>
        </main>
      </div>
    </>
  );
}
