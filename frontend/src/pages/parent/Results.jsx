import { useEffect, useState } from "react";
import { resultApi } from "../../services/resultApi";
import api from "../../services/api";

export default function ParentResults() {
  const [children, setChildren] = useState([]);
  const [filters, setFilters] = useState({ session: "2025/2026", term: "First Term" });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    resultApi.children(filters.session, filters.term)
      .then(({ data }) => setChildren(data.data.children))
      .finally(() => setLoading(false));
  }, [filters]);

  const download = async (studentId) => {
    const token = localStorage.getItem("csn_token");
    const url = `/api/results/pupil/${studentId}/pdf?session=${encodeURIComponent(filters.session)}&term=${encodeURIComponent(filters.term)}`;
    const res = await fetch(url, { headers: { Authorization: `Bearer ${token}` } });
    const blob = await res.blob();
    const link = document.createElement("a");
    link.href = URL.createObjectURL(blob);
    link.download = `report-card.pdf`;
    link.click();
  };

  return (
    <div className="p-6 max-w-4xl mx-auto">
      <h1 className="text-2xl font-bold mb-4">Results</h1>

      <div className="bg-white p-4 rounded-xl shadow-sm mb-4 flex gap-3">
        <input className="border rounded-lg p-2" value={filters.session}
          onChange={(e) => setFilters({ ...filters, session: e.target.value })} />
        <select className="border rounded-lg p-2" value={filters.term}
          onChange={(e) => setFilters({ ...filters, term: e.target.value })}>
          <option>First Term</option><option>Second Term</option><option>Third Term</option>
        </select>
      </div>

      {loading ? <p className="text-slate-400">Loading…</p> : children.length === 0 ? (
        <p className="text-slate-400">No children linked.</p>
      ) : (
        <div className="space-y-4">
          {children.map((c) => (
            <div key={c.student._id} className="bg-white rounded-xl shadow-sm p-5">
              <div className="flex justify-between items-start">
                <div>
                  <h3 className="font-semibold text-lg">{c.student.fullName}</h3>
                  <p className="text-xs text-slate-500">{c.student.className} · {c.student.admissionNumber}</p>
                </div>
                <button
                  onClick={() => download(c.student._id)}
                  disabled={!c.summary?.isPublished}
                  className="bg-blue-700 text-white px-3 py-1.5 rounded-lg text-sm disabled:opacity-50"
                >
                  ⬇ PDF
                </button>
              </div>
              {c.summary ? (
                c.summary.isPublished ? (
                  <div className="grid grid-cols-4 gap-3 mt-4">
                    <Stat label="Average" value={`${c.summary.overallAverage?.toFixed(1)}%`} />
                    <Stat label="Grade" value={c.summary.overallGrade} />
                    <Stat label="Position" value={c.summary.positionInClass ? `${c.summary.positionInClass}/${c.summary.totalPupilsInClass}` : "—"} />
                    <Stat label="Total" value={c.summary.overallTotal} />
                  </div>
                ) : (
                  <p className="text-amber-600 text-sm mt-3">⏳ Not yet published by the school</p>
                )
              ) : (
                <p className="text-slate-400 text-sm mt-3">No results for {filters.term} {filters.session}</p>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

function Stat({ label, value }) {
  return (
    <div className="bg-slate-50 rounded-lg p-3">
      <div className="text-xl font-bold text-slate-800">{value}</div>
      <div className="text-xs text-slate-500 mt-1">{label}</div>
    </div>
  );
}
