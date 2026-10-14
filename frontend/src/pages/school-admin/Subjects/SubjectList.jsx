import { useEffect, useState } from "react";
import { subjectApi } from "../../../services/classApi";

export default function SubjectList() {
  const [subjects, setSubjects] = useState([]);
  const [showCreate, setShowCreate] = useState(false);
  const [form, setForm] = useState({
    name: "", code: "", description: "", isDevelopmental: false,
  });
  const [loading, setLoading] = useState(true);

  const load = () => {
    setLoading(true);
    subjectApi.list({ includeInactive: true })
      .then(({ data }) => setSubjects(data.data.subjects))
      .finally(() => setLoading(false));
  };
  useEffect(load, []);

  const submit = async () => {
    try {
      await subjectApi.create(form);
      setShowCreate(false);
      setForm({ name: "", code: "", description: "", isDevelopmental: false });
      load();
    } catch (err) {
      alert(err.response?.data?.message || "Failed");
    }
  };

  const remove = async (id) => {
    if (!confirm("Deactivate this subject?")) return;
    await subjectApi.remove(id);
    load();
  };

  return (
    <div className="p-6">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-2xl font-bold text-slate-800">Subjects</h1>
          <p className="text-sm text-slate-500">
            Define subjects taught in your school
          </p>
        </div>
        <button
          onClick={() => setShowCreate(true)}
          className="bg-blue-700 text-white px-4 py-2 rounded-lg"
        >
          + Add Subject
        </button>
      </div>

      <div className="bg-white rounded-xl shadow-sm overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-slate-50">
            <tr>
              <th className="p-3 text-left">Name</th>
              <th className="p-3 text-left">Code</th>
              <th className="p-3 text-left">Type</th>
              <th className="p-3 text-left">Status</th>
              <th className="p-3 text-left"></th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr><td colSpan="5" className="p-6 text-center text-slate-400">Loading…</td></tr>
            ) : subjects.length === 0 ? (
              <tr><td colSpan="5" className="p-6 text-center text-slate-400">No subjects yet</td></tr>
            ) : (
              subjects.map((s) => (
                <tr key={s._id} className="border-t">
                  <td className="p-3 font-medium">{s.name}</td>
                  <td className="p-3 font-mono text-xs">{s.code || "—"}</td>
                  <td className="p-3">
                    {s.isDevelopmental ? (
                      <span className="bg-amber-100 text-amber-700 px-2 py-0.5 rounded-full text-xs">
                        Developmental
                      </span>
                    ) : (
                      <span className="bg-blue-100 text-blue-700 px-2 py-0.5 rounded-full text-xs">
                        Numeric
                      </span>
                    )}
                  </td>
                  <td className="p-3">
                    {s.isActive ? (
                      <span className="text-green-700 text-xs">Active</span>
                    ) : (
                      <span className="text-slate-400 text-xs">Inactive</span>
                    )}
                  </td>
                  <td className="p-3 text-right">
                    {s.isActive && (
                      <button
                        onClick={() => remove(s._id)}
                        className="text-red-600 hover:underline text-xs"
                      >
                        Deactivate
                      </button>
                    )}
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {showCreate && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-xl p-6 w-full max-w-md">
            <h3 className="font-bold text-lg mb-4">Add Subject</h3>
            <label className="block mb-3">
              <span className="text-sm text-slate-600">Name *</span>
              <input
                className="mt-1 w-full border rounded-lg p-2"
                placeholder="e.g. Mathematics"
                value={form.name}
                onChange={(e) => setForm({ ...form, name: e.target.value })}
              />
            </label>
            <label className="block mb-3">
              <span className="text-sm text-slate-600">Code</span>
              <input
                className="mt-1 w-full border rounded-lg p-2"
                placeholder="MTH"
                value={form.code}
                onChange={(e) => setForm({ ...form, code: e.target.value.toUpperCase() })}
              />
            </label>
            <label className="flex items-center gap-2 mb-4">
              <input
                type="checkbox"
                checked={form.isDevelopmental}
                onChange={(e) => setForm({ ...form, isDevelopmental: e.target.checked })}
              />
              <span className="text-sm text-slate-600">
                Nursery developmental subject (no numeric score)
              </span>
            </label>
            <div className="flex justify-end gap-2">
              <button onClick={() => setShowCreate(false)} className="px-4 py-2 border rounded-lg">
                Cancel
              </button>
              <button
                onClick={submit}
                disabled={!form.name}
                className="bg-blue-700 text-white px-4 py-2 rounded-lg disabled:opacity-50"
              >
                Create
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
