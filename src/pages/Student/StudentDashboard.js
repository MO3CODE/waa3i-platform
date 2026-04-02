// ============================================================
// src/pages/Student/StudentDashboard.js
// ============================================================
import React, { useState } from "react";
import { getProgress, getNotifications, getQuizResults, getUserCertificate,
         getLiveSessions, getQuizByCourse, getUserQuizResult, markNotifRead } from "../../data/db";
import { toArabic, formatDate, countWatched, coursePct, isCourseComplete, NOTIF_COLOR } from "../../utils/helpers";
import { Ring, Btn, Glass, Pill, ProgressBar, SectionHeader } from "../../components/ui";
import { Sidebar } from "../../components/layout/Sidebar";

export default function StudentDashboard({ user, courses, onSelectCourse, onLogout }) {
  const [tab,  setTab]  = useState("courses");
  const [tick, setTick] = useState(0);

  const progress  = getProgress(user.id);
  const notifs    = getNotifications(user.role);
  const qResults  = getQuizResults(user.id);
  const cert      = getUserCertificate(user.id);
  const sessions  = getLiveSessions();
  const unread    = notifs.filter(n => !n.read.includes(user.id)).length;

  const totalL    = courses.reduce((s, c) => s + c.lectures, 0);
  const totalW    = courses.reduce((s, c) => s + countWatched(progress[c.id] || {}), 0);
  const overall   = Math.round((totalW / totalL) * 100);
  const doneCount = courses.filter(c => isCourseComplete(progress[c.id] || {}, c.lectures)).length;

  const NAV_ITEMS = [
    { id: "courses", label: "📚 المواد" },
    { id: "notifs",  label: `🔔 الإشعارات${unread > 0 ? ` · ${toArabic(unread)}` : ""}` },
    { id: "live",    label: "📡 اللقاءات" },
    { id: "results", label: "📊 نتائجي" },
    { id: "cert",    label: "🏅 الشهادة" },
  ];

  return (
    <div className="student-layout">
      {/* ── Sidebar ── */}
      <Sidebar
        user={user}
        activeTab={tab}
        onTabChange={setTab}
        onLogout={onLogout}
        navItems={NAV_ITEMS}
        logo={
          <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 16 }}>
            <span style={{ fontSize: 22, color: "var(--gold)" }}>☽</span>
            <div>
              <div style={{ fontWeight: 900, fontSize: 15, color: "var(--text)" }}>منصة وعي</div>
              <div style={{ fontSize: 10, color: "var(--text-3)" }}>طالب</div>
            </div>
          </div>
        }
        headerExtra={
          <div style={{ display: "flex", gap: 10, alignItems: "center" }}>
            <div style={{ width: 40, height: 40, borderRadius: "50%", background: "linear-gradient(135deg,var(--gold),#A8873B)", color: "#080E14", display: "flex", alignItems: "center", justifyContent: "center", fontWeight: 800, fontSize: 18, flexShrink: 0 }}>
              {user.avatar}
            </div>
            <div>
              <div style={{ fontWeight: 700, fontSize: 13, color: "var(--text)" }}>{user.name}</div>
              <div style={{ display: "flex", alignItems: "center", gap: 6, marginTop: 6 }}>
                <Ring pct={overall} color="var(--gold)" size={34} stroke={3} />
                <div style={{ fontSize: 11, color: "var(--text-3)" }}>
                  {toArabic(totalW)}/{toArabic(totalL)} محاضرة
                </div>
              </div>
            </div>
          </div>
        }
      />

      {/* ── Page content ── */}
      <main className="page-content">

        {/* COURSES */}
        {tab === "courses" && (
          <div className="anim-fade-in">
            <SectionHeader
              title="المواد الدراسية"
              subtitle={`${toArabic(doneCount)} من ${toArabic(courses.length)} مكتملة`}
            />
            <div className="grid-auto-300">
              {courses.map((course, idx) => {
                const cp   = progress[course.id] || {};
                const p    = coursePct(cp, course.lectures);
                const done = isCourseComplete(cp, course.lectures);
                const prev = idx === 0 || isCourseComplete(progress[courses[idx - 1].id] || {}, courses[idx - 1].lectures);
                const quiz = getQuizByCourse(course.id);
                const qr   = quiz ? getUserQuizResult(user.id, quiz.id) : null;

                return (
                  <div
                    key={course.id}
                    className={`course-card ${!prev ? "locked" : ""}`}
                    style={{ borderColor: prev ? `${course.accent}22` : "var(--border)" }}
                    onClick={() => prev && onSelectCourse(course)}
                    onMouseEnter={e => {
                      if (prev) {
                        e.currentTarget.style.borderColor = `${course.accent}55`;
                        e.currentTarget.style.transform   = "translateY(-3px)";
                        e.currentTarget.style.boxShadow   = `0 10px 28px rgba(0,0,0,0.3)`;
                      }
                    }}
                    onMouseLeave={e => {
                      e.currentTarget.style.borderColor = prev ? `${course.accent}22` : "var(--border)";
                      e.currentTarget.style.transform   = "";
                      e.currentTarget.style.boxShadow   = "";
                    }}
                  >
                    {/* Accent glow */}
                    <div className="course-card-accent-glow" style={{ background: course.accent }} />

                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 14 }}>
                      <div>
                        <div style={{
                          width: 38, height: 38, borderRadius: 10,
                          background: `${course.accent}18`, border: `1px solid ${course.accent}33`,
                          display: "flex", alignItems: "center", justifyContent: "center",
                          fontSize: 18, color: course.accent, fontWeight: 900, marginBottom: 10,
                        }}>
                          {course.icon}
                        </div>
                        <div style={{ fontWeight: 800, fontSize: 15, color: "var(--text)", marginBottom: 3 }}>{course.full}</div>
                        <div style={{ fontSize: 12, color: "var(--text-3)" }}>{course.instructor}</div>
                      </div>
                      <Ring pct={p} color={course.accent} size={52} stroke={4} />
                    </div>

                    <ProgressBar pct={p} color={course.accent} height={4} />

                    <div style={{ display: "flex", gap: 6, flexWrap: "wrap", marginTop: 10 }}>
                      {!prev && <Pill color="var(--text-3)" bg="var(--surface-2)">🔒 مقفل</Pill>}
                      {done  && <Pill color="var(--success)" bg="rgba(39,174,96,0.1)">✓ مكتمل</Pill>}
                      {qr    && <Pill color={qr.passed ? "var(--success)" : "var(--error)"} bg={qr.passed ? "rgba(39,174,96,0.1)" : "rgba(231,76,60,0.1)"}>
                        {qr.passed ? "✓" : "✗"} {qr.score}%
                      </Pill>}
                      {done && quiz && !qr && <Pill color="var(--gold)" bg="var(--gold-bg)">📝 اختبار</Pill>}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* NOTIFICATIONS */}
        {tab === "notifs" && (
          <div className="anim-fade-in">
            <SectionHeader title="الإشعارات" />
            {notifs.length === 0 && <p style={{ color: "var(--text-3)" }}>لا توجد إشعارات</p>}
            {notifs.map(n => {
              const isRead = n.read.includes(user.id);
              return (
                <Glass
                  key={n.id}
                  style={{
                    padding: "16px 20px", marginBottom: 12,
                    borderRight: `3px solid ${isRead ? "var(--border)" : (NOTIF_COLOR[n.type] || "var(--gold)")}`,
                  }}
                  onClick={() => { markNotifRead(n.id, user.id); setTick(t => t + 1); }}
                >
                  <div style={{ display: "flex", justifyContent: "space-between", gap: 8 }}>
                    <strong style={{ color: "var(--text)", fontSize: 14 }}>{n.title}</strong>
                    {!isRead && <Pill color="var(--error)" bg="rgba(231,76,60,0.12)">جديد</Pill>}
                  </div>
                  <p style={{ color: "var(--text-2)", margin: "7px 0 5px", fontSize: 13, lineHeight: 1.6 }}>{n.body}</p>
                  <span style={{ color: "var(--text-3)", fontSize: 11 }}>{formatDate(n.createdAt)}</span>
                </Glass>
              );
            })}
          </div>
        )}

        {/* LIVE SESSIONS */}
        {tab === "live" && (
          <div className="anim-fade-in">
            <SectionHeader title="اللقاءات المباشرة" />
            {sessions.length === 0 && (
              <Glass style={{ padding: 40, textAlign: "center" }}>
                <p style={{ color: "var(--text-3)" }}>لا توجد لقاءات مجدولة حالياً</p>
              </Glass>
            )}
            <div className="grid-auto-300">
              {sessions.map(s => (
                <Glass key={s.id} className="live-card">
                  {s.imageUrl
                    ? <div className="live-card-image" style={{ backgroundImage: `url(${s.imageUrl})` }} />
                    : <div className="live-card-placeholder">📡</div>
                  }
                  <div style={{ padding: "16px 18px" }}>
                    <h4 style={{ margin: "0 0 6px", color: "var(--text)", fontSize: 15, fontWeight: 800 }}>{s.title}</h4>
                    {s.instructor  && <p style={{ color: "var(--text-2)", margin: "0 0 6px", fontSize: 13 }}>{s.instructor}</p>}
                    {s.description && <p style={{ color: "var(--text-3)", margin: "0 0 10px", fontSize: 12, lineHeight: 1.5 }}>{s.description}</p>}
                    <div style={{ display: "flex", gap: 8, marginBottom: 14, flexWrap: "wrap" }}>
                      {s.date && <Pill color="var(--info)"    bg="rgba(58,139,192,0.1)">📅 {s.date}</Pill>}
                      {s.time && <Pill color="var(--success)" bg="rgba(39,174,96,0.1)">⏰ {s.time}</Pill>}
                    </div>
                    <a href={s.joinUrl} target="_blank" rel="noopener noreferrer" className="live-join-btn">
                      🔗 انضم للقاء
                    </a>
                  </div>
                </Glass>
              ))}
            </div>
          </div>
        )}

        {/* RESULTS */}
        {tab === "results" && (
          <div className="anim-fade-in">
            <SectionHeader title="نتائج الاختبارات" />
            {qResults.length === 0 && (
              <Glass style={{ padding: 40, textAlign: "center" }}>
                <p style={{ color: "var(--text-3)" }}>لم تجر أي اختبار بعد</p>
              </Glass>
            )}
            {qResults.map(r => {
              const c = courses.find(x => x.id === r.courseId);
              return (
                <Glass key={r.id} style={{
                  padding: "16px 20px", marginBottom: 12,
                  display: "flex", alignItems: "center", gap: 16, flexWrap: "wrap",
                  borderRight: `3px solid ${r.passed ? "var(--success)" : "var(--error)"}`,
                }}>
                  <div style={{ flex: 1 }}>
                    <div style={{ fontWeight: 700, color: "var(--text)", fontSize: 15 }}>{c?.full || r.courseId}</div>
                    <div style={{ color: "var(--text-3)", fontSize: 12, marginTop: 4 }}>{formatDate(r.date)}</div>
                  </div>
                  <div style={{ textAlign: "center" }}>
                    <div style={{ fontSize: 28, fontWeight: 900, color: r.passed ? "var(--success)" : "var(--error)" }}>{r.score}%</div>
                    <Pill color={r.passed ? "var(--success)" : "var(--error)"} bg={r.passed ? "rgba(39,174,96,0.1)" : "rgba(231,76,60,0.1)"}>
                      {r.passed ? "ناجح" : "راسب"}
                    </Pill>
                  </div>
                </Glass>
              );
            })}
          </div>
        )}

        {/* CERTIFICATE */}
        {tab === "cert" && (
          <div className="anim-fade-in">
            <SectionHeader title="الشهادة" />
            {cert ? (
              <div className="certificate-card">
                <div style={{ fontSize: 64, marginBottom: 16 }} className="anim-float">🏅</div>
                <h2 style={{ color: "var(--gold)", margin: "0 0 8px", fontSize: 22, fontWeight: 900 }}>شهادة إتمام البرنامج</h2>
                <p style={{ color: "var(--text)", margin: "0 0 6px", fontSize: 20, fontWeight: 700 }}>{cert.userName}</p>
                <p style={{ color: "var(--text-2)", fontSize: 13, marginBottom: 6 }}>مبادرة وعي بما لا يسع المسلم جهله</p>
                <div style={{ borderTop: "1px solid var(--border)", marginTop: 20, paddingTop: 20 }}>
                  <p style={{ color: "var(--gold)", fontSize: 13, margin: 0 }}>تاريخ الإصدار: {formatDate(cert.issuedAt)}</p>
                  <p style={{ color: "var(--text-3)", fontSize: 11, marginTop: 4 }}>أصدرها: {cert.issuedBy}</p>
                </div>
              </div>
            ) : (
              <Glass style={{ padding: 32 }}>
                <div style={{ textAlign: "center", marginBottom: 24 }}>
                  <div style={{ fontSize: 48, marginBottom: 10 }}>📋</div>
                  <h3 style={{ color: "var(--text)", margin: "0 0 6px" }}>متطلبات الشهادة</h3>
                  <p style={{ color: "var(--text-3)", fontSize: 13, margin: 0 }}>أكمل جميع المراحل واجتز الاختبارات</p>
                </div>
                <div style={{ display: "flex", flexDirection: "column", gap: 10, maxWidth: 440, margin: "0 auto" }}>
                  {courses.map(c => {
                    const done = isCourseComplete(progress[c.id] || {}, c.lectures);
                    const quiz = getQuizByCourse(c.id);
                    const qr   = quiz ? getUserQuizResult(user.id, quiz.id) : null;
                    return (
                      <div key={c.id} style={{
                        background: "var(--surface)", border: `1px solid ${done ? `${c.accent}33` : "var(--border)"}`,
                        borderRadius: 12, padding: "12px 16px",
                        display: "flex", alignItems: "center", gap: 12,
                      }}>
                        <div style={{
                          width: 28, height: 28, borderRadius: "50%",
                          background: done ? c.accent : "var(--surface-2)",
                          color: done ? "#080E14" : "var(--text-3)",
                          display: "flex", alignItems: "center", justifyContent: "center",
                          fontSize: 12, fontWeight: 800, flexShrink: 0,
                        }}>
                          {done ? "✓" : c.icon}
                        </div>
                        <span style={{ flex: 1, fontSize: 13, color: done ? "var(--text)" : "var(--text-2)", fontWeight: done ? 700 : 400 }}>
                          {c.full}
                        </span>
                        {quiz && (
                          <Pill
                            color={qr?.passed ? "var(--success)" : qr ? "var(--error)" : "var(--text-3)"}
                            bg="transparent"
                          >
                            {qr?.passed ? "✓ اجتاز" : qr ? "✗ رسب" : "اختبار"}
                          </Pill>
                        )}
                      </div>
                    );
                  })}
                </div>
              </Glass>
            )}
          </div>
        )}
      </main>
    </div>
  );
}
