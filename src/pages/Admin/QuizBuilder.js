// ============================================================
// src/pages/Admin/QuizBuilder.js
// Admin: create / edit quizzes
// ============================================================
import React, { useState } from "react";
import { toArabic } from "../../utils/helpers";
import { Btn, Field, Picker, Pill } from "../../components/ui";

const blankQuestion = () => ({
  id:      "q_" + Date.now() + Math.random(),
  text:    "",
  options: ["", "", "", ""],
  correct: 0,
});

export default function QuizBuilder({ courses, initial, onSave, onCancel }) {
  const [form, setForm] = useState(initial || {
    id:        "",
    courseId:  courses[0]?.id || "",
    title:     "",
    timeLimit: 600,
    passMark:  60,
    questions: [blankQuestion()],
  });

  const set    = key => value => setForm(p => ({ ...p, [key]: value }));
  const setNum = key => value => setForm(p => ({ ...p, [key]: Number(value) }));

  function setQuestion(qi, key, value) {
    const qs = [...form.questions];
    qs[qi]   = { ...qs[qi], [key]: value };
    setForm(p => ({ ...p, questions: qs }));
  }

  function setOption(qi, oi, value) {
    const qs   = [...form.questions];
    const opts = [...qs[qi].options];
    opts[oi]   = value;
    qs[qi]     = { ...qs[qi], options: opts };
    setForm(p => ({ ...p, questions: qs }));
  }

  function addQuestion() {
    setForm(p => ({ ...p, questions: [...p.questions, blankQuestion()] }));
  }

  function removeQuestion(qi) {
    if (form.questions.length === 1) return;
    setForm(p => ({ ...p, questions: p.questions.filter((_, i) => i !== qi) }));
  }

  function validate() {
    if (!form.title)    return "يرجى إدخال عنوان الاختبار";
    if (!form.courseId) return "يرجى اختيار المادة";
    for (let i = 0; i < form.questions.length; i++) {
      const q = form.questions[i];
      if (!q.text) return `يرجى إدخال نص السؤال ${toArabic(i + 1)}`;
      for (let j = 0; j < 4; j++) {
        if (!q.options[j]) return `الخيار ${j + 1} للسؤال ${toArabic(i + 1)} فارغ`;
      }
    }
    return null;
  }

  function handleSave() {
    const err = validate();
    if (err) { alert(err); return; }
    onSave({ ...form, id: form.id || "qz_" + Date.now() });
  }

  return (
    <div>
      {/* Meta fields */}
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "0 16px" }}>
        <Field label="عنوان الاختبار *"  value={form.title}     onChange={set("title")}     placeholder="مثل: اختبار مادة الإيمان" />
        <Picker label="المادة *"          value={form.courseId}  onChange={set("courseId")}  options={courses.map(c => ({ v: c.id, l: `${c.icon} ${c.full}` }))} />
      </div>
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "0 16px" }}>
        <Field label="المدة (ثانية)"      value={String(form.timeLimit)} onChange={setNum("timeLimit")} type="number" />
        <Field label="درجة النجاح (%)"    value={String(form.passMark)}  onChange={setNum("passMark")}  type="number" />
      </div>

      {/* Questions */}
      <div style={{ borderTop: "1px solid var(--border)", paddingTop: 16, marginTop: 4 }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 14 }}>
          <h4 style={{ margin: 0, color: "var(--text)", fontSize: 15 }}>
            الأسئلة ({toArabic(form.questions.length)})
          </h4>
          <Btn onClick={addQuestion} size="sm" variant="subtle">+ سؤال جديد</Btn>
        </div>

        {form.questions.map((q, qi) => (
          <div key={q.id} className="quiz-builder-question">
            {/* Question header */}
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 12 }}>
              <Pill color="var(--info)" bg="rgba(58,139,192,0.1)">السؤال {toArabic(qi + 1)}</Pill>
              {form.questions.length > 1 && (
                <button
                  onClick={() => removeQuestion(qi)}
                  style={{ background: "none", border: "none", color: "var(--text-3)", cursor: "pointer", fontSize: 18, lineHeight: 1 }}
                  onMouseEnter={e => { e.currentTarget.style.color = "var(--error)"; }}
                  onMouseLeave={e => { e.currentTarget.style.color = "var(--text-3)"; }}
                >🗑</button>
              )}
            </div>

            <Field
              label="نص السؤال *"
              value={q.text}
              onChange={v => setQuestion(qi, "text", v)}
              placeholder="اكتب السؤال هنا..."
            />

            <label style={{ display: "block", marginBottom: 10, fontSize: 12, color: "var(--text-3)" }}>
              اضغط على الحرف لتحديد الإجابة الصحيحة ✓
            </label>

            {q.options.map((opt, oi) => (
              <div key={oi} className="quiz-option-row">
                <button
                  className="quiz-option-letter"
                  onClick={() => setQuestion(qi, "correct", oi)}
                  style={{
                    background: q.correct === oi ? "var(--gold)" : "var(--surface-2)",
                    color:      q.correct === oi ? "#080E14"     : "var(--text-3)",
                  }}
                >
                  {["أ", "ب", "ج", "د"][oi]}
                </button>
                <input
                  className="quiz-option-input"
                  value={opt}
                  onChange={e => setOption(qi, oi, e.target.value)}
                  placeholder={`الخيار ${["الأول","الثاني","الثالث","الرابع"][oi]}`}
                  style={{ borderColor: q.correct === oi ? "var(--gold)" : "var(--border)" }}
                  onFocus={e => { e.target.style.borderColor = "var(--gold)"; }}
                  onBlur={e  => { e.target.style.borderColor = q.correct === oi ? "var(--gold)" : "var(--border)"; }}
                />
                {q.correct === oi && (
                  <span style={{ color: "var(--success)", fontSize: 12, fontWeight: 700, whiteSpace: "nowrap" }}>✓ صحيح</span>
                )}
              </div>
            ))}
          </div>
        ))}
      </div>

      {/* Save / cancel */}
      <div style={{ display: "flex", gap: 12, paddingTop: 10, borderTop: "1px solid var(--border)" }}>
        <Btn onClick={handleSave}>💾 حفظ الاختبار</Btn>
        <Btn onClick={onCancel} variant="ghost">إلغاء</Btn>
      </div>
    </div>
  );
}
