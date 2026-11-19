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

  const load = useCallback(async () => {
    setLoading(true);
    setMsg(null);

    const results = await Promise.allSettled([
      studentApi.list({ track: "secondary", limit: 500 }),
      examApi.list({ examType: form.examType, examYear: form.examYear }),
    ]);

    if (results[0].status === "fulfilled") {
      const allStudents = results[0].value.data?.data?.students || [];
      const sss3Students = allStudents.filter((s) =>
        (s.className || "").toUpperCase().includes("SSS 3")
      );
      setStudents(sss3Students);
    }

    if (results[1].status === "fulfilled") {
      const regs = results[1].value.data?.data?.registrations || [];
      setRegistrations(regs);
    }

    setLoading(false);
  }, [form.examType, form.examYear]);

  useEffect(() => {
    load();
  }, [load]);

  const handleRegister = async () => {
    if (!form.studentId) return alert("Select a pupil.");
    
    setSaving(true);
    setMsg(null);
    try {
      await examApi.register(form);
      setMsg({ type: "success", text: "Pupil registered successfully!" });
      setShowModal(false);
      setForm((prev) => ({ ...prev, studentId: "" }));
      await load();
    } catch (error) {
      setMsg({ type: "error", text: error?.response?.data?.message || "Failed to register." });
    } finally {
      setSaving(false);
    }
  };

  // 👈 NEW: Handle Status Update
  const handleStatusChange = async (registrationId, newStatus) => {
    try {
      // Optimistically update the UI
      setRegistrations((prev) => 
        prev.map((r) => r._id === registrationId ? { ...r, status: newStatus } : r)
      );
      // Save to backend
      await examApi.update(registrationId, { status: newStatus });
    } catch (err) {
      alert("Failed to update status");
      load(); // Revert if it fails
    }
  };

  const exportToCSV = () => {
    if (!registrations.length) return alert("No registrations to export.");

    const headers = ["Name", "Admission No", "Gender", "Exam Type", "Exam Year", "Subjects", "Status"];
    const escapeCSV = (val) => `"${String(val ?? "").replace(/"/g, '""')}"`;
    const rows = registrations.map((r) => [
      r.studentId?.fullName,
      r.studentId?.admissionNumber,
      r.studentId?.gender,
      r.examType,
      r.examYear,
      (r.subjects || []).join(" | "),
      r.status,
    ]);

    const csvContent = [headers, ...rows].map((row) => row.map(escapeCSV).join(",")).join("\n");
    const blob = new Blob(["\uFEFF" + csvContent], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `${form.examType}_${form.examYear}_Candidates.csv`;
    link.click();
  };

  return (
    <div className="p-4 sm:p-6 max-w-6xl mx-auto">
      <div className="flex flex-col sm:flex-row justify-between gap-4 items-start mb-6">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold text-slate-800">Exam Registration</h1>
          <p className="text-sm sm:text-base text-slate-500 mt-1">Register SSS 3 pupils for WAEC, NECO, or NABTEB</p>
        </div>
        <button
          onClick={() => setShowModal(true)}
          className="bg-blue-700 hover:bg-blue-800 text-white px-5 py-3 rounded-lg w-full sm:w-auto font-medium"
        >
          + Register Pupil
        </button>
      </div>

      {msg && (
        <div className={`p-4 rounded-lg mb-5 text-sm break-words ${msg.type === "success" ? "bg-green-50 text-green-700" : "bg-red-50 text-red-700"}`}>
          {msg.text}
        </div>
      )}

      <div className="bg-white p-4 rounded-xl shadow-sm mb-6 flex flex-wrap gap-3">
        <select className="border rounded-lg p-3 flex-1 min-w-[120px]" value={form.examType} onChange={(e) => setForm({ ...form, examType: e.target.value })}>
          <option value="WAEC">WAEC</option>
          <option value="NECO">NECO</option>
          <option value="NABTEB">NABTEB</option>
        </select>
        <input type="number" className="border rounded-lg p-3 w-full sm:w-32" value={form.examYear} onChange={(e) => setForm({ ...form, examYear: e.target.value })} />
        <button onClick={exportToCSV} disabled={registrations.length === 0} className="bg-green-600 hover:bg-green-700 text-white px-4 py-3 rounded-lg w-full sm:w-auto disabled:opacity-50 font-medium">
          <i className="fas fa-file-excel mr-2"></i> Export Candidates
        </button>
      </div>

      <div className="bg-white rounded-xl shadow-sm overflow-x-auto">
        <table className="w-full text-sm min-w-[700px]">
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
              <tr><td colSpan="5" className="p-8 text-center text-slate-400">Loading...</td></tr>
            ) : registrations.length === 0 ? (
              <tr><td colSpan="5" className="p-8 text-center text-slate-400">No candidates registered yet.</td></tr>
            ) : (
              registrations.map((r) => (
                <tr key={r._id} className="border-t hover:bg-slate-50">
                  <td className="p-3">
                    <div className="font-medium">{r.studentId?.fullName || "Unknown"}</div>
                    <div className="text-xs text-slate-400 font-mono">{r.studentId?.admissionNumber || "-"}</div>
                  </td>
                  <td className="p-3">{r.studentId?.className || "-"}</td>
                  <td className="p-3 font-semibold">{r.examType} ({r.examYear})</td>
                  <td className="p-3 text-xs text-slate-600 max-w-xs truncate" title={(r.subjects || []).join(", ")}>
                    {(r.subjects || []).join(", ")}
                  </td>
                  <td className="p-3">
                    {/* 👈 NEW: Status Dropdown */}
                    <select 
                      className={`px-2 py-1.5 rounded-lg text-xs font-medium border-0 cursor-pointer focus:ring-2 focus:ring-blue-500 ${
                        r.status === "registered" ? "bg-green-100 text-green-700" :
                        r.status === "completed" ? "bg-blue-100 text-blue-700" :
                        "bg-amber-100 text-amber-700"
                      }`}
                      value={r.status}
                      onChange={(e) => handleStatusChange(r._id, e.target.value)}
                    >
                      <option value="pending">Pending</option>
                      <option value="registered">Registered</option>
                      <option value="completed">Completed</option>
                    </select>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {showModal && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-xl p-6 w-full max-w-md max-h-[90vh] overflow-y-auto">
            <h3 className="font-bold text-xl mb-5">Register Pupil for {form.examType}</h3>
            
            <label className="block mb-4">
              <span className="text-sm font-medium text-slate-600">Select SSS 3 Pupil</span>
              <select className="mt-2 w-full border rounded-lg p-3" value={form.studentId} onChange={(e) => setForm({ ...form, studentId: e.target.value })}>
                <option value="">{students.length === 0 ? "No SSS 3 pupils found" : "Select pupil..."}</option>
                {students.map((s) => (
                  <option key={s._id} value={s._id}>{s.fullName} ({s.className})</option>
                ))}
              </select>
            </label>

            <label className="block mb-4">
              <span className="text-sm font-medium text-slate-600">Registration Fee (₦)</span>
              <input type="number" min="0" className="mt-2 w-full border rounded-lg p-3" value={form.totalFee} onChange={(e) => setForm({ ...form, totalFee: Number(e.target.value) })} />
            </label>

            <div className="mb-5">
              <label className="text-sm font-medium text-slate-600 block mb-2">Subjects (Comma Separated)</label>
              <textarea rows="4" className="w-full border rounded-lg p-3 text-sm" value={form.subjects.join(", ")} onChange={(e) => setForm({ ...form, subjects: e.target.value.split(",") })} placeholder="English Language, Mathematics, Physics..." />
            </div>

            <div className="flex flex-col-reverse sm:flex-row justify-end gap-3">
              <button onClick={() => setShowModal(false)} className="px-5 py-3 border rounded-lg" disabled={saving}>Cancel</button>
              <button onClick={handleRegister} disabled={saving || !form.studentId} className="bg-blue-700 hover:bg-blue-800 text-white px-5 py-3 rounded-lg disabled:opacity-50">
                {saving ? "Registering..." : "Register Pupil"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
