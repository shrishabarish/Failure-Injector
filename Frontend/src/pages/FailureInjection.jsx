import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { API_BASE_URL } from "../api/client";
import PortalNavbar from "../components/PortalNavbar";

export default function FailureInjection() {
  const navigate = useNavigate();
  const [apiKey, setApiKey] = useState(localStorage.getItem("admin_api_key") || "admin-fault-injection-secret-key");
  const [loadingStatus, setLoadingStatus] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);
  const [toast, setToast] = useState({ show: false, msg: "", isError: false });
  const [eventLogs, setEventLogs] = useState([
    { time: new Date().toLocaleTimeString(), type: "SYSTEM", msg: "Chaos Engineering & Fault Injection Console initialized." }
  ]);

  const addLog = (type, msg) => {
    setEventLogs((prev) => [
      { time: new Date().toLocaleTimeString(), type, msg },
      ...prev.slice(0, 50),
    ]);
  };

  const showToastMsg = (msg, isError = false) => {
    setToast({ show: true, msg, isError });
    setTimeout(() => setToast({ show: false, msg: "", isError: false }), 3500);
  };

  const getHeaders = () => {
    const token = localStorage.getItem("token");
    return {
      "Content-Type": "application/json",
      "x-api-key": apiKey,
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    };
  };

  const fetchStatus = async () => {
    setLoadingStatus(false);
  };

  useEffect(() => {
    fetchStatus();
    const interval = setInterval(fetchStatus, 6000);
    return () => clearInterval(interval);
  }, [apiKey]);

  const handleInject = async (type, targetService, payload = {}) => {
    setActionLoading(true);
    const bodyPayload = { type, targetService, ...payload };
    try {
      const res = await fetch(`${API_BASE_URL}/fault/inject`, {
        method: "POST",
        headers: getHeaders(),
        body: JSON.stringify(bodyPayload),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.message || data.error || "Injection failed");

      addLog("SUCCESS", `Injected '${type}' on Target: [${targetService}] -> ${JSON.stringify(payload)}`);
      showToastMsg(`Injected '${type}' on ${targetService}`);
    } catch (err) {
      addLog("ERROR", `Failed injecting '${type}' on [${targetService}]: ${err.message}`);
      showToastMsg(`Injection failed: ${err.message}`, true);
    } finally {
      setActionLoading(false);
    }
  };

  const handleReset = async () => {
    setActionLoading(true);
    try {
      const res = await fetch(`${API_BASE_URL}/fault/reset`, {
        method: "POST",
        headers: getHeaders(),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || data.error || "Reset failed");

      addLog("RESET", "All injected faults cleared across all Target Services.");
      showToastMsg("System fully restored to normal!");
    } catch (err) {
      addLog("ERROR", `Reset failed: ${err.message}`);
      showToastMsg(`Reset failed: ${err.message}`, true);
    } finally {
      setActionLoading(false);
    }
  };

  return (
    <div style={{ backgroundColor: "#F8FAFC", minHeight: "100vh", fontFamily: "'Inter', sans-serif" }}>
      <PortalNavbar />
      
      {toast.show && (
        <div style={{ position: "fixed", top: "80px", right: "20px", background: toast.isError ? "#EF4444" : "#10B981", color: "white", padding: "12px 20px", borderRadius: "8px", boxShadow: "0 4px 6px -1px rgba(0,0,0,0.1)", zIndex: 9999, fontWeight: 500 }}>
          {toast.msg}
        </div>
      )}

      <main style={{ maxWidth: "1200px", margin: "0 auto", padding: "2rem" }}>
        
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "2rem" }}>
          <div>
            <h1 style={{ fontSize: "2rem", fontWeight: 800, color: "#0F172A", margin: 0 }}>Chaos Engineering</h1>
            <p style={{ color: "#64748B", margin: "0.5rem 0 0 0" }}>Inject targeted failures and observe AWS CloudWatch telemetery live.</p>
          </div>
          
          <button 
            onClick={handleReset} 
            disabled={actionLoading}
            style={{ backgroundColor: "#10B981", color: "white", padding: "0.75rem 1.5rem", borderRadius: "8px", border: "none", fontWeight: 600, fontSize: "1.1rem", cursor: "pointer", boxShadow: "0 4px 6px -1px rgba(16, 185, 129, 0.4)", display: "flex", alignItems: "center", gap: "0.5rem" }}>
            <span style={{ fontSize: "1.2rem" }}>⛑️</span> HEAL SYSTEM (RESET)
          </button>
        </div>

        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))", gap: "1.5rem", marginBottom: "2rem" }}>
          
          {/* Scenario 1: EC2 Overload */}
          <div style={{ background: "white", padding: "1.5rem", borderRadius: "12px", boxShadow: "0 1px 3px rgba(0,0,0,0.1)", borderTop: "4px solid #3B82F6" }}>
            <div style={{ display: "flex", alignItems: "center", gap: "1rem", marginBottom: "1rem" }}>
              <div style={{ background: "#EFF6FF", color: "#3B82F6", padding: "0.75rem", borderRadius: "8px", fontSize: "1.5rem" }}>🖥️</div>
              <h2 style={{ fontSize: "1.25rem", margin: 0, color: "#1E293B", fontWeight: 700 }}>EC2 Overload</h2>
            </div>
            <p style={{ color: "#64748B", fontSize: "0.9rem", marginBottom: "1.5rem", lineHeight: 1.5 }}>Simulates a CPU spike causing a service crash loop. Triggers EC2 alarms.</p>
            <button onClick={() => handleInject("service_unhealthy", "EC2")} disabled={actionLoading} style={{ width: "100%", padding: "0.75rem", borderRadius: "6px", border: "1px solid #E2E8F0", background: "#F8FAFC", color: "#0F172A", fontWeight: 600, cursor: "pointer" }}>Inject EC2 Crash</button>
          </div>

          {/* Scenario 2: DynamoDB Throttle */}
          <div style={{ background: "white", padding: "1.5rem", borderRadius: "12px", boxShadow: "0 1px 3px rgba(0,0,0,0.1)", borderTop: "4px solid #10B981" }}>
            <div style={{ display: "flex", alignItems: "center", gap: "1rem", marginBottom: "1rem" }}>
              <div style={{ background: "#ECFDF5", color: "#10B981", padding: "0.75rem", borderRadius: "8px", fontSize: "1.5rem" }}>🗄️</div>
              <h2 style={{ fontSize: "1.25rem", margin: 0, color: "#1E293B", fontWeight: 700 }}>DynamoDB Outage</h2>
            </div>
            <p style={{ color: "#64748B", fontSize: "0.9rem", marginBottom: "1.5rem", lineHeight: 1.5 }}>Simulates a complete database connection drop and capacity throttle.</p>
            <button onClick={() => handleInject("db_disconnect", "DynamoDB")} disabled={actionLoading} style={{ width: "100%", padding: "0.75rem", borderRadius: "6px", border: "1px solid #E2E8F0", background: "#F8FAFC", color: "#0F172A", fontWeight: 600, cursor: "pointer" }}>Inject DB Disconnect</button>
          </div>

          {/* Scenario 3: Auth Provider Outage */}
          <div style={{ background: "white", padding: "1.5rem", borderRadius: "12px", boxShadow: "0 1px 3px rgba(0,0,0,0.1)", borderTop: "4px solid #8B5CF6" }}>
            <div style={{ display: "flex", alignItems: "center", gap: "1rem", marginBottom: "1rem" }}>
              <div style={{ background: "#F5F3FF", color: "#8B5CF6", padding: "0.75rem", borderRadius: "8px", fontSize: "1.5rem" }}>🔐</div>
              <h2 style={{ fontSize: "1.25rem", margin: 0, color: "#1E293B", fontWeight: 700 }}>Auth Outage</h2>
            </div>
            <p style={{ color: "#64748B", fontSize: "0.9rem", marginBottom: "1.5rem", lineHeight: 1.5 }}>Simulates a JWKS certificate expiry causing 401 Unauthorized errors.</p>
            <button onClick={() => handleInject("api_error", "Auth", { statusCode: 401, message: "Token Expired" })} disabled={actionLoading} style={{ width: "100%", padding: "0.75rem", borderRadius: "6px", border: "1px solid #E2E8F0", background: "#F8FAFC", color: "#0F172A", fontWeight: 600, cursor: "pointer" }}>Inject Auth Failure</button>
          </div>

          {/* Scenario 4: Worker Queue Crash */}
          <div style={{ background: "white", padding: "1.5rem", borderRadius: "12px", boxShadow: "0 1px 3px rgba(0,0,0,0.1)", borderTop: "4px solid #F59E0B" }}>
            <div style={{ display: "flex", alignItems: "center", gap: "1rem", marginBottom: "1rem" }}>
              <div style={{ background: "#FFFBEB", color: "#F59E0B", padding: "0.75rem", borderRadius: "8px", fontSize: "1.5rem" }}>⚙️</div>
              <h2 style={{ fontSize: "1.25rem", margin: 0, color: "#1E293B", fontWeight: 700 }}>Worker OOM Crash</h2>
            </div>
            <p style={{ color: "#64748B", fontSize: "0.9rem", marginBottom: "1.5rem", lineHeight: 1.5 }}>Simulates a worker node memory leak resulting in queue dependency timeouts.</p>
            <button onClick={() => handleInject("dependency_timeout", "Worker", { delayMs: 8000 })} disabled={actionLoading} style={{ width: "100%", padding: "0.75rem", borderRadius: "6px", border: "1px solid #E2E8F0", background: "#F8FAFC", color: "#0F172A", fontWeight: 600, cursor: "pointer" }}>Inject Worker Timeout</button>
          </div>
          
        </div>

        {/* Live Terminal */}
        <div style={{ background: "#0F172A", borderRadius: "12px", padding: "1.5rem", color: "#E2E8F0", boxShadow: "0 4px 6px -1px rgba(0,0,0,0.1)", fontFamily: "'Fira Code', monospace" }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "1rem", borderBottom: "1px solid #1E293B", paddingBottom: "1rem" }}>
            <h3 style={{ margin: 0, fontSize: "1.1rem", fontWeight: 600, display: "flex", alignItems: "center", gap: "0.5rem" }}><span style={{ color: "#3B82F6" }}>●</span> System Event Log</h3>
            <span style={{ fontSize: "0.85rem", color: "#64748B" }}>LIVE STREAM</span>
          </div>
          <div style={{ height: "250px", overflowY: "auto", display: "flex", flexDirection: "column", gap: "0.5rem", fontSize: "0.9rem" }}>
            {eventLogs.map((log, idx) => (
              <div key={idx} style={{ display: "flex", gap: "1rem" }}>
                <span style={{ color: "#64748B", whiteSpace: "nowrap" }}>[{log.time}]</span>
                <span style={{ color: log.type === "SUCCESS" ? "#10B981" : log.type === "ERROR" ? "#EF4444" : log.type === "RESET" ? "#8B5CF6" : "#3B82F6", fontWeight: 600, minWidth: "80px" }}>{log.type}</span>
                <span style={{ wordBreak: "break-all" }}>{log.msg}</span>
              </div>
            ))}
            {eventLogs.length === 0 && <div style={{ color: "#64748B", fontStyle: "italic" }}>Waiting for events...</div>}
          </div>
        </div>

      </main>
    </div>
  );
}
