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
      .then(({ data }) => setSchools(data?.data?.schools || []))
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

  const renew = async (id) => {
    if (!confirm("Renew this school's subscription for 30 days?")) return;
    try {
      const { data } = await api.patch(`/schools/${id}/renew`);
      alert(data.message);
      load();
    } catch (err) {
      alert(err.response?.data?.message || "Failed to renew");
    }
  };

  // 👈 NEW: Delete School (with safety checks)
  const deleteSchool = async (id, name, status) => {
    // Safety 1: Warn about permanent deletion
    const confirm1 = confirm(
      `⚠️ DANGER: You are about to PERMANENTLY delete "${name}".\n\nThis will erase ALL pupils, teachers, classes, results, and fees for this school.\n\nThis action CANNOT be undone. Continue?`
    );
    if (!confirm1) return;

    // Safety 2: If approved, force them to suspend first
    if (status === "approved") {
      alert(
        `🛑 "${name}" is currently approved. You must SUSPEND it first before deleting.\n\n(This prevents accidentally deleting an active school.)`
      );
      return;
    }

    // Safety 3: Require typing DELETE
    const typed = prompt(`To confirm, type DELETE (all caps):`);
    if (typed !== "DELETE") {
      alert("Cancelled. You must type DELETE exactly to confirm.");
      return;
    }

    try {
      await api.delete(`/schools/${id}`);
      alert(`"${name}" and all its data have been deleted.`);
      load();
    } catch (err) {
      alert(err.response?.data?.message || "Failed to delete");
    }
  };

  const isExpired = (date) => {
    if (!date) return false;
    return new Date() > new Date(date);
  };

  return (
    <div className="p-6 max-w-6xl mx-auto">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-2xl font-bold text-slate-800">Schools</h1>
          <p className="text-sm text-slate-500">
            Approve, manage subscriptions, or suspend schools
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
        <div className="bg-white rounded-xl shadow-sm overflow-x-auto">
          <table className="w-full text-sm min-w-[700px]">
            <thead className="bg-slate-50 text-slate-600">
              <tr>
                <th className="p-3 text-left">School</th>
                <th className="p-3 text-left">Tracks</th>
                <th className="p-3 text-left">Contact</th>
                <th className="p-3 text-left">Status</th>
                <th className="p-3 text-left">Subscription</th>
                <th className="p-3 text-left">Actions</th>
              </tr>
            </thead>
            <tbody>
              {schools.map((s) => {
                const expired = isExpired(s.subscriptionExpiresAt);
                return (
                  <tr key={s._id} className="border-t">
                    <td className="p-3">
                      <div className="font-medium">{s.name}</div>
                      <div className="text-xs text-slate-400 font-mono">
                        {s.slug}
                      </div>
                    </td>
                    {/* 👈 SAS: Show track badges */}
                    <td className="p-3">
                      <div className="flex flex-wrap gap-1">
                        {(s.tracks || ["nursery_primary"]).map((t) => (
                          <span
                            key={t}
                            className={`text-xs px-2 py-0.5 rounded-full font-medium ${
                              t === "secondary"
                                ? "bg-blue-100 text-blue-700"
                                : "bg-green-100 text-green-700"
                            }`}
                          >
                            {t === "secondary" ? "Secondary" : "Primary"}
                          </span>
                        ))}
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
                      {expired ? (
                        <span className="text-red-600 font-medium text-xs flex items-center gap-1 whitespace-nowrap">
                          <i className="fas fa-exclamation-circle"></i>
                          Expired
                        </span>
                      ) : (
                        <span className="text-green-600 text-xs whitespace-nowrap">
                          Until {s.subscriptionExpiresAt ? new Date(s.subscriptionExpiresAt).toLocaleDateString() : "N/A"}
                        </span>
                      )}
                    </td>
                    <td className="p-3">
                      <div className="flex gap-1 flex-wrap min-w-[180px]">
                        {s.status === "pending" && (
                          <>
                            <button
                              onClick={() => approve(s._id)}
                              className="text-xs bg-green-600 text-white px-2 py-1 rounded"
                            >
                              Approve
                            </button>
                            <button
                              onClick={() => reject(s._id)}
                              className="text-xs bg-red-600 text-white px-2 py-1 rounded"
                            >
                              Reject
                            </button>
                          </>
                        )}
                        {s.status === "approved" && (
                          <button
                            onClick={() => suspend(s._id)}
                            className="text-xs bg-amber-600 text-white px-2 py-1 rounded"
                          >
                            Suspend
                          </button>
                        )}
                        {s.status === "suspended" && (
                          <button
                            onClick={() => approve(s._id)}
                            className="text-xs bg-green-600 text-white px-2 py-1 rounded"
                          >
                            Reactivate
                          </button>
                        )}
                        
                        <button
                          onClick={() => renew(s._id)}
                          className="text-xs bg-blue-600 text-white px-2 py-1 rounded hover:bg-blue-700 whitespace-nowrap"
                        >
                          Renew 30d
                        </button>

                        {/* 👈 NEW: Delete button (only if not approved) */}
                        <button
                          onClick={() => deleteSchool(s._id, s.name, s.status)}
                          className="text-xs bg-red-800 text-white px-2 py-1 rounded hover:bg-red-900 whitespace-nowrap"
                        >
                          <i className="fas fa-trash mr-1"></i> Delete
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
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
      className={`px-2 py-0.5 rounded-full text-xs font-medium whitespace-nowrap ${
        styles[status] || styles.pending
      }`}
    >
      {status}
    </span>
  );
}
