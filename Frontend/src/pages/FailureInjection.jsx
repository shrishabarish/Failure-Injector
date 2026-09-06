import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { API_BASE_URL } from "../api/client";
import PortalNavbar from "../components/PortalNavbar";

export const TARGET_SERVICES = [
  { id: "EC2", icon: "🖥️", label: "EC2", title: "EC2 Host", desc: "Compute Instance", color: "#2563EB" },
  { id: "DynamoDB", icon: "🗄️", label: "DynamoDB", title: "DynamoDB / DB", desc: "Database Tier", color: "#059669" },
  { id: "Auth", icon: "🔐", label: "Auth", title: "Auth Service", desc: "OAuth2 IdP", color: "#7C3AED" },
  { id: "Worker", icon: "⚙️", label: "Worker", title: "Worker Pods", desc: "Background Queue", color: "#D97706" },
  { id: "API", icon: "🌐", label: "API", title: "API Gateway", desc: "Core Backend", color: "#0284C7" },
  { id: "Application", icon: "💻", label: "Application", title: "Web App UI", desc: "Frontend Client", color: "#E11D48" }
];

export default function FailureInjection() {
  const navigate = useNavigate();

  // Admin key state
  const [apiKey, setApiKey] = useState(
    localStorage.getItem("admin_api_key") || "admin-fault-injection-secret-key"
  );
  const [keyEditorOpen, setKeyEditorOpen] = useState(false);

  // Status & Health state
  const [loadingStatus, setLoadingStatus] = useState(true);
  const [faultStatus, setFaultStatus] = useState({
    injectionEnabled: true,
    activeFaults: {
      dbDisconnect: false,
      dbLatencyMs: 0,
      apiErrors: {},
      dependencyTimeoutMs: 0,
      serviceUnhealthy: false,
      targetService: null,
      serviceFaults: {
        EC2: [],
        DynamoDB: [],
        Auth: [],
        Worker: [],
        API: [],
        Application: [],
      },
    },
    serviceFaults: {},
    targetService: null,
    timestamp: "",
  });
  const [healthStatus, setHealthStatus] = useState({ status: "UNKNOWN", code: 200, checks: {} });
  const [actionLoading, setActionLoading] = useState(false);
  const [toast, setToast] = useState({ show: false, msg: "", isError: false });

  // Global service filter selection
  const [selectedServiceFilter, setSelectedServiceFilter] = useState("ALL");

  // Per-card Target Service selections
  const [targetDbOutage, setTargetDbOutage] = useState("DynamoDB");
  const [targetDbLatency, setTargetDbLatency] = useState("DynamoDB");
  const [targetApiError, setTargetApiError] = useState("API");
  const [targetDependency, setTargetDependency] = useState("Worker");
  const [targetServiceUnhealthy, setTargetServiceUnhealthy] = useState("EC2");
  const [targetCrash, setTargetCrash] = useState("Application");

  // Input states for faults
  const [latencyMs, setLatencyMs] = useState(1500);
  const [apiEndpoint, setApiEndpoint] = useState("/api/submissions");
  const [apiStatusCode, setApiStatusCode] = useState(500);
  const [apiMessage, setApiMessage] = useState("Simulated API Internal Server Error (Fault Injected)");
  const [dependencyMs, setDependencyMs] = useState(3000);

  // Test bench state
  const [probeUrl, setProbeUrl] = useState("/api/submissions");
  const [probeResult, setProbeResult] = useState(null);
  const [probing, setProbing] = useState(false);

  // Terminal event stream
  const [eventLogs, setEventLogs] = useState([
    { time: new Date().toLocaleTimeString(), type: "SYSTEM", msg: "Chaos Engineering & Fault Injection Console initialized." },
    { time: new Date().toLocaleTimeString(), type: "SYSTEM", msg: "Target Services active: EC2, DynamoDB, Auth, Worker, API, Application." }
  ]);

  // Crash confirm modal
  const [showCrashModal, setShowCrashModal] = useState(false);

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

  // Fetch current status
  const fetchStatus = async () => {
    try {
      const res = await fetch(`${API_BASE_URL}/fault/status`, {
        headers: getHeaders(),
      });
      if (res.ok) {
        const data = await res.json();
        setFaultStatus(data);
      } else {
        const err = await res.json().catch(() => ({}));
        addLog("WARN", `Fault status response: ${err.message || res.status}`);
      }

      const healthRes = await fetch(`${API_BASE_URL.replace(/\/api$/, "")}/health`).catch(() => null);
      if (healthRes) {
        const hData = await healthRes.json().catch(() => ({}));
        setHealthStatus({
          status: hData.status || (healthRes.ok ? "HEALTHY" : "DEGRADED"),
          code: healthRes.status,
          checks: hData.checks || {},
        });
      } else {
        setHealthStatus({ status: "UNREACHABLE", code: 0, checks: {} });
      }
    } catch (err) {
      console.error("Failed to load fault status", err);
    } finally {
      setLoadingStatus(false);
    }
  };

  useEffect(() => {
    fetchStatus();
    const interval = setInterval(fetchStatus, 6000);
    return () => clearInterval(interval);
  }, [apiKey]);

  // Inject fault call with targetService
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

      setFaultStatus(data.state);
      addLog("SUCCESS", `Injected '${type}' on Target: [${targetService}] -> ${JSON.stringify(payload)}`);
      showToastMsg(`✓ Injected '${type}' on ${targetService}`);
      fetchStatus();
    } catch (err) {
      addLog("ERROR", `Failed injecting '${type}' on [${targetService}]: ${err.message}`);
      showToastMsg(`✗ Injection failed: ${err.message}`, true);
    } finally {
      setActionLoading(false);
    }
  };

  // Reset all faults call
  const handleReset = async () => {
    setActionLoading(true);
    try {
      const res = await fetch(`${API_BASE_URL}/fault/reset`, {
        method: "POST",
        headers: getHeaders(),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || data.error || "Reset failed");

      setFaultStatus(data.state);
      addLog("RESET", "All injected faults cleared across all Target Services (EC2, DynamoDB, Auth, Worker, API, Application).");
      showToastMsg("✓ System fully restored to normal!");
      fetchStatus();
    } catch (err) {
      addLog("ERROR", `Reset failed: ${err.message}`);
      showToastMsg(`✗ Reset failed: ${err.message}`, true);
    } finally {
      setActionLoading(false);
    }
  };

  // Process crash call
  const handleCrash = async () => {
    setShowCrashModal(false);
    setActionLoading(true);
    try {
      addLog("CRITICAL", `Executing simulated service crash on Target: [${targetCrash}]...`);
      await fetch(`${API_BASE_URL}/fault/crash`, {
        method: "POST",
        headers: getHeaders(),
      });
      showToastMsg(`Simulated crash executed on ${targetCrash}!`, true);
      addLog("CRITICAL", `Process termination sent for Target: ${targetCrash}.`);
    } catch (err) {
      addLog("INFO", "Connection terminated as expected from process crash.");
    } finally {
      setActionLoading(false);
    }
  };

  // Run test probe
  const handleProbe = async (endpointToTest) => {
    const target = endpointToTest || probeUrl;
    setProbing(true);
    const token = localStorage.getItem("token");
    const fullUrl = target.startsWith("http")
      ? target
      : `${API_BASE_URL.replace(/\/api$/, "")}${target.startsWith("/") ? "" : "/"}${target}`;

    const startTime = performance.now();
    try {
      const res = await fetch(fullUrl, {
        headers: token ? { Authorization: `Bearer ${token}` } : {},
      });
      const duration = Math.round(performance.now() - startTime);
      let body;
      try {
        body = await res.json();
      } catch (e) {
        body = await res.text();
      }

      const resultObj = {
        url: target,
        status: res.status,
        ok: res.ok,
        durationMs: duration,
        data: body,
      };
      setProbeResult(resultObj);
      addLog(
        res.ok ? "PROBE_OK" : "PROBE_FAIL",
        `Probe ${target} -> HTTP ${res.status} in ${duration}ms`
      );
    } catch (err) {
      const duration = Math.round(performance.now() - startTime);
      setProbeResult({
        url: target,
        status: 0,
        ok: false,
        durationMs: duration,
        error: err.message,
      });
      addLog("PROBE_ERR", `Probe ${target} failed after ${duration}ms: ${err.message}`);
    } finally {
      setProbing(false);
    }
  };

  const activeFaults = faultStatus.activeFaults || {};
  const serviceFaults = faultStatus.serviceFaults || activeFaults.serviceFaults || {};

  const activeCount =
    (activeFaults.dbDisconnect ? 1 : 0) +
    (activeFaults.dbLatencyMs > 0 ? 1 : 0) +
    (activeFaults.apiErrors ? Object.keys(activeFaults.apiErrors).length : 0) +
    (activeFaults.dependencyTimeoutMs > 0 ? 1 : 0) +
    (activeFaults.serviceUnhealthy ? 1 : 0);

  const isServiceFaulted = (svcId) => {
    if (serviceFaults[svcId] && serviceFaults[svcId].length > 0) return true;
    if (svcId === "DynamoDB" && (activeFaults.dbDisconnect || activeFaults.dbLatencyMs > 0)) return true;
    if (svcId === "EC2" && activeFaults.serviceUnhealthy) return true;
    if (svcId === "Worker" && activeFaults.dependencyTimeoutMs > 0) return true;
    if (svcId === "API" && activeFaults.apiErrors && Object.keys(activeFaults.apiErrors).length > 0) return true;
    return false;
  };

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@400;500;600;700;800&family=JetBrains+Mono:wght@400;500;600&display=swap');

        .fi-page {
          min-height: 100vh;
          background: linear-gradient(135deg, #f0fdf4 0%, #e0f2fe 50%, #fdf4ff 100%);
          background-attachment: fixed;
          font-family: 'Plus Jakarta Sans', sans-serif;
          color: #1E293B;
          display: flex;
          flex-direction: column;
        }

        .fi-container {
          max-width: 1280px;
          width: 100%;
          margin: 0 auto;
          padding: 36px 24px 80px;
          display: flex;
          flex-direction: column;
          gap: 28px;
          flex: 1;
        }

        /* Top Header Card */
        .fi-header-card {
          background: rgba(255, 255, 255, 0.6);
          backdrop-filter: blur(16px);
          border: 1px solid rgba(255, 255, 255, 0.9);
          border: 1px solid #E2E8F0;
          border-radius: 14px;
          padding: 28px 32px;
          display: flex;
          align-items: center;
          justify-content: space-between;
          flex-wrap: wrap;
          gap: 20px;
          box-shadow: 0 1px 3px rgba(0, 0, 0, 0.04);
        }

        .fi-header-left {
          display: flex;
          flex-direction: column;
          gap: 6px;
        }

        .fi-eyebrow {
          font-family: 'JetBrains Mono', monospace;
          font-size: 11px;
          font-weight: 700;
          letter-spacing: 0.12em;
          color: #2563EB;
          text-transform: uppercase;
        }

        .fi-title {
          font-size: 32px;
          font-weight: 800;
          color: #0F172A;
          letter-spacing: -0.02em;
          line-height: 1.1;
        }

        .fi-sub {
          font-size: 14px;
          color: #64748B;
          max-width: 760px;
          line-height: 1.5;
        }

        .fi-header-right {
          display: flex;
          align-items: center;
          gap: 14px;
          flex-wrap: wrap;
        }

        .fi-pill {
          background: #F8FAFC;
          border: 1px solid #E2E8F0;
          border-radius: 8px;
          padding: 8px 14px;
          display: flex;
          flex-direction: column;
          gap: 2px;
        }

        .fi-pill-label {
          font-family: 'JetBrains Mono', monospace;
          font-size: 9px;
          letter-spacing: 0.1em;
          color: #64748B;
          text-transform: uppercase;
        }

        .fi-pill-val {
          font-size: 13px;
          font-weight: 700;
        }

        .fi-pill-val.healthy { color: #059669; }
        .fi-pill-val.danger { color: #DC2626; }

        .fi-btn-reset {
          background: #059669;
          color: #FFFFFF;
          font-size: 12px;
          font-weight: 800;
          letter-spacing: 0.08em;
          text-transform: uppercase;
          border: none;
          padding: 12px 20px;
          border-radius: 8px;
          cursor: pointer;
          display: flex;
          align-items: center;
          gap: 8px;
          box-shadow: 0 2px 8px rgba(5, 150, 105, 0.25);
          transition: all 0.15s ease;
        }

        .fi-btn-reset:hover {
          background: #047857;
          transform: translateY(-1px);
        }

        /* ── Target Service Topology Matrix ── */
        .fi-target-section {
          background: rgba(255, 255, 255, 0.6);
          backdrop-filter: blur(16px);
          border: 1px solid rgba(255, 255, 255, 0.9);
          border: 1px solid #E2E8F0;
          border-radius: 14px;
          padding: 22px 28px;
          display: flex;
          flex-direction: column;
          gap: 16px;
          box-shadow: 0 1px 3px rgba(0, 0, 0, 0.04);
        }

        .fi-target-header {
          display: flex;
          align-items: center;
          justify-content: space-between;
          flex-wrap: wrap;
          gap: 10px;
        }

        .fi-target-title {
          font-size: 15px;
          font-weight: 700;
          color: #0F172A;
          display: flex;
          align-items: center;
          gap: 8px;
        }

        .fi-target-sub {
          font-size: 12px;
          color: #64748B;
          font-weight: 400;
        }

        .fi-target-chips {
          display: grid;
          grid-template-columns: repeat(6, 1fr);
          gap: 12px;
        }

        @media (max-width: 1050px) {
          .fi-target-chips { grid-template-columns: repeat(3, 1fr); }
        }
        @media (max-width: 600px) {
          .fi-target-chips { grid-template-columns: repeat(2, 1fr); }
        }

        .fi-service-card {
          background: rgba(255, 255, 255, 0.6);
          backdrop-filter: blur(8px);
          border: 1px solid rgba(255, 255, 255, 0.9);
          border: 1px solid #E2E8F0;
          border-radius: 10px;
          padding: 14px;
          display: flex;
          flex-direction: column;
          gap: 6px;
          cursor: pointer;
          transition: all 0.2s ease;
          text-align: left;
        }

        .fi-service-card:hover {
          border-color: #2563EB;
          transform: translateY(-2px);
          box-shadow: 0 4px 12px rgba(37, 99, 235, 0.08);
        }

        .fi-service-card.selected {
          border-color: #2563EB;
          background: #EFF6FF;
          box-shadow: 0 0 0 2px rgba(37, 99, 235, 0.2);
        }

        .fi-service-card.faulted {
          border-color: rgba(239, 68, 68, 0.6);
          background: rgba(254, 242, 242, 0.8);
          animation: pulse-danger 2s infinite;
        }

        .fi-svc-top {
          display: flex;
          align-items: center;
          justify-content: space-between;
        }

        .fi-svc-icon {
          font-size: 18px;
        }

        .fi-svc-status {
          font-family: 'JetBrains Mono', monospace;
          font-size: 9px;
          padding: 2px 6px;
          border-radius: 4px;
          font-weight: 700;
        }

        .fi-svc-status.ok {
          background: #ECFDF5;
          color: #059669;
          border: 1px solid #A7F3D0;
        }

        .fi-svc-status.faulted {
          background: #FEF2F2;
          color: #DC2626;
          border: 1px solid #FECACA;
          animation: fi-blink 1.2s infinite;
        }

        @keyframes fi-blink {
          0%, 100% { opacity: 1; }
          50% { opacity: 0.5; }
        }

        .fi-svc-name {
          font-size: 14px;
          font-weight: 800;
          color: #0F172A;
        }

        .fi-svc-desc {
          font-size: 11px;
          color: #64748B;
        }

        /* Chaos Cards Grid */
        .fi-chaos-grid {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(370px, 1fr));
          gap: 20px;
        }

        .fi-card {
          background: rgba(255, 255, 255, 0.6);
          backdrop-filter: blur(16px);
          border: 1px solid rgba(255, 255, 255, 0.9);
          border: 1px solid #E2E8F0;
          border-radius: 14px;
          padding: 24px;
          display: flex;
          flex-direction: column;
          gap: 16px;
          box-shadow: 0 1px 3px rgba(0, 0, 0, 0.04);
          transition: all 0.2s ease;
        }

        .fi-card:hover {
          box-shadow: 0 6px 16px rgba(0, 0, 0, 0.05);
          border-color: #CBD5E1;
        }

        .fi-card.active-fault {
          border-color: rgba(239, 68, 68, 0.5);
          background: rgba(254, 242, 242, 0.7);
          animation: pulse-danger 2s infinite;
        }

        .fi-card-head {
          display: flex;
          align-items: flex-start;
          justify-content: space-between;
          gap: 12px;
        }

        .fi-card-title {
          font-size: 16px;
          font-weight: 800;
          color: #0F172A;
        }

        .fi-card-desc {
          font-size: 13px;
          color: #64748B;
          line-height: 1.5;
          margin-top: 4px;
        }

        .fi-card-status {
          font-family: 'JetBrains Mono', monospace;
          font-size: 10px;
          font-weight: 700;
          padding: 3px 8px;
          border-radius: 4px;
          text-transform: uppercase;
        }

        .fi-card-status.nominal {
          background: #ECFDF5;
          color: #059669;
          border: 1px solid #A7F3D0;
        }

        .fi-card-status.active {
          background: #FEF2F2;
          color: #DC2626;
          border: 1px solid #FECACA;
        }

        /* Target Service Row */
        .fi-target-row {
          display: flex;
          align-items: center;
          gap: 8px;
          background: #F8FAFC;
          border: 1px solid #E2E8F0;
          border-radius: 8px;
          padding: 8px 12px;
        }

        .fi-target-row-lbl {
          font-family: 'JetBrains Mono', monospace;
          font-size: 10px;
          font-weight: 700;
          color: #2563EB;
          text-transform: uppercase;
          white-space: nowrap;
        }

        .fi-target-select {
          background: transparent;
          border: none;
          color: #0F172A;
          font-family: 'Plus Jakarta Sans', sans-serif;
          font-size: 12px;
          font-weight: 600;
          outline: none;
          cursor: pointer;
          width: 100%;
        }

        /* Form elements */
        .fi-form-group {
          display: flex;
          flex-direction: column;
          gap: 6px;
        }

        .fi-form-label {
          font-family: 'JetBrains Mono', monospace;
          font-size: 10px;
          font-weight: 700;
          color: #64748B;
          text-transform: uppercase;
        }

        .fi-input, .fi-select {
          background: #FFFFFF;
          border: 1px solid #E2E8F0;
          color: #0F172A;
          padding: 8px 12px;
          border-radius: 6px;
          font-size: 13px;
          outline: none;
          transition: border-color 0.15s;
          width: 100%;
        }

        .fi-input:focus, .fi-select:focus {
          border-color: #2563EB;
          box-shadow: 0 0 0 3px rgba(37, 99, 235, 0.1);
        }

        .fi-slider {
          width: 100%;
          accent-color: #2563EB;
          cursor: pointer;
        }

        .fi-preset-row {
          display: flex;
          gap: 6px;
          flex-wrap: wrap;
        }

        .fi-preset-chip {
          background: #F1F5F9;
          border: 1px solid #E2E8F0;
          color: #475569;
          font-family: 'JetBrains Mono', monospace;
          font-size: 10px;
          font-weight: 600;
          padding: 3px 8px;
          border-radius: 4px;
          cursor: pointer;
        }

        .fi-preset-chip:hover {
          background: #E2E8F0;
          color: #0F172A;
        }

        /* Action Buttons */
        .fi-card-actions {
          display: flex;
          gap: 10px;
          margin-top: auto;
          padding-top: 10px;
        }

        .fi-btn {
          flex: 1;
          padding: 10px 16px;
          font-size: 12px;
          font-weight: 700;
          border-radius: 8px;
          cursor: pointer;
          transition: all 0.15s ease;
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 6px;
          border: none;
        }

        .fi-btn-danger {
          background: #DC2626;
          color: #FFFFFF;
        }

        .fi-btn-danger:hover {
          background: #B91C1C;
        }

        .fi-btn-secondary {
          background: #F1F5F9;
          border: 1px solid #E2E8F0;
          color: #2563EB;
        }

        .fi-btn-secondary:hover {
          background: #E2E8F0;
          color: #1D4ED8;
        }

        .fi-btn-outline {
          background: transparent;
          border: 1px solid #E2E8F0;
          color: #64748B;
        }

        .fi-btn-outline:hover {
          background: #F8FAFC;
          color: #0F172A;
          border-color: #CBD5E1;
        }

        /* Test Bench & Event Stream */
        .fi-bottom-grid {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 20px;
        }

        @media (max-width: 850px) {
          .fi-bottom-grid { grid-template-columns: 1fr; }
        }

        .fi-bench-card {
          background: rgba(255, 255, 255, 0.6);
          backdrop-filter: blur(16px);
          border: 1px solid rgba(255, 255, 255, 0.9);
          border: 1px solid #E2E8F0;
          border-radius: 14px;
          padding: 24px;
          display: flex;
          flex-direction: column;
          gap: 16px;
          box-shadow: 0 1px 3px rgba(0, 0, 0, 0.04);
        }

        .fi-bench-title {
          font-size: 15px;
          font-weight: 800;
          color: #0F172A;
          display: flex;
          align-items: center;
          justify-content: space-between;
        }

        .fi-bench-input-row {
          display: flex;
          gap: 8px;
        }

        .fi-btn-probe {
          background: #2563EB;
          color: #FFFFFF;
          font-size: 12px;
          font-weight: 700;
          padding: 8px 16px;
          border-radius: 6px;
          border: none;
          cursor: pointer;
          white-space: nowrap;
        }

        .fi-btn-probe:hover {
          background: #1D4ED8;
        }

        .fi-probe-output {
          background: #0F172A;
          color: #E2E8F0;
          border-radius: 8px;
          padding: 14px;
          font-family: 'JetBrains Mono', monospace;
          font-size: 11px;
          max-height: 200px;
          overflow-y: auto;
          white-space: pre-wrap;
        }

        .fi-terminal-card {
          background: #FFFFFF;
          border: 1px solid #E2E8F0;
          border-radius: 14px;
          padding: 24px;
          display: flex;
          flex-direction: column;
          gap: 14px;
          box-shadow: 0 1px 3px rgba(0, 0, 0, 0.04);
        }

        .fi-terminal-stream {
          background: #0F172A;
          border-radius: 8px;
          padding: 14px;
          font-family: 'JetBrains Mono', monospace;
          font-size: 11px;
          max-height: 220px;
          overflow-y: auto;
          display: flex;
          flex-direction: column;
          gap: 6px;
          line-height: 1.5;
        }

        .fi-term-row {
          display: flex;
          gap: 8px;
        }

        .fi-term-time { color: #64748B; flex-shrink: 0; }
        .fi-term-tag { font-weight: 700; flex-shrink: 0; }
        .fi-term-tag.SUCCESS { color: #34D399; }
        .fi-term-tag.ERROR, .fi-term-tag.CRITICAL { color: #F87171; }
        .fi-term-tag.WARN { color: #FBBF24; }
        .fi-term-tag.RESET { color: #60A5FA; }
        .fi-term-tag.PROBE_OK { color: #34D399; }
        .fi-term-tag.PROBE_FAIL { color: #F87171; }
        .fi-term-msg { color: #CBD5E1; word-break: break-all; }

        /* Toast */
        .fi-toast {
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
          box-shadow: 0 10px 25px rgba(0, 0, 0, 0.15);
        }

        .fi-toast.error {
          background: #DC2626;
        }

        /* Modal */
        .fi-modal-overlay {
          position: fixed;
          inset: 0;
          background: rgba(15, 23, 42, 0.5);
          backdrop-filter: blur(4px);
          display: flex;
          align-items: center;
          justify-content: center;
          z-index: 1000;
          padding: 20px;
        }

        .fi-modal {
          background: #FFFFFF;
          border: 1px solid #E2E8F0;
          border-radius: 14px;
          padding: 28px;
          max-width: 480px;
          width: 100%;
          display: flex;
          flex-direction: column;
          gap: 16px;
          box-shadow: 0 20px 25px -5px rgba(0, 0, 0, 0.1);
        }
      
        @keyframes pulse-danger {
          0% { box-shadow: 0 0 0 0 rgba(239, 68, 68, 0.4); }
          70% { box-shadow: 0 0 0 10px rgba(239, 68, 68, 0); }
          100% { box-shadow: 0 0 0 0; }
        }
    
      `}</style>

      <div className="fi-page">
        <PortalNavbar
          active="faults"
          breadcrumbs={[{ label: "Failure Injection" }]}
          backFallback="/dashboard"
        />

        <main className="fi-container">
          {/* Top Header Card */}
          <div className="fi-header-card">
            <div className="fi-header-left">
              <span className="fi-eyebrow">FAILURE INJECTION CONTROL PLANE // LIVE SIMULATOR</span>
              <h1 className="fi-title">Chaos &amp; Failure Injection</h1>
              <p className="fi-sub">
                Control plane for targeting system components (EC2, DynamoDB, Auth, Worker, API, Application) with RCA telemetry.
              </p>
            </div>

            <div className="fi-header-right">
              <div className="fi-pill">
                <span className="fi-pill-label">SYSTEM HEALTH</span>
                <span className={`fi-pill-val ${healthStatus.code === 200 ? "healthy" : "danger"}`}>
                  {healthStatus.code === 200 ? "Healthy (200)" : `Degraded (${healthStatus.code})`}
                </span>
              </div>

              <div className="fi-pill">
                <span className="fi-pill-label">ACTIVE FAULTS</span>
                <span className={`fi-pill-val ${activeCount > 0 ? "danger" : "healthy"}`}>
                  {activeCount} {activeCount === 1 ? "Fault" : "Faults"}
                </span>
              </div>

              <div className="fi-pill">
                <span className="fi-pill-label">MASTER SWITCH</span>
                <span className="fi-pill-val healthy">
                  {faultStatus.injectionEnabled ? "Enabled" : "Disabled"}
                </span>
              </div>

              <button
                className="fi-btn-reset"
                onClick={handleReset}
                disabled={actionLoading}
                title="Immediately restore system to normal"
              >
                ↻ RESET ALL FAULTS
              </button>
            </div>
          </div>

          {/* ── TARGET SERVICE TOPOLOGY MATRIX ── */}
          <section className="fi-target-section">
            <div className="fi-target-header">
              <div className="fi-target-title">
                <span>🎯 Target Service Topology Matrix</span>
                <span className="fi-target-sub">
                  (Select a target service to route faults &amp; correlate RCA incidents)
                </span>
              </div>

              <div style={{ display: "flex", gap: "8px", alignItems: "center" }}>
                <button
                  className="fi-preset-chip"
                  style={{
                    background: selectedServiceFilter === "ALL" ? "#EFF6FF" : undefined,
                    color: selectedServiceFilter === "ALL" ? "#2563EB" : undefined,
                    borderColor: selectedServiceFilter === "ALL" ? "#2563EB" : undefined,
                  }}
                  onClick={() => setSelectedServiceFilter("ALL")}
                >
                  All Services
                </button>
              </div>
            </div>

            <div className="fi-target-chips">
              {TARGET_SERVICES.map((svc) => {
                const faulted = isServiceFaulted(svc.id);
                const isSelected = selectedServiceFilter === svc.id;

                return (
                  <div
                    key={svc.id}
                    className={`fi-service-card ${faulted ? "faulted" : ""} ${isSelected ? "selected" : ""}`}
                    onClick={() => {
                      setSelectedServiceFilter(isSelected ? "ALL" : svc.id);
                      setTargetDbOutage(svc.id);
                      setTargetDbLatency(svc.id);
                      setTargetApiError(svc.id);
                      setTargetDependency(svc.id);
                      setTargetServiceUnhealthy(svc.id);
                      setTargetCrash(svc.id);
                    }}
                    title={`Click to target ${svc.label}`}
                  >
                    <div className="fi-svc-top">
                      <span className="fi-svc-icon">{svc.icon}</span>
                      <span className={`fi-svc-status ${faulted ? "faulted" : "ok"}`}>
                        {faulted ? "FAULTED" : "NOMINAL"}
                      </span>
                    </div>
                    <div className="fi-svc-name">{svc.label}</div>
                    <div className="fi-svc-desc">{svc.desc}</div>
                  </div>
                );
              })}
            </div>
          </section>

          {/* Key & Config bar */}
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", fontSize: "12px", color: "#64748B" }}>
            <span>
              Admin Key Authorization:{" "}
              <strong style={{ color: "#2563EB" }}>{apiKey ? "Configured (x-api-key)" : "None"}</strong>
            </span>
            <button
              onClick={() => setKeyEditorOpen(!keyEditorOpen)}
              style={{
                background: "transparent",
                border: "1px solid #CBD5E1",
                color: "#2563EB",
                padding: "4px 10px",
                borderRadius: "6px",
                cursor: "pointer",
                fontFamily: "inherit",
                fontSize: "11px",
                fontWeight: 600
              }}
            >
              {keyEditorOpen ? "▲ Hide Key Config" : "⚙ Change Admin Key"}
            </button>
          </div>

          {keyEditorOpen && (
            <div style={{ background: "#FFFFFF", border: "1px solid #E2E8F0", padding: "16px", borderRadius: "8px" }}>
              <label style={{ fontSize: "11px", color: "#475569", fontWeight: 700, display: "block", marginBottom: "6px" }}>
                ADMIN_API_KEY (Stored in browser local storage):
              </label>
              <div style={{ display: "flex", gap: "10px" }}>
                <input
                  type="text"
                  className="fi-input"
                  value={apiKey}
                  onChange={(e) => setApiKey(e.target.value)}
                  placeholder="admin-fault-injection-secret-key"
                />
                <button
                  className="fi-btn-probe"
                  onClick={() => {
                    localStorage.setItem("admin_api_key", apiKey);
                    showToastMsg("Admin Key saved!");
                    fetchStatus();
                  }}
                >
                  Save Key
                </button>
              </div>
            </div>
          )}

          {/* 6 Chaos Scenarios Grid */}
          <div className="fi-chaos-grid">

            {/* SCENARIO 1: DATABASE OUTAGE */}
            <div className={`fi-card ${activeFaults.dbDisconnect ? "active-fault" : ""}`}>
              <div className="fi-card-head">
                <div>
                  <div className="fi-card-title">1. Database Outage</div>
                  <div className="fi-card-desc">
                    Disconnects the database pool. Queries fail immediately with connection refused errors, and /health returns 503.
                  </div>
                </div>
                <span className={`fi-card-status ${activeFaults.dbDisconnect ? "active" : "nominal"}`}>
                  {activeFaults.dbDisconnect ? "DISCONNECTED" : "CONNECTED"}
                </span>
              </div>

              <div className="fi-target-row">
                <span className="fi-target-row-lbl">TARGET SERVICE:</span>
                <select
                  className="fi-target-select"
                  value={targetDbOutage}
                  onChange={(e) => setTargetDbOutage(e.target.value)}
                >
                  {TARGET_SERVICES.map((s) => (
                    <option key={s.id} value={s.id}>
                      {s.icon} {s.label} ({s.desc})
                    </option>
                  ))}
                </select>
              </div>

              <div className="fi-card-actions">
                {!activeFaults.dbDisconnect ? (
                  <button
                    className="fi-btn fi-btn-danger"
                    onClick={() => handleInject("db_disconnect", targetDbOutage, { enabled: true })}
                    disabled={actionLoading}
                  >
                    Cut Off {targetDbOutage}
                  </button>
                ) : (
                  <button
                    className="fi-btn fi-btn-secondary"
                    onClick={() => handleInject("db_disconnect", targetDbOutage, { enabled: false })}
                    disabled={actionLoading}
                  >
                    ✓ Reconnect {targetDbOutage}
                  </button>
                )}
                <button
                  className="fi-btn fi-btn-outline"
                  onClick={() => handleProbe("/api/submissions")}
                >
                  Probe Effect
                </button>
              </div>
            </div>

            {/* SCENARIO 2: DATABASE LATENCY SPIKE */}
            <div className={`fi-card ${activeFaults.dbLatencyMs > 0 ? "active-fault" : ""}`}>
              <div className="fi-card-head">
                <div>
                  <div className="fi-card-title">2. Database Latency Spike</div>
                  <div className="fi-card-desc">
                    Injects artificial query sleep delay into every database operation to simulate thread pool starvation.
                  </div>
                </div>
                <span className={`fi-card-status ${activeFaults.dbLatencyMs > 0 ? "active" : "nominal"}`}>
                  {activeFaults.dbLatencyMs > 0 ? `+${activeFaults.dbLatencyMs}ms` : "0MS DELAY"}
                </span>
              </div>

              <div className="fi-target-row">
                <span className="fi-target-row-lbl">TARGET SERVICE:</span>
                <select
                  className="fi-target-select"
                  value={targetDbLatency}
                  onChange={(e) => setTargetDbLatency(e.target.value)}
                >
                  {TARGET_SERVICES.map((s) => (
                    <option key={s.id} value={s.id}>
                      {s.icon} {s.label} ({s.desc})
                    </option>
                  ))}
                </select>
              </div>

              <div className="fi-form-group">
                <div style={{ display: "flex", justifyContent: "space-between", fontSize: "12px" }}>
                  <span className="fi-form-label">DELAY DURATION:</span>
                  <span style={{ color: "#2563EB", fontWeight: "bold" }}>{latencyMs} ms</span>
                </div>
                <input
                  type="range"
                  min="200"
                  max="5000"
                  step="100"
                  value={latencyMs}
                  onChange={(e) => setLatencyMs(Number(e.target.value))}
                  className="fi-slider"
                />
                <div className="fi-preset-row">
                  {[500, 1000, 2000, 3500].map((ms) => (
                    <button key={ms} className="fi-preset-chip" onClick={() => setLatencyMs(ms)}>
                      {ms}ms
                    </button>
                  ))}
                </div>
              </div>

              <div className="fi-card-actions">
                <button
                  className="fi-btn fi-btn-danger"
                  onClick={() => handleInject("db_latency", targetDbLatency, { delayMs: latencyMs })}
                  disabled={actionLoading}
                >
                  Apply Latency ({latencyMs}ms)
                </button>
                {activeFaults.dbLatencyMs > 0 && (
                  <button
                    className="fi-btn fi-btn-secondary"
                    onClick={() => handleInject("db_latency", targetDbLatency, { delayMs: 0 })}
                    disabled={actionLoading}
                  >
                    Clear
                  </button>
                )}
              </div>
            </div>

            {/* SCENARIO 3: TARGETED API 500 ERROR */}
            <div className={`fi-card ${activeFaults.apiErrors && Object.keys(activeFaults.apiErrors).length > 0 ? "active-fault" : ""}`}>
              <div className="fi-card-head">
                <div>
                  <div className="fi-card-title">3. Targeted API Route Error</div>
                  <div className="fi-card-desc">
                    Causes specific endpoints to immediately return HTTP 500 / 503 with SimulatedApiFault payloads.
                  </div>
                </div>
                <span className={`fi-card-status ${activeFaults.apiErrors && Object.keys(activeFaults.apiErrors).length > 0 ? "active" : "nominal"}`}>
                  {activeFaults.apiErrors ? `${Object.keys(activeFaults.apiErrors).length} ROUTES` : "0 ROUTES"}
                </span>
              </div>

              <div className="fi-target-row">
                <span className="fi-target-row-lbl">TARGET SERVICE:</span>
                <select
                  className="fi-target-select"
                  value={targetApiError}
                  onChange={(e) => setTargetApiError(e.target.value)}
                >
                  {TARGET_SERVICES.map((s) => (
                    <option key={s.id} value={s.id}>
                      {s.icon} {s.label} ({s.desc})
                    </option>
                  ))}
                </select>
              </div>

              <div className="fi-form-group">
                <label className="fi-form-label">TARGET ENDPOINT:</label>
                <div style={{ display: "flex", gap: "6px" }}>
                  <select
                    className="fi-select"
                    value={apiEndpoint}
                    onChange={(e) => setApiEndpoint(e.target.value)}
                  >
                    <option value="/api/submissions">/api/submissions</option>
                    <option value="/api/reviews">/api/reviews</option>
                    <option value="/api/submissions/my-stats">/api/submissions/my-stats</option>
                    <option value="/api/logs">/api/logs</option>
                  </select>
                  <select
                    className="fi-select"
                    style={{ width: "90px" }}
                    value={apiStatusCode}
                    onChange={(e) => setApiStatusCode(Number(e.target.value))}
                  >
                    <option value="500">500</option>
                    <option value="502">502</option>
                    <option value="503">503</option>
                    <option value="504">504</option>
                  </select>
                </div>

                <label className="fi-form-label" style={{ marginTop: "4px" }}>CUSTOM ERROR MESSAGE:</label>
                <input
                  type="text"
                  className="fi-input"
                  value={apiMessage}
                  onChange={(e) => setApiMessage(e.target.value)}
                />
              </div>

              {activeFaults.apiErrors && Object.keys(activeFaults.apiErrors).length > 0 && (
                <div style={{ background: "#FEF2F2", border: "1px solid #FECACA", padding: "8px 12px", borderRadius: "6px", fontSize: "11px" }}>
                  <div style={{ color: "#DC2626", fontWeight: 600, marginBottom: "4px" }}>Currently Faulted Routes:</div>
                  {Object.entries(activeFaults.apiErrors).map(([ep, cfg]) => (
                    <div key={ep} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "4px" }}>
                      <span>{ep} (HTTP {cfg.statusCode || 500})</span>
                      <button
                        className="fi-preset-chip"
                        style={{ color: "#DC2626" }}
                        onClick={() => handleInject("api_error", targetApiError, { endpoint: ep, enabled: false })}
                      >
                        Remove
                      </button>
                    </div>
                  ))}
                </div>
              )}

              <div className="fi-card-actions">
                <button
                  className="fi-btn fi-btn-danger"
                  onClick={() =>
                    handleInject("api_error", targetApiError, {
                      endpoint: apiEndpoint,
                      statusCode: apiStatusCode,
                      message: apiMessage,
                      enabled: true,
                    })
                  }
                  disabled={actionLoading}
                >
                  Inject Route Error on {targetApiError}
                </button>
              </div>
            </div>

            {/* SCENARIO 4: DEPENDENCY TIMEOUT */}
            <div className={`fi-card ${activeFaults.dependencyTimeoutMs > 0 ? "active-fault" : ""}`}>
              <div className="fi-card-head">
                <div>
                  <div className="fi-card-title">4. Dependency Timeout</div>
                  <div className="fi-card-desc">
                    Simulates slow external microservice, upstream OAuth, or metadata cache timeout delays.
                  </div>
                </div>
                <span className={`fi-card-status ${activeFaults.dependencyTimeoutMs > 0 ? "active" : "nominal"}`}>
                  {activeFaults.dependencyTimeoutMs > 0 ? `+${activeFaults.dependencyTimeoutMs}ms` : "0MS"}
                </span>
              </div>

              <div className="fi-target-row">
                <span className="fi-target-row-lbl">TARGET SERVICE:</span>
                <select
                  className="fi-target-select"
                  value={targetDependency}
                  onChange={(e) => setTargetDependency(e.target.value)}
                >
                  {TARGET_SERVICES.map((s) => (
                    <option key={s.id} value={s.id}>
                      {s.icon} {s.label} ({s.desc})
                    </option>
                  ))}
                </select>
              </div>

              <div className="fi-form-group">
                <div style={{ display: "flex", justifyContent: "space-between", fontSize: "12px" }}>
                  <span className="fi-form-label">TIMEOUT DELAY:</span>
                  <span style={{ color: "#2563EB", fontWeight: "bold" }}>{dependencyMs} ms</span>
                </div>
                <input
                  type="range"
                  min="500"
                  max="8000"
                  step="250"
                  value={dependencyMs}
                  onChange={(e) => setDependencyMs(Number(e.target.value))}
                  className="fi-slider"
                />
                <div className="fi-preset-row">
                  {[1000, 2500, 4000, 6000].map((ms) => (
                    <button key={ms} className="fi-preset-chip" onClick={() => setDependencyMs(ms)}>
                      {ms}ms
                    </button>
                  ))}
                </div>
              </div>

              <div className="fi-card-actions">
                <button
                  className="fi-btn fi-btn-danger"
                  onClick={() => handleInject("dependency_timeout", targetDependency, { delayMs: dependencyMs })}
                  disabled={actionLoading}
                >
                  Inject Timeout on {targetDependency}
                </button>
                {activeFaults.dependencyTimeoutMs > 0 && (
                  <button
                    className="fi-btn fi-btn-secondary"
                    onClick={() => handleInject("dependency_timeout", targetDependency, { delayMs: 0 })}
                    disabled={actionLoading}
                  >
                    Clear
                  </button>
                )}
              </div>
            </div>

            {/* SCENARIO 5: SERVICE UNHEALTHY PROBE */}
            <div className={`fi-card ${activeFaults.serviceUnhealthy ? "active-fault" : ""}`}>
              <div className="fi-card-head">
                <div>
                  <div className="fi-card-title">5. Health Probe Failure</div>
                  <div className="fi-card-desc">
                    Forces /health endpoint to fail with HTTP 503 DEGRADED to test container orchestrator, AWS ALB, and restart alarms.
                  </div>
                </div>
                <span className={`fi-card-status ${activeFaults.serviceUnhealthy ? "active" : "nominal"}`}>
                  {activeFaults.serviceUnhealthy ? "FAILING (503)" : "PASSING (200)"}
                </span>
              </div>

              <div className="fi-target-row">
                <span className="fi-target-row-lbl">TARGET SERVICE:</span>
                <select
                  className="fi-target-select"
                  value={targetServiceUnhealthy}
                  onChange={(e) => setTargetServiceUnhealthy(e.target.value)}
                >
                  {TARGET_SERVICES.map((s) => (
                    <option key={s.id} value={s.id}>
                      {s.icon} {s.label} ({s.desc})
                    </option>
                  ))}
                </select>
              </div>

              <div className="fi-card-actions">
                {!activeFaults.serviceUnhealthy ? (
                  <button
                    className="fi-btn fi-btn-danger"
                    onClick={() => handleInject("service_unhealthy", targetServiceUnhealthy, { enabled: true })}
                    disabled={actionLoading}
                  >
                    Trip Health on {targetServiceUnhealthy}
                  </button>
                ) : (
                  <button
                    className="fi-btn fi-btn-secondary"
                    onClick={() => handleInject("service_unhealthy", targetServiceUnhealthy, { enabled: false })}
                    disabled={actionLoading}
                  >
                    ✓ Restore Health on {targetServiceUnhealthy}
                  </button>
                )}
                <button
                  className="fi-btn fi-btn-outline"
                  onClick={() => handleProbe("/health")}
                >
                  Probe /health
                </button>
              </div>
            </div>

            {/* DANGER ZONE: SERVICE CRASH */}
            <div className="fi-card" style={{ borderColor: "#FECACA" }}>
              <div className="fi-card-head">
                <div>
                  <div className="fi-card-title" style={{ color: "#DC2626" }}>Critical Service Crash</div>
                  <div className="fi-card-desc">
                    Terminates the service process (process.exit(1)) to test container supervisor auto-restart and cold-boot recovery.
                  </div>
                </div>
                <span className="fi-card-status active">DANGER</span>
              </div>

              <div className="fi-target-row" style={{ borderColor: "#FECACA" }}>
                <span className="fi-target-row-lbl" style={{ color: "#DC2626" }}>CRASH TARGET:</span>
                <select
                  className="fi-target-select"
                  value={targetCrash}
                  onChange={(e) => setTargetCrash(e.target.value)}
                >
                  {TARGET_SERVICES.map((s) => (
                    <option key={s.id} value={s.id}>
                      {s.icon} {s.label} ({s.desc})
                    </option>
                  ))}
                </select>
              </div>

              <div className="fi-card-actions">
                <button
                  className="fi-btn fi-btn-danger"
                  onClick={() => setShowCrashModal(true)}
                  disabled={actionLoading}
                >
                  ☠ Crash {targetCrash} Now
                </button>
              </div>
            </div>

          </div>

          {/* Test Bench & Event Terminal */}
          <div className="fi-bottom-grid">

            {/* Probe Bench */}
            <div className="fi-bench-card">
              <div className="fi-bench-title">
                <span>⚡ Interactive API Probe Test Bench</span>
                {probeResult && (
                  <span
                    style={{
                      fontSize: "12px",
                      fontWeight: 700,
                      color: probeResult.ok ? "#059669" : "#DC2626",
                    }}
                  >
                    {probeResult.durationMs}ms · HTTP {probeResult.status || "ERR"}
                  </span>
                )}
              </div>

              <div className="fi-preset-row">
                <span style={{ fontSize: "11px", color: "#64748B", alignSelf: "center" }}>QUICK PROBE:</span>
                <button className="fi-preset-chip" onClick={() => handleProbe("/health")}>/health</button>
                <button className="fi-preset-chip" onClick={() => handleProbe("/api/submissions")}>/api/submissions</button>
                <button className="fi-preset-chip" onClick={() => handleProbe("/api/reviews")}>/api/reviews</button>
                <button className="fi-preset-chip" onClick={() => handleProbe("/api/submissions/my-stats")}>/api/submissions/my-stats</button>
              </div>

              <div className="fi-bench-input-row">
                <input
                  type="text"
                  className="fi-input"
                  value={probeUrl}
                  onChange={(e) => setProbeUrl(e.target.value)}
                  placeholder="/api/submissions"
                />
                <button
                  className="fi-btn-probe"
                  onClick={() => handleProbe(probeUrl)}
                  disabled={probing}
                >
                  {probing ? "Probing…" : "Probe Target"}
                </button>
              </div>

              <div className="fi-probe-output">
                {probing ? (
                  <span style={{ color: "#60A5FA" }}>Sending HTTP request &amp; awaiting response...</span>
                ) : probeResult ? (
                  JSON.stringify(probeResult, null, 2)
                ) : (
                  "Click 'Probe Target' or select a quick probe above to test live backend responses against injected faults."
                )}
              </div>
            </div>

            {/* Event Terminal */}
            <div className="fi-terminal-card">
              <div className="fi-bench-title">
                <span>ACTIVITY EVENT STREAM</span>
                <button
                  className="fi-preset-chip"
                  onClick={() => setEventLogs([])}
                >
                  Clear Log
                </button>
              </div>

              <div className="fi-terminal-stream">
                {eventLogs.map((log, i) => (
                  <div className="fi-term-row" key={i}>
                    <span className="fi-term-time">[{log.time}]</span>
                    <span className={`fi-term-tag ${log.type}`}>{log.type}</span>
                    <span className="fi-term-msg">{log.msg}</span>
                  </div>
                ))}
              </div>
            </div>

          </div>
        </main>

        {/* Toast */}
        {toast.show && (
          <div className={`fi-toast ${toast.isError ? "error" : ""}`}>
            {toast.msg}
          </div>
        )}

        {/* Crash Modal */}
        {showCrashModal && (
          <div className="fi-modal-overlay">
            <div className="fi-modal">
              <h3 style={{ fontSize: "18px", fontWeight: 800, color: "#DC2626" }}>
                Confirm Simulated Process Crash
              </h3>
              <p style={{ fontSize: "13px", color: "#475569", lineHeight: 1.6 }}>
                This will send <code style={{ color: "#2563EB" }}>POST /api/fault/crash</code> targeting
                <strong style={{ color: "#DC2626" }}> {targetCrash}</strong>, terminating
                the service process with <code style={{ color: "#DC2626" }}>process.exit(1)</code>.
              </p>
              <div style={{ display: "flex", gap: "10px", justifyContent: "flex-end" }}>
                <button
                  className="fi-btn fi-btn-outline"
                  style={{ flex: "none", padding: "8px 16px" }}
                  onClick={() => setShowCrashModal(false)}
                >
                  Cancel
                </button>
                <button
                  className="fi-btn fi-btn-danger"
                  style={{ flex: "none", padding: "8px 18px" }}
                  onClick={handleCrash}
                >
                  Yes, Terminate {targetCrash}
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </>
  );
}
