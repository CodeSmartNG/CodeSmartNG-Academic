import { useEffect, useState } from "react";
import { useParams, useSearchParams, useNavigate } from "react-router-dom";
import { resultApi } from "../services/resultApi";

export default function ReportCard() {
  const { studentId } = useParams();
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const session = searchParams.get("session");
  const term = searchParams.get("term");

  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!studentId || !session || !term) return;
    resultApi.getPupil(studentId, session, term)
      .then(({ data }) => setData(data.data))
      .catch((err) => console.error("Failed to load report card:", err))
      .finally(() => setLoading(false));
  }, [studentId, session, term]);

  const handlePrint = () => {
    window.print();
  };

  if (loading) return <div className="p-6 text-slate-400">Loading report card…</div>;
  if (!data) return <div className="p-6 text-red-600">Report card data not found.</div>;

  const { student, class: cls, school, results, summary } = data;

  return (
    <div className="p-6 max-w-4xl mx-auto">
      {/* ── Print Controls (hidden when printing) ──────────────── */}
      <div className="mb-6 flex justify-between items-center no-print">
        <button
          onClick={() => navigate(-1)}
          className="text-sm text-slate-500 hover:text-slate-800"
        >
          ← Back
        </button>
        <button
          onClick={handlePrint}
          className="bg-blue-700 hover:bg-blue-800 text-white px-6 py-2 rounded-lg font-medium shadow-sm"
        >
          <i className="fas fa-print mr-2"></i> Print / Save as PDF
        </button>
      </div>

      {/* ── Report Card (This is what gets printed) ────────────── */}
      <div className="bg-white p-8 rounded-xl shadow-sm border border-slate-200 print:border-0 print:shadow-none print:p-0">
        
        {/* Header with School Logo */}
        <div className="relative border-b-4 border-blue-900 pb-4 mb-6 text-center">
          {/* 👇 School Logo */}
          {school?.logoUrl && (
            <img 
              src={school.logoUrl} 
              alt="School Logo" 
              className="absolute left-0 top-0 h-20 w-20 object-contain"
            />
          )}
          <h1 className="text-3xl font-bold text-blue-900 uppercase tracking-wide px-24">
            {school?.name || "School Name"}
          </h1>
          <p className="text-sm text-slate-600">{school?.address || "School Address"}</p>
          <h2 className="text-lg font-semibold text-slate-800 mt-2">
            {term} Report Card — {session}
          </h2>
        </div>

        {/* Pupil Info with Photo */}
        <div className="flex gap-6 mb-8">
          {/* 👇 Pupil Photo */}
          <div className="w-24 h-24 flex-shrink-0 bg-slate-100 rounded-lg overflow-hidden border-2 border-slate-300">
            {student.photoUrl ? (
              <img src={student.photoUrl} alt={student.fullName} className="w-full h-full object-cover" />
            ) : (
              <div className="w-full h-full flex items-center justify-center text-slate-400 font-bold text-3xl">
                {student.fullName.charAt(0)}
              </div>
            )}
          </div>
          
          {/* Details */}
          <div className="grid grid-cols-2 gap-x-8 gap-y-2 flex-1 text-sm">
            <div>
              <p><span className="font-semibold text-slate-600">Name:</span> <span className="font-medium text-slate-900">{student.fullName}</span></p>
              <p><span className="font-semibold text-slate-600">Admission No:</span> {student.admissionNumber}</p>
              <p><span className="font-semibold text-slate-600">Class:</span> {cls?.name || student.className}</p>
            </div>
            <div>
              <p><span className="font-semibold text-slate-600">Gender:</span> <span className="capitalize">{student.gender}</span></p>
              <p><span className="font-semibold text-slate-600">Date Generated:</span> {new Date().toLocaleDateString()}</p>
            </div>
          </div>
        </div>

        {/* Results Table */}
        <table className="w-full text-sm mb-8 border-collapse">
          <thead>
            <tr className="bg-slate-100 print:bg-gray-100">
              <th className="border border-slate-300 p-2 text-left">Subject</th>
              <th className="border border-slate-300 p-2 text-center">Score</th>
              <th className="border border-slate-300 p-2 text-center">Grade</th>
              <th className="border border-slate-300 p-2 text-left">Remark</th>
            </tr>
          </thead>
          <tbody>
            {results?.map((r) => (
              <tr key={r._id}>
                <td className="border border-slate-300 p-2 font-medium">{r.subjectId?.name}</td>
                <td className="border border-slate-300 p-2 text-center">{r.totalScore}/{r.maxPossible}</td>
                <td className="border border-slate-300 p-2 text-center font-bold">{r.grade}</td>
                <td className="border border-slate-300 p-2 text-slate-600">{r.remark}</td>
              </tr>
            ))}
          </tbody>
        </table>

        {/* Summary Box */}
        <div className="border-2 border-blue-900 p-4 rounded-lg mb-8 flex justify-between bg-blue-50 print:bg-white">
          <div className="text-center">
            <div className="text-xs text-slate-500 uppercase font-semibold">Total Score</div>
            <div className="text-xl font-bold text-slate-800">{summary?.overallTotal || 0}</div>
          </div>
          <div className="text-center">
            <div className="text-xs text-slate-500 uppercase font-semibold">Average</div>
            <div className="text-xl font-bold text-slate-800">{summary?.overallAverage?.toFixed(1) || 0}%</div>
          </div>
          <div className="text-center">
            <div className="text-xs text-slate-500 uppercase font-semibold">Overall Grade</div>
            <div className="text-xl font-bold text-slate-800">{summary?.overallGrade || "—"}</div>
          </div>
          <div className="text-center">
            <div className="text-xs text-slate-500 uppercase font-semibold">Position</div>
            <div className="text-xl font-bold text-slate-800">
              {summary?.positionInClass ? `${summary.positionInClass} of ${summary.totalPupilsInClass}` : "—"}
            </div>
          </div>
        </div>

        {/* Comments */}
        <div className="space-y-6 text-sm">
          <div>
            <p className="font-semibold text-slate-700 mb-1">Form Teacher's Comment:</p>
            <p className="text-slate-800 border-b border-dotted border-slate-400 pb-2">
              {summary?.formTeacherComment || "Keep up the good work!"}
            </p>
          </div>
          <div>
            <p className="font-semibold text-slate-700 mb-1">Head Teacher's Comment:</p>
            <p className="text-slate-800 border-b border-dotted border-slate-400 pb-2">
              {summary?.headTeacherComment || "Keep up the good work!"}
            </p>
          </div>
        </div>

        {/* Signatures */}
        {/* ── Signatures ─────────────────────────────────────── */}
<div className="flex justify-between mt-16 text-sm text-slate-600">
  
  {/* Form Teacher Signature */}
  <div className="text-center w-48 relative">
    {cls?.formTeacherId?.fullName ? (
      <div 
        className="text-3xl text-blue-900 -mb-2" 
        style={{ fontFamily: "'Dancing Script', cursive" }}
      >
        {cls.formTeacherId.fullName}
      </div>
    ) : (
      <div className="h-8"></div> // Spacer if no teacher assigned
    )}
    <div className="border-t border-slate-400 pt-1 font-semibold">
      Form Teacher's Signature
    </div>
  </div>

  {/* Head Teacher Signature */}
  <div className="text-center w-48 relative">
    {/* We use the school's proprietorName as the Head Teacher */}
    {school?.proprietorName ? (
      <div 
        className="text-3xl text-blue-900 -mb-2" 
        style={{ fontFamily: "'Dancing Script', cursive" }}
      >
        {school.proprietorName}
      </div>
    ) : (
      <div className="h-8"></div>
    )}
    <div className="border-t border-slate-400 pt-1 font-semibold">
      Head Teacher's Signature
    </div>
  </div>
  
</div>

{/* Digitally Signed Stamp */}
<div className="mt-8 flex justify-center print:mt-4">
  <div className="border-2 border-green-600 text-green-600 px-4 py-1 rounded-full text-xs font-bold uppercase tracking-widest rotate-[-5deg] opacity-80 flex items-center gap-2">
    <i className="fas fa-check-circle"></i> Digitally Verified
  </div>
</div>
  );
}
