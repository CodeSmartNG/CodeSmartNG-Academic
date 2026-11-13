//frontend/src/pages/school-admin/Students/PromotePupils.jsx

import { useEffect, useState } from "react";
import { useSearchParams, useNavigate } from "react-router-dom";
import { studentApi } from "../../../services/studentApi";
import { useAuth } from "../../../context/AuthContext"; // 👈 SAS

const PRIMARY_CLASSES = [
  "Nursery 1", "Nursery 2", "Nursery 3",
  "Primary 1", "Primary 2", "Primary 3",
  "Primary 4", "Primary 5", "Primary 6",
];
const SECONDARY_CLASSES = [
  "JSS 1", "JSS 2", "JSS 3",
  "SSS 1", "SSS 2", "SSS 3",
];

export default function PromotePupils() {
  const { activeTrack } = useAuth(); // 👈 SAS
  const isSecondary = activeTrack === "secondary";
  const availableClasses = isSecondary ? SECONDARY_CLASSES : PRIMARY_CLASSES;

  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const [students, setStudents] = useState([]);
  
  // 👈 SAS: Added stream to target
  const [target, setTarget] = useState({ toClass: "", toSession: "2025/2026", stream: "" });
  const [saving, setSaving] = useState(false);

  const ids = (searchParams.get("ids") || "").split(",").filter(Boolean);

  useEffect(() => {
    if (ids.length === 0) return;
    Promise.all(ids.map((id) => studentApi.get(id)))
      .then((results) => setStudents(results.map((r) => r.data.data.student)));
  }, []);

  // 👈 SAS: Check if stream is required (when promoting to SSS 1)
  const needsStream = isSecondary && target.toClass === "SSS 1";

  const promote = async () => {
    if (!target.toClass) return alert("Choose target class");
    if (needsStream && !target.stream) return alert("Please select a stream for SSS 1 students");

    setSaving(true);
    try {
      const { data } = await studentApi.promote({
        studentIds: ids,
        toClass: target.toClass,
        toSession: target.toSession,
        stream: needsStream ? target.stream : null, // 👈 SAS
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
              {availableClasses.map((c) => <option key={c} value={c}>{c}</option>)}
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

        {/* 👈 SAS: Stream selector only shows when promoting to SSS 1 */}
        {needsStream && (
          <div className="mt-4 bg-blue-50 p-4 rounded-lg border border-blue-100">
            <label className="block">
              <span className="text-sm font-medium text-blue-900">Assign Stream *</span>
              <select
                className="mt-1 w-full border border-blue-200 rounded-lg p-2"
                value={target.stream}
                onChange={(e) => setTarget({ ...target, stream: e.target.value })}
              >
                <option value="">Select stream</option>
                <option value="science">Science</option>
                <option value="arts">Arts</option>
                <option value="commercial">Commercial</option>
              </select>
            </label>
            <p className="text-xs text-blue-700 mt-2">
              Students moving into SSS 1 must be assigned to a stream.
            </p>
          </div>
        )}

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
