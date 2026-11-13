import { useEffect, useState } from "react";
import { subjectApi } from "../../../services/classApi";
import { useAuth } from "../../../context/AuthContext"; // 👈 SAS

export default function SubjectList() {
  const { activeTrack } = useAuth(); // 👈 SAS
  const isSecondary = activeTrack === "secondary";

  const [subjects, setSubjects] = useState([]);
  const [showCreate, setShowCreate] = useState(false);
  const [form, setForm] = useState({
    name: "", code: "", description: "", isDevelopmental: false,
    track: activeTrack, // 👈 SAS: Default track
    streams: [],        // 👈 SAS: For Science/Arts/Commercial subjects
  });
  const [loading, setLoading] = useState(true);

  const load = () => {
    setLoading(true);
    // 👈 SAS: Send the track
    subjectApi.list({ includeInactive: true, track: activeTrack })
      .then(({ data }) => setSubjects(data.data.subjects))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    // Reset form track when activeTrack changes
    setForm({ 
      name: "", code: "", description: "", isDevelopmental: false,
      track: activeTrack, streams: [] 
    });
    load();
  }, [activeTrack]);

  const submit = async () => {
    try {
      // 👈 SAS: Send track
      await subjectApi.create({ ...form, track: activeTrack });
      setShowCreate(false);
      setForm({ 
        name: "", code: "", description: "", isDevelopmental: false,
        track: activeTrack, streams: [] 
      });
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

  // 👈 SAS: Handle stream toggling in the form
  const toggleStream = (stream) => {
    setForm((prev) => ({
      ...prev,
      streams: prev.streams.includes(stream)
        ? prev.streams.filter((s) => s !== stream)
        : [...prev.streams, stream],
    }));
  };

  return (
    <div className="p-6">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-2xl font-bold text-slate-800">
            {isSecondary ? "Secondary Subjects" : "Nursery & Primary Subjects"}
          </h1>
          <p className="text-sm text-slate-500">
            Define subjects taught in your {isSecondary ? "secondary" : "nursery & primary"} school
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
              {/* 👈 SAS: Show streams column for Secondary */}
              {isSecondary && <th className="p-3 text-left">Streams</th>}
              <th className="p-3 text-left">Status</th>
              <th className="p-3 text-left"></th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr><td colSpan={isSecondary ? 6 : 5} className="p-6 text-center text-slate-400">Loading…</td></tr>
            ) : subjects.length === 0 ? (
              <tr><td colSpan={isSecondary ? 6 : 5} className="p-6 text-center text-slate-400">No subjects yet</td></tr>
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
                  {/* 👈 SAS: Show streams for Secondary */}
                  {isSecondary && (
                    <td className="p-3">
                      {s.streams && s.streams.length > 0 ? (
                        <div className="flex flex-wrap gap-1">
                          {s.streams.map((st) => (
                            <span key={st} className="bg-purple-100 text-purple-700 px-2 py-0.5 rounded-full text-xs capitalize">
                              {st}
                            </span>
                          ))}
                        </div>
                      ) : (
                        <span className="text-xs text-slate-400">Core (All)</span>
                      )}
                    </td>
                  )}
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
          <div className="bg-white rounded-xl p-6 w-full max-w-md max-h-[90vh] overflow-y-auto">
            <h3 className="font-bold text-lg mb-4">
              Add {isSecondary ? "Secondary" : "Primary"} Subject
            </h3>
            <label className="block mb-3">
              <span className="text-sm text-slate-600">Name *</span>
              <input
                className="mt-1 w-full border rounded-lg p-2"
                placeholder={isSecondary ? "e.g. Physics, Economics" : "e.g. Mathematics"}
                value={form.name}
                onChange={(e) => setForm({ ...form, name: e.target.value })}
              />
            </label>
            <label className="block mb-3">
              <span className="text-sm text-slate-600">Code</span>
              <input
                className="mt-1 w-full border rounded-lg p-2"
                placeholder={isSecondary ? "PHY" : "MTH"}
                value={form.code}
                onChange={(e) => setForm({ ...form, code: e.target.value.toUpperCase() })}
              />
            </label>

            {/* 👈 SAS: Stream selector for Secondary subjects */}
            {isSecondary && (
              <div className="mb-3">
                <span className="text-sm text-slate-600 block mb-2">
                  Streams (leave empty for core subjects)
                </span>
                <div className="flex gap-2">
                  {["science", "arts", "commercial"].map((st) => (
                    <label key={st} className="flex items-center gap-1 text-sm cursor-pointer">
                      <input
                        type="checkbox"
                        checked={form.streams.includes(st)}
                        onChange={() => toggleStream(st)}
                      />
                      <span className="capitalize">{st}</span>
                    </label>
                  ))}
                </div>
                <p className="text-xs text-slate-400 mt-1">
                  Leave empty if taught to all students (e.g. English, Maths)
                </p>
              </div>
            )}

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
