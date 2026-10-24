import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { AuthProvider } from "./context/AuthContext";
import ProtectedRoute from "./routes/ProtectedRoute";
import RoleRoute from "./routes/RoleRoute";
import DashboardLayout from "./layouts/DashboardLayout";
import ErrorBoundary from "./pages/ErrorBoundary";

// ── Public ──────────────────────────────────────────────────
import Landing from "./pages/Landing";
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
import AdminMessages from "./pages/school-admin/Messages";

// ── Announcements ───────────────────────────────────────────
import AnnouncementList from "./pages/school-admin/Announcements/AnnouncementList";
import CreateAnnouncement from "./pages/school-admin/Announcements/CreateAnnouncement";

// ── Students ────────────────────────────────────────────────
import StudentList from "./pages/school-admin/Students/StudentList";
import AdmissionForm from "./pages/school-admin/Students/AdmissionForm";
import StudentDetail from "./pages/school-admin/Students/StudentDetail";
import PromotePupils from "./pages/school-admin/Students/PromotePupils";

// ── Classes & Subjects ──────────────────────────────────────
import ClassList from "./pages/school-admin/Classes/ClassList";
import ClassDetail from "./pages/school-admin/Classes/ClassDetail";
import SubjectList from "./pages/school-admin/Subjects/SubjectList";

// ── Attendance ──────────────────────────────────────────────
import MarkAttendance from "./pages/school-admin/Attendance/MarkAttendance";
import ClassMonthlyReport from "./pages/school-admin/Attendance/ClassMonthlyReport";
import AttendanceStats from "./pages/school-admin/Attendance/AttendanceStats";
import ParentAttendance from "./pages/parent/Attendance";

// ── Results ─────────────────────────────────────────────────
import AssessmentList from "./pages/school-admin/Results/AssessmentList";
import EnterScores from "./pages/school-admin/Results/EnterScores";
import Broadsheet from "./pages/school-admin/Results/Broadsheet";
import ParentResults from "./pages/parent/Results";
import ReportCard from "./pages/ReportCard";
// ── Fees ────────────────────────────────────────────────────
import FeeStructures from "./pages/school-admin/Fees/FeeStructures";
import BillList from "./pages/school-admin/Fees/BillList";
import BillDetail from "./pages/school-admin/Fees/BillDetail";
import ParentFees from "./pages/parent/Fees";

// ── Parent Portal ───────────────────────────────────────────
import ParentDashboard from "./pages/parent/Dashboard";
import ChildDetail from "./pages/parent/ChildDetail";
import LinkChild from "./pages/parent/LinkChild";
import ParentContact from "./pages/parent/Contact";
import ParentProfile from "./pages/parent/Profile";
import LinkRequests from "./pages/school-admin/LinkRequests";

// ── Homework ────────────────────────────────────────────────
import CreateHomework from "./pages/teacher/Homework/CreateHomework";
import HomeworkList from "./pages/teacher/Homework/HomeworkList";
import HomeworkDetail from "./pages/teacher/Homework/HomeworkDetail";
import ParentAnnouncements from "./pages/parent/Announcements";
import ParentHomework from "./pages/parent/Homework";
import PupilHomework from "./pages/pupil/Homework";

// ── Chat ────────────────────────────────────────────────────
import ChatPage from "./pages/chat/ChatPage";

// ── Other Roles ─────────────────────────────────────────────
import TeacherDashboard from "./pages/teacher/Dashboard";
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
  const user = JSON.parse(localStorage.getItem("csn_user") || "null");
  return ROLE_HOME[user?.role] ?? <Navigate to="/login" replace />;
};

