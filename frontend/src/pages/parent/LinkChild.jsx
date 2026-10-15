import { useEffect, useState } from "react";
import { parentApi } from "../../services/parentApi";

export default function LinkChild() {
  const [form, setForm] = useState({ admissionNumber: "", relationship: "mother", note: "" });
  const [requests, setRequests] = useState([]);
  const [msg, setMsg] = useState(null);

  const load = () => parentApi.linkRequests().then(({ data }) => setRequests(data.data.requests));
  useEffect(load, []);

  const submit = async (e) => {
    e.preventDefault();
    try {
      const { data } = await parentApi.linkRequest(form);
      setMsg({ type: "success", text: data.message });
      setForm({ admissionNumber: "", relationship: "mother", note: "" });
      load();
    } catch (err) {
      setMsg({ type: "error", text: err.response?.data?.message || "Failed" });
    }
  };

  return (
    <div className="p-6 max-w-2xl mx-auto">
      <h1 className="text-2xl font-bold text-slate-800 mb-6">Link a Child</h1>

      {msg && (
        <div className={`p-3 rounded-lg mb-4 text-sm ${
          msg.type === "success" ? "bg-green-50 text-green-700" : "bg-red-50 text-red-700"
        }`}>{msg.text}</div>
      )}

      <form onSubmit={submit} className="bg-white rounded-xl shadow-sm p-6 mb-6 space-y-4">
        <label className="block">
          <span className="text-sm text-slate-600">Admission Number *</span>
          <input
            className="mt-1 w-full border rounded-lg p-2 font-mono"
            placeholder="CSN/2025/0001"
            value={form.admissionNumber}
            onChange={(e) => setForm({ ...form, admissionNumber: e.target.value.toUpperCase() })}
            required
          />
        </label>
        <label className="block">
          <span className="text-sm text-slate-600">Relationship *</span>
          <select className="mt-1 w-full border rounded-lg p-2"
            value={form.relationship}
            onChange={(e) => setForm({ ...form, relationship: e.target.value })}>
            <option value="father">Father</option>
            <option value="mother">Mother</option>
            <option value="guardian">Guardian</option>
            <option value="other">Other</option>
          </select>
        </label>
        <label className="block">
          <span className="text-sm text-slate-600">Note (optional)</span>
          <textarea className="mt-1 w-full border rounded-lg p-2" rows="2"
            value={form.note}
            onChange={(e) => setForm({ ...form, note: e.target.value })} />
        </label>
        <button type="submit" className="bg-blue-700 text-white px-5 py-2 rounded-lg">
          Submit Link Request
        </button>
      </form>

      <div className="bg-white rounded-xl shadow-sm p-6">
        <h3 className="font-semibold text-slate-700 mb-3">My Requests</h3>
        {requests.length === 0 ? (
          <p className="text-sm text-slate-400">No requests yet.</p>
        ) : (
          <ul className="divide-y text-sm">
            {requests.map((r) => (
              <li key={r._id} className="py-2 flex justify-between items-center">
                <div>
                  <div className="font-medium">
                    {r.studentId?.fullName}{" "}
                    <span className="text-slate-400 font-mono text-xs">
                      ({r.studentId?.admissionNumber})
                    </span>
                  </div>
                  <div className="text-xs text-slate-500">
                    {new Date(r.createdAt).toLocaleDateString()} · {r.relationship}
                  </div>
                </div>
                <span className={`text-xs px-2 py-0.5 rounded-full ${
                  r.status === "approved" ? "bg-green-100 text-green-700" :
                  r.status === "rejected" ? "bg-red-100 text-red-700" :
                  "bg-amber-100 text-amber-700"
                }`}>{r.status}</span>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}
