import { useEffect, useState } from "react";
import { Outlet, NavLink, useNavigate, useLocation } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import api from "../services/api"; // 👈 Import api to fetch the count

const NAV_BY_ROLE = {
  super_admin: [
    { to: "/dashboard", label: "Overview", icon: "fa-chart-line", end: true },
    { to: "/dashboard/schools", label: "Schools", icon: "fa-school" },
  ],
  proprietor: [
    { to: "/dashboard", label: "Overview", icon: "fa-chart-line", end: true },
    { to: "/dashboard/students", label: "Pupils", icon: "fa-user-graduate" },
    { to: "/dashboard/classes", label: "Classes", icon: "fa-chalkboard" },
    { to: "/dashboard/subjects", label: "Subjects", icon: "fa-book-open" },
    { to: "/dashboard/attendance", label: "Attendance", icon: "fa-calendar-check" },
    { to: "/dashboard/results", label: "Results", icon: "fa-award" },
    { to: "/dashboard/fees", label: "Fees", icon: "fa-naira-sign" },
    { to: "/dashboard/homework", label: "Homework", icon: "fa-book" },
    { to: "/dashboard/announcements", label: "Announcements", icon: "fa-bullhorn" },
    { to: "/dashboard/chat", label: "Chat", icon: "fa-comments" },
    { to: "/dashboard/messages", label: "Messages", icon: "fa-envelope" },
    { to: "/dashboard/link-requests", label: "Link Requests", icon: "fa-link" },
  ],
  admin: [
    { to: "/dashboard", label: "Overview", icon: "fa-chart-line", end: true },
    { to: "/dashboard/students", label: "Pupils", icon: "fa-user-graduate" },
    { to: "/dashboard/classes", label: "Classes", icon: "fa-chalkboard" },
    { to: "/dashboard/subjects", label: "Subjects", icon: "fa-book-open" },
    { to: "/dashboard/attendance", label: "Attendance", icon: "fa-calendar-check" },
    { to: "/dashboard/results", label: "Results", icon: "fa-award" },
    { to: "/dashboard/fees", label: "Fees", icon: "fa-naira-sign" },
    { to: "/dashboard/homework", label: "Homework", icon: "fa-book" },
    { to: "/dashboard/announcements", label: "Announcements", icon: "fa-bullhorn" },
    { to: "/dashboard/chat", label: "Chat", icon: "fa-comments" },
    { to: "/dashboard/messages", label: "Messages", icon: "fa-envelope" },
    { to: "/dashboard/link-requests", label: "Link Requests", icon: "fa-link" },
  ],
  teacher: [
    { to: "/dashboard", label: "Overview", icon: "fa-chart-line", end: true },
    { to: "/dashboard/students", label: "My Pupils", icon: "fa-user-graduate" },
    { to: "/dashboard/attendance", label: "Attendance", icon: "fa-calendar-check" },
    { to: "/dashboard/results", label: "Results", icon: "fa-award" },
    { to: "/dashboard/homework", label: "Homework", icon: "fa-book" },
    { to: "/dashboard/chat", label: "Chat", icon: "fa-comments" },
    { to: "/dashboard/messages", label: "Messages", icon: "fa-envelope" },
    { to: "/dashboard/announcements/view", label: "Announcements", icon: "fa-bullhorn" },
  ],
  parent: [
    { to: "/dashboard", label: "Overview", icon: "fa-chart-line", end: true },
    { to: "/dashboard/children/attendance", label: "Attendance", icon: "fa-calendar-check" },
    { to: "/dashboard/results/children", label: "Results", icon: "fa-award" },
    { to: "/dashboard/fees/children", label: "Fees", icon: "fa-naira-sign" },
    { to: "/dashboard/homework/view", label: "Homework", icon: "fa-book" },
    { to: "/dashboard/announcements/view", label: "Announcements", icon: "fa-bullhorn" },
    { to: "/dashboard/link-child", label: "Link a Child", icon: "fa-link" },
    { to: "/dashboard/contact", label: "Contact School", icon: "fa-envelope" },
    { to: "/dashboard/profile", label: "Profile", icon: "fa-user" },
  ],
  pupil: [
    { to: "/dashboard", label: "Overview", icon: "fa-chart-line", end: true },
    { to: "/dashboard/homework/mine", label: "My Homework", icon: "fa-book" },
    { to: "/dashboard/results", label: "My Results", icon: "fa-award" },
    { to: "/dashboard/announcements/view", label: "Announcements", icon: "fa-bullhorn" },
  ],
};

