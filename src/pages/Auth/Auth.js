// ============================================================
// src/pages/Auth/Auth.js
// Login & Register page
// ============================================================
import React, { useState } from "react";
import { login, register } from "../../data/db";
import { Btn, Field } from "../../components/ui";

export default function Auth({ onLogin, onBack }) {
  const [mode,    setMode]    = useState("login");
  const [form,    setForm]    = useState({ name: "", email: "", password: "" });
  const [error,   setError]   = useState("");
  const [loading, setLoading] = useState(false);

  const set = key => value => setForm(p => ({ ...p, [key]: value }));

  async function handleSubmit() {
    setError("");
    setLoading(true);
    try {
      if (mode === "login") {
        const res = await login({ email: form.email, password: form.password });
        if (res.error) setError(res.error);
        else onLogin(res.user);
      } else {
        if (!form.name || !form.email || !form.password) {
          setError("يرجى ملء جميع الحقول");
          return;
        }
        const res = await register(form);
        if (res.error) setError(res.error);
        else onLogin(res.user);
      }
    } catch {
      setError("حدث خطأ، حاول مجدداً");
    } finally {
      setLoading(false);
    }
  }

  function handleKeyDown(e) {
    if (e.key === "Enter") handleSubmit();
  }

  return (
    <div className="auth-page" onKeyDown={handleKeyDown}>
      <div className="auth-bg-radial" />
      <div className="auth-bg-grid"  />

      {onBack && (
        <button className="auth-back-btn" onClick={onBack}>← الرئيسية</button>
      )}

      <div className="auth-card anim-fade-up">
        {/* Logo */}
        <div className="auth-logo">
          <div className="auth-logo-icon">☽</div>
          <h1>منصة وعي</h1>
          <p>بما لا يسع المسلم جهله</p>
        </div>

        {/* Card */}
        <div className="auth-form-card">
          {/* Tabs */}
          <div className="mode-tabs">
            {[["login", "تسجيل الدخول"], ["register", "إنشاء حساب"]].map(([k, l]) => (
              <button
                key={k}
                className={`mode-tab ${mode === k ? "active" : ""}`}
                onClick={() => { setMode(k); setError(""); }}
              >
                {l}
              </button>
            ))}
          </div>

          {mode === "register" && (
            <Field label="الاسم الكامل" value={form.name} onChange={set("name")} placeholder="أدخل اسمك" />
          )}

          <Field label="البريد الإلكتروني" value={form.email} onChange={set("email")} type="email" placeholder="example@email.com" />
          <Field label="كلمة المرور"        value={form.password} onChange={set("password")} type="password" placeholder="••••••••" />

          {error && <div className="auth-error">⚠ {error}</div>}

          <Btn
            onClick={handleSubmit}
            disabled={loading}
            style={{ width: "100%", borderRadius: 12, padding: "13px", fontSize: 15 }}
          >
            {loading ? "جاري المعالجة..." : mode === "login" ? "دخول ←" : "إنشاء الحساب ←"}
          </Btn>

          {mode === "login" && (
            <div className="auth-hint">
              <strong style={{ color: "var(--text-2)" }}>حساب تجريبي</strong><br />
              📧 admin@waa3i.org &nbsp;|&nbsp; 🔑 admin123
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
