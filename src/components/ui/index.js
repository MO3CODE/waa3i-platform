// ============================================================
// src/components/ui/index.js
// All reusable "dumb" UI primitives
// CSS classes come from src/styles/components.css
// ============================================================
import React from "react";

// ── Ring (animated SVG progress circle) ───────────────────
export function Ring({ pct, color, size = 60, stroke = 5 }) {
  const r    = (size - stroke * 2) / 2;
  const circ = 2 * Math.PI * r;
  const dash = (pct / 100) * circ;

  return (
    <div className="ring-wrapper" style={{ width: size, height: size }}>
      <svg width={size} height={size} style={{ transform: "rotate(-90deg)" }}>
        <circle
          cx={size / 2} cy={size / 2} r={r}
          fill="none" stroke="rgba(255,255,255,0.06)" strokeWidth={stroke}
        />
        <circle
          cx={size / 2} cy={size / 2} r={r}
          fill="none" stroke={color} strokeWidth={stroke}
          strokeDasharray={`${dash} ${circ}`}
          strokeLinecap="round"
          style={{ transition: "stroke-dasharray 0.8s cubic-bezier(0.4,0,0.2,1)" }}
        />
      </svg>
      <span
        className="ring-label"
        style={{ fontSize: size * 0.18, color }}
      >
        {pct}%
      </span>
    </div>
  );
}

// ── Button ─────────────────────────────────────────────────
export function Btn({ children, onClick, variant = "gold", size = "md", disabled, style, className = "" }) {
  return (
    <button
      onClick={disabled ? undefined : onClick}
      disabled={disabled}
      className={`btn btn-${variant} btn-${size} ${className}`}
      style={style}
    >
      {children}
    </button>
  );
}

// ── Pill / Badge ───────────────────────────────────────────
export function Pill({ children, color, bg }) {
  return (
    <span className="pill" style={{ color, background: bg }}>
      {children}
    </span>
  );
}

// ── Modal ──────────────────────────────────────────────────
export function Modal({ open = true, onClose, title, children, width = 560 }) {
  if (!open) return null;
  return (
    <div
      className="modal-overlay"
      onClick={e => { if (e.target === e.currentTarget) onClose(); }}
    >
      <div className="modal-box" style={{ maxWidth: width }}>
        <div className="modal-header">
          <h3>{title}</h3>
          <button className="modal-close-btn" onClick={onClose}>✕</button>
        </div>
        <div className="modal-body">{children}</div>
      </div>
    </div>
  );
}

// ── Toast ──────────────────────────────────────────────────
export function Toast({ msg, type = "success", onClose }) {
  const bg = { success: "#27AE60", error: "#E74C3C", info: "#3A8BC0" }[type] || "#3A8BC0";
  const icon = { success: "✓", error: "✕", info: "ℹ" }[type] || "ℹ";
  return (
    <div className="toast" style={{ background: bg }}>
      {icon} {msg}
      <button className="toast-close" onClick={onClose}>✕</button>
    </div>
  );
}

// ── Form Field ─────────────────────────────────────────────
export function Field({ label, value, onChange, type = "text", placeholder, as, rows = 3 }) {
  return (
    <div className="field">
      {label && <label>{label}</label>}
      {as === "textarea" ? (
        <textarea
          className="textarea"
          value={value}
          onChange={e => onChange(e.target.value)}
          placeholder={placeholder}
          rows={rows}
        />
      ) : (
        <input
          className="input"
          type={type}
          value={value}
          onChange={e => onChange(e.target.value)}
          placeholder={placeholder}
        />
      )}
    </div>
  );
}

// ── Select / Picker ────────────────────────────────────────
export function Picker({ label, value, onChange, options }) {
  return (
    <div className="field">
      {label && <label>{label}</label>}
      <select className="select" value={value} onChange={e => onChange(e.target.value)}>
        {options.map(o => (
          <option key={o.v} value={o.v}>{o.l}</option>
        ))}
      </select>
    </div>
  );
}

// ── Progress Bar ───────────────────────────────────────────
export function ProgressBar({ pct, color, height = 6 }) {
  return (
    <div className="progress-track" style={{ height }}>
      <div
        className="progress-fill"
        style={{ width: `${pct}%`, height, background: `linear-gradient(90deg, ${color}, ${color}99)` }}
      />
    </div>
  );
}

// ── Glass card ─────────────────────────────────────────────
export function Glass({ children, style, onClick, hover = true, className = "" }) {
  return (
    <div
      className={`${hover ? "glass" : "glass-static"} ${className}`}
      style={style}
      onClick={onClick}
    >
      {children}
    </div>
  );
}

// ── Section header ─────────────────────────────────────────
export function SectionHeader({ title, subtitle }) {
  return (
    <div className="section-header">
      <h2>{title}</h2>
      {subtitle && <p>{subtitle}</p>}
    </div>
  );
}
