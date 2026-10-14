import { useEffect, useState } from "react";
import { classApi } from "../../../services/classApi";
import { attendanceApi } from "../../../services/attendanceApi";

const thisMonth = () => new Date().toISOString().slice(0, 7); // YYYY-MM

export default function ClassMonthlyReport() {
  const [classes, setClasses] = useState([]);
  const [classId, setClassId] = useState("");
  const [month, setMonth] = useState(thisMonth());
  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    classApi.list().then(({ data }) => {
      setClasses(data.data.classes);
      if (!classId && data.data.classes[0]) setClassId(data.data.classes[0]._id);
    });
  }, []);

  useEffect(() => {
    if (!classId) return;
    setLoading(true);
    attendanceApi
      .getClassMonthly(classId, month)
      .then(({ data }) => setRows(data.data.rows))
      .finally(() => setLoading(false));
  }, [classId, month]);

  const exportCsv = () => {
    const header = ["Pupil", "Admission No", "Present", "Absent", "Late", "Excused", "Total", "%"];
    const lines = rows.map((r) => [
      r.student.fullName,
      r.student.admissionNumber,
      r.present,
      r.absent,
      r.late,
      r.excused,
      r.total,
      r.percentage,
    ]);
    const csv = [header, ...lines]
      .map((row) => row.map((v) => `"${v}"`).join(","))
      .join("\n");
    const blob = new Blob([csv], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `attendance-${month}.csv`;
    a.click();
  };

  return (
    <div className="p-6 max-w-5xl mx-auto">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-2xl font-bold text-slate-800">Monthly Attendance</h1>
          <p className="text-sm text-slate-500">Per-pupil summary for the month</p>
        </div>
        <button
          onClick={exportCsv}
          disabled={rows.length === 0}
          className="bg-slate-700 text-white px-4 py-2 rounded-lg text-sm disabled:opacity-50"
        >
          Export CSV
        </button>
      </div>

      <div className="bg-white rounded-xl shadow-sm p-4 mb-4 flex gap-3 items-end">
        <label className="flex-1">
          <span className="text-sm text-slate-600">Class</span>
          <select
            className="mt-1 w-full border rounded-lg p-2"
            value={classId}
            onChange={(e) => setClassId(e.target.value)}
          >
            <option value="">Select class…</option>
            {classes.map((c) => (
              <option key={c._id} value={c._id}>{c.displayName || c.name}</option>
            ))}
          </select>
        </label>
        <label>
          <span className="text-sm text-slate-600">Month</span>
          <input
            type="month"
            className="mt-1 border rounded-lg p-2"
            value={month}
            onChange={(e) => setMonth(e.target.value)}
          />
        </label>
      </div>

      <div className="bg-white rounded-xl shadow-sm overflow-hidden">
        {loading ? (
          <div className="p-6 text-center text-slate-400">Loading…</div>
        ) : rows.length === 0 ? (
          <div className="p-6 text-center text-slate-400">No attendance records for this month</div>
        ) : (
          <table className="w-full text-sm">
            <thead className="bg-slate-50 text-slate-600">
              <tr>
                <th className="p-3 text-left">Pupil</th>
                <th className="p-3 text-center">Present</th>
                <th className="p-3 text-center">Absent</th>
                <th className="p-3 text-center">Late</th>
                <th className="p-3 text-center">Excused</th>
                <th className="p-3 text-center">%</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((r) => (
                <tr key={r.student._id} className="border-t">
                  <td className="p-3">
                    <div className="font-medium">{r.student.fullName}</div>
                    <div className="text-xs text-slate-400 font-mono">
                      {r.student.admissionNumber}
                    </div>
                  </td>
                  <td className="p-3 text-center text-green-700">{r.present}</td>
                  <td className="p-3 text-center text-red-700">{r.absent}</td>
                  <td className="p-3 text-center text-amber-700">{r.late}</td>
                  <td className="p-3 text-center text-blue-700">{r.excused}</td>
                  <td className="p-3 text-center font-bold">{r.percentage}%</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}
