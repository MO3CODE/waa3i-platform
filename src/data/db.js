// ============================================================
// src/data/db.js
// Firebase Firestore + Authentication
// يحل محل localStorage — بيانات حقيقية مشتركة بين جميع المستخدمين
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

import { COURSES } from "./courses";

// ── Firebase config ────────────────────────────────────────
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

// ── Helpers ────────────────────────────────────────────────
const col = (path)     => collection(db, path);
const ref = (path, id) => doc(db, path, id);

function toISO(ts) {
  if (!ts) return new Date().toISOString();
  if (typeof ts === "string") return ts;
  if (ts.toDate) return ts.toDate().toISOString();
  return new Date().toISOString();
}

// ── AUTH ───────────────────────────────────────────────────

export async function register({ name, email, password }) {
  try {
    const cred = await createUserWithEmailAndPassword(auth, email, password);
    const user = {
      id:        cred.user.uid,
      role:      "student",
      name,
      email,
      approved:  true,
      createdAt: new Date().toISOString().split("T")[0],
      avatar:    name[0],
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
    const cred = await createUserWithEmailAndPassword(auth, ADMIN_EMAIL, ADMIN_PASSWORD);
    await setDoc(ref("users", cred.user.uid), {
      id:        cred.user.uid,
      role:      "admin",
      name:      "المدير",
      email:     ADMIN_EMAIL,
      approved:  true,
      createdAt: new Date().toISOString().split("T")[0],
      avatar:    "م",
    });
  } catch (e) {
    // auth/email-already-in-use means admin already exists — that's fine
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
    const user = snap.data();
    if (!user.approved) return { error: "حسابك قيد المراجعة" };
    return { user };
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

export async function approveUser(id) {
  await updateDoc(ref("users", id), { approved: true });
}

export async function rejectUser(id) {
  await deleteDoc(ref("users", id));
}

// ── COURSES ────────────────────────────────────────────────
export function getCourses() { return COURSES; }

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

export async function setLectureProgress(userId, courseId, lectureIdx, pct) {
  const snap = await getDoc(ref("progress", userId));
  const data = snap.exists() ? snap.data() : {};
  if (pct <= (data[courseId]?.[lectureIdx] || 0)) return;
  await setDoc(ref("progress", userId), {
    ...data,
    [courseId]: { ...(data[courseId] || {}), [lectureIdx]: pct },
  });
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

// ── NOTES — تبقى محلية (ملاحظات شخصية) ───────────────────

function notesKey(userId, courseId, idx) {
  return `waa3i_notes_${userId}_${courseId}_${idx}`;
}

export function getNotes(userId, courseId, lectureIdx) {
  try { return JSON.parse(localStorage.getItem(notesKey(userId, courseId, lectureIdx))) || []; }
  catch { return []; }
}

export function saveNotes(userId, courseId, lectureIdx, notes) {
  try { localStorage.setItem(notesKey(userId, courseId, lectureIdx), JSON.stringify(notes)); }
  catch {}
}
