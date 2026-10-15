import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { parentApi } from "../../services/parentApi";

const naira = (kobo) =>
  `₦${((kobo || 0) / 100).toLocaleString("en-NG", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })}`;

export default function ChildDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [data, setData] = useState(null);
  const [tab, setTab] = useState("overview");
  const [filters, setFilters] = useState({
    session: "2025/2026",
    term: "First Term",
  });
  const [loading, setLoading] = useState(true);

  const load = () => {
    setLoading(true);
    parentApi
      .child(id, filters.session, filters.term)
      .then(({ data }) => setData(data.data))
      .finally(() => setLoading(false));
  };
  useEffect(load, [id, filters]);

  const downloadReceipt = async (paymentId, receiptNumber) => {
    const token = localStorage.getItem("csn_token");
    const res = await fetch(`/api/fees/payments/${paymentId}/receipt.pdf`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    const blob = await res.blob();
    const a = document.createElement("a");
    a.href = URL.createObjectURL(blob);
    a.download = `${receiptNumber.replace(/\//g, "-")}.pdf`;
    a.click();
  };

  if (loading || !data) return <div className="p-6 text-slate-400">Loading…</div>;

  const { student, attendance, results, fees } = data;

  return (
    <div className="p-6 max-w-5xl mx-auto">
      <button onClick={() => navigate(-1)} className="text-sm text-slate-500 mb-4">← Back</button>

      {/* Header */}
      <div className="bg-white rounded-xl shadow-sm p-6 mb-5">
        <div className="flex items-center gap-4">
          <div className="w-20 h-20 rounded-full bg-blue-100 text-blue-700 flex items-center justify-center text-2xl font-bold">
            {student.photoUrl ? (
              <img src={student.photoUrl} alt="" className="w-full h-full rounded-full object-cover" />
            ) : (
              student.fullName.charAt(0)
            )}
          </div>
          <div className="flex-1">
            <h1 className="text-2xl font-bold text-slate-800">{student.fullName}</h1>
            <p className="text-slate-500">
              {student.admissionNumber} · {student.className}
            </p>
            {student.classId?.formTeacherId && (
              <p className="text-xs text-slate-400 mt-1">
                Form teacher: {student.classId.formTeacherId.fullName}
              </p>
            )}
          </div>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-white p-4 rounded-xl shadow-sm mb-5 flex gap-3">
        <input className="border rounded-lg p-2" value={filters.session}
          onChange={(e) => setFilters({ ...filters, session: e.target.value })} />
        <select className="border rounded-lg p-2" value={filters.term}
          onChange={(e) => setFilters({ ...filters, term: e.target.value })}>
          <option>First Term</option>
          <option>Second Term</option>
          <option>Third Term</option>
        </select>
      </div>

      {/* Tabs */}
      <div className="flex gap-2 mb-5 border-b">
        {[
          { id: "overview", label: "Overview" },
          { id: "attendance", label: "Attendance" },
          { id: "results", label: "Results" },
          { id: "fees", label: "Fees" },
        ].map((t) => (
          <button
            key={t.id}
            onClick={() => setTab(t.id)}
            className={`px-4 py-2 text-sm font-medium ${
              tab === t.id
                ? "border-b-2 border-blue-700 text-blue-700"
                : "text-slate-500 hover:text-slate-700"
            }`}
          >
            {t.label}
          </button>
        ))}
      </div>

      {/* Overview tab */}
      {tab === "overview" && (
        <div className="grid md:grid-cols-2 gap-4">
          <Card title="Attendance (last 30 days)">
            <Row label="Present" value={attendance.present} />
            <Row label="Late" value={attendance.late} />
            <Row label="Absent" value={attendance.absent} />
            <Row label="Excused" value={attendance.excused} />
            <Row label="Percentage" value={`${attendance.percentage}%`} bold />
          </Card>

          <Card title={`Results — ${filters.term}`}>
            {results?.isPublished ? (
              <>
                <Row label="Average" value={`${results.overallAverage?.toFixed(1)}%`} />
                <Row label="Overall Grade" value={results.overallGrade} />
                <Row
                  label="Position"
                  value={
                    results.positionInClass
                      ? `${results.positionInClass} of ${results.totalPupilsInClass}`
                      : "—"
                  }
                />
                <Row label="Total Score" value={results.overallTotal} />
              </>
            ) : (
              <p className="text-sm text-amber-600">Not yet published</p>
            )}
          </Card>

          <Card title="Fees">
            <Row label="Total Billed" value={naira(fees.totalBilled)} />
            <Row label="Total Paid" value={naira(fees.totalPaid)} />
            <Row label="Outstanding" value={naira(fees.totalBalance)} bold />
          </Card>

          <Card title="Comments">
            {results?.isPublished ? (
              <>
                <p className="text-xs text-slate-500 uppercase mb-1">Form Teacher</p>
                <p className="text-sm mb-3">{results.formTeacherComment || "—"}</p>
                <p className="text-xs text-slate-500 uppercase mb-1">Head Teacher</p>
                <p className="text-sm">{results.headTeacherComment || "—"}</p>
              </>
            ) : (
              <p className="text-sm text-slate-400">Comments appear after publication</p>
            )}
          </Card>
        </div>
      )}

      {/* Attendance tab */}
      {tab === "attendance" && (
        <div className="bg-white rounded-xl shadow-sm p-5">
          <h3 className="font-semibold text-slate-700 mb-3">Attendance History</h3>
          {attendance.records.length === 0 ? (
            <p className="text-slate-400 text-sm">No attendance records</p>
          ) : (
            <table className="w-full text-sm">
              <thead className="bg-slate-50 text-xs">
                <tr>
                  <th className="p-2 text-left">Date</th>
                  <th className="p-2 text-left">Status</th>
                </tr>
              </thead>
              <tbody>
                {attendance.records.map((r) => (
                  <tr key={r.date} className="border-t">
                    <td className="p-2">{r.date}</td>
                    <td className="p-2">
                      <span className={`text-xs px-2 py-0.5 rounded-full capitalize ${
                        r.status === "present" ? "bg-green-100 text-green-700" :
                        r.status === "absent" ? "bg-red-100 text-red-700" :
                        r.status === "late" ? "bg-amber-100 text-amber-700" :
                        "bg-blue-100 text-blue-700"
                      }`}>
                        {r.status}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      )}

      {/* Results tab */}
      {tab === "results" && (
        <div className="bg-white rounded-xl shadow-sm p-5">
          <h3 className="font-semibold text-slate-700 mb-3">
            {filters.term} · {filters.session}
          </h3>
          {!results?.isPublished ? (
            <p className="text-amber-600 text-sm">Results not yet published</p>
          ) : results.subjects?.length === 0 ? (
            <p className="text-slate-400 text-sm">No subject results</p>
          ) : (
            <table className="w-full text-sm">
              <thead className="bg-slate-50 text-xs">
                <tr>
                  <th className="p-2 text-left">Subject</th>
                  <th className="p-2 text-right">Score</th>
                  <th className="p-2 text-center">Grade</th>
                  <th className="p-2 text-left">Remark</th>
                </tr>
              </thead>
              <tbody>
                {results.subjects.map((s) => (
                  <tr key={s._id} className="border-t">
                    <td className="p-2">{s.subjectId?.name}</td>
                    <td className="p-2 text-right font-mono">
                      {s.percentage?.toFixed(1)}%
                    </td>
                    <td className="p-2 text-center font-bold">{s.grade}</td>
                    <td className="p-2 text-xs text-slate-600">{s.remark}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      )}

      {/* Fees tab */}
      {tab === "fees" && (
        <div className="space-y-4">
          {fees.bills.length === 0 ? (
            <div className="bg-white rounded-xl shadow-sm p-5 text-slate-400">
              No bills yet
            </div>
          ) : fees.bills.map((b) => (
            <div key={b._id} className="bg-white rounded-xl shadow-sm p-5">
              <div className="flex justify-between items-center mb-3">
                <h4 className="font-semibold">{b.session} · {b.term}</h4>
                <span className={`text-xs px-2 py-0.5 rounded-full capitalize ${
                  b.status === "paid" ? "bg-green-100 text-green-700" :
                  b.status === "partial" ? "bg-amber-100 text-amber-700" :
                  "bg-red-100 text-red-700"
                }`}>{b.status}</span>
              </div>
              <div className="grid grid-cols-3 text-sm gap-2">
                <div>
                  <div className="text-xs text-slate-400">Total</div>
                  <div className="font-mono">{naira(b.totalKobo)}</div>
                </div>
                <div>
                  <div className="text-xs text-slate-400">Paid</div>
                  <div className="font-mono text-green-700">{naira(b.paidKobo)}</div>
                </div>
                <div>
                  <div className="text-xs text-slate-400">Balance</div>
                  <div className="font-mono text-red-700">{naira(b.balanceKobo)}</div>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

function Card({ title, children }) {
  return (
    <div className="bg-white rounded-xl shadow-sm p-5">
      <h4 className="font-semibold text-slate-700 mb-3 text-sm">{title}</h4>
      <div className="space-y-2">{children}</div>
    </div>
  );
}

function Row({ label, value, bold }) {
  return (
    <div className="flex justify-between text-sm">
      <span className="text-slate-500">{label}</span>
      <span className={bold ? "font-bold text-slate-800" : "text-slate-800"}>{value}</span>
    </div>
  );
}
