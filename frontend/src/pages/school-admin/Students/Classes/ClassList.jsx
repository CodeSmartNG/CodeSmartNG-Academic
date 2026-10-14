import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { classApi } from "../../../services/classApi";

export default function ClassList() {
  const [classes, setClasses] = useState([]);
  const [stats, setStats] = useState(null);
  const [filters, setFilters] = useState({ level: "", search: "" });
  const [loading, setLoading] = useState(true);
  const [showCreate, setShowCreate] = useState(false);

  const load = async () => {
    setLoading(true);
    try {
      const [listRes, statsRes] = await Promise.all([
        classApi.list(filters),
        classApi.stats(),
      ]);
      setClasses(listRes.data.data.classes);
      setStats(statsRes.data.data);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); }, [filters]);

  return (
    <div className="p-6">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-2xl font-bold text-slate-800">Classes</h1>
          <p className="text-sm text-slate-500">Manage classes and teacher assignments</p>
        </div>
        <button
          onClick={() => setShowCreate(true)}
          className="bg-blue-700 hover:bg-blue-800 text-white px-4 py-2 rounded-lg"
        >
          + Create Class
        </button>
      </div>

      {stats && (
        <div className="grid grid-cols-3 gap-4 mb-6">
          <StatCard label="Total Classes" value={stats.total} color="blue" />
          <StatCard label="Nursery" value={stats.nursery} color="pink" />
          <StatCard label="Primary" value={stats.primary} color="green" />
        </div>
      )}

      <div className="bg-white p-4 rounded-xl shadow-sm mb-4 flex flex-wrap gap-3">
        <input
          placeholder="Search class name..."
          className="border rounded-lg p-2 flex-1 min-w-[200px]"
          value={filters.search}
          onChange={(e) => setFilters({ ...filters, search: e.target.value })}
        />
        <select
          className="border rounded-lg p-2"
          value={filters.level}
          onChange={(e) => setFilters({ ...filters, level: e.target.value })}
        >
          <option value="">All Levels</option>
          <option value="nursery">Nursery</option>
          <option value="primary">Primary</option>
        </select>
      </div>

      <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
        {loading ? (
          <p className="text-slate-400">Loading…</p>
        ) : classes.length === 0 ? (
          <p className="text-slate-400">No classes yet</p>
        ) : (
          classes.map((c) => (
            <Link
              key={c._id}
              to={`/dashboard/classes/${c._id}`}
              className="bg-white rounded-xl shadow-sm p-5 hover:shadow-md transition"
            >
              <div className="flex justify-between items-start mb-3">
                <div>
                  <h3 className="font-bold text-lg text-slate-800">
                    {c.displayName || c.name}
                  </h3>
                  <span className={`text-xs px-2 py-0.5 rounded-full ${
                    c.level === "nursery"
                      ? "bg-pink-100 text-pink-700"
                      : "bg-green-100 text-green-700"
                  }`}>
                    {c.level}
                  </span>
                </div>
                <div className="text-right">
                  <div className="text-2xl font-bold text-blue-700">{c.pupilCount}</div>
                  <div className="text-xs text-slate-500">pupils</div>
                </div>
              </div>

              <div className="text-sm text-slate-600 mb-2">
                <span className="text-slate-400">Form teacher:</span>{" "}
                {c.formTeacherId?.fullName || <span className="text-amber-600">Not assigned</span>}
              </div>

              <div className="text-xs text-slate-500">
                {c.subjectAssignments?.length || 0} subject teacher
                {c.subjectAssignments?.length === 1 ? "" : "s"} assigned
              </div>
            </Link>
          ))
        )}
      </div>

      {showCreate && (
        <CreateClassModal
          onClose={() => setShowCreate(false)}
          onCreated={() => { setShowCreate(false); load(); }}
        />
      )}
    </div>
  );
}

function StatCard({ label, value, color }) {
  const colors = {
    blue: "bg-blue-50 text-blue-700",
    pink: "bg-pink-50 text-pink-700",
    green: "bg-green-50 text-green-700",
  };
  return (
    <div className={`p-4 rounded-xl ${colors[color]}`}>
      <div className="text-2xl font-bold">{value}</div>
      <div className="text-xs mt-1">{label}</div>
    </div>
  );
}

function CreateClassModal({ onClose, onCreated }) {
  const [form, setForm] = useState({
    name: "",
    level: "primary",
    section: "",
    capacity: 30,
    academicSession: "2025/2026",
  });
  const [error, setError] = useState("");
  const [saving, setSaving] = useState(false);

  const submit = async () => {
    setSaving(true);
    setError("");
    try {
      await classApi.create(form);
      onCreated();
    } catch (err) {
      setError(err.response?.data?.message || "Failed to create class");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/40 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-xl p-6 w-full max-w-md">
        <h3 className="font-bold text-lg mb-4">Create New Class</h3>
        {error && <div className="bg-red-50 text-red-700 p-2 rounded mb-3 text-sm">{error}</div>}

        <label className="block mb-3">
          <span className="text-sm text-slate-600">Class Name *</span>
          <input
            className="mt-1 w-full border rounded-lg p-2"
            placeholder="e.g. Primary 1, Nursery 2"
            value={form.name}
            onChange={(e) => setForm({ ...form, name: e.target.value })}
          />
        </label>

        <div className="grid grid-cols-2 gap-3 mb-3">
          <label className="block">
            <span className="text-sm text-slate-600">Level *</span>
            <select
              className="mt-1 w-full border rounded-lg p-2"
              value={form.level}
              onChange={(e) => setForm({ ...form, level: e.target.value })}
            >
              <option value="nursery">Nursery</option>
              <option value="primary">Primary</option>
            </select>
          </label>
          <label className="block">
            <span className="text-sm text-slate-600">Section</span>
            <input
              className="mt-1 w-full border rounded-lg p-2"
              placeholder="A / Blue"
              value={form.section}
              onChange={(e) => setForm({ ...form, section: e.target.value })}
            />
          </label>
        </div>

        <div className="grid grid-cols-2 gap-3 mb-3">
          <label className="block">
            <span className="text-sm text-slate-600">Capacity</span>
            <input
              type="number"
              className="mt-1 w-full border rounded-lg p-2"
              value={form.capacity}
              onChange={(e) => setForm({ ...form, capacity: Number(e.target.value) })}
            />
          </label>
          <label className="block">
            <span className="text-sm text-slate-600">Session *</span>
            <input
              className="mt-1 w-full border rounded-lg p-2"
              value={form.academicSession}
              onChange={(e) => setForm({ ...form, academicSession: e.target.value })}
            />
          </label>
        </div>

        <div className="flex justify-end gap-2 mt-5">
          <button onClick={onClose} className="px-4 py-2 border rounded-lg">Cancel</button>
          <button
            onClick={submit}
            disabled={saving || !form.name}
            className="bg-blue-700 text-white px-4 py-2 rounded-lg disabled:opacity-50"
          >
            {saving ? "Creating…" : "Create"}
          </button>
        </div>
      </div>
    </div>
  );
}
