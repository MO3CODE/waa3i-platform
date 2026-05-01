// ============================================================
// src/pages/Admin/AdminDashboard.js — v2
// لوحة الجوكر والإدارة الكاملة — أدوار متعددة
// ============================================================
import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import {
  getUsers, getQuizzes, saveQuiz, deleteQuiz,
  getQuizResults, getAllProgress,
  getNotifications, addNotification, deleteNotification,
  getCertificates, issueCertificate,
  getLiveSessions, saveLiveSession, deleteLiveSession,
  getCourses,
  ROLE_LABELS, canManageContent, canManageQuizzes, canManageStudents, canManageRoles,
} from "../../data/db";
import { toArabic, formatDate, countWatched, coursePct, isCourseComplete, NOTIF_COLOR } from "../../utils/helpers";
import { useToast } from "../../hooks/useToast";
import { Btn, Glass, Pill, Modal, Field, Picker, ProgressBar, SectionHeader, Toast } from "../../components/ui";
import { Sidebar } from "../../components/layout/Sidebar";
import QuizBuilder from "./QuizBuilder";
import CoursesTab  from "./tabs/CoursesTab";
import RolesTab    from "./tabs/RolesTab";

export default function AdminDashboard({ user, onLogout, refreshUser }) {
  const navigate = useNavigate();
  const [tab,  setTab]  = useState("overview");
  const [tick, setTick] = useState(0);
  const { toast, show: showToast, hide } = useToast();

  // ── async data ─────────────────────────────────────────────
  const [students,    setStudents]    = useState([]);
  const [quizzes,     setQuizzes]     = useState([]);
  const [allResults,  setAllResults]  = useState([]);
  const [allProgress, setAllProgress] = useState({});
  const [allCerts,    setAllCerts]    = useState([]);
  const [notifs,      setNotifs]      = useState([]);
  const [sessions,    setSessions]    = useState([]);
  const [courses,     setCourses]     = useState([]);
  const [loading,     setLoading]     = useState(true);

  useEffect(() => { loadAll(); }, [tick]);

  async function loadAll() {
    setLoading(true);
    const [u, q, qr, ap, c, n, s, co] = await Promise.all([
      getUsers("student"),
      getQuizzes(),
      getQuizResults(),
      getAllProgress(),
      getCertificates(),
      getNotifications("all"),
      getLiveSessions(),
      getCourses(),
    ]);
    setStudents(u);
    setQuizzes(q);
    setAllResults(qr);
    setAllProgress(ap);
    setAllCerts(c);
    setNotifs(n);
    setSessions(s);
    setCourses(co);
    setLoading(false);
  }

  const rr = () => setTick(t => t + 1);

  function handleLogout() {
    onLogout();
    navigate("/");
  }

  // ── Build nav based on role ────────────────────────────────
  const NAV_ITEMS = [
    { id: "overview", label: "📊 نظرة عامة", always: true },
    { id: "students", label: `👥 الطلاب`, show: canManageStudents(user.role) },
    { id: "courses",  label: "📚 المواد",    show: canManageContent(user.role) },
    { id: "quizzes",  label: "📝 الاختبارات", show: canManageQuizzes(user.role) },
    { id: "notifs",   label: "🔔 الإشعارات", always: true },
    { id: "live",     label: "📡 اللقاءات",  always: true },
    { id: "certs",    label: "🏅 الشهادات",  show: canManageStudents(user.role) },
    { id: "roles",    label: "👤 الأدوار",   show: canManageRoles(user.role) },
  ].filter(x => x.always || x.show);

  if (loading) {
    return (
      <div className="admin-layout">
        <div className="page-content" style={{ display: "flex", alignItems: "center", justifyContent: "center" }}>
          <div style={{ color: "var(--text-3)", fontSize: 16 }}>جاري التحميل...</div>
        </div>
      </div>
    );
  }

  return (
    <div className="admin-layout">
      {toast && <Toast msg={toast.msg} type={toast.type} onClose={hide} />}

      <Sidebar
        user={user}
        activeTab={tab}
        onTabChange={setTab}
        onLogout={handleLogout}
        navItems={NAV_ITEMS}
        logo={
          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
            <span style={{ fontSize: 24, color: "var(--gold)" }}>☽</span>
            <div>
              <div style={{ fontWeight: 900, fontSize: 15, color: "var(--text)" }}>لوحة الإدارة</div>
              <div style={{ fontSize: 10, color: "var(--text-3)" }}>
                {ROLE_LABELS[user.role] || user.role}
              </div>
            </div>
          </div>
        }
      />

      <main className="page-content">

        {/* ── OVERVIEW ── */}
        {tab === "overview" && (
          <OverviewPanel
            students={students} courses={courses}
            allResults={allResults} allCerts={allCerts}
            allProgress={allProgress} user={user}
          />
        )}

        {/* ── STUDENTS ── */}
        {tab === "students" && canManageStudents(user.role) && (
          <StudentsPanel
            students={students} courses={courses}
            allProgress={allProgress} allResults={allResults}
            showToast={showToast} rr={rr}
          />
        )}

        {/* ── COURSES ── */}
        {tab === "courses" && canManageContent(user.role) && (
          <CoursesTab user={user} />
        )}

        {/* ── QUIZZES ── */}
        {tab === "quizzes" && canManageQuizzes(user.role) && (
          <QuizzesPanel courses={courses} quizzes={quizzes} showToast={showToast} rr={rr} />
        )}

        {/* ── NOTIFICATIONS ── */}
        {tab === "notifs" && (
          <NotifsPanel notifs={notifs} showToast={showToast} rr={rr} />
        )}

        {/* ── LIVE ── */}
        {tab === "live" && (
          <LivePanel sessions={sessions} showToast={showToast} rr={rr} />
        )}

        {/* ── CERTIFICATES ── */}
        {tab === "certs" && canManageStudents(user.role) && (
          <CertsPanel
            students={students} certs={allCerts} user={user}
            courses={courses} allProgress={allProgress} allResults={allResults}
            quizzes={quizzes} showToast={showToast} rr={rr}
          />
        )}

        {/* ── ROLES ── */}
        {tab === "roles" && canManageRoles(user.role) && (
          <RolesTab user={user} />
        )}

      </main>
    </div>
  );
}

