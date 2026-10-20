import { useEffect, useState } from "react";
import { useSearchParams } from "react-router-dom";
import { classApi } from "../../../services/classApi";
import { attendanceApi } from "../../../services/attendanceApi";
import { useAuth } from "../../../context/AuthContext";

const STATUSES = ["present", "absent", "late", "excused"];

const STATUS_COLORS = {
  present: { bg: "bg-green-600", text: "text-white", outline: "border-green-600 text-green-700" },
  absent: { bg: "bg-red-600", text: "text-white", outline: "border-red-600 text-red-700" },
  late: { bg: "bg-amber-500", text: "text-white", outline: "border-amber-500 text-amber-700" },
  excused: { bg: "bg-blue-600", text: "text-white", outline: "border-blue-600 text-blue-700" },
};

// 👇 Helper function to get today's date in Lagos
const today = () => {
  const now = new Date(Date.now() + 60 * 60 * 1000); // Lagos is UTC+1
  return now.toISOString().slice(0, 10);
};

export default function MarkAttendance() {
  const { user } = useAuth();
  const [searchParams, setSearchParams] = useSearchParams();
  const [classes, setClasses] = useState([]);
  
  const [classId, setClassId] = useState(searchParams.get("classId") || "");
  const [date, setDate] = useState(searchParams.get("date") || today());
  const [records, setRecords] = useState([]);
  const [summary, setSummary] = useState(null);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [toast, setToast] = useState(null);

  // Load classes (only assigned ones for teachers)
  useEffect(() => {
    const fetchClasses = user?.role === "teacher" 
      ? classApi.myClasses() 
      : classApi.list();

    fetchClasses.then(({ data }) => {
      const fetchedClasses = data.data.classes || [];
      setClasses(fetchedClasses);
      
      // Auto-select the first class if none is in the URL
      if (!classId && fetchedClasses.length > 0) {
        setClassId(fetchedClasses[0]._id);
      }
    }).catch(console.error);
  }, [user]);

  // Load attendance when class or date changes
  useEffect(() => {
    if (!classId) return;
    setLoading(true);
    attendanceApi
      .getClass(classId, date)
      .then(({ data }) => {
        const rows = data.data.records.map((r) => ({
          studentId: r.student._id,
          student: r.student,
          status: r.attendance?.status || null,
          remark: r.attendance?.remark || "",
          attendanceId: r.attendance?._id || null,
        }));
        setRecords(rows);
        setSummary(data.data.summary);
      })
      .catch(console.error)
      .finally(() => setLoading(false));

    setSearchParams({ classId, date }, { replace: true });
  }, [classId, date, setSearchParams]);

  const setStatus = (studentId, status) => {
    setRecords((prev) =>
      prev.map((r) => (r.studentId === studentId ? { ...r, status } : r))
    );
  };

  const markAll = (status) => {
    setRecords((prev) => prev.map((r) => ({ ...r, status })));
  };

  const save = async () => {
    const missing = records.filter((r) => !r.status);
    if (missing.length > 0) {
      if (!confirm(`${missing.length} pupil(s) not marked. Save anyway as absent?`)) return;
      missing.forEach((m) => setStatus(m.studentId, "absent"));
      await new Promise((r) => setTimeout(r, 50));
    }

    setSaving(true);
    try {
      const payload = {
        classId,
        date,
        records: records
          .filter((r) => r.status)
          .map((r) => ({
            studentId: r.studentId,
            status: r.status,
            remark: r.remark || "",
          })),
      };
      const { data } = await attendanceApi.mark(payload);
      setToast({ type: "success", message: data.message });
      
      // Reload to get fresh IDs
      const reload = await attendanceApi.getClass(classId, date);
      setRecords(
        reload.data.data.records.map((r) => ({
          studentId: r.student._id,
          student: r.student,
          status: r.attendance?.status || null,
          remark: r.attendance?.remark || "",
          attendanceId: r.attendance?._id || null,
        }))
      );
      setSummary(reload.data.data.summary);
      setTimeout(() => setToast(null), 3000);
    } catch (err) {
      setToast({ type: "error", message: err.response?.data?.message || "Failed to save" });
    } finally {
      setSaving(false);
    }
  };

  // Live summary for UI
  const liveSummary = records.reduce(
    (acc, r) => {
      if (r.status) acc[r.status]++;
      else acc.unmarked++;
      return acc;
    },
    { present: 0, absent: 0, late: 0, excused: 0, unmarked: 0 }
  );

  return (
    <div className="p-6 max-w-5xl mx-auto">
      <h1 className="text-2xl font-bold text-slate-800 mb-6">Mark Attendance</h1>

      {/* Filters */}
      <div className="bg-white rounded-xl shadow-sm p-4 mb-4 flex flex-wrap gap-3 items-end">
        <label className="flex-1 min-w-[200px]">
          <span className="text-sm text-slate-600">Class</span>
          <select
            className="mt-1 w-full border rounded-lg p-2"
            value={classId}
            onChange={(e) => setClassId(e.target.value)}
            disabled={user?.role === "teacher"} // 👈 Lock the dropdown for teachers
          >
            <option value="">Select class…</option>
            {classes.map((c) => (
              <option key={c._id} value={c._id}>
                {c.displayName || c.name}
              </option>
            ))}
          </select>
        </label>
        <label>
          <span className="text-sm text-slate-600">Date</span>
          <input
            type="date"
            className="mt-1 border rounded-lg p-2"
            value={date}
            max={today()}
            onChange={(e) => setDate(e.target.value)}
          />
        </label>
        <div className="flex gap-2 ml-auto">
          <button onClick={() => markAll("present")} className="text-xs border border-green-600 text-green-700 px-3 py-1.5 rounded-lg hover:bg-green-50">
            All Present
          </button>
          <button onClick={() => markAll("absent")} className="text-xs border border-red-600 text-red-700 px-3 py-1.5 rounded-lg hover:bg-red-50">
            All Absent
          </button>
        </div>
      </div>

      {/* Summary */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-3 mb-4">
        <SummaryCard label="Present" value={liveSummary.present} color="green" />
        <SummaryCard label="Absent" value={liveSummary.absent} color="red" />
        <SummaryCard label="Late" value={liveSummary.late} color="amber" />
        <SummaryCard label="Excused" value={liveSummary.excused} color="blue" />
        <SummaryCard label="Unmarked" value={liveSummary.unmarked} color="slate" />
      </div>

      {/* Records */}
      {loading ? (
        <div className="text-center text-slate-400 py-10">Loading…</div>
      ) : !classId ? (
        <div className="text-center text-slate-400 py-10">Select a class to begin</div>
      ) : records.length === 0 ? (
        <div className="text-center text-slate-400 py-10">No active pupils in this class</div>
      ) : (
        <div className="bg-white rounded-xl shadow-sm overflow-hidden">
          <table className="w-full text-sm">
            <thead className="bg-slate-50">
              <tr>
                <th className="p-3 text-left">#</th>
                <th className="p-3 text-left">Pupil</th>
                <th className="p-3 text-left">Admission No</th>
                <th className="p-3 text-left">Status</th>
              </tr>
            </thead>
            <tbody>
              {records.map((r, idx) => (
                <tr key={r.studentId} className="border-t">
                  <td className="p-3 text-slate-400 text-xs">{idx + 1}</td>
                  <td className="p-3">
                    <div className="font-medium">{r.student.fullName}</div>
                    <div className="text-xs text-slate-400 capitalize">{r.student.gender}</div>
                  </td>
                  <td className="p-3 font-mono text-xs">{r.student.admissionNumber}</td>
                  <td className="p-3">
                    <div className="flex flex-wrap gap-1">
                      {STATUSES.map((s) => {
                        const active = r.status === s;
                        const colors = STATUS_COLORS[s];
                        return (
                          <button
                            key={s}
                            onClick={() => setStatus(r.studentId, s)}
                            className={`px-3 py-1 text-xs rounded-full border transition ${
                              active
                                ? `${colors.bg} ${colors.text} border-transparent`
                                : `bg-white ${colors.outline} hover:bg-slate-50`
                            }`}
                          >
                            {s.charAt(0).toUpperCase() + s.slice(1)}
                          </button>
                        );
                      })}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Save bar */}
      {records.length > 0 && (
        <div className="sticky bottom-0 mt-6 bg-white border-t border-slate-200 -mx-6 px-6 py-4 flex justify-between items-center shadow-lg">
          <div className="text-sm text-slate-500">
            {liveSummary.unmarked > 0
              ? `${liveSummary.unmarked} pupil(s) not marked`
              : "All pupils marked"}
          </div>
          <button
            onClick={save}
            disabled={saving}
            className="bg-blue-700 text-white px-6 py-2 rounded-lg disabled:opacity-50"
          >
            {saving ? "Saving…" : "Save Attendance"}
          </button>
        </div>
      )}

      {/* Toast */}
      {toast && (
        <div
          className={`fixed top-4 right-4 px-4 py-3 rounded-lg shadow-lg z-50 ${
            toast.type === "success" ? "bg-green-600 text-white" : "bg-red-600 text-white"
          }`}
        >
          {toast.message}
        </div>
      )}
    </div>
  );
}

function SummaryCard({ label, value, color }) {
  const colors = {
    green: "bg-green-50 text-green-700",
    red: "bg-red-50 text-red-700",
    amber: "bg-amber-50 text-amber-700",
    blue: "bg-blue-50 text-blue-700",
    slate: "bg-slate-100 text-slate-600",
  };
  return (
    <div className={`p-3 rounded-xl ${colors[color]}`}>
      <div className="text-xl font-bold">{value}</div>
      <div className="text-xs mt-1">{label}</div>
    </div>
  );
}
