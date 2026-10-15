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
          {