// ─── Overview panel ────────────────────────────────────────
function OverviewPanel({ students, courses, allResults, allCerts, allProgress, user }) {
  const totalLectures = courses.reduce((s, c) => s + (c.lectureCount || 0), 0);
  const avgProgress = students.length === 0 ? 0 : Math.round(
    students.reduce((sum, s) => {
      const prog  = allProgress[s.id] || {};
      const total = courses.reduce((t, c) => t + countWatched(prog[c.id] || {}), 0);
      return sum + (totalLectures > 0 ? Math.round((total / totalLectures) * 100) : 0);
    }, 0) / students.length
  );

  return (
    <div className="anim-fade-in">
      <SectionHeader title={`مرحباً، ${user.name} 👋`} />
      <div className="stats-grid">
        {[
          { label: "الطلاب المسجلون", value: toArabic(students.length),      icon: "👥", color: "var(--info)"    },
          { label: "اختبارات أُجريت",  value: toArabic(allResults.length),   icon: "📝", color: "var(--success)" },
          { label: "شهادات صادرة",     value: toArabic(allCerts.length),     icon: "🏅", color: "var(--gold)"    },
          { label: "متوسط التقدم",      value: `${toArabic(avgProgress)}%`,   icon: "📊", color: "var(--warning)" },
        ].map(s => (
          <Glass key={s.label} className="stat-tile" style={{ borderTop: `2px solid ${s.color}44` }}>
            <div style={{ fontSize: 30, marginBottom: 8 }}>{s.icon}</div>
            <div style={{ fontWeight: 900, fontSize: 28, color: s.color }}>{s.value}</div>
            <div style={{ color: "var(--text-3)", fontSize: 12, marginTop: 3 }}>{s.label}</div>
          </Glass>
        ))}
      </div>

      <Glass style={{ padding: "20px 24px" }}>
        <h3 style={{ margin: "0 0 16px", color: "var(--text)", fontSize: 16 }}>آخر نتائج الاختبارات</h3>
        {allResults.length === 0 && <p style={{ color: "var(--text-3)" }}>لا توجد نتائج بعد</p>}
        {[...allResults].reverse().slice(0, 8).map(r => {
          const s = students.find(x => x.id === r.userId);
          const c = courses.find(x => x.id  === r.courseId);
          return (
            <div key={r.id} style={{
              display: "flex", gap: 12, alignItems: "center",
              padding: "10px 0", borderBottom: "1px solid var(--border)", flexWrap: "wrap",
            }}>
              <div style={{
                width: 36, height: 36, borderRadius: "50%",
                background: r.passed ? "rgba(39,174,96,0.15)" : "rgba(231,76,60,0.12)",
                color: r.passed ? "var(--success)" : "var(--error)",
                display: "flex", alignItems: "center", justifyContent: "center", fontWeight: 800,
              }}>{r.passed ? "✓" : "✗"}</div>
              <div style={{ flex: 1 }}>
                <div style={{ fontWeight: 600, color: "var(--text)", fontSize: 14 }}>{s?.name || r.userId}</div>
                <div style={{ fontSize: 11, color: "var(--text-3)" }}>{c?.title || r.courseId} · {formatDate(r.date)}</div>
              </div>
              <Pill color={r.passed ? "var(--success)" : "var(--error)"} bg={r.passed ? "rgba(39,174,96,0.1)" : "rgba(231,76,60,0.1)"}>
                {r.score}%
              </Pill>
            </div>
          );
        })}
      </Glass>
    </div>
  );
}

