import { useCallback, useEffect, useState } from "react";
import { studentApi } from "../../services/studentApi";
import { examApi } from "../../services/examApi";

export default function ExamRegistration() {
  const [students, setStudents] = useState([]);
  const [registrations, setRegistrations] = useState([]);

  const [showModal, setShowModal] = useState(false);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [msg, setMsg] = useState(null);

  const [form, setForm] = useState({
    studentId: "",
    examType: "WAEC",
    examYear: "2026",
    subjects: ["English Language", "Mathematics"],
    totalFee: 25000,
  });

  // Load students and examination registrations
  const load = useCallback(async () => {
    setLoading(true);
    setMsg(null);

    const results = await Promise.allSettled([
      studentApi.list({
        track: "secondary",
        limit: 200,
      }),

      examApi.list({
        examType: form.examType,
        examYear: form.examYear,
      }),
    ]);

    const errors = [];

    // 1. Load Secondary students
    if (results[0].status === "fulfilled") {
      const response = results[0].value;

      console.log("STUDENT API RESPONSE:", response.data);

      const allStudents =
        response.data?.data?.students ||
        response.data?.students ||
        [];

      if (Array.isArray(allStudents)) {
        const sss3Students = allStudents.filter((student) =>
          (student.className || "")
            .toUpperCase()
            .includes("SSS 3")
        );

        setStudents(sss3Students);

        console.log("SSS 3 STUDENTS:", sss3Students);
      } else {
        setStudents([]);

        errors.push("Unexpected student API response format.");
      }
    } else {
      const error = results[0].reason;

      console.error("STUDENT API ERROR:", error);
      console.error("STUDENT ERROR RESPONSE:", error?.response?.data);

      setStudents([]);

      errors.push(
        "Student API: " +
          (error?.response?.data?.message ||
            error?.message ||
            "Unknown error")
      );
    }

    // 2. Load examination registrations
    if (results[1].status === "fulfilled") {
      const response = results[1].value;

      console.log("EXAM API RESPONSE:", response.data);

      const examRegistrations =
        response.data?.data?.registrations ||
        response.data?.registrations ||
        [];

      if (Array.isArray(examRegistrations)) {
        setRegistrations(examRegistrations);
      } else {
        setRegistrations([]);

        errors.push("Unexpected examination API response format.");
      }
    } else {
      const error = results[1].reason;

      console.error("EXAM API ERROR:", error);
      console.error("EXAM ERROR RESPONSE:", error?.response?.data);

      setRegistrations([]);

      errors.push(
        "Exam API: " +
          (error?.response?.data?.message ||
            error?.message ||
            "Unknown error")
      );
    }

    if (errors.length > 0) {
      setMsg({
        type: "error",
        text: errors.join(" | "),
      });
    }

    setLoading(false);
  }, [form.examType, form.examYear]);

  useEffect(() => {
    load();
  }, [load]);

  // Register pupil
  const handleRegister = async () => {
    if (!form.studentId) {
      return alert("Select a pupil.");
    }

    const cleanSubjects = [
      ...new Set(
        form.subjects
          .map((subject) => subject.trim())
          .filter(Boolean)
      ),
    ];

    if (cleanSubjects.length === 0) {
      return alert("Enter at least one subject.");
    }

    if (form.totalFee < 0 || !Number.isFinite(form.totalFee)) {
      return alert("Enter a valid registration fee.");
    }

    setSaving(true);
    setMsg(null);

    try {
      await examApi.register({
        ...form,
        subjects: cleanSubjects,
      });

      setMsg({
        type: "success",
        text: "Pupil registered successfully!",
      });

      setShowModal(false);

      setForm((previous) => ({
        ...previous,
        studentId: "",
        subjects: [
          "English Language",
          "Mathematics",
        ],
      }));

      await load();

    } catch (error) {
      console.error("REGISTRATION ERROR:", error);
      console.error("REGISTRATION RESPONSE:", error?.response?.data);

      setMsg({
        type: "error",
        text:
          error?.response?.data?.message ||
          "Failed to register pupil.",
      });
    } finally {
      setSaving(false);
    }
  };

  // Export candidates to CSV
  const exportToCSV = () => {
    if (!registrations.length) {
      return alert("No registrations to export.");
    }

    const headers = [
      "Name",
      "Admission No",
      "Gender",
      "Exam Type",
      "Exam Year",
      "Subjects",
      "Status",
    ];

    const escapeCSV = (value) =>
      `"${String(value ?? "").replace(/"/g, '""')}"`;

    const rows = registrations.map((registration) => [
      registration.studentId?.fullName,
      registration.studentId?.admissionNumber,
      registration.studentId?.gender,
      registration.examType,
      registration.examYear,
      (registration.subjects || []).join(" | "),
      registration.status,
    ]);

    const csvContent = [headers, ...rows]
      .map((row) => row.map(escapeCSV).join(","))
      .join("\n");

    const blob = new Blob(
      ["\uFEFF" + csvContent],
      { type: "text/csv;charset=utf-8;" }
    );

    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");

    link.href = url;
    link.download = `${form.examType}_${form.examYear}_Candidates.csv`;

    document.body.appendChild(link);
    link.click();
    link.remove();

    setTimeout(() => URL.revokeObjectURL(url), 1000);
  };

  return (
    <div className="p-4 sm:p-6 max-w-6xl mx-auto">

      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between gap-4 items-start mb-6">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold text-slate-800">
            Exam Registration
          </h1>

          <p className="text-sm sm:text-base text-slate-500 mt-1">
            Register SSS 3 pupils for WAEC, NECO, or NABTEB
          </p>
        </div>

        <button
          onClick={() => setShowModal(true)}
          className="bg-blue-700 hover:bg-blue-800 text-white px-5 py-3 rounded-lg w-full sm:w-auto"
        >
          + Register Pupil
        </button>
      </div>

      {/* Messages */}
      {msg && (
        <div
          className={`p-4 rounded-lg mb-5 text-sm break-words ${
            msg.type === "success"
              ? "bg-green-50 text-green-700"
              : "bg-red-50 text-red-700"
          }`}
        >
          {msg.text}
        </div>
      )}

      {/* Filters */}
      <div className="bg-white p-4 rounded-xl shadow-sm mb-6 flex flex-wrap gap-3">

        <select
          className="border rounded-lg p-3 flex-1 min-w-[120px]"
          value={form.examType}
          onChange={(e) =>
            setForm((previous) => ({
              ...previous,
              examType: e.target.value,
            }))
          }
        >
          <option value="WAEC">WAEC</option>
          <option value="NECO">NECO</option>
          <option value="NABTEB">NABTEB</option>
        </select>

        <input
          type="number"
          className="border rounded-lg p-3 w-full sm:w-32"
          value={form.examYear}
          onChange={(e) =>
            setForm((previous) => ({
              ...previous,
              examYear: e.target.value,
            }))
          }
        />

        <button
          onClick={exportToCSV}
          disabled={registrations.length === 0}
          className="bg-green-600 hover:bg-green-700 text-white px-4 py-3 rounded-lg w-full sm:w-auto disabled:opacity-50"
        >
          <i className="fas fa-file-excel mr-2"></i>
          Export Candidates
        </button>

        <button
          onClick={load}
          disabled={loading}
          className="border border-blue-600 text-blue-700 px-4 py-3 rounded-lg w-full sm:w-auto disabled:opacity-50"
        >
          {loading ? "Loading..." : "Refresh"}
        </button>
      </div>

      {/* Statistics */}
      <div className="grid grid-cols-2 gap-4 mb-6">
        <div className="bg-white rounded-xl p-4 shadow-sm">
          <p className="text-sm text-slate-500">
            SSS 3 Students
          </p>
          <h2 className="text-2xl font-bold text-blue-700">
            {students.length}
          </h2>
        </div>

        <div className="bg-white rounded-xl p-4 shadow-sm">
          <p className="text-sm text-slate-500">
            Registered Candidates
          </p>
          <h2 className="text-2xl font-bold text-green-700">
            {registrations.length}
          </h2>
        </div>
      </div>

      {/* Registration Table */}
      <div className="bg-white rounded-xl shadow-sm overflow-x-auto">
        <table className="w-full text-sm min-w-[650px]">
          <thead className="bg-slate-50">
            <tr>
              <th className="p-3 text-left">Pupil</th>
              <th className="p-3 text-left">Class</th>
              <th className="p-3 text-left">Exam</th>
              <th className="p-3 text-left">Subjects</th>
              <th className="p-3 text-left">Status</th>
            </tr>
          </thead>

          <tbody>
            {loading ? (
              <tr>
                <td colSpan="5" className="p-8 text-center text-slate-400">
                  Loading examination data...
                </td>
              </tr>
            ) : registrations.length === 0 ? (
              <tr>
                <td colSpan="5" className="p-8 text-center text-slate-400">
                  No candidates registered yet.
                </td>
              </tr>
            ) : (
              registrations.map((r) => (
                <tr key={r._id} className="border-t hover:bg-slate-50">
                  <td className="p-3">
                    <div className="font-medium">
                      {r.studentId?.fullName || "Unknown"}
                    </div>

                    <div className="text-xs text-slate-400 font-mono">
                      {r.studentId?.admissionNumber || "-"}
                    </div>
                  </td>

                  <td className="p-3">
                    {r.studentId?.className || "-"}
                  </td>

                  <td className="p-3 font-semibold">
                    {r.examType} ({r.examYear})
                  </td>

                  <td
                    className="p-3 text-xs text-slate-600 max-w-xs truncate"
                    title={(r.subjects || []).join(", ")}
                  >
                    {(r.subjects || []).join(", ")}
                  </td>

                  <td className="p-3">
                    <span
                      className={`px-2 py-1 rounded-full text-xs font-medium ${
                        r.status === "registered"
                          ? "bg-green-100 text-green-700"
                          : r.status === "completed"
                          ? "bg-blue-100 text-blue-700"
                          : "bg-amber-100 text-amber-700"
                      }`}
                    >
                      {r.status || "pending"}
                    </span>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Registration Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center p-4 z-50">

          <div className="bg-white rounded-xl p-6 w-full max-w-md max-h-[90vh] overflow-y-auto">

            <h3 className="font-bold text-xl mb-5">
              Register Pupil for {form.examType}
            </h3>

            {/* Student */}
            <label className="block mb-4">
              <span className="text-sm font-medium text-slate-600">
                Select SSS 3 Pupil
              </span>

              <select
                className="mt-2 w-full border rounded-lg p-3"
                value={form.studentId}
                onChange={(e) =>
                  setForm((previous) => ({
                    ...previous,
                    studentId: e.target.value,
                  }))
                }
              >
                <option value="">
                  {students.length === 0
                    ? "No SSS 3 pupils found"
                    : "Select pupil..."}
                </option>

                {students.map((s) => (
                  <option key={s._id} value={s._id}>
                    {s.fullName} ({s.className})
                  </option>
                ))}
              </select>
            </label>

            {/* Fee */}
            <label className="block mb-4">
              <span className="text-sm font-medium text-slate-600">
                Registration Fee (₦)
              </span>

              <input
                type="number"
                min="0"
                className="mt-2 w-full border rounded-lg p-3"
                value={form.totalFee}
                onChange={(e) =>
                  setForm((previous) => ({
                    ...previous,
                    totalFee: Number(e.target.value),
                  }))
                }
              />
            </label>

            {/* Subjects */}
            <div className="mb-5">
              <label className="text-sm font-medium text-slate-600 block mb-2">
                Subjects (Comma Separated)
              </label>

              <textarea
                rows="4"
                className="w-full border rounded-lg p-3 text-sm"
                value={form.subjects.join(", ")}
                onChange={(e) =>
                  setForm((previous) => ({
                    ...previous,
                    subjects: e.target.value.split(","),
                  }))
                }
                placeholder="English Language, Mathematics, Physics..."
              />
            </div>

            {/* Buttons */}
            <div className="flex flex-col-reverse sm:flex-row justify-end gap-3">

              <button
                onClick={() => setShowModal(false)}
                className="px-5 py-3 border rounded-lg"
                disabled={saving}
              >
                Cancel
              </button>

              <button
                onClick={handleRegister}
                disabled={saving || !form.studentId}
                className="bg-blue-700 hover:bg-blue-800 text-white px-5 py-3 rounded-lg disabled:opacity-50"
              >
                {saving ? "Registering..." : "Register Pupil"}
              </button>

            </div>

          </div>
        </div>
      )}

    </div>
  );
}
