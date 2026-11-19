
import { useEffect, useState } from "react";
import { studentApi } from "../../services/studentApi";
import { examApi } from "../../services/examApi";
import { useAuth } from "../../context/AuthContext";

export default function ExamRegistration() {
  const { activeTrack } = useAuth();

  const [students, setStudents] = useState([]);
  const [registrations, setRegistrations] = useState([]);
  const [showModal, setShowModal] = useState(false);
  const [loading, setLoading] = useState(true);

  const [form, setForm] = useState({
    studentId: "",
    examType: "WAEC",
    examYear: "2026",
    subjects: ["English Language", "Mathematics"],
    totalFee: 25000,
  });

  const [saving, setSaving] = useState(false);
  const [msg, setMsg] = useState(null);

  // Load Secondary students and filter SSS 3
  const load = () => {
    setLoading(true);

    Promise.all([
      studentApi.list({ track: "secondary", limit: 200 }),
      examApi.list({
        examType: form.examType,
        examYear: form.examYear,
      }),
    ])
      .then(([sRes, eRes]) => {
        const allStudents = sRes.data.data.students || [];

        const sss3Students = allStudents.filter((s) =>
          (s.className || "").toUpperCase().includes("SSS 3")
        );

        setStudents(sss3Students);
        setRegistrations(
          eRes.data.data.registrations || []
        );
      })
      .catch((err) => {
        console.error("Failed to load exam registration data:", err);
        setMsg({
          type: "error",
          text: err.response?.data?.message || "Failed to load data.",
        });
      })
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    load();
  }, [form.examType, form.examYear]);

  // Register pupil
  const handleRegister = async () => {
    if (!form.studentId) {
      return alert("Select a pupil");
    }

    if (form.subjects.filter(Boolean).length === 0) {
      return alert("Enter at least one subject");
    }

    setSaving(true);
    setMsg(null);

    try {
      await examApi.register({
        ...form,
        subjects: form.subjects.filter(Boolean),
      });

      setMsg({
        type: "success",
        text: "Pupil registered successfully!",
      });

      setShowModal(false);

      setForm({
        ...form,
        studentId: "",
        subjects: ["English Language", "Mathematics"],
      });

      load();
    } catch (err) {
      setMsg({
        type: "error",
        text:
          err.response?.data?.message ||
          "Failed to register pupil.",
      });
    } finally {
      setSaving(false);
    }
  };

  // Export candidates to CSV
  const exportToCSV = () => {
    if (registrations.length === 0) {
      return alert("No registrations to export");
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

    const rows = registrations.map((r) => [
      r.studentId?.fullName,
      r.studentId?.admissionNumber,
      r.studentId?.gender,
      r.examType,
      r.examYear,
      (r.subjects || []).join(" | "),
      r.status,
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
    link.click();

    URL.revokeObjectURL(url);
  };

  return (
    <div className="p-6 max-w-6xl mx-auto">

      {/* Header */}
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-2xl font-bold text-slate-800">
            Exam Registration
          </h1>

          <p className="text-sm text-slate-500">
            Register SSS 3 pupils for WAEC, NECO, or NABTEB
          </p>
        </div>

        <button
          onClick={() => setShowModal(true)}
          className="bg-blue-700 text-white px-4 py-2 rounded-lg"
        >
          + Register Pupil
        </button>
      </div>

      {/* Messages */}
      {msg && (
        <div
          className={`p-3 rounded-lg mb-4 text-sm ${
            msg.type === "success"
              ? "bg-green-50 text-green-700"
              : "bg-red-50 text-red-700"
          }`}
        >
          {msg.text}
        </div>
      )}

      {/* Filters */}
      <div className="bg-white p-4 rounded-xl shadow-sm mb-6 flex gap-3 flex-wrap">

        <select
          className="border rounded-lg p-2"
          value={form.examType}
          onChange={(e) =>
            setForm({ ...form, examType: e.target.value })
          }
        >
          <option value="WAEC">WAEC</option>
          <option value="NECO">NECO</option>
          <option value="NABTEB">NABTEB</option>
        </select>

        <input
          type="number"
          className="border rounded-lg p-2 w-32"
          value={form.examYear}
          onChange={(e) =>
            setForm({ ...form, examYear: e.target.value })
          }
        />

        <button
          onClick={exportToCSV}
          className="ml-auto bg-green-600 text-white px-4 py-2 rounded-lg text-sm"
        >
          <i className="fas fa-file-excel"></i> Export Candidates
        </button>
      </div>

      {/* Registration Table */}
      <div className="bg-white rounded-xl shadow-sm overflow-x-auto">
        <table className="w-full text-sm">
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
                <td colSpan="5" className="p-6 text-center text-slate-400">
                  Loading…
                </td>
              </tr>
            ) : registrations.length === 0 ? (
              <tr>
                <td colSpan="5" className="p-6 text-center text-slate-400">
                  No candidates registered yet.
                </td>
              </tr>
            ) : (
              registrations.map((r) => (
                <tr key={r._id} className="border-t">
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
                    {r.examType}
                    <span className="text-xs font-normal">
                      {" "}({r.examYear})
                    </span>
                  </td>

                  <td
                    className="p-3 text-xs text-slate-600 max-w-xs truncate"
                    title={(r.subjects || []).join(", ")}
                  >
                    {(r.subjects || []).join(", ")}
                  </td>

                  <td className="p-3">
                    <span
                      className={`px-2 py-0.5 rounded-full text-xs font-medium ${
                        r.status === "registered"
                          ? "bg-green-100 text-green-700"
                          : "bg-amber-100 text-amber-700"
                      }`}
                    >
                      {r.status}
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

            <h3 className="font-bold text-lg mb-4">
              Register Pupil for {form.examType}
            </h3>

            <label className="block mb-3">
              <span className="text-sm text-slate-600">
                Select SSS 3 Pupil
              </span>

              <select
                className="mt-1 w-full border rounded-lg p-2"
                value={form.studentId}
                onChange={(e) =>
                  setForm({ ...form, studentId: e.target.value })
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

            <label className="block mb-3">
              <span className="text-sm text-slate-600">
                Registration Fee (₦)
              </span>

              <input
                type="number"
                min="0"
                className="mt-1 w-full border rounded-lg p-2"
                value={form.totalFee}
                onChange={(e) =>
                  setForm({
                    ...form,
                    totalFee: Number(e.target.value),
                  })
                }
              />
            </label>

            <div className="mb-4">
              <span className="text-sm text-slate-600 block mb-2">
                Subjects (Comma Separated)
              </span>

              <textarea
                rows="3"
                className="w-full border rounded-lg p-2 text-sm"
                value={form.subjects.join(", ")}
                onChange={(e) =>
                  setForm({
                    ...form,
                    subjects: e.target.value
                      .split(",")
                      .map((s) => s.trim()),
                  })
                }
              />
            </div>

            <div className="flex justify-end gap-2">
              <button
                onClick={() => setShowModal(false)}
                className="px-4 py-2 border rounded-lg"
                disabled={saving}
              >
                Cancel
              </button>

              <button
                onClick={handleRegister}
                disabled={saving || !form.studentId}
                className="bg-blue-700 text-white px-4 py-2 rounded-lg disabled:opacity-50"
              >
                {saving ? "Saving…" : "Register Pupil"}
              </button>
            </div>

          </div>
        </div>
      )}
    </div>
  );
}