// ─── Students panel ────────────────────────────────────────
function StudentsPanel({ students, courses, allProgress, allResults, showToast, rr }) {
  const [detail, setDetail] = useState(null);
  const [search, setSearch] = useState("");

  const shown = students.filter(s => {
    const matchSearch = !search || s.name?.includes(search) || s.email?.includes(search);
    return matchSearch;
  });

  return (
    <div className="anim-fade-in">
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 20, flexWrap: "wrap", gap: 10 }}>
        <SectionHeader title="إدارة الطلاب" />
        <input
          className="search-input"
          placeholder="بحث بالاسم أو البريد..."
          value={search}
          onChange={e => setSearch(e.target.value)}
          style={{ padding: "8px 14px", borderRadius: 8, border: "1px solid var(--border)", background: "var(--bg-2)", color: "var(--text)", fontFamily: "var(--font)", fontSize: 13 }}
        />
      </div>

      <Glass hover={false} style={{ overflow: "hidden" }}>
        {shown.length === 0 && <p style={{ padding: 24, color: "var(--text-3)" }}>لا يوجد طلاب</p>}
        {shown.map(s => {
          const prog   = allProgress[s.id] || {};
          const total  = courses.reduce((sum, c) => sum + countWatched(prog[c.id] || {}), 0);
          const totalL = courses.reduce((sum, c) => sum + (c.lectureCount || 0), 0);
          const pct    = totalL > 0 ? Math.round((total / totalL) * 100) : 0;

          return (
            <div key={s.id} className="student-row">
              <div className="student-avatar">{s.avatar}</div>
              <div style={{ flex: 1, minWidth: 140 }}>
                <div style={{ fontWeight: 700, color: "var(--text)", fontSize: 14 }}>{s.name}</div>
                <div style={{ fontSize: 11, color: "var(--text-3)" }}>{s.email} · {formatDate(s.createdAt)}</div>
              </div>
              <div style={{ textAlign: "center", minWidth: 60 }}>
                <div style={{ fontWeight: 800, fontSize: 17, color: "var(--gold)" }}>{pct}%</div>
                <div style={{ fontSize: 10, color: "var(--text-3)" }}>التقدم</div>
              </div>
              <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
                <Pill color="var(--success)" bg="rgba(39,174,96,0.1)">مسجل</Pill>
                <Btn size="sm" variant="subtle" onClick={() => setDetail(s)}>تفاصيل</Btn>
              </div>
            </div>
          );
        })}
      </Glass>

      <Modal open={!!detail} onClose={() => setDetail(null)} title={`تقدم: ${detail?.name}`} width={580}>
        {detail && (
          <div>
            {courses.map(c => {
              const cp  = (allProgress[detail.id] || {})[c.id] || {};
              const w   = countWatched(cp);
              const p   = coursePct(cp, c.lectureCount || 0);
              const qr  = allResults.find(r => r.userId === detail.id && r.courseId === c.id);
              return (
                <div key={c.id} style={{ padding: "12px 0", borderBottom: "1px solid var(--border)", display: "flex", alignItems: "center", gap: 12 }}>
                  <span style={{ fontSize: 18, color: c.accent }}>{c.icon}</span>
                  <div style={{ flex: 1 }}>
                    <div style={{ fontWeight: 600, fontSize: 13, color: "var(--text)" }}>{c.title}</div>
                    <ProgressBar pct={p} color={c.accent} height={4} />
                    <div style={{ fontSize: 11, color: "var(--text-3)", marginTop: 3 }}>{toArabic(w)}/{toArabic(c.lectureCount || 0)} · {p}%</div>
                  </div>
                  {qr && <Pill color={qr.passed ? "var(--success)" : "var(--error)"} bg={qr.passed ? "rgba(39,174,96,0.1)" : "rgba(231,76,60,0.1)"}>{qr.score}%</Pill>}
                </div>
              );
            })}
          </div>
        )}
      </Modal>
    </div>
  );
}

