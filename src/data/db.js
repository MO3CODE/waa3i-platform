// ============================================================
// src/data/db.js
// Firebase Firestore + Authentication — v2
// ============================================================

import { initializeApp } from "firebase/app";
import {
  getAuth,
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signOut,
} from "firebase/auth";
import {
  getFirestore,
  doc, getDoc, setDoc, updateDoc, deleteDoc,
  collection, getDocs, addDoc, query, where,
  serverTimestamp, arrayUnion,
} from "firebase/firestore";

import { COURSES as STATIC_COURSES } from "./courses";

const firebaseConfig = {
  apiKey:            "AIzaSyCxIRMS_hYLmFfz5iP4bqrJ3vNrsrFZxO0",
  authDomain:        "waa3i-platform.firebaseapp.com",
  projectId:         "waa3i-platform",
  storageBucket:     "waa3i-platform.firebasestorage.app",
  messagingSenderId: "379402008395",
  appId:             "1:379402008395:web:a30b6cae47d38d6ef41ace",
};

const firebaseApp = initializeApp(firebaseConfig);
const auth        = getAuth(firebaseApp);
const db          = getFirestore(firebaseApp);

const col = (path)     => collection(db, path);
const ref = (path, id) => doc(db, path, id);

function toISO(ts) {
  if (!ts) return new Date().toISOString();
  if (typeof ts === "string") return ts;
  if (ts.toDate) return ts.toDate().toISOString();
  return new Date().toISOString();
}

// ── ROLES ──────────────────────────────────────────────────
export const ROLES = {
  SUPERADMIN:      "superadmin",
  CONTENT_MANAGER: "content_manager",
  INSTRUCTOR_ADMIN:"instructor_admin",
  STUDENT_ADMIN:   "student_admin",
  STUDENT:         "student",
};

export const ROLE_LABELS = {
  superadmin:       "جوكر (مدير عام)",
  content_manager:  "مدير محتوى",
  instructor_admin: "مدير أستاذ",
  student_admin:    "مشرف طلاب",
  student:          "طالب",
};

export function isAdmin(role) {
  return ["superadmin", "content_manager", "instructor_admin", "student_admin"].includes(role);
}

export function canManageContent(role) {
  return ["superadmin", "content_manager"].includes(role);
}

export function canManageQuizzes(role) {
  return ["superadmin", "content_manager", "instructor_admin"].includes(role);
}

export function canManageStudents(role) {
  return ["superadmin", "student_admin"].includes(role);
}

export function canManageRoles(role) {
  return role === "superadmin";
}

// ── AUTH ───────────────────────────────────────────────────

export async function register({ name, email, password }) {
  try {
    const cred = await createUserWithEmailAndPassword(auth, email, password);
    const user = {
      id:        cred.user.uid,
      role:      ROLES.STUDENT,
      name,
      email,
      createdAt: new Date().toISOString().split("T")[0],
      avatar:    name[0],
      language:  "ar",
    };
    await setDoc(ref("users", cred.user.uid), user);
    return { user };
  } catch (e) {
    if (e.code === "auth/email-already-in-use") return { error: "البريد الإلكتروني مسجل مسبقاً" };
    if (e.code === "auth/weak-password")        return { error: "كلمة المرور يجب أن تكون ٦ أحرف على الأقل" };
    return { error: "حدث خطأ، حاول مجدداً" };
  }
}

