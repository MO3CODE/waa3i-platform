// ============================================================
// src/components/layout/Sidebar.js
// Reusable sidebar used by both Student and Admin dashboards
// ============================================================
import React from "react";

export function Sidebar({ logo, user, navItems, activeTab, onTabChange, onLogout, headerExtra }) {
  return (
    <aside className="sidebar">
      {/* Header */}
      <div style={{ padding: "24px 18px 20px", borderBottom: "1px solid var(--border)" }}>
        {logo}
        {headerExtra}
      </div>

      {/* Nav */}
      <nav style={{ flex: 1, paddingTop: 8, overflowY: "auto" }}>
        {navItems.map(item => (
          <button
            key={item.id}
            onClick={() => onTabChange(item.id)}
            className={`sidebar-nav-btn ${activeTab === item.id ? "active" : ""}`}
          >
            {item.label}
          </button>
        ))}
      </nav>

      {/* Footer */}
      <div style={{ padding: "14px 18px", borderTop: "1px solid var(--border)" }}>
        <div style={{ color: "var(--text-2)", fontSize: 12, marginBottom: 8 }}>{user?.name}</div>
        <button
          onClick={onLogout}
          style={{
            width: "100%", background: "var(--surface)", border: "1px solid var(--border)",
            color: "var(--text-3)", borderRadius: 8, padding: 9, cursor: "pointer",
            fontFamily: "var(--font)", fontSize: 12, transition: "all 0.2s",
          }}
          onMouseEnter={e => { e.currentTarget.style.color = "var(--error)"; e.currentTarget.style.borderColor = "rgba(231,76,60,0.3)"; }}
          onMouseLeave={e => { e.currentTarget.style.color = "var(--text-3)"; e.currentTarget.style.borderColor = "var(--border)"; }}
        >
          تسجيل الخروج
        </button>
      </div>
    </aside>
  );
}
