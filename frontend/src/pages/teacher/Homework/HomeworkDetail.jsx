import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { homeworkApi } from "../../../services/commsApi";

const STATUS_STYLES = {
  submitted: "bg-blue-100 text-blue-700",
  completed: "bg-green-100 text-green-700",
  outstanding: "bg-red-100 text-red-700",
  late: "bg-amber-100 text-amber-700",
};

export default function HomeworkDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [hw, setHw] = useState(null);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState("all");

  const load = () => {
    setLoading(true);
    homeworkApi.get(id).then(({ data }) => setHw(data.data.homework))
      .finally(() => setLoading(false));
  };
  useEffect(load, [id]);

  const mark = async (studentId, status) => {
    const remark = status === "outstanding"
      ? prompt("Remark for this pupil?") || ""
      : "";
    await homeworkApi.mark(id, studentId, { status, teacherRemark: remark });
    load();
  };

  if (loading) return <div className="p-6 text-slate-400">Loading…</div>;
  if (!hw) return null;

  const submissionMap = Object.fromEntries(
    hw.submissions.map((s) => [s.studentId._id.toString(), s])
  );

  const pupils = hw.assignedTo.map((p) => ({
    student: p,
    submission: submissionMap[p._id.toString()] || null,
  }));

  const filtered = pupils.filter((p) => {
    if (filter === "all") return true;
    if (filter === "submitted") return p.submission && ["submitted", "late"].includes(p.submission.status);
    if (filter === "outstanding") return !p.submission || p.submission.status === "outstanding";
    if (filter === "completed") return p.submission?.status === "completed";
    return true;
  });

  const isOverdue = new Date(hw.dueDate) < new Date();

  return (
    <div className="p-6 max-w-5xl mx-auto">
      <button onClick={() => navigate(-1)} className="text-sm text-slate-500 mb-4">← Back</button>

      {/* Header */}
      <div className="bg-white rounded-xl shadow-sm p-6 mb-5">
        <div className="flex justify-between items-start mb-4">
          <div>
            <h1 className="text-2xl font-bold text-slate-800">{hw.title}</h1>
            <p className="text-sm text-slate-500">
              {hw.classId?.name} · {hw.subjectId?.name} · {hw.session} · {hw.term}
            </p>
          </div>
          {isOverdue && (
            <span className="text-xs bg-red-100 text-red-700 px-3 py-1 rounded-full">Overdue</span>
          )}
        </div>
        <p className="text-slate-700 whitespace-pre-wrap mb-4">{hw.description}</p>
        <div className="text-sm text-slate-500">
          <i className="far fa-clock mr-1" /> Due: {new Date(hw.dueDate).toLocaleString()}
        </div>
      </div>

      {/* Stats + filter */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-3 mb-4">
        <StatBox label="Assigned" value={hw.assignedTo.length} color="slate" onClick={() => setFilter("all")} active={filter === "all"} />
        <StatBox label="Submitted" value={pupils.filter((p) => p.submission).length} color="blue" onClick={() => setFilter("submitted")} active={filter === "submitted"} />
        <StatBox label="Completed" value={hw.stats?.completed || 0} color="green" onClick={() => setFilter("completed")} active={filter === "completed"} />
        <StatBox label="Outstanding" value={pupils.filter((p) => !p.submission || p.submission.status === "outstanding").length} color="red" onClick={() => setFilter("outstanding")} active={filter === "outstanding"} />
        <StatBox label="Pending" value={pupils.filter((p) => !p.submission).length} color="amber" />
      </div>

      {/* Pupil list */}
      <div className="bg-white rounded-xl shadow-sm overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-slate-50">
            <tr>
              <th className="p-3 text-left">#</th>
              <th className="p-3 text-left">Pupil</th>
              <th className="p-3 text-left">Status</th>
              <th className="p-3 text-left">Submitted</th>
              <th className="p-3 text-left">Actions</th>
            </tr>
          </thead>
          <tbody>
            {filtered.map((p, idx) => (
              <tr key={p.student._id} className="border-t">
                <td className="p-3 text-slate-400 text-xs">{idx + 1}</td>
                <td className="p-3">
                  <div className="font-medium">{p.student.fullName}</div>
                  <div className="text-xs text-slate-400 font-mono">
                    {p.student.admissionNumber}
                  </div>
                </td>
                <td className="p-3">
                  {p.submission ? (
                    <span className={`text-xs px-2 py-0.5 rounded-full capitalize ${STATUS_STYLES[p.submission.status]}`}>
                      {p.submission.status}
                    </span>
                  ) : (
                    <span className="text-xs text-slate-400">Not submitted</span>
                  )}
                </td>
                <td className="p-3 text-xs text-slate-500">
                  {p.submission
                    ? new Date(p.submission.submittedAt).toLocaleDateString()
                    : "—"}
                </td>
                <td className="p-3">
                  <div className="flex gap-1 flex-wrap">
                    <button
                      onClick={() => mark(p.student._id, "completed")}
                      className="text-xs bg-green-600 text-white px-2 py-0.5 rounded"
                    >
                      ✓ Complete
                    </button>
                    <button
                      onClick={() => mark(p.student._id, "outstanding")}
                      className="text-xs bg-red-600 text-white px-2 py-0.5 rounded"
                    >
                      ✕ Outstanding
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function StatBox({ label, value, color, onClick, active }) {
  const colors = {
    slate: "bg-slate-50 text-slate-700",
    blue: "bg-blue-50 text-blue-700",
    green: "bg-green-50 text-green-700",
    red: "bg-red-50 text-red-700",
    amber: "bg-amber-50 text-amber-700",
  };
  return (
    <button
      onClick={onClick}
      className={`p-3 rounded-xl text-left transition ${colors[color]} ${
        active ? "ring-2 ring-offset-1 ring-blue-500" : ""
      } ${onClick ? "hover:opacity-80 cursor-pointer" : ""}`}
    >
      <div className="text-xl font-bold">{value}</div>
      <div className="text-xs mt-1">{label}</div>
    </button>
  );
}
