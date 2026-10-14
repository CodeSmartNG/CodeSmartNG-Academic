import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { AuthProvider, useAuth } from "./context/AuthContext";
import Login from "./pages/auth/Login";
import SuperAdminDashboard from "./pages/super-admin/Dashboard";
import SchoolAdminDashboard from "./pages/school-admin/Dashboard";
import TeacherDashboard from "./pages/teacher/Dashboard";
import ParentDashboard from "./pages/parent/Dashboard";
import PupilDashboard from "./pages/pupil/Dashboard";

const DashboardRouter = () => {
  const { user } = useAuth();
  if (!user) return <Navigate to="/login" />;
  switch (user.role) {
    case "super_admin": return <SuperAdminDashboard />;
    case "proprietor":
    case "admin": return <SchoolAdminDashboard />;
    case "teacher": return <TeacherDashboard />;
    case "parent": return <ParentDashboard />;
    case "pupil": return <PupilDashboard />;
    default: return <Navigate to="/login" />;
  }
};

export default function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Routes>
          <Route path="/login" element={<Login />} />
          <Route path="/dashboard" element={<DashboardRouter />} />
          <Route path="*" element={<Navigate to="/dashboard" />} />
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  );
}
