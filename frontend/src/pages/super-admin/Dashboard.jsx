import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import api from "../../services/api";

export default function SuperAdminDashboard() {
  const [stats, setStats] = useState(null);
  const [schools, setSchools] = useState([]);
  const [loading, setLoading] = useState(true);

  const load = () => {
    setLoading(true);
    Promise.all([
      api.get("/schools/stats").catch(() => ({ data: { data: {} } })),
      api.get("/schools?limit=5").catch(() => ({ data: { data: { schools: [] } } })),
    ]).then(([sRes, scRes]) => {
      setStats(sRes.data?.data || {});
      setSchools(scRes.data?.data?.schools || []);
    }).finally(() => setLoading(false));
  };

  useEffect(() => { load(); }, []);

  if (loading) return <div className="p-6 text-slate-400">Loading…</div>;

  const schoolStats = stats.schools || { total: 0, pending: 0, approved: 0, suspended: 0 };
  const userStats = stats.users || { total: 0, pupils: 0, teachers: 0 };

  return (
    <div className="p-6 max-w-7xl mx-auto">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-slate-900">Super Admin Overview</h1>
        <p className="text-sm text-slate-500 mt-1">Platform-wide metrics across all schools</p>
      </div>

      {/* ── Stats Grid ─────────────────────────────────── */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
        <StatCard label="Total Schools" value={schoolStats.total} icon="fa-school" color="blue" />
        <StatCard label="Approved" value={schoolStats.approved} icon="fa-check-circle" color="green" />
        <StatCard label="Pending" value={schoolStats.pending} icon="fa-clock" color="amber" />
        <StatCard label="Suspended" value={schoolStats.suspended} icon="fa-ban" color="red" />
      </div>

      <div className="grid grid-cols-3 gap-4 mb-8">
        <StatCard label="Total Users" value={userStats.total} icon="fa-users" color="indigo" />
        <StatCard label="Total Pupils" value={userStats.pupils} icon="fa-user-graduate" color="blue" />
        <StatCard label="Total Teachers" value={userStats.teachers} icon="fa-chalkboard-teacher" color="green" />
      </div>

      {/* ── Quick Actions ──────────────────────────────── */}
      <div className="grid md:grid-cols-3 gap-4 mb-8">
        <Link to="/dashboard/schools" className="bg-gradient-to-br from-blue-700 to-blue-900 text-white p-6 rounded-2xl hover:scale-[1.02] transition shadow-lg">
          <i className="fas fa-school text-3xl mb-3"></i>
          <h3 className="font-bold text-lg mb-1">Manage Schools</h3>
          <p className="text-sm text-blue-100">Approve, suspend, or review school applications</p>
        </Link>
        <div className="bg-gradient-to-br from-green-600 to-green-800 text-white p-6 rounded-2xl shadow-lg">
          <i className="fas fa-chart-line text-3xl mb-3"></i>
          <h3 className="font-bold text-lg mb-1">Platform Analytics</h3>
          <p className="text-sm text-green-100">Track growth, revenue, and usage</p>
        </div>
        <div className="bg-gradient-to-br from-purple-600 to-purple-800 text-white p-6 rounded-2xl shadow-lg">
          <i className="fas fa-cog text-3xl mb-3"></i>
          <h3 className="font-bold text-lg mb-1">Platform Settings</h3>
          <p className="text-sm text-purple-100">Configure subscription plans and pricing</p>
        </div>
      </div>

      {/* ── Recent Schools ─────────────────────────────── */}
      <div className="bg-white rounded-2xl shadow-sm overflow-hidden">
        <div className="p-5 border-b flex justify-between items-center">
          <h2 className="font-semibold text-slate-800">Recent School Registrations</h2>
          <Link to="/dashboard/schools" className="text-sm text-blue-700 hover:underline">
            View all →
          </Link>
        </div>
        {schools.length === 0 ? (
          <div className="p-10 text-center text-slate-400">No schools yet</div>
        ) : (
          <table className="w-full text-sm">
            <thead className="bg-slate-50 text-slate-600">
              <tr>
                <th className="p-3 text-left">School</th>
                <th className="p-3 text-left">Contact</th>
                <th className="p-3 text-left">Status</th>
                <th className="p-3 text-left">Registered</th>
              </tr>
            </thead>
            <tbody>
              {schools.map((s) => (
                <tr key={s._id} className="border-t hover:bg-slate-50">
                  <td className="p-3">
                    <div className="font-medium">{s.name}</div>
                    <div className="text-xs text-slate-400 font-mono">{s.slug}</div>
                  </td>
                  <td className="p-3 text-xs">{s.email}</td>
                  <td className="p-3">
                    <StatusBadge status={s.status} />
                  </td>
                  <td className="p-3 text-xs text-slate-500">
                    {new Date(s.createdAt).toLocaleDateString()}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}

function StatCard({ label, value, icon, color }) {
  const colors = {
    blue: "bg-blue-50 text-blue-800",
    green: "bg-green-50 text-green-800",
    amber: "bg-amber-50 text-amber-800",
    red: "bg-red-50 text-red-800",
    indigo: "bg-indigo-50 text-indigo-800",
  };
  return (
    <div className={`p-5 rounded-2xl ${colors[color]}`}>
      <i className={`fas ${icon} text-2xl opacity-60`}></i>
      <div className="text-3xl font-bold mt-2">{value}</div>
      <div className="text-xs mt-1 opacity-80">{label}</div>
    </div>
  );
}

function StatusBadge({ status }) {
  const styles = {
    pending: "bg-amber-100 text-amber-700",
    approved: "bg-green-100 text-green-700",
    suspended: "bg-red-100 text-red-700",
    rejected: "bg-slate-200 text-slate-600",
  };
  return (
    <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${styles[status] || styles.pending}`}>
      {status}
    </span>
  );
}
