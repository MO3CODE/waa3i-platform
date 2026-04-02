// ============================================================
// src/App.js
// Root component — handles screen routing only
// ============================================================
import React, { useState } from "react";
import { getCourses } from "./data/db";

import Landing         from "./pages/Landing/Landing";
import Auth            from "./pages/Auth/Auth";
import StudentDashboard from "./pages/Student/StudentDashboard";
import CourseView      from "./pages/CourseView/CourseView";
import AdminDashboard  from "./pages/Admin/AdminDashboard";

const SCREENS = {
  LANDING:  "landing",
  AUTH:     "auth",
  STUDENT:  "student",
  COURSE:   "course",
  ADMIN:    "admin",
};

export default function App() {
  const [screen,     setScreen]     = useState(SCREENS.LANDING);
  const [user,       setUser]       = useState(null);
  const [activeCourse, setActiveCourse] = useState(null);

  const courses = getCourses();

  function handleLogin(loggedInUser) {
    setUser(loggedInUser);
    setScreen(loggedInUser.role === "admin" ? SCREENS.ADMIN : SCREENS.STUDENT);
  }

  function handleLogout() {
    setUser(null);
    setScreen(SCREENS.LANDING);
  }

  function handleSelectCourse(course) {
    setActiveCourse(course);
    setScreen(SCREENS.COURSE);
  }

  function handleBackFromCourse() {
    setScreen(SCREENS.STUDENT);
  }

  switch (screen) {
    case SCREENS.LANDING:
      return <Landing onStart={() => setScreen(SCREENS.AUTH)} />;

    case SCREENS.AUTH:
      return (
        <Auth
          onLogin={handleLogin}
          onBack={() => setScreen(SCREENS.LANDING)}
        />
      );

    case SCREENS.ADMIN:
      return (
        <AdminDashboard
          user={user}
          courses={courses}
          onLogout={handleLogout}
        />
      );

    case SCREENS.COURSE:
      return (
        <CourseView
          user={user}
          course={activeCourse}
          onBack={handleBackFromCourse}
        />
      );

    case SCREENS.STUDENT:
    default:
      return (
        <StudentDashboard
          user={user}
          courses={courses}
          onSelectCourse={handleSelectCourse}
          onLogout={handleLogout}
        />
      );
  }
}
