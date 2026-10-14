import { useEffect, useState } from "react";
import { attendanceApi } from "../../../services/attendanceApi";

export default function AttendanceStats() {
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    attendanceApi
      .stats()
      .then(({ data }) => setStats(data.data))
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <div className="text-slate-400">Loading…</div>;
  if (!stats) return null;

  return (
    <div className="bg-white rounded-xl shadow-sm p-5">
      <h3 className="font-semibold text-slate-700 mb-3">
        Today's Attendance ({stats.date})
      </h3>
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <StatBox label="Present" value={stats.present} color="green" />
        <StatBox label="Absent" value={stats.absent} color="red" />
        <StatBox label="Late" value={stats.late} color="amber" />
        <StatBox label="Unmarked" value={stats.unmarked} color="slate" />
      </div>
      <div className="mt-3 text-sm text-slate-500">
        Attendance rate:{" "}
        <span className="font-bold text-blue-700">{stats.attendanceRate}%</span>
        {" "}({stats.marked}/{stats.totalActivePupils} pupils marked)
      </div>
    </div>
  );
}

function StatBox({ label, value, color }) {
  const colors = {
    green: "bg-green-50 text-green-700",
    red: "bg-red-50 text-red-700",
    amber: "bg-amber-50 text-amber-700",
    slate: "bg-slate-100 text-slate-600",
  };
  return (
    <div className={`p-3 rounded-xl ${colors[color]}`}>
      <div className="text-2xl font-bold">{value}</div>
      <div className="text-xs mt-1">{label}</div>
    </div>
  );
}
