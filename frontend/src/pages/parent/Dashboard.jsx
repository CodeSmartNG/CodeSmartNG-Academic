import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { parentApi } from "../../services/parentApi";

const initials = (name = "") =>
  name.split(" ").map((n) => n[0]).join("").slice(0, 2).toUpperCase();

export default function ParentDashboard() {
  const [data, setData] = useState(null);
  const [filters, setFilters] = useState({
    session: "2025/2026",
    term: "First Term",
  });
  const [loading, setLoading] = useState(true);

  const load = () => {
    setLoading(true);
    parentApi
      .dashboard(filters.session, filters.term)
      .then(({ data }) => setData(data.data))
      .finally(() => setLoading(false));
  };
  useEffect(load, [filters]);

  if (loading) return <div className="p-6 text-slate-400">Loading…</div>;
  if (!data) return null;

  return (
    <div className="p-6 max-w-6xl mx-auto">
      {/* Greeting */}
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-slate-800">
          Welcome back, {data.parent.fullName.split(" ")[0]} 👋
        </h1>
        <p className="text-sm text-slate-500">
          Here's a snapshot of your children's progress
        </p>
      </div>

      {/* Filters */}
      <div className="bg-white p-4 rounded-xl shadow-sm mb-6 flex flex-wrap gap-3 items-end">
        <label>
          <span className="text-sm text-slate-600">Session</span>
          <input className="mt-1 border rounded-lg p-2"
            value={filters.session}
            onChange={(e) => setFilters({ ...filters, session: e.target.value })} />
        </label>
        <label>
          <span className="text-sm text-slate-600">Term</span>
          <select className="mt-1 border rounded-lg p-2" value={filters.term}
            onChange={(e) => setFilters({ ...filters, term: e.target.value })}>
            <option>First Term</option>
            <option>Second Term</option>
            <option>Third Term</option>
          </select>
        </label>
      </div>

      {/* Empty state */}
      {data.children.length === 0 ? (
        <div className="bg-white rounded-xl shadow-sm p-10 text-center">
          <div className="text-5xl mb-3">👶</div>
          <h3 className="font-semibold text-slate-700 mb-2">No children linked yet</h3>
          <p className="text-sm text-slate-500 mb-4">
            Link your child's account using their admission number.
          </p>
          <Link
            to="/dashboard/link-child"
            className="bg-blue-700 text-white px-5 py-2 rounded-lg inline-block"
          >
            Link a Child
          </Link>
        </div>
      ) : (
        <div className="grid md:grid-cols-2 gap-5">
          {data.children.map((c) => (
            <ChildCard key={c.student._id} data={c} filters={filters} />
          ))}
        </div>
      )}
    </div>
  );
}

function ChildCard({ data, filters }) {
  const { student, attendance, results, fees } = data;

  return (
    <div className="bg-white rounded-xl shadow-sm overflow-hidden">
      {/* Header */}
      <div className="bg-gradient-to-r from-blue-700 to-blue-900 text-white p-5 flex items-center gap-4">
        <div className="w-14 h-14 rounded-full bg-white/20 flex items-center justify-center font-bold text-lg">
          {student.photoUrl ? (
            <img src={student.photoUrl} alt="" className="w-full h-full rounded-full object-cover" />
          ) : (
            initials(student.fullName)
          )}
        </div>
        <div className="flex-1">
          <h3 className="font-semibold text-lg">{student.fullName}</h3>
          <p className="text-xs opacity-90">
            {student.className} · {student.admissionNumber}
          </p>
        </div>
      </div>

      {/* Quick stats */}
      <div className="p-5 grid grid-cols-2 gap-3">
        <Stat
          label="Attendance (30d)"
          value={`${attendance.percentage}%`}
          color={
            parseFloat(attendance.percentage) >= 80
              ? "green"
              : parseFloat(attendance.percentage) >= 60
              ? "amber"
              : "red"
          }
          icon="fa-calendar-check"
        />
        <Stat
          label="Overall Average"
          value={
            results?.isPublished && results?.overallAverage != null
              ? `${results.overallAverage.toFixed(1)}%`
              : results?.isPublished
              ? "—"
              : "Pending"
          }
          color={results?.isPublished ? "blue" : "slate"}
          icon="fa-award"
        />
        <Stat
          label="Outstanding Fees"
          value={
            fees.totalBalance > 0
              ? `₦${(fees.totalBalance / 100).toLocaleString()}`
              : "Cleared"
          }
          color={fees.totalBalance > 0 ? "red" : "green"}
          icon="fa-naira-sign"
        />
        <Stat
          label="Position"
          value={
            results?.isPublished && results?.positionInClass
              ? `${results.positionInClass} of ${results.totalPupilsInClass}`
              : "—"
          }
          color="indigo"
          icon="fa-ranking-star"
        />
      </div>

      {/* Recent attendance */}
      {attendance.recent?.length > 0 && (
        <div className="px-5 pb-3">
          <h4 className="text-xs font-semibold text-slate-500 uppercase mb-2">
            Recent Attendance
          </h4>
          <div className="flex flex-wrap gap-1">
            {attendance.recent.map((r) => (
              <span
                key={r.date}
                title={`${r.date} — ${r.status}`}
                className={`text-xs px-2 py-0.5 rounded-full ${
                  r.status === "present"
                    ? "bg-green-100 text-green-700"
                    : r.status === "absent"
                    ? "bg-red-100 text-red-700"
                    : r.status === "late"
                    ? "bg-amber-100 text-amber-700"
                    : "bg-blue-100 text-blue-700"
                }`}
              >
                {r.date.slice(5)}
              </span>
            ))}
          </div>
        </div>
      )}

      {/* Actions */}
      <div className="border-t px-5 py-3 flex justify-between items-center">
        <Link
          to={`/dashboard/children/${student._id}`}
          className="text-blue-700 text-sm font-medium hover:underline"
        >
          View full profile →
        </Link>
        <Link
          to="/dashboard/children/attendance"
          className="text-xs text-slate-500 hover:underline"
        >
          All reports
        </Link>
      </div>
    </div>
  );
}

function Stat({ label, value, color, icon }) {
  const colors = {
    green: "bg-green-50 text-green-700",
    amber: "bg-amber-50 text-amber-700",
    red: "bg-red-50 text-red-700",
    blue: "bg-blue-50 text-blue-700",
    slate: "bg-slate-100 text-slate-600",
    indigo: "bg-indigo-50 text-indigo-700",
  };
  return (
    <div className={`p-3 rounded-lg ${colors[color]}`}>
      <div className="flex items-center gap-1 text-xs mb-1 opacity-80">
        <i className={`fas ${icon}`} />
        {label}
      </div>
      <div className="text-lg font-bold">{value}</div>
    </div>
  );
}
