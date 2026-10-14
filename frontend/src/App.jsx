import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { AuthProvider } from "./context/AuthContext";
import ProtectedRoute from "./routes/ProtectedRoute";
import RoleRoute from "./routes/RoleRoute";
import DashboardLayout from "./layouts/DashboardLayout";

// ── Auth ────────────────────────────────────────────────────
import Login from "./pages/auth/Login";
import ForgotPassword from "./pages/auth/ForgotPassword";
import ResetPassword from "./pages/auth/ResetPassword";
import RegisterSchool from "./pages/auth/RegisterSchool";
import ChangePassword from "./pages/auth/ChangePassword";

// ── Super Admin ─────────────────────────────────────────────
import SuperAdminDashboard from "./pages/super-admin/Dashboard";
import SchoolsList from "./pages/super-admin/SchoolsList";

// ── School Admin ────────────────────────────────────────────
import SchoolAdminDashboard from "./pages/school-admin/Dashboard";

// ── Students (Module 2) ─────────────────────────────────────
import StudentList from "./pages/school-admin/Students/StudentList";
import AdmissionForm from "./pages/school-admin/Students/AdmissionForm";
import StudentDetail from "./pages/school-admin/Students/StudentDetail";
import PromotePupils from "./pages/school-admin/Students/PromotePupils";
import ClassList from "./pages/school-admin/Classes/ClassList";
import ClassDetail from "./pages/school-admin/Classes/ClassDetail";
import SubjectList from "./pages/school-admin/Subjects/SubjectList";
// ── Teachers, Parents, Pupils ───────────────────────────────
import TeacherDashboard from "./pages/teacher/Dashboard";
import ParentDashboard from "./pages/parent/Dashboard";
import PupilDashboard from "./pages/pupil/Dashboard";



// ── Misc ────────────────────────────────────────────────────
import NotFound from "./pages/NotFound";

// ─────────────────────────────────────────────────────────────
// Role → dashboard home page mapping
// ─────────────────────────────────────────────────────────────
const ROLE_HOME = {
  super_admin: <SuperAdminDashboard />,
  proprietor: <SchoolAdminDashboard />,
  admin: <SchoolAdminDashboard />,
  teacher: <TeacherDashboard />,
  parent: <ParentDashboard />,
  pupil: <PupilDashboard />,
};

const DashboardHome = () => {
  // `user` is guaranteed by ProtectedRoute
  const user = JSON.parse(localStorage.getItem("csn_user") || "null");
  return ROLE_HOME[user?.role] ?? <Navigate to="/login" replace />;
};

export default function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Routes>
          {/* ── Public ──────────────────────────────────── */}
          <Route path="/login" element={<Login />} />
          <Route path="/forgot-password" element={<ForgotPassword />} />
          <Route path="/reset-password/:token" element={<ResetPassword />} />
          <Route path="/register-school" element={<RegisterSchool />} />

          {/* ── Protected + layout ──────────────────────── */}
          <Route
            element={
              <ProtectedRoute>
                <DashboardLayout />
              </ProtectedRoute>
            }
          >
            {/* Dashboard home — role-based */}
            <Route path="/dashboard" element={<DashboardHome />} />

            {/* Change password (all roles) */}
            <Route path="/dashboard/change-password" element={<ChangePassword />} />

            {/* ── Super Admin only ─────────────────────── */}
            <Route
              path="/dashboard/schools"
              element={
                <RoleRoute allow={["super_admin"]}>
                  <SchoolsList />
                </RoleRoute>
              }
            />

            {/* ── Students (admin, proprietor, teacher can view) ── */}
            <Route
              path="/dashboard/students"
              element={
                <RoleRoute allow={["proprietor", "admin", "teacher"]}>
                  <StudentList />
                </RoleRoute>
              }
            />
            <Route
              path="/dashboard/students/new"
              element={
                <RoleRoute allow={["proprietor", "admin"]}>
                  <AdmissionForm />
                </RoleRoute>
              }
            />
            <Route
              path="/dashboard/students/promote"
              element={
                <RoleRoute allow={["proprietor", "admin"]}>
                  <PromotePupils />
                </RoleRoute>
              }
            />
            <Route
              path="/dashboard/students/:id"
              element={
                <RoleRoute allow={["proprietor", "admin", "teacher"]}>
                  <StudentDetail />
                </RoleRoute>
              }
            />
          </Route>


          <Route
  path="/dashboard/classes"
  element={
    <RoleRoute allow={["proprietor", "admin"]}>
      <ClassList />
    </RoleRoute>
  }
/>
<Route
  path="/dashboard/classes/:id"
  element={
    <RoleRoute allow={["proprietor", "admin", "teacher"]}>
      <ClassDetail />
    </RoleRoute>
  }
/>
<Route
  path="/dashboard/subjects"
  element={
    <RoleRoute allow={["proprietor", "admin"]}>
      <SubjectList />
    </RoleRoute>
  }
/>
          {/* ── Fallbacks ───────────────────────────────── */}
          <Route path="/" element={<Navigate to="/dashboard" replace />} />
          <Route path="*" element={<NotFound />} />
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  );
}