// ─── Quizzes panel ─────────────────────────────────────────
function QuizzesPanel({ courses, quizzes, showToast, rr }) {
  const [open,    setOpen]    = useState(false);
  const [editing, setEditing] = useState(null);

  return (
    <div className="anim-fade-in">
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 20 }}>
        <SectionHeader title="الاختبارات" />
        <Btn onClick={() => { setEditing(null); setOpen(true); }}>+ إنشاء اختبار</Btn>
      </div>

      {quizzes.length === 0 && (
        <Glass style={{ padding: 40, textAlign: "center" }}>
          <p style={{ color: "var(--text-3)" }}>لا توجد اختبارات. أنشئ أول اختبار!</p>
        </Glass>
      )}

      <div className="grid-auto-300">
        {quizzes.map(q => {
          const c = courses.find(x => x.id === q.courseId);
          return (
            <Glass key={q.id} style={{ padding: 20, borderTop: `2px solid ${c?.accent || "var(--gold)"}33` }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 12 }}>
                <div>
                  <h4 style={{ margin: "0 0 4px", color: "var(--text)", fontSize: 15, fontWeight: 800 }}>{q.title}</h4>
                  <p style={{ margin: 0, color: "var(--text-3)", fontSize: 12 }}>{c?.title || q.courseId}</p>
                </div>
                <span style={{ fontSize: 22, color: c?.accent || "var(--gold)" }}>{c?.icon || "📝"}</span>
              </div>
              <div style={{ display: "flex", gap: 8, marginBottom: 16, flexWrap: "wrap" }}>
                <Pill color="var(--info)"    bg="rgba(58,139,192,0.1)">❓ {toArabic(q.questions?.length || 0)} سؤال</Pill>
                <Pill color="var(--gold)"    bg="var(--gold-bg)">⏱ {toArabic(Math.floor((q.timeLimit || 0) / 60))} د</Pill>
                <Pill color="var(--success)" bg="rgba(39,174,96,0.1)">✅ {toArabic(q.passMark)}%</Pill>
              </div>
              <div style={{ display: "flex", gap: 8 }}>
                <Btn size="sm" variant="subtle" onClick={() => { setEditing(q); setOpen(true); }}>✏ تعديل</Btn>
                <Btn size="sm" variant="danger" onClick={() => {
                  if (window.confirm("حذف هذا الاختبار؟")) { deleteQuiz(q.id); showToast("تم الحذف", "error"); rr(); }
                }}>🗑</Btn>
              </div>
            </Glass>
          );
        })}
      </div>

      <Modal open={open} onClose={() => setOpen(false)} title={editing ? "تعديل اختبار" : "اختبار جديد"} width={700}>
        <QuizBuilder
          courses={courses}
          initial={editing}
          onSave={q => { saveQuiz(q); showToast("تم حفظ الاختبار"); rr(); setOpen(false); }}
          onCancel={() => setOpen(false)}
        />
      </Modal>
    </div>
  );
}

