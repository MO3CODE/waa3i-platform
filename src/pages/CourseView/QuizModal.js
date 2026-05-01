// ============================================================
// src/pages/CourseView/QuizModal.js
// Timed quiz with instant grading and per-question breakdown
// ============================================================
import React, { useState, useEffect, useRef } from "react";
import { saveQuizResult } from "../../data/db";
import { toArabic } from "../../utils/helpers";
import { Btn, ProgressBar } from "../../components/ui";

export default function QuizModal({ quiz, user, course, onClose }) {
  const [phase,    setPhase]   = useState("intro");   // intro | quiz | result
  const [answers,  setAnswers] = useState({});
  const [timeLeft, setTimeLeft]= useState(quiz.timeLimit);
  const [result,   setResult]  = useState(null);
  const timerRef = useRef(null);

  useEffect(() => {
    if (phase === "quiz") {
      timerRef.current = setInterval(() => {
        setTimeLeft(t => {
          if (t <= 1) { clearInterval(timerRef.current); submitQuiz(true); return 0; }
          return t - 1;
        });
      }, 1000);
    }
    return () => clearInterval(timerRef.current);
  }, [phase]); // eslint-disable-line

  function submitQuiz(auto = false) {
    clearInterval(timerRef.current);

    let correct = 0;
    const detail = quiz.questions.map(q => {
      const chosen   = answers[q.id] !== undefined ? answers[q.id] : -1;
      const isCorrect= chosen === q.correct;
      if (isCorrect) correct++;
      return { qId: q.id, chosen, correct: q.correct, isCorrect };
    });

    const score  = Math.round((correct / quiz.questions.length) * 100);
    const passed = score >= quiz.passMark;

    saveQuizResult({
      userId:   user.id,
      quizId:   quiz.id,
      courseId: course.id,
      score,
      total:    quiz.questions.length,
      correct,
      passed,
      answers:  detail,
    });

    setResult({ score, passed, correct, total: quiz.questions.length, detail, auto });
    setPhase("result");
  }

  const mins      = Math.floor(timeLeft / 60);
  const secs      = timeLeft % 60;
  const urgent    = timeLeft < 60;
  const ansCount  = Object.keys(answers).length;
  const progress  = (ansCount / quiz.questions.length) * 100;

  return (
    <div
      className="modal-overlay"
      onClick={e => { if (e.target === e.currentTarget) onClose(); }}
    >
      <div className="modal-box anim-fade-up" style={{ maxWidth: 680 }}>

        {/* ── INTRO ── */}
        {phase === "intro" && (
          <div style={{ padding: "48px 40px", textAlign: "center" }}>
            <div style={{ fontSize: 56, marginBottom: 16 }} className="anim-float">📝</div>
            <h2 style={{ color: "var(--text)", margin: "0 0 6px", fontSize: 22, fontWeight: 900 }}>{quiz.title}</h2>
            <p style={{ color: "var(--text-3)", margin: "0 0 32px", fontSize: 14 }}>
              {course.full} · {course.instructor}
            </p>

            <div style={{ display: "flex", gap: 16, justifyContent: "center", flexWrap: "wrap", marginBottom: 36 }}>
              {[
                { icon: "❓", label: "الأسئلة",  value: toArabic(quiz.questions.length) },
                { icon: "⏱", label: "المدة",     value: `${toArabic(Math.floor(quiz.timeLimit / 60))} دقيقة` },
                { icon: "✅", label: "للنجاح",    value: `${toArabic(quiz.passMark)}%` },
              ].map(s => (
                <div key={s.label} style={{
                  background: "var(--surface)", border: "1px solid var(--border)",
                  borderRadius: 14, padding: "16px 22px", minWidth: 90, textAlign: "center",
                }}>
                  <div style={{ fontSize: 24, marginBottom: 6 }}>{s.icon}</div>
                  <div style={{ fontWeight: 900, fontSize: 20, color: "var(--text)" }}>{s.value}</div>
                  <div style={{ fontSize: 11, color: "var(--text-3)", marginTop: 3 }}>{s.label}</div>
                </div>
              ))}
            </div>

            <div style={{ display: "flex", gap: 12, justifyContent: "center" }}>
              <Btn onClick={() => setPhase("quiz")} size="lg">ابدأ الاختبار ←</Btn>
              <Btn onClick={onClose} size="lg" variant="ghost">إلغاء</Btn>
            </div>
          </div>
        )}

        {/* ── QUIZ ── */}
        {phase === "quiz" && (
          <div>
            {/* Sticky header */}
            <div style={{
              position: "sticky", top: 0, background: "#0C1420", zIndex: 10,
              padding: "14px 24px", borderBottom: "1px solid var(--border)",
              display: "flex", justifyContent: "space-between", alignItems: "center",
              borderRadius: "20px 20px 0 0",
            }}>
              <div>
                <div style={{ fontWeight: 800, fontSize: 15, color: "var(--text)" }}>{quiz.title}</div>
                <div style={{ fontSize: 12, color: "var(--text-3)", marginTop: 2 }}>
                  {toArabic(ansCount)} / {toArabic(quiz.questions.length)} إجابة
                </div>
              </div>

              {/* Timer */}
              <div style={{
                background: urgent ? "rgba(231,76,60,0.15)" : "rgba(39,174,96,0.12)",
                border: `1.5px solid ${urgent ? "rgba(231,76,60,0.4)" : "rgba(39,174,96,0.3)"}`,
                borderRadius: 12, padding: "8px 18px",
                color: urgent ? "var(--error)" : "var(--success)",
                fontWeight: 900, fontSize: 20,
                fontVariantNumeric: "tabular-nums",
              }}
                className={urgent ? "anim-glow" : ""}
              >
                ⏱ {String(mins).padStart(2, "0")}:{String(secs).padStart(2, "0")}
              </div>
            </div>

            <div style={{ padding: "20px 24px" }}>
              {/* Overall progress bar */}
              <ProgressBar pct={progress} color={course.accent} height={4} />
              <div style={{ height: 28 }} />

              {quiz.questions.map((q, qi) => (
                <div key={q.id} style={{ marginBottom: 30 }}>
                  {/* Question */}
                  <div style={{ display: "flex", gap: 12, marginBottom: 14, alignItems: "flex-start" }}>
                    <span style={{
                      background: `${course.accent}18`, color: course.accent,
                      border: `1px solid ${course.accent}33`,
                      borderRadius: 8, padding: "4px 12px",
                      fontWeight: 800, fontSize: 13, flexShrink: 0,
                    }}>
                      {toArabic(qi + 1)}
                    </span>
                    <p style={{ margin: 0, color: "var(--text)", fontWeight: 600, fontSize: 15, lineHeight: 1.7 }}>
                      {q.text}
                    </p>
                  </div>

                  {/* Options */}
                  <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                    {q.options.map((opt, oi) => {
                      const selected = answers[q.id] === oi;
                      return (
                        <div
                          key={oi}
                          onClick={() => setAnswers(a => ({ ...a, [q.id]: oi }))}
                          style={{
                            padding: "12px 16px", borderRadius: 12, cursor: "pointer",
                            border: `1.5px solid ${selected ? course.accent : "var(--border)"}`,
                            background: selected ? `${course.accent}12` : "var(--surface)",
                            color: selected ? course.accent : "var(--text-2)",
                            fontWeight: selected ? 700 : 400,
                            fontSize: 14, transition: "all 0.18s",
                            display: "flex", gap: 12, alignItems: "center",
                          }}
                          onMouseEnter={e => { if (!selected) e.currentTarget.style.borderColor = "var(--border-2)"; }}
                          onMouseLeave={e => { if (!selected) e.currentTarget.style.borderColor = "var(--border)"; }}
                        >
                          <span style={{
                            width: 26, height: 26, borderRadius: "50%",
                            background: selected ? course.accent : "var(--surface-2)",
                            color: selected ? "#080E14" : "var(--text-3)",
                            display: "flex", alignItems: "center", justifyContent: "center",
                            fontSize: 11, fontWeight: 800, flexShrink: 0, transition: "all 0.18s",
                          }}>
                            {["أ", "ب", "ج", "د"][oi]}
                          </span>
                          {opt}
                        </div>
                      );
                    })}
                  </div>
                </div>
              ))}

              {/* Submit */}
              <div style={{ display: "flex", gap: 12, justifyContent: "center", paddingTop: 16, borderTop: "1px solid var(--border)" }}>
                <Btn onClick={() => submitQuiz(false)}>
                  إرسال الإجابات ({toArabic(ansCount)}/{toArabic(quiz.questions.length)})
                </Btn>
                <Btn onClick={onClose} variant="ghost">إلغاء</Btn>
              </div>
            </div>
          </div>
        )}

        {/* ── RESULT ── */}
        {phase === "result" && result && (
          <div style={{ padding: "40px 32px", textAlign: "center" }}>
            <div style={{ fontSize: 72, marginBottom: 16, lineHeight: 1 }} className="anim-float">
              {result.passed ? "🎉" : "😔"}
            </div>
            <h2 style={{ color: result.passed ? "var(--success)" : "var(--error)", margin: "0 0 6px", fontSize: 26, fontWeight: 900 }}>
              {result.passed ? "أحسنت! نجحت في الاختبار" : "لم تجتز الاختبار هذه المرة"}
            </h2>
            <div style={{ fontSize: 68, fontWeight: 900, color: result.passed ? "var(--success)" : "var(--error)", margin: "16px 0", lineHeight: 1 }}>
              {result.score}%
            </div>
            <p style={{ color: "var(--text-2)", fontSize: 14, margin: "0 0 4px" }}>
              {toArabic(result.correct)} من {toArabic(result.total)} إجابة صحيحة
            </p>
            {result.auto && (
              <p style={{ color: "var(--error)", fontSize: 12, margin: "4px 0" }}>⏱ انتهى الوقت — تم الإرسال تلقائياً</p>
            )}
            <p style={{ color: "var(--text-3)", fontSize: 12, margin: "4px 0 28px" }}>
              درجة النجاح: {toArabic(quiz.passMark)}%
            </p>

            {/* Per-question breakdown */}
            <div style={{ textAlign: "right", marginBottom: 28, display: "flex", flexDirection: "column", gap: 8 }}>
              {quiz.questions.map((q, qi) => {
                const d = result.detail[qi];
                return (
                  <div key={q.id} style={{
                    background: d.isCorrect ? "rgba(39,174,96,0.08)" : "rgba(231,76,60,0.08)",
                    border: `1px solid ${d.isCorrect ? "rgba(39,174,96,0.2)" : "rgba(231,76,60,0.2)"}`,
                    borderRadius: 12, padding: "12px 16px",
                  }}>
                    <div style={{ display: "flex", gap: 8, marginBottom: 6, alignItems: "flex-start" }}>
                      <span style={{ fontWeight: 800, color: d.isCorrect ? "var(--success)" : "var(--error)", flexShrink: 0 }}>
                        {d.isCorrect ? "✓" : "✗"}
                      </span>
                      <span style={{ fontSize: 13, color: "var(--text)", fontWeight: 600, lineHeight: 1.5 }}>{q.text}</span>
                    </div>
                    <div style={{ fontSize: 12, color: "var(--text-2)" }}>
                      إجابتك:{" "}
                      <strong style={{ color: d.isCorrect ? "var(--success)" : "var(--error)" }}>
                        {d.chosen >= 0 ? q.options[d.chosen] : "لم تجب"}
                      </strong>
                    </div>
                    {!d.isCorrect && (
                      <div style={{ fontSize: 12, color: "var(--success)", marginTop: 4 }}>
                        الإجابة الصحيحة: <strong>{q.options[d.correct]}</strong>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>

            <Btn onClick={onClose} size="lg" variant={result.passed ? "gold" : "ghost"}>
              {result.passed ? "العودة للمنصة ←" : "سأراجع المادة وأحاول مجدداً"}
            </Btn>
          </div>
        )}
      </div>
    </div>
  );
}
