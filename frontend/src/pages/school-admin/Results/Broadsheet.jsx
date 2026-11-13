import { useEffect, useState } from "react";
import { classApi } from "../../../services/classApi";
import { resultApi } from "../../../services/resultApi";
import { Link } from "react-router-dom";
import { useAuth } from "../../../context/AuthContext"; // 👈 SAS

export default function Broadsheet() {
  const { activeTrack } = useAuth(); // 👈 SAS
  const isSecondary = activeTrack === "secondary";

  const [classes, setClasses] = useState([]);
  const [filters, setFilters] = useState({
    classId: "", session: "2025/2026", term: "First Term",
  });
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(false);

  // 👈 SAS: Filter classes by active track
  useEffect(() => {
    classApi.list({ track: activeTrack }).then(({ data }) => {
      setClasses(data.data.classes);
      if (!filters.classId && data.data.classes[0]) {
        setFilters((f) => ({ ...f, classId: data.data.classes[0]._id }));
      }
    });
  }, [activeTrack]);

  const load = () => {
    if (!filters.classId) return;
    setLoading(true);
    resultApi.getBroadsheet(filters.classId, filters.session, filters.term)
      .then(({ data }) => setData(data.data))
      .finally(() => setLoading(false));
  };
  useEffect(load, [filters]);

  const compute = async () => {
    await resultApi.compute({
      classId: filters.classId,
      session: filters.session,
      term: filters.term,
    });
    load();
  };

  const publish = async () => {
    if (!confirm("Publish results? Parents will see them immediately.")) return;
    await resultApi.publishClass(filters.classId, filters.session, filters.term);
    alert("Published!");
    load();
  };

  const downloadPDF = async (studentId) => {
    try {
      console.log("🎯 Downloading PDF for:", studentId);
      const response = await resultApi.downloadPdf(studentId, filters.session, filters.term);
      
      console.log("✅ Status:", response.status);
      console.log("✅ Content-Type:", response.headers["content-type"]);
      
      const blob = new Blob([response.data], { type: "application/pdf" });
      console.log("📦 Blob size:", blob.size, "bytes");

      if (blob.size < 100) {
        alert("Generated PDF is empty. Check the backend logs for errors.");
        return;
      }

      const link = document.createElement("a");
      link.href = URL.createObjectURL(blob);
      link.download = `report-card-${studentId}.pdf`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      
      console.log("✅ PDF downloaded successfully");
    } catch (err) {
      console.error("❌ PDF Download Error:", err);
      console.error("Response data:", err.response?.data);
      
      if (err.response?.data instanceof Blob) {
        const text = await err.response.data.text();
        console.error("Server response:", text);
        alert(`Server error: ${text.substring(0, 300)}`);
      } else {
        alert(`Download failed: ${err.message}`);
      }
    }
  };

  // 👈 SAS: Grade badge color for both Primary (A-F) and Secondary (A1-F9)
  const getGradeColor = (grade) => {
    if (!grade) return "bg-slate-100 text-slate-600";
    const g = grade.toUpperCase();
    
    // WAEC Grade color (A1, B2, B3, C4, C5, C6, D7, E8, F9)
    if (g.startsWith("A") || g.startsWith("B")) return "bg-green-100 text-green-700";
    if (g.startsWith("C")) return "bg-blue-100 text-blue-700";
    if (g.startsWith("D") || g.startsWith("E")) return "bg-amber-100 text-amber-700";
    if (g.startsWith("F")) return "bg-red-100 text-red-700";
    return "bg-slate-100 text-slate-600";
  };

  return (
    <div className="p-6 max-w-7xl mx-auto">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-2xl font-bold text-slate-800">
            {isSecondary ? "Secondary Broadsheet" : "Primary Broadsheet"}
          </h1>
          <p className="text-sm text-slate-500">Class-wide subject scores</p>
        </div>
        <div className="flex gap-2 items-center">
          <button onClick={compute} className="bg-amber-600 text-white px-4 py-2 rounded-lg text-sm">
            Compute
          </button>
          <button onClick={publish} className="bg-green-600 text-white px-4 py-2 rounded-lg text-sm">
            Publish
          </button>
          {data?.rows?.[0]?.isPublished && (
            <span className="bg-green-100 text-green-700 px-3 py-2 rounded-lg text-sm font-medium">
              ✓ Published
            </span>
          )}
        </div>
      </div>

      <div className="bg-white rounded-xl shadow-sm p-4 mb-4 flex flex-wrap gap-3 items-end">
        <select className="border rounded-lg p-2" value={filters.classId}
          onChange={(e) => setFilters({ ...filters, classId: e.target.value })}>
          <option value="">Select class…</option>
          {/* 👈 SAS: Only show classes for active track */}
          {classes.map((c) => <option key={c._id} value={c._id}>{c.name}</option>)}
        </select>
        <input className="border rounded-lg p-2 w-32" value={filters.session}
          onChange={(e) => setFilters({ ...filters, session: e.target.value })} />
        <select className="border rounded-lg p-2" value={filters.term}
          onChange={(e) => setFilters({ ...filters, term: e.target.value })}>
          <option>First Term</option>
          <option>Second Term</option>
          <option>Third Term</option>
        </select>
      </div>

      {loading ? (
        <div className="text-center text-slate-400 py-10">Loading…</div>
      ) : !data ? (
        <div className="text-center text-slate-400 py-10">Select a class</div>
      ) : data.rows.length === 0 ? (
        <div className="text-center text-slate-400 py-10">No results yet. Enter scores, then click Compute.</div>
      ) : (
        <div className="bg-white rounded-xl shadow-sm overflow-x-auto">
          <table className="text-xs">
            <thead className="bg-slate-50 text-slate-600">
              <tr>
                <th className="p-2 text-left">#</th>
                <th className="p-2 text-left">Pupil</th>
                {data.subjects.map((sub) => (
                  <th key={sub._id} className="p-2 text-center">{sub.code || sub.name}</th>
                ))}
                <th className="p-2 text-center">Total</th>
                <th className="p-2 text-center">Avg</th>
                <th className="p-2 text-center">Grade</th>
                <th className="p-2 text-center">Pos</th>
                <th className="p-2 text-center">PDF</th>
              </tr>
            </thead>
            <tbody>
              {data.rows.map((r, i) => (
                <tr key={r.student._id} className="border-t">
                  <td className="p-2 text-slate-400">{i + 1}</td>
                  <td className="p-2">
                    <div className="font-medium">{r.student.fullName}</div>
                    <div className="text-slate-400 font-mono">{r.student.admissionNumber}</div>
                  </td>
                  {data.subjects.map((sub) => {
                    const score = r.scores[sub._id];
                    return (
                      <td key={sub._id} className="p-2 text-center">
                        {score == null ? "—" : `${Number(score).toFixed(0)}`}
                      </td>
                    );
                  })}
                  <td className="p-2 text-center font-medium">{r.overallTotal}</td>
                  <td className="p-2 text-center font-bold">{r.overallAverage?.toFixed(1)}</td>
                  <td className="p-2 text-center">
                    {/* 👈 SAS: Use dynamic grade color */}
                    <span className={`px-2 py-0.5 rounded-full font-medium ${getGradeColor(r.overallGrade)}`}>
                      {r.overallGrade}
                    </span>
                  </td>
                  <td className="p-2 text-center">{r.positionInClass}</td>
                  <td className="p-2 text-center">
                    <Link
                      to={`/dashboard/report-card/${r.student._id}?session=${encodeURIComponent(filters.session)}&term=${encodeURIComponent(filters.term)}`}
                      className="bg-blue-600 text-white px-2 py-1 rounded text-xs hover:bg-blue-700 inline-block"
                    >
                      ⬇ Print
                    </Link>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
