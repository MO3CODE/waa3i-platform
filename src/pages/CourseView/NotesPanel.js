// ============================================================
// src/pages/CourseView/NotesPanel.js — v2
// الملاحظات محفوظة في Firestore (تتزامن بين الأجهزة)
// ============================================================
import React, { useState, useEffect } from "react";
import { getNotes, addNote, updateNote, deleteNote } from "../../data/db";
import { toArabic, formatSeconds } from "../../utils/helpers";
import { Glass, Btn, Pill } from "../../components/ui";

export default function NotesPanel({ userId, courseId, lectureId, accentColor, getPlayerTime, seekTo, onNoteChange }) {
  const [notes,    setNotes]    = useState([]);
  const [text,     setText]     = useState("");
  const [editId,   setEditId]   = useState(null);
  const [editText, setEditText] = useState("");
  const [loading,  setLoading]  = useState(false);

  useEffect(() => {
    if (!lectureId) return;
    setLoading(true);
    setText("");
    setEditId(null);
    getNotes(userId, courseId, lectureId).then(n => {
      setNotes(n);
      setLoading(false);
    });
  }, [userId, courseId, lectureId]);

  async function handleAdd() {
    const trimmed = text.trim();
    if (!trimmed) return;
    const timestamp = getPlayerTime();
    const note = await addNote({ userId, courseId, lectureId, timestamp, text: trimmed });
    setNotes(prev => [...prev, note].sort((a, b) => a.timestamp - b.timestamp));
    setText("");
    onNoteChange?.();
  }

  function handleKeyDown(e) {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleAdd();
    }
  }

  async function handleDelete(noteId) {
    await deleteNote(noteId);
    setNotes(prev => prev.filter(n => n.id !== noteId));
    onNoteChange?.();
  }

  function startEdit(note) {
    setEditId(note.id);
    setEditText(note.text);
  }

  async function handleSaveEdit(noteId) {
    await updateNote(noteId, editText);
    setNotes(prev => prev.map(n => n.id === noteId ? { ...n, text: editText } : n));
    setEditId(null);
  }

  return (
    <div className="notes-panel">
      <Glass style={{ padding: "16px 18px" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 14 }}>
          <span style={{ fontSize: 16 }}>📝</span>
          <span style={{ fontWeight: 700, fontSize: 14, color: "var(--text)" }}>ملاحظاتي</span>
          {notes.length > 0 && (
            <Pill color={accentColor} bg={`${accentColor}18`}>{toArabic(notes.length)}</Pill>
          )}
        </div>

        <div className="notes-input-row">
          <input
            className="input"
            value={text}
            onChange={e => setText(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="اكتب ملاحظتك… (Enter للإضافة)"
            style={{ fontSize: 13 }}
          />
          <button className="note-add-btn" onClick={handleAdd}>
            + إضافة عند الثانية الحالية
          </button>
        </div>

        {loading && (
          <div style={{ color: "var(--text-3)", fontSize: 12, padding: "12px 0" }}>جاري تحميل الملاحظات...</div>
        )}

        {!loading && notes.length === 0 && (
          <div className="empty-state" style={{ padding: "20px 0" }}>
            <p style={{ fontSize: 13 }}>
              لا توجد ملاحظات لهذه المحاضرة.<br />
              <span style={{ fontSize: 12, opacity: 0.7 }}>شغّل الفيديو واضغط "+ إضافة" في أي لحظة</span>
            </p>
          </div>
        )}

        <div className="notes-list">
          {notes.map(note => (
            <div key={note.id} className="note-item">
              {editId === note.id ? (
                <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                  <textarea
                    className="textarea"
                    value={editText}
                    onChange={e => setEditText(e.target.value)}
                    rows={2}
                    style={{ fontSize: 13, borderColor: accentColor }}
                  />
                  <div style={{ display: "flex", gap: 6 }}>
                    <Btn onClick={() => handleSaveEdit(note.id)} size="sm">حفظ</Btn>
                    <Btn onClick={() => setEditId(null)} size="sm" variant="subtle">إلغاء</Btn>
                  </div>
                </div>
              ) : (
                <div style={{ display: "flex", gap: 10, alignItems: "flex-start" }}>
                  <button
                    className="note-timestamp-btn"
                    onClick={() => seekTo(note.timestamp)}
                    style={{ color: accentColor, borderColor: `${accentColor}55` }}
                    onMouseEnter={e => { e.currentTarget.style.background = `${accentColor}20`; }}
                    onMouseLeave={e => { e.currentTarget.style.background = "transparent"; }}
                  >
                    ▶ {formatSeconds(note.timestamp)}
                  </button>
                  <span style={{ flex: 1, fontSize: 13, color: "var(--text)", lineHeight: 1.6 }}>
                    {note.text}
                  </span>
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
                      onClick={() => handleDelete(note.id)}
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
