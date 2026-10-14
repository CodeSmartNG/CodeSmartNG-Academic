import { useEffect, useState } from "react";
import { Link, useSearchParams } from "react-router-dom";
import { classApi } from "../../../services/classApi";
import { subjectApi } from "../../../services/classApi";
import { assessmentApi } from "../../../services/resultApi";

export default function AssessmentList() {
  const [searchParams, setSearchParams] = useSearchParams();
  const [classes, setClasses] = useState([]);
  const [subjects, setSubjects] = useState([]);
  const [assessments, setAssessments] = useState([]);

  const [filters, setFilters] = useState({
    classId: searchParams.get("classId") || "",
    subjectId: searchParams.get("subjectId") || "",
    session: searchParams.get("session") || "2025/2026",
    term: searchParams.get("term") || "First Term",
  });

  const [showCreate, setShowCreate] = useState(false);

  useEffect(() => {
    Promise.all([classApi.list(), subjectApi.list()]).then(([c, s]) => {
      setClasses(c.data.data.classes);
      setSubjects(s.data.data.subjects);
    });
  }, []);

  const load = () => {
    assessmentApi.list(filters).then(({ data }) => setAssessments(data.data.assessments));
    setSearchParams(filters, { replace: true });
  };

  useEffect(load, [filters]);

  const remove = async (id) => {
    if (!confirm("Delete this assessment and its scores?")) return;
    await assessmentApi.remove(id);
    load();
  };

  return (
    <div className="p-6 max-w-6xl mx-auto">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-2xl font-bold text-slate-800">Assessments</h1>
          <p className="text-sm text-slate-500">Create tests & exams, then enter scores</p>
        </div>
        <button
          onClick={() => setShowCreate(true)}
          className="bg-blue-700 text-white px-4 py-2 rounded-lg"
        >
          + New Assessment
        </button>
      </div>

      {/* Filters */}
      <div className="bg-white p-4 rounded-xl shadow-sm mb-4 grid grid-cols-2 md:grid-cols-4 gap-3">
        <select className="border rounded-lg p-2" value={filters.classId}
          onChange={(e) => setFilters({ ...filters, classId: e.target.value })}>
          <option value="">All Classes</option>
          {classes.map((c) => <option key={c._id} value={c._id}>{c.name}</option>)}
        </select>
        <select className="border rounded-lg p-2" value={filters.subjectId}
          onChange={(e) => setFilters({ ...filters, subjectId: e.target.value })}>
          <option value="">All Subjects</option>
          {subjects.map((s) => <option key={s._id} value={s._id}>{s.name}</option>)}
        </select>
        <input className="border rounded-lg p-2" placeholder="Session"
          value={filters.session}
          onChange={(e) => setFilters({ ...filters, session: e.target.value })} />
        <select className="border rounded-lg p-2" value={filters.term}
          onChange={(e) => setFilters({ ...filters, term: e.target.value })}>
          <option>First Term</option>
          <option>Second Term</option>
          <option>Third Term</option>
        </select>
      </div>

      {/* Table */}
      <div className="bg-white rounded-xl shadow-sm overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-slate-50">
            <tr>
              <th className="p-3 text-left">Name</th>
              <th className="p-3 text-left">Class</th>
              <th className="p-3 text-left">Subject</th>
              <th className="p-3 text-left">Type</th>
              <th className="p-3 text-left">Max</th>
              <th className="p-3 text-left">Teacher</th>
              <th className="p-3 text-left">Actions</th>
            </tr>
          </thead>
          <tbody>
            {assessments.length === 0 ? (
              <tr><td colSpan="7" className="p-6 text-center text-slate-400">No assessments yet</td></tr>
            ) : assessments.map((a) => (
              <tr key={a._id} className="border-t">
                <td className="p-3 font-medium">{a.name}</td>
                <td className="p-3">{a.classId?.name}</td>
                <td className="p-3">{a.subjectId?.name}</td>
                <td className="p-3 capitalize text-xs">{a.type}</td>
                <td className="p-3">{a.maxScore}</td>
                <td className="p-3 text-xs">{a.teacherId?.fullName}</td>
                <td className="p-3 flex gap-2">
                  <Link
                    to={`/dashboard/results/scores/${a._id}`}
                    className="text-blue-600 hover:underline text-xs"
                  >
                    Enter Scores
                  </Link>
                  <button onClick={() => remove(a._id)} className="text-red-600 hover:underline text-xs">
                    Delete
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {showCreate && (
        <CreateAssessmentModal
          classes={classes}
          subjects={subjects}
          defaults={{ session: filters.session, term: filters.term }}
          onClose={() => setShowCreate(false)}
          onCreated={() => { setShowCreate(false); load(); }}
        />
      )}
    </div>
  );
}

function CreateAssessmentModal({ classes, subjects, defaults, onClose, onCreated }) {
  const [form, setForm] = useState({
    classId: "", subjectId: "",
    session: defaults.session, term: defaults.term,
    name: "First Test", type: "test", maxScore: 10,
  });
  const [error, setError] = useState("");
  const [saving, setSaving] = useState(false);

  const submit = async () => {
    setSaving(true); setError("");
    try {
      await assessmentApi.create(form);
      onCreated();
    } catch (err) {
      setError(err.response?.data?.message || "Failed");
    } finally { setSaving(false); }
  };

  return (
    <div className="fixed inset-0 bg-black/40 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-xl p-6 w-full max-w-md">
        <h3 className="font-bold text-lg mb-4">New Assessment</h3>
        {error && <div className="bg-red-50 text-red-700 p-2 rounded mb-3 text-sm">{error}</div>}

        <label className="block mb-3">
          <span className="text-sm text-slate-600">Class</span>
          <select className="mt-1 w-full border rounded-lg p-2"
            value={form.classId}
            onChange={(e) => setForm({ ...form, classId: e.target.value })}>
            <option value="">Select…</option>
            {classes.map((c) => <option key={c._id} value={c._id}>{c.name}</option>)}
          </select>
        </label>
        <label className="block mb-3">
          <span className="text-sm text-slate-600">Subject</span>
          <select className="mt-1 w-full border rounded-lg p-2"
            value={form.subjectId}
            onChange={(e) => setForm({ ...form, subjectId: e.target.value })}>
            <option value="">Select…</option>
            {subjects.map((s) => <option key={s._id} value={s._id}>{s.name}</option>)}
          </select>
        </label>
        <div className="grid grid-cols-2 gap-3 mb-3">
          <label className="block">
            <span className="text-sm text-slate-600">Session</span>
            <input className="mt-1 w-full border rounded-lg p-2"
              value={form.session}
              onChange={(e) => setForm({ ...form, session: e.target.value })} />
          </label>
          <label className="block">
            <span className="text-sm text-slate-600">Term</span>
            <select className="mt-1 w-full border rounded-lg p-2"
              value={form.term}
              onChange={(e) => setForm({ ...form, term: e.target.value })}>
              <option>First Term</option>
              <option>Second Term</option>
              <option>Third Term</option>
            </select>
          </label>
        </div>
        <label className="block mb-3">
          <span className="text-sm text-slate-600">Assessment Name</span>
          <input className="mt-1 w-full border rounded-lg p-2"
            placeholder="First Test / Mid-Term / Examination"
            value={form.name}
            onChange={(e) => setForm({ ...form, name: e.target.value })} />
        </label>
        <div className="grid grid-cols-2 gap-3 mb-4">
          <label className="block">
            <span className="text-sm text-slate-600">Type</span>
            <select className="mt-1 w-full border rounded-lg p-2"
              value={form.type}
              onChange={(e) => setForm({ ...form, type: e.target.value })}>
              <option value="test">Test</option>
              <option value="assignment">Assignment</option>
              <option value="exam">Exam</option>
              <option value="project">Project</option>
            </select>
          </label>
          <label className="block">
            <span className="text-sm text-slate-600">Max Score</span>
            <input type="number" className="mt-1 w-full border rounded-lg p-2"
              value={form.maxScore}
              onChange={(e) => setForm({ ...form, maxScore: Number(e.target.value) })} />
          </label>
        </div>
        <div className="flex justify-end gap-2">
          <button onClick={onClose} className="px-4 py-2 border rounded-lg">Cancel</button>
          <button onClick={submit} disabled={saving || !form.classId || !form.subjectId}
            className="bg-blue-700 text-white px-4 py-2 rounded-lg disabled:opacity-50">
            {saving ? "Creating…" : "Create"}
          </button>
        </div>
      </div>
    </div>
  );
}
