
import { useEffect, useState } from "react";
import api from "../../services/api";

export default function SchoolsList() {
  const [schools, setSchools] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const load = () => {
    setLoading(true);
    api
      .get("/schools")
      .then(({ data }) => setSchools(data.data.schools))
      .catch((err) =>
        setError(err.response?.data?.message || "Failed to load schools")
      )
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    load();
  }, []);

  const approve = async (id) => {
    if (!confirm("Approve this school?")) return;
    try {
      await api.patch(`/schools/${id}/approve`);
      load();
    } catch (err) {
      alert(err.response?.data?.message || "Failed to approve");
    }
  };

  const reject = async (id) => {
    const reason = prompt("Reason for rejection?");
    if (reason === null) return;
    try {
      await api.patch(`/schools/${id}/reject`, { reason });
      load();
    } catch (err) {
      alert(err.response?.data?.message || "Failed to reject");
    }
  };

  const suspend = async (id) => {
    if (!confirm("Suspend this school?")) return;
    try {
      await api.patch(`/schools/${id}/suspend`);
      load();
    } catch (err) {
      alert(err.response?.data?.message || "Failed to suspend");
    }
  };

  return (
    <div className="p-6 max-w-6xl mx-auto">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-2xl font-bold text-slate-800">Schools</h1>
          <p className="text-sm text-slate-500">
            Approve, reject, or suspend schools on the platform
          </p>
        </div>
      </div>

      {error && (
        <div className="bg-red-50 text-red-700 p-3 rounded-lg mb-4 text-sm">
          {error}
        </div>
      )}

      {loading ? (
        <p className="text-slate-400">Loading…</p>
      ) : schools.length === 0 ? (
        <div className="bg-white rounded-xl shadow-sm p-10 text-center text-slate-400">
          No schools registered yet
        </div>
      ) : (
        <div className="bg-white rounded-xl shadow-sm overflow-hidden">
          <table className="w-full text-sm">
            <thead className="bg-slate-50 text-slate-600">
              <tr>
                <th className="p-3 text-left">School</th>
                <th className="p-3 text-left">Contact</th>
                <th className="p-3 text-left">Status</th>
                <th className="p-3 text-left">Actions</th>
              </tr>
            </thead>
            <tbody>
              {schools.map((s) => (
                <tr key={s._id} className="border-t">
                  <td className="p-3">
                    <div className="font-medium">{s.name}</div>
                    <div className="text-xs text-slate-400 font-mono">
                      {s.slug}
                    </div>
                  </td>
                  <td className="p-3">
                    <div className="text-xs">{s.email}</div>
                    <div className="text-xs text-slate-500">{s.phone}</div>
                  </td>
                  <td className="p-3">
                    <StatusBadge status={s.status} />
                  </td>
                  <td className="p-3">
                    <div className="flex gap-1 flex-wrap">
                      {s.status === "pending" && (
                        <>
                          <button
                            onClick={() => approve(s._id)}
                            className="text-xs bg-green-600 text-white px-2 py-0.5 rounded"
                          >
                            Approve
                          </button>
                          <button
                            onClick={() => reject(s._id)}
                            className="text-xs bg-red-600 text-white px-2 py-0.5 rounded"
                          >
                            Reject
                          </button>
                        </>
                      )}
                      {s.status === "approved" && (
                        <button
                          onClick={() => suspend(s._id)}
                          className="text-xs bg-amber-600 text-white px-2 py-0.5 rounded"
                        >
                          Suspend
                        </button>
                      )}
                      {s.status === "suspended" && (
                        <button
                          onClick={() => approve(s._id)}
                          className="text-xs bg-green-600 text-white px-2 py-0.5 rounded"
                        >
                          Reactivate
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

function StatusBadge({ status }) {
  const styles = {
    pending: "bg-amber-100 text-amber-700",
    approved: "bg-green-100 text-green-700",
    rejected: "bg-red-100 text-red-700",
    suspended: "bg-slate-200 text-slate-600",
  };
  return (
    <span
      className={`px-2 py-0.5 rounded-full text-xs font-medium ${
        styles[status] || styles.pending
      }`}
    >
      {status}
    </span>
  );
}