// ─── Notifications panel ────────────────────────────────────
function NotifsPanel({ notifs, showToast, rr }) {
  const [form, setForm] = useState({ title: "", body: "", type: "info", targetRole: "all" });
  const set = key => value => setForm(p => ({ ...p, [key]: value }));

  function send() {
    if (!form.title || !form.body) { showToast("العنوان والنص مطلوبان", "error"); return; }
    addNotification(form);
    setForm({ title: "", body: "", type: "info", targetRole: "all" });
    showToast("تم إرسال الإشعار");
    rr();
  }

  return (
    <div className="anim-fade-in">
      <SectionHeader title="إدارة الإشعارات" />
      <Glass style={{ padding: "22px 24px", marginBottom: 24 }}>
        <h3 style={{ margin: "0 0 16px", color: "var(--text)", fontSize: 16 }}>✉ إرسال إشعار جديد</h3>
        <Field label="العنوان *" value={form.title} onChange={set("title")} placeholder="عنوان الإشعار" />
        <Field label="النص *"    value={form.body}  onChange={set("body")}  placeholder="نص الإشعار..." as="textarea" />
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "0 16px" }}>
          <Picker label="النوع" value={form.type} onChange={set("type")} options={[
            { v:"info", l:"معلومة 🔵" }, { v:"success", l:"نجاح 🟢" },
            { v:"warning", l:"تنبيه 🟠" }, { v:"announcement", l:"إعلان 🟣" },
          ]} />
          <Picker label="الموجه لـ" value={form.targetRole} onChange={set("targetRole")} options={[
            { v:"all", l:"الجميع" }, { v:"student", l:"الطلاب فقط" },
          ]} />
        </div>
        <Btn onClick={send}>📤 إرسال</Btn>
      </Glass>

      <Glass hover={false} style={{ padding: "22px 24px" }}>
        <h3 style={{ margin: "0 0 16px", color: "var(--text)", fontSize: 16 }}>الإشعارات ({toArabic(notifs.length)})</h3>
        {notifs.length === 0 && <p style={{ color: "var(--text-3)" }}>لا توجد إشعارات بعد</p>}
        {notifs.map(n => (
          <div key={n.id} style={{ display: "flex", gap: 12, alignItems: "flex-start", padding: "12px 0", borderBottom: "1px solid var(--border)" }}>
            <div style={{ width: 8, height: 8, borderRadius: "50%", background: NOTIF_COLOR[n.type] || "var(--gold)", marginTop: 6, flexShrink: 0 }} />
            <div style={{ flex: 1 }}>
              <div style={{ fontWeight: 700, color: "var(--text)", fontSize: 14 }}>{n.title}</div>
              <div style={{ color: "var(--text-2)", fontSize: 12, marginTop: 3, lineHeight: 1.5 }}>{n.body}</div>
              <div style={{ color: "var(--text-3)", fontSize: 11, marginTop: 4 }}>{formatDate(n.createdAt)} · قرأه {toArabic(n.read?.length || 0)}</div>
            </div>
            <button
              onClick={() => { deleteNotification(n.id); showToast("تم الحذف","error"); rr(); }}
              style={{ background:"none", border:"none", color:"var(--text-3)", cursor:"pointer", fontSize:16, flexShrink:0 }}
              onMouseEnter={e=>e.target.style.color="var(--error)"} onMouseLeave={e=>e.target.style.color="var(--text-3)"}
            >🗑</button>
          </div>
        ))}
      </Glass>
    </div>
  );
}

