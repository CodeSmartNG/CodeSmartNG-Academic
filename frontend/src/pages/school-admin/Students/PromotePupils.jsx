//frontend/src/pages/school-admin/Students/PromotePupils.jsx

import { useEffect, useState } from "react";
import { useSearchParams, useNavigate } from "react-router-dom";
import { studentApi } from "../../../services/studentApi";

const CLASSES = [
  "Nursery 1", "Nursery 2", "Nursery 3",
  "Primary 1", "Primary 2", "Primary 3",
  "Primary 4", "Primary 5", "Primary 6",
];

export default function PromotePupils() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const [students, setStudents] = useState([]);
  const [target, setTarget] = useState({ toClass: "", toSession: "2025/2026" });
  const [saving, setSaving] = useState(false);

  const ids = (searchParams.get("ids") || "").split(",").filter(Boolean);

  useEffect(() => {
    if (ids.length === 0) return;
    // For MVP: fetch each pupil individually.
    // For production: add a GET /students?ids=... endpoint.
    Promise.all(ids.map((id) => studentApi.get(id)))
      .then((results) => setStudents(results.map((r) => r.data.data.student)));
  }, []);

  const promote = async () => {
    if (!target.toClass) return alert("Choose target class");
    setSaving(true);
    try {
      const { data } = await studentApi.promote({
        studentIds: ids,
        toClass: target.toClass,
        toSession: target.toSession,
      });
      alert(data.message);
      navigate("/dashboard/students");
    } catch (err) {
      alert(err.response?.data?.message || "Failed to promote");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="p-6 max-w-3xl mx-auto">
      <h1 className="text-2xl font-bold mb-6">Promote Pupils</h1>

      <div className="bg-white rounded-xl shadow-sm p-6 mb-6">
        <h3 className="font-semibold text-slate-700 mb-3">
          Selected Pupils ({students.length})
        </h3>
        <ul className="space-y-1 text-sm">
          {students.map((s) => (
            <li key={s._id} className="flex justify-between border-b py-2">
              <span>{s.fullName} <span className="text-slate-400">({s.admissionNumber})</span></span>
              <span className="text-slate-500">{s.className}</span>
            </li>
          ))}
        </ul>
      </div>

      <div className="bg-white rounded-xl shadow-sm p-6">
        <h3 className="font-semibold text-slate-700 mb-4">Promote To</h3>
        <div className="grid grid-cols-2 gap-4">
          <label className="block">
            <span className="text-sm text-slate-600">Target Class *</span>
            <select
              className="mt-1 w-full border rounded-lg p-2"
              value={target.toClass}
              onChange={(e) => setTarget({ ...target, toClass: e.target.value })}
            >
              <option value="">Select class</option>
              {CLASSES.map((c) => <option key={c} value={c}>{c}</option>)}
            </select>
          </label>
          <label className="block">
            <span className="text-sm text-slate-600">New Session</span>
            <input
              className="mt-1 w-full border rounded-lg p-2"
              value={target.toSession}
              onChange={(e) => setTarget({ ...target, toSession: e.target.value })}
            />
          </label>
        </div>
        <button
          onClick={promote}
          disabled={saving}
          className="mt-6 bg-blue-700 text-white px-6 py-2 rounded-lg disabled:opacity-50"
        >
          {saving ? "Promoting…" : `Promote ${students.length} pupil(s)`}
        </button>
      </div>
    </div>
  );
}
