import { useEffect, useState } from "react";
import { attendanceApi } from "../../services/attendanceApi";

const STATUS_STYLES = {
  present: "bg-green-100 text-green-700",
  absent: "bg-red-100 text-red-700",
  late: "bg-amber-100 text-amber-700",
  excused: "bg-blue-100 text-blue-700",
};

export default function ParentAttendance() {
  const [children, setChildren] = useState([]);
  const [expanded, setExpanded] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    attendanceApi
      .children()
      .then(({ data }) => setChildren(data.data.children))
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <div className="p-6 text-slate-400">Loading…</div>;
  if (children.length === 0) {
    return (
      <div className="p-6">
        <h1 className="text-2xl font-bold text-slate-800 mb-4">Attendance</h1>
        <p className="text-slate-500">No children linked to your account.</p>
      </div>
    );
  }

  return (
    <div className="p-6 max-w-4xl mx-auto">
      <h1 className="text-2xl font-bold text-slate-800 mb-6">Attendance</h1>

      <div className="space-y-4">
        {children.map((c) => (
          <div key={c.student._id} className="bg-white rounded-xl shadow-sm">
            <button
              onClick={() => setExpanded(expanded === c.student._id ? null : c.student._id)}
              className="w-full flex justify-between items-center p-5 text-left"
            >
              <div>
                <div className="font-semibold text-slate-800">{c.student.fullName}</div>
                <div className="text-xs text-slate-500">
                  {c.student.className} · {c.student.admissionNumber}
                </div>
              </div>
              <div className="text-right">
                <div
                  className={`text-2xl font-bold ${
                    parseFloat(c.summary.percentage) >= 80
                      ? "text-green-600"
                      : parseFloat(c.summary.percentage) >= 60
                      ? "text-amber-600"
                      : "text-red-600"
                  }`}
                >
                  {c.summary.percentage}%
                </div>
                <div className="text-xs text-slate-400">
                  last {c.summary.total} days
                </div>
              </div>
            </button>

            {expanded === c.student._id && (
              <div className="border-t px-5 py-3">
                <div className="grid grid-cols-2 md:grid-cols-3 gap-2 text-sm">
                  {c.recent.map((r) => (
                    <div
                      key={r.date}
                      className="flex justify-between items-center border rounded-lg p-2"
                    >
                      <span className="text-slate-600">{r.date}</span>
                      <span
                        className={`text-xs px-2 py-0.5 rounded-full capitalize ${
                          STATUS_STYLES[r.status] || "bg-slate-100"
                        }`}
                      >
                        {r.status}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
