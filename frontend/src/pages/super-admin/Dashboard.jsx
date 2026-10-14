import { useEffect, useState } from "react";
import api from "../../services/api";

export default function Dashboard() {
  const [schools, setSchools] = useState([]);

  const load = () => api.get("/schools").then(({ data }) => setSchools(data.schools));
  useEffect(() => { load(); }, []);

  const approve = async (id) => {
    await api.patch(`/schools/${id}/approve`);
    load();
  };

  return (
    <div className="p-8">
      <h1 className="text-3xl font-bold mb-6">Super Admin Dashboard</h1>
      <div className="grid gap-4">
        {schools.map((s) => (
          <div key={s._id} className="bg-white p-4 rounded-xl shadow flex justify-between items-center">
            <div>
              <h3 className="font-semibold">{s.name}</h3>
              <p className="text-sm text-slate-500">{s.email} · {s.status}</p>
            </div>
            {s.status === "pending" && (
              <button
                onClick={() => approve(s._id)}
                className="bg-green-600 text-white px-4 py-2 rounded-lg"
              >
                Approve
              </button>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
