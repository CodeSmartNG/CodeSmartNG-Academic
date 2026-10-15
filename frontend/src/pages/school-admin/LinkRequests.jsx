import { useEffect, useState } from "react";
import api from "../../services/api";

export default function LinkRequests() {
  const [requests, setRequests] = useState([]);
  const [loading, setLoading] = useState(true);

  const load = () => {
    setLoading(true);
    api.get("/users/link-requests?status=pending")
      .then(({ data }) => setRequests(data.data.requests))
      .finally(() => setLoading(false));
  };
  useEffect(load, []);

  const approve = async (id) => {
    if (!confirm("Approve this link request?")) return;
    await api.patch(`/users/link-requests/${id}/approve`);
    load();
  };

  const reject = async (id) => {
    const reason = prompt("Reason for rejection?");
    if (reason === null) return;
    await api.patch(`/users/link-requests/${id}/reject`, { reason });
    load();
  };

  return (
    <div className="p-6 max-w-4xl mx-auto">
      <h1 className="text-2xl font-bold text-slate-800 mb-6">Parent Link Requests</h1>

      {loading ? (
        <p className="text-slate-400">Loading…</p>
      ) : requests.length === 0 ? (
        <div className="bg-white rounded-xl shadow-sm p-10 text-center text-slate-400">
          No pending requests
        </div>
      ) : (
        <div className="space-y-3">
          {requests.map((r) => (
            <div key={r._id} className="bg-white rounded-xl shadow-sm p-5">
              <div className="flex justify-between items-start">
                <div className="flex-1">
                  <h3 className="font-semibold text-slate-800">
                    {r.parentId?.fullName}{" "}
                    <span className="text-slate-400 text-sm">
                      wants to link {r.studentId?.fullName}
                    </span>
                  </h3>
                  <p className="text-xs text-slate-500 mt-1">
                    {r.studentId?.admissionNumber} · {r.studentId?.className} ·
                    Relationship: {r.relationship}
                  </p>
                  <p className="text-xs text-slate-500 mt-1">
                    Contact: {r.parentId?.email} · {r.parentId?.phone}
                  </p>
                  {r.note && (
                    <p className="text-sm text-slate-600 mt-2 italic">"{r.note}"</p>
                  )}
                </div>
                <div className="flex gap-2">
                  <button
                    onClick={() => approve(r._id)}
                    className="bg-green-600 text-white px-3 py-1.5 rounded-lg text-sm"
                  >
                    Approve
                  </button>
                  <button
                    onClick={() => reject(r._id)}
                    className="border border-red-600 text-red-600 px-3 py-1.5 rounded-lg text-sm"
                  >
                    Reject
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
