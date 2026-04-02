// ============================================================
// src/pages/CourseView/NotesPanel.js
// Timestamped notes — stored per user + course + lecture
// ============================================================
import React, { useState, useEffect } from "react";
import { getNotes, saveNotes } from "../../data/db";
import { toArabic, formatSeconds } from "../../utils/helpers";
import { Glass, Btn, Pill } from "../../components/ui";

export default function NotesPanel({ userId, courseId, lectureIdx, accentColor, getPlayerTime, seekTo }) {
  const [notes,    setNotes]    = useState([]);
  const [text,     setText]     = useState("");
  const [editId,   setEditId]   = useState(null);
  const [editText, setEditText] = useState("");

  // Reload whenever lecture changes
  useEffect(() => {
    setNotes(getNotes(userId, courseId, lectureIdx));
    setText("");
    setEditId(null);
  }, [userId, courseId, lectureIdx]);

  function addNote() {
    const trimmed = text.trim();
    if (!trimmed) return;

    const sec     = getPlayerTime();
    const newNote = {
      id:        Date.now(),
      sec,
      text:      trimmed,
      createdAt: new Date().toISOString(),
    };

    const updated = [...notes, newNote].sort((a, b) => a.sec - b.sec);
    setNotes(updated);
    saveNotes(userId, courseId, lectureIdx, updated);
    setText("");
  }

  function handleKeyDown(e) {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      addNote();
    }
  }

  function deleteNote(id) {
    const updated = notes.filter(n => n.id !== id);
    setNotes(updated);
    saveNotes(userId, courseId, lectureIdx, updated);
  }

  function startEdit(note) {
    setEditId(note.id);
    setEditText(note.text);
  }

  function saveEdit(id) {
    const updated = notes.map(n => n.id === id ? { ...n, text: editText } : n);
    setNotes(updated);
    saveNotes(userId, courseId, lectureIdx, updated);
    setEditId(null);
  }

  return (
    <div className="notes-panel">
      <Glass style={{ padding: "16px 18px" }}>
        {/* Header */}
        <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 14 }}>
          <span style={{ fontSize: 16 }}>📝</span>
          <span style={{ fontWeight: 700, fontSize: 14, color: "var(--text)" }}>ملاحظاتي</span>
          {notes.length > 0 && (
            <Pill color={accentColor} bg={`${accentColor}18`}>{toArabic(notes.length)}</Pill>
          )}
        </div>

        {/* Input row */}
        <div className="notes-input-row">
          <input
            className="input"
            value={text}
            onChange={e => setText(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="اكتب ملاحظتك… (Enter للإضافة)"
            style={{ fontSize: 13 }}
          />
          <button className="note-add-btn" onClick={addNote}>
            + إضافة عند الثانية الحالية
          </button>
        </div>

        {/* Empty state */}
        {notes.length === 0 && (
          <div className="empty-state" style={{ padding: "20px 0" }}>
            <p style={{ fontSize: 13 }}>
              لا توجد ملاحظات لهذه المحاضرة.<br />
              <span style={{ fontSize: 12, opacity: 0.7 }}>
                شغّل الفيديو واضغط "+ إضافة" في أي لحظة
              </span>
            </p>
          </div>
        )}

        {/* Notes list */}
        <div className="notes-list">
          {notes.map(note => (
            <div key={note.id} className="note-item">
              {editId === note.id ? (
                /* Edit mode */
                <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                  <textarea
                    className="textarea"
                    value={editText}
                    onChange={e => setEditText(e.target.value)}
                    rows={2}
                    style={{ fontSize: 13, borderColor: accentColor }}
                  />
                  <div style={{ display: "flex", gap: 6 }}>
                    <Btn onClick={() => saveEdit(note.id)} size="sm">حفظ</Btn>
                    <Btn onClick={() => setEditId(null)} size="sm" variant="subtle">إلغاء</Btn>
                  </div>
                </div>
              ) : (
                /* View mode */
                <div style={{ display: "flex", gap: 10, alignItems: "flex-start" }}>
                  {/* Timestamp — click to seek */}
                  <button
                    className="note-timestamp-btn"
                    onClick={() => seekTo(note.sec)}
                    style={{ color: accentColor, borderColor: `${accentColor}55` }}
                    onMouseEnter={e => { e.currentTarget.style.background = `${accentColor}20`; }}
                    onMouseLeave={e => { e.currentTarget.style.background = "transparent"; }}
                  >
                    ▶ {formatSeconds(note.sec)}
                  </button>

                  {/* Note text */}
                  <span style={{ flex: 1, fontSize: 13, color: "var(--text)", lineHeight: 1.6 }}>
                    {note.text}
                  </span>

                  {/* Actions */}
                  <div style={{ display: "flex", gap: 4, flexShrink: 0 }}>
                    <button
                      className="note-action-btn"
                      onClick={() => startEdit(note)}
                      onMouseEnter={e => { e.currentTarget.style.color = "var(--gold)"; }}
                      onMouseLeave={e => { e.currentTarget.style.color = "var(--text-3)"; }}
                      title="تعديل"
                    >✏</button>
                    <button
                      className="note-action-btn"
                      onClick={() => deleteNote(note.id)}
                      onMouseEnter={e => { e.currentTarget.style.color = "var(--error)"; }}
                      onMouseLeave={e => { e.currentTarget.style.color = "var(--text-3)"; }}
                      title="حذف"
                    >🗑</button>
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
      </Glass>
    </div>
  );
}
