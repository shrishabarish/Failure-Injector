import { API_BASE_URL } from "../api/client";
import { useNavigate, Link } from "react-router-dom";
import { useState } from "react";

export default function Register() {
  const navigate = useNavigate();
  const [form, setForm] = useState({ name: "", email: "", password: "", confirmPassword: "" });
  const [error, setError] = useState("");
  const [apiError, setApiError] = useState("");
  const [success, setSuccess] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
    setError("");
    setApiError("");
  };

  const handleSubmit = async (e) => {
    e?.preventDefault();

    if (!form.name.trim()) { setError("Full name is required"); return; }
    if (!form.email.trim()) { setError("Email is required"); return; }
    if (form.password.length < 6) { setError("Password must be at least 6 characters"); return; }
    if (form.password !== form.confirmPassword) { setError("Passwords do not match"); return; }

    setLoading(true);
    setApiError("");
    try {
      const res = await fetch(`${API_BASE_URL}/auth/register`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          full_name: form.name,
          email: form.email,
          password: form.password,
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        setApiError(data.message || "Registration failed");
        return;
      }

      localStorage.setItem("token", data.token);
      localStorage.setItem("role", data.role || "USER");

      setSuccess(true);
      setTimeout(() => navigate("/dashboard"), 1000);
    } catch (err) {
      setApiError("Network error. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@400;500;600;700;800&display=swap');

        .reg-page {
          min-height: 100vh;
          background-color: #F8FAFC;
          font-family: 'Plus Jakarta Sans', sans-serif;
          color: #1E293B;
          display: flex;
          align-items: center;
          justify-content: center;
          padding: 24px;
        }

        .reg-card {
          background: #FFFFFF;
          border: 1px solid #E2E8F0;
          border-radius: 16px;
          max-width: 460px;
          width: 100%;
          padding: 40px 36px;
          box-shadow: 0 4px 20px rgba(0, 0, 0, 0.05);
          display: flex;
          flex-direction: column;
          gap: 22px;
        }

        .reg-brand {
          display: flex;
          align-items: center;
          gap: 12px;
        }

        .reg-logo {
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

        .reg-header {
          display: flex;
          flex-direction: column;
          gap: 4px;
        }

        .reg-title {
          font-size: 24px;
          font-weight: 800;
          color: #0F172A;
          letter-spacing: -0.02em;
        }

        .reg-sub {
          font-size: 14px;
          color: #64748B;
        }

        .reg-form {
          display: flex;
          flex-direction: column;
          gap: 14px;
        }

        .reg-field {
          display: flex;
          flex-direction: column;
          gap: 6px;
        }

        .reg-field label {
          font-size: 12px;
          font-weight: 700;
          color: #334155;
        }

        .reg-input {
          background: #FFFFFF;
          border: 1px solid #E2E8F0;
          border-radius: 8px;
          color: #0F172A;
          padding: 10px 14px;
          font-size: 14px;
          outline: none;
          transition: border-color 0.15s, box-shadow 0.15s;
        }

        .reg-input:focus {
          border-color: #2563EB;
          box-shadow: 0 0 0 3px rgba(37, 99, 235, 0.1);
        }

        .reg-btn-submit {
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

        .reg-btn-submit:hover {
          background: #1D4ED8;
        }

        .reg-error-box {
          background: #FEF2F2;
          border: 1px solid #FECACA;
          color: #DC2626;
          padding: 10px 14px;
          border-radius: 8px;
          font-size: 13px;
        }

        .reg-success-box {
          background: #ECFDF5;
          border: 1px solid #A7F3D0;
          color: #059669;
          padding: 10px 14px;
          border-radius: 8px;
          font-size: 13px;
          text-align: center;
        }

        .reg-footer-text {
          font-size: 13px;
          color: #64748B;
          text-align: center;
        }

        .reg-footer-text a {
          color: #2563EB;
          font-weight: 600;
        }
      `}</style>

      <div className="reg-page">
        <div className="reg-card">
          <div className="reg-brand">
            <div className="reg-logo">CR</div>
            <div>
              <div style={{ fontWeight: 800, fontSize: "16px", color: "#0F172A" }}>Anon Review</div>
              <div style={{ fontFamily: "JetBrains Mono", fontSize: "10px", color: "#64748B" }}>CLOUD ARCHITECTURE</div>
            </div>
          </div>

          <div className="reg-header">
            <h1 className="reg-title">Create an account</h1>
            <p className="reg-sub">Join the anonymous peer review &amp; RCA telemetry network</p>
          </div>

          {error && <div className="reg-error-box">⚠ {error}</div>}
          {apiError && <div className="reg-error-box">⚠ {apiError}</div>}
          {success && <div className="reg-success-box">✓ Account created successfully! Redirecting...</div>}

          <form className="reg-form" onSubmit={handleSubmit}>
            <div className="reg-field">
              <label>Full Name</label>
              <input
                type="text"
                name="name"
                className="reg-input"
                placeholder="Jane Doe"
                value={form.name}
                onChange={handleChange}
              />
            </div>

            <div className="reg-field">
              <label>Email Address</label>
              <input
                type="email"
                name="email"
                className="reg-input"
                placeholder="developer@example.com"
                value={form.email}
                onChange={handleChange}
              />
            </div>

            <div className="reg-field">
              <label>Password (min 6 chars)</label>
              <input
                type="password"
                name="password"
                className="reg-input"
                placeholder="••••••••"
                value={form.password}
                onChange={handleChange}
              />
            </div>

            <div className="reg-field">
              <label>Confirm Password</label>
              <input
                type="password"
                name="confirmPassword"
                className="reg-input"
                placeholder="••••••••"
                value={form.confirmPassword}
                onChange={handleChange}
              />
            </div>

            <button type="submit" className="reg-btn-submit" disabled={loading}>
              {loading ? "Creating Account..." : "Create Account →"}
            </button>
          </form>

          <div className="reg-footer-text">
            Already have an account? <Link to="/login">Sign in here</Link>
          </div>
        </div>
      </div>
    </>
  );
}
