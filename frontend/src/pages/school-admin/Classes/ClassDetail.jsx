
import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { classApi, subjectApi } from "../../../services/classApi";
import api from "../../../services/api";

export default function ClassDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [cls, setCls] = useState(null);
  const [pupils, setPupils] = useState([]);
  const [subjects, setSubjects] = useState([]);
  const [teachers, setTeachers] = useState([]);
  const [loading, setLoading] = useState(true);

  const [formTeacherId, setFormTeacherId] = useState("");
  const [subjectForm, setSubjectForm] = useState({ subjectId: "", teacherId: "" });

  const load = async () => {
    setLoading(true);
    try {
      const [classRes, subjectsRes, teachersRes] = await Promise.all([
        classApi.get(id),
        subjectApi.list(),
        api.get("/users?role=teacher&limit=200"),
      ]);
      setCls(classRes.data.data.class);
      setPupils(classRes.data.data.pupils);
      setSubjects(subjectsRes.data.data.subjects);
      setTeachers(teachersRes.data.data.users);
      setFormTeacherId(classRes.data.data.class.formTeacherId?._id || "");
    } catch (err) {
      console.error(err);
      navigate("/dashboard/classes");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, [id]);

  const saveFormTeacher = async () => {
    if (!formTeacherId) return;
    await classApi.assignFormTeacher(id, formTeacherId);
    load();
  };

  const addSubjectTeacher = async () => {
    if (!subjectForm.subjectId || !subjectForm.teacherId) return;
    try {
      await classApi.assignSubjectTeacher(
        id,
        subjectForm.subjectId,
        subjectForm.teacherId
      );
      setSubjectForm({ subjectId: "", teacherId: "" });
      load();
    } catch (err) {
      alert(err.response?.data?.message || "Failed");
    }
  };

  const removeSubjectTeacher = async (assignmentId) => {
    if (!confirm("Remove this subject teacher?")) return;
    await classApi.removeSubjectTeacher(id, assignmentId);
    load();
  };

  if (loading) return <div className="p-6 text-slate-400">Loading…</div>;
  if (!cls) return null;

  return (
    <div className="p-6 max-w-5xl mx-auto">
      <button
        onClick={() => navigate(-1)}
        className="text-sm text-slate-500 mb-4"
      >
        ← Back to classes
      </button>

      {/* Header */}
      <div className="bg-white rounded-xl shadow-sm p-6 mb-6">
        <div className="flex justify-between items-start">
          <div>
            <h1 className="text-2xl font-bold text-slate-800">
              {cls.displayName || cls.name}
            </h1>
            <p className="text-sm text-slate-500">
              {cls.academicSession} · {cls.level} · {pupils.length}/{cls.capacity}{" "}
              pupils
            </p>
          </div>
          <span
            className={`px-3 py-1 rounded-full text-xs font-medium ${
              cls.level === "nursery"
                ? "bg-pink-100 text-pink-700"
                : "bg-green-100 text-green-700"
            }`}
          >
            {cls.level}
          </span>
        </div>
      </div>

      {/* Form Teacher */}
      <div className="bg-white rounded-xl shadow-sm p-6 mb-6">
        <h3 className="font-semibold text-slate-700 mb-3">Form Teacher</h3>
        <div className="flex gap-3 items-end">
          <label className="flex-1">
            <select
              className="w-full border rounded-lg p-2"
              value={formTeacherId}
              onChange={(e) => setFormTeacherId(e.target.value)}
            >
              <option value="">Select teacher…</option>
              {teachers.map((t) => (
                <option key={t._id} value={t._id}>
                  {t.fullName}
                </option>
              ))}
            </select>
          </label>
          <button
            onClick={saveFormTeacher}
            className="bg-blue-700 text-white px-4 py-2 rounded-lg"
          >
            Save
          </button>
        </div>
        {cls.formTeacherId && (
          <p className="text-sm text-slate-500 mt-3">
            Currently: <strong>{cls.formTeacherId.fullName}</strong>
          </p>
        )}
      </div>

      {/* Subject Teachers */}
      <div className="bg-white rounded-xl shadow-sm p-6 mb-6">
        <h3 className="font-semibold text-slate-700 mb-3">Subject Teachers</h3>

        {cls.subjectAssignments?.length > 0 ? (
          <table className="w-full text-sm mb-4">
            <thead className="bg-slate-50">
              <tr>
                <th className="p-2 text-left">Subject</th>
                <th className="p-2 text-left">Teacher</th>
                <th className="p-2 text-left">Assigned</th>
                <th className="p-2"></th>
              </tr>
            </thead>
            <tbody>
              {cls.subjectAssignments.map((a) => (
                <tr key={a._id} className="border-t">
                  <td className="p-2">
                    {a.subjectId?.name}
                    {a.subjectId?.isDevelopmental && (
                      <span className="ml-2 text-xs bg-amber-100 text-amber-700 px-2 py-0.5 rounded-full">
                        dev
                      </span>
                    )}
                  </td>
                  <td className="p-2">{a.teacherId?.fullName}</td>
                  <td className="p-2 text-slate-500 text-xs">
                    {new Date(a.assignedAt).toLocaleDateString()}
                  </td>
                  <td className="p-2 text-right">
                    <button
                      onClick={() => removeSubjectTeacher(a._id)}
                      className="text-red-600 hover:underline text-xs"
                    >
                      Remove
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        ) : (
          <p className="text-sm text-slate-400 mb-4">
            No subject teachers assigned yet.
          </p>
        )}

        {/* Add assignment */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3 items-end">
          <label>
            <span className="text-sm text-slate-600">Subject</span>
            <select
              className="mt-1 w-full border rounded-lg p-2"
              value={subjectForm.subjectId}
              onChange={(e) =>
                setSubjectForm({ ...subjectForm, subjectId: e.target.value })
              }
            >
              <option value="">Select subject…</option>
              {subjects.map((s) => (
                <option key={s._id} value={s._id}>
                  {s.name}
                </option>
              ))}
            </select>
          </label>
          <label>
            <span className="text-sm text-slate-600">Teacher</span>
            <select
              className="mt-1 w-full border rounded-lg p-2"
              value={subjectForm.teacherId}
              onChange={(e) =>
                setSubjectForm({ ...subjectForm, teacherId: e.target.value })
              }
            >
              <option value="">Select teacher…</option>
              {teachers.map((t) => (
                <option key={t._id} value={t._id}>
                  {t.fullName}
                </option>
              ))}
            </select>
          </label>
          <button
            onClick={addSubjectTeacher}
            disabled={!subjectForm.subjectId || !subjectForm.teacherId}
            className="bg-green-600 text-white px-4 py-2 rounded-lg disabled:opacity-50"
          >
            + Assign
          </button>
        </div>
      </div>

      {/* Pupils */}
      <div className="bg-white rounded-xl shadow-sm p-6">
        <div className="flex justify-between mb-3">
          <h3 className="font-semibold text-slate-700">
            Pupils ({pupils.length})
          </h3>
          <button
            onClick={() => classApi.backfillStudents().then(load)}
            className="text-xs text-blue-600 hover:underline"
          >
            Link unlinked pupils
          </button>
        </div>
        {pupils.length === 0 ? (
          <p className="text-sm text-slate-400">No pupils in this class yet.</p>
        ) : (
          <ul className="divide-y">
            {pupils.map((p) => (
              <li
                key={p._id}
                className="py-2 flex justify-between items-center text-sm"
              >
                <div>
                  <span className="font-medium">{p.fullName}</span>
                  <span className="text-slate-400 ml-2 font-mono text-xs">
                    {p.admissionNumber}
                  </span>
                </div>
                <span className="text-xs text-slate-500 capitalize">
                  {p.gender}
                </span>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}