export default function App() {
  return (
    <ErrorBoundary>
      <AuthProvider>
        <BrowserRouter>
          <Routes>
            {/* ── Public Routes ───────────────────────────── */}
            <Route path="/" element={<Landing />} />
            <Route path="/login" element={<Login />} />
            <Route path="/register-school" element={<RegisterSchool />} />
            <Route path="/forgot-password" element={<ForgotPassword />} />
            <Route path="/reset-password/:token" element={<ResetPassword />} />

            {/* ── Protected Routes (with layout) ──────────── */}
            <Route
  path="/dashboard/report-card/:studentId"
  element={
    <RoleRoute allow={["proprietor", "admin", "teacher", "parent", "pupil"]}>
      <ReportCard />
    </RoleRoute>
  }
/>
            
            <Route
              element={
                <ProtectedRoute>
                  <ErrorBoundary>
                    <DashboardLayout />
                  </ErrorBoundary>
                </ProtectedRoute>
              }
            >
              {/* Dashboard home — role-based */}
              <Route path="/dashboard" element={<DashboardHome />} />

              {/* Change password (all roles) */}
              <Route path="/dashboard/change-password" element={<ChangePassword />} />

              {/* ── Chat & Messages ────────────────────── */}
              <Route
                path="/dashboard/messages"
                element={
                  <RoleRoute allow={["proprietor", "admin", "teacher"]}>
                    <AdminMessages />
                  </RoleRoute>
                }
              />
              <Route
                path="/dashboard/chat"
                element={
                  <RoleRoute allow={["proprietor", "admin", "teacher"]}>
                    <ChatPage />
                  </RoleRoute>
                }
              />

              {/* ── Super Admin only ───────────────────── */}
              <Route
                path="/dashboard/schools"
                element={
                  <RoleRoute allow={["super_admin"]}>
                    <SchoolsList />
                  </RoleRoute>
                }
              />

              {/* ── Students ───────────────────────────── */}
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

              {/* ── Classes & Subjects ─────────────────── */}
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

              {/* ── Attendance ─────────────────────────── */}
              <Route
                path="/dashboard/attendance"
                element={
                  <RoleRoute allow={["proprietor", "admin", "teacher"]}>
                    <MarkAttendance />
                  </RoleRoute>
                }
              />
              <Route
                path="/dashboard/attendance/monthly"
                element={
                  <RoleRoute allow={["proprietor", "admin", "teacher"]}>
                    <ClassMonthlyReport />
                  </RoleRoute>
                }
              />
              <Route
                path="/dashboard/attendance/stats"
                element={
                  <RoleRoute allow={["proprietor", "admin"]}>
                    <AttendanceStats />
                  </RoleRoute>
                }
              />
              <Route
                path="/dashboard/children/attendance"
                element={
                  <RoleRoute allow={["parent"]}>
                    <ParentAttendance />
                  </RoleRoute>
                }
              />

              {/* ── Results ────────────────────────────── */}
              <Route
                path="/dashboard/results"
                element={
                  <RoleRoute allow={["proprietor", "admin", "teacher"]}>
                    <AssessmentList />
                  </RoleRoute>
                }
              />
              <Route
                path="/dashboard/results/scores/:id"
                element={
                  <RoleRoute allow={["proprietor", "admin", "teacher"]}>
                    <EnterScores />
                  </RoleRoute>
                }
              />
              <Route
                path="/dashboard/results/broadsheet"
                element={
                  <RoleRoute allow={["proprietor", "admin"]}>
                    <Broadsheet />
                  </RoleRoute>
                }
              />
              <Route
                path="/dashboard/results/children"
                element={
                  <RoleRoute allow={["parent"]}>
                    <ParentResults />
                  </RoleRoute>
                }
              />

              {/* ── Fees ───────────────────────────────── */}
              <Route
                path="/dashboard/fees"
                element={
                  <RoleRoute allow={["proprietor", "admin"]}>
                    <BillList />
                  </RoleRoute>
                }
              />
              <Route
                path="/dashboard/fees/structures"
                element={
                  <RoleRoute allow={["proprietor", "admin"]}>
                    <FeeStructures />
                  </RoleRoute>
                }
              />
              <Route
                path="/dashboard/fees/bills/:id"
                element={
                  <RoleRoute allow={["proprietor", "admin"]}>
                    <BillDetail />
                  </RoleRoute>
                }
              />
              <Route
                path="/dashboard/fees/children"
                element={
                  <RoleRoute allow={["parent"]}>
                    <ParentFees />
                  </RoleRoute>
                }
              />

              {/* ── Parent Portal ──────────────────────── */}
              <Route
                path="/dashboard/children/:id"
                element={
                  <RoleRoute allow={["parent"]}>
                    <ChildDetail />
                  </RoleRoute>
                }
              />
              <Route
                path="/dashboard/link-child"
                element={
                  <RoleRoute allow={["parent"]}>
                    <LinkChild />
                  </RoleRoute>
                }
              />
              <Route
                path="/dashboard/contact"
                element={
                  <RoleRoute allow={["parent"]}>
                    <ParentContact />
                  </RoleRoute>
                }
              />
              <Route
                path="/dashboard/profile"
                element={
                  <RoleRoute allow={["parent"]}>
                    <ParentProfile />
                  </RoleRoute>
                }
              />
              <Route
                path="/dashboard/link-requests"
                element={
                  <RoleRoute allow={["proprietor", "admin"]}>
                    <LinkRequests />
                  </RoleRoute>
                }
              />

              {/* ── Homework ───────────────────────────── */}
              <Route
                path="/dashboard/homework"
                element={
                  <RoleRoute allow={["teacher", "admin", "proprietor"]}>
                    <HomeworkList />
                  </RoleRoute>
                }
              />
              <Route
                path="/dashboard/homework/new"
                element={
                  <RoleRoute allow={["teacher", "admin", "proprietor"]}>
                    <CreateHomework />
                  </RoleRoute>
                }
              />
              <Route
                path="/dashboard/homework/:id"
                element={
                  <RoleRoute allow={["teacher", "admin", "proprietor"]}>
                    <HomeworkDetail />
                  </RoleRoute>
                }
              />
              <Route
                path="/dashboard/homework/view"
                element={
                  <RoleRoute allow={["parent"]}>
                    <ParentHomework />
                  </RoleRoute>
                }
              />
              <Route
                path="/dashboard/homework/mine"
                element={
                  <RoleRoute allow={["pupil"]}>
                    <PupilHomework />
                  </RoleRoute>
                }
              />

              {/* ── Announcements ──────────────────────── */}
              <Route
                path="/dashboard/announcements"
                element={
                  <RoleRoute allow={["proprietor", "admin"]}>
                    <AnnouncementList />
                  </RoleRoute>
                }
              />
              <Route
                path="/dashboard/announcements/new"
                element={
                  <RoleRoute allow={["proprietor", "admin"]}>
                    <CreateAnnouncement />
                  </RoleRoute>
                }
              />
              <Route
                path="/dashboard/announcements/view"
                element={
                  <RoleRoute allow={["parent", "pupil", "teacher"]}>
                    <ParentAnnouncements />
                  </RoleRoute>
                }
              />
            </Route>

            {/* ── Fallback 404 ──────────────────────────────── */}
            <Route path="*" element={<NotFound />} />
          </Routes>
        </BrowserRouter>
      </AuthProvider>
    </ErrorBoundary>
  );
}
