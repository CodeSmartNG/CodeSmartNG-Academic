import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { classApi, subjectApi } from "../../../services/classApi";
import { homeworkApi } from "../../../services/commsApi";

export default function CreateHomework() {
  const navigate = useNavigate();
  const [classes, setClasses] = useState([]);
  const [subjects, setSubjects] = useState([]);
  const [form, setForm] = useState({
    classId: "",
    subjectId: "",
    title: "",
    description: "",
    dueDate: "",
    session: "2025/2026",
    term: "First Term",
    allowTextSubmission: true,
  });
  const [error, setError] = useState("");
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    Promise.all([
      classApi.myClasses ? classApi.myClasses() : classApi.list(),
      subjectApi.list(),
    ]).then(([c, s]) => {
      setClasses(c.data.data.classes || []);
      setSubjects(s.data.data.subjects);
    });
  }, []);

  const submit = async (e) => {
    e.preventDefault();
    setSaving(true);
    setError("");
    try {
      const { data } = await homeworkApi.create(form);
      navigate(`/dashboard/homework/${data.data.homework._id}`);
    } catch (err) {
      setError(err.response?.data?.message || "Failed to create");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="p-6 max-w-2xl mx-auto">
      <h1 className="text-2xl font-bold text-slate-800 mb-6">Assign Homework</h1>

      {error && (
        <div className="bg-red-50 text-red-700 p-3 rounded-lg mb-4 text-sm">{error}</div>
      )}

      <form onSubmit={submit} className="bg-white rounded-xl shadow-sm p-6 space-y-4">
        <div className="grid grid-cols-2 gap-3">
          <label className="block">
            <span className="text-sm text-slate-600">Class *</span>
            <select className="mt-1 w-full border rounded-lg p-2" required
              value={form.classId}
              onChange={(e) => setForm({ ...form, classId: e.target.value })}>
              <option value="">Select…</option>
              {classes.map((c) => <option key={c._id} value={c._id}>{c.name}</option>)}
            </select>
          </label>
          <label className="block">
            <span className="text-sm text-slate-600">Subject *</span>
            <select className="mt-1 w-full border rounded-lg p-2" required
              value={form.subjectId}
              onChange={(e) => setForm({ ...form, subjectId: e.target.value })}>
              <option value="">Select…</option>
              {subjects.map((s) => <option key={s._id} value={s._id}>{s.name}</option>)}
            </select>
          </label>
        </div>

        <label className="block">
          <span className="text-sm text-slate-600">Title *</span>
          <input className="mt-1 w-full border rounded-lg p-2" required
            placeholder="e.g. Read Chapter 3 and answer questions 1-5"
            value={form.title}
            onChange={(e) => setForm({ ...form, title: e.target.value })} />
        </label>

        <label className="block">
          <span className="text-sm text-slate-600">Description *</span>
          <textarea className="mt-1 w-full border rounded-lg p-2" rows="5" required
            value={form.description}
            onChange={(e) => setForm({ ...form, description: e.target.value })} />
        </label>

        <div className="grid grid-cols-3 gap-3">
          <label className="block">
            <span className="text-sm text-slate-600">Due Date *</span>
            <input type="date" className="mt-1 w-full border rounded-lg p-2" required
              value={form.dueDate}
              onChange={(e) => setForm({ ...form, dueDate: e.target.value })} />
          </label>
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

        <label className="flex items-center gap-2">
          <input type="checkbox" checked={form.allowTextSubmission}
            onChange={(e) => setForm({ ...form, allowTextSubmission: e.target.checked })} />
          <span className="text-sm text-slate-600">Allow pupils to type their answers online</span>
        </label>

        <button type="submit" disabled={saving}
          className="w-full bg-blue-700 text-white py-2 rounded-lg disabled:opacity-50">
          {saving ? "Publishing…" : "Publish Homework"}
        </button>
      </form>
    </div>
  );
}