export async function seedAdminUser() {
  const ADMIN_EMAIL    = "admin@waa3i.org";
  const ADMIN_PASSWORD = "admin123";
  try {
    // If user exists in Firestore, make sure role is superadmin
    const snap = await getDocs(query(col("users"), where("email", "==", ADMIN_EMAIL)));
    if (!snap.empty) {
      const d = snap.docs[0];
      if (d.data().role !== ROLES.SUPERADMIN) {
        await updateDoc(d.ref, { role: ROLES.SUPERADMIN });
      }
      return;
    }

    const cred = await createUserWithEmailAndPassword(auth, ADMIN_EMAIL, ADMIN_PASSWORD);
    await setDoc(ref("users", cred.user.uid), {
      id:        cred.user.uid,
      role:      ROLES.SUPERADMIN,
      name:      "الجوكر",
      email:     ADMIN_EMAIL,
      createdAt: new Date().toISOString().split("T")[0],
      avatar:    "ج",
      language:  "ar",
    });
  } catch (e) {
    if (e.code !== "auth/email-already-in-use") {
      console.warn("seedAdminUser:", e.message);
    }
  }
}

export async function login({ email, password }) {
  try {
    const cred = await signInWithEmailAndPassword(auth, email, password);
    const snap = await getDoc(ref("users", cred.user.uid));
    if (!snap.exists()) return { error: "المستخدم غير موجود" };
    return { user: snap.data() };
  } catch {
    return { error: "البريد أو كلمة المرور غير صحيحة" };
  }
}

export async function logout() {
  await signOut(auth);
}

// ── USERS ──────────────────────────────────────────────────

export async function getUsers(role) {
  const snap = role
    ? await getDocs(query(col("users"), where("role", "==", role)))
    : await getDocs(col("users"));
  return snap.docs.map(d => d.data());
}

export async function updateUserRole(userId, newRole) {
  await updateDoc(ref("users", userId), { role: newRole });
}

export async function deleteUser(userId) {
  await deleteDoc(ref("users", userId));
}

// ── COURSES
// Static courses are always the base.
// Firestore overrides are merged on top (for admin edits).
// This means courses never disappear even if Firestore is empty/partial.

export async function getCourses() {
  const base = STATIC_COURSES.map(c => ({
    ...c,
    lectureCount: c.lectures,
    isActive: true,
  }));

  try {
    const snap = await getDocs(col("courses"));
    if (snap.empty) return base;

    const firestoreMap = {};
    snap.docs.forEach(d => { firestoreMap[d.id] = { id: d.id, ...d.data() }; });

    // Merge: static base + any Firestore overrides, then add Firestore-only courses
    const merged = base.map(c => firestoreMap[c.id] ? { ...c, ...firestoreMap[c.id] } : c);
    Object.values(firestoreMap).forEach(fc => {
      if (!base.find(c => c.id === fc.id)) merged.push(fc);
    });

    return merged.sort((a, b) => (a.order ?? 0) - (b.order ?? 0));
  } catch {
    return base;
  }
}

export async function getCourse(courseId) {
  const staticCourse = STATIC_COURSES.find(c => c.id === courseId);
  const base = staticCourse ? { ...staticCourse, lectureCount: staticCourse.lectures, isActive: true } : null;
  try {
    const snap = await getDoc(ref("courses", courseId));
    if (snap.exists()) return base ? { ...base, ...snap.data(), id: courseId } : { id: snap.id, ...snap.data() };
  } catch {}
  return base;
}

export async function saveCourse(course) {
  const { id, ...data } = course;
  if (id) {
    await setDoc(ref("courses", id), data, { merge: true });
    return id;
  } else {
    const docRef = await addDoc(col("courses"), data);
    return docRef.id;
  }
}

export async function deleteCourse(courseId) {
  await deleteDoc(ref("courses", courseId));
  const lectSnap = await getDocs(query(col("lectures"), where("courseId", "==", courseId)));
  await Promise.all(lectSnap.docs.map(d => deleteDoc(d.ref)));
}

// ── LECTURES ───────────────────────────────────────────────

function staticLectures(courseId) {
  const c = STATIC_COURSES.find(x => x.id === courseId);
  if (!c) return [];
  return Array.from({ length: c.lectures }, (_, i) => ({
    id:            `${courseId}_${i}`,
    courseId,
    title:         `محاضرة ${i + 1}`,
    playlistIndex: i + 1,
    order:         i,
    isActive:      true,
  }));
}

