import { useEffect, useState } from "react";
import { useParams, useSearchParams, useNavigate } from "react-router-dom";
import { resultApi } from "../services/resultApi";

// 👈 SAS: Helper to check if class is secondary
const isSecondaryClass = (className) => {
  if (!className) return false;
  return ["JSS 1", "JSS 2", "JSS 3", "SSS 1", "SSS 2", "SSS 3"].includes(className);
};

const gradeColor = (grade) => {
  if (!grade) return "text-slate-500";
  const g = grade.toUpperCase();
  if (g.startsWith("A") || g.startsWith("B")) return "text-green-700";
  if (g.startsWith("C")) return "text-blue-700";
  if (g.startsWith("D") || g.startsWith("E")) return "text-amber-700";
  if (g.startsWith("F")) return "text-red-700";
  return "text-slate-700";
};

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
  
  // 👈 SAS: Determine if this pupil is in Secondary
  const isSecondary = isSecondaryClass(cls?.name) || cls?.track === "secondary";

  return (
    <div className="p-6 max-w-4xl mx-auto">
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

      <div className="bg-white p-8 rounded-xl shadow-sm border border-slate-200 print:border-0 print:shadow-none print:p-0">
        
        <div className="relative border-b-4 border-blue-900 pb-4 mb-6 text-center">
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
          {/* 👈 SAS: Different title based on track */}
          <h2 className="text-xs font-bold uppercase tracking-widest text-slate-500 mt-2">
            {isSecondary ? "Secondary School Report Card" : "Primary School Report Card"}
          </h2>
          <h2 className="text-lg font-semibold text-slate-800 mt-1">
            {term} Report Card — {session}
          </h2>
        </div>

        <div className="flex gap-6 mb-8">
          <div className="w-24 h-24 flex-shrink-0 bg-slate-100 rounded-lg overflow-hidden border-2 border-slate-300">
            {student.photoUrl ? (
              <img src={student.photoUrl} alt={student.fullName} className="w-full h-full object-cover" />
            ) : (
              <div className="w-full h-full flex items-center justify-center text-slate-400 font-bold text-3xl">
                {student.fullName.charAt(0)}
              </div>
            )}
          </div>
          
          <div className="grid grid-cols-2 gap-x-8 gap-y-2 flex-1 text-sm">
            <div>
              <p><span className="font-semibold text-slate-600">Name:</span> <span className="font-medium text-slate-900">{student.fullName}</span></p>
              <p><span className="font-semibold text-slate-600">Admission No:</span> {student.admissionNumber}</p>
              <p>
                <span className="font-semibold text-slate-600">Class:</span> {cls?.name || student.className}
                {/* 👈 SAS: Show stream for SSS pupils */}
                {isSecondary && student.stream && (
                  <span className="ml-2 text-xs bg-purple-100 text-purple-700 px-2 py-0.5 rounded-full capitalize">
                    {student.stream}
                  </span>
                )}
              </p>
            </div>
            <div>
              <p><span className="font-semibold text-slate-600">Gender:</span> <span className="capitalize">{student.gender}</span></p>
              <p><span className="font-semibold text-slate-600">Date Generated:</span> {new Date().toLocaleDateString()}</p>
            </div>
          </div>
        </div>

        {/* 👈 SAS: Different table structure per track */}
        <table className="w-full text-sm mb-8 border-collapse">
          <thead>
            <tr className="bg-slate-100 print:bg-gray-100">
              <th className="border border-slate-300 p-2 text-left">Subject</th>
              {isSecondary ? (
                <>
                  <th className="border border-slate-300 p-2 text-center">CA1<br/><span className="text-xs font-normal">(10)</span></th>
                  <th className="border border-slate-300 p-2 text-center">CA2<br/><span className="text-xs font-normal">(10)</span></th>
                  <th className="border border-slate-300 p-2 text-center">ASG<br/><span className="text-xs font-normal">(10)</span></th>
                  <th className="border border-slate-300 p-2 text-center">Exam<br/><span className="text-xs font-normal">(70)</span></th>
                  <th className="border border-slate-300 p-2 text-center">Total</th>
                  <th className="border border-slate-300 p-2 text-center">Grade</th>
                  <th className="border border-slate-300 p-2 text-center">GP</th>
                </>
              ) : (
                <>
                  <th className="border border-slate-300 p-2 text-center">CA</th>
                  <th className="border border-slate-300 p-2 text-center">Exam</th>
                  <th className="border border-slate-300 p-2 text-center">Total</th>
                  <th className="border border-slate-300 p-2 text-center">Grade</th>
                  <th className="border border-slate-300 p-2 text-left">Remark</th>
                </>
              )}
            </tr>
          </thead>
          <tbody>
            {results?.map((r) => {
              // Extract component scores
              const scores = {};
              r.scores?.forEach((s) => {
                scores[s.assessmentName] = s.score;
              });

              return (
                <tr key={r._id}>
                  <td className="border border-slate-300 p-2 font-medium">{r.subjectId?.name}</td>
                  {isSecondary ? (
                    <>
                      <td className="border border-slate-300 p-2 text-center">{scores["CA 1"] ?? "—"}</td>
                      <td className="border border-slate-300 p-2 text-center">{scores["CA 2"] ?? "—"}</td>
                      <td className="border border-slate-300 p-2 text-center">{scores["Assignment"] ?? "—"}</td>
                      <td className="border border-slate-300 p-2 text-center">{scores["Examination"] ?? "—"}</td>
                      <td className="border border-slate-300 p-2 text-center font-semibold">{r.totalScore}</td>
                      <td className={`border border-slate-300 p-2 text-center font-bold ${gradeColor(r.grade)}`}>{r.grade}</td>
                      <td className="border border-slate-300 p-2 text-center">{r.gradePoint ?? "—"}</td>
                    </>
                  ) : (
                    <>
                      <td className="border border-slate-300 p-2 text-center">{scores["First Test"] ?? scores["Class Assessment"] ?? "—"}</td>
                      <td className="border border-slate-300 p-2 text-center">{scores["Examination"] ?? "—"}</td>
                      <td className="border border-slate-300 p-2 text-center font-semibold">{r.totalScore}/{r.maxPossible}</td>
                      <td className={`border border-slate-300 p-2 text-center font-bold ${gradeColor(r.grade)}`}>{r.grade}</td>
                      <td className="border border-slate-300 p-2 text-slate-600">{r.remark}</td>
                    </>
                  )}
                </tr>
              );
            })}
          </tbody>
        </table>

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
            <div className={`text-xl font-bold ${gradeColor(summary?.overallGrade)}`}>{summary?.overallGrade || "—"}</div>
          </div>
          
          {/* 👈 SAS: Show grade point for secondary, position always */}
          {isSecondary && (
            <div className="text-center">
              <div className="text-xs text-slate-500 uppercase font-semibold">Grade Point</div>
              <div className="text-xl font-bold text-slate-800">{summary?.gradePoint ?? "—"}</div>
            </div>
          )}

          <div className="text-center">
            <div className="text-xs text-slate-500 uppercase font-semibold">Position</div>
            <div className="text-xl font-bold text-slate-800">
              {summary?.positionInClass ? `${summary.positionInClass} of ${summary.totalPupilsInClass}` : "—"}
            </div>
          </div>
        </div>

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

        <div className="flex justify-between mt-16 text-sm text-slate-600">
          <div className="text-center w-48 relative">
            {cls?.formTeacherId?.fullName ? (
              <div 
                className="text-3xl text-blue-900 -mb-2" 
                style={{ fontFamily: "'Dancing Script', cursive" }}
              >
                {cls.formTeacherId.fullName}
              </div>
            ) : (
              <div className="h-8"></div>
            )}
            <div className="border-t border-slate-400 pt-1 font-semibold">
              Form Teacher's Signature
            </div>
          </div>

          <div className="text-center w-48 relative">
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

        <div className="mt-8 flex justify-center print:mt-4">
          <div className="border-2 border-green-600 text-green-600 px-4 py-1 rounded-full text-xs font-bold uppercase tracking-widest rotate-[-5deg] opacity-80 flex items-center gap-2">
            <i className="fas fa-check-circle"></i> Digitally Verified
          </div>
        </div>
      </div>
    </div>
  );
}