export default function DashboardLayout() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const nav = NAV_BY_ROLE[user?.role] || [];
  
  const [unreadCount, setUnreadCount] = useState(0);

  // 👇 Fetch unread messages every 30 seconds
  useEffect(() => {
    // Only fetch for roles that have chat access
    if (!["admin", "proprietor", "teacher"].includes(user?.role)) return;

    const fetchUnread = () => {
      api.get("/chat/unread/count")
        .then(({ data }) => setUnreadCount(data.data.count || 0))
        .catch(() => {}); // Ignore errors silently
    };

    fetchUnread(); // Fetch immediately on load
    const interval = setInterval(fetchUnread, 30000); // Then every 30s

    return () => clearInterval(interval);
  }, [user]);

  // 👇 If the user navigates to the chat page, clear the badge temporarily
  // (The next poll will update it accurately based on what they actually read)
  useEffect(() => {
    if (location.pathname === "/dashboard/chat") {
      setUnreadCount(0);
    }
  }, [location.pathname]);

  const handleLogout = () => {
    logout();
    navigate("/login");
  };

  return (
    <div className="min-h-screen flex bg-slate-50">
      {/* Sidebar */}
      <aside className="w-64 bg-white border-r border-slate-200 flex flex-col print:hidden">
        <div className="p-5 border-b">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-blue-600 to-blue-900 text-white flex items-center justify-center shadow-lg">
              <i className="fas fa-graduation-cap text-lg" />
            </div>
            <div>
              <div className="font-bold text-slate-800 leading-tight">CodeSmartNG</div>
              <div className="text-xs text-slate-500">Academic Portal</div>
            </div>
          </div>
        </div>

        <nav className="flex-1 p-3 space-y-1 overflow-y-auto">
          {nav.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              end={item.end}
              className={({ isActive }) =>
                `flex items-center justify-between px-3 py-2 rounded-lg text-sm transition-colors ${
                  isActive
                    ? "bg-blue-700 text-white"
                    : "text-slate-700 hover:bg-slate-100"
                }`
              }
            >
              <div className="flex items-center gap-3">
                <i className={`fas ${item.icon} w-5 text-center`} />
                {item.label}
              </div>
              
              {/* 👇 The Unread Badge */}
              {item.label === "Chat" && unreadCount > 0 && (
                <span className="bg-red-500 text-white text-xs font-bold px-2 py-0.5 rounded-full">
                  {unreadCount}
                </span>
              )}
            </NavLink>
          ))}
        </nav>

        <div className="p-3 border-t">
          <button
            onClick={handleLogout}
            className="w-full flex items-center gap-3 px-3 py-2 rounded-lg text-sm text-red-600 hover:bg-red-50"
          >
            <i className="fas fa-sign-out-alt w-5 text-center" />
            Logout
          </button>
        </div>
      </aside>

      {/* Main area */}
      <div className="flex-1 flex flex-col min-w-0">
        <header className="bg-white/80 backdrop-blur border-b border-slate-200 px-6 py-3 flex items-center justify-between print:hidden">
          <div className="text-sm text-slate-500">
            {user?.role?.replace("_", " ").replace(/\b\w/g, (c) => c.toUpperCase())} Dashboard
          </div>
          <div className="flex items-center gap-3">
            <div className="text-right">
              <div className="text-sm font-medium text-slate-800">{user?.fullName}</div>
              <div className="text-xs text-slate-500">{user?.email}</div>
            </div>
            <div className="w-10 h-10 rounded-full bg-blue-100 text-blue-700 flex items-center justify-center font-bold">
              {user?.fullName?.charAt(0) || "U"}
            </div>
          </div>
        </header>

        <main className="flex-1 overflow-y-auto">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