export async function getLectures(courseId) {
  try {
    const snap = await getDocs(
      query(col("lectures"), where("courseId", "==", courseId))
    );
    if (snap.empty) return staticLectures(courseId);

    const lectures = snap.docs.map(d => ({ id: d.id, ...d.data() }));
    const sorted   = lectures.sort((a, b) => (a.order ?? 0) - (b.order ?? 0));

    // If Firestore has fewer lectures than expected, fall back to static
    const staticC = STATIC_COURSES.find(c => c.id === courseId);
    if (staticC && sorted.length < staticC.lectures) return staticLectures(courseId);

    return sorted;
  } catch {
    return staticLectures(courseId);
  }
}

export async function saveLecture(lecture) {
  const { id, ...data } = lecture;
  if (id) {
    await setDoc(ref("lectures", id), data, { merge: true });
    return id;
  } else {
    const docRef = await addDoc(col("lectures"), data);
    return docRef.id;
  }
}

export async function deleteLecture(lectureId) {
  await deleteDoc(ref("lectures", lectureId));
}

// ── SEED COURSES from static file (runs once) ──────────────

export async function seedCoursesIfEmpty() {
  const snap = await getDocs(col("courses"));
  if (!snap.empty) return;

  for (const course of STATIC_COURSES) {
    const { id, lectures: lectureCount, ...rest } = course;
    await setDoc(ref("courses", id), { ...rest, lectureCount, isActive: true });

    for (let i = 0; i < lectureCount; i++) {
      await addDoc(col("lectures"), {
        courseId:      id,
        title:         `محاضرة ${i + 1}`,
        playlistIndex: i + 1,
        order:         i,
        isActive:      true,
      });
    }
  }
}

// ── PROGRESS ───────────────────────────────────────────────

export async function getProgress(userId) {
  const snap = await getDoc(ref("progress", userId));
  return snap.exists() ? snap.data() : {};
}

export async function getAllProgress() {
  const snap = await getDocs(col("progress"));
  const out = {};
  snap.docs.forEach(d => { out[d.id] = d.data(); });
  return out;
}

export async function setLectureProgress(userId, courseId, lectureId, pct) {
  const snap = await getDoc(ref("progress", userId));
  const data = snap.exists() ? snap.data() : {};
  if (pct <= (data[courseId]?.[lectureId] || 0)) return;
  await setDoc(ref("progress", userId), {
    ...data,
    [courseId]: { ...(data[courseId] || {}), [lectureId]: pct },
  }, { merge: true });
}

// ── NOTES (Firestore) ──────────────────────────────────────

export async function getNotes(userId, courseId, lectureId) {
  try {
    const snap = await getDocs(
      query(
        col("notes"),
        where("userId",    "==", userId),
        where("courseId",  "==", courseId),
        where("lectureId", "==", lectureId)
      )
    );
    const notes = snap.docs.map(d => ({ id: d.id, ...d.data(), createdAt: toISO(d.data().createdAt) }));
    return notes.sort((a, b) => (a.timestamp ?? 0) - (b.timestamp ?? 0));
  } catch {
    return [];
  }
}

export async function addNote({ userId, courseId, lectureId, timestamp, text }) {
  const docRef = await addDoc(col("notes"), {
    userId, courseId, lectureId, timestamp, text,
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  });
  return { id: docRef.id, userId, courseId, lectureId, timestamp, text };
}

export async function updateNote(noteId, text) {
  await updateDoc(ref("notes", noteId), { text, updatedAt: serverTimestamp() });
}

export async function deleteNote(noteId) {
  await deleteDoc(ref("notes", noteId));
}

export async function getAllNotesCount(userId, courseId) {
  const snap = await getDocs(
    query(col("notes"), where("userId", "==", userId), where("courseId", "==", courseId))
  );
  const counts = {};
  snap.docs.forEach(d => {
    const lid = d.data().lectureId;
    counts[lid] = (counts[lid] || 0) + 1;
  });
  return counts;
}

