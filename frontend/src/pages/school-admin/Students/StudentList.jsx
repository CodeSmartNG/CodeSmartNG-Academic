//frontend/src/pages/school-admin/Students/StudentList.jsx
import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { studentApi } from "../../../services/studentApi";

export default function StudentList() {
  const [students, setStudents] = useState([]);
  const [stats, setStats] = useState(null);
  const [filters, setFilters] = useState({ search: "", className: "", admissionStatus: "" });
  const [loading, setLoading] = useState(true);
  const [selected, setSelected] = useState([]);

  const load = async () => {
    setLoading(true);
    try {
      const [listRes, statsRes] = await Promise.all([
        studentApi.list(filters),
        studentApi.stats(),
      ]);
      setStudents(listRes.data.data.students);
      setStats(statsRes.data.data);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, [filters]);

  const toggleSelect = (id) => {
    setSelected((prev) =>
      prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]
    );
  };

  const toggleAll = () => {
    if (selected.length === students.length) setSelected([]);
    else setSelected(students.map((s) => s._id));
  };

  return (
    <div className="p-6">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-2xl font-bold text-slate-800">Pupils</h1>
          <p className="text-sm text-slate-500">Manage admissions, promotions, and records</p>
        </div>
        <Link
          to="/dashboard/students/new"
          className="bg-blue-700 hover:bg-blue-800 text-white px-4 py-2 rounded-lg"
        >
          + Admit Pupil
        </Link>
      </div>

      {/* Stats cards */}
      {stats && (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
          <StatCard label="Active Pupils" value={stats.active} color="blue" />
          <StatCard label="Total Pupils" value={stats.total} color="indigo" />
          <StatCard label="Transferred" value={stats.transferred} color="amber" />
          <StatCard label="Archived" value={stats.archived} color="slate" />
        </div>
      )}

      {/* Filters */}
      <div className="bg-white p-4 rounded-xl shadow-sm mb-4 flex flex-wrap gap-3">
        <input
          placeholder="Search name, admission no, guardian..."
          className="border rounded-lg p-2 flex-1 min-w-[200px]"
          value={filters.search}
          onChange={(e) => setFilters({ ...filters, search: e.target.value })}
        />
        <select
          className="border rounded-lg p-2"
          value={filters.className}
          onChange={(e) => setFilters({ ...filters, className: e.target.value })}
        >
          <option value="">All Classes</option>
          {["Nursery 1", "Nursery 2", "Nursery 3", "Primary 1", "Primary 2",
            "Primary 3", "Primary 4", "Primary 5", "Primary 6"].map((c) => (
            <option key={c} value={c}>{c}</option>
          ))}
        </select>
        <select
          className="border rounded-lg p-2"
          value={filters.admissionStatus}
          onChange={(e) => setFilters({ ...filters, admissionStatus: e.target.value })}
        >
          <option value="">Active & Others</option>
          <option value="active">Active</option>
          <option value="transferred">Transferred</option>
          <option value="graduated">Graduated</option>
          <option value="archived">Archived</option>
        </select>
      </div>

      {/* Bulk promote bar */}
      {selected.length > 0 && (
        <div className="bg-amber-50 border border-amber-200 p-3 rounded-xl mb-4 flex justify-between items-center">
          <span className="text-sm text-amber-800">
            {selected.length} pupil(s) selected
          </span>
          <button
            onClick={() => window.location.href = `/dashboard/students/promote?ids=${selected.join(",")}`}
            className="bg-amber-600 text-white px-4 py-1.5 rounded-lg text-sm"
          >
            Promote Selected
          </button>
        </div>
      )}

      {/* Table */}
      <div className="bg-white rounded-xl shadow-sm overflow-x-auto">
        <table className="w-full text-sm">
          <thead className="bg-slate-50 text-slate-600">
            <tr>
              <th className="p-3 text-left">
                <input
                  type="checkbox"
                  checked={selected.length === students.length && students.length > 0}
                  onChange={toggleAll}
                />
              </th>
              <th className="p-3 text-left">Admission No</th>
              <th className="p-3 text-left">Name</th>
              <th className="p-3 text-left">Class</th>
              <th className="p-3 text-left">Gender</th>
              <th className="p-3 text-left">Guardian</th>
              <th className="p-3 text-left">Status</th>
              <th className="p-3 text-left">Actions</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr><td colSpan="8" className="p-6 text-center text-slate-400">Loading…</td></tr>
            ) : students.length === 0 ? (
              <tr><td colSpan="8" className="p-6 text-center text-slate-400">No pupils found</td></tr>
            ) : (
              students.map((s) => (
                <tr key={s._id} className="border-t hover:bg-slate-50">
                  <td className="p-3">
                    <input
                      type="checkbox"
                      checked={selected.includes(s._id)}
                      onChange={() => toggleSelect(s._id)}
                    />
                  </td>
                  <td className="p-3 font-mono text-xs">{s.admissionNumber}</td>
                  <td className="p-3 font-medium">{s.fullName}</td>
                  <td className="p-3">{s.className}</td>
                  <td className="p-3 capitalize">{s.gender}</td>
                  <td className="p-3">
                    <div>{s.guardian?.fullName}</div>
                    <div className="text-xs text-slate-500">{s.guardian?.phone}</div>
                  </td>
                  <td className="p-3">
                    <StatusBadge status={s.admissionStatus} />
                  </td>
                  <td className="p-3">
                    <Link
                      to={`/dashboard/students/${s._id}`}
                      className="text-blue-600 hover:underline text-xs"
                    >
                      View
                    </Link>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function StatCard({ label, value, color }) {
  const colors = {
    blue: "bg-blue-50 text-blue-700",
    indigo: "bg-indigo-50 text-indigo-700",
    amber: "bg-amber-50 text-amber-700",
    slate: "bg-slate-100 text-slate-700",
  };
  return (
    <div className={`p-4 rounded-xl ${colors[color]}`}>
      <div className="text-2xl font-bold">{value}</div>
      <div className="text-xs mt-1">{label}</div>
    </div>
  );
}

function StatusBadge({ status }) {
  const styles = {
    active: "bg-green-100 text-green-700",
    promoted: "bg-blue-100 text-blue-700",
    transferred: "bg-amber-100 text-amber-700",
    graduated: "bg-purple-100 text-purple-700",
    archived: "bg-slate-200 text-slate-600",
  };
  return (
    <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${styles[status] || styles.active}`}>
      {status}
    </span>
  );
}
