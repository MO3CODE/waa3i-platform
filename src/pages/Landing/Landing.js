// ============================================================
// src/pages/Landing/Landing.js
// Public-facing landing page
// ============================================================
import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { COURSES, TOTAL_DAYS } from "../../data/courses";
import { toArabic } from "../../utils/helpers";
import { Btn, Glass, Pill } from "../../components/ui";

export default function Landing() {
  const navigate = useNavigate();
  const onStart  = () => navigate("/auth");
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const handler = () => setScrolled(window.scrollY > 60);
    window.addEventListener("scroll", handler);
    return () => window.removeEventListener("scroll", handler);
  }, []);

  const STATS = [
    { value: toArabic(COURSES.length), label: "مادة" },
    { value: toArabic(COURSES.reduce((s, c) => s + c.lectures, 0)), label: "محاضرة" },
    { value: toArabic(TOTAL_DAYS), label: "يوماً" },
    { value: "مجاني", label: "للجميع" },
  ];

  const FEATURES = [
    { icon: "🎬", title: "فيديو تفاعلي",      desc: "تتبع تلقائي — تُحتسب المحاضرة عند ٨٠٪ مشاهدة" },
    { icon: "📝", title: "اختبارات فورية",     desc: "تصحيح لحظي مع شرح الإجابات الصحيحة"           },
    { icon: "🏅", title: "شهادة معتمدة",       desc: "شهادة إتمام رسمية من الأكاديمية"              },
    { icon: "📡", title: "لقاءات مباشرة",     desc: "جلسات مع المشايخ والمحاضرين أونلاين"          },
    { icon: "📌", title: "ملاحظات بالثواني",   desc: "أضف ملاحظة مرتبطة بثانية معينة في الفيديو"   },
    { icon: "🌙", title: "مجاني للجميع",       desc: "متاح لكل مسلم من ١٢ سنة فأكثر"               },
  ];

  return (
    <div className="landing">
      {/* ── Navbar ── */}
      <nav className={`landing-nav ${scrolled ? "scrolled" : ""}`}>
        <div className="landing-logo">
          <span className="icon">☽</span>
          <span className="name">وعي</span>
        </div>
        <div style={{ display: "flex", gap: 12, alignItems: "center" }}>
          <button
            onClick={onStart}
            style={{
              background: "none", border: "1px solid var(--border-2)",
              color: "var(--text-2)", borderRadius: 24, padding: "8px 20px",
              cursor: "pointer", fontFamily: "var(--font)", fontSize: 13,
              fontWeight: 600, transition: "all 0.2s",
            }}
            onMouseEnter={e => { e.currentTarget.style.borderColor = "var(--gold)"; e.currentTarget.style.color = "var(--gold)"; }}
            onMouseLeave={e => { e.currentTarget.style.borderColor = "var(--border-2)"; e.currentTarget.style.color = "var(--text-2)"; }}
          >
            تسجيل الدخول
          </button>
          <Btn onClick={onStart} size="sm">ابدأ مجاناً</Btn>
        </div>
      </nav>

      {/* ── Hero ── */}
      <section className="hero">
        <div className="hero-bg-radial-1" />
        <div className="hero-bg-radial-2" />
        <div className="hero-grid" />

        <div className="hero-ornament anim-float">
          <span>☽</span>
          <div className="hero-ornament-ring" />
        </div>

        <h1 className="hero-title anim-fade-up">مبادرة وعي</h1>

        <p className="hero-subtitle anim-fade-up delay-1">بما لا يسع المسلم جهله</p>

        <p className="hero-desc anim-fade-up delay-2">
          برنامج تعليمي إسلامي متكامل يغطي أساسيات الشريعة في بيئة تعليمية تفاعلية حديثة
        </p>

        <div className="hero-stats anim-fade-up delay-3">
          {STATS.map(s => (
            <div key={s.label} className="stat-card">
              <div className="stat-value">{s.value}</div>
              <div className="stat-label">{s.label}</div>
            </div>
          ))}
        </div>

        <div className="anim-fade-up delay-4" style={{ display: "flex", gap: 12, flexWrap: "wrap", justifyContent: "center" }}>
          <Btn onClick={onStart} size="lg">ابدأ رحلتك مجاناً ←</Btn>
          <Btn onClick={onStart} size="lg" variant="ghost">تسجيل الدخول</Btn>
        </div>

        <div style={{ position: "absolute", bottom: 32, color: "var(--text-3)", fontSize: 20 }} className="anim-float">⌄</div>
      </section>

      {/* ── Courses ── */}
      <section className="courses-section">
        <div style={{ maxWidth: 1060, margin: "0 auto" }}>
          <div style={{ textAlign: "center", marginBottom: 52 }}>
            <p className="section-eyebrow">المنهج الدراسي</p>
            <h2 style={{ fontSize: "clamp(24px,4vw,38px)", fontWeight: 900, margin: 0 }}>المواد الست</h2>
          </div>

          <div className="courses-grid">
            {COURSES.map((course, i) => (
              <Glass key={course.id} className={`course-landing-card anim-fade-up delay-${Math.min(i + 1, 6)}`}>
                <div className="accent-glow" style={{ background: course.accent }} />
                <div style={{ display: "flex", gap: 14, alignItems: "flex-start" }}>
                  <div style={{
                    width: 48, height: 48, borderRadius: 12, flexShrink: 0,
                    background: `${course.accent}18`, border: `1px solid ${course.accent}33`,
                    display: "flex", alignItems: "center", justifyContent: "center",
                    fontSize: 20, color: course.accent, fontWeight: 900,
                  }}>
                    {course.icon}
                  </div>
                  <div style={{ flex: 1 }}>
                    <div style={{ fontWeight: 800, fontSize: 15, color: "var(--text)", marginBottom: 3 }}>{course.full}</div>
                    <div style={{ fontSize: 12, color: "var(--text-3)", marginBottom: 8 }}>{course.instructor}</div>
                    <div style={{ fontSize: 13, color: "var(--text-2)", lineHeight: 1.6 }}>{course.desc}</div>
                  </div>
                </div>
                <div style={{ display: "flex", gap: 8, marginTop: 14, flexWrap: "wrap" }}>
                  <Pill color={course.accent} bg={`${course.accent}18`}>📚 {toArabic(course.lectures)} محاضرة</Pill>
                  <Pill color="var(--text-3)" bg="var(--surface)">📅 {toArabic(course.days)} أيام</Pill>
                </div>
              </Glass>
            ))}
          </div>
        </div>
      </section>

      {/* ── Features ── */}
      <section className="features-section">
        <div style={{ maxWidth: 960, margin: "0 auto" }}>
          <div style={{ textAlign: "center", marginBottom: 52 }}>
            <p className="section-eyebrow">لماذا منصة وعي؟</p>
            <h2 style={{ fontSize: "clamp(22px,4vw,36px)", fontWeight: 900, margin: 0 }}>تجربة تعليمية فريدة</h2>
          </div>
          <div className="features-grid">
            {FEATURES.map((f, i) => (
              <Glass key={f.title} className={`anim-fade-up delay-${Math.min(i + 1, 6)}`}
                style={{ padding: "24px 20px", textAlign: "center" }}>
                <div style={{ fontSize: 32, marginBottom: 12 }}>{f.icon}</div>
                <div style={{ fontWeight: 700, fontSize: 14, color: "var(--text)", marginBottom: 6 }}>{f.title}</div>
                <div style={{ fontSize: 12, color: "var(--text-3)", lineHeight: 1.7 }}>{f.desc}</div>
              </Glass>
            ))}
          </div>
        </div>
      </section>

      {/* ── CTA ── */}
      <section className="cta-section">
        <div style={{ maxWidth: 520, margin: "0 auto" }}>
          <div style={{ fontSize: 48, marginBottom: 20 }} className="anim-float">☽</div>
          <h2 style={{ fontSize: "clamp(22px,4vw,36px)", fontWeight: 900, margin: "0 0 12px" }}>ابدأ اليوم</h2>
          <p style={{ color: "var(--text-2)", marginBottom: 36, fontSize: 16, lineHeight: 1.8 }}>
            انضم لمبادرة وعي وابدأ رحلتك في تعلّم أساسيات دينك
          </p>
          <Btn onClick={onStart} size="lg">سجّل مجاناً الآن ←</Btn>
          <p style={{ color: "var(--text-3)", marginTop: 20, fontSize: 12 }}>أكاديمية علوم الدولية · isaacademy.org</p>
        </div>
      </section>
    </div>
  );
}
