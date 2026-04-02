// ============================================================
// src/utils/helpers.js
// Pure utility functions — no side effects, no imports
// ============================================================

/** Convert Western digits to Arabic-Indic  */
export const toArabic = n =>
  String(n).replace(/\d/g, d => "٠١٢٣٤٥٦٧٨٩"[d]);

/** Format an ISO date string to Arabic locale date */
export const formatDate = iso => {
  try {
    return new Date(iso).toLocaleDateString("ar-SA", {
      year: "numeric", month: "long", day: "numeric",
    });
  } catch { return iso; }
};

/** Format seconds to MM:SS */
export const formatSeconds = sec => {
  const m = Math.floor(sec / 60);
  const s = Math.floor(sec % 60);
  return `${String(m).padStart(2, "0")}:${String(s).padStart(2, "0")}`;
};

/** Count completed lectures (those with watchedPct >= 80) */
export const countWatched = courseProgress =>
  courseProgress ? Object.values(courseProgress).filter(p => p >= 80).length : 0;

/** Completion percentage for a course */
export const coursePct = (courseProgress, totalLectures) =>
  totalLectures ? Math.round((countWatched(courseProgress) / totalLectures) * 100) : 0;

/** Is the course fully complete? */
export const isCourseComplete = (courseProgress, totalLectures) =>
  countWatched(courseProgress) >= totalLectures;

/** Notification type → colour */
export const NOTIF_COLOR = {
  info:         "#3A8BC0",
  success:      "#27AE60",
  warning:      "#E67E22",
  announcement: "#9B59B6",
};

/** Clamp a number between min and max */
export const clamp = (n, min, max) => Math.min(Math.max(n, min), max);
