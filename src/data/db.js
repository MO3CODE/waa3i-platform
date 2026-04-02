// ============================================================
// src/data/db.js
// All data storage and retrieval — localStorage-backed
// Replace methods here to connect a real backend (Firebase etc.)
// ============================================================

import { COURSES } from "./courses";

const DB_KEY = "waa3i_v6";

// ── Seed data (initial state on first run) ─────────────────
const SEED = {
  users: [
    {
      id:        "admin_1",
      role:      "admin",
      name:      "المشرف العام",
      email:     "admin@waa3i.org",
      password:  "admin123",      // ⚠️ change before production
      approved:  true,
      createdAt: "2024-01-01",
      avatar:    "م",
    },
  ],
  courses:      COURSES,
  quizzes: [
    {
      id:        "quiz_iman_1",
      courseId:  "iman",
      title:     "اختبار مادة الإيمان",
      timeLimit: 600,
      passMark:  60,
      questions: [
        { id:"q1", text:"كم عدد أركان الإيمان؟",           options:["أربعة","خمسة","ستة","سبعة"],                                                             correct:2 },
        { id:"q2", text:"الإيمان بالله يشمل؟",             options:["وجوده فقط","وجوده وربوبيته وألوهيته وأسمائه وصفاته","أسماؤه فقط","وجوده وملائكته فقط"], correct:1 },
        { id:"q3", text:"من هو أول الأنبياء؟",             options:["نوح ﷺ","إبراهيم ﷺ","آدم ﷺ","موسى ﷺ"],                                                    correct:2 },
        { id:"q4", text:"الإيمان باليوم الآخر يشمل؟",     options:["الموت فقط","البعث والحساب والجنة والنار","الجنة فقط","الحساب فقط"],                       correct:1 },
        { id:"q5", text:"ما معنى الإيمان بالقدر؟",        options:["التصديق بأن كل شيء بقدر الله","الأقدار السعيدة فقط","أن الإنسان مسيّر","عدم الاجتهاد"], correct:0 },
      ],
    },
  ],
  progress:      {},
  quizResults:   [],
  certificates:  [],
  notifications: [
    {
      id:         "n0",
      title:      "مرحباً بكم في منصة وعي 🌿",
      body:       "نرحب بكم في مبادرة وعي بما لا يسع المسلم جهله. ابدأوا رحلتكم التعليمية اليوم.",
      type:       "info",
      targetRole: "all",
      createdAt:  new Date().toISOString(),
      read:       [],
    },
  ],
  liveSessions: [],
};

// ── Internal helpers ───────────────────────────────────────
function load() {
  try {
    const raw = localStorage.getItem(DB_KEY);
    if (!raw) return JSON.parse(JSON.stringify(SEED));

    const data = JSON.parse(raw);
    // Back-fill any missing keys (safe migration)
    if (!data.courses?.length)   data.courses      = COURSES;
    if (!data.quizzes)           data.quizzes      = SEED.quizzes;
    if (!data.notifications)     data.notifications= SEED.notifications;
    if (!data.liveSessions)      data.liveSessions = [];
    if (!data.certificates)      data.certificates = [];
    if (!data.quizResults)       data.quizResults  = [];
    if (!data.progress)          data.progress     = {};
    if (!data.users?.length)     data.users        = SEED.users;
    return data;
  } catch {
    return JSON.parse(JSON.stringify(SEED));
  }
}

function save(data) {
  try { localStorage.setItem(DB_KEY, JSON.stringify(data)); } catch {}
}

// ── Auth ───────────────────────────────────────────────────
export function register({ name, email, password }) {
  const data = load();
  if (data.users.find(u => u.email === email))
    return { error: "البريد الإلكتروني مسجل مسبقاً" };

  const user = {
    id:        "u_" + Date.now(),
    role:      "student",
    name,
    email,
    password,
    approved:  true,
    createdAt: new Date().toISOString().split("T")[0],
    avatar:    name[0],
  };
  data.users.push(user);
  save(data);
  return { user };
}

export function login({ email, password }) {
  const user = load().users.find(u => u.email === email && u.password === password);
  if (!user) return { error: "البريد أو كلمة المرور غير صحيحة" };
  return { user: { ...user, password: undefined } };
}

// ── Users (admin) ──────────────────────────────────────────
export function getUsers(role) {
  const data = load();
  return role ? data.users.filter(u => u.role === role) : data.users;
}

export function approveUser(id) {
  const data = load();
  const u = data.users.find(u => u.id === id);
  if (u) { u.approved = true; save(data); }
}

