import {
  BrowserRouter,
  Routes,
  Route,
  Navigate,
  useLocation,
} from "react-router-dom";
import LoginPage from "./pages/LoginPage";
import InstructorPage from "./pages/InstructorPage";
import StudentPage from "./pages/StudentPage";
import TeamPage from "./pages/TeamPage";
import CoursePage from "./pages/CoursePage";
import Navbar from "./components/Navbar";
import ProtectedRoute from "./components/ProtectedRoute";
import "./App.css";
import { useEffect } from "react";
import { useAuthStore } from "./store/auth";
import InstructorCoursePage from "./pages/InstructorCoursePage";
import EvaluationPage from "./pages/EvaluationPage";
import NotificationPage from "./pages/NotificationPage";
import RequestEvaluationPage from "./pages/RequestEvaluationPage";
import GiveEvaluationPage from "./pages/GiveEvaluationPage";
import JoinPage from "./pages/JoinPage";

import AdminHome from "./pages/admin/AdminHome";
import AdminInstructors from "./pages/admin/AdminInstructors";
import AdminCourses from "./pages/admin/AdminCourses";
import AdminCourseStudents from "./pages/admin/AdminCourseStudents";

function AppContent() {
  const location = useLocation();
  const hideNavbar = location.pathname === "/login";
  const fetchMe = useAuthStore((s) => s.fetchMe);

  useEffect(() => {
    fetchMe(); // 每次刷新自动验证 token 并恢复登录状态
  }, [fetchMe]);

  return (
    <>
      {!hideNavbar && <Navbar />}
      <Routes>
        <Route path="/" element={<Navigate to="/login" />} />
        <Route path="/login" element={<LoginPage />} />
        <Route
          path="/instructor"
          element={
            <ProtectedRoute role="instructor">
              <InstructorPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="/instructor/courses/:id"
          element={<InstructorCoursePage />}
        />

        <Route
          path="/student"
          element={
            <ProtectedRoute role="student">
              <StudentPage />
            </ProtectedRoute>
          }
        />

        {/* course and teams */}
        <Route
          path="/courses/:id"
          element={
            <ProtectedRoute role="student">
              <CoursePage />
            </ProtectedRoute>
          }
        />

        <Route
          path="/teams/:id"
          element={
            <ProtectedRoute role={["student", "instructor"]}>
              <TeamPage />
            </ProtectedRoute>
          }
        />
        <Route path="/teams/:id/evaluations" element={<EvaluationPage />} />
        <Route path="/notifications" element={<NotificationPage />} />
        <Route
          path="/courses/:id/evaluations/give"
          element={<GiveEvaluationPage />}
        />
        <Route
          path="/courses/:id/evaluations/request"
          element={<RequestEvaluationPage />}
        />
        <Route path="/join" element={<JoinPage />} />

        {/* Admin routes */}
        <Route path="/admin" element={<AdminHome />} />
        <Route path="/admin/instructors" element={<AdminInstructors />} />
        <Route path="/admin/courses" element={<AdminCourses />} />
        <Route
          path="/admin/courses/:courseId/students"
          element={<AdminCourseStudents />}
        />
      </Routes>
    </>
  );
}

export default function App() {
  return (
    <BrowserRouter>
      <AppContent /> {/* ✅ 包裹起来 */}
    </BrowserRouter>
  );
}
