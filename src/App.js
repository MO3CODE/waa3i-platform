// ============================================================
// src/App.js — v2: React Router + multi-role
// ============================================================
import React, { useState, useEffect } from "react";
import {
  BrowserRouter,
  Routes,
  Route,
  Navigate,
  useNavigate,
  useParams,
} from "react-router-dom";

import { seedAdminUser, seedCoursesIfEmpty, isAdmin } from "./data/db";

import Landing          from "./pages/Landing/Landing";
import Auth             from "./pages/Auth/Auth";
import StudentDashboard from "./pages/Student/StudentDashboard";
import CourseView       from "./pages/CourseView/CourseView";
import AdminDashboard   from "./pages/Admin/AdminDashboard";

// ── Auth context (lightweight, no Context API needed) ──────
function useAuth() {
  const [user, setUser] = useState(() => {
    try { return JSON.parse(sessionStorage.getItem("waa3i_user")) || null; }
    catch { return null; }
  });

  function login(u) {
    sessionStorage.setItem("waa3i_user", JSON.stringify(u));
    setUser(u);
  }

  function logout() {
    sessionStorage.removeItem("waa3i_user");
    setUser(null);
  }

  function refreshUser(updated) {
    const merged = { ...user, ...updated };
    sessionStorage.setItem("waa3i_user", JSON.stringify(merged));
    setUser(merged);
  }

  return { user, login, logout, refreshUser };
}

// ── Route guards ───────────────────────────────────────────
function RequireAuth({ user, children }) {
  if (!user) return <Navigate to="/auth" replace />;
  return children;
}

function RequireAdmin({ user, children }) {
  if (!user)          return <Navigate to="/auth"    replace />;
  if (!isAdmin(user.role)) return <Navigate to="/student" replace />;
  return children;
}

// ── Course wrapper (reads :courseId from URL) ──────────────
function CourseViewWrapper({ user, onLogout }) {
  const { courseId } = useParams();
  const navigate     = useNavigate();
  return (
    <CourseView
      user={user}
      courseId={courseId}
      onBack={() => navigate("/student")}
      onLogout={onLogout}
    />
  );
}

// ── Root ───────────────────────────────────────────────────
export default function App() {
  const { user, login, logout, refreshUser } = useAuth();

  useEffect(() => {
    seedAdminUser();
    seedCoursesIfEmpty();
  }, []);

  function handleLogin(loggedInUser) {
    login(loggedInUser);
  }

  function handleLogout() {
    logout();
  }

  return (
    <BrowserRouter>
      <Routes>
        {/* Public */}
        <Route path="/"     element={<Landing />} />
        <Route path="/auth" element={
          user
            ? <Navigate to={isAdmin(user.role) ? "/admin" : "/student"} replace />
            : <Auth onLogin={handleLogin} />
        } />

        {/* Student */}
        <Route path="/student" element={
          <RequireAuth user={user}>
            <StudentDashboard user={user} onLogout={handleLogout} />
          </RequireAuth>
        } />

        <Route path="/course/:courseId" element={
          <RequireAuth user={user}>
            <CourseViewWrapper user={user} onLogout={handleLogout} />
          </RequireAuth>
        } />

        {/* Admin (all admin roles) */}
        <Route path="/admin" element={
          <RequireAdmin user={user}>
            <AdminDashboard user={user} onLogout={handleLogout} refreshUser={refreshUser} />
          </RequireAdmin>
        } />

        {/* Fallback */}
        <Route path="*" element={
          <Navigate to={user ? (isAdmin(user.role) ? "/admin" : "/student") : "/"} replace />
        } />
      </Routes>
    </BrowserRouter>
  );
}