// ── QUIZZES ────────────────────────────────────────────────

export async function getQuizzes() {
  const snap = await getDocs(col("quizzes"));
  return snap.docs.map(d => ({ id: d.id, ...d.data() }));
}

export async function getQuizByCourse(courseId) {
  const snap = await getDocs(query(col("quizzes"), where("courseId", "==", courseId)));
  if (snap.empty) return null;
  const d = snap.docs[0];
  return { id: d.id, ...d.data() };
}

export async function saveQuiz(quiz) {
  const { id, ...data } = quiz;
  if (id && !id.startsWith("qz_")) {
    await setDoc(ref("quizzes", id), data);
  } else {
    await addDoc(col("quizzes"), data);
  }
}

export async function deleteQuiz(id) {
  await deleteDoc(ref("quizzes", id));
}

// ── QUIZ RESULTS ───────────────────────────────────────────

export async function saveQuizResult(result) {
  await addDoc(col("quizResults"), { ...result, date: serverTimestamp() });
}

export async function getQuizResults(userId) {
  const snap = userId
    ? await getDocs(query(col("quizResults"), where("userId", "==", userId)))
    : await getDocs(col("quizResults"));
  return snap.docs.map(d => ({ id: d.id, ...d.data(), date: toISO(d.data().date) }));
}

export async function getUserQuizResult(userId, quizId) {
  const snap = await getDocs(
    query(col("quizResults"), where("userId", "==", userId), where("quizId", "==", quizId))
  );
  if (snap.empty) return null;
  const d = snap.docs[0];
  return { id: d.id, ...d.data(), date: toISO(d.data().date) };
}

// ── CERTIFICATES ───────────────────────────────────────────

export async function issueCertificate({ userId, userName, issuedBy }) {
  const docRef = await addDoc(col("certificates"), {
    userId, userName, issuedBy, issuedAt: serverTimestamp(),
  });
  return { id: docRef.id, userId, userName, issuedBy, issuedAt: new Date().toISOString() };
}

export async function getCertificates(userId) {
  const snap = userId
    ? await getDocs(query(col("certificates"), where("userId", "==", userId)))
    : await getDocs(col("certificates"));
  return snap.docs.map(d => ({ id: d.id, ...d.data(), issuedAt: toISO(d.data().issuedAt) }));
}

export async function getUserCertificate(userId) {
  const snap = await getDocs(query(col("certificates"), where("userId", "==", userId)));
  if (snap.empty) return null;
  const d = snap.docs[0];
  return { id: d.id, ...d.data(), issuedAt: toISO(d.data().issuedAt) };
}

// ── NOTIFICATIONS ──────────────────────────────────────────

export async function getNotifications(role) {
  const snap = await getDocs(col("notifications"));
  return snap.docs
    .map(d => ({ id: d.id, ...d.data(), createdAt: toISO(d.data().createdAt) }))
    .filter(n => n.targetRole === "all" || n.targetRole === role)
    .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
}

export async function addNotification(notif) {
  await addDoc(col("notifications"), { ...notif, createdAt: serverTimestamp(), read: [] });
}

export async function markNotifRead(notifId, userId) {
  await updateDoc(ref("notifications", notifId), { read: arrayUnion(userId) });
}

export async function deleteNotification(id) {
  await deleteDoc(ref("notifications", id));
}

// ── LIVE SESSIONS ──────────────────────────────────────────

export async function getLiveSessions() {
  const snap = await getDocs(col("liveSessions"));
  return snap.docs.map(d => ({ id: d.id, ...d.data() }));
}

export async function saveLiveSession(session) {
  const { id, ...data } = session;
  if (id && !id.startsWith("ls_")) {
    await setDoc(ref("liveSessions", id), data);
  } else {
    await addDoc(col("liveSessions"), data);
  }
}

export async function deleteLiveSession(id) {
  await deleteDoc(ref("liveSessions", id));
}