export function rejectUser(id) {
  const data = load();
  data.users = data.users.filter(u => u.id !== id);
  save(data);
}

// ── Courses ────────────────────────────────────────────────
export function getCourses() { return load().courses; }

// ── Progress ───────────────────────────────────────────────
// progress[userId][courseId][lectureIndex] = watchedPercent (0–100)
// A lecture is "complete" when watchedPercent >= 80

export function getProgress(userId) {
  return load().progress[userId] || {};
}

export function getAllProgress() {
  return load().progress;
}

export function setLectureProgress(userId, courseId, lectureIdx, pct) {
  const data = load();
  if (!data.progress[userId])          data.progress[userId]          = {};
  if (!data.progress[userId][courseId]) data.progress[userId][courseId] = {};
  // Only update if the new percentage is higher (never go backwards)
  const current = data.progress[userId][courseId][lectureIdx] || 0;
  if (pct > current) {
    data.progress[userId][courseId][lectureIdx] = pct;
    save(data);
  }
}

// ── Quizzes ────────────────────────────────────────────────
export function getQuizzes()           { return load().quizzes; }
export function getQuizByCourse(cid)   { return load().quizzes.find(q => q.courseId === cid) || null; }

export function saveQuiz(quiz) {
  const data = load();
  const idx  = data.quizzes.findIndex(q => q.id === quiz.id);
  if (idx >= 0) data.quizzes[idx] = quiz;
  else          data.quizzes.push({ ...quiz, id: "qz_" + Date.now() });
  save(data);
}

export function deleteQuiz(id) {
  const data = load();
  data.quizzes = data.quizzes.filter(q => q.id !== id);
  save(data);
}

// ── Quiz Results ───────────────────────────────────────────
export function saveQuizResult(result) {
  const data = load();
  data.quizResults.push({ ...result, id: "qr_" + Date.now(), date: new Date().toISOString() });
  save(data);
}

export function getQuizResults(userId) {
  const data = load();
  return userId ? data.quizResults.filter(r => r.userId === userId) : data.quizResults;
}

export function getUserQuizResult(userId, quizId) {
  return load().quizResults.find(r => r.userId === userId && r.quizId === quizId) || null;
}

// ── Certificates ───────────────────────────────────────────
export function issueCertificate({ userId, userName, issuedBy }) {
  const data = load();
  const cert = { id: "cert_" + Date.now(), userId, userName, issuedBy, issuedAt: new Date().toISOString() };
  data.certificates.push(cert);
  save(data);
  return cert;
}

export function getCertificates(userId) {
  const data = load();
  return userId ? data.certificates.filter(c => c.userId === userId) : data.certificates;
}

export function getUserCertificate(userId) {
  return load().certificates.find(c => c.userId === userId) || null;
}

// ── Notifications ──────────────────────────────────────────
export function getNotifications(role) {
  return load().notifications.filter(n => n.targetRole === "all" || n.targetRole === role);
}

export function addNotification(notif) {
  const data = load();
  data.notifications.unshift({ ...notif, id: "n_" + Date.now(), createdAt: new Date().toISOString(), read: [] });
  save(data);
}

export function markNotifRead(notifId, userId) {
  const data = load();
  const n = data.notifications.find(n => n.id === notifId);
  if (n && !n.read.includes(userId)) { n.read.push(userId); save(data); }
}

export function deleteNotification(id) {
  const data = load();
  data.notifications = data.notifications.filter(n => n.id !== id);
  save(data);
}

// ── Live Sessions ──────────────────────────────────────────
export function getLiveSessions() { return load().liveSessions; }

export function saveLiveSession(session) {
  const data = load();
  const idx  = data.liveSessions.findIndex(s => s.id === session.id);
  if (idx >= 0) data.liveSessions[idx] = session;
  else          data.liveSessions.push({ ...session, id: "ls_" + Date.now() });
  save(data);
}

export function deleteLiveSession(id) {
  const data = load();
  data.liveSessions = data.liveSessions.filter(s => s.id !== id);
  save(data);
}

// ── Notes (timestamped, per user+course+lecture) ───────────
function notesStorageKey(userId, courseId, lectureIdx) {
  return `waa3i_notes_${userId}_${courseId}_${lectureIdx}`;
}

export function getNotes(userId, courseId, lectureIdx) {
  try {
    return JSON.parse(localStorage.getItem(notesStorageKey(userId, courseId, lectureIdx))) || [];
  } catch { return []; }
}

export function saveNotes(userId, courseId, lectureIdx, notes) {
  try {
    localStorage.setItem(notesStorageKey(userId, courseId, lectureIdx), JSON.stringify(notes));
  } catch {}
}
