// ============================================================
// src/pages/Admin/tabs/CoursesTab.js
// ============================================================
import React, { useState, useEffect } from "react";
import {
  getCourses, saveCourse, deleteCourse,
  getLectures, saveLecture, deleteLecture,
} from "../../../data/db";
import { Btn, Modal, Field, Glass } from "../../../components/ui";

const EMPTY_COURSE = {
  title: "", full: "", instructor: "", desc: "", duration: "",
  color: "#2E7D52", accent: "#3DAA6E", icon: "✦",
  playlistId: "", order: 0, lectureCount: 0,
  days: 0, isActive: true,
};

const EMPTY_LECTURE = { title: "", playlistIndex: 1, order: 0, isActive: true };

export default function CoursesTab() {
  const [courses,       setCourses]       = useState([]);
  const [activeCourse,  setActiveCourse]  = useState(null);
  const [lectures,      setLectures]      = useState([]);
  const [loading,       setLoading]       = useState(true);
  const [courseModal,   setCourseModal]   = useState(null);
  const [lectureModal,  setLectureModal]  = useState(null);
  const [courseForm,    setCourseForm]    = useState(EMPTY_COURSE);
  const [lectureForm,   setLectureForm]   = useState(EMPTY_LECTURE);
  const [saving,        setSaving]        = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(null);

  useEffect(() => { loadCourses(); }, []);
  useEffect(() => {
    if (activeCourse) loadLectures(activeCourse.id);
    else setLectures([]);
  }, [activeCourse]);

  async function loadCourses() {
    setLoading(true);
    setCourses(await getCourses());
    setLoading(false);
  }

  async function loadLectures(courseId) {
    setLectures(await getLectures(courseId));
  }

  function openCourseModal(course) {
    setCourseForm(course
      ? { ...EMPTY_COURSE, ...course }
      : { ...EMPTY_COURSE, order: courses.length }
    );
    setCourseModal(course || "new");
  }

  function openLectureModal(lec) {
    setLectureForm(lec
      ? { ...lec }
      : { ...EMPTY_LECTURE, order: lectures.length, playlistIndex: lectures.length + 1, courseId: activeCourse.id }
    );
    setLectureModal(lec || "new");
  }

  async function handleSaveCourse() {
    if (!courseForm.title || !courseForm.instructor || !courseForm.playlistId) return;
    setSaving(true);
    const id = courseModal === "new" ? undefined : courseModal.id;
    const data = {
      ...courseForm,
      lectureCount: parseInt(courseForm.lectureCount) || 0,
      order:        parseInt(courseForm.order) || 0,
      days:         parseInt(courseForm.days) || 0,
      full:         courseForm.full || courseForm.title,
    };
    await saveCourse({ ...data, id });
    await loadCourses();
    // refresh active course data
    if (id && activeCourse?.id === id) {
      setActiveCourse(prev => ({ ...prev, ...data }));
    }
    setCourseModal(null);
    setSaving(false);
  }

  async function handleSaveLecture() {
    if (!lectureForm.title) return;
    setSaving(true);
    const id = lectureModal === "new" ? undefined : lectureModal.id;
    await saveLecture({ ...lectureForm, id, courseId: activeCourse.id });
    await loadLectures(activeCourse.id);
    setLectureModal(null);
    setSaving(false);
  }

  async function handleDeleteCourse(course) {
    await deleteCourse(course.id);
    if (activeCourse?.id === course.id) setActiveCourse(null);
    await loadCourses();
    setConfirmDelete(null);
  }

  async function handleDeleteLecture(lec) {
    await deleteLecture(lec.id);
    await loadLectures(activeCourse.id);
    setConfirmDelete(null);
  }

  const setCF = k => v => setCourseForm(p => ({ ...p, [k]: v }));
  const setLF = k => v => setLectureForm(p => ({ ...p, [k]: v }));

  if (loading) return <div className="tab-empty">جاري التحميل...</div>;

  return (
    <div className="courses-tab">

      {/* ── Courses Panel ── */}
      <div className="courses-panel">
        <div className="panel-header">
          <h3>المواد ({courses.length})</h3>
          <Btn size="sm" onClick={() => openCourseModal(null)}>+ مادة جديدة</Btn>
        </div>

        <div className="courses-list">
          {courses.map(course => (
            <div
              key={course.id}
              className={`course-row ${activeCourse?.id === course.id ? "active" : ""}`}
              onClick={() => setActiveCourse(course)}
              style={{ borderRight: `3px solid ${course.accent || course.color || "var(--gold)"}` }}
            >
              <div className="course-row-info">
                <span style={{ fontSize: 18, color: course.accent || course.color }}>{course.icon || "📚"}</span>
                <div>
                  <div className="course-row-title">
                    {course.title}
                    {!course.isActive && (
                      <span style={{ fontSize: 10, color: "var(--text-3)", background: "var(--surface-2)", borderRadius: 4, padding: "1px 6px", marginRight: 6 }}>
                        مسودة
                      </span>
                    )}
                  </div>
                  <div className="course-row-sub">{course.instructor} — {course.lectureCount || 0} محاضرة</div>
                </div>
              </div>
              <div className="course-row-actions" onClick={e => e.stopPropagation()}>
                <button className="icon-btn" title="تعديل" onClick={() => openCourseModal(course)}>✎</button>
                <button className="icon-btn danger" title="حذف" onClick={() => setConfirmDelete({ type: "course", item: course })}>✕</button>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* ── Lectures Panel ── */}
      <div className="lectures-panel">
        {!activeCourse ? (
          <div className="tab-empty select-course-hint">اختر مادة من القائمة لإدارة محاضراتها</div>
        ) : (
          <>
            <div className="panel-header">
              <h3>محاضرات: {activeCourse.title} ({lectures.length})</h3>
              <Btn size="sm" onClick={() => openLectureModal(null)}>+ محاضرة</Btn>
            </div>
            {lectures.length === 0 && <div className="tab-empty">لا توجد محاضرات.</div>}
            <div className="lectures-list">
              {lectures.map((lec, i) => (
                <div key={lec.id} className="lecture-row">
                  <span className="lec-num">{i + 1}</span>
                  <div className="lec-info">
                    <div className="lec-title">{lec.title}</div>
                    <div className="lec-sub">فيديو رقم {lec.playlistIndex} في القائمة</div>
                  </div>
                  <div className="lec-actions">
                    <button className="icon-btn" onClick={() => openLectureModal(lec)}>✎</button>
                    <button className="icon-btn danger" onClick={() => setConfirmDelete({ type: "lecture", item: lec })}>✕</button>
                  </div>
                </div>
              ))}
            </div>
          </>
        )}
      </div>

      {/* ── Course Modal ── */}
      {courseModal && (
        <Modal
          title={courseModal === "new" ? "إضافة مادة جديدة" : `تعديل: ${courseModal.title}`}
          onClose={() => setCourseModal(null)}
        >
          <div className="form-grid-2">
            <Field label="اسم المادة *" value={courseForm.title} onChange={setCF("title")} placeholder="مثال: الإيمان" />
            <Field label="الاسم الكامل" value={courseForm.full} onChange={setCF("full")} placeholder="مثال: مادة الإيمان" />
            <Field label="المدرس *" value={courseForm.instructor} onChange={setCF("instructor")} placeholder="د. اسم المدرس" />
            <Field label="YouTube Playlist ID *" value={courseForm.playlistId} onChange={setCF("playlistId")} placeholder="PLxxxxxxxxxx" />
            <Field label="وصف المادة" value={courseForm.desc} onChange={setCF("desc")} placeholder="وصف مختصر..." />
            <Field label="مدة المحاضرة" value={courseForm.duration} onChange={setCF("duration")} placeholder="مثال: ١٠–١٥ دقيقة" />
            <Field label="عدد المحاضرات" value={String(courseForm.lectureCount)} onChange={v => setCF("lectureCount")(v)} type="number" />
            <Field label="عدد الأيام المقترحة" value={String(courseForm.days)} onChange={v => setCF("days")(v)} type="number" />
            <Field label="الترتيب" value={String(courseForm.order)} onChange={v => setCF("order")(v)} type="number" />
            <Field label="الأيقونة" value={courseForm.icon} onChange={setCF("icon")} placeholder="✦" />
            <div className="field-group">
              <label className="field-label">اللون الرئيسي</label>
              <input type="color" value={courseForm.color} onChange={e => setCF("color")(e.target.value)} className="color-input" />
            </div>
            <div className="field-group">
              <label className="field-label">لون التمييز</label>
              <input type="color" value={courseForm.accent} onChange={e => setCF("accent")(e.target.value)} className="color-input" />
            </div>
          </div>

          {/* Draft / Publish toggle */}
          <Glass style={{ padding: "12px 16px", marginTop: 12, display: "flex", alignItems: "center", justifyContent: "space-between" }}>
            <span style={{ fontSize: 13, color: "var(--text-2)" }}>
              {courseForm.isActive ? "✅ منشورة — تظهر للطلاب" : "📝 مسودة — مخفية عن الطلاب"}
            </span>
            <button
              onClick={() => setCF("isActive")(!courseForm.isActive)}
              style={{
                background: courseForm.isActive ? "rgba(39,174,96,0.15)" : "var(--surface-2)",
                border: `1px solid ${courseForm.isActive ? "var(--success)" : "var(--border)"}`,
                color: courseForm.isActive ? "var(--success)" : "var(--text-3)",
                borderRadius: 8, padding: "6px 14px", cursor: "pointer", fontSize: 13, fontWeight: 700,
              }}
            >
              {courseForm.isActive ? "نشر" : "مسودة"}
            </button>
          </Glass>

          <div className="modal-actions" style={{ marginTop: 16 }}>
            <Btn onClick={handleSaveCourse} disabled={saving || !courseForm.title || !courseForm.instructor || !courseForm.playlistId}>
              {saving ? "جاري الحفظ..." : "حفظ"}
            </Btn>
            <Btn variant="ghost" onClick={() => setCourseModal(null)}>إلغاء</Btn>
          </div>
        </Modal>
      )}

      {/* ── Lecture Modal ── */}
      {lectureModal && (
        <Modal
          title={lectureModal === "new" ? "إضافة محاضرة" : "تعديل المحاضرة"}
          onClose={() => setLectureModal(null)}
        >
          <Field label="عنوان المحاضرة *" value={lectureForm.title} onChange={setLF("title")} placeholder="محاضرة ١ — مقدمة" />
          <Field label="رقم الفيديو في القائمة" value={String(lectureForm.playlistIndex)} onChange={v => setLF("playlistIndex")(parseInt(v) || 1)} type="number" />
          <Field label="الترتيب" value={String(lectureForm.order)} onChange={v => setLF("order")(parseInt(v) || 0)} type="number" />
          <div className="modal-actions" style={{ marginTop: 16 }}>
            <Btn onClick={handleSaveLecture} disabled={saving || !lectureForm.title}>{saving ? "جاري الحفظ..." : "حفظ"}</Btn>
            <Btn variant="ghost" onClick={() => setLectureModal(null)}>إلغاء</Btn>
          </div>
        </Modal>
      )}

      {/* ── Confirm Delete ── */}
      {confirmDelete && (
        <Modal title="تأكيد الحذف" onClose={() => setConfirmDelete(null)}>
          <p style={{ color: "var(--text-2)", marginBottom: 20 }}>
            هل أنت متأكد من حذف <strong style={{ color: "var(--gold)" }}>{confirmDelete.item.title}</strong>
            {confirmDelete.type === "course" && " وجميع محاضراتها"}؟
            <br />هذا الإجراء لا يمكن التراجع عنه.
          </p>
          <div className="modal-actions">
            <Btn variant="danger" onClick={() =>
              confirmDelete.type === "course"
                ? handleDeleteCourse(confirmDelete.item)
                : handleDeleteLecture(confirmDelete.item)
            }>نعم، احذف</Btn>
            <Btn variant="ghost" onClick={() => setConfirmDelete(null)}>إلغاء</Btn>
          </div>
        </Modal>
      )}
    </div>
  );
}