// ─── Live sessions panel ────────────────────────────────────
function LivePanel({ sessions, showToast, rr }) {
  const EMPTY = { id:"", title:"", instructor:"", date:"", time:"", joinUrl:"", imageUrl:"", description:"" };
  const [form,    setForm]    = useState(EMPTY);
  const [editing, setEditing] = useState(false);
  const set = key => value => setForm(p => ({ ...p, [key]: value }));

  function save() {
    if (!form.title || !form.joinUrl) { showToast("العنوان والرابط مطلوبان", "error"); return; }
    saveLiveSession(form);
    setForm(EMPTY); setEditing(false);
    showToast("تم حفظ اللقاء"); rr();
  }

  return (
    <div className="anim-fade-in">
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 20 }}>
        <SectionHeader title="اللقاءات المباشرة" />
        <Btn onClick={() => { setForm(EMPTY); setEditing(true); }}>+ إضافة لقاء</Btn>
      </div>

      {editing && (
        <Glass style={{ padding: "22px 24px", marginBottom: 24 }}>
          <h3 style={{ margin: "0 0 16px", color: "var(--text)", fontSize: 16 }}>{form.id ? "✏ تعديل" : "➕ لقاء جديد"}</h3>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "0 16px" }}>
            <Field label="عنوان اللقاء *" value={form.title}       onChange={set("title")}       placeholder="اسم المحاضرة" />
            <Field label="المحاضر"        value={form.instructor}  onChange={set("instructor")}  placeholder="اسم المحاضر" />
            <Field label="التاريخ"         value={form.date}        onChange={set("date")}        type="date" />
            <Field label="الوقت"           value={form.time}        onChange={set("time")}        type="time" />
          </div>
          <Field label="رابط الانضمام *"    value={form.joinUrl}     onChange={set("joinUrl")}     placeholder="https://zoom.us/j/..." />
          <Field label="رابط صورة الإعلان" value={form.imageUrl}    onChange={set("imageUrl")}    placeholder="https://..." />
          <Field label="وصف مختصر"         value={form.description} onChange={set("description")} as="textarea" rows={2} />
          <div style={{ display: "flex", gap: 10 }}>
            <Btn onClick={save}>💾 حفظ</Btn>
            <Btn onClick={() => setEditing(false)} variant="ghost">إلغاء</Btn>
          </div>
        </Glass>
      )}

      {sessions.length === 0 && !editing && (
        <Glass style={{ padding: 40, textAlign: "center" }}><p style={{ color: "var(--text-3)" }}>أضف أول لقاء!</p></Glass>
      )}

      <div className="grid-auto-300">
        {sessions.map(s => (
          <Glass key={s.id} className="live-card">
            {s.imageUrl
              ? <div className="live-card-image" style={{ backgroundImage: `url(${s.imageUrl})` }} />
              : <div className="live-card-placeholder">📡</div>
            }
            <div style={{ padding: "16px 18px" }}>
              <h4 style={{ margin: "0 0 4px", color: "var(--text)", fontSize: 15, fontWeight: 800 }}>{s.title}</h4>
              {s.instructor  && <p style={{ color: "var(--text-2)", margin: "0 0 6px", fontSize: 12 }}>{s.instructor}</p>}
              {s.description && <p style={{ color: "var(--text-3)", margin: "0 0 10px", fontSize: 11, lineHeight: 1.5 }}>{s.description}</p>}
              <div style={{ display: "flex", gap: 8, marginBottom: 12, flexWrap: "wrap" }}>
                {s.date && <Pill color="var(--info)"    bg="rgba(58,139,192,0.1)">📅 {s.date}</Pill>}
                {s.time && <Pill color="var(--success)" bg="rgba(39,174,96,0.1)">⏰ {s.time}</Pill>}
              </div>
              <div style={{ display: "flex", gap: 8 }}>
                <Btn size="sm" variant="subtle" onClick={() => { setForm(s); setEditing(true); }}>✏ تعديل</Btn>
                <Btn size="sm" variant="danger" onClick={() => { deleteLiveSession(s.id); showToast("تم الحذف","error"); rr(); }}>🗑</Btn>
              </div>
            </div>
          </Glass>
        ))}
      </div>
    </div>
  );
}

