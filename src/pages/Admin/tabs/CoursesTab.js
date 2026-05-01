// ============================================================
// src/pages/Admin/tabs/CoursesTab.js
// إدارة المواد والمحاضرات — للجوكر ومدير المحتوى
// ============================================================
import React, { useState, useEffect } from "react";
import {
  getCourses, saveCourse, deleteCourse,
  getLectures, saveLecture, deleteLecture,
} from "../../../data/db";
import { Btn, Modal, Field } from "../../../components/ui";

const EMPTY_COURSE = {
  title: "", instructor: "", desc: "", color: "#2E7D52", accent: "#3DAA6E",
  icon: "✦", playlistId: "", order: 0, lectureCount: 0, isActive: true,
};

const EMPTY_LECTURE = {
  title: "", playlistIndex: 1, order: 0, isActive: true,
};

export default function CoursesTab({ user }) {
  const [courses,        setCourses]        = useState([]);
  const [activeCourse,   setActiveCourse]   = useState(null);
  const [lectures,       setLectures]       = useState([]);
  const [loading,        setLoading]        = useState(true);
  const [courseModal,    setCourseModal]    = useState(null); // null | "new" | {course}
  const [lectureModal,   setLectureModal]   = useState(null);
  const [courseForm,     setCourseForm]     = useState(EMPTY_COURSE);
  const [lectureForm,    setLectureForm]    = useState(EMPTY_LECTURE);
  const [saving,         setSaving]         = useState(false);
  const [confirmDelete,  setConfirmDelete]  = useState(null);

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
    setCourseForm(course ? { ...course } : { ...EMPTY_COURSE, order: courses.length });
    setCourseModal(course || "new");
  }

  function openLectureModal(lecture) {
    setLectureForm(lecture
      ? { ...lecture }
      : { ...EMPTY_LECTURE, order: lectures.length, playlistIndex: lectures.length + 1, courseId: activeCourse.id }
    );
    setLectureModal(lecture || "new");
  }

  async function handleSaveCourse() {
    if (!courseForm.title || !courseForm.instructor) return;
    setSaving(true);
    const id = courseModal === "new" ? null : courseModal.id;
    await saveCourse({ ...courseForm, id: id || undefined });
    await loadCourses();
    setCourseModal(null);
    setSaving(false);
  }

  async function handleSaveLecture() {
    if (!lectureForm.title) return;
    setSaving(true);
    const id = lectureModal === "new" ? null : lectureModal.id;
    await saveLecture({ ...lectureForm, id: id || undefined, courseId: activeCourse.id });
    await loadLectures(activeCourse.id);
    setLectureModal(null);
    setSaving(false);
  }

  async function handleDeleteCourse(course) {
    await deleteCourse(course.id);
    setActiveCourse(null);
    await loadCourses();
    setConfirmDelete(null);
  }

  async function handleDeleteLecture(lecture) {
    await deleteLecture(lecture.id);
    await loadLectures(activeCourse.id);
    setConfirmDelete(null);
  }

  const setCF = k => v => setCourseForm(p => ({ ...p, [k]: v }));
  const setLF = k => v => setLectureForm(p => ({ ...p, [k]: v }));

  if (loading) return <div className="tab-empty">جاري التحميل...</div>;

  return (
    <div className="courses-tab">

      {/* ── Course List Panel ── */}
      <div className="courses-panel">
        <div className="panel-header">
          <h3>المواد ({courses.length})</h3>
          <Btn size="sm" onClick={() => openCourseModal(null)}>+ مادة جديدة</Btn>
        </div>

        {courses.length === 0 && (
          <div className="tab-empty">لا توجد مواد. أضف مادة جديدة.</div>
        )}

        <div className="courses-list">
          {courses.map(course => (
            <div
              key={course.id}
              className={`course-row ${activeCourse?.id === course.id ? "active" : ""}`}
              onClick={() => setActiveCourse(course)}
              style={{ borderRight: `3px solid ${course.color}` }}
            >
              <div className="course-row-info">
                <span className="course-row-icon" style={{ color: course.color }}>{course.icon}</span>
                <div>
                  <div className="course-row-title">{course.title}</div>
                  <div className="course-row-sub">{course.instructor} — {course.lectureCount} محاضرة</div>
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
          <div className="tab-empty select-course-hint">
            <span>اختر مادة من القائمة لإدارة محاضراتها</span>
          </div>
        ) : (
          <>
            <div className="panel-header">
              <h3>محاضرات: {activeCourse.title} ({lectures.length})</h3>
              <Btn size="sm" onClick={() => openLectureModal(null)}>+ محاضرة جديدة</Btn>
            </div>

            {lectures.length === 0 && (
              <div className="tab-empty">لا توجد محاضرات. أضف محاضرة جديدة.</div>
            )}

            <div className="lectures-list">
              {lectures.map((lec, i) => (
                <div key={lec.id} className="lecture-row">
                  <span className="lec-num">{i + 1}</span>
                  <div className="lec-info">
                    <div className="lec-title">{lec.title}</div>
                    <div className="lec-sub">Playlist Index: {lec.playlistIndex}</div>
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
        <Modal title={courseModal === "new" ? "إضافة مادة جديدة" : "تعديل المادة"} onClose={() => setCourseModal(null)}>
          <div className="form-grid-2">
            <Field label="عنوان المادة *" value={courseForm.title} onChange={setCF("title")} placeholder="مثال: الإيمان" />
            <Field label="اسم المدرس *" value={courseForm.instructor} onChange={setCF("instructor")} placeholder="مثال: د. هيثم طلعت" />
            <Field label="وصف المادة" value={courseForm.desc} onChange={setCF("desc")} placeholder="وصف مختصر..." />
            <Field label="Playlist ID (YouTube)" value={courseForm.playlistId} onChange={setCF("playlistId")} placeholder="PLxxxxxxxxxx" />
            <Field label="عدد المحاضرات" value={String(courseForm.lectureCount)} onChange={v => setCF("lectureCount")(parseInt(v) || 0)} type="number" />
            <Field label="الترتيب" value={String(courseForm.order)} onChange={v => setCF("order")(parseInt(v) || 0)} type="number" />
            <div className="field-group">
              <label className="field-label">اللون الرئيسي</label>
              <input type="color" value={courseForm.color} onChange={e => setCF("color")(e.target.value)} className="color-input" />
            </div>
            <div className="field-group">
              <label className="field-label">لون التمييز</label>
              <input type="color" value={courseForm.accent} onChange={e => setCF("accent")(e.target.value)} className="color-input" />
            </div>
            <Field label="الأيقونة" value={courseForm.icon} onChange={setCF("icon")} placeholder="✦" />
          </div>
          <div className="modal-actions">
            <Btn onClick={handleSaveCourse} disabled={saving}>{saving ? "جاري الحفظ..." : "حفظ"}</Btn>
            <Btn variant="ghost" onClick={() => setCourseModal(null)}>إلغاء</Btn>
          </div>
        </Modal>
      )}

      {/* ── Lecture Modal ── */}
      {lectureModal && (
        <Modal title={lectureModal === "new" ? "إضافة محاضرة" : "تعديل المحاضرة"} onClose={() => setLectureModal(null)}>
          <Field label="عنوان المحاضرة *" value={lectureForm.title} onChange={setLF("title")} placeholder="مثال: محاضرة ١ — مقدمة" />
          <Field label="رقم الفيديو في القائمة (Playlist Index)" value={String(lectureForm.playlistIndex)} onChange={v => setLF("playlistIndex")(parseInt(v) || 1)} type="number" />
          <Field label="الترتيب" value={String(lectureForm.order)} onChange={v => setLF("order")(parseInt(v) || 0)} type="number" />
          <div className="modal-actions">
            <Btn onClick={handleSaveLecture} disabled={saving}>{saving ? "جاري الحفظ..." : "حفظ"}</Btn>
            <Btn variant="ghost" onClick={() => setLectureModal(null)}>إلغاء</Btn>
          </div>
        </Modal>
      )}

      {/* ── Confirm Delete ── */}
      {confirmDelete && (
        <Modal title="تأكيد الحذف" onClose={() => setConfirmDelete(null)}>
          <p style={{ color: "var(--text-2)", marginBottom: 20 }}>
            هل أنت متأكد من حذف{" "}
            <strong style={{ color: "var(--gold)" }}>
              {confirmDelete.item.title}
            </strong>
            {confirmDelete.type === "course" && " وجميع محاضراتها"}؟
            <br />هذا الإجراء لا يمكن التراجع عنه.
          </p>
          <div className="modal-actions">
            <Btn
              variant="danger"
              onClick={() => confirmDelete.type === "course"
                ? handleDeleteCourse(confirmDelete.item)
                : handleDeleteLecture(confirmDelete.item)
              }
            >
              نعم، احذف
            </Btn>
            <Btn variant="ghost" onClick={() => setConfirmDelete(null)}>إلغاء</Btn>
          </div>
        </Modal>
      )}
    </div>
  );
}
