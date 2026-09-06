import { API_BASE_URL } from "../api/client";
import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";

export default function Login1() {
  const navigate = useNavigate();
  const [form, setForm] = useState({ email: "", password: "" });
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState({});
  const [apiError, setApiError] = useState("");
  const [success, setSuccess] = useState(false);

  const handleChange = (e) => {
    setForm((f) => ({ ...f, [e.target.name]: e.target.value }));
    setErrors((er) => ({ ...er, [e.target.name]: null }));
    setApiError("");
  };

  const handleLogin = async (e) => {
    e?.preventDefault();
    const newErrors = {};
    if (!form.email) newErrors.email = "Email is required";
    else if (!/\S+@\S+\.\S+/.test(form.email)) newErrors.email = "Invalid email format";
    if (!form.password) newErrors.password = "Password is required";
    if (Object.keys(newErrors).length) { setErrors(newErrors); return; }

    setLoading(true);
    setApiError("");
    try {
      const res = await fetch(`${API_BASE_URL}/auth/login`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: form.email, password: form.password }),
      });

      const data = await res.json();
      if (!res.ok) {
        setApiError(data.message || "Login failed");
        return;
      }

      localStorage.setItem("token", data.token);
      localStorage.setItem("role", data.role || "USER");

      setSuccess(true);
      setTimeout(() => navigate("/dashboard"), 1000);
    } catch (err) {
      setApiError("Network error. Please ensure backend is running.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@400;500;600;700;800&family=JetBrains+Mono:wght@400;500;600&display=swap');

        .lg-page {
          min-height: 100vh;
          background-color: #F8FAFC;
          font-family: 'Plus Jakarta Sans', sans-serif;
          color: #1E293B;
          display: flex;
          align-items: center;
          justify-content: center;
          padding: 24px;
        }

        .lg-card {
          background: #FFFFFF;
          border: 1px solid #E2E8F0;
          border-radius: 16px;
          max-width: 440px;
          width: 100%;
          padding: 40px 36px;
          box-shadow: 0 4px 20px rgba(0, 0, 0, 0.05);
          display: flex;
          flex-direction: column;
          gap: 24px;
        }

        .lg-brand {
          display: flex;
          align-items: center;
          gap: 12px;
        }

        .lg-logo {
          width: 38px;
          height: 38px;
          background: #2563EB;
          color: #FFFFFF;
          border-radius: 10px;
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 15px;
          font-weight: 800;
        }

        .lg-header {
          display: flex;
          flex-direction: column;
          gap: 4px;
        }

        .lg-title {
          font-size: 24px;
          font-weight: 800;
          color: #0F172A;
          letter-spacing: -0.02em;
        }

        .lg-sub {
          font-size: 14px;
          color: #64748B;
        }

        .lg-form {
          display: flex;
          flex-direction: column;
          gap: 16px;
        }

        .lg-field {
          display: flex;
          flex-direction: column;
          gap: 6px;
        }

        .lg-field label {
          font-size: 12px;
          font-weight: 700;
          color: #334155;
        }

        .lg-input {
          background: #FFFFFF;
          border: 1px solid #E2E8F0;
          border-radius: 8px;
          color: #0F172A;
          padding: 10px 14px;
          font-size: 14px;
          outline: none;
          transition: border-color 0.15s, box-shadow 0.15s;
        }

        .lg-input:focus {
          border-color: #2563EB;
          box-shadow: 0 0 0 3px rgba(37, 99, 235, 0.1);
        }

        .lg-btn-submit {
          background: #2563EB;
          color: #FFFFFF;
          font-size: 14px;
          font-weight: 700;
          padding: 12px;
          border-radius: 8px;
          border: none;
          cursor: pointer;
          transition: background 0.15s;
          margin-top: 6px;
        }

        .lg-btn-submit:hover {
          background: #1D4ED8;
        }

        .lg-error-box {
          background: #FEF2F2;
          border: 1px solid #FECACA;
          color: #DC2626;
          padding: 10px 14px;
          border-radius: 8px;
          font-size: 13px;
        }

        .lg-success-box {
          background: #ECFDF5;
          border: 1px solid #A7F3D0;
          color: #059669;
          padding: 10px 14px;
          border-radius: 8px;
          font-size: 13px;
          text-align: center;
        }

        .lg-footer-text {
          font-size: 13px;
          color: #64748B;
          text-align: center;
        }

        .lg-footer-text a {
          color: #2563EB;
          font-weight: 600;
        }
      `}</style>

      <div className="lg-page">
        <div className="lg-card">
          <div className="lg-brand">
            <div className="lg-logo">CR</div>
            <div>
              <div style={{ fontWeight: 800, fontSize: "16px", color: "#0F172A" }}>Anon Review</div>
              <div style={{ fontFamily: "JetBrains Mono", fontSize: "10px", color: "#64748B" }}>CLOUD ARCHITECTURE</div>
            </div>
          </div>

          <div className="lg-header">
            <h1 className="lg-title">Welcome back</h1>
            <p className="lg-sub">Sign in to access code review &amp; chaos engineering tools</p>
          </div>

          {apiError && <div className="lg-error-box">⚠ {apiError}</div>}
          {success && <div className="lg-success-box">✓ Authentication verified. Redirecting...</div>}

          <form className="lg-form" onSubmit={handleLogin}>
            <div className="lg-field">
              <label>Email Address</label>
              <input
                type="email"
                name="email"
                className="lg-input"
                placeholder="developer@example.com"
                value={form.email}
                onChange={handleChange}
              />
              {errors.email && <span style={{ color: "#DC2626", fontSize: "12px" }}>{errors.email}</span>}
            </div>

            <div className="lg-field">
              <label>Password</label>
              <input
                type="password"
                name="password"
                className="lg-input"
                placeholder="••••••••"
                value={form.password}
                onChange={handleChange}
              />
              {errors.password && <span style={{ color: "#DC2626", fontSize: "12px" }}>{errors.password}</span>}
            </div>

            <button type="submit" className="lg-btn-submit" disabled={loading}>
              {loading ? "Signing In..." : "Sign In →"}
            </button>

            <div style={{ display: "flex", alignItems: "center", gap: "10px", margin: "14px 0" }}>
              <div style={{ flex: 1, height: "1px", background: "#E2E8F0" }} />
              <span style={{ fontSize: "11px", color: "#94A3B8", textTransform: "uppercase", letterSpacing: "0.05em", fontFamily: "JetBrains Mono" }}>or</span>
              <div style={{ flex: 1, height: "1px", background: "#E2E8F0" }} />
            </div>

            <button
              type="button"
              onClick={() => {
                localStorage.setItem("token", "demo-admin-token-" + Date.now());
                localStorage.setItem("role", "ADMIN");
                navigate("/dashboard");
              }}
              style={{
                width: "100%",
                background: "#F8FAFC",
                color: "#1E293B",
                border: "1px solid #CBD5E1",
                borderRadius: "10px",
                padding: "11px 16px",
                fontWeight: 600,
                fontSize: "13px",
                cursor: "pointer",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                gap: "8px",
                transition: "all 0.15s ease",
              }}
              onMouseEnter={(e) => { e.currentTarget.style.background = "#EFF6FF"; e.currentTarget.style.borderColor = "#93C5FD"; }}
              onMouseLeave={(e) => { e.currentTarget.style.background = "#F8FAFC"; e.currentTarget.style.borderColor = "#CBD5E1"; }}
            >
              ⚡ Explore Portal as Demo Admin
            </button>
          </form>

          <div className="lg-footer-text">
            Don't have an account? <Link to="/register">Create one here</Link>
          </div>
        </div>
      </div>
    </>
  );
}