// ─── Certificates panel ─────────────────────────────────────
function CertsPanel({ students, certs, user, courses, allProgress, allResults, quizzes, showToast, rr }) {
  const eligible = students.filter(s => {
    if (certs.find(c => c.userId === s.id)) return false;
    const prog    = allProgress[s.id] || {};
    const allDone = courses.every(c => isCourseComplete(prog[c.id] || {}, c.lectureCount || 0));
    if (!allDone) return false;
    return courses.every(c => {
      const q = quizzes.find(q => q.courseId === c.id);
      if (!q) return true;
      const r = allResults.find(r => r.userId === s.id && r.quizId === q.id);
      return r?.passed;
    });
  });

  return (
    <div className="anim-fade-in">
      <SectionHeader title="إدارة الشهادات" />

      {eligible.length > 0 && (
        <Glass style={{ padding: "20px 24px", marginBottom: 24, border: "1px solid rgba(39,174,96,0.2)" }}>
          <h3 style={{ margin: "0 0 14px", color: "var(--success)", fontSize: 16 }}>
            ✅ مؤهلون للشهادة ({toArabic(eligible.length)})
          </h3>
          {eligible.map(s => (
            <div key={s.id} style={{ display: "flex", alignItems: "center", gap: 12, padding: "11px 0", borderBottom: "1px solid var(--border)" }}>
              <div className="student-avatar">{s.avatar}</div>
              <div style={{ flex: 1 }}>
                <div style={{ fontWeight: 700, color: "var(--text)", fontSize: 14 }}>{s.name}</div>
                <div style={{ fontSize: 11, color: "var(--text-3)" }}>أتم جميع المراحل واجتاز جميع الاختبارات</div>
              </div>
              <Btn variant="gold" onClick={() => {
                issueCertificate({ userId: s.id, userName: s.name, issuedBy: user.name });
                showToast(`تم إصدار شهادة ${s.name} 🏅`);
                rr();
              }}>🏅 إصدار</Btn>
            </div>
          ))}
        </Glass>
      )}

      <Glass hover={false} style={{ padding: "22px 24px" }}>
        <h3 style={{ margin: "0 0 16px", color: "var(--text)", fontSize: 16 }}>الشهادات الصادرة ({toArabic(certs.length)})</h3>
        {certs.length === 0 && <p style={{ color: "var(--text-3)" }}>لم تُصدر شهادات بعد</p>}
        {certs.map(c => (
          <div key={c.id} style={{ display: "flex", gap: 14, alignItems: "center", padding: "12px 0", borderBottom: "1px solid var(--border)" }}>
            <span style={{ fontSize: 26 }}>🏅</span>
            <div style={{ flex: 1 }}>
              <div style={{ fontWeight: 700, color: "var(--text)", fontSize: 14 }}>{c.userName}</div>
              <div style={{ fontSize: 11, color: "var(--text-3)" }}>{c.issuedBy} · {formatDate(c.issuedAt)}</div>
            </div>
            <Pill color="var(--gold)" bg="var(--gold-bg)">شهادة إتمام</Pill>
          </div>
        ))}
      </Glass>
    </div>
  );
}
