// ============================================================
// src/pages/CourseView/CourseView.js — v2
// يحمّل المادة والمحاضرات من Firestore + يستخدم courseId من URL
// ============================================================
import React, { useState, useEffect, useRef } from "react";
import {
  getCourse, getLectures,
  getProgress, setLectureProgress,
  getQuizByCourse, getUserQuizResult,
  getNotes, getAllNotesCount,
} from "../../data/db";
import { toArabic, formatSeconds, countWatched, coursePct, isCourseComplete } from "../../utils/helpers";
import { useYouTubePlayer } from "../../hooks/useYouTubePlayer";
import { Ring, Btn, Glass, Pill, ProgressBar } from "../../components/ui";
import NotesPanel from "./NotesPanel";
import QuizModal  from "./QuizModal";

export default function CourseView({ user, courseId, onBack }) {
  const [course,      setCourse]     = useState(null);
  const [lectures,    setLectures]   = useState([]);
  const [cp,          setCp]         = useState({});
  const [quiz,        setQuiz]       = useState(null);
  const [qResult,     setQResult]    = useState(null);
  const [activeIdx,   setActiveIdx]  = useState(0);
  const [watchPct,    setWatchPct]   = useState(0);
  const [curSec,      setCurSec]     = useState(0);
  const [showQuiz,    setShowQuiz]   = useState(false);
  const [quizKey,     setQuizKey]    = useState(0);
  const [notePopup,   setNotePopup]  = useState(null);
  const [noteCounts,  setNoteCounts] = useState({});
  const [ready,       setReady]      = useState(false);
  const shownNotes = useRef(new Set());

  useEffect(() => {
    async function load() {
      const [co, lects, prog, qz] = await Promise.all([
        getCourse(courseId),
        getLectures(courseId),
        getProgress(user.id),
        getQuizByCourse(courseId),
      ]);

      if (!co) return;

      setCourse(co);
      setLectures(lects);

      const saved = prog[courseId] || {};
      setCp(saved);
      setQuiz(qz);

      if (qz) {
        const qr = await getUserQuizResult(user.id, qz.id);
        setQResult(qr);
      }

      // Find first unwatched lecture
      let startIdx = 0;
      for (let i = 0; i < lects.length; i++) {
        if ((saved[lects[i]?.id] || 0) < 80) { startIdx = i; break; }
      }
      setActiveIdx(startIdx);
      setWatchPct(saved[lects[startIdx]?.id] || 0);

      // Load note counts for sidebar badges
      const counts = await getAllNotesCount(user.id, courseId);
      setNoteCounts(counts);

      setReady(true);
    }
    load();
  }, [user.id, courseId]);

  // Reset on lecture change — intentionally omits cp/lectures/ready
  useEffect(() => { // eslint-disable-line react-hooks/exhaustive-deps
    if (!ready || lectures.length === 0) return;
    const lid = lectures[activeIdx]?.id;
    setWatchPct(cp[lid] || 0);
    setCurSec(0);
    shownNotes.current = new Set();
  }, [activeIdx]); // eslint-disable-line react-hooks/exhaustive-deps

  const activeLecture = lectures[activeIdx];
  const activeLecId   = activeLecture?.id;
  const lectureCount  = lectures.length || course?.lectureCount || 0;
  const totalW        = countWatched(cp);
  const totPct        = coursePct(cp, lectureCount);
  const complete      = isCourseComplete(cp, lectureCount);
  const curPct        = Math.max(watchPct, cp[activeLecId] || 0);

  const { getCurrentTime, seekTo } = useYouTubePlayer(
    "yt-player-div",
    course?.playlistId,
    activeLecture ? activeLecture.playlistIndex : 1,
    {
      onProgress: pct => {
        setWatchPct(pct);
        if (activeLecId) {
          bumpProgress(activeLecId, pct);
          try {
            const sec = getCurrentTime();
            setCurSec(sec);
            checkNotePopup(sec);
          } catch {}
        }
      },
      onEnded: () => {
        if (activeLecId) bumpProgress(activeLecId, 100);
        // Auto-advance to next lecture
        setActiveIdx(prev => {
          const next = prev + 1;
          return next < lectures.length ? next : prev;
        });
      },
      onPlaylistReady: count => {
        // Trim lectures list to actual playlist size
        setLectures(prev => prev.length > count ? prev.slice(0, count) : prev);
      },
    }
  );

  async function bumpProgress(lectId, pct) {
    await setLectureProgress(user.id, courseId, lectId, pct);
    setCp(prev => {
      const updated = { ...prev };
      if (pct > (updated[lectId] || 0)) updated[lectId] = pct;
      return updated;
    });
  }

  async function checkNotePopup(sec) {
    if (!activeLecId) return;
    const notes = await getNotes(user.id, courseId, activeLecId);
    notes.forEach(note => {
      if (Math.abs(note.timestamp - sec) <= 1 && !shownNotes.current.has(note.id)) {
        shownNotes.current.add(note.id);
        setNotePopup(note);
        setTimeout(() => setNotePopup(null), 5000);
      }
    });
  }

  function goToLecture(i) {
    setActiveIdx(i);
    setNotePopup(null);
    shownNotes.current = new Set();
  }

  async function handleNoteAdded() {
    if (!activeLecId) return;
    const counts = await getAllNotesCount(user.id, courseId);
    setNoteCounts(counts);
  }

  if (!ready || !course) {
    return (
      <div style={{ display: "flex", alignItems: "center", justifyContent: "center", height: "100vh", background: "var(--bg)", flexDirection: "column", gap: 12 }}>
        <div style={{ fontSize: 32 }}>⏳</div>
        <div style={{ color: "var(--text-3)" }}>جاري تحميل المادة...</div>
      </div>
    );
  }

  return (
    <div className="course-view">
      {/* ── Top bar ── */}
      <header className="topbar">
        <button
          className="btn btn-subtle btn-sm"
          onClick={onBack}
          onMouseEnter={e => { e.currentTarget.style.borderColor = "var(--gold)"; e.currentTarget.style.color = "var(--gold)"; }}
          onMouseLeave={e => { e.currentTarget.style.borderColor = ""; e.currentTarget.style.color = ""; }}
        >
          ← رجوع
        </button>

        <div style={{ flex: 1 }}>
          <div style={{ fontWeight: 800, fontSize: 15, color: "var(--text)" }}>{course.title}</div>
          <div style={{ fontSize: 11, color: "var(--text-3)" }}>{course.instructor}</div>
        </div>

        <div style={{ display: "flex", gap: 10, alignItems: "center" }}>
          <Ring pct={totPct} color={course.accent} size={44} stroke={4} />
          {complete && quiz && !qResult && (
            <Btn size="sm" onClick={() => { setShowQuiz(true); setQuizKey(k => k + 1); }}>
              📝 ابدأ الاختبار
            </Btn>
          )}
          {qResult && (
            <Pill
              color={qResult.passed ? "#27AE60" : "#E74C3C"}
              bg={qResult.passed ? "rgba(39,174,96,0.12)" : "rgba(231,76,60,0.12)"}
            >
              {qResult.passed ? "✓" : "✗"} {qResult.score}%
            </Pill>
          )}
        </div>
      </header>

      {/* ── Note popup ── */}
      {notePopup && (
        <div className="note-popup" style={{ border: `1px solid ${course.accent}44` }}>
          <span style={{ fontSize: 16, flexShrink: 0 }}>📌</span>
          <div style={{ flex: 1 }}>
            <div style={{ fontSize: 11, color: course.accent, fontWeight: 700, marginBottom: 4 }}>
              ملاحظة عند {formatSeconds(notePopup.timestamp)}
            </div>
            <div style={{ fontSize: 13, color: "var(--text)", lineHeight: 1.6 }}>{notePopup.text}</div>
          </div>
          <button
            onClick={() => setNotePopup(null)}
            style={{ background: "none", border: "none", color: "var(--text-3)", cursor: "pointer", fontSize: 16 }}
          >✕</button>
        </div>
      )}

      {/* ── Main layout ── */}
      <div className="course-layout">
        <div className="course-main">
          <div className="video-wrapper">
            <div id="yt-player-div" />
          </div>

          <Glass style={{ marginTop: 12, padding: "13px 18px" }}>
            <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 7, alignItems: "center" }}>
              <span style={{ fontSize: 14, fontWeight: 700, color: "var(--text)" }}>
                {activeLecture?.title || `المحاضرة ${toArabic(activeIdx + 1)}`}
              </span>
              <div style={{ display: "flex", gap: 10, alignItems: "center" }}>
                {curSec > 0 && (
                  <span style={{ fontSize: 11, color: "var(--text-3)", fontVariantNumeric: "tabular-nums" }}>
                    ⏱ {formatSeconds(curSec)}
                  </span>
                )}
                <span style={{ fontSize: 12, color: curPct >= 80 ? "var(--success)" : "var(--text-3)", fontWeight: curPct >= 80 ? 700 : 400 }}>
                  {curPct >= 80 ? "✓ تمت المشاهدة" : `${curPct}% مشاهدة`}
                </span>
              </div>
            </div>
            <ProgressBar pct={curPct} color={course.accent} height={6} />
            <p style={{ color: "var(--text-3)", fontSize: 11, margin: "6px 0 0" }}>
              {curPct >= 80 ? "✓ محتسبة في تقدمك" : "ستُحتسب المحاضرة عند مشاهدة ٨٠٪ منها"}
            </p>
          </Glass>

          <NotesPanel
            userId={user.id}
            courseId={courseId}
            lectureId={activeLecId}
            accentColor={course.accent}
            getPlayerTime={getCurrentTime}
            seekTo={seekTo}
            onNoteChange={handleNoteAdded}
          />

          {complete && (
            <Glass style={{ marginTop: 12, padding: "18px 20px", textAlign: "center", border: `1px solid ${course.accent}33` }}>
              <div style={{ color: "var(--gold)", fontWeight: 800, fontSize: 16, marginBottom: 10 }}>
                🎉 أحسنت! أتممت هذه المادة
              </div>
              {quiz && !qResult && (
                <Btn onClick={() => { setShowQuiz(true); setQuizKey(k => k + 1); }}>
                  📝 ابدأ اختبار المادة الآن
                </Btn>
              )}
              {qResult && (
                <p style={{ color: "var(--text-2)", margin: 0 }}>
                  نتيجة الاختبار:{" "}
                  <strong style={{ color: qResult.passed ? "var(--success)" : "var(--error)" }}>
                    {qResult.score}% — {qResult.passed ? "ناجح" : "لم تجتز"}
                  </strong>
                </p>
              )}
              {!quiz && <p style={{ color: "var(--text-3)", margin: 0, fontSize: 13 }}>لا يوجد اختبار لهذه المادة</p>}
            </Glass>
          )}
        </div>

        {/* ── Lectures sidebar ── */}
        <div className="course-sidebar">
          <div style={{ fontWeight: 700, fontSize: 13, color: "var(--text-2)", letterSpacing: ".04em" }}>
            قائمة المحاضرات
          </div>

          <Glass style={{ overflow: "hidden", maxHeight: "58vh", overflowY: "auto" }} hover={false}>
            {lectures.map((lec, i) => {
              const p         = cp[lec.id] || 0;
              const done      = p >= 80;
              const noteCount = noteCounts[lec.id] || 0;

              return (
                <div
                  key={lec.id}
                  className={`lecture-item ${activeIdx === i ? "active" : ""}`}
                  style={{ "--accent": course.accent, background: activeIdx === i ? `${course.accent}10` : "" }}
                  onClick={() => goToLecture(i)}
                >
                  <div
                    className="lecture-num"
                    style={{
                      background: done
                        ? course.accent
                        : p > 0
                          ? `conic-gradient(${course.accent} ${p * 3.6}deg, rgba(255,255,255,0.08) 0)`
                          : "var(--surface-2)",
                      color: done ? "#080E14" : "var(--text-3)",
                    }}
                  >
                    {done ? "✓" : toArabic(i + 1)}
                  </div>

                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{
                      fontSize: 12,
                      color: activeIdx === i ? course.accent : "var(--text-2)",
                      fontWeight: activeIdx === i ? 700 : 400,
                      overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap",
                    }}>
                      {lec.title || `المحاضرة ${toArabic(i + 1)}`}
                    </div>
                    {p > 0 && p < 80 && <ProgressBar pct={p} color={course.accent} height={2} />}
                  </div>

                  {noteCount > 0 && (
                    <span style={{
                      fontSize: 10, color: course.accent,
                      background: `${course.accent}18`,
                      borderRadius: 8, padding: "1px 6px", flexShrink: 0,
                    }}>
                      📝{toArabic(noteCount)}
                    </span>
                  )}
                </div>
              );
            })}
          </Glass>

          <Glass style={{ padding: "13px 16px" }}>
            <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 7 }}>
              <span style={{ fontSize: 12, color: "var(--text-3)" }}>التقدم</span>
              <span style={{ fontSize: 12, fontWeight: 700, color: course.accent }}>
                {toArabic(totalW)}/{toArabic(lectureCount)}
              </span>
            </div>
            <ProgressBar pct={totPct} color={course.accent} height={5} />
          </Glass>
        </div>
      </div>

      {showQuiz && quiz && (
        <QuizModal
          key={quizKey}
          quiz={quiz}
          user={user}
          course={course}
          onClose={async () => {
            setShowQuiz(false);
            // Refresh quiz result after modal closes
            if (quiz) {
              const qr = await getUserQuizResult(user.id, quiz.id);
              setQResult(qr);
            }
          }}
        />
      )}
    </div>
  );
}
