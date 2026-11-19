import { useEffect, useState } from "react";
import { examApi } from "../../services/examApi";

export default function ParentExamRegistration() {
  const [registrations, setRegistrations] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    examApi.list({}).then(({ data }) => {
      setRegistrations(data.data.registrations || []);
    }).finally(() => setLoading(false));
  }, []);

  return (
    <div className="p-6 max-w-4xl mx-auto">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-slate-800">Exam Registrations</h1>
        <p className="text-sm text-slate-500">View your child's WAEC / NECO / NABTEB registration status.</p>
      </div>

      {loading ? (
        <div className="text-slate-400">Loading...</div>
      ) : registrations.length === 0 ? (
        <div className="bg-white p-8 rounded-xl shadow-sm text-center text-slate-500">
          No exam registrations found for your children.
        </div>
      ) : (
        <div className="grid gap-4">
          {registrations.map((r) => (
            <div key={r._id} className="bg-white rounded-xl shadow-sm p-5 border-l-4 border-blue-500">
              <div className="flex justify-between items-start">
                <div>
                  <h3 className="font-bold text-lg text-slate-800">{r.studentId?.fullName}</h3>
                  <p className="text-sm text-slate-500">{r.studentId?.className} · {r.studentId?.admissionNumber}</p>
                </div>
                <span className={`px-3 py-1 rounded-full text-xs font-bold uppercase ${
                  r.status === "registered" ? "bg-green-100 text-green-700" : 
                  r.status === "completed" ? "bg-blue-100 text-blue-700" : 
                  "bg-amber-100 text-amber-700"
                }`}>
                  {r.status}
                </span>
              </div>

              <div className="mt-4 grid md:grid-cols-2 gap-4">
                <div>
                  <p className="text-xs text-slate-400 font-semibold uppercase">Exam</p>
                  <p className="font-medium text-slate-800">{r.examType} ({r.examYear})</p>
                </div>
                <div>
                  <p className="text-xs text-slate-400 font-semibold uppercase">Registration Fee</p>
                  <p className="font-medium text-slate-800">₦{r.totalFee?.toLocaleString()}</p>
                </div>
              </div>

              <div className="mt-4">
                <p className="text-xs text-slate-400 font-semibold uppercase mb-1">Registered Subjects</p>
                <div className="flex flex-wrap gap-2">
                  {r.subjects.map((sub, i) => (
                    <span key={i} className="bg-slate-100 text-slate-600 text-xs px-2 py-1 rounded-md">
                      {sub}
                    </span>
                  ))}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
