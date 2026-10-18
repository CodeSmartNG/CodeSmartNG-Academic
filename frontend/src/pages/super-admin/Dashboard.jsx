import { useEffect, useState } from "react";
import api from "../../services/api";

export default function Dashboard() {
  const [schools, setSchools] = useState([]);
  const [loading, setLoading] = useState(true);

  const load = () => {
    setLoading(true);
    api.get("/schools")
      .then(({ data }) => {
        // 👇 FIXED: Added the second .data and a safe fallback []
        setSchools(data?.data?.schools || []);
      })
      .catch((err) => console.error(err))
      .finally(() => setLoading(false));
  };

  useEffect(() => { load(); }, []);

  const approve = async (id) => {
    await api.patch(`/schools/${id}/approve`);
    load();
  };

  return (
    <div className="p-8 max-w-6xl mx-auto">
      <h1 className="text-3xl font-bold mb-6">Super Admin Dashboard</h1>
      
      {loading ? (
        <p className="text-slate-400">Loading…</p>
      ) : schools.length === 0 ? (
        <div className="bg-white p-8 rounded-xl shadow text-center text-slate-500">
          No schools registered yet.
        </div>
      ) : (
        <div className="grid gap-4">
          {schools.map((s) => (
            <div key={s._id} className="bg-white p-4 rounded-xl shadow flex justify-between items-center">
              <div>
                <h3 className="font-semibold">{s.name}</h3>
                <p className="text-sm text-slate-500">{s.email} · <span className="uppercase text-xs font-bold">{s.status}</span></p>
              </div>
              {s.status === "pending" && (
                <button
                  onClick={() => approve(s._id)}
                  className="bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700"
                >
                  Approve
                </button>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
